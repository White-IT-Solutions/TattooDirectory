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
    aws.replica = aws.infra_replica
  }
}

# ------------------------------------------------------------------------------
# Audit Foundation Layer
# Contains foundational audit resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "audit_foundation" {
  source  = "../../modules/03-audit-foundation"
  context = local.context

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit_primary
  }
}

# ------------------------------------------------------------------------------
# Central Logging Layer
# Contains centralized logging resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "central_logging" {
  source  = "../../modules/04-central-logging"
  context = local.context
  
  kms_key_logs_arn        = module.audit_foundation.kms_key_logs_arn
  waf_logs_bucket_arn     = module.log_storage.waf_logs_bucket_arn
  kms_key_audit_arn       = module.audit_foundation.kms_key_audit_arn
  kms_key_log_archive_arn = module.log_storage.kms_key_log_archive_arn

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit_primary
  }
}

# ------------------------------------------------------------------------------
# Networking Layer
# Contains all networking resources
# ------------------------------------------------------------------------------

module "networking" {
  source  = "../../modules/05-networking"
  context = local.context

  kms_key_logs_arn          = module.audit_foundation.kms_key_logs_arn
  vpc_flow_logs_bucket_arn  = module.log_storage.vpc_flow_logs_bucket_arn
  availability_zones        = module.foundation.availability_zones

  providers = {
    aws.us_east_1 = aws.infra_us_east_1
  }
}

# ------------------------------------------------------------------------------
# Central Security Layer
# Contains centralized security resources deployed to the Security Account
# ------------------------------------------------------------------------------

# This user is created in the Audit account for security analysis purposes.
# It serves as the specific principal allowed to assume the LogAuditorRole.
resource "aws_iam_user" "security_analyst" {
  provider = aws.audit_primary
  name     = "${local.context.name_prefix}-security-analyst"
  path     = "/users/"
  tags     = merge(local.context.common_tags, { Name = "${local.context.name_prefix}-security-analyst" })
}

module "central_security" {
  source  = "../../modules/06-central-security"
  context = local.context

  kms_key_logs_arn           = module.audit_foundation.kms_key_logs_arn
  log_archive_bucket_arns    = module.log_storage.s3_bucket_arns
  log_archive_kms_key_arn    = module.log_storage.kms_key_log_archive_arn
  log_auditor_principal_arns = [aws_iam_user.security_analyst.arn]

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit_primary
  }
}

# ------------------------------------------------------------------------------
# App Security Layer
# Contains application-level security resources
# ------------------------------------------------------------------------------

module "app_security" {
  source  = "../../modules/07-app-security"
  context = local.context

  kms_key_main_arn           = module.foundation.kms_key_main_arn
  opensearch_master_password = module.foundation.opensearch_master_password
  app_secrets_password       = module.foundation.app_secrets_password
  waf_firehose_arn           = module.central_logging.waf_firehose_arn
  
  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# Log Storage Layer
# Contains audit and log storage resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "log_storage" {
  source  = "../../modules/08-log-storage"
  context = local.context

  random_suffix             = module.foundation.random_suffix
  s3_replication_role_arn   = module.iam.s3_replication_role_arn

  # This module is deployed to the Log Archive Account
  providers = {
    aws         = aws.log_archive_primary
    aws.replica = aws.log_archive_replica
  }
}

# ------------------------------------------------------------------------------
# App Storage Layer
# Contains application storage resources
# ------------------------------------------------------------------------------

module "app_storage" {
  source  = "../../modules/09-app-storage"
  context = local.context

  kms_key_main_arn               = module.foundation.kms_key_main_arn
  kms_key_replica_arn            = module.foundation.kms_key_replica_arn
  random_suffix                  = module.foundation.random_suffix
  s3_replication_role_arn        = module.iam.s3_replication_role_arn
  access_logs_bucket_id          = module.log_storage.access_logs_bucket_id
  access_logs_bucket_domain_name = module.log_storage.access_logs_bucket_domain_name

  providers = {
    aws         = aws.infra_primary
    aws.replica = aws.infra_replica
  }
}

# ------------------------------------------------------------------------------
# SSM Parameters for CI/CD
# Store dynamic resource names for the CI/CD pipeline to use.
# ------------------------------------------------------------------------------

