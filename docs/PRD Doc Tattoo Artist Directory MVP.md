# **Product Requirement Document: Tattoo Artist Directory MVP**

* **Version:** 1.0  
* **Date:** July 4, 2025  
* **Status:** MVP Defined

## **Executive Summary**

This document outlines the requirements for a Minimum Viable Product (MVP) of a new Tattoo Artist Directory. The platform will solve the problem of fragmented and inefficient artist discovery by creating the most comprehensive directory of UK tattoo artists, starting with Leeds. It will use a multi-source scraping engine to aggregate public data, providing clients with a powerful search tool and artists with a zero-effort marketing channel. The primary objective of this project is to serve as a high-quality technical portfolio piece demonstrating modern, full-stack development practices on AWS.

---

## **1\. Product Vision and Objectives**

### **1.1. Product Vision**

To become the most comprehensive and effortless platform for discovering tattoo artists, empowering clients to find the perfect artist for their vision and enabling artists to focus on their craft.

### **1.2. Objectives**

#### **1.2.1. Project Objectives**

**Showcase Technical Proficiency:** To serve as a comprehensive portfolio project demonstrating advanced skills in modern full-stack development, including frontend, backend, cloud infrastructure (AWS), Infrastructure as Code (IaaC), and data analytics.

* **The Primary goal is** Primarily to design, build, and document an enterprise-grade, scalable, and cost-effective serverless web application on AWS.
* **The secondary goal** is to develop an automated data aggregation engine to populate the application with live data.

**End-to-End System Design:** To build and document a scalable, production-ready application from the ground up.

#### **1.2.2. Product Objectives**

**For Clients (The "Seekers"):**

* To provide a search experience superior to existing platforms by enabling the discovery of *all* local artists, not just those who have signed up.  
* To allow clients to filter and search effectively by location, specific tattoo styles, and other relevant criteria.

**For Artists (The "Creators"):**

* To increase inbound client inquiries by providing a high-visibility platform for their work.  
* To reduce the time artists must spend on marketing, allowing them to concentrate on their art.

---

## **2\. Target Audience and User Personas**

### **2.1. Persona 1: Chloe the Collector (The Seeker)**

* **Bio:** Chloe is a 28-year-old graphic designer. She has a few tattoos and is planning her next piece. She is a researcher by nature and spends weeks planning, looking for an artist whose unique style perfectly matches her idea.  
* **Goals:** To discover *all* available artists in her city who specialise in a specific style, easily compare their portfolios, and find all relevant information in one place.  
* **Frustrations:** Instagram's search is ineffective for local discovery. Manually tracking artists is tedious. Many great artists have a poor web presence.

### **2.2. Persona 2: Alex the Artist (The Creator)**

* **Bio:** Alex is a talented 24-year-old tattoo artist who is building their reputation. While they have a decent Instagram following, they would rather spend time designing than being an online marketer.  
* **Goals:** To be discovered by new, serious clients looking for their style. To showcase their portfolio effectively by style, not just chronologically.  
* **Frustrations:** Instagram's chronological feed doesn't showcase their range of styles. Managing inquiries via DMs is disorganised. They lack the time and skills for effective SEO or web development.

---

## **3\. Problem Statement**

### **3.1. The User Problem**

**Prospective clients** lack a dedicated, efficient tool for discovering and evaluating local tattoo artists. They are forced to use fragmented platforms, leading to a frustrating and incomplete search process.

**Tattoo artists** struggle to reach a targeted audience and are reliant on social media tools that function poorly as professional portfolios, forcing them to spend excessive time on marketing.

### **3.2. Gaps in Current Market Solutions (e.g., Tattoodo)**

While directory websites exist, they fail to solve the core problem due to a fundamental flaw:

* **Incomplete, "Walled Garden" Directories:** They operate on an "opt-in" basis, requiring artists to sign up. This means their databases are inherently incomplete and miss a large percentage of available talent.  
* **Misaligned Business Models:** Many platforms are "pay-to-play," prioritising featured or paying artists over the most stylistically relevant artist for the client.  
* **Workflow Disruption for Artists:** Proprietary booking systems can be a barrier to adoption for artists with established workflows.

---

## **4\. Solution Overview**

We will build a comprehensive, artist-centric tattoo directory. The platform will aggregate publicly available tattoo artist portfolios and information, presenting it in a structured, searchable database that provides a complete, unbiased view of the talent in any given area.

* **For Clients:** It provides a powerful search tool to filter artists by location, style, and keywords, with results viewable in a grid or on an interactive map.  
* **For Artists:** It provides a zero-effort visibility boost by driving traffic to their existing social media, with the future option to "claim" and enhance their profile.

---

## **5\. Success Metrics and KPIs**

### **5.1. Project Success (Technical Showcase)**

* **Infrastructure & Architecture:** 100% Infrastructure as Code (IaaC); Adherence to AWS Well-Architected Framework; Fully Automated CI/CD Pipeline.  
* **Backend & Observability:** API p95 latency \< 500ms; Comprehensive observability (logging, metrics); \>80% unit test coverage.  
* **Frontend & Documentation:** Lighthouse score of 90+ (Performance, Accessibility); Complete technical documentation.

