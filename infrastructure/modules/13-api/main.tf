# =============================================================================
# API MODULE
# =============================================================================
# This module contains API Gateway resources:
# - API Gateway HTTP API
# - Lambda integrations
# - Custom domain configuration
# - CORS setup

# =============================================================================
# NOTE: API GATEWAY LOG GROUP MOVED TO CENTRAL-LOGGING MODULE
# =============================================================================
# The CloudWatch log group for API Gateway access logs has been moved to the
# central-logging module to be deployed in the Security Account for centralized
# logging. The log group ARN is now passed as a variable.

# =============================================================================
# API GATEWAY V2 (HTTP API)
# =============================================================================

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.context.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.context.project_name}"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods     = ["*"]
    allow_origins     = var.api_cors_allowed_origins
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api"
  })
}

# =============================================================================
# API GATEWAY STAGE
# =============================================================================

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.context.environment
  auto_deploy = var.context.environment == "dev"

  # For prod, point to the explicit deployment resource to control rollouts
  deployment_id = var.context.environment == "prod" ? aws_apigatewayv2_deployment.main[0].id : null

  access_log_settings {
    destination_arn = var.api_gateway_log_group_arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
      errorType      = "$context.error.messageString"
    })
  }

  default_route_settings {
    detailed_metrics_enabled = var.context.enable_advanced_monitoring
    throttling_burst_limit   = var.context.environment == "prod" ? 5000 : 100
    throttling_rate_limit    = var.context.environment == "prod" ? 2000 : 50
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-stage"
  })
}

# =============================================================================
# API GATEWAY DEPLOYMENT (for controlled production deployments)
# =============================================================================

resource "aws_apigatewayv2_deployment" "main" {
  count = var.context.environment == "prod" ? 1 : 0

  api_id = aws_apigatewayv2_api.main.id

  # The triggers map forces a new deployment resource to be created when the
  # configuration of the API changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_apigatewayv2_route.proxy.id,
      aws_apigatewayv2_route.health.id,
      aws_apigatewayv2_route.artists.id,
      aws_apigatewayv2_route.artist_by_id.id,
      aws_apigatewayv2_route.styles.id,
      aws_apigatewayv2_integration.lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# LAMBDA INTEGRATION
# =============================================================================

resource "aws_apigatewayv2_integration" "lambda" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = var.api_handler_lambda_invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"

  timeout_milliseconds = 30000
}

# =============================================================================
# API ROUTES
# =============================================================================

# Catch-all route for Lambda
resource "aws_apigatewayv2_route" "proxy" {
  api_id = aws_apigatewayv2_api.main.id

  route_key          = "ANY /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "AWS_IAM"
}

# Health check route (public access)
resource "aws_apigatewayv2_route" "health" {
  api_id = aws_apigatewayv2_api.main.id

  route_key          = "GET /health"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

# Artists routes (public read access for directory) - v1 API
resource "aws_apigatewayv2_route" "artists" {
  api_id = aws_apigatewayv2_api.main.id

  route_key          = "GET /v1/artists"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "artist_by_id" {
  api_id = aws_apigatewayv2_api.main.id

  route_key          = "GET /v1/artists/{artistId}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

# Styles route (public access for style filtering)
resource "aws_apigatewayv2_route" "styles" {
  api_id = aws_apigatewayv2_api.main.id

  route_key          = "GET /v1/styles"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

# =============================================================================
# LAMBDA PERMISSION
# =============================================================================

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.api_handler_lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# =============================================================================
# CUSTOM DOMAIN (optional)
# =============================================================================

resource "aws_apigatewayv2_domain_name" "main" {
  count = var.context.domain_name != "" ? 1 : 0

  domain_name = "api.${var.context.domain_name}"

  domain_name_configuration {
    certificate_arn = var.api_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-domain"
  })
}

resource "aws_apigatewayv2_api_mapping" "main" {
  count = var.context.domain_name != "" ? 1 : 0

  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.main[0].id
  stage       = aws_apigatewayv2_stage.main.id
}

# =============================================================================
# ROUTE 53 RECORD (optional)
# =============================================================================

resource "aws_route53_record" "api" {
  count = var.context.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = "api.${var.context.domain_name}"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.main[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.main[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}