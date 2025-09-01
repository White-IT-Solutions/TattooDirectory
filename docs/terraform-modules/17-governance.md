# Governance Module (17-governance)

## Overview
The Governance module implements comprehensive governance, compliance, and audit capabilities for the tattoo artist directory infrastructure. It deploys AWS Config for compliance monitoring, CloudTrail for audit logging, and creates compliance dashboards and automated remediation workflows.

## Purpose
- Provides continuous compliance monitoring with AWS Config rules
- Implements comprehensive audit logging with CloudTrail
- Enables automated remediation of compliance violations
- Creates compliance dashboards and reporting for governance oversight

## Resources Created

### AWS Config Infrastructure
- **aws_config_configuration_recorder.main**: Records resource configurations and changes
- **aws_config_delivery_channel.main**: Delivers configuration data to S3 bucket
- **aws_config_config_rule.managed_rules**: Comprehensive set of compliance rules
- **aws_config_remediation_configuration**: Automated remediation for violations

### CloudTrail Audit Logging
- **aws_cloudtrail.main**: Multi-region CloudTrail for comprehensive API logging
- **aws_cloudwatch_log_group.cloudtrail**: CloudWatch log group for real-time analysis

### SNS Notifications
- **aws_sns_topic.config_notifications**: Config compliance notifications
- **aws_sns_topic.cloudtrail_notifications**: CloudTrail event notifications

### Compliance Dashboard
- **aws_cloudwatch_dashboard.compliance**: Compliance overview and metrics dashboard

## Key Features

### Comprehensive Config Rules
- **S3 Security**: Bucket encryption, public access, and versioning rules
- **DynamoDB Security**: Encryption and point-in-time recovery rules
- **Lambda Security**: VPC deployment, concurrency, and access rules
- **API Gateway**: Execution logging and security rules
- **CloudFront**: Origin access control and HTTPS enforcement
- **VPC Security**: Default security group and flow logs rules
- **IAM Security**: Policy and user management rules
- **KMS Security**: Key rotation and deletion protection

### Automated Remediation
- **S3 Public Access**: Automatically removes public access from S3 buckets
- **Security Groups**: Closes overly permissive security group rules
- **IAM Policies**: Removes excessive permissions from IAM policies
- **Resource Tagging**: Applies required tags to resources

### Multi-Region Audit Trail
- **Global Events**: Captures IAM, CloudFront, and Route 53 events
- **Data Events**: Logs S3 object and DynamoDB item access
- **Management Events**: All API calls across all regions
- **Insight Events**: API call rate analysis for anomaly detection

## Config Rules Implementation

### Security Rules
```hcl
"s3-bucket-public-access-prohibited"
"s3-bucket-server-side-encryption-enabled"
"dynamodb-table-encryption-enabled"
"dynamodb-pitr-enabled"
"lambda-function-public-access-prohibited"
"lambda-inside-vpc"
"api-gw-execution-logging-enabled"
"cloudfront-origin-access-control-enabled"
"cloudfront-viewer-policy-https"
"vpc-default-security-group-closed"
"vpc-flow-logs-enabled"
"iam-policy-no-statements-with-admin-access"
"iam-user-no-policies-check"
"kms-cmk-not-scheduled-for-deletion"
```

### Rule Parameters
- **Lambda Concurrency**: Monitors concurrency limits (1-100)
- **Resource Tagging**: Validates required tags (Environment, Project)
- **Encryption Standards**: Ensures customer-managed KMS keys
- **Access Controls**: Validates least-privilege access patterns

## CloudTrail Configuration

### Event Selection
- **Management Events**: All read and write operations
- **Data Events**: 
  - S3 object-level operations on frontend bucket
  - DynamoDB item-level operations on main table
- **Insight Events**: API call rate analysis
- **Global Services**: IAM, CloudFront, Route 53 events

### Log Delivery
- **S3 Bucket**: Centralized bucket in Audit Account
- **CloudWatch Logs**: Real-time log delivery for analysis
- **SNS Notifications**: Event notifications for monitoring
- **Encryption**: KMS encryption for log files

## Dependencies
- **Log Storage Module**: Uses CloudTrail and Config S3 buckets
- **Audit Foundation Module**: Uses KMS keys for encryption
- **Foundation Module**: Uses main KMS key for CloudTrail encryption
- **App Storage Module**: Monitors DynamoDB table compliance
- **Networking Module**: Monitors VPC and security group compliance

## Outputs
- **cloudtrail_arn**: CloudTrail ARN for monitoring integration
- **config_recorder_name**: Config recorder name for rule management
- **compliance_dashboard_url**: Dashboard URL for compliance overview

## Integration with Other Modules

### Security Monitoring Module
- Config compliance findings trigger security alerts
- CloudTrail logs analyzed for security events and anomalies

