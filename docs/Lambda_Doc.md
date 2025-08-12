# **`Requirements`**

## `Container Image Compatibility`

This is the primary technical requirement. A Docker image built for an x86 processor will not run on a Graviton (ARM64) processor.

- **Multi-Architecture Builds:** The best practice is to build a multi-architecture container image. This single image manifest contains layers for both linux/amd64 (x86) and linux/arm64. When you deploy, the container runtime (Fargate, in this case) automatically pulls the correct version for its underlying architecture. This gives you maximum flexibility.
- **Base Image:** You must ensure your Dockerfile starts from a base image that supports ARM64. Most official images (like node, python, amazonlinux) provide multi-architecture variants.
- **Dependencies:** Your application code itself (Node.js) is architecture-agnostic. However, if any of your npm packages include native C++ add-ons (e.g., some image processing or cryptography libraries), you must ensure they provide pre-compiled binaries for ARM64 or can be compiled for ARM64 during your build process. Your current dependencies (@opensearch-project/opensearch, @aws-sdk/\*) are pure JavaScript and fully compatible.

## `CI/CD Pipeline Adjustments`

Use docker buildx: This is the recommended approach.

- **buildx** is a Docker CLI plugin that can build for multiple platforms simultaneously, even on an x86 build agent (using QEMU for emulation). This is the easiest way to create a multi-architecture image.
- **Use a Native ARM Builder**: You can configure your CI/CD pipeline (e.g., in AWS CodeBuild or GitHub Actions) to use an ARM-based runner. This will build the ARM64 image natively, which is typically faster than using emulation.

This command builds for both architectures and pushes the resulting multi-arch image to your ECR repository:

`docker buildx build --platform linux/amd64,linux/arm64 \`  
 `-t ${aws_ecr_repository.scraper.repository_url}:${var.scraper_image_tag} \`  
 `--push \`  
 `.`

# **`Existing Codebase & PseudoCode`**

## **`api_handler.js`**

**Analysis:**

This is a solid API handler. It correctly uses a shared logger, caches clients for performance, and implements a Circuit Breaker for resilience. The main areas for improvement are refining the client initialization, making the search query dynamic, and enhancing error responses.

**Suggested Improvements:**

1. **Dynamic Search Query:** The current search is hardcoded to `match_all`. I'll update it to parse query string parameters from the API Gateway event, making the search functional.
2. **Refined Error Handling:** The error responses will be improved to provide more specific details when a search query is invalid.
3. **Client Initialization:** The `getOpenSearchClient` function can be simplified slightly to avoid re-declaring the `secretsManagerClient`.

This directory contains the core logic for the public-facing API.

**Note:** To use this code, you will need to add opossum and @opensearch-project/opensearch as dependencies in the package.json for the api_handler function.

- **`api_handler.js`** This is the main Lambda function that powers the API Gateway. Its key responsibilities are:
  - **Routing:** It acts as a simple router, handling `GET /v1/artists` requests.
  - **Search Logic:** It receives search requests and forwards them to an OpenSearch cluster to find artist data.
  - **Resilience:** It uses a Circuit Breaker (`opossum`) to wrap the OpenSearch client. If the search service becomes unresponsive, the circuit will "trip" and the Lambda will return a `503 Service Unavailable` message without repeatedly calling the failing service.
  - **Security:** It securely fetches the OpenSearch password from AWS Secrets Manager, caching the client for better performance on subsequent invocations.
  - **Logging:** It uses the shared custom logger (`../common/logger`) to produce structured, PII-redacted logs.
- **`api_handler_idempotency.js`** This file appears to be a separate or perhaps an earlier version of a handler focused on idempotency for `POST` requests. It ensures that if the same request is sent twice with the same `Idempotency-Key` header, it is only processed once. It achieves this by attempting to write the key to a DynamoDB table with a condition that fails if the key already exists. This prevents duplicate operations. It uses the older AWS SDK v2.

## **`api_handler_idempotency.js`**

**Analysis:**

This file contains standalone idempotency logic for `POST` requests. While the logic is sound, it has two key issues: it uses the older AWS SDK v2 and logs directly to `console.log`, bypassing the PII-scrubbing logger. It should be updated to use modern practices and be integrated into the main handler.

**Suggested Improvements:**

1. **Upgrade to AWS SDK v3:** I will rewrite the logic to use the modular `@aws-sdk/client-dynamodb`, which is consistent with the other modern handlers.
2. **Integrate Custom Logger:** Replace all `console.log` calls with the shared `logger` to ensure all output is structured and scrubbed of sensitive data.
3. **Consolidate Logic:** This file appears to be a separate, older handler. The best practice would be to merge this idempotency logic into `api_handler.js` as a utility function for `POST` routes, and then delete this file. For now, I will update it in place.

## **`common`**

This directory holds shared code used by multiple Lambda functions.

- **`logger.js`** This is a crucial shared utility for structured and secure logging. It defines a `scrub` function that recursively removes Personally Identifiable Information (PII) from log objects before they are written to CloudWatch Logs. It redacts sensitive keys like `artistName`, `email`, and `password`, replacing their values with `[REDACTED]`. This is a best practice for security and compliance.

## **`Config_compliance_processor.js`**

**Analysis:**

This function provides an excellent security control by monitoring AWS Config. It correctly identifies critical, non-compliant resources and sends an alert. The primary improvement is to modernize the code by upgrading from AWS SDK v2 to v3 and making the configuration more flexible.

**Suggested Improvements:**

1. **Upgrade to AWS SDK v3:** The code will be updated to use the `@aws-sdk/client-sns` package.
2. **Externalize Configuration:** The list of `criticalRules` is hardcoded. Making this configurable via an environment variable (e.g., a comma-separated string) would make the function more reusable and easier to manage without code changes.
3. **Robustness:** Add more checks to ensure nested properties in the event object exist before trying to access them, preventing potential runtime errors.

This function acts as an automated security and compliance guard.

- **`config_compliance_processor_index.js`** This Lambda is triggered by AWS Config, which monitors the configuration of your AWS resources. The function inspects compliance events and filters for `NON_COMPLIANT` findings related to a predefined list of critical security rules (e.g., public S3 buckets, unencrypted databases). If a critical violation is detected, it formats an alert and publishes it to an SNS topic to immediately notify administrators.

## **`Discover_studios.js`**

**Objective:** To query an external data source, like the Google Places API, to find an initial list of tattoo studios. This function acts as the starting point for the entire data pipeline.

**Analysis of Placeholders:**

- `discover_studios.js`: Uses a custom logger but returns hardcoded data.
- `discover_studios_index.js`: Returns hardcoded data without logging.

The real implementation should replace the hardcoded data with a live API call.

### Pseudocode for `discover_studios.js`

This pseudocode outlines how to securely call an external API and format the results for the next step in the workflow.

**`<See Codebase>`**

These files are part of the data ingestion pipeline, likely within a Step Functions workflow.

- **`discover_studios.js`** This is a placeholder function that would contain the logic to discover new tattoo studios, for example, by querying an external API like Google Maps. It uses the custom logger and returns a sample list of discovered items to be passed to the next step in the workflow.
- **`discover_studios_index.js`** This is a simpler version of the above, likely an older file or a different part of the workflow. It returns a hardcoded list of studios without any complex logic or custom logging. The presence of both files suggests one may be a refactored or newer version.

## **`Dynamodb_sync.js`**

**Analysis:**

This function is responsible for keeping the OpenSearch index synchronized with DynamoDB. It correctly handles different event types (`INSERT`, `MODIFY`, `REMOVE`). The main improvements are to cache the OpenSearch client itself (not just the password) and to use the shared logger from the `common` directory.

**Suggested Improvements:**

1. **Client Caching:** The current code caches the password but re-creates the OpenSearch client on every invocation. Caching the fully initialized client outside the handler will improve performance.
2. **Use Common Logger:** The function appears to be using a local logger (`require('./logger')`). This should be changed to use the centralized, PII-scrubbing logger from `../common/logger`.
3. **Error Handling:** The `catch` block logs the entire `record` object on error. While the custom logger should scrub this, it's good practice to be explicit about what is logged.

This function is responsible for keeping the search index and the main database synchronized.

- **`dynamodb_sync.js`** This function is a DynamoDB Stream processor. It is automatically invoked whenever items in the main artist table are created, updated, or deleted. It processes these change records and replicates them to the OpenSearch index, ensuring the search results are always up-to-date. It uses the secure custom logger and fetches credentials from Secrets Manager.
- **`dynamodb_sync_index.js`** This is another version of the DynamoDB sync logic. It uses the standard `console.log` instead of the custom logger and uses the older AWS SDK v2 syntax. `dynamodb_sync.js` appears to be the more mature and production-ready implementation.

## **`find_artists_on_site.js`**

**Objective:** To take a single studio's website URL, scrape the site, and identify a list of artists who work there, typically by finding their Instagram profile links. This function will be executed in parallel by a Step Functions Map state for each studio found previously, therefore is another step in the data ingestion pipeline.

**Analysis of Placeholder:**

- **`Find_artists_on_site_index.js:`** Currently this is a placeholder Lambda that simply returns a hardcoded list of artists based on the input `studioId`.
- In a production deployment it would be responsible for scraping a given studio's website to find the artists who work there. It takes a studio object as input and is expected to return a list of artist profiles found on that site.

The real implementation requires web scraping logic.

#### **Pseudocode for `find_artists_on_site_index.js`**

This pseudocode details how to perform a basic web scrape. It emphasizes resilience, ensuring that a single failed website doesn't halt the entire pipeline.

**`<See Codebase>`**

## **`misc`**

This directory contains logic that doesn't fit into a standard Lambda handler pattern.

**`Fargate_Scraper_Container_Logic.js`** This file contains the core application logic that runs inside the Fargate scraper containers. It's designed to process a single message from an SQS queue, perform the scraping task (logic is placeholder), and then update the artist's record in DynamoDB. It includes an important idempotency check using a `ConditionExpression` and a `scrapeId` to prevent processing the same artist twice in a single scraping run.

This piece of logic should not go into a Lambda function. As its name implies, it is designed to be the core application logic for your Fargate scraper containers.

**Destination:** This code belongs inside the Docker image that you build and push to your ECR repository (aws_ecr_repository.scraper). The Fargate service then runs this container.

**Purpose:** Your architecture correctly uses Fargate for long-running or intensive scraping tasks. The queue_scraping Lambda sends jobs to an SQS queue, and the Fargate containers poll this queue. The logic in this file shows exactly how a container would:

- Receive a message from the SQS queue.
- Perform the scraping work (this part is a placeholder).
- Update DynamoDB with the results.
- This separation is an excellent architectural pattern. It uses Lambda for lightweight orchestration and Fargate for the heavy lifting.

Furthermore, the code demonstrates a critical best practice for SQS consumers: idempotency. The ConditionExpression: 'attribute_not_exists(scrapeId) OR scrapeId \<\> :scrapeId' ensures that if the same message is processed twice (which can happen in distributed systems), the database is only updated once. This prevents data corruption and is a sign of a well-designed, resilient worker process.

**Analysis:**

The current script is functional but has two main areas for improvement:

1. **Outdated AWS SDK:** It uses the AWS SDK v2 (`aws-sdk`), which is now in maintenance mode. Migrating to the modular SDK v3 (`@aws-sdk/*`) is the recommended approach.
2. **Inconsistent Logging:** It uses `console.log`, which bypasses your excellent shared, PII-scrubbing logger. This could lead to sensitive data being exposed in container logs.  
   **Suggested Improvements**

I will refactor the script to use the AWS SDK v3 `DynamoDBDocumentClient` and integrate the shared `logger`. This will make the code more secure, performant, and consistent with the rest of your project.

## **`queue_scraping.js`**

**Analysis:**

This function's role is to dispatch jobs to an SQS queue. The current implementation is good, but it's missing a critical piece of logic found in its counterpart (`queue_scraping_index.js`): the `scrapeId`. This unique ID is essential for the Fargate scraper's idempotency logic to prevent duplicate processing.

**Suggested Improvements:**

1. **Add `scrapeId`:** I will add logic to generate a single, unique `scrapeId` for the entire batch of jobs. This ID will be added to every SQS message.
2. **Batch Sending:** For efficiency and cost-savings, I will refactor the loop to send messages to SQS in batches of up to 10 using the `SendMessageBatch` command.
3. **Error Handling:** The batch sending approach requires more robust error handling to manage and retry any individual messages that fail within a batch.

This function acts as a dispatcher in the data pipeline.

- **`queue_scraping.js`** This Lambda function takes a list of artists (likely from a discovery step) and adds each one as a separate message to an SQS queue. This effectively creates a queue of scraping jobs to be processed by the Fargate container fleet. It uses the newer AWS SDK v3.
- **`queue_scraping_index.js`** A similar version of the queueing logic that uses the older AWS SDK v2. This version also includes logic to add a `scrapeId` to each message, which is a good practice for tracking and idempotency that is missing from the other file.

## **`rotate_nat_gateway_eip.py`**

**Analysis:**

This is a valuable operational runbook for ensuring the scrapers don't get IP-banned. The logic is clear, but it has a significant flaw: it orphans the old Elastic IP (EIP) after disassociating it. Unassociated EIPs incur costs, so they should be released.

**Suggested Improvements:**

1. **Release Old EIP:** After successfully associating the new EIP, I will add a step to release the old EIP to prevent unnecessary charges.
2. **Error Handling:** The `try...except` block is good, but the success notification is sent before the old EIP is released. I'll move the notification to the very end to ensure it reports the full, successful operation.
3. **Clarity:** I will add more logging and comments to clarify each step of the process.

This is an operational tool for maintaining the health of the web scrapers.

- **`rotate-nat-gateway-eip.py`** This Python Lambda is an automated runbook tool. Its purpose is to rotate the public IP address of the scrapers to avoid being blocked by target websites. It finds the project's NAT Gateway, allocates a new Elastic IP (EIP), associates it with the gateway (which automatically disassociates the old one), and sends a success/failure notification to an SNS topic.

## **`scraper/Dockerfile`**

**Analysis:**

This is a well-written `Dockerfile`. It correctly uses a slim multi-architecture base image, separates dependency installation to leverage layer caching, and runs as a non-root user for security.

**Suggested Improvements:**

1. **Add `HEALTHCHECK`:** A `HEALTHCHECK` instruction is a best practice that allows the container orchestrator (Amazon ECS) to verify that the application inside the container is not just running, but is actually healthy and able to process work.
2. **Add Image Metadata:** Using `LABEL` instructions to embed metadata (like a maintainer or version source) into the image is good practice for tracking and maintenance.
3. **Clarify `CMD`:** The `CMD` references a `wrapper.js` script. I'll add a comment clarifying the purpose of such a script.

This defines the environment for the scraper tasks.

- **`dockerfile_scraper.dockerfile`** This is a `Dockerfile` used to build the container image for the Fargate scraper tasks. It defines a lightweight Node.js environment, installs dependencies, copies the scraper logic, and configures the container to run as a non-root user for improved security.

## **`secret_rotation.py`**

**Analysis:**

This is a production-quality secret rotation function that correctly implements the four-step process required by AWS Secrets Manager. The password generation is secure. The most significant gap is that the `test_secret` step is a placeholder. A rotation should never be finalized without actually testing that the new password works.

**Suggested Improvements:**

1. **Implement `test_secret`:** I will add the real implementation for `test_secret`. This involves adding the `opensearch-py` library to `requirements.txt` and using it to create a client that authenticates against the OpenSearch domain with the new (`AWSPENDING`) password.
2. **Refine Password Generation:** The `generate_complex_password` helper function can be made more concise and reliable.
3. **Add Type Hinting:** I'll add type hints for the boto3 clients to improve code readability and enable better static analysis.

This directory contains a critical security automation function.

- **`secret_rotation.py`** This is a Python Lambda function that integrates with AWS Secrets Manager to handle the automated rotation of the OpenSearch master user password. It follows the standard four-step rotation process (`create`, `set`, `test`, `finish`) required by Secrets Manager. This ensures that the master password is changed periodically without manual intervention, significantly improving the security posture of the OpenSearch cluster.
- **`requirements.txt`** This file lists the Python dependencies for the `secret_rotation.py` function.
  - **Add Dependencies:** I will add `opensearch-py` and `requests-aws4auth` to the file so they are packaged with the Lambda function during deployment.
