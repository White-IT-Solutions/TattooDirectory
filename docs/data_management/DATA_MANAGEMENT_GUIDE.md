# Enhanced Data Management Guide

## Overview

The Tattoo Directory MVP uses a unified data management system that consolidates all data operations into simple, developer-friendly commands. This system manages LocalStack services (DynamoDB, OpenSearch, S3), processes images, seeds test data, and maintains frontend mock data synchronization.

**🆕 Enhanced Features:** The system now includes a comprehensive frontend-sync-processor with advanced mock data generation capabilities, realistic business data (ratings, pricing, availability, experience), comprehensive studio information, enhanced style metadata, RFC 9457 compliant error responses, and data export/reuse functionality.

## Quick Start

### First-Time Setup

```bash
# Complete system setup with enhanced capabilities (recommended for new developers)
npm run setup-data

# Enhanced frontend-only setup with business data (no AWS services required)
npm run setup-data:frontend-only

# Enhanced frontend setup with data export and validation
npm run setup-data:frontend-only --export --validate

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
# Full setup - processes images, seeds databases, updates frontend with enhanced data
npm run setup-data

# Enhanced frontend-only - generates comprehensive mock data with business information
npm run setup-data:frontend-only

# Enhanced frontend with export - generates data and exports for reuse
npm run setup-data:frontend-only --export

# Enhanced frontend with validation - generates data with consistency checking
npm run setup-data:frontend-only --validate

# Images-only - processes and uploads images to S3
npm run setup-data:images-only

# Force refresh - reprocesses everything regardless of changes
npm run setup-data:force

# Scenario-based setup - use specific enhanced scenarios
npm run setup-data --scenario london-focused --validate
```

**What it does:**
- Detects and starts required LocalStack services
- Processes images from `tests/Test_Data/ImageSet/`
- Uploads images to S3 with CORS configuration
- Seeds DynamoDB with artist and studio data
- Indexes data in OpenSearch for search functionality
- **🆕 Generates enhanced frontend mock data with:**
  - Realistic business data (ratings, pricing, availability, experience)
  - Comprehensive contact information (email, phone, website, Instagram)
  - Bidirectional artist-studio relationships with complete studio data
  - Enhanced style metadata with characteristics and difficulty levels
  - Proper data structure alignment (bio field, tattooStudio.address format)
  - System fields (pk, sk, opted_out) for consistency
- **🆕 Supports data export and reuse functionality**
- **🆕 Includes data validation and consistency checking**
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

### Enhanced Frontend-Sync-Processor

The enhanced frontend-sync-processor provides advanced mock data generation capabilities with comprehensive business data and realistic profiles.

```bash
# Generate mock data with business information
npm run frontend-sync generate --count 10 --scenario normal

# Generate specific enhanced scenarios
npm run frontend-sync scenario london-focused --export

# Generate performance test data
npm run frontend-sync performance --count 100

# Generate RFC 9457 compliant error responses
npm run frontend-sync error validation --instance /v1/search

# Validate existing mock data structure
npm run frontend-sync validate

# Generate and display studio data
npm run frontend-sync studios
```

**Enhanced Features:**
- **Business Data Generation**: Realistic ratings (1.0-5.0), pricing (£80-£250/hour), availability status, experience levels
- **Comprehensive Contact Info**: Email, phone, website, Instagram with privacy controls
- **Studio Relationships**: Bidirectional artist-studio linking with complete studio information
- **Style Metadata**: Enhanced characteristics, difficulty levels, popular motifs, color palettes
- **Data Export/Import**: Save and reuse generated datasets across development sessions
- **Error Response Generation**: RFC 9457 compliant error responses for testing error scenarios
- **Performance Testing**: Large datasets (50-1000+ artists) for performance and stress testing
- **Data Validation**: Comprehensive validation of data structure and consistency

### Seed Scenarios

Load specific enhanced test scenarios for targeted feature testing with comprehensive business data.

