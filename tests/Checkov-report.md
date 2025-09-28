Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.networking.aws_cloudwatch_log_group.vpc_flow_logs
        File: \modules\02-networking\main.tf:67-75
        Calling File: \environments\dev\main.tf:26-36
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                67 | resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
                68 |   name              = "/aws/vpc/flowlogs/${var.context.name_prefix}"
                69 |   retention_in_days = var.context.environment == "prod" ? 365 : 30
                70 |   kms_key_id        = var.kms_key_logs_arn
                71 |
                72 |   tags = merge(var.context.common_tags, {
                73 |     Name = "${var.context.name_prefix}-vpc-flow-logs"
                74 |   })
                75 | }

Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: aws_cloudwatch_log_group.waf
        File: \modules\03-Security\main.tf:73-81
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                73 | resource "aws_cloudwatch_log_group" "waf" {
                74 |   name              = "/aws/wafv2/${var.context.name_prefix}"                75 |   retention_in_days = var.context.environment == "prod" ? 90 : 30
                76 |   kms_key_id        = var.kms_key_logs_arn
                77 |
                78 |   tags = merge(var.context.common_tags, {
                79 |     Name = "${var.context.name_prefix}-waf-logs"
                80 |   })
                81 | }

Check: CKV_AWS_192: "Ensure WAF prevents message lookup in Log4j2. See CVE-2021-44228 aka log4jshell"
        FAILED for resource: aws_wafv2_web_acl.enhanced_frontend
        File: \modules\03-Security\main.tf:106-231
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-waf-prevents-message-lookup-in-log4j2

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.security.aws_cloudwatch_log_group.waf
        File: \modules\03-security\main.tf:73-81
        Calling File: \environments\dev\main.tf:43-51
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                73 | resource "aws_cloudwatch_log_group" "waf" {
                74 |   name              = "/aws/wafv2/${var.context.name_prefix}"                75 |   retention_in_days = var.context.environment == "prod" ? 90 : 30
                76 |   kms_key_id        = var.kms_key_logs_arn
                77 |
                78 |   tags = merge(var.context.common_tags, {
                79 |     Name = "${var.context.name_prefix}-waf-logs"
                80 |   })
                81 | }

Check: CKV_AWS_192: "Ensure WAF prevents message lookup in Log4j2. See CVE-2021-44228 aka log4jshell"
        FAILED for resource: module.security.aws_wafv2_web_acl.enhanced_frontend
        File: \modules\03-security\main.tf:106-231
        Calling File: \environments\dev\main.tf:43-51
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-waf-prevents-message-lookup-in-log4j2

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV_AWS_300: "Ensure S3 lifecycle configuration sets period for aborting failed uploads"
        FAILED for resource: module.storage.aws_s3_bucket_lifecycle_configuration.main
        File: \modules\04-storage\main.tf:191-219
        Calling File: \environments\dev\main.tf:58-71
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-300

                191 | resource "aws_s3_bucket_lifecycle_configuration" "main" {
                192 |   for_each = { for k, v in local.s3_buckets : k => v if length(v.lifecycle_rules) > 0 }
                193 |
                194 |   bucket = aws_s3_bucket.main[each.key].id
                195 |
                196 |   dynamic "rule" {
                197 |     for_each = each.value.lifecycle_rules
                198 |     content {
                199 |       id     = rule.value.id
                200 |       status = rule.value.status
                201 |
                202 |       dynamic "expiration" {
                203 |         for_each = lookup(rule.value, "expiration", null) != null ? [rule.value.expiration] : []
                204 |         content {
                205 |           days = expiration.value.days
                206 |         }
                207 |       }
                208 |
                209 |       dynamic "noncurrent_version_expiration" {
                210 |         for_each = lookup(rule.value, "noncurrent_version_expiration", null) != null ? [rule.value.noncurrent_version_expiration] : []
                211 |         content {
                212 |           noncurrent_days = noncurrent_version_expiration.value.noncurrent_days
                213 |         }
                214 |       }
                215 |     }
                216 |   }
                217 |
                218 |   depends_on = [aws_s3_bucket_versioning.main]
                219 | }

Check: CKV_AWS_28: "Ensure DynamoDB point in time recovery (backup) is enabled"
        FAILED for resource: module.storage.aws_dynamodb_table.main
        File: \modules\04-storage\main.tf:251-298
        Calling File: \environments\dev\main.tf:58-71
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/general-6

                251 | resource "aws_dynamodb_table" "main" {
                252 |   name           = "${var.context.name_prefix}-main"
                253 |   billing_mode   = "PAY_PER_REQUEST"
                254 |   hash_key       = "PK"
                255 |   range_key      = "SK"
                256 |
                257 |   attribute {
                258 |     name = "PK"
                259 |     type = "S"
                260 |   }
                261 |
                262 |   attribute {
                263 |     name = "SK"
                264 |     type = "S"
                265 |   }
                266 |
                267 |   attribute {
                268 |     name = "GSI1PK"
                269 |     type = "S"
                270 |   }
                271 |
                272 |   attribute {
                273 |     name = "GSI1SK"
                274 |     type = "S"
                275 |   }
                276 |
                277 |   global_secondary_index {
                278 |     name            = "GSI1"
                279 |     hash_key        = "GSI1PK"
                280 |     range_key       = "GSI1SK"
                281 |     projection_type = "ALL"
                282 |   }
                283 |
                284 |   server_side_encryption {
                285 |     enabled     = true
                286 |     kms_key_arn = var.kms_key_main_arn
                287 |   }
                288 |
                289 |   point_in_time_recovery {
                290 |     enabled = var.context.environment == "prod"
                291 |   }
                292 |
                293 |   deletion_protection_enabled = var.enable_deletion_protection
                294 |
                295 |   tags = merge(var.context.common_tags, {
                296 |     Name = "${var.context.name_prefix}-main-table"
                297 |   })
                298 | }

