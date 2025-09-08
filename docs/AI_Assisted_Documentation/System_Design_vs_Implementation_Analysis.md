# System Design vs Implementation Analysis
## Tattoo Artist Directory MVP - Discrepancies, Issues, and Recommendations

**Document Version:** 1.0  
**Date:** February 8, 2025  
**Author:** Kiro AI Assistant  

---

## Executive Summary

This analysis compares the original system design documents (PRD, HLD, LLD) against the current project implementation to identify discrepancies, architectural changes, missing components, and areas requiring attention. The analysis reveals significant gaps between the designed architecture and current implementation, particularly in the backend API structure, data aggregation pipeline, and frontend-backend integration.

---

## 1. Major Architectural Discrepancies

### 1.1 Backend API Structure Mismatch

**Issue:** The current backend implementation uses Serverless Framework with a different API structure than specified in the design documents.

**Design Specification (LLD Section 3.1):**
- API endpoints: `/v1/artists`, `/v1/artists/{artistId}`, `/v1/styles`
- Versioned API with `/v1` prefix
- RFC 9457 compliant error responses
- Structured JSON error format with `type`, `title`, `status`, `detail`, `instance` fields

**Current Implementation:**
- Serverless.yml defines: `/artist/{id}`, `/artists`, `/artists/{styles}`, `/removal-requests`
- No `/v1` versioning prefix
- Basic error responses without RFC 9457 compliance
- Missing `/v1/styles` endpoint entirely

**Impact:** 
- Frontend will not be able to connect to backend APIs as designed
- Error handling inconsistency
- Missing critical functionality for style filtering

**Recommendations:**
1. **Update API Gateway routes** in `serverless.yml` to include `/v1` prefix
2. **Implement RFC 9457 error responses** across all handlers
3. **Add missing `/v1/styles` endpoint** for style enumeration
4. **Standardize response format** across all endpoints

### 1.2 Data Model Implementation Gap

**Issue:** Current DynamoDB table structure doesn't match the single-table design specified in LLD.

**Design Specification (LLD Section 4.2):**
- Single table design with `PK: ARTIST#{artistId}`, `SK: METADATA`
- GSI with `gsi1pk: STYLE#{style}`, `gsi1sk: LOCATION#{country}#{city}`
- Composite keys for efficient querying

**Current Implementation:**
- Serverless.yml defines basic table with `pk`, `sk`, `gsi1pk`, `gsi1sk`, `gsi2pk`
- Missing proper key structure and naming conventions
- No clear implementation of the style-location index pattern

**Impact:**
- Search functionality cannot work as designed
- Performance implications for queries
- Data consistency issues

**Recommendations:**
1. **Refactor DynamoDB table structure** to match LLD specifications
2. **Implement proper GSI configuration** for style-location queries
3. **Update data access patterns** in handlers to use correct key structure
4. **Create data migration scripts** for existing data

### 1.3 Infrastructure vs Serverless Framework Conflict

**Issue:** The project uses both Terraform (infrastructure/) and Serverless Framework (backend/), creating potential conflicts and deployment complexity.

**Design Specification:**
- 100% Infrastructure as Code using Terraform
- Comprehensive module-based architecture
- Multi-account deployment strategy

**Current Implementation:**
- Terraform modules for infrastructure (19 modules)
- Serverless Framework for Lambda deployment
- Potential resource conflicts between the two approaches

**Impact:**
- Deployment complexity and potential conflicts
- Inconsistent resource management
- Difficulty in maintaining infrastructure state

**Recommendations:**
1. **Choose single IaC approach**: Either migrate Lambda functions to Terraform or infrastructure to Serverless
2. **If keeping both**: Ensure clear separation of responsibilities and no resource overlap
3. **Update CI/CD pipeline** to handle both deployment methods
4. **Document deployment order** and dependencies

---

## 2. Missing Core Components

### 2.1 Backend Code Organization Issues

**Issue:** The backend folder contains multiple overlapping implementations with unclear purposes and duplicated functionality.

**Current Backend Structure Analysis:**

