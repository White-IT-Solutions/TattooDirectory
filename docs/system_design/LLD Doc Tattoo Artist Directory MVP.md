# **Low-Level Design: Tattoo Artist Directory MVP**

---

# **0\. Document Control**

**Document Title:** Tattoo Artist Directory MVP \- Low-Level Design **Version:** 2.0 (Comprehensive) **Status:** For Final Review & Approval **Author:** Joseph White \- AWS Technical Architect **Distribution:** Engineering & DevOps Teams, Project Stakeholders

---

## **0.1. Revision History**

| Version | Date | Description | Author |
| :---- | :---- | :---- | :---- |
| 1.0 | July 4, 2025 | Provisional LLD with core component designs and data models. | Joseph White |
| 2.0 | July 4, 2025 | Expanded LLD incorporating detailed AWS best practices, failure mode analysis, enhanced security design, and a more robust data aggregation pattern based on industry reference architectures. | Joseph White |

## **0.2. Reviewer List**

| Name | Role |
| :---- | :---- |
| *\[Stakeholder Name\]* | *\[Stakeholder Role\]* |
| *\[Lead Engineer Name\]* | *\[Lead Engineer Role\]* |

---

# **1\. Introduction and System Context**

This Low-Level Design (LLD) provides the detailed technical specification required for the implementation of the Tattoo Artist Directory MVP. The platform's objective is to create a superior artist discovery tool by programmatically aggregating public data, serving as an advanced technical portfolio piece built on the AWS cloud.

This document expands on the HLD by specifying the internal design of each microservice, defining precise data schemas and system interfaces, outlining security controls, and providing a concrete deployment and operational plan. It is the definitive guide for the engineering team.

---

## **2\. Software Architecture**

## **2.1. Architectural Pattern**

The architecture employs a **serverless microservices** pattern. The system is decomposed into small, independent services that communicate over well-defined APIs and event streams. This approach was chosen to maximize scalability, minimize operational overhead, and allow for independent development and deployment of components, which is ideal for the project's velocity and showcase goals.

#### 

| Component | Services | Role & Configuration | Details |
| :---- | :---- | :---- | :---- |
| **Frontend** | Amazon S3, CloudFront, WAF | **S3** is configured for static website hosting with versioning enabled. **CloudFront** is the CDN, configured with an Origin Access Identity (OAI) to ensure the S3 bucket is not publicly accessible.  | **WAF** is attached with the `AWSManagedRulesCommonRuleSet` and `KnownBadInputsRuleSet` for robust protection.  |
| Backend API | API Gateway, AWS Lambda | **API Gateway** is an HTTP API (v2), which provides a lower-cost and lower-latency alternative to REST APIs. It uses IAM authorization for service-to-service calls and is designed for future JWT-based user authentication via Lambda authorizers. **Lambda** functions (Node.js) are provisioned with an architecture-appropriate memory size (e.g., 256MB) and run in a hybrid of internal and external to a VPC, depending on the use case. Following best practices, database connections are initialized outside the main handler to be reused across invocations. |   |
| Data Aggregation | Step Functions, SQS, Fargate, EventBridge | **Step Functions** defines a Standard Workflow for orchestration. It adds jobs to an **SQS** queue, which decouples the workflow from the scrapers. Fargate tasks pull jobs from the SQS queue, providing a resilient, buffered pattern. **EventBridge** uses a `cron(0 2 * * ? *)` schedule to trigger the workflow daily.  |  |
| Data & Persistence | DynamoDB, OpenSearch Service | **DynamoDB** is a single table in On-Demand capacity mode. Point-In-Time Recovery (PITR) is enabled. **OpenSearch Service** is a multi-AZ cluster (e.g., `t3.small.search`) within the VPC, accessible only via security groups from API Lambda functions. |  |

---

# **3\. Component Design & Interfaces**

## **3.1. Backend API Specification**

The API is the primary interface for the frontend. All endpoints are versioned (e.g., /v1).

#### 

| Endpoint | Method | Description | Sucess Code | Error Codes |
| :---- | :---- | :---- | :---- | :---- |
| `/v1/artists`  | `GET` | Searches artists. Params: `style`, `location`, `page`. | 200 OK | 400 Bad Request |
| `/v1/artists/{artistId}` | `GET` | Retrieves a single artist's profile. | 200 OK | 404 Not Found |
| `/v1/styles`  | `GET` | Returns a list of all distinct tattoo styles. | 200 OK | 500 Internal Server Error |

### **3.1.1 Architectural Error Response Format**

All API error responses (4xx and 5xx status codes) will return a JSON object compliant with RFC 9457 "Problem Details for HTTP APIs." This provides a standard, machine-readable format for clients to handle errors. The `Content-Type` header for these responses will be `application/problem+json`.

