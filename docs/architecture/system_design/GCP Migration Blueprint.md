# **GCP Migration Blueprint: Tattoo Artist Directory MVP**

---

# **Document Control**

**Document Title:** GCP Migration Blueprint for Tattoo Artist Directory MVP  
**Version:** 1.0  
**Status:** For Review & Implementation  
**Author:** Joseph White - Cloud Architect  
**Distribution:** Engineering & DevOps Teams, Project Stakeholders  

---

## **Executive Summary**

This document provides a comprehensive blueprint for migrating the Tattoo Artist Directory MVP from AWS to Google Cloud Platform (GCP). The migration maintains functional parity while leveraging GCP's unique strengths in serverless computing, data analytics, and machine learning capabilities.

The current AWS architecture is a sophisticated serverless application with 19 Terraform modules spanning multiple accounts. This blueprint addresses the fundamental differences between AWS and GCP paradigms, providing detailed migration strategies for each component while highlighting potential challenges and optimization opportunities.

### **Key Migration Benefits**

- **Enhanced ML Capabilities**: Native integration with Vertex AI for advanced tattoo style classification
- **Superior Analytics**: BigQuery integration for advanced search analytics and business intelligence
- **Cost Optimization**: More granular pricing models and sustained use discounts
- **Global Infrastructure**: Better global load balancing and edge computing capabilities
- **Developer Experience**: Cloud Run's superior container orchestration and Cloud Functions' improved cold start performance

---

# **1. Architecture Overview Comparison**

## **1.1 Current AWS Architecture**

The existing system employs a multi-account serverless architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Multi-Account Architecture               │
├─────────────────────────────────────────────────────────────────┤
│ Infrastructure Account:                                         │
│ • API Gateway + Lambda (Node.js 20.x ARM64)                     │
│ • DynamoDB (single-table design) + OpenSearch                   │
│ • ECS Fargate + Step Functions                                  │
│ • S3 + CloudFront + WAF                                         │
│                                                                 │
│ Security Account:                                               │
│ • GuardDuty + Security Hub + IAM Access Analyzer                │
│                                                                 │
│ Audit Account:                                                  │
│ • CloudTrail + CloudWatch Logs + S3 Audit Buckets               │
└─────────────────────────────────────────────────────────────────┘
```

## **1.2 Target GCP Architecture**

The GCP architecture leverages Google's native services while maintaining functional equivalence:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GCP Multi-Project Architecture               │
├─────────────────────────────────────────────────────────────────┤
│ Application Project:                                            │
│ • API Gateway + Cloud Functions (Node.js 20)                    │
│ • Firestore + Elasticsearch Service                             │
│ • Cloud Run + Workflows                                         │
│ • Cloud Storage + Cloud CDN + Cloud Armor                       │
│                                                                 │
│ Security Project:                                               │
│ • Security Command Center + Cloud Asset Inventory               │
│                                                                 │
│ Audit Project:                                                  │
│ • Cloud Audit Logs + Cloud Logging + Cloud Storage              │
└─────────────────────────────────────────────────────────────────┘
```

---

# **2. Service Mapping & Migration Strategy**

## **2.1 Core Service Mappings**

| AWS Service | GCP Equivalent | Migration Complexity | Notes |
|-------------|----------------|---------------------|-------|
| **API Gateway** | **API Gateway** | Low | Direct functional equivalent |
| **Lambda** | **Cloud Functions** | Low-Medium | Runtime parity, different deployment model |
| **DynamoDB** | **Firestore** | High | Schema redesign required |
| **OpenSearch** | **Elasticsearch Service** | Medium | Managed service with similar capabilities |
| **ECS Fargate** | **Cloud Run** | Medium | Container-first approach, better scaling |
| **Step Functions** | **Workflows** | Medium | YAML vs JSON, similar orchestration |
| **S3** | **Cloud Storage** | Low | Direct equivalent with better pricing |
| **CloudFront** | **Cloud CDN** | Low | Similar global distribution |
| **WAF** | **Cloud Armor** | Medium | Different rule syntax |
| **IAM** | **IAM** | High | Completely different model |
| **KMS** | **Cloud KMS** | Low | Similar encryption capabilities |
| **CloudWatch** | **Cloud Monitoring** | Medium | Different metrics model |

## **2.2 Advanced Service Mappings**

| AWS Service | GCP Equivalent | Migration Strategy |
|-------------|----------------|-------------------|
| **GuardDuty** | **Security Command Center** | Reconfigure threat detection rules |
| **Security Hub** | **Security Command Center** | Centralize security findings |
| **Config** | **Cloud Asset Inventory** | Rebuild compliance rules |
| **CloudTrail** | **Cloud Audit Logs** | Automatic audit logging |
| **Secrets Manager** | **Secret Manager** | Direct migration possible |
| **EventBridge** | **Eventarc** | Event-driven architecture redesign |

---

# **3. Detailed Migration Plan by Component**

## **3.1 Frontend & CDN Migration**

