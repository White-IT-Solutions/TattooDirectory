
# DynamoDB Point-in-Time Recovery (already enabled, but adding backup vault)
resource "aws_backup_vault" "main" {
  count       = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name        = "${var.project_name}-backup-vault"
  kms_key_arn = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-backup-vault"
  }
}

# Backup plan
resource "aws_backup_plan" "main" {
  count = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name  = "${var.project_name}-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 5 ? * * *)"  # Daily at 5 AM

    lifecycle {
      cold_storage_after = 30
      delete_after       = var.backup_retention_days
    }

    recovery_point_tags = {
      Environment = var.environment
      Project     = var.project_name
    }
  }

  tags = {
    Name = "${var.project_name}-backup-plan"
  }
}

# IAM role for AWS Backup
resource "aws_iam_role" "backup_role" {
  count = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name  = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-backup-role"
  }
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  count      = local.environment_config[var.environment].backup_enabled ? 1 : 0
  role       = aws_iam_role.backup_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Backup selection
resource "aws_backup_selection" "main" {
  count        = local.environment_config[var.environment].backup_enabled ? 1 : 0
  iam_role_arn = aws_iam_role.backup_role[0].arn
  name         = "${var.project_name}-backup-selection"
  plan_id      = aws_backup_plan.main[0].id

  resources = [
    aws_dynamodb_table.main.arn,
    aws_dynamodb_table.denylist.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# S3 bucket versioning and lifecycle for frontend assets
resource "aws_s3_bucket_lifecycle_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "transition_to_ia"
    status = var.environment == "prod" ? "Enabled" : "Disabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}