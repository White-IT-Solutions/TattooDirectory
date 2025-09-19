#!/usr/bin/env node

/**
 * Data CLI - User-friendly Command Line Interface
 * 
 * Provides a unified, developer-friendly CLI for all data management operations.
 * Supports command parsing, validation, help system, and progress indicators.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { DATA_CONFIG } = require('./data-config');

/**
 * CLI color constants for better user experience
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * CLI symbols for consistent output
 */
const SYMBOLS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  progress: ['▱', '▰'],
  bullet: '•',
  arrow: '→',
  check: '✓',
  cross: '✗'
};

/**
 * Command definitions with descriptions and examples
 */
const COMMANDS = {
  'setup-data': {
    description: 'Set up all data and services for development with enhanced frontend-sync-processor',
    usage: 'setup-data [options]',
    options: [
      { flag: '--frontend-only', description: 'Generate enhanced mock data without AWS services (includes business data, ratings, pricing)' },
      { flag: '--images-only', description: 'Process and upload images only' },
      { flag: '--force', description: 'Force full processing, ignore incremental changes' },
      { flag: '--scenario <name>', description: 'Use specific scenario for setup (supports enhanced scenarios with business data)' },
      { flag: '--export', description: 'Export generated data to file for reuse' },
      { flag: '--validate', description: 'Validate data consistency and structure during generation' }
    ],
    examples: [
      'setup-data',
      'setup-data --frontend-only --export',
      'setup-data --force --scenario london-focused --validate',
      'setup-data --frontend-only --scenario high-rated'
    ],
    requirements: ['1.1', '2.1', '8.1', '8.2', '13.1', '13.2', '13.3', '13.4']
  },
  'reset-data': {
    description: 'Reset system to specific state',
    usage: 'reset-data [state]',
    options: [
      { flag: 'clean', description: 'Empty databases but keep services running' },
      { flag: 'fresh', description: 'Clean databases and seed with full dataset (default)' },
      { flag: 'minimal', description: 'Minimal data for quick testing' },
      { flag: 'search-ready', description: 'Optimized for search testing' },
      { flag: 'location-test', description: 'Location-based testing data' },
      { flag: 'style-test', description: 'Style filtering testing data' },
      { flag: 'performance-test', description: 'Performance testing dataset' },
      { flag: 'frontend-ready', description: 'Minimal data for frontend development' }
    ],
    examples: [
      'reset-data',
      'reset-data fresh',
      'reset-data minimal'
    ],
    requirements: ['4.1', '4.2', '4.3', '4.4', '4.5']
  },
  'seed-scenario': {
    description: 'Seed system with enhanced test scenarios including business data and realistic profiles',
    usage: 'seed-scenario <scenario-name>',
    options: [
      { flag: 'minimal', description: 'Quick testing with minimal data (3 artists with business data)' },
      { flag: 'search-basic', description: 'Basic search functionality testing (5 artists with ratings/pricing)' },
      { flag: 'london-artists', description: 'London-focused artist testing (5 artists with studio relationships)' },
      { flag: 'london-focused', description: 'Enhanced London-focused testing with comprehensive studio data (10 artists)' },
      { flag: 'high-rated', description: 'High-rated artists for quality testing (3 artists, 4.5+ ratings)' },
      { flag: 'new-artists', description: 'Recently added artists with experience data (4 artists)' },
      { flag: 'booking-available', description: 'Artists with open booking slots and availability data (6 artists)' },
      { flag: 'portfolio-rich', description: 'Artists with extensive portfolios and style metadata (4 artists)' },
      { flag: 'multi-style', description: 'Artists with multiple style specializations and characteristics (3 artists)' },
      { flag: 'style-diverse', description: 'Diverse styles for filtering tests with enhanced metadata (12 artists)' },
      { flag: 'pricing-range', description: 'Mid-range pricing testing with detailed pricing data (5 artists)' },
      { flag: 'full-dataset', description: 'Complete test dataset with all enhanced features (10 artists)' },
      { flag: 'empty', description: 'Empty results for testing no-data states (0 artists)' },
      { flag: 'single', description: 'Single result for minimal data display testing (1 artist)' },
      { flag: 'performance-test', description: 'Large dataset for performance testing (50+ artists)' }
    ],
    examples: [
      'seed-scenario minimal',
      'seed-scenario london-focused',
      'seed-scenario style-diverse',
      'seed-scenario performance-test'
    ],
    requirements: ['3.1', '3.2', '3.3', '13.3', '13.4', '13.5']
  },
  'validate-data': {
    description: 'Validate data consistency, integrity, and enhanced frontend-sync-processor data structures',
    usage: 'validate-data [type]',
    options: [
      { flag: 'all', description: 'Comprehensive validation including enhanced data structures (default)' },
      { flag: 'consistency', description: 'Cross-service data consistency and frontend-sync alignment' },
      { flag: 'images', description: 'Image accessibility and integrity' },
      { flag: 'scenarios', description: 'Enhanced scenario data integrity with business data validation' },
      { flag: 'frontend', description: 'Frontend mock data structure and content validation' },
      { flag: 'business-data', description: 'Business data validation (ratings, pricing, availability, experience)' },
      { flag: 'studio-relationships', description: 'Artist-studio relationship validation and bidirectional linking' }
    ],
    examples: [
      'validate-data',
      'validate-data frontend',
      'validate-data business-data',
      'validate-data studio-relationships'
    ],
    requirements: ['5.3', '5.4', '5.5', '5.6', '13.8', '14.6', '14.7']
  },
  'health-check': {
    description: 'Check service connectivity and health',
    usage: 'health-check',
    options: [],
    examples: ['health-check'],
    requirements: ['5.1', '5.2', '5.7']
  },
  'data-status': {
    description: 'Display current system state and data counts',
    usage: 'data-status',
    options: [],
    examples: ['data-status'],
    requirements: ['5.1', '5.2', '5.7']
  },
  'scenarios': {
    description: 'List available scenarios',
    usage: 'scenarios',
    options: [],
    examples: ['scenarios'],
    requirements: []
  },
  'reset-states': {
    description: 'List available reset states',
    usage: 'reset-states',
    options: [],
    examples: ['reset-states'],
    requirements: []
  },
  'frontend-sync': {
    description: 'Enhanced frontend sync processor with advanced mock data generation',
    usage: 'frontend-sync <command> [options]',
    options: [
      { flag: 'generate [count]', description: 'Generate mock artists with business data' },
      { flag: 'scenario <name>', description: 'Generate specific enhanced scenario' },
      { flag: 'validate', description: 'Validate existing mock data structure' },
      { flag: 'export <scenario>', description: 'Export data to file with validation' },
      { flag: 'error <type>', description: 'Generate RFC 9457 compliant error response' },
      { flag: 'performance', description: 'Generate performance test data' },
      { flag: 'studios', description: 'Generate and display studio data' }
    ],
    examples: [
      'frontend-sync generate --count 10 --scenario normal',
      'frontend-sync scenario london-focused --export',
      'frontend-sync error validation --instance /v1/search',
      'frontend-sync performance --count 50'
    ],
    requirements: ['13.1', '13.2', '13.3', '13.4', '13.5', '13.6', '13.7', '13.8', '13.9', '13.10']
  },
  'help': {
    description: 'Show help information',
    usage: 'help [command]',
    options: [],
    examples: ['help', 'help setup-data', 'help frontend-sync'],
    requirements: []
  }
};

