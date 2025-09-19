# Data Management Guide

## Overview

The Tattoo Directory MVP uses a unified data management system that consolidates all data operations into simple, developer-friendly commands. This system manages LocalStack services (DynamoDB, OpenSearch, S3), processes images, seeds test data, and maintains frontend mock data synchronization.

## Quick Start

### First-Time Setup

```bash
# Complete system setup (recommended for new developers)
npm run setup-data

# Frontend-only setup (no AWS services required)
npm run setup-data:frontend-only

# Check system health
npm run health-check
```

### Daily Development

```bash
# Quick status check
npm run data-status

# Reset to clean state
npm run reset-data:clean

# Seed specific test scenario
npm run seed-scenario:minimal
```

## Core Commands

### Setup Data

The `setup-data` command is your primary tool for initializing the development environment.

```bash
# Full setup - processes images, seeds databases, updates frontend
npm run setup-data

# Frontend-only - generates mock data without AWS services
npm run setup-data:frontend-only

# Images-only - processes and uploads images to S3
npm run setup-data:images-only

# Force refresh - reprocesses everything regardless of changes
npm run setup-data:force
```

**What it does:**
- Detects and starts required LocalStack services
- Processes images from `tests/Test_Data/ImageSet/`
- Uploads images to S3 with CORS configuration
- Seeds DynamoDB with artist and studio data
- Indexes data in OpenSearch for search functionality
- Updates frontend mock data files
- Validates data consistency across services

**Smart Features:**
- **Incremental Processing**: Only processes changed files on subsequent runs
- **Service Detection**: Automatically detects running services
- **Error Recovery**: Provides clear error messages with troubleshooting steps
- **Progress Tracking**: Shows real-time progress for long operations

### Reset Data

Reset the system to predefined states for testing different scenarios.

```bash
# Reset to fresh state with full dataset (default)
npm run reset-data

# Available reset states
npm run reset-data:clean           # Empty databases, services running
npm run reset-data:fresh           # Full dataset, clean start
npm run reset-data:minimal         # Minimal data for quick testing
npm run reset-data:search-ready    # Optimized for search testing
npm run reset-data:location-test   # Location-based testing data
npm run reset-data:style-test      # Style filtering testing data
npm run reset-data:performance-test # Performance testing dataset
npm run reset-data:frontend-ready  # Minimal data for frontend development
```

**Use Cases:**
- **clean**: Start with empty databases for custom data setup
- **fresh**: Standard development state with complete test dataset
- **minimal**: Quick testing with just 3 artists
- **search-ready**: Testing search functionality with diverse data
- **location-test**: Testing location-based features (London artists)
- **style-test**: Testing style filtering (multi-style artists)
- **performance-test**: Load testing with full dataset
- **frontend-ready**: Frontend development without backend complexity

### Seed Scenarios

Load specific test scenarios for targeted feature testing.

```bash
# Available scenarios
npm run seed-scenario:minimal          # 3 artists, quick testing
npm run seed-scenario:search-basic     # 5 artists, traditional + realism styles
npm run seed-scenario:london-artists   # 5 London-based artists
npm run seed-scenario:high-rated       # 3 artists with 4.5+ ratings
npm run seed-scenario:new-artists      # 4 recently added artists
npm run seed-scenario:booking-available # 6 artists with open booking
npm run seed-scenario:portfolio-rich   # 4 artists with 8+ portfolio images
npm run seed-scenario:multi-style      # 3 artists with 3+ specializations
npm run seed-scenario:pricing-range    # 5 artists with mid-range pricing
npm run seed-scenario:full-dataset     # 10 artists, complete test data
```

**Scenario Details:**

| Scenario | Artists | Focus | Best For |
|----------|---------|-------|----------|
| minimal | 3 | Quick testing | Unit tests, basic functionality |
| search-basic | 5 | Search functionality | Search feature development |
| london-artists | 5 | Location filtering | Location-based features |
| high-rated | 3 | Rating systems | Rating and review features |
| new-artists | 4 | Recent additions | New artist workflows |
| booking-available | 6 | Booking systems | Booking functionality |
| portfolio-rich | 4 | Image galleries | Portfolio display features |
| multi-style | 3 | Style diversity | Style filtering and categorization |
| pricing-range | 5 | Pricing data | Pricing and cost features |
| full-dataset | 10 | Complete testing | Integration tests, full workflows |

### Health & Validation

Monitor system health and validate data integrity.

```bash
# Check service connectivity and health
npm run health-check

# Validate data consistency across services
npm run validate-data

# Get current system status and data counts
npm run data-status

# Specific validation types
npm run validate-data:consistency  # Cross-service data consistency
npm run validate-data:images      # Image URL accessibility
npm run validate-data:scenarios   # Scenario data integrity
```

