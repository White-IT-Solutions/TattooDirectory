# Log Storage Module (08-log-storage)

## Overview
The Log Storage module creates centralized S3 buckets for storing audit logs and compliance data in the Audit Account. It provides secure, encrypted storage for CloudTrail, Config, VPC Flow Logs, WAF logs, and CloudFront access logs with cross-region replication for production environments.

## Purpose
- Centralized storage for all audit and compliance logs
- Long-term retention with lifecycle management
- Cross-region replication for disaster recovery
- Secure access controls and encryption

## Resources Created

### S3 Buckets
- **CloudTrail Logs**: Stores AWS API call logs
- **Config Logs**: Stores AWS Config compliance data
- **VPC Flow Logs**: Stores network traffic logs
- **WAF Logs**: Stores Web Application Firewall logs
- **Access Logs**: Stores CloudFront and load balancer access logs

### Bucket Features
- **Encryption**: Server-side encryption with audit KMS key
- **Versioning**: Enabled for data protection
- **Lifecycle Management**: Automated transition to cheaper storage classes
- **Cross-Region Replication**: Production environments replicate to secondary region
- **Access Logging**: S3 access logs for audit trail

### Bucket Policies
- **Cross-Account Access**: Allows Infrastructure Account services to write logs
- **Service Principals**: Specific permissions for CloudTrail, Config, VPC Flow Logs
- **Least Privilege**: Restrictive policies limiting access to necessary operations

## Key Features

### Lifecycle Management
- **Standard Storage**: 30 days for frequent access
- **Infrequent Access**: 30-90 days for occasional access
- **Glacier**: 90+ days for long-term archival
- **Deep Archive**: 365+ days for compliance retention

### Cross-Region Replication (Production)
- **Automatic Replication**: All objects replicated to secondary region
- **Encryption**: Replica objects encrypted with replica KMS key
- **Versioning**: Maintains version history across regions
- **Disaster Recovery**: Ensures data availability during regional outages

### Security Controls
- **Encryption in Transit**: HTTPS required for all operations
- **Encryption at Rest**: KMS encryption with audit account keys
- **Access Controls**: IAM policies and bucket policies restrict access
- **MFA Delete**: Multi-factor authentication required for object deletion

## Dependencies
- **Audit Foundation Module**: Uses audit KMS key for encryption
- **Foundation Module**: Uses replica KMS key for cross-region replication
- Must be deployed in the Audit Account

## Outputs
- **Bucket ARNs**: For use by other modules requiring log storage
- **Bucket Names**: For service configuration (CloudTrail, Config)
- **Domain Names**: For CloudFront access logging configuration

## Integration with Other Modules

### Governance Module
- CloudTrail uses cloudtrail bucket for API log storage
- Config uses config bucket for compliance data storage

### Networking Module
- VPC Flow Logs delivered directly to vpc_flow_logs bucket
- Eliminates need for CloudWatch Log Groups for flow logs

### Central Logging Module
- WAF logs delivered via Kinesis Firehose to waf_logs bucket
- Provides centralized WAF security event storage

### Delivery Module
- CloudFront access logs stored in access_logs bucket
- Enables analysis of web traffic patterns and security events

## Bucket Configuration Details

### CloudTrail Bucket
- **Purpose**: AWS API call audit logs
- **Retention**: 7+ years for compliance
- **Access**: CloudTrail service principal write access
- **Encryption**: Audit KMS key

### Config Bucket
- **Purpose**: AWS Config compliance snapshots and history
- **Retention**: 7+ years for compliance
- **Access**: Config service principal write access
- **Delivery**: Config delivery channel integration

### VPC Flow Logs Bucket
- **Purpose**: Network traffic analysis and security monitoring
- **Retention**: 1+ years for security analysis
- **Access**: VPC Flow Logs service principal write access
- **Format**: Parquet format for efficient querying

### WAF Logs Bucket
- **Purpose**: Web application security event analysis
- **Retention**: 1+ years for security analysis
- **Access**: Kinesis Firehose delivery from Security Account
- **Partitioning**: Time-based partitioning for efficient queries

### Access Logs Bucket
- **Purpose**: CloudFront and load balancer access analysis
- **Retention**: 90+ days for operational analysis
- **Access**: CloudFront service principal write access
- **Format**: Standard access log format

## Security Considerations

### Encryption Strategy
- **At Rest**: All buckets encrypted with audit KMS keys
- **In Transit**: HTTPS required for all operations
- **Key Management**: Centralized KMS key management in Audit Account

### Access Controls
- **Cross-Account**: Minimal necessary permissions for Infrastructure Account
- **Service Principals**: Specific AWS service access only
- **Audit Trail**: All bucket access logged for security monitoring

### Data Protection
- **Versioning**: Protects against accidental deletion or modification
- **MFA Delete**: Additional protection for critical audit data
- **Replication**: Cross-region protection against data loss

## Operational Benefits
- **Centralized Storage**: Single location for all audit data
- **Cost Optimization**: Lifecycle policies reduce storage costs
- **Compliance**: Long-term retention meets regulatory requirements
- **Analytics Ready**: Structured storage enables log analysis tools

## Cost Implications
- **S3 Storage**: Tiered pricing based on lifecycle policies
- **Cross-Region Replication**: Additional storage and transfer costs in production
- **KMS Operations**: Encryption/decryption charges for log operations
- **Data Transfer**: Cross-account log delivery charges

## Compliance Benefits
- **Audit Trail**: Complete record of all system activities
- **Immutable Storage**: Versioning and MFA delete protect audit integrity
- **Long-Term Retention**: Meets regulatory requirements for log retention
- **Cross-Region Backup**: Disaster recovery for compliance data