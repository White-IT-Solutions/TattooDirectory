# =============================================================================
# FOUNDATION MODULE OUTPUTS
# =============================================================================

# =============================================================================
# DATA SOURCES
# =============================================================================

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "Current AWS region"
  value       = data.aws_region.current.name
}

output "availability_zones" {
  description = "Available availability zones"
  value       = data.aws_availability_zones.available.names
}

# =============================================================================
# RANDOM VALUES
# =============================================================================

output "random_suffix" {
  description = "Random suffix for unique resource naming"
  value       = random_id.suffix.hex
}

output "opensearch_master_password" {
  description = "Random password for OpenSearch master user"
  value       = random_password.opensearch_master.result
  sensitive   = true
}

output "app_secrets_password" {
  description = "Random password for application secrets"
  value       = random_password.app_secrets.result
  sensitive   = true
}

# =============================================================================
# KMS KEYS
# =============================================================================

output "kms_key_main_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_main_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

# NOTE: The logs KMS key outputs have been moved to the security-foundation module

output "kms_key_replica_id" {
  description = "ID of the replica KMS key"
  value       = var.context.enable_cross_region_replication ? aws_kms_key.replica[0].key_id : null
}

output "kms_key_replica_arn" {
  description = "ARN of the replica KMS key"
  value       = var.context.enable_cross_region_replication ? aws_kms_key.replica[0].arn : null
}

# =============================================================================
# CODE SIGNING
# =============================================================================

output "lambda_code_signing_config_arn" {
  description = "ARN of the Lambda code signing configuration"
  value       = var.context.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null
}

output "lambda_signing_profile_arn" {
  description = "ARN of the Lambda signing profile"
  value       = var.context.environment == "prod" ? aws_signer_signing_profile.lambda[0].arn : null
}
