# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name}"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins = var.environment == "prod" ? [
      "https://${aws_cloudfront_distribution.frontend.domain_name}"
    ] : ["https://${aws_cloudfront_distribution.frontend.domain_name}", "http://localhost:3000"] # Allow localhost for dev
    expose_headers = ["date", "keep-alive"]
    max_age        = 86400
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true
  default_route_settings {
    throttling_rate_limit         = var.environment == "prod" ? 1000 : 100
    throttling_burst_limit        = var.environment == "prod" ? 2000 : 200
    detailed_metrics_enabled      = local.environment_config[var.environment].enable_detailed_monitoring
    logging_level                 = var.environment == "prod" ? "INFO" : "ERROR"
  }
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      error            = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = {
    Name = "${var.project_name}-api-stage"
  }
}

# Lambda function for API business logic
resource "aws_lambda_function" "api_handler" {
  filename      = data.archive_file.api_handler_zip.output_path
  function_name = "${var.project_name}-api-handler"
  role          = aws_iam_role.lambda_api_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = local.environment_config[var.environment].lambda_memory_size

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  tracing_config {
    mode = local.environment_config[var.environment].enable_detailed_monitoring ? "Active" : "PassThrough"
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
      ENVIRONMENT         = var.environment
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1" # Best practice for performance
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_api_policy_attachment,
    aws_cloudwatch_log_group.lambda_api,
    aws_iam_role_policy_attachment.lambda_xray_policy_attachment,
  ]

  tags = {
    Name = "${var.project_name}-api-handler"
  }
}

# Create a placeholder zip file for the Lambda function
data "archive_file" "api_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/api_handler.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'API Handler placeholder - replace with actual implementation',
            path: event.rawPath,
            method: event.requestContext.http.method
        })
    };
};
EOF
    filename = "index.js"
  }
}

# API Gateway Integration with Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type    = "INTERNET"
  description        = "Lambda integration for API"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api_handler.invoke_arn
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "search_artists" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/artists"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_artist" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/artists/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "search_styles" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/styles"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "health_check" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-api-gateway-logs"
  }
}

resource "aws_cloudwatch_log_group" "lambda_api" {
  name              = "/aws/lambda/${var.project_name}-api-handler"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-lambda-api-logs"
  }
}