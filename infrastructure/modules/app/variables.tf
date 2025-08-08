#Common variables

variable "common_tags" {
  # Specifies the data type. In this case, it's a map with string values.
  type = map(string)

  # A human-readable description of what the variable is for.
  description = "A map of common tags to apply to all resources. These tags will be merged with the default tags and will override them if a key is duplicated."

  # An optional default value. Setting this to an empty map is a best practice.
  # It allows the variable to be optional and prevents errors if it's not provided.
  default = {}
}

#Infrastructure variables

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

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be one of: dev, prod."
  }
}

variable "managed_by" {
  description = "The management tool for a given resource."
  type        = string
  default     = "Terraform"
}

variable "cost_centre" {
  description = "The chargeable cost centre for resources."
  type        = string
  default     = "Portfolio Project"
}

variable "owner_email" {
  description = "The email of the resource owner for billing and operational contact."
  type        = string
  default     = "joseph.white@example.com" # Replace with a real contact

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.owner_email))
    error_message = "Must be a valid email address."
  }
}

variable "app_version" {
  description = "The application version, e.g., a git commit hash or release tag."
  type        = string
  default     = "dev-build"
}

variable "default_data_classification" {
  description = "The default data classification for resources."
  type        = string
  default     = "Internal"
}

#Application variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format: us-east-1, eu-west-2, etc."
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
    condition     = var.notification_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
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

variable "scraper_image_tag" {
  description = "The Docker image tag for the Fargate scraper task."
  type        = string
  default     = "latest"
}

variable "domain_name" {
  description = "Custom domain name for the CloudFront distribution (optional)"
  type        = string
  default     = ""

  validation {
    condition     = var.domain_name == "" || can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\\.[a-zA-Z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format or empty string."
  }
}

variable "aws_replica_region" {
  description = "AWS region for cross-region replication (e.g., for CloudTrail, S3 backups)"
  type        = string
  default     = "eu-west-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_replica_region))
    error_message = "AWS replica region must be in the format: us-east-1, eu-west-2, etc."
  }
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for critical resources (CloudTrail logs, backups)"
  type        = bool
  default     = false
}