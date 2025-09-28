# Data Management and Reset Utilities

This document describes the comprehensive data management utilities for the Tattoo Directory local testing environment. These tools provide data reset functionality, import/export capabilities, backup/restore features, selective seeding, and data validation.

## Quick Start

```bash
# Reset to fresh state with full data
npm run data:reset fresh

# Seed specific test scenario
npm run data:seed search-basic

# Validate all data
npm run data:validate all

# Create backup
npm run data:backup my-backup

# Check current status
npm run data:status
```

## Overview

The data management system consists of several utilities that work together to provide complete control over test data:

- **Data Manager**: Import/export and backup/restore operations
- **Selective Seeder**: Scenario-based data seeding for specific test cases
- **Data Validator**: Comprehensive data validation and consistency checking
- **Data Reset**: Clean state management and quick environment resets
- **Data Migration Utility**: Schema migrations and data transformations
- **Data Monitoring Utility**: Real-time monitoring and health checks
- **Data Sync Utility**: Advanced synchronization between services

## Utilities

### 1. Data Manager (`data-manager.js`)

Handles data import/export and backup/restore operations.

#### Features
- Export data from LocalStack to local files
- Import data from local files to LocalStack
- Create compressed backups in S3
- Restore from S3 backups
- List available backups

#### Usage

```bash
# Export current data
node data-manager.js export [path]

# Import data from export
node data-manager.js import <path>

# Create backup
node data-manager.js backup [name]

# Restore from backup
node data-manager.js restore <backup-key>

# List available backups
node data-manager.js list-backups
```

#### Examples

```bash
# Export to default location
node data-manager.js export

# Export to specific directory
node data-manager.js export ./my-exports

# Import from specific export
node data-manager.js import ./exports/export-2024-01-15T10-30-00-000Z

# Create named backup
node data-manager.js backup "before-performance-test"

# Restore from backup
node data-manager.js restore "backup-2024-01-15T10-30-00-000Z"
```

### 2. Selective Seeder (`selective-seeder.js`)

Provides scenario-based data seeding for specific test cases.

#### Available Scenarios

| Scenario | Description | Use Case |
|----------|-------------|----------|
| `search-basic` | Basic search functionality testing | API endpoint testing |
| `location-london` | London-based artists | Location filtering tests |
| `style-traditional` | Traditional style artists | Style filtering tests |
| `high-rating` | High-rated artists | Rating/quality tests |
| `new-artists` | Recently joined artists | Timeline tests |
| `booking-available` | Artists with open booking | Availability tests |
| `portfolio-rich` | Artists with extensive portfolios | Image/portfolio tests |
| `multi-style` | Artists with multiple styles | Complex filtering tests |
| `pricing-range` | Artists with varied pricing | Price filtering tests |
| `minimal` | Minimal dataset | Quick testing |

#### Usage

```bash
# List available scenarios
node selective-seeder.js list

# Seed specific scenario
node selective-seeder.js seed <scenario-name>
```

#### Examples

```bash
# List all scenarios
node selective-seeder.js list

# Seed basic search test data
node selective-seeder.js seed search-basic

# Seed London location test data
node selective-seeder.js seed location-london

# Seed minimal dataset for quick tests
node selective-seeder.js seed minimal
```

### 3. Data Validator (`data-validator.js`)

Comprehensive data validation and consistency checking.

#### Features
- Validate test data files against schema
- Validate database data integrity
- Validate OpenSearch data consistency
- Check data consistency between DynamoDB and OpenSearch
- Business rule validation
- Detailed error reporting

#### Usage

```bash
# Validate test data files
node data-validator.js files

# Validate database data
node data-validator.js database

# Validate OpenSearch data
node data-validator.js opensearch

# Check data consistency
node data-validator.js consistency

# Run all validations
node data-validator.js all
```

#### Validation Rules

**Artist Validation:**
- Required fields: artistId, artistName, instagramHandle, styles, locationDisplay, geohash
- Data types and ranges validation
- Portfolio image URL validation
- Rating/review consistency checks
- Geographic coordinate validation

**Studio Validation:**
- Required fields: studioId, studioName, address, postcode, geohash
- UK postcode format validation
- Address format checks
- Specialty validation

**Style Validation:**
- Required fields: styleId, styleName, description
- Difficulty level validation
- Popularity range checks

### 4. Data Reset (`data-reset.js`)

Quick environment resets and clean state management.

#### Available Reset States

