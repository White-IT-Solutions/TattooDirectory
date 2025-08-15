# =============================================================================
# IAM MODULE VARIABLES
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
    account_id         = string

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

# Module-specific variables - ARNs from other modules
variable "main_table_arn" {
  description = "ARN of the main DynamoDB table"
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

variable "scraping_queue_arn" {
  description = "ARN of the SQS scraping queue"
  type        = string
  default     = ""
}

variable "config_bucket_arn" {
  description = "ARN of the AWS Config S3 bucket"
  type        = string
  default     = ""
}

# Lambda function ARNs (will be provided by compute module)
variable "lambda_function_arns" {
  description = "Map of Lambda function ARNs"
  type = object({
    discover_studios = string
    find_artists     = string
    queue_scraping   = string
  })
  default = {
    discover_studios = ""
    find_artists     = ""
    queue_scraping   = ""
  }
}

# Configuration flags
variable "backup_enabled" {
  description = "Whether AWS Backup is enabled"
  type        = bool
  default     = false
}

variable "enable_config" {
  description = "Whether AWS Config is enabled"
  type        = bool
  default     = false
}

# S3 Replication variables
variable "s3_replication_source_bucket_arns" {
  description = "List of S3 bucket ARNs in the primary region that are sources for replication"
  type        = list(string)
  default     = []
}

variable "s3_replication_destination_bucket_arns" {
  description = "List of S3 bucket ARNs in the replica region that are destinations for replication"
  type        = list(string)
  default     = []
}

variable "kms_key_replica_arn" {
  description = "ARN of the replica KMS key for cross-region replication"
  type        = string
  default     = null
}