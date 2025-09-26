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
  # checkov:skip=CKV2_AWS_3: See config below
  enable = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-guardduty-detector"
  })
}

resource "aws_guardduty_organization_configuration" "main" {
  auto_enable_organization_members = "ALL"

  detector_id = aws_guardduty_detector.main.id

  datasources {
    s3_logs {
      auto_enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Not using EKS
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          auto_enable = false # Not using EC2
        }
      }
    }
  }
}

# =============================================================================
# SECURITY HUB
# =============================================================================

# Security Hub Account - Central delegated administrator for organization
resource "aws_securityhub_account" "main" {
  # Automatically enable new controls as they are released by AWS.
  auto_enable_controls = true

  # We will manage standard subscriptions explicitly below for better clarity.
  enable_default_standards = false

  control_finding_generator = "SECURITY_CONTROL"
}

# Automatically enable Security Hub for new accounts in the organization.
# This resource should be deployed in the Security Hub delegated administrator account.
resource "aws_securityhub_organization_configuration" "main" {
  auto_enable = true
}

# Subscribe to the AWS Foundational Security Best Practices standard.
resource "aws_securityhub_standards_subscription" "foundational_security" {
  standards_arn = "arn:aws:securityhub:::ruleset/aws-foundational-security-best-practices/v/1.0.0"
}

# Subscribe to the CIS AWS Foundations Benchmark standard for an additional layer of compliance checking.
resource "aws_securityhub_standards_subscription" "cis" {
  # The region in the standards_arn is ignored; the standard is enabled in the provider's configured region.
  standards_arn = "arn:aws:securityhub:us-east-1::standards/cis-aws-foundations-benchmark/v/1.2.0"
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

# =============================================================================
# CROSS ACCOUNT LOG AUDIT ROLE
# =============================================================================

# This role is intended for security personnel or services (like Athena) in the Audit account to analyze logs stored in the Log Archive account.
# This role should be created in the Audit account, which is what the `aws.audit_primary` provider alias is assumed to do.
resource "aws_iam_role" "log_auditor" {
  name = "${var.context.name_prefix}-LogAuditorRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        # Restrict who can assume this role to a specific list of principals passed in as a variable.
        AWS = var.log_auditor_principal_arns
      }
    }]
  })

  tags = merge(var.context.common_tags, {
    Name                             = "${var.context.name_prefix}-LogAuditorRole",
    "iam.amazonaws.com/role-purpose" = "log-auditing"
  })
}

# This policy grants the necessary permissions to read from the log buckets in the Log Archive account and decrypt the objects using the correct KMS key.
resource "aws_iam_policy" "log_reader" {
  name = "${var.context.name_prefix}-LogArchiveReadAccessPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadFromLogArchiveBuckets"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        # Grant access to the bucket and objects within it for all relevant log buckets.
        # The bucket ARNs are passed in as a variable from the log-storage module.
        Resource = flatten([
          for key, arn in var.log_archive_bucket_arns : [arn, "${arn}/*"]
          if contains(["cloudtrail", "config", "vpc_flow_logs", "waf_logs", "access_logs"], key)
        ])
      },
      {
        Sid    = "AllowKmsDecryptForLogArchive"
        Effect = "Allow"
        Action = "kms:Decrypt"
        # Grant decrypt permissions on the KMS key used to encrypt the logs.
        Resource = [var.log_archive_kms_key_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "log_auditor_attachment" {
  role       = aws_iam_role.log_auditor.name
  policy_arn = aws_iam_policy.log_reader.arn
}
