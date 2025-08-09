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
    prevent_destroy = true
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
    Name = "${local.name_prefix}-denylist-table"
  })

  lifecycle {
    prevent_destroy = true
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

  deletion_protection_enabled = local.environment_config[var.environment].enable_deletion_protection

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-idempotency-table"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# OpenSearch Domain
# infracost:ignore-infracost-recommendations
resource "aws_opensearch_domain" "main" {
  # checkov:skip=CKV2_AWS_59: MVP Environment, would scale up for production
  # checkov:skip=CKV_AWS_318: MVP Environment, would scale up for production
  domain_name    = "${local.name_prefix}}-search"
  engine_version = "OpenSearch_2.3"

  cluster_config {
    instance_type  = local.environment_config[var.environment].opensearch_instance_type
    instance_count = local.environment_config[var.environment].opensearch_instance_count

    # Conditionally configure dedicated master nodes. These attributes are set to null if not defined in the environment config.
    dedicated_master_enabled = local.environment_config[var.environment].opensearch_master_instance_count != null
    dedicated_master_type    = local.environment_config[var.environment].opensearch_master_instance_type
    dedicated_master_count   = local.environment_config[var.environment].opensearch_master_instance_count

    zone_awareness_enabled = var.environment == "prod" ? true : false

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
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-lambda-api-role",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-lambda-sync-role"
            # Add other roles that might need access, e.g., an admin user role
          ]
        }
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPost",
        "es:ESHttpPut"]
        Resource = "arn:aws:es:${var.aws_region}:${data.aws_caller_identity.current.account_id}:domain/${local.name_prefix}-search/*"
      },
      {
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "es.amazonaws.com"
        },
        "Action" : [
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ],
        "Resource" : "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/opensearch/domains/${local.name_prefix}-search-audit:*",
        "Condition" : {
          "ArnLike" : { "aws:SourceArn" : "arn:aws:es:${var.aws_region}:${data.aws_caller_identity.current.account_id}:domain/${local.name_prefix}-search" }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-opensearch"
  })

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [aws_iam_service_linked_role.opensearch]
}

# Random password for OpenSearch
resource "random_password" "opensearch_password" {
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store OpenSearch password in Secrets Manager
resource "aws_secretsmanager_secret_version" "opensearch_password" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    opensearch_master_password = random_password.opensearch_password.result
  })
}



# DynamoDB to OpenSearch Sync Lambda
resource "aws_lambda_function" "dynamodb_sync" {
  # checkov:skip=CKV_AWS_116: Used destination_config on event source mapping as stream-based.
  filename      = data.archive_file.dynamodb_sync_zip.output_path
  function_name = "${local.name_prefix}}-dynamodb-sync"
  role          = aws_iam_role.lambda_sync_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]    # Switch to Graviton2 for better price/performance
  timeout       = 300
  memory_size   = local.environment_config[var.environment].lambda_memory_size

  # Security: Configure concurrent execution limit
  reserved_concurrent_executions = var.environment == "prod" ? 50 : 10

  # Security: Code signing configuration
  code_signing_config_arn = var.environment == "prod" ? aws_lambda_code_signing_config.main[0].arn : null

  vpc_config {
    subnet_ids         = values(aws_subnet.private)[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  source_code_hash = data.archive_file.dynamodb_sync_zip.output_base64sha256

  environment {
    variables = {
      OPENSEARCH_ENDPOINT = "${local.name_prefix}-search.${var.aws_region}.es.amazonaws.com"
      OPENSEARCH_INDEX    = "artists"
      APP_SECRETS_ARN     = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}-secrets"
      ENVIRONMENT         = var.environment
    }
  }

  # Security: Encrypt environment variables
  kms_key_arn = aws_kms_key.main.arn

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
  source_dir  = "${path.module}/src/lambda/dynamodb_sync"
  output_path = "${path.module}/dist/dynamodb_sync.zip"
}

