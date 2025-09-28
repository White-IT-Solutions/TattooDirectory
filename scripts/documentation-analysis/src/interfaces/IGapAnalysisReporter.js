/**
 * Interface for Gap Analysis Reporter component
 * Defines the contract for identifying and reporting documentation gaps
 */

/**
 * @interface IGapAnalysisReporter
 */
class IGapAnalysisReporter {
  /**
   * Analyzes missing documentation
   * @param {Object} projectStructure - Project structure to analyze
   * @returns {Promise<MissingDocInfo[]>} Missing documentation information
   */
  async analyzeMissingDocumentation(projectStructure) {
    throw new Error('Method analyzeMissingDocumentation must be implemented');
  }

  /**
   * Identifies outdated content
   * @param {DocumentationMap} documentationMap - Current documentation mapping
   * @returns {Promise<OutdatedContentInfo[]>} Outdated content information
   */
  async identifyOutdatedContent(documentationMap) {
    throw new Error('Method identifyOutdatedContent must be implemented');
  }

  /**
   * Creates priority matrix for documentation improvements
   * @param {MissingDocInfo[]} missingDocs - Missing documentation items
   * @param {OutdatedContentInfo[]} outdatedContent - Outdated content items
   * @returns {Promise<PriorityMatrix>} Priority matrix
   */
  async generatePriorityMatrix(missingDocs, outdatedContent) {
    throw new Error('Method generatePriorityMatrix must be implemented');
  }

  /**
   * Generates comprehensive gap analysis report
   * @param {Object} analysisData - Analysis data to include in report
   * @returns {Promise<GapAnalysisReport>} Complete gap analysis report
   */
  async generateGapReport(analysisData) {
    throw new Error('Method generateGapReport must be implemented');
  }
}

module.exports = IGapAnalysisReporter;