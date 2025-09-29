#  **Tattoo Artist Directory MVP: Future Operating Model**

#  **0\. Document Control**

**Document Title:** Tattoo Artist Directory MVP \- Future Operating Model **Author:** Joseph White \- AWS Technical Architect **Owner:** Project Stakeholders **Distribution:** Engineering & DevOps Teams **Document Status:** For Review & Approval

---

##  **0.1. Revision History**

| Version | Date | Description | Author |

| :---- | :---- | :---- | :---- |

| 1.0 | September 01, 2025 | Migrated from HLD into seperate document. | Joseph White |

##  **0.2. Reviewer List**

| Name | Role |

| :---- | :---- |

| *\[Stakeholder Name\]* | *\[Stakeholder Role\]* |

| *\[Lead Engineer Name\]* | *\[Lead Engineer Role\]* |

##  **0.3. Executive Summary**

This document outlines the future operating model for the Tattoo Artist Directory MVP, presenting a strategic roadmap for its evolution beyond the initial launch. It details a series of potential enhancements designed to improve scalability, security, feature set, and operational excellence.

The core principle of this model is a data-driven, trigger-based approach. Each proposed enhancement—from implementing a caching layer with Amazon ElastiCache for performance, to integrating automated security scanning in the CI/CD pipeline, and introducing advanced features like ML-based style tagging and artist profile claims—is tied to specific, measurable thresholds. These triggers, based on metrics such as API latency, cost, user feedback, and security events, ensure that architectural complexity and cost are only introduced when justified by real-world usage and business needs.

Key areas of future development include:
*   **Performance & Cost Optimization:** Introducing an ElastiCache caching layer and utilizing AWS PrivateLink for data aggregation to manage costs and improve response times at scale.
*   **Security & Trust:** Hardening the platform through automated security scanning, secure artist takedown/claim processes, and isolating scraper traffic.
*   **Feature Enrichment & User Experience:** Evolving the platform with high-value features like artist profile claims, improving search accuracy with Machine Learning, and enhancing transparency with public API documentation and a status dashboard.
*   **Operational Maturity:** Advancing observability with unified visualization tools like Grafana to enable faster diagnostics and a deeper understanding of system health.

This forward-looking plan provides a clear, pragmatic path for maturing the application, ensuring it remains robust, cost-effective, and aligned with user and stakeholder expectations as it grows.

##  **1.0. Future Operating Model Enhancements**

###  **1.1 Caching Layer**

While not required for the MVP, the introduction of an in-memory caching layer is a standard architectural evolution for optimizing performance and cost at scale. The decision to implement this should be driven by data from monitoring tools, aligning with the principles of the AWS Well-Architected Framework. This enhancement would involve integrating Amazon ElastiCache for Redis between the API Compute layer and the Data & Search Layer.

The primary triggers for introducing a caching layer are:

* Performance Optimisation for "Hot" Data: As user traffic grows, monitoring may reveal that a small subset of data—such as highly popular artist profiles or the results of common search queries—accounts for a large percentage of read operations. Introducing a cache for this "hot" data can significantly reduce API latency, helping to maintain the p95 latency goal of \< 500ms and improve the end-user experience. A prime candidate for immediate caching would be semi-static data, like the list of available tattoo styles, which is requested frequently but changes rarely.

* Cost Optimisation at Scale: A core principle of cost optimisation is to use the most cost-effective resources. At high volume, read operations against DynamoDB and OpenSearch can become a significant cost driver. A caching layer absorbs a large fraction of these reads, which directly reduces the cost incurred by the backend data services and can defer the need to provision more expensive, larger-capacity database or search clusters.

* Enabling Future Stateful Features: The PRD identifies a "Claim Profile" feature as a future enhancement. This will require user authentication and session management. ElastiCache for Redis is a purpose-built service for a highly performant and scalable user session store, a use case for which a stateless compute tier is a prerequisite.

**Architectural Impact:**

