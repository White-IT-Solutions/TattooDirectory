# =============================================================================
# GOVERNANCE MODULE
# =============================================================================
# This module contains governance and compliance resources:
# - AWS Config rules and remediation
# - CloudTrail with cross-region replication
# - Compliance dashboards and reporting

# =============================================================================
# SNS TOPICS FOR NOTIFICATIONS
# =============================================================================

# SNS Topic for Config notifications
resource "aws_sns_topic" "config_notifications" {
  count = var.enable_config ? 1 : 0

  name              = "${var.context.name_prefix}-config-notifications"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-notifications"
  })
}

# SNS Topic for CloudTrail notifications
resource "aws_sns_topic" "cloudtrail_notifications" {
  name              = "${var.context.name_prefix}-cloudtrail-notifications"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-notifications"
  })
}

# =============================================================================
# AWS CONFIG
# =============================================================================

# Configuration recorder
resource "aws_config_configuration_recorder" "main" {
  count = var.enable_config ? 1 : 0

  name     = "${var.context.name_prefix}-config-recorder"
  role_arn = var.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# Delivery channel
resource "aws_config_delivery_channel" "main" {
  count = var.enable_config ? 1 : 0

  name           = "${var.context.name_prefix}-config-delivery-channel"
  s3_bucket_name = var.config_bucket_name

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# =============================================================================
# AWS CONFIG RULES
# =============================================================================

# S3 bucket public access prohibited
resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-s3-bucket-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# DynamoDB encryption enabled
resource "aws_config_config_rule" "dynamodb_table_encryption_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-dynamodb-table-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Lambda function concurrent execution limit
resource "aws_config_config_rule" "lambda_concurrency_check" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-lambda-concurrency-check"

  source {
    owner             = "AWS"
    source_identifier = "LAMBDA_CONCURRENCY_CHECK"
  }

  input_parameters = jsonencode({
    ConcurrencyLimitLow  = 1
    ConcurrencyLimitHigh = 100
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# API Gateway execution logging enabled
resource "aws_config_config_rule" "api_gw_execution_logging_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-api-gw-execution-logging-enabled"

  source {
    owner             = "AWS"
    source_identifier = "API_GW_EXECUTION_LOGGING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# =============================================================================
# CONFIG REMEDIATION CONFIGURATIONS
# =============================================================================

resource "aws_config_remediation_configuration" "s3_bucket_public_access_prohibited" {
  count = var.enable_config && var.enable_config_remediation ? 1 : 0

  config_rule_name = aws_config_config_rule.s3_bucket_public_access_prohibited[0].name

  resource_type    = "AWS::S3::Bucket"
  target_type      = "SSM_DOCUMENT"
  target_id        = "AWSConfigRemediation-RemoveS3BucketPublicAccess"
  target_version   = "1"

  parameter {
    name           = "AutomationAssumeRole"
    static_value   = var.config_remediation_role_arn
  }

  parameter {
    name                = "S3BucketName"
    resource_value      = "RESOURCE_ID"
  }

  automatic                = false
  maximum_automatic_attempts = 3
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

# CloudTrail S3 bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.context.name_prefix}-cloudtrail-${var.random_suffix}"

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_main_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 bucket policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.context.aws_region}:${var.context.account_id}:trail/${var.context.name_prefix}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.context.aws_region}:${var.context.account_id}:trail/${var.context.name_prefix}-cloudtrail"
          }
        }
      }
    ]
  })
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.context.name_prefix}"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-logs"
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.context.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${var.frontend_bucket_arn}/*"]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = var.dynamodb_table_arns
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = var.cloudtrail_role_arn

  enable_logging                = true
  enable_log_file_validation    = true
  include_global_service_events = true
  is_multi_region_trail         = true
  sns_topic_name                = aws_sns_topic.cloudtrail_notifications.name
  is_organization_trail         = false

  kms_key_id = var.kms_key_main_arn

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail"
  })
}

# =============================================================================
# CLOUDWATCH METRIC FILTERS FOR SECURITY MONITORING
# =============================================================================

resource "aws_cloudwatch_log_metric_filter" "security_alerts" {
  name           = "${var.context.name_prefix}-security-alerts"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") || ($.sourceIPAddress != \"AWS Internal\") }"

  metric_transformation {
    name      = "SecurityAlerts"
    namespace = "${var.context.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "security_alerts" {
  alarm_name          = "${var.context.name_prefix}-security-alerts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "SecurityAlerts"
  namespace           = "${var.context.project_name}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors security-related events in CloudTrail"
  alarm_actions       = var.security_notification_topic_arn != "" ? [var.security_notification_topic_arn] : []

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-security-alerts"
  })
}

# =============================================================================
# COMPLIANCE DASHBOARD
# =============================================================================

resource "aws_cloudwatch_dashboard" "compliance" {
  count = var.enable_config ? 1 : 0

  dashboard_name = "${var.context.name_prefix}-compliance"

  dashboard_body = templatefile("${path.module}/compliance_dashboard.json.tftpl", {
    region       = var.context.aws_region
    project_name = var.context.project_name
  })
}