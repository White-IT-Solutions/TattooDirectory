# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}}-api"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-api"
  })
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true
  default_route_settings {
    # LLD 5.3.2 specifies 100 RPS for the search endpoint.
    # As HTTP APIs only support stage-level throttling, we apply this limit to the whole stage.
    throttling_rate_limit         = var.environment == "prod" ? 100 : 50
    throttling_burst_limit        = var.environment == "prod" ? 200 : 100
    detailed_metrics_enabled      = local.environment_config[var.environment].enable_advanced_monitoring
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-api-stage"
  })
}

# Lambda function for API business logic
resource "aws_lambda_function" "api_handler" {
  filename      = data.archive_file.api_handler_zip.output_path
  function_name = "${local.name_prefix}-api-handler"
  role          = aws_iam_role.lambda_api_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"  # Updated to latest LTS
  timeout       = 30
  memory_size   = local.environment_config[var.environment].lambda_memory_size
  
  # Performance optimizations
  reserved_concurrent_executions = var.environment == "prod" ? 100 : 10
  
  # Dead letter queue for failed invocations
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  tracing_config {
    mode = "Active"
    #Swap to active/passthrough depending on environment variables
    #mode = local.config.enable_advanced_monitoring ? "Active" : "PassThrough"
  }

  environment {
    variables = merge(local.lambda_environment_vars, {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
      IDEMPOTENCY_TABLE   = aws_dynamodb_table.idempotency.name
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      NODE_OPTIONS = "--enable-source-maps"  # Better error reporting
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_api_policy_attachment,
    aws_cloudwatch_log_group.lambda_api,
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-handler"
  })
}

# Dead letter queue for Lambda failures
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${local.name_prefix}-lambda-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-dlq"
  })
}

# Create a placeholder zip file for the Lambda function
data "archive_file" "api_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/api_handler.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // --- Idempotency Check for POST requests ---
  if (event.requestContext.http.method === 'POST') {
    const idempotencyKey = event.headers['idempotency-key'];

    if (!idempotencyKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Idempotency-Key header is required for this operation.' })
      };
    }

    const ddb = new (require('aws-sdk/clients/dynamodb'))();
    const fiveMinutesInSeconds = 300;
    const expiry = Math.floor(Date.now() / 1000) + fiveMinutesInSeconds;

    const params = {
      TableName: process.env.IDEMPOTENCY_TABLE,
      Item: {
        'id': { S: idempotencyKey },
        'expiry': { N: expiry.toString() }
      },
      ConditionExpression: 'attribute_not_exists(id)'
    };

    try {
      await ddb.putItem(params).promise();
      // If we get here, the key was new. Proceed with the actual logic.
      console.log(`Idempotency key ${idempotencyKey} successfully recorded.`);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        console.log(`Duplicate request detected with idempotency key: ${idempotencyKey}`);
        // This is a duplicate request, so we return a success response without re-processing.
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Request already processed.' })
        };
      }
      // Some other DynamoDB error occurred
      console.error('DynamoDB error during idempotency check:', error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error.' }) };
    }
  }
  // --- End of Idempotency Check ---

  // Placeholder for actual business logic
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Request processed successfully.' })
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

resource "aws_apigatewayv2_route" "removal_request" {
  api_id	= aws_apigatewayv2_api.main.id
  route_key = "POST /v1/removal-requests"
  target	= "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-api-gateway-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_api" {
  name              = "/aws/lambda/${var.project_name}-api-handler"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-api-logs"
  })
}