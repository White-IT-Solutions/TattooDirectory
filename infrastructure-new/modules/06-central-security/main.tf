# =============================================================================
# CENTRAL SECURITY MODULE
# =============================================================================
# This module contains centralized security resources deployed to the
# Security Account:
# - GuardDuty detector for organization-wide threat detection
# - Security Hub for centralized security findings
# - IAM Access Analyzer for organization-wide access analysis

# =============================================================================
# GUARDDUTY
# =============================================================================

# GuardDuty Detector - Central delegated administrator for organization
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Not using EKS
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = false # Not using EC2
        }
      }
    }
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-guardduty-detector"
  })
}

# =============================================================================
# SECURITY HUB
# =============================================================================

# Security Hub Account - Central delegated administrator for organization
resource "aws_securityhub_account" "main" {
  enable_default_standards = true

  control_finding_generator = "SECURITY_CONTROL"
}

# =============================================================================
# IAM ACCESS ANALYZER
# =============================================================================

# IAM Access Analyzer - Organization-wide analyzer
resource "aws_accessanalyzer_analyzer" "main" {
  analyzer_name = "${var.context.name_prefix}-access-analyzer"
  type          = "ORGANIZATION"

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-access-analyzer"
  })
}