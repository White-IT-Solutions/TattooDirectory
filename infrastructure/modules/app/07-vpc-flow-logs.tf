# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/${var.project_name}-flow-logs"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-logs"
  })
}

# VPC Flow Log
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-log"
  })
}

# CloudWatch Metric Filter for suspicious activity
resource "aws_cloudwatch_log_metric_filter" "rejected_connections" {
  name           = "${local.name_prefix}}-rejected-connections"
  log_group_name = aws_cloudwatch_log_group.vpc_flow_log.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=\"REJECT\", flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

# Alarm for high number of rejected connections
resource "aws_cloudwatch_metric_alarm" "high_rejected_connections" {
  alarm_name          = "${local.name_prefix}}-high-rejected-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RejectedConnections"
  namespace           = "${var.project_name}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "High number of rejected network connections detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-high-rejected-connections-alarm"
  })
}

# VPC Flow Logs for network monitoring and compliance

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.project_name}"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-logs"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-flow-logs"
  })
}

# Optional: Flow logs for individual subnets (for more granular monitoring)
resource "aws_flow_log" "private_subnet_flow_logs" {
  for_each = var.environment == "prod" ? aws_subnet.private : {}
  
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  subnet_id       = each.value.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-private-subnet-${each.key}-flow-logs"
  })
}