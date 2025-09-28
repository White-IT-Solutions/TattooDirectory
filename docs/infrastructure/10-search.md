# Search Module (10-search)

## Overview
The Search module creates and configures an Amazon OpenSearch cluster for the tattoo artist directory's search functionality. It provides full-text search, filtering, and aggregation capabilities for artist profiles, studios, and portfolio content.

## Purpose
- Enables fast, flexible search across artist profiles and portfolios
- Provides advanced filtering by location, style, and other attributes
- Supports real-time search suggestions and autocomplete
- Maintains search index synchronized with DynamoDB via streams

## Resources Created

### OpenSearch Domain
- **aws_opensearch_domain.main**: Main OpenSearch cluster
  - **Engine**: OpenSearch 2.3
  - **Instance Type**: Configurable (t3.small.search for dev, m6g.large.search for prod)
  - **Instance Count**: Configurable (1 for dev, 2+ for prod)
  - **Master Nodes**: Dedicated master nodes for production
  - **Storage**: EBS GP3 volumes with configurable size and IOPS

### Security Configuration
- **VPC Deployment**: Cluster deployed in private subnets
- **Security Groups**: Restricted access from Lambda functions only
- **Encryption**: At-rest and in-transit encryption enabled
- **Authentication**: Fine-grained access control with master user

### CloudWatch Log Groups
- **aws_cloudwatch_log_group.opensearch_audit**: Audit logs for security monitoring
- **aws_cloudwatch_log_group.opensearch_slow_search**: Slow query analysis
- **aws_cloudwatch_log_group.opensearch_slow_index**: Indexing performance monitoring

### Service-Linked Role
- **aws_iam_service_linked_role.opensearch**: Required service role for OpenSearch

## Key Features

### High Availability (Production)
- **Multi-AZ Deployment**: Instances distributed across availability zones
- **Dedicated Master Nodes**: Separate master nodes for cluster management
- **Zone Awareness**: Automatic distribution of primary and replica shards

### Security
- **Network Isolation**: VPC deployment with security group restrictions
- **Encryption**: Customer-managed KMS key for data encryption
- **Access Control**: Fine-grained access control with IAM integration
- **TLS**: Enforced HTTPS with TLS 1.2 minimum

### Monitoring and Logging
- **Audit Logs**: All cluster access and operations logged
- **Performance Monitoring**: Slow query and indexing logs (when advanced monitoring enabled)
- **CloudWatch Integration**: Metrics and alarms for cluster health

### Cost Optimization
- **Environment-Specific Sizing**: Smaller instances and storage for development
- **On-Demand Scaling**: Instance types can be modified as needed
- **Storage Optimization**: GP3 volumes with configurable IOPS and throughput

## Cluster Configuration

### Development Environment
- **Instance Type**: t3.small.search (burstable performance)
- **Instance Count**: 1 (single node)
- **Master Nodes**: None (cost optimization)
- **Storage**: 20GB GP3 with 3000 IOPS
- **Zone Awareness**: Disabled

### Production Environment
- **Instance Type**: m6g.large.search or larger (consistent performance)
- **Instance Count**: 2+ (for high availability)
- **Master Nodes**: 3 dedicated master nodes
- **Storage**: 100GB GP3 with 3000 IOPS and 250 MB/s throughput
- **Zone Awareness**: Enabled across 2 AZs

## Dependencies
- **Foundation Module**: Uses main KMS key for encryption
- **Audit Foundation Module**: Uses logs KMS key for CloudWatch encryption
- **Networking Module**: Uses private subnets and security groups
- **IAM Module**: Uses Lambda role ARNs for access policies

## Outputs
- **opensearch_domain_endpoint**: Cluster endpoint for Lambda connections
- **opensearch_domain_arn**: ARN for IAM policy configuration
- **opensearch_domain_name**: Domain name for monitoring and management
- **opensearch_kibana_endpoint**: Kibana dashboard URL for administration

## Integration with Other Modules

### App Storage Module
- DynamoDB stream triggers Lambda functions to update search index
- Real-time synchronization keeps search data current

### Compute Module
- Lambda functions query OpenSearch for search API endpoints
- Sync Lambda function updates search index from DynamoDB changes

### IAM Module
- Lambda execution roles include OpenSearch access permissions
- Domain access policy references Lambda role ARNs

### App Monitoring Module
- CloudWatch alarms monitor cluster health and performance
- Metrics track search latency, indexing rate, and error rates

## Search Index Design

### Document Types
- **Artists**: Profile information, specialties, location, contact details
- **Studios**: Studio information, location, associated artists
- **Portfolios**: Image metadata, styles, descriptions, artist associations

### Index Mappings
```json
{
  "artists": {
    "properties": {
      "name": {"type": "text", "analyzer": "standard"},
      "location": {"type": "geo_point"},
      "styles": {"type": "keyword"},
      "bio": {"type": "text"},
      "rating": {"type": "float"},
      "verified": {"type": "boolean"}
    }
  }
}
```

### Search Features
- **Full-Text Search**: Artist names, bios, specialties
- **Geo-Spatial Search**: Location-based filtering with radius
- **Faceted Search**: Filter by styles, ratings, verification status
- **Autocomplete**: Real-time search suggestions
- **Aggregations**: Statistics and facet counts

## Performance Optimization

### Query Performance
- **Index Optimization**: Proper field mappings and analyzers
- **Caching**: Query result caching for common searches
- **Routing**: Document routing for efficient shard distribution

### Indexing Performance
- **Bulk Operations**: Batch updates from DynamoDB stream
- **Refresh Intervals**: Optimized refresh settings for real-time updates
- **Replica Management**: Balanced primary and replica shard distribution

## Security Considerations

### Network Security
- **VPC Deployment**: Cluster isolated in private subnets
- **Security Groups**: Restrictive rules allowing only Lambda access
- **No Public Access**: Cluster not accessible from internet

### Data Security
- **Encryption at Rest**: Customer-managed KMS key
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Access Control**: Fine-grained permissions with IAM integration

### Audit and Compliance
- **Audit Logs**: All access and operations logged
- **CloudTrail Integration**: API calls logged for compliance
- **Data Retention**: Log retention policies for compliance requirements

## Operational Benefits
- **Managed Service**: AWS handles cluster maintenance and updates
- **Auto-Scaling**: Can scale instance types and counts as needed
- **Backup and Recovery**: Automated snapshots and point-in-time recovery
- **Monitoring**: Built-in CloudWatch metrics and alerting

## Cost Implications
- **Instance Costs**: Primary cost driver based on instance type and count
- **Storage Costs**: EBS volume charges for data storage
- **Data Transfer**: Minimal costs for VPC-internal traffic
- **Reserved Instances**: Available for production cost optimization

## Disaster Recovery
- **Cross-Region Snapshots**: Manual snapshots can be restored in other regions
- **Index Rebuilding**: Can rebuild index from DynamoDB if needed
- **Multi-AZ**: Production deployment survives single AZ failure