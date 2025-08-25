# /environments/dev/main.tf

# Fetch the caller identity once for the entire environment.
# This is used in locals.tf to get the account ID.
# Note: In a multi-account setup, this now identifies the DEPLOYMENT account, not the target account.
data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# Foundation Layer
# Contains foundational resources that other modules depend on
# ------------------------------------------------------------------------------

module "foundation" {
  source  = "../../modules/01-foundation"
  context = local.context

  providers = {
    aws.replica = aws.replica
  }
}

# ------------------------------------------------------------------------------
# Security Foundation Layer
# Contains foundational security resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "security_foundation" {
  source  = "../../modules/security-foundation"
  context = local.context

  # This module is deployed to the Security Account
  providers = {
    aws = aws.security
  }
}

# ------------------------------------------------------------------------------
# Audit Foundation Layer
# Contains foundational audit resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "audit_foundation" {
  source  = "../../modules/audit-foundation"
  context = local.context

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit
  }
}

# ------------------------------------------------------------------------------
# Central Logging Layer
# Contains centralized logging resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "central_logging" {
  source  = "../../modules/central-logging"
  context = local.context

  kms_key_logs_arn    = module.security_foundation.kms_key_logs_arn
  waf_logs_bucket_arn = module.log_storage.waf_logs_bucket_arn
  kms_key_audit_arn   = module.audit_foundation.kms_key_audit_arn

  # This module is deployed to the Security Account
  providers = {
    aws = aws.security
  }
}

# ------------------------------------------------------------------------------
# Networking Layer
# Contains all networking resources
# ------------------------------------------------------------------------------

module "networking" {
  source  = "../../modules/02-networking"
  context = local.context

  kms_key_logs_arn          = module.security_foundation.kms_key_logs_arn
  vpc_flow_logs_bucket_arn  = module.log_storage.vpc_flow_logs_bucket_arn
  availability_zones        = module.foundation.availability_zones

  providers = {
    aws.us_east_1 = aws.us_east_1
  }
}

# ------------------------------------------------------------------------------
# Central Security Layer
# Contains centralized security resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "central_security" {
  source  = "../../modules/central-security"
  context = local.context

  kms_key_logs_arn = module.security_foundation.kms_key_logs_arn

  # This module is deployed to the Security Account
  providers = {
    aws = aws.security
  }
}

# ------------------------------------------------------------------------------
# App Security Layer
# Contains application-level security resources
# ------------------------------------------------------------------------------

module "app_security" {
  source  = "../../modules/app-security"
  context = local.context

  kms_key_main_arn           = module.foundation.kms_key_main_arn
  opensearch_master_password = module.foundation.opensearch_master_password
  app_secrets_password       = module.foundation.app_secrets_password
  waf_firehose_arn           = module.central_logging.waf_firehose_arn
}

# ------------------------------------------------------------------------------
# Log Storage Layer
# Contains audit and log storage resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "log_storage" {
  source  = "../../modules/log-storage"
  context = local.context

  kms_key_audit_arn         = module.audit_foundation.kms_key_audit_arn
  kms_key_audit_replica_arn = module.foundation.kms_key_replica_arn
  random_suffix             = module.foundation.random_suffix
  s3_replication_role_arn   = module.iam.s3_replication_role_arn

  # This module is deployed to the Audit Account
  providers = {
    aws         = aws.audit
    aws.replica = aws.audit_replica
  }
}

# ------------------------------------------------------------------------------
# App Storage Layer
# Contains application storage resources
# ------------------------------------------------------------------------------

module "app_storage" {
  source  = "../../modules/app-storage"
  context = local.context

  kms_key_main_arn               = module.foundation.kms_key_main_arn
  kms_key_replica_arn            = module.foundation.kms_key_replica_arn
  random_suffix                  = module.foundation.random_suffix
  enable_deletion_protection     = var.enable_deletion_protection
  waf_web_acl_arn                = module.app_security.waf_web_acl_arn
  cloudfront_certificate_arn     = module.networking.cloudfront_certificate_arn
  s3_replication_role_arn        = module.iam.s3_replication_role_arn
  api_gateway_id                 = module.api.api_id
  api_gateway_endpoint           = module.api.api_endpoint
  access_logs_bucket_id          = module.log_storage.access_logs_bucket_id
  access_logs_bucket_domain_name = module.log_storage.access_logs_bucket_domain_name

