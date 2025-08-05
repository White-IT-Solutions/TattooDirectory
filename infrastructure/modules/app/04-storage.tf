# Primary DynamoDB Table (Single-table design)
resource "aws_dynamodb_table" "main" {
  name             = "${local.name_prefix}}-main"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "PK"
  range_key        = "SK"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = local.environment_config[var.environment].enable_deletion_protection

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-main-table"
  })

  lifecycle {
    prevent_destroy = local.environment_config[var.environment].enable_deletion_protection
  }
}

# DynamoDB Auto Scaling for main table
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  max_capacity       = var.environment == "prod" ? 100 : 10
  min_capacity       = 1
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  max_capacity       = var.environment == "prod" ? 100 : 10
  min_capacity       = 1
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

# DynamoDB Contributor Insights for performance monitoring
resource "aws_dynamodb_contributor_insights" "main_table" {
  table_name = aws_dynamodb_table.main.name
}

# Denylist DynamoDB Table
resource "aws_dynamodb_table" "denylist" {
  name         = "${local.name_prefix}}-denylist"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "artist_id"

  attribute {
    name = "artist_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = local.environment_config[var.environment].enable_deletion_protection

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-denylist-table"
  })

  lifecycle {
    prevent_destroy = local.environment_config[var.environment].enable_deletion_protection
  }
}

# DynamoDB table to store idempotency keys for API requests
resource "aws_dynamodb_table" "idempotency" {
  name         = "${local.name_prefix}}-idempotency"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "expiry"
    type = "N"
  }

  ttl {
    attribute_name = "expiry"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }


  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-idempotency-table"
  })
}

# OpenSearch Domain
resource "aws_opensearch_domain" "main" {
  domain_name    = "${local.name_prefix}}-search"
  engine_version = "OpenSearch_2.3"

  cluster_config {
    instance_type            = local.environment_config[var.environment].opensearch_instance_type
    instance_count           = local.environment_config[var.environment].opensearch_instance_count
    dedicated_master_enabled = var.environment == "prod" ? false : false
    zone_awareness_enabled   = var.environment == "prod" ? true : false

    dynamic "zone_awareness_config" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        availability_zone_count = 2
      }
    }
  }

  vpc_options {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.opensearch.id]
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = 20
  }

  encrypt_at_rest {
    enabled    = true
    kms_key_id = aws_kms_key.main.arn
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled                        = true
    anonymous_auth_enabled         = false
    internal_user_database_enabled = true

    master_user_options {
      master_user_name     = "admin"
      master_user_password = random_password.opensearch_password.result
    }
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_audit.arn
    log_type                 = "AUDIT_LOGS"
    enabled                  = true
  }

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = { # Restrict access to specific IAM roles
          AWS = [
            aws_iam_role.lambda_api_role.arn,
            aws_iam_role.lambda_sync_role.arn
            # Add other roles that might need access, e.g., an admin user role
          ]
        }
        Action = [
        "es:ESHttpGet",
        "es:ESHttpPost", 
        "es:ESHttpPut" ]
        Resource = "${aws_opensearch_domain.main.arn}/*"
      },
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "es.amazonaws.com"
        },
        "Action": [
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ],
        "Resource": "${aws_cloudwatch_log_group.opensearch_audit.arn}:*",
        "Condition": {
          "ArnLike": { "aws:SourceArn": aws_opensearch_domain.main.arn }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-opensearch"
  })

  lifecycle {
    prevent_destroy = local.environment_config[var.environment].enable_deletion_protection
  }

  depends_on = [aws_iam_service_linked_role.opensearch]
}

# Random password for OpenSearch
resource "random_password" "opensearch_password" {
  length  = 16
  special = true
}

# Store OpenSearch password in Secrets Manager
resource "aws_secretsmanager_secret_version" "opensearch_password" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    opensearch_master_password = random_password.opensearch_password.result
  })
}

# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# DynamoDB to OpenSearch Sync Lambda
resource "aws_lambda_function" "dynamodb_sync" {
  filename      = "dynamodb_sync.zip"
  function_name = "${local.name_prefix}}-dynamodb-sync"
  role          = aws_iam_role.lambda_sync_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 300
  memory_size   = local.environment_config[var.environment].lambda_memory_size

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  source_code_hash = data.archive_file.dynamodb_sync_zip.output_base64sha256

  environment {
    variables = {
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
      OPENSEARCH_INDEX    = "artists"
      APP_SECRETS_ARN     = aws_secretsmanager_secret.app_secrets.arn
      ENVIRONMENT         = var.environment
    }
  }

  tracing_config {
    mode = "Active"
    #Swap to active/passthrough depending on environment variables
    # mode = local.config.enable_advanced_monitoring ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_sync_policy_attachment,
    aws_cloudwatch_log_group.lambda_sync,
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-sync"
  })
}

