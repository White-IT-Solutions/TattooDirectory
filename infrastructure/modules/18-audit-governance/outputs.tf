# =============================================================================
# AUDIT GOVERNANCE MODULE OUTPUTS
# =============================================================================

output "config_aggregator_arn" {
  description = "ARN of the Config aggregator"
  value       = var.enable_config ? aws_config_configuration_aggregator.organization[0].arn : null
}

output "config_aggregator_name" {
  description = "Name of the Config aggregator"
  value       = var.enable_config ? aws_config_configuration_aggregator.organization[0].name : null
}

output "compliance_dashboard_url" {
  description = "URL of the compliance dashboard"
  value       = "https://${var.context.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.context.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.compliance.dashboard_name}"
}