# =============================================================================
# DELIVERY MODULE
# =============================================================================
# This module contains the CloudFront distribution and related resources,
# acting as the single entry point for the application.

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.context.name_prefix}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Ensure AWS CloudFront attached WAFv2 WebACL is configured with AMR for Log4j Vulnerability - handled by WAF module itself, which attaches the AMR rule group.

# CloudFront Response Headers Policy for Security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.context.name_prefix}-security-headers"
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

# Data sources for managed CloudFront policies
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

resource "aws_cloudfront_distribution" "frontend" {
  # CloudFront access logging - logs go to Security Account
  logging_config {
    include_cookies = false
    bucket          = var.access_logs_bucket_domain_name
    prefix          = "cloudfront-access-logs/"
  }

  origin {
    domain_name              = var.frontend_bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${var.frontend_bucket_id}-primary"
  }

  origin {
    domain_name              = var.frontend_backup_bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${var.frontend_backup_bucket_id}-backup"
  }

  origin {
    domain_name = replace(var.api_gateway_endpoint, "https://", "")
    origin_id   = "APIGW-${var.api_gateway_id}"
    origin_path = "/${var.context.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin_group {
    origin_id = "S3-origin-group"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3-${var.frontend_bucket_id}-primary"
    }

    member {
      origin_id = "S3-${var.frontend_backup_bucket_id}-backup"
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = var.waf_web_acl_arn

  aliases = var.context.domain_name != "" ? [var.context.domain_name, "www.${var.context.domain_name}"] : []

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-origin-group"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.cors_s3_origin.id
  }

  # API Gateway cache behavior
  ordered_cache_behavior {
    path_pattern           = "/v1/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "APIGW-${var.api_gateway_id}"
    viewer_protocol_policy = "redirect-to-https"

    # Use managed policies for API caching and request forwarding
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Custom error responses for SPA
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

  price_class = var.context.environment == "prod" ? "PriceClass_All" : "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.context.allowed_countries
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.context.domain_name == ""
    acm_certificate_arn            = var.context.domain_name != "" ? var.cloudfront_certificate_arn : null
    ssl_support_method             = var.context.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.context.domain_name != "" ? "TLSv1.2_2021" : null
  }
  

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-frontend-distribution"
  })
}