### **Current AWS Implementation**
- S3 static website hosting with versioning
- CloudFront global distribution with OAI
- WAF protection with managed rule sets
- ACM certificates for HTTPS

### **GCP Target Implementation**
```hcl
# Cloud Storage bucket for static hosting
resource "google_storage_bucket" "frontend" {
  name     = "${var.project_id}-frontend"
  location = "US"
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Cloud CDN with global load balancer
resource "google_compute_global_forwarding_rule" "frontend" {
  name       = "${var.project_id}-frontend-lb"
  target     = google_compute_target_https_proxy.frontend.id
  port_range = "443"
}

# Cloud Armor security policy
resource "google_compute_security_policy" "frontend" {
  name = "${var.project_id}-frontend-armor"
  
  rule {
    action   = "allow"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
  
  # OWASP Top 10 protection
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
  }
}
```

### **Migration Challenges**
- **Certificate Management**: GCP uses Google-managed certificates vs. ACM
- **WAF Rules**: Cloud Armor uses different syntax than AWS WAF
- **Origin Access**: Different security model for bucket access

### **Optimization Opportunities**
- **Better Global Distribution**: GCP's global load balancer provides superior routing
- **Integrated Security**: Cloud Armor integrates better with other GCP security services
- **Cost Savings**: More predictable pricing model

## **3.2 API Layer Migration**

### **Current AWS Implementation**
- API Gateway HTTP API with Lambda integration
- IAM authorization and JWT support
- Request/response transformation
- Throttling and rate limiting

### **GCP Target Implementation**
```hcl
# API Gateway
resource "google_api_gateway_api" "main" {
  provider = google-beta
  api_id   = "${var.project_id}-api"
}

resource "google_api_gateway_api_config" "main" {
  provider      = google-beta
  api           = google_api_gateway_api.main.api_id
  api_config_id = "${var.project_id}-config"
  
  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi.yaml", {
        project_id = var.project_id
        region     = var.region
      }))
    }
  }
}

# Cloud Functions for API handlers
resource "google_cloudfunctions2_function" "api_handler" {
  name     = "${var.project_id}-api-handler"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.api_handler.name
      }
    }
  }
  
  service_config {
    max_instance_count = 100
    min_instance_count = 0
    available_memory   = "512Mi"
    timeout_seconds    = 30
    
    environment_variables = {
      FIRESTORE_PROJECT_ID = var.project_id
      ELASTICSEARCH_URL    = google_elasticsearch_cluster.main.endpoint
    }
    
    secret_environment_variables {
      key        = "APP_SECRETS"
      project_id = var.project_id
      secret     = google_secret_manager_secret.app_secrets.secret_id
      version    = "latest"
    }
  }
}
```

### **Key Differences from AWS**
- **Deployment Model**: Cloud Functions use ZIP uploads vs. container images
- **Cold Starts**: GCP has faster cold start times for Node.js
- **Concurrency**: Different concurrency model (per-instance vs. per-function)
- **Networking**: VPC Connector required for private resource access

### **Migration Strategy**
1. **API Definition**: Convert API Gateway configuration to OpenAPI 3.0
2. **Function Code**: Minimal changes required for Cloud Functions
3. **Environment Variables**: Migrate to GCP Secret Manager
4. **Monitoring**: Implement Cloud Monitoring and Error Reporting

## **3.3 Database Layer Migration**

### **Current AWS Implementation**
- DynamoDB single-table design with GSIs
- Point-in-time recovery enabled
- DynamoDB Streams for change capture
- On-demand billing mode

### **GCP Target Implementation**
```hcl
# Firestore database
resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  concurrency_mode = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
}

# Firestore indexes for queries
resource "google_firestore_index" "style_location" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "artists"
  
  fields {
    field_path = "styles"
    array_config = "CONTAINS"
  }
  
  fields {
    field_path = "location.geohash"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "rating"
    order      = "DESCENDING"
  }
}

# BigQuery for analytics (bonus)
resource "google_bigquery_dataset" "analytics" {
  dataset_id = "${replace(var.project_id, "-", "_")}_analytics"
  location   = var.region
  
  description = "Analytics dataset for tattoo directory"
}

resource "google_bigquery_table" "artist_events" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "artist_events"
  
  schema = jsonencode([
    {
      name = "event_timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "artist_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "event_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "user_agent"
      type = "STRING"
      mode = "NULLABLE"
    }
  ])
}
```

### **Schema Migration Strategy**

