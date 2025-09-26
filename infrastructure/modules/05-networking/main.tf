# =============================================================================
# NETWORKING MODULE
# =============================================================================
# This module contains all networking resources:
# - VPC and subnets
# - Security groups
# - NAT gateways and internet gateway
# - Route tables
# - ACM certificates

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  # Create availability zone map from the provided list
  availability_zones = {
    for idx, az in slice(var.availability_zones, 0, min(3, length(var.availability_zones))) :
    substr(az, -1, 1) => az
  }

  # CIDR blocks for subnets
  public_cidrs = {
    for k, v in local.availability_zones :
    k => cidrsubnet(var.vpc_cidr, 8, index(keys(local.availability_zones), k) + 1)
  }

  private_cidrs = {
    for k, v in local.availability_zones :
    k => cidrsubnet(var.vpc_cidr, 8, index(keys(local.availability_zones), k) + 10)
  }
}

# =============================================================================
# VPC
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-vpc"
  })
}

# Default Security Group - Restrict all traffic
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Remove all default rules by not specifying any ingress/egress rules
  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-default-sg-restricted"
  })
}

# VPC Flow Logs - Send directly to S3 bucket in Audit Account
resource "aws_flow_log" "vpc" {
  log_destination      = var.vpc_flow_logs_bucket_arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-vpc-flow-logs"
  })
}

# =============================================================================
# INTERNET GATEWAY
# =============================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-igw"
  })
}

# =============================================================================
# SUBNETS
# =============================================================================

# Public subnets
resource "aws_subnet" "public" {
  for_each = local.availability_zones

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_cidrs[each.key]
  availability_zone       = each.value
  map_public_ip_on_launch = false

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-public-${each.key}"
    Type = "Public"
  })
}

# Private subnets
resource "aws_subnet" "private" {
  for_each = local.availability_zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_cidrs[each.key]
  availability_zone = each.value

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-private-${each.key}"
    Type = "Private"
  })
}

# =============================================================================
# NAT GATEWAYS
# =============================================================================

# Elastic IPs for NAT gateways
resource "aws_eip" "nat" {
  for_each = var.context.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones[keys(local.availability_zones)[0]] }

  domain = "vpc"

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-nat-eip-${each.key}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT gateways
resource "aws_nat_gateway" "main" {
  for_each = aws_eip.nat

  allocation_id = each.value.id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-nat-${each.key}"
  })

  depends_on = [aws_internet_gateway.main]
}

# =============================================================================
# ROUTE TABLES
# =============================================================================

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-public-rt"
  })
}

# Public route table associations
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Private route tables
resource "aws_route_table" "private" {
  for_each = aws_nat_gateway.main

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = each.value.id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-private-rt-${each.key}"
  })
}

# Private route table associations
resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id = each.value.id
  # In prod, associate each private subnet with the route table in its own AZ for high availability.
  # In dev, associate all private subnets with the single route table to save costs.
  route_table_id = var.context.environment == "prod" ? aws_route_table.private[each.key].id : aws_route_table.private[keys(aws_nat_gateway.main)[0]].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# -----------------------------------------------------------------------------
# Security Groups - Creation
# -----------------------------------------------------------------------------
# Centralized map for defining all security groups. This allows for dynamic
# creation and easier management of security group resources.
locals {
  security_groups = {
    opensearch      = "OpenSearch security group"
    vpc_endpoints   = "VPC Endpoints security group"
    fargate         = "Fargate security group"
    lambda_internet = "Lambda security group with internet access"
    lambda_internal = "Lambda security group for internal VPC access only"
  }
}

# Dynamically creates all security groups defined in the local.security_groups map.
# This single resource replaces multiple individual aws_security_group blocks.
resource "aws_security_group" "main" {
  for_each = local.security_groups

  name        = "${var.context.name_prefix}-${each.key}-sg"
  description = each.value
  vpc_id      = aws_vpc.main.id

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-${replace(each.key, "_", "-")}-sg"
  })
}

# -----------------------------------------------------------------------------
# Security Groups - Ingress Rules
# -----------------------------------------------------------------------------
# These resources define specific ingress (inbound) traffic rules. Using
# dedicated resources for rules is more explicit and manageable than inline blocks.

# Allow HTTPS traffic from both Lambda security groups to the OpenSearch cluster.
resource "aws_vpc_security_group_ingress_rule" "opensearch_from_lambdas" {
  for_each = toset([
    "lambda_internet",
    "lambda_internal"
  ])

  security_group_id            = aws_security_group.main["opensearch"].id
  referenced_security_group_id = aws_security_group.main[each.key].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS from ${each.key} Lambda"
}

# Allow HTTPS traffic from both Lambda security groups to the VPC Endpoints.
resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_lambdas" {
  for_each = toset([
    "lambda_internet",
    "lambda_internal"
  ])

  security_group_id            = aws_security_group.main["vpc_endpoints"].id
  referenced_security_group_id = aws_security_group.main[each.key].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS from ${each.key} Lambda"
}

# Allow HTTPS traffic from the Fargate security group to the VPC Endpoints.
resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_fargate" {
  security_group_id            = aws_security_group.main["vpc_endpoints"].id
  referenced_security_group_id = aws_security_group.main["fargate"].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS from Fargate tasks"
}

# -----------------------------------------------------------------------------
# Security Groups - Egress Rules
# -----------------------------------------------------------------------------
# These resources define specific egress (outbound) traffic rules.

