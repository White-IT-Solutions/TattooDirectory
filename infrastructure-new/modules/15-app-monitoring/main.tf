# =============================================================================
# APP MONITORING MODULE
# =============================================================================
# This module contains application monitoring resources for the Infrastructure Account:
# - CloudWatch alarms for application metrics
# - CloudWatch dashboard for application overview
# - SNS topics for operational alerts
# - Log Insights queries for application troubleshooting

# =============================================================================
# SNS TOPICS FOR OPERATIONAL NOTIFICATIONS
# =============================================================================

# Critical alerts topic for application issues
resource "aws_sns_topic" "critical_alerts" {
  name              = "${var.context.name_prefix}-critical-alerts"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-critical-alerts"
  })
}

# Warning alerts topic for application warnings
resource "aws_sns_topic" "warning_alerts" {
  name              = "${var.context.name_prefix}-warning-alerts"
  kms_master_key_id = var.kms_key_main_arn

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-warning-alerts"
  })
}

# =============================================================================
# SNS TOPIC SUBSCRIPTIONS
# =============================================================================

resource "aws_sns_topic_subscription" "critical_email" {
  count = var.context.notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.context.notification_email
}

resource "aws_sns_topic_subscription" "warning_email" {
  count = var.context.notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.context.notification_email
}

# =============================================================================
# CLOUDWATCH ALARMS - API GATEWAY
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  alarm_name          = "${var.context.name_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGatewayV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 4XX errors"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ApiId = var.api_gateway_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-4xx-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${var.context.name_prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGatewayV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    ApiId = var.api_gateway_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-5xx-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "${var.context.name_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGatewayV2"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000"
  alarm_description   = "This metric monitors API Gateway latency"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ApiId = var.api_gateway_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-api-latency"
  })
}

# =============================================================================
# CLOUDWATCH ALARMS - LAMBDA FUNCTIONS
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.lambda_function_names

  alarm_name          = "${var.context.name_prefix}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function ${each.key} errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-${each.key}-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = var.lambda_function_names

  alarm_name          = "${var.context.name_prefix}-lambda-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds
  alarm_description   = "This metric monitors Lambda function ${each.key} duration"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-lambda-${each.key}-duration"
  })
}

# =============================================================================
# CLOUDWATCH ALARMS - DYNAMODB
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.context.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttled requests"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    TableName = var.main_table_name
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-dynamodb-throttles"
  })
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_errors" {
  alarm_name          = "${var.context.name_prefix}-dynamodb-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB system errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    TableName = var.main_table_name
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-dynamodb-errors"
  })
}

# =============================================================================
# CLOUDWATCH ALARMS - OPENSEARCH
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "opensearch_cluster_status" {
  alarm_name          = "${var.context.name_prefix}-opensearch-cluster-status"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ClusterStatus.green"
  namespace           = "AWS/ES"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "This metric monitors OpenSearch cluster status"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    DomainName = var.opensearch_domain_name
    ClientId   = var.context.account_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-cluster-status"
  })
}

resource "aws_cloudwatch_metric_alarm" "opensearch_cpu_utilization" {
  alarm_name          = "${var.context.name_prefix}-opensearch-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ES"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors OpenSearch CPU utilization"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DomainName = var.opensearch_domain_name
    ClientId   = var.context.account_id
  }

  tags = merge(var.context.common_tags, {
    Name = "${var.context.name_prefix}-opensearch-cpu"
  })
}

# =============================================================================
# CLOUDWATCH DASHBOARD
# =============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.context.name_prefix}-overview"

  dashboard_body = templatefile("${path.module}/dashboard.json.tftpl", {
    region                  = var.context.aws_region
    api_id                  = var.api_gateway_id
    lambda_api_handler_name = var.lambda_function_names.api_handler
    dynamodb_table_name     = var.main_table_name
    opensearch_domain_name  = var.opensearch_domain_name
    ecs_cluster_name        = var.ecs_cluster_name
    step_functions_name     = var.step_functions_state_machine_name
  })
}

# =============================================================================
# CLOUDWATCH LOG INSIGHTS QUERIES
# =============================================================================

resource "aws_cloudwatch_query_definition" "api_errors" {
  name = "${var.context.name_prefix}-api-errors"

  log_group_names = [
    var.api_gateway_log_group_name
  ]

  query_string = <<EOF
fields @timestamp, @message, status, errorMessage, errorType
| filter status >= 400
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "lambda_errors" {
  name = "${var.context.name_prefix}-lambda-errors"

  log_group_names = var.lambda_log_group_names

  query_string = <<EOF
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "${var.context.name_prefix}-performance-analysis"

  log_group_names = [
    var.api_gateway_log_group_name
  ]

  query_string = <<EOF
fields @timestamp, responseLength, requestTime, httpMethod, routeKey
| filter responseLength > 1000000 or requestTime > 5000
| sort @timestamp desc
| limit 50
EOF
}