Check: CKV_AWS_28: "Ensure DynamoDB point in time recovery (backup) is enabled"
        FAILED for resource: module.storage.aws_dynamodb_table.denylist
        File: \modules\04-storage\main.tf:301-325
        Calling File: \environments\dev\main.tf:58-71
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/general-6

                301 | resource "aws_dynamodb_table" "denylist" {
                302 |   name         = "${var.context.name_prefix}-denylist"
                303 |   billing_mode = "PAY_PER_REQUEST"
                304 |   hash_key     = "id"
                305 |
                306 |   attribute {
                307 |     name = "id"
                308 |     type = "S"
                309 |   }
                310 |
                311 |   server_side_encryption {
                312 |     enabled     = true
                313 |     kms_key_arn = var.kms_key_main_arn
                314 |   }
                315 |
                316 |   point_in_time_recovery {
                317 |     enabled = var.context.environment == "prod"
                318 |   }
                319 |
                320 |   deletion_protection_enabled = var.enable_deletion_protection
                321 |
                322 |   tags = merge(var.context.common_tags, {
                323 |     Name = "${var.context.name_prefix}-denylist-table"
                324 |   })
                325 | }

Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.search.aws_cloudwatch_log_group.opensearch_audit
        File: \modules\05-search\main.tf:42-50
        Calling File: \environments\dev\main.tf:78-91
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                42 | resource "aws_cloudwatch_log_group" "opensearch_audit" {
                43 |   name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-audit"
                44 |   retention_in_days = var.context.log_retention_days
                45 |   kms_key_id        = var.kms_key_logs_arn
                46 |
                47 |   tags = merge(var.context.common_tags, {
                48 |     Name = "${var.context.name_prefix}-opensearch-audit-logs"                49 |   })
                50 | }

Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.search.aws_cloudwatch_log_group.opensearch_slow_search
        File: \modules\05-search\main.tf:52-60
        Calling File: \environments\dev\main.tf:78-91
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                52 | resource "aws_cloudwatch_log_group" "opensearch_slow_search" {
                53 |   name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-slow-search"
                54 |   retention_in_days = var.context.log_retention_days
                55 |   kms_key_id        = var.kms_key_logs_arn
                56 |
                57 |   tags = merge(var.context.common_tags, {
                58 |     Name = "${var.context.name_prefix}-opensearch-slow-search-logs"
                59 |   })
                60 | }

Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.search.aws_cloudwatch_log_group.opensearch_slow_index
        File: \modules\05-search\main.tf:62-70
        Calling File: \environments\dev\main.tf:78-91
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                62 | resource "aws_cloudwatch_log_group" "opensearch_slow_index" {                63 |   name              = "/aws/opensearch/domains/${var.context.name_prefix}-search-slow-index"
                64 |   retention_in_days = var.context.log_retention_days
                65 |   kms_key_id        = var.kms_key_logs_arn
                66 |
                67 |   tags = merge(var.context.common_tags, {
                68 |     Name = "${var.context.name_prefix}-opensearch-slow-index-logs"
                69 |   })
                70 | }

Check: CKV_AWS_318: "Ensure Elasticsearch domains are configured with at least three dedicated master nodes for HA"
        FAILED for resource: module.search.aws_opensearch_domain.main
        File: \modules\05-search\main.tf:76-187
        Calling File: \environments\dev\main.tf:78-91
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-318

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV_AWS_355: "Ensure no IAM policies documents allow "*" as a statement's resource for restrictable actions"
        FAILED for resource: module.iam.aws_iam_policy.step_functions
        File: \modules\06-iam\main.tf:455-501
        Calling File: \environments\dev\main.tf:98-112
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-355

                455 | resource "aws_iam_policy" "step_functions" {
                456 |   name        = "${var.context.name_prefix}-step-functions-policy"
                457 |   description = "Policy for Step Functions state machine"
                458 |
                459 |   policy = jsonencode({
                460 |     Version = "2012-10-17"
                461 |     Statement = [
                462 |       {
                463 |         Effect = "Allow"
                464 |         Action = [
                465 |           "lambda:InvokeFunction"
                466 |         ]
                467 |         Resource = [
                468 |           "${var.lambda_function_arns.discover_studios}:*",
                469 |           "${var.lambda_function_arns.find_artists}:*",
                470 |           "${var.lambda_function_arns.queue_scraping}:*",
                471 |           var.lambda_function_arns.discover_studios,
                472 |           var.lambda_function_arns.find_artists,
                473 |           var.lambda_function_arns.queue_scraping
                474 |         ]
                475 |       },
                476 |       {
                477 |         Effect = "Allow"
                478 |         Action = [
                479 |           "ecs:RunTask",
                480 |           "ecs:StopTask",
                481 |           "ecs:DescribeTasks"
                482 |         ]
                483 |         Resource = "*"
                484 |       },
                485 |       {
                486 |         Effect = "Allow"
                487 |         Action = [
                488 |           "iam:PassRole"
                489 |         ]
                490 |         Resource = [
                491 |           aws_iam_role.ecs_task_execution.arn,
                492 |           aws_iam_role.ecs_task.arn
                493 |         ]
                494 |       }
                495 |     ]
                496 |   })
                497 |
                498 |   tags = merge(var.context.common_tags, {
                499 |     Name = "${var.context.name_prefix}-step-functions-policy"
                500 |   })
                501 | }

