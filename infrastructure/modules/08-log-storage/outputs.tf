# =============================================================================
# LOG STORAGE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# S3 BUCKETS
# =============================================================================

output "s3_bucket_ids" {
  description = "IDs of the audit and log S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.id }
}

output "s3_bucket_arns" {
  description = "ARNs of the audit and log S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.arn }
}

output "config_bucket_id" {
  description = "ID of the config S3 bucket"
  value       = aws_s3_bucket.main["config"].id
}

output "config_bucket_arn" {
  description = "ARN of the config S3 bucket"
  value       = aws_s3_bucket.main["config"].arn
}

output "cloudtrail_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.main["cloudtrail"].id
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.main["cloudtrail"].arn
}

output "access_logs_bucket_id" {
  description = "ID of the access logs S3 bucket"
  value       = aws_s3_bucket.main["access_logs"].id
}

output "access_logs_bucket_arn" {
  description = "ARN of the access logs S3 bucket"
  value       = aws_s3_bucket.main["access_logs"].arn
}

output "access_logs_bucket_domain_name" {
  description = "Domain name of the access logs S3 bucket"
  value       = aws_s3_bucket.main["access_logs"].bucket_domain_name
}

output "vpc_flow_logs_bucket_id" {
  description = "ID of the VPC Flow Logs S3 bucket"
  value       = aws_s3_bucket.main["vpc_flow_logs"].id
}

output "vpc_flow_logs_bucket_arn" {
  description = "ARN of the VPC Flow Logs S3 bucket"
  value       = aws_s3_bucket.main["vpc_flow_logs"].arn
}

output "waf_logs_bucket_id" {
  description = "ID of the WAF Logs S3 bucket"
  value       = aws_s3_bucket.main["waf_logs"].id
}

output "waf_logs_bucket_arn" {
  description = "ARN of the WAF Logs S3 bucket"
  value       = aws_s3_bucket.main["waf_logs"].arn
}

output "s3_replica_bucket_arns" {
  description = "ARNs of the replica audit and log S3 buckets"
  value       = { for k, v in aws_s3_bucket.replica : k => v.arn }
}

# =============================================================================
# KMS KEYS
# =============================================================================

output "kms_key_log_archive_arn" {
  description = "The ARN of the KMS key for the Log Archive account."
  value       = aws_kms_key.log_archive.arn
}

output "kms_key_log_archive_replica_arn" {
  description = "The ARN of the KMS replica key for the Log Archive account."
  value       = var.context.enable_cross_region_replication ? aws_kms_key.log_archive_replica[0].arn : null
}