# Studio Data Migration Guide

## Overview

This guide provides comprehensive instructions for migrating existing studio data to the new Studio Data Pipeline Integration system. Whether you're upgrading from a legacy system, importing external studio data, or integrating with existing artist data, this guide covers all migration scenarios.

## Migration Scenarios

### Scenario 1: Fresh Installation (No Existing Data)

**Use Case**: New project setup with no existing studio or artist data.

**Migration Steps**:
```bash
# 1. Install and setup the system
npm install
docker-compose up -d localstack

# 2. Initialize with studio data
npm run setup-data

# 3. Validate installation
npm run validate-studios all
npm run health-check
```

**Expected Outcome**: Complete system with generated artist and studio data, fully integrated relationships.

### Scenario 2: Existing Artist Data, Adding Studios

**Use Case**: Project has existing artist data, need to add studio integration.

**Migration Steps**:
```bash
# 1. Backup existing data
npm run backup-data --type artists

# 2. Add studio data to existing artists
npm run migrate-studio-data --mode add-to-existing

# 3. Validate integration
npm run validate-studios relationships
npm run validate-data consistency
```

**Expected Outcome**: Existing artists enhanced with studio relationships, new studio entities created.

### Scenario 3: External Studio Data Import

**Use Case**: Importing studio data from external sources (CSV, JSON, API).

**Migration Steps**:
```bash
# 1. Prepare import data
npm run prepare-studio-import --source external-studios.csv

# 2. Validate import data
npm run validate-studio-import --file prepared-studios.json

# 3. Import studio data
npm run import-studio-data --file prepared-studios.json

# 4. Create artist-studio relationships
npm run manage-studio-relationships rebuild
```

**Expected Outcome**: External studio data integrated with proper relationships and validation.

### Scenario 4: Legacy System Migration

**Use Case**: Migrating from older version of the system or different studio management system.

**Migration Steps**:
```bash
# 1. Export legacy data
npm run export-legacy-data --format studio-migration

# 2. Transform legacy data
npm run transform-legacy-studios --input legacy-export.json

# 3. Import transformed data
npm run import-studio-data --file transformed-studios.json --validate

# 4. Reconcile relationships
npm run manage-studio-relationships repair
```

**Expected Outcome**: Legacy studio data migrated with modern schema and relationships.

## Pre-Migration Checklist

### System Requirements

- [ ] Node.js 18+ installed
- [ ] Docker Desktop running with 4GB+ RAM
- [ ] LocalStack services accessible
- [ ] Sufficient disk space (5GB+ recommended)
- [ ] Backup of existing data (if applicable)

### Data Preparation

- [ ] Studio data in supported format (JSON, CSV)
- [ ] Required fields present (name, address, contact info)
- [ ] UK postcode validation completed
- [ ] Duplicate studio detection performed
- [ ] Artist-studio relationship mapping prepared (if applicable)

### Environment Setup

```bash
# Verify system health
npm run health-check

# Check available scenarios
npm run list-scenarios | grep studio

# Validate configuration
node -e "
const config = require('./scripts/data-config.js');
console.log('Studio config:', config.studio);
console.log('Available scenarios:', Object.keys(config.scenarios));
"
```

## Migration Data Formats

### Studio Data Schema

#### Required Fields

```json
{
  "studioName": "Ink & Steel Studio",
  "address": "123 Brick Lane, Shoreditch, London E1 6SB",
  "postcode": "E1 6SB",
  "city": "London",
  "contactInfo": {
    "phone": "+44 20 7946 0958",
    "email": "info@inkandsteel.com"
  }
}
```

#### Optional Fields

```json
{
  "website": "https://inkandsteel.com",
  "instagram": "@inkandsteelstudio",
  "established": 2015,
  "specialties": ["traditional", "neo_traditional"],
  "rating": 4.7,
  "reviewCount": 89,
  "openingHours": {
    "monday": "10:00-18:00",
    "tuesday": "10:00-18:00",
    "wednesday": "10:00-18:00",
    "thursday": "10:00-18:00",
    "friday": "10:00-20:00",
    "saturday": "10:00-20:00",
    "sunday": "closed"
  }
}
```

### CSV Import Format

```csv
studioName,address,postcode,city,phone,email,website,instagram,established,specialties,rating,reviewCount
"Ink & Steel Studio","123 Brick Lane, Shoreditch, London E1 6SB","E1 6SB","London","+44 20 7946 0958","info@inkandsteel.com","https://inkandsteel.com","@inkandsteelstudio",2015,"traditional,neo_traditional",4.7,89
"London Tattoo Collective","456 Camden High Street, Camden, London NW1 7JR","NW1 7JR","London","+44 20 7946 1234","hello@londontattoo.co.uk","https://londontattoo.co.uk","@londontattoo",2018,"realism,portrait",4.5,156
```

