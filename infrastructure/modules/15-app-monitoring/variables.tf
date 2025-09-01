# =============================================================================
# APP MONITORING MODULE VARIABLES
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
    infra_account_id         = string

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

# Resource identifiers for monitoring
variable "api_gateway_id" {
  description = "ID of the API Gateway"
  type        = string
}

variable "lambda_function_names" {
  description = "Map of Lambda function names"
  type        = map(string)
}

variable "main_table_name" {
  description = "Name of the main DynamoDB table"
  type        = string
}

variable "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "step_functions_state_machine_name" {
  description = "Name of the Step Functions state machine"
  type        = string
}

# Log group names for CloudWatch Insights
variable "api_gateway_log_group_name" {
  description = "Name of the API Gateway log group"
  type        = string
}

variable "lambda_log_group_names" {
  description = "List of Lambda function log group names"
  type        = list(string)
  default     = []
}