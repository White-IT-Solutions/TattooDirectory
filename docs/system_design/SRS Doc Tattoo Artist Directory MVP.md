# **Software Requirements Specification for Tattoo Artist Directory MVP**

---

# **0\. Document Control**

**Document Title:** Software Requirements Specification for Tattoo Artist Directory MVP **Version:** 2.0 (Comprehensive) **Status:** For Final Review & Approval **Author:** Joseph White \- AWS Technical Architect **Distribution:** Engineering & DevOps Teams, Project Stakeholders

---

## **0.1. Revision History**

| Version | Date | Description | Author |
| :---- | :---- | :---- | :---- |
| 1.0 | July 4, 2025 | xxx | Joseph White |
| 2.0 | July 4, 2025 | xxx | Joseph White |

## **0.2. Reviewer List**

| Name | Role |
| :---- | :---- |
| *\[Stakeholder Name\]* | *\[Stakeholder Role\]* |
| *\[Lead Engineer Name\]* | *\[Lead Engineer Role\]* |

---

# **1\. Introduction**

## **1.1 Purpose**

This document outlines the Software Requirements Specification (SRS) for the Minimum Viable Product (MVP) of the Tattoo Artist Directory. The primary purpose of this project is to solve the problem of inefficient and fragmented tattoo artist discovery by creating the most comprehensive, searchable directory of UK tattoo artists, starting with an initial launch in Leeds.

The platform will utilise an automated data aggregation engine to build its database from public sources, providing prospective clients ("Seekers") with a powerful discovery tool and artists ("Creators") with a zero-effort marketing channel. A key project objective is to serve as a high-quality technical portfolio piece demonstrating modern, full-stack development and cloud architecture practices on Amazon Web Services (AWS).

## **1.2 Scope**

The scope of the MVP is to deliver a production-ready web application that fulfils the core vision of a comprehensive, aggregated artist directory for a single city.

### **1.2.1 In Scope:**

* An automated data aggregation engine that discovers and scrapes artist data from public sources (Google Maps, studio websites, Instagram).  
* Public-facing artist profile pages displaying aggregated information, including name, bio, portfolio gallery, styles, and location.  
* A discovery tool allowing users to search and filter artists by style, location, and keywords, with results available in a grid and an interactive map view.  
* The initial data seeding will be for the city of Leeds.  
* The entire infrastructure will be defined using Infrastructure as Code (IaaC) and deployed via a fully automated CI/CD pipeline.

### **1.2.2 Out of Scope:**

* **Artist "Claim Profile" Feature:** Functionality for artists to claim and manage their profiles is a future enhancement.  
* **Proprietary Booking System:** The MVP will not include any direct booking functionality; it will direct users to artists' existing channels.  
* **Monetisation Features:** All monetisation strategies are explicitly out of scope for the MVP.

## **1.3 Definitions, Acronyms, and Abbreviations**

| Term | Definition |
| :---- | :---- |
| API | Application Programming Interface |
| AWS | Amazon Web Services |
| AZ | Availability Zone |
| CI/CD | Continuous Integration / Continuous Delivery |
| CDN | Content Delivery Network |
| DynamoDB | Amazon's managed NoSQL database service |
| Fargate | A serverless compute engine for containers on AWS |
| HLD | High-Level Design |
| IaaC | Infrastructure as Code |
| IAM | Identity and Access Management (AWS) |
| Lambda | AWS's serverless, event-driven compute service |
| LLD | Low-Level Design |
| MAU | Monthly Active Users |
| MVP | Minimum Viable Product |
| OpenSearch | A distributed, open-source search and analytics suite |
| PRD | Product Requirements Document |
| S3 | Simple Storage Service (AWS) |
| SPA | Single-Page Application |
| SRS | Software Requirements Specification |
| VPC | Virtual Private Cloud (AWS) |
| WAF | Web Application Firewall |

## 

## **1.4 References**

1. Product Requirement Document: Tattoo Artist Directory MVP  
2. High-Level Design: Tattoo Artist Directory MVP  
3. Low-Level Design: Tattoo Artist Directory MVP  
4. Product Specification: Tattoo Artist Directory MVP

---

# **2\. Overall Description**

## **2.1 Product Perspective**

The Tattoo Artist Directory is a new, standalone web platform. It operates as a self-contained system but is critically dependent on external, public data sources for its primary function. It interfaces with:

* **Google Maps:** For the initial discovery of tattoo studio locations.  
* **Instagram (Public Data):** For scraping artist portfolio images and profile information.

