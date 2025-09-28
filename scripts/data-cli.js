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
    description: 'Set up all data and services for development with enhanced mock data generation',
    usage: 'setup-data [options]',
    options: [
      { flag: '--frontend-only', description: 'Generate enhanced mock data without AWS services (includes business data, ratings, pricing)' },
      { flag: '--images-only', description: 'Process and upload images only' },
      { flag: '--force', description: 'Force full processing, ignore incremental changes' },
      { flag: '--scenario <name>', description: 'Use specific scenario for setup (supports enhanced scenarios with business data)' },
      { flag: '--count <number>', description: 'Override artist count for data generation (e.g., --count 100 for large datasets)' },
      { flag: '--export', description: 'Export generated data to file for reuse' },
      { flag: '--validate', description: 'Validate data consistency and structure during generation' }
    ],
    examples: [
      'setup-data',
      'setup-data --frontend-only --export',
      'setup-data --force --scenario london-focused --validate',
      'setup-data --frontend-only --scenario high-rated',
      'setup-data --scenario performance-test --count 100',
      'setup-data --frontend-only --count 250 --export'
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
    description: 'Validate data consistency, integrity, and enhanced mock data structures',
    usage: 'validate-data [type]',
    options: [
      { flag: 'all', description: 'Comprehensive validation including enhanced data structures (default)' },
      { flag: 'consistency', description: 'Cross-service data consistency and mock data alignment' },
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

  'seed-studios': {
    description: 'Seed only studio data without affecting artist data',
    usage: 'seed-studios [options]',
    options: [
      { flag: '--scenario <name>', description: 'Use specific scenario for studio generation' },
      { flag: '--count <number>', description: 'Override studio count for generation' },
      { flag: '--force', description: 'Force regeneration of existing studio data' },
      { flag: '--validate', description: 'Validate studio data after seeding' }
    ],
    examples: [
      'seed-studios',
      'seed-studios --scenario london-studios',
      'seed-studios --count 5 --validate',
      'seed-studios --force --scenario studio-diverse'
    ],
    requirements: ['6.1', '6.4', '6.5']
  },
  'validate-studios': {
    description: 'Validate only studio-related data and relationships',
    usage: 'validate-studios [type]',
    options: [
      { flag: 'all', description: 'Comprehensive studio validation (default)' },
      { flag: 'data', description: 'Studio data structure and required fields' },
      { flag: 'relationships', description: 'Artist-studio relationship consistency' },
      { flag: 'images', description: 'Studio image accessibility and format' },
      { flag: 'addresses', description: 'Studio address and postcode validation' },
      { flag: 'consistency', description: 'Cross-service studio data consistency' }
    ],
    examples: [
      'validate-studios',
      'validate-studios relationships',
      'validate-studios images',
      'validate-studios addresses'
    ],
    requirements: ['6.2', '6.4', '6.5']
  },
  'reset-studios': {
    description: 'Reset studio data while preserving artist data',
    usage: 'reset-studios [options]',
    options: [
      { flag: '--preserve-relationships', description: 'Clear studio data but keep artist-studio references' },
      { flag: '--scenario <name>', description: 'Reseed with specific scenario after reset' },
      { flag: '--validate', description: 'Validate data consistency after reset' }
    ],
    examples: [
      'reset-studios',
      'reset-studios --scenario studio-diverse',
      'reset-studios --preserve-relationships --validate'
    ],
    requirements: ['6.3', '6.4', '6.5']
  },
  'studio-status': {
    description: 'Display studio data counts and status information',
    usage: 'studio-status',
    options: [],
    examples: ['studio-status'],
    requirements: ['6.4', '6.5', '6.6']
  },
  'process-studio-images': {
    description: 'Process and upload studio images to S3',
    usage: 'process-studio-images [options]',
    options: [
      { flag: '--studio-id <id>', description: 'Process images for specific studio only' },
      { flag: '--force', description: 'Reprocess existing images' },
      { flag: '--validate', description: 'Validate image accessibility after processing' }
    ],
    examples: [
      'process-studio-images',
      'process-studio-images --studio-id studio-001',
      'process-studio-images --force --validate'
    ],
    requirements: ['6.6']
  },
  'manage-studio-relationships': {
    description: 'Manage artist-studio relationship assignments',
    usage: 'manage-studio-relationships [action]',
    options: [
      { flag: 'validate', description: 'Validate all artist-studio relationships' },
      { flag: 'rebuild', description: 'Rebuild relationships based on location and style compatibility' },
      { flag: 'repair', description: 'Repair inconsistent or broken relationships' },
      { flag: 'report', description: 'Generate relationship status report' }
    ],
    examples: [
      'manage-studio-relationships validate',
      'manage-studio-relationships rebuild',
      'manage-studio-relationships repair',
      'manage-studio-relationships report'
    ],
    requirements: ['6.5', '6.6']
  },
  'validate-studio-data-e2e': {
    description: 'Comprehensive end-to-end studio data validation across all services',
    usage: 'validate-studio-data-e2e [options]',
    options: [
      { flag: '--save-report', description: 'Save detailed validation report to file' },
      { flag: '--verbose', description: 'Show detailed validation progress and results' },
      { flag: '--fail-fast', description: 'Stop validation on first critical error' }
    ],
    examples: [
      'validate-studio-data-e2e',
      'validate-studio-data-e2e --save-report --verbose',
      'validate-studio-data-e2e --fail-fast'
    ],
    requirements: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7']
  },
  'help': {
    description: 'Show help information',
    usage: 'help [command]',
    options: [],
    examples: ['help', 'help setup-data', 'help seed-scenario', 'help seed-studios'],
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
        
        // Validate count if provided
        if (options.count) {
          const count = parseInt(options.count);
          if (isNaN(count) || count < 1) {
            errors.push('Count must be a positive number');
          } else if (count > this.config.validation.thresholds.maxArtistCount) {
            warnings.push(`Count ${count} exceeds recommended maximum of ${this.config.validation.thresholds.maxArtistCount}`);
          }
        }
        break;

      case 'seed-studios':
        // Validate scenario if provided
        if (options.scenario) {
          try {
            this.config.getScenarioConfig(options.scenario);
          } catch (error) {
            errors.push(`Invalid scenario: ${options.scenario}`);
            warnings.push(`Available scenarios: ${Object.keys(this.config.scenarios).join(', ')}`);
          }
        }
        
        // Validate count if provided
        if (options.count) {
          const count = parseInt(options.count);
          if (isNaN(count) || count < 1) {
            errors.push('Studio count must be a positive number');
          } else if (count > 50) {
            warnings.push(`Studio count ${count} is quite large and may take time to process`);
          }
        }
        break;

      case 'validate-studios':
        if (args.length > 0) {
          const validationType = args[0];
          const validTypes = ['all', 'data', 'relationships', 'images', 'addresses', 'consistency'];
          if (!validTypes.includes(validationType)) {
            errors.push(`Invalid studio validation type: ${validationType}`);
            warnings.push(`Available types: ${validTypes.join(', ')}`);
          }
        }
        break;

      case 'reset-studios':
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

      case 'process-studio-images':
        // Validate studio ID format if provided
        if (options['studio-id']) {
          const studioId = options['studio-id'];
          if (!studioId.match(/^studio-\d+$/)) {
            warnings.push(`Studio ID format should be 'studio-XXX' (e.g., studio-001)`);
          }
        }
        break;

      case 'manage-studio-relationships':
        if (args.length > 0) {
          const action = args[0];
          const validActions = ['validate', 'rebuild', 'repair', 'report'];
          if (!validActions.includes(action)) {
            errors.push(`Invalid relationship action: ${action}`);
            warnings.push(`Available actions: ${validActions.join(', ')}`);
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
        case 'seed-studios':
          return await this.handleSeedStudios(args, options);
        case 'validate-studios':
          return await this.handleValidateStudios(args, options);
        case 'reset-studios':
          return await this.handleResetStudios(args, options);
        case 'studio-status':
          return await this.handleStudioStatus(args, options);
        case 'process-studio-images':
          return await this.handleProcessStudioImages(args, options);
        case 'manage-studio-relationships':
          return await this.handleManageStudioRelationships(args, options);
        case 'validate-studio-data-e2e':
          return await this.handleValidateStudioDataE2E(args, options);
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
      scenario: options.scenario || null,
      count: options.count ? parseInt(options.count) : null
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

    if (setupOptions.count) {
      this.printInfo(`🔢 Artist count override: ${setupOptions.count} artists`);
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
   * Handle seed-studios command
   */
  async handleSeedStudios(args, options) {
    const startTime = Date.now();
    const seedOptions = {
      scenario: options.scenario || null,
      count: options.count ? parseInt(options.count) : null,
      force: options.force || false,
      validate: options.validate || false
    };

    this.printInfo('🏢 Starting studio-only seeding...');
    
    if (seedOptions.scenario) {
      this.printInfo(`🎯 Using scenario: ${seedOptions.scenario}`);
    }

    if (seedOptions.count) {
      this.printInfo(`🔢 Studio count override: ${seedOptions.count} studios`);
    }

    if (seedOptions.force) {
      this.printInfo('🔄 Force mode: Regenerating existing studio data');
    }

    this.startProgressBar('Seeding studios', 4);

    try {
      this.showStepProgress(1, 4, 'Preparing studio data');
      this.updateProgress(1, 'Initializing studio seeding');

      const result = await this.manager.seedStudios(seedOptions);
      
      this.stopProgressBar();

      if (result.success) {
        this.displayStudioSeedResults(result, seedOptions);
        this.displayOperationSummary('seed-studios', result, startTime);
        return true;
      } else {
        this.printError(`Studio seeding failed: ${result.error}`);
        this.provideTroubleshootingGuidance('seed-studios', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle validate-studios command
   */
  async handleValidateStudios(args, options) {
    const validationType = args[0] || 'all';
    
    this.printInfo(`🔍 Validating studio data (type: ${validationType})...`);
    this.startSpinner(`Running ${validationType} studio validation`);

    try {
      const result = await this.manager.validateStudios(validationType);
      this.stopSpinner();

      if (result.success) {
        this.displayStudioValidationResults(result, validationType);
        return true;
      } else {
        this.printError(`Studio validation failed: ${result.error}`);
        this.provideTroubleshootingGuidance('validate-studios', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Handle reset-studios command
   */
  async handleResetStudios(args, options) {
    const startTime = Date.now();
    const resetOptions = {
      preserveRelationships: options['preserve-relationships'] || false,
      scenario: options.scenario || null,
      validate: options.validate || false
    };

    this.printInfo('🔄 Resetting studio data...');
    
    if (resetOptions.preserveRelationships) {
      this.printInfo('🔗 Preserving artist-studio relationships');
    } else {
      this.printWarning('⚠️  This will clear all studio data and relationships');
    }

    if (resetOptions.scenario) {
      this.printInfo(`🎯 Will reseed with scenario: ${resetOptions.scenario}`);
    }

    this.startProgressBar('Resetting studios', 3);

    try {
      this.showStepProgress(1, 3, 'Clearing studio data');
      this.updateProgress(1, 'Removing existing studio data');

      const result = await this.manager.resetStudios(resetOptions);
      
      this.stopProgressBar();

      if (result.success) {
        this.displayStudioResetResults(result, resetOptions);
        this.displayOperationSummary('reset-studios', result, startTime);
        return true;
      } else {
        this.printError(`Studio reset failed: ${result.error}`);
        this.provideTroubleshootingGuidance('reset-studios', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle studio-status command
   */
  async handleStudioStatus(args, options) {
    this.printInfo('📊 Getting studio status...');
    this.startSpinner('Retrieving studio information');

    try {
      const result = await this.manager.getStudioStatus();
      this.stopSpinner();

      if (result.success) {
        this.displayStudioStatusResults(result);
        return true;
      } else {
        this.printError(`Failed to get studio status: ${result.error}`);
        this.provideTroubleshootingGuidance('studio-status', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Handle process-studio-images command
   */
  async handleProcessStudioImages(args, options) {
    const startTime = Date.now();
    const imageOptions = {
      studioId: options['studio-id'] || null,
      force: options.force || false,
      validate: options.validate || false
    };

    this.printInfo('🖼️ Processing studio images...');
    
    if (imageOptions.studioId) {
      this.printInfo(`🎯 Processing images for studio: ${imageOptions.studioId}`);
    } else {
      this.printInfo('🏢 Processing images for all studios');
    }

    if (imageOptions.force) {
      this.printInfo('🔄 Force mode: Reprocessing existing images');
    }

    this.startProgressBar('Processing images', 3);

    try {
      this.showStepProgress(1, 3, 'Loading studio data');
      this.updateProgress(1, 'Preparing image processing');

      const result = await this.manager.processStudioImages(imageOptions);
      
      this.stopProgressBar();

      if (result.success) {
        this.displayStudioImageResults(result, imageOptions);
        this.displayOperationSummary('process-studio-images', result, startTime);
        return true;
      } else {
        this.printError(`Studio image processing failed: ${result.error}`);
        this.provideTroubleshootingGuidance('process-studio-images', result.error);
        return false;
      }
    } catch (error) {
      this.stopProgressBar();
      throw error;
    }
  }

  /**
   * Handle manage-studio-relationships command
   */
  async handleManageStudioRelationships(args, options) {
    const action = args[0] || 'validate';
    const startTime = Date.now();

    this.printInfo(`🔗 Managing studio relationships (action: ${action})...`);
    
    const actionDescriptions = {
      validate: 'Validating all artist-studio relationships',
      rebuild: 'Rebuilding relationships based on compatibility',
      repair: 'Repairing inconsistent relationships',
      report: 'Generating relationship status report'
    };

    this.printInfo(`📋 ${actionDescriptions[action] || 'Processing relationships'}`);
    this.startSpinner(`${action} relationships`);

    try {
      const result = await this.manager.manageStudioRelationships(action);
      this.stopSpinner();

      if (result.success) {
        this.displayStudioRelationshipResults(result, action);
        this.displayOperationSummary('manage-studio-relationships', result, startTime);
        return true;
      } else {
        this.printError(`Studio relationship management failed: ${result.error}`);
        this.provideTroubleshootingGuidance('manage-studio-relationships', result.error);
        return false;
      }
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Display studio seed results
   */
  displayStudioSeedResults(result, options) {
    this.printSuccess('Studio seeding completed successfully!');
    console.log('');

    if (result.results) {
      this.printSection('Studio seeding summary:');
      if (result.results.studios) {
        this.printBullet(`Seeded ${result.results.studios.created || 0} studios`);
        this.printBullet(`Updated ${result.results.studios.updated || 0} existing studios`);
        if (result.results.studios.failed > 0) {
          this.printWarning(`${result.results.studios.failed} studios failed to seed`);
        }
      }
      if (result.results.relationships) {
        this.printBullet(`Created ${result.results.relationships.created || 0} artist-studio relationships`);
        this.printBullet(`Updated ${result.results.relationships.updated || 0} existing relationships`);
      }
      if (result.results.images) {
        this.printBullet(`Processed ${result.results.images.processed || 0} studio images`);
      }
      if (result.results.frontend) {
        this.printBullet('Updated frontend studio mock data');
      }
    }

    if (options.validate && result.validation) {
      console.log('');
      this.printSection('Validation results:');
      if (result.validation.passed) {
        this.printBullet('All studio validations passed');
      } else {
        this.printWarning(`${result.validation.errors.length} validation issues found`);
        result.validation.errors.forEach(error => {
          this.printBullet(`${SYMBOLS.cross} ${error}`, COLORS.yellow);
        });
      }
    }

    this.printNextSteps();
  }

  /**
   * Display studio validation results
   */
  displayStudioValidationResults(result, validationType) {
    this.printSuccess(`Studio validation (${validationType}) completed successfully!`);
    console.log('');

    if (result.results) {
      this.printSection('Studio validation summary:');
      
      if (result.results.totalStudios !== undefined) {
        this.printBullet(`Validated ${result.results.totalStudios} studios`);
      }
      
      if (result.results.errors && result.results.errors.length > 0) {
        this.printWarning(`Found ${result.results.errors.length} validation issues`);
        result.results.errors.forEach(error => {
          this.printBullet(`${SYMBOLS.cross} ${error}`, COLORS.yellow);
        });
      } else {
        this.printBullet('All studio validations passed');
      }

      if (result.results.warnings && result.results.warnings.length > 0) {
        console.log('');
        this.printSection('Warnings:');
        result.results.warnings.forEach(warning => {
          this.printBullet(`${SYMBOLS.warning} ${warning}`, COLORS.yellow);
        });
      }

      // Type-specific results
      if (validationType === 'relationships' && result.results.relationships) {
        console.log('');
        this.printSection('Relationship validation:');
        this.printBullet(`Checked ${result.results.relationships.checked || 0} relationships`);
        this.printBullet(`Valid relationships: ${result.results.relationships.valid || 0}`);
        if (result.results.relationships.invalid > 0) {
          this.printBullet(`Invalid relationships: ${result.results.relationships.invalid}`, COLORS.red);
        }
      }

      if (validationType === 'images' && result.results.images) {
        console.log('');
        this.printSection('Image validation:');
        this.printBullet(`Checked ${result.results.images.checked || 0} studio images`);
        this.printBullet(`Accessible images: ${result.results.images.accessible || 0}`);
        if (result.results.images.inaccessible > 0) {
          this.printBullet(`Inaccessible images: ${result.results.images.inaccessible}`, COLORS.red);
        }
      }
    }
  }

  /**
   * Display studio reset results
   */
  displayStudioResetResults(result, options) {
    this.printSuccess('Studio reset completed successfully!');
    console.log('');

    if (result.results) {
      this.printSection('Studio reset summary:');
      if (result.results.cleared) {
        this.printBullet('Cleared existing studio data');
        if (result.results.studiosRemoved) {
          this.printBullet(`  ${SYMBOLS.arrow} Removed ${result.results.studiosRemoved} studios`);
        }
        if (options.preserveRelationships) {
          this.printBullet('  ${SYMBOLS.arrow} Preserved artist-studio relationships');
        } else {
          this.printBullet(`  ${SYMBOLS.arrow} Cleared ${result.results.relationshipsRemoved || 0} relationships`);
        }
      }
      if (result.results.reseeded && options.scenario) {
        this.printBullet(`Reseeded with scenario: ${options.scenario}`);
        if (result.results.seedStats) {
          const stats = result.results.seedStats;
          if (stats.studios) this.printBullet(`  ${SYMBOLS.arrow} ${stats.studios.created || 0} new studios`);
          if (stats.relationships) this.printBullet(`  ${SYMBOLS.arrow} ${stats.relationships.created || 0} new relationships`);
        }
      }
    }

    this.printNextSteps();
  }

  /**
   * Display studio status results
   */
  displayStudioStatusResults(result) {
    this.printSuccess('Studio status retrieved successfully!');
    console.log('');

    const status = result.status;
    
    this.printSection('Studio Status Report');
    console.log('='.repeat(50));
    
    // Studio counts
    this.printSection('Studio Data:');
    if (status.studios) {
      this.printBullet(`Total studios: ${status.studios.total || 0}`);
      this.printBullet(`Active studios: ${status.studios.active || 0}`);
      this.printBullet(`Studios with images: ${status.studios.withImages || 0}`);
      this.printBullet(`Studios with artists: ${status.studios.withArtists || 0}`);
    }

    // Relationship status
    console.log('');
    this.printSection('Artist-Studio Relationships:');
    if (status.relationships) {
      this.printBullet(`Total relationships: ${status.relationships.total || 0}`);
      this.printBullet(`Valid relationships: ${status.relationships.valid || 0}`);
      if (status.relationships.invalid > 0) {
        this.printBullet(`Invalid relationships: ${status.relationships.invalid}`, COLORS.red);
      }
      this.printBullet(`Orphaned artists: ${status.relationships.orphanedArtists || 0}`);
    }

    // Image status
    console.log('');
    this.printSection('Studio Images:');
    if (status.images) {
      this.printBullet(`Total studio images: ${status.images.total || 0}`);
      this.printBullet(`Accessible images: ${status.images.accessible || 0}`);
      if (status.images.inaccessible > 0) {
        this.printBullet(`Inaccessible images: ${status.images.inaccessible}`, COLORS.red);
      }
    }

    // Data consistency
    console.log('');
    this.printSection('Data Consistency:');
    if (status.consistency) {
      const consistencyIcon = status.consistency.consistent ? SYMBOLS.success : SYMBOLS.warning;
      const consistencyColor = status.consistency.consistent ? COLORS.green : COLORS.yellow;
      this.printBullet(`${consistencyIcon} Overall consistency: ${status.consistency.consistent ? 'Consistent' : 'Issues found'}`, consistencyColor);
      
      if (status.consistency.issues && status.consistency.issues.length > 0) {
        console.log('');
        this.printSubSection('Consistency Issues:');
        status.consistency.issues.forEach(issue => {
          this.printBullet(`${SYMBOLS.cross} ${issue}`, COLORS.yellow);
        });
      }
    }
  }

  /**
   * Display studio image processing results
   */
  displayStudioImageResults(result, options) {
    this.printSuccess('Studio image processing completed successfully!');
    console.log('');

    if (result.results) {
      this.printSection('Image processing summary:');
      if (result.results.images) {
        this.printBullet(`Processed ${result.results.images.processed || 0} studio images`);
        this.printBullet(`Uploaded ${result.results.images.uploaded || 0} images to S3`);
        this.printBullet(`Optimized ${result.results.images.optimized || 0} images`);
        if (result.results.images.failed > 0) {
          this.printWarning(`${result.results.images.failed} images failed to process`);
        }
      }
      
      if (options.studioId) {
        this.printBullet(`Processed images for studio: ${options.studioId}`);
      } else {
        this.printBullet(`Processed images for ${result.results.studiosProcessed || 0} studios`);
      }
    }

    if (options.validate && result.validation) {
      console.log('');
      this.printSection('Image validation results:');
      if (result.validation.passed) {
        this.printBullet('All processed images are accessible');
      } else {
        this.printWarning(`${result.validation.errors.length} image accessibility issues found`);
        result.validation.errors.forEach(error => {
          this.printBullet(`${SYMBOLS.cross} ${error}`, COLORS.yellow);
        });
      }
    }

    this.printNextSteps();
  }

  /**
   * Display studio relationship management results
   */
  displayStudioRelationshipResults(result, action) {
    this.printSuccess(`Studio relationship ${action} completed successfully!`);
    console.log('');

    if (result.results) {
      this.printSection(`Relationship ${action} summary:`);
      
      switch (action) {
        case 'validate':
          this.printBullet(`Validated ${result.results.totalRelationships || 0} relationships`);
          this.printBullet(`Valid relationships: ${result.results.validRelationships || 0}`);
          if (result.results.invalidRelationships > 0) {
            this.printBullet(`Invalid relationships: ${result.results.invalidRelationships}`, COLORS.red);
          }
          if (result.results.orphanedArtists > 0) {
            this.printBullet(`Orphaned artists: ${result.results.orphanedArtists}`, COLORS.yellow);
          }
          break;

        case 'rebuild':
          this.printBullet(`Rebuilt ${result.results.relationshipsCreated || 0} relationships`);
          this.printBullet(`Removed ${result.results.relationshipsRemoved || 0} old relationships`);
          this.printBullet(`Updated ${result.results.artistsUpdated || 0} artist records`);
          this.printBullet(`Updated ${result.results.studiosUpdated || 0} studio records`);
          break;

        case 'repair':
          this.printBullet(`Repaired ${result.results.relationshipsRepaired || 0} relationships`);
          this.printBullet(`Fixed ${result.results.inconsistenciesFixed || 0} inconsistencies`);
          if (result.results.unrepairable > 0) {
            this.printWarning(`${result.results.unrepairable} relationships could not be repaired`);
          }
          break;

        case 'report':
          this.printBullet(`Generated report for ${result.results.totalStudios || 0} studios`);
          this.printBullet(`Analyzed ${result.results.totalArtists || 0} artists`);
          if (result.results.reportPath) {
            this.printBullet(`Report saved to: ${result.results.reportPath}`);
          }
          break;
      }

      if (result.results.errors && result.results.errors.length > 0) {
        console.log('');
        this.printSection('Issues found:');
        result.results.errors.forEach(error => {
          this.printBullet(`${SYMBOLS.cross} ${error}`, COLORS.yellow);
        });
      }
    }

    this.printNextSteps();
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
      Object.entries(result.services).forEach(([service, serviceData]) => {
        // Handle both string status and object with status property
        const status = typeof serviceData === 'string' ? serviceData : serviceData.status || 'unknown';
        const icon = status === 'healthy' ? SYMBOLS.success : SYMBOLS.error;
        const color = status === 'healthy' ? COLORS.green : COLORS.red;
        this.printBullet(`${icon} ${service}: ${status}`, color);
      });
    }

    if (result.summary) {
      console.log('');
      this.printSection('Summary:');
      
      // Handle both string summary and object summary
      if (typeof result.summary === 'string') {
        this.printBullet(result.summary);
      } else if (typeof result.summary === 'object') {
        // Display detailed service information from summary object
        Object.entries(result.summary).forEach(([serviceName, serviceInfo]) => {
          if (serviceInfo && typeof serviceInfo === 'object') {
            const status = serviceInfo.status || 'unknown';
            const lastCheck = serviceInfo.lastCheck ? new Date(serviceInfo.lastCheck).toLocaleTimeString() : 'unknown';
            let details = [];
            
            // Add service-specific details
            if (serviceInfo.tableCount) details.push(`${serviceInfo.tableCount} tables`);
            if (serviceInfo.totalItems) details.push(`${serviceInfo.totalItems} items`);
            if (serviceInfo.bucketCount) details.push(`${serviceInfo.bucketCount} buckets`);
            if (serviceInfo.totalObjects) details.push(`${serviceInfo.totalObjects} objects`);
            if (serviceInfo.indexCount !== undefined) details.push(`${serviceInfo.indexCount} indices`);
            if (serviceInfo.totalDocuments !== undefined) details.push(`${serviceInfo.totalDocuments} documents`);
            
            const detailsText = details.length > 0 ? ` (${details.join(', ')})` : '';
            this.printBullet(`${serviceName}: ${status} - last checked ${lastCheck}${detailsText}`);
          }
        });
      }
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
    console.log('Includes comprehensive mock data generation with realistic business data,');
    console.log('multiple testing scenarios, and performance testing capabilities.');
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
    console.log(`  npm run reset-data --workspace=scripts-data clean`);
    console.log('');
    console.log(`  ${COLORS.dim}# Seed enhanced scenario with comprehensive data${COLORS.reset}`);
    console.log(`  npm run seed --workspace=scripts-scenario london-focused`);
    console.log('');
    console.log(`  ${COLORS.dim}# Studio-specific operations${COLORS.reset}`);
    console.log(`  npm run seed --workspace=scripts-studios --scenario studio-diverse`);
    console.log(`  npm run validate --workspace=scripts/documentation-analysis-studios relationships`);
    console.log(`  npm run reset-data --workspace=scripts-studios --preserve-relationships`);
    console.log(`  npm run studio-status`);
    console.log('');
    console.log(`  ${COLORS.dim}# Generate large datasets for performance testing${COLORS.reset}`);
    console.log(`  npm run setup-data --scenario performance-test --count 100`);
    console.log(`  npm run setup-data --frontend-only --count 250 --export`);
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
    console.log(`  npm run help setup-data    Show setup-data command help`);
    console.log(`  npm run scenarios          List available enhanced scenarios`);
    console.log(`  npm run reset-data --workspace=scripts-states       List available reset states`);
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
    console.log(`  npm run seed --workspace=scripts-scenario <scenario-name>`);
    console.log('');
    console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
    console.log(`  npm run seed --workspace=scripts-scenario minimal`);
    console.log(`  npm run seed --workspace=scripts-scenario london-artists`);
    console.log(`  npm run seed --workspace=scripts-scenario full-dataset`);
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
    console.log(`  npm run reset-data --workspace=scripts-data <state-name>`);
    console.log('');
    console.log(`${COLORS.bright}EXAMPLES:${COLORS.reset}`);
    console.log(`  npm run reset-data --workspace=scripts-data clean`);
    console.log(`  npm run reset-data --workspace=scripts-data search-ready`);
    console.log(`  npm run reset-data --workspace=scripts-data frontend-ready`);
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
    this.printBullet('List available reset states: `npm run reset-data --workspace=scripts-states`');
    
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
            command: 'npm run reset-data --workspace=scripts-states'
          },
          { 
            action: 'Reset to known good state', 
            command: 'npm run reset-data --workspace=scripts-data fresh'
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
            command: 'npm run validate --workspace=scripts/documentation-analysis-data consistency'
          },
          { 
            action: 'Validate image accessibility', 
            command: 'npm run validate --workspace=scripts/documentation-analysis-data images'
          },
          { 
            action: 'Reset and reseed data', 
            command: 'npm run reset-data --workspace=scripts-data fresh',
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
            command: 'npm run reset-data --workspace=scripts-data clean'
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
        'Run `npm run reset-data --workspace=scripts-data fresh`',
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
  /**
   * Handle validate-studio-data-e2e command
   */
  async handleValidateStudioDataE2E(args, options) {
    const startTime = Date.now();

    this.printInfo('🔍 Starting comprehensive end-to-end studio data validation...');
    
    if (options['save-report']) {
      this.printInfo('📄 Detailed report will be saved to file');
    }
    
    if (options.verbose) {
      this.printInfo('📋 Verbose mode: Showing detailed validation progress');
    }

    if (options['fail-fast']) {
      this.printInfo('⚡ Fail-fast mode: Stopping on first critical error');
    }

    this.startSpinner('Running end-to-end validation');

    try {
      // Import the validator
      const StudioEndToEndValidator = require('./data-management/studio-end-to-end-validator');
      const validator = new StudioEndToEndValidator(this.config);

      // Run comprehensive validation
      const report = await validator.validateStudioDataEndToEnd();
      this.stopSpinner();

      // Display results
      this.displayStudioE2EValidationResults(report, options);
      this.displayOperationSummary('validate-studio-data-e2e', { success: report.summary.success }, startTime);

      return report.summary.success;
    } catch (error) {
      this.stopSpinner();
      throw error;
    }
  }

  /**
   * Display end-to-end studio validation results
   */
  displayStudioE2EValidationResults(report, options) {
    const success = report.summary.success;
    
    if (success) {
      this.printSuccess('End-to-end studio validation completed successfully!');
    } else {
      this.printError('End-to-end studio validation found issues!');
    }
    
    console.log('');

    // Summary section
    this.printSection('Validation Summary:');
    this.printBullet(`Total checks: ${report.summary.totalChecks}`);
    this.printBullet(`Passed: ${report.summary.passed}`, COLORS.green);
    if (report.summary.failed > 0) {
      this.printBullet(`Failed: ${report.summary.failed}`, COLORS.red);
    }
    if (report.summary.warnings > 0) {
      this.printBullet(`Warnings: ${report.summary.warnings}`, COLORS.yellow);
    }

    // Detailed results
    if (report.details) {
      console.log('');
      this.printSection('Detailed Results:');

      // DynamoDB-OpenSearch consistency
      if (report.details.dynamoOpenSearchConsistency) {
        const consistency = report.details.dynamoOpenSearchConsistency;
        console.log('');
        this.printBullet(`🔄 DynamoDB-OpenSearch Consistency:`);
        this.printBullet(`   DynamoDB Studios: ${consistency.dynamoCount}`, COLORS.dim);
        this.printBullet(`   OpenSearch Studios: ${consistency.opensearchCount}`, COLORS.dim);
        this.printBullet(`   Consistent: ${consistency.consistent ? '✅' : '❌'}`, 
          consistency.consistent ? COLORS.green : COLORS.red);
      }

      // Image accessibility
      if (report.details.imageAccessibility) {
        const images = report.details.imageAccessibility;
        console.log('');
        this.printBullet(`🖼️  Image Accessibility:`);
        this.printBullet(`   Studios with Images: ${images.studiosWithImages}`, COLORS.dim);
        this.printBullet(`   Total Images Checked: ${images.totalImagesChecked}`, COLORS.dim);
        this.printBullet(`   Accessible: ${images.accessibleImages}`, COLORS.green);
        if (images.inaccessibleImages > 0) {
          this.printBullet(`   Inaccessible: ${images.inaccessibleImages}`, COLORS.red);
        }
      }

      // Artist-studio relationships
      if (report.details.artistStudioRelationships) {
        const relationships = report.details.artistStudioRelationships;
        console.log('');
        this.printBullet(`🔗 Artist-Studio Relationships:`);
        this.printBullet(`   Valid Relationships: ${relationships.validRelationships}`, COLORS.green);
        if (relationships.invalidRelationships > 0) {
          this.printBullet(`   Invalid Relationships: ${relationships.invalidRelationships}`, COLORS.red);
        }
        this.printBullet(`   Studios with Artists: ${relationships.studiosWithArtists}/${relationships.totalStudios}`, COLORS.dim);
        this.printBullet(`   Artists with Studios: ${relationships.artistsWithStudios}/${relationships.totalArtists}`, COLORS.dim);
      }

      // Frontend mock data consistency
      if (report.details.frontendMockConsistency) {
        const frontend = report.details.frontendMockConsistency;
        console.log('');
        this.printBullet(`🎭 Frontend Mock Data Consistency:`);
        this.printBullet(`   Backend Studios: ${frontend.backendStudios}`, COLORS.dim);
        this.printBullet(`   Frontend Studios: ${frontend.frontendStudios}`, COLORS.dim);
        this.printBullet(`   Consistent Studios: ${frontend.consistentStudios}`, COLORS.green);
        if (frontend.inconsistentStudios > 0) {
          this.printBullet(`   Inconsistent Studios: ${frontend.inconsistentStudios}`, COLORS.red);
        }
      }

      // Address validation
      if (report.details.addressValidation) {
        const addresses = report.details.addressValidation;
        console.log('');
        this.printBullet(`📍 Address Validation:`);
        this.printBullet(`   Total Studios: ${addresses.totalStudios}`, COLORS.dim);
        this.printBullet(`   Valid Addresses: ${addresses.validAddresses}`, COLORS.green);
        if (addresses.invalidAddresses > 0) {
          this.printBullet(`   Invalid Addresses: ${addresses.invalidAddresses}`, COLORS.red);
        }
      }

      // Specialty alignment
      if (report.details.specialtyAlignment) {
        const specialties = report.details.specialtyAlignment;
        console.log('');
        this.printBullet(`🎨 Specialty Alignment:`);
        this.printBullet(`   Total Studios: ${specialties.totalStudios}`, COLORS.dim);
        this.printBullet(`   Aligned Studios: ${specialties.alignedStudios}`, COLORS.green);
        if (specialties.misalignedStudios > 0) {
          this.printBullet(`   Misaligned Studios: ${specialties.misalignedStudios}`, COLORS.yellow);
        }
      }
    }

    // Show errors if any
    if (report.errors && report.errors.length > 0) {
      console.log('');
      this.printSection('Errors Found:');
      const maxErrors = options.verbose ? report.errors.length : Math.min(10, report.errors.length);
      for (let i = 0; i < maxErrors; i++) {
        const error = report.errors[i];
        this.printBullet(`${SYMBOLS.cross} [${error.type}] ${error.message}`, COLORS.red);
      }
      if (report.errors.length > maxErrors) {
        this.printBullet(`... and ${report.errors.length - maxErrors} more errors`, COLORS.dim);
      }
    }

    // Show warnings if any
    if (report.warnings && report.warnings.length > 0) {
      console.log('');
      this.printSection('Warnings:');
      const maxWarnings = options.verbose ? report.warnings.length : Math.min(5, report.warnings.length);
      for (let i = 0; i < maxWarnings; i++) {
        const warning = report.warnings[i];
        this.printBullet(`${SYMBOLS.warning} [${warning.type}] ${warning.message}`, COLORS.yellow);
      }
      if (report.warnings.length > maxWarnings) {
        this.printBullet(`... and ${report.warnings.length - maxWarnings} more warnings`, COLORS.dim);
      }
    }

    // Next steps
    console.log('');
    if (success) {
      this.printHighlight('All studio data validation checks passed! 🎉');
    } else {
      this.printSection('Recommended Actions:');
      this.printBullet('Review the errors above and fix data inconsistencies');
      this.printBullet('Run specific validation commands to focus on problem areas');
      this.printBullet('Use `npm run validate --workspace=scripts/documentation-analysis-studios` for studio-specific validation');
      this.printBullet('Use `npm run health-check` for service connectivity issues');
    }

    if (options['save-report']) {
      console.log('');
      this.printInfo(`📄 Detailed validation report saved with timestamp`);
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