# Data aggregation resources - SQS, Step Functions, ECS

# SQS Queue for scraping tasks
resource "aws_sqs_queue" "scraping_queue" {
  name                      = "${local.name_prefix}-scraping-queue"
  message_retention_seconds = 1209600 # 14 days
  visibility_timeout_seconds = 300
  kms_master_key_id         = aws_kms_key.main.arn

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scraping_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scraping-queue"
  })
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "scraping_dlq" {
  name                      = "${local.name_prefix}-scraping-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scraping-dlq"
  })
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "data_aggregation" {
  name     = "${local.name_prefix}-data-aggregation"
  role_arn = aws_iam_role.step_functions.arn
  
  logging_configuration {
    level = "ALL"
    include_execution_data = true
  }

  tracing_configuration {
    enabled = true
  }

  definition = jsonencode({
    Comment = "Data aggregation workflow"
    StartAt = "DiscoverStudios"
    States = {
      DiscoverStudios = {
        Type     = "Task"
        Resource = aws_lambda_function.discover_studios.arn
        Next     = "FindArtists",
        Retry = [
          {
            ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException", "Lambda.TooManyRequestsException"],
            IntervalSeconds = 2,
            MaxAttempts = 6,
            BackoffRate = 2
          }
        ],
        Catch = [
          {
            ErrorEquals = ["States.All"],
            Next = "AggregationFailed"
          }
        ]
      }
      FindArtists = {
        Type     = "Task"
        Resource = aws_lambda_function.find_artists.arn
        Next     = "QueueScraping",
        Retry = [
          {
            ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException", "Lambda.TooManyRequestsException"],
            IntervalSeconds = 2,
            MaxAttempts = 6,
            BackoffRate = 2
          }
        ],
        Catch = [
          {
            ErrorEquals = ["States.All"],
            Next = "AggregationFailed"
          }
        ]
      }
      QueueScraping = {
        Type     = "Task"
        Resource = aws_lambda_function.queue_scraping.arn
        End      = true,
        Retry = [
          {
            ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException", "Lambda.TooManyRequestsException"],
            IntervalSeconds = 2,
            MaxAttempts = 6,
            BackoffRate = 2
          }
        ],
        Catch = [
          {
            ErrorEquals = ["States.All"],
            Next = "AggregationFailed"
          }
        ]
      },
      AggregationFailed = {
        Type = "Fail",
        Comment = "The data aggregation process failed."
      }
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-aggregation"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-cluster"
  })
}

# ECR Repository for the scraper
resource "aws_ecr_repository" "scraper" {
  name                 = "${local.name_prefix}/scraper"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.main.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scraper-ecr"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "scraper" {
  family                   = "${local.name_prefix}-scraper"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name  = "scraper"
      image = "${aws_ecr_repository.scraper.repository_url}:${var.scraper_image_tag}"
      essential = true
      readonlyRootFilesystem = true
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.fargate_scraper.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scraper-task"
  })
}

# ECS Service
resource "aws_ecs_service" "scraper" {
  name            = "${local.name_prefix}-scraper"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scraper.arn
  desired_count   = 0 # Start with 0, scale as needed
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = values(aws_subnet.private)[*].id
    security_groups  = [aws_security_group.fargate.id]
    assign_public_ip = false
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scraper-service"
  })
}

# Placeholder Lambda functions for Step Functions
resource "aws_lambda_function" "discover_studios" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.discover_studios_zip.output_path
  function_name = "${local.name_prefix}-discover-studios"
  role          = aws_iam_role.discover_studios_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size
  code_signing_config_arn = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  # Set a concurrency limit for reliability and cost control
  reserved_concurrent_executions = 5

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  source_code_hash = data.archive_file.discover_studios_zip.output_base64sha256

  environment {
    variables = local.lambda_environment_vars
  }

  kms_key_arn = aws_kms_key.main.arn

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-discover-studios"
  })
}

resource "aws_lambda_function" "find_artists" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.find_artists_zip.output_path
  function_name = "${local.name_prefix}-find-artists"
  role          = aws_iam_role.find_artists_on_site_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size
  code_signing_config_arn = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  # Set a concurrency limit for reliability and cost control
  reserved_concurrent_executions = 5

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  source_code_hash = data.archive_file.find_artists_zip.output_base64sha256

  environment {
    variables = local.lambda_environment_vars
  }

  kms_key_arn = aws_kms_key.main.arn

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-find-artists"
  })
}

resource "aws_lambda_function" "queue_scraping" {
  # checkov:skip=CKV_AWS_116: Not required as function is invoked as synchronous task within state machine.
  filename      = data.archive_file.queue_scraping_zip.output_path
  function_name = "${local.name_prefix}-queue-scraping"
  role          = aws_iam_role.queue_scraping_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size
  code_signing_config_arn = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  # Set a concurrency limit for reliability and cost control
  reserved_concurrent_executions = 5

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  source_code_hash = data.archive_file.queue_scraping_zip.output_base64sha256

  environment {
    variables = merge(local.lambda_environment_vars, {
      SQS_QUEUE_URL = aws_sqs_queue.scraping_queue.url
    })
  }

  kms_key_arn = aws_kms_key.main.arn

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-queue-scraping"
  })
}

# Placeholder zip files for Lambda functions
data "archive_file" "discover_studios_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/discover_studios.zip"
  
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'Discover Studios' }; };"
    filename = "index.js"
  }
}

data "archive_file" "find_artists_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/find_artists.zip"
  
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'Find Artists' }; };"
    filename = "index.js"
  }
}

data "archive_file" "queue_scraping_zip" {
  type        = "zip"
  output_path = "${path.module}/dist/queue_scraping.zip"
  
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'Queue Scraping' }; };"
    filename = "index.js"
  }
}