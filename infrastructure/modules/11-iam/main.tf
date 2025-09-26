# =============================================================================
# IAM MODULE - INFRASTRUCTURE ACCOUNT ROLES
# =============================================================================
# This module creates all necessary IAM roles within the Infrastructure Account.
# It includes cross-account trust policies that allow services from the Security
# Account to assume certain roles (Config, Backup) for centralized management.
# 
# All application roles (Lambda, ECS, Step Functions) remain in this account
# for direct access to Infrastructure Account resources.

# =============================================================================
# DATA SOURCES FOR AWS MANAGED POLICIES
# =============================================================================

data "aws_iam_policy" "lambda_basic_execution" {
  name = "AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy" "lambda_vpc_access_execution" {
  name = "AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy" "xray_daemon_write_access" {
  name = "AWSXRayDaemonWriteAccess"
}

data "aws_iam_policy" "ecs_task_execution_role" {
  name = "AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy" "config_role_policy" {
  name = "AWS_ConfigRole"
}

data "aws_iam_policy" "ssm_automation_role" {
  name = "AmazonSSMAutomationRole"
}

data "aws_iam_policy" "backup_service_role" {
  name = "AWSBackupServiceRolePolicyForBackup"
}

data "aws_iam_policy" "api_gateway_push_to_cloudwatch_logs" {
  name = "AmazonAPIGatewayPushToCloudWatchLogs"
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
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.context.aws_region}:${var.context.infra_account_id}:secret:${var.context.name_prefix}-app-secrets*"
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
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.context.aws_region}:${var.context.infra_account_id}:secret:${var.context.name_prefix}-app-secrets*"
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
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DescribeResources"
        Effect = "Allow"
        Action = [
          # Required to find the NAT Gateway by its tags and the associated EIP.
          "ec2:DescribeNatGateways",
          "ec2:DescribeAddresses"
        ]
        Resource = "*"
      },
      {
        Sid    = "ManageEIPAllocation"
        Effect = "Allow"
        Action = [
          "ec2:AllocateAddress",
          # Required to release the old EIP. Resource-level permissions are not practical here
          # as the specific EIP allocation ID is dynamic.
          "ec2:ReleaseAddress"
        ]
        Resource = "*",
        # Enforce that any new EIP allocated by this role is tagged correctly.
        Condition = {
          StringEquals = {
            "aws:RequestTag/Project" = var.context.project_name
          }
        }
      },
      {
        Sid    = "ManageEIPAssociation"
        Effect = "Allow"
        Action = [
          "ec2:AssociateAddress",
          # Required to detach the old EIP from the NAT Gateway's network interface.
          "ec2:DisassociateAddress"
        ]
        # This is restricted to only the network interface belonging to the correct NAT Gateway. The Lambda
        # identifies the NAT Gateway by a 'Name' tag with a specific prefix.
        Resource = "arn:aws:ec2:${var.context.aws_region}:${var.context.infra_account_id}:network-interface/*"
        Condition = {
          # The Lambda script identifies the NAT gateway by a name tag that starts with the prefix.
          # Using StringLike ensures the policy matches this logic.
          StringLike = {
            "ec2:ResourceTag/Name" = "${var.context.name_prefix}-nat-*"
          }
        }
      },
      {
        Sid    = "PublishSNSNotification"
        Effect = "Allow"
        Action = "sns:Publish"
        # The SNS topic is created in the app-monitoring module, but its ARN is predictable.
        # This avoids a circular dependency.
        Resource = "arn:aws:sns:${var.context.aws_region}:${var.context.infra_account_id}:${var.context.name_prefix}-critical-alerts"
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
# SECRET ROTATION LAMBDA ROLE
# =============================================================================

# Secret Rotation Lambda Role
resource "aws_iam_role" "lambda_secret_rotation" {
  name = "${var.context.name_prefix}-secret-rotation-role"

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
    Name = "${var.context.name_prefix}-secret-rotation-role"
  })
}

# Attach policies to Secret Rotation Lambda role
resource "aws_iam_role_policy_attachment" "lambda_secret_rotation_basic" {
  role       = aws_iam_role.lambda_secret_rotation.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_secret_rotation_vpc" {
  role       = aws_iam_role.lambda_secret_rotation.name
  policy_arn = data.aws_iam_policy.lambda_vpc_access_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_secret_rotation_xray" {
  role       = aws_iam_role.lambda_secret_rotation.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
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

# Attach policies to Step Functions role
resource "aws_iam_role_policy_attachment" "step_functions_xray" {
  role       = aws_iam_role.step_functions.name
  policy_arn = data.aws_iam_policy.xray_daemon_write_access.arn
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
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.context.aws_region}:${var.context.infra_account_id}:secret:${var.context.name_prefix}-app-secrets*"
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
      },
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.audit_account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.context.name_prefix}-backup-cross-account"
          }
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
      },
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.audit_account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.context.name_prefix}-config-cross-account"
          }
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
  policy_arn = data.aws_iam_policy.config_role_policy.arn
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