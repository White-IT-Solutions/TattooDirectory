# Terraform Implementation Checklist (Revised)

## Module 1: Foundational Networking (VPC)
This module creates the secure network foundation for all other resources.

*   [ ] **VPC:** Create the main Virtual Private Cloud.
    *   `aws_vpc`
*   [ ] **Subnets:** Define public and private subnets across two Availability Zones for high availability, as per the network diagram (2.5.8).
    *   `aws_subnet` (x4: private-a, public-a, private-b, public-b)
*   [ ] **Internet Gateway (IGW):** Create and attach the IGW to the VPC to allow internet access for public subnets.
    *   `aws_internet_gateway`
*   [ ] **NAT Gateways:** Provision a NAT Gateway in each public subnet to allow outbound internet access for resources in the private subnets (like the Fargate scrapers).
    *   `aws_nat_gateway` (x2)
    *   `aws_eip` (x2, one for each NAT Gateway)
*   [ ] **Route Tables:**
    *   **Public Route Table:** Create a route table for public subnets with a default route (`0.0.0.0/0`) pointing to the Internet Gateway.
        *   `aws_route_table`
        *   `aws_route`
        *   `aws_route_table_association` (x2, for each public subnet)
    *   **Private Route Tables:** Create a route table for each private subnet with a default route pointing to the corresponding NAT Gateway in its AZ.
        *   `aws_route_table` (x2)
        *   `aws_route` (x2)
        *   `aws_route_table_association` (x2, for each private subnet)

## Module 2: Security & Identity (IAM & KMS)
This module defines the permissions and encryption keys needed across the application.

*   [ ] **KMS Keys:** Create customer-managed keys for encrypting data at rest, as required by the security pillar (4.2).
    *   `aws_kms_key` (e.g., for DynamoDB, S3, OpenSearch)
*   [ ] **IAM Roles & Policies:** Define least-privilege roles for each compute service.
    *   **Lambda API Role:** Permissions to query OpenSearch, read/write to DynamoDB, and write logs to CloudWatch.
        *   `aws_iam_role` & `aws_iam_policy`
    *   **Fargate Task Role:** Permissions to write to DynamoDB, read from SQS, and write logs.
        *   `aws_iam_role` & `aws_iam_policy`
    *   **DDB-to-OpenSearch Sync Lambda Role:** Permissions to read from DynamoDB Streams, write to the OpenSearch domain, and write logs.
        *   `aws_iam_role` & `aws_iam_policy`
*   [ ] **Secrets Manager:** Store sensitive information like third-party API keys.
    *   `aws_secretsmanager_secret`
*   [ ] **Security Groups:** Define firewall rules for components.
    *   **OpenSearch SG:** Allow inbound traffic only from the API Lambda and Sync Lambda Security Groups.
        *   `aws_security_group`
    *   **Fargate SG:** Allow outbound traffic on port 443 for scraping.
        *   `aws_security_group`
    *   **Lambda SG:** A security group for the VPC-enabled Lambda functions to control their outbound traffic to OpenSearch.
        *   `aws_security_group`

## Module 3: Frontend Hosting & Delivery (CloudFront & S3)
This module sets up the resources to host and serve the static frontend application.

*   [ ] **S3 Bucket:** Create a private S3 bucket to store the static web assets (HTML, CSS, JS) (3.4).
    *   `aws_s3_bucket`
*   [ ] **S3 Bucket Public Access Block:** Apply a block to prevent any public access to the bucket directly. This is the modern replacement for bucket ACLs.
    *   `aws_s3_bucket_public_access_block`
*   [ ] **CloudFront Origin Access Control (OAC):** Create an OAC to allow CloudFront to securely access the private S3 bucket.
    *   `aws_cloudfront_origin_access_control`
*   [ ] **S3 Bucket Policy:** Attach a policy to the S3 bucket that grants access only to the CloudFront OAC.
    *   `aws_s3_bucket_policy`
*   [ ] **CloudFront Distribution:** Create the CDN distribution to serve content from the S3 origin.
    *   `aws_cloudfront_distribution`
