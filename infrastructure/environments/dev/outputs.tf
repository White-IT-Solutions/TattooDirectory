# =============================================================================
# DEV ENVIRONMENT OUTPUTS
# =============================================================================

# =============================================================================
# API GATEWAY OUTPUTS
# =============================================================================

output "api_gateway_invoke_url" {
  description = "The invoke URL for the API Gateway stage"
  value       = module.api.stage_invoke_url
}

output "api_gateway_endpoint" {
  description = "The default endpoint URL of the API Gateway"
  value       = module.api.api_endpoint
}

output "api_gateway_custom_domain" {
  description = "The custom domain name for the API (if configured)"
  value       = module.api.custom_domain_name
}

# =============================================================================
# FRONTEND OUTPUTS
# =============================================================================

output "cloudfront_distribution_domain" {
  description = "The domain name of the CloudFront distribution"
  value       = module.delivery.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution for the frontend"
  value       = module.delivery.cloudfront_distribution_id
}

output "frontend_bucket_name" {
  description = "The name of the S3 bucket hosting the frontend"
  value       = module.app_storage.frontend_bucket_id
}

# =============================================================================
# INFRASTRUCTURE OUTPUTS
# =============================================================================

output "environment" {
  description = "The environment name"
  value       = local.context.environment
}

output "region" {
  description = "The AWS region"
  value       = local.context.aws_region
}