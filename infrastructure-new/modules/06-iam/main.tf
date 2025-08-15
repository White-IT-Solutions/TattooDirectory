# =============================================================================
# IAM MODULE
# =============================================================================
# This module contains all IAM roles and policies
# It accepts ARNs from other modules as inputs to build proper policies

# =============================================================================
# DATA SOURCES FOR AWS MANAGED POLICIES
# =============================================================================

data "aws_iam_policy" "lambda_basic_execution" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy" "lambda_vpc_access_execution" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy" "xray_daemon_write_access" {
  arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

data "aws_iam_policy" "ecs_task_execution_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy" "config_role" {
  arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

data "aws_iam_policy" "ssm_automation_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonSSMAutomationRole"
}

data "aws_iam_policy" "backup_service_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

data "aws_iam_policy" "api_gateway_push_to_cloudwatch_logs" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# =============================================================================
# LAMBDA ROLES
# =============================================================================

# API Handler Lambda Role
resource "aws_iam_role" "lambda_api" {
  name = "${var.context.name_prefix}-lambda-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-api-role"
  })
}

# API Lambda Policy
resource "aws_iam_policy" "lambda_api" {
  name        = "${var.context.name_prefix}-lambda-api-policy"
  description = "Policy for API handler Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.main_table_arn,
          "${var.main_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
          "es:ESHttpPut"
        ]
        Resource = "${var.opensearch_domain_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.app_secrets_arn
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-api-policy"
  })
}

# Attach policies to API Lambda role
resource "aws_iam_role_policy_attachment" "lambda_api_basic" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_api_vpc" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_api_xray" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_api_custom" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = aws_iam_policy.lambda_api.arn
}

# DynamoDB to OpenSearch Sync Lambda Role
resource "aws_iam_role" "lambda_sync" {
  name = "${var.context.name_prefix}-lambda-sync-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-sync-role"
  })
}

# Sync Lambda Policy
resource "aws_iam_policy" "lambda_sync" {
  name        = "${var.context.name_prefix}-lambda-sync-policy"
  description = "Policy for DynamoDB to OpenSearch sync Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${var.main_table_arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpDelete"
        ]
        Resource = "${var.opensearch_domain_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.app_secrets_arn
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-sync-policy"
  })
}

# Attach policies to Sync Lambda role
resource "aws_iam_role_policy_attachment" "lambda_sync_basic" {
  role       = aws_iam_role.lambda_sync.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sync_vpc" {
  role       = aws_iam_role.lambda_sync.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sync_xray" {
  role       = aws_iam_role.lambda_sync.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sync_custom" {
  role       = aws_iam_role.lambda_sync.name
  policy_arn = aws_iam_policy.lambda_sync.arn
}

# =============================================================================
# WORKFLOW LAMBDA ROLES (for Step Functions)
# =============================================================================

# Discover Studios Lambda Role
resource "aws_iam_role" "lambda_discover_studios" {
  name = "${var.context.name_prefix}-lambda-discover-studios-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-discover-studios-role"
  })
}

# Discover Studios Lambda Policy
resource "aws_iam_policy" "lambda_discover_studios" {
  name        = "${var.context.name_prefix}-lambda-discover-studios-policy"
  description = "Policy for Discover Studios Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.main_table_arn,
          "${var.main_table_arn}/index/*"
        ]
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-discover-studios-policy"
  })
}

# Attach policies to Discover Studios Lambda role
resource "aws_iam_role_policy_attachment" "lambda_discover_studios_basic" {
  role       = aws_iam_role.lambda_discover_studios.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_discover_studios_vpc" {
  role       = aws_iam_role.lambda_discover_studios.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_discover_studios_xray" {
  role       = aws_iam_role.lambda_discover_studios.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_discover_studios_custom" {
  role       = aws_iam_role.lambda_discover_studios.name
  policy_arn = aws_iam_policy.lambda_discover_studios.arn
}

# Find Artists Lambda Role
resource "aws_iam_role" "lambda_find_artists" {
  name = "${var.context.name_prefix}-lambda-find-artists-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-find-artists-role"
  })
}

# Find Artists Lambda Policy
resource "aws_iam_policy" "lambda_find_artists" {
  name        = "${var.context.name_prefix}-lambda-find-artists-policy"
  description = "Policy for Find Artists Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = var.main_table_arn
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-find-artists-policy"
  })
}