### JSON Import Format

```json
{
  "studios": [
    {
      "studioName": "Ink & Steel Studio",
      "address": "123 Brick Lane, Shoreditch, London E1 6SB",
      "postcode": "E1 6SB",
      "city": "London",
      "contactInfo": {
        "phone": "+44 20 7946 0958",
        "email": "info@inkandsteel.com",
        "website": "https://inkandsteel.com",
        "instagram": "@inkandsteelstudio"
      },
      "established": 2015,
      "specialties": ["traditional", "neo_traditional"],
      "rating": 4.7,
      "reviewCount": 89,
      "openingHours": {
        "monday": "10:00-18:00",
        "tuesday": "10:00-18:00",
        "wednesday": "10:00-18:00",
        "thursday": "10:00-18:00",
        "friday": "10:00-20:00",
        "saturday": "10:00-20:00",
        "sunday": "closed"
      },
      "artists": ["artist-001", "artist-002"]
    }
  ]
}
```

## Step-by-Step Migration Procedures

### Migration Procedure 1: Adding Studios to Existing Artists

#### Step 1: Backup Existing Data

```bash
# Create backup directory
mkdir -p migration-backups/$(date +%Y%m%d-%H%M%S)

# Backup DynamoDB data
awslocal dynamodb scan \
  --table-name tattoo-directory-local \
  --endpoint-url http://localhost:4566 \
  > migration-backups/$(date +%Y%m%d-%H%M%S)/dynamodb-backup.json

# Backup OpenSearch data
curl "http://localhost:4566/artists-local/_search?size=1000&pretty" \
  > migration-backups/$(date +%Y%m%d-%H%M%S)/opensearch-backup.json

# Backup frontend mock data
cp frontend/src/app/data/mockArtistData.js \
   migration-backups/$(date +%Y%m%d-%H%M%S)/mockArtistData.js.backup
```

#### Step 2: Analyze Existing Data

```bash
# Check current artist count and distribution
npm run data-status

# Analyze artist locations for studio placement
node -e "
const fs = require('fs');
const mockData = fs.readFileSync('frontend/src/app/data/mockArtistData.js', 'utf8');
const artistMatch = mockData.match(/export const mockArtistData = (\[[\s\S]*?\]);/);
if (artistMatch) {
  const artists = JSON.parse(artistMatch[1]);
  const locations = artists.map(a => a.location).filter(Boolean);
  const locationCounts = {};
  locations.forEach(loc => {
    const city = loc.split(',')[1]?.trim() || 'Unknown';
    locationCounts[city] = (locationCounts[city] || 0) + 1;
  });
  console.log('Artist distribution by city:', locationCounts);
}
"
```

#### Step 3: Generate Compatible Studios

```bash
# Generate studios based on existing artist distribution
npm run seed-studios --scenario match-existing-artists --validate

# Verify studio generation
npm run studio-status
```

#### Step 4: Create Artist-Studio Relationships

```bash
# Create relationships based on location and style compatibility
npm run manage-studio-relationships rebuild

# Validate relationship consistency
npm run validate-studios relationships
```

#### Step 5: Update All Data Stores

```bash
# Update DynamoDB with studio data and relationships
npm run update-database --type studios

# Update OpenSearch indices
npm run update-search-index --type studios

# Regenerate frontend mock data with studios
npm run setup-data:frontend-only --validate
```

#### Step 6: Validation and Testing

```bash
# Comprehensive validation
npm run validate-data all

# Test studio-specific functionality
npm run validate-studios all

# Test frontend integration
npm run test-frontend-integration --type studios
```

### Migration Procedure 2: External Data Import

#### Step 1: Prepare Import Data

```bash
# Create import directory
mkdir -p migration-imports

# Convert CSV to JSON (if needed)
node scripts/migration-utility.js convert-csv \
  --input external-studios.csv \
  --output migration-imports/studios.json

# Validate import data format
node scripts/migration-utility.js validate-import \
  --file migration-imports/studios.json
```

#### Step 2: Data Transformation and Validation

```bash
# Transform external data to internal format
node scripts/migration-utility.js transform-studios \
  --input migration-imports/studios.json \
  --output migration-imports/transformed-studios.json

# Validate transformed data
npm run validate-studio-import --file migration-imports/transformed-studios.json
```

#### Step 3: Import Process

```bash
# Import studio data
npm run import-studio-data \
  --file migration-imports/transformed-studios.json \
  --mode replace \
  --validate

# Check import results
npm run studio-status
```

#### Step 4: Relationship Creation

```bash
# Create artist-studio relationships
npm run manage-studio-relationships rebuild

# Validate relationships
npm run validate-studios relationships
```

#### Step 5: Post-Import Validation