resource "aws_ssm_parameter" "lambda_artifacts_bucket_name" {
  provider = aws.infra_primary

  name        = "/${local.context.name_prefix}/lambda-artifacts-bucket-name"
  type        = "SecureString"
  value       = module.app_storage.lambda_artifacts_bucket_id
  key_id      = module.foundation.kms_key_main_arn
  description = "The name of the S3 bucket used to store Lambda deployment artifacts."

  tags = merge(local.context.common_tags, {
    Name = "${local.context.name_prefix}-lambda-artifacts-bucket-name"
  })
}

# ------------------------------------------------------------------------------
# Search Layer
# Contains OpenSearch resources
# ------------------------------------------------------------------------------

module "search" {
  source  = "../../modules/10-search"
  context = local.context

  kms_key_main_arn                 = module.foundation.kms_key_main_arn #Infra Account KMS
  kms_key_logs_arn                 = module.audit_foundation.kms_key_logs_arn #Audit Account KMS
  private_subnet_ids               = module.networking.private_subnet_ids
  opensearch_security_group_id     = module.networking.opensearch_security_group_id
  opensearch_master_password       = module.foundation.opensearch_master_password
  opensearch_instance_type         = var.opensearch_instance_type
  opensearch_instance_count        = var.opensearch_instance_count
  opensearch_master_instance_type  = var.opensearch_master_instance_type
  opensearch_master_instance_count = var.opensearch_master_instance_count
  lambda_role_arns                 = module.iam.lambda_role_arns # Infra Account IAM

  # This module is deployed to the Infra Account
  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# IAM Layer
# Contains all IAM roles and policies
# ------------------------------------------------------------------------------

module "iam" {
  source  = "../../modules/11-iam"
  context = local.context

  backup_enabled = var.backup_enabled
  enable_config  = true

  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# Compute Layer
# Contains Lambda functions, ECS, and Step Functions
# ------------------------------------------------------------------------------

module "compute" {
  source  = "../../modules/12-compute"
  context = local.context

  lambda_artifacts_bucket_id        = module.app_storage.lambda_artifacts_bucket_id
  kms_key_main_arn                  = module.foundation.kms_key_main_arn #Infra Account KMS
  kms_key_logs_arn                  = module.audit_foundation.kms_key_logs_arn #Audit Account KMS
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
  step_functions_role_name               = module.iam.step_functions_role_name
  ecs_task_execution_role_arn            = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn                      = module.iam.ecs_task_role_arn
  lambda_api_role_name                   = module.iam.lambda_api_role_name
  lambda_sync_role_name                  = module.iam.lambda_sync_role_name
  lambda_discover_studios_role_name      = module.iam.lambda_discover_studios_role_name
  lambda_find_artists_role_name          = module.iam.lambda_find_artists_role_name
  ecs_task_role_name                     = module.iam.ecs_task_role_name

  # Resource references
  main_table_name       = module.app_storage.dynamodb_table_names["main"]
  main_table_arn        = module.app_storage.dynamodb_table_arns["main"]
  denylist_table_arn    = module.app_storage.dynamodb_table_arns["denylist"]
  idempotency_table_arn = module.app_storage.dynamodb_table_arns["idempotency"]
  main_table_stream_arn = module.app_storage.main_table_stream_arn
  opensearch_endpoint   = module.search.domain_endpoint
  app_secrets_arn       = module.app_security.app_secrets_arn
  lambda_memory_size    = var.lambda_memory_size
  scraper_image_tag     = var.scraper_image_tag

  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# API Layer
# Contains API Gateway resources
# ------------------------------------------------------------------------------

module "api" {
  source  = "../../modules/13-api"
  context = local.context

  api_gateway_log_group_arn        = module.central_logging.api_gateway_log_group_arn # This now comes from the central_logging module
  api_cors_allowed_origins         = var.api_cors_allowed_origins
  api_handler_lambda_invoke_arn    = module.compute.api_handler_lambda_invoke_arn
  api_handler_lambda_function_name = module.compute.api_handler_lambda_function_name
  api_certificate_arn              = "" # TODO: Add API certificate when needed
  hosted_zone_id                   = "" # TODO: Add Route 53 hosted zone when needed

  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# Security Monitoring Layer
# Contains security monitoring resources deployed to the Security Account
# ------------------------------------------------------------------------------

module "security_monitoring" {
  source  = "../../modules/14-security-monitoring"
  context = local.context

