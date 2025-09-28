# Audit Foundation Module (03-audit-foundation)

## Overview
The Audit Foundation module creates foundational security resources specifically for the Audit Account. This module establishes encryption keys for centralized logging and audit data storage across the organization.

## Purpose
- Provides KMS encryption keys for the Audit Account
- Enables secure cross-account logging and audit data collection
- Establishes encryption standards for CloudWatch Logs and audit storage
- Supports centralized security monitoring and compliance

## Resources Created

### Data Sources
- **aws_caller_identity.current**: Gets current AWS account information
- **aws_region.current**: Gets current AWS region information

### KMS Keys
- **aws_kms_key.logs**: KMS key specifically for CloudWatch Logs encryption in the Audit account
- **aws_kms_alias.logs**: Alias for the logs KMS key (`alias/{name_prefix}-logs`)
- **aws_kms_key.audit**: KMS key for encrypting S3 buckets and Backup vaults in the Audit account
- **aws_kms_alias.audit**: Alias for the audit KMS key (`alias/{name_prefix}-audit`)

## Key Features

### Cross-Account Access
- **Logs KMS Key**: Allows CloudWatch Logs service and Infrastructure Account access
- **Audit KMS Key**: Supports multiple AWS services (S3, CloudTrail, Config, Backup, VPC Flow Logs)
- Conditional access based on source account verification

### Security Policies
- Restrictive key policies limiting access to specific accounts and services
- Encryption context validation for CloudWatch Logs
- Service-specific permissions for audit data collection

### Environment-Specific Behavior
- Production: 30-day KMS key deletion window
- Development: 7-day KMS key deletion window
- Key rotation enabled for both environments

## Dependencies
- Requires audit account ID and infrastructure account ID in context
- Must be deployed in the Audit Account

## Outputs
- **kms_key_audit_arn**: ARN of the audit KMS key for S3 and backup encryption
- **kms_key_audit_id**: ID of the audit KMS key
- **kms_key_logs_arn**: ARN of the logs KMS key for CloudWatch encryption
- **kms_key_logs_id**: ID of the logs KMS key

## Integration with Other Modules

### Central Logging Module
- Uses logs KMS key for CloudWatch Log Groups
- Encrypts security tools and incident response logs

### Log Storage Module
- Uses audit KMS key for S3 bucket encryption
- Encrypts CloudTrail, Config, VPC Flow Logs, and WAF logs

### Networking Module
- VPC Flow Logs encrypted with audit KMS key
- Cross-account log delivery to Audit Account

### Governance Module
- CloudTrail logs encrypted with audit KMS key
- Config delivery channel uses audit encryption

## Security Considerations
- Keys are managed in the Audit Account for centralized control
- Cross-account access is strictly controlled with external ID validation
- Service principals are limited to specific AWS services
- Encryption context validation prevents unauthorized access

## Compliance Benefits
- Centralized audit log encryption meets compliance requirements
- Immutable audit trail with proper encryption
- Cross-account access logging for security monitoring
- Supports regulatory requirements for data protection

## Cost Implications
- Two KMS keys incur monthly charges (~$2/month total)
- Cross-account data transfer charges may apply for log delivery
- Encryption/decryption operations have minimal per-request costs