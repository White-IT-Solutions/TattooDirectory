# /environments/prod/variables.tf

# ------------------------------------------------------------------------------
# General Project Configuration
# ------------------------------------------------------------------------------

variable "project_name" {
  description = "Project name for resource naming"
  type        = string

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

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be one of: dev, prod."
  }
}

variable "app_version" {
  description = "The application version, e.g., a git commit hash or release tag."
  type        = string
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

# ------------------------------------------------------------------------------
# AWS Provider & Region Configuration
# ------------------------------------------------------------------------------

variable "infra_account_id" {
  description = "AWS Account ID for the Infrastructure Account"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.infra_account_id))
    error_message = "AWS Account ID must be a 12-digit number."
  }
}

variable "audit_account_id" {
  description = "AWS Account ID for the Audit Account"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.security_account_id))
    error_message = "AWS Account ID must be a 12-digit number."
  }
}

variable "log_archive_account_id" {
  description = "AWS Account ID for the Log Archive Account"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.audit_account_id))
    error_message = "AWS Account ID must be a 12-digit number."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format: us-east-1, eu-west-2, etc."
  }
}

variable "replica_aws_region" {
  description = "AWS region for cross-region replication (e.g., for CloudTrail, S3 backups)"
  type        = string
  default     = "eu-west-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.replica_aws_region))
    error_message = "AWS replica region must be in the format: us-east-1, eu-west-2, etc."
  }
}

# ------------------------------------------------------------------------------
# Tagging & Metadata
# ------------------------------------------------------------------------------

variable "managed_by" {
  description = "The management tool for a given resource."
  type        = string
  default     = "Terraform"
}

variable "owner_email" {
  description = "The email of the resource owner for billing and operational contact."
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.owner_email))
    error_message = "Must be a valid email address."
  }
}

variable "cost_centre" {
  description = "The chargeable cost centre for resources."
  type        = string
}

variable "default_data_classification" {
  description = "The default data classification for resources."
  type        = string
  default     = "Internal"
}

variable "common_tags" {
  # Specifies the data type. In this case, it's a map with string values.
  type = map(string)

  # A human-readable description of what the variable is for.
  description = "A map of common tags to apply to all resources. These tags will be merged with the default tags and will override them if a key is duplicated."

  # An optional default value. Setting this to an empty map is a best practice.
  # It allows the variable to be optional and prevents errors if it's not provided.
  default = {}
}

# ------------------------------------------------------------------------------
# Network Configuration
# ------------------------------------------------------------------------------

variable "nat_gateway_count" {
  description = "Number of NAT gateways to create."
  type        = number
  validation {
    condition     = var.nat_gateway_count >= 0
    error_message = "NAT gateway count must be a non-negative number."
  }
}

# ------------------------------------------------------------------------------
# Security & Compliance
# ------------------------------------------------------------------------------

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
  # No default, should be set in a .tfvars file

  validation {
    condition     = var.notification_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
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

variable "enable_conformance_packs" {
  description = "Flag to enable AWS Config conformance packs for compliance checking."
  type        = bool
  default     = true
}

variable "enable_config_remediation" {
  description = "Flag to enable automatic remediation for non-compliant AWS Config rules."
  type        = bool
  default     = false # Use caution enabling this in dev
}

variable "enable_cloudtrail_insights" {
  description = "Flag to enable CloudTrail Insights for detecting unusual API activity."
  type        = bool
  default     = true
}

# ------------------------------------------------------------------------------
# Service-Specific Configuration
# ------------------------------------------------------------------------------

variable "api_cors_allowed_origins" {
  description = "A list of allowed origins for API Gateway CORS configuration."
  type        = list(string)
  default     = [] # Should be explicitly set in prod.tfvars, e.g., ["https://yourapp.com"]
}

variable "scraper_image_tag" {
  description = "The unique Docker image tag for the Fargate scraper task. It is strongly recommended to use the Git commit SHA for this value to ensure traceability and true immutability."
  type        = string
  # No default value is provided to ensure a specific tag is always supplied during deployment.
}

variable "lambda_memory_size" {
  description = "The amount of memory in MB to allocate to the Lambda functions."
  type        = number
  default     = 256
}

variable "enable_deletion_protection" {
  description = "Flag to enable deletion protection on critical resources like databases."
  type        = bool
  default     = true # Should always be true for production
}

variable "opensearch_instance_count" {
  description = "The number of data nodes in the OpenSearch cluster."
  type        = number
  default     = 1
}

variable "opensearch_instance_type" {
  description = "The instance type for the OpenSearch data nodes."
  type        = string
  default     = "t3.small.search"
}

variable "opensearch_master_instance_count" {
  description = "The number of dedicated master nodes in the OpenSearch cluster. Set to null to disable dedicated master nodes."
  type        = number
  default     = 0 # For dev, master-eligible data nodes are sufficient
  nullable    = true
}

variable "opensearch_master_instance_type" {
  description = "The instance type for the OpenSearch dedicated master nodes. Required if master_instance_count is not null."
  type        = string
  default     = "t3.small.search"
  nullable    = true
}

# ------------------------------------------------------------------------------
# Operational Configuration
# ------------------------------------------------------------------------------

variable "backup_enabled" {
  description = "Flag to enable/disable the AWS Backup plan."
  type        = bool
  default     = true
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

variable "log_retention_days" {
  description = "The number of days to retain CloudWatch logs."
  type        = number
  default     = 14
}

variable "enable_advanced_monitoring" {
  description = "Flag to enable enhanced/detailed monitoring for services like EC2 & OpenSearch."
  type        = bool
  default     = true
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for critical resources (CloudTrail logs, backups)"
  type        = bool
  default     = true # Should be true for production disaster recovery
}