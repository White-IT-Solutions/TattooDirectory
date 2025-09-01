# Central Security Module (06-central-security)

## Overview
The Central Security module establishes organization-wide security monitoring and threat detection capabilities deployed in the Security Account. It provides centralized security services including GuardDuty, Security Hub, and IAM Access Analyzer.

## Purpose
- Implements organization-wide threat detection with GuardDuty
- Centralizes security findings and compliance monitoring with Security Hub
- Provides access analysis across the organization with IAM Access Analyzer
- Establishes cross-account log auditing capabilities

## Resources Created

### GuardDuty
- **aws_guardduty_detector.main**: Central GuardDuty detector for threat detection
- **aws_guardduty_organization_configuration.main**: Organization-wide GuardDuty configuration
  - Auto-enables GuardDuty for all organization members
  - Enables S3 protection for data events
  - Disables Kubernetes protection (not using EKS)
  - Disables EC2 malware protection (not using EC2)

### Security Hub
- **aws_securityhub_account.main**: Central Security Hub account configuration
- **aws_securityhub_organization_configuration.main**: Organization-wide Security Hub setup
- **aws_securityhub_standards_subscription.foundational_security**: AWS Foundational Security Best Practices
- **aws_securityhub_standards_subscription.cis**: CIS AWS Foundations Benchmark

### IAM Access Analyzer
- **aws_accessanalyzer_analyzer.main**: Organization-wide access analyzer for IAM policies

### Cross-Account Log Auditing
- **aws_iam_role.log_auditor**: Role for security personnel to access audit logs
- **aws_iam_policy.log_reader**: Policy granting read access to log archive buckets
- **aws_iam_role_policy_attachment.log_auditor_attachment**: Attaches policy to role

## Key Features

### Organization-Wide Coverage
- **GuardDuty**: Automatically enables for all organization accounts
- **Security Hub**: Centralized findings aggregation across accounts
- **Access Analyzer**: Organization-wide IAM policy analysis

### Automated Security Monitoring
- **Threat Detection**: GuardDuty monitors for malicious activity
- **Compliance Checking**: Security Hub standards provide continuous compliance monitoring
- **Access Analysis**: Identifies unintended external access to resources

### Cross-Account Audit Access
- **Log Auditor Role**: Allows security team to access logs in Log Archive account
- **Least Privilege**: Role limited to read-only access to specific log buckets
- **KMS Integration**: Includes permissions to decrypt audit logs

## Dependencies
- **Audit Foundation Module**: Uses audit account configuration
- **Log Storage Module**: Requires log archive bucket ARNs and KMS key ARN
- Must be deployed in the Security Account (delegated administrator)

## Outputs
- No direct outputs (security services are consumed by other accounts)
- Log auditor role ARN available for cross-account access

## Integration with Other Modules

### Security Monitoring Module
- Consumes GuardDuty findings for alerting
- Uses Security Hub findings for compliance dashboards
- Creates alarms based on security service metrics

### Log Storage Module
- Log auditor role accesses logs stored in Audit Account
- Provides security team access to CloudTrail, Config, and VPC Flow Logs

### Governance Module
- Security Hub receives Config compliance findings
- GuardDuty findings integrated with CloudTrail analysis

## Security Standards Enabled

### AWS Foundational Security Best Practices
- Comprehensive set of security controls
- Covers IAM, S3, EC2, Lambda, and other services
- Automatically updated as new controls are released

### CIS AWS Foundations Benchmark
- Industry-standard security baseline
- Additional layer of compliance checking
- Focuses on fundamental security configurations

## Operational Benefits

### Centralized Security Management
- Single pane of glass for security across organization
- Automated threat detection and response capabilities
- Standardized security posture across all accounts

### Compliance Automation
- Continuous compliance monitoring
- Automated security standard assessments
- Centralized findings management and remediation tracking

### Incident Response Support
- GuardDuty provides detailed threat intelligence
- Security Hub aggregates findings for investigation
- Log auditor role enables forensic analysis

## Monitoring and Alerting
- GuardDuty findings trigger automated alerts
- Security Hub compliance scores monitored
- Access Analyzer findings reviewed for policy violations

## Cost Implications
- **GuardDuty**: Usage-based pricing for data analysis
- **Security Hub**: Per finding and per compliance check charges
- **Access Analyzer**: No additional charges for organization analyzer
- **Cross-Account Access**: Minimal data transfer charges for log access

## Compliance Benefits
- Meets requirements for centralized security monitoring
- Provides audit trail for security investigations
- Supports regulatory compliance with automated checks
- Enables security team oversight across organization