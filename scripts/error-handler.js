#!/usr/bin/env node

/**
 * Error Handler and Recovery System
 * 
 * Comprehensive error classification, handling, and recovery mechanisms for the
 * data management pipeline. Includes automatic rollback capabilities, retry logic
 * with exponential backoff, and detailed error reporting.
 */

const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('./data-config');

/**
 * Error classification types
 */
const ERROR_TYPES = {
  PREREQUISITES: 'PREREQUISITES',
  CONFIGURATION: 'CONFIGURATION',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  DATA_VALIDATION: 'DATA_VALIDATION',
  FILE_SYSTEM: 'FILE_SYSTEM',
  PERMISSION: 'PERMISSION',
  RESOURCE_EXHAUSTION: 'RESOURCE_EXHAUSTION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Recovery strategies
 */
const RECOVERY_STRATEGIES = {
  RETRY: 'RETRY',
  ROLLBACK: 'ROLLBACK',
  SKIP: 'SKIP',
  FAIL_FAST: 'FAIL_FAST',
  MANUAL_INTERVENTION: 'MANUAL_INTERVENTION'
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Retry configuration for different error types
 */
const RETRY_CONFIG = {
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ERROR_TYPES.NETWORK]: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    jitter: true
  },
  [ERROR_TYPES.TIMEOUT]: {
    maxRetries: 2,
    baseDelay: 5000,
    maxDelay: 20000,
    backoffMultiplier: 2,
    jitter: false
  },
  [ERROR_TYPES.FILE_SYSTEM]: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ERROR_TYPES.DATA_VALIDATION]: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 1000,
    backoffMultiplier: 1,
    jitter: false
  }
};

/**
 * ErrorHandler class with comprehensive error management
 */
class ErrorHandler {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.errorLog = [];
    this.recoveryAttempts = new Map();
    this.rollbackStack = [];
    
