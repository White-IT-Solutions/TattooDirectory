# Networking Module (05-networking)

## Overview
The Networking module creates the complete network infrastructure for the tattoo artist directory application. It establishes a secure, multi-tier VPC with public and private subnets, security groups, VPC endpoints, and network access controls.

## Purpose
- Provides isolated network environment for application resources
- Implements defense-in-depth security with multiple network layers
- Enables secure communication between application components
- Supports both internet-facing and internal-only resources

## Resources Created

### VPC Infrastructure
- **aws_vpc.main**: Main VPC with configurable CIDR block (default: 10.0.0.0/16)
- **aws_internet_gateway.main**: Internet gateway for public subnet access
- **aws_default_security_group.default**: Restricted default security group (no rules)

### Subnets
- **aws_subnet.public**: Public subnets across multiple AZs for NAT gateways
- **aws_subnet.private**: Private subnets for application resources (Lambda, OpenSearch, Fargate)

### NAT Gateways
- **aws_eip.nat**: Elastic IPs for NAT gateways
- **aws_nat_gateway.main**: NAT gateways for private subnet internet access
  - Production: One per AZ for high availability
  - Development: Single NAT gateway for cost optimization

### Route Tables
- **aws_route_table.public**: Routes traffic to internet gateway
- **aws_route_table.private**: Routes traffic through NAT gateways
- **aws_route_table_association**: Associates subnets with appropriate route tables

### Security Groups
- **opensearch**: OpenSearch cluster access (port 443 from Lambda SGs)
- **vpc_endpoints**: VPC endpoint access (port 443 from Lambda and Fargate)
- **fargate**: Fargate task networking (HTTPS to internet and VPC endpoints)
- **lambda_internet**: Lambda with internet access (HTTPS outbound)
- **lambda_internal**: Lambda with VPC-only access (no internet)

### Network ACLs
- **aws_network_acl.public**: Public subnet ACL (HTTP/HTTPS inbound, deny RDP)
- **aws_network_acl.private**: Private subnet ACL (VPC traffic + HTTPS outbound)

### VPC Endpoints
- **Gateway Endpoints**: S3 and DynamoDB (attached to private route tables)
- **Interface Endpoints**: 
  - secretsmanager, sqs, states (Step Functions)
  - ecr.api, ecr.dkr (container registry)
  - logs (CloudWatch), es (OpenSearch)

### SSL/TLS Certificate
- **aws_acm_certificate.cloudfront**: ACM certificate for CloudFront (us-east-1)

### VPC Flow Logs
- **aws_flow_log.vpc**: VPC Flow Logs sent directly to S3 in Audit Account

## Key Features

### Multi-AZ Architecture
- Subnets distributed across multiple availability zones
- Production: Up to 3 AZs for high availability
- Development: Minimum 1 AZ for cost optimization

### Security Layers
1. **Network ACLs**: Subnet-level traffic filtering
2. **Security Groups**: Instance-level stateful firewall
3. **VPC Endpoints**: Private connectivity to AWS services
4. **Flow Logs**: Network traffic monitoring and analysis

### Cost Optimization
- Development environment uses single NAT gateway
- Production uses multiple NAT gateways for availability
- VPC endpoints reduce NAT gateway data transfer costs

### Internet Access Control
- **lambda_internet**: Can access internet for web scraping
- **lambda_internal**: VPC-only access, no internet connectivity
- **fargate**: Internet access for scraping tasks, VPC endpoints for AWS services

## Dependencies
- **Foundation Module**: Uses availability zones from foundation
- **Audit Foundation Module**: Uses KMS key for VPC Flow Logs encryption
- **Log Storage Module**: Requires VPC Flow Logs bucket ARN

## Outputs

### VPC Information
- vpc_id, vpc_cidr_block
- public_subnet_ids, private_subnet_ids
- availability_zones mapping

### Security Groups
- All security group IDs and ARNs for use by other modules
- Separate outputs for Lambda, OpenSearch, Fargate, and VPC endpoints

### Network Resources
- NAT gateway IDs and public IPs
- VPC endpoint IDs (gateway and interface)
- Network ACL IDs
- CloudFront certificate ARN

## Integration with Other Modules

### Compute Module
- Uses private subnets for Lambda functions
- Uses security groups for Lambda networking
- Uses VPC endpoints for AWS service access

### Search Module
- Uses private subnets for OpenSearch cluster
- Uses opensearch security group for access control

### App Storage Module
- S3 VPC endpoint enables private S3 access
- Reduces data transfer costs through NAT gateways

### API Module
- Uses ACM certificate for custom domain setup

### Delivery Module
- Uses CloudFront certificate for HTTPS termination

## Security Considerations

### Network Segmentation
- Public subnets only contain NAT gateways (no application resources)
- Private subnets isolate application components
- Security groups implement least-privilege access

### Traffic Flow Control
- Network ACLs provide subnet-level protection
- Security groups use referenced security group rules (no CIDR blocks)
- VPC endpoints keep AWS service traffic within AWS network

### Monitoring and Logging
- VPC Flow Logs capture all network traffic
- Logs sent to centralized S3 bucket in Audit Account
- Integration with security monitoring for threat detection

## Operational Benefits
- **High Availability**: Multi-AZ deployment in production
- **Scalability**: Subnets sized for growth (CIDR /24 blocks)
- **Cost Control**: Environment-specific NAT gateway deployment
- **Security**: Multiple layers of network protection

## Cost Implications
- **NAT Gateways**: Largest networking cost (~$45/month per gateway)
- **VPC Endpoints**: Interface endpoints (~$7/month each)
- **Data Transfer**: Reduced costs through VPC endpoints
- **Elastic IPs**: Minimal cost for NAT gateway IPs