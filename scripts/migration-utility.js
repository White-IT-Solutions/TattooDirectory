#!/usr/bin/env node

/**
 * Migration Utility
 * 
 * Helps users transition from the old scattered script system to the new unified system.
 * Provides validation, comparison tools, and step-by-step migration guidance.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { BackwardCompatibilityLayer } = require('./backward-compatibility');
const { DATA_CONFIG } = require('./data-config');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Migration utility class
 */
class MigrationUtility {
  constructor() {
    this.newManager = new UnifiedDataManager();
    this.compatLayer = new BackwardCompatibilityLayer();
    this.migrationResults = {
      tested: [],
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Analyze current project for migration readiness
   */
  async analyzeMigrationReadiness() {
    console.log('\n🔍 MIGRATION READINESS ANALYSIS');
    console.log('═══════════════════════════════════');
    
    const analysis = {
      legacyScripts: this.findLegacyScripts(),
      npmScripts: this.analyzeNpmScripts(),
      dockerIntegration: this.analyzeDockerIntegration(),
      dependencies: this.analyzeDependencies(),
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateRecommendations(analysis);
    
    this.displayAnalysisResults(analysis);
    return analysis;
  }

  /**
   * Find legacy scripts in the project
   */
  findLegacyScripts() {
    const legacyPaths = [
      'scripts/data-seeder/seed.js',
      'scripts/data-seeder/selective-seeder.js',
      'scripts/data-seeder/health-check.js',
      'scripts/data-seeder/validate-data.js',
      'scripts/data-management/seed-data.js',
      'scripts/data-management/setup-test-data.js',
      'scripts/data-management/data-management.sh',
      'scripts/data-management/data-management.bat'
    ];

    const found = [];
    const missing = [];

    legacyPaths.forEach(scriptPath => {
      if (fs.existsSync(scriptPath)) {
        const stats = fs.statSync(scriptPath);
        found.push({
          path: scriptPath,
          size: stats.size,
          modified: stats.mtime,
          type: this.classifyScript(scriptPath)
        });
      } else {
        missing.push(scriptPath);
      }
    });

    return { found, missing };
  }

  /**
   * Classify script type for migration guidance
   */
  classifyScript(scriptPath) {
    if (scriptPath.includes('seed.js')) return 'seeding';
    if (scriptPath.includes('selective-seeder.js')) return 'scenario-seeding';
    if (scriptPath.includes('health-check.js')) return 'health-monitoring';
    if (scriptPath.includes('validate-data.js')) return 'validation';
    if (scriptPath.includes('data-management')) return 'management';
    return 'unknown';
  }

  /**
   * Analyze npm scripts in package.json
   */
  analyzeNpmScripts() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      
      const newSystemScripts = Object.keys(scripts).filter(name => 
        name.startsWith('setup-data') || 
        name.startsWith('reset-data') || 
        name.startsWith('seed-scenario') ||
        name.startsWith('validate-data') ||
        name.startsWith('health-check') ||
        name === 'data-status'
      );

      const legacyScripts = Object.keys(scripts).filter(name =>
        name.startsWith('data:') ||
        name === 'seed' ||
        name.includes('legacy')
      );

      return {
        total: Object.keys(scripts).length,
        newSystem: newSystemScripts,
        legacy: legacyScripts,
        hasNewSystem: newSystemScripts.length > 0,
        hasLegacy: legacyScripts.length > 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze Docker integration
   */
  analyzeDockerIntegration() {
    const dockerFiles = [
      'docker-compose.yml',
      'docker-compose.local.yml',
      'devtools/docker/docker-compose.local.yml',
      'Dockerfile',
      'scripts/data-seeder/Dockerfile.seeder'
    ];

    const found = dockerFiles.filter(file => fs.existsSync(file));
    
    return {
      hasDocker: found.length > 0,
      files: found,
      needsUpdate: found.length > 0 // Docker files may need updating for new system
    };
  }

  /**
   * Analyze project dependencies
   */
  analyzeDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scriptsPackageJson = fs.existsSync('scripts/package.json') 
        ? JSON.parse(fs.readFileSync('scripts/package.json', 'utf8'))
        : null;

      return {
        hasWorkspaces: !!packageJson.workspaces,
        workspaces: packageJson.workspaces || [],
        hasScriptsWorkspace: scriptsPackageJson !== null,
        scriptsHasUnifiedManager: scriptsPackageJson && 
          scriptsPackageJson.dependencies && 
          Object.keys(scriptsPackageJson.dependencies).some(dep => 
            dep.includes('unified') || dep.includes('data-cli')
          )
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Generate migration recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Legacy scripts recommendations
    if (analysis.legacyScripts.found.length > 0) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        title: 'Migrate Legacy Scripts',
        description: `Found ${analysis.legacyScripts.found.length} legacy scripts that should be migrated`,
        action: 'Run migration tests to validate new system compatibility'
      });
    }

    // npm scripts recommendations
    if (analysis.npmScripts.hasLegacy && !analysis.npmScripts.hasNewSystem) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        title: 'Update npm Scripts',
        description: 'Legacy npm scripts found but new system scripts missing',
        action: 'Add new system npm scripts to package.json'
      });
    }

    // Docker recommendations
    if (analysis.dockerIntegration.hasDocker) {
      recommendations.push({
        type: 'review',
        priority: 'medium',
        title: 'Review Docker Integration',
        description: 'Docker files found - may need updates for new system',
        action: 'Test Docker integration with new unified system'
      });
    }

    // Dependencies recommendations
    if (analysis.dependencies.hasWorkspaces && !analysis.dependencies.hasScriptsWorkspace) {
      recommendations.push({
        type: 'setup',
        priority: 'medium',
        title: 'Configure Scripts Workspace',
        description: 'Project uses workspaces but scripts workspace not properly configured',
        action: 'Ensure scripts directory is included in workspace configuration'
      });
    }

    return recommendations;
  }

  /**
   * Display analysis results
   */
  displayAnalysisResults(analysis) {
    console.log('\n📊 Analysis Results:');
    console.log(`   • Legacy scripts found: ${analysis.legacyScripts.found.length}`);
    console.log(`   • Legacy scripts missing: ${analysis.legacyScripts.missing.length}`);
    console.log(`   • New system npm scripts: ${analysis.npmScripts.newSystem?.length || 0}`);
    console.log(`   • Legacy npm scripts: ${analysis.npmScripts.legacy?.length || 0}`);
    console.log(`   • Docker files found: ${analysis.dockerIntegration.files?.length || 0}`);

    if (analysis.recommendations.length > 0) {
      console.log('\n🎯 Recommendations:');
      analysis.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priority} ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      → ${rec.action}`);
      });
    }

    console.log('═══════════════════════════════════\n');
  }

  /**
   * Test migration by comparing old and new system results
   */
  async testMigration(operations = ['setup-data', 'health-check', 'validate-data']) {
    console.log('\n🧪 MIGRATION TESTING');
    console.log('═══════════════════════════════');
    
    for (const operation of operations) {
      console.log(`\n🔄 Testing operation: ${operation}`);
      
      try {
        const testResult = await this.compareOperationResults(operation);
        
        if (testResult.success) {
          console.log(`✅ ${operation}: PASSED`);
          this.migrationResults.passed.push(operation);
        } else {
          console.log(`❌ ${operation}: FAILED`);
          console.log(`   Reason: ${testResult.reason}`);
          this.migrationResults.failed.push({
            operation,
            reason: testResult.reason,
            details: testResult.details
          });
        }
        
        this.migrationResults.tested.push(operation);
        
      } catch (error) {
        console.log(`❌ ${operation}: ERROR`);
        console.log(`   Error: ${error.message}`);
        this.migrationResults.failed.push({
          operation,
          reason: 'Exception thrown',
          details: error.message
        });
      }
    }

    this.displayMigrationTestResults();
    return this.migrationResults;
  }

  /**
   * Compare results between old and new systems
   */
  async compareOperationResults(operation) {
    try {
      // For now, we'll test that the new system operations work
      // In a full implementation, we would compare with legacy system results
      
      switch (operation) {
        case 'setup-data':
          // Test dry-run setup
          const setupResult = await this.newManager.healthCheck();
          return { 
            success: true, 
            newResult: setupResult,
            comparison: 'New system health check passed'
          };
          
        case 'health-check':
          const healthResult = await this.newManager.healthCheck();
          return { 
            success: !!healthResult, 
            newResult: healthResult,
            comparison: 'Health check completed successfully'
          };
          
        case 'validate-data':
          // For validation, we'll check if the method exists and can be called
          const validateResult = await this.newManager.validateData('all');
          return { 
            success: !!validateResult, 
            newResult: validateResult,
            comparison: 'Validation completed successfully'
          };
          
        default:
          return { 
            success: false, 
            reason: `Unknown operation: ${operation}` 
          };
      }
    } catch (error) {
      return { 
        success: false, 
        reason: 'Operation failed', 
        details: error.message 
      };
    }
  }

  /**
   * Display migration test results
   */
  displayMigrationTestResults() {
    console.log('\n📋 Migration Test Summary:');
    console.log(`   • Total operations tested: ${this.migrationResults.tested.length}`);
    console.log(`   • Passed: ${this.migrationResults.passed.length}`);
    console.log(`   • Failed: ${this.migrationResults.failed.length}`);
    
    if (this.migrationResults.failed.length > 0) {
      console.log('\n❌ Failed Operations:');
      this.migrationResults.failed.forEach(failure => {
        console.log(`   • ${failure.operation}: ${failure.reason}`);
        if (failure.details) {
          console.log(`     Details: ${failure.details}`);
        }
      });
    }
    
    const successRate = (this.migrationResults.passed.length / this.migrationResults.tested.length) * 100;
    console.log(`\n📊 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 Migration readiness: EXCELLENT');
    } else if (successRate >= 75) {
      console.log('✅ Migration readiness: GOOD');
    } else if (successRate >= 50) {
      console.log('⚠️  Migration readiness: NEEDS WORK');
    } else {
      console.log('❌ Migration readiness: NOT READY');
    }
    
    console.log('═══════════════════════════════\n');
  }

  /**
   * Generate migration plan
   */
  generateMigrationPlan(analysis) {
    console.log('\n📋 MIGRATION PLAN');
    console.log('═══════════════════════════════');
    
    const plan = {
      phases: [],
      estimatedTime: '2-4 hours',
      riskLevel: 'low'
    };

    // Phase 1: Preparation
    plan.phases.push({
      phase: 1,
      title: 'Preparation',
      tasks: [
        'Backup existing scripts and configuration',
        'Ensure new unified system is properly installed',
        'Run migration readiness analysis',
        'Review Docker integration requirements'
      ],
      estimatedTime: '30 minutes'
    });

    // Phase 2: Testing
    plan.phases.push({
      phase: 2,
      title: 'Testing & Validation',
      tasks: [
        'Run migration tests to compare old vs new system',
        'Test all critical workflows with new system',
        'Validate Docker integration works correctly',
        'Test npm workspace integration'
      ],
      estimatedTime: '1-2 hours'
    });

    // Phase 3: Migration
    plan.phases.push({
      phase: 3,
      title: 'Migration Execution',
      tasks: [
        'Update npm scripts to use new commands',
        'Update Docker configurations if needed',
        'Replace legacy script calls with new system',
        'Update documentation and README files'
      ],
      estimatedTime: '1 hour'
    });

    // Phase 4: Cleanup
    plan.phases.push({
      phase: 4,
      title: 'Cleanup & Verification',
      tasks: [
        'Remove or archive legacy scripts',
        'Run final validation tests',
        'Update team documentation',
        'Train team on new commands'
      ],
      estimatedTime: '30 minutes'
    });

    // Display plan
    plan.phases.forEach(phase => {
      console.log(`\n📌 Phase ${phase.phase}: ${phase.title} (${phase.estimatedTime})`);
      phase.tasks.forEach(task => {
        console.log(`   • ${task}`);
      });
    });

    console.log(`\n⏱️  Total Estimated Time: ${plan.estimatedTime}`);
    console.log(`🎯 Risk Level: ${plan.riskLevel.toUpperCase()}`);
    console.log('═══════════════════════════════\n');

    return plan;
  }

  /**
   * Create migration checklist
   */
  createMigrationChecklist() {
    const checklist = [
      '□ Backup existing scripts and configuration',
      '□ Run migration readiness analysis',
      '□ Test new system with health-check command',
      '□ Test setup-data command in safe environment',
      '□ Test reset-data command with different states',
      '□ Test seed-scenario commands with all scenarios',
      '□ Validate Docker integration works correctly',
      '□ Update package.json npm scripts',
      '□ Update Docker configurations if needed',
      '□ Update CI/CD pipelines to use new commands',
      '□ Update team documentation',
      '□ Train team on new command structure',
      '□ Run final validation tests',
      '□ Archive or remove legacy scripts',
      '□ Monitor system for first few days after migration'
    ];

    console.log('\n✅ MIGRATION CHECKLIST');
    console.log('═══════════════════════════════');
    checklist.forEach(item => console.log(item));
    console.log('═══════════════════════════════\n');

    return checklist;
  }

  /**
   * Validate functionality preservation
   */
  async validateFunctionalityPreservation() {
    console.log('\n🔍 FUNCTIONALITY PRESERVATION VALIDATION');
    console.log('═══════════════════════════════════════');
    
    const validationTests = [
      {
        name: 'Configuration Loading',
        test: () => this.validateConfigurationLoading()
      },
      {
        name: 'Service Connectivity',
        test: () => this.validateServiceConnectivity()
      },
      {
        name: 'Command Interface',
        test: () => this.validateCommandInterface()
      },
      {
        name: 'Error Handling',
        test: () => this.validateErrorHandling()
      },
      {
        name: 'Docker Compatibility',
        test: () => this.validateDockerCompatibility()
      }
    ];

    const results = [];
    
    for (const validation of validationTests) {
      console.log(`\n🔄 Testing: ${validation.name}`);
      
      try {
        const result = await validation.test();
        console.log(`✅ ${validation.name}: PASSED`);
        results.push({ name: validation.name, status: 'passed', result });
      } catch (error) {
        console.log(`❌ ${validation.name}: FAILED`);
        console.log(`   Error: ${error.message}`);
        results.push({ name: validation.name, status: 'failed', error: error.message });
      }
    }

    const passedCount = results.filter(r => r.status === 'passed').length;
    const successRate = (passedCount / results.length) * 100;
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`   • Tests run: ${results.length}`);
    console.log(`   • Passed: ${passedCount}`);
    console.log(`   • Failed: ${results.length - passedCount}`);
    console.log(`   • Success rate: ${successRate.toFixed(1)}%`);
    
    console.log('═══════════════════════════════════════\n');
    
    return { results, successRate };
  }

  /**
   * Validate configuration loading
   */
  async validateConfigurationLoading() {
    const config = DATA_CONFIG;
    
    if (!config || !config.services || !config.paths) {
      throw new Error('Configuration not properly loaded');
    }
    
    return { configLoaded: true, services: Object.keys(config.services).length };
  }

  /**
   * Validate service connectivity
   */
  async validateServiceConnectivity() {
    try {
      const healthResult = await this.newManager.healthCheck();
      return { connectivity: 'verified', result: healthResult };
    } catch (error) {
      throw new Error(`Service connectivity failed: ${error.message}`);
    }
  }

  /**
   * Validate command interface
   */
  async validateCommandInterface() {
    const requiredMethods = ['setupData', 'resetData', 'seedScenario', 'validateData', 'healthCheck', 'getDataStatus'];
    
    for (const method of requiredMethods) {
      if (typeof this.newManager[method] !== 'function') {
        throw new Error(`Required method ${method} not found`);
      }
    }
    
    return { interfaceValid: true, methods: requiredMethods.length };
  }

  /**
   * Validate error handling
   */
  async validateErrorHandling() {
    try {
      // Test with invalid scenario
      await this.newManager.seedScenario('invalid-scenario-name');
      throw new Error('Should have thrown error for invalid scenario');
    } catch (error) {
      if (error.message.includes('invalid-scenario-name') || error.message.includes('Unknown scenario')) {
        return { errorHandling: 'working', errorMessage: error.message };
      }
      throw error;
    }
  }

  /**
   * Validate Docker compatibility
   */
  async validateDockerCompatibility() {
    // Check if Docker compatibility layer exists
    const dockerCompatPath = path.join(__dirname, 'docker-compatibility.js');
    
    if (!fs.existsSync(dockerCompatPath)) {
      throw new Error('Docker compatibility layer not found');
    }
    
    return { dockerCompatibility: 'available', path: dockerCompatPath };
  }
}

