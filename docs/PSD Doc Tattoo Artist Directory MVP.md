# **Product Specification: Tattoo Artist Directory MVP**

---

# **0\. Document Control**

**Document Title:** Product Specification: Tattoo Artist Directory MVP **Author:** Joseph White \- AWS Technical Architect **Owner:** Project Stakeholders **Distribution:** Engineering & DevOps Teams **Document Status:** For Review & Approval

---

## **0.1. Revision History**

| Version | Date | Description | Author |
| :---- | :---- | :---- | :---- |
| 1.0 | July 4, 2025 | Initial specification created from PRD, HLD, and LLD source documents. | Joseph White |
| 2.0 | July 4, 2025 | xxx | Joseph White |
| 3.0 | July 4, 2025 | xxx | Joseph White |

## **0.2. Reviewer List**

| Name | Role |
| :---- | :---- |
| *\[Stakeholder Name\]* | *\[Stakeholder Role\]* |
| *\[Lead Engineer Name\]* | *\[Lead Engineer Role\]* |

1. # **Executive Summary**

## **1.1 Product Overview**

This platform solves the problem of fragmented and inefficient artist discovery by creating a comprehensive directory of UK tattoo artists, starting with Leeds. It uses a multi-source scraping engine to aggregate public data, providing clients with a powerful search tool and artists with a zero-effort marketing channel.

## **1.2 Key Objectives** 

* To serve as a comprehensive portfolio project demonstrating advanced skills in modern full-stack development on AWS.  
* To provide clients with a superior search experience, enabling the discovery of all local artists by location, style, and other relevant criteria.  
* To increase inbound client inquiries for artists by providing a high-visibility platform for their work.  
* To reduce the amount of time artists must spend on marketing, allowing them to focus on their craft.

## **1.3 Success Metrics**

* Achieve an API p95 latency of \< 500ms and a Lighthouse score of 90+ for performance and accessibility.  
* Reach a user engagement rate of 30% (search to profile click) and an artist referral click-through rate of 15%.  
* Grow to 2,000 Monthly Active Users (MAU) within 3 months of public launch.

## **1.4 Resource Requirements**

* **Time:** A phased release is planned, starting in July 2025 and culminating in a public launch in late September 2025\.  
* **Budget:** The project is designed for cost optimisation by using a serverless, pay-per-request consumption model to avoid costs for idle resources.  
* **Team Size:** The project is constrained by a solo developer's velocity.

---

# **2\. Product Foundation**

## **2.1 Purpose Statement**

**Problem Being Solved:** Prospective clients lack a dedicated, efficient tool for discovering and evaluating local tattoo artists, forcing them into a frustrating and incomplete search process. Artists struggle to reach a targeted audience and are reliant on social media platforms that function poorly as professional portfolios.

**Target Value:** For clients, the platform provides a powerful tool to filter artists by location, style, and keywords. For artists, it offers a zero-effort visibility boost by driving traffic to their existing social media channels.

**Market Context:** Existing directory websites are inherently incomplete because they require artists to manually sign up ("walled garden" approach). Furthermore, many have "pay-to-play" business models that prioritise paying artists over the most stylistically relevant ones for the client.

## **2.2 Target Users**

| User Type | Technical Level | Primary Use Case | Key Requirements |
| :---- | :---- | :---- | :---- |
| Chloe the Collector | Intermediate | Discover all local artists specialising in a niche style. | A comprehensive database, ability to easily compare portfolios, and all relevant info in one place. |
| Alex the Artist | Beginner | Be discovered by new clients looking for their specific style. | Showcase their portfolio effectively by style, not just chronologically, and reduce marketing efforts. |

## **2.3 Scope Definition**

### **2.3.1 In Scope:**

* An automated data aggregation engine to build the directory.  
* Public artist profile pages display aggregated information.  
* A discovery tool allowing users to search and filter by style and location, with results viewable in a grid or on an interactive map.  
* A fully automated CI/CD pipeline with 100% Infrastructure as Code (IaaC).

### **2.3.2 Out of Scope:**

* A "Claim Profile" feature for artists (future enhancement).  
* Any form of proprietary booking system.  
* Monetisation features for the MVP.

