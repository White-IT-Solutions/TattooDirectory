/**
 * Command Documentation Generator Implementation
 * Generates documentation from npm scripts and CLI commands
 */

const ICommandDocumentationGenerator = require('./interfaces/ICommandDocumentationGenerator');
const FileUtils = require('./utils/FileUtils');
const MarkdownUtils = require('./utils/MarkdownUtils');
const { getCommandCategories, getValidationConfig, getProjectRoot } = require('../config/documentation-config');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

class CommandDocumentationGenerator extends ICommandDocumentationGenerator {
  constructor() {
    super();
    this.commandCategories = getCommandCategories();
    this.validationConfig = getValidationConfig();
    this.projectRoot = getProjectRoot();
  }

  /**
   * Generates command reference documentation
   * @returns {Promise<Object[]>} Array of command documentation
   */
  async generateReference() {
    try {
      const content = await this.generateCommandReference();
      const packagePaths = [
        path.join(this.projectRoot, 'package.json'),
        path.join(this.projectRoot, 'frontend', 'package.json'),
        path.join(this.projectRoot, 'backend', 'package.json')
      ];
      
      const commands = [];
      for (const packagePath of packagePaths) {
        if (await FileUtils.fileExists(packagePath)) {
          const extracted = await this.extractCommands(packagePath);
          commands.push(...extracted.commands);
        }
      }
      
      return commands;
    } catch (error) {
      console.warn('Error generating reference:', error.message);
      return [];
    }
  }

  /**
   * Updates existing command documentation
   * @returns {Promise<Object>} Update results
   */
  async updateDocumentation() {
    try {
      const commands = await this.generateReference();
      const commandRefPath = path.join(this.projectRoot, 'docs', 'reference', 'command-reference.md');
      
      if (await FileUtils.fileExists(commandRefPath)) {
        const content = await this.generateCommandDocs({ all: commands });
        await FileUtils.writeFile(commandRefPath, content);
        return { updated: true, path: commandRefPath, commands: commands.length };
      }
      
      return { updated: false, reason: 'Command reference file not found' };
    } catch (error) {
      console.warn('Error updating documentation:', error.message);
      return { updated: false, error: error.message };
    }
  }

  /**
   * Extracts commands from a package.json file
   * @param {string} packagePath - Path to package.json file
   * @returns {Promise<Object>} Command mapping
   */
  async extractCommands(packagePath) {
    try {
      const content = await FileUtils.readFile(packagePath);
      if (!content) {
        return { commands: [], packageInfo: null };
      }

      const packageJson = JSON.parse(content);
      const scripts = packageJson.scripts || {};
      const commands = [];

      for (const [name, script] of Object.entries(scripts)) {
        const command = {
          name,
          script,
          description: this._generateCommandDescription(name, script),
          category: this._categorizeCommand(name, script),
          parameters: this._extractParameters(script),
          examples: [],
          relatedCommands: [],
          packagePath: packagePath
        };
        commands.push(command);
      }

      return {
        commands,
        packageInfo: {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          path: packagePath
        }
      };
    } catch (error) {
      console.warn(`Warning: Could not extract commands from ${packagePath}: ${error.message}`);
      return { commands: [], packageInfo: null };
    }
  }

  /**
   * Generates comprehensive command reference documentation
   * @returns {Promise<string>} Command documentation content
   */
  async generateCommandReference() {
    try {
      // Get all package.json files
      const packagePaths = [
        path.join(this.projectRoot, 'package.json'),
        path.join(this.projectRoot, 'frontend/package.json'),
        path.join(this.projectRoot, 'backend/package.json'),
        path.join(this.projectRoot, 'scripts/package.json')
      ];

      // Parse all package.json files
      const allCommands = await this.parsePackageJson(packagePaths);
      
      // Categorize commands
      const categorizedCommands = await this.categorizeCommands(allCommands.commands);
      
      // Generate documentation
      return await this.generateCommandDocs(categorizedCommands);
    } catch (error) {
      console.error('Error generating command reference:', error);
      throw error;
    }
  }

