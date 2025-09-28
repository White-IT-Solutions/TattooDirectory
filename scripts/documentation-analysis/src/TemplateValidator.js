const fs = require('fs').promises;
const path = require('path');
const { validateTemplateAgainstConfig, getTemplateConfig } = require('../config/template-config');

/**
 * Validator for documentation templates
 * Validates template structure, content, and compliance with configuration
 */
class TemplateValidator {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates');
    }

    /**
     * Validate all templates against their configurations
     * @returns {Promise<Object>} Validation results for all templates
     */
    async validateAllTemplates() {
        try {
            const templateFiles = await fs.readdir(this.templatesDir);
            const templateNames = templateFiles
                .filter(file => file.endsWith('.template.md'))
                .map(file => file.replace('.template.md', ''));

            const results = {};
            
            for (const templateName of templateNames) {
                results[templateName] = await this.validateTemplate(templateName);
            }

            return {
                totalTemplates: templateNames.length,
                validTemplates: Object.values(results).filter(r => r.valid).length,
                invalidTemplates: Object.values(results).filter(r => !r.valid).length,
                results
            };
        } catch (error) {
            throw new Error(`Failed to validate templates: ${error.message}`);
        }
    }

    /**
     * Validate a specific template
     * @param {string} templateName - Name of the template to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateTemplate(templateName) {
        try {
            const templatePath = path.join(this.templatesDir, `${templateName}.template.md`);
            const content = await fs.readFile(templatePath, 'utf8');
            
            // Basic syntax validation
            const syntaxValidation = this.validateSyntax(content);
            
            // Configuration-based validation
            const configValidation = validateTemplateAgainstConfig(templateName, content);
            
            // Structure validation
            const structureValidation = this.validateStructure(content);
            
            // Content quality validation
            const qualityValidation = this.validateContentQuality(content);

            const allIssues = [
                ...syntaxValidation.issues,
                ...configValidation.issues,
                ...structureValidation.issues,
                ...qualityValidation.issues
            ];

            return {
                templateName,
                valid: allIssues.length === 0,
                issues: allIssues,
                validations: {
                    syntax: syntaxValidation,
                    config: configValidation,
                    structure: structureValidation,
                    quality: qualityValidation
                },
                metadata: {
                    size: content.length,
                    lines: content.split('\n').length,
                    variables: this.extractVariables(content).length,
                    sections: this.extractSections(content).length
                }
            };
        } catch (error) {
            return {
                templateName,
                valid: false,
                issues: [`Failed to validate template: ${error.message}`],
                validations: {},
                metadata: {}
            };
        }
    }

    /**
     * Validate template syntax
     * @param {string} content - Template content
     * @returns {Object} Syntax validation result
     */
    validateSyntax(content) {
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

        // Check for malformed variables (unmatched braces)
        const openBraces = (content.match(/\{\{/g) || []).length;
        const closeBraces = (content.match(/\}\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push('Unmatched variable braces detected');
        }

        // Check for truly nested braces (not just variables in code blocks)
        const lines = content.split('\n');
        let inCodeBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Track code block boundaries
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            
            // Skip validation inside code blocks
            if (inCodeBlock) {
                continue;
            }
            
            // Check for truly problematic nested braces ({{ inside {{ or }} inside }})
            // This pattern specifically looks for braces inside other braces
            if (/\{\{[^}]*\{\{/.test(line) || /\}\}[^{]*\}\}/.test(line)) {
                issues.push(`Invalid variable syntax detected on line ${i + 1}: ${line.trim()}`);
            }
        }

        // Check for empty variables
        const emptyVarRegex = /\{\{\s*\}\}/g;
        if (emptyVarRegex.test(content)) {
            issues.push('Empty variable placeholders found');
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Validate template structure
     * @param {string} content - Template content
     * @returns {Object} Structure validation result
     */
    validateStructure(content) {
        const issues = [];
        
        // Check for main heading
        if (!content.match(/^#\s+/m)) {
            issues.push('Template should start with a main heading (# Title)');
        }

        // Check for proper heading hierarchy (allow some flexibility for templates)
        const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
        let previousLevel = 0;
        
        for (const heading of headings) {
            const level = heading.match(/^#+/)[0].length;
            // Allow skipping one level for template flexibility, but flag major skips
            if (level > previousLevel + 2) {
                issues.push(`Major heading hierarchy skip detected: ${heading.trim()}`);
            }
            previousLevel = level;
        }

        // Check for markdown formatting issues
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = content.match(codeBlockRegex) || [];
        
        for (const block of codeBlocks) {
            if (!block.includes('\n')) {
                issues.push('Single-line code blocks should use inline code (`code`) instead of code blocks');
            }
        }

        // Check for proper list formatting
        const listRegex = /^[\s]*[-*+]\s+/gm;
        const lists = content.match(listRegex) || [];
        
        if (lists.length > 0) {
            // Check for consistent list markers
            const markers = lists.map(item => item.trim()[0]);
            const uniqueMarkers = [...new Set(markers)];
            if (uniqueMarkers.length > 1) {
                issues.push('Inconsistent list markers used (mix of -, *, +)');
            }
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Validate content quality
     * @param {string} content - Template content
     * @returns {Object} Quality validation result
     */
    validateContentQuality(content) {
        const issues = [];
        
        // Check for placeholder text that wasn't replaced
        const placeholderPatterns = [
            /lorem ipsum/i,
            /placeholder/i,
            /todo:/i,
            /fixme:/i,
            /\[insert\s+\w+\]/i
        ];

        for (const pattern of placeholderPatterns) {
            if (pattern.test(content)) {
                issues.push(`Placeholder text found: ${pattern.source}`);
            }
        }

        // Check for broken markdown links
        const linkRegex = /\[([^\]]+)\]\(([^)]*)\)/g;
        let linkMatch;
        
        while ((linkMatch = linkRegex.exec(content)) !== null) {
            const [, text, url] = linkMatch;
            
            // Check for empty links
            if (!url || !url.trim()) {
                issues.push(`Empty link URL for text: "${text}"`);
            }
            
            // Check for placeholder URLs
            if (url && (url.includes('example.com') || url.includes('placeholder'))) {
                issues.push(`Placeholder URL found: ${url}`);
            }
        }

        // Check for proper variable naming
        const variables = this.extractVariables(content);
        for (const variable of variables) {
            if (!variable.match(/^[A-Z][A-Z0-9_]*$/)) {
                issues.push(`Variable name should be UPPER_SNAKE_CASE: ${variable}`);
            }
        }

        // Check for section naming
        const sections = this.extractSections(content);
        for (const section of sections) {
            if (!section.match(/^[A-Z][A-Z0-9_]*$/)) {
                issues.push(`Section name should be UPPER_SNAKE_CASE: ${section}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Extract variables from template content
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
     * Extract sections from template content
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
     * Generate validation report
     * @param {Object} validationResults - Results from validateAllTemplates
     * @returns {string} Formatted validation report
     */
    generateValidationReport(validationResults) {
        const { totalTemplates, validTemplates, invalidTemplates, results } = validationResults;
        
        let report = `# Template Validation Report\n\n`;
        report += `**Summary**: ${validTemplates}/${totalTemplates} templates valid\n\n`;
        
        if (invalidTemplates > 0) {
            report += `## Issues Found\n\n`;
            
            for (const [templateName, result] of Object.entries(results)) {
                if (!result.valid) {
                    report += `### ${templateName}\n\n`;
                    
                    for (const issue of result.issues) {
                        report += `- ❌ ${issue}\n`;
                    }
                    
                    report += `\n`;
                }
            }
        }
        
        report += `## Template Statistics\n\n`;
        report += `| Template | Valid | Size | Variables | Sections | Issues |\n`;
        report += `|----------|-------|------|-----------|----------|--------|\n`;
        
        for (const [templateName, result] of Object.entries(results)) {
            const status = result.valid ? '✅' : '❌';
            const size = result.metadata.size || 0;
            const variables = result.metadata.variables || 0;
            const sections = result.metadata.sections || 0;
            const issues = result.issues.length;
            
            report += `| ${templateName} | ${status} | ${size} | ${variables} | ${sections} | ${issues} |\n`;
        }
        
        return report;
    }
}

module.exports = TemplateValidator;