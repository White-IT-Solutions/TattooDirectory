# OpenSearch Configuration Guide

## Overview

This document outlines the OpenSearch configuration for the Tattoo Directory MVP project, including the custom backend setup and all necessary configuration changes.

## Architecture

The project uses a **custom OpenSearch backend** approach where:
- LocalStack acts as the AWS OpenSearch service proxy
- A real OpenSearch container provides the actual search functionality
- LocalStack forwards OpenSearch requests to the real OpenSearch instance

## Infrastructure Setup

### 1. OpenSearch Container

A dedicated OpenSearch container runs alongside LocalStack:

```yaml
# docker-compose.local.yml
opensearch:
  image: opensearchproject/opensearch:2.3.0
  container_name: tattoo-directory-opensearch
  ports:
    - "4571:9200"
    - "4572:9600"
  environment:
    - cluster.name=tattoo-directory-cluster
    - node.name=tattoo-directory-node
    - discovery.type=single-node
    - bootstrap.memory_lock=true
    - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
    - "DISABLE_INSTALL_DEMO_CONFIG=true"
    - "DISABLE_SECURITY_PLUGIN=true"
  networks:
    - tattoo-directory-local
```

### 2. LocalStack Configuration

LocalStack is configured to use the custom OpenSearch backend:

```bash
# Environment variables for LocalStack
SERVICES=dynamodb,opensearch,s3,apigateway,lambda,iam,secretsmanager,logs,sns
OPENSEARCH_CUSTOM_BACKEND=http://tattoo-directory-opensearch:9200
OPENSEARCH_ENDPOINT_STRATEGY=domain
OPENSEARCH_MULTI_CLUSTER=0
```

**Note**: The `OPENSEARCH_CUSTOM_BACKEND` is also configured in `devtools/localstack-config/localstack.conf` which takes precedence over environment variables.

### 3. Network Configuration

Both containers run on the same Docker network:
- Network: `tattoo-directory-local`
- LocalStack can access OpenSearch at: `http://tattoo-directory-opensearch:9200`
- Host can access OpenSearch at: `http://localhost:4571`

## Domain Configuration

### Creating OpenSearch Domain

```bash
# Create the OpenSearch domain in LocalStack
docker exec tattoo-directory-localstack awslocal opensearch create-domain \
  --domain-name tattoo-directory-local \
  --region eu-west-2
```

### Domain Endpoint

The domain endpoint format is:
```
tattoo-directory-local.eu-west-2.opensearch.localstack:4566
```

## Application Configuration

### Host Header Requirements

All OpenSearch requests must include the correct Host header:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
}
```

### Updated Files

The following files have been updated with the correct Host header:

#### Core Infrastructure
- `scripts/utilities/health-monitor.js` - Health check functionality
- `scripts/data-management/database-seeder.js` - Data seeding operations

#### Data Management Scripts
- `scripts/data-seeder/data-manager.js`
- `scripts/data-seeder/data-migration-utility.js`
- `scripts/data-seeder/data-monitoring-utility.js`
- `scripts/data-seeder/data-sync-utility.js`
- `scripts/data-seeder/data-validator.js`
- `scripts/data-seeder/data-reset.js`
- `scripts/data-seeder/seed.js`
- `scripts/data-seeder/selective-seeder.js`
- `scripts/data-seeder/test-utilities.js`

#### Backend Services
- `backend/src/scripts/test-opensearch.js`
- `backend/src/handlers/api-handler/index.js`
- `backend/src/handlers/api-handler/index-broken.js`

#### Test Infrastructure
- `tests/integration/setup/test-clients.js`

## Verification Commands

### Health Check
```bash
npm run health-check
```
Expected: All services including OpenSearch show as healthy

### Test Data Seeding
```bash
npm run seed-scenario:minimal
```
Expected: Successful seeding with OpenSearch indexing

### Security Suite Test
```bash
npm run test:cli:security
```
Expected: Runs without XML parsing errors (may show npm audit vulnerabilities)

## Troubleshooting

### Common Issues

1. **XML Parsing Errors**
   - Cause: Incorrect Host header or missing OpenSearch container
   - Solution: Ensure OpenSearch container is running and Host headers are correct

2. **Connection Refused**
   - Cause: OpenSearch container not accessible from LocalStack
   - Solution: Verify both containers are on the same Docker network

3. **Domain Not Found**
   - Cause: OpenSearch domain not created in LocalStack
   - Solution: Create domain using `awslocal opensearch create-domain`

### Diagnostic Commands

```bash
# Check OpenSearch container status
docker ps --filter "name=opensearch"

# Check LocalStack health
docker exec tattoo-directory-localstack curl -s "http://localhost:4566/_localstack/health"

# Test OpenSearch directly
curl -s http://localhost:4571/_cluster/health

# Test through LocalStack
docker exec tattoo-directory-localstack curl -s \
  -H "Host: tattoo-directory-local.eu-west-2.opensearch.localstack" \
  "http://localhost:4566/_cluster/health"
```

## Performance Considerations

- **Memory**: OpenSearch container uses 512MB-1GB RAM
- **CPU**: Minimal CPU usage for development workloads
- **Storage**: Uses Docker volume for data persistence
- **Network**: All communication over Docker network (fast)

## Security Notes

- Security plugin is disabled for development (`DISABLE_SECURITY_PLUGIN=true`)
- No authentication required for local development
- All data is ephemeral unless volumes are configured for persistence

## Integration with npm Scripts

All existing npm scripts work with the new OpenSearch configuration:

- `npm run health-check` - Validates OpenSearch connectivity
- `npm run seed-scenario:*` - Seeds data including OpenSearch indexing
- `npm run validate-data` - Validates data consistency across services
- `npm run test:cli:*` - Runs test suites with proper OpenSearch support

The configuration is transparent to existing workflows and maintains backward compatibility.