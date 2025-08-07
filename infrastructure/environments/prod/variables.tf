# Environment-specific variable declarations for the Production environment.
# These variables override the defaults set in the application module.

variable "project_name" {
  description = "The name of the project, used for resource naming and tagging."
  type        = string
  default     = "tattoo-artist-directory"
}

variable "notification_email" {
  description = "A mandatory email address for receiving CloudWatch alarm notifications for the production environment."
  type        = string
  # No default value to ensure it's explicitly set for production.
}

variable "owner_email" {
  description = "The mandatory email of the resource owner for billing and operational contact in production."
  type        = string
  # No default value to ensure it's explicitly set for production.
}

variable "aws_region" {
  description = "The AWS region where production resources will be deployed."
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "The deployment environment name."
  type        = string
  default     = "prod"
}

variable "replica_aws_region" {
  description = "The AWS region for disaster recovery resources (e.g., S3 replication)."
  type        = string
  default     = "eu-west-1"
}

variable "app_version" {
  description = "The specific application version (e.g., git tag) to be deployed to production."
  type        = string
  # No default value to ensure a specific version is always provided for production deployments.
}

variable "default_data_classification" {
  description = "The default data classification for resources in production."
  type        = string
  default     = "Confidential"
}

variable "scraper_image_tag" {
  description = "The specific Docker image tag for the Fargate scraper task. Using 'latest' is not recommended for production."
  type        = string
  # No default value to ensure a specific image tag is provided for production.
}

variable "backup_retention_days" {
  description = "Number of days to retain backups for production data."
  type        = number
  default     = 35 # A longer retention for production is recommended.
}
