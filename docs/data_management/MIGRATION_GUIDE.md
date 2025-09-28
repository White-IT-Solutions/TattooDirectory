# Migration Guide: Legacy Scripts to Unified Data Management System

This guide helps you migrate from the old scattered script system to the new unified data management system.

## Overview

The new unified system consolidates all data management operations into a single, cohesive interface while maintaining backward compatibility with existing workflows.

## Quick Migration Checklist

- [x] **Backup existing scripts and configuration**
- [x] **Run migration readiness analysis**
- [x] **Test new system with health-check command**
- [x] **Update package.json npm scripts**
- [x] **Update Docker configurations if needed**
- [x] **Update CI/CD pipelines to use new commands**
- [ ] **Train team on new command structure**
- [x] **Run final validation tests**
- [x] **Archive or remove legacy scripts**

## Enhanced Features in New System

### 🆕 Frontend-Sync-Processor Enhancements

The unified system now includes a significantly enhanced frontend-sync-processor with:

- **Comprehensive Business Data**: Realistic ratings, pricing, availability, experience levels
- **Studio Relationships**: Bidirectional artist-studio linking with complete studio information  
- **Enhanced Contact Information**: Email, phone, website, Instagram with privacy controls
- **Style Metadata**: Characteristics, difficulty levels, popular motifs, color palettes
- **Data Structure Alignment**: Proper field alignment with backend API expectations
- **RFC 9457 Error Responses**: Compliant error response generation for testing
- **Data Export/Import**: Save and reuse generated datasets across sessions
- **Performance Testing**: Large datasets for performance and stress testing
- **Enhanced CLI Interface**: Comprehensive command-line options and help system
- **Data Validation**: Built-in validation and consistency checking

### 🔄 Data Structure Improvements

- Added required `bio` field for all artists (was missing in legacy system)
- Moved `latitude`/`longitude` to `tattooStudio.address` structure for consistency
- Renamed `studioInfo` to `tattooStudio` for API alignment
- Standardized `artistName` vs `artistsName` naming across all data
- Added system fields (`pk`, `sk`, `opted_out`) for database consistency

## Command Migration Map

### Legacy → Enhanced System Commands

| Legacy Command                                            | New Command                        | Notes                                  |
| --------------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| `bash scripts/setup-data.sh`                              | `npm run setup-data`               | Full data setup with all services      |
| `bash scripts/reset-data.sh [state]`                      | `npm run reset-data [state]`       | System reset with state options        |
| `bash scripts/seed-scenario.sh <scenario>`                | `npm run seed-scenario <scenario>` | Scenario-based seeding                 |
| `bash scripts/validate-data.sh [type]`                    | `npm run validate-data [type]`     | Data validation and consistency checks |
| `bash scripts/health-check.sh`                            | `npm run health-check`             | Service health monitoring              |
| `bash scripts/data-status.sh`                             | `npm run data-status`              | System status and health               |
| `node scripts/data-management/seed-data.js`               | `npm run setup-data`               | Legacy data seeding (deprecated)       |
| `node scripts/data-management/data-management-wrapper.js` | `npm run setup-data`               | Legacy wrapper script                  |

### New Command Options

#### Setup Data

```bash
# Enhanced setup with comprehensive business data (replaces legacy seed.js)
npm run setup-data

# Enhanced frontend-only setup with business data, ratings, pricing
npm run setup-data:frontend-only

# Enhanced frontend setup with data export and validation
npm run setup-data:frontend-only --export --validate

# Images-only setup
npm run setup-data:images-only

# Force refresh all data with enhanced capabilities
npm run setup-data:force

# Scenario-based setup with enhanced data
npm run setup-data --scenario london-focused --validate
```

#### Reset Data

```bash
# Reset to fresh state (default)
npm run reset-data

# Reset to specific states
npm run reset-data:clean
npm run reset-data:minimal
npm run reset-data:search-ready
npm run reset-data:location-test
npm run reset-data:style-test
npm run reset-data:performance-test
npm run reset-data:frontend-ready
```

#### Enhanced Seed Scenarios

```bash
# Enhanced scenarios with comprehensive business data (replaces selective-seeder.js)
npm run seed-scenario:minimal          # 3 artists with business data
npm run seed-scenario:search-basic     # 5 artists with ratings/pricing
npm run seed-scenario:london-artists   # 5 London artists with studio relationships
npm run seed-scenario:london-focused   # 10 London artists with comprehensive studio data
npm run seed-scenario:high-rated       # 3 artists with 4.5+ ratings
npm run seed-scenario:new-artists      # 4 artists with experience data
npm run seed-scenario:booking-available # 6 artists with availability data
npm run seed-scenario:portfolio-rich   # 4 artists with style metadata
npm run seed-scenario:multi-style      # 3 artists with style characteristics
npm run seed-scenario:style-diverse    # 12 artists with all styles and metadata
npm run seed-scenario:pricing-range    # 5 artists with detailed pricing
npm run seed-scenario:full-dataset     # 10 artists with all enhanced features
npm run seed-scenario:performance-test # 50+ artists for performance testing
```