#### **DynamoDB to Firestore Mapping**
```javascript
// AWS DynamoDB Item
{
  "PK": "ARTIST#artist-001",
  "SK": "METADATA",
  "artistId": "artist-001",
  "artistName": "Marcus Chen",
  "styles": ["japanese", "neo_traditional"],
  "gsi1pk": "STYLE#japanese",
  "gsi1sk": "LOCATION#UK#Edinburgh"
}

// GCP Firestore Document
// Collection: artists
// Document ID: artist-001
{
  "artistId": "artist-001",
  "artistName": "Marcus Chen",
  "styles": ["japanese", "neo_traditional"],
  "location": {
    "country": "UK",
    "city": "Edinburgh",
    "geohash": "gcpvj0u6yjrb"
  },
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Critical Migration Challenges**

#### **1. Query Pattern Differences**
- **DynamoDB**: Requires GSI design for different access patterns
- **Firestore**: Native support for compound queries with automatic indexing

#### **2. Consistency Model**
- **DynamoDB**: Eventually consistent reads by default
- **Firestore**: Strong consistency for single-document reads

#### **3. Pricing Model**
- **DynamoDB**: Pay per read/write capacity unit
- **Firestore**: Pay per document operation and storage

### **Data Migration Process**
```python
# Migration script example
import json
from google.cloud import firestore
import boto3

def migrate_dynamodb_to_firestore():
    # AWS DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('tattoo-directory-main')
    
    # GCP Firestore client
    db = firestore.Client()
    
    # Scan DynamoDB table
    response = table.scan()
    
    for item in response['Items']:
        if item['SK'] == 'METADATA':
            # Transform DynamoDB item to Firestore document
            doc_data = {
                'artistId': item['artistId'],
                'artistName': item['artistName'],
                'styles': item.get('styles', []),
                'location': {
                    'country': item.get('locationCountry', ''),
                    'city': item.get('locationCity', ''),
                    'geohash': item.get('geohash', '')
                },
                'portfolioImages': item.get('portfolioImages', []),
                'contactInfo': item.get('contactInfo', {}),
                'metadata': {
                    'createdAt': item.get('createdAt'),
                    'updatedAt': item.get('updatedAt')
                }
            }
            
            # Write to Firestore
            doc_ref = db.collection('artists').document(item['artistId'])
            doc_ref.set(doc_data)
```

## **3.4 Search Layer Migration**

### **Current AWS Implementation**
- Amazon OpenSearch Service with VPC deployment
- Multi-AZ cluster with dedicated master nodes
- Custom domain with fine-grained access control
- Integration with DynamoDB Streams for real-time updates

### **GCP Target Implementation**
```hcl
# Elasticsearch Service (Google Cloud)
resource "google_elasticsearch_cluster" "main" {
  name     = "${var.project_id}-search"
  location = var.region
  
  node_config {
    zone         = "${var.region}-a"
    machine_type = "e2-standard-2"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
  }
  
  cluster_config {
    instance_count = 3
    
    master_config {
      num_instances   = 3
      machine_type    = "e2-standard-1"
      disk_size_gb    = 50
      is_preemptible  = false
    }
  }
  
  network_config {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.private.id
  }
  
  maintenance_policy {
    weekly_maintenance_window {
      day        = "SUNDAY"
      start_time = "02:00"
      duration   = "3h"
    }
  }
}

# Alternative: Use Vertex AI Search (recommended)
resource "google_discovery_engine_data_store" "artists" {
  location         = "global"
  data_store_id    = "${var.project_id}-artists"
  display_name     = "Tattoo Artists Search"
  industry_vertical = "GENERIC"
  content_config   = "CONTENT_REQUIRED"
  solution_types   = ["SOLUTION_TYPE_SEARCH"]
}
```

### **Search Migration Strategy**

#### **Option 1: Elasticsearch Service Migration**
- Direct migration of OpenSearch indices
- Minimal code changes required
- Familiar Elasticsearch API

#### **Option 2: Vertex AI Search (Recommended)**
- Google's managed search solution
- Built-in ML capabilities for relevance
- Natural language query processing
- Better integration with other GCP services

### **Index Migration Process**
```javascript
// Elasticsearch index mapping
const artistMapping = {
  mappings: {
    properties: {
      artistId: { type: 'keyword' },
      artistName: { 
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      styles: { type: 'keyword' },
      location: {
        properties: {
          city: { type: 'text' },
          country: { type: 'keyword' },
          coordinates: { type: 'geo_point' }
        }
      },
      portfolioImages: {
        type: 'nested',
        properties: {
          url: { type: 'keyword' },
          description: { type: 'text' },
          style: { type: 'keyword' }
        }
      }
    }
  }
};
```

## **3.5 Compute Layer Migration**

### **Current AWS Implementation**
- 7 Lambda functions (Node.js 20.x ARM64)
- ECS Fargate for web scraping containers
- Step Functions for workflow orchestration
- SQS for message queuing

### **GCP Target Implementation**

#### **Cloud Functions Migration**
```hcl
# API Handler Function
resource "google_cloudfunctions2_function" "api_handler" {
  name     = "${var.project_id}-api-handler"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "handler"
    
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.api_handler.name
      }
    }
  }
  
  service_config {
    max_instance_count               = 100
    min_instance_count               = 0
    available_memory                 = "512Mi"
    timeout_seconds                  = 30
    max_instance_request_concurrency = 1
    
    vpc_connector                 = google_vpc_access_connector.main.name
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
    
    environment_variables = {
      FIRESTORE_PROJECT_ID = var.project_id
      ELASTICSEARCH_URL    = google_elasticsearch_cluster.main.endpoint
    }
  }
}

