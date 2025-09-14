# =============================================================================
# GOVERNANCE MODULE
# =============================================================================
# This module contains governance and compliance resources:
# - AWS Config rules and remediation
# - CloudTrail with cross-region replication
# - Compliance dashboards and reporting

# =============================================================================
# SNS TOPICS FOR NOTIFICATIONS
# =============================================================================

# SNS Topic for Config notifications
resource "aws_sns_topic" "config_notifications" {
  count = var.enable_config ? 1 : 0

  name              = "${var.context.name_prefix}-config-notifications"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-notifications"
  })
}

# SNS Topic for CloudTrail notifications
resource "aws_sns_topic" "cloudtrail_notifications" {
  name              = "${var.context.name_prefix}-cloudtrail-notifications"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-notifications"
  })
}

# =============================================================================
# AWS CONFIG
# =============================================================================

# Configuration recorder
resource "aws_config_configuration_recorder" "main" {
  count = var.enable_config ? 1 : 0

  name     = "${var.context.name_prefix}-config-recorder"
  role_arn = var.config_service_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# Delivery channel
resource "aws_config_delivery_channel" "main" {
  count = var.enable_config ? 1 : 0

  name           = "${var.context.name_prefix}-config-delivery-channel"
  s3_bucket_name = var.config_bucket_name

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

locals {
  config_rules = {
    "s3-bucket-public-access-prohibited" = {
      source_identifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
      parameters        = {}
    },
    "s3-bucket-server-side-encryption-enabled" = {
      source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
      parameters        = {}
    },
    "dynamodb-table-encryption-enabled" = {
      source_identifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
      parameters        = {}
    },
    "dynamodb-pitr-enabled" = {
      source_identifier = "DYNAMODB_PITR_ENABLED"
      parameters        = {}
    },
    "lambda-concurrency-check" = {
      source_identifier = "LAMBDA_CONCURRENCY_CHECK"
      parameters = {
        ConcurrencyLimitLow  = 1
        ConcurrencyLimitHigh = 100
      }
    },
    "lambda-function-public-access-prohibited" = {
      source_identifier = "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
      parameters        = {}
    },
    "lambda-inside-vpc" = {
      source_identifier = "LAMBDA_INSIDE_VPC"
      parameters        = {}
    },
    "api-gw-execution-logging-enabled" = {
      source_identifier = "API_GW_EXECUTION_LOGGING_ENABLED"
      parameters        = {}
    },
    "cloudfront-origin-access-control-enabled" = {
      source_identifier = "CLOUDFRONT_ORIGIN_ACCESS_CONTROL_ENABLED"
      parameters        = {}
    },
    "cloudfront-viewer-policy-https" = {
      source_identifier = "CLOUDFRONT_VIEWER_POLICY_HTTPS"
      parameters        = {}
    },
    "vpc-default-security-group-closed" = {
      source_identifier = "VPC_DEFAULT_SECURITY_GROUP_CLOSED"
      parameters        = {}
    },
    "vpc-flow-logs-enabled" = {
      source_identifier = "VPC_FLOW_LOGS_ENABLED"
      parameters        = {}
    },
    "iam-policy-no-statements-with-admin-access" = {
      source_identifier = "IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS"
      parameters        = {}
    },
    "iam-user-no-policies-check" = {
      source_identifier = "IAM_USER_NO_POLICIES_CHECK"
      parameters        = {}
    },
    "kms-cmk-not-scheduled-for-deletion" = {
      source_identifier = "KMS_CMK_NOT_SCHEDULED_FOR_DELETION"
      parameters        = {}
    }
  }
}

# =============================================================================
# AWS CONFIG RULES
# =============================================================================

resource "aws_config_config_rule" "managed_rules" {
  for_each = var.enable_config ? local.config_rules : {}

  name = "${var.context.name_prefix}-${each.key}"

  source {
    owner             = "AWS"
    source_identifier = each.value.source_identifier
  }

  input_parameters = length(each.value.parameters) > 0 ? jsonencode(each.value.parameters) : null

  depends_on = [aws_config_configuration_recorder.main]
}

# =============================================================================
# CONFIG REMEDIATION CONFIGURATIONS
# =============================================================================

resource "aws_config_remediation_configuration" "s3_bucket_public_access_prohibited" {
  count = var.enable_config && var.enable_config_remediation ? 1 : 0

  config_rule_name = aws_config_config_rule.managed_rules["s3-bucket-public-access-prohibited"].name

  resource_type  = "AWS::S3::Bucket"
  target_type    = "SSM_DOCUMENT"
  target_id      = "AWSConfigRemediation-RemoveS3BucketPublicAccess"
  target_version = "1"

  parameter {
    name         = "AutomationAssumeRole"
    static_value = var.config_remediation_role_arn
  }

  parameter {
    name           = "S3BucketName"
    resource_value = "RESOURCE_ID"
  }

  automatic                  = false
  maximum_automatic_attempts = 3
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

# CloudTrail now uses the centralized bucket in the Audit Account

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.context.name_prefix}"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail-logs"
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.context.name_prefix}-cloudtrail"
  s3_bucket_name = var.cloudtrail_bucket_name

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${var.frontend_bucket_arn}/*"]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = var.dynamodb_table_arns
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = var.cloudtrail_role_arn

  enable_logging                = true
  enable_log_file_validation    = true
  include_global_service_events = true
  is_multi_region_trail         = true
  sns_topic_name                = aws_sns_topic.cloudtrail_notifications.name
  is_organization_trail         = false

  kms_key_id = var.kms_key_main_arn

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudtrail"
  })
}

# =============================================================================
# COMPLIANCE DASHBOARD
# =============================================================================

resource "aws_cloudwatch_dashboard" "compliance" {
  count = var.enable_config ? 1 : 0

  dashboard_name = "${var.context.name_prefix}-compliance"

  dashboard_body = templatefile("${path.module}/compliance_dashboard.json.tftpl", {
    region       = var.context.aws_region,
    project_name = var.context.project_name,
    name_prefix  = var.context.name_prefix
  })
}