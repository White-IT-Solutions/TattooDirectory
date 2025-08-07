# AWS Config Conformance Pack for additional compliance standards

# Conformance Pack for Security Best Practices
resource "aws_config_conformance_pack" "security_best_practices" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${local.name_prefix}}-security-best-practices"

  template_body = yamlencode({
    Parameters = {
      S3BucketPublicAccessProhibitedParamBucketName = {
        Default = ""
        Type    = "String"
      }
    }
    Resources = {
      S3BucketPublicAccessProhibited = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-s3-public-access"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      DynamoDbTableEncryptionEnabled = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-dynamodb-encryption"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      LambdaFunctionPublicAccessProhibited = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-lambda-public-access"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      CloudFrontViewerPolicyHttps = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-cloudfront-https"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "CLOUDFRONT_VIEWER_POLICY_HTTPS"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      VpcDefaultSecurityGroupClosed = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-vpc-default-sg"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "VPC_DEFAULT_SECURITY_GROUP_CLOSED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
    }
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# Conformance Pack for Operational Best Practices
resource "aws_config_conformance_pack" "operational_best_practices" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${local.name_prefix}}-operational-best-practices"

  template_body = yamlencode({
    Resources = {
      ApiGwExecutionLoggingEnabled = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-api-gw-logging"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "API_GW_EXECUTION_LOGGING_ENABLED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      VpcFlowLogsEnabled = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-vpc-flow-logs"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "VPC_FLOW_LOGS_ENABLED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      DynamoDbPitrEnabled = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-dynamodb-pitr"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "DYNAMODB_PITR_ENABLED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      S3BucketServerSideEncryptionEnabled = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-s3-encryption"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
      KmsCmkNotScheduledForDeletion = {
        Properties = {
          ConfigRuleName = "${local.name_prefix}}-conformance-kms-not-deleted"
          Source = {
            Owner            = "AWS"
            SourceIdentifier = "KMS_CMK_NOT_SCHEDULED_FOR_DELETION"
          }
        }
        Type = "AWS::Config::ConfigRule"
      }
    }
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Organization Conformance Pack (if using AWS Organizations)
# Uncomment if you want to apply these rules across multiple accounts
# resource "aws_config_organization_conformance_pack" "security_best_practices" {
#   count = var.environment == "prod" ? 1 : 0
#   name  = "${local.name_prefix}}-org-security-best-practices"
#
#   template_body = aws_config_conformance_pack.security_best_practices[0].template_body
#
#   depends_on = [aws_config_configuration_recorder.main]
# }