  /**
   * Validates that documented commands are accurate and functional
   * @returns {Promise<Object>} Validation results
   */
  async validateCommandAccuracy() {
    try {
      const packagePaths = [
        path.join(this.projectRoot, 'package.json'),
        path.join(this.projectRoot, 'frontend/package.json'),
        path.join(this.projectRoot, 'backend/package.json'),
        path.join(this.projectRoot, 'scripts/package.json')
      ];

      const allCommands = await this.parsePackageJson(packagePaths);
      return await this.validateCommands(allCommands.commands);
    } catch (error) {
      console.error('Error validating command accuracy:', error);
      return {
        isValid: false,
        failedCommands: [],
        suggestions: [`Error during validation: ${error.message}`],
        overallScore: 0
      };
    }
  }

  /**
   * Creates usage examples for commands
   * @param {Command} command - Command to create examples for
   * @returns {Promise<UsageExample[]>} Array of usage examples
   */
  async createUsageExamples(command) {
    const examples = [];
    
    try {
      // Generate examples based on command category and name
      switch (command.category) {
        case 'data':
          examples.push(...this._createDataCommandExamples(command));
          break;
        case 'development':
          examples.push(...this._createDevelopmentCommandExamples(command));
          break;
        case 'testing':
          examples.push(...this._createTestingCommandExamples(command));
          break;
        case 'deployment':
          examples.push(...this._createDeploymentCommandExamples(command));
          break;
        case 'monitoring':
          examples.push(...this._createMonitoringCommandExamples(command));
          break;
        default:
          examples.push(this._createGenericExample(command));
      }
    } catch (error) {
      console.warn(`Warning: Could not create examples for command ${command.name}: ${error.message}`);
    }

    return examples;
  }

  /**
   * Parses package.json files to extract npm scripts
   * @param {string[]} packagePaths - Array of package.json file paths
   * @returns {Promise<Object>} Parsed scripts mapping
   */
  async parsePackageJson(packagePaths) {
    const allCommands = [];
    const packageInfos = [];
    const errors = [];

    for (const packagePath of packagePaths) {
      try {
        const result = await this.extractCommands(packagePath);
        if (result.commands.length > 0) {
          allCommands.push(...result.commands);
        }
        if (result.packageInfo) {
          packageInfos.push(result.packageInfo);
        }
      } catch (error) {
        errors.push({
          packagePath,
          error: error.message
        });
      }
    }

    // Find related commands
    this._linkRelatedCommands(allCommands);

    return {
      commands: allCommands,
      packages: packageInfos,
      errors
    };
  }

  /**
   * Categorizes commands by functionality
   * @param {Command[]} commands - Array of commands to categorize
   * @returns {Promise<Object>} Categorized commands
   */
  async categorizeCommands(commands) {
    const categorized = {
      data: [],
      development: [],
      testing: [],
      deployment: [],
      monitoring: [],
      uncategorized: []
    };

    for (const command of commands) {
      const category = command.category || 'uncategorized';
      if (categorized[category]) {
        categorized[category].push(command);
      } else {
        categorized.uncategorized.push(command);
      }
    }

    // Sort commands within each category
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return categorized;
  }