Check: CKV_AWS_290: "Ensure IAM policies does not allow write access without constraints"
        FAILED for resource: module.iam.aws_iam_policy.step_functions
        File: \modules\06-iam\main.tf:455-501
        Calling File: \environments\dev\main.tf:98-112
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-290

                455 | resource "aws_iam_policy" "step_functions" {
                456 |   name        = "${var.context.name_prefix}-step-functions-policy"
                457 |   description = "Policy for Step Functions state machine"
                458 |
                459 |   policy = jsonencode({
                460 |     Version = "2012-10-17"
                461 |     Statement = [
                462 |       {
                463 |         Effect = "Allow"
                464 |         Action = [
                465 |           "lambda:InvokeFunction"
                466 |         ]
                467 |         Resource = [
                468 |           "${var.lambda_function_arns.discover_studios}:*",
                469 |           "${var.lambda_function_arns.find_artists}:*",
                470 |           "${var.lambda_function_arns.queue_scraping}:*",
                471 |           var.lambda_function_arns.discover_studios,
                472 |           var.lambda_function_arns.find_artists,
                473 |           var.lambda_function_arns.queue_scraping
                474 |         ]
                475 |       },
                476 |       {
                477 |         Effect = "Allow"
                478 |         Action = [
                479 |           "ecs:RunTask",
                480 |           "ecs:StopTask",
                481 |           "ecs:DescribeTasks"
                482 |         ]
                483 |         Resource = "*"
                484 |       },
                485 |       {
                486 |         Effect = "Allow"
                487 |         Action = [
                488 |           "iam:PassRole"
                489 |         ]
                490 |         Resource = [
                491 |           aws_iam_role.ecs_task_execution.arn,
                492 |           aws_iam_role.ecs_task.arn
                493 |         ]
                494 |       }
                495 |     ]
                496 |   })
                497 |
                498 |   tags = merge(var.context.common_tags, {
                499 |     Name = "${var.context.name_prefix}-step-functions-policy"
                500 |   })
                501 | }

Check: CKV_AWS_272: "Ensure AWS Lambda function is configured to validate code-signing"
        FAILED for resource: module.compute.aws_lambda_function.api_handler
        File: \modules\07-compute\main.tf:57-96
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-272

                57 | resource "aws_lambda_function" "api_handler" {
                58 |   # checkov:skip=CKV_AWS_116: DLQ is not required as the function is invoked synchronously by API Gateway. Errors are handled by the caller and monitored via CloudWatch Alarms.
                59 |   filename      = data.archive_file.api_handler_zip.output_path
                60 |   function_name = "${var.context.name_prefix}-api-handler"
                61 |   role          = var.lambda_api_role_arn
                62 |   handler       = "index.handler"
                63 |   runtime       = "nodejs20.x"
                64 |   architectures = ["arm64"]
                65 |   timeout       = 30
                66 |   memory_size   = var.lambda_memory_size
                67 |
                68 |   # Set a concurrency limit to protect against traffic spikes and ensure reliability
                69 |   reserved_concurrent_executions = var.context.environment == "prod" ? 100 : 10
                70 |
                71 |   vpc_config {
                72 |     subnet_ids         = var.private_subnet_ids
                73 |     # This function only communicates with DynamoDB and OpenSearch within the VPC.
                74 |     security_group_ids = [var.lambda_internal_security_group_id]
                75 |   }
                76 |
                77 |   environment {
                78 |     variables = merge(var.context.lambda_environment_vars, {
                79 |       DYNAMODB_TABLE_NAME = var.main_table_name
                80 |       OPENSEARCH_ENDPOINT = var.opensearch_endpoint
                81 |       APP_SECRETS_ARN     = var.app_secrets_arn
                82 |     })
                83 |   }
                84 |
                85 |   kms_key_arn = var.kms_key_main_arn
                86 |
                87 |   tracing_config {
                88 |     mode = "Active"
                89 |   }
                90 |
                91 |   source_code_hash = data.archive_file.api_handler_zip.output_base64sha256
                92 |
                93 |   tags = merge(var.context.common_tags, {
                94 |     Name = "${var.context.name_prefix}-api-handler"
                95 |   })
                96 | }

Check: CKV_AWS_272: "Ensure AWS Lambda function is configured to validate code-signing"
        FAILED for resource: module.compute.aws_lambda_function.dynamodb_sync
        File: \modules\07-compute\main.tf:99-138
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-272

                99  | resource "aws_lambda_function" "dynamodb_sync" {
                100 |   filename      = data.archive_file.dynamodb_sync_zip.output_path
                101 |   function_name = "${var.context.name_prefix}-dynamodb-sync"                102 |   role          = var.lambda_sync_role_arn
                103 |   handler       = "index.handler"
                104 |   runtime       = "nodejs20.x"
                105 |   architectures = ["arm64"]
                106 |   timeout       = 300
                107 |   memory_size   = var.lambda_memory_size
                108 |
                109 |   reserved_concurrent_executions = 5
                110 |
                111 |   vpc_config {
                112 |     subnet_ids         = var.private_subnet_ids
                113 |     security_group_ids = [var.lambda_internal_security_group_id]
                114 |   }
                115 |
                116 |   environment {
                117 |     variables = merge(var.context.lambda_environment_vars, {                118 |       OPENSEARCH_ENDPOINT = var.opensearch_endpoint
                119 |       APP_SECRETS_ARN     = var.app_secrets_arn
                120 |     })
                121 |   }
                122 |
                123 |   dead_letter_config {
                124 |     target_arn = aws_sqs_queue.lambda_sync_dlq.arn
                125 |   }
                126 |
                127 |   kms_key_arn = var.kms_key_main_arn
                128 |
                129 |   tracing_config {
                130 |     mode = "Active"
                131 |   }
                132 |
                133 |   source_code_hash = data.archive_file.dynamodb_sync_zip.output_base64sha256
                134 |
                135 |   tags = merge(var.context.common_tags, {
                136 |     Name = "${var.context.name_prefix}-dynamodb-sync"
                137 |   })
                138 | }

