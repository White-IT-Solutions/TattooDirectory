#!/usr/bin/env node

/**
 * Backward Compatibility Layer
 * 
 * Provides wrapper functions that map old script functionality to the new unified system.
 * Maintains compatibility with existing workflows while providing deprecation warnings
 * and migration guidance.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { DATA_CONFIG } = require('./data-config');
const path = require('path');
const fs = require('fs');

/**
 * Backward compatibility wrapper class
 */
class BackwardCompatibilityLayer {
  constructor() {
    this.manager = new UnifiedDataManager();
    this.deprecationWarnings = new Set();
  }

  /**
   * Show deprecation warning with migration guidance
   */
  showDeprecationWarning(oldCommand, newCommand, additionalInfo = '') {
    const warningKey = `${oldCommand}->${newCommand}`;
    
    if (!this.deprecationWarnings.has(warningKey)) {
      console.log('\n⚠️  DEPRECATION WARNING');
      console.log('═══════════════════════');
      console.log(`The command/script "${oldCommand}" is deprecated.`);
      console.log(`Please use "${newCommand}" instead.`);
      
      if (additionalInfo) {
        console.log(`\n📋 Migration Info: ${additionalInfo}`);
      }
      
      console.log('\n🔗 For full migration guide, see: docs/MIGRATION_GUIDE.md');
      console.log('───────────────────────────────────────────────────────\n');
      
      this.deprecationWarnings.add(warningKey);
    }
  }

  /**
   * Legacy seed.js compatibility
   */
  async legacySeed(options = {}) {
    this.showDeprecationWarning(
      'scripts/data-seeder/seed.js',
      'npm run setup-data',
      'The new system provides better error handling and incremental processing'
    );

    try {
      return await this.manager.setupData({
        force: options.force || false,
        frontendOnly: false
      });
    } catch (error) {
      console.error('❌ Legacy seed operation failed:', error.message);
      throw error;
    }
  }