# Allow both Lambda security groups to send HTTPS traffic to the OpenSearch cluster.
resource "aws_vpc_security_group_egress_rule" "lambdas_to_opensearch" {
  for_each = toset([
    "lambda_internet",
    "lambda_internal"
  ])

  security_group_id            = aws_security_group.main[each.key].id
  referenced_security_group_id = aws_security_group.main["opensearch"].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "Egress to OpenSearch"
}

# Allow both Lambda security groups to send HTTPS traffic to the VPC Endpoints.
resource "aws_vpc_security_group_egress_rule" "lambdas_to_vpc_endpoints" {
  for_each = toset([
    "lambda_internet",
    "lambda_internal"
  ])

  security_group_id            = aws_security_group.main[each.key].id
  referenced_security_group_id = aws_security_group.main["vpc_endpoints"].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "Egress to VPC Endpoints"
}

# Allow the internet-facing Lambda to send HTTPS traffic to the internet.
resource "aws_vpc_security_group_egress_rule" "lambda_internet_https_to_internet" {
  security_group_id = aws_security_group.main["lambda_internet"].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "Egress to Internet for web scraping functions"
}

# Allow Fargate to send HTTPS traffic to the VPC Endpoints.
resource "aws_vpc_security_group_egress_rule" "fargate_to_vpc_endpoints" {
  security_group_id            = aws_security_group.main["fargate"].id
  referenced_security_group_id = aws_security_group.main["vpc_endpoints"].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "Egress to VPC Endpoints"
}

# Allow Fargate to send HTTPS traffic to the internet for tasks like web scraping.
resource "aws_vpc_security_group_egress_rule" "fargate_https_to_internet" {
  security_group_id = aws_security_group.main["fargate"].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "Egress to Internet for web scraping (HTTPS)"
}

# Allow Fargate to send HTTP traffic to the internet for web scraping.
resource "aws_vpc_security_group_egress_rule" "fargate_http_to_internet" {
  security_group_id = aws_security_group.main["fargate"].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "Egress to Internet for web scraping (HTTP)"
}

# =============================================================================
# NETWORK ACLs
# =============================================================================

# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  # checkov:skip=CKV2_AWS_1: Attatched via aws_network_acl_association
  vpc_id = aws_vpc.main.id

  # Inbound rules for public subnets
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow return traffic from the internet on ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Explicitly deny RDP traffic from the internet
  ingress {
    protocol   = "tcp"
    rule_no    = 90
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 3389
    to_port    = 3389
  }

  # Outbound rules for public subnets
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-public-nacl"
  })
}

# Public NACL Associations
resource "aws_network_acl_association" "public" {
  for_each = aws_subnet.public

  network_acl_id = aws_network_acl.public.id
  subnet_id      = each.value.id
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  # Inbound rules for private subnets
  # Allow all traffic from within the VPC
  ingress {
    protocol   = "all"
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }

  # Allow return traffic from the internet for outbound connections
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Explicitly deny RDP traffic from the internet
  ingress {
    protocol   = "tcp"
    rule_no    = 95
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 3389
    to_port    = 3389
  }

  # Outbound rules for private subnets
  # Allow all traffic to within the VPC
  egress {
    protocol   = "all"
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }

  # Allow outbound to the internet for Fargate scrapers and software updates
  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  egress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-private-nacl"
  })
}

# Private NACL Associations
resource "aws_network_acl_association" "private" {
  for_each = aws_subnet.private

  network_acl_id = aws_network_acl.private.id
  subnet_id      = each.value.id
}

# =============================================================================
# VPC ENDPOINTS
# =============================================================================

# Gateway VPC Endpoints (for S3 and DynamoDB)
resource "aws_vpc_endpoint" "gateway" {
  for_each = toset(["s3", "dynamodb"])

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.context.aws_region}.${each.key}"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for rt in aws_route_table.private : rt.id]

  # This policy is the fix for SNYK-CC-AWS-428. It is applied conditionally
  # only to the S3 endpoint.
  policy = each.key == "s3" ? jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowAccessToProjectBuckets",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:*",
        Resource = [
          # This wildcard policy allows access to all S3 buckets created by this project,
          # which are consistently named with the project prefix. This acts as a guardrail
          # to prevent access to unrelated buckets, while fine-grained permissions
          # are managed by IAM roles.
          "arn:aws:s3:::${var.context.name_prefix}-*",
          "arn:aws:s3:::${var.context.name_prefix}-*/*"
        ]
      }
    ]
  }) : null

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-${each.key}-gateway-endpoint"
  })
}

# Interface VPC Endpoints (for AWS services)
resource "aws_vpc_endpoint" "interface" {
  for_each = toset([
    "secretsmanager",
    "sqs",
    "states",
    "ecr.api",
    "ecr.dkr",
    "logs",
    "es" # OpenSearch
  ])

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.context.aws_region}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for subnet in aws_subnet.private : subnet.id]
  security_group_ids  = [aws_security_group.main["vpc_endpoints"].id]
  private_dns_enabled = true

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-${replace(each.key, ".", "-")}-interface-endpoint"
  })
}

# =============================================================================
# ACM CERTIFICATE (for CloudFront)
# =============================================================================

resource "aws_acm_certificate" "cloudfront" {
  count = var.context.domain_name != "" ? 1 : 0

  provider = aws.us_east_1

  domain_name       = var.context.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.context.domain_name}"
  ]

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-cloudfront-cert"
  })

  lifecycle {
    create_before_destroy = true
  }
}
