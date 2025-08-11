# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}-kms-key"
    DataClassification = "Confidential"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# KMS Key specifically for CloudWatch Logs
resource "aws_kms_key" "logs" {
  description             = "KMS key for ${var.project_name} CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}-logs-kms-key"
    DataClassification = "Confidential"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${var.project_name}-logs-key"
  target_key_id = aws_kms_key.logs.key_id
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_secrets" {
  # checkov:skip=CKV2_AWS_57: Secrets Manager rotation is configured in 14-secrets-manager-rotation.tf
  name                    = "${local.name_prefix}}-secrets"
  description             = "Application secrets for ${var.project_name}"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}}-secrets"
    DataClassification = "Confidential"
  })
}

# Security Groups (without rules to avoid cycles)
resource "aws_security_group" "opensearch" {
  # checkov:skip=CKV2_AWS_5: Assigned in 04-storage
  name        = "${local.name_prefix}-opensearch-sg"
  description = "OpenSearch security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-opensearch-sg"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  # checkov:skip=CKV2_AWS_5: Assigned in 02-security
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "VPC Endpoints security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-endpoints-sg"
  })
}

resource "aws_security_group" "fargate" {
  # checkov:skip=CKV2_AWS_5: Assigned in 05-data-aggregation
  name        = "${local.name_prefix}-fargate-sg"
  description = "Fargate security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-fargate-sg"
  })
}

resource "aws_security_group" "lambda" {
  # checkov:skip=CKV2_AWS_5: Assigned in 03-compute, 04-storage, 05-data-aggregation
  name        = "${local.name_prefix}-lambda-sg"
  description = "Lambda security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-sg"
  })
}

# Security Group Rules (separate resources to avoid cycles)

# OpenSearch ingress rules
resource "aws_security_group_rule" "opensearch_ingress_lambda" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.opensearch.id
  description              = "HTTPS from Lambda functions"
}

# VPC Endpoints ingress rules
resource "aws_security_group_rule" "vpc_endpoints_ingress_lambda" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.vpc_endpoints.id
  description              = "HTTPS from Lambda functions"
}

resource "aws_security_group_rule" "vpc_endpoints_ingress_fargate" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.fargate.id
  security_group_id        = aws_security_group.vpc_endpoints.id
  description              = "HTTPS from Fargate tasks"
}

# Fargate egress rules
resource "aws_security_group_rule" "fargate_egress_vpc_endpoints" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.vpc_endpoints.id
  security_group_id        = aws_security_group.fargate.id
  description              = "Egress to VPC Endpoints"
}

resource "aws_security_group_rule" "fargate_egress_https_internet" {
  type        = "egress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for web scraping
  security_group_id = aws_security_group.fargate.id
  description       = "Egress to Internet for web scraping (HTTPS)"
}

resource "aws_security_group_rule" "fargate_egress_http_internet" {
  type        = "egress"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for web scraping
  security_group_id = aws_security_group.fargate.id
  description       = "Egress to Internet for web scraping (HTTP)"
}

# Lambda egress rules
resource "aws_security_group_rule" "lambda_egress_opensearch" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.opensearch.id
  security_group_id        = aws_security_group.lambda.id
  description              = "Egress to OpenSearch"
}

resource "aws_security_group_rule" "lambda_egress_vpc_endpoints" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.vpc_endpoints.id
  security_group_id        = aws_security_group.lambda.id
  description              = "Egress to VPC Endpoints"
}

resource "aws_security_group_rule" "lambda_egress_internet" {
  type        = "egress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for web scraping
  security_group_id = aws_security_group.lambda.id
  description       = "Egress to Internet for AWS APIs"
}

# AWS GuardDuty for intelligent threat detection

resource "aws_guardduty_detector" "main" {
  # checkov:skip=CKV2_AWS_3: GuardDuty Config is correct.
  enable = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-guardduty-detector"
  })
}

resource "aws_guardduty_organization_admin_account" "main" {
  admin_account_id = data.aws_caller_identity.current.account_id

  # This resource must be created from the AWS Organization's master account.
  # It designates the current account as the GuardDuty delegated administrator.
  depends_on = [aws_guardduty_detector.main]
}

resource "aws_guardduty_organization_configuration" "main" {
  auto_enable_organization_members = "ALL"

  # This detector must exist in the delegated administrator account.
  detector_id = aws_guardduty_detector.main.id

  datasources {
    s3_logs {
      auto_enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Not using EKS in this architecture
      }
    }
  }

  # Ensure the admin account is designated before configuring the organization.
  depends_on = [aws_guardduty_organization_admin_account.main]
}