# Dead Letter Queue for Lambda Sync function
resource "aws_sqs_queue" "lambda_sync_dlq" {
  name                      = "${local.name_prefix}-lambda-sync-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sync-dlq"
  })
}

# Code Signing Config for Lambda (production only)
resource "aws_lambda_code_signing_config" "main" {
  count = var.environment == "prod" ? 1 : 0

  allowed_publishers {
    signing_profile_version_arns = [aws_signer_signing_profile.lambda[0].arn]
  }

  policies {
    untrusted_artifact_on_deployment = "Warn"
  }

  description = "Code signing config for ${local.name_prefix} Lambda functions"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-code-signing-config"
  })
}

# Signer Signing Profile (production only)
resource "aws_signer_signing_profile" "lambda" {
  count       = var.environment == "prod" ? 1 : 0
  platform_id = "AWSLambda-SHA384-ECDSA"
  name        = "${local.name_prefix}-lambda-signing-profile"
  name_prefix = null

  signature_validity_period {
    value = 5
    type  = "YEARS"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-signing-profile"
  })
}

# Event Source Mapping for DynamoDB Stream
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn                   = aws_dynamodb_table.main.stream_arn
  function_name                      = aws_lambda_function.dynamodb_sync.arn
  starting_position                  = "LATEST"
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  destination_config {
    on_failure {
      destination_arn = "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-lambda-sync-dlq"
    }
  }

  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY", "REMOVE"]
      })
    }
  }
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

    # Apply this rule to all objects in the bucket.
    filter {}

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
  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# SNS Topic for S3 events
resource "aws_sns_topic" "s3_events" {
  name              = "${local.name_prefix}}-s3-events"
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
        Action   = "sns:Publish"
        Resource = aws_sns_topic.s3_events.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = concat(
              [
                aws_s3_bucket.frontend.arn,
                aws_s3_bucket.frontend_backup.arn,
                aws_s3_bucket.access_logs.arn
              ],
              var.environment == "prod" ? [
                aws_s3_bucket.frontend_replica[0].arn,
                aws_s3_bucket.frontend_backup_replica[0].arn,
                aws_s3_bucket.access_logs_replica[0].arn
              ] : []
            )
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

# Block all public access to the access logs bucket
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

# S3 bucket notification configuration for access logs bucket
resource "aws_s3_bucket_notification" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  topic {
    id        = "s3-access-logs-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# S3 Backup Bucket for CloudFront failover
resource "aws_s3_bucket" "frontend_backup" {
  bucket = "${var.project_name}-frontend-backup-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-frontend-backup"
  })
}

# Block all public access to the backup S3 bucket
resource "aws_s3_bucket_public_access_block" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket versioning for backup
resource "aws_s3_bucket_versioning" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for backup
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket lifecycle configuration for backup
resource "aws_s3_bucket_lifecycle_configuration" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket notification configuration for backup bucket
resource "aws_s3_bucket_notification" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  topic {
    id        = "s3-backup-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# S3 bucket logging for backup bucket
resource "aws_s3_bucket_logging" "frontend_backup" {
  bucket = aws_s3_bucket.frontend_backup.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "frontend-backup-access-logs/"
}

# Cross-region replication for frontend bucket (production only)
resource "aws_s3_bucket_replication_configuration" "frontend" {
  count  = var.environment == "prod" ? 1 : 0
  role   = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.frontend.id

  rule {
    id     = "replicate-to-backup-region"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.frontend_replica[0].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.frontend]
}

# Cross-region replication for backup bucket (production only)
resource "aws_s3_bucket_replication_configuration" "frontend_backup" {
  count  = var.environment == "prod" ? 1 : 0
  role   = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.frontend_backup.id

  rule {
    id     = "replicate-backup-to-backup-region"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.frontend_backup_replica[0].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.frontend_backup]
}

# Cross-region replication for access logs bucket (production only)
resource "aws_s3_bucket_replication_configuration" "access_logs" {
  count  = var.environment == "prod" ? 1 : 0
  role   = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "replicate-logs-to-backup-region"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.access_logs_replica[0].arn
      storage_class = "GLACIER"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.access_logs]
}

