# Central Logging Module (04-central-logging)

## Overview
The Central Logging module establishes centralized logging infrastructure deployed in the Security Account. It creates CloudWatch Log Groups for security tools and sets up Kinesis Data Firehose for WAF log delivery to the Audit Account.

## Purpose
- Centralizes security tool logging in the Security Account
- Provides cross-account log aggregation for API Gateway logs
- Establishes WAF log streaming to S3 via Kinesis Firehose
- Supports incident response and security monitoring workflows

## Resources Created

### CloudWatch Log Groups
- **aws_cloudwatch_log_group.security_tools**: Logs for Security Hub and other security tools
- **aws_cloudwatch_log_group.incident_response**: Logs for incident response automation
- **aws_cloudwatch_log_group.api_gateway**: API Gateway access logs from Infrastructure Account
- **aws_cloudwatch_log_group.firehose_waf_errors**: Firehose delivery error logs

### Kinesis Data Firehose
- **aws_kinesis_firehose_delivery_stream.waf_logs**: Streams WAF logs to S3 in Audit Account
- **aws_iam_role.firehose_waf**: IAM role for Firehose to write to S3
- **aws_iam_policy.firehose_waf**: Policy granting S3 write permissions

## Key Features

### Cross-Account Integration
- API Gateway logs from Infrastructure Account stored in Security Account
- WAF logs delivered to Audit Account S3 bucket via Firehose
- Cross-account IAM permissions for log delivery

### Data Processing
- **Compression**: GZIP compression for efficient storage
- **Partitioning**: Time-based partitioning (year/month/day/hour)
- **Error Handling**: Separate error output prefix for failed deliveries

### Security
- All log groups encrypted with KMS keys from Audit Foundation
- Firehose stream encrypted in transit and at rest
- IAM roles follow least-privilege principles

### Retention Policies
- Security tools: 365 days (prod), 90 days (dev)
- Incident response: 365 days (prod), 90 days (dev)
- API Gateway: Configurable via context.log_retention_days
- Firehose errors: 30 days

## Dependencies
- **Audit Foundation Module**: Requires KMS key ARNs for encryption
- **Log Storage Module**: Requires WAF logs bucket ARN from Audit Account
- Must be deployed in the Security Account

## Outputs
- **security_tools_log_group_arn**: ARN for security tools logging
- **incident_response_log_group_arn**: ARN for incident response logging
- **api_gateway_log_group_arn**: ARN for API Gateway cross-account logging
- **waf_firehose_arn**: ARN of WAF log delivery stream

## Integration with Other Modules

### API Module
- Uses api_gateway_log_group_arn for access logging
- Enables centralized API monitoring and security analysis

### App Security Module
- WAF Web ACL uses waf_firehose_arn for log delivery
- Enables security event analysis and threat detection

### Security Monitoring Module
- Consumes logs from security tools log group
- Creates alarms and metrics based on centralized logs

### Log Storage Module
- Receives WAF logs via Firehose delivery
- Stores logs in encrypted S3 buckets

## Operational Benefits
- **Centralized Security Logging**: All security-related logs in one account
- **Real-time Processing**: Firehose enables near real-time log delivery
- **Cost Optimization**: Compression and partitioning reduce storage costs
- **Compliance**: Centralized audit trail meets regulatory requirements

## Monitoring and Alerting
- Firehose delivery errors logged to CloudWatch
- CloudWatch metrics available for delivery success/failure
- Integration with Security Monitoring module for alerting

## Cost Implications
- CloudWatch Log Groups: Storage and ingestion charges
- Kinesis Firehose: Data processing and delivery charges
- Cross-account data transfer: Minimal charges for log delivery
- KMS encryption: Per-request charges for encrypt/decrypt operations