  kms_key_logs_arn             = module.audit_foundation.kms_key_logs_arn
  guardduty_detector_id        = module.central_security.guardduty_detector_id
  enable_config_monitoring     = true
  enable_cloudtrail_monitoring = true
  cloudtrail_log_group_name    = module.governance.cloudtrail_log_group_name

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit_primary
  }
}

# ------------------------------------------------------------------------------
# App Monitoring Layer
# Contains application monitoring resources
# ------------------------------------------------------------------------------

module "app_monitoring" {
  source  = "../../modules/15-app-monitoring"
  context = local.context

  kms_key_main_arn                  = module.foundation.kms_key_main_arn
  api_gateway_id                    = module.api.api_id
  lambda_function_names             = module.compute.lambda_function_names
  main_table_name                   = module.app_storage.main_table_name
  opensearch_domain_name            = module.search.domain_name
  ecs_cluster_name                  = module.compute.ecs_cluster_name
  step_functions_state_machine_name = module.compute.step_functions_state_machine_name
  api_gateway_log_group_name        = module.central_logging.api_gateway_log_group_name # This now comes from the central_logging module

  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# Backup Layer
# Contains backup and disaster recovery resources
# ------------------------------------------------------------------------------

module "backup" {
  source  = "../../modules/16-backup"
  context = local.context

  backup_enabled                = var.backup_enabled
  backup_retention_days         = var.backup_retention_days
  kms_key_log_archive_arn       = module.log_storage.kms_key_log_archive_arn
  kms_key_log_archive_replica_arn = module.log_storage.kms_key_log_archive_replica_arn
  backup_role_arn               = module.iam.backup_role_arn
  dynamodb_table_arns           = values(module.app_storage.dynamodb_table_arns)
  ecs_cluster_arn               = module.compute.ecs_cluster_arn
  backup_notification_topic_arn = module.app_monitoring.critical_alerts_topic_arn

  # This module is deployed to the Log Archive Account
  providers = {
    aws         = aws.log_archive_primary
    aws.replica = aws.log_archive_replica
  }
}

# ------------------------------------------------------------------------------
# Governance Layer
# Contains governance and compliance resources
# ------------------------------------------------------------------------------

module "governance" {
  source  = "../../modules/17-governance"
  context = local.context

  enable_config                   = true
  enable_config_remediation       = var.enable_config_remediation # Use caution enabling this in dev
  kms_key_main_arn                = module.foundation.kms_key_main_arn # Infra Account KMS
  kms_key_logs_arn                = module.audit_foundation.kms_key_logs_arn # Audit Account KMS
  config_service_role_arn         = module.iam.config_service_role_arn
  config_remediation_role_arn     = "" # TODO: Add remediation role when needed
  cloudtrail_role_arn             = "" # TODO: Add CloudTrail role when needed
  config_bucket_name              = module.log_storage.config_bucket_id
  cloudtrail_bucket_name          = module.log_storage.cloudtrail_bucket_id
  cloudtrail_bucket_arn           = module.log_storage.cloudtrail_bucket_arn
  frontend_bucket_arn             = module.app_storage.frontend_bucket_arn
  dynamodb_table_arns             = values(module.app_storage.dynamodb_table_arns)

  # This module is deployed to the Infra Account
  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# Audit Governance Layer
# Contains audit governance resources deployed to the Audit Account
# ------------------------------------------------------------------------------

module "audit_governance" {
  source  = "../../modules/18-audit-governance"
  context = local.context

  enable_config              = true
  s3_public_access_rule_name = module.governance.s3_public_access_rule_name
  dynamodb_encryption_rule_name  = module.governance.dynamodb_encryption_rule_name
  lambda_public_access_rule_name = module.governance.lambda_public_access_rule_name
  cloudfront_https_rule_name     = module.governance.cloudfront_https_rule_name #Audit Account

  # This module is deployed to the Audit Account
  providers = {
    aws = aws.audit_primary
  }
}

# ------------------------------------------------------------------------------
# Delivery Layer
# Contains CloudFront distribution
# ------------------------------------------------------------------------------

module "delivery" {
  source  = "../../modules/19-delivery"
  context = local.context

