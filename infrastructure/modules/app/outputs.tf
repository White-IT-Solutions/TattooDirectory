#=============================================================================
# Networking
#=============================================================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = values(aws_subnet.private)[*].id
}

output "private_subnets" {
  description = "Map of private subnets with their details"
  value = {
    for k, v in aws_subnet.private : k => {
      id                = v.id
      arn               = v.arn
      cidr_block        = v.cidr_block
      availability_zone = v.availability_zone
    }
  }
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = values(aws_subnet.public)[*].id
}

output "public_subnets" {
  description = "Map of public subnets with their details"
  value = {
    for k, v in aws_subnet.public : k => {
      id                = v.id
      arn               = v.arn
      cidr_block        = v.cidr_block
      availability_zone = v.availability_zone
    }
  }
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = { for k, v in aws_nat_gateway.nat : k => v.id }
}

output "nat_gateways" {
  description = "Map of NAT Gateways with their details"
  value = {
    for k, v in aws_nat_gateway.nat : k => {
      id            = v.id
      allocation_id = v.allocation_id
      subnet_id     = v.subnet_id
      public_ip     = v.public_ip
      private_ip    = v.private_ip
    }
  }
}

output "elastic_ips" {
  description = "Map of Elastic IPs for NAT Gateways"
  value = {
    for k, v in aws_eip.nat : k => {
      id            = v.id
      allocation_id = v.allocation_id
      public_ip     = v.public_ip
    }
  }
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "route_table_ids" {
  description = "IDs of route tables"
  value = {
    public  = aws_route_table.public.id
    private = { for k, v in aws_route_table.private : k => v.id }
  }
}

output "network_acls" {
  description = "Network ACL details"
  value = {
    public = {
      id  = aws_network_acl.public.id
      arn = aws_network_acl.public.arn
    }
    private = {
      id  = aws_network_acl.private.id
      arn = aws_network_acl.private.arn
    }
  }
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc_flow_logs.id
}
#=============================================================================
# Application
#=============================================================================
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_url" {
  description = "Full URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}
#=============================================================================
# Storage
#=============================================================================
output "s3_buckets" {
  description = "Map of all S3 buckets with their details"
  value = merge(
    {
      frontend = {
        id                          = aws_s3_bucket.frontend.id
        arn                         = aws_s3_bucket.frontend.arn
        bucket                      = aws_s3_bucket.frontend.bucket
        bucket_domain_name          = aws_s3_bucket.frontend.bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
        region                      = aws_s3_bucket.frontend.region
      }
      frontend_backup = {
        id                          = aws_s3_bucket.frontend_backup.id
        arn                         = aws_s3_bucket.frontend_backup.arn
        bucket                      = aws_s3_bucket.frontend_backup.bucket
        bucket_domain_name          = aws_s3_bucket.frontend_backup.bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.frontend_backup.bucket_regional_domain_name
        region                      = aws_s3_bucket.frontend_backup.region
      }
      access_logs = {
        id                          = aws_s3_bucket.access_logs.id
        arn                         = aws_s3_bucket.access_logs.arn
        bucket                      = aws_s3_bucket.access_logs.bucket
        bucket_domain_name          = aws_s3_bucket.access_logs.bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.access_logs.bucket_regional_domain_name
        region                      = aws_s3_bucket.access_logs.region
      }
      config = {
        id                          = aws_s3_bucket.config.id
        arn                         = aws_s3_bucket.config.arn
        bucket                      = aws_s3_bucket.config.bucket
        bucket_domain_name          = aws_s3_bucket.config.bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.config.bucket_regional_domain_name
        region                      = aws_s3_bucket.config.region
      }
      cloudtrail = {
        id                          = aws_s3_bucket.cloudtrail.id
        arn                         = aws_s3_bucket.cloudtrail.arn
        bucket                      = aws_s3_bucket.cloudtrail.bucket
        bucket_domain_name          = aws_s3_bucket.cloudtrail.bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.cloudtrail.bucket_regional_domain_name
        region                      = aws_s3_bucket.cloudtrail.region
      }
    },
    #=============================================================================
    # Conditional replica buckets (production only)
    #=============================================================================
    var.environment == "prod" ? {
      frontend_replica = {
        id                          = aws_s3_bucket.frontend_replica[0].id
        arn                         = aws_s3_bucket.frontend_replica[0].arn
        bucket                      = aws_s3_bucket.frontend_replica[0].bucket
        bucket_domain_name          = aws_s3_bucket.frontend_replica[0].bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.frontend_replica[0].bucket_regional_domain_name
        region                      = aws_s3_bucket.frontend_replica[0].region
      }
      frontend_backup_replica = {
        id                          = aws_s3_bucket.frontend_backup_replica[0].id
        arn                         = aws_s3_bucket.frontend_backup_replica[0].arn
        bucket                      = aws_s3_bucket.frontend_backup_replica[0].bucket
        bucket_domain_name          = aws_s3_bucket.frontend_backup_replica[0].bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.frontend_backup_replica[0].bucket_regional_domain_name
        region                      = aws_s3_bucket.frontend_backup_replica[0].region
      }
      access_logs_replica = {
        id                          = aws_s3_bucket.access_logs_replica[0].id
        arn                         = aws_s3_bucket.access_logs_replica[0].arn
        bucket                      = aws_s3_bucket.access_logs_replica[0].bucket
        bucket_domain_name          = aws_s3_bucket.access_logs_replica[0].bucket_domain_name
        bucket_regional_domain_name = aws_s3_bucket.access_logs_replica[0].bucket_regional_domain_name
        region                      = aws_s3_bucket.access_logs_replica[0].region
      }
      config_replica = {
        id                          = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].id : null
        arn                         = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].arn : null
        bucket                      = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].bucket : null
        bucket_domain_name          = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].bucket_domain_name : null
        bucket_regional_domain_name = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].bucket_regional_domain_name : null
        region                      = var.enable_cross_region_replication ? aws_s3_bucket.config_replica[0].region : null
      }
      cloudtrail_replica = {
        id                          = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].id : null
        arn                         = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].arn : null
        bucket                      = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].bucket : null
        bucket_domain_name          = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].bucket_domain_name : null
        bucket_regional_domain_name = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].bucket_regional_domain_name : null
        region                      = var.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_replica[0].region : null
      }
    } : {}
  )
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket
}

