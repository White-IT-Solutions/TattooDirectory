# =============================================================================
# AUDIT FOUNDATION MODULE
# =============================================================================
# This module contains foundational resources for the Audit Account:
# - KMS key for encrypting audit logs and backups
# - Basic data sources

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account and region info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# =============================================================================
# KMS KEY FOR AUDIT ACCOUNT
# =============================================================================

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
              var.context.account_id,
              var.context.security_account_id,
              var.context.audit_account_id
            ]
          }
        }
      },
      {
        Sid    = "Allow Cross-Account Access from Infrastructure Account"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.account_id}:root"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Cross-Account Access from Security Account"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.security_account_id}:root"
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