**Health Check Output:**
```
🏥 System Health Check
═══════════════════════

✅ LocalStack Services
  • DynamoDB: Connected (localhost:4566)
  • OpenSearch: Connected (localhost:4566)  
  • S3: Connected (localhost:4566)

✅ Data Status
  • DynamoDB Artists: 10 records
  • OpenSearch Documents: 10 indexed
  • S3 Images: 45 uploaded
  • Frontend Mock Data: Updated

✅ Service Connectivity
  • All services responding normally
  • Data consistency verified
  • Image URLs accessible

🎯 System Ready for Development!
```

## Advanced Usage

### Configuration

The system uses `scripts/data-config.js` for centralized configuration:

```javascript
// Service endpoints (auto-detected)
services: {
  localstack: 'http://localhost:4566',
  dynamodb: 'tattoo-directory-local',
  opensearch: 'artists-local',
  s3Bucket: 'tattoo-directory-images'
}

// File paths (cross-platform)
paths: {
  imageSource: 'tests/Test_Data/ImageSet',
  testData: 'scripts/test-data',
  frontendMock: 'frontend/src/app/data/mockArtistData.js'
}
```

### Environment Detection

The system automatically detects your environment:

- **Host Development**: Uses `localhost:4566` for LocalStack
- **Docker Container**: Uses `localstack:4566` for container networking
- **CI/CD Environment**: Adjusts timeouts and retry logic

### Incremental Processing

The system tracks file changes to avoid unnecessary reprocessing:

```bash
# First run - processes everything
npm run setup-data
# ✅ Processed 45 images, seeded 10 artists, updated frontend

# Second run - only processes changes
npm run setup-data  
# ✅ No changes detected, skipping processing (completed in 2s)

# Force full reprocessing
npm run setup-data:force
# ✅ Force mode: processed all files regardless of changes
```

### Frontend-Only Development

For frontend developers who don't need AWS services:

```bash
# Setup frontend mock data without LocalStack
npm run setup-data:frontend-only

# Reset to frontend-ready state
npm run reset-data:frontend-ready
```

This generates realistic mock data in `frontend/src/app/data/mockArtistData.js` with:
- Placeholder images using CDN URLs
- Realistic artist names and descriptions
- Proper data structure matching the API
- No dependency on LocalStack or Docker

## Workflows

### New Developer Onboarding

```bash
# 1. Clone repository and install dependencies
git clone <repository>
npm install

# 2. Start LocalStack services
docker-compose up -d localstack

# 3. Setup complete development environment
npm run setup-data

# 4. Verify everything is working
npm run health-check

# 5. Start frontend development
npm run dev --workspace=frontend
```

### Feature Development

```bash
# 1. Reset to clean state for your feature
npm run reset-data:clean

# 2. Seed appropriate test scenario
npm run seed-scenario:search-basic  # for search features
npm run seed-scenario:london-artists  # for location features

# 3. Develop your feature...

# 4. Validate data integrity
npm run validate-data

# 5. Test with different scenarios as needed
npm run seed-scenario:full-dataset
```

### Testing Workflows

```bash
# Unit testing setup
npm run reset-data:minimal
npm run test --workspace=backend

# Integration testing setup  
npm run reset-data:fresh
npm run test:integration

# Performance testing setup
npm run reset-data:performance-test
npm run test:performance
```

### Debugging Issues

```bash
# 1. Check system health
npm run health-check

# 2. Get detailed status
npm run data-status

# 3. Validate data consistency
npm run validate-data

# 4. Reset to known good state
npm run reset-data:fresh

# 5. Check logs for errors
docker-compose logs localstack
```

## Troubleshooting

### Common Issues

#### "LocalStack services not available"

**Symptoms:**
```
❌ Error: LocalStack services not available
   DynamoDB: Connection refused (localhost:4566)
   OpenSearch: Connection refused (localhost:4566)
```

**Solutions:**
```bash
# Check if LocalStack is running
docker-compose ps localstack

# Start LocalStack if not running
docker-compose up -d localstack

# Wait for services to be ready (30-60 seconds)
npm run health-check
```

#### "No changes detected, but data seems wrong"

**Symptoms:**
- System reports no changes but data appears incorrect
- Incremental processing skipping necessary updates

**Solutions:**
```bash
# Force full reprocessing
npm run setup-data:force

# Reset state tracking
rm -rf .kiro/data-management-state
npm run setup-data
```

#### "Frontend mock data not updating"

**Symptoms:**
- Frontend shows old or incorrect data
- Mock data file not being updated

**Solutions:**
```bash
# Force frontend data update
npm run setup-data:frontend-only

# Check file permissions
ls -la frontend/src/app/data/mockArtistData.js

# Verify frontend workspace
npm run validate-data:frontend
```