output "s3_bucket_backup_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.frontend_backup.bucket
}

output "s3_access_logs_bucket_name" {
  description = "Name of the S3 access logs bucket"
  value       = aws_s3_bucket.access_logs.bucket
}

output "dynamodb_tables" {
  description = "Map of all DynamoDB tables with their details"
  value = {
    main = {
      id               = aws_dynamodb_table.main.id
      arn              = aws_dynamodb_table.main.arn
      name             = aws_dynamodb_table.main.name
      hash_key         = aws_dynamodb_table.main.hash_key
      range_key        = aws_dynamodb_table.main.range_key
      billing_mode     = aws_dynamodb_table.main.billing_mode
      stream_arn       = aws_dynamodb_table.main.stream_arn
      stream_enabled   = aws_dynamodb_table.main.stream_enabled
      stream_view_type = aws_dynamodb_table.main.stream_view_type
    }
    denylist = {
      id           = aws_dynamodb_table.denylist.id
      arn          = aws_dynamodb_table.denylist.arn
      name         = aws_dynamodb_table.denylist.name
      hash_key     = aws_dynamodb_table.denylist.hash_key
      billing_mode = aws_dynamodb_table.denylist.billing_mode
    }
    idempotency = {
      id            = aws_dynamodb_table.idempotency.id
      arn           = aws_dynamodb_table.idempotency.arn
      name          = aws_dynamodb_table.idempotency.name
      hash_key      = aws_dynamodb_table.idempotency.hash_key
      billing_mode  = aws_dynamodb_table.idempotency.billing_mode
      ttl_enabled   = true
      ttl_attribute = "expiry"
    }
  }
}

output "dynamodb_table_name" {
  description = "Name of the main DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_denylist_table_name" {
  description = "Name of the DynamoDB denylist table"
  value       = aws_dynamodb_table.denylist.name
}

output "dynamodb_idempotency_table_name" {
  description = "Name of the DynamoDB idempotency table"
  value       = aws_dynamodb_table.idempotency.name
}

output "opensearch_endpoint" {
  description = "Endpoint of the OpenSearch domain"
  value       = aws_opensearch_domain.main.endpoint
  sensitive   = true
}

output "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_name
}

output "opensearch_details" {
  description = "OpenSearch domain details"
  value = {
    id              = aws_opensearch_domain.main.id
    arn             = aws_opensearch_domain.main.arn
    domain_name     = aws_opensearch_domain.main.domain_name
    endpoint        = aws_opensearch_domain.main.endpoint
    engine_version  = aws_opensearch_domain.main.engine_version
  }
  sensitive = true
}
#=============================================================================
# Compute
#=============================================================================
output "ecr_repository_url" {
  description = "URL of the ECR repository for the scraper"
  value       = aws_ecr_repository.scraper.repository_url
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    api_handler      = aws_lambda_function.api_handler.function_name
    dynamodb_sync    = aws_lambda_function.dynamodb_sync.function_name
    secret_rotation  = aws_lambda_function.secret_rotation.function_name
    discover_studios = aws_lambda_function.discover_studios.function_name
    find_artists     = aws_lambda_function.find_artists.function_name
    queue_scraping   = aws_lambda_function.queue_scraping.function_name
    rotate_nat_eip   = aws_lambda_function.rotate_nat_gateway_eip.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value = {
    api_handler      = aws_lambda_function.api_handler.arn
    dynamodb_sync    = aws_lambda_function.dynamodb_sync.arn
    secret_rotation  = aws_lambda_function.secret_rotation.arn
    discover_studios = aws_lambda_function.discover_studios.arn
    find_artists     = aws_lambda_function.find_artists.arn
    queue_scraping   = aws_lambda_function.queue_scraping.arn
    rotate_nat_eip   = aws_lambda_function.rotate_nat_gateway_eip.arn
  }
  sensitive = true
}
#=============================================================================
# Messaging
#=============================================================================
output "sqs_queues" {
  description = "Map of all SQS queues with their details"
  value = merge(
    {
      scraping_queue = {
        id                         = aws_sqs_queue.scraping_queue.id
        arn                        = aws_sqs_queue.scraping_queue.arn
        name                       = aws_sqs_queue.scraping_queue.name
        url                        = aws_sqs_queue.scraping_queue.url
        message_retention_seconds  = aws_sqs_queue.scraping_queue.message_retention_seconds
        visibility_timeout_seconds = aws_sqs_queue.scraping_queue.visibility_timeout_seconds
      }
      scraping_dlq = {
        id                        = aws_sqs_queue.scraping_dlq.id
        arn                       = aws_sqs_queue.scraping_dlq.arn
        name                      = aws_sqs_queue.scraping_dlq.name
        url                       = aws_sqs_queue.scraping_dlq.url
        message_retention_seconds = aws_sqs_queue.scraping_dlq.message_retention_seconds
      }
      lambda_sync_dlq = {
        id                        = aws_sqs_queue.lambda_sync_dlq.id
        arn                       = aws_sqs_queue.lambda_sync_dlq.arn
        name                      = aws_sqs_queue.lambda_sync_dlq.name
        url                       = aws_sqs_queue.lambda_sync_dlq.url
        message_retention_seconds = aws_sqs_queue.lambda_sync_dlq.message_retention_seconds
      }
    },
    local.environment_config[var.environment].enable_advanced_monitoring ? {
      config_compliance_dlq = {
        id                        = aws_sqs_queue.config_compliance_dlq[0].id
        arn                       = aws_sqs_queue.config_compliance_dlq[0].arn
        name                      = aws_sqs_queue.config_compliance_dlq[0].name
        url                       = aws_sqs_queue.config_compliance_dlq[0].url
        message_retention_seconds = aws_sqs_queue.config_compliance_dlq[0].message_retention_seconds
      }
    } : {}
  )
}