The system will not require users to create accounts in the MVP version.

## **2.2 Product Functions**

The core functionality of the MVP can be summarised as follows:

1. **Data Aggregation:** Automatically discovering and scraping public data to build and maintain the artist directory.  
2. **Artist Profile Display:** Presenting the aggregated artist information in a structured, consistent, and user-friendly format on individual profile pages.  
3. **Artist Search and Filtering:** Providing powerful tools for clients to discover artists based on specific criteria like tattoo style and location.

## **2.3 User Characteristics**

| User Persona | Description | Goals | Frustrations |
| :---- | :---- | :---- | :---- |
| **Chloe the Collector (Seeker)** | A 28-year-old graphic designer who researches extensively to find the perfect artist for her specific tattoo ideas. | Discover *all* available local artists who specialise in a niche style and easily compare their portfolios in one place. | Ineffective search on platforms like Instagram, tedious manual tracking of artists, and great artists having a poor web presence. |
| **Alex the Artist (Creator)** | A talented 24-year-old artist building their reputation. They have a good Instagram following but prefer designing tattoos to social media marketing.  | To be discovered by new, serious clients; to showcase their portfolio effectively by style, not just chronologically. | Instagram's chronological feed doesn't showcase their range; managing DMs is disorganised; lacks time/skills for SEO or web development. |

### 

## **2.4 Constraints**

* **Technology Platform:** The project is constrained to the AWS cloud platform and its services.  
* **Data Source Dependency:** The system is fundamentally dependent on the availability, structure, and accessibility of public data from Google Maps and Instagram.  
* **Development Resources:** The project is constrained by the velocity of a solo developer.  
* **Ethical/Legal:** The project must operate within the bounds of acceptable use for public data and establish a clear policy for artist de-listing requests. Scraping activities carry an inherent risk of violating Terms of Service of external platforms.

## **2.5 Assumptions and Dependencies**

* **Problem Significance:** We assume the problem of artist discovery is significant enough to attract users to a new platform.  
* **Data Availability:** We assume that the required data (studio locations, artist profiles, portfolio images) is publicly available and can be programmatically scraped and parsed.  
* **Artist Reception:** We assume that artists will view the automated aggregation of their public information as a positive, zero-effort marketing channel.  
* **Dependency on Instagram:** The project is highly dependent on Instagram for portfolio content. This is a known risk due to the technical fragility of scraping and potential Terms of Service violations.

---

# **3\. Functional Requirements**

| Feature | Priority | Complexity | Associated Functional Requirement |
| :---: | :---: | :---: | :---: |
| **\[F1\]** Data Aggregation Engine | P1 | High | 3.1 |
| **\[F2\]** Artist Profile | P0 | Medium | 3.2 |
| **\[F3\]** Data Sync (Internal) | P0 | Medium | \- |
| **\[F4\]** Artist Search & Discovery | P0 | High | 3.3 |
| **\[F5\]** Frontend Web Application | P0 | Medium | \- |
| **\[F6\]** Data Governance/Artist Takedown Process | P0 | Low | 3.5 |

## **3.1 Data Aggregation**

* **FR-AGG-01:** The system shall automatically discover tattoo studios in a specified city using the Google Maps API.  
* **FR-AGG-02:** The system shall programmatically scrape the websites of discovered studios to identify resident artist names and links to their Instagram profiles.  
* **FR-AGG-03:** The system shall programmatically scrape public Instagram profiles of identified artists to collect their profile picture, bio, and portfolio images.  
* **FR-AGG-04:** All aggregated data shall be structured and stored in the system's primary database.  
* **FR-AGG-05:** The entire data aggregation workflow shall be triggered automatically on a recurring schedule (e.g., daily).  
* **FR-AGG-06:** Any given artist ID should be checked against a denylist for scraping and skipped if a match is confirmed.  
* **FR-AGG-07:** The system **must** parse the bio text of a scraped artist profile to identify and extract all hashtags.  
* **FR-AGG-08:** The system **must** clean extracted hashtags by converting them to lowercase and removing the leading '\#' character.  
* **FR-AGG-09:** The system **must** filter the cleaned hashtag list against a predefined stop list of common, non-style-related terms.  
* **FR-AGG-010:** The system **must** store the final, cleaned list of inferred styles as a String Set in the `styles` attribute of the artist's record in the DynamoDB table.

## **3.2 Artist Profile**