```bash
# Enhanced scenarios with comprehensive business data
npm run seed-scenario:minimal          # 3 artists with business data, quick testing
npm run seed-scenario:search-basic     # 5 artists with ratings/pricing, traditional + realism styles
npm run seed-scenario:london-artists   # 5 London-based artists with studio relationships
npm run seed-scenario:london-focused   # 10 London artists with comprehensive studio data
npm run seed-scenario:high-rated       # 3 artists with 4.5+ ratings and premium pricing
npm run seed-scenario:new-artists      # 4 recently added artists with experience data
npm run seed-scenario:booking-available # 6 artists with open booking slots and availability data
npm run seed-scenario:portfolio-rich   # 4 artists with 8+ portfolio images and style metadata
npm run seed-scenario:multi-style      # 3 artists with 3+ specializations and characteristics
npm run seed-scenario:style-diverse    # 12 artists with diverse styles and enhanced metadata
npm run seed-scenario:pricing-range    # 5 artists with detailed mid-range pricing data
npm run seed-scenario:full-dataset     # 10 artists with all enhanced features
npm run seed-scenario:empty            # 0 artists for testing no-data states
npm run seed-scenario:single           # 1 artist for minimal data display testing
npm run seed-scenario:performance-test # 50+ artists for performance testing
```

**Scenario Details:**

| Scenario | Artists | Focus | Best For | Enhanced Features |
|----------|---------|-------|----------|-------------------|
| minimal | 3 | Quick testing | Unit tests, basic functionality | Business data, ratings, pricing |
| search-basic | 5 | Search functionality | Search feature development | Ratings, pricing, style metadata |
| london-artists | 5 | Location filtering | Location-based features | Studio relationships, geohash |
| london-focused | 10 | Enhanced London testing | Comprehensive location features | Full studio data, artist rosters |
| high-rated | 3 | Rating systems | Rating and review features | 4.5+ ratings, premium pricing |
| new-artists | 4 | Recent additions | New artist workflows | Experience data, certifications |
| booking-available | 6 | Booking systems | Booking functionality | Availability status, booking slots |
| portfolio-rich | 4 | Image galleries | Portfolio display features | 8+ images, style metadata |
| multi-style | 3 | Style diversity | Style filtering and categorization | 3+ styles, characteristics |
| style-diverse | 12 | Enhanced style testing | Style filtering with metadata | All styles, characteristics, difficulty |
| pricing-range | 5 | Pricing data | Pricing and cost features | Detailed pricing, currency, ranges |
| full-dataset | 10 | Complete testing | Integration tests, full workflows | All enhanced features enabled |
| empty | 0 | No-data states | Empty state testing | Error responses, fallback UI |
| single | 1 | Minimal display | Single result testing | Complete business data profile |
| performance-test | 50+ | Performance testing | Load testing, pagination | Optimized for size, performance data |

### Health & Validation

Monitor system health and validate data integrity.

