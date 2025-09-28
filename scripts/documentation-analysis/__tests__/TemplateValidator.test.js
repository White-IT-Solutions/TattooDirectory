const TemplateValidator = require('../src/TemplateValidator');
const fs = require('fs').promises;
const path = require('path');

describe('TemplateValidator', () => {
    let templateValidator;
    let testTemplatesDir;

    beforeEach(async () => {
        templateValidator = new TemplateValidator();
        testTemplatesDir = path.join(__dirname, 'test-templates');
        
        // Create test templates directory
        await fs.mkdir(testTemplatesDir, { recursive: true });
        
        // Override templates directory for testing
        templateValidator.templatesDir = testTemplatesDir;
    });

    afterEach(async () => {
        // Clean up test templates
        try {
            await fs.rmdir(testTemplatesDir, { recursive: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Syntax Validation', () => {
        test('should validate correct template syntax', async () => {
            const template = `
# {{TITLE}}
{{DESCRIPTION}}
{{#ITEMS}}
- {{NAME}}: {{DESCRIPTION}}
{{/ITEMS}}
            `.trim();
            
            const validation = templateValidator.validateSyntax(template);
            
            expect(validation.valid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });

        test('should detect unmatched section tags', async () => {
            const template = `
{{#SECTION1}}
Content
{{/SECTION2}}
            `.trim();
            
            const validation = templateValidator.validateSyntax(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Mismatched section tags')
            )).toBe(true);
        });

        test('should detect unclosed sections', async () => {
            const template = `
{{#SECTION1}}
Content
{{#SECTION2}}
More content
            `.trim();
            
            const validation = templateValidator.validateSyntax(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Unclosed sections')
            )).toBe(true);
        });

        test('should detect empty variables', async () => {
            const template = `
# {{TITLE}}
{{ }}
            `.trim();
            
            const validation = templateValidator.validateSyntax(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues).toContain('Empty variable placeholders found');
        });

        test('should detect invalid variable syntax', async () => {
            const template = `
# {{TITLE}}
{{{{NESTED}}}}
            `.trim();
            
            const validation = templateValidator.validateSyntax(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Invalid variable syntax')
            )).toBe(true);
        });
    });

    describe('Structure Validation', () => {
        test('should validate proper heading structure', async () => {
            const template = `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
            `.trim();
            
            const validation = templateValidator.validateStructure(template);
            
            expect(validation.valid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });

        test('should detect missing main heading', async () => {
            const template = `
## Section 1
Content here
            `.trim();
            
            const validation = templateValidator.validateStructure(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('should start with a main heading')
            )).toBe(true);
        });

        test('should detect major heading hierarchy skips', async () => {
            const template = `
# Main Title
#### Major Skip
            `.trim();
            
            const validation = templateValidator.validateStructure(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Major heading hierarchy skip detected')
            )).toBe(true);
        });

        test('should detect inconsistent list markers', async () => {
            const template = `
# Title
- Item 1
* Item 2
+ Item 3
            `.trim();
            
            const validation = templateValidator.validateStructure(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Inconsistent list markers')
            )).toBe(true);
        });
    });

    describe('Content Quality Validation', () => {
        test('should detect placeholder text', async () => {
            const template = `
# Title
Lorem ipsum dolor sit amet
TODO: Add real content
            `.trim();
            
            const validation = templateValidator.validateContentQuality(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
            expect(validation.issues.some(issue => 
                issue.includes('Placeholder text found')
            )).toBe(true);
        });

        test('should detect empty links', async () => {
            const template = `
# Title
[Click here]()
            `.trim();
            
            const validation = templateValidator.validateContentQuality(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Empty link URL')
            )).toBe(true);
        });

        test('should detect placeholder URLs', async () => {
            const template = `
# Title
[Link](http://example.com)
            `.trim();
            
            const validation = templateValidator.validateContentQuality(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Placeholder URL found')
            )).toBe(true);
        });

        test('should validate variable naming conventions', async () => {
            const template = `
# {{title}}
{{badVariableName}}
{{GOOD_VARIABLE_NAME}}
            `.trim();
            
            const validation = templateValidator.validateContentQuality(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
            expect(validation.issues.some(issue => 
                issue.includes('should be UPPER_SNAKE_CASE')
            )).toBe(true);
        });

        test('should validate section naming conventions', async () => {
            const template = `
{{#badSectionName}}
Content
{{/badSectionName}}
{{#GOOD_SECTION_NAME}}
Content
{{/GOOD_SECTION_NAME}}
            `.trim();
            
            const validation = templateValidator.validateContentQuality(template);
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('should be UPPER_SNAKE_CASE')
            )).toBe(true);
        });
    });

    describe('Template Validation', () => {
        test('should validate complete template', async () => {
            const template = `
# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

{{#FEATURES}}
- **{{FEATURE_NAME}}**: {{FEATURE_DESCRIPTION}}
{{/FEATURES}}

## Getting Started

\`\`\`bash
{{INSTALL_COMMAND}}
\`\`\`
            `.trim();
            
            await fs.writeFile(
                path.join(testTemplatesDir, 'complete.template.md'), 
                template
            );
            
            const validation = await templateValidator.validateTemplate('complete');
            
            expect(validation.templateName).toBe('complete');
            expect(validation.metadata.size).toBeGreaterThan(0);
            expect(validation.metadata.variables).toBeGreaterThan(0);
            expect(validation.metadata.sections).toBeGreaterThan(0);
        });

        test('should handle template file not found', async () => {
            const validation = await templateValidator.validateTemplate('nonexistent');
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Failed to validate template')
            )).toBe(true);
        });
    });

    describe('All Templates Validation', () => {
        test('should validate multiple templates', async () => {
            const template1 = '# {{TITLE}}\n{{CONTENT}}';
            const template2 = '# {{NAME}}\n{{DESCRIPTION}}';
            
            await fs.writeFile(
                path.join(testTemplatesDir, 'template1.template.md'), 
                template1
            );
            await fs.writeFile(
                path.join(testTemplatesDir, 'template2.template.md'), 
                template2
            );
            
            const results = await templateValidator.validateAllTemplates();
            
            expect(results.totalTemplates).toBe(2);
            expect(results.results).toHaveProperty('template1');
            expect(results.results).toHaveProperty('template2');
        });

        test('should handle empty templates directory', async () => {
            const results = await templateValidator.validateAllTemplates();
            
            expect(results.totalTemplates).toBe(0);
            expect(results.validTemplates).toBe(0);
            expect(results.invalidTemplates).toBe(0);
        });
    });

    describe('Variable and Section Extraction', () => {
        test('should extract variables correctly', () => {
            const content = `
# {{TITLE}}
{{DESCRIPTION}}
{{#SECTION}}
{{ITEM_NAME}}
{{/SECTION}}
            `.trim();
            
            const variables = templateValidator.extractVariables(content);
            
            expect(variables).toContain('TITLE');
            expect(variables).toContain('DESCRIPTION');
            expect(variables).toContain('ITEM_NAME');
            expect(variables).not.toContain('SECTION'); // Should not include section names
        });

        test('should extract sections correctly', () => {
            const content = `
{{#SECTION1}}
Content
{{/SECTION1}}
{{#SECTION2}}
More content
{{/SECTION2}}
            `.trim();
            
            const sections = templateValidator.extractSections(content);
            
            expect(sections).toContain('SECTION1');
            expect(sections).toContain('SECTION2');
            expect(sections).toHaveLength(2);
        });
    });

    describe('Validation Report Generation', () => {
        test('should generate validation report', () => {
            const validationResults = {
                totalTemplates: 2,
                validTemplates: 1,
                invalidTemplates: 1,
                results: {
                    valid_template: {
                        valid: true,
                        issues: [],
                        metadata: { size: 100, variables: 2, sections: 1 }
                    },
                    invalid_template: {
                        valid: false,
                        issues: ['Missing heading', 'Invalid syntax'],
                        metadata: { size: 50, variables: 1, sections: 0 }
                    }
                }
            };
            
            const report = templateValidator.generateValidationReport(validationResults);
            
            expect(report).toContain('Template Validation Report');
            expect(report).toContain('1/2 templates valid');
            expect(report).toContain('Issues Found');
            expect(report).toContain('Template Statistics');
            expect(report).toContain('valid_template');
            expect(report).toContain('invalid_template');
        });
    });
});