#### `/backend/src/` - Serverless Framework Implementation
- **Purpose:** Current working implementation using Serverless Framework
- **Files:** 
  - `handlers/` - API endpoint handlers (getArtist.js, listArtists.js, etc.)
  - `lib/` - Utility functions (keys.js, normalize.js)
  - `data/mockData.js` - Mock data for testing
  - `db.js` - DynamoDB client configuration
- **Status:** Functional but uses mock data, doesn't match design specifications

#### `/backend/src_boilerplate/` - Design-Compliant Boilerplate
- **Purpose:** More complete implementations matching the system design
- **Components:**
  - `api_handler/` - OpenSearch-integrated API handler with circuit breaker
  - `discover_studios/` - Google Maps API integration for studio discovery
  - `find_artists_on_site/` - Website scraping for artist discovery
  - `dynamodb_sync/` - DynamoDB to OpenSearch synchronization
  - `queue_scraping/` - SQS-based scraping job management
  - `secret_rotation/` - Automated password rotation for OpenSearch
  - `common/logger.js` - PII-scrubbing structured logger
- **Status:** Well-designed but not integrated with deployment pipeline

#### `/backend/src_compute_module/` - Terraform Integration Layer
- **Purpose:** Simplified Lambda functions for Terraform deployment
- **Files:** 
  - `lambda_code/` - Basic placeholder implementations
  - `dist/` - Pre-built ZIP files for deployment
- **Status:** Placeholder implementations, not functional

#### `/backend/lambda_code/` - Empty Deployment Structure
- **Purpose:** Appears to be intended for final Lambda code
- **Status:** Empty directories, unused

**Key Issues:**
1. **Multiple Competing Implementations:** Three different approaches to the same functionality
2. **No Clear Integration Path:** Unclear which implementation should be used
3. **Duplicated Effort:** Similar functionality implemented multiple times
4. **Deployment Confusion:** No clear mapping between code and infrastructure

### 2.2 Data Aggregation Engine (Phase 2)

**Status:** Well-designed in boilerplate but not integrated with infrastructure

**Available Components in `src_boilerplate/`:**
- **Studio Discovery:** Complete implementation with Google Maps API integration
- **Artist Finding:** Website scraping with HTML parsing (Cheerio)
- **Queue Management:** SQS-based job processing
- **Data Synchronization:** DynamoDB to OpenSearch sync with proper error handling
- **Fargate Scraper:** Container logic for distributed scraping

**Missing Integration:**
- No deployment pipeline for boilerplate code
- Terraform modules reference placeholder implementations
- No CI/CD integration for the well-designed components

**Recommendations:**
1. **Consolidate Backend Structure:** Choose single implementation approach
2. **Migrate Boilerplate to Production:** Use `src_boilerplate/` as the primary implementation
3. **Update Terraform References:** Point infrastructure to correct Lambda code
4. **Implement Build Pipeline:** Create deployment process for boilerplate code

### 2.2 OpenSearch Integration

**Status:** Infrastructure exists but API integration incomplete

**Issues:**
- OpenSearch cluster deployed via Terraform
- API handlers have boilerplate OpenSearch code but not integrated with main handlers
- Missing search endpoint implementation
- No data synchronization from DynamoDB to OpenSearch

**Recommendations:**
1. **Integrate OpenSearch client** into main API handlers
2. **Implement DynamoDB streams** to sync data to OpenSearch
3. **Add search endpoints** with proper query handling
4. **Test search functionality** with sample data

### 2.3 Frontend-Backend Integration

**Status:** Frontend exists but not connected to backend

**Issues:**
- Frontend built with Next.js and Google Maps integration
- No API client configuration for backend
- Missing environment variables for API endpoints
- No error handling for API responses

**Recommendations:**
1. **Configure API client** in frontend with proper base URL
2. **Add environment variables** for different deployment stages
3. **Implement error handling** for API responses
4. **Add loading states** and user feedback

---

## 3. Security and Compliance Gaps

### 3.1 WAF Configuration Mismatch

**Issue:** WAF implementation doesn't match security requirements

**Design Specification:**
- Rate limiting: 500 requests per 5-minute window per IP
- API-specific rate limiting: 100 RPS steady state, 200 burst
- Comprehensive managed rule sets

**Current Implementation:**
- Basic WAF configuration in Terraform
- Missing specific rate limiting rules
- No API Gateway throttling configuration