#### "Image URLs not accessible"

**Symptoms:**
- Images not loading in frontend
- S3 URL validation failures

**Solutions:**
```bash
# Reprocess images
npm run setup-data:images-only

# Check S3 bucket and CORS
npm run validate-data:images

# Verify LocalStack S3 service
curl http://localhost:4566/tattoo-directory-images
```

#### "Database seeding fails"

**Symptoms:**
- DynamoDB or OpenSearch seeding errors
- Partial data in databases

**Solutions:**
```bash
# Reset databases and retry
npm run reset-data:clean
npm run setup-data

# Check service logs
docker-compose logs localstack

# Validate database connectivity
npm run health-check
```

### Performance Issues

#### "Setup taking too long"

**Optimization strategies:**
```bash
# Use incremental processing (default)
npm run setup-data

# Use minimal scenarios for development
npm run seed-scenario:minimal

# Use frontend-only mode when possible
npm run setup-data:frontend-only
```

#### "Docker resource constraints"

**Resource optimization:**
```bash
# Check Docker resource usage
docker stats

# Optimize Docker settings
# - Increase memory allocation to 4GB+
# - Enable WSL 2 backend on Windows
# - Use SSD storage for Docker volumes
```

### Getting Help

#### System Diagnostics

```bash
# Comprehensive health check
npm run health-check

# Detailed system status
npm run data-status

# Validate all components
npm run validate-data
```

#### Debug Information

```bash
# Enable debug logging
DEBUG=data-management npm run setup-data

# Check configuration
node -e "console.log(require('./scripts/data-config.js'))"

# Test individual components
npm run test --workspace=scripts
```

#### Migration Support

If migrating from legacy scripts:
```bash
# Run migration analysis
cd scripts
node migration-utility.js analyze

# Get migration recommendations
node migration-utility.js full
```

## Performance Optimization

### Incremental Processing

The system automatically optimizes performance through change detection:

- **Image Processing**: Only processes changed images
- **Database Seeding**: Only updates modified data
- **Frontend Sync**: Only updates when data changes
- **Service Configuration**: Only reconfigures when needed

### Caching Strategy

- **State Tracking**: Maintains checksums of all processed files
- **Service Caching**: Reuses existing service connections
- **Data Caching**: Avoids redundant database operations
- **Image Caching**: Skips unchanged image uploads

### Resource Management

- **Memory Usage**: Processes images in batches to manage memory
- **Connection Pooling**: Reuses database connections
- **Parallel Processing**: Processes independent operations concurrently
- **Cleanup**: Automatically cleans up temporary resources

## Integration

### npm Workspaces

The system integrates seamlessly with the npm workspace structure:

```bash
# Root level commands
npm run setup-data
npm run health-check

# Workspace-specific commands
npm run dev --workspace=frontend
npm run test --workspace=backend
npm run build --workspace=scripts
```

### Docker Integration

Automatic Docker environment detection:

```javascript
// Detects Docker environment
const isDocker = process.env.DOCKER_CONTAINER || fs.existsSync('/.dockerenv');

// Adjusts endpoints accordingly
const endpoint = isDocker ? 'http://localstack:4566' : 'http://localhost:4566';
```

### CI/CD Integration

Optimized for continuous integration:

```yaml
# GitHub Actions example
- name: Setup test data
  run: npm run setup-data

- name: Run tests
  run: npm run test --workspaces

- name: Validate data integrity
  run: npm run validate-data
```

## Best Practices

### Development Workflow

1. **Start with health check**: Always verify system health before development
2. **Use appropriate scenarios**: Choose test scenarios that match your feature
3. **Validate frequently**: Run validation after significant changes
4. **Reset when needed**: Don't hesitate to reset to clean states
5. **Monitor performance**: Use incremental processing for faster iterations

### Data Management

1. **Consistent states**: Use predefined reset states for reproducible testing
2. **Scenario-based testing**: Use specific scenarios for targeted feature testing
3. **Regular validation**: Validate data consistency across services
4. **Backup important data**: Use version control for test data changes
5. **Document custom scenarios**: Create documentation for project-specific scenarios

### Performance

1. **Leverage incremental processing**: Let the system detect changes automatically
2. **Use minimal scenarios**: Start with small datasets for development
3. **Frontend-only mode**: Use when backend services aren't needed
4. **Monitor resource usage**: Keep an eye on Docker resource consumption
5. **Optimize Docker**: Use appropriate resource allocation and storage

This guide provides comprehensive coverage of the unified data management system. For specific issues or advanced use cases, refer to the troubleshooting section or consult the migration guide for transitioning from legacy scripts.