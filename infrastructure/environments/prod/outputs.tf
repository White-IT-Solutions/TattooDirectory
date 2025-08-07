# Production Environment Outputs
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

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = module.app.cloudfront_distribution_id
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

output "s3_access_logs_bucket" {
  description = "S3 access logs bucket name"
  value       = module.app.s3_access_logs_bucket_name
}

output "dynamodb_main_table" {
  description = "Main DynamoDB table name"
  value       = module.app.dynamodb_table_name
}

output "dynamodb_denylist_table" {
  description = "DynamoDB denylist table name"
  value       = module.app.dynamodb_denylist_table_name
}

output "dynamodb_idempotency_table" {
  description = "DynamoDB idempotency table name"
  value       = module.app.dynamodb_idempotency_table_name
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

output "ecs_service_name" {
  description = "ECS service name for container orchestration"
  value       = module.app.ecs_service_name
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

output "sqs_dead_letter_queues" {
  description = "SQS dead letter queue URLs for error handling"
  value       = module.app.sqs_dlq_urls
}

output "sns_topic_arns" {
  description = "SNS topic ARNs for notifications"
  value       = module.app.sns_topic_arns
  sensitive   = true
}

output "step_functions_name" {
  description = "Step Functions state machine name"
  value       = module.app.step_functions_name
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = module.app.step_functions_arn
  sensitive   = true
}

# =============================================================================
# MONITORING & OBSERVABILITY
# =============================================================================

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL for monitoring"
  value       = module.app.cloudwatch_dashboard_url
}

output "config_compliance_dashboard_url" {
  description = "AWS Config compliance dashboard URL"
  value       = module.app.config_compliance_dashboard_url
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

output "kms_logs_key_id" {
  description = "Logs KMS key ID for log encryption"
  value       = module.app.kms_logs_key_id
}

output "security_groups" {
  description = "Security group IDs for network access control"
  value       = module.app.security_group_ids
}

output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name for application secrets"
  value       = module.app.secrets_manager_secret_name
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN for application protection"
  value       = module.app.waf_web_acl_arn
  sensitive   = true
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID for threat detection"
  value       = module.app.guardduty_detector_id
}

# =============================================================================
# COMPLIANCE & GOVERNANCE
# =============================================================================

output "config_bucket_name" {
  description = "AWS Config S3 bucket name"
  value       = module.app.config_bucket_name
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = module.app.config_recorder_name
}

output "cloudtrail_name" {
  description = "CloudTrail name for audit logging"
  value       = module.app.cloudtrail_name
}

output "cloudtrail_s3_bucket" {
  description = "CloudTrail S3 bucket name"
  value       = module.app.cloudtrail_s3_bucket_name
}

output "config_rules_count" {
  description = "Number of AWS Config rules deployed"
  value       = module.app.config_rules_count
}

# =============================================================================
# BACKUP & DISASTER RECOVERY
# =============================================================================

output "backup_vault_name" {
  description = "AWS Backup vault name"
  value       = module.app.backup_vault_name
}

output "backup_plan_arn" {
  description = "AWS Backup plan ARN"
  value       = module.app.backup_plan_arn
  sensitive   = true
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
# PRODUCTION-SPECIFIC OUTPUTS
# =============================================================================

output "production_readiness" {
  description = "Production environment readiness indicators"
  value = {
    backup_enabled = true
    monitoring_level = "comprehensive"
    compliance_enabled = true
    multi_az_deployment = true
    encryption_at_rest = true
    encryption_in_transit = true
    waf_protection = true
    guardduty_enabled = true
    config_rules_active = true
    cloudtrail_enabled = true
  }
}

output "operational_contacts" {
  description = "Key operational information for production"
  value = {
    environment = "production"
    support_level = "24x7"
    escalation_required = true
    change_management = "required"
    maintenance_window = "sunday_02:00_utc"
  }
}