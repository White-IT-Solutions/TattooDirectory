# =============================================================================
# NETWORKING MODULE OUTPUTS
# =============================================================================

# =============================================================================
# VPC
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# =============================================================================
# SUBNETS
# =============================================================================

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "public_subnet_arns" {
  description = "ARNs of the public subnets"
  value       = [for subnet in aws_subnet.public : subnet.arn]
}

output "private_subnet_arns" {
  description = "ARNs of the private subnets"
  value       = [for subnet in aws_subnet.private : subnet.arn]
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.availability_zones
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

output "lambda_internet_security_group_id" {
  description = "ID of the Lambda internet security group"
  value       = aws_security_group.main["lambda_internet"].id
}

output "lambda_internal_security_group_id" {
  description = "ID of the Lambda internal security group"
  value       = aws_security_group.main["lambda_internal"].id
}

output "opensearch_security_group_id" {
  description = "ID of the OpenSearch security group"
  value       = aws_security_group.main["opensearch"].id
}

output "lambda_internet_security_group_arn" {
  description = "ARN of the Lambda internet security group"
  value       = aws_security_group.main["lambda_internet"].arn
}

output "lambda_internal_security_group_arn" {
  description = "ARN of the Lambda internal security group"
  value       = aws_security_group.main["lambda_internal"].arn
}

output "opensearch_security_group_arn" {
  description = "ARN of the OpenSearch security group"
  value       = aws_security_group.main["opensearch"].arn
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.main["vpc_endpoints"].id
}

output "vpc_endpoints_security_group_arn" {
  description = "ARN of the VPC endpoints security group"
  value       = aws_security_group.main["vpc_endpoints"].arn
}

output "fargate_security_group_id" {
  description = "ID of the Fargate security group"
  value       = aws_security_group.main["fargate"].id
}

output "fargate_security_group_arn" {
  description = "ARN of the Fargate security group"
  value       = aws_security_group.main["fargate"].arn
}

# =============================================================================
# NAT GATEWAYS
# =============================================================================

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = [for nat in aws_nat_gateway.main : nat.id]
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT gateways"
  value       = [for eip in aws_eip.nat : eip.public_ip]
}

# =============================================================================
# ACM CERTIFICATE
# =============================================================================

output "cloudfront_certificate_arn" {
  description = "ARN of the CloudFront ACM certificate"
  value       = var.context.domain_name != "" ? aws_acm_certificate.cloudfront[0].arn : null
}

# =============================================================================
# VPC ENDPOINTS
# =============================================================================

output "gateway_vpc_endpoint_ids" {
  description = "Map of Gateway VPC Endpoint IDs, keyed by service name"
  value       = { for k, v in aws_vpc_endpoint.gateway : k => v.id }
}

output "interface_vpc_endpoint_ids" {
  description = "Map of Interface VPC Endpoint IDs, keyed by service name"
  value       = { for k, v in aws_vpc_endpoint.interface : k => v.id }
}

output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.gateway["s3"].id
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.gateway["dynamodb"].id
}

# =============================================================================
# NETWORK ACLs
# =============================================================================

output "public_network_acl_id" {
  description = "ID of the public Network ACL"
  value       = aws_network_acl.public.id
}

output "private_network_acl_id" {
  description = "ID of the private Network ACL"
  value       = aws_network_acl.private.id
}

# =============================================================================
# VPC FLOW LOGS
# =============================================================================

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

# NOTE: VPC Flow Log Group outputs have been moved to the central-logging module

# =============================================================================
# DEFAULT SECURITY GROUP
# =============================================================================

output "default_security_group_id" {
  description = "ID of the default security group"
  value       = aws_default_security_group.default.id
}