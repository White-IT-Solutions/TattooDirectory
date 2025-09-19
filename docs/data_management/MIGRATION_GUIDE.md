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

## Command Migration Map

### Legacy → New System Commands

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
# Basic setup (replaces legacy seed.js)
npm run setup-data

# Frontend-only setup
npm run setup-data:frontend-only

# Images-only setup
npm run setup-data:images-only

# Force refresh all data
npm run setup-data:force
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

#### Seed Scenarios

```bash
# Available scenarios (replaces selective-seeder.js)
npm run seed-scenario:minimal
npm run seed-scenario:search-basic
npm run seed-scenario:london-artists
npm run seed-scenario:high-rated
npm run seed-scenario:new-artists
npm run seed-scenario:booking-available
npm run seed-scenario:portfolio-rich
npm run seed-scenario:multi-style
npm run seed-scenario:pricing-range
npm run seed-scenario:full-dataset
```

#### Validation

```bash
# Comprehensive validation
npm run validate-data

# Specific validation types
npm run validate-data:consistency
npm run validate-data:images
npm run validate-data:scenarios
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

3. **Check system health**
   ```bash
   npm run health-check
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

## Benefits of Migration

### Improved Reliability

- Unified error handling
- Better service connectivity management
- Comprehensive health monitoring
- Automatic retry mechanisms

### Enhanced Developer Experience

- Single command interface
- Clear command structure
- Comprehensive help system
- Better logging and debugging

### Better Maintainability

- Centralized configuration
- Modular architecture
- Comprehensive testing
- Clear documentation

### Performance Improvements

- Incremental processing
- Better caching
- Optimized service calls
- Reduced redundancy

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