output "sns_topics" {
  description = "Map of all SNS topics with their details"
  value = {
    alerts = {
      id   = aws_sns_topic.alerts.id
      arn  = aws_sns_topic.alerts.arn
      name = aws_sns_topic.alerts.name
    }
    config_notifications = {
      id   = aws_sns_topic.config_notifications.id
      arn  = aws_sns_topic.config_notifications.arn
      name = aws_sns_topic.config_notifications.name
    }
    cloudtrail_notifications = {
      id   = aws_sns_topic.cloudtrail_notifications.id
      arn  = aws_sns_topic.cloudtrail_notifications.arn
      name = aws_sns_topic.cloudtrail_notifications.name
    }
    s3_events = {
      id   = aws_sns_topic.s3_events.id
      arn  = aws_sns_topic.s3_events.arn
      name = aws_sns_topic.s3_events.name
    }
  }
}

output "sqs_queue_url" {
  description = "URL of the SQS scraping queue"
  value       = aws_sqs_queue.scraping_queue.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS scraping queue"
  value       = aws_sqs_queue.scraping_queue.arn
}

output "sqs_dlq_urls" {
  description = "URLs of the SQS dead letter queues"
  value = {
    scraping_dlq    = aws_sqs_queue.scraping_dlq.url
    lambda_sync_dlq = aws_sqs_queue.lambda_sync_dlq.url
  }
}

output "sns_topic_arns" {
  description = "ARNs of the SNS topics"
  value = {
    alerts                   = aws_sns_topic.alerts.arn
    config_notifications     = aws_sns_topic.config_notifications.arn
    cloudtrail_notifications = aws_sns_topic.cloudtrail_notifications.arn
    s3_events                = aws_sns_topic.s3_events.arn
  }
}
#=============================================================================
# Orchestration
#=============================================================================
output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.arn
}

output "step_functions_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.data_aggregation.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.scraper.name
}
#=============================================================================
# Monitoring
#=============================================================================
output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "config_compliance_dashboard_url" {
  description = "URL of the Config compliance dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.config_compliance.dashboard_name}"
}

output "cloudwatch_console_url" {
  description = "URL of the CloudWatch console"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}"
}

output "config_console_url" {
  description = "URL of the AWS Config console"
  value       = "https://${var.aws_region}.console.aws.amazon.com/config/home?region=${var.aws_region}"
}

output "cloudwatch_log_groups" {
  description = "Map of all CloudWatch log groups with their details"
  value = merge(
    {
      lambda_api = {
        name              = aws_cloudwatch_log_group.lambda_api.name
        arn               = aws_cloudwatch_log_group.lambda_api.arn
        retention_in_days = aws_cloudwatch_log_group.lambda_api.retention_in_days
      }
      lambda_sync = {
        name              = aws_cloudwatch_log_group.lambda_sync.name
        arn               = aws_cloudwatch_log_group.lambda_sync.arn
        retention_in_days = aws_cloudwatch_log_group.lambda_sync.retention_in_days
      }
      lambda_workflow = {
        name              = aws_cloudwatch_log_group.lambda_workflow.name
        arn               = aws_cloudwatch_log_group.lambda_workflow.arn
        retention_in_days = aws_cloudwatch_log_group.lambda_workflow.retention_in_days
      }
      api_gateway = {
        name              = aws_cloudwatch_log_group.api_gateway.name
        arn               = aws_cloudwatch_log_group.api_gateway.arn
        retention_in_days = aws_cloudwatch_log_group.api_gateway.retention_in_days
      }
      fargate_scraper = {
        name              = aws_cloudwatch_log_group.fargate_scraper.name
        arn               = aws_cloudwatch_log_group.fargate_scraper.arn
        retention_in_days = aws_cloudwatch_log_group.fargate_scraper.retention_in_days
      }
      ecs_cluster = {
        name              = aws_cloudwatch_log_group.ecs_cluster.name
        arn               = aws_cloudwatch_log_group.ecs_cluster.arn
        retention_in_days = aws_cloudwatch_log_group.ecs_cluster.retention_in_days
      }
      opensearch_audit = {
        name              = aws_cloudwatch_log_group.opensearch_audit.name
        arn               = aws_cloudwatch_log_group.opensearch_audit.arn
        retention_in_days = aws_cloudwatch_log_group.opensearch_audit.retention_in_days
      }
      cloudtrail = {
        name              = aws_cloudwatch_log_group.cloudtrail.name
        arn               = aws_cloudwatch_log_group.cloudtrail.arn
        retention_in_days = aws_cloudwatch_log_group.cloudtrail.retention_in_days
      }
      vpc_flow_logs = {
        name              = aws_cloudwatch_log_group.vpc_flow_logs.name
        arn               = aws_cloudwatch_log_group.vpc_flow_logs.arn
        retention_in_days = aws_cloudwatch_log_group.vpc_flow_logs.retention_in_days
      }
      waf = {
        name              = aws_cloudwatch_log_group.waf.name
        arn               = aws_cloudwatch_log_group.waf.arn
        retention_in_days = aws_cloudwatch_log_group.waf.retention_in_days
      }
      secret_rotation = {
        name              = aws_cloudwatch_log_group.secret_rotation.name
        arn               = aws_cloudwatch_log_group.secret_rotation.arn
        retention_in_days = aws_cloudwatch_log_group.secret_rotation.retention_in_days
      }
      rotate_eip = {
        name              = aws_cloudwatch_log_group.rotate_eip.name
        arn               = aws_cloudwatch_log_group.rotate_eip.arn
        retention_in_days = aws_cloudwatch_log_group.rotate_eip.retention_in_days
      }
    },
    local.environment_config[var.environment].enable_advanced_monitoring ? {
      config_compliance_processor = {
        name              = aws_cloudwatch_log_group.config_compliance_processor[0].name
        arn               = aws_cloudwatch_log_group.config_compliance_processor[0].arn
        retention_in_days = aws_cloudwatch_log_group.config_compliance_processor[0].retention_in_days
      }
    } : {}
  )
}