**Recommendations:**
1. **Update WAF rules** to match specifications
2. **Configure API Gateway throttling** per stage
3. **Add monitoring** for rate limiting effectiveness
4. **Test rate limiting** with load testing

### 3.2 Secrets Management

**Issue:** Inconsistent secrets handling between design and implementation

**Current Issues:**
- Secrets Manager configured in Terraform
- API handlers reference secrets but with different patterns
- Missing proper error handling for secrets retrieval

**Recommendations:**
1. **Standardize secrets access** across all Lambda functions
2. **Implement proper error handling** for secrets retrieval failures
3. **Add secrets rotation** configuration
4. **Document secrets structure** and access patterns

---

## 4. Data and Database Issues

### 4.1 Mock Data vs Real Data Structure

**Issue:** Multiple data access patterns with inconsistent implementations

**Current State Analysis:**

#### Serverless Framework Implementation (`/src/`)
- Uses `mockData.js` with hardcoded artist data
- Handlers like `getArtist.js` and `listArtists.js` only return mock data
- `updateArtist.js` has real DynamoDB integration but uses different key structure
- `db.js` provides proper DynamoDB client setup

#### Boilerplate Implementation (`/src_boilerplate/`)
- `api_handler.js` includes OpenSearch integration with proper error handling
- `dynamodb_sync.js` has complete DynamoDB stream processing
- Uses proper secrets management for OpenSearch credentials
- Implements circuit breaker pattern for resilience

