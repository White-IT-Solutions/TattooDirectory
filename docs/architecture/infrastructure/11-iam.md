# IAM Module (11-iam)

## Overview
The IAM module creates all necessary Identity and Access Management (IAM) roles and policies for the tattoo artist directory application. It establishes least-privilege access controls for Lambda functions, ECS tasks, Step Functions, and cross-account services while maintaining security best practices.

## Purpose
- Provides secure access controls for all application components
- Implements least-privilege principle for service permissions
- Enables cross-account access for centralized logging and backup
- Supports automated workflows with Step Functions and ECS

## Resources Created

### Lambda Execution Roles
- **aws_iam_role.lambda_api**: API handler Lambda functions
- **aws_iam_role.lambda_sync**: DynamoDB to OpenSearch synchronization
- **aws_iam_role.lambda_discover_studios**: Studio discovery workflow
- **aws_iam_role.lambda_find_artists**: Artist discovery workflow  
- **aws_iam_role.lambda_queue_scraping**: Scraping job queue management
- **aws_iam_role.lambda_rotate_nat_gateway_eip**: NAT Gateway IP rotation

### Container and Workflow Roles
- **aws_iam_role.ecs_task_execution**: ECS task execution (Fargate)
- **aws_iam_role.ecs_task**: ECS task runtime permissions
- **aws_iam_role.step_functions**: Step Functions state machine execution

### Cross-Account Service Roles
- **aws_iam_role.backup**: AWS Backup service (conditional)
- **aws_iam_role.config**: AWS Config service (conditional)
- **aws_iam_role.s3_replication**: S3 cross-region replication (production)

### Custom IAM Policies
- **aws_iam_policy.lambda_api**: API Lambda permissions
- **aws_iam_policy.lambda_sync**: Sync Lambda permissions
- **aws_iam_policy.lambda_rotate_nat_gateway_eip**: NAT Gateway rotation permissions
- **aws_iam_policy.ecs_task**: ECS task permissions

## Key Features

### Least Privilege Access
- **Specific Resource ARNs**: Policies target specific resources, not wildcards
- **Minimal Permissions**: Only necessary actions granted to each role
- **Condition-Based Access**: Additional conditions restrict access scope
- **Regular Review**: Policies designed for easy auditing and updates

### Cross-Account Integration
- **Backup Role**: Allows Audit Account to assume role for centralized backup
- **Config Role**: Enables Security Account to manage Config across accounts
- **External ID**: Cross-account roles use external IDs for additional security

### AWS Managed Policies
- **AWSLambdaBasicExecutionRole**: CloudWatch Logs access for Lambda
- **AWSLambdaVPCAccessExecutionRole**: VPC networking for Lambda
- **AWSXRayDaemonWriteAccess**: X-Ray tracing for all services
- **AmazonECSTaskExecutionRolePolicy**: ECS container management
- **Service-Specific Policies**: Config, Backup, and other AWS service policies

## Role Permissions Summary

### Lambda API Handler
- **Secrets Manager**: Read application secrets
- **DynamoDB**: Read/write main table
- **OpenSearch**: Query search index
- **CloudWatch**: Logging and metrics
- **X-Ray**: Distributed tracing

### Lambda Sync Function
- **DynamoDB Streams**: Read stream events
- **OpenSearch**: Update search index
- **Secrets Manager**: Read OpenSearch credentials
- **CloudWatch**: Logging and error handling

### Workflow Lambda Functions
- **SQS**: Send/receive scraping jobs
- **Step Functions**: Invoke state machines
- **DynamoDB**: Read/write workflow state
- **S3**: Store/retrieve scraping results

### ECS Tasks (Fargate)
- **ECR**: Pull container images
- **Secrets Manager**: Read application secrets
- **S3**: Store scraping results
- **CloudWatch**: Logging and metrics

### Step Functions
- **Lambda**: Invoke workflow functions
- **SQS**: Manage job queues
- **ECS**: Run Fargate tasks
- **CloudWatch**: Logging and monitoring

### NAT Gateway EIP Rotation
- **EC2**: Manage Elastic IPs and NAT Gateways
- **SNS**: Send rotation notifications
- **CloudWatch**: Logging rotation events

## Dependencies
- **Foundation Module**: Uses account ID and region information
- **App Storage Module**: References DynamoDB table and S3 bucket ARNs
- **Search Module**: References OpenSearch domain ARN
- **App Security Module**: References Secrets Manager secret ARNs

## Outputs
- **Lambda role ARNs**: For Lambda function configuration
- **ECS role ARNs**: For ECS task definition configuration
- **Step Functions role ARN**: For state machine configuration
- **Cross-account role ARNs**: For centralized services configuration

## Integration with Other Modules

### Compute Module
- Lambda functions use IAM roles for AWS service access
- Roles include permissions for DynamoDB, OpenSearch, and Secrets Manager

### App Storage Module
- IAM policies reference specific DynamoDB table and S3 bucket ARNs
- Enables secure access to application data stores

### Search Module
- Lambda roles include OpenSearch access permissions
- Domain access policy references Lambda role ARNs

### App Security Module
- Lambda roles include Secrets Manager access for application secrets
- Policies target specific secret ARNs for security

## Security Best Practices

### Principle of Least Privilege
- **Resource-Specific ARNs**: Policies target exact resources needed
- **Action Restrictions**: Only necessary API actions permitted
- **Condition Statements**: Additional restrictions based on context

### Cross-Account Security
- **External IDs**: Required for cross-account role assumption
- **Account Restrictions**: Roles limited to specific AWS accounts
- **Time-Based Access**: Temporary credentials for cross-account access

### Audit and Monitoring
- **CloudTrail Integration**: All role assumptions logged
- **Access Analyzer**: IAM Access Analyzer reviews policies
- **Regular Reviews**: Policies designed for periodic access reviews

## Policy Examples

### Lambda API Policy (Simplified)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:region:account:secret:prefix-app-secrets*"
    }
  ]
}
```

### Cross-Account Backup Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::audit-account:root"},
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "prefix-backup-cross-account"
        }
      }
    }
  ]
}
```

## Operational Benefits
- **Automated Deployment**: Roles created automatically with infrastructure
- **Consistent Permissions**: Standardized access patterns across environments
- **Easy Auditing**: Clear role separation and specific permissions
- **Scalable Security**: Roles support application growth and new features

## Compliance Considerations
- **Audit Trail**: All role usage logged in CloudTrail
- **Access Reviews**: Regular review of role permissions and usage
- **Separation of Duties**: Different roles for different application functions
- **Least Privilege**: Minimal permissions reduce security risk

## Cost Implications
- **No Direct Costs**: IAM roles and policies are free
- **Indirect Costs**: Proper permissions may reduce over-provisioning
- **Operational Efficiency**: Automated role management reduces manual overhead