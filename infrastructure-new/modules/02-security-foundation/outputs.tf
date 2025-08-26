# =============================================================================
# SECURITY FOUNDATION MODULE OUTPUTS
# =============================================================================

output "kms_key_logs_id" {
  description = "ID of the logs KMS key, managed in the Security account"
  value       = aws_kms_key.logs.key_id
}

output "kms_key_logs_arn" {
  description = "ARN of the logs KMS key, managed in the Security account"
  value       = aws_kms_key.logs.arn
}