# LocalStack Initialization Scripts

This directory contains initialization scripts that automatically set up AWS services in LocalStack for local development of the Tattoo Artist Directory.

## Scripts Overview

- `00-init-all.sh` - Master script that runs all initialization scripts in order
- `01-create-dynamodb-table.sh` - Creates the main DynamoDB table with GSIs
- `02-create-opensearch-domain.sh` - Creates OpenSearch domain for search functionality
- `03-create-s3-buckets.sh` - Creates S3 buckets for image storage
- `04-create-api-gateway.sh` - Creates API Gateway with REST API structure

## How It Works

These scripts are automatically executed when LocalStack starts up via Docker Compose. The scripts are mounted to `/etc/localstack/init/ready.d/` in the LocalStack container and run when LocalStack is ready.

## Services Created

### DynamoDB Table: `tattoo-directory-local`
- **Primary Key**: PK (Hash), SK (Range)
- **GSI1**: `style-geohash-index` - For searching by style and location
- **GSI2**: `artist-name-index` - For searching by artist name
- **GSI3**: `instagram-index` - For searching by Instagram handle

### OpenSearch Domain: `tattoo-directory-local`
- Single node cluster for local development
- Artist index with proper field mappings
- Configured for text search and filtering

### S3 Buckets
- `tattoo-directory-portfolio-images-local` - Main portfolio images
- `tattoo-directory-thumbnails-local` - Image thumbnails
- `tattoo-directory-uploads-local` - Temporary uploads

### API Gateway
- REST API with `/v1/artists` and `/v1/search` endpoints
- Deployed to `local` stage
- Ready for Lambda integration

## Accessing Services

All services are accessible through LocalStack's gateway at `http://localhost:4566`:

```bash
# DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# S3
aws --endpoint-url=http://localhost:4566 s3 ls

# OpenSearch
curl http://localhost:4566/tattoo-directory-local/_search
```

## Troubleshooting

If initialization fails:

1. Check LocalStack logs: `docker-compose logs localstack`
2. Verify LocalStack health: `curl http://localhost:4566/_localstack/health`
3. Re-run specific scripts manually if needed

## Manual Execution

To run scripts manually (if needed):

```bash
# Enter LocalStack container
docker-compose exec localstack bash

# Run specific script
/etc/localstack/init/ready.d/01-create-dynamodb-table.sh
```