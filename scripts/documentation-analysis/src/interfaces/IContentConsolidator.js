/**
 * Interface for Content Consolidator component
 * Defines the contract for consolidating and organizing documentation content
 */

/**
 * @interface IContentConsolidator
 */
class IContentConsolidator {
  /**
   * Consolidates content from a documentation section
   * @param {DocumentationSection} section - Section to consolidate
   * @returns {Promise<string>} Consolidated content
   */
  async consolidateSection(section) {
    throw new Error('Method consolidateSection must be implemented');
  }

  /**
   * Updates cross-references in content
   * @param {string} content - Content to update
   * @returns {Promise<string>} Updated content with corrected references
   */
  async updateCrossReferences(content) {
    throw new Error('Method updateCrossReferences must be implemented');
  }

  /**
   * Generates navigation structure for documentation
   * @param {DocumentationSection[]} structure - Documentation structure
   * @returns {Promise<Object>} Navigation mapping
   */
  async generateNavigation(structure) {
    throw new Error('Method generateNavigation must be implemented');
  }

  /**
   * Validates links in content
   * @param {string} content - Content to validate
   * @returns {Promise<Object>} Link validation results
   */
  async validateLinks(content) {
    throw new Error('Method validateLinks must be implemented');
  }

  /**
   * Consolidates related documentation into unified files
   * @param {DocumentationSection[]} sections - Sections to consolidate
   * @returns {Promise<Object>} Consolidation results
   */
  async consolidateContent(sections) {
    throw new Error('Method consolidateContent must be implemented');
  }

  /**
   * Applies consistent markdown formatting
   * @param {string} content - Content to format
   * @returns {Promise<string>} Formatted content
   */
  async standardizeFormatting(content) {
    throw new Error('Method standardizeFormatting must be implemented');
  }

  /**
   * Updates internal links and file references
   * @param {string} content - Content to update
   * @param {Object} referenceMap - Mapping of old to new references
   * @returns {Promise<string>} Updated content
   */
  async updateReferences(content, referenceMap) {
    throw new Error('Method updateReferences must be implemented');
  }

  /**
   * Generates table of contents for navigation
   * @param {DocumentationSection[]} sections - Sections to include
   * @returns {Promise<string>} Generated table of contents
   */
  async generateTableOfContents(sections) {
    throw new Error('Method generateTableOfContents must be implemented');
  }
}

module.exports = IContentConsolidator;