### Log Storage Module
- CloudTrail and Config data stored in centralized audit buckets
- Long-term retention for compliance and forensic analysis

### Central Security Module
- Config findings integrated with Security Hub
- GuardDuty analyzes CloudTrail logs for threat detection

### IAM Module
- Config rules validate IAM policy compliance
- CloudTrail logs all IAM operations for audit

## Compliance Rules Details

### S3 Compliance
- **Encryption**: All buckets must use server-side encryption
- **Public Access**: Public access blocked on all buckets
- **Versioning**: Versioning enabled for data protection
- **Logging**: Access logging enabled for audit trail

### DynamoDB Compliance
- **Encryption**: Customer-managed KMS encryption required
- **PITR**: Point-in-time recovery enabled for data protection
- **Backup**: Regular backups configured and monitored

### Lambda Compliance
- **VPC Deployment**: Functions deployed in VPC for security
- **Public Access**: No public access to Lambda functions
- **Concurrency**: Appropriate concurrency limits configured
- **Logging**: CloudWatch logging enabled for all functions

### Network Compliance
- **Security Groups**: Default security group has no rules
- **Flow Logs**: VPC Flow Logs enabled for monitoring
- **NACLs**: Network ACLs configured appropriately
- **Endpoints**: VPC endpoints used for AWS service access

## Automated Remediation

### S3 Bucket Remediation
- **Action**: Remove public access from S3 buckets
- **Trigger**: s3-bucket-public-access-prohibited rule violation
- **Method**: SSM document execution
- **Approval**: Manual approval required for safety

### Security Group Remediation
- **Action**: Remove overly permissive rules
- **Trigger**: Security group compliance violations
- **Method**: Lambda function execution
- **Validation**: Verify no service disruption

## Compliance Dashboard

### Overview Metrics
- **Compliance Score**: Overall compliance percentage
- **Rule Status**: Compliant vs non-compliant resources
- **Trend Analysis**: Compliance trends over time
- **Critical Violations**: High-priority compliance issues

### Resource Breakdown
- **By Service**: Compliance status by AWS service
- **By Environment**: Development vs production compliance
- **By Rule**: Individual rule compliance rates
- **By Account**: Multi-account compliance overview

## Notification Configuration

### Config Notifications
- **Compliance Changes**: Notifications when resources become non-compliant
- **Rule Evaluations**: Periodic evaluation status updates
- **Remediation Actions**: Notifications when automated remediation occurs

### CloudTrail Notifications
- **High-Risk Events**: Root account usage, policy changes
- **Security Events**: Failed authentication, unauthorized access
- **Operational Events**: Resource creation, deletion, modification

## Audit and Forensics

### Investigation Capabilities
- **Event Timeline**: Chronological view of all API calls
- **User Activity**: Track individual user actions
- **Resource Changes**: Complete history of resource modifications
- **Cross-Service Correlation**: Correlate events across services

### Forensic Analysis
- **Data Events**: Object and item-level access patterns
- **Management Events**: Administrative actions and changes
- **Error Analysis**: Failed operations and access attempts
- **Anomaly Detection**: Unusual patterns and behaviors

## Security Considerations

### Data Protection
- **Encryption**: All logs encrypted with customer-managed KMS keys
- **Access Control**: Restrictive IAM policies for log access
- **Integrity**: Log file validation prevents tampering
- **Retention**: Long-term retention for compliance requirements

### Audit Trail Integrity
- **Immutable Logs**: CloudTrail logs cannot be modified
- **Validation**: Log file integrity validation enabled
- **Cross-Region**: Multi-region logging for redundancy
- **Real-Time**: CloudWatch Logs for immediate analysis

## Operational Benefits
- **Continuous Monitoring**: 24/7 compliance and security monitoring
- **Automated Remediation**: Reduces manual intervention for common issues
- **Centralized Visibility**: Single dashboard for compliance status
- **Audit Readiness**: Always ready for compliance audits

## Cost Implications
- **Config Rules**: Per-rule evaluation charges
- **CloudTrail**: Data event charges for S3 and DynamoDB logging
- **CloudWatch Logs**: Log ingestion and storage charges
- **S3 Storage**: Long-term storage costs for audit logs
- **Remediation**: SSM document execution charges

## Compliance Frameworks Supported
- **AWS Well-Architected**: Security and operational excellence pillars
- **CIS Benchmarks**: Center for Internet Security benchmarks
- **SOC 2**: System and Organization Controls compliance
- **ISO 27001**: Information security management standards
- **GDPR**: Data protection and privacy requirements
- **PCI DSS**: Payment card industry security standards

## Reporting and Analytics
- **Compliance Reports**: Regular compliance status reports
- **Trend Analysis**: Historical compliance trends and patterns
- **Risk Assessment**: Identification of high-risk configurations
- **Remediation Tracking**: Progress on compliance improvements