# =============================================================================
# CENTRAL SECURITY MODULE VARIABLES
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
    lambda_environment_vars         = map(string)
  })
  nullable = false
}

variable "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch logs encryption"
  type        = string
}

variable "log_auditor_principal_arns" {
  description = "A list of IAM principal ARNs allowed to assume the LogAuditorRole."
  type        = list(string)
  default     = []
}

variable "log_archive_bucket_arns" {
  description = "A map of S3 bucket ARNs from the log-storage module."
  type        = map(string)
  default     = {}
}

variable "log_archive_kms_key_arn" {
  description = "The ARN of the KMS key used for encrypting logs in the Log Archive account."
  type        = string
  default     = ""
}