Check: CKV_AWS_272: "Ensure AWS Lambda function is configured to validate code-signing"
        FAILED for resource: module.compute.aws_lambda_function.discover_studios
        File: \modules\07-compute\main.tf:141-173
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-272

                141 | resource "aws_lambda_function" "discover_studios" {
                142 |   filename      = data.archive_file.discover_studios_zip.output_path
                143 |   function_name = "${var.context.name_prefix}-discover-studios"
                144 |   role          = var.lambda_discover_studios_role_arn
                145 |   handler       = "index.handler"
                146 |   runtime       = "nodejs20.x"
                147 |   architectures = ["arm64"]
                148 |   timeout       = 300
                149 |   memory_size   = var.lambda_memory_size
                150 |
                151 |   reserved_concurrent_executions = 5
                152 |
                153 |   vpc_config {
                154 |     subnet_ids         = var.private_subnet_ids
                155 |     security_group_ids = [var.lambda_internet_security_group_id]
                156 |   }
                157 |
                158 |   environment {
                159 |     variables = var.context.lambda_environment_vars
                160 |   }
                161 |
                162 |   kms_key_arn = var.kms_key_main_arn
                163 |
                164 |   tracing_config {
                165 |     mode = "Active"
                166 |   }
                167 |
                168 |   source_code_hash = data.archive_file.discover_studios_zip.output_base64sha256
                169 |
                170 |   tags = merge(var.context.common_tags, {
                171 |     Name = "${var.context.name_prefix}-discover-studios"
                172 |   })
                173 | }

Check: CKV_AWS_116: "Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)"
        FAILED for resource: module.compute.aws_lambda_function.discover_studios
        File: \modules\07-compute\main.tf:141-173
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-that-aws-lambda-function-is-configured-for-a-dead-letter-queue-dlq

                141 | resource "aws_lambda_function" "discover_studios" {
                142 |   filename      = data.archive_file.discover_studios_zip.output_path
                143 |   function_name = "${var.context.name_prefix}-discover-studios"
                144 |   role          = var.lambda_discover_studios_role_arn
                145 |   handler       = "index.handler"
                146 |   runtime       = "nodejs20.x"
                147 |   architectures = ["arm64"]
                148 |   timeout       = 300
                149 |   memory_size   = var.lambda_memory_size
                150 |
                151 |   reserved_concurrent_executions = 5
                152 |
                153 |   vpc_config {
                154 |     subnet_ids         = var.private_subnet_ids
                155 |     security_group_ids = [var.lambda_internet_security_group_id]
                156 |   }
                157 |
                158 |   environment {
                159 |     variables = var.context.lambda_environment_vars
                160 |   }
                161 |
                162 |   kms_key_arn = var.kms_key_main_arn
                163 |
                164 |   tracing_config {
                165 |     mode = "Active"
                166 |   }
                167 |
                168 |   source_code_hash = data.archive_file.discover_studios_zip.output_base64sha256
                169 |
                170 |   tags = merge(var.context.common_tags, {
                171 |     Name = "${var.context.name_prefix}-discover-studios"
                172 |   })
                173 | }

Check: CKV_AWS_272: "Ensure AWS Lambda function is configured to validate code-signing"
        FAILED for resource: module.compute.aws_lambda_function.find_artists
        File: \modules\07-compute\main.tf:176-208
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-272

                176 | resource "aws_lambda_function" "find_artists" {
                177 |   filename      = data.archive_file.find_artists_zip.output_path
                178 |   function_name = "${var.context.name_prefix}-find-artists"
                179 |   role          = var.lambda_find_artists_role_arn
                180 |   handler       = "index.handler"
                181 |   runtime       = "nodejs20.x"
                182 |   architectures = ["arm64"]
                183 |   timeout       = 300
                184 |   memory_size   = var.lambda_memory_size
                185 |
                186 |   reserved_concurrent_executions = 5
                187 |
                188 |   vpc_config {
                189 |     subnet_ids         = var.private_subnet_ids
                190 |     security_group_ids = [var.lambda_internet_security_group_id]
                191 |   }
                192 |
                193 |   environment {
                194 |     variables = var.context.lambda_environment_vars
                195 |   }
                196 |
                197 |   kms_key_arn = var.kms_key_main_arn
                198 |
                199 |   tracing_config {
                200 |     mode = "Active"
                201 |   }
                202 |
                203 |   source_code_hash = data.archive_file.find_artists_zip.output_base64sha256
                204 |
                205 |   tags = merge(var.context.common_tags, {
                206 |     Name = "${var.context.name_prefix}-find-artists"
                207 |   })
                208 | }

Check: CKV_AWS_116: "Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)"
        FAILED for resource: module.compute.aws_lambda_function.find_artists
        File: \modules\07-compute\main.tf:176-208
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-that-aws-lambda-function-is-configured-for-a-dead-letter-queue-dlq

                176 | resource "aws_lambda_function" "find_artists" {
                177 |   filename      = data.archive_file.find_artists_zip.output_path
                178 |   function_name = "${var.context.name_prefix}-find-artists"
                179 |   role          = var.lambda_find_artists_role_arn
                180 |   handler       = "index.handler"
                181 |   runtime       = "nodejs20.x"
                182 |   architectures = ["arm64"]
                183 |   timeout       = 300
                184 |   memory_size   = var.lambda_memory_size
                185 |
                186 |   reserved_concurrent_executions = 5
                187 |
                188 |   vpc_config {
                189 |     subnet_ids         = var.private_subnet_ids
                190 |     security_group_ids = [var.lambda_internet_security_group_id]
                191 |   }
                192 |
                193 |   environment {
                194 |     variables = var.context.lambda_environment_vars
                195 |   }
                196 |
                197 |   kms_key_arn = var.kms_key_main_arn
                198 |
                199 |   tracing_config {
                200 |     mode = "Active"
                201 |   }
                202 |
                203 |   source_code_hash = data.archive_file.find_artists_zip.output_base64sha256
                204 |
                205 |   tags = merge(var.context.common_tags, {
                206 |     Name = "${var.context.name_prefix}-find-artists"
                207 |   })
                208 | }

