# =============================================================================
# LOG STORAGE MODULE
# =============================================================================
# This module contains audit and log storage resources for the Audit Account:
# - Config S3 bucket
# - CloudTrail S3 bucket  
# - Access logs S3 bucket
# - VPC Flow Logs S3 bucket

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  # S3 bucket configurations for audit and log buckets
  s3_buckets = {
    config = {
      description    = "AWS Config bucket"
      is_replicated  = var.context.enable_cross_region_replication
      logging_prefix = "config-access-logs/"
      force_destroy  = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "config_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 2555 : 90
          }
          noncurrent_version_expiration = {
            noncurrent_days = 30
          }
          transition = [
            {
              days          = 90
              storage_class = "STANDARD_IA"
            },
            {
              days          = 365
              storage_class = "GLACIER"
            }
          ]
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    cloudtrail = {
      description    = "CloudTrail logs bucket"
      is_replicated  = var.context.enable_cross_region_replication
      logging_prefix = "cloudtrail-access-logs/"
      force_destroy  = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "cloudtrail_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 3650 : 90
          }
          noncurrent_version_expiration = {
            noncurrent_days = 30
          }
          transition = [
            {
              days          = 90
              storage_class = "STANDARD_IA"
            },
            {
              days          = 365
              storage_class = "GLACIER"
            }
          ]
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    access_logs = {
      description    = "CloudFront and other access logs"
      is_replicated  = var.context.enable_cross_region_replication
      logging_prefix = "access-logs-self-logs/"
      force_destroy  = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "access_logs_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 90 : 30
          }
          noncurrent_version_expiration = {
            noncurrent_days = 14
          }
          transition = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            }
          ]
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    vpc_flow_logs = {
      description    = "VPC Flow Logs bucket"
      is_replicated  = var.context.enable_cross_region_replication
      logging_prefix = "vpc-flow-logs-access-logs/"
      force_destroy  = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "vpc_flow_logs_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 365 : 30
          }
          noncurrent_version_expiration = {
            noncurrent_days = 14
          }
          transition = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            }
          ]
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
    waf_logs = {
      description    = "WAF logs bucket"
      is_replicated  = var.context.enable_cross_region_replication
      logging_prefix = "waf-logs-access-logs/"
      force_destroy  = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "waf_logs_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 365 : 30
          }
          noncurrent_version_expiration = {
            noncurrent_days = 14
          }
          transition = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            }
          ]
          abort_incomplete_multipart_upload = {
            days_after_initiation = 7
          }
        }
      ]
    }
  }
}

# =============================================================================
# KMS KEYS
# =============================================================================

# This policy allows the Log Archive account root to manage the key,
# and gives the S3 replication role (from the Infra account) the
# necessary permissions to decrypt data from source buckets encrypted with this key.
data "aws_iam_policy_document" "log_archive_key" {
  statement {
    sid = "EnableIAMUserPermissions"
    actions = [
      "kms:*",
    ]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.context.log_archive_account_id}:root"]
    }
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.context.enable_cross_region_replication && var.s3_replication_role_arn != null ? [1] : []
    content {
      sid    = "AllowS3ReplicationRoleToDecrypt"
      effect = "Allow"
      actions = [
        "kms:Decrypt",
      ]
      principals {
        type        = "AWS"
        identifiers = [var.s3_replication_role_arn]
      }
      resources = ["*"]
    }
  }

  statement {
    sid    = "AllowAuditAccountKmsUsage"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.context.audit_account_id}:root"]
    }
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalTag/iam.amazonaws.com/role-purpose"
      values   = ["log-auditing"]
    }
  }
}

resource "aws_kms_key" "log_archive" {
  description             = "KMS key for encrypting resources in the Log Archive account"
  policy                  = data.aws_iam_policy_document.log_archive_key.json
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-log-archive-key"
  })
}

resource "aws_kms_alias" "log_archive" {
  name          = "alias/${var.context.name_prefix}-log-archive-key"
  target_key_id = aws_kms_key.log_archive.id
}

# =============================================================================
# S3 BUCKETS - AUDIT AND LOG BUCKETS
# =============================================================================

# Main S3 buckets for audit and logs
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

# S3 bucket encryption - use Audit Account KMS key
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.log_archive.arn
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

      dynamic "transition" {
        for_each = lookup(rule.value, "transition", [])
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
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

# S3 bucket logging - config, cloudtrail, and vpc_flow_logs buckets log to access_logs bucket
resource "aws_s3_bucket_logging" "main" {
  for_each = { for k, v in local.s3_buckets : k => v if k != "access_logs" }

  bucket = aws_s3_bucket.main[each.key].id

  target_bucket = aws_s3_bucket.main["access_logs"].id
  target_prefix = each.value.logging_prefix
}

# =============================================================================
# S3 BUCKET POLICIES
# =============================================================================

# S3 bucket policy for AWS Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.main["config"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSConfigBucketPermissionsCheck"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.main["config"].arn,
        Condition = { StringEquals = { "AWS:SourceAccount" = [var.context.infra_account_id, var.context.audit_account_id] } }
      },
      {
        Sid       = "AWSConfigBucketExistenceCheck"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.main["config"].arn,
        Condition = { StringEquals = { "AWS:SourceAccount" = [var.context.infra_account_id, var.context.audit_account_id] } }
      },
      {
        Sid       = "AWSConfigBucketDelivery"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.main["config"].arn}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control",
            "AWS:SourceAccount" = [var.context.infra_account_id, var.context.audit_account_id]
          }
        }
      },
      {
        Sid       = "AllowAuditAccountReadAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.context.audit_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.main["config"].arn,
          "${aws_s3_bucket.main["config"].arn}/*"
        ]
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main["config"].arn,
          "${aws_s3_bucket.main["config"].arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.main["cloudtrail"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSCloudTrailAclCheck"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.main["cloudtrail"].arn,
        Condition = { StringEquals = { "AWS:SourceAccount" = [var.context.infra_account_id, var.context.audit_account_id] } }
      },
      {
        Sid       = "AWSCloudTrailWriteAuditAccount"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.main["cloudtrail"].arn}/AWSLogs/${var.context.audit_account_id}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control",
            "AWS:SourceAccount" = var.context.audit_account_id
          }
        }
      },
      {
        Sid       = "AWSCloudTrailWriteInfrastructureAccount"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.main["cloudtrail"].arn}/AWSLogs/${var.context.infra_account_id}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control",
            "AWS:SourceAccount" = var.context.infra_account_id
          }
        }
      },
      {
        Sid       = "AllowAuditAccountReadAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.context.audit_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.main["cloudtrail"].arn,
          "${aws_s3_bucket.main["cloudtrail"].arn}/*"
        ]
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main["cloudtrail"].arn,
          "${aws_s3_bucket.main["cloudtrail"].arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}

