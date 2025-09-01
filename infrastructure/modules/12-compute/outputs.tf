# =============================================================================
# COMPUTE MODULE OUTPUTS
# =============================================================================

# =============================================================================
# LAMBDA FUNCTIONS
# =============================================================================

output "lambda_function_arns" {
  description = "Map of Lambda function ARNs"
  value       = { for k, v in local.lambda_functions : k => v.arn }
}

output "lambda_function_names" {
  description = "Map of Lambda function names"
  value       = { for k, v in local.lambda_functions : k => v.function_name }
}

output "api_handler_lambda_invoke_arn" {
  description = "Invoke ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.invoke_arn
}

output "api_handler_lambda_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "api_handler_lambda_function_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

# =============================================================================
# NAT GATEWAY EIP ROTATION LAMBDA
# =============================================================================

output "rotate_nat_gateway_eip_lambda_arn" {
  description = "ARN of the NAT Gateway EIP rotation Lambda function"
  value       = aws_lambda_function.rotate_nat_gateway_eip.arn
}

output "rotate_nat_gateway_eip_lambda_function_name" {
  description = "Name of the NAT Gateway EIP rotation Lambda function"
  value       = aws_lambda_function.rotate_nat_gateway_eip.function_name
}

output "rotate_eip_function_url" {
  description = "Function URL for the NAT Gateway EIP rotation Lambda"
  value       = aws_lambda_function_url.rotate_eip.function_url
}

# =============================================================================
# SQS QUEUES
# =============================================================================

output "scraping_queue_arn" {
  description = "ARN of the scraping SQS queue"
  value       = aws_sqs_queue.scraping_queue.arn
}

output "scraping_queue_url" {
  description = "URL of the scraping SQS queue"
  value       = aws_sqs_queue.scraping_queue.url
}

output "scraping_dlq_arn" {
  description = "ARN of the scraping dead letter queue"
  value       = aws_sqs_queue.scraping_dlq.arn
}

output "lambda_sync_dlq_arn" {
  description = "ARN of the Lambda sync dead letter queue"
  value       = aws_sqs_queue.lambda_sync_dlq.arn
}

# =============================================================================
# ECS
# =============================================================================

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "scraper_task_definition_arn" {
  description = "ARN of the scraper ECS task definition"
  value       = aws_ecs_task_definition.scraper.arn
}

# =============================================================================
# STEP FUNCTIONS
# =============================================================================

output "step_functions_state_machine_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.arn
}

output "step_functions_state_machine_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.name
}

# =============================================================================
# CLOUDWATCH LOG GROUPS
# =============================================================================

output "log_group_arns" {
  description = "Map of CloudWatch log group ARNs"
  value = {
    ecs_cluster    = aws_cloudwatch_log_group.ecs_cluster.arn
    scraper        = aws_cloudwatch_log_group.scraper.arn
    step_functions = aws_cloudwatch_log_group.step_functions.arn
  }
}

output "lambda_log_group_names" {
  description = "List of all Lambda function CloudWatch log group names."
  value       = [
    # The log group name format is /aws/lambda/<function_name>
    for func in local.lambda_functions : "/aws/lambda/${func.function_name}"
  ]
}