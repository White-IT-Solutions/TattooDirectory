/**
 * Interface for Documentation Analyzer component
 * Defines the contract for analyzing existing documentation structure
 */

/**
 * @interface IDocumentationAnalyzer
 */
class IDocumentationAnalyzer {
  /**
   * Analyzes the current documentation structure
   * @returns {Promise<DocumentationMap>} Map of current documentation state
   */
  async analyzeStructure() {
    throw new Error('Method analyzeStructure must be implemented');
  }

  /**
   * Validates references in documentation files
   * @returns {Promise<ValidationReport>} Validation results
   */
  async validateReferences() {
    throw new Error('Method validateReferences must be implemented');
  }

  /**
   * Extracts content from a specific file
   * @param {string} filePath - Path to the file to extract content from
   * @returns {Promise<ContentInfo>} Extracted content information
   */
  async extractContent(filePath) {
    throw new Error('Method extractContent must be implemented');
  }

  /**
   * Generates a gap analysis report
   * @returns {Promise<GapAnalysisReport>} Gap analysis results
   */
  async generateGapReport() {
    throw new Error('Method generateGapReport must be implemented');
  }

  /**
   * Maps current documentation files and their status
   * @returns {Promise<DocumentationMap>} Documentation mapping
   */
  async analyzeDocumentationStructure() {
    throw new Error('Method analyzeDocumentationStructure must be implemented');
  }

  /**
   * Identifies files marked as moved and validates their locations
   * @returns {Promise<MovedFileInfo[]>} Information about moved files
   */
  async identifyMovedFiles() {
    throw new Error('Method identifyMovedFiles must be implemented');
  }

  /**
   * Extracts valid content from existing documentation files
   * @param {string[]} filePaths - Array of file paths to process
   * @returns {Promise<ContentInfo[]>} Valid content information
   */
  async extractValidContent(filePaths) {
    throw new Error('Method extractValidContent must be implemented');
  }

  /**
   * Detects duplicate or overlapping documentation
   * @returns {Promise<DuplicateInfo[]>} Information about duplicate content
   */
  async detectDuplicates() {
    throw new Error('Method detectDuplicates must be implemented');
  }
}

module.exports = IDocumentationAnalyzer;