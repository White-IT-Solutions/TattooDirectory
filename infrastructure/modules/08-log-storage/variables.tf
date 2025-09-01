# =============================================================================
# LOG STORAGE MODULE VARIABLES
# =============================================================================

variable "context" {
  description = "A single object containing all shared configuration values."
  type = object({
    # Core Identifiers
    project_name = string
    environment  = string
    name_prefix  = string

    # AWS Specific
    aws_region          = string
    replica_aws_region  = string
    infra_account_id          = string # Infrastructure Account ID
    log_archive_account_id = string # Log Archive Account ID
    audit_account_id    = string # Audit Account ID

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
variable "random_suffix" {
  description = "Random suffix for unique resource naming"
  type        = string
}

variable "s3_replication_role_arn" {
  description = "ARN of the IAM role for S3 replication"
  type        = string
  default     = null
}