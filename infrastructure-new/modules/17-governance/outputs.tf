# =============================================================================
# GOVERNANCE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# AWS CONFIG
# =============================================================================

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = var.enable_config ? aws_config_configuration_recorder.main[0].name : null
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = var.enable_config ? aws_config_delivery_channel.main[0].name : null
}

output "config_rule_names" {
  description = "List of all AWS Config rule names"
  value       = var.enable_config ? values(aws_config_config_rule.managed_rules)[*].name : []
}

output "s3_public_access_rule_name" {
  description = "Name of the AWS Config rule for S3 public access"
  value       = var.enable_config ? aws_config_config_rule.managed_rules["s3-bucket-public-access-prohibited"].name : null
}

output "dynamodb_encryption_rule_name" {
  description = "Name of the AWS Config rule for DynamoDB encryption"
  value       = var.enable_config ? aws_config_config_rule.managed_rules["dynamodb-table-encryption-enabled"].name : null
}

output "lambda_public_access_rule_name" {
  description = "Name of the AWS Config rule for Lambda public access"
  value       = var.enable_config ? aws_config_config_rule.managed_rules["lambda-function-public-access-prohibited"].name : null
}

output "cloudfront_https_rule_name" {
  description = "Name of the AWS Config rule for CloudFront HTTPS viewer policy"
  value       = var.enable_config ? aws_config_config_rule.managed_rules["cloudfront-viewer-policy-https"].name : null
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = var.cloudtrail_bucket_name
}

output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = var.cloudtrail_bucket_arn
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_log_group_arn" {
  description = "ARN of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

# =============================================================================
# COMPLIANCE DASHBOARD
# =============================================================================

output "compliance_dashboard_name" {
  description = "Name of the compliance dashboard"
  value       = var.enable_config ? aws_cloudwatch_dashboard.compliance[0].dashboard_name : null
}

output "compliance_dashboard_url" {
  description = "URL of the compliance dashboard"
  value       = var.enable_config ? "https://${var.context.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.context.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.compliance[0].dashboard_name}" : null
}