    // Error statistics
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0
    };
  }

  /**
   * Classify error based on message and context
   */
  classifyError(error, context = {}) {
    const message = error.message.toLowerCase();
    const code = error.code;
    const statusCode = error.statusCode;
    
    // Prerequisites errors
    if (message.includes('prerequisites') || 
        message.includes('missing') || 
        message.includes('not found') ||
        message.includes('required')) {
      return {
        type: ERROR_TYPES.PREREQUISITES,
        severity: ERROR_SEVERITY.HIGH,
        strategy: RECOVERY_STRATEGIES.FAIL_FAST
      };
    }
    
    // Configuration errors
    if (message.includes('configuration') || 
        message.includes('config') ||
        message.includes('invalid') ||
        code === 'ENOENT') {
      return {
        type: ERROR_TYPES.CONFIGURATION,
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
      };
    }
    
    // Service unavailable errors
    if (message.includes('connection') || 
        message.includes('unavailable') ||
        message.includes('refused') ||
        statusCode >= 500 ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND') {
      return {
        type: ERROR_TYPES.SERVICE_UNAVAILABLE,
        severity: ERROR_SEVERITY.HIGH,
        strategy: RECOVERY_STRATEGIES.RETRY
      };
    }
    
    // Network errors
    if (message.includes('network') || 
        message.includes('timeout') ||
        message.includes('dns') ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET') {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.RETRY
      };
    }
    
    // Timeout errors
    if (message.includes('timed out') || 
        message.includes('timeout') ||
        code === 'TIMEOUT') {
      return {
        type: ERROR_TYPES.TIMEOUT,
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.RETRY
      };
    }
    
    // Data validation errors
    if (message.includes('validation') || 
        message.includes('invalid data') ||
        message.includes('schema') ||
        statusCode === 400) {
      return {
        type: ERROR_TYPES.DATA_VALIDATION,
        severity: ERROR_SEVERITY.LOW,
        strategy: RECOVERY_STRATEGIES.SKIP
      };
    }
    
    // File system errors
    if (message.includes('file') || 
        message.includes('directory') ||
        message.includes('permission') ||
        code === 'EACCES' ||
        code === 'EPERM' ||
        code === 'ENOSPC') {
      return {
        type: ERROR_TYPES.FILE_SYSTEM,
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: code === 'EACCES' || code === 'EPERM' ? 
          RECOVERY_STRATEGIES.MANUAL_INTERVENTION : 
          RECOVERY_STRATEGIES.RETRY
      };
    }
    
    // Permission errors
    if (message.includes('permission') || 
        message.includes('access denied') ||
        message.includes('unauthorized') ||
        code === 'EACCES' ||
        statusCode === 401 ||
        statusCode === 403) {
      return {
        type: ERROR_TYPES.PERMISSION,
        severity: ERROR_SEVERITY.HIGH,
        strategy: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
      };
    }
    
    // Resource exhaustion
    if (message.includes('memory') || 
        message.includes('space') ||
        message.includes('limit') ||
        code === 'ENOSPC' ||
        code === 'ENOMEM') {
      return {
        type: ERROR_TYPES.RESOURCE_EXHAUSTION,
        severity: ERROR_SEVERITY.CRITICAL,
        strategy: RECOVERY_STRATEGIES.FAIL_FAST
      };
    }
    
    // Unknown error
    return {
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      strategy: RECOVERY_STRATEGIES.RETRY
    };
  }

  /**
   * Handle error with appropriate recovery strategy
   */
  async handleError(error, context = {}) {
    const classification = this.classifyError(error, context);
    const errorId = this.generateErrorId();
    
    // Log error
    const errorEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      },
      classification,
      context,
      recoveryAttempts: 0,
      resolved: false
    };
    
    this.errorLog.push(errorEntry);
    this.updateStats(classification);
    
    console.error(`❌ Error ${errorId} [${classification.type}/${classification.severity}]: ${error.message}`);
    
    // Execute recovery strategy
    try {
      const recoveryResult = await this.executeRecoveryStrategy(
        error, 
        classification, 
        context, 
        errorId
      );
      
      if (recoveryResult.success) {
        errorEntry.resolved = true;
        this.stats.successfulRecoveries++;
        console.log(`✅ Error ${errorId} recovered successfully`);
        return recoveryResult;
      } else {
        this.stats.failedRecoveries++;
        console.error(`💥 Error ${errorId} recovery failed: ${recoveryResult.reason}`);
        throw new Error(`Recovery failed: ${recoveryResult.reason}`);
      }
      
    } catch (recoveryError) {
      this.stats.failedRecoveries++;
      console.error(`💥 Error ${errorId} recovery threw exception:`, recoveryError.message);
      throw recoveryError;
    }
  }

  /**
   * Execute recovery strategy based on error classification
   */
  async executeRecoveryStrategy(error, classification, context, errorId) {
    switch (classification.strategy) {
      case RECOVERY_STRATEGIES.RETRY:
        return await this.executeRetryStrategy(error, classification, context, errorId);
        
      case RECOVERY_STRATEGIES.ROLLBACK:
        return await this.executeRollbackStrategy(error, classification, context, errorId);
        
      case RECOVERY_STRATEGIES.SKIP:
        return await this.executeSkipStrategy(error, classification, context, errorId);
        
      case RECOVERY_STRATEGIES.FAIL_FAST:
        return await this.executeFailFastStrategy(error, classification, context, errorId);
        
      case RECOVERY_STRATEGIES.MANUAL_INTERVENTION:
        return await this.executeManualInterventionStrategy(error, classification, context, errorId);
        
      default:
        return {
          success: false,
          reason: `Unknown recovery strategy: ${classification.strategy}`
        };
    }
  }

  /**
   * Execute retry strategy with exponential backoff
   */
  async executeRetryStrategy(error, classification, context, errorId) {
    const retryConfig = RETRY_CONFIG[classification.type] || RETRY_CONFIG[ERROR_TYPES.NETWORK];
    const operation = context.operation;
    
    if (!operation) {
      return {
        success: false,
        reason: 'No operation provided for retry'
      };
    }
    
    console.log(`🔄 Attempting retry for error ${errorId} (max ${retryConfig.maxRetries} attempts)`);
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(
          retryConfig.baseDelay,
          attempt,
          retryConfig.backoffMultiplier,
          retryConfig.maxDelay,
          retryConfig.jitter
        );
        
        if (attempt > 1) {
          console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt}/${retryConfig.maxRetries}`);
          await this.sleep(delay);
        }
        
        console.log(`🔄 Retry attempt ${attempt}/${retryConfig.maxRetries} for error ${errorId}`);
        
        // Execute the operation again
        const result = await operation();
        
        console.log(`✅ Retry attempt ${attempt} succeeded for error ${errorId}`);
        this.stats.recoveryAttempts += attempt;
        
        return {
          success: true,
          attempts: attempt,
          result
        };
        
      } catch (retryError) {
        console.warn(`⚠️  Retry attempt ${attempt} failed for error ${errorId}: ${retryError.message}`);
        
        // Check if we should continue retrying
        const retryClassification = this.classifyError(retryError, context);
        if (retryClassification.strategy !== RECOVERY_STRATEGIES.RETRY) {
          console.log(`🛑 Stopping retries for error ${errorId} due to error type change: ${retryClassification.type}`);
          break;
        }
        
        if (attempt === retryConfig.maxRetries) {
          this.stats.recoveryAttempts += attempt;
          return {
            success: false,
            reason: `All ${retryConfig.maxRetries} retry attempts failed. Last error: ${retryError.message}`,
            attempts: attempt
          };
        }
      }
    }
    
    return {
      success: false,
      reason: 'Retry strategy terminated early',
      attempts: retryConfig.maxRetries
    };
  }

  /**
   * Execute rollback strategy
   */
  async executeRollbackStrategy(error, classification, context, errorId) {
    console.log(`🔙 Executing rollback for error ${errorId}`);
    
    if (this.rollbackStack.length === 0) {
      return {
        success: false,
        reason: 'No rollback operations available'
      };
    }
    
    const rollbackResults = [];
    let rollbackSuccess = true;
    
    // Execute rollback operations in reverse order
    while (this.rollbackStack.length > 0) {
      const rollbackOp = this.rollbackStack.pop();
      
      try {
        console.log(`🔙 Rolling back: ${rollbackOp.description}`);
        const result = await rollbackOp.operation();
        
        rollbackResults.push({
          description: rollbackOp.description,
          success: true,
          result
        });
        
        console.log(`✅ Rollback completed: ${rollbackOp.description}`);
        
      } catch (rollbackError) {
        console.error(`❌ Rollback failed: ${rollbackOp.description} - ${rollbackError.message}`);
        
        rollbackResults.push({
          description: rollbackOp.description,
          success: false,
          error: rollbackError.message
        });
        
        rollbackSuccess = false;
      }
    }
    
    return {
      success: rollbackSuccess,
      reason: rollbackSuccess ? 'Rollback completed successfully' : 'Some rollback operations failed',
      rollbackResults
    };
  }

  /**
   * Execute skip strategy
   */
  async executeSkipStrategy(error, classification, context, errorId) {
    console.log(`⏭️  Skipping error ${errorId} (${classification.type})`);
    
    // Log the skip for audit purposes
    const skipEntry = {
      errorId,
      timestamp: new Date().toISOString(),
      reason: 'Error classified as skippable',
      context
    };
    
    return {
      success: true,
      reason: 'Error skipped as per classification',
      skipEntry
    };
  }

  /**
   * Execute fail-fast strategy
   */
  async executeFailFastStrategy(error, classification, context, errorId) {
    console.error(`🛑 Fail-fast triggered for error ${errorId} (${classification.type})`);
    
    // Attempt cleanup before failing
    try {
      await this.executeRollbackStrategy(error, classification, context, errorId);
    } catch (cleanupError) {
      console.error(`❌ Cleanup during fail-fast failed: ${cleanupError.message}`);
    }
    
    return {
      success: false,
      reason: `Critical error requires immediate failure: ${error.message}`,
      failFast: true
    };
  }

  /**
   * Execute manual intervention strategy
   */
  async executeManualInterventionStrategy(error, classification, context, errorId) {
    console.warn(`👤 Manual intervention required for error ${errorId} (${classification.type})`);
    
    const interventionGuide = this.generateInterventionGuide(error, classification, context);
    
    console.log('📋 Manual Intervention Guide:');
    interventionGuide.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    
    return {
      success: false,
      reason: 'Manual intervention required',
      interventionGuide,
      requiresManualAction: true
    };
  }

  /**
   * Generate intervention guide for manual errors
   */
  generateInterventionGuide(error, classification, context) {
    const guide = {
      errorType: classification.type,
      severity: classification.severity,
      steps: [],
      resources: []
    };
    
    switch (classification.type) {
      case ERROR_TYPES.PREREQUISITES:
        guide.steps = [
          'Check that all required dependencies are installed',
          'Verify Node.js version is 16.x or higher',
          'Ensure Docker is running if using LocalStack',
          'Check that all required directories exist',
          'Run system diagnostics: npm run health-check'
        ];
        guide.resources = [
          'Installation guide: docs/INSTALLATION.md',
          'Prerequisites checklist: docs/PREREQUISITES.md'
        ];
        break;
        
      case ERROR_TYPES.CONFIGURATION:
        guide.steps = [
          'Review configuration file: scripts/data-config.js',
          'Check environment variables in .env files',
          'Validate service endpoints and credentials',
          'Run configuration validation: npm run validate --workspace=scripts/documentation-analysis-config',
          'Compare with working configuration examples'
        ];
        guide.resources = [
          'Configuration guide: docs/CONFIGURATION.md',
          'Environment setup: docs/ENVIRONMENT.md'
        ];
        break;
        
      case ERROR_TYPES.SERVICE_UNAVAILABLE:
        guide.steps = [
          'Check if LocalStack is running: docker ps',
          'Restart LocalStack services: docker-compose up localstack',
          'Verify service health: npm run health-check',
          'Check network connectivity and firewall settings',
          'Review LocalStack logs for errors'
        ];
        guide.resources = [
          'LocalStack troubleshooting: docs/LOCALSTACK.md',
          'Service diagnostics: docs/DIAGNOSTICS.md'
        ];
        break;
        
      case ERROR_TYPES.PERMISSION:
        guide.steps = [
          'Check file and directory permissions',
          'Ensure current user has write access to project directories',
          'On Windows: Run as administrator if needed',
          'On Unix: Check ownership and chmod settings',
          'Verify Docker permissions for volume mounts'
        ];
        guide.resources = [
          'Permission troubleshooting: docs/PERMISSIONS.md',
          'Docker setup: docs/DOCKER.md'
        ];
        break;
        
      case ERROR_TYPES.RESOURCE_EXHAUSTION:
        guide.steps = [
          'Check available disk space: df -h (Unix) or dir (Windows)',
          'Monitor memory usage and close unnecessary applications',
          'Clear temporary files and caches',
          'Increase Docker memory limits if using containers',
          'Consider processing data in smaller batches'
        ];
        guide.resources = [
          'Resource monitoring: docs/MONITORING.md',
          'Performance tuning: docs/PERFORMANCE.md'
        ];
        break;
        
      default:
        guide.steps = [
          'Review the error message and stack trace',
          'Check recent changes to code or configuration',
          'Search for similar issues in documentation',
          'Enable debug logging for more details',
          'Contact support with error details'
        ];
        guide.resources = [
          'Troubleshooting guide: docs/TROUBLESHOOTING.md',
          'Support: docs/SUPPORT.md'
        ];
    }
    
    return guide;
  }

  /**
   * Add rollback operation to stack
   */
  addRollbackOperation(description, operation) {
    this.rollbackStack.push({
      description,
      operation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clear rollback stack
   */
  clearRollbackStack() {
    this.rollbackStack.length = 0;
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(baseDelay, attempt, multiplier, maxDelay, jitter) {
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, maxDelay);
    
    // Add jitter to prevent thundering herd
    if (jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.round(delay);
  }

  /**
   * Update error statistics
   */
  updateStats(classification) {
    this.stats.totalErrors++;
    
    if (!this.stats.errorsByType[classification.type]) {
      this.stats.errorsByType[classification.type] = 0;
    }
    this.stats.errorsByType[classification.type]++;
    
    if (!this.stats.errorsBySeverity[classification.severity]) {
      this.stats.errorsBySeverity[classification.severity] = 0;
    }
    this.stats.errorsBySeverity[classification.severity]++;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get error statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get error log
   */
  getErrorLog(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors() {
    return this.errorLog.filter(entry => !entry.resolved);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog.length = 0;
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0
    };
  }

  /**
   * Export error log to file
   */
  async exportErrorLog(filePath) {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        stats: this.stats,
        errors: this.errorLog
      };
      
      const content = JSON.stringify(exportData, null, 2);
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`📄 Error log exported to: ${filePath}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to export error log: ${error.message}`);
      return false;
    }
  }

  /**
   * Sleep utility for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create error handler with context
   */
  createContextualHandler(context) {
    return async (error) => {
      return await this.handleError(error, context);
    };
  }

  /**
   * Wrap function with error handling
   */
  wrapWithErrorHandling(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const recoveryResult = await this.handleError(error, {
          ...context,
          operation: () => fn(...args)
        });
        
        if (recoveryResult.success) {
          return recoveryResult.result;
        } else {
          throw error;
        }
      }
    };
  }
}

// Export classes and constants
module.exports = {
  ErrorHandler,
  ERROR_TYPES,
  RECOVERY_STRATEGIES,
  ERROR_SEVERITY,
  RETRY_CONFIG
};

// CLI usage when run directly
if (require.main === module) {
  const errorHandler = new ErrorHandler();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      switch (command) {
        case 'stats':
          const stats = errorHandler.getStats();
          console.log('📊 Error Handler Statistics:');
          console.log(JSON.stringify(stats, null, 2));
          break;
          
        case 'log':
          const limit = parseInt(args[1]) || 50;
          const log = errorHandler.getErrorLog(limit);
          console.log(`📋 Error Log (last ${limit} entries):`);
          log.forEach(entry => {
            console.log(`${entry.timestamp} [${entry.classification.type}] ${entry.error.message}`);
          });
          break;
          
        case 'unresolved':
          const unresolved = errorHandler.getUnresolvedErrors();
          console.log(`⚠️  Unresolved Errors (${unresolved.length}):`);
          unresolved.forEach(entry => {
            console.log(`${entry.id}: ${entry.error.message}`);
          });
          break;
          
        case 'export':
          const filePath = args[1] || 'error-log.json';
          const exported = await errorHandler.exportErrorLog(filePath);
          if (exported) {
            console.log('✅ Error log exported successfully');
          } else {
            console.log('❌ Error log export failed');
            process.exit(1);
          }
          break;
          
        case 'test':
          // Test error classification
          const testErrors = [
            new Error('Connection refused'),
            new Error('File not found'),
            new Error('Invalid configuration'),
            new Error('Permission denied'),
            new Error('Out of memory')
          ];
          
          console.log('🧪 Testing error classification:');
          testErrors.forEach(error => {
            const classification = errorHandler.classifyError(error);
            console.log(`"${error.message}" -> ${classification.type} (${classification.severity}) -> ${classification.strategy}`);
          });
          break;
          
        default:
          console.log('🛠️  Error Handler Usage:');
          console.log('  node error-handler.js stats');
          console.log('  node error-handler.js log [limit]');
          console.log('  node error-handler.js unresolved');
          console.log('  node error-handler.js export [file]');
          console.log('  node error-handler.js test');
          console.log('\nExamples:');
          console.log('  node error-handler.js log 10');
          console.log('  node error-handler.js export errors.json');
          process.exit(1);
      }
      
      console.log('✅ Error handler operation completed');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error handler operation failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}