# Compute Module (12-compute)

## Overview
The Compute module creates all serverless compute resources for the tattoo artist directory application. It includes Lambda functions for API handling and data processing, ECS Fargate tasks for web scraping, and Step Functions for orchestrating data aggregation workflows.

## Purpose
- Provides serverless API endpoints for the frontend application
- Implements data synchronization between DynamoDB and OpenSearch
- Orchestrates web scraping workflows for artist and studio discovery
- Manages automated data processing pipelines

## Resources Created

### Lambda Functions
- **API Handler**: Processes HTTP requests from API Gateway
- **DynamoDB Sync**: Synchronizes data changes to OpenSearch
- **Discover Studios**: Finds tattoo studios via Google Maps API
- **Find Artists**: Discovers artists from studio websites
- **Queue Scraping**: Manages scraping job queues
- **NAT Gateway EIP Rotation**: Rotates NAT Gateway IP addresses

### ECS Infrastructure
- **ECS Cluster**: Fargate cluster for containerized scraping tasks
- **Task Definitions**: Container specifications for scraping workloads
- **Services**: Long-running services for continuous scraping

### Step Functions
- **Data Aggregation Workflow**: Orchestrates the complete data discovery pipeline
- **Error Handling**: Retry logic and error recovery for failed tasks
- **Parallel Processing**: Concurrent execution of scraping tasks

### Supporting Resources
- **CloudWatch Log Groups**: Centralized logging for all compute resources
- **Lambda Layers**: Shared code and dependencies
- **EventBridge Rules**: Scheduled triggers for automated workflows

## Key Features

### Serverless Architecture
- **Auto-Scaling**: Lambda and Fargate scale automatically with demand
- **Pay-per-Use**: No charges when not processing requests
- **Managed Infrastructure**: AWS handles server management and patching

### High Availability
- **Multi-AZ Deployment**: Resources distributed across availability zones
- **Fault Tolerance**: Automatic retry and error handling
- **Circuit Breakers**: Prevent cascade failures in workflows

### Performance Optimization
- **Lambda Provisioned Concurrency**: Pre-warmed instances for API functions
- **Connection Pooling**: Efficient database connections
- **Caching**: In-memory caching for frequently accessed data

## Lambda Function Details

### API Handler Function
- **Runtime**: Node.js 18.x
- **Memory**: 512MB (configurable)
- **Timeout**: 30 seconds
- **Triggers**: API Gateway HTTP requests
- **VPC**: Deployed in private subnets for security
- **Environment Variables**: Database endpoints, secrets references

### DynamoDB Sync Function
- **Runtime**: Node.js 18.x
- **Memory**: 256MB
- **Timeout**: 5 minutes
- **Triggers**: DynamoDB stream events
- **Batch Size**: 10 records per invocation
- **Error Handling**: Dead letter queue for failed records

### Workflow Functions
- **Discover Studios**: Calls Google Maps API to find tattoo studios
- **Find Artists**: Scrapes studio websites for artist information
- **Queue Scraping**: Manages SQS queues for scraping jobs
- **Memory**: 1GB for web scraping functions
- **Timeout**: 15 minutes for complex scraping tasks

### NAT Gateway EIP Rotation
- **Purpose**: Rotates NAT Gateway IP addresses to avoid rate limiting
- **Schedule**: Weekly rotation via EventBridge
- **Notifications**: SNS alerts for rotation events
- **Error Handling**: Rollback on rotation failures

## ECS Fargate Configuration

### Cluster Setup
- **Launch Type**: Fargate (serverless containers)
- **Network Mode**: awsvpc for enhanced security
- **Platform Version**: Latest for newest features
- **Capacity Providers**: Fargate and Fargate Spot for cost optimization

### Task Definitions
- **CPU**: 1 vCPU (1024 CPU units)
- **Memory**: 2GB RAM
- **Network**: Private subnets with NAT Gateway internet access
- **Storage**: 20GB ephemeral storage for temporary files

### Container Configuration
- **Base Image**: Node.js Alpine for minimal size
- **Scraping Tools**: Puppeteer, Playwright for browser automation
- **Proxy Support**: Rotating proxy integration for rate limit avoidance
- **Logging**: CloudWatch Logs with structured JSON format