  /**
   * Generates comprehensive command documentation
   * @param {Object} categorizedCommands - Commands organized by category
   * @returns {Promise<string>} Generated documentation content
   */
  async generateCommandDocs(categorizedCommands) {
    const sections = [];
    
    // Header
    sections.push('# Command Reference');
    sections.push('');
    sections.push('This document provides a comprehensive reference for all npm scripts and CLI commands available in the Tattoo Artist Directory MVP project.');
    sections.push('');

    // Table of Contents
    const tocItems = [];
    Object.keys(categorizedCommands).forEach(category => {
      if (categorizedCommands[category].length > 0) {
        const categoryTitle = this._formatCategoryTitle(category);
        tocItems.push(`- [${categoryTitle}](#${MarkdownUtils.createAnchor(categoryTitle)})`);
      }
    });
    
    if (tocItems.length > 0) {
      sections.push('## Table of Contents');
      sections.push('');
      sections.push(...tocItems);
      sections.push('');
    }

    // Generate sections for each category
    for (const [category, commands] of Object.entries(categorizedCommands)) {
      if (commands.length === 0) continue;

      const categoryTitle = this._formatCategoryTitle(category);
      const categoryDescription = this.commandCategories[category]?.description || 'Various commands';
      
      sections.push(`## ${categoryTitle}`);
      sections.push('');
      sections.push(categoryDescription);
      sections.push('');

      for (const command of commands) {
        sections.push(`### \`${command.name}\``);
        sections.push('');
        sections.push(`**Script:** \`${command.script}\``);
        sections.push('');
        sections.push(`**Description:** ${command.description}`);
        sections.push('');

        if (command.parameters && command.parameters.length > 0) {
          sections.push('**Parameters:**');
          sections.push('');
          command.parameters.forEach(param => {
            const required = param.required ? ' (required)' : ' (optional)';
            sections.push(`- \`${param.name}\`${required}: ${param.description}`);
          });
          sections.push('');
        }

        // Generate examples
        const examples = await this.createUsageExamples(command);
        if (examples.length > 0) {
          sections.push('**Usage Examples:**');
          sections.push('');
          examples.forEach(example => {
            sections.push(`**${example.scenario}:**`);
            sections.push('```bash');
            sections.push(example.command);
            sections.push('```');
            if (example.expectedOutput) {
              sections.push(`Expected output: ${example.expectedOutput}`);
            }
            if (example.notes && example.notes.length > 0) {
              sections.push('Notes:');
              example.notes.forEach(note => sections.push(`- ${note}`));
            }
            sections.push('');
          });
        }

        if (command.relatedCommands && command.relatedCommands.length > 0) {
          sections.push('**Related Commands:**');
          sections.push('');
          command.relatedCommands.forEach(related => {
            sections.push(`- \`${related}\``);
          });
          sections.push('');
        }

        sections.push('---');
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  /**
   * Validates that commands are functional
   * @param {Command[]} commands - Commands to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateCommands(commands) {
    const results = {
      isValid: true,
      failedCommands: [],
      suggestions: [],
      validatedCommands: 0,
      skippedCommands: 0,
      totalCommands: commands.length
    };

    for (const command of commands) {
      // Skip commands that are known to be interactive or long-running
      if (this.validationConfig.skipCommandValidation.some(skip => command.name.includes(skip))) {
        results.skippedCommands++;
        continue;
      }

      try {
        // For npm scripts, we can validate they exist in package.json
        // We don't execute them as they might be long-running or interactive
        const packagePath = command.packagePath;
        const content = await FileUtils.readFile(packagePath);
        
        if (content) {
          const packageJson = JSON.parse(content);
          if (packageJson.scripts && packageJson.scripts[command.name]) {
            results.validatedCommands++;
          } else {
            results.failedCommands.push({
              command: command.name,
              error: 'Command not found in package.json',
              packagePath
            });
            results.isValid = false;
          }
        }
      } catch (error) {
        results.failedCommands.push({
          command: command.name,
          error: error.message,
          packagePath: command.packagePath
        });
        results.isValid = false;
      }
    }

    // Generate suggestions
    if (results.failedCommands.length > 0) {
      results.suggestions.push('Review failed commands and ensure they exist in their respective package.json files');
      results.suggestions.push('Check for typos in command names');
      results.suggestions.push('Verify package.json files are valid JSON');
    }

    return results;
  }

  // Private helper methods

  /**
   * Generates a description for a command based on its name and script
   * @param {string} name - Command name
   * @param {string} script - Command script
   * @returns {string} Generated description
   */
  _generateCommandDescription(name, script) {
    // Common patterns and their descriptions
    const patterns = [
      { pattern: /^dev/, description: 'Starts development server' },
      { pattern: /^build/, description: 'Builds the application for production' },
      { pattern: /^test/, description: 'Runs tests' },
      { pattern: /^start/, description: 'Starts the application' },
      { pattern: /^deploy/, description: 'Deploys the application' },
      { pattern: /^seed/, description: 'Seeds data' },
      { pattern: /^reset/, description: 'Resets data or state' },
      { pattern: /^validate/, description: 'Validates data or configuration' },
      { pattern: /^monitor/, description: 'Monitors system or performance' },
      { pattern: /^health/, description: 'Checks system health' },
      { pattern: /^local:/, description: 'Local development command' },
      { pattern: /^setup/, description: 'Sets up environment or data' },
      { pattern: /^clean/, description: 'Cleans up files or data' },
      { pattern: /^lint/, description: 'Lints code for style and errors' },
      { pattern: /^coverage/, description: 'Generates test coverage report' }
    ];

    for (const { pattern, description } of patterns) {
      if (pattern.test(name)) {
        return description;
      }
    }

    // Fallback: try to infer from script content
    if (script.includes('jest')) return 'Runs Jest tests';
    if (script.includes('playwright')) return 'Runs Playwright tests';
    if (script.includes('next dev')) return 'Starts Next.js development server';
    if (script.includes('next build')) return 'Builds Next.js application';
    if (script.includes('docker-compose')) return 'Docker compose command';
    if (script.includes('node ')) return 'Runs Node.js script';

    return 'Custom command';
  }

  /**
   * Categorizes a command based on its name and script
   * @param {string} name - Command name
   * @param {string} script - Command script
   * @returns {string} Category name
   */
  _categorizeCommand(name, script) {
    for (const [category, config] of Object.entries(this.commandCategories)) {
      if (config.keywords.some(keyword => 
        name.toLowerCase().includes(keyword) || script.toLowerCase().includes(keyword)
      )) {
        return category;
      }
    }
    return 'uncategorized';
  }

  /**
   * Extracts parameters from a command script
   * @param {string} script - Command script
   * @returns {Array} Array of parameter objects
   */
  _extractParameters(script) {
    const parameters = [];
    
    // Look for common parameter patterns
    const paramPatterns = [
      { pattern: /--(\w+)/g, type: 'flag' },
      { pattern: /-(\w)/g, type: 'short-flag' },
      { pattern: /\$\{?(\w+)\}?/g, type: 'environment' }
    ];

    paramPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(script)) !== null) {
        const name = match[1];
        if (!parameters.find(p => p.name === name)) {
          parameters.push({
            name,
            type,
            required: false,
            description: `${type} parameter`
          });
        }
      }
    });

