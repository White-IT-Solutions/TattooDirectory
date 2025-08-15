# =============================================================================
# STORAGE MODULE
# =============================================================================
# This module contains storage resources:
# - S3 buckets
# - DynamoDB tables
# - CloudFront distribution

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  # S3 bucket configurations
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
        }
      ]
    }
    config = {
      description     = "AWS Config bucket"
      is_replicated   = var.context.enable_cross_region_replication
      logging_prefix  = "config-access-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "config_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 2555 : 90
          }
        }
      ]
    }
    cloudtrail = {
      description     = "CloudTrail logs bucket"
      is_replicated   = var.context.enable_cross_region_replication
      logging_prefix  = "cloudtrail-access-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "cloudtrail_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 3650 : 90
          }
        }
      ]
    }
    access_logs = {
      description     = "CloudFront and other access logs"
      is_replicated   = var.context.enable_cross_region_replication
      logging_prefix  = "access-logs-self-logs/"
      force_destroy   = var.context.environment == "dev" ? true : false
      lifecycle_rules = [
        {
          id     = "access_logs_lifecycle"
          status = "Enabled"
          expiration = {
            days = var.context.environment == "prod" ? 90 : 30
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
# S3 BUCKETS
# =============================================================================

# Main S3 buckets
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
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# S3 bucket logging
resource "aws_s3_bucket_logging" "main" {
  for_each = { for k, v in local.s3_buckets : k => v if k != "access_logs" }

  bucket = aws_s3_bucket.main[each.key].id

  target_bucket = aws_s3_bucket.main["access_logs"].id
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

  attribute {
    name = "expiry"
    type = "N"
  }

  ttl {
    attribute_name = "expiration"
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

# =============================================================================
# CLOUDFRONT DISTRIBUTION
# =============================================================================

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.context.name_prefix}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Response Headers Policy for Security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.context.name_prefix}-security-headers"
  comment = "Adds security headers like HSTS, CSP, and X-Frame-Options"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }
  }
}

# Data sources for managed CloudFront policies
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

resource "aws_cloudfront_distribution" "frontend" {
  # checkov:skip=CKV2_AWS_47: Added exploit patch RuleSet.
  # CloudFront access logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.main["access_logs"].bucket_domain_name
    prefix          = "cloudfront-access-logs/"
  }

  origin {
    domain_name              = aws_s3_bucket.main["frontend"].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.main["frontend"].bucket}-primary"
  }

  origin {
    domain_name              = aws_s3_bucket.main["frontend_backup"].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.main["frontend_backup"].bucket}-backup"
  }

  origin {
    domain_name = replace(var.api_gateway_endpoint, "https://", "")
    origin_id   = "APIGW-${var.api_gateway_id}"
    origin_path = "/${var.context.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin_group {
    origin_id = "S3-origin-group"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3-${aws_s3_bucket.main["frontend"].bucket}-primary"
    }

    member {
      origin_id = "S3-${aws_s3_bucket.main["frontend_backup"].bucket}-backup"
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = var.waf_web_acl_arn

  aliases = var.context.domain_name != "" ? [var.context.domain_name, "www.${var.context.domain_name}"] : []

  default_cache_behavior {
    allowed_methods                = ["GET", "HEAD", "OPTIONS"]
    cached_methods                 = ["GET", "HEAD"]
    target_origin_id               = "S3-origin-group"
    compress                       = true
    viewer_protocol_policy         = "redirect-to-https"
    response_headers_policy_id     = aws_cloudfront_response_headers_policy.security_headers.id
    cache_policy_id                = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id       = data.aws_cloudfront_origin_request_policy.cors_s3_origin.id
  }

  # API Gateway cache behavior
  ordered_cache_behavior {
    path_pattern           = "/v1/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "APIGW-${var.api_gateway_id}"
    viewer_protocol_policy = "redirect-to-https"
    
    # Use managed policies for API caching and request forwarding
    cache_policy_id                = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id       = data.aws_cloudfront_origin_request_policy.all_viewer.id
    response_headers_policy_id     = aws_cloudfront_response_headers_policy.security_headers.id
  }

  

  # Custom error responses for SPA
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = var.context.environment == "prod" ? "PriceClass_All" : "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.context.allowed_countries
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.context.domain_name == ""
    acm_certificate_arn            = var.context.domain_name != "" ? var.cloudfront_certificate_arn : null
    ssl_support_method             = var.context.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.context.domain_name != "" ? "TLSv1.2_2021" : null
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-frontend-distribution"
  })
}

# S3 bucket policies for CloudFront (frontend and backup)
resource "aws_s3_bucket_policy" "frontend_policies" {
  for_each = {
    primary = aws_s3_bucket.main["frontend"].id,
    backup  = aws_s3_bucket.main["frontend_backup"].id
  }

  bucket = each.value

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "arn:aws:s3:::${each.value}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          "arn:aws:s3:::${each.value}",
          "arn:aws:s3:::${each.value}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

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
        Resource  = aws_s3_bucket.main["config"].arn
        Condition = { StringEquals = { "AWS:SourceAccount" = var.context.account_id } }
      },
      {
        Sid       = "AWSConfigBucketExistenceCheck"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.main["config"].arn
        Condition = { StringEquals = { "AWS:SourceAccount" = var.context.account_id } }
      },
      {
        Sid       = "AWSConfigBucketDelivery"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.main["config"].arn}/*"
        Condition = { 
          StringEquals = { 
            "s3:x-amz-acl" = "bucket-owner-full-control",
            "AWS:SourceAccount" = var.context.account_id 
          } 
        }
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
        Resource  = aws_s3_bucket.main["cloudtrail"].arn
        Condition = { StringEquals = { "AWS:SourceAccount" = var.context.account_id } }
      },
      {
        Sid       = "AWSCloudTrailWrite"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.main["cloudtrail"].arn}/AWSLogs/${var.context.account_id}/*"
        Condition = { 
          StringEquals = { 
            "s3:x-amz-acl" = "bucket-owner-full-control",
            "AWS:SourceAccount" = var.context.account_id 
          } 
        }
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
          StringEquals = { "aws:SourceAccount" = var.context.account_id }
        }
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