The structure will contain the following members:

* **type** (string, URI): A URI that identifies the problem type. For this API, it will link to a future public documentation page explaining the error codes. Defaults to `about:blank` if no specific documentation is available.  
* **title** (string): A short, human-readable summary of the problem type that should not change between occurrences of the same error.  
* **status** (integer): The HTTP status code for this occurrence of the problem (e.g., 400, 404, 500).  
* **detail** (string): A human-readable explanation specific to this occurrence of the problem. This can be more specific than the `title`.  
* **instance** (string): A unique identifier for this specific occurrence of the problem. This will correlate to the `aws_request_id` from the API Gateway or Lambda invocation, allowing for precise tracing in CloudWatch Logs.

**Example 404 Not Found Response:**

JSON  
HTTP/1.1 404 Not Found  
Content-Type: application/problem+json  
Content-Language: en

{  
  "type": "https://api.tattoodirectory.com/docs/errors\#not-found",  
  "title": "Resource Not Found",  
  "status": 404,  
  "detail": "An artist profile with the ID '123-abc-456' could not be found.",  
  "instance": "d8aa941a-32d4-45af-a035-72a1e05328a1"  
}

**Example 400 Validation Error Response:**

JSON  
HTTP/1.1 400 Bad Request  
Content-Type: application/problem+json  
Content-Language: en

{  
  "type": "https://api.tattoodirectory.com/docs/errors\#validation-error",  
  "title": "Validation Error",  
  "status": 400,  
  "detail": "One or more request parameters failed validation.",  
  "instance": "e9ab842b-43e5-56bg-b146-83b2f16439b2",  
  "invalid-params": \[  
  {  
    "name": "location",  
    "reason": "must be a valid ISO 3166-1 alpha-2 country code"  
  }  
  \]  
}

## **3.2. Data Aggregation Engine**

The Data Aggregation Engine is responsible for programmatically collecting and processing tattoo artist data from various public sources. It employs a robust, event-driven architecture utilizing AWS **Step Functions** for orchestration, **SQS** for buffering, and **Fargate** for scalable, containerized scraping tasks. This design ensures resilience, efficient resource utilization, and allows for controlled processing of potentially large and spiky data ingestion workloads.

***Documentation Note:** The following components comprise the Phase 2 implementation of the Automated Data Aggregation Engine. They are designed to feed data into the core platform established and validated in Phase 1\.*

### **State Machine Steps:**

1. ### **`DiscoverStudios` (Lambda):** Finds studios via Google Maps.

2. ### **`FindArtistsOnSite` (Map State \-\> Lambda):** Finds artists on studio websites.

3. ### **`QueueScrapingJobs` (Lambda):**

   * ### **Input:** An array of all discovered artist objects.

   * ### **Action:** Iterates through the artists and sends a message for each one to an SQS `ScrapingQueue`.

   * ### **Output:** `{ "jobsQueued": 150 }`

4. ### **`RunScraperFleet` (Fargate Task):**

   * ### **Trigger:** Fargate service is configured with auto-scaling based on the SQS queue depth (e.g., scale up if `ApproximateNumberOfMessagesVisible > 100`).

   * ### **Action:** Each Fargate task starts, pulls a message from the SQS queue, scrapes the corresponding portfolio, and deletes the message upon successful completion. Before writing to DynamoDB, the task is responsible for transforming the raw scraped data into the final item structure. This includes computing the GSI keys (`gsi1pk`, `gsi1sk`, and `gsi2pk`) based on the artist's inferred styles, location, and Instagram handle to enable efficient search queries. The task implements the complete GSI key generation algorithm as specified in the HLD Section 8.1, ensuring consistent data formatting and search optimization. It then writes the complete item directly to DynamoDB using conditional expressions for idempotency.

### This buffered pattern ensures that scraping jobs are not lost if there's a temporary issue with the Fargate service and allows the scraping workload to be processed at a controlled rate.

### **3.2.1 Dead Letter Queue:**
The*A Dead-Letter Queue (DLQ) is a standard and critical feature in message-driven architectures. Its primary purpose is to isolate and store messages that a consumer application fails to process successfully. By setting up a DLQ, you can prevent problematic messages—often called "poison pills"—from being endlessly retried, which could block the processing of other valid messages and waste compute resources.

**How It Is Utilized in This Project**
In this architecture, the ScrapingQueue holds jobs for the Fargate scraper tasks. A message might fail processing for several reasons, such as a bug in the scraper code, a malformed message payload, or a target website that consistently returns an error. To handle these failures gracefully, a DLQ is implemented as follows:

**Configuration**:
A dedicated SQS queue, scraping_dlq, is created to serve as the dead-letter queue.
The main scraping_queue is configured with a redrive_policy. This policy instructs SQS to automatically move a message to the scraping_dlq after it has been received and failed processing a specific number of times.