---

# **3\. Technical Architecture**

The system architecture for the Tattoo Artist Directory MVP is designed as two distinct yet collaborative parts, each serving a critical function within the platform.

The **Core API & Data Platform** represents the synchronous, user-facing set of services. This part of the system is responsible for delivering the immediate application experience to clients, handling search queries, displaying artist profiles, and managing the core data stores that power these interactions.

In parallel, the **Async Data Aggregation Engine** operates as an event-driven, backend workflow. Its primary responsibility is to continuously and autonomously populate the Core API & Data Platform with up-to-date artist information, ensuring the directory remains comprehensive without direct user interaction.

## **3.1 Technology Stack**

* **Frontend:** Next.js, Tailwind CSS, ShadcN/UI.  
* **Backend:** Node.js runtime on AWS Lambda, Amazon API Gateway, AWS Step Functions, and AWS Fargate for containerized scrapers.  
* **Infrastructure:** AWS (Amazon S3, CloudFront, WAF, DynamoDB, OpenSearch, EventBridge), HashiCorp Terraform for IaaC.  
* **Rationale:** A "serverless-first" approach was chosen to maximize scalability, minimize operational overhead, and demonstrate modern cloud architecture practices. Using purpose-built databases (DynamoDB for fast lookups, OpenSearch for complex search) provides significant performance efficiency.

## 

## **3.2 System Architecture**

***Technical Note:** This diagram represents the final state architecture. The implementation follows a two-phase approach:*

***Phase 1** focuses on the **User, Edge, API Compute, and Data/Search layers**, which are populated with a seed dataset to prove the core application.*

***Phase 2** implements the **Async Data Aggregation** components to enable live data collection."*

## **3.3 Data Flow**

**Input: Scheduled Workflow Initiation**

An Amazon EventBridge rule triggers a scheduled AWS Step Functions workflow daily. The workflow's primary role is to orchestrate the discovery of artists and then send individual scraping jobs as messages to an **Amazon SQS (Simple Queue Service) queue**. This decouples the orchestration logic from the execution of the scrapers.

**Processing:** **Asynchronous Scraping and Indexing**

The SQS queue buffers these jobs, allowing the AWS Fargate container tasks to scale independently based on queue depth. Each Fargate task pulls a job from the queue, scrapes public data from the target source (e.g., Instagram), and writes the aggregated artist data into the primary data store, **Amazon DynamoDB**. Any changes (creations or updates) to the DynamoDB table are captured by **DynamoDB Streams**. A dedicated **AWS Lambda function** is triggered by these stream events to process the change and synchronise the data with the **Amazon OpenSearch index**, ensuring the search data is kept up-to-date.

**Storage: Purpose-Built Data Tiers** 

The system utilises three distinct storage layers based on the data's access patterns:

* **Amazon DynamoDB** serves as the primary data store for all artist profile information.  
* **Amazon OpenSearch Service** is used to persist the search index, enabling efficient and complex filtering and geo-spatial queries.  
* **Amazon S3** stores the static assets (HTML, CSS, JavaScript) for the frontend web application.

**Output:** **User-Facing Application Delivery**

A user accesses the platform via a client browser. **Amazon CloudFront** serves the static web application from the S3 bucket, with **AWS WAF** inspecting traffic at the edge for security threats. The application then makes API calls to **Amazon API Gateway**, which securely routes requests to the backend **AWS Lambda** function. This backend function queries the Amazon OpenSearch index for all search and filtering requests, presenting the results to the user.

## **3.4 External Dependencies**

| Dependency | Purpose | Criticality | Fallback Plan |
| :---- | :---- | :---- | :---- |
| Google Maps | Initial discovery of tattoo studios. | High | The multi-source strategy mitigates risk; errors are logged, and the workflow continues. |
| Instagram | Scraping artist portfolio content. | High | A clear policy for artist de-listing requests will be established. The risk is accepted for a portfolio piece. |

## **3.5 Performance & Security Requirements**

### **3.5.1 Performance Targets:**

* Response Time: Page loads \< 3s; Search results \< 1.5s; API p95 latency \< 500ms.  
* Concurrent Users: The architecture must support the target of 2,000 MAU.  
* Data Throughput: The aggregation engine must handle scraping \>1,000 profiles per day.

