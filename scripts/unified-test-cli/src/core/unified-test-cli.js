/**
 * UnifiedTestCLI - Main CLI orchestrator class
 * 
 * Coordinates test discovery, environment validation, data management,
 * and test execution across all test suites.
 */

import chalk from 'chalk';
import { TestDiscovery } from './test-discovery.js';
import { ServiceValidator } from './service-validator.js';
import { DataManager } from './data-manager.js';
import { EnhancedTestExecutor } from './enhanced-test-executor.js';
import { InteractiveMenu } from '../cli/interactive-menu.js';
import { ParallelExecutor } from '../utils/parallel-executor.js';
import { Logger } from '../utils/logger.js';
import { CIDetector } from '../utils/ci-detector.js';
import { ArtifactGenerator } from '../utils/artifact-generator.js';
import ConsoleReporter from '../reporters/console-reporter.js';
import JUnitReporter from '../reporters/junit-reporter.js';
import { JSONReporter } from '../reporters/json-reporter.js';

class UnifiedTestCLI {
  constructor() {
    this.testDiscovery = new TestDiscovery();
    this.serviceValidator = new ServiceValidator();
    this.dataManager = new DataManager();
    this.testExecutor = new EnhancedTestExecutor();
    this.interactiveMenu = new InteractiveMenu();
    this.parallelExecutor = new ParallelExecutor();
    this.logger = new Logger();
    this.ciDetector = new CIDetector();
    this.artifactGenerator = new ArtifactGenerator();
  }

  /**
   * Main CLI execution method
   * @param {string} suiteName - Optional test suite name
   * @param {Object} options - CLI options
   */
  async run(suiteName, options = {}) {
    this.logger.info('Starting Unified Test CLI');

    try {
      // Detect CI environment and apply CI-specific configuration
      const ciConfig = this.ciDetector.getCIConfig();
      if (ciConfig.isCI) {
        this.logger.info('CI environment detected', { 
          provider: ciConfig.environment?.name,
          nonInteractive: ciConfig.nonInteractive 
        });
        
        // Apply CI defaults
        options.ci = true;
        options.nonInteractive = ciConfig.nonInteractive;
        if (ciConfig.parallelDefault && !options.hasOwnProperty('parallel')) {
          options.parallel = true;
        }
      }

      // Initialize reporters based on environment and options
      const reporters = this._initializeReporters(options, ciConfig);
      
      // Start reporting
      await Promise.all(reporters.map(reporter => reporter.start()));

      // Discover available test suites
      const availableSuites = await this.testDiscovery.discoverSuites();
      
      if (availableSuites.length === 0) {
        throw new Error('No test suites found in the workspace');
      }

      // Determine which suite(s) to run
      let suitesToRun;
      if (suiteName) {
        const suite = availableSuites.find(s => s.name === suiteName);
        if (!suite) {
          throw new Error(`Test suite '${suiteName}' not found`);
        }
        suitesToRun = [suite];
      } else if (options.ci || options.nonInteractive) {
        // In CI mode, run all critical suites
        suitesToRun = availableSuites.filter(s => s.tags?.includes('critical'));
        if (suitesToRun.length === 0) {
          // Fallback to all suites if no critical suites found
          suitesToRun = availableSuites;
        }
      } else {
        // Interactive mode - show menu
        suitesToRun = await this.interactiveMenu.showSuiteSelectionMenu(availableSuites);
        
        // Handle case where user cancels or no suites selected
        if (!suitesToRun || suitesToRun.length === 0) {
          this.logger.info('No test suites selected');
          return { success: true, results: [], message: 'No suites selected' };
        }
        
        // Show execution options menu if suites were selected
        if (suitesToRun.length > 0) {
          const executionOptions = await this.interactiveMenu.showExecutionOptionsMenu(suitesToRun);
          Object.assign(options, executionOptions);
          
          // Show confirmation menu
          const proceed = await this.interactiveMenu.showConfirmationMenu(suitesToRun, options);
          if (!proceed) {
            this.logger.info('Test execution cancelled by user');
            return;
          }
        }
      }

      // Execute the selected test suites with reporting
      let testResults;
      if (options.parallel && suitesToRun && suitesToRun.length > 1) {
        this.logger.info('Executing test suites in parallel', { 
          suiteCount: suitesToRun.length,
          maxConcurrency: options.maxParallel || 3
        });
        
        testResults = await this._executeWithReporting(
          () => this.parallelExecutor.executeParallel(suitesToRun, {
            maxConcurrency: options.maxParallel || 3,
            scenario: options.scenario,
            coverage: options.coverage,
            ci: options.ci,
            reporters: reporters
          }),
          reporters
        );
      } else {
        // Sequential execution
        testResults = await this._executeWithReporting(
          async () => {
            const results = [];
            for (const suite of suitesToRun) {
              const result = await this.testExecutor.executeSuite(suite, {
                scenario: options.scenario,
                coverage: options.coverage,
                ci: options.ci,
                reporters: reporters
              });
              results.push(result);
            }
            return results;
          },
          reporters
        );
      }

      // Generate final reports and artifacts
      const reporterResults = await Promise.all(
        reporters.map(async reporter => {
          try {
            return await reporter.summary();
          } catch (error) {
            this.logger.warn('Reporter failed to generate summary', { 
              reporter: reporter.constructor.name,
              error: error.message 
            });
            return { success: false, error: error.message };
          }
        })
      );

      // Generate CI/CD artifacts if in CI environment
      if (ciConfig.isCI) {
        await this.artifactGenerator.generateArtifacts(testResults, reporterResults);
      }

      // Check for failures and set appropriate exit code
      const hasFailures = (testResults || []).some(r => r.status === 'failed') || 
                         (reporterResults || []).some(r => !r.success);
      
      if (hasFailures) {
        const exitCode = this.artifactGenerator.getExitCode({ 
          success: false, 
          failedTests: testResults.filter(r => r.status === 'failed').length 
        });
        
        if (ciConfig.exitOnFailure) {
          process.exit(exitCode);
        } else {
          throw new Error('Some test suites failed');
        }
      }

      this.logger.success('All test suites completed successfully');
      
      // Exit with success code in CI
      if (ciConfig.isCI) {
        process.exit(0);
      }
      
    } catch (error) {
      this.logger.error('CLI execution failed', { error: error.message });
      
      // Set appropriate exit code in CI
      if (this.ciDetector.isCI()) {
        const exitCode = this.artifactGenerator.getExitCode({ success: false });
        process.exit(exitCode);
      }
      
      throw error;
    }
  }

