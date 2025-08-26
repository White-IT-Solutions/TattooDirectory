# =============================================================================
# AUDIT GOVERNANCE MODULE VARIABLES
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
    account_id          = string # Infrastructure Account ID
    security_account_id = string # Security Account ID
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
variable "enable_config" {
  description = "Whether AWS Config is enabled"
  type        = bool
  default     = true
}

variable "s3_public_access_rule_name" {
  description = "Name of the AWS Config rule for S3 public access."
  type        = string
  default     = ""
}

variable "dynamodb_encryption_rule_name" {
  description = "Name of the AWS Config rule for DynamoDB encryption."
  type        = string
  default     = ""
}

variable "lambda_public_access_rule_name" {
  description = "Name of the AWS Config rule for Lambda public access."
  type        = string
  default     = ""
}

variable "cloudfront_https_rule_name" {
  description = "Name of the AWS Config rule for CloudFront HTTPS viewer policy."
  type        = string
  default     = ""
}