#### Enhanced Validation

```bash
# Comprehensive validation with enhanced data structure checking
npm run validate-data

# Enhanced validation types
npm run validate-data:consistency        # Cross-service consistency + frontend-sync alignment
npm run validate-data:images            # Image URL accessibility
npm run validate-data:scenarios         # Enhanced scenario data with business data validation
npm run validate-data:frontend          # Frontend mock data structure validation
npm run validate-data:business-data     # Business data validation (ratings, pricing, availability)
npm run validate-data:studio-relationships # Artist-studio relationship validation
```

#### Enhanced Frontend-Sync-Processor

```bash
# Direct access to enhanced frontend-sync-processor
npm run frontend-sync generate --count 10 --scenario normal
npm run frontend-sync scenario london-focused --export
npm run frontend-sync validate
npm run frontend-sync error validation --instance /v1/search
npm run frontend-sync performance --count 50
npm run frontend-sync studios
```

## Migration Process

### Phase 1: Preparation (30 minutes)

1. **Backup existing scripts**

   ```bash
   # Create backup directory
   mkdir -p backups/legacy-scripts-$(date +%Y%m%d)

   # Backup key directories
   cp -r scripts/data-seeder backups/legacy-scripts-$(date +%Y%m%d)/
   cp -r scripts/data-management backups/legacy-scripts-$(date +%Y%m%d)/
   ```

2. **Run migration analysis**

   ```bash
   cd scripts
   # Check if migration utility exists, otherwise use unified system
   if [ -f migration-utility.js ]; then
     node migration-utility.js analyze
   else
     node unified-data-manager.js status
   fi
   ```

3. **Verify new system installation**
   ```bash
   npm run health-check
   ```

### Phase 2: Testing & Validation (1-2 hours)

1. **Test migration compatibility**

   ```bash
   cd scripts
   node migration-utility.js test
   ```

2. **Validate functionality preservation**

   ```bash
   cd scripts
   node comparison-validator.js validate
   ```

3. **Test critical workflows**

   ```bash
   # Test basic setup
   npm run setup-data:frontend-only

   # Test scenario seeding
   npm run seed-scenario:minimal

   # Test reset functionality
   npm run reset-data:clean

   # Test validation
   npm run validate-data
   ```

### Phase 3: Migration Execution (1 hour)

1. **Update package.json scripts**

   Replace legacy scripts with new unified commands:

   ```json
   {
     "scripts": {
       // Remove these legacy scripts
       "data:seed": "bash scripts/data-management.sh seed",
       "data:reset": "bash scripts/data-management.sh reset",

       // These new scripts should already exist
       "setup-data": "node scripts/data-cli.js setup-data",
       "reset-data": "node scripts/data-cli.js reset-data",
       "seed-scenario": "node scripts/data-cli.js seed-scenario"
     }
   }
   ```

2. **Update Docker configurations**

   If your Docker setup calls legacy scripts directly, update them:

   ```dockerfile
   # Old
   RUN node scripts/data-seeder/seed.js

   # New
   RUN npm run setup-data
   ```

3. **Update CI/CD pipelines**

   Replace legacy commands in your CI/CD configuration:

   ```yaml
   # Old
   - run: bash scripts/data-management.sh seed

   # New
   - run: npm run setup-data
   ```

### Phase 4: Cleanup & Verification (30 minutes)

1. **Run final validation**

   ```bash
   cd scripts
   node migration-utility.js full
   ```

2. **Archive legacy scripts**

   ```bash
   # Move legacy scripts to archive
   mkdir -p archive/legacy-scripts

   # Archive shell script wrappers
   mv scripts/*.sh scripts/*.bat archive/legacy-scripts/ 2>/dev/null || true

   # Archive legacy data-management scripts
   mv scripts/data-management/data-management-legacy.* archive/legacy-scripts/
   mv scripts/data-management/data-management.sh archive/legacy-scripts/
   mv scripts/data-management/data-management.bat archive/legacy-scripts/
   mv scripts/data-management/run-seeder.* archive/legacy-scripts/
   mv scripts/data-management/setup-test-data.* archive/legacy-scripts/
   mv scripts/data-management/seed-data.js archive/legacy-scripts/
   mv scripts/data-management/update-test-data.js archive/legacy-scripts/
   ```

3. **Update documentation**
   - Update README files
   - Update team documentation
   - Update onboarding guides

## Safe Removal List

After successful migration, these files can be safely removed:

### Shell Script Wrappers (Safe to Remove)

```bash
# All these just call data-cli.js
rm scripts/setup-data.sh scripts/setup-data.bat
rm scripts/reset-data.sh scripts/reset-data.bat
rm scripts/seed-scenario.sh scripts/seed-scenario.bat
rm scripts/validate-data.sh scripts/validate-data.bat
rm scripts/health-check.sh scripts/health-check.bat
rm scripts/data-status.sh scripts/data-status.bat
rm scripts/help.sh scripts/help.bat
```

### Legacy Data Management Scripts (Safe to Remove)

```bash
# Deprecated legacy scripts
rm scripts/data-management/data-management-legacy.sh
rm scripts/data-management/data-management-legacy.bat
rm scripts/data-management/data-management.sh
rm scripts/data-management/data-management.bat
rm scripts/data-management/run-seeder.sh
rm scripts/data-management/run-seeder.bat
rm scripts/data-management/setup-test-data.sh
rm scripts/data-management/setup-test-data.bat
rm scripts/data-management/seed-data.js
rm scripts/data-management/setup-test-data.js
rm scripts/data-management/update-test-data.js
```

### Review Before Removing

```bash
# Check if still needed for Docker integration
scripts/data-management/data-management-wrapper.js
scripts/state-tracker.js  # May be superseded by state-manager.js
scripts/seed-opensearch.mjs  # Check if handled by unified system
```

## Backward Compatibility

The system maintains backward compatibility through wrapper scripts:

### Automatic Deprecation Warnings

When legacy scripts are called, you'll see deprecation warnings:

```
⚠️  DEPRECATION WARNING
═══════════════════════
The command/script "scripts/data-seeder/seed.js" is deprecated.
Please use "npm run setup-data" instead.

📋 Migration Info: The new system provides better error handling and incremental processing

🔗 For full migration guide, see: docs/MIGRATION_GUIDE.md
```

### Legacy Script Wrappers

Legacy scripts are automatically redirected to the new system:

- `scripts/setup-data.sh/.bat` → `node data-cli.js setup-data`
- `scripts/reset-data.sh/.bat` → `node data-cli.js reset-data`
- `scripts/seed-scenario.sh/.bat` → `node data-cli.js seed-scenario`
- `scripts/validate-data.sh/.bat` → `node data-cli.js validate-data`
- `scripts/health-check.sh/.bat` → `node data-cli.js health-check`
- `scripts/data-status.sh/.bat` → `node data-cli.js data-status`
- `scripts/data-management/seed-data.js` → `npm run setup-data`
- `scripts/data-management/data-management-wrapper.js` → unified system

## Docker Integration

### Container Environment Detection

The system automatically detects Docker environments and adjusts configuration:

```javascript
// Automatic endpoint adjustment
const isDockerEnvironment =
  process.env.DOCKER_CONTAINER === "true" || fs.existsSync("/.dockerenv");

if (isDockerEnvironment) {
  // Use container-to-container networking
  config.services.localstack = "http://localstack:4566";
} else {
  // Use host-to-container networking
  config.services.localstack = "http://localhost:4566";
}
```

### Docker Compatibility Testing

Test Docker integration with the new system:

```bash
cd scripts
node docker-compatibility.js validate-docker
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**

   - Ensure you're in the correct directory
   - Run `npm install` in the scripts workspace
   - Check that all dependencies are installed

2. **Service connection failures**

   - Verify LocalStack is running
   - Check Docker container networking
   - Run `npm run health-check` for diagnostics

3. **Legacy scripts still being called**
   - Check CI/CD configurations
   - Search codebase for direct script calls
   - Update Docker configurations

4. **Enhanced frontend-sync-processor issues**

   - Missing business data in generated mock data
   - Studio relationship data not linking properly
   - Data structure misalignment (bio field, tattooStudio format)
   - Export/import functionality not working

5. **Data validation failures**

   - Enhanced data structure validation errors
   - Business data consistency issues
   - Studio relationship validation failures
   - RFC 9457 error response format issues

### Getting Help

1. **Run migration analysis**

   ```bash
   cd scripts
   node migration-utility.js analyze
   ```

2. **Generate migration report**

   ```bash
   cd scripts
   node migration-utility.js full
   ```

3. **Check system health with enhanced validation**
   ```bash
   npm run health-check
   npm run validate-data:business-data
   npm run validate-data:studio-relationships
   ```

4. **Test enhanced frontend-sync-processor**

   ```bash
   # Test enhanced data generation
   npm run frontend-sync generate --count 3 --scenario normal --validate
   
   # Test specific business data features
   npm run frontend-sync scenario high-rated --export
   
   # Validate enhanced data structure
   npm run frontend-sync validate
   ```

5. **Debug enhanced features**

   ```bash
   # Enable debug mode for enhanced processor
   DEBUG=frontend-sync npm run setup-data:frontend-only
   
   # Test CLI interface
   npm run frontend-sync --help
   
   # Validate data export functionality
   npm run frontend-sync list-exports
   ```

## Advanced Features

### Custom Migration Scripts

Create custom migration scripts for project-specific needs:

```javascript
const { MigrationUtility } = require("./scripts/migration-utility");

