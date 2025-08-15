# =============================================================================
# API MODULE OUTPUTS
# =============================================================================

# =============================================================================
# API GATEWAY
# =============================================================================

output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_arn" {
  description = "ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.arn
}

output "api_endpoint" {
  description = "Default endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}

# =============================================================================
# API STAGE
# =============================================================================

output "stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.name
}

output "stage_invoke_url" {
  description = "Invoke URL of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

# =============================================================================
# CUSTOM DOMAIN
# =============================================================================

output "custom_domain_name" {
  description = "Custom domain name for the API"
  value       = var.context.domain_name != "" ? aws_apigatewayv2_domain_name.main[0].domain_name : null
}

output "custom_domain_target" {
  description = "Target domain name for the custom domain"
  value       = var.context.domain_name != "" ? aws_apigatewayv2_domain_name.main[0].domain_name_configuration[0].target_domain_name : null
}

# =============================================================================
# CLOUDWATCH LOG GROUP
# =============================================================================

output "log_group_name" {
  description = "Name of the API Gateway CloudWatch log group"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "log_group_arn" {
  description = "ARN of the API Gateway CloudWatch log group"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}