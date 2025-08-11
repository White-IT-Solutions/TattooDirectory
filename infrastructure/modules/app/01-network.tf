# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-logs"
  })
}

# Optional: Flow logs for individual subnets (for more granular monitoring)
resource "aws_flow_log" "private_subnet_flow_logs" {
  for_each = var.environment == "prod" ? aws_subnet.private : {}

  iam_role_arn    = aws_iam_role.vpc_flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  subnet_id       = each.value.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-subnet-${each.key}-flow-logs"
  })
}

# Default Security Group - Restrict all traffic 
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Remove all default rules by not specifying any ingress/egress rules
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-default-sg-restricted"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each                = local.availability_zones
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${index(keys(local.availability_zones), each.key) + 1}.0/24"
  availability_zone       = each.value
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-public-${each.key}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each          = local.availability_zones
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${index(keys(local.availability_zones), each.key) + 10}.0/24"
  availability_zone = each.value

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-${each.key}"
    Type = "private"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each   = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-nat-eip-${each.key}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "nat" {
  for_each      = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-nat-${each.key}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-public-rt"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  for_each = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[each.key].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-rt-${each.key}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each = aws_route_table.private # Loop over the route tables that were actually created

  subnet_id      = aws_subnet.private[each.key].id # Associate the subnet with the same AZ key ('a', 'b')
  route_table_id = each.value.id
}

# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  # checkov:skip=CKV2_AWS_1: Attatched via aws_network_acl_association
  vpc_id     = aws_vpc.main.id

  # Inbound rules for public subnets
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
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

  # Outbound rules for public subnets
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-public-nacl"
  })
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
# checkov:skip=CKV2_AWS_1: Attatched via aws_network_acl_association
  vpc_id     = aws_vpc.main.id

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

  # Explicitly deny RDP traffic from the internet
  ingress {
    protocol   = "tcp"
    rule_no    = 95 # Use a different rule number to avoid conflicts
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 3389
    to_port    = 3389
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-nacl"
  })
}

# NACL Associations
resource "aws_network_acl_association" "public" {
  for_each = aws_subnet.public

  network_acl_id = aws_network_acl.public.id
  subnet_id      = each.value.id
}

resource "aws_network_acl_association" "private" {
  for_each = aws_subnet.private

  network_acl_id = aws_network_acl.private.id
  subnet_id      = each.value.id
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}}-oac"
  description                       = "OAC for ${var.project_name} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy for CloudFront OAC - Primary
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# S3 Bucket Policy for CloudFront OAC - Backup
resource "aws_s3_bucket_policy" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_backup.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_backup]
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "frontend" {
  name  = "${local.name_prefix}}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

    rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpListRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesUnixRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "UnixRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AmazonIpReputationListMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 6

    action {
      block {}
    }

    statement {
      rate_based_statement {        # As per LLD 5.3.1
        limit                 = 500 # 500 requests
        aggregate_key_type    = "IP"
        evaluation_window_sec = 300 # per 5 minutes
        scope_down_statement {
          byte_match_statement {
            search_string = "/v1/artists"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              type     = "NONE"
              priority = 0
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}}WAFMetric"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-waf"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "frontend" {
  resource_arn            = aws_wafv2_web_acl.frontend.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/wafv2/${local.name_prefix}-waf"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-logs"
  })
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "cloudfront" {
  count             = var.domain_name != "" ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront-cert"
  })
}

# CloudFront Response Headers Policy for Security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${local.name_prefix}}-security-headers"
  comment = "Adds security headers like HSTS, CSP, and X-Frame-Options"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }
  }
}

# VPC Endpoints to reduce NAT Gateway costs and improve security
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = values(aws_route_table.private)[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = values(aws_route_table.private)[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-endpoint"
  })
}

# Interface endpoints for other services
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-states-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-logs-endpoint"
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-access-logs/"
  }
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}-primary"
  }

  origin {
    domain_name              = aws_s3_bucket.frontend_backup.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}-backup"
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "APIGW-${aws_apigatewayv2_api.main.id}"
    # Use a static path instead of referencing the stage
    origin_path = "/${var.environment}"
  }

  origin_group {
    origin_id = "S3-origin-group"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3-${aws_s3_bucket.frontend.bucket}-primary"
    }

    member {
      origin_id = "S3-${aws_s3_bucket.frontend.bucket}-backup"
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.frontend.arn

  default_cache_behavior {
    allowed_methods            = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-origin-group"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  ordered_cache_behavior {
    path_pattern           = "/v1/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "APIGW-${aws_apigatewayv2_api.main.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Forward all headers, cookies, and query strings to the API
    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    # Do not cache API responses at the edge
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate.cloudfront[0].arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = var.domain_name == "" ? true : false
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudfront"
  })
}