output "cloudwatch_alarms" {
  description = "Map of all CloudWatch alarms"
  value = merge(
    {
      sqs_queue_depth = {
        name = aws_cloudwatch_metric_alarm.sqs_queue_depth.alarm_name
        arn  = aws_cloudwatch_metric_alarm.sqs_queue_depth.arn
      }
      high_rejected_connections = {
        name = aws_cloudwatch_metric_alarm.high_rejected_connections.alarm_name
        arn  = aws_cloudwatch_metric_alarm.high_rejected_connections.arn
      }
      sqs_dlq_messages = {
        name = aws_cloudwatch_metric_alarm.sqs_dlq_messages.alarm_name
        arn  = aws_cloudwatch_metric_alarm.sqs_dlq_messages.arn
      }
      api_gateway_5xx_errors = {
        name = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.alarm_name
        arn  = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.arn
      }
      lambda_errors = {
        name = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
        arn  = aws_cloudwatch_metric_alarm.lambda_errors.arn
      }
      lambda_duration = {
        name = aws_cloudwatch_metric_alarm.lambda_duration.alarm_name
        arn  = aws_cloudwatch_metric_alarm.lambda_duration.arn
      }
      dynamodb_throttles = {
        name = aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name
        arn  = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
      }
      opensearch_cluster_status = {
        name = aws_cloudwatch_metric_alarm.opensearch_cluster_status.alarm_name
        arn  = aws_cloudwatch_metric_alarm.opensearch_cluster_status.arn
      }
      ecs_cpu_utilization = {
        name = aws_cloudwatch_metric_alarm.ecs_cpu_utilization.alarm_name
        arn  = aws_cloudwatch_metric_alarm.ecs_cpu_utilization.arn
      }
      step_functions_failed = {
        name = aws_cloudwatch_metric_alarm.step_functions_failed.alarm_name
        arn  = aws_cloudwatch_metric_alarm.step_functions_failed.arn
      }
      iam_policy_changes = {
        name = aws_cloudwatch_metric_alarm.iam_policy_changes.alarm_name
        arn  = aws_cloudwatch_metric_alarm.iam_policy_changes.arn
      }
      root_usage = {
        name = aws_cloudwatch_metric_alarm.root_usage.alarm_name
        arn  = aws_cloudwatch_metric_alarm.root_usage.arn
      }
      system_health = {
        name = aws_cloudwatch_composite_alarm.system_health.alarm_name
        arn  = aws_cloudwatch_composite_alarm.system_health.arn
      }
    },
    local.environment_config[var.environment].backup_enabled ? {
      dynamodb_pitr_status = {
        name = aws_cloudwatch_metric_alarm.dynamodb_pitr_status[0].alarm_name
        arn  = aws_cloudwatch_metric_alarm.dynamodb_pitr_status[0].arn
      }
    } : {},
    var.notification_email != "" ? {
      config_compliance_alarm = {
        name = aws_cloudwatch_metric_alarm.config_compliance_alarm[0].alarm_name
        arn  = aws_cloudwatch_metric_alarm.config_compliance_alarm[0].arn
      }
      critical_security_compliance = {
        name = aws_cloudwatch_metric_alarm.critical_security_compliance[0].alarm_name
        arn  = aws_cloudwatch_metric_alarm.critical_security_compliance[0].arn
      }
    } : {},
    var.environment == "prod" ? {
      insights_events = {
        name = aws_cloudwatch_metric_alarm.insights_events[0].alarm_name
        arn  = aws_cloudwatch_metric_alarm.insights_events[0].arn
      }
    } : {}
  )
}

output "cloudwatch_metric_filters" {
  description = "Map of all CloudWatch metric filters"
  value = {
    rejected_connections = {
      name           = aws_cloudwatch_log_metric_filter.rejected_connections.name
      log_group_name = aws_cloudwatch_log_metric_filter.rejected_connections.log_group_name
      pattern        = aws_cloudwatch_log_metric_filter.rejected_connections.pattern
    }
    iam_policy_changes = {
      name           = aws_cloudwatch_log_metric_filter.iam_policy_changes.name
      log_group_name = aws_cloudwatch_log_metric_filter.iam_policy_changes.log_group_name
      pattern        = aws_cloudwatch_log_metric_filter.iam_policy_changes.pattern
    }
    root_usage = {
      name           = aws_cloudwatch_log_metric_filter.root_usage.name
      log_group_name = aws_cloudwatch_log_metric_filter.root_usage.log_group_name
      pattern        = aws_cloudwatch_log_metric_filter.root_usage.pattern
    }
    config_non_compliant_resources = {
      name           = aws_cloudwatch_log_metric_filter.config_non_compliant_resources.name
      log_group_name = aws_cloudwatch_log_metric_filter.config_non_compliant_resources.log_group_name
      pattern        = aws_cloudwatch_log_metric_filter.config_non_compliant_resources.pattern
    }
  }
}

output "cloudwatch_dashboards" {
  description = "Map of CloudWatch dashboards"
  value = {
    main = {
      name = aws_cloudwatch_dashboard.main.dashboard_name
      arn  = aws_cloudwatch_dashboard.main.dashboard_arn
    }
    config_compliance = {
      name = aws_cloudwatch_dashboard.config_compliance.dashboard_name
      arn  = aws_cloudwatch_dashboard.config_compliance.dashboard_arn
    }
  }
}
#=============================================================================
# Compliance
#=============================================================================
output "aws_config" {
  description = "AWS Config details"
  value = {
    recorder = {
      name = aws_config_configuration_recorder.main.name
      # The configuration recorder resource does not have an ARN attribute. Its name is its primary identifier.
    }
    delivery_channel = {
      name           = aws_config_delivery_channel.main.name
      s3_bucket_name = aws_config_delivery_channel.main.s3_bucket_name
    }
    bucket = {
      name = aws_s3_bucket.config.bucket
      arn  = aws_s3_bucket.config.arn
    }
  }
}

