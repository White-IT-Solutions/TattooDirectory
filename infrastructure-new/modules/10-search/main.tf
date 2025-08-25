# =============================================================================
# SEARCH MODULE (OpenSearch)
# =============================================================================
# This module contains search-related resources:
# - OpenSearch domain
# - CloudWatch log groups for OpenSearch
# - Service-linked role for OpenSearch

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  opensearch_config = {
    instance_type                = var.opensearch_instance_type
    instance_count               = var.opensearch_instance_count
    master_instance_type         = var.opensearch_master_instance_type
    master_instance_count        = var.opensearch_master_instance_count
    enable_dedicated_master      = var.opensearch_master_instance_count != null && var.opensearch_master_instance_count > 0
    enable_zone_awareness        = var.context.environment == "prod"
    availability_zone_count      = var.context.environment == "prod" ? 2 : 1
  }
}

# =============================================================================
# SERVICE-LINKED ROLE
# =============================================================================

resource "aws_iam_service_linked_role" "opensearch" {
  aws_service_name = "opensearchserverless.amazonaws.com"
  description      = "Service-linked role for OpenSearch"

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-slr"
  })
}

# =============================================================================
# CLOUDWATCH LOG GROUPS
# =============================================================================

resource "aws_cloudwatch_log_group" "opensearch_audit" {
  name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-audit"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-audit-logs"
  })
}

resource "aws_cloudwatch_log_group" "opensearch_slow_search" {
  name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-slow-search"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-slow-search-logs"
  })
}

resource "aws_cloudwatch_log_group" "opensearch_slow_index" {
  name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-slow-index"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-slow-index-logs"
  })
}

# =============================================================================
# OPENSEARCH DOMAIN
# =============================================================================

resource "aws_opensearch_domain" "main" {
  domain_name    = "${var.context.name_prefix}-search"
  engine_version = "OpenSearch_2.3"

  cluster_config {
    instance_type  = local.opensearch_config.instance_type
    instance_count = local.opensearch_config.instance_count

    # Dedicated master nodes configuration
    dedicated_master_enabled = local.opensearch_config.enable_dedicated_master
    dedicated_master_type    = local.opensearch_config.enable_dedicated_master ? local.opensearch_config.master_instance_type : null
    dedicated_master_count   = local.opensearch_config.enable_dedicated_master ? local.opensearch_config.master_instance_count : null

    # Zone awareness for production
    zone_awareness_enabled = local.opensearch_config.enable_zone_awareness

    dynamic "zone_awareness_config" {
      for_each = local.opensearch_config.enable_zone_awareness ? [1] : []
      content {
        availability_zone_count = local.opensearch_config.availability_zone_count
      }
    }
  }

  vpc_options {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.opensearch_security_group_id]
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = var.context.environment == "prod" ? 100 : 20
    throughput  = var.context.environment == "prod" ? 250 : 125
    iops        = var.context.environment == "prod" ? 3000 : 3000
  }

  encrypt_at_rest {
    enabled    = true
    kms_key_id = var.kms_key_main_arn
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled                        = true
    anonymous_auth_enabled         = false
    internal_user_database_enabled = true

    master_user_options {
      master_user_name     = "admin"
      master_user_password = var.opensearch_master_password
    }
  }

  # Log publishing options
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_audit.arn
    log_type                 = "AUDIT_LOGS"
    enabled                  = true
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_slow_search.arn
    log_type                 = "SEARCH_SLOW_LOGS"
    enabled                  = var.context.enable_advanced_monitoring
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_slow_index.arn
    log_type                 = "INDEX_SLOW_LOGS"
    enabled                  = var.context.enable_advanced_monitoring
  }

  # Access policies - will be updated by IAM module
  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.context.account_id}:root"
        }
        Action   = "es:*"
        Resource = "arn:aws:es:${var.context.aws_region}:${var.context.account_id}:domain/${var.context.name_prefix}-search/*"
      }
    ]
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch"
  })

  # Prevent accidental deletion in production
  lifecycle {
    prevent_destroy = false # Set to true for production
  }

  depends_on = [
    aws_iam_service_linked_role.opensearch,
    aws_cloudwatch_log_group.opensearch_audit,
    aws_cloudwatch_log_group.opensearch_slow_search,
    aws_cloudwatch_log_group.opensearch_slow_index
  ]
}

# =============================================================================
# OPENSEARCH DOMAIN POLICY (separate resource for better management)
# =============================================================================

resource "aws_opensearch_domain_policy" "main" {
  domain_name = aws_opensearch_domain.main.domain_name

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_role_arns
        }
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpDelete"
        ]
        Resource = "${aws_opensearch_domain.main.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "es.amazonaws.com"
        }
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.opensearch_audit.arn}:*",
          "${aws_cloudwatch_log_group.opensearch_slow_search.arn}:*",
          "${aws_cloudwatch_log_group.opensearch_slow_index.arn}:*"
        ]
        Condition = {
          ArnLike = {
            "aws:SourceArn" = aws_opensearch_domain.main.arn
          }
        }
      }
    ]
  })
}