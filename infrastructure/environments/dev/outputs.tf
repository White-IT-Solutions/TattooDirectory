# Development Environment Outputs
# These outputs expose key resource information for operational use

# =============================================================================
# APPLICATION ENDPOINTS
# =============================================================================

output "application_url" {
  description = "Main application URL (CloudFront distribution)"
  value       = module.app.cloudfront_distribution_url
}

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.app.api_gateway_url
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.app.cloudfront_distribution_domain
}

# =============================================================================
# INFRASTRUCTURE IDENTIFIERS
# =============================================================================

output "vpc_id" {
  description = "VPC ID for network configuration"
  value       = module.app.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for resource deployment"
  value       = module.app.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs for load balancers and NAT gateways"
  value       = module.app.public_subnet_ids
}

# =============================================================================
# STORAGE RESOURCES
# =============================================================================

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend hosting"
  value       = module.app.s3_bucket_name
}

output "s3_backup_bucket" {
  description = "S3 backup bucket name"
  value       = module.app.s3_bucket_backup_name
}

output "dynamodb_main_table" {
  description = "Main DynamoDB table name"
  value       = module.app.dynamodb_table_name
}

output "dynamodb_denylist_table" {
  description = "DynamoDB denylist table name"
  value       = module.app.dynamodb_denylist_table_name
}

output "opensearch_domain" {
  description = "OpenSearch domain name"
  value       = module.app.opensearch_domain_name
}

# =============================================================================
# COMPUTE RESOURCES
# =============================================================================

output "lambda_functions" {
  description = "Lambda function names for monitoring and debugging"
  value       = module.app.lambda_function_names
}

output "ecs_cluster_name" {
  description = "ECS cluster name for container management"
  value       = module.app.ecs_cluster_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for container image deployment"
  value       = module.app.ecr_repository_url
}

# =============================================================================
# MESSAGING & ORCHESTRATION
# =============================================================================

output "sqs_scraping_queue_url" {
  description = "SQS scraping queue URL"
  value       = module.app.sqs_queue_url
}

output "step_functions_name" {
  description = "Step Functions state machine name"
  value       = module.app.step_functions_name
}

# =============================================================================
# MONITORING & OBSERVABILITY
# =============================================================================

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL for monitoring"
  value       = module.app.cloudwatch_dashboard_url
}

output "log_groups" {
  description = "CloudWatch log group names for debugging"
  value       = module.app.cloudwatch_log_groups
}

# =============================================================================
# SECURITY & COMPLIANCE
# =============================================================================

output "kms_key_id" {
  description = "Main KMS key ID for encryption operations"
  value       = module.app.kms_key_id
}

output "security_groups" {
  description = "Security group IDs for network access control"
  value       = module.app.security_group_ids
}

output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name for application secrets"
  value       = module.app.secrets_manager_secret_name
}

# =============================================================================
# ENVIRONMENT METADATA
# =============================================================================

output "environment" {
  description = "Environment name"
  value       = module.app.environment
}

output "project_name" {
  description = "Project name"
  value       = module.app.project_name
}

output "aws_region" {
  description = "AWS region"
  value       = module.app.aws_region
}

output "name_prefix" {
  description = "Resource name prefix"
  value       = module.app.name_prefix
}

# =============================================================================
# DEVELOPMENT-SPECIFIC OUTPUTS
# =============================================================================

output "dev_notes" {
  description = "Development environment specific notes"
  value = {
    backup_enabled = false
    monitoring_level = "basic"
    cost_optimization = "enabled"
    data_retention = "short_term"
  }
}