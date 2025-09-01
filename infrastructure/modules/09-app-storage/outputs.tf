# =============================================================================
# APP STORAGE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# S3 BUCKETS
# =============================================================================

output "s3_bucket_ids" {
  description = "IDs of the application S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.id }
}

output "s3_bucket_arns" {
  description = "ARNs of the application S3 buckets"
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

output "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket"
  value       = aws_s3_bucket.main["frontend"].bucket_regional_domain_name
}

output "frontend_backup_bucket_id" {
  description = "ID of the frontend backup S3 bucket"
  value       = aws_s3_bucket.main["frontend_backup"].id
}

output "frontend_backup_bucket_arn" {
  description = "ARN of the frontend backup S3 bucket"
  value       = aws_s3_bucket.main["frontend_backup"].arn
}

output "frontend_backup_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend backup S3 bucket"
  value       = aws_s3_bucket.main["frontend_backup"].bucket_regional_domain_name
}

output "lambda_artifacts_bucket_id" {
  description = "ID of the S3 bucket for Lambda deployment packages"
  value       = aws_s3_bucket.main["lambda_artifacts"].id
}

output "lambda_artifacts_bucket_arn" {
  description = "ARN of the S3 bucket for Lambda deployment packages"
  value       = aws_s3_bucket.main["lambda_artifacts"].arn
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

output "main_table_stream_arn" {
  description = "ARN of the main DynamoDB table stream"
  value       = aws_dynamodb_table.main.stream_arn
}

# =============================================================================
# SNS
# =============================================================================

output "s3_events_topic_arn" {
  description = "ARN of the S3 events SNS topic"
  value       = aws_sns_topic.s3_events.arn
}

output "s3_replica_bucket_arns" {
  description = "ARNs of the replica S3 buckets"
  value       = { for k, v in aws_s3_bucket.replica : k => v.arn }
}
