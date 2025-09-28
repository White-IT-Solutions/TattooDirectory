# App Security Module (07-app-security)

## Overview
The App Security module provides application-level security resources deployed in the Infrastructure Account. It manages secrets for application use and implements Web Application Firewall (WAF) protection for the CloudFront distribution.

## Purpose
- Securely stores application secrets and credentials
- Protects the web application with comprehensive WAF rules
- Implements rate limiting and threat protection
- Provides centralized secret management for application components

## Resources Created

### Secrets Manager
- **aws_secretsmanager_secret.app_secrets**: General application secrets storage
- **aws_secretsmanager_secret_version.app_secrets**: Application secrets content
- **aws_secretsmanager_secret.opensearch_master**: OpenSearch master user credentials
- **aws_secretsmanager_secret_version.opensearch_master**: OpenSearch credentials content

### WAF Web ACL
- **aws_wafv2_web_acl.enhanced_frontend**: Comprehensive WAF protection for CloudFront
- **aws_wafv2_web_acl_logging_configuration.enhanced_frontend**: WAF logging configuration

## Key Features

### Secrets Management
- **Encryption**: All secrets encrypted with main KMS key
- **Lifecycle Management**: Environment-specific recovery windows (30 days prod, 0 days dev)
- **Version Control**: Automatic secret versioning with lifecycle ignore changes
- **Structured Storage**: JSON format for complex secret structures

### WAF Protection
- **Managed Rule Groups**: AWS-managed rules for common threats
- **Rate Limiting**: API-specific and general rate limiting rules
- **Threat Intelligence**: Anonymous IP lists and reputation-based blocking
- **Logging**: Comprehensive request logging with PII redaction

## WAF Rule Groups

### AWS Managed Rules
1. **AWSManagedRulesCommonRuleSet**: Core protection against OWASP Top 10
2. **AWSManagedRulesKnownBadInputsRuleSet**: Protection against known malicious inputs
3. **AWSManagedRulesAnonymousIpListRuleSet**: Blocks anonymous IP addresses (VPN, Tor)
4. **AWSManagedRulesUnixRuleSet**: Protection against Unix-specific attacks
5. **AWSManagedRulesAmazonIpReputationList**: AWS threat intelligence blocking

### Custom Rules
- **APIRateLimitRule**: 500 requests per 5 minutes for `/v1/artists` endpoint
- **GeneralRateLimitRule**: 2000 requests per 5 minutes per IP address

## Secret Structure

### Application Secrets
```json
{
  "opensearch_master_password": "generated_password",
  "app_password": "generated_password", 
  "database_url": "placeholder",
  "api_keys": {
    "external_service": "placeholder"
  }
}
```

### OpenSearch Master Credentials
```json
{
  "username": "admin",
  "password": "generated_password"
}
```

## Dependencies
- **Foundation Module**: Uses main KMS key ARN and generated passwords
- **Central Logging Module**: Uses WAF Firehose ARN for log delivery

## Outputs
- WAF Web ACL ARN for CloudFront association
- Secret ARNs for Lambda function access

## Integration with Other Modules

### Compute Module
- Lambda functions access secrets via Secrets Manager
- IAM roles include permissions for secret retrieval

### Search Module
- OpenSearch cluster uses master credentials from Secrets Manager
- Secure authentication without hardcoded passwords

### Delivery Module
- CloudFront distribution associates with WAF Web ACL
- Provides comprehensive protection for web application

### Central Logging Module
- WAF logs delivered via Kinesis Firehose to Audit Account
- Enables security analysis and threat detection

## Security Features

### Secret Protection
- **Encryption at Rest**: KMS encryption for all secrets
- **Access Control**: IAM-based access to specific secrets
- **Audit Trail**: CloudTrail logs all secret access
- **Rotation Support**: Infrastructure ready for secret rotation

### WAF Security
- **DDoS Protection**: Rate limiting prevents abuse
- **OWASP Coverage**: Protection against common web vulnerabilities
- **Threat Intelligence**: Real-time blocking of malicious IPs
- **Geographic Restrictions**: Combined with CloudFront geo-blocking

### Logging and Monitoring
- **Request Logging**: All WAF decisions logged
- **PII Redaction**: Sensitive headers (authorization, cookie) redacted
- **Metrics**: CloudWatch metrics for blocked/allowed requests
- **Alerting**: Integration with monitoring module for security alerts

## Operational Benefits
- **Centralized Secret Management**: Single source of truth for credentials
- **Automated Protection**: WAF rules automatically updated by AWS
- **Cost-Effective Security**: Managed rules reduce operational overhead
- **Compliance**: Audit trail for secret access and WAF decisions

## Rate Limiting Strategy
- **API Protection**: Specific limits for search endpoints
- **General Protection**: Broad rate limiting for all traffic
- **Graduated Response**: Different thresholds for different endpoints
- **IP-Based**: Per-IP rate limiting prevents individual abuse

## Cost Implications
- **Secrets Manager**: Per secret per month charges (~$0.40/secret)
- **WAF**: Per Web ACL and per request charges
- **Managed Rules**: Additional charges for AWS-managed rule groups
- **Logging**: CloudWatch Logs charges for WAF request logs

## Monitoring and Alerting
- WAF metrics available in CloudWatch
- Secret access logged in CloudTrail
- Integration with Security Monitoring module for alerts
- Rate limiting violations trigger monitoring events