### **3.5.2 Security Requirements:**

* Data Protection: All data is encrypted in transit (TLS) and at rest using AWS KMS.  
* Authentication: The MVP does not have user authentication but uses IAM roles for secure service-to-service communication.  
* Authorisation: The principle of least privilege is strictly enforced with narrowly scoped IAM roles for every component.

---

# 

# **4\. Feature Specifications**

## **4.1 Core Features Overview**

| Phase 1 Features | Priority | Complexity | Dependencies |
| :---- | ----- | ----- | ----- |
| **\[F2\]** Artist Profile | P0 | Medium | **\[F1\]** Data Aggregation Engine or **\[F7\]** Manual Upload of Curated Seed Dataset |
| **\[F3\]** Data Sync (Internal) | P0 | Medium | **\[F1\]** Data Aggregation Engine or **\[F7\]** Manual Upload of Curated Seed Dataset |
| **\[F4\]** Artist Search & Discovery | P0 | High | **\[F3\]** Data Sync (Internal) |
| **\[F5\]** Frontend Web Application | P0 | Medium | **\[F2\]** Artist Profile **\[F4\]** Artist Search & Discovery |
| **\[F6\]** Data Governance/Artist Takedown Process | P0 | Low | None |
| **\[F7\]** Manual Upload of Curated Seed Dataset | P0 | Low | None |
| **\[F8\]** Infrastructure as Code (Core Platform) | P0 | Medium | None |
| **\[F9\]** CI/CD Platform (Core Platform) | P0 | Medium | None |

### 

| Phase 2 Features | Priority | Complexity | Dependencies |
| ----- | :---: | :---: | ----- |
| **\[F1\]** Data Aggregation Engine | P1 | High | **\[F6\]** Data Governance/Artist Takedown Process |
| **\[F1\]** Style Inference Engine | P1 | High | **\[F6\]** Data Governance/Artist Takedown Process |

### 

## **4.2 Detailed Feature Specifications**

### **4.2.1 Data Aggregation & Style Inference Engine (Priority: P1)**

**User Story:** As a platform administrator, I want to automatically aggregate public artist data from Google Maps, studio websites, and Instagram, so that the directory is comprehensive and up-to-date without manual effort.

**Acceptance Criteria:**

* \[ \] A scheduled workflow successfully discovers studios in a target city using Google Maps.  
* \[ \] The workflow successfully scrapes identified studio websites to find resident artists.  
* \[ \] The workflow successfully scrapes artist Instagram profiles for portfolio images and metadata.  
* \[ \] All aggregated data is correctly structured and saved to the primary database.  
  ***Technical Note:** This is an asynchronous, decoupled process orchestrated by AWS Step Functions. To improve resilience, an SQS queue is used to buffer scraping jobs for the Fargate scraper tasks.*

#### **4.2.1.1 Style Inference Engine:**

The Style Inference Engine is a component of the Fargate Scraper Task responsible for analysing scraped artist data to extract and normalise tattoo style tags. Given the complexity of this task, a phased approach is planned.

**MVP Strategy: Hashtag-Based Extraction**

For the MVP, the inference mechanism will be a deterministic, rules-based engine that extracts potential style tags directly from hashtags found in the artist's Instagram bio and their recent posts.

**Process Flow:**

* During a scrape, the Fargate task will parse the text content of the artist's bio.  
* It will identify all strings that match the hashtag pattern (`#<word>`).  
* Each identified hashtag is cleaned: converted to lowercase, and the leading '\#' is removed (e.g., `#TRADITIONAL` becomes `traditional`).  
* A pre-defined **stop list** of common, non-style-related hashtags (e.g., `tattoo`, `tattooartist`, `art`) is used to filter out noise.  
* The resulting list of cleaned, filtered tags is then associated with the artist's profile.

**Limitations & Assumptions:**

* This approach is acknowledged to be imprecise. It is entirely dependent on the artist's use of hashtags.  
* It cannot differentiate between the styles the artist *does* versus the styles they *admire* or mention for other reasons.  
* The quality of the tags is considered "best effort" for the MVP.

