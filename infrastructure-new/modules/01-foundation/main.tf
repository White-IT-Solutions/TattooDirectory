# =============================================================================
# FOUNDATION MODULE
# =============================================================================
# This module contains foundational resources that other modules depend on:
# - KMS keys for encryption
# - Random IDs and passwords
# - Common data sources

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account and region info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# RANDOM RESOURCES
# =============================================================================

# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# Random password for OpenSearch master user
resource "random_password" "opensearch_master" {
  length  = 16
  special = true
}

# Random password for application secrets
resource "random_password" "app_secrets" {
  length  = 32
  special = true
}

# =============================================================================
# KMS KEYS
# =============================================================================

# Main KMS key for general encryption
resource "aws_kms_key" "main" {
  description             = "Main KMS key for ${var.context.name_prefix}"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-main-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.context.name_prefix}-main"
  target_key_id = aws_kms_key.main.key_id
}

# Logs KMS key for CloudWatch logs encryption
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch logs encryption"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.context.aws_region}:${var.context.account_id}:*"
          }
        }
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

# Replica KMS key for cross-region replication (only in prod)
resource "aws_kms_key" "replica" {
  count = var.context.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  description             = "Replica KMS key for ${var.context.name_prefix}"
  deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-replica-key"
  })
}

resource "aws_kms_alias" "replica" {
  count = var.context.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  name          = "alias/${var.context.name_prefix}-replica"
  target_key_id = aws_kms_key.replica[0].key_id
}

# =============================================================================
# CODE SIGNING CONFIGURATION
# =============================================================================

# Signer Signing Profile for Lambda functions (production only)
resource "aws_signer_signing_profile" "lambda" {
  count       = var.context.environment == "prod" ? 1 : 0
  platform_id = "AWSLambda-SHA384-ECDSA"
  name        = "${var.context.name_prefix}-lambda-signing-profile"

  signature_validity_period {
    value = 5
    type  = "YEARS"
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-signing-profile"
  })
}

# Code Signing Config for Lambda functions (production only)
resource "aws_lambda_code_signing_config" "main" {
  count = var.context.environment == "prod" ? 1 : 0

  allowed_publishers {
    signing_profile_version_arns = [aws_signer_signing_profile.lambda[0].arn]
  }

  policies {
    untrusted_artifact_on_deployment = "Warn"
  }

  description = "Code signing config for ${var.context.name_prefix} Lambda functions"

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-code-signing-config"
  })
}