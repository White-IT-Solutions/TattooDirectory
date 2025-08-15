# =============================================================================
# SEARCH MODULE VARIABLES
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
  description = "List of private subnet IDs for OpenSearch VPC configuration"
  type        = list(string)
}

variable "opensearch_security_group_id" {
  description = "ID of the security group for OpenSearch"
  type        = string
}

variable "opensearch_master_password" {
  description = "Password for OpenSearch master user"
  type        = string
  sensitive   = true
}

variable "opensearch_instance_type" {
  description = "Instance type for OpenSearch data nodes"
  type        = string
  default     = "t3.small.search"
}

variable "opensearch_instance_count" {
  description = "Number of data nodes in the OpenSearch cluster"
  type        = number
  default     = 1
}

variable "opensearch_master_instance_type" {
  description = "Instance type for OpenSearch dedicated master nodes"
  type        = string
  default     = "t3.small.search"
  nullable    = true
}

variable "opensearch_master_instance_count" {
  description = "Number of dedicated master nodes in the OpenSearch cluster. Set to null to disable dedicated master nodes."
  type        = number
  default     = null
  nullable    = true
}

variable "lambda_role_arns" {
  description = "List of Lambda role ARNs that need access to OpenSearch"
  type        = list(string)
  default     = []
}