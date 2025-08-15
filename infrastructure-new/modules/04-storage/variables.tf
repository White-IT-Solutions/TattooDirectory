# =============================================================================
# STORAGE MODULE VARIABLES
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

variable "random_suffix" {
  description = "Random suffix for unique resource naming"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL for CloudFront"
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "ARN of the ACM certificate for CloudFront"
  type        = string
  default     = null
}

variable "kms_key_replica_arn" {
  description = "ARN of the replica KMS key for cross-region replication"
  type        = string
  default     = null
}

variable "s3_replication_role_arn" {
  description = "ARN of the IAM role for S3 replication"
  type        = string
  default     = null
}

variable "api_gateway_id" {
  description = "ID of the API Gateway"
  type        = string
}

variable "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway"
  type        = string
}