# Local values for the application module

locals {
  # Environment-specific configurations
  environment_config = {
    dev = {
      opensearch_instance_count  = 1
      opensearch_instance_type   = "t3.micro.search"
      opensearch_master_instance_count = null
      opensearch_master_instance_type  = null
      lambda_memory_size         = 256
      enable_deletion_protection = false
      enable_advanced_monitoring = false
      log_retention_days         = 14
      backup_enabled             = false
      nat_gateway_count          = 1 # Single NAT gateway for dev
      enable_conformance_packs   = false
      enable_config_remediation  = false
      enable_cloudtrail_insights = false
    }
    prod = {
      opensearch_instance_count  = 2
      opensearch_instance_type   = "t3.small.search"
      opensearch_master_instance_count = 3                 # Recommended minimum for production to maintain quorum
      opensearch_master_instance_type  = "t3.small.search" # A cost-effective choice for master nodes
      lambda_memory_size         = 512
      enable_deletion_protection = true
      enable_advanced_monitoring = true
      log_retention_days         = 90
      backup_enabled             = true
      nat_gateway_count          = 2 # Multi-AZ NAT gateways for prod
      enable_conformance_packs   = true
      enable_config_remediation  = true
      enable_cloudtrail_insights = true
    }
  }

  # Standardised Naming Convention
  name_prefix = "${var.project_name}-${var.environment}"

  # Current environment configuration
  config = local.environment_config[var.environment]

  # Availability zones mapping
  availability_zones = {
    "a" = data.aws_availability_zones.available.names[0]
    "b" = data.aws_availability_zones.available.names[1]
  }

  # Common tags applied to all resources
  common_tags = merge({
    Project            = var.project_name
    Environment        = var.environment
    ManagedBy          = var.managed_by
    CostCentre         = var.cost_centre
    Owner              = var.owner_email
    Version            = var.app_version
    DataClassification = var.default_data_classification
  }, var.common_tags)

  # Lambda environment variables
  lambda_environment_vars = {
    ENVIRONMENT                         = var.environment
    PROJECT_NAME                        = var.project_name
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
  }
}