# Attach policies to Find Artists Lambda role
resource "aws_iam_role_policy_attachment" "lambda_find_artists_basic" {
  role       = aws_iam_role.lambda_find_artists.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_find_artists_vpc" {
  role       = aws_iam_role.lambda_find_artists.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_find_artists_xray" {
  role       = aws_iam_role.lambda_find_artists.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_find_artists_custom" {
  role       = aws_iam_role.lambda_find_artists.name
  policy_arn = aws_iam_policy.lambda_find_artists.arn
}

# Queue Scraping Lambda Role
resource "aws_iam_role" "lambda_queue_scraping" {
  name = "${var.context.name_prefix}-lambda-queue-scraping-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-queue-scraping-role"
  })
}

# Queue Scraping Lambda Policy
resource "aws_iam_policy" "lambda_queue_scraping" {
  name        = "${var.context.name_prefix}-lambda-queue-scraping-policy"
  description = "Policy for Queue Scraping Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.scraping_queue_arn != "" ? var.scraping_queue_arn : "*"
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-queue-scraping-policy"
  })
}

# Attach policies to Queue Scraping Lambda role
resource "aws_iam_role_policy_attachment" "lambda_queue_scraping_basic" {
  role       = aws_iam_role.lambda_queue_scraping.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_queue_scraping_vpc" {
  role       = aws_iam_role.lambda_queue_scraping.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_queue_scraping_xray" {
  role       = aws_iam_role.lambda_queue_scraping.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_queue_scraping_custom" {
  role       = aws_iam_role.lambda_queue_scraping.name
  policy_arn = aws_iam_policy.lambda_queue_scraping.arn
}

# =============================================================================
# NAT GATEWAY EIP ROTATION LAMBDA ROLE
# =============================================================================

# NAT Gateway EIP Rotation Lambda Role
resource "aws_iam_role" "lambda_rotate_nat_gateway_eip" {
  name = "${var.context.name_prefix}-rotate-nat-eip-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-rotate-nat-eip-role"
  })
}

# NAT Gateway EIP Rotation Lambda Policy
resource "aws_iam_policy" "lambda_rotate_nat_gateway_eip" {
  # checkov:skip=CKV_AWS_290: Is sufficiently restricted.
  # checkov:skip=CKV_AWS_355: AWS does not support resource-level permissions for this action, so a wildcard is necessary.
  name        = "${var.context.name_prefix}-rotate-nat-eip-policy"
  description = "Allows rotating the NAT Gateway EIP and publishing to SNS."

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid    = "DescribeNATGateway"
        Effect = "Allow"
        Action = [
          # This permission is required to find the NAT Gateway by its tags.
          "ec2:DescribeNatGateways"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllocateEIP"
        Effect = "Allow"
        Action = [
          # Allows allocating a new Elastic IP. This action does not support resource-level permissions, as the resource does not exist yet, so a wildcard is required.
          "ec2:AllocateAddress"
        ]
        Resource = "*"
      },
      {
        Sid    = "AssociateEIPWithNATGatewayENI"
        Effect = "Allow"
        Action = [
          "ec2:AssociateAddress"
        ]
        # This is restricted to only the network interface belonging to the correct NAT Gateway.
        # NOTE: This requires the NAT Gateway's network interface to be tagged with `Name = "TAD-MVP-NAT-Gateway"`.
        Resource = "arn:aws:ec2:${var.context.aws_region}:${var.context.account_id}:network-interface/*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Name" = "TAD-MVP-NAT-Gateway"
          }
        }
      },
      {
        Sid      = "PublishSNSNotification"
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = "arn:aws:sns:${var.context.aws_region}:${var.context.account_id}:${var.context.name_prefix}-critical-alerts"
      }
    ]
  })
}

# Attach policies to NAT Gateway EIP Rotation Lambda role
resource "aws_iam_role_policy_attachment" "lambda_rotate_nat_gateway_eip_basic" {
  role       = aws_iam_role.lambda_rotate_nat_gateway_eip.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_rotate_nat_gateway_eip_vpc" {
  role       = aws_iam_role.lambda_rotate_nat_gateway_eip.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_rotate_nat_gateway_eip_xray" {
  role       = aws_iam_role.lambda_rotate_nat_gateway_eip.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_rotate_nat_gateway_eip_custom" {
  role       = aws_iam_role.lambda_rotate_nat_gateway_eip.name
  policy_arn = aws_iam_policy.lambda_rotate_nat_gateway_eip.arn
}

