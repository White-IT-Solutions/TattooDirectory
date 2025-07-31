# ECR Repository for Fargate scraper
resource "aws_ecr_repository" "scraper" {
  name                 = "${var.project_name}-scraper"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.main.arn
  }

  tags = {
    Name = "${var.project_name}-scraper-repo"
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "scraper" {
  repository = aws_ecr_repository.scraper.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "scraping_dlq" {
  name                      = "${var.project_name}-scraping-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-scraping-dlq"
  }
}

# SQS Queue for scraping jobs
resource "aws_sqs_queue" "scraping_queue" {
  name                       = "${var.project_name}-scraping-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 20      # Long polling
  visibility_timeout_seconds = 900     # 15 minutes

  kms_master_key_id = aws_kms_key.main.arn

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scraping_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "${var.project_name}-scraping-queue"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  configuration {
    execute_command_configuration {
      kms_key_id = aws_kms_key.main.arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs_cluster.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-ecs-cluster"
  }
}

# ECS Task Definition for Fargate scraper
resource "aws_ecs_task_definition" "scraper" {
  family                   = "${var.project_name}-scraper"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.fargate_execution_role.arn
  task_role_arn            = aws_iam_role.fargate_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "scraper"
      image = "${aws_ecr_repository.scraper.repository_url}:${var.scraper_image_tag}"

      essential = true

      environment = [
        {
          name  = "SQS_QUEUE_URL"
          value = aws_sqs_queue.scraping_queue.url
        },
        {
          name  = "DYNAMODB_TABLE_NAME"
          value = aws_dynamodb_table.main.name
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.fargate_scraper.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-scraper-task"
  }
}

# ECS Service for Fargate scraper
resource "aws_ecs_service" "scraper" {
  name            = "${var.project_name}-scraper-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scraper.arn
  desired_count   = 0 # Start with 0, scale based on queue depth
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = values(aws_subnet.private)[*].id
    security_groups  = [aws_security_group.fargate.id]
    assign_public_ip = false
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name = "${var.project_name}-scraper-service"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_task_policy_attachment,
    aws_iam_role_policy_attachment.fargate_execution_role_policy
  ]
}

# Application Auto Scaling Target
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 0
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.scraper.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Application Auto Scaling Policy
resource "aws_appautoscaling_policy" "ecs_policy" {
  name               = "${var.project_name}-scraper-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 5.0 # Target 5 messages per task

    customized_metric_specification {
      metrics {
        id    = "m1"
        label = "SQS Queue Depth"

        metric_stat {
          metric {
            metric_name = "ApproximateNumberOfVisibleMessages"
            namespace   = "AWS/SQS"

            dimensions {
              name  = "QueueName"
              value = aws_sqs_queue.scraping_queue.name
            }
          }
          stat = "Average"
        }

        return_data = true
      }
    }

    scale_out_cooldown = 300
    scale_in_cooldown  = 300
  }
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "data_aggregation" {
  name     = "${var.project_name}-data-aggregation"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
      Comment = "Data aggregation workflow for tattoo artist directory"
      StartAt = "DiscoverStudios"
      States = {
        DiscoverStudios = {
          Type     = "Task"
          Resource = "arn:aws:states:::lambda:invoke"
          Parameters = {
            FunctionName = aws_lambda_function.discover_studios.function_name
            Payload = {
              "stage" = "discover-studios"
            }
          }
          ResultPath = "$.DiscoveredStudios"
          Next       = "FindArtistsOnSite"
          Retry = [
            {
              ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
              IntervalSeconds = 2
              MaxAttempts     = 6
              BackoffRate     = 2
            }
          ]
        }
        FindArtistsOnSite = {
          Type      = "Map"
          InputPath = "$.DiscoveredStudios.Payload.studios"
          Iterator = {
            StartAt = "FindArtistsTask"
            States = {
              FindArtistsTask = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  "FunctionName" = aws_lambda_function.find_artists_on_site.function_name
                  "Payload.$"    = "$"
                }
                ResultPath = "$.ArtistSearchResult"
                End        = true
              }
            }
          }
          ResultPath = "$.FoundArtists"
          Next       = "FlattenResults"
        }
        FlattenResults = {
          Type = "Pass"
          Parameters = {
            "artists.$" = "States.ArrayFlatten($.FoundArtists[*].ArtistSearchResult.Payload.artists)"
          }
          ResultPath = "$.Flattened"
          Next       = "QueueScrapingJobs"
        }
        QueueScrapingJobs = {
          Type      = "Task"
          Resource  = "arn:aws:states:::lambda:invoke"
          InputPath = "$.Flattened"
          Parameters = {
            FunctionName = aws_lambda_function.queue_scraping.function_name
            "Payload.$"  = "$"
          }
          Next = "WaitForScraping"
          Retry = [
            {
              ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
              IntervalSeconds = 2
              MaxAttempts     = 6
              BackoffRate     = 2
            }
          ]
        }
        WaitForScraping = {
          Type    = "Wait"
          Seconds = 300
          Next    = "CheckQueueEmpty"
        }
        CheckQueueEmpty = {
          Type     = "Task"
          Resource = "arn:aws:states:::aws-sdk:sqs:getQueueAttributes"
          Parameters = {
            QueueUrl       = aws_sqs_queue.scraping_queue.url
            AttributeNames = ["All"]
          }
          ResultPath = "$.QueueAttributes"
          Next       = "IsQueueEmpty"
        }
        IsQueueEmpty = {
          Type = "Choice"
          Choices = [
            {
              And = [
                {
                  Variable     = "$.QueueAttributes.Attributes.ApproximateNumberOfMessages"
                  StringEquals = "0"
                },
                {
                  Variable     = "$.QueueAttributes.Attributes.ApproximateNumberOfMessagesNotVisible"
                  StringEquals = "0"
                }
              ]
              Next = "Success"
            }
          ]
          Default = "WaitForScraping"
        }
        Success = {
          Type = "Succeed"
        }
      }
    })

  tags = {
    Name = "${var.project_name}-data-aggregation-sm"
  }
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions_role" {
  name = "${var.project_name}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-step-functions-role"
  }
}