# Create a placeholder zip file for the sync Lambda function
data "archive_file" "dynamodb_sync_zip" {
  type        = "zip"
  output_path = "${path.module}/dynamodb_sync.zip"
  source {
    content  = <<EOF
const { Client } = require('@opensearch-project/opensearch');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secretsManager = new SecretsManagerClient({});
let openSearchPassword;

const getSecret = async () => {
    if (openSearchPassword) return openSearchPassword;
    const command = new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN });
    const response = await secretsManager.send(command);
    const secret = JSON.parse(response.SecretString);
    openSearchPassword = secret.opensearch_master_password;
    return openSearchPassword;
};

exports.handler = async (event) => {
    console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
    
    const password = await getSecret();
    const client = new Client({
        node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
        auth: {
            username: 'admin',
            password: password
        }
    });
    
    for (const record of event.Records) {
        try {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                if (newImage && newImage.PK && newImage.PK.S.startsWith('ARTIST#')) {
                    const document = {
                        id: newImage.PK.S,
                        name: newImage.name?.S || '',
                        styles: newImage.styles?.SS || [],
                        location: newImage.location?.S || '',
                    };
                    
                    await client.index({
                        index: process.env.OPENSEARCH_INDEX,
                        id: newImage.PK.S,
                        body: document
                    });
                    
                    console.log('Indexed document: ' + newImage.PK.S);
                }
            } else if (record.eventName === 'REMOVE') {
                const oldImage = record.dynamodb.OldImage;
                if (oldImage && oldImage.PK && oldImage.PK.S.startsWith('ARTIST#')) {
                    await client.delete({
                        index: process.env.OPENSEARCH_INDEX,
                        id: oldImage.PK.S
                    });
                    
                    console.log('Deleted document: ' + oldImage.PK.S);
                }
            }
        } catch (error) {
            console.error('Error processing record:', error);
        }
    }
    
    return { statusCode: 200, body: 'Success' };
};
EOF
    filename = "index.js"
  }
}

# Event Source Mapping for DynamoDB Stream
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn                   = aws_dynamodb_table.main.stream_arn
  function_name                      = aws_lambda_function.dynamodb_sync.arn
  starting_position                  = "LATEST"
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY", "REMOVE"]
      })
    }
  }
}

# CloudWatch Log Group for Sync Lambda
resource "aws_cloudwatch_log_group" "lambda_sync" {
  name              = "/aws/lambda/${var.project_name}-dynamodb-sync"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-sync-logs"
  })
}

# CloudWatch Log Group for OpenSearch audit logs
resource "aws_cloudwatch_log_group" "opensearch_audit" {
  name              = "/aws/opensearch/domains/${var.project_name}-search/audit-logs"
  retention_in_days = local.environment_config[var.environment].log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-opensearch-audit-logs"
  })
}

# S3 Bucket for static website hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-frontend"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Block all public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket notification configuration for security monitoring
resource "aws_s3_bucket_notification" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  # This block configures notifications to be sent to an SNS topic.
  topic {
    # A unique identifier for this notification configuration
    id = "s3-object-created-notifications"

    # The ARN of the SNS topic to notify
    topic_arn = aws_sns_topic.s3_events.arn

    # A list of events that should trigger a notification
    events = ["s3:ObjectCreated:*"]

    # Optional: You can filter notifications to specific folders (prefixes) or file types (suffixes)
    # filter_prefix = "uploads/"
    # filter_suffix = ".jpg"
  }
  depends_on = [
    aws_iam_policy.s3_event_notification_policy
  ]
}

# SNS Topic for S3 events
resource "aws_sns_topic" "s3_events" {
  name = "${local.name_prefix}}-s3-events"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-events"
  })
}

# SNS Topic Policy to allow S3 to publish
resource "aws_sns_topic_policy" "s3_events_topic_policy" {
  arn = aws_sns_topic.s3_events.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sns:Publish"
        Resource = aws_sns_topic.s3_events.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.frontend.arn
          }
        }
      }
    ]
  })
}


# S3 bucket logging for audit trail
resource "aws_s3_bucket_logging" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "frontend-access-logs/"
}

# S3 bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.project_name}-access-logs-${random_id.bucket_suffix.hex}"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-access-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket versioning for access logs
resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for access logs
resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket logging for the access logs bucket itself
resource "aws_s3_bucket_logging" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs-self-logs/"
}