# Firestore Trigger Function (replaces DynamoDB Streams)
resource "google_cloudfunctions2_function" "firestore_sync" {
  name     = "${var.project_id}-firestore-sync"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "firestoreSync"
  }
  
  service_config {
    available_memory = "256Mi"
    timeout_seconds  = 300
  }
  
  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.firestore.document.v1.written"
    
    event_filters {
      attribute = "database"
      value     = "(default)"
    }
    
    event_filters {
      attribute = "document"
      value     = "artists/{artistId}"
    }
  }
}
```

#### **Cloud Run Migration (replaces ECS Fargate)**
```hcl
# Cloud Run service for web scraping
resource "google_cloud_run_v2_service" "scraper" {
  name     = "${var.project_id}-scraper"
  location = var.region
  
  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
    
    containers {
      image = "gcr.io/${var.project_id}/scraper:latest"
      
      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }
      
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name = "PUBSUB_TOPIC"
        value = google_pubsub_topic.scraping_jobs.name
      }
    }
    
    vpc_access {
      connector = google_vpc_access_connector.main.name
      egress    = "PRIVATE_RANGES_ONLY"
    }
    
    service_account = google_service_account.scraper.email
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# Pub/Sub topic (replaces SQS)
resource "google_pubsub_topic" "scraping_jobs" {
  name = "${var.project_id}-scraping-jobs"
  
  message_retention_duration = "604800s" # 7 days
}

resource "google_pubsub_subscription" "scraping_jobs" {
  name  = "${var.project_id}-scraping-jobs-sub"
  topic = google_pubsub_topic.scraping_jobs.name
  
  ack_deadline_seconds = 300
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.scraping_dlq.id
    max_delivery_attempts = 3
  }
}
```

#### **Workflows Migration (replaces Step Functions)**
```yaml
# workflows/data-aggregation.yaml
main:
  steps:
    - discover_studios:
        call: http.post
        args:
          url: ${DISCOVER_STUDIOS_URL}
          body:
            locations: ["london", "manchester", "birmingham"]
        result: studios
    
    - process_studios:
        parallel:
          for:
            value: studio
            in: ${studios.body.items}
            steps:
              - find_artists:
                  call: http.post
                  args:
                    url: ${FIND_ARTISTS_URL}
                    body: ${studio}
                  result: artists
        result: all_artists
    
    - queue_scraping:
        call: http.post
        args:
          url: ${QUEUE_SCRAPING_URL}
          body:
            artists: ${all_artists}
        result: queued_jobs
    
    - run_scraping:
        call: googleapis.run.v1.namespaces.services.replaceService
        args:
          name: "namespaces/${PROJECT_ID}/services/${SCRAPER_SERVICE}"
          body:
            spec:
              template:
                spec:
                  containers:
                    - image: ${SCRAPER_IMAGE}
                      env:
                        - name: "BATCH_SIZE"
                          value: ${queued_jobs.body.batch_size}
```

### **Key Migration Challenges**

#### **1. Concurrency Models**
- **AWS Lambda**: Per-function concurrency limits
- **Cloud Functions**: Per-instance concurrency (default 1)
- **Impact**: May need to adjust scaling parameters

#### **2. Event Sources**
- **AWS**: DynamoDB Streams, SQS, EventBridge
- **GCP**: Firestore triggers, Pub/Sub, Eventarc
- **Impact**: Event payload formats differ

#### **3. Container Orchestration**
- **ECS Fargate**: Task-based model
- **Cloud Run**: Service-based model with better auto-scaling
- **Impact**: Deployment strategy changes

## **3.6 Security & IAM Migration**

### **Current AWS Implementation**
- Multi-account strategy with cross-account roles
- IAM roles with least-privilege policies
- GuardDuty for threat detection
- Security Hub for centralized findings
- KMS for encryption key management

### **GCP Target Implementation**

#### **Project Structure**
```hcl
# Application project
resource "google_project" "app" {
  name       = "${var.project_name}-app"
  project_id = "${var.project_name}-app-${random_id.suffix.hex}"
  
  billing_account = var.billing_account
  org_id          = var.org_id
}

# Security project
resource "google_project" "security" {
  name       = "${var.project_name}-security"
  project_id = "${var.project_name}-security-${random_id.suffix.hex}"
  
  billing_account = var.billing_account
  org_id          = var.org_id
}

# Audit project
resource "google_project" "audit" {
  name       = "${var.project_name}-audit"
  project_id = "${var.project_name}-audit-${random_id.suffix.hex}"
  
  billing_account = var.billing_account
  org_id          = var.org_id
}
```

#### **IAM & Service Accounts**
```hcl
# Service account for Cloud Functions
resource "google_service_account" "functions" {
  project      = google_project.app.project_id
  account_id   = "functions-sa"
  display_name = "Cloud Functions Service Account"
}

