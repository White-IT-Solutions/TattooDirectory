# /environments/dev/main.tf

# Fetch the caller identity once for the entire environment.
# This is used in locals.tf to get the account ID.
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
# Networking Layer
# Contains all networking resources
# ------------------------------------------------------------------------------

module "networking" {
  source  = "../../modules/02-networking"
  context = local.context

  kms_key_logs_arn   = module.foundation.kms_key_logs_arn
  availability_zones = module.foundation.availability_zones

  providers = {
    aws.us_east_1 = aws.us_east_1
  }
}

# ------------------------------------------------------------------------------
# Security Layer
# Contains security-related resources
# ------------------------------------------------------------------------------

module "security" {
  source  = "../../modules/03-security"
  context = local.context

  kms_key_main_arn           = module.foundation.kms_key_main_arn
  opensearch_master_password = module.foundation.opensearch_master_password
  app_secrets_password       = module.foundation.app_secrets_password
  kms_key_logs_arn           = module.foundation.kms_key_logs_arn
}

# ------------------------------------------------------------------------------
# Storage Layer
# Contains storage resources
# ------------------------------------------------------------------------------

module "storage" {
  source  = "../../modules/04-storage"
  context = local.context

  kms_key_main_arn           = module.foundation.kms_key_main_arn
  kms_key_replica_arn        = module.foundation.kms_key_replica_arn
  random_suffix              = module.foundation.random_suffix
  enable_deletion_protection = var.enable_deletion_protection
  waf_web_acl_arn            = module.security.waf_web_acl_arn
  cloudfront_certificate_arn = module.networking.cloudfront_certificate_arn
  s3_replication_role_arn    = module.iam.s3_replication_role_arn
  api_gateway_id             = module.api.api_id
  api_gateway_endpoint       = module.api.api_endpoint
 
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
  kms_key_logs_arn                 = module.foundation.kms_key_logs_arn
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

  main_table_arn                         = module.storage.main_table_arn
  opensearch_domain_arn                  = module.search.domain_arn
  app_secrets_arn                        = module.security.app_secrets_arn
  scraping_queue_arn                     = module.compute.scraping_queue_arn
  config_bucket_arn                      = module.storage.config_bucket_arn
  backup_enabled                         = var.backup_enabled
  enable_config                          = true
  kms_key_replica_arn                    = module.foundation.kms_key_replica_arn
  s3_replication_source_bucket_arns      = [for k, v in module.storage.s3_bucket_arns : v if contains(["frontend", "frontend_backup", "config", "cloudtrail", "access_logs"], k)]
  s3_replication_destination_bucket_arns = [for k, v in module.storage.s3_bucket_arns : "${replace(v, module.foundation.random_suffix, "replica-${module.foundation.random_suffix}")}" if contains(["frontend", "frontend_backup", "config", "cloudtrail", "access_logs"], k)]
}

# ------------------------------------------------------------------------------
# Compute Layer
# Contains Lambda functions, ECS, and Step Functions
# ------------------------------------------------------------------------------

module "compute" {
  source  = "../../modules/07-compute"
  context = local.context

  kms_key_main_arn                  = module.foundation.kms_key_main_arn
  kms_key_logs_arn                  = module.foundation.kms_key_logs_arn
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
  main_table_name     = module.storage.main_table_name
  opensearch_endpoint = module.search.domain_endpoint
  app_secrets_arn     = module.security.app_secrets_arn
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

  kms_key_logs_arn                 = module.foundation.kms_key_logs_arn
  api_cors_allowed_origins         = var.api_cors_allowed_origins
  api_handler_lambda_invoke_arn    = module.compute.api_handler_lambda_invoke_arn
  api_handler_lambda_function_name = module.compute.api_handler_lambda_function_name
  api_certificate_arn              = "" # TODO: Add API certificate when needed
  hosted_zone_id                   = "" # TODO: Add Route 53 hosted zone when needed
}

# ------------------------------------------------------------------------------
# Monitoring Layer
# Contains monitoring and observability resources
# ------------------------------------------------------------------------------

module "monitoring" {
  source  = "../../modules/09-monitoring"
  context = local.context

  kms_key_main_arn                  = module.foundation.kms_key_main_arn
  kms_key_logs_arn                  = module.foundation.kms_key_logs_arn
  api_gateway_id                    = module.api.api_id
  lambda_function_names             = module.compute.lambda_function_names
  main_table_name                   = module.storage.main_table_name
  opensearch_domain_name            = module.search.domain_name
  ecs_cluster_name                  = module.compute.ecs_cluster_name
  step_functions_state_machine_name = module.compute.step_functions_state_machine_name
  api_gateway_log_group_name        = module.api.log_group_name
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
  kms_key_main_arn              = module.foundation.kms_key_main_arn
  kms_key_replica_arn           = module.foundation.kms_key_replica_arn
  backup_role_arn               = module.iam.backup_role_arn
  dynamodb_table_arns           = values(module.storage.dynamodb_table_arns)
  ecs_cluster_arn               = module.compute.ecs_cluster_arn
  backup_notification_topic_arn = module.monitoring.critical_alerts_topic_arn

  providers = {
    aws.replica = aws.replica
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
  kms_key_logs_arn                = module.foundation.kms_key_logs_arn
  random_suffix                   = module.foundation.random_suffix
  config_role_arn                 = module.iam.config_role_arn
  config_remediation_role_arn     = "" # TODO: Add remediation role when needed
  cloudtrail_role_arn             = "" # TODO: Add CloudTrail role when needed
  config_bucket_name              = module.storage.config_bucket_id
  frontend_bucket_arn             = module.storage.frontend_bucket_arn
  dynamodb_table_arns             = values(module.storage.dynamodb_table_arns)
  security_notification_topic_arn = module.monitoring.security_alerts_topic_arn
}
