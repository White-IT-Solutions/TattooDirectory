# Backup Module (16-backup)

## Overview
The Backup module implements comprehensive backup and disaster recovery capabilities for the tattoo artist directory application. It uses AWS Backup to create automated, encrypted backups of DynamoDB tables and ECS configurations with cross-region replication for production environments.

## Purpose
- Provides automated backup of critical application data and configurations
- Implements cross-region disaster recovery for production environments
- Ensures compliance with data retention and recovery requirements
- Enables point-in-time recovery for data protection and business continuity

## Resources Created

### AWS Backup Infrastructure
- **aws_backup_vault.main**: Primary backup vault for storing recovery points
- **aws_backup_vault.replica**: Cross-region backup vault for disaster recovery (production)
- **aws_backup_plan.main**: Backup plan defining schedule and retention policies

### Backup Selections
- **aws_backup_selection.dynamodb**: Selects DynamoDB tables for backup
- **aws_backup_selection.ecs**: Selects ECS cluster configurations for backup

### Monitoring and Notifications
- **aws_backup_vault_notifications.main**: SNS notifications for backup events
- **aws_cloudwatch_metric_alarm.backup_job_failed**: Alerts on backup failures
- **aws_cloudwatch_metric_alarm.backup_job_expired**: Alerts on expired backups

### Compliance and Security
- **aws_backup_vault_lock_configuration.main**: Vault lock for compliance (production)

## Key Features

### Automated Backup Schedules
- **Daily Backups**: 5 AM UTC daily with configurable retention
- **Weekly Backups**: Sunday 6 AM UTC with extended retention
- **Flexible Scheduling**: Cron-based scheduling for custom requirements

### Cross-Region Replication
- **Production Only**: Automatic replication to secondary region
- **Encrypted Replication**: Replica backups encrypted with region-specific KMS keys
- **Disaster Recovery**: Enables recovery in case of regional outages

### Retention Policies
- **Daily Backups**: Configurable retention (default: 30 days)
- **Weekly Backups**: Extended retention (4x daily retention)
- **Cold Storage**: Automatic transition to cold storage after 30 days (production)
- **Lifecycle Management**: Automated deletion after retention period

## Backup Plan Configuration

### Daily Backup Rule
- **Schedule**: `cron(0 5 ? * * *)` (5 AM UTC daily)
- **Start Window**: 60 minutes (backup must start within 1 hour)
- **Completion Window**: 300 minutes (backup must complete within 5 hours)
- **Retention**: Configurable via `backup_retention_days` variable
- **Cold Storage**: 30 days (production only)

### Weekly Backup Rule
- **Schedule**: `cron(0 6 ? * SUN *)` (6 AM UTC on Sundays)
- **Start Window**: 60 minutes
- **Completion Window**: 300 minutes
- **Retention**: 4x daily retention period
- **Cold Storage**: 30 days (production only)

## Backup Selection Criteria

### DynamoDB Tables
- **Resource Type**: All DynamoDB tables
- **Tag Filters**: 
  - Environment matches current environment
  - Project matches project name
- **Automatic Discovery**: New tables automatically included if properly tagged

### ECS Resources
- **Resource Type**: ECS clusters
- **Includes**: Task definitions, service configurations, cluster settings
- **Tag Filters**: Same environment and project tag requirements

## Dependencies
- **IAM Module**: Uses backup service role ARN
- **App Storage Module**: Requires DynamoDB table ARNs for backup selection
- **Compute Module**: Requires ECS cluster ARN for backup selection
- **Audit Foundation Module**: Uses audit KMS keys for encryption

## Outputs
- **backup_vault_arn**: Primary backup vault ARN
- **backup_vault_replica_arn**: Replica backup vault ARN (if enabled)
- **backup_plan_arn**: Backup plan ARN for monitoring and management

## Integration with Other Modules

### App Storage Module
- DynamoDB tables automatically backed up based on tags
- Point-in-time recovery complements backup strategy

### Compute Module
- ECS cluster configurations backed up for disaster recovery
- Task definitions and service configurations preserved

### IAM Module
- Uses backup service role for cross-account backup operations
- Backup role includes necessary permissions for DynamoDB and ECS

### App Monitoring Module
- Backup job metrics monitored via CloudWatch alarms
- Integration with notification system for backup status

## Backup Vault Configuration