  /**
   * Legacy selective-seeder.js compatibility
   */
  async legacySelectiveSeeder(scenario) {
    this.showDeprecationWarning(
      'scripts/data-seeder/selective-seeder.js',
      `npm run seed --workspace=scripts --workspace=scripts-scenario ${scenario}`,
      'The new system supports all existing scenarios with better validation'
    );

    try {
      return await this.manager.seedScenario(scenario);
    } catch (error) {
      console.error('❌ Legacy selective seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Legacy data-management scripts compatibility
   */
  async legacyDataManagement(action, options = {}) {
    const actionMap = {
      'seed': 'setup-data',
      'reset': 'reset-data',
      'validate': 'validate-data',
      'status': 'data-status',
      'export': 'Not yet implemented in new system',
      'import': 'Not yet implemented in new system',
      'backup': 'Not yet implemented in new system',
      'restore': 'Not yet implemented in new system'
    };

    const newCommand = actionMap[action];
    
    if (!newCommand) {
      throw new Error(`Unknown legacy action: ${action}`);
    }

    if (newCommand.startsWith('Not yet implemented')) {
      console.log(`\n⚠️  Feature "${action}" is not yet implemented in the new system.`);
      console.log('Please continue using the legacy scripts for now.');
      console.log('This feature will be added in a future update.\n');
      return;
    }

    this.showDeprecationWarning(
      `scripts/data-management.sh ${action}`,
      `npm run ${newCommand}`,
      'The new system provides unified command interface with better error handling'
    );

    switch (action) {
      case 'seed':
        return await this.manager.setupData(options);
      case 'reset':
        return await this.manager.resetData(options.state || 'fresh');
      case 'validate':
        return await this.manager.validateData(options.type || 'all');
      case 'status':
        return await this.manager.getDataStatus();
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Legacy image processing compatibility
   */
  async legacyImageProcessing(options = {}) {
    this.showDeprecationWarning(
      'Direct image processing scripts',
      'npm run setup-data --images-only',
      'The new system provides incremental image processing and better S3 integration'
    );

    try {
      return await this.manager.setupData({
        imagesOnly: true,
        force: options.force || false
      });
    } catch (error) {
      console.error('❌ Legacy image processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Legacy health check compatibility
   */
  async legacyHealthCheck() {
    this.showDeprecationWarning(
      'scripts/data-seeder/health-check.js',
      'npm run health-check',
      'The new system provides comprehensive health monitoring with detailed reporting'
    );

    try {
      return await this.manager.healthCheck();
    } catch (error) {
      console.error('❌ Legacy health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Legacy validation compatibility
   */
  async legacyValidation(type = 'all') {
    this.showDeprecationWarning(
      'scripts/data-seeder/validate-data.js',
      'npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis-data',
      'The new system provides enhanced validation with cross-service consistency checks'
    );

    try {
      return await this.manager.validateData(type);
    } catch (error) {
      console.error('❌ Legacy validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if legacy script exists and provide migration guidance
   */
  checkLegacyScript(scriptPath) {
    const fullPath = path.resolve(scriptPath);
    
    if (fs.existsSync(fullPath)) {
      const relativePath = path.relative(process.cwd(), fullPath);
      console.log(`\n📁 Legacy script found: ${relativePath}`);
      
      // Provide specific migration guidance based on script name
      if (scriptPath.includes('seed.js')) {
        console.log('   → Migrate to: npm run setup-data');
      } else if (scriptPath.includes('selective-seeder.js')) {
        console.log('   → Migrate to: npm run seed --workspace=scripts --workspace=scripts-scenario <scenario-name>');
      } else if (scriptPath.includes('health-check.js')) {
        console.log('   → Migrate to: npm run health-check');
      } else if (scriptPath.includes('validate-data.js')) {
        console.log('   → Migrate to: npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis-data');
      } else {
        console.log('   → Check docs/MIGRATION_GUIDE.md for migration instructions');
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Generate migration report for existing project
   */
  generateMigrationReport() {
    console.log('\n🔍 MIGRATION ANALYSIS REPORT');
    console.log('═══════════════════════════════');
    
    const legacyScripts = [
      'scripts/data-seeder/seed.js',
      'scripts/data-seeder/selective-seeder.js',
      'scripts/data-seeder/health-check.js',
      'scripts/data-seeder/validate-data.js',
      'scripts/data-management/seed-data.js',
      'scripts/data-management/setup-test-data.js'
    ];

    const foundScripts = [];
    const missingScripts = [];

    legacyScripts.forEach(script => {
      if (this.checkLegacyScript(script)) {
        foundScripts.push(script);
      } else {
        missingScripts.push(script);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   • Legacy scripts found: ${foundScripts.length}`);
    console.log(`   • Scripts already migrated: ${missingScripts.length}`);
    
    if (foundScripts.length > 0) {
      console.log('\n🚀 Next Steps:');
      console.log('   1. Test new commands alongside existing scripts');
      console.log('   2. Update your workflows to use new npm commands');
      console.log('   3. Remove legacy scripts once migration is complete');
      console.log('\n📖 See docs/MIGRATION_GUIDE.md for detailed instructions');
    } else {
      console.log('\n✅ All scripts appear to be migrated to the new system!');
    }
    
    console.log('═══════════════════════════════\n');
  }
}

/**
 * Legacy wrapper functions for direct script compatibility
 */

/**
 * Wrapper for legacy seed.js
 */
async function legacySeedWrapper(options = {}) {
  const compat = new BackwardCompatibilityLayer();
  return await compat.legacySeed(options);
}

/**
 * Wrapper for legacy selective-seeder.js
 */
async function legacySelectiveSeedWrapper(scenario) {
  const compat = new BackwardCompatibilityLayer();
  return await compat.legacySelectiveSeeder(scenario);
}

/**
 * Wrapper for legacy data-management scripts
 */
async function legacyDataManagementWrapper(action, options = {}) {
  const compat = new BackwardCompatibilityLayer();
  return await compat.legacyDataManagement(action, options);
}

/**
 * CLI interface for backward compatibility
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const compat = new BackwardCompatibilityLayer();
  
  try {
    switch (command) {
      case 'seed':
        await compat.legacySeed({ force: args.includes('--force') });
        break;
        
      case 'selective-seed':
        const scenario = args[1];
        if (!scenario) {
          console.error('❌ Scenario name required for selective seeding');
          process.exit(1);
        }
        await compat.legacySelectiveSeeder(scenario);
        break;
        
      case 'data-management':
        const action = args[1];
        if (!action) {
          console.error('❌ Action required for data management');
          process.exit(1);
        }
        await compat.legacyDataManagement(action, { 
          state: args[2],
          type: args[2],
          force: args.includes('--force')
        });
        break;
        
      case 'health-check':
        await compat.legacyHealthCheck();
        break;
        
      case 'validate':
        await compat.legacyValidation(args[1] || 'all');
        break;
        
      case 'migration-report':
        compat.generateMigrationReport();
        break;
        
      case 'check-legacy':
        const scriptPath = args[1];
        if (!scriptPath) {
          console.error('❌ Script path required');
          process.exit(1);
        }
        compat.checkLegacyScript(scriptPath);
        break;
        
      default:
        console.log('🔄 Backward Compatibility Layer');
        console.log('Usage:');
        console.log('  node backward-compatibility.js seed [--force]');
        console.log('  node backward-compatibility.js selective-seed <scenario>');
        console.log('  node backward-compatibility.js data-management <action> [state]');
        console.log('  node backward-compatibility.js health-check');
        console.log('  node backward-compatibility.js validate [type]');
        console.log('  node backward-compatibility.js migration-report');
        console.log('  node backward-compatibility.js check-legacy <script-path>');
        break;
    }
  } catch (error) {
    console.error('❌ Backward compatibility operation failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  BackwardCompatibilityLayer,
  legacySeedWrapper,
  legacySelectiveSeedWrapper,
  legacyDataManagementWrapper
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}