# =============================================================================
# STEP FUNCTIONS ROLE
# =============================================================================

resource "aws_iam_role" "step_functions" {
  name = "${var.context.name_prefix}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-step-functions-role"
  })
}

# Step Functions Policy
resource "aws_iam_policy" "step_functions" {
  name        = "${var.context.name_prefix}-step-functions-policy"
  description = "Policy for Step Functions state machine"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          "${var.lambda_function_arns.discover_studios}:*",
          "${var.lambda_function_arns.find_artists}:*",
          "${var.lambda_function_arns.queue_scraping}:*",
          var.lambda_function_arns.discover_studios,
          var.lambda_function_arns.find_artists,
          var.lambda_function_arns.queue_scraping
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTasks"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-step-functions-policy"
  })
}

# Attach policies to Step Functions role
resource "aws_iam_role_policy_attachment" "step_functions_xray" {
  role       = aws_iam_role.step_functions.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "step_functions_custom" {
  role       = aws_iam_role.step_functions.name
  policy_arn = aws_iam_policy.step_functions.arn
}

# =============================================================================
# ECS ROLES
# =============================================================================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.context.name_prefix}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-ecs-task-execution-role"
  })
}

# Attach ECS Task Execution policy
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.context.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-ecs-task-role"
  })
}

# ECS Task Policy
resource "aws_iam_policy" "ecs_task" {
  name        = "${var.context.name_prefix}-ecs-task-policy"
  description = "Policy for ECS tasks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = var.main_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.scraping_queue_arn != "" ? var.scraping_queue_arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.app_secrets_arn
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-ecs-task-policy"
  })
}

# Attach policies to ECS Task role
resource "aws_iam_role_policy_attachment" "ecs_task_xray" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_custom" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_task.arn
}

# =============================================================================
# BACKUP ROLE (conditional)
# =============================================================================

resource "aws_iam_role" "backup" {
  count = var.backup_enabled ? 1 : 0
  name  = "${var.context.name_prefix}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-role"
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  count      = var.backup_enabled ? 1 : 0
  role       = aws_iam_role.backup[0].name
  policy_arn = data.aws_iam_policy.backup_service_role.arn
}

# =============================================================================
# CONFIG ROLE (conditional)
# =============================================================================

resource "aws_iam_role" "config" {
  count = var.enable_config ? 1 : 0
  name  = "${var.context.name_prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-role"
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  count      = var.enable_config ? 1 : 0
  role       = aws_iam_role.config[0].name
  policy_arn = data.aws_iam_policy.config_role.arn
}

# Config S3 delivery policy
resource "aws_iam_policy" "config_s3_delivery" {
  count       = var.enable_config ? 1 : 0
  name        = "${var.context.name_prefix}-config-s3-delivery-policy"
  description = "Policy for AWS Config to deliver configuration snapshots to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:GetBucketLocation"
        ]
        Resource = var.config_bucket_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${var.config_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-s3-delivery-policy"
  })
}

resource "aws_iam_role_policy_attachment" "config_s3_delivery" {
  count      = var.enable_config ? 1 : 0
  role       = aws_iam_role.config[0].name
  policy_arn = aws_iam_policy.config_s3_delivery[0].arn
}

# =============================================================================
# S3 REPLICATION ROLE (Production Only)
# =============================================================================

# IAM Role for S3 replication (production only)
resource "aws_iam_role" "s3_replication" {
  count = var.context.enable_cross_region_replication ? 1 : 0
  name  = "${var.context.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-s3-replication-role"
  })
}

# IAM Policy for S3 replication (production only)
resource "aws_iam_policy" "s3_replication" {
  count = var.context.enable_cross_region_replication ? 1 : 0
  name  = "${var.context.name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = var.s3_replication_source_bucket_arns
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [for arn in var.s3_replication_source_bucket_arns : replace(arn, "/*", "")]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = var.s3_replication_destination_bucket_arns
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [var.kms_key_replica_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey"
        ]
        Resource = [var.kms_key_replica_arn]
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-s3-replication-policy"
  })
}

# IAM Policy attachment for S3 replication (production only)
resource "aws_iam_role_policy_attachment" "s3_replication" {
  count      = var.context.enable_cross_region_replication ? 1 : 0
  role       = aws_iam_role.s3_replication[0].name
  policy_arn = aws_iam_policy.s3_replication[0].arn
}