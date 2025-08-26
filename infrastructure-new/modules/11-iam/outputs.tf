# =============================================================================
# IAM MODULE OUTPUTS
# =============================================================================

# =============================================================================
# LAMBDA ROLES
# =============================================================================

output "lambda_api_role_arn" {
  description = "ARN of the API Lambda role"
  value       = aws_iam_role.lambda_api.arn
}

output "lambda_api_role_name" {
  description = "Name of the API Lambda role"
  value       = aws_iam_role.lambda_api.name
}

output "lambda_sync_role_arn" {
  description = "ARN of the DynamoDB sync Lambda role"
  value       = aws_iam_role.lambda_sync.arn
}

output "lambda_sync_role_name" {
  description = "Name of the DynamoDB sync Lambda role"
  value       = aws_iam_role.lambda_sync.name
}

output "lambda_discover_studios_role_arn" {
  description = "ARN of the Discover Studios Lambda role"
  value       = aws_iam_role.lambda_discover_studios.arn
}

output "lambda_discover_studios_role_name" {
  description = "Name of the Discover Studios Lambda role"
  value       = aws_iam_role.lambda_discover_studios.name
}

output "lambda_find_artists_role_arn" {
  description = "ARN of the Find Artists Lambda role"
  value       = aws_iam_role.lambda_find_artists.arn
}

output "lambda_find_artists_role_name" {
  description = "Name of the Find Artists Lambda role"
  value       = aws_iam_role.lambda_find_artists.name
}

output "lambda_queue_scraping_role_arn" {
  description = "ARN of the Queue Scraping Lambda role"
  value       = aws_iam_role.lambda_queue_scraping.arn
}

output "lambda_queue_scraping_role_name" {
  description = "Name of the Queue Scraping Lambda role"
  value       = aws_iam_role.lambda_queue_scraping.name
}

output "lambda_rotate_nat_gateway_eip_role_arn" {
  description = "ARN of the NAT Gateway EIP rotation Lambda role"
  value       = aws_iam_role.lambda_rotate_nat_gateway_eip.arn
}

output "lambda_rotate_nat_gateway_eip_role_name" {
  description = "Name of the NAT Gateway EIP rotation Lambda role"
  value       = aws_iam_role.lambda_rotate_nat_gateway_eip.name
}

# =============================================================================
# WORKFLOW ROLES
# =============================================================================

output "step_functions_role_arn" {
  description = "ARN of the Step Functions role"
  value       = aws_iam_role.step_functions.arn
}

output "step_functions_role_name" {
  description = "Name of the Step Functions role"
  value       = aws_iam_role.step_functions.name
}

# =============================================================================
# ECS ROLES
# =============================================================================

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "Name of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.name
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_name" {
  description = "Name of the ECS task role"
  value       = aws_iam_role.ecs_task.name
}

# =============================================================================
# SERVICE ROLES
# =============================================================================

output "backup_role_arn" {
  description = "ARN of the AWS Backup role"
  value       = var.backup_enabled ? aws_iam_role.backup[0].arn : null
}

output "backup_role_name" {
  description = "Name of the AWS Backup role"
  value       = var.backup_enabled ? aws_iam_role.backup[0].name : null
}

output "config_role_arn" {
  description = "ARN of the AWS Config role"
  value       = var.enable_config ? aws_iam_role.config[0].arn : null
}

output "config_role_name" {
  description = "Name of the AWS Config role"
  value       = var.enable_config ? aws_iam_role.config[0].name : null
}

# =============================================================================
# ROLE LISTS (for OpenSearch access policies)
# =============================================================================

output "lambda_role_arns" {
  description = "List of Lambda role ARNs for OpenSearch access"
  value = [
    aws_iam_role.lambda_api.arn,
    aws_iam_role.lambda_sync.arn
  ]
}

# =============================================================================
# S3 REPLICATION
# =============================================================================

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication role"
  value       = var.context.enable_cross_region_replication ? aws_iam_role.s3_replication[0].arn : null
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication role"
  value       = var.context.enable_cross_region_replication ? aws_iam_role.s3_replication[0].name : null
}

# =============================================================================
# CROSS-ACCOUNT ACCESS
# =============================================================================

output "config_cross_account_external_id" {
  description = "External ID for cross-account Config role assumption"
  value       = "${var.context.name_prefix}-config-cross-account"
}

output "backup_cross_account_external_id" {
  description = "External ID for cross-account Backup role assumption"
  value       = "${var.context.name_prefix}-backup-cross-account"
}