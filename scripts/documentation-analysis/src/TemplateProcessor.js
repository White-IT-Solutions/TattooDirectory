const fs = require('fs').promises;
const path = require('path');

/**
 * Template processor for documentation generation
 * Handles mustache-style template rendering with variable substitution
 */
class TemplateProcessor {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates');
    }

    /**
     * Process a template with provided data
     * @param {string} templateName - Name of the template file (without .template.md extension)
     * @param {Object} data - Data object for template variable substitution
     * @returns {Promise<string>} Processed template content
     */
    async processTemplate(templateName, data) {
        try {
            const templatePath = path.join(this.templatesDir, `${templateName}.template.md`);
            const templateContent = await fs.readFile(templatePath, 'utf8');
            
            return this.renderTemplate(templateContent, data);
        } catch (error) {
            throw new Error(`Failed to process template ${templateName}: ${error.message}`);
        }
    }

    /**
     * Render template content with data substitution
     * @param {string} template - Template content
     * @param {Object} data - Data for substitution
     * @returns {string} Rendered content
     */
    renderTemplate(template, data) {
        let rendered = template;

        // Replace simple variables {{VARIABLE_NAME}}
        rendered = rendered.replace(/\{\{([^#\/\}]+)\}\}/g, (match, variable) => {
            const trimmedVar = variable.trim();
            return this.getNestedValue(data, trimmedVar) || match;
        });

        // Process sections {{#SECTION}}...{{/SECTION}}
        rendered = this.processSections(rendered, data);

        return rendered;
    }

    /**
     * Process template sections (loops and conditionals)
     * @param {string} template - Template content
     * @param {Object} data - Data object
     * @returns {string} Processed template
     */
    processSections(template, data) {
        const sectionRegex = /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        
        return template.replace(sectionRegex, (match, sectionName, sectionContent) => {
            const sectionData = this.getNestedValue(data, sectionName.trim());
            
            if (!sectionData) {
                return '';
            }

            if (Array.isArray(sectionData)) {
                return sectionData.map(item => {
                    return this.renderTemplate(sectionContent, { ...data, ...item });
                }).join('');
            } else if (typeof sectionData === 'object') {
                return this.renderTemplate(sectionContent, { ...data, ...sectionData });
            } else if (sectionData) {
                return this.renderTemplate(sectionContent, data);
            }

            return '';
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-separated path
     * @returns {*} Value at path or undefined
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Get list of available templates
     * @returns {Promise<string[]>} Array of template names
     */
    async getAvailableTemplates() {
        try {
            const files = await fs.readdir(this.templatesDir);
            return files
                .filter(file => file.endsWith('.template.md'))
                .map(file => file.replace('.template.md', ''));
        } catch (error) {
            throw new Error(`Failed to list templates: ${error.message}`);
        }
    }

    /**
     * Validate template syntax
     * @param {string} templateName - Template name to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateTemplate(templateName) {
        try {
            const templatePath = path.join(this.templatesDir, `${templateName}.template.md`);
            const content = await fs.readFile(templatePath, 'utf8');
            
            const variables = this.extractVariables(content);
            const sections = this.extractSections(content);
            const issues = this.findSyntaxIssues(content);

            return {
                templateName,
                valid: issues.length === 0,
                variables,
                sections,
                issues
            };
        } catch (error) {
            return {
                templateName,
                valid: false,
                variables: [],
                sections: [],
                issues: [`Template file not found: ${error.message}`]
            };
        }
    }

    /**
     * Extract all variables from template
     * @param {string} content - Template content
     * @returns {string[]} Array of variable names
     */
    extractVariables(content) {
        const variableRegex = /\{\{([^#\/\}]+)\}\}/g;
        const variables = new Set();
        let match;

        while ((match = variableRegex.exec(content)) !== null) {
            variables.add(match[1].trim());
        }

        return Array.from(variables);
    }

    /**
     * Extract all sections from template
     * @param {string} content - Template content
     * @returns {string[]} Array of section names
     */
    extractSections(content) {
        const sectionRegex = /\{\{#([^}]+)\}\}/g;
        const sections = new Set();
        let match;

        while ((match = sectionRegex.exec(content)) !== null) {
            sections.add(match[1].trim());
        }

        return Array.from(sections);
    }

    /**
     * Find syntax issues in template
     * @param {string} content - Template content
     * @returns {string[]} Array of issue descriptions
     */
    findSyntaxIssues(content) {
        const issues = [];
        
        // Check for unmatched section tags
        const openSections = [];
        const sectionRegex = /\{\{([#\/])([^}]+)\}\}/g;
        let match;

        while ((match = sectionRegex.exec(content)) !== null) {
            const [, type, name] = match;
            const trimmedName = name.trim();

            if (type === '#') {
                openSections.push(trimmedName);
            } else if (type === '/') {
                const lastOpen = openSections.pop();
                if (lastOpen !== trimmedName) {
                    issues.push(`Mismatched section tags: opened '${lastOpen}' but closed '${trimmedName}'`);
                }
            }
        }

        // Check for unclosed sections
        if (openSections.length > 0) {
            issues.push(`Unclosed sections: ${openSections.join(', ')}`);
        }

        // Check for truly problematic nested braces ({{ inside {{ or }} inside }})
        // This pattern specifically looks for braces inside other braces
        if (/\{\{[^}]*\{\{/.test(content) || /\}\}[^{]*\}\}/.test(content)) {
            issues.push('Invalid variable syntax detected (nested braces)');
        }

        return issues;
    }

    /**
     * Generate template data schema from template
     * @param {string} templateName - Template name
     * @returns {Promise<Object>} Schema object describing required data structure
     */
    async generateDataSchema(templateName) {
        try {
            const validation = await this.validateTemplate(templateName);
            
            const schema = {
                templateName,
                variables: validation.variables.map(variable => ({
                    name: variable,
                    type: 'string',
                    required: true,
                    description: `Value for ${variable}`
                })),
                sections: validation.sections.map(section => ({
                    name: section,
                    type: 'array|object|boolean',
                    required: false,
                    description: `Data for ${section} section`
                }))
            };

            return schema;
        } catch (error) {
            throw new Error(`Failed to generate schema for ${templateName}: ${error.message}`);
        }
    }
}

module.exports = TemplateProcessor;