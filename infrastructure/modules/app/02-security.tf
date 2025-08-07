# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}-kms-key"
    DataClassification = "Confidential"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# KMS Key specifically for CloudWatch Logs
resource "aws_kms_key" "logs" {
  description             = "KMS key for ${var.project_name} CloudWatch Logs encryption"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}-logs-kms-key"
    DataClassification = "Confidential"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${var.project_name}-logs-key"
  target_key_id = aws_kms_key.logs.key_id
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_secrets" {
  # checkov:skip=CKV2_AWS_57: Secrets Manager rotation is configured in 14-secrets-manager-rotation.tf
  name                    = "${local.name_prefix}}-secrets"
  description             = "Application secrets for ${var.project_name}"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}}-secrets"
    DataClassification = "Confidential"
  })
}

# Security Groups
resource "aws_security_group" "opensearch" {
  # checkov:skip=CKV2_AWS_5: Assigned in 04-storage
  name        = "${local.name_prefix}-opensearch-sg"
  description = "OpenSearch security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from Lambda functions"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-opensearch-sg"
  })
}

resource "aws_security_group" "fargate" {
  # checkov:skip=CKV2_AWS_5: Assigned in 05-data-aggregation
  name        = "${local.name_prefix}-fargate-sg"
  description = "Fargate security group"
  vpc_id      = aws_vpc.main.id

  # Allow outbound to VPC endpoints for SQS, ECR, Logs etc.
  egress {
    description     = "Egress to VPC Endpoints"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc_endpoints.id]
  }

  egress {
    description = "Egress to Internet for web scraping (HTTPS)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for web scraping
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Egress to Internet for web scraping (HTTP)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for web scraping
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-fargate-sg"
  })
}

resource "aws_security_group" "lambda" {
  # checkov:skip=CKV2_AWS_5: Assigned in 03-compute, 04-storage, 05-data-aggregation
  name        = "${local.name_prefix}-lambda-sg"
  description = "Lambda security group"
  vpc_id      = aws_vpc.main.id

  # Egress to OpenSearch
  egress {
    description     = "Egress to OpenSearch"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.opensearch.id]
  }

  # Egress to VPC Endpoints (SecretsManager, SQS, etc.)
  egress {
    description     = "Egress to VPC Endpoints"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc_endpoints.id]
  }

  # Egress to Internet for services without a VPC endpoint (e.g., EC2 API, SNS)
  egress {
    description = "Egress to Internet for AWS APIs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    #tfsec:ignore:aws-ec2-no-public-egress-sgr - Required for AWS services without a VPCe
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-lambda-sg"
  })
}

# VPC Endpoints to reduce NAT Gateway costs and improve security
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = values(aws_route_table.private)[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = values(aws_route_table.private)[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-s3-endpoint"
  })
}

# Interface endpoints for other services
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-states-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-logs-endpoint"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  # checkov:skip=CKV2_AWS_5: Assigned in 02-security
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "VPC Endpoints security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from Lambda and Fargate"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id, aws_security_group.fargate.id]
  }

  # No egress is needed as the endpoints are targets, not sources.
  # The stateful nature of security groups allows return traffic.

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-vpc-endpoints-sg"
  })
}

# AWS GuardDuty for intelligent threat detection

resource "aws_guardduty_detector" "main" {
  # checkov:skip=CKV2_AWS_3: GuardDuty Config is correct.
  enable = true
}

resource "aws_guardduty_organization_admin_account" "main" {
  admin_account_id = data.aws_caller_identity.current.account_id

  # This resource must be created from the AWS Organization's master account.
  # It designates the current account as the GuardDuty delegated administrator.
  depends_on = [aws_guardduty_detector.main]
}

resource "aws_guardduty_organisation_configuration" "main" {
  auto_enable_organization_members = "ALL"

  # This detector must exist in the delegated administrator account.
  detector_id = aws_guardduty_detector.main.id

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Not using EKS in this architecture
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}}-guardduty-detector"
  })

  # Ensure the admin account is designated before configuring the organization.
  depends_on = [aws_guardduty_organization_admin_account.main]
}
