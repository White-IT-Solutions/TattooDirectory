# Local values for the 'dev' environment root module.

locals {
  # Common tags are defined once and incorporated into the context object.
  # This merges the default tags with any additional tags provided in the `var.common_tags`.
  common_tags = merge({
    Project            = var.project_name
    Environment        = var.environment
    ManagedBy          = var.managed_by
    CostCentre         = var.cost_centre
    Owner              = var.owner_email
    Version            = var.app_version
    DataClassification = var.default_data_classification
  }, var.common_tags)

  # The single context object to be passed to all child modules.
  # It encapsulates all shared configuration.
  context = {
    # Core Identifiers
    project_name = var.project_name
    environment  = var.environment
    name_prefix  = "${var.project_name}-${var.environment}"

    # AWS Specific
    aws_region         = var.aws_region
    replica_aws_region = var.replica_aws_region
    account_id         = data.aws_caller_identity.current.account_id

    # Common Configuration & Metadata
    common_tags                     = local.common_tags
    notification_email              = var.notification_email
    allowed_countries               = var.allowed_countries
    enable_cross_region_replication = var.enable_cross_region_replication
    enable_advanced_monitoring      = var.enable_advanced_monitoring
    log_retention_days              = var.log_retention_days
    domain_name                     = var.domain_name

    # Lambda environment variables that can be shared across functions
    lambda_environment_vars = {
      ENVIRONMENT                         = var.environment
      PROJECT_NAME                        = var.project_name
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }
}