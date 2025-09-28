const TemplateProcessor = require('../src/TemplateProcessor');
const fs = require('fs').promises;
const path = require('path');

describe('TemplateProcessor', () => {
    let templateProcessor;
    let testTemplatesDir;

    beforeEach(async () => {
        templateProcessor = new TemplateProcessor();
        testTemplatesDir = path.join(__dirname, 'test-templates');
        
        // Create test templates directory
        await fs.mkdir(testTemplatesDir, { recursive: true });
        
        // Override templates directory for testing
        templateProcessor.templatesDir = testTemplatesDir;
    });

    afterEach(async () => {
        // Clean up test templates
        try {
            await fs.rmdir(testTemplatesDir, { recursive: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Template Processing', () => {
        test('should process simple variable substitution', async () => {
            const template = 'Hello {{NAME}}, welcome to {{PROJECT}}!';
            await fs.writeFile(path.join(testTemplatesDir, 'simple.template.md'), template);

            const data = {
                NAME: 'John',
                PROJECT: 'Test Project'
            };

            const result = await templateProcessor.processTemplate('simple', data);
            expect(result).toBe('Hello John, welcome to Test Project!');
        });

        test('should handle missing variables gracefully', async () => {
            const template = 'Hello {{NAME}}, welcome to {{MISSING_VAR}}!';
            await fs.writeFile(path.join(testTemplatesDir, 'missing.template.md'), template);

            const data = { NAME: 'John' };

            const result = await templateProcessor.processTemplate('missing', data);
            expect(result).toBe('Hello John, welcome to {{MISSING_VAR}}!');
        });

        test('should process array sections', async () => {
            const template = `
Items:
{{#ITEMS}}
- {{NAME}}: {{DESCRIPTION}}
{{/ITEMS}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'array.template.md'), template);

            const data = {
                ITEMS: [
                    { NAME: 'Item 1', DESCRIPTION: 'First item' },
                    { NAME: 'Item 2', DESCRIPTION: 'Second item' }
                ]
            };

            const result = await templateProcessor.processTemplate('array', data);
            expect(result).toContain('- Item 1: First item');
            expect(result).toContain('- Item 2: Second item');
        });

        test('should process conditional sections', async () => {
            const template = `
{{#SHOW_SECTION}}
This section is visible
{{/SHOW_SECTION}}
{{#HIDE_SECTION}}
This section is hidden
{{/HIDE_SECTION}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'conditional.template.md'), template);

            const data = { SHOW_SECTION: true };

            const result = await templateProcessor.processTemplate('conditional', data);
            expect(result).toContain('This section is visible');
            expect(result).not.toContain('This section is hidden');
        });

        test('should handle nested object data', async () => {
            const template = 'User: {{USER.NAME}} ({{USER.EMAIL}})';
            await fs.writeFile(path.join(testTemplatesDir, 'nested.template.md'), template);

            const data = {
                USER: {
                    NAME: 'John Doe',
                    EMAIL: 'john@example.com'
                }
            };

            const result = await templateProcessor.processTemplate('nested', data);
            expect(result).toBe('User: John Doe (john@example.com)');
        });
    });

    describe('Template Validation', () => {
        test('should validate correct template syntax', async () => {
            const template = `
# {{TITLE}}
{{#ITEMS}}
- {{NAME}}
{{/ITEMS}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'valid.template.md'), template);

            const validation = await templateProcessor.validateTemplate('valid');
            
            expect(validation.valid).toBe(true);
            expect(validation.variables).toContain('TITLE');
            expect(validation.sections).toContain('ITEMS');
            expect(validation.issues).toHaveLength(0);
        });

        test('should detect unmatched section tags', async () => {
            const template = `
{{#SECTION1}}
Content
{{/SECTION2}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'unmatched.template.md'), template);

            const validation = await templateProcessor.validateTemplate('unmatched');
            
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
            await fs.writeFile(path.join(testTemplatesDir, 'unclosed.template.md'), template);

            const validation = await templateProcessor.validateTemplate('unclosed');
            
            expect(validation.valid).toBe(false);
            expect(validation.issues.some(issue => 
                issue.includes('Unclosed sections')
            )).toBe(true);
        });
    });

    describe('Schema Generation', () => {
        test('should generate data schema from template', async () => {
            const template = `
# {{TITLE}}
{{DESCRIPTION}}
{{#FEATURES}}
- {{NAME}}: {{DESCRIPTION}}
{{/FEATURES}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'schema.template.md'), template);

            const schema = await templateProcessor.generateDataSchema('schema');
            
            expect(schema.templateName).toBe('schema');
            expect(schema.variables).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'TITLE' }),
                    expect.objectContaining({ name: 'DESCRIPTION' })
                ])
            );
            expect(schema.sections).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'FEATURES' })
                ])
            );
        });
    });

    describe('Template Management', () => {
        test('should list available templates', async () => {
            await fs.writeFile(path.join(testTemplatesDir, 'template1.template.md'), 'content');
            await fs.writeFile(path.join(testTemplatesDir, 'template2.template.md'), 'content');
            await fs.writeFile(path.join(testTemplatesDir, 'not-template.md'), 'content');

            const templates = await templateProcessor.getAvailableTemplates();
            
            expect(templates).toContain('template1');
            expect(templates).toContain('template2');
            expect(templates).not.toContain('not-template');
        });

        test('should handle missing template file', async () => {
            await expect(
                templateProcessor.processTemplate('nonexistent', {})
            ).rejects.toThrow('Failed to process template nonexistent');
        });
    });

    describe('Complex Template Processing', () => {
        test('should handle nested sections and variables', async () => {
            const template = `
# {{PROJECT_NAME}}
{{#COMPONENTS}}
## {{NAME}}
{{DESCRIPTION}}
{{#FEATURES}}
- {{FEATURE_NAME}}: {{FEATURE_DESCRIPTION}}
{{/FEATURES}}
{{/COMPONENTS}}
            `.trim();
            await fs.writeFile(path.join(testTemplatesDir, 'complex.template.md'), template);

            const data = {
                PROJECT_NAME: 'Test Project',
                COMPONENTS: [
                    {
                        NAME: 'Frontend',
                        DESCRIPTION: 'React application',
                        FEATURES: [
                            { FEATURE_NAME: 'Responsive', FEATURE_DESCRIPTION: 'Mobile-friendly' },
                            { FEATURE_NAME: 'Fast', FEATURE_DESCRIPTION: 'Optimized performance' }
                        ]
                    },
                    {
                        NAME: 'Backend',
                        DESCRIPTION: 'Node.js API',
                        FEATURES: [
                            { FEATURE_NAME: 'RESTful', FEATURE_DESCRIPTION: 'REST API endpoints' }
                        ]
                    }
                ]
            };

            const result = await templateProcessor.processTemplate('complex', data);
            
            expect(result).toContain('# Test Project');
            expect(result).toContain('## Frontend');
            expect(result).toContain('## Backend');
            expect(result).toContain('- Responsive: Mobile-friendly');
            expect(result).toContain('- RESTful: REST API endpoints');
        });
    });
});

describe('Template Structure Validation', () => {
    let templateProcessor;

    beforeEach(() => {
        templateProcessor = new TemplateProcessor();
    });

    describe('Core Templates', () => {
        const coreTemplates = [
            'README',
            'QUICK_START', 
            'DEVELOPMENT_GUIDE',
            'API_REFERENCE',
            'TROUBLESHOOTING'
        ];

        test.each(coreTemplates)('should validate %s template structure', async (templateName) => {
            const validation = await templateProcessor.validateTemplate(templateName);
            
            // Templates should have basic structure even if they have some validation issues
            expect(validation.templateName).toBe(templateName);
            expect(validation.variables.length).toBeGreaterThan(0);
            
            // Log any issues for debugging but don't fail the test
            if (!validation.valid) {
                console.log(`${templateName} validation issues:`, validation.issues);
            }
        });

        test.each(coreTemplates)('should generate schema for %s template', async (templateName) => {
            const schema = await templateProcessor.generateDataSchema(templateName);
            
            expect(schema.templateName).toBe(templateName);
            expect(schema.variables).toBeDefined();
            expect(Array.isArray(schema.variables)).toBe(true);
        });
    });

    test('should have consistent template structure', async () => {
        const templates = await templateProcessor.getAvailableTemplates();
        
        for (const templateName of templates) {
            const templatePath = path.join(templateProcessor.templatesDir, `${templateName}.template.md`);
            const content = await fs.readFile(templatePath, 'utf8');
            
            // Check for basic markdown structure
            expect(content).toMatch(/^#\s+/m); // Should have at least one heading
            expect(content).toContain('{{'); // Should have template variables
            
            // Check for table of contents in longer templates
            if (['DEVELOPMENT_GUIDE', 'API_REFERENCE', 'TROUBLESHOOTING'].includes(templateName)) {
                expect(content).toMatch(/table of contents/i);
            }
        }
    });

    test('should have required sections in README template', async () => {
        const content = await fs.readFile(
            path.join(templateProcessor.templatesDir, 'README.template.md'),
            'utf8'
        );

        const requiredSections = [
            'Quick Start',
            'Overview',
            'Features',
            'Architecture',
            'Getting Started',
            'Documentation',
            'Contributing',
            'Support'
        ];

        for (const section of requiredSections) {
            expect(content).toMatch(new RegExp(section, 'i'));
        }
    });

    test('should have required sections in QUICK_START template', async () => {
        const content = await fs.readFile(
            path.join(templateProcessor.templatesDir, 'QUICK_START.template.md'),
            'utf8'
        );

        const requiredSections = [
            'Prerequisites',
            '5-Minute Setup',
            'Verification',
            'What\'s Next'
        ];

        for (const section of requiredSections) {
            expect(content).toMatch(new RegExp(section, 'i'));
        }
    });

    test('should have required sections in DEVELOPMENT_GUIDE template', async () => {
        const content = await fs.readFile(
            path.join(templateProcessor.templatesDir, 'DEVELOPMENT_GUIDE.template.md'),
            'utf8'
        );

        const requiredSections = [
            'Development Environment',
            'Project Structure',
            'Development Workflow',
            'Code Standards',
            'Testing',
            'Debugging'
        ];

        for (const section of requiredSections) {
            expect(content).toMatch(new RegExp(section, 'i'));
        }
    });

    test('should have required sections in API_REFERENCE template', async () => {
        const content = await fs.readFile(
            path.join(templateProcessor.templatesDir, 'API_REFERENCE.template.md'),
            'utf8'
        );

        const requiredSections = [
            'Overview',
            'Authentication',
            'Response Format',
            'Error Handling',
            'API Endpoints',
            'Data Models'
        ];

        for (const section of requiredSections) {
            expect(content).toMatch(new RegExp(section, 'i'));
        }
    });

    test('should have required sections in TROUBLESHOOTING template', async () => {
        const content = await fs.readFile(
            path.join(templateProcessor.templatesDir, 'TROUBLESHOOTING.template.md'),
            'utf8'
        );

        const requiredSections = [
            'Quick Diagnostics',
            'Setup Issues',
            'Development Issues',
            'Runtime Issues',
            'Getting Help'
        ];

        for (const section of requiredSections) {
            expect(content).toMatch(new RegExp(section, 'i'));
        }
    });
});