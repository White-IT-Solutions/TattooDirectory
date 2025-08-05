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
  runtime       = "nodejs18.x"
  timeout       = 60
  memory_size   = 256

  source_code_hash = data.archive_file.config_compliance_processor_zip[0].output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.config_notifications.arn
      PROJECT_NAME  = var.project_name
    }
  }

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
  output_path = "${path.module}/config_compliance_processor.zip"
  source {
    content = <<EOF
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Config Compliance Event:', JSON.stringify(event, null, 2));
    
    try {
        const detail = event.detail;

        // Process only NON_COMPLIANT events for critical rules
        // Add checks to ensure the detail object and its properties exist
        if (detail && detail.newEvaluationResult && detail.newEvaluationResult.complianceType === 'NON_COMPLIANT') {
            const criticalRules = [
                's3-bucket-public-access-prohibited',
                'lambda-function-public-access-prohibited',
                'dynamodb-table-encryption-enabled'
            ];
            
            const ruleName = detail.configRuleName.toLowerCase();
            const isCritical = criticalRules.some(rule => ruleName.includes(rule));
            
            if (isCritical) {
                const alertMessage = {
                    severity: 'HIGH',
                    rule: detail.configRuleName,
                    resource: detail.resourceId,
                    resourceType: detail.resourceType,
                    complianceType: detail.newEvaluationResult.complianceType,
                    timestamp: new Date().toISOString(),
                    account: event.account, // Get account from the top-level event
                    region: event.region    // Get region from the top-level event
                };
                
                await sns.publish({
                    TopicArn: process.env.SNS_TOPIC_ARN,
                    Subject: `CRITICAL: Config Compliance Violation - ${process.env.PROJECT_NAME}`,
                    Message: JSON.stringify(alertMessage, null, 2)
                }).promise();
                
                console.log('Critical compliance violation alert sent:', alertMessage);
            }
        }
        
        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Error processing Config compliance event:', error);
        throw error;
    }
};
EOF
    filename = "index.js"
  }
}

# CloudWatch Log Group for Config Compliance Processor
resource "aws_cloudwatch_log_group" "config_compliance_processor" {
  count = local.config.enable_advanced_monitoring ? 1 : 0

  name              = "/aws/lambda/${var.project_name}-config-compliance-processor"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-config-compliance-processor-logs"
  })
}

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