  /**
   * List all available test suites
   * @param {Object} options - List options
   */
  async listSuites(options = {}) {
    try {
      const suites = await this.testDiscovery.discoverSuites({ silent: options.json });
      
      if (options.json) {
        console.log(JSON.stringify(suites, null, 2));
      } else {
        console.log(chalk.blue('\n📋 Available Test Suites:\n'));
        suites.forEach(suite => {
          console.log(`${chalk.green('•')} ${chalk.bold(suite.displayName || suite.name)}`);
          console.log(`  ${chalk.gray(suite.description || 'No description available')}`);
          console.log(`  ${chalk.cyan('Type:')} ${suite.type || 'unknown'}`);
          console.log(`  ${chalk.cyan('Workspace:')} ${suite.workspace || 'root'}`);
          if (suite.tags?.length > 0) {
            console.log(`  ${chalk.cyan('Tags:')} ${suite.tags.join(', ')}`);
          }
          console.log();
        });
      }
    } catch (error) {
      this.logger.error('Failed to list test suites', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate environment and services
   * @param {Object} options - Validation options
   */
  async validateEnvironment(options = {}) {
    try {
      const services = options.services ? options.services.split(',') : null;
      const results = await this.serviceValidator.validateEnvironment(services);
      
      console.log(chalk.blue('\n🔍 Environment Validation Results:\n'));
      
      for (const [service, result] of Object.entries(results)) {
        if (result.status === 'healthy') {
          console.log(`${chalk.green('✅')} ${service}: ${chalk.green('Available')}`);
        } else {
          console.log(`${chalk.red('❌')} ${service}: ${chalk.red('Unavailable')}`);
          if (result.suggestions?.length > 0) {
            console.log(`   ${chalk.yellow('Suggestions:')}`);
            result.suggestions.forEach(suggestion => {
              console.log(`   • ${suggestion}`);
            });
          }
        }
      }
      
      const allHealthy = Object.values(results).every(r => r.status === 'healthy');
      if (allHealthy) {
        console.log(chalk.green('\n✅ All services are available and ready for testing'));
      } else {
        console.log(chalk.red('\n❌ Some services are not available. Please address the issues above.'));
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('Environment validation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize reporters based on options and CI configuration
   * @param {Object} options - CLI options
   * @param {Object} ciConfig - CI configuration
   * @returns {Array} Array of initialized reporters
   */
  _initializeReporters(options, ciConfig) {
    const reporters = [];
    
    // Always include console reporter (unless explicitly disabled)
    if (!options.quiet) {
      reporters.push(new ConsoleReporter({
        verbose: options.verbose || ciConfig.isCI,
        colors: !ciConfig.isCI || process.env.FORCE_COLOR === 'true'
      }));
    }
    
    // Add JUnit reporter for CI environments or when explicitly requested
    if (ciConfig.isCI || options.junit || ciConfig.outputFormats?.includes('junit')) {
      const artifactPaths = this.ciDetector.getArtifactPaths();
      reporters.push(new JUnitReporter({
        outputDir: artifactPaths.testResults,
        outputFile: 'junit.xml'
      }));
    }
    
    // Add JSON reporter for CI environments or when explicitly requested
    if (ciConfig.isCI || options.json || ciConfig.outputFormats?.includes('json')) {
      const artifactPaths = this.ciDetector.getArtifactPaths();
      reporters.push(new JSONReporter({
        outputDir: artifactPaths.testResults,
        outputFile: 'results.json',
        includeEnvironment: ciConfig.isCI
      }));
    }
    
    return reporters;
  }

  /**
   * Execute test suites with proper reporting integration
   * @param {Function} executionFn - Function that executes the tests
   * @param {Array} reporters - Array of reporters
   * @returns {Array} Test results
   */
  async _executeWithReporting(executionFn, reporters) {
    try {
      // Execute tests
      const results = await executionFn();
      
      // Report results to all reporters
      if (Array.isArray(results)) {
        results.forEach(result => {
          reporters.forEach(reporter => {
            if (typeof reporter.suiteComplete === 'function') {
              reporter.suiteComplete(result);
            }
          });
        });
      }
      
      return results;
    } catch (error) {
      // Report error to all reporters
      reporters.forEach(reporter => {
        if (typeof reporter.error === 'function') {
          reporter.error('Test execution failed', error);
        }
      });
      throw error;
    }
  }


}

export { UnifiedTestCLI };