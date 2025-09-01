# =============================================================================
# CENTRAL LOGGING MODULE
# =============================================================================
# This module contains centralized logging resources that are deployed into the
# Security Account for security tools that run within the Security Account itself.
# VPC Flow Logs and API Gateway logs now go directly to S3 buckets in the Audit Account.

# =============================================================================
# SECURITY TOOLING LOGS
# =============================================================================

# CloudWatch Log Group for Security Hub and other security tools
resource "aws_cloudwatch_log_group" "security_tools" {
  name              = "/aws/security/${var.context.name_prefix}"
  retention_in_days = var.context.environment == "prod" ? 365 : 90
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name        = "${var.context.name_prefix}-security-tools-logs"
    Account     = "Security"
    LogType     = "SecurityTools"
    Compliance  = "Required"
  })
}

# CloudWatch Log Group for incident response automation
resource "aws_cloudwatch_log_group" "incident_response" {
  name              = "/aws/lambda/incident-response-${var.context.name_prefix}"
  retention_in_days = var.context.environment == "prod" ? 365 : 90
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name        = "${var.context.name_prefix}-incident-response-logs"
    Account     = "Security"
    LogType     = "IncidentResponse"
    Compliance  = "Required"
  })
}

# CloudWatch Log Group for API Gateway logs from the Infrastructure account
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.context.name_prefix}-api"
  retention_in_days = var.context.log_retention_days
  kms_key_id        = var.kms_key_logs_arn

  tags = merge(var.context.common_tags, {
    Name        = "${var.context.name_prefix}-api-gateway-logs"
    Account     = "Security"
    LogType     = "APIGateway"
    Compliance  = "Required"
  })
}

# =============================================================================
# KINESIS DATA FIREHOSE FOR WAF LOGS
# =============================================================================

# IAM Role for Kinesis Firehose to write to S3 in Audit Account
resource "aws_iam_role" "firehose_waf" {
  name = "${var.context.name_prefix}-firehose-waf-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "firehose.amazonaws.com" }
    }]
  })
  tags = merge(var.context.common_tags, { Name = "${var.context.name_prefix}-firehose-waf-role" })
}

# IAM Policy for the Firehose Role
resource "aws_iam_policy" "firehose_waf" {
  name   = "${var.context.name_prefix}-firehose-waf-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:AbortMultipartUpload", "s3:GetBucketLocation", "s3:GetObject", "s3:ListBucket", "s3:ListBucketMultipartUploads", "s3:PutObject"]
        Resource = [var.waf_logs_bucket_arn, "${var.waf_logs_bucket_arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = var.kms_key_log_archive_arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.firehose_waf_errors.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "firehose_waf" {
  role       = aws_iam_role.firehose_waf.name
  policy_arn = aws_iam_policy.firehose_waf.arn
}

# Log group for Firehose delivery errors
resource "aws_cloudwatch_log_group" "firehose_waf_errors" {
  name              = "/aws/kinesisfirehose/${var.context.name_prefix}-waf-delivery-errors"
  retention_in_days = 30
  kms_key_id        = var.kms_key_logs_arn
  tags              = merge(var.context.common_tags, { Name = "${var.context.name_prefix}-firehose-waf-errors" })
}

# Kinesis Data Firehose Delivery Stream for WAF
resource "aws_kinesis_firehose_delivery_stream" "waf_logs" {
  name        = "aws-waf-logs-${var.context.name_prefix}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn           = aws_iam_role.firehose_waf.arn
    bucket_arn         = var.waf_logs_bucket_arn
    kms_key_arn        = var.kms_key_log_archive_arn
    compression_format = "GZIP"
    prefix             = "waf-logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    error_output_prefix = "waf-logs-errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"


    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_waf_errors.name
      log_stream_name = "S3Delivery"
    }
  }

  server_side_encryption {
    enabled   = true
    key_type  = "CUSTOMER_MANAGED_CMK"
    key_arn   = var.kms_key_logs_arn
  }

  tags = merge(var.context.common_tags, {
    Name = "aws-waf-logs-${var.context.name_prefix}"
  })
}