### **4.2.2 Artist Profile Page (Priority: P0):**

**User Story**: "As Chloe the Collector, a meticulous client, I want to view a comprehensive artist profile page that cleanly presents an artist's portfolio, specialities, and location, so that I can confidently evaluate if their specific style is right for my next tattoo and easily connect with them on their preferred platform."

**Acceptance Criteria**:

* \[\] The page successfully displays all available artist metadata.  
  * \[ \] Displays artist name, picture, and studio/location.  
  * \[ \] Displays biography and clickable style tags that trigger a new search.  
* \[ \] Displays a responsive image gallery with a full-screen modal view.  
* \[ \] Contains a prominent CTA button linking to the artist's source social media.  
* \[ \] The page is fully responsive and displays a map of the studio location.  
* \[ \] In the event portfolio images are unavailable, the gallery section will be replaced by a message stating "Portfolio not available" and will still provide the direct link to the artist's social media.  
  ***Technical Note:** The frontend component responsible for rendering the gallery must check if the artist's image array is null or empty and render the fallback UI accordingly. This ensures the page does not break if the data aggregation engine has not successfully scraped images.*

### **4.2.3 Data Sync \- Internal (Priority: P0):**

**User Story**: "As a platform administrator, I want the aggregated artist data to be automatically synchronised and indexed in the search database, so that clients can find the most accurate and up-to-date artist information when they search."

**Acceptance Criteria**:

* \[\] Changes in the DynamoDB \`Artist\` table successfully trigger the \`indexSync\` Lambda function.  
* \[\] The \`indexSync\` Lambda function correctly transforms DynamoDB records into OpenSearch documents.  
* \[\] The OpenSearch index is updated in near real-time (within 30 seconds) after a DynamoDB record is created, updated, or deleted.  
    
  ***Technical Note:*** *The \`indexSync\` Lambda function must handle different event types (INSERT, MODIFY, REMOVE) from DynamoDB Streams to ensure the OpenSearch index accurately reflects the DynamoDB table state. Batch processing of stream records should be considered for efficiency.*

### **4.2.4 Artist Search & Discovery (Priority: P0)**

**User Story:** As a client, I want to search for artists by specific tattoo styles and location, so that I can find all relevant local talent that matches my idea.

**Acceptance Criteria:**

* \[ \] Users can filter artists using multi-select checkboxes for styles.  
* \[ \] Users can filter artists by location.  
* \[ \] Search results are displayed in a responsive grid layout by default.  
* \[ \] An alternative interactive map view is available for exploring results.  
  ***Technical Note:** This feature is powered by the Amazon OpenSearch Service cluster, which is queried via the backend API.*

### **4.2.5 Frontend Web Application (Priority: P0):**

**User Story**: "As Chloe the Collector, a meticulous client, I want to use a responsive and intuitive web application to easily search, filter, and view artist profiles, so that I can discover new artists and confidently find the perfect match for my next tattoo."

**Acceptance Criteria**:

* \[ \] The web application is fully responsive across desktop, tablet, and mobile devices.  
* \[ \] Users can successfully navigate between the search results page and individual artist profile pages.  
* \[ \] The application loads efficiently and provides a smooth user experience.

  ***Technical Note:** The Next.js application leverages server-side rendering (SSR) for initial page loads to improve SEO and perceived performance, while subsequent navigation is handled client-side as a Single-Page Application (SPA) for a smooth user experience..*

### **4.2.6 Data Governance/Artist Takedown Process (Priority: P0):**

**User Story**: "As Alex the Artist, I want to easily request the removal of my profile and associated content from the directory, so that I can maintain control over my online presence and ensure my work is only displayed where I choose."

**Acceptance Criteria**:

* \[ \] A public-facing mechanism (e.g., email address, simple web form) is available for artists to submit takedown requests.  
* \[ \] Upon receipt of a valid takedown request, the artist's profile and associated content are removed from the DynamoDB primary data store within 5 business days.  
* \[ \] The corresponding artist's profile and content are removed from the OpenSearch index within 5 business days of the request, ensuring they no longer appear in search results.  
* \[ \] Confirmation of the takedown is sent to the artist via their provided contact method.

  ***Technical Note:** This process involves a manual intake mechanism (e.g., email or web form) for takedown requests, triggering an administrative review and subsequent deletion from both DynamoDB and OpenSearch. Automated detection of de-listed profiles will be a future enhancement.*

## **4.3 Feature Dependency Map**

# **![][image1]**

The "Feature Dependency Map" diagram visually represents the relationships and dependencies between the core functional features of the Tattoo Artist Directory MVP. Each arrow indicates that the feature at the tail of the arrow is a prerequisite or provides input for the feature at the head of the arrow.

The following elements are not included in the "Feature Dependency Map" for these reasons:

**\[F7\] Manual Upload of Curated Seed Dataset:** This feature is primarily an *enabling step* for initial development and testing (Phase 1\) rather than a continuous functional dependency. Its purpose is to provide data for the frontend and API development before the automated data aggregation engine is fully operational. It's a temporary workaround, not a core ongoing dependency for the operational system.

**\[F8\] Infrastructure as Code (Core Platform):** IaaC describes *how* the infrastructure is managed and deployed, not a functional feature from a user or system interaction perspective. It's a foundational technical practice that supports the development and deployment of all features but doesn't have direct feature-to-feature dependencies in the operational system.

**\[F9\] CI/CD Platform (Core Platform):** Similar to IaaC, the CI/CD platform is a *development and deployment toolchain*. It facilitates the efficient building, testing, and deployment of all features, but is not a functional feature within the application itself that users interact with or that directly depends on other application features. It's an operational dependency for the *delivery* of the software, not an internal dependency of the software's features.

# ---

**5\. Implementation Constraints**

## **5.1 Resource Constraints**

* **Timeline:** Internal Alpha (July-Aug 2025), Private Beta (Early Sep 2025), Public Launch for Leeds (Late Sep 2025).  
* **Budget:** The architecture is designed to be highly cost-effective by leveraging a serverless consumption model, avoiding costs for idle infrastructure.  
* **Team:** The project is limited by solo developer velocity.  
* **Tools:** The project is constrained to the AWS cloud platform and its services.  
* **Detailed Sprint Plan**: \[TBC Details of sprint-by-sprint breakdown to be added.\]  
* **Estimated Monthly Budget:**  
  * **MVP Budget**: The monthly operational expenditure (OpEx) for the production environment of the MVP is strictly capped at **£400 GBP**.  
  * **Third-Party Services**: The MVP budget does not include costs for premium third-party services. The implementation of services like rotating IP proxies requires a separate budget review and is not approved for the initial release.  
  * **Non-Production Environments**: The combined monthly infrastructure cost for all non-production environments (e.g., development, staging) must not exceed **£125 GBP**.  
  * **Technology Selection**: Technical solutions must prioritise pay-per-use, serverless, and managed services over provisioned resources to minimise fixed costs and align expenditure with actual usage.

## **5.2 Technical Constraints**

* **Platform Requirements:** The web application must be fully mobile-responsive and meet WCAG 2.1 AA accessibility standards.  
* **Integration Requirements:** The system is critically dependent on the availability and structure of public data from Google Maps and Instagram.  
* **Legacy Compatibility**: Not applicable as this is a new project.  
* **Third-Party Limitations:** There is a significant risk that scraping activities could be blocked or violate the Terms of Service of external platforms like Instagram.  
* **Compatibility**: Must be mobile-responsive and meet WCAG 2.1 AA.  
* **Supported Browsers and Versions**: \[A specific list of target browsers to be added.\] TBC  
* **Third-Party API Rate Limits**: \[Details on API rate limits to be added.\] TBC https://developers.google.com/explorer-help

## **5.3 Business Constraints**

* **Regulatory Requirements:** A clear policy and process for handling artist de-listing or takedown requests must be established and followed.  
* **Legal Constraints:** The project carries a risk of violating the Terms of Service of platforms from which data is scraped.  
* **Market Timing:** The public launch for the first market (Leeds) is planned for late September 2025\.

## **5.4 Performance Constraints**

* **Response Time Limits:** Page loads must be under 3 seconds, search results under 1.5 seconds, and the API p95 latency must remain below 500ms.  
* **Scalability Targets:** The system must support 2,000 Monthly Active Users and a data ingestion pipeline that can process over 1,000 profiles per day.  
* **Availability Requirements:** The user-facing application requires 99.9% uptime.  
* **Specific Load Testing Scenarios**: Validate that the API can handle the target load of 2,000 MAU with p95 latency below 500ms.  
  * **Key Metrics to Monitor:** API Gateway p95 Latency, Lambda Duration and Throttles, DynamoDB Read/Write Capacity Units, OpenSearch CPU Utilisation.  
  * The Staging environment will be used for all tests.  
  * A load testing script will be created using a tool like Artillery.io or JMeter.  
  * The script will simulate realistic user behaviour: a mix of searching for artists and retrieving individual profiles.  
  * Tests will be run at increasing concurrent user levels (e.g., 10, 50, 100 concurrent users) to identify the system's breaking point.

---

# **6\. Development Roadmap**

## **6.1 Development Phases**

#### **Phase 1: Internal Alpha & Data Seeding (Duration: July \- August 2025\)**

**Objectives:** Deploy all backend infrastructure and populate the database with artist data for the first target city, Leeds.

**Features Included:**

* Data Aggregation Engine \- MVP implementation for Leeds.  
* Backend API \- All endpoints for search and profile retrieval.  
* Data & Persistence \- DynamoDB and OpenSearch schemas defined and deployed.  
* **Populate the database with an initial dataset for Leeds via a manual script to enable frontend and API development.** The live data aggregation engine will be developed in parallel.

**Success Criteria:**

* \[ \] Infrastructure is fully deployed and managed via HashiCorp Terraform.  
* \[ \] The database is successfully populated with data for \>90% of discoverable artists in Leeds.  
* \[ \] All API endpoints are functional and pass integration tests.

**Deliverables:** A deployed and functioning backend system with a seeded database for Leeds.

#### **Phase 2: Public Launch \- Leeds (Duration: September 2025\)**

**Objectives:** Launch the responsive frontend application, conduct a private beta with 20-30 users, and make the site publicly accessible.

**Features Included:**

* Frontend Web Application \- Responsive UI built with Next.js.  
* Search & Filtering UI \- The user-facing interface for the discovery tool.  
* Artist Profile Pages \- Publicly viewable pages for each artist.

**Success Criteria:**

* \[ \] Private beta feedback is collected and addressed.  
* \[ \] Lighthouse scores for Performance and Accessibility are 90+.  
* \[ \] The website is publicly launched for the Leeds market.

**Deliverables:** A live, publicly accessible web application serving the Leeds area.

## **6.2 Risk Assessment**

#### 

#### **High Risk Items**

| Risk | Impact | Likelihood | Mitigation Strategy |
| :---- | :---- | :---- | :---- |
| Technical Fragility of Scraping  | High | High | A multi-source discovery strategy (Google Maps \-\> Studio Sites \-\> Instagram) is used to de-risk sole reliance on one platform. The aggregation engine uses Step Functions for resilience, allowing individual steps to fail and be retried without halting the entire workflow. |

#### 

#### **Medium Risk Items**

| Risk | Impact | Likelihood | Mitigation Strategy |
| :---- | :---- | :---- | :---- |
| Terms of Service Violation  | Medium | Medium | Only publicly available information will be aggregated. A clear policy for handling takedown or de-listing requests from artists will be established and honored. |
| Data Accuracy  | Medium | Medium | The initial style-tagging algorithm will be simple, with plans to iterate and improve based on user feedback. The MVP focuses on aggregating the portfolio; advanced analysis is a future enhancement. |

### 

## **6.3 Critical Integration Points**

* **Instagram Portfolio Scraper:** This is the most technically fragile integration, responsible for collecting core content (artist images). Its stability is paramount.  
* **Data Synchronisation Pipeline:** The integration between DynamoDB Streams, the sync Lambda function, and Amazon OpenSearch is critical. Failure or lag in this pipeline directly degrades the core search experience by presenting stale or incomplete results.  
* **Studio Discovery Service:** The initial step of finding studios via the Google Maps API is a critical dependency for the entire data aggregation workflow.

---

# **7\. Appendices**

## **7.1 Glossary**

| Term | Definition |
| :---- | :---- |
| API | Application Programming Interface |
| AWS | Amazon Web Services |
| CI/CD | Continuous Integration / Continuous Delivery |
| DynamoDB | Amazon's managed NoSQL database service |
| Fargate | A serverless compute engine for containers |
| IaaC | Infrastructure as Code |
| Lambda | AWS's serverless, event-driven compute service |
| MAU | Monthly Active Users |
| MVP | Minimum Viable Product |
| OpenSearch | A distributed, open-source search and analytics suite |
| PRD | Product Requirements Document |
| SPA | Single-Page Application |

### 

## **7.2 References**

* \[1\] Product Requirement Document: Tattoo Artist Directory MVP  
* \[2\] High-Level Design: Tattoo Artist Directory MVP  
* \[3\] Low-Level Design: Tattoo Artist Directory MVP

## **7.3 Diagrams As Code**

### **7.3.1 High-Level Design**

**flowchart** TD  
 **subgraph** User  
  U\[👩‍🎨 Client Browser\]  
 **end**

 **subgraph** AWS\_Cloud  
  **subgraph** Edge\_Services  
   CF\[Amazon CloudFront\]  
   WAF\[AWS WAF\]  
   S3\["Amazon S3 Bucket (Static SPA Hosting)"\]  
  **end**

  **subgraph** API\_Compute  
   APIGW\[Amazon API Gateway\]  
   LambdaAPI\["AWS Lambda (Backend API Logic)"\]  
  **end**

  **subgraph** Data\_Search\_Layer  
   DynamoDB\["Amazon DynamoDB (Primary Data Store)"\]  
   DDBStream\[DynamoDB Streams\]  
   LambdaSync\["AWS Lambda (Index Sync)"\]  
   OpenSearch\["Amazon OpenSearch (Search & Filter)"\]  
  **end**

  **subgraph** Async\_Data\_Aggregation  
   EventBridge\["Amazon EventBridge (Scheduler)"\]  
   StepFunctions\["AWS Step Functions (Workflow Orchestration)"\]  
   Fargate\["AWS Fargate (Containerized Scrapers)"\]  
  **end**  
 **end**

 U **\--\>**|HTTPS| CF  
 CF **\--\>**|Serves Static Content| S3  
 CF **\--\>**|Inspects Traffic| WAF  
 U **\--\>**|API Calls| APIGW  
 APIGW **\--\>**|Invokes| LambdaAPI  
 LambdaAPI **\--\>**|Queries| OpenSearch  
 LambdaAPI **\--\>**|Reads/Writes| DynamoDB  
 DynamoDB **\--\>**|Streams Changes| DDBStream  
 DDBStream **\--\>**|Triggers| LambdaSync  
 LambdaSync **\--\>**|Updates| OpenSearch  
 EventBridge **\--\>**|Triggers on Schedule| StepFunctions  
 StepFunctions **\--\>**|Orchestrates| Fargate  
 Fargate **\--\>**|Writes Aggregated Data| DynamoDB

### **7.3.2 Feature Dependency Map**

\---  
config:  
  layout: elk  
\---  
**flowchart** TD  
 **subgraph** subGraph0\["Data Governance"\]  
        F6\["F6: Artist Takedown Process"\]  
  **end**  
 **subgraph** subGraph1\["Data Pipeline"\]  
        F1\["F1: Data Aggregation & Scraping"\]  
        F3\["F3: Data Sync (Internal)"\]  
  **end**  
 **subgraph** subGraph2\["API Features"\]  
        F2\["F2: Artist Profile View"\]  
        F4\["F4: Artist Search & Discovery"\]  
  **end**  
 **subgraph** subGraph3\["User Interface"\]  
        F5\["F5: Frontend Web App"\]  
  **end**  
    F1 **\--** Must Check Denylist From **\--\>** F6  
    F1 **\--** Provides Raw Data For **\--\>** F2  
    F1 **\--** Triggers **\--\>** F3  
    F3 **\--** Provides Search Index For **\--\>** F4  
    F5 **\--** Consumes & Displays **\--\>** F2 **&** F4  


[image1]: <data:image/png;base64,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>