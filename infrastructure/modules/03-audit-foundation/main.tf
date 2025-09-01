# =============================================================================
# AUDIT FOUNDATION MODULE
# =============================================================================
# This module contains foundational resources for the Audit Account:
# - KMS key for encrypting CloudWatch Logs
# - KMS key for encrypting other audit resources (e.g., S3, Backups)
# - Basic data sources

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account and region info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Logs KMS key for CloudWatch logs encryption
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch logs encryption in the Audit account"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          # This allows the Audit account root to manage the key
          AWS = "arn:aws:iam::${var.context.audit_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs within Audit Account"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.context.aws_region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.context.aws_region}:${var.context.audit_account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow Cross-Account Use from Infrastructure Account"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.infra_account_id}:root"
        }
        Action   = ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-logs-key"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${var.context.name_prefix}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# Audit KMS key for encrypting all S3 buckets and Backup vaults in Audit account
resource "aws_kms_key" "audit" {
  description             = "Audit KMS key for ${var.context.name_prefix} - encrypts logs and backups"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.audit_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Services from Infrastructure Account"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "cloudtrail.amazonaws.com",
            "config.amazonaws.com",
            "backup.amazonaws.com",
            "vpc-flow-logs.amazonaws.com"
          ]
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
          StringEquals = {
            "aws:SourceAccount" = [
              var.context.infra_account_id,
              var.context.audit_account_id
            ]
          }
        }
      },
      {
        Sid    = "Allow Cross-Account Access from Infrastructure Account"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.infra_account_id}:root"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-audit-key"
  })
}

resource "aws_kms_alias" "audit" {
  name          = "alias/${var.context.name_prefix}-audit"
  target_key_id = aws_kms_key.audit.key_id
}