Check: CKV_AWS_272: "Ensure AWS Lambda function is configured to validate code-signing"
        FAILED for resource: module.compute.aws_lambda_function.queue_scraping
        File: \modules\07-compute\main.tf:211-245
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-272

                211 | resource "aws_lambda_function" "queue_scraping" {
                212 |   filename      = data.archive_file.queue_scraping_zip.output_path
                213 |   function_name = "${var.context.name_prefix}-queue-scraping"
                214 |   role          = var.lambda_queue_scraping_role_arn
                215 |   handler       = "index.handler"
                216 |   runtime       = "nodejs20.x"
                217 |   architectures = ["arm64"]
                218 |   timeout       = 300
                219 |   memory_size   = var.lambda_memory_size
                220 |
                221 |   reserved_concurrent_executions = 5
                222 |
                223 |   vpc_config {
                224 |     subnet_ids         = var.private_subnet_ids
                225 |     security_group_ids = [var.lambda_internal_security_group_id]
                226 |   }
                227 |
                228 |   environment {
                229 |     variables = merge(var.context.lambda_environment_vars, {                230 |       SQS_QUEUE_URL = aws_sqs_queue.scraping_queue.url
                231 |     })
                232 |   }
                233 |
                234 |   kms_key_arn = var.kms_key_main_arn
                235 |
                236 |   tracing_config {
                237 |     mode = "Active"
                238 |   }
                239 |
                240 |   source_code_hash = data.archive_file.queue_scraping_zip.output_base64sha256
                241 |
                242 |   tags = merge(var.context.common_tags, {
                243 |     Name = "${var.context.name_prefix}-queue-scraping"
                244 |   })
                245 | }

Check: CKV_AWS_116: "Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)"
        FAILED for resource: module.compute.aws_lambda_function.queue_scraping
        File: \modules\07-compute\main.tf:211-245
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-that-aws-lambda-function-is-configured-for-a-dead-letter-queue-dlq

                211 | resource "aws_lambda_function" "queue_scraping" {
                212 |   filename      = data.archive_file.queue_scraping_zip.output_path
                213 |   function_name = "${var.context.name_prefix}-queue-scraping"
                214 |   role          = var.lambda_queue_scraping_role_arn
                215 |   handler       = "index.handler"
                216 |   runtime       = "nodejs20.x"
                217 |   architectures = ["arm64"]
                218 |   timeout       = 300
                219 |   memory_size   = var.lambda_memory_size
                220 |
                221 |   reserved_concurrent_executions = 5
                222 |
                223 |   vpc_config {
                224 |     subnet_ids         = var.private_subnet_ids
                225 |     security_group_ids = [var.lambda_internal_security_group_id]
                226 |   }
                227 |
                228 |   environment {
                229 |     variables = merge(var.context.lambda_environment_vars, {                230 |       SQS_QUEUE_URL = aws_sqs_queue.scraping_queue.url
                231 |     })
                232 |   }
                233 |
                234 |   kms_key_arn = var.kms_key_main_arn
                235 |
                236 |   tracing_config {
                237 |     mode = "Active"
                238 |   }
                239 |
                240 |   source_code_hash = data.archive_file.queue_scraping_zip.output_base64sha256
                241 |
                242 |   tags = merge(var.context.common_tags, {
                243 |     Name = "${var.context.name_prefix}-queue-scraping"
                244 |   })
                245 | }

Check: CKV_AWS_336: "Ensure ECS containers are limited to read-only access to root filesystems"
        FAILED for resource: module.compute.aws_ecs_task_definition.scraper
        File: \modules\07-compute\main.tf:342-394
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-336

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV_AWS_309: "Ensure API GatewayV2 routes specify an authorization type"
        FAILED for resource: module.api.aws_apigatewayv2_route.proxy
        File: \modules\08-api\main.tf:128-133
        Calling File: \environments\dev\main.tf:153-163
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-309

                128 | resource "aws_apigatewayv2_route" "proxy" {
                129 |   api_id = aws_apigatewayv2_api.main.id
                130 |
                131 |   route_key = "ANY /{proxy+}"
                132 |   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
                133 | }

Check: CKV_AWS_309: "Ensure API GatewayV2 routes specify an authorization type"
        FAILED for resource: module.api.aws_apigatewayv2_route.health
        File: \modules\08-api\main.tf:136-141
        Calling File: \environments\dev\main.tf:153-163
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-309

                136 | resource "aws_apigatewayv2_route" "health" {
                137 |   api_id = aws_apigatewayv2_api.main.id
                138 |
                139 |   route_key = "GET /health"
                140 |   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
                141 | }

Check: CKV_AWS_309: "Ensure API GatewayV2 routes specify an authorization type"
        FAILED for resource: module.api.aws_apigatewayv2_route.artists
        File: \modules\08-api\main.tf:144-149
        Calling File: \environments\dev\main.tf:153-163
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-309

                144 | resource "aws_apigatewayv2_route" "artists" {
                145 |   api_id = aws_apigatewayv2_api.main.id
                146 |
                147 |   route_key = "GET /artists"
                148 |   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
                149 | }

Check: CKV_AWS_309: "Ensure API GatewayV2 routes specify an authorization type"
        FAILED for resource: module.api.aws_apigatewayv2_route.artist_by_id
        File: \modules\08-api\main.tf:151-156
        Calling File: \environments\dev\main.tf:153-163
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-309

                151 | resource "aws_apigatewayv2_route" "artist_by_id" {
                152 |   api_id = aws_apigatewayv2_api.main.id
                153 |
                154 |   route_key = "GET /artists/{id}"
                155 |   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
                156 | }

