# =============================================================================
# COMPUTE MODULE
# =============================================================================
# This module contains compute resources:
# - Lambda functions
# - ECS cluster and services
# - Step Functions
# - SQS queues

# =============================================================================
# SQS QUEUES
# =============================================================================

# Main scraping queue
resource "aws_sqs_queue" "scraping_queue" {
  name                       = "${var.context.name_prefix}-scraping-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 300

  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-scraping-queue"
  })
}

# Dead letter queue for scraping
resource "aws_sqs_queue" "scraping_dlq" {
  name                       = "${var.context.name_prefix}-scraping-dlq"
  message_retention_seconds  = 1209600 # 14 days
  kms_master_key_id         = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-scraping-dlq"
  })
}

# IAM policy for SQS queue access - Applied directly to the SQS queue
resource "aws_sqs_queue_policy" "scraping_queue" {
  queue_url = aws_sqs_queue.scraping_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "SQSScrapingQueuePolicy"
    Statement = [
      {
        Sid       = "Allow-ECS-Task-To-Use-Queue"
        Effect    = "Allow"
        Principal = {
          AWS = var.ecs_task_role_arn
        }
        Action = [
          "SQS:ReceiveMessage",
          "SQS:DeleteMessage",
          "SQS:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.scraping_queue.arn
      },
      {
        Sid       = "Allow-Queue-Scraping-Lambda-To-Use-Queue"
        Effect    = "Allow"
        Principal = {
          AWS = var.lambda_queue_scraping_role_arn
        }
        Action = [
          "SQS:SendMessage"
        ]
        Resource = aws_sqs_queue.scraping_queue.arn
      }
    ]
  })
}

# Dead letter queue for Lambda sync
resource "aws_sqs_queue" "lambda_sync_dlq" {
  name                       = "${var.context.name_prefix}-lambda-sync-dlq"
  message_retention_seconds  = 1209600 # 14 days
  kms_master_key_id         = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-sync-dlq"
  })
}

# =============================================================================
# LAMBDA FUNCTIONS
# =============================================================================

# API Handler Lambda Function
resource "aws_lambda_function" "api_handler" {
  # checkov:skip=CKV_AWS_116: DLQ is not required as the function is invoked synchronously by API Gateway. Errors are handled by the caller and monitored via CloudWatch Alarms.
  filename      = data.archive_file.api_handler_zip.output_path
  function_name = "${var.context.name_prefix}-api-handler"
  role          = var.lambda_api_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = var.lambda_memory_size

  # Set a concurrency limit to protect against traffic spikes and ensure reliability
  reserved_concurrent_executions = var.context.environment == "prod" ? 100 : 10

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    # This function only communicates with DynamoDB and OpenSearch within the VPC.
    security_group_ids = [var.lambda_internal_security_group_id]
  }

  environment {
    variables = merge(var.context.lambda_environment_vars, {
      DYNAMODB_TABLE_NAME = var.main_table_name
      OPENSEARCH_ENDPOINT = var.opensearch_endpoint
      APP_SECRETS_ARN     = var.app_secrets_arn
    })
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-handler"
  })
}

# DynamoDB policy for API Handler Lambda
resource "aws_iam_policy" "api_handler_dynamodb" {
  name   = "${var.context.name_prefix}-api-handler-dynamodb-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
        "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"
      ]
      Resource = [
        var.main_table_arn,
        "${var.main_table_arn}/index/*",
        var.denylist_table_arn,
        var.idempotency_table_arn
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_handler_dynamodb" {
  role       = var.lambda_api_role_name
  policy_arn = aws_iam_policy.api_handler_dynamodb.arn
}

# DynamoDB to OpenSearch Sync Lambda Function
resource "aws_lambda_function" "dynamodb_sync" {
  filename      = data.archive_file.dynamodb_sync_zip.output_path
  function_name = "${var.context.name_prefix}-dynamodb-sync"
  role          = var.lambda_sync_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = var.lambda_memory_size

  reserved_concurrent_executions = 5

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_internal_security_group_id]
  }

  environment {
    variables = merge(var.context.lambda_environment_vars, {
      OPENSEARCH_ENDPOINT = var.opensearch_endpoint
      APP_SECRETS_ARN     = var.app_secrets_arn
    })
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_sync_dlq.arn
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.dynamodb_sync_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-dynamodb-sync"
  })
}

# DynamoDB Stream policy for Sync Lambda
resource "aws_iam_policy" "dynamodb_sync_stream" {
  name   = "${var.context.name_prefix}-dynamodb-sync-stream-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:DescribeStream", "dynamodb:GetRecords",
        "dynamodb:GetShardIterator", "dynamodb:ListStreams"
      ]
      Resource = var.main_table_stream_arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dynamodb_sync_stream" {
  role       = var.lambda_sync_role_name
  policy_arn = aws_iam_policy.dynamodb_sync_stream.arn
}

