Of course, here's a README file generated from the provided documentation.

# Tattoo Artist Directory - Infrastructure

This repository contains the complete infrastructure-as-code for the Tattoo Artist Directory application, built with **Terraform**. It defines a secure, scalable, and cost-effective serverless architecture on AWS.

***

## Architecture Overview

The application's infrastructure is built on a **fully serverless architecture** that spans multiple AWS accounts to ensure strong security and compliance boundaries. This design prioritises scalability, low operational overhead, and robust security.



### Multi-Account Strategy
To isolate resources and enhance security, the infrastructure is deployed across three distinct AWS accounts:

- **Infrastructure Account**: Hosts the core application resources, including Lambda functions, DynamoDB tables, and the API Gateway.
- **Security Account**: Provides centralised security monitoring and threat detection using services like AWS GuardDuty and Security Hub.
- **Audit Account**: Serves as a secure, centralised location for all logging data and backup storage, ensuring a clear audit trail.

***

## Modules

The infrastructure is broken down into **19 specialised Terraform modules**. Each module is responsible for a specific part of the architecture, from foundational security to application delivery.

### Foundational Modules (01-03)
- **01-foundation**: Core resources like KMS keys and code signing configurations.
- **03-audit-foundation**: Sets up the audit account with encryption keys for logging.

### Security & Logging (04-07)
- **04-central-logging**: Centralised logging with Kinesis Firehose.
- **05-networking**: The VPC, subnets, security groups, and NAT gateways.
- **06-central-security**: Manages GuardDuty, Security Hub, and IAM Access Analyzer.
- **07-app-security**: Handles application secrets and WAF protection.

### Data, Storage, & Search (08-10)
- **08-log-storage**: Central S3 buckets for audit logs with cross-region replication.
- **09-app-storage**: DynamoDB tables and S3 buckets for application data.
- **10-search**: An OpenSearch cluster for search and filtering.

### Compute & API (11-13)
- **11-iam**: All IAM roles and policies for the application.
- **12-compute**: Lambda functions, ECS Fargate tasks, and Step Functions.
- **13-api**: The API Gateway with CORS, throttling, and a custom domain.

### Monitoring & Operations (14-16)
- **14-security-monitoring**: Security-focused monitoring and alerting.
- **15-app-monitoring**: Application performance monitoring and dashboards.
- **16-backup**: Automated backup and disaster recovery.

### Governance & Delivery (17, 19)
- **17-governance**: AWS Config for compliance monitoring and CloudTrail for auditing.
- **19-delivery**: A CloudFront distribution for global content delivery.

For detailed information on each module, please refer to the documentation in the `docs/` directory.

***

## Key Features

### Security-First Design
Security is a core principle of this infrastructure, with a defence-in-depth approach:

- **Encryption**: All data is encrypted at rest and in transit using customer-managed KMS keys.
- **Network Isolation**: The application runs within a VPC with private subnets and tightly controlled security groups.
- **Least Privilege**: IAM roles and policies are configured to grant only the necessary permissions.
- **Threat Detection**: AWS GuardDuty and Security Hub provide continuous security monitoring and threat detection.
- **Compliance**: AWS Config rules and CloudTrail ensure the infrastructure remains compliant with defined standards.

### Environment-Specific Configurations
The infrastructure adapts to the needs of different environments:

- **Development**: Optimised for cost-efficiency and rapid iteration with a single NAT gateway, smaller instance sizes, and reduced backup frequency.
- **Production**: Designed for high availability and disaster recovery with a multi-AZ deployment, cross-region replication, and comprehensive backup plans.

***

## Getting Started

### Prerequisites
- **AWS CLI** configured with the necessary permissions.
- **Terraform** v1.0 or later installed on your local machine.
- A solid understanding of **AWS services** and **Terraform**.

### Deployment
To deploy the infrastructure, you'll need to apply the modules in the correct order to satisfy dependencies. The general deployment flow is as follows:

1.  **Foundation**: Deploy modules **01** and **03**.
2.  **Security & Networking**: Deploy modules **04** through **07**.
3.  **Storage & Data**: Deploy modules **08** through **10**.
4.  **Compute & API**: Deploy modules **11** through **13**.
5.  **Monitoring & Delivery**: Deploy modules **14** through **17**, and **19**.