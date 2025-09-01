# Terraform Modules Documentation

This directory contains comprehensive documentation for all Terraform modules used in the Tattoo Artist Directory MVP infrastructure. Each module is designed to handle specific aspects of the serverless architecture while maintaining security, scalability, and cost-effectiveness.

## Module Overview

The infrastructure is organized into 19 specialized modules that work together to create a complete serverless application platform:

### Foundation Modules (01-03)
- **[01-foundation](./01-foundation.md)**: Core foundational resources including KMS keys, random values, and code signing
- **[03-audit-foundation](./03-audit-foundation.md)**: Audit account foundation with encryption keys for centralized logging

### Security & Logging (04-07)
- **[04-central-logging](./04-central-logging.md)**: Centralized logging infrastructure with Kinesis Firehose for WAF logs
- **[05-networking](./05-networking.md)**: VPC, subnets, security groups, NAT gateways, and VPC endpoints
- **[06-central-security](./06-central-security.md)**: GuardDuty, Security Hub, and IAM Access Analyzer for organization-wide security
- **[07-app-security](./07-app-security.md)**: Application secrets management and WAF protection

### Data & Storage (08-10)
- **[08-log-storage](./08-log-storage.md)**: Centralized S3 buckets for audit logs with cross-region replication
- **[09-app-storage](./09-app-storage.md)**: DynamoDB tables and S3 buckets for application data and frontend hosting
- **[10-search](./10-search.md)**: OpenSearch cluster for full-text search and filtering capabilities

### Compute & API (11-13)
- **[11-iam](./11-iam.md)**: IAM roles and policies for all application components
- **[12-compute](./12-compute.md)**: Lambda functions, ECS Fargate, and Step Functions for serverless compute
- **[13-api](./13-api.md)**: API Gateway HTTP API with CORS, throttling, and custom domain support

### Monitoring & Operations (14-16)
- **[14-security-monitoring](./14-security-monitoring.md)**: Security-focused monitoring, alerting, and Log Insights queries
- **[15-app-monitoring](./15-app-monitoring.md)**: Application performance monitoring, dashboards, and operational alerts
- **[16-backup](./16-backup.md)**: Automated backup and disaster recovery with cross-region replication

### Governance & Delivery (17, 19)
- **[17-governance](./17-governance.md)**: AWS Config compliance monitoring, CloudTrail audit logging, and automated remediation
- **[19-delivery](./19-delivery.md)**: CloudFront distribution for global content delivery and API integration

## Architecture Overview

### Multi-Account Strategy
The infrastructure spans multiple AWS accounts for security and compliance:
- **Infrastructure Account**: Main application resources (Lambda, DynamoDB, API Gateway)
- **Security Account**: Centralized security monitoring (GuardDuty, Security Hub)
- **Audit Account**: Centralized logging and backup storage

### Serverless Architecture
The platform uses a fully serverless architecture:
- **Compute**: AWS Lambda and ECS Fargate
- **Storage**: DynamoDB (NoSQL) and S3 (object storage)
- **Search**: Amazon OpenSearch for full-text search
- **API**: API Gateway for RESTful endpoints
- **CDN**: CloudFront for global content delivery

### Security-First Design
Security is built into every layer:
- **Encryption**: Customer-managed KMS keys for all data
- **Network**: VPC with private subnets and security groups
- **Access**: IAM roles with least-privilege permissions
- **Monitoring**: Comprehensive security monitoring and alerting
- **Compliance**: Automated compliance checking with AWS Config

## Module Dependencies

### Dependency Flow
```
01-foundation (base)
├── 03-audit-foundation
├── 04-central-logging
├── 05-networking
├── 06-central-security
├── 07-app-security
├── 08-log-storage
├── 09-app-storage
├── 10-search
├── 11-iam
├── 12-compute
├── 13-api
├── 14-security-monitoring
├── 15-app-monitoring
├── 16-backup
├── 17-governance
└── 19-delivery
```

