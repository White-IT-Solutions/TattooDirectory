# Primary DynamoDB Table (Single-table design)
resource "aws_dynamodb_table" "main" {
  name             = "${var.project_name}-main"
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

  tags = {
    Name = "${var.project_name}-main-table"
  }

  lifecycle {
    prevent_destroy = local.environment_config[var.environment].enable_deletion_protection
  }
}

# Denylist DynamoDB Table
resource "aws_dynamodb_table" "denylist" {
  name         = "${var.project_name}-denylist"
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

  tags = {
    Name = "${var.project_name}-denylist-table"
  }

  lifecycle {
    prevent_destroy = local.environment_config[var.environment].enable_deletion_protection
  }
}

# OpenSearch Domain
resource "aws_opensearch_domain" "main" {
  domain_name    = "${var.project_name}-search"
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

  tags = {
    Name = "${var.project_name}-opensearch"
  }

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

# IAM Service Linked Role for OpenSearch
resource "aws_iam_service_linked_role" "opensearch" {
  aws_service_name = "es.amazonaws.com"
  description      = "Service linked role for OpenSearch"
}

# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# DynamoDB to OpenSearch Sync Lambda
resource "aws_lambda_function" "dynamodb_sync" {
  filename      = "dynamodb_sync.zip"
  function_name = "${var.project_name}-dynamodb-sync"
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

  depends_on = [
    aws_iam_role_policy_attachment.lambda_sync_policy_attachment,
    aws_cloudwatch_log_group.lambda_sync,
  ]

  tags = {
    Name = "${var.project_name}-dynamodb-sync"
  }
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
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-lambda-sync-logs"
  }
}