The API Lambda functions would be modified to adopt a *cache-aside* pattern. For a given read request, the function would first query ElastiCache. If the data exists in the cache (a cache hit), it is returned immediately. If the data is not in the cache (a cache miss), the function proceeds to query DynamoDB or OpenSearch, returns the data to the client, and populates the cache asynchronously for subsequent requests.

This represents a classic architectural trade-off: the added operational complexity and cost of a new managed service are exchanged for significant gains in performance efficiency and reliability under load.

####  **Implementation Trigger:**

A Caching layer utilising Amazon ElastiCache for Redis will be implemented if any of the following conditions are met:

*  **Budgetary constraints:** A caching layer (ElastiCache) will be considered for implementation if/when API p95 latency exceeds 400ms OR DynamoDB On-Demand read costs for the Artist table exceed £75/month.

*  **User Feedback:** 10% or more of user feedback explicitly mentions slow loading times or responsiveness issues, particularly during peak usage periods.

*  **API Load Exceeds Threshold:** Sustained API Gateway requests exceed 50 requests per second (RPS) for more than 5 minutes.

###  **1.2 Automated Security Scanning**

This should be integrated into the CI/CD pipeline. This includes running `npm audit` for dependency scanning, using static analysis (SAST) tools to lint code for security issues, and potentially running dynamic scans (DAST) against the dev/staging environment.

####  **Implementation Trigger:**

Automated security scanning will be introduced into the CI/CD pipeline if any of the following conditions are met:

*  **Critical Vulnerabilities:** \`npm audit\` reports a "critical" or "high" severity vulnerability in direct or transitive dependencies.

*  **Security Findings in Code:** SAST (Static Application Security Testing) tools identify 5 or more "high" severity security findings in the application codebase within a single release cycle.

*  **External Security Audit Recommendation:** A third-party security audit recommends the implementation of automated scanning tools.

###  **1.3 AWS PrivateLink & 3rd Party Proxy Service**

AWS PrivateLink would serve as the secure communication backbone for the Data Aggregation component. Its primary role would be to replace the NAT Gateway for outbound traffic from the Fargate scrapers.

By establishing a VPC Endpoint, Fargate tasks could securely connect to a third-party rotating proxy service via AWS's private network. This would enhance the system's robustness by mitigating the risk of the scraper's IP address being blocklisted by target websites, while also improving the security posture by keeping sensitive scraping traffic off the public internet.

Potential 3rd party proxy services suitable for this role are available as part of the AWS Marketplace platform.

####  **Implementation Trigger:**

AWS PrivateLink and a 3rd party proxy service will be implemented if/when:

*  **Scraper IP Blockage:** The Fargate scrapers experience an IP block rate exceeding 5% of requests over a 24-hour period, or encounter IP-related access denials from target websites on 3 or more distinct occasions within a month.

*  **Data Transfer Costs:** Outbound data transfer costs through the NAT Gateway for the Data Aggregation component exceed £50/month.

*  **Security Audit Recommendation:** A security audit or penetration test identifies the direct outbound internet access from Fargate as a significant security vulnerability requiring mitigation.

###  **1.4 Public Documentation Page**

A publicly accessible documentation page for API error codes would be a valuable addition for both internal debugging and external client integration. This page would list all possible error codes returned by the Backend API, along with their corresponding HTTP status codes, a brief description of the error, and potential solutions or remediation steps. This transparency would significantly improve the developer experience for any future consumers of the API, enabling quicker issue resolution and reducing reliance on direct support.

**Implementation Trigger:**

A public documentation page for API error codes will be published if/when:

*  **API Misuse/Support Tickets:** The project receives 5 or more support inquiries related to misunderstood API error codes within a 30-day period.

*  **New API Consumers:** The API is integrated by 2 or more external development teams or services.

*  **Developer Experience Feedback:** Direct user feedback or stakeholder requests highlight a need for clearer API documentation to improve developer experience.

###  **1.4 Machine Learning-Based Inference**

A key area for future enhancement is to replace the simple hashtag scraper with a more sophisticated Machine Learning pipeline to improve the accuracy and relevance of style tags.

*  **Text Analysis:** The artist's bio text could be processed by **AWS Comprehend**. By using custom entity recognition, the model could be trained to identify tattoo styles mentioned in natural language, even without hashtags.

*  **Image Analysis:** A more advanced approach would involve analyzing the artist's actual tattoo images. **AWS Rekognition Custom Labels** could be used to train a model to classify images into specific style categories (e.g., "Japanese," "Fine Line," "Neo-traditional"). This would provide the most accurate style data but requires a significant investment in data labeling and model training.

####  **Implementation Trigger:**

Machine Learning-based inference for style tagging will be implemented if/when:

*  **Search Inaccuracy Feedback:** User feedback indicates that 20% or more of search results are irrelevant due to inaccurate style tagging (e.g., direct user surveys or reported issues).

*  **Manual Tagging Overhead:** The manual effort for correcting or adding style tags to new artists exceeds 10 hours per week.

*  **Data Volume:** The total number of artist profiles in the directory exceeds 5,000, making manual or simple tagging impractical.

###  **1.5 Automated Artist Takedown Approval**

Currently, processing artist takedown requests requires a manual approval process due to the absence of a reliable method to authenticate the legitimacy of the request. To address this, a future enhancement would involve implementing an Instagram account verification mechanism.

This would allow the system to confirm that the requesting party legitimately owns the associated artist's Instagram account, thereby automating the takedown approval process and preventing malicious actors from removing valid profiles.

####  **Implementation Trigger:**

Automated artist takedown approval will be implemented if/when:

*  **Manual Processing Time:** The average time taken to manually process an artist takedown request exceeds 48 hours.

*  **Volume of Requests:** The system receives 10 or more legitimate artist takedown requests within a 30-day period.

*  **Security Incidents:** There is an attempted malicious takedown of a profile that highlights the need for a robust verification mechanism.

###  **1.6 Artist Profile Claim**

The "Artist Profile Claim" feature is a planned future enhancement, not part of the Minimum Viable Product (MVP). It will enable tattoo artists to assert ownership and control over their public profiles within the directory. This feature is critical for empowering artists and moving beyond a purely aggregated, read-only platform.

####  **Key Requirements & Architectural Impact:**

**Authentication Mechanism:** Implementing an artist profile claim necessitates a robust authentication system. Artists will need a secure way to register, log in, and verify their identity. This implies:

*  **User Registration & Login:** A new user management system will be required to handle artist sign-ups and authentication.

*  **Identity Verification:** A mechanism to verify that the claiming artist genuinely owns the associated profile (e.g., integrating with Instagram for verification as mentioned in "Automated Artist Takedown Approval").

**Stateful Database Element:** The "Claim Profile" feature will introduce a significant stateful element to the architecture. While the current MVP relies on a stateless API compute tier, enabling profile claims will require:

*  **User Session Management:** Maintaining authenticated artist sessions will likely require a dedicated session store, such as Amazon ElastiCache for Redis, as indicated in "Future Operating Model Enhancements." This service is designed for high-performance and scalable session management, a prerequisite for supporting stateful user interactions.

*  **Artist-Specific Data:** The primary database (DynamoDB) will need to store additional data related to claimed profiles, such as artist login credentials (securely managed via AWS Secrets Manager), profile customisation settings, and potentially analytics related to their claimed page.

This enhancement directly aligns with the "Enabling Future Stateful Features" section under "Caching Layer" (1.1), where the need for a user session store like ElastiCache for Redis is explicitly mentioned. It also connects to the "Automated Artist Takedown Approval" (1.5), as a verified claim process could streamline de-listing requests. The implementation of this feature would mark a significant evolution of the platform from a pure directory to an interactive marketing tool for artists.

####  **Implementation Trigger:**

The "Artist Profile Claim" feature will be developed if/when:

*  **Artist Interest:** 50 or more unique tattoo artists express direct interest in claiming their profiles or directly inquire about such a feature via a dedicated contact channel or survey.

*  **Engagement Metrics:** The platform reaches 1,000 Monthly Active Users (MAU) for the client-facing directory, indicating sufficient client-side traction to justify artist engagement.

*  **Strategic Prioritization:** Project stakeholders formally prioritize direct artist engagement and marketing as the next major product iteration.

###  **1.7 Public Status Dashboard**

A public site status dashboard would provide real-time visibility into the health and availability of the Tattoo Artist Directory MVP. This transparency is valuable for users, artists, and stakeholders, building trust and reducing support inquiries during outages.

####  **Option 1: Managed Status Page Service (e.g., Better Stack, Atlassian Statuspage):**

*  **Pros:** Quick to set up, highly customizable, includes features like incident communication, subscriber notifications, and a dedicated domain. Many services integrate directly with AWS CloudWatch metrics.

*  **Cons:** Introduces a third-party dependency and associated cost. For a portfolio piece, it might abstract away some of the underlying monitoring implementation details.

*  **Implementation:** Connect the chosen service to CloudWatch alarms and metrics via API integrations or webhooks. Define the components to be monitored (e.g., Frontend, Backend API, Data Aggregation) and the metrics that represent their health (e.g., API Gateway 5xx errors, Lambda throttles, CloudFront availability).

####  **Option 2: Native AWS Solution (e.g., Amazon CloudWatch Dashboards with public sharing):**

*  **Pros:** Cost-effective (leveraging existing CloudWatch setup), fully within the AWS ecosystem, showcases deeper AWS proficiency.

*  **Cons:** Requires more manual setup for public accessibility and custom styling. Incident communication features are not built-in and would require additional services (e.g., SNS for notifications, custom Lambda for status updates).

*  **Implementation:** Create a dedicated CloudWatch Dashboard with key metrics and alarms for the application's health. While CloudWatch Dashboards can be shared publicly, this typically requires specific IAM policies and careful consideration of what data is exposed.

####  ** Security Considerations \- Domain Isolation:**

A critical requirement for a public status dashboard is domain isolation. The status page **must be hosted on a separate domain or subdomain** from the main application (e.g.status.tattooartistdirectory.com).

*  **Mitigation of DNS/CDN Attacks:** If the main application's domain or CDN is compromised or experiencing issues (e.g., a DDoS attack), the status page, if on the same domain, would also be affected and potentially unreachable. By hosting on a separate domain, managed by a different DNS provider or CDN, the status page acts as an independent source of truth, remaining accessible even if the primary application's infrastructure fails.

*  **Reduced Attack Surface:** Isolating the status page on a separate domain reduces the attack surface on the main application. It also prevents potential cross-site scripting (XSS) or other web vulnerabilities on the status page from directly impacting the main application's security.

*  **Clear Communication Channel:** A separate status domain provides a dedicated, reliable channel for communicating outages and updates to users, even if the primary application is completely down.

####  **Implementation Trigger**

A public status dashboard will be implemented if/when:

*  **Outage-Related Inquiries:** The project receives 3 or more user or stakeholder inquiries about system availability or outages within a 30-day period.

*  **Monitoring Maturity:** The existing CloudWatch monitoring and alarming setup is deemed "Mature" (all key metrics are instrumented, dashboards are configured, and alarms are in place for critical thresholds).

*  **Transparency Requirement:** Project stakeholders or future users explicitly request greater transparency regarding system health and incident communications.

###  **1.8 Observability Visualisation Enhancements**

For the existing serverless-first architecture, the introduction of advanced observability visualization tools like Grafana and potentially Prometheus would represent a significant future enhancement. While Grafana offers immediate benefits as a unified "single pane of glass," Prometheus introduces powerful, albeit more complex, capabilities for application-level metrics, particularly for the Fargate component.

####

####  **Key Benefits of Adding Grafana (Future)**

Implementing Grafana would unify disparate monitoring data into a single, highly customizable visualization layer. This would provide:

1.  **Unified Dashboards**: A single Grafana dashboard could display metrics from AWS CloudWatch (e.g., Lambda invocations, DynamoDB consumed capacity), logs from Amazon OpenSearch, and traces from AWS X-Ray, offering a holistic view of application health.

2.  **Advanced Visualization**: Grafana's superior dashboarding capabilities would allow for the creation of more intuitive and data-rich visualizations, enhancing the project's portfolio value.

3.  **Cross-Source Alerting**: Sophisticated alert rules could be created in Grafana to correlate data from different sources (e.g., alerting if Lambda errors increase *and* a specific log pattern appears in OpenSearch).

####

####  **Key Benefits of Adding Prometheus (Future)**

Prometheus, an open-source standard for metrics collection, would offer:

1.  **Powerful Query Language (PromQL)**: PromQL would enable complex real-time calculations on metrics, such as the precise percentage of failed requests for a specific API endpoint over a time window.

2.  **Standardized Metrics**: Prometheus provides a standardized format for metrics, with a vast ecosystem of "exporters" for third-party applications, databases, and hardware.

3.  **Enhanced Container Monitoring**: Prometheus is well-suited for monitoring containerized workloads like the Fargate-based scrapers. An exporter could run as a sidecar container to expose detailed application-level metrics.

####

####  **Implementation Challenges & Architectural Impact (Future)**

Integrating Prometheus and Grafana involves significant architectural considerations for a serverless design:

*  **Hosting Overhead**: Hosting Prometheus and Grafana, likely on Amazon ECS with Fargate, would add operational complexity and cost, contrasting with the serverless model's goal of reducing infrastructure management.

*  **The Lambda Scraping Problem**: Prometheus's pull-based model is an anti-pattern for ephemeral Lambda functions. Lambda functions would need to push metrics to an intermediary service like the Prometheus Pushgateway, adding another component to manage.

*  **Exporter Management**: Obtaining metrics from managed services like OpenSearch would require dedicated exporter tasks (e.g., on Fargate).

####

####  **Conclusion & Recommendation for Future Enhancement**

For a future enhancement, the most pragmatic and highest-value approach would be to **integrate Grafana first, leveraging existing AWS monitoring services as data sources.** This would provide a unified, "single pane of glass" with minimal architectural change.

**Recommended Steps for Future Implementation:**

*  **Deploy Grafana**: Utilize AWS Managed Grafana for a fully managed experience or deploy the open-source version to a Fargate task for more control.

*  **Add Data Sources**: Configure Grafana to connect to AWS CloudWatch, Amazon OpenSearch, and AWS X-Ray.

*  **Build Unified Dashboards**: Re-create key monitoring views in a single Grafana dashboard.

*  **Evaluate Prometheus Later**: Once Grafana is established, assess whether the additional power of PromQL justifies the complexity of adding Prometheus and the Pushgateway for Lambda and Fargate metrics. Integrating a Prometheus exporter for Fargate scrapers would be a logical next step to further demonstrate containerized application instrumentation.

This phased approach would provide an immediate and impressive boost to monitoring capabilities while respecting the trade-offs of adding new components to a well-designed serverless architecture.

####  **Implementation Trigger:**

Advanced observability visualization (e.g., Grafana, potentially Prometheus) will be implemented if/when:

*  **Debugging Complexity:** The average time to diagnose and resolve a "critical" or "high" severity issue (MTTR) exceeds 2 hours, indicating that existing CloudWatch dashboards and logs are insufficient for rapid root cause analysis.

*  **Metric Volume:** The number of unique CloudWatch metrics monitored across the architecture exceeds 100, making analysis in standard dashboards cumbersome.

*  **Cross-Service Insights:** The engineering team frequently requires correlated insights from multiple AWS services (e.g., Lambda, DynamoDB, OpenSearch) to understand performance or identify issues, which is difficult to achieve with current tooling.