```bash
# Validate all studio data
npm run validate-studios all

# Check data consistency across services
npm run validate-data consistency

# Generate validation report
npm run generate-migration-report --type studio-import
```

## Data Transformation Utilities

### Studio Data Transformer

```javascript
class StudioDataTransformer {
  /**
   * Transform external studio data to internal format
   */
  static transformExternalStudio(externalStudio) {
    return {
      studioId: this.generateStudioId(externalStudio.name),
      studioName: externalStudio.name || externalStudio.studioName,
      address: this.formatAddress(externalStudio),
      postcode: this.extractPostcode(externalStudio.address),
      locationDisplay: this.formatLocationDisplay(externalStudio),
      latitude: externalStudio.lat || externalStudio.latitude,
      longitude: externalStudio.lng || externalStudio.longitude,
      contactInfo: this.transformContactInfo(externalStudio),
      openingHours: this.transformOpeningHours(externalStudio),
      specialties: this.transformSpecialties(externalStudio),
      rating: parseFloat(externalStudio.rating) || 4.0,
      reviewCount: parseInt(externalStudio.reviewCount) || 0,
      established: parseInt(externalStudio.established) || new Date().getFullYear() - 5,
      artists: [],
      artistCount: 0,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      opted_out: false
    };
  }

  static generateStudioId(studioName) {
    const slug = studioName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `studio-${slug}-${Date.now().toString(36)}`;
  }

  static formatAddress(externalStudio) {
    if (externalStudio.fullAddress) return externalStudio.fullAddress;
    
    const parts = [
      externalStudio.streetAddress,
      externalStudio.area,
      externalStudio.city,
      externalStudio.postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  static transformContactInfo(externalStudio) {
    return {
      phone: externalStudio.phone || externalStudio.telephone || '',
      email: externalStudio.email || externalStudio.contactEmail || '',
      website: externalStudio.website || externalStudio.url || '',
      instagram: this.formatInstagramHandle(externalStudio.instagram || externalStudio.social?.instagram)
    };
  }

  static transformSpecialties(externalStudio) {
    const specialties = externalStudio.specialties || externalStudio.styles || [];
    
    if (typeof specialties === 'string') {
      return specialties.split(',').map(s => s.trim().toLowerCase());
    }
    
    if (Array.isArray(specialties)) {
      return specialties.map(s => s.toLowerCase());
    }
    
    return ['traditional']; // Default specialty
  }
}
```

### CSV Import Utility

```javascript
class CSVStudioImporter {
  static async importFromCSV(csvFilePath) {
    const fs = require('fs');
    const csv = require('csv-parser');
    const studios = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const transformedStudio = this.transformCSVRow(row);
            studios.push(transformedStudio);
          } catch (error) {
            console.warn(`Skipping invalid row: ${error.message}`);
          }
        })
        .on('end', () => {
          console.log(`Imported ${studios.length} studios from CSV`);
          resolve(studios);
        })
        .on('error', reject);
    });
  }

  static transformCSVRow(row) {
    // Validate required fields
    if (!row.studioName || !row.address || !row.postcode) {
      throw new Error('Missing required fields: studioName, address, postcode');
    }

    return StudioDataTransformer.transformExternalStudio({
      name: row.studioName,
      fullAddress: row.address,
      postcode: row.postcode,
      city: row.city,
      phone: row.phone,
      email: row.email,
      website: row.website,
      instagram: row.instagram,
      established: row.established,
      specialties: row.specialties,
      rating: row.rating,
      reviewCount: row.reviewCount
    });
  }
}
```

## Migration Validation

### Pre-Migration Validation

```bash
# Validate system readiness
npm run health-check

# Check data format
node scripts/migration-utility.js validate-format \
  --file migration-data.json \
  --type studio

# Check for duplicates
node scripts/migration-utility.js check-duplicates \
  --file migration-data.json

# Validate UK postcodes
node scripts/migration-utility.js validate-postcodes \
  --file migration-data.json
```

### Post-Migration Validation

```bash
# Validate studio data integrity
npm run validate-studios data

# Validate relationships
npm run validate-studios relationships

# Validate images
npm run validate-studios images

# Validate cross-service consistency
npm run validate-studios consistency

# Generate migration report
npm run generate-migration-report --detailed
```

### Validation Checklist

#### Data Integrity
- [ ] All required fields present
- [ ] UK postcode format validation
- [ ] Contact information format validation
- [ ] Opening hours format validation
- [ ] Specialty values validation

#### Relationship Integrity
- [ ] Bidirectional artist-studio references
- [ ] No orphaned artists
- [ ] No empty studios
- [ ] Artist count consistency
- [ ] Geographic compatibility

#### System Integration
- [ ] DynamoDB records created
- [ ] OpenSearch indices updated
- [ ] S3 images processed
- [ ] Frontend mock data generated
- [ ] CORS configuration applied