output "aws_config_rules" {
  description = "Map of all AWS Config rules"
  value = {
    s3_bucket_public_access_prohibited = {
      name = aws_config_config_rule.s3_bucket_public_access_prohibited.name
      arn  = aws_config_config_rule.s3_bucket_public_access_prohibited.arn
    }
    s3_bucket_ssl_requests_only = {
      name = aws_config_config_rule.s3_bucket_ssl_requests_only.name
      arn  = aws_config_config_rule.s3_bucket_ssl_requests_only.arn
    }
    s3_bucket_server_side_encryption_enabled = {
      name = aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name
      arn  = aws_config_config_rule.s3_bucket_server_side_encryption_enabled.arn
    }
    dynamodb_table_encryption_enabled = {
      name = aws_config_config_rule.dynamodb_table_encryption_enabled.name
      arn  = aws_config_config_rule.dynamodb_table_encryption_enabled.arn
    }
    dynamodb_pitr_enabled = {
      name = aws_config_config_rule.dynamodb_pitr_enabled.name
      arn  = aws_config_config_rule.dynamodb_pitr_enabled.arn
    }
    lambda_function_public_access_prohibited = {
      name = aws_config_config_rule.lambda_function_public_access_prohibited.name
      arn  = aws_config_config_rule.lambda_function_public_access_prohibited.arn
    }
    lambda_inside_vpc = {
      name = aws_config_config_rule.lambda_inside_vpc.name
      arn  = aws_config_config_rule.lambda_inside_vpc.arn
    }
    cloudfront_origin_access_identity_enabled = {
      name = aws_config_config_rule.cloudfront_origin_access_identity_enabled.name
      arn  = aws_config_config_rule.cloudfront_origin_access_identity_enabled.arn
    }
    cloudfront_viewer_policy_https = {
      name = aws_config_config_rule.cloudfront_viewer_policy_https.name
      arn  = aws_config_config_rule.cloudfront_viewer_policy_https.arn
    }
    vpc_default_security_group_closed = {
      name = aws_config_config_rule.vpc_default_security_group_closed.name
      arn  = aws_config_config_rule.vpc_default_security_group_closed.arn
    }
    vpc_flow_logs_enabled = {
      name = aws_config_config_rule.vpc_flow_logs_enabled.name
      arn  = aws_config_config_rule.vpc_flow_logs_enabled.arn
    }
    iam_policy_no_statements_with_admin_access = {
      name = aws_config_config_rule.iam_policy_no_statements_with_admin_access.name
      arn  = aws_config_config_rule.iam_policy_no_statements_with_admin_access.arn
    }
    iam_user_no_policies_check = {
      name = aws_config_config_rule.iam_user_no_policies_check.name
      arn  = aws_config_config_rule.iam_user_no_policies_check.arn
    }
    kms_cmk_not_scheduled_for_deletion = {
      name = aws_config_config_rule.kms_cmk_not_scheduled_for_deletion.name
      arn  = aws_config_config_rule.kms_cmk_not_scheduled_for_deletion.arn
    }
    api_gw_execution_logging_enabled = {
      name = aws_config_config_rule.api_gw_execution_logging_enabled.name
      arn  = aws_config_config_rule.api_gw_execution_logging_enabled.arn
    }
  }
}

output "config_remediation" {
  description = "Config remediation configurations"
  value = local.environment_config[var.environment].enable_advanced_monitoring ? {
    s3_bucket_public_access = {
      name = aws_config_remediation_configuration.s3_bucket_public_access[0].config_rule_name
      arn  = aws_config_remediation_configuration.s3_bucket_public_access[0].arn
    }
  } : {}
}

output "cloudtrail" {
  description = "CloudTrail details"
  value = {
    name                          = aws_cloudtrail.main.name
    arn                           = aws_cloudtrail.main.arn
    home_region                   = aws_cloudtrail.main.home_region
    s3_bucket_name                = aws_cloudtrail.main.s3_bucket_name
    s3_key_prefix                 = aws_cloudtrail.main.s3_key_prefix
    sns_topic_name                = aws_cloudtrail.main.sns_topic_name
    cloud_watch_logs_group_arn    = aws_cloudtrail.main.cloud_watch_logs_group_arn
    kms_key_id                    = aws_cloudtrail.main.kms_key_id
    is_multi_region_trail         = aws_cloudtrail.main.is_multi_region_trail
    include_global_service_events = aws_cloudtrail.main.include_global_service_events
    enable_log_file_validation    = aws_cloudtrail.main.enable_log_file_validation
  }
}

output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.bucket
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudWatch Log Group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "config_rules_count" {
  description = "Number of Config rules deployed"
  value       = 15
}
#=============================================================================
# Security
#=============================================================================
output "kms_keys" {
  description = "Map of all KMS keys"
  value = merge(
    {
      main = {
        id          = aws_kms_key.main.id
        arn         = aws_kms_key.main.arn
        key_id      = aws_kms_key.main.key_id
        description = aws_kms_key.main.description
      }
      logs = {
        id          = aws_kms_key.logs.id
        arn         = aws_kms_key.logs.arn
        key_id      = aws_kms_key.logs.key_id
        description = aws_kms_key.logs.description
      }
    },
    var.environment == "prod" ? {
      replica = {
        id          = aws_kms_key.replica[0].id
        arn         = aws_kms_key.replica[0].arn
        key_id      = aws_kms_key.replica[0].key_id
        description = aws_kms_key.replica[0].description
      }
    } : {}
  )
}

output "kms_key_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_logs_key_id" {
  description = "ID of the logs KMS key"
  value       = aws_kms_key.logs.id
}

output "kms_logs_key_arn" {
  description = "ARN of the logs KMS key"
  value       = aws_kms_key.logs.arn
}