resource "aws_iam_policy" "step_functions_policy" {
  name        = "${var.project_name}-step-functions-policy"
  description = "Policy for Step Functions state machine"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.discover_studios.arn,
          aws_lambda_function.find_artists_on_site.arn,
          aws_lambda_function.queue_scraping.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.scraping_queue.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "step_functions_policy_attachment" {
  role       = aws_iam_role.step_functions_role.name
  policy_arn = aws_iam_policy.step_functions_policy.arn
}

# EventBridge Rule for daily execution
resource "aws_cloudwatch_event_rule" "daily_aggregation" {
  name                = "${var.project_name}-daily-aggregation"
  description         = "Trigger data aggregation workflow daily"
  schedule_expression = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

  tags = {
    Name = "${var.project_name}-daily-aggregation-rule"
  }
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "step_functions_target" {
  rule      = aws_cloudwatch_event_rule.daily_aggregation.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.data_aggregation.arn
  role_arn  = aws_iam_role.eventbridge_role.arn
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge_role" {
  name = "${var.project_name}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-eventbridge-role"
  }
}

resource "aws_iam_policy" "eventbridge_policy" {
  name        = "${var.project_name}-eventbridge-policy"
  description = "Policy for EventBridge to invoke Step Functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.data_aggregation.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_policy_attachment" {
  role       = aws_iam_role.eventbridge_role.name
  policy_arn = aws_iam_policy.eventbridge_policy.arn
}

# IAM Roles for Workflow Lambda Functions (Least Privilege)

# Role for Discover Studios Lambda
resource "aws_iam_role" "discover_studios_role" {
  name = "${var.project_name}-discover-studios-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Name = "${var.project_name}-discover-studios-role" }
}

resource "aws_iam_policy" "discover_studios_policy" {
  name = "${var.project_name}-discover-studios-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:Query", "dynamodb:Scan"],
        Resource = [aws_dynamodb_table.main.arn]
      },
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = [aws_cloudwatch_log_group.lambda_workflow.arn, "${aws_cloudwatch_log_group.lambda_workflow.arn}:*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "discover_studios_attachment" {
  role       = aws_iam_role.discover_studios_role.name
  policy_arn = aws_iam_policy.discover_studios_policy.arn
}

# Role for Find Artists on Site Lambda
resource "aws_iam_role" "find_artists_on_site_role" {
  name = "${var.project_name}-find-artists-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Name = "${var.project_name}-find-artists-role" }
}

resource "aws_iam_policy" "find_artists_on_site_policy" {
  name = "${var.project_name}-find-artists-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = [aws_cloudwatch_log_group.lambda_workflow.arn, "${aws_cloudwatch_log_group.lambda_workflow.arn}:*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "find_artists_on_site_attachment" {
  role       = aws_iam_role.find_artists_on_site_role.name
  policy_arn = aws_iam_policy.find_artists_on_site_policy.arn
}

# Role for Queue Scraping Lambda
resource "aws_iam_role" "queue_scraping_role" {
  name = "${var.project_name}-queue-scraping-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Name = "${var.project_name}-queue-scraping-role" }
}

resource "aws_iam_policy" "queue_scraping_policy" {
  name = "${var.project_name}-queue-scraping-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["sqs:SendMessage"],
        Resource = [aws_sqs_queue.scraping_queue.arn]
      },
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = [aws_cloudwatch_log_group.lambda_workflow.arn, "${aws_cloudwatch_log_group.lambda_workflow.arn}:*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "queue_scraping_attachment" {
  role       = aws_iam_role.queue_scraping_role.name
  policy_arn = aws_iam_policy.queue_scraping_policy.arn
}

# Placeholder Lambda functions for the workflow
resource "aws_lambda_function" "discover_studios" {
  filename         = data.archive_file.discover_studios_zip.output_path
  function_name    = "${var.project_name}-discover-studios"
  role             = aws_iam_role.discover_studios_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 300
  source_code_hash = data.archive_file.discover_studios_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-discover-studios"
  }
}

resource "aws_lambda_function" "find_artists_on_site" {
  filename         = data.archive_file.find_artists_on_site_zip.output_path
  function_name    = "${var.project_name}-find-artists-on-site"
  role             = aws_iam_role.find_artists_on_site_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 300
  source_code_hash = data.archive_file.find_artists_on_site_zip.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-find-artists-on-site"
  }
}