Check: CKV_AWS_309: "Ensure API GatewayV2 routes specify an authorization type"
        FAILED for resource: module.api.aws_apigatewayv2_route.search
        File: \modules\08-api\main.tf:159-164
        Calling File: \environments\dev\main.tf:153-163
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-309

                159 | resource "aws_apigatewayv2_route" "search" {
                160 |   api_id = aws_apigatewayv2_api.main.id
                161 |
                162 |   route_key = "GET /search"
                163 |   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
                164 | }

Check: CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
        FAILED for resource: module.monitoring.aws_cloudwatch_log_group.operational
        File: \modules\09-monitoring\main.tf:49-59
        Calling File: \environments\dev\main.tf:170-183
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-338

                49 | resource "aws_cloudwatch_log_group" "operational" {
                50 |   for_each = local.log_groups_operational
                51 |
                52 |   name              = each.value
                53 |   retention_in_days = var.context.environment == "prod" ? 365 : 90
                54 |   kms_key_id        = var.kms_key_logs_arn
                55 |
                56 |   tags = merge(var.context.common_tags, {
                57 |     Name = "${var.context.name_prefix}-${each.key}-logs"
                58 |   })
                59 | }

Check: CKV2_AWS_64: "Ensure KMS key Policy is defined"
        FAILED for resource: module.foundation.aws_kms_key.replica
        File: \main.tf:130-142
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-iam-policies/bc-aws-2-64

                130 | resource "aws_kms_key" "replica" {
                131 |   count = var.context.enable_cross_region_replication ? 1 : 0
                132 |
                133 |   provider = aws.replica
                134 |
                135 |   description             = "Replica KMS key for ${var.context.name_prefix}"
                136 |   deletion_window_in_days = var.context.environment == "prod" ? 30 : 7
                137 |   enable_key_rotation     = true
                138 |
                139 |   tags = merge(var.context.common_tags, {
                140 |     Name = "${var.context.name_prefix}-replica-key"
                141 |   })
                142 | }

Check: CKV2_AWS_62: "Ensure S3 buckets should have event notifications enabled"
        FAILED for resource: module.storage.aws_s3_bucket.replica
        File: \main.tf:685-700
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-2-62

                685 | resource "aws_s3_bucket" "replica" {
                686 |   for_each = {
                687 |     for k, v in local.s3_buckets : k => v
                688 |     if v.is_replicated && var.context.enable_cross_region_replication
                689 |   }
                690 |
                691 |   provider = aws.replica
                692 |
                693 |   bucket        = "${var.context.name_prefix}-${each.key}-replica-${var.random_suffix}"
                694 |   force_destroy = lookup(each.value, "force_destroy", false)                695 |
                696 |   tags = merge(var.context.common_tags, {
                697 |     Name        = "${var.context.name_prefix}-${each.key}-replica"
                698 |     Description = "${each.value.description} (replica)"
                699 |   })
                700 | }

Check: CKV2_AWS_62: "Ensure S3 buckets should have event notifications enabled"
        FAILED for resource: module.governance.aws_s3_bucket.cloudtrail
        File: \main.tf:164-170
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-2-62

                164 | resource "aws_s3_bucket" "cloudtrail" {
                165 |   bucket = "${var.context.name_prefix}-cloudtrail-${var.random_suffix}"
                166 |
                167 |   tags = merge(var.context.common_tags, {
                168 |     Name = "${var.context.name_prefix}-cloudtrail"
                169 |   })
                170 | }

Check: CKV2_AWS_3: "Ensure GuardDuty is enabled to specific org/region"
        FAILED for resource: aws_guardduty_detector.main
        File: \main.tf:238-262
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-guardduty-is-enabled-to-specific-orgregion

                238 | resource "aws_guardduty_detector" "main" {
                239 |   enable = true
                240 |
                241 |   datasources {
                242 |     s3_logs {
                243 |       enable = true
                244 |     }
                245 |     kubernetes {
                246 |       audit_logs {
                247 |         enable = false # Not using EKS
                248 |       }
                249 |     }
                250 |     malware_protection {
                251 |       scan_ec2_instance_with_findings {
                252 |         ebs_volumes {
                253 |           enable = false # Not using EC2
                254 |         }
                255 |       }
                256 |     }
                257 |   }
                258 |
                259 |   tags = merge(var.context.common_tags, {
                260 |     Name = "${var.context.name_prefix}-guardduty-detector"
                261 |   })
                262 | }
Check: CKV2_AWS_3: "Ensure GuardDuty is enabled to specific org/region"
        FAILED for resource: module.security.aws_guardduty_detector.main
        File: \main.tf:238-262
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-guardduty-is-enabled-to-specific-orgregion

                238 | resource "aws_guardduty_detector" "main" {
                239 |   enable = true
                240 |
                241 |   datasources {
                242 |     s3_logs {
                243 |       enable = true
                244 |     }
                245 |     kubernetes {
                246 |       audit_logs {
                247 |         enable = false # Not using EKS
                248 |       }
                249 |     }
                250 |     malware_protection {
                251 |       scan_ec2_instance_with_findings {
                252 |         ebs_volumes {
                253 |           enable = false # Not using EC2
                254 |         }
                255 |       }
                256 |     }
                257 |   }
                258 |
                259 |   tags = merge(var.context.common_tags, {
                260 |     Name = "${var.context.name_prefix}-guardduty-detector"
                261 |   })
                262 | }
