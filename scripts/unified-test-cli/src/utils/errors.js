/**
 * Custom Error Classes - Comprehensive error handling for the unified test CLI
 * 
 * Provides structured error classes with recovery suggestions and user-friendly messages.
 */

/**
 * Base error class for all CLI errors
 */
export class CLIError extends Error {
  constructor(message, code = 'CLI_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.suggestions = [];
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Add recovery suggestions to the error
   * @param {Array<string>} suggestions - Array of suggestion strings
   * @returns {CLIError} This error instance for chaining
   */
  withSuggestions(suggestions) {
    this.suggestions = Array.isArray(suggestions) ? suggestions : [suggestions];
    return this;
  }

  /**
   * Add additional details to the error
   * @param {Object} details - Additional error details
   * @returns {CLIError} This error instance for chaining
   */
  withDetails(details) {
    this.details = { ...this.details, ...details };
    return this;
  }

  /**
   * Get user-friendly error message with suggestions
   * @returns {string} Formatted error message
   */
  getUserMessage() {
    let message = this.message;
    
    if (this.suggestions.length > 0) {
      message += '\n\nSuggested solutions:';
      this.suggestions.forEach((suggestion, index) => {
        message += `\n  ${index + 1}. ${suggestion}`;
      });
    }
    
    return message;
  }

  /**
   * Convert error to JSON for structured logging
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Service validation error with specific service context
 */
export class ServiceValidationError extends CLIError {
  constructor(service, details, originalErrorOrSuggestions = null) {
    const message = `Service ${service} is not available: ${details}`;
    super(message, 'SERVICE_VALIDATION_ERROR', { service });
    
    this.service = service;
    this.details = details; // Store details as a string property for backward compatibility
    
    // Handle third parameter - could be originalError or suggestions array
    if (Array.isArray(originalErrorOrSuggestions)) {
      // Third parameter is suggestions array
      this.originalError = null;
      this.withSuggestions(originalErrorOrSuggestions);
    } else {
      // Third parameter is originalError (or null)
      this.originalError = originalErrorOrSuggestions;
      // Add service-specific suggestions
      this.withSuggestions(this.generateServiceSuggestions(service));
    }
  }

  /**
   * Generate service-specific recovery suggestions
   * @param {string} service - Service name
   * @returns {Array<string>} Array of suggestions
   */
  generateServiceSuggestions(service) {
    const suggestions = {
      'localstack': [
        'Start LocalStack: npm run local:start',
        'Check Docker: docker ps | grep localstack',
        'View logs: npm run local:logs:localstack',
        'Reset LocalStack: npm run local:reset',
        'Verify Docker is running: docker --version'
      ],
      'frontend': [
        'Start frontend: npm run dev --workspace=frontend',
        'Check port 3000: netstat -an | findstr 3000',
        'Install dependencies: npm install --workspace=frontend',
        'Check Next.js config: Verify next.config.mjs'
      ],
      'backend': [
        'Start backend: npm run dev --workspace=backend',
        'Check LocalStack: Ensure LocalStack is running first',
        'Deploy functions: npm run deploy --workspace=backend',
        'Verify Lambda functions: Check backend/src/handlers/'
      ]
    };

    return suggestions[service] || [
      `Check if ${service} service is running`,
      `Review ${service} configuration`,
      `Check ${service} logs for errors`,
      `Restart ${service} service`
    ];
  }
}

/**
 * Data seeding error with scenario context
 */
export class DataSeedingError extends CLIError {
  constructor(scenario, originalError, phase = 'seeding') {
    const message = `Failed to ${phase === 'seeding' ? 'seed' : phase} data scenario '${scenario}': ${originalError.message}`;
    super(message, 'DATA_SEEDING_ERROR', { scenario, phase });
    
    this.scenario = scenario;
    this.originalError = originalError;
    this.phase = phase;
    
    this.withSuggestions([
      'Check LocalStack is running: npm run local:start',
      'Verify data-cli.js is accessible',
      'Check scenario configuration in config/data-scenarios.json',
      'Try resetting data: npm run data:reset',
      'Check available disk space and permissions'
    ]);
  }
}

/**
 * Test execution error with suite context
 */
export class TestExecutionError extends CLIError {
  constructor(suite, exitCode, stderr, phase = 'execution') {
    const message = `Test suite '${suite}' failed during ${phase} with exit code ${exitCode}`;
    super(message, 'TEST_EXECUTION_ERROR', { suite, exitCode, stderr, phase });
    
    this.suite = suite;
    this.exitCode = exitCode;
    this.stderr = stderr;
    this.phase = phase;
    
    this.withSuggestions(this.generateTestSuggestions(suite, exitCode));
  }

  /**
   * Generate test-specific recovery suggestions
   * @param {string} suite - Test suite name
   * @param {number} exitCode - Exit code from test execution
   * @returns {Array<string>} Array of suggestions
   */
  generateTestSuggestions(suite, exitCode) {
    const suggestions = [];
    
    // Exit code specific suggestions
    if (exitCode === 1) {
      suggestions.push('Check test failures in the output above');
      suggestions.push('Run tests individually to isolate issues');
    } else if (exitCode === 130) {
      suggestions.push('Test execution was interrupted (SIGINT)');
      suggestions.push('Try running tests again');
    } else if (exitCode === 137) {
      suggestions.push('Test execution was killed (SIGKILL) - possibly out of memory');
      suggestions.push('Increase available memory or reduce test parallelism');
    }
    
    // Suite-specific suggestions
    if (suite.includes('frontend')) {
      suggestions.push('Ensure frontend dependencies are installed: npm install --workspace=frontend');
      suggestions.push('Check Next.js configuration and build status');
    } else if (suite.includes('backend')) {
      suggestions.push('Ensure backend dependencies are installed: npm install --workspace=backend');
      suggestions.push('Verify LocalStack services are running');
    } else if (suite.includes('e2e')) {
      suggestions.push('Check if frontend is running and accessible');
      suggestions.push('Verify test data is properly seeded');
      suggestions.push('Check browser dependencies for Playwright');
    }
    
    // General suggestions
    suggestions.push('Check the test output for specific error messages');
    suggestions.push('Verify all required services are running');
    suggestions.push('Try running with --verbose for more details');
    
    return suggestions;
  }
}

/**
 * Configuration error for invalid or missing configuration
 */
export class ConfigurationError extends CLIError {
  constructor(configType, details, configPath = null) {
    const message = `Configuration error in ${configType}: ${details}`;
    super(message, 'CONFIGURATION_ERROR', { configType, configPath });
    
    this.configType = configType;
    this.configPath = configPath;
    
    this.withSuggestions([
      `Check ${configType} configuration file${configPath ? ` at ${configPath}` : ''}`,
      'Verify JSON syntax is valid',
      'Ensure all required fields are present',
      'Compare with example configuration files',
      'Run configuration validation: npm run test:cli validate'
    ]);
  }
}

/**
 * Timeout error for operations that exceed time limits
 */
export class TimeoutError extends CLIError {
  constructor(operation, timeout, details = {}) {
    const message = `Operation '${operation}' timed out after ${timeout}ms`;
    super(message, 'TIMEOUT_ERROR', { operation, timeout, ...details });
    
    this.operation = operation;
    this.timeout = timeout;
    
    this.withSuggestions([
      'Increase timeout value if operation is expected to take longer',
      'Check if services are responding slowly',
      'Verify network connectivity',
      'Check system resources (CPU, memory, disk)',
      'Try running the operation again'
    ]);
  }
}

/**
 * Dependency error for missing or invalid dependencies
 */
export class DependencyError extends CLIError {
  constructor(dependency, details, requiredVersion = null) {
    const message = `Dependency '${dependency}' is not available: ${details}`;
    super(message, 'DEPENDENCY_ERROR', { dependency, requiredVersion });
    
    this.dependency = dependency;
    this.requiredVersion = requiredVersion;
    
    this.withSuggestions(this.generateDependencySuggestions(dependency));
  }

  /**
   * Generate dependency-specific suggestions
   * @param {string} dependency - Dependency name
   * @returns {Array<string>} Array of suggestions
   */
  generateDependencySuggestions(dependency) {
    const suggestions = {
      'node': [
        'Install Node.js from https://nodejs.org/',
        'Check Node.js version: node --version',
        'Update Node.js to the latest LTS version'
      ],
      'npm': [
        'Install npm: npm install -g npm@latest',
        'Check npm version: npm --version',
        'Clear npm cache: npm cache clean --force'
      ],
      'docker': [
        'Install Docker Desktop from https://docker.com/',
        'Start Docker Desktop',
        'Check Docker version: docker --version',
        'Verify Docker is running: docker ps'
      ],
      'git': [
        'Install Git from https://git-scm.com/',
        'Check Git version: git --version',
        'Configure Git: git config --global user.name "Your Name"'
      ]
    };

    return suggestions[dependency] || [
      `Install ${dependency} according to its documentation`,
      `Check ${dependency} version and compatibility`,
      `Verify ${dependency} is in your PATH`,
      `Restart your terminal after installing ${dependency}`
    ];
  }
}

/**
 * Workspace error for workspace-related issues
 */
export class WorkspaceError extends CLIError {
  constructor(workspace, details, operation = 'access') {
    const message = `Workspace '${workspace}' error during ${operation}: ${details}`;
    super(message, 'WORKSPACE_ERROR', { workspace, operation });
    
    this.workspace = workspace;
    this.operation = operation;
    
    this.withSuggestions([
      `Verify workspace directory exists: ${workspace}`,
      'Check file permissions',
      'Ensure you are in the correct project directory',
      'Run npm install to set up workspace dependencies',
      'Check workspace configuration in package.json'
    ]);
  }
}

/**
 * Parallel execution error for issues during parallel test runs
 */
export class ParallelExecutionError extends CLIError {
  constructor(details, failedSuites = []) {
    const message = `Parallel execution failed: ${details}`;
    super(message, 'PARALLEL_EXECUTION_ERROR', { failedSuites });
    
    this.failedSuites = failedSuites;
    
    this.withSuggestions([
      'Try running suites sequentially to isolate issues',
      'Reduce maximum parallel execution limit',
      'Check system resources (CPU, memory)',
      'Verify test suites can run independently',
      'Check for resource conflicts between test suites'
    ]);
  }
}

/**
 * Recovery error for failed recovery attempts
 */
export class RecoveryError extends CLIError {
  constructor(originalError, recoveryAction, recoveryDetails) {
    const message = `Recovery action '${recoveryAction}' failed: ${recoveryDetails}`;
    super(message, 'RECOVERY_ERROR', { originalError: originalError.message, recoveryAction });
    
    this.originalError = originalError;
    this.recoveryAction = recoveryAction;
    
    this.withSuggestions([
      'Manual intervention may be required',
      'Check the original error for root cause',
      'Try alternative recovery methods',
      'Contact support if issue persists',
      'Check system logs for additional details'
    ]);
  }
}

/**
 * Error factory for creating appropriate error types
 */
export class ErrorFactory {
  /**
   * Create an appropriate error based on context
   * @param {Error} originalError - Original error
   * @param {Object} context - Error context
   * @returns {CLIError} Appropriate CLI error instance
   */
  static createError(originalError, context = {}) {
    const { type, service, suite, scenario, workspace, dependency } = context;
    
    switch (type) {
      case 'service':
        return new ServiceValidationError(service, originalError.message, originalError);
      
      case 'data':
        return new DataSeedingError(scenario, originalError, context.phase);
      
      case 'test':
        return new TestExecutionError(suite, context.exitCode, context.stderr, context.phase);
      
      case 'config':
        return new ConfigurationError(context.configType, originalError.message, context.configPath);
      
      case 'timeout':
        return new TimeoutError(context.operation, context.timeout, context.details);
      
      case 'dependency':
        return new DependencyError(dependency, originalError.message, context.requiredVersion);
      
      case 'workspace':
        return new WorkspaceError(workspace, originalError.message, context.operation);
      
      case 'parallel':
        return new ParallelExecutionError(originalError.message, context.failedSuites);
      
      case 'recovery':
        return new RecoveryError(originalError, context.recoveryAction, context.recoveryDetails);
      
      default:
        return new CLIError(originalError.message, 'UNKNOWN_ERROR', context);
    }
  }

  /**
   * Wrap an error with additional context
   * @param {Error} error - Original error
   * @param {Object} context - Additional context
   * @returns {CLIError} Wrapped error
   */
  static wrapError(error, context = {}) {
    if (error instanceof CLIError) {
      return error.withDetails(context);
    }
    
    return this.createError(error, context);
  }
}

/**
 * Error recovery utilities
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from a service validation error
   * @param {ServiceValidationError} error - Service validation error
   * @param {Object} options - Recovery options
   * @returns {Promise<boolean>} True if recovery was successful
   */
  static async recoverFromServiceError(error, options = {}) {
    const { service } = error;
    const { autoRestart = false, timeout = 30000 } = options;
    
    if (!autoRestart) {
      return false;
    }
    
    try {
      // Attempt service-specific recovery
      switch (service) {
        case 'localstack':
          return await this.restartLocalStack(timeout);
        
        case 'frontend':
          return await this.restartFrontend(timeout);
        
        case 'backend':
          return await this.restartBackend(timeout);
        
        default:
          return false;
      }
    } catch (recoveryError) {
      throw new RecoveryError(error, `restart-${service}`, recoveryError.message);
    }
  }

  /**
   * Attempt to recover from a data seeding error
   * @param {DataSeedingError} error - Data seeding error
   * @param {Object} options - Recovery options
   * @returns {Promise<boolean>} True if recovery was successful
   */
  static async recoverFromDataError(error, options = {}) {
    const { scenario } = error;
    const { resetData = false, retryCount = 1 } = options;
    
    try {
      if (resetData) {
        // Reset data and retry seeding
        const { DataManager } = await import('../core/data-manager.js');
        const dataManager = new DataManager();
        
        await dataManager.resetData('clean');
        
        // Retry seeding
        for (let i = 0; i < retryCount; i++) {
          try {
            await dataManager.seedScenario(scenario);
            return true;
          } catch (retryError) {
            if (i === retryCount - 1) {
              throw retryError;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      return false;
    } catch (recoveryError) {
      throw new RecoveryError(error, 'reset-and-retry-data', recoveryError.message);
    }
  }

  /**
   * Restart LocalStack service
   * @param {number} timeout - Timeout for restart operation
   * @returns {Promise<boolean>} True if restart was successful
   */
  static async restartLocalStack(timeout = 30000) {
    // Implementation would depend on the specific LocalStack setup
    // This is a placeholder for the actual restart logic
    return false;
  }

  /**
   * Restart frontend service
   * @param {number} timeout - Timeout for restart operation
   * @returns {Promise<boolean>} True if restart was successful
   */
  static async restartFrontend(timeout = 30000) {
    // Implementation would depend on the specific frontend setup
    // This is a placeholder for the actual restart logic
    return false;
  }

  /**
   * Restart backend service
   * @param {number} timeout - Timeout for restart operation
   * @returns {Promise<boolean>} True if restart was successful
   */
  static async restartBackend(timeout = 30000) {
    // Implementation would depend on the specific backend setup
    // This is a placeholder for the actual restart logic
    return false;
  }
}