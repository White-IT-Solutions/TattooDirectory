# Data Management Workflow

## Overview

This document establishes a consistent workflow for data management operations to prevent data inconsistency issues between DynamoDB and OpenSearch.

## Root Cause Analysis

The data consistency issue occurred because:

1. **Partial Seeding**: The `seed-scenario:full-dataset` command was only partially populating DynamoDB while fully populating OpenSearch
2. **Incremental Processing**: The system was using incremental processing which could skip DynamoDB updates
3. **Service Synchronization**: DynamoDB and OpenSearch were not being synchronized properly during scenario seeding

## Consistent Workflow

### Starting from Clean State

When starting from no data, no indexes, no uploads, no buckets:

```bash
# 1. Reset infrastructure (if needed)
npm run local:reset

# 2. Start services
npm run local:start

# 3. Clear all existing data
npm run reset-data:clean

# 4. Setup base infrastructure and data
npm run setup-data

# 5. Seed specific scenarios (optional)
npm run seed-scenario:full-dataset
```

### Daily Development Workflow

For regular development work:

```bash
# 1. Check current status
npm run data-status

# 2. If data is inconsistent, reset and reseed
npm run reset-data:clean
npm run seed-scenario:full-dataset

# 3. For specific testing scenarios
npm run seed-scenario:minimal
npm run seed-scenario:london-artists
npm run seed-scenario:high-rated
```

### Command Hierarchy

#### Primary Commands (Use These)

1. **`npm run setup-data`** - Initial setup with base data
   - Creates S3 bucket if missing
   - Seeds DynamoDB and OpenSearch with test data
   - Generates frontend mock data
   - Uses incremental processing by default

2. **`npm run reset-data:clean`** - Clear all data, keep services running
   - Empties DynamoDB tables
   - Clears OpenSearch indices
   - Does NOT restart services
   - Fastest way to get clean state

3. **`npm run seed-scenario:full-dataset`** - Load complete test dataset
   - 150 artists + 50 studios + 23 styles
   - Ensures data consistency between DynamoDB and OpenSearch
   - Updates frontend mock data
   - Recommended for comprehensive testing

#### Secondary Commands (Specific Use Cases)

4. **`npm run setup-data:images-only`** - Process images WITHOUT clearing DB
   - Only processes and uploads images to S3
   - Does not modify DynamoDB or OpenSearch
   - Use when you only need to update images

5. **`npm run setup-data:frontend-only`** - Generate mock data without AWS services
   - Creates enhanced frontend mock data
   - No AWS service dependencies
   - Use for frontend-only development

6. **`npm run data-status`** - Check current data state
   - Shows counts for all services
   - Validates data consistency
   - Use to diagnose issues

## Data Consistency Rules

### Expected Data Counts

After `seed-scenario:full-dataset`:
- **DynamoDB**: 223 items (150 artists + 50 studios + 23 styles)
- **OpenSearch**: 200 documents (150 artists + 50 studios)
- **S3**: 1000+ objects (images and assets)

### Consistency Validation

The system automatically validates:
- Artist counts match between DynamoDB and OpenSearch
- Studio counts match between DynamoDB and OpenSearch
- All artists have required portfolio images
- Artist-studio relationships are bidirectional
- Frontend mock data matches backend data

### Troubleshooting Inconsistencies

If `npm run data-status` shows inconsistent data:

```bash
# Quick fix - reset and reseed
npm run reset-data:clean
npm run seed-scenario:full-dataset

# Verify fix
npm run data-status
```

## Scenario Descriptions

### Core Scenarios

- **`minimal`** - 3 artists, 2 studios (quick testing)
- **`search-basic`** - 5 artists, 3 studios (basic search testing)
- **`london-artists`** - London-focused artists (location testing)
- **`high-rated`** - High-rated artists 4.5+ stars (quality testing)
- **`full-dataset`** - 150 artists, 50 studios (comprehensive testing)

### Specialized Scenarios

- **`booking-available`** - Artists with open booking slots
- **`portfolio-rich`** - Artists with extensive portfolios (8+ images)
- **`multi-style`** - Artists with multiple style specializations
- **`pricing-range`** - Various pricing levels for filtering tests
- **`performance-test`** - Large dataset for performance testing

## Best Practices

### Before Starting Development

1. Always check data status first: `npm run data-status`
2. If inconsistent, reset and reseed: `npm run reset-data:clean && npm run seed-scenario:full-dataset`
3. Verify services are healthy before proceeding

### During Development

1. Use specific scenarios for targeted testing
2. Don't mix different scenarios without resetting first
3. Check data status if APIs return unexpected results
4. Use `setup-data:images-only` when only updating images

### After Major Changes

1. Run `npm run data-status` to verify consistency
2. If data is corrupted, use `npm run reset-data:clean`
3. Reseed with appropriate scenario for your testing needs

## Command Reference Quick Guide

```bash
# Infrastructure Management
npm run local:start          # Start all services
npm run local:stop           # Stop all services  
npm run local:reset          # Full infrastructure reset

# Data Management
npm run reset-data:clean     # Clear data, keep services
npm run setup-data           # Initial setup with base data
npm run seed-scenario:full-dataset  # Load complete dataset

# Status and Validation
npm run data-status          # Check current state
npm run validate-data        # Validate data integrity
npm run health-check         # Check service health

# Specialized Operations
npm run setup-data:images-only      # Images only
npm run setup-data:frontend-only    # Frontend mock data only
npm run seed-scenario:minimal       # Minimal test data
```

## Error Recovery

### Common Issues and Solutions

1. **Data Inconsistency**
   ```bash
   npm run reset-data:clean
   npm run seed-scenario:full-dataset
   ```

2. **Services Not Responding**
   ```bash
   npm run local:restart
   npm run health-check
   ```

3. **Corrupted Data**
   ```bash
   npm run local:reset
   npm run setup-data
   ```

4. **Missing Images**
   ```bash
   npm run setup-data:images-only
   ```

## Workflow Validation

After following this workflow, you should see:

- ✅ All services healthy
- ✅ Data counts consistent
- ✅ Image accessibility > 80%
- ✅ Studio validation 100%
- ✅ Scenario integrity 100%

This workflow ensures reliable, consistent data management across all development scenarios.