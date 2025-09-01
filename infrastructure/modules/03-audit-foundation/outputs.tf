# =============================================================================
# AUDIT FOUNDATION MODULE OUTPUTS
# =============================================================================

output "kms_key_audit_arn" {
  description = "ARN of the audit KMS key"
  value       = aws_kms_key.audit.arn
}

output "kms_key_audit_id" {
  description = "ID of the audit KMS key"
  value       = aws_kms_key.audit.key_id
}

output "kms_key_logs_id" {
  description = "ID of the KMS key for CloudWatch Logs, managed in the Audit account"
  value       = aws_kms_key.logs.key_id
}

output "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch Logs, managed in the Audit account"
  value       = aws_kms_key.logs.arn
}