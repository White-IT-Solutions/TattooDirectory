# =============================================================================
# CENTRAL SECURITY MODULE OUTPUTS
# =============================================================================

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

# =============================================================================
# SECURITY HUB
# =============================================================================

output "security_hub_account_id" {
  description = "ID of the Security Hub account"
  value       = aws_securityhub_account.main.id
}

# =============================================================================
# IAM ACCESS ANALYZER
# =============================================================================

output "access_analyzer_arn" {
  description = "ARN of the IAM Access Analyzer"
  value       = aws_accessanalyzer_analyzer.main.arn
}

output "access_analyzer_name" {
  description = "Name of the IAM Access Analyzer"
  value       = aws_accessanalyzer_analyzer.main.analyzer_name
}