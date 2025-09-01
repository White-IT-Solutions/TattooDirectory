# =============================================================================
# APP STORAGE MODULE
# =============================================================================
# This module contains application storage resources for the Infrastructure Account:
# - Frontend S3 buckets
# - DynamoDB tables
# - CloudFront distribution

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  # S3 bucket configurations for application buckets only
  s3_buckets = {
    frontend = {
      description     = "Frontend static assets"
      is_replicated   = var.context.enable_cross_region_replication
      logging_prefix  = "frontend-access-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "delete_old_versions"
          status = "Enabled"
          noncurrent_version_expiration = {
            noncurrent_days = 30
          }
          expiration = {
            days = var.context.environment == "prod" ? 2555 : 90
          }
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    frontend_backup = {
      description     = "Frontend backup static assets"
      is_replicated   = var.context.enable_cross_region_replication
      logging_prefix  = "frontend-backup-access-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "delete_old_versions"
          status = "Enabled"
          noncurrent_version_expiration = {
            noncurrent_days = 30
          }
          expiration = {
            days = var.context.environment == "prod" ? 2555 : 90
          }
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    lambda_artifacts = {
      description     = "Lambda deployment packages"
      is_replicated   = false # Lambda packages are part of the deployment pipeline, no need to replicate
      logging_prefix  = "lambda-artifacts-access-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "cleanup_old_lambda_versions"
          status = "Enabled"
          noncurrent_version_expiration = {
            noncurrent_days = 30
          }
          # Expire old deployment packages to save costs
          expiration = {
            days = var.context.environment == "prod" ? 365 : 90
          }
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
  }
}

# =============================================================================
# SNS TOPIC FOR S3 EVENTS
# =============================================================================

resource "aws_sns_topic" "s3_events" {
  name              = "${var.context.name_prefix}-s3-events"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-s3-events"
  })
}

resource "aws_sns_topic_policy" "s3_events" {
  arn = aws_sns_topic.s3_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.s3_events.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = [for k, v in local.s3_buckets : "arn:aws:s3:::${var.context.name_prefix}-${k}-${var.random_suffix}"]
          }
        }
      }
    ]
  })
}

# =============================================================================
# S3 BUCKETS - APPLICATION BUCKETS
# =============================================================================

# Main S3 buckets for application
resource "aws_s3_bucket" "main" {
  for_each = local.s3_buckets

  bucket        = "${var.context.name_prefix}-${each.key}-${var.random_suffix}"
  force_destroy = lookup(each.value, "force_destroy", false)

  tags = merge(var.context.common_tags, {
    Name        = "${var.context.name_prefix}-${each.key}"
    Description = each.value.description
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_main_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = { for k, v in local.s3_buckets : k => v if length(v.lifecycle_rules) > 0 }

  bucket = aws_s3_bucket.main[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.status

      filter {
        prefix = ""
      }

      dynamic "expiration" {
        for_each = lookup(rule.value, "expiration", null) != null ? [rule.value.expiration] : []
        content {
          days = expiration.value.days
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = lookup(rule.value, "noncurrent_version_expiration", null) != null ? [rule.value.noncurrent_version_expiration] : []
        content {
          noncurrent_days = noncurrent_version_expiration.value.noncurrent_days
        }
      }

      dynamic "abort_incomplete_multipart_upload" {
        for_each = lookup(rule.value, "abort_incomplete_multipart_upload", null) != null ? [rule.value.abort_incomplete_multipart_upload] : []
        content {
          days_after_initiation = abort_incomplete_multipart_upload.value.days_after_initiation
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# S3 bucket logging - logs go to the access_logs bucket in Security Account
resource "aws_s3_bucket_logging" "main" {
  for_each = local.s3_buckets

  bucket = aws_s3_bucket.main[each.key].id

  target_bucket = var.access_logs_bucket_id
  target_prefix = each.value.logging_prefix
}

# S3 bucket notifications
resource "aws_s3_bucket_notification" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  topic {
    id        = "s3-${each.key}-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events]
}

# =============================================================================
# DYNAMODB TABLES
# =============================================================================

# Main application table
resource "aws_dynamodb_table" "main" {
  name           = "${var.context.name_prefix}-main"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_main_arn
  }

  point_in_time_recovery {
    enabled = var.context.environment == "prod"
  }

  deletion_protection_enabled = var.enable_deletion_protection

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-main-table"
  })
}

# Denylist table
resource "aws_dynamodb_table" "denylist" {
  name         = "${var.context.name_prefix}-denylist"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_main_arn
  }

  point_in_time_recovery {
    enabled = var.context.environment == "prod"
  }

  deletion_protection_enabled = var.enable_deletion_protection

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-denylist-table"
  })
}

# Idempotency table
resource "aws_dynamodb_table" "idempotency" {
  name         = "${var.context.name_prefix}-idempotency"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "expiry"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_main_arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = var.enable_deletion_protection

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-idempotency-table"
  })
}