output "iam_roles" {
  description = "Map of all IAM roles with their ARNs"
  value = merge(
    {
      lambda_api_role = {
        name = aws_iam_role.lambda_api_role.name
        arn  = aws_iam_role.lambda_api_role.arn
        id   = aws_iam_role.lambda_api_role.id
      }
      lambda_sync_role = {
        name = aws_iam_role.lambda_sync_role.name
        arn  = aws_iam_role.lambda_sync_role.arn
        id   = aws_iam_role.lambda_sync_role.id
      }
      fargate_task_role = {
        name = aws_iam_role.fargate_task_role.name
        arn  = aws_iam_role.fargate_task_role.arn
        id   = aws_iam_role.fargate_task_role.id
      }
      fargate_execution_role = {
        name = aws_iam_role.fargate_execution_role.name
        arn  = aws_iam_role.fargate_execution_role.arn
        id   = aws_iam_role.fargate_execution_role.id
      }
      step_functions_role = {
        name = aws_iam_role.step_functions_role.name
        arn  = aws_iam_role.step_functions_role.arn
        id   = aws_iam_role.step_functions_role.id
      }
      eventbridge_role = {
        name = aws_iam_role.eventbridge_role.name
        arn  = aws_iam_role.eventbridge_role.arn
        id   = aws_iam_role.eventbridge_role.id
      }
      discover_studios_role = {
        name = aws_iam_role.discover_studios_role.name
        arn  = aws_iam_role.discover_studios_role.arn
        id   = aws_iam_role.discover_studios_role.id
      }
      find_artists_on_site_role = {
        name = aws_iam_role.find_artists_on_site_role.name
        arn  = aws_iam_role.find_artists_on_site_role.arn
        id   = aws_iam_role.find_artists_on_site_role.id
      }
      queue_scraping_role = {
        name = aws_iam_role.queue_scraping_role.name
        arn  = aws_iam_role.queue_scraping_role.arn
        id   = aws_iam_role.queue_scraping_role.id
      }
      rotate_nat_gateway_eip_role = {
        name = aws_iam_role.rotate_nat_gateway_eip_role.name
        arn  = aws_iam_role.rotate_nat_gateway_eip_role.arn
        id   = aws_iam_role.rotate_nat_gateway_eip_role.id
      }
      config = {
        name = aws_iam_role.config.name
        arn  = aws_iam_role.config.arn
        id   = aws_iam_role.config.id
      }
      cloudtrail_to_cloudwatch = {
        name = aws_iam_role.cloudtrail_to_cloudwatch.name
        arn  = aws_iam_role.cloudtrail_to_cloudwatch.arn
        id   = aws_iam_role.cloudtrail_to_cloudwatch.id
      }
      api_gateway_cloudwatch_role = {
        name = aws_iam_role.api_gateway_cloudwatch_role.name
        arn  = aws_iam_role.api_gateway_cloudwatch_role.arn
        id   = aws_iam_role.api_gateway_cloudwatch_role.id
      }
      vpc_flow_logs_role = {
        name = aws_iam_role.vpc_flow_logs_role.name
        arn  = aws_iam_role.vpc_flow_logs_role.arn
        id   = aws_iam_role.vpc_flow_logs_role.id
      }
      eventbridge_custom_bus_role = {
        name = aws_iam_role.eventbridge_custom_bus_role.name
        arn  = aws_iam_role.eventbridge_custom_bus_role.arn
        id   = aws_iam_role.eventbridge_custom_bus_role.id
      }
      eventbridge_lambda_invoke_role = {
        name = aws_iam_role.eventbridge_lambda_invoke_role.name
        arn  = aws_iam_role.eventbridge_lambda_invoke_role.arn
        id   = aws_iam_role.eventbridge_lambda_invoke_role.id
      }
      step_functions = {
        name = aws_iam_role.step_functions.name
        arn  = aws_iam_role.step_functions.arn
        id   = aws_iam_role.step_functions.id
      }
      ecs_execution = {
        name = aws_iam_role.ecs_execution.name
        arn  = aws_iam_role.ecs_execution.arn
        id   = aws_iam_role.ecs_execution.id
      }
      ecs_task = {
        name = aws_iam_role.ecs_task.name
        arn  = aws_iam_role.ecs_task.arn
        id   = aws_iam_role.ecs_task.id
      }
      secret_rotation_role = {
        name = aws_iam_role.secret_rotation_role.name
        arn  = aws_iam_role.secret_rotation_role.arn
        id   = aws_iam_role.secret_rotation_role.id
      }
    },
    #=============================================================================
    # Conditional roles
    #=============================================================================
    local.environment_config[var.environment].backup_enabled ? {
      backup_role = {
        name = aws_iam_role.backup_role[0].name
        arn  = aws_iam_role.backup_role[0].arn
        id   = aws_iam_role.backup_role[0].id
      }
    } : {},
    local.environment_config[var.environment].enable_advanced_monitoring ? {
      config_remediation = {
        name = aws_iam_role.config_remediation[0].name
        arn  = aws_iam_role.config_remediation[0].arn
        id   = aws_iam_role.config_remediation[0].id
      }
      config_compliance_processor = {
        name = aws_iam_role.config_compliance_processor[0].name
        arn  = aws_iam_role.config_compliance_processor[0].arn
        id   = aws_iam_role.config_compliance_processor[0].id
      }
    } : {},
    var.environment == "prod" ? {
      s3_replication = {
        name = aws_iam_role.s3_replication[0].name
        arn  = aws_iam_role.s3_replication[0].arn
        id   = aws_iam_role.s3_replication[0].id
      }
    } : {}
  )
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "security_groups" {
  description = "Map of all security groups with their details"
  value = {
    lambda = {
      id          = aws_security_group.lambda.id
      arn         = aws_security_group.lambda.arn
      name        = aws_security_group.lambda.name
      description = aws_security_group.lambda.description
    }
    opensearch = {
      id          = aws_security_group.opensearch.id
      arn         = aws_security_group.opensearch.arn
      name        = aws_security_group.opensearch.name
      description = aws_security_group.opensearch.description
    }
    fargate = {
      id          = aws_security_group.fargate.id
      arn         = aws_security_group.fargate.arn
      name        = aws_security_group.fargate.name
      description = aws_security_group.fargate.description
    }
    vpc_endpoints = {
      id          = aws_security_group.vpc_endpoints.id
      arn         = aws_security_group.vpc_endpoints.arn
      name        = aws_security_group.vpc_endpoints.name
      description = aws_security_group.vpc_endpoints.description
    }
  }
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    lambda        = aws_security_group.lambda.id
    opensearch    = aws_security_group.opensearch.id
    fargate       = aws_security_group.fargate.id
    vpc_endpoints = aws_security_group.vpc_endpoints.id
  }
}

output "waf_web_acl" {
  description = "WAF Web ACL details"
  value = {
    id   = aws_wafv2_web_acl.frontend.id
    arn  = aws_wafv2_web_acl.frontend.arn
    name = aws_wafv2_web_acl.frontend.name
  }
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.frontend.arn
}

