# =============================================================================
# SECURITY FOUNDATION MODULE VARIABLES
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
    account_id          = string # Infra account
    security_account_id = string # Security account

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