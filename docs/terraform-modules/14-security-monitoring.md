# Security Monitoring Module (14-security-monitoring)

## Overview
The Security Monitoring module establishes comprehensive security monitoring and alerting capabilities deployed in the Security Account. It creates CloudWatch alarms, metric filters, and Log Insights queries to detect security threats, compliance violations, and suspicious activities across the organization.

## Purpose
- Monitors security services (GuardDuty, Config, CloudTrail) for threats and compliance issues
- Creates automated alerts for security incidents and policy violations
- Provides security-focused dashboards and queries for investigation
- Enables proactive threat detection and incident response

## Resources Created

### SNS Topics and Subscriptions
- **aws_sns_topic.security_alerts**: Central topic for all security notifications
- **aws_sns_topic_subscription.security_email**: Email notifications for security team

### CloudWatch Alarms - GuardDuty
- **aws_cloudwatch_metric_alarm.guardduty_findings**: Alerts on any GuardDuty findings

### CloudWatch Alarms - Config
- **aws_cloudwatch_metric_alarm.config_compliance**: Alerts on Config compliance violations

### CloudWatch Alarms - CloudTrail
- **aws_cloudwatch_metric_alarm.cloudtrail_errors**: Alerts on CloudTrail logging errors
- **aws_cloudwatch_metric_alarm.cloudtrail_security_alerts**: Alerts on security-related API calls

### Metric Filters
- **aws_cloudwatch_log_metric_filter.cloudtrail_security_alerts**: Filters CloudTrail logs for security events

### Log Insights Queries
- **aws_cloudwatch_query_definition.security_events**: Pre-built queries for security investigation
- **aws_cloudwatch_query_definition.failed_logins**: Queries for authentication failures
- **aws_cloudwatch_query_definition.root_usage**: Queries for root account usage

## Key Features

### Automated Threat Detection
- **Real-Time Alerts**: Immediate notifications for security findings
- **Threat Intelligence**: Integration with AWS threat intelligence feeds
- **Behavioral Analysis**: Detection of unusual access patterns and activities

### Compliance Monitoring
- **Config Rules**: Monitors compliance with security standards
- **Policy Violations**: Alerts on IAM policy and resource configuration issues
- **Audit Trail**: Comprehensive logging of all security-related events

### Incident Response Support
- **Pre-Built Queries**: Ready-to-use Log Insights queries for investigation
- **Centralized Alerting**: Single SNS topic for all security notifications
- **Contextual Information**: Rich alarm descriptions with investigation guidance

## Security Event Detection

### CloudTrail Security Events
- **Unauthorized Operations**: Failed API calls due to insufficient permissions
- **Access Denied Events**: Attempts to access restricted resources
- **Suspicious IP Addresses**: API calls from non-AWS IP addresses
- **Root Account Usage**: Any usage of root account credentials

### Metric Filter Pattern
```
{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") || ($.sourceIPAddress != "AWS Internal") }
```

### GuardDuty Integration
- **Threat Detection**: Monitors for malicious activity and compromised instances
- **DNS Exfiltration**: Detection of data exfiltration via DNS
- **Cryptocurrency Mining**: Detection of unauthorized mining activities
- **Malware Communication**: Detection of communication with known malicious domains

## Alarm Configuration

### GuardDuty Findings Alarm
- **Metric**: FindingCount from AWS/GuardDuty namespace
- **Threshold**: Greater than 0 (any finding triggers alert)
- **Evaluation**: 1 period of 5 minutes
- **Action**: Publishes to security alerts SNS topic

### Config Compliance Alarm
- **Metric**: ComplianceByConfigRule from AWS/Config namespace
- **Threshold**: Less than 1 (non-compliant resources)
- **Evaluation**: 2 periods of 5 minutes
- **Action**: Publishes to security alerts SNS topic

### CloudTrail Security Alarm
- **Metric**: Custom metric from CloudTrail log filter
- **Threshold**: Greater than or equal to 1 security event
- **Evaluation**: 1 period of 5 minutes
- **Action**: Publishes to security alerts SNS topic

