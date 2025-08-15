# =============================================================================
# SECURITY MODULE OUTPUTS
# =============================================================================

# =============================================================================
# SECRETS MANAGER
# =============================================================================

output "app_secrets_arn" {
  description = "ARN of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "app_secrets_id" {
  description = "ID of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.id
}

output "opensearch_master_secret_arn" {
  description = "ARN of the OpenSearch master user secret"
  value       = aws_secretsmanager_secret.opensearch_master.arn
}

output "opensearch_master_secret_id" {
  description = "ID of the OpenSearch master user secret"
  value       = aws_secretsmanager_secret.opensearch_master.id
}

# =============================================================================
# WAF
# =============================================================================

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.enhanced_frontend.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.enhanced_frontend.arn
}

output "waf_log_group_name" {
  description = "Name of the WAF CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.waf.name
}

output "waf_log_group_arn" {
  description = "ARN of the WAF CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.waf.arn
}

# =============================================================================
# GUARDDUTY
# =============================================================================

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "guardduty_detector_arn" {
  description = "ARN of the GuardDuty detector"
  value       = aws_guardduty_detector.main.arn
}