# Cross-region replication resources (production only)

# KMS Key for replica region (production only)
resource "aws_kms_key" "replica" {
  count                   = var.environment == "prod" ? 1 : 0
  provider                = aws.replica
  description             = "KMS key for ${var.project_name} replica region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-replica-kms-key"
  })
}

resource "aws_kms_alias" "replica" {
  count         = var.environment == "prod" ? 1 : 0
  provider      = aws.replica
  name          = "alias/${var.project_name}-replica-key"
  target_key_id = aws_kms_key.replica[0].key_id
}

# Replica S3 buckets (production only)
resource "aws_s3_bucket" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = "${var.project_name}-frontend-replica-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-replica"
  })
}

resource "aws_s3_bucket" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = "${var.project_name}-frontend-backup-replica-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-backup-replica"
  })
}

resource "aws_s3_bucket" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = "${var.project_name}-access-logs-replica-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-access-logs-replica"
  })
}

# Configure versioning for replica buckets
resource "aws_s3_bucket_versioning" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure encryption for replica buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica[0].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica[0].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica[0].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block public access for replica buckets
resource "aws_s3_bucket_public_access_block" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket logging for replica buckets
resource "aws_s3_bucket_logging" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id

  target_bucket = aws_s3_bucket.access_logs_replica[0].id
  target_prefix = "frontend-replica-access-logs/"
}

resource "aws_s3_bucket_public_access_block" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket logging for backup replica bucket
resource "aws_s3_bucket_logging" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id

  target_bucket = aws_s3_bucket.access_logs_replica[0].id
  target_prefix = "frontend-backup-replica-access-logs/"
}

resource "aws_s3_bucket_public_access_block" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket logging for access logs replica bucket (self-logging)
resource "aws_s3_bucket_logging" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id

  target_bucket = aws_s3_bucket.access_logs_replica[0].id
  target_prefix = "access-logs-replica-self-logs/"
}

# S3 bucket notification configuration for frontend replica bucket
resource "aws_s3_bucket_notification" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id

  topic {
    id        = "s3-frontend-replica-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# S3 bucket notification configuration for frontend backup replica bucket
resource "aws_s3_bucket_notification" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id

  topic {
    id        = "s3-frontend-backup-replica-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# S3 bucket notification configuration for access logs replica bucket
resource "aws_s3_bucket_notification" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id

  topic {
    id        = "s3-access-logs-replica-object-created-notifications"
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sns_topic_policy.s3_events_topic_policy]
}

# Add lifecycle configuration for access logs bucket
resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "access_logs_lifecycle"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    # Transition objects to a cheaper storage tier after 30 days.
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.environment == "prod" ? 2555 : 90 # 7 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Add lifecycle configuration for frontend_backup_replica
resource "aws_s3_bucket_lifecycle_configuration" "frontend_backup_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_backup_replica[0].id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    expiration {
      days = var.environment == "prod" ? 2555 : 90 # 7 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Add lifecycle configuration for frontend_replica
resource "aws_s3_bucket_lifecycle_configuration" "frontend_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.frontend_replica[0].id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    expiration {
      days = var.environment == "prod" ? 2555 : 90 # 7 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Add lifecycle configuration for access_logs_replica
resource "aws_s3_bucket_lifecycle_configuration" "access_logs_replica" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.access_logs_replica[0].id

  rule {
    id     = "access_logs_lifecycle"
    status = "Enabled"

    # Apply this rule to all objects in the bucket.
    filter {}

    expiration {
      days = var.environment == "prod" ? 2555 : 90 # 7 years for prod, 90 days for dev
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}