## Dependencies
- **Central Security Module**: Requires GuardDuty detector ID
- **Audit Foundation Module**: Uses KMS key for SNS topic encryption
- **Governance Module**: Requires CloudTrail log group name for metric filters

## Outputs
- **security_alerts_topic_arn**: SNS topic ARN for security notifications
- **alarm_arns**: CloudWatch alarm ARNs for external integration

## Integration with Other Modules

### Central Security Module
- Monitors GuardDuty findings from organization-wide detector
- Receives Security Hub compliance findings for alerting

### Governance Module
- Analyzes CloudTrail logs for security events
- Monitors Config compliance status across accounts

### Central Logging Module
- Uses centralized log groups for security analysis
- Correlates events across multiple log sources

## Log Insights Queries

### Security Events Query
```sql
fields @timestamp, @message, sourceIPAddress, userIdentity.type, eventName
| filter eventName like /Delete/ or eventName like /Create/ or eventName like /Put/
| sort @timestamp desc
| limit 100
```

### Failed Logins Query
```sql
fields @timestamp, @message, sourceIPAddress, userIdentity, errorCode, errorMessage
| filter errorCode = "SigninFailure" or errorCode = "InvalidUserID.NotFound"
| sort @timestamp desc
| limit 100
```

### Root Usage Query
```sql
fields @timestamp, @message, sourceIPAddress, userIdentity, eventName
| filter userIdentity.type = "Root"
| sort @timestamp desc
| limit 100
```

## Alert Severity Levels

### Critical Alerts
- GuardDuty HIGH severity findings
- Root account usage
- Multiple failed authentication attempts
- Config compliance failures for critical rules

### Warning Alerts
- GuardDuty MEDIUM severity findings
- Unusual API call patterns
- Config compliance failures for non-critical rules
- CloudTrail logging errors

### Informational Alerts
- GuardDuty LOW severity findings
- Successful security-related API calls
- Config rule evaluations

## Notification Configuration

### Email Notifications
- **Recipients**: Security team email addresses
- **Format**: JSON format with alarm details
- **Frequency**: Immediate for critical alerts
- **Filtering**: Optional filtering by severity level

### Integration Options
- **Slack**: SNS to Slack webhook integration
- **PagerDuty**: SNS to PagerDuty for on-call alerts
- **SIEM**: SNS to SIEM system for correlation
- **Ticketing**: Automatic ticket creation for incidents

## Security Considerations

### Alert Integrity
- **SNS Encryption**: Topics encrypted with KMS keys
- **Access Control**: Restrictive IAM policies for SNS access
- **Message Signing**: SNS message signing for authenticity

### False Positive Management
- **Tuning**: Regular review and tuning of alarm thresholds
- **Suppression**: Ability to suppress known false positives
- **Context**: Rich alarm descriptions to aid in triage

## Operational Benefits
- **Proactive Detection**: Early warning of security threats
- **Centralized Monitoring**: Single pane of glass for security events
- **Automated Response**: Immediate alerts enable rapid response
- **Compliance**: Continuous monitoring supports compliance requirements

## Investigation Workflow
1. **Alert Reception**: Security team receives SNS notification
2. **Initial Triage**: Review alarm details and context
3. **Log Analysis**: Use pre-built Log Insights queries
4. **Threat Assessment**: Determine severity and impact
5. **Response Action**: Implement appropriate response measures
6. **Documentation**: Record findings and actions taken

## Cost Implications
- **CloudWatch Alarms**: Per-alarm monthly charges
- **SNS**: Per-notification charges for alerts
- **Log Insights**: Query execution charges
- **Data Retention**: CloudWatch Logs storage charges

## Compliance Benefits
- **Audit Trail**: Complete record of security monitoring activities
- **Incident Documentation**: Automated logging of security events
- **Regulatory Compliance**: Supports SOC 2, ISO 27001, and other frameworks
- **Continuous Monitoring**: 24/7 security monitoring capabilities