# IAM binding for Firestore access
resource "google_project_iam_member" "functions_firestore" {
  project = google_project.app.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Custom role for API functions
resource "google_project_iam_custom_role" "api_handler" {
  project     = google_project.app.project_id
  role_id     = "apiHandler"
  title       = "API Handler Role"
  description = "Custom role for API handler functions"
  
  permissions = [
    "firestore.documents.get",
    "firestore.documents.list",
    "firestore.documents.create",
    "firestore.documents.update",
    "secretmanager.versions.access"
  ]
}
```

#### **Security Command Center**
```hcl
# Security Command Center notification
resource "google_scc_notification_config" "critical_findings" {
  config_id    = "critical-findings"
  organization = var.org_id
  description  = "Critical security findings notification"
  
  pubsub_topic = google_pubsub_topic.security_alerts.id
  
  streaming_config {
    filter = "severity=\"CRITICAL\" OR severity=\"HIGH\""
  }
}

# Cloud Asset Inventory
resource "google_cloud_asset_organization_feed" "asset_feed" {
  billing_project = google_project.security.project_id
  org_id          = var.org_id
  feed_id         = "asset-inventory-feed"
  
  asset_types = [
    "compute.googleapis.com/Instance",
    "storage.googleapis.com/Bucket",
    "cloudfunctions.googleapis.com/CloudFunction"
  ]
  
  content_type = "RESOURCE"
  
  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.asset_changes.id
    }
  }
}
```

### **Critical IAM Differences**

#### **1. Role-Based vs. Resource-Based Policies**
- **AWS**: Both IAM roles and resource-based policies
- **GCP**: Primarily IAM roles with conditions
- **Impact**: Need to redesign access patterns

#### **2. Cross-Project Access**
- **AWS**: Cross-account roles with assume role
- **GCP**: Service account impersonation or shared VPC
- **Impact**: Different security model

#### **3. Conditional Access**
- **AWS**: IAM conditions in policies
- **GCP**: IAM conditions with CEL expressions
- **Impact**: Syntax differences but similar capabilities

---

# **4. Networking & Connectivity**

## **4.1 Current AWS Networking**
- Multi-AZ VPC with public/private subnets
- NAT Gateways for outbound internet access
- VPC Endpoints for AWS service access
- Security Groups and NACLs for traffic control

## **4.2 GCP Networking Implementation**

### **VPC and Subnets**
```hcl
# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.project_id}-vpc"
  auto_create_subnetworks = false
  routing_mode           = "REGIONAL"
}

# Private subnet for compute resources
resource "google_compute_subnetwork" "private" {
  name          = "${var.project_id}-private"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  
  private_ip_google_access = true
  
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Cloud NAT for outbound internet access
resource "google_compute_router" "main" {
  name    = "${var.project_id}-router"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name   = "${var.project_id}-nat"
  router = google_compute_router.main.name
  region = var.region
  
  nat_ip_allocate_option = "AUTO_ONLY"
  
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"
  
  subnetwork {
    name                    = google_compute_subnetwork.private.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }
}

# VPC Connector for serverless access
resource "google_vpc_access_connector" "main" {
  name          = "${var.project_id}-connector"
  region        = var.region
  ip_cidr_range = "10.0.2.0/28"
  network       = google_compute_network.main.name
  
  min_throughput = 200
  max_throughput = 300
}
```

### **Firewall Rules**
```hcl
# Allow internal communication
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.project_id}-allow-internal"
  network = google_compute_network.main.name
  
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "icmp"
  }
  
  source_ranges = ["10.0.0.0/8"]
}

# Allow HTTPS outbound
resource "google_compute_firewall" "allow_https_outbound" {
  name      = "${var.project_id}-allow-https-out"
  network   = google_compute_network.main.name
  direction = "EGRESS"
  
  allow {
    protocol = "tcp"
    ports    = ["443", "80"]
  }
  
  destination_ranges = ["0.0.0.0/0"]
  target_tags        = ["scraper"]
}
```

### **Key Networking Differences**

#### **1. Subnet Model**
- **AWS**: Subnets are AZ-specific
- **GCP**: Subnets are regional (span multiple zones)
- **Impact**: Simpler subnet design, better availability

#### **2. Security Groups vs. Firewall Rules**
- **AWS**: Security groups are stateful, attached to instances
- **GCP**: Firewall rules are stateful, applied by tags/service accounts
- **Impact**: Different targeting mechanism

#### **3. Private Google Access**
- **AWS**: VPC Endpoints for service access
- **GCP**: Private Google Access for API access
- **Impact**: Simpler configuration, no additional costs

---

# **5. Monitoring & Observability**

## **5.1 Current AWS Monitoring**
- CloudWatch metrics, logs, and alarms
- X-Ray for distributed tracing
- Custom dashboards and log insights
- SNS for alerting

## **5.2 GCP Monitoring Implementation**

### **Cloud Monitoring Setup**
```hcl
# Notification channel for alerts
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notifications"
  type         = "email"
  
  labels = {
    email_address = var.alert_email
  }
}

