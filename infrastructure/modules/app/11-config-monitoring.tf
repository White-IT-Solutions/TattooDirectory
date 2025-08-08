# CloudWatch monitoring and alerting for AWS Config compliance

# CloudWatch Metric Filters for Config Events
resource "aws_cloudwatch_log_metric_filter" "config_non_compliant_resources" {
  name           = "${local.name_prefix}}-config-non-compliant-resources"
  log_group_name = "/aws/config/configuration-history"
  pattern        = "[timestamp, request_id, event_type=\"ConfigurationItemChangeNotification\", ..., compliance_type=\"NON_COMPLIANT\"]"

  metric_transformation {
    name      = "ConfigNonCompliantResources"
    namespace = "${var.project_name}/Config"
    value     = "1"
  }
}

# CloudWatch Alarms for Config Compliance
resource "aws_cloudwatch_metric_alarm" "config_compliance_alarm" {
  count = var.notification_email != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}}-config-compliance-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ComplianceByConfigRule"
  namespace           = "AWS/Config"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors AWS Config rule compliance"
  alarm_actions       = [aws_sns_topic.config_notifications.arn]
  ok_actions          = [aws_sns_topic.config_notifications.arn]

  dimensions = {
    ConfigRuleName = aws_config_config_rule.s3_bucket_public_access_prohibited.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-compliance-alarm"
  })
}

# CloudWatch Alarm for Critical Security Rules
resource "aws_cloudwatch_metric_alarm" "critical_security_compliance" {
  count = var.notification_email != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}}-critical-security-compliance"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ComplianceByConfigRule"
  namespace           = "AWS/Config"
  period              = "300"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Critical security compliance violation detected"
  alarm_actions       = [aws_sns_topic.config_notifications.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    ConfigRuleName = aws_config_config_rule.s3_bucket_public_access_prohibited.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-critical-security-alarm"
  })
}

# EventBridge Rule for Config Compliance Changes
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "${local.name_prefix}}-config-compliance-change"
  description = "Capture Config compliance state changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-compliance-event-rule"
  })
}

# EventBridge Target for Config Compliance Changes
resource "aws_cloudwatch_event_target" "config_compliance_sns" {
  rule      = aws_cloudwatch_event_rule.config_compliance_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.config_notifications.arn

  input_transformer {
    input_paths = {
      compliance = "$.detail.newEvaluationResult.complianceType"
      resource   = "$.detail.resourceId"
      rule       = "$.detail.configRuleName"
      account    = "$.account"
      region     = "$.region"
    }
    input_template = jsonencode({
      message = "Config Rule Compliance Change"
      details = {
        rule_name       = "<rule>"
        resource_id     = "<resource>"
        compliance_type = "<compliance>"
        account_id      = "<account>"
        region          = "<region>"
        timestamp       = "$${aws.events.event.ingestion-time}"
      }
    })
  }
}

# Lambda function for custom Config compliance processing
resource "aws_lambda_function" "config_compliance_processor" {
  count = local.config.enable_advanced_monitoring ? 1 : 0

  filename      = data.archive_file.config_compliance_processor_zip[0].output_path
  function_name = "${local.name_prefix}}-config-compliance-processor"
  role          = aws_iam_role.config_compliance_processor[0].arn
  handler       = "index.handler"
  runtime       = "nodejs20.x" # Updated to latest LTS
  architectures = ["arm64"]    # Switch to Graviton2 for better price/performance
  timeout       = 60
  memory_size   = 256
  code_signing_config_arn = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  source_code_hash = data.archive_file.config_compliance_processor_zip[0].output_base64sha256

  dead_letter_config {
    target_arn = aws_sqs_queue.config_compliance_dlq[0].arn
  }
  reserved_concurrent_executions = 5

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.config_notifications.arn
      PROJECT_NAME  = var.project_name
    }
  }

  # Security: Encrypt environment variables
  kms_key_arn = aws_kms_key.main.arn

  depends_on = [
    aws_iam_role_policy_attachment.config_compliance_processor[0],
    aws_cloudwatch_log_group.config_compliance_processor[0],
  ]

  tracing_config {
    mode = "Active"
    #Swap to active/passthrough depending on environment variables
    #mode = local.config.enable_advanced_monitoring ? "Active" : "PassThrough"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-compliance-processor"
  })
}

# Lambda function code for Config compliance processing
data "archive_file" "config_compliance_processor_zip" {
  count = local.config.enable_advanced_monitoring ? 1 : 0
  type        = "zip"
  source_dir  = "${path.module}/src/lambda/config_compliance_processor"
  output_path = "${path.module}/dist/config_compliance_processor.zip"
}

# CloudWatch Log Group for Config Compliance Processor is defined in 06-observability.tf

# EventBridge Target for Lambda Processing
resource "aws_cloudwatch_event_target" "config_compliance_lambda" {
  count = local.config.enable_advanced_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.config_compliance_change.name
  target_id = "SendToLambda"
  arn       = aws_lambda_function.config_compliance_processor[0].arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "config_compliance_eventbridge" {
  count = local.config.enable_advanced_monitoring ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.config_compliance_processor[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}

# Dead letter queue for Config Compliance Processor failures
resource "aws_sqs_queue" "config_compliance_dlq" {
  count = local.config.enable_advanced_monitoring ? 1 : 0

  name                      = "${local.name_prefix}-config-compliance-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-config-compliance-dlq"
  })
}