    return parameters;
  }

  /**
   * Links related commands based on naming patterns
   * @param {Command[]} commands - Array of commands to link
   */
  _linkRelatedCommands(commands) {
    commands.forEach(command => {
      const related = commands
        .filter(other => other.name !== command.name)
        .filter(other => {
          // Find commands with similar prefixes
          const commandPrefix = command.name.split(':')[0];
          const otherPrefix = other.name.split(':')[0];
          return commandPrefix === otherPrefix && commandPrefix !== command.name;
        })
        .map(other => other.name);
      
      command.relatedCommands = related.slice(0, 5); // Limit to 5 related commands
    });
  }

  /**
   * Creates examples for data management commands
   * @param {Command} command - Command object
   * @returns {Array} Array of usage examples
   */
  _createDataCommandExamples(command) {
    const examples = [];
    
    if (command.name.includes('seed')) {
      examples.push({
        scenario: 'Basic data seeding',
        command: `npm run ${command.name}`,
        expectedOutput: 'Data seeded successfully',
        notes: ['Ensure LocalStack is running before seeding data']
      });
    }
    
    if (command.name.includes('reset')) {
      examples.push({
        scenario: 'Reset data to clean state',
        command: `npm run ${command.name}`,
        expectedOutput: 'Data reset completed',
        notes: ['This will remove all existing data']
      });
    }
    
    if (command.name.includes('validate')) {
      examples.push({
        scenario: 'Validate data integrity',
        command: `npm run ${command.name}`,
        expectedOutput: 'Validation completed with results',
        notes: ['Check the output for any validation errors']
      });
    }

    return examples;
  }

  /**
   * Creates examples for development commands
   * @param {Command} command - Command object
   * @returns {Array} Array of usage examples
   */
  _createDevelopmentCommandExamples(command) {
    const examples = [];
    
    if (command.name.includes('dev')) {
      examples.push({
        scenario: 'Start development server',
        command: `npm run ${command.name}`,
        expectedOutput: 'Development server running on http://localhost:3000',
        notes: ['Server will auto-reload on file changes']
      });
    }
    
    if (command.name.includes('start')) {
      examples.push({
        scenario: 'Start local environment',
        command: `npm run ${command.name}`,
        expectedOutput: 'All services started successfully',
        notes: ['Includes frontend, backend, and LocalStack services']
      });
    }

    return examples;
  }

  /**
   * Creates examples for testing commands
   * @param {Command} command - Command object
   * @returns {Array} Array of usage examples
   */
  _createTestingCommandExamples(command) {
    const examples = [];
    
    if (command.name.includes('test')) {
      examples.push({
        scenario: 'Run tests',
        command: `npm run ${command.name}`,
        expectedOutput: 'Test results with pass/fail status',
        notes: ['Ensure test environment is properly set up']
      });
      
      if (command.name.includes('watch')) {
        examples.push({
          scenario: 'Run tests in watch mode',
          command: `npm run ${command.name}`,
          expectedOutput: 'Tests running in watch mode',
          notes: ['Tests will re-run when files change']
        });
      }
    }

    return examples;
  }

  /**
   * Creates examples for deployment commands
   * @param {Command} command - Command object
   * @returns {Array} Array of usage examples
   */
  _createDeploymentCommandExamples(command) {
    const examples = [];
    
    if (command.name.includes('build')) {
      examples.push({
        scenario: 'Build for production',
        command: `npm run ${command.name}`,
        expectedOutput: 'Build completed successfully',
        notes: ['Output will be in the build/dist directory']
      });
    }
    
    if (command.name.includes('deploy')) {
      examples.push({
        scenario: 'Deploy to environment',
        command: `npm run ${command.name}`,
        expectedOutput: 'Deployment completed',
        notes: ['Ensure proper AWS credentials are configured']
      });
    }

    return examples;
  }

  /**
   * Creates examples for monitoring commands
   * @param {Command} command - Command object
   * @returns {Array} Array of usage examples
   */
  _createMonitoringCommandExamples(command) {
    const examples = [];
    
    if (command.name.includes('monitor')) {
      examples.push({
        scenario: 'Monitor system performance',
        command: `npm run ${command.name}`,
        expectedOutput: 'Monitoring dashboard or metrics',
        notes: ['Use Ctrl+C to stop monitoring']
      });
    }
    
    if (command.name.includes('health')) {
      examples.push({
        scenario: 'Check system health',
        command: `npm run ${command.name}`,
        expectedOutput: 'Health check results',
        notes: ['Shows status of all services']
      });
    }

    return examples;
  }

  /**
   * Creates a generic example for uncategorized commands
   * @param {Command} command - Command object
   * @returns {Object} Usage example
   */
  _createGenericExample(command) {
    return {
      scenario: 'Run command',
      command: `npm run ${command.name}`,
      expectedOutput: 'Command execution output',
      notes: ['Check command documentation for specific usage']
    };
  }

  /**
   * Formats category title for display
   * @param {string} category - Category name
   * @returns {string} Formatted title
   */
  _formatCategoryTitle(category) {
    return category.charAt(0).toUpperCase() + category.slice(1) + ' Commands';
  }
}

module.exports = CommandDocumentationGenerator;