# Custom metric for API latency
resource "google_monitoring_metric_descriptor" "api_latency" {
  type         = "custom.googleapis.com/api/latency"
  metric_kind  = "GAUGE"
  value_type   = "DOUBLE"
  display_name = "API Latency"
  description  = "API endpoint response latency"
  
  labels {
    key         = "endpoint"
    value_type  = "STRING"
    description = "API endpoint path"
  }
}

# Alert policy for high error rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High API Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Cloud Function Error Rate"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_function\""
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05
      duration        = "300s"
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = [
    google_monitoring_notification_channel.email.name
  ]
}
```

### **Cloud Logging Configuration**
```hcl
# Log sink for security events
resource "google_logging_project_sink" "security_sink" {
  name        = "security-events-sink"
  destination = "storage.googleapis.com/${google_storage_bucket.security_logs.name}"
  
  filter = <<EOF
protoPayload.serviceName="cloudaudit.googleapis.com"
AND (
  protoPayload.methodName:"storage.objects"
  OR protoPayload.methodName:"iam.googleapis.com"
  OR severity>=ERROR
)
EOF
  
  unique_writer_identity = true
}

# Custom log-based metric
resource "google_logging_metric" "failed_logins" {
  name   = "failed_login_attempts"
  filter = "resource.type=\"cloud_function\" AND textPayload:\"authentication failed\""
  
  metric_descriptor {
    metric_kind = "COUNTER"
    value_type  = "INT64"
  }
}
```

### **Cloud Trace Integration**
```javascript
// Cloud Functions tracing setup
const { trace } = require('@google-cloud/trace-agent');

// Start tracing
trace.start({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  samplingRate: 0.1 // Sample 10% of requests
});

// Custom span example
exports.handler = async (req, res) => {
  const tracer = trace.get();
  const span = tracer.createChildSpan({ name: 'api-handler' });
  
  try {
    // Your function logic here
    const result = await processRequest(req);
    
    span.addLabel('status', 'success');
    return res.json(result);
  } catch (error) {
    span.addLabel('status', 'error');
    span.addLabel('error', error.message);
    throw error;
  } finally {
    span.endSpan();
  }
};
```

### **Key Monitoring Differences**

#### **1. Metrics Model**
- **AWS**: CloudWatch metrics with dimensions
- **GCP**: Cloud Monitoring with labels
- **Impact**: Similar functionality, different syntax

#### **2. Log Aggregation**
- **AWS**: CloudWatch Logs with Log Groups
- **GCP**: Cloud Logging with structured logs
- **Impact**: Better structured logging in GCP

#### **3. Distributed Tracing**
- **AWS**: X-Ray with trace segments
- **GCP**: Cloud Trace with spans
- **Impact**: Similar capabilities, different SDKs

---

# **6. Cost Analysis & Optimization**

## **6.1 Current AWS Costs (Estimated)**

| Service Category | Monthly Cost (USD) | Notes |
|------------------|-------------------|-------|
| **Compute** | $150-200 | Lambda + ECS Fargate |
| **Storage** | $50-75 | DynamoDB + S3 |
| **Search** | $100-150 | OpenSearch cluster |
| **Networking** | $45-90 | NAT Gateway + data transfer |
| **Monitoring** | $25-50 | CloudWatch + X-Ray |
| **Security** | $20-30 | GuardDuty + WAF |
| **Total** | **$390-595** | For 2,000 MAU target |

## **6.2 Projected GCP Costs**

| Service Category | Monthly Cost (USD) | Savings | Notes |
|------------------|-------------------|---------|-------|
| **Compute** | $120-160 | 20% | Cloud Functions + Cloud Run |
| **Storage** | $40-60 | 20% | Firestore + Cloud Storage |
| **Search** | $80-120 | 20% | Elasticsearch Service |
| **Networking** | $30-60 | 33% | Cloud NAT + CDN |
| **Monitoring** | $20-40 | 20% | Cloud Monitoring |
| **Security** | $15-25 | 25% | Security Command Center |
| **Total** | **$305-465** | **22%** | Sustained use discounts |

### **Cost Optimization Strategies**

#### **1. Sustained Use Discounts**
- Automatic discounts for consistent usage
- Up to 30% savings on Compute Engine
- Applied automatically, no upfront commitment

#### **2. Committed Use Discounts**
- 1-3 year commitments for predictable workloads
- Up to 57% savings on compute resources
- Flexible across machine types and regions

#### **3. Preemptible Instances**
- Up to 80% savings for fault-tolerant workloads
- Ideal for batch processing and scraping tasks
- Automatic restart capabilities

#### **4. Cloud Storage Lifecycle Management**
```hcl
resource "google_storage_bucket" "optimized" {
  name     = "${var.project_id}-optimized-storage"
  location = "US"
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}
```

---

# **7. Migration Execution Plan**

## **7.1 Migration Phases**

### **Phase 1: Foundation & Security (Weeks 1-2)**
- Set up GCP organization and projects
- Configure IAM and service accounts
- Implement networking infrastructure
- Set up monitoring and logging

### **Phase 2: Data Layer (Weeks 3-4)**
- Deploy Firestore database
- Migrate DynamoDB data to Firestore
- Set up Elasticsearch cluster
- Implement data synchronization

### **Phase 3: Application Layer (Weeks 5-6)**
- Deploy Cloud Functions
- Migrate API Gateway configuration
- Implement Cloud Run services
- Set up Workflows orchestration

### **Phase 4: Frontend & CDN (Week 7)**
- Deploy static assets to Cloud Storage
- Configure Cloud CDN and Load Balancer
- Set up Cloud Armor security policies
- Update DNS and SSL certificates

### **Phase 5: Testing & Validation (Week 8)**
- End-to-end testing
- Performance validation
- Security testing
- Load testing

### **Phase 6: Cutover & Monitoring (Week 9)**
- DNS cutover
- Monitor system health
- Performance optimization
- Documentation updates

## **7.2 Risk Mitigation Strategies**

### **1. Blue-Green Deployment**
- Maintain AWS environment during migration
- Gradual traffic shifting using DNS weighting
- Immediate rollback capability

### **2. Data Synchronization**
- Real-time sync between AWS and GCP during migration
- Validation scripts to ensure data integrity
- Automated rollback procedures

### **3. Testing Strategy**
- Comprehensive test suite covering all functionality
- Performance benchmarking against AWS baseline
- Security penetration testing

---

# **8. GCP-Specific Optimizations**

## **8.1 Machine Learning Integration**

### **Vertex AI for Style Classification**
```hcl
# Vertex AI model for tattoo style classification
resource "google_vertex_ai_model" "style_classifier" {
  name         = "tattoo-style-classifier"
  display_name = "Tattoo Style Classifier"
  region       = var.region
  
  container_spec {
    image_uri = "gcr.io/${var.project_id}/style-classifier:latest"
    
    env {
      name  = "MODEL_NAME"
      value = "tattoo_styles_v1"
    }
  }
  
  machine_spec {
    machine_type = "n1-standard-4"
  }
}

