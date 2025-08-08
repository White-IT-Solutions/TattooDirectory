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

  definition = jsonencode({
    Comment = "Data aggregation workflow"
    StartAt = "DiscoverStudios"
    States = {
      DiscoverStudios = {
        Type     = "Task"
        Resource = aws_lambda_function.discover_studios.arn
        Next     = "FindArtists"
      }
      FindArtists = {
        Type     = "Task"
        Resource = aws_lambda_function.find_artists.arn
        Next     = "QueueScraping"
      }
      QueueScraping = {
        Type     = "Task"
        Resource = aws_lambda_function.queue_scraping.arn
        End      = true
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

# ECS Task Definition
resource "aws_ecs_task_definition" "scraper" {
  family                   = "${local.name_prefix}-scraper"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "scraper"
      image = "nginx:latest" # Placeholder image
      essential = true
      
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
  filename      = data.archive_file.discover_studios_zip.output_path
  function_name = "${local.name_prefix}-discover-studios"
  role          = aws_iam_role.discover_studios_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size

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
  filename      = data.archive_file.find_artists_zip.output_path
  function_name = "${local.name_prefix}-find-artists"
  role          = aws_iam_role.find_artists_on_site_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size

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
  filename      = data.archive_file.queue_scraping_zip.output_path
  function_name = "${local.name_prefix}-queue-scraping"
  role          = aws_iam_role.queue_scraping_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 300
  memory_size   = local.config.lambda_memory_size

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