## Step Functions Workflow

### Data Aggregation Pipeline
1. **Discover Studios**: Find studios in target geographic areas
2. **Parallel Processing**: Process multiple studios concurrently
3. **Find Artists**: Extract artist information from studio websites
4. **Data Validation**: Validate and clean scraped data
5. **Database Update**: Store validated data in DynamoDB
6. **Search Index**: Trigger OpenSearch synchronization

### Error Handling
- **Retry Logic**: Exponential backoff for transient failures
- **Dead Letter Queues**: Capture permanently failed items
- **Circuit Breakers**: Prevent overwhelming external services
- **Monitoring**: CloudWatch metrics and alarms for workflow health

## Dependencies
- **IAM Module**: Uses Lambda and ECS execution roles
- **Networking Module**: Uses private subnets and security groups
- **App Storage Module**: Accesses DynamoDB table and S3 buckets
- **Search Module**: Updates OpenSearch index
- **App Security Module**: Retrieves secrets from Secrets Manager

## Outputs
- **Lambda function ARNs**: For API Gateway integration
- **Lambda function names**: For monitoring and alerting
- **ECS cluster ARN**: For task deployment and management
- **Step Functions ARN**: For workflow triggering and monitoring

## Integration with Other Modules

### API Module
- API Gateway integrates with Lambda API handler function
- Lambda permission allows API Gateway to invoke functions

### App Storage Module
- Lambda functions read/write DynamoDB table
- DynamoDB stream triggers sync Lambda function

### Search Module
- Sync Lambda updates OpenSearch index
- API Lambda queries OpenSearch for search requests

### App Monitoring Module
- CloudWatch alarms monitor Lambda errors and duration
- Metrics track API performance and workflow success rates

## Performance Characteristics

### API Response Times
- **Target**: <500ms p95 for API endpoints
- **Cold Starts**: Minimized with provisioned concurrency
- **Database Queries**: Optimized DynamoDB access patterns
- **Caching**: In-memory caching for frequently accessed data

### Scraping Performance
- **Throughput**: 100+ studios processed per hour
- **Concurrency**: 10 parallel scraping tasks
- **Rate Limiting**: Respectful scraping with delays
- **Error Recovery**: Automatic retry for failed scrapes

## Security Considerations

### Network Security
- **VPC Deployment**: All functions deployed in private subnets
- **Security Groups**: Restrictive rules for outbound access
- **NAT Gateways**: Controlled internet access for scraping

### Data Security
- **Secrets Management**: API keys stored in Secrets Manager
- **Encryption**: All data encrypted in transit and at rest
- **IAM Roles**: Least privilege access to AWS services

### Code Security
- **Code Signing**: Production Lambda functions signed for integrity
- **Dependency Scanning**: Regular security scans of dependencies
- **Input Validation**: All API inputs validated and sanitized

## Operational Benefits
- **Serverless Management**: No server patching or maintenance
- **Auto-Scaling**: Handles traffic spikes automatically
- **Cost Efficiency**: Pay only for actual compute time
- **Monitoring**: Built-in CloudWatch integration

## Cost Optimization

### Lambda Costs
- **Right-Sizing**: Memory allocation optimized for each function
- **Provisioned Concurrency**: Only for high-traffic API functions
- **ARM Processors**: Graviton2 processors for better price/performance

### ECS Costs
- **Fargate Spot**: Use Spot instances for non-critical scraping
- **Task Sizing**: Optimize CPU and memory allocation
- **Scheduling**: Run scraping tasks during off-peak hours

## Monitoring and Alerting
- **Lambda Metrics**: Duration, errors, throttles, concurrent executions
- **ECS Metrics**: Task health, resource utilization, task failures
- **Step Functions**: Workflow success/failure rates, execution duration
- **Custom Metrics**: Business metrics like scraping success rates

## Disaster Recovery
- **Multi-AZ**: Functions automatically distributed across AZs
- **Code Backup**: Lambda code stored in S3 for recovery
- **Configuration**: Infrastructure as Code enables rapid rebuilding
- **Data Recovery**: DynamoDB point-in-time recovery for data loss