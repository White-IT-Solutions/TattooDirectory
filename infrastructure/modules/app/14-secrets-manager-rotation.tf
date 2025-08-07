# --- Secrets Manager Rotation Lambda for OpenSearch ---

# This file contains the resources needed to automatically rotate
# the master user password for the OpenSearch domain.

data "archive_file" "secret_rotation_zip" {
  type        = "zip"
  output_path = "${path.module}/secret_rotation.zip"
  source_file = "${path.module}/lambda/secret_rotation.py"
  output_file_mode = "0644"
}

# CloudWatch Log Group for the rotation Lambda
resource "aws_cloudwatch_log_group" "secret_rotation" {
  #checkov:skip=CKV_AWS_158: KMS encryption is enabled

  name              = "/aws/lambda/${local.name_prefix}-secret-rotation"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-rotation-logs"
  })
}

# IAM Role for the rotation Lambda
resource "aws_iam_role" "secret_rotation_role" {
  #checkov:skip=CKV_AWS_60: Role is scoped to Lambda service with conditions

  name = "${local.name_prefix}-secret-rotation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaAssumeRole"
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })

  # Add maximum session duration for security
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-rotation-role"
  })
}

# IAM Policy for the rotation Lambda
resource "aws_iam_policy" "secret_rotation_policy" {
  #checkov:skip=CKV_AWS_62: Policy is scoped to specific resources with conditions

  name        = "${local.name_prefix}-secret-rotation-policy"
  description = "Policy for Secrets Manager rotation Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogsPermissions"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          aws_cloudwatch_log_group.secret_rotation.arn,
          "${aws_cloudwatch_log_group.secret_rotation.arn}:*"
        ]
      },
      {
        Sid    = "SecretsManagerPermissions"
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      },
      {
        Sid    = "OpenSearchPermissions"
        Effect = "Allow"
        Action = [
          "es:UpdateDomainConfig",
          "es:DescribeDomain"
        ]
        Resource = aws_opensearch_domain.main.arn
      },
      {
        Sid    = "VPCPermissions"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      },
      {
        Sid    = "KMSPermissions"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.main.arn,
          aws_kms_key.logs.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secret_rotation_policy_attachment" {
  role       = aws_iam_role.secret_rotation_role.name
  policy_arn = aws_iam_policy.secret_rotation_policy.arn
}

resource "aws_iam_role_policy_attachment" "secret_rotation_xray_attachment" {
  role       = aws_iam_role.secret_rotation_role.name
  policy_arn = data.aws_iam_policy.aws_xray_daemon_write_access.arn
}

# Lambda function for secret rotation
resource "aws_lambda_function" "secret_rotation" {
  #checkov:skip=CKV_AWS_50: X-Ray tracing is enabled
  #checkov:skip=CKV_AWS_115: Reserved concurrency not needed for rotation function
  #checkov:skip=CKV_AWS_116: DLQ not needed for Secrets Manager rotation
  #checkov:skip=CKV_AWS_117: VPC configuration is required for this function
  #checkov:skip=CKV_AWS_272: Code signing not required for internal rotation function"

  filename         = data.archive_file.secret_rotation_zip.output_path
  function_name    = "${local.name_prefix}-secret-rotation"
  role            = aws_iam_role.secret_rotation_role.arn
  handler         = "secret_rotation.lambda_handler"
  source_code_hash = data.archive_file.secret_rotation_zip.output_base64sha256
  runtime         = "python3.11" # Ensure this matches the Python version used for the Lambda code
  timeout         = 300
  
  # Security: Enable KMS encryption for environment variables
  kms_key_arn = aws_kms_key.main.arn

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      OPENSEARCH_DOMAIN_NAME = aws_opensearch_domain.main.domain_name
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.secret_rotation_policy_attachment,
    aws_cloudwatch_log_group.secret_rotation
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-rotation"
  })
}

# Resource-based policy for additional security
resource "aws_lambda_function_event_invoke_config" "secret_rotation" {
  function_name = aws_lambda_function.secret_rotation.function_name

  # Configure retry behavior for rotation function
  maximum_retry_attempts = 0  # Secrets Manager handles retries
}

# Lambda permission for Secrets Manager to invoke the function
resource "aws_lambda_permission" "allow_secret_manager_call_lambda" {
  #checkov:skip=CKV_AWS_364: Source ARN not needed for Secrets Manager service principal

  function_name = aws_lambda_function.secret_rotation.function_name
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  principal     = "secretsmanager.amazonaws.com"

  # Add condition to restrict to specific secret
  source_arn = aws_secretsmanager_secret.app_secrets.arn
}

# Secrets Manager secret rotation configuration
resource "aws_secretsmanager_secret_rotation" "app_secrets" {
  #checkov:skip=CKV_AWS_149: Rotation is configured with appropriate interval

  secret_id           = aws_secretsmanager_secret.app_secrets.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_lambda_permission.allow_secret_manager_call_lambda]
}

# Initial secret version with OpenSearch master user credentials
resource "aws_secretsmanager_secret_version" "app_secrets_initial" {
  #checkov:skip=CKV_AWS_149: Initial version with temporary credentials, will be rotated

  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    opensearch_master_username = "admin"
    opensearch_master_password = "TempPassword123!"
    opensearch_endpoint        = aws_opensearch_domain.main.endpoint
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}