# =============================================================================
# CENTRAL LOGGING MODULE OUTPUTS
# =============================================================================

# =============================================================================
# SECURITY TOOLING LOGS
# =============================================================================

output "security_tools_log_group_arn" {
  description = "ARN of the Security Tools CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.security_tools.arn
}

output "security_tools_log_group_name" {
  description = "Name of the Security Tools CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.security_tools.name
}

output "incident_response_log_group_arn" {
  description = "ARN of the Incident Response CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.incident_response.arn
}

output "incident_response_log_group_name" {
  description = "Name of the Incident Response CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.incident_response.name
}

# =============================================================================
# CROSS-ACCOUNT LOGS
# =============================================================================

output "api_gateway_log_group_arn" {
  description = "ARN of the API Gateway CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}

output "api_gateway_log_group_name" {
  description = "Name of the API Gateway CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "waf_firehose_arn" {
  description = "ARN of the Kinesis Data Firehose stream for WAF logs"
  value       = aws_kinesis_firehose_delivery_stream.waf_logs.arn
}