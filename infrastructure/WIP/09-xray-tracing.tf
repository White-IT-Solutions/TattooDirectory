# X-Ray policy for Lambda functions
resource "aws_iam_policy" "lambda_xray_policy" {
  name        = "${var.project_name}-lambda-xray-policy"
  description = "Policy for Lambda X-Ray tracing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_xray_policy_attachment" {
  role       = aws_iam_role.lambda_api_role.name
  policy_arn = aws_iam_policy.lambda_xray_policy.arn
}

# X-Ray sampling rule for cost control
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${var.project_name}-sampling-rule"
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

  tags = {
    Name = "${var.project_name}-xray-sampling-rule"
  }
}