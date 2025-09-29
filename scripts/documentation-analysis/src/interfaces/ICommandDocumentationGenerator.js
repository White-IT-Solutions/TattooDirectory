/**
 * Interface for Command Documentation Generator component
 * Defines the contract for generating documentation from npm scripts and CLI commands
 */

/**
 * @interface ICommandDocumentationGenerator
 */
class ICommandDocumentationGenerator {
  /**
   * Extracts commands from a package.json file
   * @param {string} packagePath - Path to package.json file
   * @returns {Promise<Object>} Command mapping
   */
  async extractCommands(packagePath) {
    throw new Error('Method extractCommands must be implemented');
  }

  /**
   * Generates comprehensive command reference documentation
   * @returns {Promise<string>} Command documentation content
   */
  async generateCommandReference() {
    throw new Error('Method generateCommandReference must be implemented');
  }

  /**
   * Validates that documented commands are accurate and functional
   * @returns {Promise<Object>} Validation results
   */
  async validateCommandAccuracy() {
    throw new Error('Method validateCommandAccuracy must be implemented');
  }

  /**
   * Creates usage examples for commands
   * @param {Command} command - Command to create examples for
   * @returns {Promise<UsageExample[]>} Array of usage examples
   */
  async createUsageExamples(command) {
    throw new Error('Method createUsageExamples must be implemented');
  }

  /**
   * Parses package.json files to extract npm scripts
   * @param {string[]} packagePaths - Array of package.json file paths
   * @returns {Promise<Object>} Parsed scripts mapping
   */
  async parsePackageJson(packagePaths) {
    throw new Error('Method parsePackageJson must be implemented');
  }

  /**
   * Categorizes commands by functionality
   * @param {Command[]} commands - Array of commands to categorize
   * @returns {Promise<Object>} Categorized commands
   */
  async categorizeCommands(commands) {
    throw new Error('Method categorizeCommands must be implemented');
  }

  /**
   * Generates comprehensive command documentation
   * @param {Object} categorizedCommands - Commands organized by category
   * @returns {Promise<string>} Generated documentation content
   */
  async generateCommandDocs(categorizedCommands) {
    throw new Error('Method generateCommandDocs must be implemented');
  }

  /**
   * Validates that commands are functional
   * @param {Command[]} commands - Commands to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateCommands(commands) {
    throw new Error('Method validateCommands must be implemented');
  }
}

module.exports = ICommandDocumentationGenerator;