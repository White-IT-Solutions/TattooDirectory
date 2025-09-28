# Backend Development Guide

## Architecture Overview

The backend is a serverless Node.js application running on AWS Lambda with:

- **Runtime**: Node.js 20.x with ES modules
- **Database**: DynamoDB (single-table design) + OpenSearch (search)
- **Infrastructure**: Terraform (not Serverless Framework)
- **Local Development**: LocalStack + Docker Compose

## Prerequisites

- Node.js 20.x
- Docker & Docker Compose
- AWS CLI configured (for production deployments)
- Terraform CLI (for infrastructure changes)

## Project Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   ├── common/            # Shared utilities (DynamoDB, logger, etc.)
│   ├── containers/        # Fargate container code
│   ├── scripts/           # Development scripts
│   └── __tests__/         # Integration tests
├── docs/                  # API documentation (OpenAPI spec)
├── coverage/              # Test coverage reports
└── package.json           # Dependencies and scripts
```

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Local Environment

```bash
# From project root - starts LocalStack + all services
docker-compose -f devtools/docker/docker-compose.local.yml up

# Or with platform-specific optimizations (Windows)
docker-compose -f devtools/docker/docker-compose.local.yml -f devtools/docker/docker-compose.windows.yml up
```

### 3. Initialize Local AWS Services

```bash
# Initialize DynamoDB, OpenSearch, S3, API Gateway
cd localstack-init
./00-init-all.sh
```

### 4. Access Local Services

- **API Gateway**: http://localhost:4566/restapis/{api-id}/dev/_user_request_
- **DynamoDB Admin**: http://localhost:4566/\_localstack/dynamodb
- **OpenSearch**: http://localhost:4566/\_localstack/opensearch
- **Swagger UI**: http://localhost:8080

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Endpoints

### Artist Management

- `GET /artists` - List all artists (paginated, with filters)
- `GET /artists/{id}` - Get single artist profile
- `GET /artists/search` - Search artists by location/style
- `PATCH /artists/{id}` - Update artist profile
- `POST /artists/{id}/removal-request` - Submit removal request

### Studio Management

- `GET /studios` - List studios
- `GET /studios/{id}` - Get studio details
- `POST /studios/discover` - Trigger studio discovery

### Data Processing

- `POST /scraping/queue` - Queue scraping jobs
- `GET /scraping/status` - Check scraping status

## Environment Variables

### Required for Local Development

```bash
# AWS LocalStack
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=eu-west-2

# Application
TABLE_NAME=tattoo-directory-dev
OPENSEARCH_ENDPOINT=http://localhost:4566
LOG_LEVEL=debug
```

### Production Environment

- `TABLE_NAME`: DynamoDB table name (set by Terraform)
- `OPENSEARCH_ENDPOINT`: OpenSearch domain endpoint
- `LOG_LEVEL`: Logging level (info, debug, error)
- `AWS_REGION`: AWS region (eu-west-2)

## Database Schema

### DynamoDB Single-Table Design

```javascript
// Primary Key Structure
PK: "ARTIST#{artistId}" | "STUDIO#{studioId}" | "USER#{userId}";
SK: "PROFILE" | "PORTFOLIO#{imageId}" | "REVIEW#{reviewId}";

// Global Secondary Indexes
GSI1PK: "LOCATION#{postcode}" | "STYLE#{styleName}";
GSI1SK: "ARTIST#{artistId}" | "STUDIO#{studioId}";
```

### OpenSearch Index

```javascript
{
  "artist_id": "string",
  "name": "string",
  "studio_name": "string",
  "location": {
    "postcode": "string",
    "city": "string",
    "coordinates": [lat, lon]
  },
  "styles": ["traditional", "realism", "blackwork"],
  "portfolio_count": number,
  "last_updated": "ISO date"
}
```

## Infrastructure Deployment

### Development Environment

```bash
cd infrastructure/environments/dev
terraform init
terraform plan
terraform apply
```

### Production Environment

```bash
cd infrastructure/environments/prod
terraform init
terraform plan
terraform apply
```

## Performance Targets

- **API Response Time**: <300ms p95
- **Search Queries**: <500ms total
- **Lambda Cold Start**: <1s
- **DynamoDB Queries**: <100ms p95
- **Test Coverage**: 80%+ on core features

## Development Scripts

```bash
# Seed test data into OpenSearch
node src/scripts/seed-opensearch.js

# Test OpenSearch connectivity
node src/scripts/test-opensearch.js

# Manual API testing
# See src/scripts/test-requests.http
```

## Troubleshooting

### LocalStack Issues

```bash
# Reset LocalStack data
docker-compose down -v
docker-compose up

# Check LocalStack logs
docker-compose logs localstack
```

### Lambda Function Issues

```bash
# Check Lambda logs in LocalStack
awslocal logs describe-log-groups
awslocal logs get-log-events --log-group-name /aws/lambda/{function-name}
```

### DynamoDB Issues

```bash
# List tables
awslocal dynamodb list-tables

# Scan table contents
awslocal dynamodb scan --table-name tattoo-directory-dev
```

## API Documentation

- **OpenAPI Spec**: `backend/docs/openapi.yaml`
- **Swagger UI**: http://localhost:8080 (when running locally)
- **Postman Collection**: Available in `src/scripts/test-requests.http`
