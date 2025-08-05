# Enhanced backup strategy for production workloads

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  count       = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name        = "${local.name_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-vault"
  })
}

# AWS Backup Plan
resource "aws_backup_plan" "main" {
  count = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name  = "${local.name_prefix}-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM UTC

    recovery_point_tags = merge(local.common_tags, {
      BackupType = "Daily"
    })

    lifecycle {
      cold_storage_after = 30
      delete_after       = var.backup_retention_days
    }

    # NOTE: The copy_action block is for cross-region/cross-account disaster recovery.
    # It is commented out because it currently points to the same vault, which is redundant.
    # To enable, create a backup vault in a different region and reference its ARN here.
    
    # copy_action {
    #   destination_vault_arn = aws_backup_vault.main[0].arn

    #   lifecycle {
    #     cold_storage_after = 30
    #     delete_after       = var.backup_retention_days
    #   }
    # }
  }

  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 5 ? * SUN *)" # Weekly on Sunday

    recovery_point_tags = merge(local.common_tags, {
      BackupType = "Weekly"
    })

    lifecycle {
      cold_storage_after = 30
      delete_after       = 90 # Keep weekly backups longer
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-plan"
  })
}

# Backup Selection
resource "aws_backup_selection" "main" {
  count        = local.environment_config[var.environment].backup_enabled ? 1 : 0
  iam_role_arn = aws_iam_role.backup_role[0].arn
  name         = "${local.name_prefix}-backup-selection"
  plan_id      = aws_backup_plan.main[0].id

  resources = [
    aws_dynamodb_table.main.arn,
    aws_dynamodb_table.denylist.arn,
    aws_s3_bucket.frontend.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}