resource "aws_lambda_function" "queue_scraping" {
  filename         = data.archive_file.queue_scraping_zip.output_path
  function_name    = "${var.project_name}-queue-scraping"
  role             = aws_iam_role.queue_scraping_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 300
  source_code_hash = data.archive_file.queue_scraping_zip.output_base64sha256

  environment {
    variables = {
      SQS_QUEUE_URL       = aws_sqs_queue.scraping_queue.url
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-queue-scraping"
  }
}

# Placeholder zip files for Lambda functions
data "archive_file" "discover_studios_zip" {
  type        = "zip"
  output_path = "${path.module}/discover_studios.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
    console.log('Discover Studios Event:', JSON.stringify(event, null, 2));
    // Placeholder for studio discovery logic.
    // This should return an array of studio objects to be processed.
    const studios = [
        { "studioId": "studio-1", "website": "https://studio1.com" },
        { "studioId": "studio-2", "website": "https://studio2.com" }
    ];
    return { studios: studios };
};
EOF
    filename = "index.js"
  }
}

data "archive_file" "find_artists_on_site_zip" {
  type        = "zip"
  output_path = "${path.module}/find_artists_on_site.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
    console.log('Find Artists on Site Event:', JSON.stringify(event, null, 2));
    // Placeholder for finding artists on a given studio website.
    // Input: a single studio object.
    // Output: an array of artist objects found at that studio.
    const artists = [
      { "artistId": `${event.studioId}-artist-1`, "portfolioUrl": `https://instagram.com/artist1` },
      { "artistId": `${event.studioId}-artist-2`, "portfolioUrl": `https://instagram.com/artist2` }
    ];
    return { artists: artists };
};
EOF
    filename = "index.js"
  }
}

data "archive_file" "queue_scraping_zip" {
  type        = "zip"
  output_path = "${path.module}/queue_scraping.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
    console.log('Queue Scraping Event:', JSON.stringify(event, null, 2));
    // Placeholder for queueing scraping jobs.
    // Input: an object containing an array of artist objects. e.g. { "artists": [...] }
    const artistCount = event.artists ? event.artists.length : 0;
    console.log(`Received ${artistCount} artists to queue.`);
    // Add logic here to send each artist to SQS.
    return { statusCode: 200, body: `${artistCount} scraping jobs queued` };
};
EOF
    filename = "index.js"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs_cluster" {
  name              = "/aws/ecs/${var.project_name}-cluster"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-ecs-cluster-logs"
  }
}

resource "aws_cloudwatch_log_group" "fargate_scraper" {
  name              = "/aws/ecs/${var.project_name}-scraper"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-fargate-scraper-logs"
  }
}

resource "aws_cloudwatch_log_group" "lambda_workflow" {
  name              = "/aws/lambda/${var.project_name}-workflow"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-lambda-workflow-logs"
  }
}