Check: CKV2_AWS_59: "Ensure ElasticSearch/OpenSearch has dedicated master node enabled"
        FAILED for resource: module.search.aws_opensearch_domain.main
        File: \main.tf:76-187
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-2-59

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV2_AWS_57: "Ensure Secrets Manager secrets should have automatic rotation enabled"
        FAILED for resource: aws_secretsmanager_secret.app_secrets
        File: \main.tf:14-23
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-2-57

                14 | resource "aws_secretsmanager_secret" "app_secrets" {
                15 |   name                    = "${var.context.name_prefix}-app-secrets"
                16 |   description             = "Application secrets for ${var.context.project_name}"
                17 |   kms_key_id              = var.kms_key_main_arn
                18 |   recovery_window_in_days = var.context.environment == "prod" ? 30 : 0
                19 |
                20 |   tags = merge(var.context.common_tags, {
                21 |     Name = "${var.context.name_prefix}-app-secrets"
                22 |   })
                23 | }

Check: CKV2_AWS_57: "Ensure Secrets Manager secrets should have automatic rotation enabled"
        FAILED for resource: aws_secretsmanager_secret.opensearch_master
        File: \main.tf:43-52
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-2-57

                43 | resource "aws_secretsmanager_secret" "opensearch_master" {
                44 |   name                    = "${var.context.name_prefix}-opensearch-master"
                45 |   description             = "OpenSearch master user credentials"
                46 |   kms_key_id              = var.kms_key_main_arn
                47 |   recovery_window_in_days = var.context.environment == "prod" ? 30 : 0
                48 |
                49 |   tags = merge(var.context.common_tags, {
                50 |     Name = "${var.context.name_prefix}-opensearch-master"
                51 |   })
                52 | }

Check: CKV2_AWS_57: "Ensure Secrets Manager secrets should have automatic rotation enabled"
        FAILED for resource: module.security.aws_secretsmanager_secret.app_secrets        File: \main.tf:14-23
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-2-57

                14 | resource "aws_secretsmanager_secret" "app_secrets" {
                15 |   name                    = "${var.context.name_prefix}-app-secrets"
                16 |   description             = "Application secrets for ${var.context.project_name}"
                17 |   kms_key_id              = var.kms_key_main_arn
                18 |   recovery_window_in_days = var.context.environment == "prod" ? 30 : 0
                19 |
                20 |   tags = merge(var.context.common_tags, {
                21 |     Name = "${var.context.name_prefix}-app-secrets"
                22 |   })
                23 | }

Check: CKV2_AWS_57: "Ensure Secrets Manager secrets should have automatic rotation enabled"
        FAILED for resource: module.security.aws_secretsmanager_secret.opensearch_master
        File: \main.tf:43-52
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-2-57

                43 | resource "aws_secretsmanager_secret" "opensearch_master" {
                44 |   name                    = "${var.context.name_prefix}-opensearch-master"
                45 |   description             = "OpenSearch master user credentials"
                46 |   kms_key_id              = var.kms_key_main_arn
                47 |   recovery_window_in_days = var.context.environment == "prod" ? 30 : 0
                48 |
                49 |   tags = merge(var.context.common_tags, {
                50 |     Name = "${var.context.name_prefix}-opensearch-master"
                51 |   })
                52 | }

Check: CKV2_AWS_5: "Ensure that Security Groups are attached to another resource"
        FAILED for resource: module.networking.aws_security_group.main["fargate"]
        File: \main.tf:286-296
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-security-groups-are-attached-to-ec2-instances-or-elastic-network-interfaces-enis

                286 | resource "aws_security_group" "main" {
                287 |   for_each = local.security_groups
                288 |
                289 |   name        = "${var.context.name_prefix}-${each.key}-sg"
                290 |   description = each.value
                291 |   vpc_id      = aws_vpc.main.id
                292 |
                293 |   tags = merge(var.context.common_tags, {
                294 |     Name = "${var.context.name_prefix}-${replace(each.key, "_", "-")}-sg"
                295 |   })
                296 | }

Check: CKV2_AWS_5: "Ensure that Security Groups are attached to another resource"
        FAILED for resource: module.networking.aws_security_group.main["lambda_internal"]
        File: \main.tf:286-296
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-security-groups-are-attached-to-ec2-instances-or-elastic-network-interfaces-enis

                286 | resource "aws_security_group" "main" {
                287 |   for_each = local.security_groups
                288 |
                289 |   name        = "${var.context.name_prefix}-${each.key}-sg"
                290 |   description = each.value
                291 |   vpc_id      = aws_vpc.main.id
                292 |
                293 |   tags = merge(var.context.common_tags, {
                294 |     Name = "${var.context.name_prefix}-${replace(each.key, "_", "-")}-sg"
                295 |   })
                296 | }

Check: CKV2_AWS_5: "Ensure that Security Groups are attached to another resource"
        FAILED for resource: module.networking.aws_security_group.main["lambda_internet"]
        File: \main.tf:286-296
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-security-groups-are-attached-to-ec2-instances-or-elastic-network-interfaces-enis

                286 | resource "aws_security_group" "main" {
                287 |   for_each = local.security_groups
                288 |
                289 |   name        = "${var.context.name_prefix}-${each.key}-sg"
                290 |   description = each.value
                291 |   vpc_id      = aws_vpc.main.id
                292 |
                293 |   tags = merge(var.context.common_tags, {
                294 |     Name = "${var.context.name_prefix}-${replace(each.key, "_", "-")}-sg"
                295 |   })
                296 | }

Check: CKV2_AWS_5: "Ensure that Security Groups are attached to another resource"
        FAILED for resource: module.networking.aws_security_group.main["opensearch"]
        File: \main.tf:286-296
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-security-groups-are-attached-to-ec2-instances-or-elastic-network-interfaces-enis

                286 | resource "aws_security_group" "main" {
                287 |   for_each = local.security_groups
                288 |
                289 |   name        = "${var.context.name_prefix}-${each.key}-sg"
                290 |   description = each.value
                291 |   vpc_id      = aws_vpc.main.id
                292 |
                293 |   tags = merge(var.context.common_tags, {
                294 |     Name = "${var.context.name_prefix}-${replace(each.key, "_", "-")}-sg"
                295 |   })
                296 | }

