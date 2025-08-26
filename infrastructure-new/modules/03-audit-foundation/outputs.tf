# =============================================================================
# OUTPUTS
# =============================================================================

output "kms_key_audit_arn" {
  description = "ARN of the audit KMS key"
  value       = aws_kms_key.audit.arn
}

output "kms_key_audit_id" {
  description = "ID of the audit KMS key"
  value       = aws_kms_key.audit.key_id
}