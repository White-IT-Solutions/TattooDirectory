# IAM roles and policies for the application

# Data sources for AWS managed policies
data "aws_iam_policy" "aws_xray_daemon_write_access" {
  arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

data "aws_iam_policy" "amazon_ecs_task_execution_role_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy" "config_role" {
  arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

data "aws_iam_policy" "amazon_ssm_automation_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonSSMAutomationRole"
}

data "aws_iam_policy" "aws_backup_service_role_policy_for_backup" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Data sources for current AWS context
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# =============================================================================
# API LAMBDA FUNCTIONS
# =============================================================================

resource "aws_iam_role" "lambda_api_role" {
  name = "${local.name_prefix}-lambda-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-api-role"
  })
}

resource "aws_iam_policy" "lambda_api_policy" {
  name        = "${local.name_prefix}}-lambda-api-policy"
  description = "Policy for API Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-api-handler",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-api-handler:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-denylist"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-idempotency"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
          "es:ESHttpPut"
        ]
        Resource = "arn:aws:es:${var.aws_region}:${data.aws_caller_identity.current.account_id}:domain/${local.name_prefix}-search/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_api_policy_attachment" {
  role       = aws_iam_role.lambda_api_role.name
  policy_arn = aws_iam_policy.lambda_api_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_api_xray_attachment" {
  role       = aws_iam_role.lambda_api_role.name
  policy_arn = data.aws_iam_policy.aws_xray_daemon_write_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_workflow_xray" {
  for_each = {
    discover_studios = aws_iam_role.discover_studios_role.name
    find_artists     = aws_iam_role.find_artists_on_site_role.name
    queue_scraping   = aws_iam_role.queue_scraping_role.name
  }
  role       = each.value
  policy_arn = data.aws_iam_policy.aws_xray_daemon_write_access.arn
}

# =============================================================================
# DYNAMODB TO OPENSEARCH SYNC LAMBDA
# =============================================================================

resource "aws_iam_role" "lambda_sync_role" {
  name = "${local.name_prefix}}-lambda-sync-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-sync-role"
  })
}

resource "aws_iam_policy" "lambda_sync_policy" {
  name        = "${local.name_prefix}}-lambda-sync-policy"
  description = "Policy for DynamoDB to OpenSearch sync Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-dynamodb-sync",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-dynamodb-sync:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpDelete"
        ]
        Resource = "arn:aws:es:${var.aws_region}:${data.aws_caller_identity.current.account_id}:domain/${local.name_prefix}-search/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}-secrets-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sync_policy_attachment" {
  role       = aws_iam_role.lambda_sync_role.name
  policy_arn = aws_iam_policy.lambda_sync_policy.arn
}

# =============================================================================
# FARGATE SCRAPER TASKS
# =============================================================================

resource "aws_iam_role" "fargate_task_role" {
  name = "${local.name_prefix}}-fargate-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-fargate-task-role"
  })
}

resource "aws_iam_policy" "fargate_task_policy" {
  name        = "${local.name_prefix}}-fargate-task-policy"
  description = "Policy for Fargate scraper tasks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/${local.name_prefix}-fargate-scraper",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/${local.name_prefix}-fargate-scraper:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-denylist"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-scraping-queue"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "fargate_task_policy_attachment" {
  role       = aws_iam_role.fargate_task_role.name
  policy_arn = aws_iam_policy.fargate_task_policy.arn
}

resource "aws_iam_role" "fargate_execution_role" {
  name = "${local.name_prefix}}-fargate-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-fargate-execution-role"
  })
}

resource "aws_iam_role_policy_attachment" "fargate_execution_role_policy" {
  role       = aws_iam_role.fargate_execution_role.name
  policy_arn = data.aws_iam_policy.amazon_ecs_task_execution_role_policy.arn
}

# =============================================================================
# STEP FUNCTIONS & EVENTBRIDGE
# =============================================================================

resource "aws_iam_role" "step_functions_role" {
  name = "${local.name_prefix}}-step-functions-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-step-functions-role"
  })
}

resource "aws_iam_policy" "step_functions_policy" {
  name        = "${local.name_prefix}}-step-functions-policy"
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
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.name_prefix}-workflow-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes"
        ]
        Resource = "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-scraping-queue"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "step_functions_policy_attachment" {
  role       = aws_iam_role.step_functions_role.name
  policy_arn = aws_iam_policy.step_functions_policy.arn
}

resource "aws_iam_role_policy_attachment" "step_functions_xray_attachment" {
  role       = aws_iam_role.step_functions_role.name
  policy_arn = data.aws_iam_policy.aws_xray_daemon_write_access.arn
}

resource "aws_iam_role" "eventbridge_role" {
  name = "${local.name_prefix}}-eventbridge-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-eventbridge-role"
  })
}

resource "aws_iam_policy" "eventbridge_policy" {
  name        = "${local.name_prefix}}-eventbridge-policy"
  description = "Policy for EventBridge to invoke Step Functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.name_prefix}-data-aggregation"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_policy_attachment" {
  role       = aws_iam_role.eventbridge_role.name
  policy_arn = aws_iam_policy.eventbridge_policy.arn
}

