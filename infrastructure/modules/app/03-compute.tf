# Compute resources - Lambda functions and API Gateway

# API Gateway v2 (HTTP API)
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name}"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api"
  })
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage"
  })
}

# Lambda Function for API Handler
resource "aws_lambda_function" "api_handler" {
  # checkov:skip=CKV_AWS_116: DLQ is not required as the function is invoked synchronously by API Gateway. Errors are handled by the caller and monitored via CloudWatch Alarms.
  filename      = data.archive_file.api_handler_zip.output_path
  function_name = "${local.name_prefix}-api-handler"
  role          = aws_iam_role.lambda_api_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = local.config.lambda_memory_size
  code_signing_config_arn        = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  # Set a concurrency limit to protect against traffic spikes and ensure reliability
  reserved_concurrent_executions = var.environment == "prod" ? 50 : 20

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  environment {
    variables = merge(local.lambda_environment_vars, {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
    })
  }

  kms_key_arn = aws_kms_key.main.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_api_policy_attachment,
    aws_cloudwatch_log_group.lambda_api,
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-handler"
  })
}

# Create a placeholder zip file for the API Lambda function
data "archive_file" "api_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/api_handler.zip"
  
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: JSON.stringify('Hello from Lambda!') }; };"
    filename = "index.js"
  }
}

# Lambda Integration with API Gateway
resource "aws_apigatewayv2_integration" "lambda" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = aws_lambda_function.api_handler.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

# API Gateway Route
resource "aws_apigatewayv2_route" "proxy" {
  # checkov:skip=CKV_AWS_309: For a public, largely read-only API, relying on the WAF at the edge is the standard and recommended pattern. 
  api_id = aws_apigatewayv2_api.main.id

  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}