* **FR-PRF-01:** The system shall render a unique, public-facing web page for each artist in the directory.  
* **FR-PRF-02:** The artist profile page shall display the artist's name, profile picture, biography, and studio location information.  
* **FR-PRF-03:** The artist profile page shall display a responsive gallery of the artist's portfolio images.  
* **FR-PRF-04:** The artist profile page shall display inferred tattoo styles as clickable tags. When a tag is clicked, the system shall trigger a new search for that style.  
* **FR-PRF-05:** The artist profile page shall contain a prominent call-to-action button that links directly to the artist's source social media profile (e.g., Instagram).  
* **FR-PRF-06:** The artist profile page shall display an embedded map showing the studio's location.  
* **FR-PRF-07:** The artist profile page shall contain a prominent call-to-action button that links to a denylist and delisting form for artists to complete if they do not wish to be included on the site.

## **3.3 Search and Filtering**

* **FR-SRCH-01:** The system shall provide an interface for users to search for artists by keywords.  
* **FR-SRCH-02:** The system shall allow users to filter artist search results by one or more tattoo styles using multi-select checkboxes.  
* **FR-SRCH-03:** The system shall allow users to filter artist search results by location.  
* **FR-SRCH-04:** Search results shall be displayed in a responsive grid layout by default.  
* **FR-SRCH-05:** The system shall provide an alternative interactive map view for exploring search results, which plots the location of each artist/studio.  
* **FR-SRCH-06:** The system shall ensure that any artist results that have been blacklisted as part of scraping compliance are not displayed.

## **3.4 Data Governance** 

* **FR-GOV-01**: The system shall provide a publicly accessible form for artists to request removal from the directory.  
* **FR-GOV-02**: A successful removal request shall add the artist's unique identifier to a system-wide denylist.  
* **FR-GOV-03**: The data aggregation engine must not scrape or ingest data for artists on the denylist.  
* **FR-GOV-04**: Upon being added to the denylist, all existing data for that artist must be purged from the primary database (DynamoDB) and search index (OpenSearch) within 5 business days.

---

# **4\. Non-Functional Requirements**

## **4.1 Performance**

* **NFR-PERF-01:** Client-side page load time shall be less than 3 seconds (Largest Contentful Paint).  
* **NFR-PERF-02:** Server response time for search results shall be less than 1.5 seconds.  
* **NFR-PERF-03:** The backend API shall maintain a 95th percentile (p95) latency of less than 500ms under expected load.

## **4.2 Reliability and Availability**

* **NFR-REL-01:** The user-facing web application shall have an uptime of 99.9%.  
* **NFR-REL-02:** The backend data aggregation pipeline has a lower availability requirement than the user-facing application.  
* **NFR-REL-03:** Data freshness for artist profiles must be less than 48 hours old.  
* **NFR-REL-04**: The user-facing stack (CloudFront, API Gateway, Lambda) will be deployed in a multi-AZ configuration to meet a 99.9% availability target.  
* **NFR-REL-05:** The data processing stack (Step Functions, Fargate) will be deployed in a multi-AZ configuration to meet a 99% availability target.

## **4.3 Security**

* **NFR-SEC-01:** All communication between the client and server, and between internal services, shall be encrypted using TLS (HTTPS everywhere).  
* **NFR-SEC-02:** AWS WAF will be deployed with `AWSManagedRulesCommonRuleSet` to ensure protection against the OWASP Top 10 common web application security risks.  
* **NFR-SEC-03:** All data storage (S3, DynamoDB, OpenSearch) and data in transit will use KMS-managed encryption. This covers data within the database, search index, and object storage.  
* **NFR-SEC-04:** The principle of least privilege shall be enforced for all system components using narrowly scoped IAM roles for service-to-service communication.  
* **NFR-SEC-05**: All logs must be sanitised to remove or mask any data classified as PII before being written to CloudWatch logs.

## **4.4 Usability and Accessibility**

* **NFR-USA-01:** The web application shall be fully mobile-responsive and provide a consistent user experience across common viewport sizes.  
* **NFR-USA-02:** The web application shall meet the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA conformance level.

## **4.5 Scalability**

* **NFR-SCL-01:** The architecture shall be designed to support up to 2,000 Monthly Active Users (MAU) without performance degradation.  
* **NFR-SCL-02:** The data aggregation engine must be capable of scraping and processing over 1,000 artist profiles per day.  
* **NFR-SCL-03:** The API compute layer (Lambda) will use on demand scaling to handle initial load, with scaling beyond that. The scraper compute layer (Fargate) will auto-scale based on SQS queue depth.