```bash
# Check service connectivity and health
npm run health-check

# Enhanced validation with business data and structure checking
npm run validate-data

# Get current system status and data counts
npm run data-status

# Enhanced validation types
npm run validate-data:consistency        # Cross-service data consistency and frontend-sync alignment
npm run validate-data:images            # Image URL accessibility
npm run validate-data:scenarios         # Enhanced scenario data integrity with business data
npm run validate-data:frontend          # Frontend mock data structure and content validation
npm run validate-data:business-data     # Business data validation (ratings, pricing, availability)
npm run validate-data:studio-relationships # Artist-studio relationship validation
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

## Enhanced Data Structures

### Business Data Integration

The enhanced frontend-sync-processor now generates comprehensive business data:

```javascript
// Enhanced Artist Data Structure
{
  artistId: "artist_001",
  artistName: "Sarah Mitchell",
  bio: "Traditional and neo-traditional tattoo artist specializing in roses, eagles, and nautical themes",
  avatar: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-72.jpg",
  
  // Enhanced Business Data
  rating: 4.7,
  reviewCount: 156,
  pricing: {
    hourlyRate: 120,
    minimumCharge: 100,
    currency: "GBP"
  },
  availability: {
    status: "Booking 1-2 weeks",
    bookingOpen: true,
    nextAvailable: "2024-02-15",
    waitingList: false
  },
  experience: {
    yearsActive: 8,
    apprenticeshipCompleted: true,
    certifications: ["First Aid", "Bloodborne Pathogens", "Color Theory"]
  },
  
  // Enhanced Contact Information
  contactInfo: {
    instagram: "sarahmitchell_tattoos",
    email: "sarah@inksteel.studio",
    phone: "+44 20 7123 4567",
    website: "https://sarahmitchell.tattoo"
  },
  
  // Enhanced Studio Relationship
  tattooStudio: {
    studioId: "studio_001",
    studioName: "Ink & Steel Studio",
    address: {
      street: "45 Camden High Street",
      city: "London",
      postcode: "NW1 7JN",
      latitude: 51.5074,
      longitude: -0.1278
    }
  },
  
  // Enhanced Style Metadata
  styles: ["traditional", "neo_traditional"],
  styleMetadata: {
    traditional: {
      characteristics: ["bold_lines", "vibrant_colors", "classic_motifs"],
      difficulty: "intermediate",
      popularMotifs: ["roses", "eagles", "anchors"],
      colorPalette: ["red", "blue", "yellow", "green"]
    }
  },
  
  // System Fields
  geohash: "gcpvj0du",
  pk: "ARTIST#artist_001",
  sk: "PROFILE",
  opted_out: false
}
```

### Studio Data Structure

```javascript
// Comprehensive Studio Data
{
  studioId: "studio_001",
  studioName: "Ink & Steel Studio",
  address: "45 Camden High Street, London, NW1 7JN",
  latitude: 51.5074,
  longitude: -0.1278,
  geohash: "gcpvj0du",
  
  contactInfo: {
    phone: "+44 20 7123 4567",
    email: "info@inksteel.studio",
    website: "https://inksteel.studio",
    instagram: "inksteelstudio"
  },
  
  openingHours: {
    monday: "10:00-18:00",
    tuesday: "10:00-18:00",
    wednesday: "10:00-18:00",
    thursday: "10:00-20:00",
    friday: "10:00-20:00",
    saturday: "09:00-17:00",
    sunday: "Closed"
  },
  
  artists: ["artist_001", "artist_002", "artist_003"],
  rating: 4.6,
  reviewCount: 89,
  established: 2015,
  specialties: ["traditional", "realism", "blackwork"]
}
```

### Error Response Structure (RFC 9457)

```javascript
// RFC 9457 Compliant Error Responses
{
  type: "https://tattoo-directory.com/errors/validation-error",
  title: "Validation Error",
  status: 400,
  detail: "The request contains invalid parameters",
  instance: "/v1/search",
  timestamp: "2024-01-15T10:30:00Z",
  errors: [
    {
      field: "location",
      code: "invalid_postcode",
      message: "Postcode format is invalid"
    }
  ]
}
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
  frontendMock: 'frontend/src/app/data/mockArtistData.js',
  // Enhanced paths for data export/import
  dataExports: 'scripts/data-exports',
  performanceData: 'scripts/performance-data'
}

