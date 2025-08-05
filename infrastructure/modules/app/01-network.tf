# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
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
  for_each = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
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
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-nacl"
  })
}

# Associate Public NACL with Public Subnets
resource "aws_network_acl_association" "public" {
  for_each        = aws_subnet.public
  network_acl_id = aws_network_acl.public.id
  subnet_id      = each.value.id
}

# Associate Private NACL with Private Subnets
resource "aws_network_acl_association" "private" {
  for_each        = aws_subnet.private
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

# S3 Bucket Policy for CloudFront OAC
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
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement { # As per LLD 5.3.1
        limit              = 500 # 500 requests
        aggregate_key_type = "IP"
        evaluation_window_sec = 300 # per 5 minutes
        scope_down_statement {
          byte_match_statement {
            search_string = "/v1/artists"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              type = "NONE"
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

# CloudFront Response Headers Policy for Security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${local.name_prefix}}-security-headers"
  comment = "Adds security headers like HSTS, CSP, and X-Frame-Options"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
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
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
  }
  origin {
    domain_name = replace(aws_apigatewayv2_stage.main.invoke_url, "https://", "")
    origin_id   = "APIGW-${aws_apigatewayv2_api.main.id}"
    # The path part of the invoke_url must be specified here
    origin_path = "/${aws_apigatewayv2_stage.main.name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.frontend.arn

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
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
    cloudfront_default_certificate = true
    minimum_protocol_version = TLSv1
  }

  # Should update to use TLSv1.2 - once using custom certificate
  # viewer_certificate {
  #    cloudfront_default_certificate = aws_acm_certificate.example.arn
  #    minimum_protocol_version = "TLSv1.2_2021"

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