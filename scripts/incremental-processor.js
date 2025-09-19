#!/usr/bin/env node

/**
 * Incremental Processing Logic
 * 
 * Implements change detection algorithms for different file types,
 * timestamp-based change tracking for performance optimization,
 * and intelligent processing decisions based on detected changes.
 */

const fs = require('fs');
const path = require('path');
const { StateManager } = require('./state-manager');
const { DATA_CONFIG } = require('./data-config');

/**
 * IncrementalProcessor class for smart change detection and processing
 */
class IncrementalProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateManager = new StateManager(config);
    
    // File type configurations for change detection
    this.fileTypeConfigs = {
      images: {
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        directory: config.paths.imageSourceDir,
        checkContent: true,
        checkTimestamp: true
      },
      dataFiles: {
        extensions: ['.json', '.js'],
        directory: config.paths.testDataDir,
        checkContent: true,
        checkTimestamp: true
      },
      configuration: {
        files: [
          path.join(config.paths.scriptsDir, 'data-config.js'),
          path.join(config.paths.projectRoot, 'package.json'),
          config.paths.dockerComposeFile,
          config.paths.envFile
        ],
        checkContent: true,
        checkTimestamp: true
      },
      scripts: {
        extensions: ['.js', '.json'],
        directory: config.paths.scriptsDir,
        checkContent: true,
        checkTimestamp: false // Scripts don't affect data processing
      }
    };
  }

  /**
   * Analyze changes and determine what processing is needed
   */
  async analyzeChanges(operation = {}) {
    const changes = this.stateManager.detectChanges();
    const lastState = this.stateManager.getLastState();
    
    const analysis = {
      timestamp: new Date().toISOString(),
      operation: operation.type || 'unknown',
      changes: changes,
      recommendations: {
        processImages: false,
        seedDatabase: false,
        updateFrontend: false,
        validateData: false,
        fullReset: false
      },
      reasons: [],
      estimatedTime: 0,
      affectedComponents: []
    };

    // Handle special operation modes first
    if (operation.frontendOnly) {
      analysis.recommendations = {
        processImages: false,
        seedDatabase: false,
        updateFrontend: true,
        validateData: false,
        fullReset: false
      };
      analysis.reasons.push('Frontend-only mode requested');
      analysis.estimatedTime = this.estimateFrontendUpdateTime();
      analysis.affectedComponents = ['frontend'];
      return analysis;
    }

    if (operation.imagesOnly) {
      analysis.recommendations = {
        processImages: true,
        seedDatabase: false,
        updateFrontend: true,
        validateData: false,
        fullReset: false
      };
      analysis.reasons.push('Images-only mode requested');
      analysis.estimatedTime = this.estimateImageProcessingTime();
      analysis.affectedComponents = ['images', 'frontend'];
      return analysis;
    }

    if (operation.force) {
      analysis.recommendations = {
        processImages: true,
        seedDatabase: true,
        updateFrontend: true,
        validateData: true,
        fullReset: false
      };
      analysis.reasons.push('Force flag specified - full processing requested');
      analysis.estimatedTime = this.estimateFullProcessingTime();
      analysis.affectedComponents = ['images', 'database', 'opensearch', 'frontend'];
      return analysis;
    }

    // Force full processing if no previous state
    if (!lastState.checksums) {
      analysis.recommendations = {
        processImages: true,
        seedDatabase: true,
        updateFrontend: true,
        validateData: true,
        fullReset: false
      };
      analysis.reasons.push('No previous state found - full processing required');
      analysis.estimatedTime = this.estimateFullProcessingTime();
      analysis.affectedComponents = ['images', 'database', 'opensearch', 'frontend'];
      return analysis;
    }

    // Analyze specific changes
    if (changes.imagesChanged) {
      analysis.recommendations.processImages = true;
      analysis.recommendations.updateFrontend = true;
      analysis.affectedComponents.push('images', 'frontend');
      analysis.reasons.push('Image files have changed');
      analysis.estimatedTime += this.estimateImageProcessingTime();
    }

    if (changes.dataChanged) {
      analysis.recommendations.seedDatabase = true;
      analysis.recommendations.updateFrontend = true;
      analysis.affectedComponents.push('database', 'opensearch', 'frontend');
      analysis.reasons.push('Data files have changed');
      analysis.estimatedTime += this.estimateDatabaseSeedingTime();
    }

    if (changes.configChanged) {
      // Configuration changes might require full reset
      const configChanges = this.analyzeConfigurationChanges(changes.details);
      
      if (configChanges.requiresFullReset) {
        analysis.recommendations.fullReset = true;
        analysis.recommendations.processImages = true;
        analysis.recommendations.seedDatabase = true;
        analysis.recommendations.updateFrontend = true;
        analysis.affectedComponents = ['all'];
        analysis.reasons.push('Configuration changes require full reset');
        analysis.estimatedTime = this.estimateFullProcessingTime();
      } else {
        analysis.recommendations.validateData = true;
        analysis.affectedComponents.push('validation');
        analysis.reasons.push('Configuration changes detected - validation recommended');
        analysis.estimatedTime += this.estimateValidationTime();
      }
    }



    // Always validate if no changes detected but validation was requested
    if (!changes.hasChanges && operation.type === 'validate') {
      analysis.recommendations.validateData = true;
      analysis.reasons.push('Validation requested');
      analysis.estimatedTime = this.estimateValidationTime();
      analysis.affectedComponents = ['validation'];
    }

    return analysis;
  }

  /**
   * Analyze configuration changes to determine impact
   */
  analyzeConfigurationChanges(changeDetails) {
    const analysis = {
      requiresFullReset: false,
      affectedServices: [],
      changes: []
    };

    // Check which configuration files changed
    const criticalConfigFiles = ['dataConfig', 'dockerCompose', 'envFile'];
    const changedCriticalFiles = changeDetails.changedFiles?.filter(file => 
      criticalConfigFiles.includes(file)
    ) || [];

    if (changedCriticalFiles.length > 0) {
      analysis.requiresFullReset = true;
      analysis.changes.push(`Critical configuration files changed: ${changedCriticalFiles.join(', ')}`);
    }

    // Check for service endpoint changes
    const currentConfig = this.config.services;
    const previousState = this.stateManager.getState();
    
    if (previousState.configuration?.configHash !== this.stateManager.generateConfigHash()) {
      analysis.affectedServices.push('all');
      analysis.changes.push('Service configuration hash changed');
    }

    return analysis;
  }

  /**
   * Get detailed file changes for specific file types
   */
  getDetailedFileChanges(fileType) {
    const config = this.fileTypeConfigs[fileType];
    if (!config) {
      throw new Error(`Unknown file type: ${fileType}`);
    }

    const changes = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: []
    };

    if (config.directory) {
      // Directory-based file type
      const currentFiles = this.stateManager.getFilesRecursively(config.directory, config.extensions);
      const previousChecksums = this.stateManager.loadChecksums();
      
      if (!previousChecksums) {
        // No previous state - all files are new
        changes.added = currentFiles.map(file => path.relative(config.directory, file));
        return changes;
      }

      // Compare each file
      currentFiles.forEach(file => {
        const relativePath = path.relative(config.directory, file);
        const currentChecksum = this.stateManager.calculateFileChecksum(file);
        
        // Find previous checksum (this is simplified - in real implementation would need better tracking)
        const hasChanged = true; // Simplified for now
        
        if (hasChanged) {
          changes.modified.push(relativePath);
        } else {
          changes.unchanged.push(relativePath);
        }
      });
    } else if (config.files) {
      // Specific files
      config.files.forEach(file => {
        const currentChecksum = this.stateManager.calculateFileChecksum(file);
        const relativePath = path.relative(this.config.paths.projectRoot, file);
        
        if (currentChecksum) {
          changes.modified.push(relativePath); // Simplified
        } else {
          changes.deleted.push(relativePath);
        }
      });
    }

    return changes;
  }

  /**
   * Create processing plan based on analysis
   */
  createProcessingPlan(analysis) {
    const plan = {
      timestamp: new Date().toISOString(),
      operation: analysis.operation,
      estimatedDuration: analysis.estimatedTime,
      stages: [],
      parallelizable: [],
      dependencies: {},
      skipReasons: []
    };

    // Build processing stages based on recommendations
    if (analysis.recommendations.fullReset) {
      plan.stages.push({
        name: 'full-reset',
        description: 'Complete system reset and rebuild',
        estimatedTime: analysis.estimatedTime,
        required: true,
        parallelizable: false
      });
      return plan;
    }

    // Individual processing stages
    if (analysis.recommendations.processImages) {
      plan.stages.push({
        name: 'process-images',
        description: 'Process and upload images to S3',
        estimatedTime: this.estimateImageProcessingTime(),
        required: true,
        parallelizable: false,
        dependencies: ['service-check']
      });
    } else {
      plan.skipReasons.push('Images unchanged - skipping image processing');
    }

    if (analysis.recommendations.seedDatabase) {
      plan.stages.push({
        name: 'seed-database',
        description: 'Seed DynamoDB and OpenSearch',
        estimatedTime: this.estimateDatabaseSeedingTime(),
        required: true,
        parallelizable: false,
        dependencies: ['service-check']
      });
    } else {
      plan.skipReasons.push('Data unchanged - skipping database seeding');
    }

    if (analysis.recommendations.updateFrontend) {
      plan.stages.push({
        name: 'update-frontend',
        description: 'Update frontend mock data',
        estimatedTime: this.estimateFrontendUpdateTime(),
        required: true,
        parallelizable: true,
        dependencies: []
      });
    }

    if (analysis.recommendations.validateData) {
      plan.stages.push({
        name: 'validate-data',
        description: 'Validate data consistency',
        estimatedTime: this.estimateValidationTime(),
        required: false,
        parallelizable: true,
        dependencies: ['seed-database']
      });
    }

    // Always include service check as first stage
    plan.stages.unshift({
      name: 'service-check',
      description: 'Verify service availability',
      estimatedTime: 5000, // 5 seconds
      required: true,
      parallelizable: false,
      dependencies: []
    });

    return plan;
  }

  /**
   * Estimate processing times based on file counts and system performance
   */
  estimateImageProcessingTime() {
    try {
      const imageDir = this.config.paths.imageSourceDir;
      if (!fs.existsSync(imageDir)) {
        return 0;
      }

      const imageFiles = this.stateManager.getFilesRecursively(imageDir, this.fileTypeConfigs.images.extensions);
      const imageCount = imageFiles.length;
      
      // Estimate: 2 seconds per image for processing and upload
      return Math.max(imageCount * 2000, 5000); // Minimum 5 seconds
    } catch (error) {
      return 30000; // Default 30 seconds if can't calculate
    }
  }

  estimateDatabaseSeedingTime() {
    try {
      const dataDir = this.config.paths.testDataDir;
      if (!fs.existsSync(dataDir)) {
        return 0;
      }

      const dataFiles = this.stateManager.getFilesRecursively(dataDir, this.fileTypeConfigs.dataFiles.extensions);
      const fileCount = dataFiles.length;
      
      // Estimate: 3 seconds per data file for processing and seeding
      return Math.max(fileCount * 3000, 10000); // Minimum 10 seconds
    } catch (error) {
      return 45000; // Default 45 seconds if can't calculate
    }
  }

  estimateFrontendUpdateTime() {
    return 2000; // 2 seconds for frontend mock data update
  }

  estimateValidationTime() {
    return 10000; // 10 seconds for validation
  }

  estimateFullProcessingTime() {
    return this.estimateImageProcessingTime() + 
           this.estimateDatabaseSeedingTime() + 
           this.estimateFrontendUpdateTime() + 
           this.estimateValidationTime() + 
           10000; // Additional 10 seconds for coordination
  }

  /**
   * Check if incremental processing is beneficial
   */
  shouldUseIncrementalProcessing(analysis) {
    const fullTime = this.estimateFullProcessingTime();
    const incrementalTime = analysis.estimatedTime;
    
    // Use incremental if it saves more than 30% of time
    const timeSavings = (fullTime - incrementalTime) / fullTime;
    
    return {
      beneficial: timeSavings > 0.3,
      timeSavings: timeSavings,
      fullTime: fullTime,
      incrementalTime: incrementalTime,
      recommendation: timeSavings > 0.3 ? 'incremental' : 'full'
    };
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics() {
    const state = this.stateManager.getState();
    const checksums = this.stateManager.loadChecksums();
    
    return {
      lastProcessing: {
        timestamp: state.lastOperation?.timestamp,
        type: state.lastOperation?.type,
        success: state.lastOperation?.success
      },
      checksums: {
        lastCalculated: checksums?.timestamp,
        fileCount: checksums ? Object.keys(checksums.files).length : 0,
        directoryCount: checksums ? Object.keys(checksums.directories).length : 0
      },
      operations: state.operations,
      results: state.results
    };
  }

  /**
   * Optimize processing order based on dependencies and parallelization
   */
  optimizeProcessingOrder(plan) {
    const optimized = {
      ...plan,
      executionOrder: [],
      parallelGroups: []
    };

    // Build dependency graph
    const dependencyGraph = {};
    plan.stages.forEach(stage => {
      dependencyGraph[stage.name] = stage.dependencies || [];
    });

    // Topological sort for execution order
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (stageName) => {
      if (visiting.has(stageName)) {
        throw new Error(`Circular dependency detected involving ${stageName}`);
      }
      if (visited.has(stageName)) {
        return;
      }

      visiting.add(stageName);
      
      const dependencies = dependencyGraph[stageName] || [];
      dependencies.forEach(dep => visit(dep));
      
      visiting.delete(stageName);
      visited.add(stageName);
      order.push(stageName);
    };

    // Visit all stages
    Object.keys(dependencyGraph).forEach(stage => visit(stage));
    
    optimized.executionOrder = order;

    // Group parallelizable stages
    const groups = [];
    let currentGroup = [];
    
    order.forEach(stageName => {
      const stage = plan.stages.find(s => s.name === stageName);
      
      if (stage.parallelizable && currentGroup.length === 0) {
        currentGroup.push(stageName);
      } else if (stage.parallelizable && currentGroup.length > 0) {
        // Check if this stage can run in parallel with current group
        const canParallelize = currentGroup.every(groupStage => {
          const groupStageObj = plan.stages.find(s => s.name === groupStage);
          return !stage.dependencies.includes(groupStage) && 
                 !groupStageObj.dependencies.includes(stageName);
        });
        
        if (canParallelize) {
          currentGroup.push(stageName);
        } else {
          if (currentGroup.length > 0) {
            groups.push([...currentGroup]);
          }
          currentGroup = [stageName];
        }
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
        groups.push([stageName]);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    optimized.parallelGroups = groups;
    
    return optimized;
  }
}

// Create and export default instance
const INCREMENTAL_PROCESSOR = new IncrementalProcessor();

module.exports = {
  INCREMENTAL_PROCESSOR,
  IncrementalProcessor
};

// CLI usage when run directly
if (require.main === module) {
  const processor = new IncrementalProcessor();
  
  console.log('🔄 Incremental Processing Analysis');
  console.log('==================================\n');
  
  // Analyze current changes
  console.log('🔍 Analyzing changes...');
  processor.analyzeChanges({ type: 'setup' }).then(analysis => {
    console.log('\n📊 Change Analysis Results:');
    console.log(`  Has changes: ${analysis.changes.hasChanges ? 'Yes ⚠️' : 'No ✅'}`);
    console.log(`  Images changed: ${analysis.changes.imagesChanged ? 'Yes' : 'No'}`);
    console.log(`  Data changed: ${analysis.changes.dataChanged ? 'Yes' : 'No'}`);
    console.log(`  Config changed: ${analysis.changes.configChanged ? 'Yes' : 'No'}`);
    
    console.log('\n🎯 Processing Recommendations:');
    console.log(`  Process images: ${analysis.recommendations.processImages ? 'Yes' : 'No'}`);
    console.log(`  Seed database: ${analysis.recommendations.seedDatabase ? 'Yes' : 'No'}`);
    console.log(`  Update frontend: ${analysis.recommendations.updateFrontend ? 'Yes' : 'No'}`);
    console.log(`  Validate data: ${analysis.recommendations.validateData ? 'Yes' : 'No'}`);
    console.log(`  Full reset: ${analysis.recommendations.fullReset ? 'Yes' : 'No'}`);
    
    console.log('\n⏱️  Time Estimates:');
    console.log(`  Estimated time: ${Math.round(analysis.estimatedTime / 1000)}s`);
    console.log(`  Affected components: ${analysis.affectedComponents.join(', ')}`);
    
    if (analysis.reasons.length > 0) {
      console.log('\n📝 Reasons:');
      analysis.reasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });
    }
    
    // Create processing plan
    console.log('\n📋 Creating processing plan...');
    const plan = processor.createProcessingPlan(analysis);
    const optimizedPlan = processor.optimizeProcessingOrder(plan);
    
    console.log('\n🚀 Optimized Processing Plan:');
    console.log(`  Total estimated time: ${Math.round(plan.estimatedDuration / 1000)}s`);
    console.log(`  Number of stages: ${plan.stages.length}`);
    
    console.log('\n📅 Execution Order:');
    optimizedPlan.parallelGroups.forEach((group, index) => {
      if (group.length === 1) {
        console.log(`  ${index + 1}. ${group[0]} (sequential)`);
      } else {
        console.log(`  ${index + 1}. [${group.join(', ')}] (parallel)`);
      }
    });
    
    if (plan.skipReasons.length > 0) {
      console.log('\n⏭️  Skipped Operations:');
      plan.skipReasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });
    }
    
    // Check if incremental processing is beneficial
    const incrementalBenefit = processor.shouldUseIncrementalProcessing(analysis);
    console.log('\n💡 Incremental Processing Analysis:');
    console.log(`  Recommendation: ${incrementalBenefit.recommendation}`);
    console.log(`  Time savings: ${Math.round(incrementalBenefit.timeSavings * 100)}%`);
    console.log(`  Full processing: ${Math.round(incrementalBenefit.fullTime / 1000)}s`);
    console.log(`  Incremental: ${Math.round(incrementalBenefit.incrementalTime / 1000)}s`);
    
  }).catch(error => {
    console.error('❌ Error analyzing changes:', error.message);
  });
}