**Failure Threshold:**
Based on the configuration in 06-data-aggregation.tf, the maxReceiveCount is set to 3. This means a Fargate task will attempt to process a single message up to three times. If all three attempts fail, SQS will move the message to the scraping_dlq.

**Benefits to the Architecture:**
Resilience: It prevents a single bad message from halting the entire data aggregation pipeline. The Fargate scrapers can continue processing valid jobs from the main queue without interruption.

Debugging and Analysis: Failed messages are not lost. They are safely stored in the DLQ, where developers can inspect their contents to diagnose the root cause of the failure (e.g., a new website layout that breaks the scraper) without impacting the production workflow.

Proactive Monitoring: The system is configured with a dedicated CloudWatch Alarm (sqs_dlq_messages) that triggers an immediate notification if even a single message appears in the DLQ. This allows the operations team to be alerted to processing failures in real-time.


# **4\. Data and Databases**

## **4.1. Data Models (DynamoDB Single-Table Design)**

The `TattooDirectory` single-table design is optimized for the application's access patterns.

**Key Structure Rationale:**

* **PK: `ARTIST#{artistId}`:** By partitioning on the artist ID, all information related to a single artist (metadata, images, styles) is co-located in the same physical partition. This allows the `getArtistProfile` endpoint to fetch an artist's entire profile with a single, highly efficient `Query` operation (`WHERE PK = 'ARTIST#alex-123'`), instead of multiple `GetItem` calls.  
* **SK: `METADATA`, `IMAGE#{imageId}`:** The use of composite sort keys allows for versatile queries. A query for an artist can retrieve just the `METADATA` or all `IMAGE#` items, providing flexibility.

**GSI for Search Rationale (`style-location-index`):**

* **GSI1 PK: `gsi1pk` (`STYLE#neotraditional`):** Generated by Fargate scraper task. This allows for a direct query to find all artists associated with a specific style.  
* **GSI1 SK: `gsi1sk` (`LOCATION#UK#LEEDS#artist-123`):** Generated by Fargate scraper task. The composite sort key allows for further filtering within a style by location and includes the artist ID for uniqueness. The query `WHERE gsi1pk = 'STYLE#neotraditional' AND begins_with(gsi1sk, 'LOCATION#UK#LEEDS')` is extremely efficient for powering the main search feature.
* **GSI2 PK: `gsi2pk` (`INSTAGRAM#alextattoo`):** Generated by Fargate scraper task. Enables efficient lookup of artists by their Instagram handle for profile claims and duplicate detection.

## **4.2. Data Model Table**

| Attribute Name | Type | Description | Example |
| :---- | :---- | :---- | :---- |
| `PK` | String | Partition Key. ARTIST\#{artist\_id} | ARTIST\#12345 |
| `SK` | String | Sort Key. PROFILE\#{artist\_id} | PROFILE\#12345 |
| `artistName` | String | The artist's full name. | Alex the Artist |
| `instagramHandle` | String | The artist's Instagram username. | @alextattoo |
| `locationCity` | String | The primary city of operation. | London |
| `locationCountry` | String | The primary country of operation. | UK |
| `styles` | String Set | A set of inferred style tags, derived from the Style Inference Engine. Used for filtering and searching. All values are stored in lowercase. | \["traditional", "blackwork", "dotwork"\] |
| `gsi1pk` | String | GSI 1 Partition Key. Generated by Fargate scraper task. Format: STYLE\#{style\_name} | STYLE\#traditional |
| `gsi1sk` | String | GSI 1 Sort Key. Generated by Fargate scraper task. Format: LOCATION\#{country}\#{city}\#{artistId} | LOCATION\#UK\#LONDON\#artist-123 |
| `gsi2pk` | String | GSI 2 Partition Key. Generated by Fargate scraper task. Format: INSTAGRAM\#{handle} | INSTAGRAM\#alextattoo |

## **4.3. Data Sizing and Volumetrics**

* **Storage:** Initial data size for Leeds (est. 500 artists, 50 images each) is \~5-10 GB in S3 and \<1 GB in DynamoDB/OpenSearch. This is well within the free/low-cost tiers.  
* **Throughput:** User-facing read traffic is the primary driver. DynamoDB On-Demand capacity is sufficient for the MVP. Write traffic from the scrapers is spiky but manageable for the on-demand model.  
* **Data Freshness:** The data aggregation workflow runs daily, ensuring data is refreshed well within the 30-day requirement.

---

# **5\. Security Design**

## **5.1. Secrets Management**

