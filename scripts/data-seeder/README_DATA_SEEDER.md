# Tattoo Directory Data Seeder

This directory contains the comprehensive data seeding system for the Tattoo Directory local development environment.

## Overview

The data seeder populates LocalStack services (DynamoDB and OpenSearch) with realistic test data for development and testing purposes.

## Components

### Core Files

- `seed.js` - Main seeding orchestrator
- `validators.js` - Joi-based data validation schemas (requires dependencies)
- `simple-validator.js` - Lightweight validation without external dependencies
- `validate-data.js` - Standalone validation script
- `clean-data.js` - Data cleanup utility
- `health-check.js` - Container health check script
- `package.json` - Node.js dependencies
- `Dockerfile.seeder` - Docker container configuration

### Test Data

Located in `../test-data/`:
- `artists.json` - Comprehensive artist profiles (10 artists) with S3 image URLs and faker.js avatars
- `studios.json` - Studio information (3 studios) with updated specialties
- `styles.json` - Tattoo style definitions (17 styles) matching image folder structure

## Usage

### Docker Container (Recommended)

```bash
# Build and run via Docker Compose
docker-compose -f docker-compose.local.yml build data-seeder
docker-compose -f docker-compose.local.yml run --rm data-seeder

# Or use the convenience scripts
./scripts/run-seeder.sh        # Linux/macOS
./scripts/run-seeder.bat       # Windows
```

### Direct Node.js Execution

```bash
# Install dependencies first
cd scripts/data-seeder
npm install

# Run seeding
npm start

# Or run individual scripts
node seed.js
node validate-data.js
node clean-data.js
```

### Available Scripts

```bash
npm start          # Run complete seeding process
npm run seed       # Alias for start
npm run validate   # Validate test data files
npm run clean      # Clean all seeded data
```

## Data Validation

The seeder includes comprehensive data validation:

```bash
# Validate all test data files
node simple-validator.js

# Output shows validation results
🔍 Validating test data files...
📊 Validating 10 artists...
📊 Validating 3 studios...  
📊 Validating 8 styles...
✅ All test data is valid!
```

## Data Structure

### Artists
- Complete profile information with faker.js avatars
- Portfolio images with S3 URLs and descriptions
- Contact and studio information
- Pricing and availability data
- Geographic coordinates and geohash
- Updated style IDs matching image folders

### Studios
- Studio details and contact info
- Opening hours and location
- Associated artists with updated specialties
- Ratings and establishment date

### Styles
- 17 comprehensive style definitions
- Style characteristics and popular motifs
- Color palettes and difficulty levels
- Historical context and aliases
- IDs matching test image folder structure

## Environment Variables

- `AWS_ENDPOINT_URL` - LocalStack endpoint (default: http://localstack:4566)
- `AWS_ACCESS_KEY_ID` - AWS access key (default: test)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (default: test)
- `AWS_DEFAULT_REGION` - AWS region (default: eu-west-2)
- `DYNAMODB_TABLE_NAME` - DynamoDB table name (default: tattoo-directory-local)
- `OPENSEARCH_ENDPOINT` - OpenSearch endpoint (default: http://localstack:4566)

## Data Seeding Process

1. **Service Readiness Check** - Waits for LocalStack services
2. **Data Validation** - Validates all test data files
3. **DynamoDB Seeding** - Populates DynamoDB with structured data
4. **OpenSearch Setup** - Creates index with proper mapping
5. **OpenSearch Indexing** - Indexes artists for search functionality
6. **Validation** - Verifies seeded data integrity

## Error Handling

- Comprehensive validation before seeding
- Retry logic for service connections
- Detailed error reporting and statistics
- Graceful handling of partial failures

## Troubleshooting

### Common Issues

1. **LocalStack not ready**: Ensure LocalStack container is running and healthy
2. **Permission errors**: Check Docker volume mounts and file permissions
3. **Network issues**: Verify Docker network configuration
4. **Data validation failures**: Run `simple-validator.js` to identify issues

### Debug Mode

Set `DEBUG=1` environment variable for verbose logging:

```bash
DEBUG=1 node seed.js
```

## Development

### Setting Up Test Data with Images

Before running the seeder, set up test data with S3 images:

```bash
# From the scripts directory
cd ../scripts
npm install
npm run setup
```

This uploads test images to LocalStack S3 and updates test data files with proper URLs.

### Adding New Test Data

1. Add images to appropriate folder in `tests/Test_Data/ImageSet/`
2. Add data to appropriate JSON file in `../test-data/`
3. Update validation schemas if needed
4. Run image setup: `cd ../scripts && npm run setup`
5. Run validation: `node simple-validator.js`
6. Test seeding: `node seed.js`

### Modifying Validation

- Update `simple-validator.js` for basic validation
- Update `validators.js` for comprehensive Joi-based validation
- Ensure both validators remain in sync

## Performance

- Seeding ~21 records typically takes 10-30 seconds
- Memory usage: ~50MB during seeding
- Supports batch operations for large datasets
- Includes progress reporting and statistics