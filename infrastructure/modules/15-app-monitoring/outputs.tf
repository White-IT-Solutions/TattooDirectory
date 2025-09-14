# =============================================================================
# APP MONITORING MODULE OUTPUTS
# =============================================================================

# =============================================================================
# SNS TOPICS
# =============================================================================

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

# =============================================================================
# CLOUDWATCH DASHBOARD
# =============================================================================

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.context.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.context.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

output "alarm_arns" {
  description = "Map of CloudWatch alarm ARNs"
  value = merge(
    {
      api_4xx_errors            = aws_cloudwatch_metric_alarm.api_gateway_4xx_errors.arn
      api_5xx_errors            = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.arn
      api_latency               = aws_cloudwatch_metric_alarm.api_gateway_latency.arn
      dynamodb_throttles        = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
      dynamodb_errors           = aws_cloudwatch_metric_alarm.dynamodb_errors.arn
      opensearch_cluster_status = aws_cloudwatch_metric_alarm.opensearch_cluster_status.arn
      opensearch_cpu            = aws_cloudwatch_metric_alarm.opensearch_cpu_utilization.arn
    },
    {
      for k, v in aws_cloudwatch_metric_alarm.lambda_errors : "lambda_${k}_errors" => v.arn
    },
    {
      for k, v in aws_cloudwatch_metric_alarm.lambda_duration : "lambda_${k}_duration" => v.arn
    }
  )
}

# =============================================================================
# LOG INSIGHTS QUERIES
# =============================================================================

output "log_insights_query_arns" {
  description = "Map of CloudWatch Log Insights query ARNs"
  value = {
    api_errors           = aws_cloudwatch_query_definition.api_errors.query_definition_id
    lambda_errors        = aws_cloudwatch_query_definition.lambda_errors.query_definition_id
    performance_analysis = aws_cloudwatch_query_definition.performance_analysis.query_definition_id
  }
}