## **4.6 Maintainability**

* **NFR-MNT-01:** 100% of the system's cloud infrastructure shall be defined as code (IaaC) using HashiCorp Terraform.  
* **NFR-MNT-02:** A fully automated Continuous Integration and Continuous Delivery (CI/CD) Gitlab Actions pipeline shall be implemented to manage testing and deployment.  
* **NFR-MNT-03:** The CI/CD pipeline must complete a deployment to the Dev/Staging environment, including all tests, in under 15 minutes.

## **4.7 Data Governance & Compliance** 

* **NFR-GOV-01 (Data Removal Integrity)**: Upon the successful processing of a data removal request, no Personally Identifiable Information (PII) associated with the subject artist must persist in any primary data stores, including Amazon DynamoDB and Amazon OpenSearch.  
* **NFR-GOV-02 (Denylist Enforcement)**: The Data Aggregation engine must query the denylist before initiating any new data scraping task. The engine is explicitly prohibited from collecting or processing data for any artist identifier present on this list.  
* **NFR-GOV-03 (PII Removal Timeliness)**: All PII associated with a valid data removal request must be permanently purged from all production data stores within **5 business days** of the initial request receipt.  
* **NFR-GOV-04 (Removal Request Availability)**: The end-to-end mechanism for submitting and processing data removal requests, from the web form to the denylist entry, must achieve **99.9% availability**.  
* **NFR-GOV-05:** All artist data is subject to an opt-out policy, and any processed requests must meet data governance & compliance standards outlined in the data protection policy.   
* **NFR-GOV-06:** A ‘Request removal’ form submission triggers a Lambda function (via webhook). This Lambda adds the artist's Instagram URL or a unique ID to a "denylist" table/set in DynamoDB, once manually approved as a legitimate request. The Data Aggregation engine must be modified to check this denylist before scraping an artist, and a separate cleanup process should purge any existing data for that artist. 

## **4.8 Budget & Cost**

* **NFR-COST-01 (MVP Operational Cost)**: The total monthly cloud infrastructure cost for the production environment must not exceed **£400** **GBP** when supporting the target load of 2,000 Monthly Active Users (MAU).  
* **NFR-COST-02 (Cost Scaling)**: The architecture must scale efficiently. The marginal infrastructure cost for each additional 1,000 MAU must not exceed **£125 GBP**.  
* **NFR-COST-03 (Cost Transparency)**: All deployed AWS resources must be tagged with `Project`, `Environment`, and `Service` tags to enable granular cost tracking and reporting via AWS Cost Explorer.  
* **NFR-COST-04 (Data Egress Efficiency)**: Data egress costs from AWS to the internet must not account for more than **30%** of the total monthly infrastructure bill, ensuring efficient use of the Content Delivery Network (CDN).

---

# **5\. System Architecture Overview**

The system is designed using a modern, serverless-first, and event-driven architectural pattern on AWS. This approach is chosen to maximise scalability, minimise operational overhead, and align with the project's goal of showcasing best practices in cloud development.

The architecture is composed of three primary logical blocks:

1. **Frontend Web Application:** A responsive Single-Page Application (SPA) built with Next.js. The static assets are hosted in an Amazon S3 bucket and distributed globally via Amazon CloudFront (CDN). AWS WAF is used at the edge to protect against common web exploits.  
2. **Backend API:** A serverless API built with Amazon API Gateway and AWS Lambda. API Gateway acts as the secure "front door" for all data requests, routing them to single-purpose Lambda functions that contain the business logic.  
3. **Asynchronous Data Aggregation Engine:** A decoupled, scheduled workflow that populates the directory. An Amazon EventBridge rule triggers an AWS Step Functions state machine daily. This state machine orchestrates a series of steps, including sending messages to an Amazon SQS queue, which then triggers containerised scraper tasks on AWS Fargate to perform the intensive data collection.  
   

Data is persisted using a purpose-built strategy: Amazon DynamoDB serves as the primary data store for fast key-value access, while Amazon OpenSearch Service powers the complex search and filtering capabilities. Data is synchronised from DynamoDB to OpenSearch via DynamoDB Streams and a Lambda function.  
*Diagram showing the serverless architecture, including CloudFront, API Gateway, Lambda, Step Functions, Fargate, DynamoDB, and OpenSearch.* 

---

# **6\. Service Level Objectives**

## **6.1 API Service Level Objectives:**