output "guardduty_detector" {
  description = "GuardDuty detector details"
  value = {
    id                           = aws_guardduty_detector.main.id
    arn                          = aws_guardduty_detector.main.arn
    account_id                   = aws_guardduty_detector.main.account_id
    finding_publishing_frequency = aws_guardduty_detector.main.finding_publishing_frequency
  }
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}
#=============================================================================
# Backup (conditional outputs)
#=============================================================================
output "backup_resources" {
  description = "Backup resources details"
  value = local.environment_config[var.environment].backup_enabled ? {
    vault = {
      name = aws_backup_vault.main[0].name
      arn  = aws_backup_vault.main[0].arn
      id   = aws_backup_vault.main[0].id
    }
    plan = {
      name = aws_backup_plan.main[0].name
      arn  = aws_backup_plan.main[0].arn
      id   = aws_backup_plan.main[0].id
    }
    selection = {
      name = aws_backup_selection.main[0].name
      id   = aws_backup_selection.main[0].id
    }
  } : {}
}

output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = local.environment_config[var.environment].backup_enabled ? aws_backup_vault.main[0].name : null
}

output "backup_plan_arn" {
  description = "ARN of the backup plan"
  value       = local.environment_config[var.environment].backup_enabled ? aws_backup_plan.main[0].arn : null
}
#=============================================================================
# Additional Resources
#=============================================================================
output "cloudfront_oac" {
  description = "CloudFront Origin Access Control details"
  value = {
    id   = aws_cloudfront_origin_access_control.frontend.id
    name = aws_cloudfront_origin_access_control.frontend.name
  }
}

output "acm_certificate" {
  description = "ACM Certificate details (if domain is provided)"
  value = var.domain_name != "" ? {
    arn         = aws_acm_certificate.cloudfront[0].arn
    domain_name = aws_acm_certificate.cloudfront[0].domain_name
    status      = aws_acm_certificate.cloudfront[0].status
  } : null
}

output "eventbridge_rules" {
  description = "EventBridge rules details"
  value = {
    config_compliance_change = {
      name = aws_cloudwatch_event_rule.config_compliance_change.name
      arn  = aws_cloudwatch_event_rule.config_compliance_change.arn
    }
  }
}

output "eventbridge_targets" {
  description = "EventBridge targets details"
  value = merge(
    {
      config_compliance_sns = {
        rule      = aws_cloudwatch_event_target.config_compliance_sns.rule
        target_id = aws_cloudwatch_event_target.config_compliance_sns.target_id
        arn       = aws_cloudwatch_event_target.config_compliance_sns.arn
      }
    },
    local.environment_config[var.environment].enable_advanced_monitoring ? {
      config_compliance_lambda = {
        rule      = aws_cloudwatch_event_target.config_compliance_lambda[0].rule
        target_id = aws_cloudwatch_event_target.config_compliance_lambda[0].target_id
        arn       = aws_cloudwatch_event_target.config_compliance_lambda[0].arn
      }
    } : {}
  )
}

output "lambda_event_source_mappings" {
  description = "Lambda event source mappings"
  value = {
    dynamodb_stream = {
      uuid              = aws_lambda_event_source_mapping.dynamodb_stream.uuid
      function_name     = aws_lambda_event_source_mapping.dynamodb_stream.function_name
      event_source_arn  = aws_lambda_event_source_mapping.dynamodb_stream.event_source_arn
      starting_position = aws_lambda_event_source_mapping.dynamodb_stream.starting_position
      batch_size        = aws_lambda_event_source_mapping.dynamodb_stream.batch_size
    }
  }
}

output "vpc_endpoints" {
  description = "VPC Endpoints details"
  value = {
    dynamodb = {
      id                = aws_vpc_endpoint.dynamodb.id
      arn               = aws_vpc_endpoint.dynamodb.arn
      service_name      = aws_vpc_endpoint.dynamodb.service_name
      vpc_endpoint_type = aws_vpc_endpoint.dynamodb.vpc_endpoint_type
      state             = aws_vpc_endpoint.dynamodb.state
    }
    s3 = {
      id                = aws_vpc_endpoint.s3.id
      arn               = aws_vpc_endpoint.s3.arn
      service_name      = aws_vpc_endpoint.s3.service_name
      vpc_endpoint_type = aws_vpc_endpoint.s3.vpc_endpoint_type
      state             = aws_vpc_endpoint.s3.state
    }
    secretsmanager = {
      id                = aws_vpc_endpoint.secretsmanager.id
      arn               = aws_vpc_endpoint.secretsmanager.arn
      service_name      = aws_vpc_endpoint.secretsmanager.service_name
      vpc_endpoint_type = aws_vpc_endpoint.secretsmanager.vpc_endpoint_type
      state             = aws_vpc_endpoint.secretsmanager.state
    }
    sqs = {
      id                = aws_vpc_endpoint.sqs.id
      arn               = aws_vpc_endpoint.sqs.arn
      service_name      = aws_vpc_endpoint.sqs.service_name
      vpc_endpoint_type = aws_vpc_endpoint.sqs.vpc_endpoint_type
      state             = aws_vpc_endpoint.sqs.state
    }
    states = {
      id                = aws_vpc_endpoint.states.id
      arn               = aws_vpc_endpoint.states.arn
      service_name      = aws_vpc_endpoint.states.service_name
      vpc_endpoint_type = aws_vpc_endpoint.states.vpc_endpoint_type
      state             = aws_vpc_endpoint.states.state
    }
    ecr_api = {
      id                = aws_vpc_endpoint.ecr_api.id
      arn               = aws_vpc_endpoint.ecr_api.arn
      service_name      = aws_vpc_endpoint.ecr_api.service_name
      vpc_endpoint_type = aws_vpc_endpoint.ecr_api.vpc_endpoint_type
      state             = aws_vpc_endpoint.ecr_api.state
    }
    ecr_dkr = {
      id                = aws_vpc_endpoint.ecr_dkr.id
      arn               = aws_vpc_endpoint.ecr_dkr.arn
      service_name      = aws_vpc_endpoint.ecr_dkr.service_name
      vpc_endpoint_type = aws_vpc_endpoint.ecr_dkr.vpc_endpoint_type
      state             = aws_vpc_endpoint.ecr_dkr.state
    }
    logs = {
      id                = aws_vpc_endpoint.logs.id
      arn               = aws_vpc_endpoint.logs.arn
      service_name      = aws_vpc_endpoint.logs.service_name
      vpc_endpoint_type = aws_vpc_endpoint.logs.vpc_endpoint_type
      state             = aws_vpc_endpoint.logs.state
    }
  }
}

