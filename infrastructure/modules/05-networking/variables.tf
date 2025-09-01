# =============================================================================
# NETWORKING MODULE VARIABLES
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
    infra_account_id          = string # Infrastructure Account
    audit_account_id    = string # Audit Account

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
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
}

variable "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch logs encryption"
  type        = string
}

variable "vpc_flow_logs_bucket_arn" {
  description = "ARN of the VPC Flow Logs S3 bucket (from log-storage module in Audit Account)"
  type        = string
}