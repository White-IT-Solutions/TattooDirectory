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
    infra_account_id   = string # Infrastructure account
    audit_account_id   = string # Audit account

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

variable "kms_key_replica_arn" {
  description = "ARN of the replica KMS key for cross-region replication"
  type        = string
  default     = null
}