# =============================================================================
# WORKFLOW LAMBDA FUNCTIONS
# =============================================================================

resource "aws_iam_role" "discover_studios_role" {
  name = "${local.name_prefix}}-discover-studios-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-discover-studios-role"
  })
}

resource "aws_iam_policy" "discover_studios_policy" {
  name        = "${local.name_prefix}}-discover-studios-policy"
  description = "Policy for Discover Studios Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-discover-studios",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-discover-studios:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "discover_studios_attachment" {
  role       = aws_iam_role.discover_studios_role.name
  policy_arn = aws_iam_policy.discover_studios_policy.arn
}

resource "aws_iam_role" "find_artists_on_site_role" {
  name = "${local.name_prefix}}-find-artists-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-find-artists-role"
  })
}

resource "aws_iam_policy" "find_artists_on_site_policy" {
  name        = "${local.name_prefix}}-find-artists-policy"
  description = "Policy for Find Artists on Site Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-find-artists",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-find-artists:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-main"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "find_artists_on_site_attachment" {
  role       = aws_iam_role.find_artists_on_site_role.name
  policy_arn = aws_iam_policy.find_artists_on_site_policy.arn
}

resource "aws_iam_role" "queue_scraping_role" {
  name = "${local.name_prefix}}-queue-scraping-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-queue-scraping-role"
  })
}

resource "aws_iam_policy" "queue_scraping_policy" {
  name        = "${local.name_prefix}}-queue-scraping-policy"
  description = "Policy for Queue Scraping Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-queue-scraping",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-workflow-queue-scraping:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-scraping-queue"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "queue_scraping_attachment" {
  role       = aws_iam_role.queue_scraping_role.name
  policy_arn = aws_iam_policy.queue_scraping_policy.arn
}

# =============================================================================
# OPERATIONAL LAMBDA FUNCTIONS
# =============================================================================

resource "aws_iam_role" "rotate_nat_gateway_eip_role" {
  name = "${local.name_prefix}}-rotate-nat-eip-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-rotate-nat-eip-role"
  })
}

resource "aws_iam_policy" "rotate_nat_gateway_eip_policy" {
  name        = "${local.name_prefix}}-rotate-nat-eip-policy"
  description = "Allows rotating the NAT Gateway EIP and publishing to SNS."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-operational-*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-operational-*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeNatGateways"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AllocateAddress",
          "ec2:AssociateAddress",
          "ec2:DisassociateAddress"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:elastic-ip/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:natgateway/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-alerts"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rotate_nat_gateway_eip_attachment" {
  role       = aws_iam_role.rotate_nat_gateway_eip_role.name
  policy_arn = aws_iam_policy.rotate_nat_gateway_eip_policy.arn
}

# =============================================================================
# AWS SERVICES
# =============================================================================

resource "aws_iam_service_linked_role" "opensearch" {
  aws_service_name = "es.amazonaws.com"
  description      = "Service linked role for OpenSearch"
}

resource "aws_iam_role" "config" {
  name = "${local.name_prefix}}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-role"
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = data.aws_iam_policy.config_role.arn
}

resource "aws_iam_role_policy" "config_s3" {
  name = "${local.name_prefix}}-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role" "cloudtrail_to_cloudwatch" {
  name = "${local.name_prefix}}-cloudtrail-to-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cloudtrail-to-cloudwatch-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail_to_cloudwatch" {
  name = "${local.name_prefix}}-cloudtrail-to-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_to_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${local.name_prefix}-cloudtrail:*"
      }
    ]
  })
}

# =============================================================================
# PRODUCTION-ONLY RESOURCES
# =============================================================================

resource "aws_iam_role" "config_remediation" {
  count = local.environment_config[var.environment].enable_config_remediation ? 1 : 0
  name  = "${local.name_prefix}}-config-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-remediation-role"
  })
}

resource "aws_iam_role_policy_attachment" "config_remediation" {
  count      = local.environment_config[var.environment].enable_config_remediation ? 1 : 0
  role       = aws_iam_role.config_remediation[0].name
  policy_arn = data.aws_iam_policy.amazon_ssm_automation_role.arn
}

resource "aws_iam_role" "config_compliance_processor" {
  count = local.environment_config[var.environment].enable_advanced_monitoring ? 1 : 0
  name  = "${local.name_prefix}}-config-compliance-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-compliance-processor-role"
  })
}

resource "aws_iam_policy" "config_compliance_processor" {
  count = local.environment_config[var.environment].enable_advanced_monitoring ? 1 : 0
  name  = "${local.name_prefix}}-config-compliance-processor-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-config-compliance-processor:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-config-notifications"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-config-compliance-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:Vpc" = aws_vpc.main.arn
          }
          "ForAllValues:StringEquals" = {
            "ec2:Subnet"        = [for s in aws_subnet.private : s.arn]
            "ec2:SecurityGroup" = [aws_security_group.lambda.arn]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_compliance_processor" {
  count      = local.environment_config[var.environment].enable_advanced_monitoring ? 1 : 0
  role       = aws_iam_role.config_compliance_processor[0].name
  policy_arn = aws_iam_policy.config_compliance_processor[0].arn
}