output "opensearch_service_linked_role" {
  description = "OpenSearch service-linked role"
  value = {
    id   = aws_iam_service_linked_role.opensearch.id
    arn  = aws_iam_service_linked_role.opensearch.arn
    name = aws_iam_service_linked_role.opensearch.name
  }
}

output "secrets_manager_rotation" {
  description = "Secrets Manager rotation details"
  value = {
    rotation_enabled    = aws_secretsmanager_secret_rotation.app_secrets.rotation_enabled
    rotation_lambda_arn = aws_secretsmanager_secret_rotation.app_secrets.rotation_lambda_arn
    rotation_rules      = aws_secretsmanager_secret_rotation.app_secrets.rotation_rules
  }
  sensitive = true
}

output "cost_monitoring" {
  description = "Cost monitoring resources"
  value = {
    budget = {
      name         = aws_budgets_budget.daily_spend.name
      budget_type  = aws_budgets_budget.daily_spend.budget_type
      limit_amount = aws_budgets_budget.daily_spend.limit_amount
      limit_unit   = aws_budgets_budget.daily_spend.limit_unit
      time_unit    = aws_budgets_budget.daily_spend.time_unit
    }
    anomaly_monitor = {
      name = aws_ce_anomaly_monitor.main.name
      arn  = aws_ce_anomaly_monitor.main.arn
    }
    anomaly_subscription = {
      name = aws_ce_anomaly_subscription.main.name
      arn  = aws_ce_anomaly_subscription.main.arn
    }
  }
}

output "xray_sampling_rule" {
  description = "X-Ray sampling rule details"
  value = {
    rule_name      = aws_xray_sampling_rule.main.rule_name
    arn            = aws_xray_sampling_rule.main.arn
    priority       = aws_xray_sampling_rule.main.priority
    reservoir_size = aws_xray_sampling_rule.main.reservoir_size
    fixed_rate     = aws_xray_sampling_rule.main.fixed_rate
  }
}

output "code_signing_config" {
  description = "Lambda code signing configuration (production only)"
  value = var.environment == "prod" ? {
    arn                 = aws_lambda_code_signing_config.main[0].arn
    config_id           = aws_lambda_code_signing_config.main[0].config_id
    description         = aws_lambda_code_signing_config.main[0].description
    signing_profile_arn = aws_signer_signing_profile.lambda[0].arn
  } : null
}

output "cross_region_replication" {
  description = "Cross-region replication details (production only)"
  value = var.environment == "prod" ? {
    replica_region = var.replica_aws_region
    replica_kms_key = {
      id  = aws_kms_key.replica[0].id
      arn = aws_kms_key.replica[0].arn
    }
  } : null
}
#=============================================================================
# Environment Information
#=============================================================================
output "environment_config" {
  description = "Environment configuration details"
  value = {
    environment                     = var.environment
    project_name                    = var.project_name
    aws_region                      = var.aws_region
    replica_aws_region              = var.environment == "prod" ? var.replica_aws_region : null
    name_prefix                     = local.name_prefix
    backup_enabled                  = local.environment_config[var.environment].backup_enabled
    enable_advanced_monitoring      = local.environment_config[var.environment].enable_advanced_monitoring
    enable_deletion_protection      = local.environment_config[var.environment].enable_deletion_protection
    lambda_memory_size              = local.environment_config[var.environment].lambda_memory_size
    opensearch_instance_type        = local.config.opensearch_instance_type
    opensearch_instance_count       = local.config.opensearch_instance_count
    enable_cross_region_replication = var.enable_cross_region_replication
    domain_name                     = var.domain_name
    allowed_countries               = var.allowed_countries
  }
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}
#=============================================================================
# Resource Counts Summary
#=============================================================================
output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    s3_buckets_count = length(keys(merge(
      {
        frontend        = 1
        frontend_backup = 1
        access_logs     = 1
        config          = 1
        cloudtrail      = 1
      },
      var.environment == "prod" ? {
        frontend_replica        = 1
        frontend_backup_replica = 1
        access_logs_replica     = 1
        config_replica          = var.enable_cross_region_replication ? 1 : 0
        cloudtrail_replica      = var.enable_cross_region_replication ? 1 : 0
      } : {}
    )))
    dynamodb_tables_count           = 3
    lambda_functions_count          = 7 + (local.environment_config[var.environment].enable_advanced_monitoring ? 1 : 0)
    config_rules_count              = 15
    cloudwatch_alarms_count         = 12 + (local.environment_config[var.environment].backup_enabled ? 1 : 0) + (var.notification_email != "" ? 2 : 0) + (var.environment == "prod" ? 1 : 0)
    cloudwatch_dashboards_count     = 2
    cloudwatch_metric_filters_count = 4
    eventbridge_rules_count         = 1
    vpc_endpoints_count             = 7
    iam_roles_count                 = length(keys(local.iam_roles_map))
    security_groups_count           = 4
    sns_topics_count                = 4
    sqs_queues_count                = 3 + (local.environment_config[var.environment].enable_advanced_monitoring ? 1 : 0)
    kms_keys_count                  = 2 + (var.environment == "prod" ? 1 : 0)
  }
}
#=============================================================================
# Helper locals for resource counting
#=============================================================================
locals {
  iam_roles_map = merge(
    {
      lambda_api_role                = 1
      lambda_sync_role               = 1
      fargate_task_role              = 1
      fargate_execution_role         = 1
      step_functions_role            = 1
      eventbridge_role               = 1
      discover_studios_role          = 1
      find_artists_on_site_role      = 1
      queue_scraping_role            = 1
      rotate_nat_gateway_eip_role    = 1
      config                         = 1
      cloudtrail_to_cloudwatch       = 1
      api_gateway_cloudwatch_role    = 1
      vpc_flow_logs_role             = 1
      eventbridge_custom_bus_role    = 1
      eventbridge_lambda_invoke_role = 1
      step_functions                 = 1
      ecs_execution                  = 1
      ecs_task                       = 1
      config_compliance_processor    = 1
      secret_rotation_role           = 1
    },
    local.environment_config[var.environment].backup_enabled ? { backup_role = 1 } : {},
    local.environment_config[var.environment].enable_advanced_monitoring ? { config_remediation = 1 } : {},
    var.environment == "prod" ? { s3_replication = 1 } : {}
  )
}