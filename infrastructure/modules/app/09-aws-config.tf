# AWS Config for compliance monitoring and governance

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket        = "${var.project_name}-aws-config-${random_id.config_bucket_suffix.hex}"
  force_destroy = var.environment == "dev" ? true : false

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}}-config-bucket"
    DataClassification = "Internal"
  })
}

resource "random_id" "config_bucket_suffix" {
  byte_length = 4
}

# Block public access to Config bucket
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Config bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Config bucket versioning
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Config bucket lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    id     = "config_lifecycle"
    status = "Enabled"

    expiration {
      days = var.environment == "prod" ? 2555 : 90 # 7 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.config]
}

# S3 bucket logging for audit trail
resource "aws_s3_bucket_logging" "config" {
  bucket = aws_s3_bucket.config.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "config-access-logs/"
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = var.environment == "prod" ? "TwentyFour_Hours" : "TwentyFour_Hours"
  }
}

# Enable Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# SNS Topic for Config notifications
resource "aws_sns_topic" "config_notifications" {
  name              = "${local.name_prefix}}-config-notifications"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-notifications"
  })
}

resource "aws_sns_topic_subscription" "config_email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.config_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Config Rules for Security and Compliance

# 1. S3 Bucket Security Rules
resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
  name = "${local.name_prefix}}-s3-bucket-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-public-access-rule"
  })
}

resource "aws_config_config_rule" "s3_bucket_ssl_requests_only" {
  name = "${local.name_prefix}}-s3-bucket-ssl-requests-only"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SSL_REQUESTS_ONLY"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-ssl-only-rule"
  })
}

resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  name = "${local.name_prefix}}-s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-encryption-rule"
  })
}

# 2. DynamoDB Security Rules
resource "aws_config_config_rule" "dynamodb_table_encryption_enabled" {
  name = "${local.name_prefix}}-dynamodb-table-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-encryption-rule"
  })
}

resource "aws_config_config_rule" "dynamodb_pitr_enabled" {
  name = "${local.name_prefix}}-dynamodb-pitr-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_PITR_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-pitr-rule"
  })
}

# 3. Lambda Security Rules
resource "aws_config_config_rule" "lambda_function_public_access_prohibited" {
  name = "${local.name_prefix}}-lambda-function-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-public-access-rule"
  })
}

resource "aws_config_config_rule" "lambda_inside_vpc" {
  name = "${local.name_prefix}}-lambda-inside-vpc"

  source {
    owner             = "AWS"
    source_identifier = "LAMBDA_INSIDE_VPC"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-vpc-rule"
  })
}

# 4. CloudFront Security Rules
resource "aws_config_config_rule" "cloudfront_origin_access_identity_enabled" {
  name = "${local.name_prefix}}-cloudfront-origin-access-identity-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDFRONT_ORIGIN_ACCESS_IDENTITY_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudfront-oai-rule"
  })
}

resource "aws_config_config_rule" "cloudfront_viewer_policy_https" {
  name = "${local.name_prefix}}-cloudfront-viewer-policy-https"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDFRONT_VIEWER_POLICY_HTTPS"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudfront-https-rule"
  })
}

# 5. VPC Security Rules
resource "aws_config_config_rule" "vpc_default_security_group_closed" {
  name = "${local.name_prefix}}-vpc-default-security-group-closed"

  source {
    owner             = "AWS"
    source_identifier = "VPC_DEFAULT_SECURITY_GROUP_CLOSED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-default-sg-rule"
  })
}

resource "aws_config_config_rule" "vpc_flow_logs_enabled" {
  name = "${local.name_prefix}}-vpc-flow-logs-enabled"

  source {
    owner             = "AWS"
    source_identifier = "VPC_FLOW_LOGS_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-logs-rule"
  })
}

# 6. IAM Security Rules
resource "aws_config_config_rule" "iam_policy_no_statements_with_admin_access" {
  name = "${local.name_prefix}}-iam-policy-no-statements-with-admin-access"

  source {
    owner             = "AWS"
    source_identifier = "IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-iam-no-admin-rule"
  })
}

resource "aws_config_config_rule" "iam_user_no_policies_check" {
  name = "${local.name_prefix}}-iam-user-no-policies-check"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_NO_POLICIES_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-iam-user-no-policies-rule"
  })
}

# 7. KMS Security Rules
resource "aws_config_config_rule" "kms_cmk_not_scheduled_for_deletion" {
  name = "${local.name_prefix}}-kms-cmk-not-scheduled-for-deletion"

  source {
    owner             = "AWS"
    source_identifier = "KMS_CMK_NOT_SCHEDULED_FOR_DELETION"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-kms-not-deleted-rule"
  })
}

# 8. API Gateway Security Rules
resource "aws_config_config_rule" "api_gw_execution_logging_enabled" {
  name = "${local.name_prefix}}-api-gw-execution-logging-enabled"

  source {
    owner             = "AWS"
    source_identifier = "API_GW_EXECUTION_LOGGING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-api-gw-logging-rule"
  })
}

# Config Remediation Configuration (for critical rules)
resource "aws_config_remediation_configuration" "s3_bucket_public_access" {
  count = local.config.enable_config_remediation ? 1 : 0

  config_rule_name = aws_config_config_rule.s3_bucket_public_access_prohibited.name

  resource_type    = "AWS::S3::Bucket"
  target_type      = "SSM_DOCUMENT"
  target_id        = "AWSConfigRemediation-RemoveS3BucketPublicAccess"
  target_version   = "1"
  automatic        = false
  maximum_automatic_attempts = 3

  parameter {
    name           = "AutomationAssumeRole"
    static_value   = aws_iam_role.config_remediation[0].arn
  }

  parameter {
    name             = "BucketName"
    resource_value   = "RESOURCE_ID"
  }
}

# CloudWatch Dashboard for Config Compliance
resource "aws_cloudwatch_dashboard" "config_compliance" {
  dashboard_name = "${local.name_prefix}}-config-compliance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Config", "ComplianceByConfigRule", "ConfigRuleName", aws_config_config_rule.s3_bucket_public_access_prohibited.name],
            [".", ".", ".", aws_config_config_rule.dynamodb_table_encryption_enabled.name],
            [".", ".", ".", aws_config_config_rule.lambda_function_public_access_prohibited.name],
            [".", ".", ".", aws_config_config_rule.cloudfront_viewer_policy_https.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Config Rule Compliance Status"
          period  = 300
        }
      }
    ]
  })
}