#### Key Structure Issues
- `src/lib/keys.js` defines: `ARTIST#{id}` and `PROFILE` (doesn't match LLD)
- LLD specifies: `ARTIST#{artistId}` and `METADATA` 
- GSI key structure partially implemented but inconsistent

**Data Model Discrepancies:**
- **Design:** Single table with `PK: ARTIST#{artistId}`, `SK: METADATA`
- **Current:** Multiple approaches with different key patterns
- **Normalization:** `normalize.js` exists but doesn't match design specifications

**Recommendations:**
1. **Standardize on boilerplate implementation** which is more complete
2. **Fix key structure** to match LLD specifications exactly
3. **Implement proper data seeding** scripts using correct schema
4. **Remove mock data dependencies** from production handlers

### 4.2 Missing Data Validation

**Issue:** No input validation or data sanitization

**Missing Components:**
- Request payload validation
- Data type checking
- Input sanitization
- Business rule validation

**Recommendations:**
1. **Implement Zod schemas** for request validation
2. **Add input sanitization** middleware
3. **Create validation utilities** for reuse
4. **Add comprehensive error responses** for validation failures

---

## 5. Monitoring and Observability Gaps

### 5.1 Logging Implementation

**Issue:** Inconsistent logging implementations across different backend folders

**Current State Analysis:**

#### Serverless Framework Implementation (`/src/`)
- Uses basic `console.log()` and `console.error()`
- No structured logging or PII protection
- Missing correlation IDs and request context

#### Boilerplate Implementation (`/src_boilerplate/common/logger.js`)
- **Well-designed structured logger** with PII scrubbing
- Supports multiple log levels (info, warn, error, debug)
- **Automatic PII detection** and scrubbing for sensitive data
- Proper error context and metadata handling
- **Production-ready** with proper formatting

#### Compute Module Implementation (`/src_compute_module/`)
- Basic console logging only
- No error handling or structured format

**Logger Features in Boilerplate:**
```javascript
// Supports structured logging with automatic PII scrubbing
log('info', 'Processing artist data', { artistId: 'artist-123', email: 'scrubbed' });
// Automatically scrubs: emails, phone numbers, credit cards, SSNs
```

**Missing Integration:**
- Boilerplate logger not used in main handlers
- No standardization across implementations
- CloudWatch integration exists but not utilized properly

**Recommendations:**
1. **Adopt boilerplate logger** as the standard across all implementations
2. **Migrate existing handlers** to use structured logging
3. **Add correlation IDs** using AWS request context
4. **Implement log aggregation** patterns from boilerplate code

### 5.2 Monitoring Configuration

**Issue:** Comprehensive monitoring modules exist but may not be properly connected

**Missing Elements:**
- Application-specific metrics
- Custom dashboards for business KPIs
- Alerting thresholds aligned with SLA requirements

**Recommendations:**
1. **Review monitoring configuration** against requirements
2. **Add custom metrics** for business KPIs
3. **Configure alerting thresholds** based on SLA requirements
4. **Create operational runbooks** for common issues

---

## 6. CI/CD and Deployment Issues

### 6.1 Deployment Pipeline Complexity

**Issue:** Multiple deployment approaches with no clear integration strategy

**Current Deployment Approaches:**

#### 1. Serverless Framework (`/backend/serverless.yml`)
- **Scope:** Currently deployed Lambda functions
- **Pros:** Simple deployment, automatic API Gateway setup
- **Cons:** Conflicts with Terraform infrastructure, limited to Lambda/API Gateway

#### 2. Terraform Infrastructure (`/infrastructure/`)
- **Scope:** Complete AWS infrastructure (19 modules)
- **Pros:** Comprehensive infrastructure management, multi-account setup
- **Cons:** Lambda code deployment not integrated

#### 3. Compute Module Approach (`/src_compute_module/`)
- **Scope:** Pre-built ZIP files for Terraform deployment
- **Files:** `dist/` contains ZIP files for each Lambda function
- **Status:** Placeholder implementations, not functional

**Integration Issues:**
- **Resource Conflicts:** Both create Lambda functions and API Gateway
- **State Management:** Separate state files and deployment processes
- **Code Updates:** No clear process for updating Lambda code in Terraform
- **Environment Variables:** Different configuration approaches

**Missing Components:**
- **Build Pipeline:** No automated ZIP creation for Lambda functions
- **Code Deployment:** Terraform expects S3 artifacts but no upload process
- **Version Management:** No versioning strategy for Lambda deployments

**Recommendations:**
1. **Choose Primary Approach:** Either full Terraform or hybrid approach
2. **Implement Build Pipeline:** Automate ZIP creation and S3 upload for Terraform
3. **Resolve Resource Conflicts:** Ensure no duplicate resource creation
4. **Create Unified CI/CD:** Single pipeline handling both infrastructure and code
5. **Document Deployment Order:** Clear sequence for infrastructure and application deployment

### 6.2 Environment Configuration

**Issue:** Inconsistent environment handling

**Current Issues:**
- Terraform has dev/prod environments
- Serverless Framework has separate stage configuration
- Frontend environment variables not aligned

**Recommendations:**
1. **Standardize environment configuration** across all components
2. **Create environment-specific variable files**
3. **Add environment validation** in deployment pipeline
4. **Document environment setup** procedures

---

## 7. Testing and Quality Assurance

### 7.1 Missing Test Implementation

**Issue:** No tests implemented despite testing requirements in design

**Design Requirements:**
- >80% unit test coverage
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for API latency

**Current State:**
- Package.json shows "no test specified"
- No test files in codebase
- No testing infrastructure

**Recommendations:**
1. **Implement unit tests** for all handlers and utilities
2. **Add integration tests** for API endpoints
3. **Create E2E tests** for critical user flows
4. **Set up performance testing** with load testing tools
5. **Configure test automation** in CI/CD pipeline

---

## 8. Documentation and Maintenance

### 8.1 Documentation Gaps

**Issue:** Implementation documentation doesn't match current state

**Missing Documentation:**
- API documentation for current endpoints
- Database schema documentation
- Deployment procedures
- Troubleshooting guides

**Recommendations:**
1. **Update API documentation** to match current implementation
2. **Document database schema** and access patterns
3. **Create deployment guides** for each component
4. **Add troubleshooting documentation**

---

## 9. Priority Recommendations

### High Priority (Critical for MVP)

1. **Consolidate Backend Implementation**
   - Choose between Serverless Framework or Terraform approach
   - Migrate to `src_boilerplate/` implementations which are more complete
   - Remove duplicate and conflicting code structures

2. **Fix API Endpoint Structure**
   - Update routes to match design specifications (`/v1/artists`, `/v1/styles`)
   - Implement RFC 9457 compliant error responses
   - Integrate OpenSearch functionality from boilerplate code

3. **Resolve Deployment Conflicts**
   - Eliminate resource conflicts between Serverless and Terraform
   - Create unified deployment pipeline
   - Implement proper Lambda code deployment to S3 for Terraform

4. **Implement Proper Data Model**
   - Fix DynamoDB key structure to match LLD specifications
   - Update `keys.js` and `normalize.js` to use correct patterns
   - Replace mock data with real database integration

5. **Integrate Existing Quality Components**
   - Use boilerplate logger with PII scrubbing across all handlers
   - Implement circuit breaker pattern from boilerplate API handler
   - Add proper secrets management from boilerplate implementations

### Medium Priority (Important for Production)

1. **Complete Data Aggregation Pipeline**
   - Deploy boilerplate Step Functions workflow
   - Integrate studio discovery and artist finding components
   - Implement Fargate scraper container deployment

2. **Standardize Code Organization**
   - Remove unused folders (`lambda_code/`, placeholder implementations)
   - Create clear separation between development and production code
   - Document code organization and deployment mapping

3. **Implement Comprehensive Testing**
   - Test boilerplate implementations which are more robust
   - Add integration tests for OpenSearch functionality
   - Create E2E tests for data aggregation pipeline

4. **Frontend-Backend Integration**
   - Use `api-config.js` for proper environment configuration
   - Connect to deployed API endpoints
   - Implement error handling for API responses

### Low Priority (Future Enhancements)

1. **Optimize Existing Implementations**
   - Performance tune OpenSearch queries in boilerplate code
   - Optimize DynamoDB access patterns
   - Implement caching strategies

2. **Enhance Monitoring**
   - Integrate structured logging with CloudWatch
   - Add custom metrics for business KPIs
   - Implement comprehensive alerting

3. **Documentation and Maintenance**
   - Document the chosen implementation approach
   - Create operational runbooks
   - Add comprehensive API documentation

---

## 10. Backend Folder Structure Summary

### Current Organization Issues

The backend folder contains **four different implementation approaches** with significant overlap and confusion:

1. **`/src/`** - Serverless Framework implementation (currently deployed, uses mock data)
2. **`/src_boilerplate/`** - Design-compliant implementation (well-designed, not deployed)
3. **`/src_compute_module/`** - Terraform integration layer (placeholder implementations)
4. **`/lambda_code/`** - Empty deployment structure (unused)

### Key Findings

**Strengths:**
- **Excellent boilerplate implementations** in `src_boilerplate/` that closely match design specifications
- **Comprehensive infrastructure** with proper Terraform modules
- **Production-ready components** like PII-scrubbing logger, circuit breaker patterns, and secrets management

**Critical Issues:**
- **Multiple competing implementations** causing confusion and deployment conflicts
- **No clear integration path** between well-designed boilerplate and infrastructure
- **Resource conflicts** between Serverless Framework and Terraform approaches
- **Duplicated functionality** across different folders

### Recommended Consolidation Strategy

1. **Primary Implementation:** Migrate to `src_boilerplate/` as the main codebase
2. **Remove Duplicates:** Eliminate `src_compute_module/` and `lambda_code/` folders
3. **Integration:** Create build pipeline to package boilerplate code for Terraform deployment
4. **Deployment:** Choose either full Terraform or hybrid approach, not both

## 11. Conclusion

The project demonstrates **exceptional architectural design** and contains **high-quality implementation components**. The main challenge is not missing functionality, but rather **consolidating multiple implementations** into a coherent, deployable system.

**Key Strengths:**
- Comprehensive infrastructure design with 19 well-structured Terraform modules
- Production-ready boilerplate code with proper error handling, logging, and security
- Complete data aggregation pipeline design with all necessary components

**Primary Gaps:**
- **Implementation fragmentation** across multiple backend folders
- **Deployment pipeline confusion** between Serverless and Terraform approaches
- **Integration challenges** between excellent components that aren't connected

**Path Forward:**
The project is much closer to completion than initially apparent. The `src_boilerplate/` folder contains sophisticated, production-ready implementations that closely match the design specifications. The primary task is **consolidation and integration** rather than building new functionality.

Addressing the high-priority recommendations will quickly enable a functional MVP that demonstrates the full vision of the original design. The foundation is solid; it just needs to be properly assembled and deployed.