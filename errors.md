Warning: Reference to undefined provider
│
│   on main.tf line 18, in module "storage":
│   18:     aws.replica = aws.replica
│
│ There is no explicit declaration for local provider name "aws.replica" in module.storage, so Terraform is assuming you mean to pass a configuration for "hashicorp/aws".
│
│ If you also control the child module, add a required_providers entry named "aws.replica" with the source address "hashicorp/aws".
│
│ (and 2 more similar warnings elsewhere)
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\01-IAM\main.tf line 763, in resource "aws_iam_role_policy_attachment" "config_remediation":
│  763:   policy_arn = data.aws_iam_policy.amazon_ssm_automation_role.arn
│
│ A data resource "aws_iam_policy" "amazon_ssm_automation_role" has not been declared in module.iam.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\01-IAM\main.tf line 772, in resource "aws_iam_role" "config_compliance_processor":
│  772:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\01-IAM\main.tf line 795, in resource "aws_iam_policy" "config_compliance_processor":
│  795:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\01-IAM\main.tf line 873, in resource "aws_iam_role_policy_attachment" "backup_policy":
│  873:   policy_arn = data.aws_iam_policy.aws_backup_service_role_policy_for_backup.arn
│
│ A data resource "aws_iam_policy" "aws_backup_service_role_policy_for_backup" has not been declared in module.iam.
╵
╷
│ Error: Call to unknown function
│
│   on ..\..\modules\02-Network\main.tf line 49, in resource "aws_subnet" "public":
│   49:   cidr_block              = cidrsubset(aws_vpc.main.cidr_block, 8, index(keys(local.availability_zones), each.key) + 1)
│     ├────────────────
│     │ each.key is a string
│     │ local.availability_zones is a set of dynamic
│
│ There is no function named "cidrsubset". Did you mean "cidrsubnet"?
╵
╷
│ Error: Call to unknown function
│
│   on ..\..\modules\02-Network\main.tf line 67, in resource "aws_subnet" "private":
│   67:   cidr_block        = cidrsubset(aws_vpc.main.cidr_block, 8, index(keys(local.availability_zones), each.key) + 10)
│     ├────────────────
│     │ each.key is a string
│     │ local.availability_zones is a set of dynamic
│
│ There is no function named "cidrsubset". Did you mean "cidrsubnets"?
╵
╷
│ Error: Inconsistent conditional result types
│
│   on ..\..\modules\02-Network\main.tf line 91, in resource "aws_eip" "nat":
│   91:   for_each   = var.context.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
│     ├────────────────
│     │ local.availability_zones is a set of dynamic
│     │ var.context.environment is a string
│
│ The true and false result expressions must have consistent types. The 'true' value is set of dynamic, but the 'false' value is object.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\02-Network\main.tf line 438, in resource "aws_wafv2_web_acl_logging_configuration" "frontend":
│  438:   log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
│
│ A managed resource "aws_cloudwatch_log_group" "waf" has not been declared in module.network.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\02-Network\main.tf line 455, in resource "aws_acm_certificate" "cloudfront":
│  455:   count             = var.context.domain_name != "" ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "domain_name".
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\02-Network\main.tf line 457, in resource "aws_acm_certificate" "cloudfront":
│  457:   domain_name       = var.context.domain_name
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "domain_name".
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\02-Network\main.tf line 461, in resource "aws_acm_certificate" "cloudfront":
│  461:     "www.${var.context.domain_name}"
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "domain_name".
╵
╷
│ Error: Reference to undeclared module
│
│   on ..\..\modules\02-Network\outputs.tf line 7, in output "vpc_id":
│    7:   value       = module.network.vpc_id
│
│ No module call named "network" is declared in module.network.
╵
╷
│ Error: Reference to undeclared module
│
│   on ..\..\modules\02-Network\outputs.tf line 40, in output "private_subnet_arns":
│   40:   value       = module.network.private_subnet_arns
│
│ No module call named "network" is declared in module.network.
╵
╷
│ Error: Reference to undeclared module
│
│   on ..\..\modules\02-Network\outputs.tf line 144, in output "lambda_security_group_arn":
│  144:   value       = module.network.lambda_security_group_arn
│
│ No module call named "network" is declared in module.network.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 26, in resource "aws_sqs_queue" "scraping_dlq":
│   26:   kms_master_key_id         = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 59, in resource "aws_sfn_state_machine" "data_aggregation":
│   59:   role_arn = aws_iam_role.step_functions.arn
│
│ A managed resource "aws_iam_role" "step_functions" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 63, in resource "aws_sfn_state_machine" "data_aggregation":
│   63:     log_destination        = "${aws_cloudwatch_log_group.data-aggregation.arn}:*"
│
│ A managed resource "aws_cloudwatch_log_group" "data-aggregation" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 72, in resource "aws_sfn_state_machine" "data_aggregation":
│   72:     discover_studios_arn = aws_lambda_function.discover_studios.arn,
│
│ A managed resource "aws_lambda_function" "discover_studios" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 73, in resource "aws_sfn_state_machine" "data_aggregation":
│   73:     find_artists_arn     = aws_lambda_function.find_artists.arn,
│
│ A managed resource "aws_lambda_function" "find_artists" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 74, in resource "aws_sfn_state_machine" "data_aggregation":
│   74:     queue_scraping_arn   = aws_lambda_function.queue_scraping.arn,
│
│ A managed resource "aws_lambda_function" "queue_scraping" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\05-Data-Aggregation\main.tf line 181, in resource "aws_ecr_repository" "scraper":
│  181:     kms_key         = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.data_aggregation.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\06-DynamoDB\main.tf line 42, in resource "aws_dynamodb_table" "main":
│   42:     kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.dynamodb.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\06-DynamoDB\main.tf line 79, in resource "aws_dynamodb_table" "denylist":
│   79:     kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.dynamodb.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\06-DynamoDB\main.tf line 121, in resource "aws_dynamodb_table" "idempotency":
│  121:     kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.dynamodb.
╵
╷
│ Error: Reference to undeclared input variable
│
│   on ..\..\modules\07-Backup\main.tf line 9, in resource "aws_backup_vault" "main":
│    9:   kms_key_arn = var.kms_key_arn
│
│ An input variable with the name "kms_key_arn" has not been declared. This variable can be declared with a variable "kms_key_arn" {} block.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\08-Governance\main.tf line 21, in resource "aws_config_configuration_recorder" "main":
│   21:   role_arn = aws_iam_role.config.arn
│
│ A managed resource "aws_iam_role" "config" has not been declared in module.governance.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\08-Governance\main.tf line 45, in resource "aws_sns_topic" "config_notifications":
│   45:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.governance.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\08-Governance\main.tf line 67, in resource "aws_config_delivery_channel" "main":
│   67:   s3_bucket_name = aws_s3_bucket.config.bucket
│
│ A managed resource "aws_s3_bucket" "config" has not been declared in module.governance.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\08-Governance\outputs.tf line 22, in output "config_bucket_arn":
│   22:   value       = aws_s3_bucket.config.arn
│
│ A managed resource "aws_s3_bucket" "config" has not been declared in module.governance.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\08-Governance\outputs.tf line 36, in output "config_compliance_dashboard_arn":
│   36:   value       = aws_cloudwatch_dashboard.config_compliance.arn
│
│ This object has no argument, nested block, or exported attribute named "arn".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 30, in resource "aws_sns_topic" "cloudtrail_notifications":
│   30:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 64, in resource "aws_sns_topic" "security_alerts":
│   64:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 153, in resource "aws_cloudwatch_log_metric_filter" "security_alerts":
│  153:   log_group_name = aws_cloudwatch_log_group.cloudtrail.name
│
│ A managed resource "aws_cloudwatch_log_group" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 194, in resource "aws_s3_bucket_replication_configuration" "cloudtrail":
│  194:   role   = aws_iam_role.s3_replication[0].arn
│
│ A managed resource "aws_iam_role" "s3_replication" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 195, in resource "aws_s3_bucket_replication_configuration" "cloudtrail":
│  195:   bucket = aws_s3_bucket.cloudtrail.id
│
│ A managed resource "aws_s3_bucket" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 202, in resource "aws_s3_bucket_replication_configuration" "cloudtrail":
│  202:       bucket        = aws_s3_bucket.cloudtrail_replica[0].arn
│
│ A managed resource "aws_s3_bucket" "cloudtrail_replica" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 206, in resource "aws_s3_bucket_replication_configuration" "cloudtrail":
│  206:         replica_kms_key_id = aws_kms_key.replica[0].arn
│
│ A managed resource "aws_kms_key" "replica" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\main.tf line 211, in resource "aws_s3_bucket_replication_configuration" "cloudtrail":
│  211:   depends_on = [aws_s3_bucket_versioning.cloudtrail]
│
│ A managed resource "aws_s3_bucket_versioning" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 7, in output "cloudtrail_s3_bucket_id":
│    7:   value       = aws_s3_bucket.cloudtrail.id
│
│ A managed resource "aws_s3_bucket" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 12, in output "cloudtrail_s3_bucket_arn":
│   12:   value       = aws_s3_bucket.cloudtrail.arn
│
│ A managed resource "aws_s3_bucket" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 17, in output "cloudtrail_backup_s3_bucket_id":
│   17:   value       = var.context.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_backup[0].id : null
│
│ A managed resource "aws_s3_bucket" "cloudtrail_backup" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 22, in output "cloudtrail_backup_s3_bucket_arn":
│   22:   value       = var.context.enable_cross_region_replication ? aws_s3_bucket.cloudtrail_backup[0].arn : null
│
│ A managed resource "aws_s3_bucket" "cloudtrail_backup" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 37, in output "cloudwatch_log_group_name":
│   37:   value       = aws_cloudwatch_log_group.cloudtrail.name
│
│ A managed resource "aws_cloudwatch_log_group" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\09-Cloudtrail\outputs.tf line 42, in output "cloudwatch_log_group_arn":
│   42:   value       = aws_cloudwatch_log_group.cloudtrail.arn
│
│ A managed resource "aws_cloudwatch_log_group" "cloudtrail" has not been declared in module.cloudtrail.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 223, in resource "aws_cloudwatch_log_group" "standard":
│  223:   kms_key_id        = aws_kms_key.logs.arn
│
│ A managed resource "aws_kms_key" "logs" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 236, in resource "aws_cloudwatch_log_group" "operational":
│  236:   kms_key_id        = aws_kms_key.logs.arn
│
│ A managed resource "aws_kms_key" "logs" has not been declared in module.observability.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\10-Observability\main.tf line 245, in resource "aws_cloudwatch_log_group" "config_compliance_processor":
│  245:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 249, in resource "aws_cloudwatch_log_group" "config_compliance_processor":
│  249:   kms_key_id        = aws_kms_key.logs.arn
│
│ A managed resource "aws_kms_key" "logs" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 263, in resource "aws_sns_topic" "critical_alerts":
│  263:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 270, in resource "aws_sns_topic" "warning_alerts":
│  270:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 277, in resource "aws_sns_topic" "security_alerts":
│  277:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 471, in resource "aws_cloudwatch_dashboard" "main":
│  471:     api_id                  = aws_apigatewayv2_api.main.id
│
│ A managed resource "aws_apigatewayv2_api" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 472, in resource "aws_cloudwatch_dashboard" "main":
│  472:     lambda_api_handler_name = aws_lambda_function.api_handler.function_name
│
│ A managed resource "aws_lambda_function" "api_handler" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 473, in resource "aws_cloudwatch_dashboard" "main":
│  473:     sqs_queue_name          = aws_sqs_queue.scraping_queue.name
│
│ A managed resource "aws_sqs_queue" "scraping_queue" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 474, in resource "aws_cloudwatch_dashboard" "main":
│  474:     dynamodb_table_name     = aws_dynamodb_table.main.name
│
│ A managed resource "aws_dynamodb_table" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 475, in resource "aws_cloudwatch_dashboard" "main":
│  475:     opensearch_domain_name  = aws_opensearch_domain.main.domain_name
│
│ A managed resource "aws_opensearch_domain" "main" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 476, in resource "aws_cloudwatch_dashboard" "main":
│  476:     ecs_service_name        = aws_ecs_service.scraper.name
│
│ A managed resource "aws_ecs_service" "scraper" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 477, in resource "aws_cloudwatch_dashboard" "main":
│  477:     ecs_cluster_name        = aws_ecs_cluster.main.name
│
│ A managed resource "aws_ecs_cluster" "main" has not been declared in module.observability.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\10-Observability\main.tf line 595, in resource "aws_cloudwatch_event_target" "config_compliance_lambda":
│  595:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 599, in resource "aws_cloudwatch_event_target" "config_compliance_lambda":
│  599:   arn       = aws_lambda_function.config_compliance_processor[0].arn
│
│ A managed resource "aws_lambda_function" "config_compliance_processor" has not been declared in module.observability.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\10-Observability\main.tf line 604, in resource "aws_lambda_permission" "config_compliance_eventbridge":
│  604:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\10-Observability\main.tf line 608, in resource "aws_lambda_permission" "config_compliance_eventbridge":
│  608:   function_name = aws_lambda_function.config_compliance_processor[0].function_name
│
│ A managed resource "aws_lambda_function" "config_compliance_processor" has not been declared in module.observability.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 8, in resource "aws_lambda_function" "discover_studios":
│    8:   role          = aws_iam_role.discover_studios_role.arn
│
│ A managed resource "aws_iam_role" "discover_studios_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 20, in resource "aws_lambda_function" "discover_studios":
│   20:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 22, in resource "aws_lambda_function" "discover_studios":
│   22:     security_group_ids = [aws_security_group.main["lambda_internet"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 31, in resource "aws_lambda_function" "discover_studios":
│   31:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 49, in resource "aws_lambda_function" "find_artists":
│   49:   role          = aws_iam_role.find_artists_on_site_role.arn
│
│ A managed resource "aws_iam_role" "find_artists_on_site_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 61, in resource "aws_lambda_function" "find_artists":
│   61:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 63, in resource "aws_lambda_function" "find_artists":
│   63:     security_group_ids = [aws_security_group.main["lambda_internet"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 72, in resource "aws_lambda_function" "find_artists":
│   72:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 90, in resource "aws_lambda_function" "queue_scraping":
│   90:   role          = aws_iam_role.queue_scraping_role.arn
│
│ A managed resource "aws_iam_role" "queue_scraping_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 102, in resource "aws_lambda_function" "queue_scraping":
│  102:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 104, in resource "aws_lambda_function" "queue_scraping":
│  104:     security_group_ids = [aws_security_group.main["lambda_internal"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 111, in resource "aws_lambda_function" "queue_scraping":
│  111:       SQS_QUEUE_URL = aws_sqs_queue.scraping_queue.url
│
│ A managed resource "aws_sqs_queue" "scraping_queue" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 115, in resource "aws_lambda_function" "queue_scraping":
│  115:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 133, in resource "aws_lambda_function" "api_handler":
│  133:   role          = aws_iam_role.lambda_api_role.arn
│
│ A managed resource "aws_iam_role" "lambda_api_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 145, in resource "aws_lambda_function" "api_handler":
│  145:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 147, in resource "aws_lambda_function" "api_handler":
│  147:     security_group_ids = [aws_security_group.main["lambda_internal"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 154, in resource "aws_lambda_function" "api_handler":
│  154:       DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
│
│ A managed resource "aws_dynamodb_table" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 155, in resource "aws_lambda_function" "api_handler":
│  155:       OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
│
│ A managed resource "aws_opensearch_domain" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 159, in resource "aws_lambda_function" "api_handler":
│  159:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 166, in resource "aws_lambda_function" "api_handler":
│  166:     aws_iam_role_policy_attachment.lambda_api_policy_attachment,
│
│ A managed resource "aws_iam_role_policy_attachment" "lambda_api_policy_attachment" has not been declared in module.lambda_functions.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 232, in resource "aws_sqs_queue" "config_compliance_dlq":
│  232:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 236, in resource "aws_sqs_queue" "config_compliance_dlq":
│  236:   kms_master_key_id         = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 250, in resource "aws_lambda_function" "dynamodb_sync":
│  250:   role          = aws_iam_role.lambda_sync_role.arn
│
│ A managed resource "aws_iam_role" "lambda_sync_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 264, in resource "aws_lambda_function" "dynamodb_sync":
│  264:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 266, in resource "aws_lambda_function" "dynamodb_sync":
│  266:     security_group_ids = [aws_security_group.main["lambda_internal"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 272, in resource "aws_lambda_function" "dynamodb_sync":
│  272:       OPENSEARCH_ENDPOINT = aws_opensearch_domain.main.endpoint
│
│ A managed resource "aws_opensearch_domain" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 275, in resource "aws_lambda_function" "dynamodb_sync":
│  275:       APP_SECRETS_ARN     = aws_secretsmanager_secret.app_secrets.arn
│
│ A managed resource "aws_secretsmanager_secret" "app_secrets" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 280, in resource "aws_lambda_function" "dynamodb_sync":
│  280:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 289, in resource "aws_lambda_function" "dynamodb_sync":
│  289:     aws_iam_role_policy_attachment.lambda_sync_policy_attachment,
│
│ A managed resource "aws_iam_role_policy_attachment" "lambda_sync_policy_attachment" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 328, in resource "aws_sqs_queue" "lambda_sync_dlq":
│  328:   kms_master_key_id         = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 347, in resource "aws_lambda_function" "secret_rotation":
│  347:   role            = aws_iam_role.secret_rotation_role.arn
│
│ A managed resource "aws_iam_role" "secret_rotation_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 355, in resource "aws_lambda_function" "secret_rotation":
│  355:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 358, in resource "aws_lambda_function" "secret_rotation":
│  358:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 360, in resource "aws_lambda_function" "secret_rotation":
│  360:     security_group_ids = [aws_security_group.main["lambda_internal"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 365, in resource "aws_lambda_function" "secret_rotation":
│  365:       OPENSEARCH_DOMAIN_NAME = aws_opensearch_domain.main.domain_name
│
│ A managed resource "aws_opensearch_domain" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 374, in resource "aws_lambda_function" "secret_rotation":
│  374:     aws_iam_role_policy_attachment.secret_rotation_policy_attachment,
│
│ A managed resource "aws_iam_role_policy_attachment" "secret_rotation_policy_attachment" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 465, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  465:   role                           = aws_iam_role.rotate_nat_gateway_eip_role.arn
│
│ A managed resource "aws_iam_role" "rotate_nat_gateway_eip_role" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 478, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  478:       SNS_TOPIC_ARN         = aws_sns_topic.alerts.arn
│
│ A managed resource "aws_sns_topic" "alerts" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 483, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  483:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 486, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  486:     security_group_ids = [aws_security_group.main["lambda_internal"].id]
│
│ A managed resource "aws_security_group" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 490, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  490:   kms_key_arn = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.lambda_functions.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 497, in resource "aws_lambda_function" "rotate_nat_gateway_eip":
│  497:     aws_iam_role_policy_attachment.rotate_nat_gateway_eip_attachment,
│
│ A managed resource "aws_iam_role_policy_attachment" "rotate_nat_gateway_eip_attachment" has not been declared in module.lambda_functions.
╵
╷
│ Error: Unsupported attribute
│
│   on ..\..\modules\11-Lambda-Functions\main.tf line 570, in data "archive_file" "config_compliance_processor_zip":
│  570:   count = var.context.enable_advanced_monitoring ? 1 : 0
│     ├────────────────
│     │ var.context is a object
│
│ This object does not have an attribute named "enable_advanced_monitoring".
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 32, in resource "aws_opensearch_domain" "main":
│   32:     subnet_ids         = values(aws_subnet.private)[*].id
│
│ A managed resource "aws_subnet" "private" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 33, in resource "aws_opensearch_domain" "main":
│   33:     security_group_ids = [aws_security_group.opensearch.id]
│
│ A managed resource "aws_security_group" "opensearch" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 44, in resource "aws_opensearch_domain" "main":
│   44:     kms_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 68, in resource "aws_opensearch_domain" "main":
│   68:     cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_audit.arn
│
│ A managed resource "aws_cloudwatch_log_group" "opensearch_audit" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 116, in resource "aws_opensearch_domain" "main":
│  116:   depends_on = [aws_iam_service_linked_role.opensearch]
│
│ A managed resource "aws_iam_service_linked_role" "opensearch" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\main.tf line 130, in resource "aws_secretsmanager_secret_version" "opensearch_password":
│  130:   secret_id = aws_secretsmanager_secret.app_secrets.id
│
│ A managed resource "aws_secretsmanager_secret" "app_secrets" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\12-OpenSearch\outputs.tf line 27, in output "opensearch_master_password_secret_arn":
│   27:   value       = aws_secretsmanager_secret.app_secrets.arn
│
│ A managed resource "aws_secretsmanager_secret" "app_secrets" has not been declared in module.opensearch.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 7, in resource "aws_sns_topic" "s3_events":
│    7:   kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.storage.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 132, in resource "aws_s3_bucket_server_side_encryption_configuration" "main":
│  132:       kms_master_key_id = aws_kms_key.main.arn
│
│ A managed resource "aws_kms_key" "main" has not been declared in module.storage.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 216, in resource "aws_s3_bucket_server_side_encryption_configuration" "replica":
│  216:       kms_master_key_id = aws_kms_key.replica[0].arn
│
│ A managed resource "aws_kms_key" "replica" has not been declared in module.storage.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 305, in resource "aws_s3_bucket_policy" "frontend_policies":
│  305:             "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
│
│ A managed resource "aws_cloudfront_distribution" "frontend" has not been declared in module.storage.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 327, in resource "aws_s3_bucket_replication_configuration" "main":
│  327:   role     = aws_iam_role.s3_replication[0].arn
│
│ A managed resource "aws_iam_role" "s3_replication" has not been declared in module.storage.
╵
╷
│ Error: Reference to undeclared resource
│
│   on ..\..\modules\13-Storage\main.tf line 339, in resource "aws_s3_bucket_replication_configuration" "main":
│  339:         replica_kms_key_id = aws_kms_key.replica[0].arn
│
│ A managed resource "aws_kms_key" "replica" has not been declared in module.storage.
╵
PS C:\Users\legob\OneDrive\Documents\Kiro\Tattoo_MVP\infrastructure-new\environments\dev> 