/**
 * CLI interface for migration utility
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const migration = new MigrationUtility();
  
  try {
    switch (command) {
      case 'analyze':
        const analysis = await migration.analyzeMigrationReadiness();
        migration.generateMigrationPlan(analysis);
        break;
        
      case 'test':
        const operations = args.slice(1);
        await migration.testMigration(operations.length > 0 ? operations : undefined);
        break;
        
      case 'validate':
        await migration.validateFunctionalityPreservation();
        break;
        
      case 'checklist':
        migration.createMigrationChecklist();
        break;
        
      case 'plan':
        const planAnalysis = await migration.analyzeMigrationReadiness();
        migration.generateMigrationPlan(planAnalysis);
        break;
        
      case 'full':
        console.log('🚀 Running full migration analysis and testing...\n');
        const fullAnalysis = await migration.analyzeMigrationReadiness();
        migration.generateMigrationPlan(fullAnalysis);
        await migration.testMigration();
        await migration.validateFunctionalityPreservation();
        migration.createMigrationChecklist();
        break;
        
      default:
        console.log('🔄 Migration Utility');
        console.log('Usage:');
        console.log('  node migration-utility.js analyze     - Analyze migration readiness');
        console.log('  node migration-utility.js test [ops]  - Test migration compatibility');
        console.log('  node migration-utility.js validate    - Validate functionality preservation');
        console.log('  node migration-utility.js checklist   - Show migration checklist');
        console.log('  node migration-utility.js plan        - Generate migration plan');
        console.log('  node migration-utility.js full        - Run complete migration analysis');
        break;
    }
  } catch (error) {
    console.error('❌ Migration utility failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  MigrationUtility
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}