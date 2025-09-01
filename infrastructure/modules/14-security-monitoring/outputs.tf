# =============================================================================
# SECURITY MONITORING MODULE OUTPUTS
# =============================================================================

# =============================================================================
# SNS TOPICS
# =============================================================================

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

output "security_alarm_arns" {
  description = "Map of security CloudWatch alarm ARNs"
  value = merge(
    var.enable_guardduty_monitoring ? {
      guardduty_findings = aws_cloudwatch_metric_alarm.guardduty_findings[0].arn
    } : {},
    var.enable_config_monitoring ? {
      config_compliance = aws_cloudwatch_metric_alarm.config_compliance[0].arn
    } : {},
    var.enable_cloudtrail_monitoring ? {
      cloudtrail_errors = aws_cloudwatch_metric_alarm.cloudtrail_errors[0].arn
    } : {},
    var.cloudtrail_log_group_name != "" ? {
      cloudtrail_security_alerts = aws_cloudwatch_metric_alarm.cloudtrail_security_alerts[0].arn
    } : {}
  )
}

# =============================================================================
# LOG INSIGHTS QUERIES
# =============================================================================

output "security_log_insights_query_arns" {
  description = "Map of security CloudWatch Log Insights query ARNs"
  value = var.cloudtrail_log_group_name != "" ? {
    security_events = aws_cloudwatch_query_definition.security_events[0].query_definition_id
    failed_logins   = aws_cloudwatch_query_definition.failed_logins[0].query_definition_id
    root_usage      = aws_cloudwatch_query_definition.root_usage[0].query_definition_id
  } : {}
}