# Data source to construct the S3 bucket policy for CloudFront access.
# Using a data source improves readability and helps prevent JSON syntax errors.
data "aws_iam_policy_document" "frontend_bucket_policy" {
  for_each = {
    frontend        = aws_s3_bucket.main["frontend"].arn
    frontend_backup = aws_s3_bucket.main["frontend_backup"].arn
  }

  statement {
    sid = "AllowCloudFrontServicePrincipal"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${each.value}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      # This condition is intentionally broad, allowing any CloudFront distribution in the account.
      # A more specific ARN cannot be used here due to a circular dependency between the 'app-storage'
      # and 'delivery' modules. The primary security control is the CloudFront Origin Access Control (OAC),
      # which is configured in the 'delivery' module. This policy serves as a defense-in-depth measure.
      values = ["arn:aws:cloudfront::${var.context.infra_account_id}:distribution/*"]
    }
  }

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [
      each.value,
      "${each.value}/*",
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# S3 bucket policies for CloudFront (frontend and backup)
resource "aws_s3_bucket_policy" "frontend_policies" {
  for_each = {
    frontend        = aws_s3_bucket.main["frontend"].id
    frontend_backup = aws_s3_bucket.main["frontend_backup"].id
  }

  bucket = each.value
  policy = data.aws_iam_policy_document.frontend_bucket_policy[each.key].json
}

# =============================================================================
# S3 REPLICATION (Production Only)
# =============================================================================

# Replica S3 buckets (production only)
resource "aws_s3_bucket" "replica" {
  for_each = { 
    for k, v in local.s3_buckets : k => v 
    if v.is_replicated && var.context.enable_cross_region_replication 
  }

  provider = aws.replica

  bucket        = "${var.context.name_prefix}-${each.key}-replica-${var.random_suffix}"
  force_destroy = lookup(each.value, "force_destroy", false)

  tags = merge(var.context.common_tags, {
    Name        = "${var.context.name_prefix}-${each.key}-replica"
    Description = "${each.value.description} (replica)"
  })
}

# Replica bucket versioning
resource "aws_s3_bucket_versioning" "replica" {
  for_each = aws_s3_bucket.replica
  provider = aws.replica

  bucket = each.value.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Replica bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "replica" {
  for_each = aws_s3_bucket.replica
  provider = aws.replica

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_replica_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Replica bucket public access block
resource "aws_s3_bucket_public_access_block" "replica" {
  for_each = aws_s3_bucket.replica
  provider = aws.replica

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 replication configuration
resource "aws_s3_bucket_replication_configuration" "main" {
  for_each = { 
    for k, v in local.s3_buckets : k => v 
    if v.is_replicated && var.context.enable_cross_region_replication 
  }

  role   = var.s3_replication_role_arn
  bucket = aws_s3_bucket.main[each.key].id

  rule {
    id     = "replicate-${each.key}-to-backup-region"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica[each.key].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = var.kms_key_replica_arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}