async function customMigration() {
  const migration = new MigrationUtility();

  // Run custom analysis
  const analysis = await migration.analyzeMigrationReadiness();

  // Custom migration logic here

  return analysis;
}
```

### Validation Customization

Extend the comparison validator for project-specific validation:

```javascript
const { ComparisonValidator } = require("./scripts/comparison-validator");

class CustomValidator extends ComparisonValidator {
  async validateCustomLogic() {
    // Custom validation logic
    return {
      name: "Custom Validation",
      status: "passed",
      details: { customCheck: true },
    };
  }
}
```

## Enhanced Workflow Examples

### Enhanced Feature Development

```bash
# 1. Reset to clean state for your feature
npm run reset-data:clean

# 2. Seed appropriate enhanced test scenario with business data
npm run seed-scenario:search-basic     # for search features with ratings/pricing
npm run seed-scenario:london-focused   # for location features with studio data
npm run seed-scenario:style-diverse    # for style filtering with metadata
npm run seed-scenario:booking-available # for booking features with availability

# 3. Use enhanced frontend-only development
npm run setup-data:frontend-only --scenario high-rated --export

# 4. Develop your feature with realistic business data...

# 5. Validate enhanced data integrity
npm run validate-data:business-data
npm run validate-data:studio-relationships

# 6. Test with different enhanced scenarios as needed
npm run seed-scenario:performance-test  # for performance testing
npm run frontend-sync scenario style-diverse --export  # for comprehensive testing
```

### Enhanced Testing Workflows

```bash
# Unit testing with business data
npm run seed-scenario:minimal
npm run test --workspace=backend

# Integration testing with comprehensive data
npm run seed-scenario:full-dataset
npm run test:integration

# Performance testing with large datasets
npm run seed-scenario:performance-test
npm run test:performance

# Frontend testing with enhanced mock data
npm run setup-data:frontend-only --scenario style-diverse --validate
npm run test --workspace=frontend
```

### Enhanced Data Export/Reuse Workflow

```bash
# Generate and export data for team sharing
npm run frontend-sync scenario london-focused --export --validate

# List available exported datasets
npm run frontend-sync list-exports

# Import shared dataset
npm run frontend-sync import scripts/data-exports/london-focused-20240115.json

# Validate imported data
npm run frontend-sync validate-consistency
```

## Benefits of Migration

### Improved Reliability

- Unified error handling with RFC 9457 compliant responses
- Better service connectivity management
- Comprehensive health monitoring with business data validation
- Automatic retry mechanisms with enhanced error recovery

### Enhanced Developer Experience

- Single command interface with comprehensive CLI options
- Clear command structure with enhanced help system
- Comprehensive business data for realistic development
- Better logging and debugging with performance metrics

### Better Maintainability

- Centralized configuration with enhanced options
- Modular architecture with business data separation
- Comprehensive testing with enhanced validation
- Clear documentation with migration guides

### Performance Improvements

- Incremental processing with enhanced change detection
- Better caching with data export/import functionality
- Optimized service calls with batch processing
- Reduced redundancy with smart data generation

### Enhanced Data Quality

- **Realistic Business Data**: Ratings, pricing, availability, experience levels
- **Complete Studio Information**: Bidirectional relationships, contact details, opening hours
- **Enhanced Style Metadata**: Characteristics, difficulty levels, popular motifs
- **Data Structure Alignment**: Proper field alignment with backend API expectations
- **Comprehensive Validation**: Built-in data consistency and structure checking

## Post-Migration

### Monitoring

Monitor the new system after migration:

```bash
# Continuous health monitoring
npm run monitor:health-continuous

# Performance monitoring
npm run performance:monitor

# System status checks
npm run data-status
```

### Team Training

Ensure your team is familiar with the new commands:

- Share this migration guide
- Update development documentation
- Conduct training sessions on new command structure
- Update onboarding processes

### Feedback and Improvements

The new system is designed to be extensible. Provide feedback on:

- Missing functionality
- Performance issues
- Usability improvements
- Additional features needed

## Conclusion

The migration to the unified data management system provides significant benefits in terms of reliability, maintainability, and developer experience. The backward compatibility layer ensures a smooth transition while the new system provides enhanced capabilities for future development.

For questions or issues during migration, refer to the troubleshooting section or run the migration analysis tools provided.