Check: CKV2_AWS_19: "Ensure that all EIP addresses allocated to a VPC are attached to EC2 instances"
        FAILED for resource: module.networking.aws_eip.nat["a"]
        File: \main.tf:187-197
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-all-eip-addresses-allocated-to-a-vpc-are-attached-to-ec2-instances

                187 | resource "aws_eip" "nat" {
                188 |   for_each = var.context.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones[keys(local.availability_zones)[0]] }
                189 |
                190 |   domain = "vpc"
                191 |
                192 |   tags = merge(var.context.common_tags, {
                193 |     Name = "${var.context.name_prefix}-nat-eip-${each.key}"
                194 |   })
                195 |
                196 |   depends_on = [aws_internet_gateway.main]
                197 | }

Check: CKV2_AWS_1: "Ensure that all NACL are attached to subnets"
        FAILED for resource: module.networking.aws_network_acl.private
        File: \main.tf:491-558
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-all-nacl-are-attached-to-subnets

                Code lines for this resource are too many. Please use IDE of your choice to review the file.
Check: CKV2_AWS_61: "Ensure that an S3 bucket has a lifecycle configuration"
        FAILED for resource: module.storage.aws_s3_bucket.replica
        File: \main.tf:685-700
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-2-61

                685 | resource "aws_s3_bucket" "replica" {
                686 |   for_each = {
                687 |     for k, v in local.s3_buckets : k => v
                688 |     if v.is_replicated && var.context.enable_cross_region_replication
                689 |   }
                690 |
                691 |   provider = aws.replica
                692 |
                693 |   bucket        = "${var.context.name_prefix}-${each.key}-replica-${var.random_suffix}"
                694 |   force_destroy = lookup(each.value, "force_destroy", false)                695 |
                696 |   tags = merge(var.context.common_tags, {
                697 |     Name        = "${var.context.name_prefix}-${each.key}-replica"
                698 |     Description = "${each.value.description} (replica)"
                699 |   })
                700 | }

Check: CKV2_AWS_61: "Ensure that an S3 bucket has a lifecycle configuration"
        FAILED for resource: module.governance.aws_s3_bucket.cloudtrail
        File: \main.tf:164-170
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-logging-policies/bc-aws-2-61

                164 | resource "aws_s3_bucket" "cloudtrail" {
                165 |   bucket = "${var.context.name_prefix}-cloudtrail-${var.random_suffix}"
                166 |
                167 |   tags = merge(var.context.common_tags, {
                168 |     Name = "${var.context.name_prefix}-cloudtrail"
                169 |   })
                170 | }

Check: CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
        FAILED for resource: module.storage.aws_s3_bucket.replica
        File: \main.tf:685-700
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/s3-policies/s3-13-enable-logging

                685 | resource "aws_s3_bucket" "replica" {
                686 |   for_each = {
                687 |     for k, v in local.s3_buckets : k => v
                688 |     if v.is_replicated && var.context.enable_cross_region_replication
                689 |   }
                690 |
                691 |   provider = aws.replica
                692 |
                693 |   bucket        = "${var.context.name_prefix}-${each.key}-replica-${var.random_suffix}"
                694 |   force_destroy = lookup(each.value, "force_destroy", false)                695 |
                696 |   tags = merge(var.context.common_tags, {
                697 |     Name        = "${var.context.name_prefix}-${each.key}-replica"
                698 |     Description = "${each.value.description} (replica)"
                699 |   })
                700 | }

Check: CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
        FAILED for resource: module.governance.aws_s3_bucket.cloudtrail
        File: \main.tf:164-170
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/s3-policies/s3-13-enable-logging

                164 | resource "aws_s3_bucket" "cloudtrail" {
                165 |   bucket = "${var.context.name_prefix}-cloudtrail-${var.random_suffix}"
                166 |
                167 |   tags = merge(var.context.common_tags, {
                168 |     Name = "${var.context.name_prefix}-cloudtrail"
                169 |   })
                170 | }

Check: CKV_AWS_144: "Ensure that S3 bucket has cross-region replication enabled"
        FAILED for resource: module.governance.aws_s3_bucket.cloudtrail
        File: \main.tf:164-170
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-that-s3-bucket-has-cross-region-replication-enabled

                164 | resource "aws_s3_bucket" "cloudtrail" {
                165 |   bucket = "${var.context.name_prefix}-cloudtrail-${var.random_suffix}"
                166 |
                167 |   tags = merge(var.context.common_tags, {
                168 |     Name = "${var.context.name_prefix}-cloudtrail"
                169 |   })
                170 | }

Check: CKV_AWS_116: "Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)"
        SKIPPED for resource: module.compute.aws_lambda_function.api_handler
        Suppress comment:  DLQ is not required as the function is invoked synchronously by API Gateway. Errors are handled by the caller and monitored via CloudWatch Alarms.
        File: \modules\07-compute\main.tf:57-96
        Calling File: \environments\dev\main.tf:119-146
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/ensure-that-aws-lambda-function-is-configured-for-a-dead-letter-queue-dlq
Check: CKV2_AWS_47: "Ensure AWS CloudFront attached WAFv2 WebACL is configured with AMR for Log4j Vulnerability"
        SKIPPED for resource: module.storage.aws_cloudfront_distribution.frontend
        Suppress comment:  Added exploit patch RuleSet.
        File: \main.tf:423-539
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-general-47
Check: CKV2_AWS_1: "Ensure that all NACL are attached to subnets"
        SKIPPED for resource: module.networking.aws_network_acl.public
        Suppress comment:  Attatched via aws_network_acl_association
        File: \main.tf:424-480
        Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-networking-policies/ensure-that-all-nacl-are-attached-to-subnets