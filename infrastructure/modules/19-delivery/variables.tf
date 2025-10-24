# =============================================================================
# DELIVERY MODULE VARIABLES
# =============================================================================

variable "context" {
  description = "A single object containing all shared configuration values."
  type = object({
    project_name      = string
    environment       = string
    name_prefix       = string
    aws_region        = string
    common_tags       = map(string)
    domain_name       = string
    allowed_countries = list(string)
  })
}

# S3 Bucket Inputs
variable "frontend_bucket_id" {
  description = "ID of the primary frontend S3 bucket."
  type        = string
}

variable "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the primary frontend S3 bucket."
  type        = string
}

variable "frontend_backup_bucket_id" {
  description = "ID of the backup frontend S3 bucket."
  type        = string
}

variable "frontend_backup_bucket_regional_domain_name" {
  description = "Regional domain name of the backup frontend S3 bucket."
  type        = string
}

# API Gateway Inputs
variable "api_gateway_id" {
  description = "ID of the API Gateway."
  type        = string
}

variable "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway."
  type        = string
}

# Security Inputs
variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL for CloudFront."
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "ARN of the ACM certificate for CloudFront."
  type        = string
  default     = null
}

# Logging Inputs
variable "access_logs_bucket_domain_name" {
  description = "Domain name of the access logs S3 bucket from the Audit Account."
  type        = string
}

# Route 53 Domain Names
variable "api_custom_domain_name" {
  description = "Custom domain name for API Gateway (if configured)"
  type        = string
  default     = ""
}

variable "api_custom_domain_zone_id" {
  description = "Hosted zone ID for API Gateway custom domain"
  type        = string
  default     = ""
}

# Certificate validation inputs
variable "certificate_domain_validation_options" {
  description = "Domain validation options from ACM certificate"
  type = list(object({
    domain_name           = string
    resource_record_name  = string
    resource_record_type  = string
    resource_record_value = string
  }))
  default = []
}