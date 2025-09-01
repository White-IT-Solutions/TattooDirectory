# =============================================================================
# GOVERNANCE MODULE VARIABLES
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
    infra_account_id         = string

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
  default     = false
}

variable "enable_config_remediation" {
  description = "Whether AWS Config automatic remediation is enabled"
  type        = bool
  default     = false
}

variable "kms_key_main_arn" {
  description = "ARN of the main KMS key for encryption"
  type        = string
}

variable "kms_key_logs_arn" {
  description = "ARN of the logs KMS key for CloudWatch logs encryption"
  type        = string
}

# IAM role ARNs
variable "config_service_role_arn" {
  description = "ARN of the AWS Config service role"
  type        = string
  default     = ""
}

variable "config_remediation_role_arn" {
  description = "ARN of the AWS Config remediation role"
  type        = string
  default     = ""
}

variable "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail CloudWatch logs role"
  type        = string
  default     = ""
}

# Resource references
variable "config_bucket_name" {
  description = "Name of the S3 bucket for AWS Config (from Audit Account)"
  type        = string
  default     = ""
}

variable "cloudtrail_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail (from Audit Account)"
  type        = string
  default     = ""
}

variable "cloudtrail_bucket_arn" {
  description = "ARN of the S3 bucket for CloudTrail (from Audit Account)"
  type        = string
  default     = ""
}

variable "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket for CloudTrail data events"
  type        = string
}

variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs for CloudTrail data events"
  type        = list(string)
  default     = []
}