# Environment-specific variable declarations for the Development environment.
# These variables override the defaults set in the application module.

variable "project_name" {
  description = "The name of the project, used for resource naming and tagging."
  type        = string
  default     = "tattoo-artist-directory"
}

variable "notification_email" {
  description = "A mandatory email address for receiving CloudWatch alarm notifications for the development environment."
  type        = string
  # No default value to ensure it's explicitly set for development.
}

variable "owner_email" {
  description = "The mandatory email of the resource owner for billing and operational contact in development."
  type        = string
  # No default value to ensure it's explicitly set for development.
}

variable "aws_region" {
  description = "The AWS region where development resources will be deployed."
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "The deployment environment name."
  type        = string
  default     = "dev"
}

variable "replica_aws_region" {
  description = "The AWS region for disaster recovery resources (e.g., S3 replication)."
  type        = string
  default     = "eu-west-1"
}

variable "app_version" {
  description = "The application version to be deployed to development. Defaults to 'dev-build'."
  type        = string
  default     = "dev-build"
}

variable "default_data_classification" {
  description = "The default data classification for resources in development."
  type        = string
  default     = "Internal"
}

variable "scraper_image_tag" {
  description = "The Docker image tag for the Fargate scraper task. 'latest' is acceptable for development."
  type        = string
  default     = "latest"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups for development data. Backups are disabled by default in dev."
  type        = number
  default     = 7 # Matches the module default, but made explicit here.
}
