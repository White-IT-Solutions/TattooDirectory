# =============================================================================
# API MODULE VARIABLES
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
variable "api_gateway_log_group_arn" {
  description = "ARN of the API Gateway CloudWatch log group from the Security Account"
  type        = string
}

variable "api_cors_allowed_origins" {
  description = "List of allowed origins for CORS configuration"
  type        = list(string)
  default     = ["*"]
}

# Lambda function details
variable "api_handler_lambda_invoke_arn" {
  description = "Invoke ARN of the API handler Lambda function"
  type        = string
}

variable "api_handler_lambda_function_name" {
  description = "Name of the API handler Lambda function"
  type        = string
}

# Optional domain configuration
variable "api_certificate_arn" {
  description = "ARN of the ACM certificate for the API custom domain"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for the domain"
  type        = string
  default     = ""
}