# S3 bucket policy for the access logs bucket
resource "aws_s3_bucket_policy" "access_logs" {
  bucket = aws_s3_bucket.main["access_logs"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3LogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.main["access_logs"].arn}/*"
        Condition = {
          StringEquals = { "aws:SourceAccount" = [var.context.audit_account_id, var.context.infra_account_id] }
        }
      },
      {
        Sid    = "AllowCloudFrontLogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.main["access_logs"].arn}/*"
        Condition = {
          StringEquals = { "aws:SourceAccount" = var.context.infra_account_id }
        }
      },
      {
        Sid       = "AllowAuditAccountReadAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.context.audit_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.main["access_logs"].arn,
          "${aws_s3_bucket.main["access_logs"].arn}/*"
        ]
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main["access_logs"].arn,
          "${aws_s3_bucket.main["access_logs"].arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}

# S3 bucket policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "vpc_flow_logs" {
  bucket = aws_s3_bucket.main["vpc_flow_logs"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCFlowLogsDelivery"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.main["vpc_flow_logs"].arn}/*"
        Condition = {
          StringEquals = { "aws:SourceAccount" = var.context.infra_account_id }
        }
      },
      {
        Sid    = "AllowVPCFlowLogsBucketCheck"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.main["vpc_flow_logs"].arn
        Condition = {
          StringEquals = { "aws:SourceAccount" = var.context.infra_account_id }
        }
      },
      {
        Sid       = "AllowAuditAccountReadAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.context.audit_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.main["vpc_flow_logs"].arn,
          "${aws_s3_bucket.main["vpc_flow_logs"].arn}/*"
        ]
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main["vpc_flow_logs"].arn,
          "${aws_s3_bucket.main["vpc_flow_logs"].arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}

# S3 bucket policy for WAF Logs via Kinesis Firehose
resource "aws_s3_bucket_policy" "waf_logs" {
  bucket = aws_s3_bucket.main["waf_logs"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowKinesisFirehoseDelivery"
        Effect = "Allow"
        Principal = {
          # The Firehose role will be in the Security account
          AWS = "arn:aws:iam::${var.context.audit_account_id}:root"
        }
        Action = ["s3:AbortMultipartUpload", "s3:GetBucketLocation", "s3:GetObject", "s3:ListBucket", "s3:ListBucketMultipartUploads", "s3:PutObject"]
        Resource = [
          aws_s3_bucket.main["waf_logs"].arn,
          "${aws_s3_bucket.main["waf_logs"].arn}/*"
        ],
        Condition = {
          # Restrict to the Firehose role created in the Security account
          StringEquals = { "aws:SourceAccount" = var.context.audit_account_id }
        }
      },
      {
        Sid       = "AllowAuditAccountReadAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.context.audit_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.main["waf_logs"].arn,
          "${aws_s3_bucket.main["waf_logs"].arn}/*"
        ]
      }
    ]
  })
}

# =============================================================================
# S3 REPLICATION (Production Only)
# =============================================================================

# --- Replica Key for Cross-Region Replication ---

# This policy allows the S3 replication role to encrypt data in the replica region.
data "aws_iam_policy_document" "log_archive_key_replica" {
  count = var.context.enable_cross_region_replication ? 1 : 0

  statement {
    sid = "EnableIAMUserPermissions"
    actions = [
      "kms:*",
    ]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.context.log_archive_account_id}:root"]
    }
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.context.enable_cross_region_replication && var.s3_replication_role_arn != null ? [1] : []
    content {
      sid    = "AllowS3ReplicationRoleToEncrypt"
      effect = "Allow"
      actions = [
        "kms:Encrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey",
      ]
      principals {
        type        = "AWS"
        identifiers = [var.s3_replication_role_arn]
      }
      resources = ["*"]
    }
  }
}

resource "aws_kms_key" "log_archive_replica" {
  provider = aws.replica
  count    = var.context.enable_cross_region_replication ? 1 : 0

  description             = "KMS replica key for encrypting resources in the Log Archive account"
  policy                  = data.aws_iam_policy_document.log_archive_key_replica[0].json
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-log-archive-key-replica"
  })
}

resource "aws_kms_alias" "log_archive_replica" {
  provider = aws.replica
  count    = var.context.enable_cross_region_replication ? 1 : 0

  name          = "alias/${var.context.name_prefix}-log-archive-key"
  target_key_id = aws_kms_key.log_archive_replica[0].id
}

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
      kms_master_key_id = var.context.enable_cross_region_replication ? aws_kms_key.log_archive_replica[0].arn : null
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
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
        replica_kms_key_id = aws_kms_key.log_archive_replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}