  providers = {
    aws.replica = aws.replica
  }
}

# ------------------------------------------------------------------------------
# Search Layer
# Contains OpenSearch resources
# ------------------------------------------------------------------------------

module "search" {
  source  = "../../modules/05-search"
  context = local.context

  kms_key_main_arn                 = module.foundation.kms_key_main_arn
  kms_key_logs_arn                 = module.security_foundation.kms_key_logs_arn
  private_subnet_ids               = module.networking.private_subnet_ids
  opensearch_security_group_id     = module.networking.opensearch_security_group_id
  opensearch_master_password       = module.foundation.opensearch_master_password
  opensearch_instance_type         = var.opensearch_instance_type
  opensearch_instance_count        = var.opensearch_instance_count
  opensearch_master_instance_type  = var.opensearch_master_instance_type
  opensearch_master_instance_count = var.opensearch_master_instance_count
}

# ------------------------------------------------------------------------------
# IAM Layer
# Contains all IAM roles and policies
# ------------------------------------------------------------------------------

module "iam" {
  source  = "../../modules/06-iam"
  context = local.context

  main_table_arn        = module.app_storage.main_table_arn
  opensearch_domain_arn = module.search.domain_arn
  app_secrets_arn       = module.app_security.app_secrets_arn
  scraping_queue_arn    = module.compute.scraping_queue_arn
  config_bucket_arn     = module.log_storage.config_bucket_arn
  backup_enabled        = var.backup_enabled
  enable_config         = true
  kms_key_replica_arn   = module.foundation.kms_key_replica_arn
  s3_replication_source_bucket_arns = concat(
    [for k, v in module.app_storage.s3_bucket_arns : v],
    [for k, v in module.log_storage.s3_bucket_arns : v]
  )
  s3_replication_destination_bucket_arns = concat(
    [for k, v in module.app_storage.s3_bucket_arns : "${replace(v, module.foundation.random_suffix, "replica-${module.foundation.random_suffix}")}"],
    [for k, v in module.log_storage.s3_bucket_arns : "${replace(v, module.foundation.random_suffix, "replica-${module.foundation.random_suffix}")}"]
  )
}

# ------------------------------------------------------------------------------
# Compute Layer
# Contains Lambda functions, ECS, and Step Functions
# ------------------------------------------------------------------------------

module "compute" {
  source  = "../../modules/07-compute"
  context = local.context

  kms_key_main_arn                  = module.foundation.kms_key_main_arn
  kms_key_logs_arn                  = module.security_foundation.kms_key_logs_arn
  private_subnet_ids                = module.networking.private_subnet_ids
  lambda_internet_security_group_id = module.networking.lambda_internet_security_group_id
  lambda_internal_security_group_id = module.networking.lambda_internal_security_group_id
  fargate_security_group_id         = module.networking.fargate_security_group_id

  # IAM roles
  lambda_api_role_arn                    = module.iam.lambda_api_role_arn
  lambda_sync_role_arn                   = module.iam.lambda_sync_role_arn
  lambda_discover_studios_role_arn       = module.iam.lambda_discover_studios_role_arn
  lambda_find_artists_role_arn           = module.iam.lambda_find_artists_role_arn
  lambda_queue_scraping_role_arn         = module.iam.lambda_queue_scraping_role_arn
  lambda_rotate_nat_gateway_eip_role_arn = module.iam.lambda_rotate_nat_gateway_eip_role_arn
  step_functions_role_arn                = module.iam.step_functions_role_arn
  ecs_task_execution_role_arn            = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn                      = module.iam.ecs_task_role_arn

  # Resource references
  main_table_name     = module.app_storage.main_table_name
  opensearch_endpoint = module.search.domain_endpoint
  app_secrets_arn     = module.app_security.app_secrets_arn
  lambda_memory_size  = var.lambda_memory_size
  scraper_image_tag   = var.scraper_image_tag
}

# ------------------------------------------------------------------------------
# API Layer
# Contains API Gateway resources
# ------------------------------------------------------------------------------

module "api" {
  source  = "../../modules/08-api"
  context = local.context