  # S3 Bucket Inputs
  frontend_bucket_id                          = module.app_storage.frontend_bucket_id
  frontend_bucket_regional_domain_name        = module.app_storage.frontend_bucket_regional_domain_name
  frontend_backup_bucket_id                   = module.app_storage.frontend_backup_bucket_id
  frontend_backup_bucket_regional_domain_name = module.app_storage.frontend_backup_bucket_regional_domain_name

  # API Gateway Inputs
  api_gateway_id     = module.api.api_id
  api_gateway_endpoint = module.api.api_endpoint

  # Security & Logging Inputs
  waf_web_acl_arn                = module.app_security.waf_web_acl_arn
  cloudfront_certificate_arn     = module.networking.cloudfront_certificate_arn
  access_logs_bucket_domain_name = module.log_storage.access_logs_bucket_domain_name

  # This module is deployed to the Infra Account.
  # The provider determines which account manages the CloudFront distribution.
  providers = {
    aws = aws.infra_primary
  }
}

# ------------------------------------------------------------------------------
# IAM Policy for S3 Replication (Orchestration Layer)
# This policy is defined here to break the circular dependency between the
# IAM module (which creates the role) and the storage modules (which create
# the buckets the role needs access to).
# ------------------------------------------------------------------------------

locals {
  # Consolidate all bucket ARNs for the replication policy
  all_source_buckets_arns = local.context.enable_cross_region_replication ? concat(
    values(module.app_storage.s3_bucket_arns),
    values(module.log_storage.s3_bucket_arns)
  ) : []
  all_source_buckets_object_arns = [for arn in local.all_source_buckets_arns : "${arn}/*"]

  all_replica_buckets_arns = local.context.enable_cross_region_replication ? concat(
    values(module.app_storage.s3_replica_bucket_arns),
    values(module.log_storage.s3_replica_bucket_arns)
  ) : []
  all_replica_buckets_object_arns = [for arn in local.all_replica_buckets_arns : "${arn}/*"]
}

resource "aws_iam_policy" "s3_replication" { #Infra Account
  provider = aws.infra_primary
  count = local.context.enable_cross_region_replication ? 1 : 0
  name  = "${local.context.name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowReadFromSourceBuckets"
        Effect   = "Allow"
        Action   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging"]
        Resource = local.all_source_buckets_object_arns
      },
      {
        Sid      = "AllowListSourceBuckets"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = local.all_source_buckets_arns
      },
      {
        Sid      = "AllowWriteToReplicaBuckets"
        Effect   = "Allow"
        Action   = ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"]
        Resource = local.all_replica_buckets_object_arns
      },
      {
        Sid      = "AllowKmsDecryptOnSourceKeys"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = compact([module.foundation.kms_key_main_arn, module.log_storage.kms_key_log_archive_arn])
      },
      {
        Sid      = "AllowKmsEncryptOnDestinationKeys"
        Effect   = "Allow"
        Action   = ["kms:Encrypt"]
        Resource = compact([module.foundation.kms_key_replica_arn, module.log_storage.kms_key_log_archive_replica_arn])
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  provider = aws.infra_primary
  count      = local.context.enable_cross_region_replication ? 1 : 0
  role       = module.iam.s3_replication_role_name
  policy_arn = aws_iam_policy.s3_replication[0].arn
}

# ------------------------------------------------------------------------------
# IAM Policy for CI/CD (GitHub Actions)
# Grants permission to read the Lambda artifacts bucket name from SSM.
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "github_actions_cicd" {
  provider = aws.infra_primary
  name     = "${local.context.name_prefix}-github-actions-cicd-policy"
  path     = "/cicd/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowReadLambdaArtifactsBucketName"
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = aws_ssm_parameter.lambda_artifacts_bucket_name.arn
      },
      {
        Sid      = "AllowKmsDecryptForSsm"
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = module.foundation.kms_key_main_arn
        # Condition to ensure the role can only use this key for decrypting via SSM
        Condition = {
          "StringEquals" = {
            "kms:ViaService" = "ssm.${local.context.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_cicd" {
  provider   = aws.infra_primary
  role       = "GitHubActionsTerraformRole" # The name of your GitHub Actions role
  policy_arn = aws_iam_policy.github_actions_cicd.arn
}
