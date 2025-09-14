# =============================================================================
# COMPUTE MODULE VARIABLES
# =============================================================================

variable "context" {
  description = "A single object containing all shared configuration values."
  type = object({
    # Core Identifiers
    project_name = string
    environment  = string
    name_prefix  = string

    # AWS Specific
    aws_region         = string
    replica_aws_region = string
    infra_account_id   = string

    # Common Configuration & Metadata
    common_tags                     = map(string)
    notification_email              = string
    allowed_countries               = list(string)
    enable_cross_region_replication = bool
    enable_advanced_monitoring      = bool
    log_retention_days              = number
    domain_name                     = string

    # Lambda environment variables
    lambda_environment_vars = map(string)
  })
  nullable = false
}

# Module-specific variables
variable "kms_key_main_arn" {
  description = "ARN of the main KMS key for encryption"
  type        = string
}

variable "kms_key_logs_arn" {
  description = "ARN of the logs KMS key for CloudWatch logs encryption"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Lambda and ECS"
  type        = list(string)
}

variable "lambda_internet_security_group_id" {
  description = "ID of the security group for Lambda functions requiring internet access"
  type        = string
}

variable "lambda_internal_security_group_id" {
  description = "ID of the security group for Lambda functions requiring internal access only"
  type        = string
}

variable "fargate_security_group_id" {
  description = "ID of the security group for Fargate tasks"
  type        = string
}

# IAM role ARNs
variable "lambda_api_role_arn" {
  description = "ARN of the API Lambda role"
  type        = string
}

variable "lambda_sync_role_arn" {
  description = "ARN of the DynamoDB sync Lambda role"
  type        = string
}

variable "lambda_discover_studios_role_arn" {
  description = "ARN of the Discover Studios Lambda role"
  type        = string
}

variable "lambda_find_artists_role_arn" {
  description = "ARN of the Find Artists Lambda role"
  type        = string
}

variable "lambda_queue_scraping_role_arn" {
  description = "ARN of the Queue Scraping Lambda role"
  type        = string
}

variable "lambda_rotate_nat_gateway_eip_role_arn" {
  description = "ARN of the NAT Gateway EIP rotation Lambda role"
  type        = string
}

variable "lambda_secret_rotation_role_arn" {
  description = "ARN of the Secret Rotation Lambda role"
  type        = string
}

variable "lambda_api_role_name" {
  description = "Name of the API Lambda role"
  type        = string
}

variable "lambda_sync_role_name" {
  description = "Name of the DynamoDB sync Lambda role"
  type        = string
}

variable "lambda_discover_studios_role_name" {
  description = "Name of the Discover Studios Lambda role"
  type        = string
}

variable "lambda_find_artists_role_name" {
  description = "Name of the Find Artists Lambda role"
  type        = string
}

variable "lambda_secret_rotation_role_name" {
  description = "Name of the Secret Rotation Lambda role"
  type        = string
}

variable "ecs_task_role_name" {
  description = "Name of the ECS task role"
  type        = string
}

variable "lambda_code_signing_config_arn" {
  description = "ARN of the Lambda code signing configuration"
  type        = string
  default     = null
}

variable "step_functions_role_arn" {
  description = "ARN of the Step Functions role"
  type        = string
}

variable "step_functions_role_name" {
  description = "Name of the Step Functions role"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "main_table_arn" {
  description = "ARN of the main DynamoDB table"
  type        = string
}

variable "denylist_table_arn" {
  description = "ARN of the denylist DynamoDB table"
  type        = string
}

variable "idempotency_table_arn" {
  description = "ARN of the idempotency DynamoDB table"
  type        = string
}

variable "main_table_stream_arn" {
  description = "ARN of the main DynamoDB table stream"
  type        = string
}

# Resource references
variable "main_table_name" {
  description = "Name of the main DynamoDB table"
  type        = string
}

variable "opensearch_endpoint" {
  description = "OpenSearch domain endpoint"
  type        = string
}

variable "opensearch_domain_arn" {
  description = "ARN of the OpenSearch domain"
  type        = string
}

variable "app_secrets_arn" {
  description = "ARN of the application secrets in Secrets Manager"
  type        = string
}

variable "lambda_artifacts_bucket_id" {
  description = "The ID (name) of the S3 bucket for Lambda deployment packages."
  type        = string
}

# Configuration
variable "lambda_memory_size" {
  description = "Memory size in MB for Lambda functions"
  type        = number
  default     = 256
}

variable "scraper_image_repository" {
  description = "ECR repository URL for the scraper image"
  type        = string
  default     = "public.ecr.aws/lambda/nodejs"
}

variable "scraper_image_tag" {
  description = "Tag for the scraper Docker image"
  type        = string
  default     = "20"
}

# Lambda S3 artifact keys
variable "lambda_api_handler_s3_key" {
  description = "S3 key for the API handler Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/api-handler/latest/api-handler.zip"
}

variable "lambda_dynamodb_sync_s3_key" {
  description = "S3 key for the DynamoDB sync Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/dynamodb-sync/latest/dynamodb-sync.zip"
}

variable "lambda_discover_studios_s3_key" {
  description = "S3 key for the discover studios Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/discover-studios/latest/discover-studios.zip"
}

variable "lambda_find_artists_s3_key" {
  description = "S3 key for the find artists Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/find-artists/latest/find-artists.zip"
}

variable "lambda_queue_scraping_s3_key" {
  description = "S3 key for the queue scraping Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/queue-scraping/latest/queue-scraping.zip"
}

variable "lambda_rotate_nat_gateway_eip_s3_key" {
  description = "S3 key for the rotate NAT gateway EIP Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/rotate-nat-gateway-eip/latest/rotate-nat-gateway-eip.zip"
}

variable "lambda_secret_rotation_s3_key" {
  description = "S3 key for the secret rotation Lambda deployment package"
  type        = string
  default     = "lambda-artifacts/secret-rotation/latest/secret-rotation.zip"
}

variable "lambda_deployment_version" {
  description = "Version identifier for the Lambda deployment (for tracking purposes)"
  type        = string
  default     = "latest"
}