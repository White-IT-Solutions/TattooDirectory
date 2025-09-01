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

![The architecture follows a modern, serverless, and event-driven pattern.](</docs/diagrams/High Level Overview.png> "High Level Overview")

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

| Phase 2 Features | Priority | Complexity | Dependencies |
| ----- | :---: | :---: | ----- |
| **\[F1\]** Data Aggregation Engine | P1 | High | **\[F6\]** Data Governance/Artist Takedown Process |
| **\[F1\]** Style Inference Engine | P1 | High | **\[F6\]** Data Governance/Artist Takedown Process |

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

![This diagram visually represents the relationships and feature dependencies between the core functional features of the Product Architecture.](</docs/diagrams/Feature Dependency Map.png> "Feature Dependency Map")

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
* **Third-Party API Rate Limits**: \[Details on API rate limits to be added.\] TBC <https://developers.google.com/explorer-help>

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
  * The Dev/Staging environment will be used for all tests.  
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

#### **High Risk Items**

| Risk | Impact | Likelihood | Mitigation Strategy |
| :---- | :---- | :---- | :---- |
| Technical Fragility of Scraping  | High | High | A multi-source discovery strategy (Google Maps \-\> Studio Sites \-\> Instagram) is used to de-risk sole reliance on one platform. The aggregation engine uses Step Functions for resilience, allowing individual steps to fail and be retried without halting the entire workflow. |

#### **Medium Risk Items**

| Risk | Impact | Likelihood | Mitigation Strategy |
| :---- | :---- | :---- | :---- |
| Terms of Service Violation  | Medium | Medium | Only publicly available information will be aggregated. A clear policy for handling takedown or de-listing requests from artists will be established and honored. |
| Data Accuracy  | Medium | Medium | The initial style-tagging algorithm will be simple, with plans to iterate and improve based on user feedback. The MVP focuses on aggregating the portfolio; advanced analysis is a future enhancement. |

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

```mermaid
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
```
