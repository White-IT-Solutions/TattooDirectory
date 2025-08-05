# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudtrail-logs"
  })
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

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudtrail-logs"
  })
}

# AWS CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "AWSLogs"
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_to_cloudwatch.arn

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