### **5.2. Product Success (User Value)**

* **Search to Engagement Rate:** 30% of users who search click on a profile.  
* **Artist Referral CTR:** 15% of profile viewers click through to the artist's social media.  
* **Referral Volume:** 1,000 total outbound clicks/month to artist pages.

### **5.3. Overall Platform Health**

* **Monthly Active Users (MAU):** 2,000 MAU within 3 months of launch.  
* **Indexing Scope:** Index 90% of discoverable artists from the top 5 UK cities within 6 months of launch.  
* **Uptime:** 99.9% uptime of the user-facing web application.  
* **Data Refresh:** Achieve a \>95% success rate on scheduled daily scraping runs.

---

## **6\. Feature Requirements (MVP)**

### **6.1: Data Aggregation Engine (P0)**

* **Description:** A backend service that builds the directory through a multi-source process: first discovering studios via Google Maps, then finding their resident artists via studio websites, and finally scraping artist portfolios from their Instagram profiles.  
* **Priority:** P0

### **6.1.1 Style Inference Engine**

It should be noted for MVP status, style inference is based on a best-effort parsing of public hashtags and is not guaranteed to be accurate.

### **6.2: Artist Profile Page (P1)**

* **Description:** A public page displaying an artist's aggregated information: profile picture, name, bio, image gallery, inferred styles, location, and a direct link to their source social media.  
* **Priority:** P1  
* **Future Enhancement:** Implement a "Claim Profile" feature for artists.

### **6.3: Internal Data Synchronisation (P1)**

* **Description:** Maintain data consistency across the various data stores (e.g., primary database, search index) by ensuring changes in one are propagated to others.  
* **Priority:** P1  
* **Future Enhancement:** Support configurable synchronisation schedules and real-time updates.

### **6.4: Artist Search & Filtering (P1)**

* **Description:** A discovery tool allowing users to find artists by multi-selecting styles, location, and keywords. Results are viewable in a default grid or an alternative interactive map view ("Explore").  
* **Priority:** P1  
* **Future Enhancement:** Highlight "trending" artists on the map.

### **6.5: Frontend Web Application (P2)**

* **Description:** A responsive web interface built using a modern JavaScript framework (e.g., React, Next.js) that allows clients to search, filter, and view artist profiles, and interact with an embedded map.  
* **Priority:** P2  
* **Future Enhancement:** Add "favourite" functionality to profiles and searches.

### **6.6: Data Governance (P3)**

* **Description:** An easily discoverable, publicly accessible form for artists to request removal from the directory, pending manual approval. This will add the artist to a scraper denylist and purge them from the search index within 5 business days.  
* **Priority:** P3  
* **Future Enhancement:** An automated approval system that verifies an artist via Meta account authentication.

---

## **7\. Non-Functional Requirements**

***Documentation Note:** To ensure a single source of truth, see **Section 4** of the **Software Requirements Document** for all NFRs and their corresponding acceptance criteria.*

---

## **8\. Constraints and Dependencies**

* **Primary Dependencies:** The project is dependent on public data from Google Maps and studio websites for *discovery*, and on Instagram for *portfolio content*.  
* **Risks:** The dependency on Instagram for content carries technical fragility (scraping can break) and Terms of Service violation risks.  
* **Risk Mitigation:** The multi-source discovery strategy significantly de-risks the project compared to a sole reliance on Instagram.  
* **Constraints:** The project is constrained to the AWS cloud platform and limited by solo developer velocity.

---

## **9\. Release Plan**

* **Phase 1: Core Platform MVP (July \- August 2025).**  
  * **Scope:** This phase includes the entire user-facing stack: the Next.js frontend, S3/CloudFront hosting, WAF, API Gateway, all Lambda API functions, DynamoDB, and OpenSearch. It also includes the complete CI/CD pipeline and Terraform IaC for these components.  
  * **Data:** The platform will be populated and demonstrated with a manually curated seed dataset of approximately 50-100 artists.  
  * **Success Criteria:** A fully functional, deployed, and testable web application that allows users to search and view the seed artist data. The success of Phase 1 is completely independent of the live scraper.  
* **Phase 2: Automated Data Aggregation Engine(August 2025).**  
  * **Scope:** This phase consists of building the asynchronous backend components: the EventBridge scheduler, the Step Functions workflow, the SQS queue, and the Fargate scraper tasks.  
  * **Success Criteria:** The engine can successfully augment the existing dataset by discovering and scraping new artist profiles, demonstrating the system's full data pipeline capabilities.

---

## **10\. Open Questions and Assumptions**

* **Assumptions:** We assume the core user problem is significant, the required data is available and parsable, and that artists will view the platform positively.  
* **Open Questions:** What is the policy for artist de-listing requests? What are the actual infrastructure costs? How accurate is the style-tagging algorithm? What are the long-term, ethical monetization options?