describe('Real Template Validation', () => {
    let templateValidator;

    beforeEach(() => {
        templateValidator = new TemplateValidator();
    });

    test('should validate actual README template', async () => {
        const validation = await templateValidator.validateTemplate('README');
        
        expect(validation.templateName).toBe('README');
        expect(validation.metadata.size).toBeGreaterThan(0);
        expect(validation.metadata.variables).toBeGreaterThan(0);
        
        // Log any issues for debugging
        if (!validation.valid) {
            console.log('README template issues:', validation.issues);
        }
    });

    test('should validate actual QUICK_START template', async () => {
        const validation = await templateValidator.validateTemplate('QUICK_START');
        
        expect(validation.templateName).toBe('QUICK_START');
        expect(validation.metadata.size).toBeGreaterThan(0);
        
        // Log any issues for debugging
        if (!validation.valid) {
            console.log('QUICK_START template issues:', validation.issues);
        }
    });

    test('should validate all actual templates', async () => {
        const results = await templateValidator.validateAllTemplates();
        
        expect(results.totalTemplates).toBeGreaterThan(0);
        
        // Log validation summary
        console.log(`Template validation: ${results.validTemplates}/${results.totalTemplates} valid`);
        
        // Log any issues for debugging
        for (const [templateName, result] of Object.entries(results.results)) {
            if (!result.valid) {
                console.log(`${templateName} issues:`, result.issues);
            }
        }
    });
});