# Vertex AI endpoint for real-time predictions
resource "google_vertex_ai_endpoint" "style_classifier" {
  name         = "style-classifier-endpoint"
  display_name = "Style Classifier Endpoint"
  region       = var.region
}
```

### **Vision API for Image Analysis**
```javascript
// Cloud Function for image analysis
const vision = require('@google-cloud/vision');

exports.analyzePortfolioImage = async (req, res) => {
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.labelDetection({
    image: { source: { imageUri: req.body.imageUrl } }
  });
  
  const labels = result.labelAnnotations;
  const tattooStyles = labels
    .filter(label => label.description.includes('tattoo'))
    .map(label => ({
      style: label.description,
      confidence: label.score
    }));
  
  res.json({ styles: tattooStyles });
};
```

## **8.2 BigQuery Analytics Integration**

### **Real-time Analytics Pipeline**
```hcl
# BigQuery dataset for analytics
resource "google_bigquery_dataset" "analytics" {
  dataset_id = "tattoo_analytics"
  location   = var.region
  
  description = "Analytics dataset for tattoo directory"
}

# Streaming insert from Cloud Functions
resource "google_bigquery_table" "user_events" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "user_events"
  
  schema = jsonencode([
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "event_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "artist_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "search_query"
      type = "STRING"
      mode = "NULLABLE"
    }
  ])
}
```

### **Data Studio Dashboard**
```javascript
// Cloud Function to stream events to BigQuery
const { BigQuery } = require('@google-cloud/bigquery');

exports.trackUserEvent = async (eventData) => {
  const bigquery = new BigQuery();
  const dataset = bigquery.dataset('tattoo_analytics');
  const table = dataset.table('user_events');
  
  const row = {
    timestamp: new Date().toISOString(),
    user_id: eventData.userId,
    event_type: eventData.eventType,
    artist_id: eventData.artistId,
    search_query: eventData.searchQuery
  };
  
  await table.insert([row]);
};
```

## **8.3 Global Load Balancing**

### **Multi-Region Deployment**
```hcl
# Global HTTP(S) Load Balancer
resource "google_compute_global_forwarding_rule" "global_lb" {
  name       = "${var.project_id}-global-lb"
  target     = google_compute_target_https_proxy.global.id
  port_range = "443"
}

# Backend services in multiple regions
resource "google_compute_backend_service" "api" {
  name        = "${var.project_id}-api-backend"
  protocol    = "HTTP"
  timeout_sec = 30
  
  backend {
    group = google_compute_region_network_endpoint_group.us_central.id
  }
  
  backend {
    group = google_compute_region_network_endpoint_group.europe_west.id
  }
  
  health_checks = [google_compute_health_check.api.id]
}