| State | Description | Actions |
|-------|-------------|---------|
| `clean` | Complete clean state - no data | Clear all services |
| `fresh` | Fresh start with full test dataset | Clear all + seed full |
| `minimal` | Minimal dataset for quick testing | Clear + seed minimal |
| `search-ready` | Dataset optimized for search testing | Clear + seed search scenario |
| `location-test` | London-focused dataset | Clear + seed London data |
| `style-test` | Traditional style focused dataset | Clear + seed traditional styles |
| `performance-test` | Large dataset for performance testing | Clear + seed + duplicate 5x |
| `backup-restore` | Reset to last backup state | Clear + restore latest backup |

#### Usage

```bash
# List available reset states
node data-reset.js list

# Reset to specific state
node data-reset.js reset <state>

# Create snapshot
node data-reset.js snapshot <name>

# Restore from snapshot
node data-reset.js restore <snapshot>

# Validate current state
node data-reset.js validate

# Clear specific data
node data-reset.js clear [type]
```

#### Examples

```bash
# Reset to fresh state with full data
node data-reset.js reset fresh

# Reset to minimal state for quick testing
node data-reset.js reset minimal

# Create snapshot before testing
node data-reset.js snapshot "before-integration-tests"

# Restore from snapshot
node data-reset.js restore "before-integration-tests"

# Clear only DynamoDB data
node data-reset.js clear dynamodb

# Validate current environment state
node data-reset.js validate
```

## Integration with Docker Compose

### Environment Variables

```yaml
# docker-compose.local.yml
data-seeder:
  environment:
    - AWS_ENDPOINT_URL=http://localstack:4566
    - AWS_ACCESS_KEY_ID=test
    - AWS_SECRET_ACCESS_KEY=test
    - AWS_DEFAULT_REGION=eu-west-2
    - DYNAMODB_TABLE_NAME=tattoo-directory-local
    - OPENSEARCH_INDEX=artists-local
    - BACKUP_BUCKET=tattoo-directory-backups
```

### Docker Commands

```bash
# Run data management commands in container
docker-compose -f docker-compose.local.yml run --rm data-seeder npm run reset -- reset fresh

# Export data from container
docker-compose -f docker-compose.local.yml run --rm data-seeder npm run manage -- export

# Validate data in container
docker-compose -f docker-compose.local.yml run --rm data-seeder npm run validate-enhanced -- all
```

## Workflow Examples

### Development Workflow

```bash
# 1. Start with clean environment
node data-reset.js reset clean

# 2. Seed specific test scenario
node selective-seeder.js seed search-basic

# 3. Validate data
node data-validator.js all

# 4. Run tests...

# 5. Reset for next test
node data-reset.js reset minimal
```

### Testing Workflow

```bash
# 1. Create snapshot before tests
node data-reset.js snapshot "before-test-suite"

# 2. Run tests that modify data...

# 3. Restore clean state
node data-reset.js restore "before-test-suite"

# 4. Validate restoration
node data-validator.js consistency
```

### Performance Testing Workflow

```bash
# 1. Reset to performance test state
node data-reset.js reset performance-test

# 2. Validate large dataset
node data-validator.js database

# 3. Run performance tests...

# 4. Export results for analysis
node data-manager.js export ./performance-results
```

### Backup and Recovery Workflow

```bash
# 1. Create regular backup
node data-manager.js backup "daily-backup-$(date +%Y%m%d)"

# 2. List available backups
node data-manager.js list-backups

# 3. Restore from specific backup if needed
node data-manager.js restore "backup-20240115T103000000Z"
```

## Error Handling and Troubleshooting

### Common Issues

1. **LocalStack Connection Issues**
   - Ensure LocalStack is running and healthy
   - Check endpoint configuration (container vs host)
   - Verify AWS credentials are set to 'test'

2. **Data Validation Failures**
   - Check test data files for schema compliance
   - Verify required fields are present
   - Ensure data types match expectations

3. **Backup/Restore Issues**
   - Ensure S3 bucket exists and is accessible
   - Check available disk space for exports
   - Verify backup file integrity

### Debug Mode

Enable debug logging by setting environment variable:

```bash
export DEBUG=1
node data-manager.js export
```

### Health Checks

```bash
# Check service connectivity
node data-validator.js consistency

# Validate current state
node data-reset.js validate

# Test basic operations
node selective-seeder.js seed minimal
node data-validator.js all
```

## Best Practices

1. **Always validate after operations**
   ```bash
   node data-reset.js reset fresh
   node data-validator.js all
   ```

2. **Create snapshots before major changes**
   ```bash
   node data-reset.js snapshot "before-major-test"
   ```

3. **Use appropriate scenarios for testing**
   - Use `minimal` for quick unit tests
   - Use `search-basic` for API testing
   - Use `performance-test` for load testing

