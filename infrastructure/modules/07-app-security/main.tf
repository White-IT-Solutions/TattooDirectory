# =============================================================================
# APP SECURITY MODULE
# =============================================================================
# This module contains application-level security resources deployed to the
# Infrastructure Account:
# - Secrets Manager secrets for application use
# - WAF Web ACL for CloudFront protection

# =============================================================================
# SECRETS MANAGER
# =============================================================================

# Application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.context.name_prefix}-app-secrets"
  description             = "Application secrets for ${var.context.project_name}"
  kms_key_id              = var.kms_key_main_arn
  recovery_window_in_days = var.context.environment == "prod" ? 30 : 0

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-app-secrets"
  })
}

# Application secrets version
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    opensearch_master_password = var.opensearch_master_password
    app_password               = var.app_secrets_password
    database_url               = "placeholder"
    api_keys = {
      external_service = "placeholder"
    }
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# OpenSearch master user secret
resource "aws_secretsmanager_secret" "opensearch_master" {
  name                    = "${var.context.name_prefix}-opensearch-master"
  description             = "OpenSearch master user credentials"
  kms_key_id              = var.kms_key_main_arn
  recovery_window_in_days = var.context.environment == "prod" ? 30 : 0

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-master"
  })
}

resource "aws_secretsmanager_secret_version" "opensearch_master" {
  secret_id = aws_secretsmanager_secret.opensearch_master.id
  secret_string = jsonencode({
    username = "admin"
    password = var.opensearch_master_password
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# =============================================================================
# WAF WEB ACL
# =============================================================================

# Enhanced WAF with comprehensive managed rule sets
resource "aws_wafv2_web_acl" "enhanced_frontend" {
  name  = "${var.context.name_prefix}-enhanced-frontend-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Managed Rules Map
  dynamic "rule" {
    for_each = {
      "AWSManagedRulesCommonRuleSet" = {
        priority    = 1
        metric_name = "CommonRuleSetMetric"
      }
      "AWSManagedRulesKnownBadInputsRuleSet" = {
        priority    = 2
        metric_name = "KnownBadInputsRuleSetMetric"
      }
      "AWSManagedRulesAnonymousIpListRuleSet" = {
        priority    = 3
        metric_name = "AnonymousIpListRuleSetMetric"
      }
      "AWSManagedRulesUnixRuleSet" = {
        priority    = 4
        metric_name = "UnixRuleSetMetric"
      }
      "AWSManagedRulesAmazonIpReputationList" = {
        priority    = 5
        metric_name = "AmazonIpReputationListMetric"
      }
    }

    content {
      name     = rule.key
      priority = rule.value.priority

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.value.metric_name
        sampled_requests_enabled   = true
      }
    }
  }

  # API-specific rate limit rule
  rule {
    name     = "APIRateLimitRule"
    priority = 6

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit                 = 500 # 500 requests
        aggregate_key_type    = "IP"
        evaluation_window_sec = 300 # per 5 minutes
        scope_down_statement {
          byte_match_statement {
            search_string = "/v1/artists"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              type     = "NONE"
              priority = 0
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "APIRateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  # General rate limiting rule
  rule {
    name     = "GeneralRateLimitRule"
    priority = 7

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeneralRateLimit"
      sampled_requests_enabled   = true
    }
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-enhanced-frontend-waf"
  })

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.context.name_prefix}-EnhancedWAF"
    sampled_requests_enabled   = true
  }
}

# WAF Logging Configuration for enhanced WAF
resource "aws_wafv2_web_acl_logging_configuration" "enhanced_frontend" {
  resource_arn            = aws_wafv2_web_acl.enhanced_frontend.arn
  log_destination_configs = [var.waf_firehose_arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}