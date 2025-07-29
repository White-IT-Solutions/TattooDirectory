
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"

  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format: us-east-1, eu-west-2, etc."
  }
}

# Create environment-specific configurations
locals {
  environment_config = {
    dev = {
      opensearch_instance_count = 1
      lambda_memory_size       = 256
      enable_deletion_protection = false
      enable_detailed_monitoring = false
      log_retention_days         = 14
      backup_enabled             = false
    }
    prod = {
      opensearch_instance_count = 2
      lambda_memory_size       = 512
      enable_deletion_protection = true
      enable_detailed_monitoring = true
      log_retention_days         = 90
      backup_enabled             = true
    }
  }
}
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tattoo-artist-directory"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }

  validation {
    condition     = length(var.project_name) <= 30
    error_message = "Project name must be 30 characters or less."
  }
}

variable "allowed_countries" {
  description = "List of country codes allowed to access the CloudFront distribution"
  type        = list(string)
  default     = ["GB"]

  validation {
    condition = alltrue([
      for country in var.allowed_countries : can(regex("^[A-Z]{2}$", country))
    ])
    error_message = "Country codes must be 2-letter uppercase ISO country codes."
  }
}

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""

  validation {
    condition = var.notification_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address or empty string."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
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