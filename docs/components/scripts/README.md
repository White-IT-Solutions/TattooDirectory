# Tattoo Directory Scripts

This directory contains organized utility scripts for the Tattoo Directory MVP project.

## 📁 Folder Structure

The scripts are organized into logical categories for better maintainability:

### 🚀 deployment/
Scripts for environment setup and deployment:
- `platform-launcher.js` - Cross-platform environment launcher
- `start-local.sh/bat` - Start local development environment
- `stop-local.sh/bat` - Stop local development environment
- `startup-optimizer.js` - Optimize startup performance
- `docker-cache-optimizer.js` - Docker cache optimization

### 📊 monitoring/
Health checks and monitoring utilities:
- `health-check.js` - Service health verification
- `localstack-monitor.js` - LocalStack monitoring
- `resource-monitor.js` - System resource monitoring
- `log-aggregator.js` - Log collection and aggregation
- `log-viewer.js` - Interactive log viewer
- `monitoring-dashboard.js` - Comprehensive monitoring dashboard

### ⚡ performance/
Performance testing and optimization:
- `performance-monitor.js` - Performance metrics collection
- `performance-benchmarks.js` - Benchmark testing
- `performance-dashboard.js` - Performance visualization

### ✅ validation/
Environment and deployment validation:
- `environment-validator.js` - Environment setup validation
- `production-parity-validator.js` - Production environment comparison
- `comprehensive-test-runner.js` - Full test suite execution
- `final-integration-tester.js` - Integration testing

### 💾 data-management/
Data seeding and management utilities:
- `data-management.sh/bat` - Data management operations
- `backend/src/scripts/seed-opensearch.js` - Database seeding
- `setup-test-data.js` - Test data initialization
- `update-test-data.js` - Test data updates

### 🛠️ utilities/
General development utilities:
- `dev-utils.js` - Development helper functions
- `get-api-url.js` - API endpoint utilities

### ☁️ aws/
AWS-specific operations:
- `upload-images-to-s3.js` - S3 image upload utility
- `rollback-nat-eip-manual.sh` - NAT EIP rollback
- `rotate-nat-eip-manual.sh` - NAT EIP rotation

### 🧪 testing/
Testing utilities:
- `test-image-urls.js` - Image URL validation
- `test-monitoring-system.js` - Monitoring system tests

### 📂 Existing Organized Folders
- `data-seeder/` - Comprehensive data seeding utilities
- `security/` - Security validation and management
- `test-data/` - Static test data files

## 🚀 Quick Start

All scripts can be run via npm commands from the project root:

```bash
# Environment management
npm run local:start          # Start local environment
npm run local:stop           # Stop local environment
npm run local:health         # Check service health

# Data management
npm run data:seed            # Seed test data
npm run data:validate        # Validate data integrity

# Monitoring
npm run local:monitor        # Monitor resources
npm run logs:view            # View aggregated logs

# Performance
npm run performance:monitor  # Monitor performance metrics
```

## 📋 Migration Notes

This directory was reorganized on 2025-09-16 to improve maintainability. All npm script references have been automatically updated to use the new folder structure.
- `test-data/studios.json` - Updated with matching specialties

### Generated Files

- `image-urls.json` - Generated mapping of style IDs to S3 image URLs (created after upload)

## Usage

### Prerequisites

1. Ensure LocalStack is running with S3 service available
2. Install dependencies:

```bash
cd scripts
npm install
```

### Complete Setup

Run the complete setup process:

```bash
npm run setup
```

This will:
1. Upload all images from `scripts/test-data/image_set/tattoo_source/` to LocalStack S3
2. Generate image URL mappings
3. Update test data files with S3 URLs and new style IDs

### Individual Scripts

Upload images only:
```bash
npm run upload-images
```

Update test data only (requires existing `image-urls.json`):
```bash
npm run update-data
```

## Style ID Updates

The following style IDs have been updated to match the image folder structure:

- `watercolour` (was `watercolor`)
- `tribal` (new)
- `traditional` (unchanged)
- `surrealism` (new)
- `sketch` (new)
- `realism` (unchanged)
- `psychedelic` (new, folder: `psychelic`)
- `old_school` (new)
- `new_school` (was `new-school`)
- `neo_traditional` (was `neo-traditional`)
- `minimalism` (new)
- `lettering` (new)
- `geometric` (unchanged)
- `floral` (new)
- `fineline` (unchanged)
- `blackwork` (unchanged)
- `dotwork` (new)

## Image Handling

### LocalStack S3 Structure

Images are uploaded to the `tattoo-directory-images` bucket with the following structure:

```
tattoo-directory-images/
├── styles/
│   ├── watercolour/
│   │   ├── tattoo_1.png
│   │   └── tattoo_2.png
│   ├── tribal/
│   │   ├── tattoo_3.png
│   │   └── tattoo_4.png
│   └── ...
```

### Image URLs

LocalStack S3 URLs follow the pattern:
```
http://localhost:4566/tattoo-directory-images/styles/{styleId}/{filename}
```

### Artist Avatars

Artist avatars use the faker.js CDN:
```
https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-{id}.jpg
```

## Environment Variables

- `AWS_ENDPOINT_URL` - LocalStack endpoint (default: `http://localhost:4566`)
- `AWS_ACCESS_KEY_ID` - AWS access key (default: `test`)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (default: `test`)
- `AWS_DEFAULT_REGION` - AWS region (default: `eu-west-2`)

## Integration with Data Seeder

The updated test data files are used by the data seeder in `scripts/data-seeder/` to populate LocalStack services with realistic data including proper image URLs.

## Troubleshooting

### LocalStack Not Available

Ensure LocalStack is running and S3 service is available:
```bash
docker-compose -f docker-compose.local.yml up localstack
```

### Permission Issues

Check that the image files in `scripts/test-data/image_set/tattoo_source/` are readable and LocalStack has proper permissions.

### Missing Images

If some style folders are missing images, the script will skip them and log warnings. Check the `scripts/test-data/image_set/tattoo_source/` directory structure.