| API Endpoint | Proposed Target | Approx. Downtime/Month | Justification |
| :---- | :---- | :---- | :---- |
| GET /artists/{id} | 99.95% | 22 minutes | Core User Experience. This endpoint is critical for the primary user journey. Its data path (API Gateway → Lambda → DynamoDB) is the most reliable in the architecture, making this higher target achievable without extra cost. |
| GET /artists | 99.90% | 44 minutes | Core Search Functionality. While critical, this endpoint depends on Amazon OpenSearch. A 99.9% target aligns with the AWS SLA for a Multi-AZ OpenSearch domain, making it a practical and defensible SLO. |
| POST /removal-requests | 99.50% | 3.6 hours | Governance Function. This is crucial for data compliance but is low-traffic and less critical to the real-time user experience. An outage is not ideal but can be tolerated. |
| GET /styles | 99.50% | 3.6 hours | Ancillary Function. This endpoint provides data for the UI filters. If it fails, the user experience is degraded (filters may not populate), but the core functionality of viewing and finding artists still works. |
| GET /health | 99.90% | 44 minutes | Operational Endpoint. This reflects the baseline availability of the API Gateway and Lambda stack. It should be reliable for monitoring purposes, but its failure does not directly impact users. |

# **7\. Use Cases**

## **7.1 UC-01: Discover and Evaluate Artists**

* **Use Case ID:** UC-01  
* **Actor:** Chloe the Collector (The Seeker)  
* **Description:** A user searches for artists who match their specific style and location criteria, evaluates a profile, and connects with the artist.  
* **Preconditions:** The user is accessing the platform's homepage in a web browser.  
* **Basic Flow:**  
  * The user inputs "Leeds" into the location filter.  
  * The user selects the "Neo-traditional" and "Blackwork" style filters from a list.  
  * The system displays a grid of artist profiles that match the selected criteria.  
  * The user clicks on an artist profile that interests them.  
  * The system navigates to the full artist profile page.  
  * The user reviews the artist's portfolio image gallery, bio, and location.  
  * The user clicks the "Contact on Instagram" button.  
  * The system opens a new tab to the artist's Instagram profile page.  
* **Alternative Flows:**  
  * **7.1.A \- Map View:** At step 3, the user can toggle to an "Explore" or map view, which shows pins for each artist's studio location. Clicking a pin reveals a summary and a link to the full profile.

## **7.2 UC-02: Gain Passive Marketing Exposure**

* **Use Case ID:** UC-02  
* **Actor:** Alex the Artist (The Creator)  
* **Description:** An artist with a public profile is automatically discovered, indexed, and made visible to new clients without taking any action themselves. This is a passive use case from the artist's perspective.  
* **Preconditions:** The artist is a resident at a tattoo studio with a website, and they maintain a public Instagram profile for their work.  
* **Basic Flow:**  
  1. The system's scheduled Data Aggregation Engine runs.  
  2. The engine discovers the artist's studio via Google Maps.  
  3. The engine scrapes the studio's website and finds a link to the artist's Instagram profile.  
  4. The engine scrapes the artist's public Instagram profile, collecting their bio, profile picture, and recent portfolio images.  
  5. The system creates a new profile for the artist in its database.  
  6. The artist's profile is now discoverable via the platform's search functionality, driving new client inquiries to their Instagram.

---

# **8\. Appendices**

## **8.1 Data Models**

The system uses a single-table design in Amazon DynamoDB for primary data storage, optimised for the application's main access patterns.

* **Table Name:** TattooDirectory  
* **Key Structure Rationale:**  
  * **Partition Key (PK):** ARTIST\#{artistId} \- Co-locates all data for a single artist, allowing for efficient retrieval of a full profile with a single query.  
  * **Sort Key (SK):** Uses prefixes like METADATA and IMAGE\#{imageId} to store different types of data for the same artist within the item collection.  
* **Global Secondary Index (GSI):**  
  * **style-location-index:** A GSI is used to power the primary search functionality. It is structured with a PK of  
     STYLE\#{styleName} and an SK of LOCATION\#{location}\#... to enable highly efficient queries for all artists of a specific style in a given location.

### **8.1.1 Data Model Table**