# Cloud CDN for static content
resource "google_compute_backend_bucket" "static" {
  name        = "${var.project_id}-static-backend"
  bucket_name = google_storage_bucket.frontend.name
  
  enable_cdn = true
  
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    negative_caching  = true
    
    cache_key_policy {
      include_host         = true
      include_protocol     = true
      include_query_string = false
    }
  }
}
```

---

# **9. Challenges & Mitigation Strategies**

## **9.1 Technical Challenges**

### **1. DynamoDB to Firestore Migration**
**Challenge**: Different data models and query patterns
**Mitigation**:
- Comprehensive data mapping strategy
- Parallel running during migration
- Automated validation scripts
- Rollback procedures

### **2. IAM Model Differences**
**Challenge**: AWS IAM roles vs. GCP service accounts
**Mitigation**:
- Detailed permission mapping
- Principle of least privilege
- Extensive testing of access patterns
- Security audit post-migration

### **3. Event-Driven Architecture Changes**
**Challenge**: Different event sources and formats
**Mitigation**:
- Event adapter patterns
- Gradual migration of event handlers
- Comprehensive integration testing
- Monitoring and alerting

## **9.2 Operational Challenges**

### **1. Team Learning Curve**
**Challenge**: GCP-specific knowledge and tools
**Mitigation**:
- Comprehensive training program
- GCP certification paths
- Hands-on workshops
- Documentation and runbooks

### **2. Monitoring and Alerting**
**Challenge**: Different monitoring paradigms
**Mitigation**:
- Side-by-side monitoring during migration
- Alert threshold tuning
- Custom dashboard creation
- Incident response procedure updates

### **3. Cost Management**
**Challenge**: Different pricing models and optimization strategies
**Mitigation**:
- Detailed cost modeling
- Budget alerts and controls
- Regular cost optimization reviews
- Reserved capacity planning

---

# **10. Success Metrics & Validation**

## **10.1 Performance Metrics**

| Metric | AWS Baseline | GCP Target | Validation Method |
|--------|--------------|------------|-------------------|
| **API Latency (p95)** | <500ms | <400ms | Load testing |
| **Search Response Time** | <1.5s | <1.2s | Automated testing |
| **Cold Start Time** | 2-3s | 1-2s | Function monitoring |
| **Availability** | 99.9% | 99.95% | Uptime monitoring |

## **10.2 Cost Metrics**

| Category | AWS Cost | GCP Target | Savings |
|----------|----------|------------|---------|
| **Monthly Infrastructure** | $390-595 | $305-465 | 22% |
| **Data Transfer** | $45-90 | $30-60 | 33% |
| **Monitoring** | $25-50 | $20-40 | 20% |

## **10.3 Functional Validation**

### **Critical User Journeys**
1. **Artist Search**: Location and style-based filtering
2. **Profile Viewing**: Complete artist profile display
3. **Data Aggregation**: Automated scraping pipeline
4. **Admin Functions**: Artist removal and data management

### **Integration Testing**
- End-to-end API testing
- Database consistency validation
- Search functionality verification
- Security policy enforcement

---

# **11. Conclusion & Recommendations**

## **11.1 Migration Feasibility**

The migration from AWS to GCP is **highly feasible** with significant benefits:

### **Technical Benefits**
- **Improved Performance**: Faster cold starts and better global distribution
- **Enhanced ML Capabilities**: Native Vertex AI integration for advanced features
- **Better Analytics**: BigQuery integration for business intelligence
- **Simplified Architecture**: Fewer moving parts with GCP's integrated services

### **Business Benefits**
- **Cost Savings**: 22% reduction in infrastructure costs
- **Improved Scalability**: Better auto-scaling and global distribution
- **Enhanced Security**: Integrated security services and compliance
- **Future-Proofing**: Access to cutting-edge ML and analytics capabilities

## **11.2 Key Recommendations**

### **1. Phased Migration Approach**
- Start with non-critical components
- Maintain parallel systems during transition
- Implement comprehensive monitoring

### **2. Leverage GCP-Specific Features**
- Integrate Vertex AI for enhanced search capabilities
- Use BigQuery for advanced analytics
- Implement global load balancing for better performance

### **3. Invest in Team Training**
- GCP certification programs
- Hands-on workshops and labs
- Documentation and knowledge sharing

### **4. Focus on Security**
- Implement defense-in-depth strategies
- Regular security audits and penetration testing
- Compliance validation and documentation

## **11.3 Next Steps**

1. **Stakeholder Approval**: Present migration plan and get executive buy-in
2. **Team Preparation**: Begin GCP training and certification programs
3. **Proof of Concept**: Implement critical components in GCP environment
4. **Detailed Planning**: Create detailed migration timeline and resource allocation
5. **Risk Assessment**: Conduct thorough risk analysis and mitigation planning

This migration blueprint provides a solid foundation for successfully transitioning the Tattoo Artist Directory MVP to GCP while maintaining functionality, improving performance, and reducing costs. The phased approach ensures minimal risk while maximizing the benefits of Google Cloud Platform's advanced capabilities.

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Review**: Post-Migration Assessment