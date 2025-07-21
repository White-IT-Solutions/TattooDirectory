# **Data Protection Policy: Tattoo Artist Directory MVP**

| Document Title: | Data Protection Policy: Tattoo Artist Directory MVP |
| :---- | :---- |
| Version: | 1.0 |
| Date: | July 17, 2025 |
| Status: | For Review & Approval |
| Owner: | Joseph White, AWS Technical Architect |

---

# **1.0 Purpose and Scope**

This document outlines the data protection policy for the Tattoo Artist Directory Minimum Viable Product (MVP). Its purpose is to ensure that all personal data aggregated by the platform is handled responsibly, securely, and transparently.

This policy covers the entire lifecycle of data within the system, from its automated collection from public sources and processing, to its storage, public presentation, and eventual removal upon request. The platform's primary objective is to serve as a high-quality technical portfolio piece demonstrating modern cloud practices on AWS.

# **2.0 Guiding Principles**

The system is designed and operated according to the following data protection principles:

* **Lawful Basis for Processing:** The platform's lawful basis for processing is the legitimate interest of creating a comprehensive, publicly searchable directory of professional tattoo artists, using only information they have already made publicly available for promoting their services.  
* **Purpose Limitation:** All aggregated data is collected for the sole purpose of providing a discovery tool for prospective clients and a zero-effort marketing channel for artists. Data will not be sold, shared, or used for any other commercial purpose.  
* **Data Minimisation:** The system will only collect and process data that is essential for creating a useful artist profile. The data model is explicitly designed to store only the necessary attributes for the artist profile pages and search functionality.  
* **Security by Design:** The architecture is built with security as a foundational requirement. This is achieved by applying security at all layers, including data encryption, network isolation, and enforcing the principle of least privilege for all internal processes.  
* **Transparency & Individual Rights:** The platform provides a clear and accessible mechanism for artists to request the removal of their data, ensuring they maintain control over their online presence.

# **3.0 Definition of Personally Identifiable Information (PII)**

For the explicit purpose of this project, Personally Identifiable Information (PII) is defined as any data that can be used to directly or indirectly identify a specific artist. All PII is handled with the highest level of security.

The following data types are classified as **PII** within this system:

* **Artist Name:** The full name of the tattoo artist.  
* **Artist Profile Picture:** An image of the artist, treated as biometric data if it is a portrait.  
* **Instagram Handle / URL:** A direct, unique link to the artist's social media profile.  
* **Artist Biography:** The textual biography from a social media profile, which may contain personal details provided by the artist.  
* **Studio Location:** The physical address or city of the artist's studio. When combined with a name, this becomes identifying information.

The following data types are classified as **Non-PII** within this system, as they do not identify the individual artist in isolation:

* **Portfolio Images (Tattoo Artwork):** Images of tattoos created by the artist. These are considered the artist's work product. The system does not collect information about the individuals who received the tattoos.  
* **Inferred Style Tags:** A set of synthesised style categories derived from public hashtags. These are descriptive labels, not personal data.

# **4.0 Data Lifecycle Management**

## **4.1 Data Collection & Provenance**

* All data is aggregated from publicly available sources, including Google Maps, studio websites, and Instagram profiles.  
* Before attempting to scrape a profile, the Data Aggregation Engine **must** check the artist's unique identifier against the internal denylist. If the artist is on the denylist, the scraping process for that artist is aborted.

## **4.2 Data Storage & Security**

* PII is stored in the primary database (Amazon DynamoDB) and the search index (Amazon OpenSearch Service).  
* All data at rest is encrypted using keys managed by AWS Key Management Service (KMS).  
* All data in transit between services and to the end-user is encrypted using TLS.  
* All data stores (DynamoDB, OpenSearch) are located in private VPC subnets, isolated from the public internet. Access is restricted via security groups to only the specific Lambda functions that require it.

## **4.3 Data Processing & Usage**

* PII is used exclusively to populate the public-facing Artist Profile Pages and to enable search functionality.  
* PII, specifically artist names and profile pictures, **must be** sanitised and omitted from all application-level logs (e.g., CloudWatch Logs) to prevent unintentional data exposure during debugging or monitoring.

## **4.4 Data Retention & Purging**

* Artist data is retained only as long as the artist's profile remains publicly discoverable and they have not requested removal. Data is refreshed by a daily scheduled scraping run.  
* Upon the validation of a removal request, all associated PII will be permanently purged from all primary data stores (DynamoDB, OpenSearch) within  
   **5 business days**.

# **5.0 Data Subject Rights: Request for Removal**

All artists ("data subjects") have the right to request the removal of their profile from the directory. The process is as follows:

1. **Request Submission:** The artist must submit a removal request via the publicly accessible form linked from their profile page.  
2. **Request Verification:** For the MVP, each request will undergo a manual review to verify that the request is legitimate and originates from the artist in question. This is a control to prevent malicious takedown requests.  
3. **Denylist Implementation:** Upon successful verification, the artist's unique identifier (e.g., Instagram URL) is added to the permanent denylist table in DynamoDB.  
4. **Data Purge Execution:** A cleanup process is initiated to purge all of the artist's data from the DynamoDB primary table and the OpenSearch search index.  
5. **Confirmation and SLA:** The removal will be completed within the 5-business-day Service Level Agreement (SLA), and a confirmation will be sent to the artist via their provided contact method.

# **6.0 Security Incident Response**

In the event of a suspected data breach or security incident, an investigation will be conducted to determine the scope and impact. The investigation will leverage the comprehensive audit trail provided by **AWS CloudTrail** and the centralised application logs stored in **Amazon CloudWatch Logs** to trace all access and modifications to data.

# **7.0 Policy Review**

This Data Protection Policy will be reviewed on an annual basis or upon any significant changes to the system's architecture or data processing activities.

