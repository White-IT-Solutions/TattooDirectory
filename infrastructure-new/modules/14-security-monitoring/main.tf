# =============================================================================
# SECURITY MONITORING MODULE
# =============================================================================
# This module contains security monitoring resources for the Security Account:
# - SNS topic for security alerts
# - CloudWatch alarms for security metrics (GuardDuty, Config, CloudTrail)
# - Security-focused dashboards and queries

# =============================================================================
# SNS TOPIC FOR SECURITY NOTIFICATIONS
# =============================================================================

# Security alerts topic for security findings and compliance issues
resource "aws_sns_topic" "security_alerts" {
  name              = "${var.context.name_prefix}-security-alerts"
  kms_master_key_id = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-security-alerts"
  })
}

# =============================================================================
# SNS TOPIC SUBSCRIPTIONS
# =============================================================================

resource "aws_sns_topic_subscription" "security_email" {
  count = var.context.notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.context.notification_email
}

# =============================================================================
# CLOUDWATCH ALARMS - GUARDDUTY
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "guardduty_findings" {
  count = var.guardduty_detector_id != "" ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-guardduty-findings"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FindingCount"
  namespace           = "AWS/GuardDuty"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors GuardDuty findings"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    DetectorId = var.guardduty_detector_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-guardduty-findings"
  })
}

# =============================================================================
# CLOUDWATCH ALARMS - CONFIG
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "config_compliance" {
  count = var.enable_config_monitoring ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-config-compliance"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ComplianceByConfigRule"
  namespace           = "AWS/Config"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors AWS Config compliance"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-compliance"
  })
}

# =============================================================================
# CLOUDWATCH ALARMS - CLOUDTRAIL
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "cloudtrail_errors" {
  count = var.enable_cloudtrail_monitoring ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-cloudtrail-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ErrorCount"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors CloudTrail log errors"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-errors"
  })
}

# =============================================================================
# CLOUDWATCH METRIC FILTERS FOR SECURITY MONITORING
# =============================================================================

resource "aws_cloudwatch_log_metric_filter" "cloudtrail_security_alerts" {
  count = var.cloudtrail_log_group_name != "" ? 1 : 0

  name           = "${var.context.name_prefix}-cloudtrail-security-alerts"
  log_group_name = var.cloudtrail_log_group_name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") || ($.sourceIPAddress != \"AWS Internal\") }"

  metric_transformation {
    name      = "CloudTrailSecurityAlerts"
    namespace = "${var.context.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudtrail_security_alerts" {
  count = var.cloudtrail_log_group_name != "" ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-cloudtrail-security-alerts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = aws_cloudwatch_log_metric_filter.cloudtrail_security_alerts[0].metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.cloudtrail_security_alerts[0].metric_transformation[0].namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors security-related events in CloudTrail (e.g., Unauthorized)"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-security-alerts"
  })
}

# =============================================================================
# CLOUDWATCH LOG INSIGHTS QUERIES FOR SECURITY
# =============================================================================

resource "aws_cloudwatch_query_definition" "security_events" {
  count = var.cloudtrail_log_group_name != "" ? 1 : 0
  name  = "${var.context.name_prefix}-security-events"

  log_group_names = [var.cloudtrail_log_group_name]

  query_string = <<EOF
fields @timestamp, @message, sourceIPAddress, userIdentity.type, eventName
| filter eventName like /Delete/ or eventName like /Create/ or eventName like /Put/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "failed_logins" {
  count = var.cloudtrail_log_group_name != "" ? 1 : 0
  name  = "${var.context.name_prefix}-failed-logins"

  log_group_names = [var.cloudtrail_log_group_name]

  query_string = <<EOF
fields @timestamp, @message, sourceIPAddress, userIdentity, errorCode, errorMessage
| filter errorCode = "SigninFailure" or errorCode = "InvalidUserID.NotFound"
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "root_usage" {
  count = var.cloudtrail_log_group_name != "" ? 1 : 0
  name  = "${var.context.name_prefix}-root-usage"

  log_group_names = [var.cloudtrail_log_group_name]

  query_string = <<EOF
fields @timestamp, @message, sourceIPAddress, userIdentity, eventName
| filter userIdentity.type = "Root"
| sort @timestamp desc
| limit 100
EOF
}