| Attribute Name | Type | Description | Example |
| :---- | :---- | :---- | :---- |
| `PK` | String | Partition Key. ARTIST\#{artist\_id} | ARTIST\#12345 |
| `SK` | String | Sort Key. PROFILE\#{artist\_id} | PROFILE\#12345 |
| `artistName` | String | The artist's full name. | Alex the Artist |
| `instagramHandle` | String | The artist's Instagram username. | @alextattoo |
| `locationCity` | String | The primary city of operation. | London |
| `locationCountry` | String | The primary country of operation. | UK |
| `styles` | String Set | A set of inferred style tags, derived from the Style Inference Engine. Used for filtering and searching. All values are stored in lowercase. | \["traditional", "blackwork", "dotwork"\] |
| `gsi1pk` | String | GSI 1 Partition Key. STYLE\#{style\_name} | STYLE\#traditional |
| `gsi1sk` | String | GSI 1 Sort Key. LOCATION\#{country}\#{city} | LOCATION\#UK\#London |

## **8.2 External API References**

**Google Maps API:** Used for studio discovery.

**Endpoints:** 

* **Maps SDK:** For serving dynamic maps in the search results.  
* **Maps Datasets:** For serving a Platform app via dataset upload.  
* **Places API & SDK:** For integrating place details into search results.  
* **Address Validation:** For validating addresses within search results.  
* **Places Aggregate:** For defining a search area to search.

**Version:**

* **Maps SDK:**   
* **Maps Datasets:**   
* **Places API & SDK:**   
* **Address Validation:**   
* **Places Aggregate:**

**Instagram:** Not a formal API. The system relies on scraping publicly accessible profile pages. This is a known dependency risk.

* Scraping API info here

## **8.3 Open Questions**

The following questions were identified during the initial planning phase and remain open for future consideration.

* How will the accuracy of the automated style-tagging algorithm be measured and improved over time?  
* What are the potential long-term, ethical monetisation options for the platform?

## **8.4 Diagrams as Code**

### **8.4.1 High-Level Overview**

```mermaid  
**flowchart** TD  
 **subgraph** User\["User"\]  
        U\["👩‍🎨 Client Browser"\]  
  **end**  
 **subgraph** Edge\_Services\["Edge\_Services"\]  
        CF\["Amazon CloudFront"\]  
        WAF\["AWS WAF"\]  
        S3\["Amazon S3 Bucket  
            (Static SPA Hosting)"\]  
  **end**  
 **subgraph** API\_Compute\["API\_Compute"\]  
        APIGW\["Amazon API Gateway"\]  
        LambdaAPI\["AWS Lambda  
            (Backend API Logic)"\]  
  **end**  
 **subgraph** Data\_Search\_Layer\["Data\_Search\_Layer"\]  
        DynamoDB\["Amazon DynamoDB  
            (Primary Data Store)"\]  
        DDBStream\["DynamoDB Streams"\]  
        LambdaSync\["AWS Lambda  
            (Index Sync)"\]  
        OpenSearch\["Amazon OpenSearch  
            (Search & Filter)"\]  
  **end**  
 **subgraph** Async\_Data\_Aggregation\["Async\_Data\_Aggregation"\]  
        EventBridge\["Amazon EventBridge  
            (Scheduler)"\]  
        StepFunctions\["AWS Step Functions  
            (Workflow Orchestration)"\]  
        SQS\["Amazon SQS  
            (Scraping Queue)"\]  
        Fargate\["AWS Fargate  
            (Containerized Scrapers)"\]  
  **end**  
 **subgraph** AWS\_Cloud\["AWS\_Cloud"\]  
        Edge\_Services  
        API\_Compute  
        Data\_Search\_Layer  
        Async\_Data\_Aggregation  
  **end**  
    U **\--** HTTPS **\--\>** CF  
    CF **\--** Serves Static Content **\--\>** S3  
    CF **\--** Inspects Traffic **\--\>** WAF  
    U **\--** API Calls **\--\>** APIGW  
    APIGW **\--** Invokes **\--\>** LambdaAPI  
    LambdaAPI **\--** Queries **\--\>** OpenSearch  
    LambdaAPI **\--** Reads/Writes **\--\>** DynamoDB  
    DynamoDB **\--** Streams Changes **\--\>** DDBStream  
    DDBStream **\--** Triggers **\--\>** LambdaSync  
    LambdaSync **\--** Updates **\--\>** OpenSearch  
    EventBridge **\--** Triggers on Schedule **\--\>** StepFunctions  
    StepFunctions **\--** Sends Jobs To **\--\>** SQS  
    SQS \-- "Triggers Auto-scaling" **\--\>** Fargate  
    Fargate **\--** Writes Aggregated Data **\--\>** DynamoDB  
```