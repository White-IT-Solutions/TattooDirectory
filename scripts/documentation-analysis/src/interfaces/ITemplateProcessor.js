/**
 * Interface for template processing functionality
 * Defines the contract for documentation template processing
 */
class ITemplateProcessor {
    /**
     * Process a template with provided data
     * @param {string} templateName - Name of the template file
     * @param {Object} data - Data object for template variable substitution
     * @returns {Promise<string>} Processed template content
     */
    async processTemplate(templateName, data) {
        throw new Error('processTemplate method must be implemented');
    }

    /**
     * Render template content with data substitution
     * @param {string} template - Template content
     * @param {Object} data - Data for substitution
     * @returns {string} Rendered content
     */
    renderTemplate(template, data) {
        throw new Error('renderTemplate method must be implemented');
    }

    /**
     * Get list of available templates
     * @returns {Promise<string[]>} Array of template names
     */
    async getAvailableTemplates() {
        throw new Error('getAvailableTemplates method must be implemented');
    }

    /**
     * Validate template syntax
     * @param {string} templateName - Template name to validate
     * @returns {Promise<Object>} Validation result with structure:
     * {
     *   valid: boolean,
     *   variables: string[],
     *   sections: string[],
     *   issues: string[]
     * }
     */
    async validateTemplate(templateName) {
        throw new Error('validateTemplate method must be implemented');
    }

    /**
     * Generate template data schema from template
     * @param {string} templateName - Template name
     * @returns {Promise<Object>} Schema object describing required data structure
     */
    async generateDataSchema(templateName) {
        throw new Error('generateDataSchema method must be implemented');
    }
}

module.exports = ITemplateProcessor;