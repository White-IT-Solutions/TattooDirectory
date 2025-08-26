# =============================================================================
# BACKUP MODULE OUTPUTS
# =============================================================================

# =============================================================================
# BACKUP VAULT
# =============================================================================

output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = var.backup_enabled ? aws_backup_vault.main[0].name : null
}

output "backup_vault_arn" {
  description = "ARN of the backup vault"
  value       = var.backup_enabled ? aws_backup_vault.main[0].arn : null
}

output "backup_vault_replica_name" {
  description = "Name of the replica backup vault"
  value       = var.backup_enabled && var.context.enable_cross_region_replication ? aws_backup_vault.replica[0].name : null
}

output "backup_vault_replica_arn" {
  description = "ARN of the replica backup vault"
  value       = var.backup_enabled && var.context.enable_cross_region_replication ? aws_backup_vault.replica[0].arn : null
}

# =============================================================================
# BACKUP PLAN
# =============================================================================

output "backup_plan_id" {
  description = "ID of the backup plan"
  value       = var.backup_enabled ? aws_backup_plan.main[0].id : null
}

output "backup_plan_arn" {
  description = "ARN of the backup plan"
  value       = var.backup_enabled ? aws_backup_plan.main[0].arn : null
}

output "backup_plan_version" {
  description = "Version of the backup plan"
  value       = var.backup_enabled ? aws_backup_plan.main[0].version : null
}

# =============================================================================
# BACKUP SELECTIONS
# =============================================================================

output "backup_selection_ids" {
  description = "Map of backup selection IDs"
  value = var.backup_enabled ? {
    dynamodb = aws_backup_selection.dynamodb[0].id
    ecs      = aws_backup_selection.ecs[0].id
  } : {}
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

output "backup_alarm_arns" {
  description = "Map of backup-related CloudWatch alarm ARNs"
  value = var.backup_enabled ? {
    backup_job_failed  = aws_cloudwatch_metric_alarm.backup_job_failed[0].arn
    backup_job_expired = aws_cloudwatch_metric_alarm.backup_job_expired[0].arn
  } : {}
}