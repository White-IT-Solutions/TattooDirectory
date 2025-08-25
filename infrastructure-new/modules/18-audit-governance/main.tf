# =============================================================================
# AUDIT GOVERNANCE MODULE
# =============================================================================
# This module contains governance resources deployed to the Audit Account:
# - AWS Config Aggregator for organization-wide compliance data
# - Compliance dashboards and reporting

# =============================================================================
# AWS CONFIG AGGREGATOR
# =============================================================================

# Configuration aggregator for organization-wide compliance data
resource "aws_config_configuration_aggregator" "organization" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-config-aggregator"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator[0].arn
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-aggregator"
  })
}

# IAM Role for Config Aggregator
resource "aws_iam_role" "config_aggregator" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-config-aggregator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-config-aggregator-role"
  })
}

# IAM Policy for Config Aggregator
resource "aws_iam_role_policy" "config_aggregator" {
  count = var.enable_config ? 1 : 0

  name = "${var.context.name_prefix}-config-aggregator-policy"
  role = aws_iam_role.config_aggregator[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "organizations:EnableAWSServiceAccess",
          "organizations:ListAccounts",
          "organizations:ListAWSServiceAccessForOrganization",
          "organizations:ListDelegatedAdministrators"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:PutAggregator",
          "config:GetComplianceDetailsByConfigRule",
          "config:GetComplianceDetailsByResource",
          "config:GetComplianceSummaryByConfigRule",
          "config:GetComplianceSummaryByResourceType",
          "config:GetConfigurationAggregator",
          "config:GetDiscoveredResourceCounts",
          "config:GetResourceConfigHistory",
          "config:ListDiscoveredResources",
          "config:ValidateConfigurationRecorder"
        ]
        Resource = "*"
      }
    ]
  })
}

# =============================================================================
# COMPLIANCE DASHBOARD
# =============================================================================

# CloudWatch Dashboard for compliance monitoring
resource "aws_cloudwatch_dashboard" "compliance" {
  dashboard_name = "${var.context.name_prefix}-compliance-dashboard"

  dashboard_body = templatefile("${path.module}/../00-Templates/config_compliance_dashboard.json.tftpl", {
    aws_region                 = var.context.aws_region
    account_id                 = var.context.audit_account_id
    name_prefix                = var.context.name_prefix
    config_aggregator_name     = var.enable_config ? aws_config_configuration_aggregator.organization[0].name : ""
    s3_public_access_rule_name     = var.s3_public_access_rule_name
    dynamodb_encryption_rule_name  = var.dynamodb_encryption_rule_name
    lambda_public_access_rule_name = var.lambda_public_access_rule_name
    cloudfront_https_rule_name     = var.cloudfront_https_rule_name
  })

  depends_on = [aws_config_configuration_aggregator.organization]
}