resource "aws_iam_role" "backup_role" {
  count = local.environment_config[var.environment].backup_enabled ? 1 : 0
  name  = "${local.name_prefix}}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-backup-role"
  })
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  count      = local.environment_config[var.environment].backup_enabled ? 1 : 0
  role       = aws_iam_role.backup_role[0].name
  policy_arn = data.aws_iam_policy.aws_backup_service_role_policy_for_backup.arn
}
# Note: Resource policies removed to avoid circular dependencies
# Access control is handled through IAM role policies above
# S3 bucket policies are defined in their respective resource files:
# - Frontend bucket policy: 01-network.tf
# - Config bucket policy: 09-aws-config.tf
# - CloudTrail bucket policy: 10-cloudtrail.tf
# =============================================================================
# ADDITIONAL AWS SERVICE ROLES
# =============================================================================

# IAM Role for API Gateway CloudWatch Logging
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "${local.name_prefix}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-cloudwatch-role"
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_logs" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs_role" {
  name = "${local.name_prefix}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role"
  })
}

resource "aws_iam_policy" "vpc_flow_logs_policy" {
  name        = "${local.name_prefix}-vpc-flow-logs-policy"
  description = "Policy for VPC Flow Logs to write to CloudWatch"

  policy = jsonencode({
    #tfsec:ignore:aws-iam-no-policy-wildcards
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "VPCFlowLogPermissionsForLogGroup"
        Effect = "Allow"
        Action = [
          # DescribeLogGroups is needed for the service to verify the log group exists.
          "logs:DescribeLogGroups",
          # CreateLogStream and DescribeLogStreams are needed to create and check for log streams.
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
        ]
        # This is scoped to the specific log group created for flow logs.
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/vpc/flowlogs/${var.project_name}"
      },
      {
        Sid    = "VPCFlowLogPermissionsForLogEvents"
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        # This wildcard is necessary because the service creates log streams with dynamic names.
        # This is the most specific wildcard possible for this action.
        # It is not possible to completely eliminate the wildcard from the IAM policy when directing VPC Flow Logs to CloudWatch Logs. 
        # The service principal for flow logs (vpc-flow-logs.amazonaws.com) requires permission to create log streams with names that are dynamically generated and therefore unknown in advance.
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/vpc/flowlogs/${var.project_name}:log-stream:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "vpc_flow_logs_policy_attachment" {
  role       = aws_iam_role.vpc_flow_logs_role.name
  policy_arn = aws_iam_policy.vpc_flow_logs_policy.arn
}

# IAM Role for EventBridge Custom Bus
resource "aws_iam_role" "eventbridge_custom_bus_role" {
  name = "${local.name_prefix}-eventbridge-custom-bus-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eventbridge-custom-bus-role"
  })
}

resource "aws_iam_policy" "eventbridge_custom_bus_policy" {
  name        = "${local.name_prefix}-eventbridge-custom-bus-policy"
  description = "Policy for EventBridge custom bus operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents",
          "events:PutRule",
          "events:PutTargets",
          "events:DeleteRule",
          "events:RemoveTargets",
          "events:DescribeRule",
          "events:ListTargetsByRule"
        ]
        Resource = [
          "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:event-bus/${local.name_prefix}-*",
          "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/${local.name_prefix}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = [
          "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.name_prefix}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.name_prefix}-workflow-*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_custom_bus_policy_attachment" {
  role       = aws_iam_role.eventbridge_custom_bus_role.name
  policy_arn = aws_iam_policy.eventbridge_custom_bus_policy.arn
}

# IAM Role for CloudWatch Events (EventBridge) to invoke Lambda
resource "aws_iam_role" "eventbridge_lambda_invoke_role" {
  name = "${local.name_prefix}-eventbridge-lambda-invoke-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eventbridge-lambda-invoke-role"
  })
}

resource "aws_iam_policy" "eventbridge_lambda_invoke_policy" {
  name        = "${local.name_prefix}-eventbridge-lambda-invoke-policy"
  description = "Policy for EventBridge to invoke Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.name_prefix}-*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_lambda_invoke_policy_attachment" {
  role       = aws_iam_role.eventbridge_lambda_invoke_role.name
  policy_arn = aws_iam_policy.eventbridge_lambda_invoke_policy.arn
}

# IAM Role for S3 replication (production only)
resource "aws_iam_role" "s3_replication" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-replication-role"
  })
}

# IAM Policy for S3 replication (production only)
resource "aws_iam_policy" "s3_replication" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${local.name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.frontend.arn}/*",
          "${aws_s3_bucket.frontend_backup.arn}/*",
          "${aws_s3_bucket.access_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.frontend.arn,
          aws_s3_bucket.frontend_backup.arn,
          aws_s3_bucket.access_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.frontend_replica[0].arn}/*",
          "${aws_s3_bucket.frontend_backup_replica[0].arn}/*",
          "${aws_s3_bucket.access_logs_replica[0].arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.replica[0].arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  count      = var.environment == "prod" ? 1 : 0
  role       = aws_iam_role.s3_replication[0].name
  policy_arn = aws_iam_policy.s3_replication[0].arn
}