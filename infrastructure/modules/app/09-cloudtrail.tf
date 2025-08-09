# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

# ----------------------------------------------------------------------------------------------------------------------
# S3 Bucket for CloudTrail Logs Replica (for DR)
# ----------------------------------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "cloudtrail_replica" {
  # checkov:skip=CKV_AWS_145: Encryption set
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = "${var.project_name}-cloudtrail-logs-${var.replica_aws_region}-${random_id.bucket_suffix.hex}"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-cloudtrail-logs-replica"
    }
  )
}

resource "aws_s3_bucket_versioning" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica[0].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail replica bucket lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  rule {
    id     = "cloudtrail_replica_lifecycle"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.environment == "prod" ? 3650 : 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# CloudTrail replica bucket logging
resource "aws_s3_bucket_logging" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  target_bucket = aws_s3_bucket.access_logs_replica[0].id
  target_prefix = "cloudtrail-replica-access-logs/"
}

# CloudTrail replica bucket notification
resource "aws_s3_bucket_notification" "cloudtrail_replica" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  bucket = aws_s3_bucket.cloudtrail_replica[0].id

  topic {
    id        = "s3-cloudtrail-replica-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}




# CloudTrail bucket lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id = "cloudtrail_lifecycle"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    # Transition objects to a cheaper storage tier after 30 days.
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.environment == "prod" ? 3650 : 90 # 10 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket notification configuration for security monitoring
resource "aws_s3_bucket_notification" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  topic {
    id = "s3-object-created-notifications"

    topic_arn = aws_sns_topic.s3_events.arn

    events = ["s3:ObjectCreated:*"]
  }
  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSCloudTrailAclCheck"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.cloudtrail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid       = "AWSCloudTrailWrite"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# SNS Topic for CloudTrail notifications
resource "aws_sns_topic" "cloudtrail_notifications" {
  name              = "${local.name_prefix}}-cloudtrail-notifications"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudtrail-notifications"
  })
}

# SNS Topic Policy to allow CloudTrail to publish
resource "aws_sns_topic_policy" "cloudtrail_notifications" {
  arn    = aws_sns_topic.cloudtrail_notifications.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailSNSPolicy"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.cloudtrail_notifications.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "cloudtrail_email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudtrail_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Log Group for CloudTrail is defined in 06-observability.tf

# AWS CloudTrail
resource "aws_cloudtrail" "main" {
  # checkov:skip=CKV2_AWS_10: Configuration is correct.
  name                          = "${local.name_prefix}}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "AWSLogs"
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn
  sns_topic_name                = aws_sns_topic.cloudtrail_notifications.name
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_to_cloudwatch.arn

  # Enable CloudTrail Insights for the production environment
  dynamic "insight_selector" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      insight_type = "ApiCallRateInsight"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudtrail"
  })

  depends_on = [
    aws_sns_topic_policy.cloudtrail_notifications,
    aws_iam_role_policy.cloudtrail_to_cloudwatch
  ]
}

# S3 bucket logging for audit trail
resource "aws_s3_bucket_logging" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "cloudtrail-access-logs/"
}

# --- CloudTrail Alarms ---

# Metric Filter and Alarm for IAM Policy Changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${local.name_prefix}}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${local.name_prefix}}-iam-policy-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = aws_cloudwatch_log_metric_filter.iam_policy_changes.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.iam_policy_changes.metric_transformation[0].namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm for IAM policy changes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# Cross-region replication for CloudTrail bucket (production only)
resource "aws_s3_bucket_replication_configuration" "cloudtrail" {
  count  = var.enable_cross_region_replication ? 1 : 0
  role   = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "replicate-cloudtrail-to-backup-region"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.cloudtrail_replica[0].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.cloudtrail]
}

# Metric Filter and Alarm for CloudTrail Insights Events
resource "aws_cloudwatch_log_metric_filter" "insights_events" {
  count = var.environment == "prod" ? 1 : 0

  name           = "${local.name_prefix}}-insights-events"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.eventType = \"AwsCloudTrailInsight\" }"

  metric_transformation {
    name      = "CloudTrailInsightsEvents"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "insights_events" {
  count = var.environment == "prod" ? 1 : 0

  alarm_name          = "${local.name_prefix}}-cloudtrail-insights-event-detected"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = aws_cloudwatch_log_metric_filter.insights_events[0].metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.insights_events[0].metric_transformation[0].namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm for when a CloudTrail Insights event is detected, indicating unusual API activity."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# Metric Filter and Alarm for Root Account Usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}}-root-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}}-root-usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = aws_cloudwatch_log_metric_filter.root_usage.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.root_usage.metric_transformation[0].namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm for root account usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}