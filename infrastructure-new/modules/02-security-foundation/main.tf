# =============================================================================
# SECURITY FOUNDATION MODULE
# =============================================================================
# This module contains foundational resources that are deployed into the
# Security account, such as the KMS key for centralized logging.

# Logs KMS key for CloudWatch logs encryption
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch logs encryption in the Security account"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          # This allows the Security account root to manage the key
          AWS = "arn:aws:iam::${var.context.security_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs within Security Account"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.context.aws_region}:${var.context.security_account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow Cross-Account Use from Infrastructure Account"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.account_id}:root"
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