* Any third-party API keys (e.g., Google Maps API key) or credentials (e.g., for an Instagram account used for scraping) will **not** be stored in code or environment variables. They will be stored securely in **AWS Secrets Manager**.  
* The relevant Fargate tasks or Lambda functions will be granted a narrow IAM permission to retrieve only the specific secret they require at runtime.

## **5.2. S3 Bucket Security**

* The S3 bucket for the frontend will have **Block Public Access** enabled.  
* A **Bucket Policy** will be applied to only allow access from the CloudFront Origin Access Identity (OAI), ensuring the content is only served via CloudFront.

## **5.3. Rate Limiting and Abuse Prevention** 

To mitigate the risk of automated scraping and API abuse, a layered approach to rate limiting will be implemented.

### **5.3.1. Edge Layer (AWS WAF):**

* A rate-based rule will be attached to the CloudFront distribution.  
* **Configuration:** The rule will count requests on a per-IP basis over a rolling 5-minute window. If the count exceeds 500 requests, the source IP will be blocked for 1 hour.  
* **Scope:** This rule will apply only to URI paths that begin with `/v1/artists`.

### **5.3.2. API Layer (API Gateway):**

* Stage-level throttling will be enabled on the production stage of the API. As HTTP APIs do not support per-route throttling, the limit is applied to all routes within the stage.
* **Configuration:** The production stage will be configured with a steady-state rate limit of 100 requests per second and a burst capacity of 200 requests. This aligns with the target for the most critical search endpoint.
* **Behavior:** Requests exceeding this limit will be rejected with a `429 Too Many Requests` status code.

---

# **6\. Failure Mode and Effects Analysis (FMEA)**

This section proactively identifies potential failures and documents the built-in mitigation.

| Failure Mode | Potential Effect | Mitigation Strategy |
| :---- | :---- | :---- |
| Instagram blocks the scraper's IP address. | Data aggregation fails for Instagram portfolios; data becomes stale. | **MVP Mitigation:** The NAT Gateway provides a static IP for all outbound Fargate traffic in an AZ. If this IP is blocklisted, the documented semi-automated remediation is to **replace the NAT Gateway** via the associated runbook. This is a fast operation that provisions a new gateway with a new, unlisted public IP address, allowing scraping to resume. This failure and its manual resolution are accepted risks for the MVP. **Future Enhancement:** Implement a fleet of NAT Gateways or utilise AWS PrivateLink to route traffic through a 3rd-party rotating proxy service. |
| A specific studio website is down or has changed its HTML structure. | Artists from that studio are not discovered or updated. | The Step Functions workflow is designed to handle errors in individual branches of the Map state. The failure to scrape one studio will not halt the entire workflow for all other studios. Errors will be logged to CloudWatch for review. |
| Downstream API (e.g., Google Maps) is unavailable or rate-limits requests. | Studio discovery fails. | The Lambda function will implement an exponential backoff and retry mechanism when calling external APIs. The Step Functions workflow itself can also be configured with retry policies. |
| A surge in traffic causes API Lambda functions to hit concurrency limits. | Users receive 5xx errors; degraded user experience. | The serverless architecture scales automatically. AWS default concurrency limits are high (1,000 per region). CloudWatch Alarms will be set on the `Throttles` metric, and provisioned concurrency can be configured for critical functions if necessary. |

---

# **7\. Scalability & Performance Testing Plan**

## **7.1 Phase 1 Testing:**

Testing will focus on the Core API & Data Platform. This includes API functional tests, UI/E2E tests, and performance load tests against the API endpoints using the manually populated seed dataset."

## **7.1.1 Objective** 

To validate that the API can handle the target load of 2,000 MAU with p95 latency below 500ms.

**Methodology:** The Dev/Staging environment will be used for all tests, and will utilise a load testing script created using a tool like Artillery.io or JMeter. The script will simulate realistic user behaviour: a mix of searching for artists and retrieving individual profiles. Tests will be run at increasing concurrent user levels (e.g., 10, 50, 100 concurrent users) to identify the system's breaking point.

**Load Testing Target:** The system should be able to sustain a peak load of 10-20 requests per second (RPS) while maintaining a p95 latency of less than 500ms for all API endpoints. This target is derived from an estimated 2,000 monthly active users (MAU), assuming 5 sessions per month and 10 requests per session, with a peak load factor of 50x the average.

**Key Metrics to Monitor:** API Gateway p95 Latency, Lambda Duration and Throttles, DynamoDB Read/Write Capacity Units, OpenSearch CPU Utilisation.

## **7.2 Phase 2 Testing:**

Testing will focus on the data pipeline. This includes integration tests for the Step Functions workflow, validating that jobs are correctly passed to SQS and processed by Fargate, and end-to-end tests confirming that a discovered artist profile is successfully written to DynamoDB and synced to OpenSearch."