4. **Regular backups**
   ```bash
   node data-manager.js backup "daily-$(date +%Y%m%d)"
   ```

5. **Consistency checks**
   ```bash
   node data-validator.js consistency
   ```

## Performance Considerations

- **Export/Import**: Large datasets may take several minutes
- **Backup/Restore**: Compressed backups are more efficient
- **Validation**: Full validation can be time-consuming on large datasets
- **Reset Operations**: Clean resets are faster than selective operations

### 5. Data Migration Utility (`data-migration-utility.js`)

Provides advanced data migration and transformation capabilities for upgrading test data schemas.

#### Features
- Schema migrations with version tracking
- Data transformation and normalization
- Rollback capabilities
- Migration validation and reporting

#### Usage

```bash
# List available migrations
node data-migration-utility.js list

# Run specific migration
node data-migration-utility.js run <migration-name>

# Run all migrations
node data-migration-utility.js run-all

# Validate migration results
node data-migration-utility.js validate

# Rollback migration
node data-migration-utility.js rollback <migration-name>
```

#### Available Migrations

| Migration | Description | Version |
|-----------|-------------|---------|
| `add-missing-fields` | Add missing fields to existing artist records | 1.1.0 |
| `normalize-locations` | Normalize location display formats | 1.2.0 |
| `update-portfolio-structure` | Update portfolio image structure with metadata | 1.3.0 |
| `add-social-media` | Add social media links structure | 1.4.0 |

### 6. Data Monitoring Utility (`data-monitoring-utility.js`)

Provides real-time monitoring and alerting for data management operations.

#### Features
- Real-time health monitoring
- Performance metrics tracking
- Alert system with severity levels
- Monitoring reports and dashboards

#### Usage

```bash
# Run single health check
node data-monitoring-utility.js check

# Start continuous monitoring
node data-monitoring-utility.js monitor [interval]

# Generate monitoring report
node data-monitoring-utility.js report

# List alerts
node data-monitoring-utility.js alerts [severity]

# Clear alerts
node data-monitoring-utility.js clear-alerts

# Test alert system
node data-monitoring-utility.js test-alerts
```

#### Monitoring Metrics

- **DynamoDB Health**: Response times, item counts, error rates
- **OpenSearch Health**: Response times, document counts, error rates
- **Data Consistency**: Inconsistency detection and reporting
- **Performance Tracking**: Response time thresholds and alerts

### 7. Data Sync Utility (`data-sync-utility.js`)

Provides advanced data synchronization capabilities between different services.

#### Features
- Bidirectional sync between DynamoDB and OpenSearch
- Conflict detection and resolution
- Sync point creation and validation
- Multiple conflict resolution strategies

#### Usage

```bash
# Sync DynamoDB to OpenSearch
node data-sync-utility.js dynamo-to-os

# Sync OpenSearch to DynamoDB
node data-sync-utility.js os-to-dynamo

# Detect data conflicts
node data-sync-utility.js detect-conflicts

# Resolve conflicts with strategy
node data-sync-utility.js resolve-conflicts [strategy]

# Create sync point
node data-sync-utility.js sync-point <name>

# Validate sync point
node data-sync-utility.js validate-sync-point <file>
```

#### Conflict Resolution Strategies

- **latest** (default): Use most recently updated data
- **dynamo_wins**: DynamoDB data takes precedence
- **opensearch_wins**: OpenSearch data takes precedence

## Integration Testing

### 8. Integration Test (`integration-test.js`)

Comprehensive test suite that validates all utilities work together correctly.

#### Features
- Test all utility help commands
- Validate module loading and dependencies
- Test error handling and edge cases
- Cross-utility integration validation
- Configuration and environment validation

#### Usage

```bash
# Run comprehensive integration test
node integration-test.js
```

#### Test Categories

1. **Utility Help Tests**: Verify all utilities show proper help
2. **List Commands**: Test scenario and state listing
3. **Validation Commands**: Test data validation capabilities
4. **Module Integration**: Verify utilities can load each other
5. **Configuration**: Test environment variable handling
6. **Error Handling**: Validate proper error responses

## Security Notes

- All operations use LocalStack test credentials
- Backups are stored in LocalStack S3 (not real AWS)
- No production data should be used with these utilities
- Test data contains no sensitive information

## Contributing

When adding new scenarios or validation rules:

1. Update the appropriate configuration objects
2. Add comprehensive error handling
3. Include usage examples in this documentation
4. Test with both container and host environments
5. Ensure cross-platform compatibility
6. Run integration tests to verify compatibility