# =============================================================================
# GOVERNANCE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# AWS CONFIG
# =============================================================================

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = var.enable_config ? aws_config_configuration_recorder.main[0].name : null
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = var.enable_config ? aws_config_delivery_channel.main[0].name : null
}

output "config_rule_names" {
  description = "List of AWS Config rule names"
  value = var.enable_config ? [
    aws_config_config_rule.s3_bucket_public_access_prohibited[0].name,
    aws_config_config_rule.dynamodb_table_encryption_enabled[0].name,
    aws_config_config_rule.lambda_concurrency_check[0].name,
    aws_config_config_rule.api_gw_execution_logging_enabled[0].name
  ] : []
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_log_group_arn" {
  description = "ARN of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

# =============================================================================
# COMPLIANCE DASHBOARD
# =============================================================================

output "compliance_dashboard_name" {
  description = "Name of the compliance dashboard"
  value       = var.enable_config ? aws_cloudwatch_dashboard.compliance[0].dashboard_name : null
}

output "compliance_dashboard_url" {
  description = "URL of the compliance dashboard"
  value       = var.enable_config ? "https://${var.context.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.context.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.compliance[0].dashboard_name}" : null
}

# =============================================================================
# SECURITY MONITORING
# =============================================================================

output "security_alarm_arn" {
  description = "ARN of the security alerts CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.security_alerts.arn
}

output "security_metric_filter_name" {
  description = "Name of the security alerts metric filter"
  value       = aws_cloudwatch_log_metric_filter.security_alerts.name
}