# =============================================================================
# SECURITY MONITORING MODULE VARIABLES
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
    infra_account_id          = string # Infrastructure account
    audit_account_id    = string # Audit account

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

# Module-specific variables
variable "kms_key_logs_arn" {
  description = "ARN of the logs KMS key for encryption"
  type        = string
}

# Security service identifiers
variable "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  type        = string
  default     = ""
}

# Monitoring configuration flags
variable "enable_guardduty_monitoring" {
  description = "Enable AWS GuardDuty findings monitoring. Requires guardduty_detector_id to be set."
  type        = bool
  default     = false
}

variable "enable_config_monitoring" {
  description = "Enable AWS Config compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_cloudtrail_monitoring" {
  description = "Enable CloudTrail error monitoring"
  type        = bool
  default     = true
}

# Log group name for CloudTrail security queries
variable "cloudtrail_log_group_name" {
  description = "Name of the CloudTrail log group for security monitoring"
  type        = string
  default     = ""
}