// Enhanced frontend-sync-processor configuration
frontendSync: {
  // Business data generation settings
  includeBusinessData: true,
  includePricingData: true,
  includeAvailabilityData: true,
  includeExperienceData: true,
  
  // Studio relationship settings
  includeStudioData: true,
  generateBidirectionalLinks: true,
  
  // Style metadata settings
  includeStyleMetadata: true,
  includeStyleCharacteristics: true,
  includeDifficultyLevels: true,
  
  // Data export settings
  enableDataExport: true,
  validateOnExport: true,
  
  // Performance settings
  batchSize: 10,
  maxArtistCount: 1000,
  enablePerformanceMetrics: true
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

### Data Export and Reuse

The enhanced system supports exporting generated datasets for reuse across development sessions:

```bash
# Export data during generation
npm run setup-data:frontend-only --export

# Export specific scenarios
npm run frontend-sync scenario london-focused --export

# List available exported datasets
npm run frontend-sync list-exports

# Import and reuse exported data
npm run frontend-sync import scripts/data-exports/london-focused-20240115.json

# Validate exported data consistency
npm run frontend-sync validate-consistency
```

**Export Features:**
- **Automatic Validation**: All exported data is validated for consistency
- **Timestamped Files**: Exports include generation timestamp and metadata
- **Scenario Templates**: Reusable scenario configurations
- **Size Optimization**: Optimized file sizes for large datasets
- **Cross-Session Reuse**: Share datasets between development sessions

**Export File Structure:**
```javascript
{
  metadata: {
    scenario: "london-focused",
    artistCount: 10,
    generatedAt: "2024-01-15T10:30:00Z",
    version: "2.1.0",
    includesBusinessData: true,
    includesStudioData: true
  },
  artists: [...], // Generated artist data
  studios: [...], // Generated studio data
  validation: {
    passed: true,
    errors: [],
    warnings: []
  }
}
```

### Frontend-Only Development

For frontend developers who don't need AWS services:

```bash
# Setup enhanced frontend mock data without LocalStack
npm run setup-data:frontend-only

# Enhanced frontend setup with business data and export
npm run setup-data:frontend-only --export --validate

# Reset to frontend-ready state with enhanced data
npm run reset-data:frontend-ready

# Generate specific enhanced scenarios for frontend
npm run frontend-sync scenario style-diverse --export
```

This generates comprehensive mock data in `frontend/src/app/data/mockArtistData.js` with:
- **Enhanced Business Data**: Realistic ratings, pricing, availability, experience
- **Comprehensive Contact Info**: Email, phone, website, Instagram
- **Studio Relationships**: Bidirectional artist-studio linking
- **Style Metadata**: Characteristics, difficulty levels, popular motifs
- **Proper Data Structure**: Aligned with backend API expectations
- **System Fields**: pk, sk, opted_out for consistency
- **Placeholder Images**: Using CDN URLs with proper aspect ratios
- **No Dependencies**: No LocalStack or Docker required

## Workflows

### New Developer Onboarding

```bash
# 1. Clone repository and install dependencies
git clone <repository>
npm install

# 2. Start LocalStack services
docker-compose up -d localstack

# 3. Setup complete development environment with enhanced data
npm run setup-data

# 4. Verify everything is working including enhanced features
npm run health-check
npm run validate-data:business-data

# 5. Start frontend development with enhanced mock data
npm run dev --workspace=frontend

# 6. Optional: Generate specific enhanced scenarios for development
npm run frontend-sync scenario london-focused --export
```

### Enhanced Feature Development

```bash
# 1. Reset to clean state for your feature
npm run reset-data:clean

# 2. Seed appropriate enhanced test scenario with business data
npm run seed-scenario:search-basic     # for search features with ratings/pricing
npm run seed-scenario:london-focused   # for location features with studio data
npm run seed-scenario:style-diverse    # for style filtering with metadata
npm run seed-scenario:booking-available # for booking features with availability

# 3. Use enhanced frontend-only development when needed
npm run setup-data:frontend-only --scenario high-rated --export

# 4. Develop your feature with realistic business data...

# 5. Validate enhanced data integrity
npm run validate-data:business-data
npm run validate-data:studio-relationships

# 6. Test with different enhanced scenarios as needed
npm run seed-scenario:performance-test  # for performance testing
npm run frontend-sync scenario style-diverse --export  # for comprehensive testing
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