/**
 * DataCLI class - Main CLI interface
 */
class DataCLI {
  constructor() {
    this.manager = new UnifiedDataManager();
    this.config = DATA_CONFIG;
    this.spinner = null;
    this.spinnerInterval = null;
    this.progressBar = null;
    this.progressBarInterval = null;
    
    // Progress tracking
    this.currentProgress = {
      current: 0,
      total: 0,
      message: '',
      startTime: null
    };
    
    // Bind methods to preserve context
    this.handleCommand = this.handleCommand.bind(this);
    this.showHelp = this.showHelp.bind(this);
    this.startSpinner = this.startSpinner.bind(this);
    this.stopSpinner = this.stopSpinner.bind(this);
    this.startProgressBar = this.startProgressBar.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.stopProgressBar = this.stopProgressBar.bind(this);
  }

  /**
   * Parse command line arguments
   */
  parseArguments(args) {
    if (args.length === 0) {
      return { command: 'help', args: [], options: {} };
    }

    const command = args[0];
    const remainingArgs = args.slice(1);
    const options = {};
    const positionalArgs = [];

    // Parse options and flags
    for (let i = 0; i < remainingArgs.length; i++) {
      const arg = remainingArgs[i];
      
      if (arg.startsWith('--')) {
        const flagName = arg.substring(2);
        
        // Check if next argument is a value for this flag
        if (i + 1 < remainingArgs.length && !remainingArgs[i + 1].startsWith('--')) {
          options[flagName] = remainingArgs[i + 1];
          i++; // Skip the value argument
        } else {
          options[flagName] = true;
        }
      } else if (arg.startsWith('-')) {
        // Handle short flags
        const flagName = arg.substring(1);
        options[flagName] = true;
      } else {
        // Positional argument
        positionalArgs.push(arg);
      }
    }

    return {
      command,
      args: positionalArgs,
      options
    };
  }