### Key Integration Points
- **Foundation modules** provide KMS keys and basic resources used by all other modules
- **Networking module** provides VPC infrastructure used by compute and data modules
- **IAM module** provides roles and policies used by all application modules
- **Storage modules** provide data persistence used by compute modules
- **Monitoring modules** observe all other modules for operational visibility

## Environment-Specific Behavior

### Development Environment
- **Cost Optimized**: Single NAT gateway, smaller instance sizes
- **Simplified**: Reduced redundancy and backup frequency
- **Faster Iteration**: Auto-deploy enabled, shorter retention periods

### Production Environment
- **High Availability**: Multi-AZ deployment, dedicated master nodes
- **Enhanced Security**: Code signing, vault locks, extended retention
- **Disaster Recovery**: Cross-region replication, comprehensive backup

## Key Features by Module

### Data Processing Pipeline
1. **Web Scraping**: ECS Fargate tasks discover studios and artists
2. **Data Storage**: DynamoDB stores structured data with single-table design
3. **Search Indexing**: Lambda functions sync data to OpenSearch
4. **API Access**: API Gateway provides RESTful endpoints
5. **Global Delivery**: CloudFront serves content globally

### Security & Compliance
1. **Threat Detection**: GuardDuty monitors for security threats
2. **Compliance Monitoring**: Config rules ensure compliance
3. **Audit Logging**: CloudTrail logs all API activities
4. **Centralized Logging**: All logs stored in Audit Account
5. **Automated Remediation**: Config remediation fixes violations

### Monitoring & Operations
1. **Application Monitoring**: CloudWatch monitors performance
2. **Security Monitoring**: Specialized security alerting
3. **Backup & Recovery**: Automated backup with cross-region replication
4. **Disaster Recovery**: Multi-region failover capabilities

## Cost Optimization Strategies

### Development Cost Savings
- Single NAT gateway instead of multi-AZ
- Smaller instance types for OpenSearch and Lambda
- Reduced backup frequency and retention
- Single-region deployment

### Production Optimizations
- Reserved instances for predictable workloads
- Lifecycle policies for S3 storage optimization
- VPC endpoints to reduce NAT gateway costs
- Spot instances for non-critical ECS tasks

## Security Best Practices

### Defense in Depth
- **Network**: VPC, security groups, NACLs
- **Application**: WAF, input validation, rate limiting
- **Data**: Encryption at rest and in transit
- **Access**: IAM roles, least privilege, MFA
- **Monitoring**: Real-time threat detection and alerting

### Compliance Framework
- **AWS Config**: Continuous compliance monitoring
- **CloudTrail**: Comprehensive audit logging
- **GuardDuty**: Threat detection and response
- **Security Hub**: Centralized security findings
- **Backup**: Data protection and recovery

## Getting Started

### Prerequisites
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0 installed
- Understanding of AWS services and Terraform

### Deployment Order
1. Deploy foundation modules (01, 03)
2. Deploy networking and security (04-07)
3. Deploy storage and data (08-10)
4. Deploy compute and API (11-13)
5. Deploy monitoring and operations (14-17, 19)

### Configuration
Each module accepts a `context` variable containing shared configuration:
- Environment settings (dev/prod)
- AWS account IDs and regions
- Common tags and naming conventions
- Feature flags and toggles

## Support and Maintenance

### Documentation Updates
- Module documentation should be updated when resources change
- Include new features, dependencies, and integration points
- Update cost implications and operational considerations

### Module Versioning
- Use semantic versioning for module releases
- Test changes in development environment first
- Maintain backward compatibility when possible

### Monitoring and Alerting
- Each module includes relevant CloudWatch metrics
- Alarms configured for operational and security events
- Integration with centralized notification systems

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Project Documentation](../README.md)

---

*This documentation is maintained as part of the Tattoo Artist Directory MVP infrastructure. For questions or updates, please refer to the project repository.*