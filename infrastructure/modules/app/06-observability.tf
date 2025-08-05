# SNS Topic for high-priority alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}}-alerts"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-alerts-topic"
  })
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarmsToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# SNS Subscription for email notifications
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Metric Alarms

# SQS Queue Depth Alarm
resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  alarm_name          = "${local.name_prefix}}-sqs-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "This metric monitors SQS queue depth"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.scraping_queue.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-sqs-queue-depth-alarm"
  })
}

# SQS Dead-Letter Queue Messages Alarm
resource "aws_cloudwatch_metric_alarm" "sqs_dlq_messages" {
  alarm_name          = "${local.name_prefix}}-sqs-dlq-messages-visible"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors for any messages in the SQS dead-letter queue, indicating processing failures."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching" # Don't alarm if there's no data (i.e., queue is empty and metric isn't published)

  dimensions = {
    QueueName = aws_sqs_queue.scraping_dlq.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-sqs-dlq-messages-alarm"
  })
}

# API Gateway 5xx Errors Alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${local.name_prefix}}-api-gateway-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGatewayV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-api-gateway-5xx-errors-alarm"
  })
}

# Lambda Function Errors Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-errors-alarm"
  })
}

# Lambda Function Duration Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.name_prefix}}-lambda-duration-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds
  alarm_description   = "This metric monitors Lambda function duration"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-duration-alarm"
  })
}

# DynamoDB Throttled Requests Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum" # Sum of throttles over the period
  threshold           = "10"  # Allow for a few transient throttles before alerting
  alarm_description   = "This metric monitors DynamoDB throttled requests"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  # ok_actions are often removed for non-critical alarms to reduce notification noise

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-throttles-alarm"
  })
}

# DynamoDB Point-in-Time Recovery monitoring
resource "aws_cloudwatch_metric_alarm" "dynamodb_pitr_status" {
  count               = local.environment_config[var.environment].backup_enabled ? 1 : 0
  alarm_name          = "${local.name_prefix}-dynamodb-pitr-disabled"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PointInTimeRecoveryEnabled"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "This metric monitors DynamoDB Point-in-Time Recovery status"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-pitr-alarm"
  })
}

# OpenSearch Cluster Status Alarm
resource "aws_cloudwatch_metric_alarm" "opensearch_cluster_status" {
  alarm_name          = "${local.name_prefix}}-opensearch-cluster-status"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ClusterStatus.red"
  namespace           = "AWS/ES"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors OpenSearch cluster status"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DomainName = aws_opensearch_domain.main.domain_name
    ClientId   = data.aws_caller_identity.current.account_id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-opensearch-cluster-status-alarm"
  })
}

# ECS Service CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_utilization" {
  alarm_name          = "${local.name_prefix}}-ecs-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS service CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.scraper.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-ecs-cpu-utilization-alarm"
  })
}

# Step Functions Execution Failed Alarm
resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "${local.name_prefix}}-step-functions-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors Step Functions failed executions"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.data_aggregation.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-step-functions-failed-alarm"
  })
}

# AWS Budget for daily cost monitoring
resource "aws_budgets_budget" "daily_spend" {
  name         = "${local.name_prefix}}-daily-spend-alert"
  budget_type  = "COST"
  limit_amount = "20" # Based on runbook TAD-MVP-RUN-002
  limit_unit   = "GBP"
  time_unit    = "DAILY" 
  cost_filter {
    name = "Tag"
    values    = [var.project_name]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-daily-spend-budget"
  })
}

# AWS Cost Anomaly Detection
resource "aws_cost_anomaly_monitor" "main" {
  name                  = "${local.name_prefix}}-anomaly-monitor"
  monitor_type          = "CUSTOM"
  monitor_specification = jsonencode({
    "Tags" = {
      "Key"    = "Project"
      "Values" = [var.project_name]
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cost-anomaly-monitor"
  })
}

resource "aws_cost_anomaly_subscription" "main" {
  name             = "${local.name_prefix}}-anomaly-subscription"
  monitor_arn_list = [aws_cost_anomaly_monitor.main.arn]
  frequency        = "DAILY"
  threshold        = 10 # Threshold in USD for anomaly notification

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.alerts.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-cost-anomaly-subscription"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGatewayV2", "Count", "ApiId", aws_apigatewayv2_api.main.id],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."],
            [".", "Latency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api_handler.function_name],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."],
            [".", "Throttles", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfVisibleMessages", "QueueName", aws_sqs_queue.scraping_queue.name],
            [".", "NumberOfMessagesSent", ".", "."],
            [".", "NumberOfMessagesReceived", ".", "."],
            [".", "NumberOfMessagesDeleted", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Queue Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.main.name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ThrottledRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ES", "ClusterStatus.yellow", "DomainName", aws_opensearch_domain.main.domain_name, "ClientId", data.aws_caller_identity.current.account_id],
            [".", "ClusterStatus.red", ".", ".", ".", "."],
            [".", "SearchLatency", ".", ".", ".", "."],
            [".", "IndexingLatency", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "OpenSearch Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 30
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.scraper.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
            [".", "RunningTaskCount", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
          period  = 300
        }
      }
    ]
  })

}

# CloudWatch Composite Alarm for overall system health
resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name        = "${local.name_prefix}}-system-health"
  alarm_description = "Composite alarm for overall system health"

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.opensearch_cluster_status.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.step_functions_failed.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.sqs_dlq_messages.alarm_name})"
  ])

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-system-health-alarm"
  })
}

# X-Ray sampling rule for cost control
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${local.name_prefix}}-sampling-rule"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = var.environment == "prod" ? 0.1 : 0.5  # Sample more in dev
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-xray-sampling-rule"
  })
}