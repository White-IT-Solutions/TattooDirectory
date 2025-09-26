# =============================================================================
# BACKUP MODULE
# =============================================================================
# This module contains backup and disaster recovery resources:
# - AWS Backup vault and plans
# - Cross-region backup replication
# - Backup policies for DynamoDB and ECS

# =============================================================================
# AWS BACKUP VAULT
# =============================================================================

resource "aws_backup_vault" "main" {
  count = var.backup_enabled ? 1 : 0

  name        = "${var.context.name_prefix}-backup-vault"
  kms_key_arn = var.kms_key_log_archive_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-vault"
  })
}

# Cross-region backup vault (for production)
resource "aws_backup_vault" "replica" {
  count = var.backup_enabled && var.context.enable_cross_region_replication ? 1 : 0

  provider = aws.replica

  name        = "${var.context.name_prefix}-backup-vault-replica"
  kms_key_arn = var.kms_key_log_archive_replica_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-vault-replica"
  })
}

# =============================================================================
# AWS BACKUP PLAN
# =============================================================================

resource "aws_backup_plan" "main" {
  count = var.backup_enabled ? 1 : 0

  name = "${var.context.name_prefix}-backup-plan"

  # Daily backups
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 5 ? * * *)" # 5 AM UTC daily

    start_window      = 60  # 1 hour
    completion_window = 300 # 5 hours

    recovery_point_tags = merge(var.context.common_tags, {
      BackupType = "Daily"
    })

    lifecycle {
      cold_storage_after = var.context.environment == "prod" ? 30 : null
      delete_after       = var.backup_retention_days
    }

    # Cross-region copy for production
    dynamic "copy_action" {
      for_each = var.context.enable_cross_region_replication ? [1] : []
      content {
        destination_vault_arn = aws_backup_vault.replica[0].arn

        lifecycle {
          cold_storage_after = var.context.environment == "prod" ? 30 : null
          delete_after       = var.backup_retention_days
        }
      }
    }
  }

  # Weekly backups (longer retention)
  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 6 ? * SUN *)" # 6 AM UTC on Sundays

    start_window      = 60  # 1 hour
    completion_window = 300 # 5 hours

    recovery_point_tags = merge(var.context.common_tags, {
      BackupType = "Weekly"
    })

    lifecycle {
      cold_storage_after = var.context.environment == "prod" ? 30 : null
      delete_after       = var.backup_retention_days * 4 # Keep weekly backups 4x longer
    }

    # Cross-region copy for production
    dynamic "copy_action" {
      for_each = var.context.enable_cross_region_replication ? [1] : []
      content {
        destination_vault_arn = aws_backup_vault.replica[0].arn

        lifecycle {
          cold_storage_after = var.context.environment == "prod" ? 30 : null
          delete_after       = var.backup_retention_days * 4
        }
      }
    }
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-plan"
  })
}

# =============================================================================
# BACKUP SELECTIONS
# =============================================================================

# DynamoDB backup selection
resource "aws_backup_selection" "dynamodb" {
  count = var.backup_enabled ? 1 : 0

  iam_role_arn = var.backup_role_arn
  name         = "${var.context.name_prefix}-dynamodb-backup"
  plan_id      = aws_backup_plan.main[0].id

  resources = var.dynamodb_table_arns

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.context.environment
    }
  }

  condition {
    string_equals {
      key   = "aws:ResourceTag/Project"
      value = var.context.project_name
    }
  }
}

# ECS backup selection (for task definitions and service configurations)
resource "aws_backup_selection" "ecs" {
  count = var.backup_enabled ? 1 : 0

  iam_role_arn = var.backup_role_arn
  name         = "${var.context.name_prefix}-ecs-backup"
  plan_id      = aws_backup_plan.main[0].id

  resources = [
    var.ecs_cluster_arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.context.environment
    }
  }
}

# =============================================================================
# BACKUP VAULT NOTIFICATIONS
# =============================================================================

resource "aws_backup_vault_notifications" "main" {
  count = var.backup_enabled && var.backup_notification_topic_arn != "" ? 1 : 0

  backup_vault_name = aws_backup_vault.main[0].name
  sns_topic_arn     = var.backup_notification_topic_arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_STARTED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED"
  ]
}

# =============================================================================
# BACKUP VAULT LOCK (for compliance)
# =============================================================================

resource "aws_backup_vault_lock_configuration" "main" {
  count = var.backup_enabled && var.context.environment == "prod" ? 1 : 0

  backup_vault_name   = aws_backup_vault.main[0].name
  changeable_for_days = 3
  max_retention_days  = var.backup_retention_days * 2
  min_retention_days  = 1
}

# =============================================================================
# CLOUDWATCH ALARMS FOR BACKUP MONITORING
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "backup_job_failed" {
  count = var.backup_enabled ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-backup-job-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfBackupJobsFailed"
  namespace           = "AWS/Backup"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors failed backup jobs"
  alarm_actions       = var.backup_notification_topic_arn != "" ? [var.backup_notification_topic_arn] : []

  dimensions = {
    BackupVaultName = aws_backup_vault.main[0].name
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-job-failed"
  })
}

resource "aws_cloudwatch_metric_alarm" "backup_job_expired" {
  count = var.backup_enabled ? 1 : 0

  alarm_name          = "${var.context.name_prefix}-backup-job-expired"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfBackupJobsExpired"
  namespace           = "AWS/Backup"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors expired backup jobs"
  alarm_actions       = var.backup_notification_topic_arn != "" ? [var.backup_notification_topic_arn] : []

  dimensions = {
    BackupVaultName = aws_backup_vault.main[0].name
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-backup-job-expired"
  })
}