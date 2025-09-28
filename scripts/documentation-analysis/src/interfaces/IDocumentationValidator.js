/**
 * Interface for Documentation Validator component
 * Defines the contract for validating documentation accuracy and completeness
 */

/**
 * @interface IDocumentationValidator
 */
class IDocumentationValidator {
  /**
   * Validates a complete documentation set
   * @param {Object} docs - Documentation set to validate
   * @returns {Promise<ValidationReport>} Validation results
   */
  async validateDocumentationSet(docs) {
    throw new Error('Method validateDocumentationSet must be implemented');
  }

  /**
   * Checks accuracy of file paths
   * @param {string[]} paths - Array of paths to validate
   * @returns {Promise<PathValidationResult>} Path validation results
   */
  async checkPathAccuracy(paths) {
    throw new Error('Method checkPathAccuracy must be implemented');
  }

  /**
   * Validates command examples in documentation
   * @param {Command[]} commands - Commands to validate
   * @returns {Promise<CommandValidationResult>} Command validation results
   */
  async validateCommandExamples(commands) {
    throw new Error('Method validateCommandExamples must be implemented');
  }

  /**
   * Generates compliance report
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport() {
    throw new Error('Method generateComplianceReport must be implemented');
  }

  /**
   * Validates that all file paths and references are correct
   * @param {string[]} paths - Paths to validate
   * @returns {Promise<PathValidationResult>} Validation results
   */
  async validatePaths(paths) {
    throw new Error('Method validatePaths must be implemented');
  }

  /**
   * Checks that documented commands work correctly
   * @param {Command[]} commands - Commands to check
   * @returns {Promise<CommandValidationResult>} Validation results
   */
  async checkCommandAccuracy(commands) {
    throw new Error('Method checkCommandAccuracy must be implemented');
  }

  /**
   * Validates that code snippets are syntactically correct
   * @param {string[]} codeSnippets - Code snippets to validate
   * @returns {Promise<ContentValidationResult>} Validation results
   */
  async validateCodeExamples(codeSnippets) {
    throw new Error('Method validateCodeExamples must be implemented');
  }

  /**
   * Identifies missing documentation
   * @param {Object} projectStructure - Project structure to analyze
   * @returns {Promise<Object>} Completeness analysis
   */
  async checkCompleteness(projectStructure) {
    throw new Error('Method checkCompleteness must be implemented');
  }
}

module.exports = IDocumentationValidator;