  /**
   * Validate command and arguments
   */
  validateCommand(command, args, options) {
    const errors = [];
    const warnings = [];

    // Check if command exists
    if (!COMMANDS[command] && command !== 'help') {
      errors.push(`Unknown command: ${command}`);
      return { isValid: false, errors, warnings };
    }

    // Command-specific validation
    switch (command) {
      case 'seed-scenario':
        if (args.length === 0) {
          errors.push('Scenario name is required');
        } else {
          const scenarioName = args[0];
          try {
            this.config.getScenarioConfig(scenarioName);
          } catch (error) {
            errors.push(`Invalid scenario: ${scenarioName}`);
            warnings.push(`Available scenarios: ${Object.keys(this.config.scenarios).join(', ')}`);
          }
        }
        break;

      case 'reset-data':
        if (args.length > 0) {
          const stateName = args[0];
          try {
            this.config.getResetStateConfig(stateName);
          } catch (error) {
            errors.push(`Invalid reset state: ${stateName}`);
            warnings.push(`Available states: ${Object.keys(this.config.resetStates).join(', ')}`);
          }
        }
        break;

      case 'validate-data':
        if (args.length > 0) {
          const validationType = args[0];
          const validTypes = ['all', 'consistency', 'images', 'scenarios'];
          if (!validTypes.includes(validationType)) {
            errors.push(`Invalid validation type: ${validationType}`);
            warnings.push(`Available types: ${validTypes.join(', ')}`);
          }
        }
        break;

      case 'setup-data':
        // Check for conflicting options
        if (options['frontend-only'] && options['images-only']) {
          errors.push('Cannot use --frontend-only and --images-only together');
        }
        
        // Validate scenario if provided
        if (options.scenario) {
          try {
            this.config.getScenarioConfig(options.scenario);
          } catch (error) {
            errors.push(`Invalid scenario: ${options.scenario}`);
            warnings.push(`Available scenarios: ${Object.keys(this.config.scenarios).join(', ')}`);
          }
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Handle command execution
   */
  async handleCommand(command, args, options) {
    try {
      switch (command) {
        case 'setup-data':
          return await this.handleSetupData(args, options);
        case 'reset-data':
          return await this.handleResetData(args, options);
        case 'seed-scenario':
          return await this.handleSeedScenario(args, options);
        case 'validate-data':
          return await this.handleValidateData(args, options);
        case 'health-check':
          return await this.handleHealthCheck(args, options);
        case 'data-status':
          return await this.handleDataStatus(args, options);
        case 'help':
          this.showHelp(args[0]);
          return true;
        case 'scenarios':
          this.showAvailableScenarios();
          return true;
        case 'reset-states':
          this.showAvailableResetStates();
          return true;
        default:
          this.printError(`Unknown command: ${command}`);
          this.showHelp();
          return false;
      }
    } catch (error) {
      this.handleError(error, command);
      return false;
    }
  }

  /**
   * Handle setup-data command
   */
  async handleSetupData(args, options) {
    const startTime = Date.now();
    const setupOptions = {
      frontendOnly: options['frontend-only'] || false,
      imagesOnly: options['images-only'] || false,
      force: options.force || false,
      scenario: options.scenario || null
    };

    this.printInfo('Starting data setup...');
    
    // Show operation mode
    if (setupOptions.frontendOnly) {
      this.printInfo('🎨 Frontend-only mode: Generating mock data without AWS services');
    } else if (setupOptions.imagesOnly) {
      this.printInfo('🖼️  Images-only mode: Processing and uploading images only');
    } else if (setupOptions.force) {
      this.printInfo('🔄 Force mode: Full processing, ignoring incremental changes');
    } else {
      this.printInfo('⚡ Incremental mode: Processing only changed files');
    }

    if (setupOptions.scenario) {
      this.printInfo(`🎯 Using scenario: ${setupOptions.scenario}`);
    }

    // Start progress tracking
    const totalSteps = setupOptions.frontendOnly ? 2 : (setupOptions.imagesOnly ? 3 : 6);
    this.startProgressBar('Initializing setup', totalSteps);

    try {
      // Create progress callback for the manager
      const progressCallback = (step, total, message) => {
        this.showStepProgress(step, total, message);
        this.updateProgress(step, message);
      };

      const result = await this.manager.setupData({
        ...setupOptions,
        progressCallback
      });
      
      this.stopProgressBar();

      if (result.success) {
        this.displaySetupResults(result, setupOptions);
        this.displayOperationSummary('setup-data', result, startTime);
        this.showPerformanceMetrics('setup-data', Date.now() - startTime, result.results);
        this.checkAndDisplayResourceWarnings();
        return true;
      } else {
        this.printError(`Setup failed: ${result.error}`);
        this.provideTroubleshootingGuidance('setup-data', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle reset-data command
   */
  async handleResetData(args, options) {
    const startTime = Date.now();
    const state = args[0] || 'fresh';
    
    this.printInfo(`🔄 Resetting data to '${state}' state...`);
    
    // Get and display state description
    try {
      const stateConfig = this.config.getResetStateConfig(state);
      this.printInfo(`📋 ${stateConfig.description}`);
    } catch (error) {
      // Error already handled in validation
    }

    // Determine number of steps based on reset state
    const stateConfig = this.config.resetStates[state] || {};
    let totalSteps = 1; // Always clear
    if (stateConfig.seedFull || stateConfig.scenario) totalSteps += 2; // Seed + index
    if (stateConfig.frontendOnly) totalSteps += 1; // Frontend update
    
    this.startProgressBar(`Resetting to ${state}`, totalSteps);

    try {
      // Show step progress
      this.showStepProgress(1, totalSteps, 'Clearing existing data');
      this.updateProgress(1, 'Clearing databases');

      const result = await this.manager.resetData(state);
      
      this.stopProgressBar();

      if (result.success) {
        this.displayResetResults(result, state);
        this.displayOperationSummary('reset-data', result, startTime);
        return true;
      } else {
        this.printError(`Reset failed: ${result.error}`);
        this.provideTroubleshootingGuidance('reset-data', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle seed-scenario command
   */
  async handleSeedScenario(args, options) {
    const startTime = Date.now();
    const scenarioName = args[0];
    
    // Get and display scenario description
    const scenarioConfig = this.config.getScenarioConfig(scenarioName);
    this.printInfo(`🎯 Seeding scenario: ${scenarioName}`);
    this.printInfo(`📋 ${scenarioConfig.description} (${scenarioConfig.artistCount} artists)`);

    // Scenario seeding typically involves: clear, seed, index, frontend sync
    this.startProgressBar(`Seeding ${scenarioName}`, 4);

    try {
      this.showStepProgress(1, 4, 'Preparing scenario data');
      this.updateProgress(1, 'Clearing existing data');

      const result = await this.manager.seedScenario(scenarioName);
      
      this.stopProgressBar();

      if (result.success) {
        this.displayScenarioResults(result, scenarioName);
        this.displayOperationSummary('seed-scenario', result, startTime);
        return true;
      } else {
        this.printError(`Scenario seeding failed: ${result.error}`);
        this.provideTroubleshootingGuidance('seed-scenario', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle validate-data command
   */
  async handleValidateData(args, options) {
    const validationType = args[0] || 'all';
    
    this.printInfo(`Validating data (type: ${validationType})...`);
    this.startSpinner(`Running ${validationType} validation`);

    try {
      const result = await this.manager.validateData(validationType);
      this.stopSpinner();

      if (result.success) {
        this.displayValidationResults(result, validationType);
        return true;
      } else {
        this.printError(`Validation failed: ${result.error}`);
        this.provideTroubleshootingGuidance('validate-data', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Handle health-check command
   */
  async handleHealthCheck(args, options) {
    this.printInfo('Performing health check...');
    this.startSpinner('Checking service connectivity');

    try {
      const result = await this.manager.healthCheck();
      this.stopSpinner();

      if (result.success) {
        this.displayHealthResults(result);
        return true;
      } else {
        this.printError(`Health check failed: ${result.error}`);
        this.provideTroubleshootingGuidance('health-check', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Handle data-status command
   */
  async handleDataStatus(args, options) {
    this.printInfo('Getting system status...');
    this.startSpinner('Retrieving system information');

    try {
      const result = await this.manager.getDataStatus();
      this.stopSpinner();

      if (result.success) {
        this.displayStatusResults(result);
        return true;
      } else {
        this.printError(`Failed to get system status: ${result.error}`);
        this.provideTroubleshootingGuidance('data-status', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Display setup results
   */
  displaySetupResults(result, options) {
    this.printSuccess('Setup completed successfully!');
    console.log('');

    if (options.frontendOnly) {
      this.printSection('Frontend-only setup summary:');
      if (result.results && result.results.frontend) {
        this.printBullet(`Generated ${result.results.frontend.artistCount || 0} mock artists`);
        this.printBullet('Updated frontend mock data file');
      }
      this.printHighlight('Frontend ready for development!');
    } else if (options.imagesOnly) {
      this.printSection('Images-only setup summary:');
      if (result.results && result.results.images) {
        this.printBullet(`Processed ${result.results.images.processed || 0} images`);
        this.printBullet(`Uploaded ${result.results.images.uploaded || 0} images to S3`);
        if (result.results.images.failed > 0) {
          this.printWarning(`${result.results.images.failed} images failed to process`);
        }
      }
      this.printHighlight('Images ready for development!');
    } else {
      this.printSection('Full setup summary:');
      if (result.results) {
        if (result.results.images) {
          this.printBullet(`Processed ${result.results.images.processed || 0} images`);
        }
        if (result.results.database) {
          this.printBullet(`Seeded ${result.results.database.artists || 0} artists`);
        }
        if (result.results.opensearch) {
          this.printBullet(`Indexed ${result.results.opensearch.documents || 0} documents`);
        }
        if (result.results.frontend) {
          this.printBullet('Updated frontend mock data');
        }
      }
      this.printHighlight('All services ready for development!');
    }

    this.printNextSteps();
  }

  /**
   * Display reset results
   */
  displayResetResults(result, state) {
    this.printSuccess(`Data reset to '${state}' completed successfully!`);
    console.log('');

    if (result.results) {
      this.printSection('Reset summary:');
      if (result.results.cleared) {
        this.printBullet('Cleared existing data');
      }
      if (result.results.seeded) {
        this.printBullet('Seeded new data');
        if (result.results.seedStats) {
          const stats = result.results.seedStats;
          if (stats.artists) this.printBullet(`  ${SYMBOLS.arrow} ${stats.artists.loaded || 0} artists`);
          if (stats.studios) this.printBullet(`  ${SYMBOLS.arrow} ${stats.studios.loaded || 0} studios`);
        }
      }
      if (result.results.frontendUpdated) {
        this.printBullet('Updated frontend mock data');
      }
    }

    this.printNextSteps();
  }

  /**
   * Display scenario results
   */
  displayScenarioResults(result, scenarioName) {
    this.printSuccess(`Scenario '${scenarioName}' seeded successfully!`);
    console.log('');

    if (result.results) {
      this.printSection('Scenario summary:');
      if (result.results.seedStats) {
        const stats = result.results.seedStats;
        if (stats.artists) this.printBullet(`Seeded ${stats.artists.loaded || 0} artists`);
        if (stats.studios) this.printBullet(`Seeded ${stats.studios.loaded || 0} studios`);
        if (stats.opensearch) this.printBullet(`Indexed ${stats.opensearch.indexed || 0} documents`);
      }
      if (result.results.frontendUpdated) {
        this.printBullet('Updated frontend mock data');
      }
    }

    this.printNextSteps();
  }

  /**
   * Display validation results
   */
  displayValidationResults(result, validationType) {
    this.printSuccess(`Data validation (${validationType}) completed successfully!`);
    console.log('');

    if (result.results) {
      this.printSection('Validation summary:');
      // Display validation details based on type
      if (result.errors && result.errors.length > 0) {
        this.printWarning(`Found ${result.errors.length} validation issues`);
        result.errors.forEach(error => {
          this.printBullet(`${SYMBOLS.cross} ${error}`, COLORS.yellow);
        });
      } else {
        this.printBullet('All validations passed');
      }
    }
  }

  /**
   * Display health check results
   */
  displayHealthResults(result) {
    this.printSuccess('Health check completed successfully!');
    console.log('');

    this.printSection(`Overall status: ${result.overall}`);
    
    if (result.services) {
      Object.entries(result.services).forEach(([service, status]) => {
        const icon = status === 'healthy' ? SYMBOLS.success : SYMBOLS.error;
        const color = status === 'healthy' ? COLORS.green : COLORS.red;
        this.printBullet(`${icon} ${service}: ${status}`, color);
      });
    }

    if (result.summary) {
      console.log('');
      this.printSection('Summary:');
      this.printBullet(result.summary);
    }
  }

  /**
   * Display system status results
   */
  displayStatusResults(result) {
    this.printSuccess('System status retrieved successfully!');
    console.log('');

    const status = result.status;
    
    this.printSection('System Status Report');
    console.log('='.repeat(50));
    
    this.printInfo(`Overall: ${status.overall}`);
    console.log('');

    // Services status
    this.printSection('Services:');
    Object.entries(status.services).forEach(([service, serviceStatus]) => {
      const icon = serviceStatus === 'healthy' ? SYMBOLS.success : SYMBOLS.error;
      const color = serviceStatus === 'healthy' ? COLORS.green : COLORS.red;
      this.printBullet(`${icon} ${service}: ${serviceStatus}`, color);
    });

    // Data counts
    console.log('');
    this.printSection('Data Counts:');
    if (status.data) {
      this.printBullet(`DynamoDB: ${status.data.dynamodb.totalItems} items`);
      this.printBullet(`OpenSearch: ${status.data.opensearch.totalDocuments} documents`);
      this.printBullet(`S3: ${status.data.s3.totalObjects} objects`);
      
      const consistencyIcon = status.data.consistency.consistent ? SYMBOLS.success : SYMBOLS.warning;
      const consistencyColor = status.data.consistency.consistent ? COLORS.green : COLORS.yellow;
      this.printBullet(`${consistencyIcon} Consistency: ${status.data.consistency.consistent ? 'Consistent' : 'Inconsistent'}`, consistencyColor);
    }

    // Current operations
    if (status.operations && status.operations.current && status.operations.current.isRunning) {
      console.log('');
      this.printSection('Current Operation:');
      const op = status.operations.current;
      this.printBullet(`${op.operation} (running for ${Math.round(op.duration / 1000)}s)`);
    }
  }

  /**
   * Print next steps
   */
  printNextSteps() {
    console.log('');
    this.printSection('Next steps:');
    this.printBullet('Run `npm run dev --workspace=frontend` to start frontend');
    this.printBullet('Run `npm run health-check` to verify system status');
    this.printBullet('Run `npm run data-status` to check data counts');
  }

  /**
   * Show help information
   */
  showHelp(specificCommand = null) {
    if (specificCommand && COMMANDS[specificCommand]) {
      this.showCommandHelp(specificCommand);
      return;
    }

    // Handle special help commands
    if (specificCommand === 'scenarios') {
      this.showAvailableScenarios();
      return;
    }

    if (specificCommand === 'reset-states') {
      this.showAvailableResetStates();
      return;
    }

    console.log(`${COLORS.bright}${COLORS.blue}Enhanced Data Management CLI${COLORS.reset}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('Unified command-line interface for all data management operations.');
    console.log('Now includes enhanced frontend-sync-processor with comprehensive mock data generation,');
    console.log('realistic business data, multiple testing scenarios, and RFC 9457 error responses.');
    console.log('');

    console.log(`${COLORS.bright}USAGE:${COLORS.reset}`);
    console.log('  npm run <command> [options]');
    console.log('  node scripts/data-cli.js <command> [options]');
    console.log('');

    console.log(`${COLORS.bright}COMMANDS:${COLORS.reset}`);
    Object.entries(COMMANDS).forEach(([command, config]) => {
      console.log(`  ${COLORS.cyan}${command.padEnd(15)}${COLORS.reset} ${config.description}`);
    });

    console.log('');
    console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
    console.log(`  ${COLORS.dim}# Set up all data and services with enhanced capabilities${COLORS.reset}`);
    console.log(`  npm run setup-data`);
    console.log('');
    console.log(`  ${COLORS.dim}# Enhanced frontend development mode with business data${COLORS.reset}`);
    console.log(`  npm run setup-data --frontend-only --export --validate`);
    console.log('');
    console.log(`  ${COLORS.dim}# Reset to clean state${COLORS.reset}`);
    console.log(`  npm run reset-data clean`);
    console.log('');
    console.log(`  ${COLORS.dim}# Seed enhanced scenario with comprehensive data${COLORS.reset}`);
    console.log(`  npm run seed-scenario london-focused`);
    console.log('');
    console.log(`  ${COLORS.dim}# Use enhanced frontend-sync-processor directly${COLORS.reset}`);
    console.log(`  npm run frontend-sync scenario style-diverse --export`);
    console.log('');
    console.log(`  ${COLORS.dim}# Generate performance test data${COLORS.reset}`);
    console.log(`  npm run frontend-sync performance --count 100`);
    console.log('');

    console.log(`${COLORS.bright}ENHANCED FEATURES:${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}Business Data:${COLORS.reset}     Realistic ratings, pricing, availability, experience`);
    console.log(`  ${COLORS.cyan}Studio Data:${COLORS.reset}       Comprehensive studio information and artist relationships`);
    console.log(`  ${COLORS.cyan}Style Metadata:${COLORS.reset}    Enhanced style characteristics and difficulty levels`);
    console.log(`  ${COLORS.cyan}Error Responses:${COLORS.reset}   RFC 9457 compliant error generation for testing`);
    console.log(`  ${COLORS.cyan}Data Export:${COLORS.reset}       Export and reuse generated datasets`);
    console.log(`  ${COLORS.cyan}Performance Data:${COLORS.reset} Large datasets for performance and stress testing`);
    console.log('');
    console.log(`${COLORS.bright}GET HELP:${COLORS.reset}`);
    console.log(`  npm run help <command>     Show help for specific command`);
    console.log(`  npm run help frontend-sync Show enhanced frontend-sync-processor help`);
    console.log(`  npm run scenarios          List available enhanced scenarios`);
    console.log(`  npm run reset-states       List available reset states`);
    console.log('');
  }

  /**
   * Show available scenarios
   */
  showAvailableScenarios() {
    console.log(`${COLORS.bright}${COLORS.blue}Available Scenarios${COLORS.reset}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('Test scenarios for seeding the system with specific data sets:');
    console.log('');

    Object.entries(this.config.scenarios).forEach(([scenarioName, config]) => {
      console.log(`${COLORS.cyan}${scenarioName.padEnd(20)}${COLORS.reset} ${config.description}`);
      console.log(`${COLORS.dim}${''.padEnd(20)} Artists: ${config.artistCount}, Studios: ${config.studioCount || 'auto'}${COLORS.reset}`);
      console.log('');
    });

    console.log(`${COLORS.bright}USAGE:${COLORS.reset}`);
    console.log(`  npm run seed-scenario <scenario-name>`);
    console.log('');
    console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
    console.log(`  npm run seed-scenario minimal`);
    console.log(`  npm run seed-scenario london-artists`);
    console.log(`  npm run seed-scenario full-dataset`);
    console.log('');
  }

  /**
   * Show available reset states
   */
  showAvailableResetStates() {
    console.log(`${COLORS.bright}${COLORS.blue}Available Reset States${COLORS.reset}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('System reset states for different testing and development needs:');
    console.log('');

    Object.entries(this.config.resetStates).forEach(([stateName, config]) => {
      console.log(`${COLORS.cyan}${stateName.padEnd(20)}${COLORS.reset} ${config.description}`);
      if (config.preserveData) {
        console.log(`${COLORS.dim}${''.padEnd(20)} Preserves: ${config.preserveData.join(', ')}${COLORS.reset}`);
      }
      console.log('');
    });

    console.log(`${COLORS.bright}USAGE:${COLORS.reset}`);
    console.log(`  npm run reset-data <state-name>`);
    console.log('');
    console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
    console.log(`  npm run reset-data clean`);
    console.log(`  npm run reset-data search-ready`);
    console.log(`  npm run reset-data frontend-ready`);
    console.log('');
  }

  /**
   * Show help for specific command
   */
  showCommandHelp(command) {
    const config = COMMANDS[command];
    
    console.log(`${COLORS.bright}${COLORS.blue}${command}${COLORS.reset}`);
    console.log('='.repeat(command.length + 10));
    console.log('');
    console.log(config.description);
    console.log('');

    console.log(`${COLORS.bright}USAGE:${COLORS.reset}`);
    console.log(`  ${config.usage}`);
    console.log('');

    if (config.options && config.options.length > 0) {
      console.log(`${COLORS.bright}OPTIONS:${COLORS.reset}`);
      config.options.forEach(option => {
        console.log(`  ${COLORS.cyan}${option.flag.padEnd(20)}${COLORS.reset} ${option.description}`);
      });
      console.log('');
    }

    if (config.examples && config.examples.length > 0) {
      console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
      config.examples.forEach(example => {
        console.log(`  ${example}`);
      });
      console.log('');
    }

    if (config.requirements && config.requirements.length > 0) {
      console.log(`${COLORS.dim}Requirements: ${config.requirements.join(', ')}${COLORS.reset}`);
      console.log('');
    }
  }

  /**
   * Start spinner animation
   */
  startSpinner(message) {
    if (this.spinnerInterval) {
      this.stopSpinner();
    }

    let spinnerIndex = 0;
    const startTime = Date.now();
    process.stdout.write(`${SYMBOLS.spinner[spinnerIndex]} ${message}...`);

    this.spinnerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const elapsedStr = elapsed > 0 ? ` (${elapsed}s)` : '';
      
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
      spinnerIndex = (spinnerIndex + 1) % SYMBOLS.spinner.length;
      process.stdout.write(`${SYMBOLS.spinner[spinnerIndex]} ${message}...${elapsedStr}`);
    }, 100);
  }

  /**
   * Stop spinner animation
   */
  stopSpinner() {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    }
  }

  /**
   * Start progress bar for long-running operations
   */
  startProgressBar(message, total = 100) {
    this.stopProgressBar(); // Stop any existing progress bar
    
    this.currentProgress = {
      current: 0,
      total: total,
      message: message,
      startTime: Date.now()
    };

    this.updateProgressDisplay();
    
    this.progressBarInterval = setInterval(() => {
      this.updateProgressDisplay();
    }, 500);
  }

  /**
   * Update progress bar
   */
  updateProgress(current, message = null) {
    this.currentProgress.current = Math.min(current, this.currentProgress.total);
    if (message) {
      this.currentProgress.message = message;
    }
    this.updateProgressDisplay();
  }

  /**
   * Update progress bar display
   */
  updateProgressDisplay() {
    if (!this.currentProgress.startTime) return;

    const { current, total, message, startTime } = this.currentProgress;
    
    // Handle invalid values
    const validCurrent = isNaN(current) || current < 0 ? 0 : current;
    const validTotal = isNaN(total) || total <= 0 ? 100 : total;
    
    const percentage = Math.floor((validCurrent / validTotal) * 100);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // Calculate ETA
    let etaStr = '';
    if (validCurrent > 0 && validCurrent < validTotal && elapsed > 0) {
      const rate = validCurrent / elapsed;
      if (rate > 0) {
        const remaining = (validTotal - validCurrent) / rate;
        if (isFinite(remaining) && remaining > 0) {
          etaStr = ` ETA: ${Math.floor(remaining)}s`;
        }
      }
    }

    // Create progress bar
    const barWidth = 30;
    const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
    const filledWidth = Math.floor((safePercentage / 100) * barWidth);
    const emptyWidth = Math.max(0, barWidth - filledWidth);
    
    const filledBar = SYMBOLS.progress[1].repeat(filledWidth);
    const emptyBar = SYMBOLS.progress[0].repeat(emptyWidth);
    const progressBar = `[${filledBar}${emptyBar}]`;
    
    const validMessage = message || 'Processing';
    const progressText = `${progressBar} ${safePercentage}% ${validMessage} (${elapsed}s)${etaStr}`;
    
    process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    process.stdout.write(progressText);
  }

  /**
   * Stop progress bar
   */
  stopProgressBar() {
    if (this.progressBarInterval) {
      clearInterval(this.progressBarInterval);
      this.progressBarInterval = null;
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    }
    
    this.currentProgress = {
      current: 0,
      total: 0,
      message: '',
      startTime: null
    };
  }

  /**
   * Show step-by-step progress for multi-stage operations
   */
  showStepProgress(currentStep, totalSteps, stepName) {
    // Handle invalid values
    const validCurrentStep = isNaN(currentStep) || currentStep < 0 ? 0 : currentStep;
    const validTotalSteps = isNaN(totalSteps) || totalSteps <= 0 ? 1 : totalSteps;
    const validStepName = stepName || 'Processing';
    
    const stepProgress = `Step ${validCurrentStep}/${validTotalSteps}: ${validStepName}`;
    this.printInfo(stepProgress);
    
    // Update progress bar if active
    if (this.progressBarInterval) {
      const progressPercentage = (validCurrentStep / validTotalSteps) * 100;
      this.updateProgress(progressPercentage, validStepName);
    }
  }

  /**
   * Provide troubleshooting guidance for common errors
   */
  provideTroubleshootingGuidance(command, error) {
    console.log('');
    this.printSection('Troubleshooting Guide:');

    const errorLower = error.toLowerCase();
    const troubleshootingSteps = this.getTroubleshootingSteps(command, errorLower);

    // Display categorized troubleshooting steps
    troubleshootingSteps.forEach((category, index) => {
      if (index > 0) console.log('');
      
      this.printSubSection(category.title);
      category.steps.forEach(step => {
        this.printBullet(step.action, step.urgent ? COLORS.red : COLORS.reset);
        if (step.command) {
          this.printCommand(step.command);
        }
        if (step.note) {
          this.printNote(step.note);
        }
      });
    });

    // Show common solutions
    console.log('');
    this.printSubSection('Common Solutions:');
    this.printBullet('Check system status: `npm run data-status`');
    this.printBullet('Run comprehensive health check: `npm run health-check`');
    this.printBullet('View system logs: `npm run local:logs`');
    
    console.log('');
    this.printSubSection('Get Additional Help:');
    this.printBullet('View command help: `npm run help <command>`');
    this.printBullet('List available scenarios: `npm run scenarios`');
    this.printBullet('List available reset states: `npm run reset-states`');
    
    console.log('');
    this.printInfo('💡 Tip: Run with DEBUG=true for detailed error information');
  }

  /**
   * Get categorized troubleshooting steps based on error type
   */
  getTroubleshootingSteps(command, errorLower) {
    const steps = [];

    // Docker/LocalStack issues
    if (errorLower.includes('localstack') || errorLower.includes('connection') || errorLower.includes('econnrefused')) {
      steps.push({
        title: '🐳 Docker & LocalStack Issues',
        steps: [
          { 
            action: 'Check if Docker Desktop is running', 
            urgent: true,
            command: 'docker --version'
          },
          { 
            action: 'Verify LocalStack container status', 
            command: 'docker ps | grep localstack'
          },
          { 
            action: 'Check LocalStack health', 
            command: 'curl http://localhost:4566/_localstack/health'
          },
          { 
            action: 'Restart LocalStack services', 
            command: 'npm run local:restart',
            note: 'This will stop and start all services'
          }
        ]
      });
    }

    // Permission issues
    if (errorLower.includes('permission') || errorLower.includes('access') || errorLower.includes('eacces')) {
      steps.push({
        title: '🔐 Permission Issues',
        steps: [
          { 
            action: 'Check file permissions in project directory',
            command: 'ls -la scripts/'
          },
          { 
            action: 'Ensure Docker has access to project files',
            note: 'Check Docker Desktop file sharing settings'
          },
          { 
            action: 'Try running with elevated permissions (Windows)',
            command: 'Run PowerShell as Administrator'
          }
        ]
      });
    }

    // Data/Scenario issues
    if (errorLower.includes('scenario') || errorLower.includes('state') || errorLower.includes('invalid')) {
      steps.push({
        title: '📊 Data & Scenario Issues',
        steps: [
          { 
            action: 'List available scenarios', 
            command: 'npm run scenarios'
          },
          { 
            action: 'List available reset states', 
            command: 'npm run reset-states'
          },
          { 
            action: 'Reset to known good state', 
            command: 'npm run reset-data fresh'
          }
        ]
      });
    }

    // Validation/Consistency issues
    if (errorLower.includes('validation') || errorLower.includes('consistency') || errorLower.includes('integrity')) {
      steps.push({
        title: '🔍 Data Validation Issues',
        steps: [
          { 
            action: 'Run comprehensive health check', 
            command: 'npm run health-check'
          },
          { 
            action: 'Check data consistency', 
            command: 'npm run validate-data consistency'
          },
          { 
            action: 'Validate image accessibility', 
            command: 'npm run validate-data images'
          },
          { 
            action: 'Reset and reseed data', 
            command: 'npm run reset-data fresh',
            note: 'This will clear and reload all data'
          }
        ]
      });
    }

    // Network/Service issues
    if (errorLower.includes('timeout') || errorLower.includes('network') || errorLower.includes('unreachable')) {
      steps.push({
        title: '🌐 Network & Service Issues',
        steps: [
          { 
            action: 'Check network connectivity',
            command: 'ping localhost'
          },
          { 
            action: 'Verify port availability',
            command: 'netstat -an | grep 4566'
          },
          { 
            action: 'Check firewall settings',
            note: 'Ensure ports 4566, 3000, 8080 are not blocked'
          },
          { 
            action: 'Restart network services',
            command: 'npm run local:restart'
          }
        ]
      });
    }

    // File system issues
    if (errorLower.includes('enoent') || errorLower.includes('file') || errorLower.includes('directory')) {
      steps.push({
        title: '📁 File System Issues',
        steps: [
          { 
            action: 'Verify project structure',
            command: 'ls -la scripts/test-data/'
          },
          { 
            action: 'Check required directories exist',
            note: 'Ensure tests/Test_Data/ImageSet directory exists'
          },
          { 
            action: 'Verify file permissions',
            command: 'ls -la .kiro/'
          },
          { 
            action: 'Recreate missing directories',
            note: 'The system should auto-create required directories'
          }
        ]
      });
    }

    // If no specific category matches, provide generic steps
    if (steps.length === 0) {
      steps.push({
        title: '🔧 General Troubleshooting',
        steps: [
          { 
            action: 'Check overall system health', 
            command: 'npm run health-check'
          },
          { 
            action: 'View recent system logs', 
            command: 'npm run local:logs --tail=50'
          },
          { 
            action: 'Restart all services', 
            command: 'npm run local:restart'
          },
          { 
            action: 'Reset to clean state', 
            command: 'npm run reset-data clean'
          }
        ]
      });
    }

    return steps;
  }

  /**
   * Enhanced error handling with categorization and recovery suggestions
   */
  handleError(error, command) {
    this.stopSpinner();
    this.stopProgressBar();
    console.log('');
    
    // Categorize error type
    const errorCategory = this.categorizeError(error);
    const errorIcon = this.getErrorIcon(errorCategory);
    
    this.printError(`${errorIcon} Command '${command}' failed`);
    
    // Show user-friendly error message
    this.printErrorDetails(error, errorCategory);
    
    // Provide recovery suggestions
    this.suggestRecoveryActions(command, errorCategory);
    
    // Show debug information if enabled
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.log('');
      this.printSection('Debug Information:');
      console.log(`${COLORS.dim}Error Type: ${errorCategory}${COLORS.reset}`);
      console.log(`${COLORS.dim}Stack Trace:${COLORS.reset}`);
      console.log(`${COLORS.dim}${error.stack}${COLORS.reset}`);
    }

    this.provideTroubleshootingGuidance(command, error.message);
  }

  /**
   * Categorize error types for better handling
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('econnrefused') || message.includes('localstack')) {
      return 'connection';
    } else if (message.includes('eacces') || message.includes('permission')) {
      return 'permission';
    } else if (message.includes('enoent') || message.includes('file') || message.includes('directory')) {
      return 'filesystem';
    } else if (message.includes('timeout') || message.includes('network')) {
      return 'network';
    } else if (message.includes('validation') || message.includes('consistency')) {
      return 'data';
    } else if (message.includes('scenario') || message.includes('state')) {
      return 'configuration';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get appropriate icon for error category
   */
  getErrorIcon(category) {
    const icons = {
      connection: '🔌',
      permission: '🔐',
      filesystem: '📁',
      network: '🌐',
      data: '📊',
      configuration: '⚙️',
      unknown: '❓'
    };
    
    return icons[category] || icons.unknown;
  }

  /**
   * Print detailed error information
   */
  printErrorDetails(error, category) {
    const userFriendlyMessages = {
      connection: 'Unable to connect to LocalStack services. Docker may not be running.',
      permission: 'Permission denied. Check file permissions and Docker access.',
      filesystem: 'File or directory not found. Check project structure.',
      network: 'Network connectivity issue. Check firewall and port availability.',
      data: 'Data validation failed. Database may be inconsistent.',
      configuration: 'Invalid configuration or parameters provided.',
      unknown: 'An unexpected error occurred.'
    };
    
    const friendlyMessage = userFriendlyMessages[category] || userFriendlyMessages.unknown;
    this.printInfo(friendlyMessage);
    
    // Show original error message if it's different and helpful
    if (!error.message.toLowerCase().includes(friendlyMessage.toLowerCase())) {
      console.log(`${COLORS.dim}Technical details: ${error.message}${COLORS.reset}`);
    }
  }

  /**
   * Suggest immediate recovery actions
   */
  suggestRecoveryActions(command, category) {
    console.log('');
    this.printSection('Immediate Actions:');
    
    const recoveryActions = {
      connection: [
        'Start Docker Desktop',
        'Run `npm run local:start` to start services'
      ],
      permission: [
        'Run terminal as administrator (Windows)',
        'Check Docker file sharing permissions'
      ],
      filesystem: [
        'Verify project directory structure',
        'Check if required files exist'
      ],
      network: [
        'Check if ports 4566, 3000, 8080 are available',
        'Disable firewall temporarily to test'
      ],
      data: [
        'Run `npm run reset-data fresh`',
        'Check `npm run health-check`'
      ],
      configuration: [
        'Verify command syntax with `npm run help`',
        'Check available options'
      ],
      unknown: [
        'Run `npm run health-check`',
        'Try `npm run local:restart`'
      ]
    };
    
    const actions = recoveryActions[category] || recoveryActions.unknown;
    actions.forEach((action, index) => {
      this.printBullet(`${index + 1}. ${action}`);
    });
  }

  /**
   * Handle errors with user-friendly messages
   */
  handleError(error, command) {
    this.stopSpinner();
    console.log('');
    
    this.printError(`Command '${command}' failed: ${error.message}`);
    
    // Don't expose technical stack traces to users
    // Debug information available via DEBUG environment variable
    if (process.env.DEBUG === 'true') {
      console.log(`\n${COLORS.dim}Debug: ${error.stack}${COLORS.reset}`);
    }

    this.provideTroubleshootingGuidance(command, error.message);
  }

  /**
   * Print colored messages
   */
  printSuccess(message) {
    console.log(`${COLORS.green}${SYMBOLS.success} ${message}${COLORS.reset}`);
  }

  printError(message) {
    console.log(`${COLORS.red}${SYMBOLS.error} ${message}${COLORS.reset}`);
  }

  printWarning(message) {
    console.log(`${COLORS.yellow}${SYMBOLS.warning} ${message}${COLORS.reset}`);
  }

  printInfo(message) {
    console.log(`${COLORS.blue}${SYMBOLS.info} ${message}${COLORS.reset}`);
  }

  printSection(message) {
    console.log(`${COLORS.bright}${message}${COLORS.reset}`);
  }

  printHighlight(message) {
    console.log(`${COLORS.bright}${COLORS.green}${SYMBOLS.check} ${message}${COLORS.reset}`);
  }

  printBullet(message, color = COLORS.reset) {
    console.log(`  ${color}${SYMBOLS.bullet} ${message}${COLORS.reset}`);
  }

  printSubSection(message) {
    console.log(`${COLORS.bright}${COLORS.cyan}${message}${COLORS.reset}`);
  }

  printCommand(command) {
    console.log(`    ${COLORS.dim}$ ${command}${COLORS.reset}`);
  }

  printNote(note) {
    console.log(`    ${COLORS.dim}💡 ${note}${COLORS.reset}`);
  }

  /**
   * Display operation summary with timing and statistics
   */
  displayOperationSummary(operation, result, startTime) {
    const duration = Date.now() - startTime;
    const durationStr = duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`;
    
    console.log('');
    this.printSection('Operation Summary:');
    this.printBullet(`Operation: ${operation}`);
    this.printBullet(`Duration: ${durationStr}`);
    this.printBullet(`Status: ${result.success ? 'Success' : 'Failed'}`);
    
    if (result.results) {
      this.displayResultStatistics(result.results);
    }
  }

  /**
   * Display detailed result statistics
   */
  displayResultStatistics(results) {
    console.log('');
    this.printSubSection('Statistics:');
    
    if (results.images) {
      this.printBullet(`Images processed: ${results.images.processed || 0}`);
      this.printBullet(`Images uploaded: ${results.images.uploaded || 0}`);
      if (results.images.failed > 0) {
        this.printBullet(`Images failed: ${results.images.failed}`, COLORS.yellow);
      }
    }
    
    if (results.database) {
      this.printBullet(`Artists seeded: ${results.database.artists || 0}`);
      this.printBullet(`Studios seeded: ${results.database.studios || 0}`);
    }
    
    if (results.opensearch) {
      this.printBullet(`Documents indexed: ${results.opensearch.documents || 0}`);
    }
    
    if (results.frontend) {
      this.printBullet(`Frontend updated: ${results.frontend.updated ? 'Yes' : 'No'}`);
      if (results.frontend.artistCount) {
        this.printBullet(`Mock artists: ${results.frontend.artistCount}`);
      }
    }
  }

  /**
   * Show performance metrics and recommendations
   */
  showPerformanceMetrics(operation, duration, results) {
    if (duration < 5000) return; // Only show for operations > 5 seconds
    
    console.log('');
    this.printSubSection('Performance Metrics:');
    
    const durationSeconds = duration / 1000;
    this.printBullet(`Total time: ${durationSeconds.toFixed(1)}s`);
    
    // Calculate throughput if applicable
    if (results.images && results.images.processed > 0) {
      const imagesPerSecond = (results.images.processed / durationSeconds).toFixed(1);
      this.printBullet(`Image processing rate: ${imagesPerSecond} images/sec`);
    }
    
    if (results.database && results.database.artists > 0) {
      const artistsPerSecond = (results.database.artists / durationSeconds).toFixed(1);
      this.printBullet(`Database seeding rate: ${artistsPerSecond} artists/sec`);
    }
    
    // Performance recommendations
    if (durationSeconds > 30) {
      console.log('');
      this.printSubSection('Performance Tips:');
      this.printBullet('Consider using --force flag only when necessary');
      this.printBullet('Use --frontend-only for UI development');
      this.printBullet('Use specific scenarios for faster testing');
    }
  }

  /**
   * Display system resource usage warnings
   */
  checkAndDisplayResourceWarnings() {
    // Check available memory (simplified check)
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memUsedMB > 500) {
      console.log('');
      this.printWarning(`High memory usage detected: ${memUsedMB}MB`);
      this.printNote('Consider restarting the process if performance degrades');
    }
  }

  /**
   * Main CLI entry point
   */
  async run(args = process.argv.slice(2)) {
    try {
      // Parse arguments
      const { command, args: parsedArgs, options } = this.parseArguments(args);

      // Validate command
      const validation = this.validateCommand(command, parsedArgs, options);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => this.printError(error));
        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => this.printWarning(warning));
        }
        console.log('');
        this.showHelp(command);
        process.exit(1);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => this.printWarning(warning));
        console.log('');
      }

      // Execute command
      const success = await this.handleCommand(command, parsedArgs, options);
      
      if (!success) {
        process.exit(1);
      }

    } catch (error) {
      this.handleError(error, 'unknown');
      process.exit(1);
    }
  }
}

// Export the class
module.exports = {
  DataCLI,
  COMMANDS,
  COLORS,
  SYMBOLS
};

// CLI usage when run directly
if (require.main === module) {
  const cli = new DataCLI();
  cli.run();
}