*   [ ] **WAF WebACL:** Define a Web Application Firewall with rules (e.g., AWS managed rules, rate-based rules) to protect the application (4.2).
    *   `aws_wafv2_web_acl`
*   [ ] **WAF Association:** Associate the WebACL with the CloudFront distribution.
    *   `aws_wafv2_web_acl_association`

## Module 4: Backend API (API Gateway & Lambda)
This module defines the user-facing, synchronous API.

*   [ ] **API Gateway:** Create an HTTP API or REST API to act as the front door for the backend (3.3).
    *   `aws_apigatewayv2_api` (for HTTP API)
*   [ ] **Lambda Functions:** Define the functions that contain the API business logic.
    *   `aws_lambda_function` (e.g., searchArtists, getArtistProfile)
*   [ ] **API Gateway Integrations & Routes:** Connect API Gateway routes (e.g., `GET /v1/artists`) to the appropriate Lambda functions.
    *   `aws_apigatewayv2_integration`
    *   `aws_apigatewayv2_route`
*   [ ] **Lambda Permissions:** Grant API Gateway permission to invoke the Lambda functions.
    *   `aws_lambda_permission`

## Module 5: Data & Search Layer (DynamoDB & OpenSearch)
This module creates the persistent storage and search capabilities.

*   [ ] **DynamoDB Table (Primary):** Define the single-table design with its partition key (PK) and sort key (SK) (2.5.9). Enable the KMS key for encryption and turn on DynamoDB Streams.
    *   `aws_dynamodb_table` (with `stream_enabled = true`)
*   [ ] **DynamoDB Table (Denylist):** Create the table to store artist IDs that have requested removal, as per the Data Governance policy (DPP 5.0).
    *   `aws_dynamodb_table`
*   [ ] **OpenSearch Domain:** Provision the OpenSearch cluster inside the private subnets of the VPC (3.5).
    *   `aws_opensearch_domain`
*   [ ] **DDB-to-OpenSearch Sync Lambda:** Create the Lambda function that will process the stream.
    *   `aws_lambda_function`
*   [ ] **Event Source Mapping:** Connect the DynamoDB Stream to the sync Lambda function, triggering it on database changes.
    *   `aws_lambda_event_source_mapping`

## Module 6: Data Aggregation Engine (Event-Driven Workflow)
This module defines the asynchronous backend process for populating the database.

*   [ ] **ECR Repository:** Create a repository to store the Docker image for the Fargate scraper task.
    *   `aws_ecr_repository`
*   [ ] **SQS Queue:** Create the queue to buffer scraping jobs for Fargate (3.16).
    *   `aws_sqs_queue`
*   [ ] **ECS Cluster:** Create the Fargate cluster.
    *   `aws_ecs_cluster`
*   [ ] **Fargate Task Definition:** Define the scraper container, including the image from ECR, CPU/memory, and the IAM Task Role (3.9).
    *   `aws_ecs_task_definition`
*   [ ] **Fargate Service:** Create the service to run and auto-scale the Fargate tasks based on the SQS queue depth.
    *   `aws_ecs_service`
*   [ ] **Step Functions State Machine:** Define the orchestration workflow (3.8).
    *   `aws_sfn_state_machine`
*   [ ] **EventBridge Rule:** Create the scheduled (cron) rule to trigger the Step Functions workflow daily (3.7). *Note: `aws_cloudwatch_event_rule` is the Terraform resource name for an EventBridge rule.*
    *   `aws_cloudwatch_event_rule`
    *   `aws_cloudwatch_event_target`

## Module 7: Observability & Alerting
This module sets up the necessary monitoring and notification resources.

*   [ ] **CloudWatch Log Groups:** While many are created implicitly, you can explicitly define them for retention policies.
    *   `aws_cloudwatch_log_group`
*   [ ] **SNS Topic:** Create a topic for high-priority alerts (6.1).
    *   `aws_sns_topic`
*   [ ] **CloudWatch Alarms:** Define alarms for key metrics (e.g., API 5xx errors, Lambda throttles, SQS queue depth).
    *   `aws_cloudwatch_metric_alarm`