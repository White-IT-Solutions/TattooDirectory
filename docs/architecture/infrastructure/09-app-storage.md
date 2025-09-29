# App Storage Module (09-app-storage)

## Overview
The App Storage module creates application-specific S3 buckets and DynamoDB tables for the tattoo artist directory platform. It provides the primary data storage infrastructure including the main database table, frontend hosting buckets, and image storage with cross-region replication for production environments.

## Purpose
- Provides primary data storage with DynamoDB single-table design
- Hosts frontend application with S3 static website hosting
- Stores and serves artist portfolio images and assets
- Implements backup and disaster recovery with cross-region replication

## Resources Created

### DynamoDB Table
- **aws_dynamodb_table.main**: Primary application database using single-table design
  - **Partition Key**: `PK` (String) - Entity identifier (e.g., `ARTIST#123`, `STUDIO#456`)
  - **Sort Key**: `SK` (String) - Sub-entity or relationship (e.g., `PROFILE`, `PORTFOLIO#1`)
  - **Billing Mode**: On-demand for automatic scaling
  - **Encryption**: Customer-managed KMS key encryption
  - **Point-in-Time Recovery**: Enabled for data protection
  - **Stream**: Enabled for real-time data synchronization to OpenSearch

### S3 Buckets
- **Frontend Bucket**: Primary hosting for Next.js application
- **Frontend Backup Bucket**: Failover hosting for high availability
- **Images Bucket**: Artist portfolio images and assets
- **Images Backup Bucket**: Cross-region backup for images

### Bucket Features
- **Static Website Hosting**: Configured for Single Page Application (SPA)
- **CORS Configuration**: Enables cross-origin requests for API integration
- **Lifecycle Management**: Automated cost optimization for image storage
- **Cross-Region Replication**: Production environments replicate to secondary region

## Key Features

### Single-Table DynamoDB Design
- **Flexible Schema**: Supports multiple entity types in one table
- **Efficient Queries**: Optimized access patterns with composite keys
- **Cost Effective**: Single table reduces costs compared to multiple tables
- **Scalable**: On-demand billing automatically handles traffic spikes

### High Availability Frontend
- **Primary/Backup**: Two S3 buckets for frontend redundancy
- **CloudFront Integration**: Origin group with automatic failover
- **SPA Support**: Custom error pages redirect to index.html for client-side routing

### Image Storage Optimization
- **Multiple Storage Classes**: Lifecycle policies optimize costs
- **CDN Integration**: CloudFront caches images globally
- **Cross-Region Backup**: Production images replicated for disaster recovery

### Security and Compliance
- **Encryption**: All resources encrypted with main KMS key
- **Access Controls**: Bucket policies restrict access to CloudFront
- **Audit Logging**: S3 access logs sent to centralized audit bucket

## DynamoDB Access Patterns

### Entity Types
- **Artists**: `PK=ARTIST#{artistId}`, `SK=PROFILE`
- **Studios**: `PK=STUDIO#{studioId}`, `SK=PROFILE`
- **Portfolios**: `PK=ARTIST#{artistId}`, `SK=PORTFOLIO#{imageId}`
- **Styles**: `PK=STYLE#{styleName}`, `SK=METADATA`

### Global Secondary Indexes (GSI)
- **GSI1**: Location-based queries (`GSI1PK=LOCATION#{city}`, `GSI1SK=ARTIST#{artistId}`)
- **GSI2**: Style-based queries (`GSI2PK=STYLE#{styleName}`, `GSI2SK=ARTIST#{artistId}`)

## Dependencies
- **Foundation Module**: Uses main KMS key and random suffix for unique naming
- **Networking Module**: S3 VPC endpoint for private access
- **Log Storage Module**: Uses access logs bucket for S3 audit logging

## Outputs
- **DynamoDB table name and ARN**: For Lambda function configuration
- **S3 bucket names and ARNs**: For CloudFront origin configuration
- **S3 bucket domain names**: For CloudFront distribution setup
- **DynamoDB stream ARN**: For Lambda trigger configuration

## Integration with Other Modules

### Compute Module
- Lambda functions use DynamoDB table for data operations
- DynamoDB stream triggers Lambda for OpenSearch synchronization
- Lambda functions access S3 buckets for image processing

### Search Module
- DynamoDB stream feeds data changes to OpenSearch
- Maintains search index in sync with primary database

### Delivery Module
- CloudFront distribution uses S3 buckets as origins
- Origin group provides automatic failover between primary/backup buckets

### IAM Module
- Lambda roles include permissions for DynamoDB and S3 access
- Cross-account replication roles for production environments

## Storage Configuration

### DynamoDB Settings
- **Capacity Mode**: On-demand (pay-per-request)
- **Encryption**: Customer-managed KMS key
- **Backup**: Point-in-time recovery enabled
- **Streams**: Enabled for real-time synchronization

### S3 Bucket Policies
- **Frontend Buckets**: CloudFront Origin Access Control (OAC) only
- **Images Buckets**: CloudFront and application access
- **Public Access**: Blocked for all buckets (CloudFront provides public access)

### Lifecycle Policies
- **Images**: Transition to IA after 30 days, Glacier after 90 days
- **Frontend**: Keep in Standard (frequently accessed)
- **Logs**: Automatic cleanup of old deployment artifacts

## Cross-Region Replication (Production)

### Replication Configuration
- **Source**: Primary region buckets
- **Destination**: Replica region buckets
- **Encryption**: Replica KMS key in destination region
- **Scope**: All objects replicated automatically

### Disaster Recovery
- **RTO**: Recovery Time Objective < 1 hour
- **RPO**: Recovery Point Objective < 15 minutes
- **Failover**: Manual DNS update to replica region CloudFront

## Operational Benefits
- **Serverless Architecture**: No infrastructure management required
- **Auto-Scaling**: DynamoDB and S3 scale automatically
- **Cost Optimization**: On-demand pricing and lifecycle policies
- **High Availability**: Multi-AZ deployment with cross-region backup

## Performance Characteristics
- **DynamoDB**: Single-digit millisecond latency
- **S3**: High throughput for image serving
- **CloudFront**: Global edge caching for optimal performance
- **Consistency**: Strong consistency for DynamoDB reads

## Cost Implications
- **DynamoDB**: Pay-per-request pricing scales with usage
- **S3 Storage**: Lifecycle policies reduce long-term costs
- **Cross-Region Replication**: Additional storage and transfer costs in production
- **KMS**: Per-request encryption charges

## Monitoring and Alerting
- DynamoDB metrics: Read/write capacity, throttling, errors
- S3 metrics: Request rates, error rates, data transfer
- Integration with App Monitoring module for operational alerts