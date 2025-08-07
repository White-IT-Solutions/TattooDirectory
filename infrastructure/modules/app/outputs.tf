# Outputs for important resource information

# Networking
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = values(aws_subnet.private)[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = values(aws_subnet.public)[*].id
}

# Application
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_url" {
  description = "Full URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

# Storage
output "s3_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket
}

output "s3_bucket_backup_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.frontend_backup.bucket
}

output "s3_access_logs_bucket_name" {
  description = "Name of the S3 access logs bucket"
  value       = aws_s3_bucket.access_logs.bucket
}

output "dynamodb_table_name" {
  description = "Name of the main DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_denylist_table_name" {
  description = "Name of the DynamoDB denylist table"
  value       = aws_dynamodb_table.denylist.name
}

output "dynamodb_idempotency_table_name" {
  description = "Name of the DynamoDB idempotency table"
  value       = aws_dynamodb_table.idempotency.name
}

output "opensearch_endpoint" {
  description = "Endpoint of the OpenSearch domain"
  value       = aws_opensearch_domain.main.endpoint
  sensitive   = true
}

output "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_name
}

# Compute
output "ecr_repository_url" {
  description = "URL of the ECR repository for the scraper"
  value       = aws_ecr_repository.scraper.repository_url
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    api_handler         = aws_lambda_function.api_handler.function_name
    dynamodb_sync       = aws_lambda_function.dynamodb_sync.function_name
    secret_rotation     = aws_lambda_function.secret_rotation.function_name
    discover_studios    = aws_lambda_function.discover_studios.function_name
    find_artists        = aws_lambda_function.find_artists_on_site.function_name
    queue_scraping      = aws_lambda_function.queue_scraping.function_name
    rotate_nat_eip      = aws_lambda_function.rotate_nat_gateway_eip.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value = {
    api_handler         = aws_lambda_function.api_handler.arn
    dynamodb_sync       = aws_lambda_function.dynamodb_sync.arn
    secret_rotation     = aws_lambda_function.secret_rotation.arn
    discover_studios    = aws_lambda_function.discover_studios.arn
    find_artists        = aws_lambda_function.find_artists_on_site.arn
    queue_scraping      = aws_lambda_function.queue_scraping.arn
    rotate_nat_eip      = aws_lambda_function.rotate_nat_gateway_eip.arn
  }
  sensitive = true
}

# Messaging
output "sqs_queue_url" {
  description = "URL of the SQS scraping queue"
  value       = aws_sqs_queue.scraping_queue.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS scraping queue"
  value       = aws_sqs_queue.scraping_queue.arn
}

output "sqs_dlq_urls" {
  description = "URLs of the SQS dead letter queues"
  value = {
    scraping_dlq    = aws_sqs_queue.scraping_dlq.url
    lambda_dlq      = aws_sqs_queue.lambda_dlq.url
    lambda_sync_dlq = aws_sqs_queue.lambda_sync_dlq.url
  }
}

output "sns_topic_arns" {
  description = "ARNs of the SNS topics"
  value = {
    alerts                   = aws_sns_topic.alerts.arn
    config_notifications     = aws_sns_topic.config_notifications.arn
    cloudtrail_notifications = aws_sns_topic.cloudtrail_notifications.arn
    s3_events               = aws_sns_topic.s3_events.arn
  }
}

# Orchestration
output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.arn
}

output "step_functions_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.scraper.name
}

# Monitoring
output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "config_compliance_dashboard_url" {
  description = "URL of the Config compliance dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.config_compliance.dashboard_name}"
}

output "cloudwatch_log_groups" {
  description = "Names of CloudWatch log groups"
  value = {
    lambda_api          = aws_cloudwatch_log_group.lambda_api.name
    lambda_sync         = aws_cloudwatch_log_group.lambda_sync.name
    lambda_workflow     = aws_cloudwatch_log_group.lambda_workflow.name
    api_gateway         = aws_cloudwatch_log_group.api_gateway.name
    fargate_scraper     = aws_cloudwatch_log_group.fargate_scraper.name
    ecs_cluster         = aws_cloudwatch_log_group.ecs_cluster.name
    opensearch_audit    = aws_cloudwatch_log_group.opensearch_audit.name
    cloudtrail          = aws_cloudwatch_log_group.cloudtrail.name
    vpc_flow_logs       = aws_cloudwatch_log_group.vpc_flow_logs.name
    waf                 = aws_cloudwatch_log_group.waf.name
    secret_rotation     = aws_cloudwatch_log_group.secret_rotation.name
  }
}

# Compliance
output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.bucket
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudWatch Log Group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "config_rules_count" {
  description = "Number of Config rules deployed"
  value       = 14
}

# Security
output "kms_key_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_logs_key_id" {
  description = "ID of the logs KMS key"
  value       = aws_kms_key.logs.id
}

output "kms_logs_key_arn" {
  description = "ARN of the logs KMS key"
  value       = aws_kms_key.logs.arn
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    lambda        = aws_security_group.lambda.id
    opensearch    = aws_security_group.opensearch.id
    fargate       = aws_security_group.fargate.id
    vpc_endpoints = aws_security_group.vpc_endpoints.id
  }
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.frontend.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

# Backup (conditional outputs)
output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = local.environment_config[var.environment].backup_enabled ? aws_backup_vault.main[0].name : null
}

output "backup_plan_arn" {
  description = "ARN of the backup plan"
  value       = local.environment_config[var.environment].backup_enabled ? aws_backup_plan.main[0].arn : null
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}