  api_gateway_log_group_arn        = module.central_logging.api_gateway_log_group_arn # This now comes from the central_logging module
  api_cors_allowed_origins         = var.api_cors_allowed_origins
  api_handler_lambda_invoke_arn    = module.compute.api_handler_lambda_invoke_arn
  api_handler_lambda_function_name = module.compute.api_handler_lambda_function_name
  api_certificate_arn              = "" # TODO: Add API certificate when needed
  hosted_zone_id                   = "" # TODO: Add Route 53 hosted zone when needed
}

# ------------------------------------------------------------------------------
# Security Monitoring Layer
# Contains security monitoring resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "security_monitoring" {
  source  = "../../modules/security-monitoring"
  context = local.context

  kms_key_logs_arn             = module.security_foundation.kms_key_logs_arn
  guardduty_detector_id        = module.central_security.guardduty_detector_id
  enable_config_monitoring     = true
  enable_cloudtrail_monitoring = true
  security_log_group_names     = [] # TODO: Add CloudTrail log group names when available

  # This module is deployed to the Security Account
  providers = {
    aws = aws.security
  }
}

# ------------------------------------------------------------------------------
# App Monitoring Layer
# Contains application monitoring resources
# ------------------------------------------------------------------------------

module "app_monitoring" {
  source  = "../../modules/app-monitoring"
  context = local.context

  kms_key_main_arn                  = module.foundation.kms_key_main_arn
  api_gateway_id                    = module.api.api_id
  lambda_function_names             = module.compute.lambda_function_names
  main_table_name                   = module.app_storage.main_table_name
  opensearch_domain_name            = module.search.domain_name
  ecs_cluster_name                  = module.compute.ecs_cluster_name
  step_functions_state_machine_name = module.compute.step_functions_state_machine_name
  api_gateway_log_group_name        = module.central_logging.api_gateway_log_group_name # This now comes from the central_logging module
}

# ------------------------------------------------------------------------------
# Backup Layer
# Contains backup and disaster recovery resources
# ------------------------------------------------------------------------------

module "backup" {
  source  = "../../modules/10-backup"
  context = local.context

  backup_enabled                = var.backup_enabled
  backup_retention_days         = var.backup_retention_days
  kms_key_audit_arn             = module.audit_foundation.kms_key_audit_arn
  kms_key_audit_replica_arn     = module.foundation.kms_key_replica_arn
  backup_role_arn               = module.iam.backup_role_arn
  dynamodb_table_arns           = values(module.app_storage.dynamodb_table_arns)
  ecs_cluster_arn               = module.compute.ecs_cluster_arn
  backup_notification_topic_arn = module.app_monitoring.critical_alerts_topic_arn

  # This module is deployed to the Audit Account
  providers = {
    aws         = aws.audit
    aws.replica = aws.audit_replica
  }
}

# ------------------------------------------------------------------------------
# Governance Layer
# Contains governance and compliance resources
# ------------------------------------------------------------------------------

module "governance" {
  source  = "../../modules/11-governance"
  context = local.context

  enable_config                   = true
  enable_config_remediation       = false # Use caution enabling this in dev
  kms_key_main_arn                = module.foundation.kms_key_main_arn
  kms_key_logs_arn                = module.security_foundation.kms_key_logs_arn
  config_role_arn                 = module.iam.config_role_arn
  config_remediation_role_arn     = "" # TODO: Add remediation role when needed
  cloudtrail_role_arn             = "" # TODO: Add CloudTrail role when needed
  config_bucket_name              = module.log_storage.config_bucket_id
  cloudtrail_bucket_name          = module.log_storage.cloudtrail_bucket_id
  cloudtrail_bucket_arn           = module.log_storage.cloudtrail_bucket_arn
  frontend_bucket_arn             = module.app_storage.frontend_bucket_arn
  dynamodb_table_arns             = values(module.app_storage.dynamodb_table_arns)
  security_notification_topic_arn = module.security_monitoring.security_alerts_topic_arn

  # This module remains in the Infrastructure Account
}

# ------------------------------------------------------------------------------
# Audit Governance Layer
# Contains audit governance resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "audit_governance" {
  source  = "../../modules/audit-governance"
  context = local.context

  enable_config              = true
  s3_public_access_rule_name = module.governance.s3_public_access_rule_name
  dynamodb_encryption_rule_name  = module.governance.dynamodb_encryption_rule_name
  lambda_public_access_rule_name = module.governance.lambda_public_access_rule_name
  cloudfront_https_rule_name     = module.governance.cloudfront_https_rule_name

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit
  }
}