# Discover Studios Lambda Function
resource "aws_lambda_function" "discover_studios" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.discover_studios_zip.output_path
  function_name = "${var.context.name_prefix}-discover-studios"
  role          = var.lambda_discover_studios_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = var.lambda_memory_size

  reserved_concurrent_executions = 5

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_internet_security_group_id]
  }

  environment {
    variables = var.context.lambda_environment_vars
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.discover_studios_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-discover-studios"
  })
}

# DynamoDB policy for Discover Studios Lambda
resource "aws_iam_policy" "discover_studios_dynamodb" {
  name   = "${var.context.name_prefix}-discover-studios-dynamodb-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem"]
      Resource = [
        var.main_table_arn,
        "${var.main_table_arn}/index/*",
        var.denylist_table_arn
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "discover_studios_dynamodb" {
  role       = var.lambda_discover_studios_role_name
  policy_arn = aws_iam_policy.discover_studios_dynamodb.arn
}

# Find Artists Lambda Function
resource "aws_lambda_function" "find_artists" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.find_artists_zip.output_path
  function_name = "${var.context.name_prefix}-find-artists"
  role          = var.lambda_find_artists_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = var.lambda_memory_size

  reserved_concurrent_executions = 5

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_internet_security_group_id]
  }

  environment {
    variables = var.context.lambda_environment_vars
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.find_artists_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-find-artists"
  })
}

# DynamoDB policy for Find Artists Lambda
resource "aws_iam_policy" "find_artists_dynamodb" {
  name   = "${var.context.name_prefix}-find-artists-dynamodb-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"]
      Resource = [
        var.main_table_arn,
        var.denylist_table_arn
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "find_artists_dynamodb" {
  role       = var.lambda_find_artists_role_name
  policy_arn = aws_iam_policy.find_artists_dynamodb.arn
}

# Queue Scraping Lambda Function
resource "aws_lambda_function" "queue_scraping" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.queue_scraping_zip.output_path
  function_name = "${var.context.name_prefix}-queue-scraping"
  role          = var.lambda_queue_scraping_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = var.lambda_memory_size

  reserved_concurrent_executions = 5

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_internal_security_group_id]
  }

  environment {
    variables = merge(var.context.lambda_environment_vars, {
      SQS_QUEUE_URL = aws_sqs_queue.scraping_queue.url
    })
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.queue_scraping_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-queue-scraping"
  })
}

# NAT Gateway EIP Rotation Lambda Function
resource "aws_lambda_function" "rotate_nat_gateway_eip" {
  # checkov:skip=CKV_AWS_116: Not required due to manual execution
  filename      = data.archive_file.rotate_eip_zip.output_path
  function_name = "${var.context.name_prefix}-rotate-eip"
  role          = var.lambda_rotate_nat_gateway_eip_role_arn
  handler       = "rotate-nat-gateway-eip.lambda_handler"
  runtime       = "python3.12"
  architectures = ["arm64"]
  timeout       = 60
  memory_size   = 256

  reserved_concurrent_executions = 2

  # Code signing configuration (production only)
  code_signing_config_arn = var.lambda_code_signing_config_arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_internal_security_group_id]
  }

  environment {
    variables = {
      NAT_GATEWAY_TAG_VALUE = "${var.context.name_prefix}-nat-"
      SNS_TOPIC_ARN         = "arn:aws:sns:${var.context.aws_region}:${var.context.account_id}:${var.context.name_prefix}-critical-alerts"
    }
  }

  kms_key_arn = var.kms_key_main_arn

  tracing_config {
    mode = "Active"
  }

  source_code_hash = data.archive_file.rotate_eip_zip.output_base64sha256

  tags = merge(var.context.common_tags, {
    Name    = "${var.context.name_prefix}-rotate-eip"
    Purpose = "Operational Runbook"
  })
}

# Create a secure, invokable URL for the Lambda as described in the runbook
resource "aws_lambda_function_url" "rotate_eip" {
  function_name      = aws_lambda_function.rotate_nat_gateway_eip.function_name
  authorization_type = "AWS_IAM"
}

# =============================================================================
# LAMBDA FUNCTION ARCHIVES
# =============================================================================

data "archive_file" "api_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/api_handler.zip"
  
  source {
    content  = file("${path.module}/lambda_code/api_handler.js")
    filename = "index.js"
  }
}

data "archive_file" "dynamodb_sync_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/dynamodb_sync.zip"
  
  source {
    content  = file("${path.module}/lambda_code/dynamodb_sync.js")
    filename = "index.js"
  }
}

data "archive_file" "discover_studios_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/discover_studios.zip"
  
  source {
    content  = file("${path.module}/lambda_code/discover_studios.js")
    filename = "index.js"
  }
}

data "archive_file" "find_artists_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/find_artists.zip"
  
  source {
    content  = file("${path.module}/lambda_code/find_artists.js")
    filename = "index.js"
  }
}

