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

# S3 bucket server-side encryption enabled
resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
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

# DynamoDB point-in-time recovery enabled
resource "aws_config_config_rule" "dynamodb_pitr_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-dynamodb-pitr-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_PITR_ENABLED"
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

# Lambda function public access prohibited
resource "aws_config_config_rule" "lambda_function_public_access_prohibited" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-lambda-function-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Lambda function inside VPC
resource "aws_config_config_rule" "lambda_inside_vpc" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-lambda-inside-vpc"

  source {
    owner             = "AWS"
    source_identifier = "LAMBDA_INSIDE_VPC"
  }

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

# CloudFront origin access control enabled
resource "aws_config_config_rule" "cloudfront_origin_access_control_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-cloudfront-origin-access-control-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDFRONT_ORIGIN_ACCESS_CONTROL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# CloudFront viewer policy HTTPS
resource "aws_config_config_rule" "cloudfront_viewer_policy_https" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-cloudfront-viewer-policy-https"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDFRONT_VIEWER_POLICY_HTTPS"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# VPC default security group closed
resource "aws_config_config_rule" "vpc_default_security_group_closed" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-vpc-default-security-group-closed"

  source {
    owner             = "AWS"
    source_identifier = "VPC_DEFAULT_SECURITY_GROUP_CLOSED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# VPC flow logs enabled
resource "aws_config_config_rule" "vpc_flow_logs_enabled" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-vpc-flow-logs-enabled"

  source {
    owner             = "AWS"
    source_identifier = "VPC_FLOW_LOGS_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# IAM policy no statements with admin access
resource "aws_config_config_rule" "iam_policy_no_statements_with_admin_access" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-iam-policy-no-statements-with-admin-access"

  source {
    owner             = "AWS"
    source_identifier = "IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# IAM user no policies check
resource "aws_config_config_rule" "iam_user_no_policies_check" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-iam-user-no-policies-check"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_NO_POLICIES_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# KMS CMK not scheduled for deletion
resource "aws_config_config_rule" "kms_cmk_not_scheduled_for_deletion" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-kms-cmk-not-scheduled-for-deletion"

  source {
    owner             = "AWS"
    source_identifier = "KMS_CMK_NOT_SCHEDULED_FOR_DELETION"
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

# CloudTrail now uses the centralized bucket in the Audit Account

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
  s3_bucket_name = var.cloudtrail_bucket_name

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