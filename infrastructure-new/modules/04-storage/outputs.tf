# =============================================================================
# STORAGE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# S3 BUCKETS
# =============================================================================

output "s3_bucket_ids" {
  description = "IDs of the S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.id }
}

output "s3_bucket_arns" {
  description = "ARNs of the S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.arn }
}

output "frontend_bucket_id" {
  description = "ID of the frontend S3 bucket"
  value       = aws_s3_bucket.main["frontend"].id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  value       = aws_s3_bucket.main["frontend"].arn
}

output "config_bucket_id" {
  description = "ID of the config S3 bucket"
  value       = aws_s3_bucket.main["config"].id
}

output "config_bucket_arn" {
  description = "ARN of the config S3 bucket"
  value       = aws_s3_bucket.main["config"].arn
}

# =============================================================================
# DYNAMODB TABLES
# =============================================================================

output "dynamodb_table_names" {
  description = "Names of the DynamoDB tables"
  value = {
    main        = aws_dynamodb_table.main.name
    denylist    = aws_dynamodb_table.denylist.name
    idempotency = aws_dynamodb_table.idempotency.name
  }
}

output "dynamodb_table_arns" {
  description = "ARNs of the DynamoDB tables"
  value = {
    main        = aws_dynamodb_table.main.arn
    denylist    = aws_dynamodb_table.denylist.arn
    idempotency = aws_dynamodb_table.idempotency.arn
  }
}

output "main_table_name" {
  description = "Name of the main DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "main_table_arn" {
  description = "ARN of the main DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

# =============================================================================
# CLOUDFRONT
# =============================================================================

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

output "cloudtrail_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.main["cloudtrail"].id
}

output "access_logs_bucket_id" {
  description = "ID of the access logs S3 bucket"
  value       = aws_s3_bucket.main["access_logs"].id
}

# =============================================================================
# SNS
# =============================================================================

output "s3_events_topic_arn" {
  description = "ARN of the S3 events SNS topic"
  value       = aws_sns_topic.s3_events.arn
}