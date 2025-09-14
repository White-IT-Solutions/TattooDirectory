# =============================================================================
# BACKUP MODULE VARIABLES
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
variable "backup_enabled" {
  description = "Whether AWS Backup is enabled"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

variable "kms_key_log_archive_arn" {
  description = "ARN of the KMS key in the Log Archive account for encryption"
  type        = string
}

variable "kms_key_log_archive_replica_arn" {
  description = "ARN of the replica KMS key in the Log Archive account for cross-region backups"
  type        = string
  default     = null
}

variable "backup_role_arn" {
  description = "ARN of the AWS Backup service role"
  type        = string
}

# Resource ARNs to backup
variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs to backup"
  type        = list(string)
  default     = []
}

variable "ecs_cluster_arn" {
  description = "ARN of the ECS cluster to backup"
  type        = string
}

# Notification configuration
variable "backup_notification_topic_arn" {
  description = "ARN of the SNS topic for backup notifications"
  type        = string
  default     = ""
}