## Rollback Procedures

### Emergency Rollback

If migration fails and system needs to be restored:

```bash
# Stop all services
docker-compose down

# Restore from backup
npm run restore-backup --date YYYYMMDD-HHMMSS

# Restart services
docker-compose up -d localstack

# Validate restoration
npm run health-check
npm run validate-data all
```

### Partial Rollback

To rollback only studio data while preserving artists:

```bash
# Remove studio data
npm run reset-studios --preserve-artists

# Remove studio references from artists
npm run clean-artist-studio-references

# Validate cleanup
npm run validate-data artists
```

### Selective Rollback

To rollback specific studios:

```bash
# Remove specific studios
npm run remove-studios --ids studio-001,studio-002

# Repair relationships
npm run manage-studio-relationships repair

# Validate consistency
npm run validate-studios relationships
```

## Migration Troubleshooting

### Common Issues

#### Issue: "Postcode validation failed"

**Symptoms**: Studios rejected due to invalid UK postcodes

**Solution**:
```bash
# Fix postcodes in import data
node scripts/migration-utility.js fix-postcodes \
  --input migration-data.json \
  --output fixed-migration-data.json

# Re-import with fixed data
npm run import-studio-data --file fixed-migration-data.json
```

#### Issue: "Duplicate studio detection"

**Symptoms**: Import fails due to duplicate studio names/addresses

**Solution**:
```bash
# Identify duplicates
node scripts/migration-utility.js find-duplicates \
  --file migration-data.json

# Remove duplicates
node scripts/migration-utility.js deduplicate \
  --input migration-data.json \
  --output deduplicated-data.json \
  --strategy merge
```

#### Issue: "Artist-studio relationship creation failed"

**Symptoms**: Studios created but no artist relationships

**Solution**:
```bash
# Check artist data availability
npm run data-status

# Rebuild relationships
npm run manage-studio-relationships rebuild

# Validate relationships
npm run validate-studios relationships
```

#### Issue: "Frontend mock data not updating"

**Symptoms**: Studio data in backend but not in frontend mock data

**Solution**:
```bash
# Force frontend data regeneration
npm run setup-data:frontend-only --force

# Validate frontend data
npm run validate-studios frontend

# Check mock data file
cat frontend/src/app/data/mockStudioData.js
```

### Debug Commands

```bash
# Enable debug logging for migration
DEBUG=migration npm run import-studio-data --file data.json

# Check migration state
npm run migration-status

# Validate specific migration step
npm run validate-migration-step --step relationships

# Generate detailed migration log
npm run migration-log --detailed --output migration.log
```

## Performance Considerations

### Large Dataset Migration

For migrations with 100+ studios:

```bash
# Use batch processing
npm run import-studio-data \
  --file large-dataset.json \
  --batch-size 10 \
  --parallel 3

# Monitor memory usage
npm run migration-monitor --watch-memory

# Use incremental processing
npm run import-studio-data \
  --file large-dataset.json \
  --incremental \
  --checkpoint-interval 25
```

### Memory Optimization

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run import-studio-data

# Use streaming for large files
npm run import-studio-data \
  --file large-dataset.json \
  --stream \
  --chunk-size 50
```

## Migration Testing

### Test Migration Process

```bash
# Test with sample data
npm run test-migration --sample-size 5

# Validate test results
npm run validate-test-migration

# Clean up test data
npm run cleanup-test-migration
```

### Migration Test Suite

```javascript
describe('Studio Data Migration', () => {
  describe('Data Import', () => {
    test('imports valid studio data');
    test('rejects invalid studio data');
    test('handles duplicate studios');
    test('validates UK postcodes');
  });

  describe('Relationship Creation', () => {
    test('creates artist-studio relationships');
    test('maintains relationship consistency');
    test('handles orphaned artists');
    test('populates empty studios');
  });

  describe('Data Validation', () => {
    test('validates data integrity');
    test('checks cross-service consistency');
    test('verifies image processing');
    test('confirms frontend integration');
  });
});
```

## Migration Checklist

### Pre-Migration
- [ ] System health check passed
- [ ] Backup created
- [ ] Import data validated
- [ ] Migration plan reviewed
- [ ] Rollback procedure prepared

### During Migration
- [ ] Import process monitored
- [ ] Error logs reviewed
- [ ] Progress tracked
- [ ] Memory usage monitored
- [ ] Intermediate validation performed

### Post-Migration
- [ ] Data integrity validated
- [ ] Relationships verified
- [ ] System functionality tested
- [ ] Performance benchmarked
- [ ] Migration report generated
- [ ] Documentation updated

This comprehensive migration guide ensures successful integration of studio data into the existing system while maintaining data integrity and system performance.