data "archive_file" "queue_scraping_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/queue_scraping.zip"
  
  source {
    content  = file("${path.module}/lambda_code/queue_scraping.js")
    filename = "index.js"
  }
}

data "archive_file" "rotate_eip_zip" {
  type             = "zip"
  source_file      = "${path.module}/../../../../src/operations/rotate_eip/rotate-nat-gateway-eip.py"
  output_path      = "${path.module}/dist/rotate_eip.zip"
  output_file_mode = "0644"
}

# =============================================================================
# ECS CLUSTER
# =============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.context.name_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      kms_key_id = var.kms_key_main_arn
      logging    = "OVERRIDE"

    log_configuration {
      cloud_watch_encryption_enabled = true
      cloud_watch_log_group_name      = aws_cloudwatch_log_group.ecs_cluster.name
      }
    }
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-ecs-cluster"
  })
}

# ECS Cluster CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_cluster" {
  name              = "/aws/ecs/cluster/${var.context.name_prefix}"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-ecs-cluster-logs"
  })
}

# ECS Task Definition for Scraper
resource "aws_ecs_task_definition" "scraper" {
  family                   = "${var.context.name_prefix}-scraper"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn           = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name  = "scraper"
      image = "${var.scraper_image_repository}:${var.scraper_image_tag}"
      
      essential = true
      readonlyRootFilesystem = true
      
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.context.environment
        },
        {
          name  = "PROJECT_NAME"
          value = var.context.project_name
        },
        {
          name  = "SQS_QUEUE_URL"
          value = aws_sqs_queue.scraping_queue.url
        }
      ]

      secrets = [
        {
          name      = "APP_SECRETS"
          valueFrom = var.app_secrets_arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.scraper.name
          awslogs-region        = var.context.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-scraper-task"
  })
}

# DynamoDB policy for ECS Task
resource "aws_iam_policy" "ecs_task_dynamodb" {
  name   = "${var.context.name_prefix}-ecs-task-dynamodb-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"]
      Resource = [
        var.main_table_arn,
        var.denylist_table_arn,
        var.idempotency_table_arn
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_dynamodb" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.ecs_task_dynamodb.arn
}

# Scraper CloudWatch Log Group
resource "aws_cloudwatch_log_group" "scraper" {
  name              = "/aws/ecs/${var.context.name_prefix}-scraper"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-scraper-logs"
  })
}

# =============================================================================
# STEP FUNCTIONS STATE MACHINE
# =============================================================================

resource "aws_sfn_state_machine" "data_aggregation" {
  name     = "${var.context.name_prefix}-data-aggregation"
  role_arn = var.step_functions_role_arn

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }

  definition = templatefile("${path.module}/state_machine.asl.json", {
    discover_studios_arn      = aws_lambda_function.discover_studios.arn,
    find_artists_arn          = aws_lambda_function.find_artists.arn,
    queue_scraping_arn        = aws_lambda_function.queue_scraping.arn,
    ecs_cluster_arn           = aws_ecs_cluster.main.arn,
    ecs_task_definition       = aws_ecs_task_definition.scraper.arn,
    subnet_ids                = jsonencode(var.private_subnet_ids),
    fargate_security_group_id = var.fargate_security_group_id
  })

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-data-aggregation-sm"
  })
}

# Step Functions CloudWatch Log Group
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/stepfunctions/${var.context.name_prefix}-data-aggregation"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-step-functions-logs"
  })
}

# IAM Policy for Step Functions
# checkov:skip=CKV_AWS_111: The ecs:StopTask and ecs:DescribeTasks actions require a wildcard resource for the task ID, as it's not known at plan time. The scope is restricted to the specific ECS cluster, which is the tightest possible permission for the Step Functions .sync integration.
resource "aws_iam_policy" "step_functions" {
  name        = "${var.context.name_prefix}-step-functions-policy"
  description = "Policy for Step Functions state machine"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowLambdaInvocation"
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.discover_studios.arn,
          aws_lambda_function.find_artists.arn,
          aws_lambda_function.queue_scraping.arn
        ]
      },
      {
        Sid    = "AllowECSTaskExecution"
        Effect = "Allow"
        Action = "ecs:RunTask"
        Resource = [
          aws_ecs_task_definition.scraper.arn
        ]
      },
      {
        Sid    = "AllowECSTaskManagement"
        Effect = "Allow"
        Action = [
          "ecs:StopTask",
          "ecs:DescribeTasks"
        ]
        Resource = "arn:aws:ecs:${var.context.aws_region}:${var.context.account_id}:task/${aws_ecs_cluster.main.name}/*"
      },
      {
        Sid      = "AllowPassRoleForECS"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = [
          var.ecs_task_execution_role_arn,
          var.ecs_task_role_arn
        ]
      }
    ]
  })
}

# Attach policy to Step Functions role
resource "aws_iam_role_policy_attachment" "step_functions_custom" {
  role       = var.step_functions_role_name
  policy_arn = aws_iam_policy.step_functions.arn
}