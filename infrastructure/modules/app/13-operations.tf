#
# Operational Tooling
# Resources defined here are for operational tasks, like the EIP rotation runbook.
#

data "archive_file" "rotate_eip_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src/lambda/operations/rotate_eip"
  output_path = "${path.module}/dist/rotate_eip.zip"
}

resource "aws_cloudwatch_log_group" "rotate_eip" {
  name              = "/aws/lambda/${local.name_prefix}-rotate-eip"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rotate-eip-logs"
  })
}

resource "aws_lambda_function" "rotate_nat_gateway_eip" {
  # checkov:skip=CKV_AWS_116: Not required due to manual execution
  filename                       = data.archive_file.rotate_eip_zip.output_path
  function_name                  = "${local.name_prefix}-rotate-eip"
  role                           = aws_iam_role.rotate_nat_gateway_eip_role.arn
  handler                        = "index.lambda_handler"
  runtime                        = "python3.12"
  architectures = ["arm64"]    # Switch to Graviton2 for better price/performance
  timeout                        = 60
  code_signing_config_arn        = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null
  source_code_hash               = data.archive_file.rotate_eip_zip.output_base64sha256
  reserved_concurrent_executions = 2

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      NAT_GATEWAY_TAG_VALUE = "${local.name_prefix}-nat-gateway"
      SNS_TOPIC_ARN         = aws_sns_topic.alerts.arn
    }
  }

  # Security: Encrypt environment variables
  kms_key_arn = aws_kms_key.main.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.rotate_nat_gateway_eip_attachment,
    aws_cloudwatch_log_group.rotate_eip,
  ]

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-rotate-eip"
    Purpose = "Operational Runbook"
  })
}