### Primary Vault
- **Encryption**: Customer-managed KMS key from Audit Foundation
- **Access Control**: Restrictive vault access policy
- **Notifications**: SNS integration for backup events
- **Lock Configuration**: Vault lock for compliance (production)

### Replica Vault (Production)
- **Region**: Secondary region for disaster recovery
- **Encryption**: Region-specific KMS key
- **Replication**: Automatic from primary vault
- **Retention**: Same policies as primary vault

## Vault Lock Configuration (Production)

### Compliance Features
- **Changeable Period**: 3 days to modify lock configuration
- **Minimum Retention**: 1 day minimum retention period
- **Maximum Retention**: 2x backup retention days maximum
- **Immutable Backups**: Prevents deletion during retention period

## Monitoring and Alerting

### Backup Job Monitoring
- **Failed Jobs**: Immediate alert on any backup failure
- **Expired Jobs**: Alert on jobs that exceed completion window
- **Success Rate**: Monitoring of overall backup success rate
- **Storage Usage**: Monitoring of backup vault storage consumption

### Notification Events
- **BACKUP_JOB_STARTED**: Backup job initiation
- **BACKUP_JOB_COMPLETED**: Successful backup completion
- **BACKUP_JOB_FAILED**: Backup job failure
- **RESTORE_JOB_STARTED**: Restore operation initiation
- **RESTORE_JOB_COMPLETED**: Successful restore completion
- **RESTORE_JOB_FAILED**: Restore operation failure

## Disaster Recovery Procedures

### Regional Failure Recovery
1. **Assessment**: Determine scope of regional outage
2. **Backup Verification**: Confirm replica backups are available
3. **Resource Recreation**: Deploy infrastructure in secondary region
4. **Data Restoration**: Restore DynamoDB tables from replica backups
5. **Service Validation**: Verify application functionality
6. **DNS Failover**: Update DNS to point to secondary region

### Point-in-Time Recovery
1. **Incident Identification**: Determine data corruption or loss timeframe
2. **Backup Selection**: Choose appropriate backup based on timestamp
3. **Restore Planning**: Plan restore operation to minimize downtime
4. **Data Restoration**: Execute restore to new or existing resources
5. **Validation**: Verify data integrity and completeness
6. **Service Resume**: Resume normal operations

## Security Considerations

### Encryption
- **At Rest**: All backups encrypted with customer-managed KMS keys
- **In Transit**: Backup data encrypted during transfer
- **Key Management**: Separate KMS keys for primary and replica regions

### Access Control
- **IAM Policies**: Restrictive policies for backup service roles
- **Vault Policies**: Additional access controls at vault level
- **Cross-Account**: Secure cross-account access for centralized backup

### Audit Trail
- **CloudTrail**: All backup operations logged
- **Notifications**: Real-time notifications for backup events
- **Monitoring**: Continuous monitoring of backup job status

## Cost Optimization

### Storage Costs
- **Lifecycle Policies**: Automatic transition to cheaper storage tiers
- **Retention Management**: Appropriate retention periods for different backup types
- **Cross-Region**: Production-only cross-region replication

### Operational Costs
- **Backup Windows**: Optimized backup windows to reduce impact
- **Incremental Backups**: AWS Backup uses incremental backups automatically
- **Resource Selection**: Selective backup of critical resources only

## Compliance Benefits
- **Data Protection**: Automated backup ensures data protection
- **Retention Compliance**: Configurable retention meets regulatory requirements
- **Audit Trail**: Complete audit trail of backup and restore operations
- **Immutable Storage**: Vault lock prevents unauthorized deletion
- **Cross-Region**: Geographic distribution for disaster recovery compliance

## Operational Benefits
- **Automated Operations**: No manual intervention required for routine backups
- **Centralized Management**: Single service for all backup operations
- **Point-in-Time Recovery**: Granular recovery options
- **Cross-Service Support**: Unified backup for multiple AWS services
- **Monitoring Integration**: Built-in CloudWatch metrics and alarms

## Recovery Time and Point Objectives
- **RTO (Recovery Time Objective)**: 4-6 hours for full regional recovery
- **RPO (Recovery Point Objective)**: 24 hours maximum data loss (daily backups)
- **Local Recovery**: 1-2 hours for point-in-time recovery
- **Cross-Region Recovery**: 6-8 hours including infrastructure deployment