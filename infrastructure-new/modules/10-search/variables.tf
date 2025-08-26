# =============================================================================
# SEARCH MODULE VARIABLES
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
    account_id          = string # Infrastructure account
    security_account_id = string
    audit_account_id    = string

    # Common Configuration & Metadata
    common_tags                     = map(string)
    notification_email              = string
    allowed_countries               = list(string)
    enable_cross_region_replication = bool
    enable_advanced_monitoring      = bool
    log_retention_days              = number
    domain_name                     = string
    lambda_environment_vars         = map(string)
  })
  nullable = false
}

# Module-specific variables
variable "kms_key_main_arn" {
  description = "ARN of the main KMS key for encrypting OpenSearch data at rest."
  type        = string
}

variable "kms_key_logs_arn" {
  description = "ARN of the logs KMS key for encrypting OpenSearch logs."
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs to launch the OpenSearch cluster in."
  type        = list(string)
}

variable "opensearch_security_group_id" {
  description = "The ID of the security group to associate with the OpenSearch domain's VPC endpoint."
  type        = string
}

variable "opensearch_master_password" {
  description = "The password for the master user of the OpenSearch domain."
  type        = string
  sensitive   = true
}

variable "opensearch_instance_type" {
  description = "The instance type for the OpenSearch data nodes."
  type        = string
}

variable "opensearch_instance_count" {
  description = "The number of data nodes in the OpenSearch cluster."
  type        = number
}

variable "opensearch_master_instance_type" {
  description = "The instance type for the OpenSearch dedicated master nodes."
  type        = string
  nullable    = true
}

variable "opensearch_master_instance_count" {
  description = "The number of dedicated master nodes in the OpenSearch cluster."
  type        = number
  nullable    = true
}

variable "lambda_role_arns" {
  description = "List of Lambda role ARNs that need access to the OpenSearch domain."
  type        = list(string)
  default     = []
}