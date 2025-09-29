/**
 * Unit Tests for ContentConsolidator
 * Tests content consolidation, formatting, and reference management functionality
 */

const ContentConsolidator = require('../src/ContentConsolidator');
const MarkdownUtils = require('../src/utils/MarkdownUtils');

// Mock the MarkdownUtils module
jest.mock('../src/utils/MarkdownUtils');

describe('ContentConsolidator', () => {
  let consolidator;

  beforeEach(() => {
    consolidator = new ContentConsolidator();
    jest.clearAllMocks();
  });

  describe('consolidateSection', () => {
    it('should consolidate a section with text content', async () => {
      const section = {
        id: 'test-section',
        title: 'Test Section',
        content: [
          {
            type: 'text',
            content: 'This is test content.',
            metadata: { source: 'test.md' }
          }
        ]
      };

      MarkdownUtils.standardizeFormatting.mockResolvedValue('This is test content.\n');

      const result = await consolidator.consolidateSection(section);

      expect(result).toContain('# Test Section');
      expect(result).toContain('<!-- Source: test.md -->');
      expect(result).toContain('This is test content.');
      expect(MarkdownUtils.standardizeFormatting).toHaveBeenCalledWith('This is test content.');
    });

    it('should handle code blocks correctly', async () => {
      const section = {
        id: 'code-section',
        title: 'Code Section',
        content: [
          {
            type: 'code',
            content: 'console.log("hello");',
            metadata: { source: 'code.md' }
          }
        ]
      };

      const result = await consolidator.consolidateSection(section);

      expect(result).toContain('```\nconsole.log("hello");\n```');
    });

    it('should handle command blocks correctly', async () => {
      const section = {
        id: 'command-section',
        title: 'Command Section',
        content: [
          {
            type: 'command',
            content: 'npm install',
            metadata: { source: 'commands.md' }
          }
        ]
      };

      const result = await consolidator.consolidateSection(section);

      expect(result).toContain('```bash\nnpm install\n```');
    });

    it('should handle diagram blocks correctly', async () => {
      const section = {
        id: 'diagram-section',
        title: 'Diagram Section',
        content: [
          {
            type: 'diagram',
            content: 'graph TD\n  A --> B',
            metadata: { source: 'diagrams.md' }
          }
        ]
      };

      const result = await consolidator.consolidateSection(section);

      expect(result).toContain('```mermaid\ngraph TD\n  A --> B\n```');
    });

    it('should throw error for invalid section', async () => {
      await expect(consolidator.consolidateSection(null)).rejects.toThrow('Invalid section: must have content array');
      await expect(consolidator.consolidateSection({})).rejects.toThrow('Invalid section: must have content array');
      await expect(consolidator.consolidateSection({ content: 'not-array' })).rejects.toThrow('Invalid section: must have content array');
    });

    it('should skip invalid content blocks', async () => {
      const section = {
        id: 'mixed-section',
        title: 'Mixed Section',
        content: [
          {
            type: 'text',
            content: 'Valid content',
            metadata: { source: 'test.md' }
          },
          null, // Invalid block
          {
            type: 'text',
            content: null // Invalid content
          },
          {
            type: 'text',
            content: 'Another valid content',
            metadata: { source: 'test2.md' }
          }
        ]
      };

      MarkdownUtils.standardizeFormatting
        .mockResolvedValueOnce('Valid content\n')
        .mockResolvedValueOnce('Another valid content\n');

      const result = await consolidator.consolidateSection(section);

      expect(result).toContain('Valid content');
      expect(result).toContain('Another valid content');
      expect(MarkdownUtils.standardizeFormatting).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateCrossReferences', () => {
    it('should update cross-references using reference map', async () => {
      const content = 'Check out [Local Setup](docs/README-Local.md) for details.';
      
      MarkdownUtils.extractLinks.mockReturnValue([
        {
          text: 'Local Setup',
          url: 'docs/README-Local.md',
          line: 1,
          type: 'inline'
        }
      ]);

      const result = await consolidator.updateCrossReferences(content);

      expect(result).toBe('Check out [Local Setup](docs/setup/local-development.md) for details.');
      expect(MarkdownUtils.extractLinks).toHaveBeenCalledWith(content);
    });

    it('should handle empty or invalid content', async () => {
      expect(await consolidator.updateCrossReferences('')).toBe('');
      expect(await consolidator.updateCrossReferences(null)).toBe('');
      expect(await consolidator.updateCrossReferences(undefined)).toBe('');
    });

    it('should leave unknown references unchanged', async () => {
      const content = 'Check out [Unknown](unknown-file.md) for details.';
      
      MarkdownUtils.extractLinks.mockReturnValue([
        {
          text: 'Unknown',
          url: 'unknown-file.md',
          line: 1,
          type: 'inline'
        }
      ]);

      const result = await consolidator.updateCrossReferences(content);

      expect(result).toBe(content); // Should remain unchanged
    });
  });

  describe('generateNavigation', () => {
    it('should generate navigation structure from sections', async () => {
      const sections = [
        {
          id: 'setup-1',
          title: 'Installation',
          category: 'setup',
          targetFile: 'docs/setup/installation.md',
          priority: 'high'
        },
        {
          id: 'dev-1',
          title: 'Development Guide',
          category: 'development',
          targetFile: 'docs/development.md',
          priority: 'medium'
        },
        {
          id: 'setup-2',
          title: 'Configuration',
          category: 'setup',
          targetFile: 'docs/setup/config.md',
          priority: 'low'
        }
      ];

      const result = await consolidator.generateNavigation(sections);

      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('hierarchy');
      expect(result).toHaveProperty('byCategory');

      expect(result.sections).toHaveLength(3);
      expect(result.byCategory.setup).toHaveLength(2);
      expect(result.byCategory.development).toHaveLength(1);

      // Check priority sorting (high priority first)
      expect(result.byCategory.setup[0].priority).toBe('high');
      expect(result.byCategory.setup[1].priority).toBe('low');
    });

    it('should handle empty sections array', async () => {
      const result = await consolidator.generateNavigation([]);

      expect(result).toEqual({
        sections: [],
        hierarchy: {},
        byCategory: {}
      });
    });

    it('should handle invalid input', async () => {
      const result = await consolidator.generateNavigation(null);

      expect(result).toEqual({
        sections: [],
        hierarchy: {},
        byCategory: {}
      });
    });
  });

  describe('validateLinks', () => {
    it('should validate links in content', async () => {
      const content = 'Check [valid link](docs/test.md) and [external](https://example.com)';
      
      MarkdownUtils.extractLinks.mockReturnValue([
        {
          text: 'valid link',
          url: 'docs/test.md',
          line: 1,
          type: 'inline'
        },
        {
          text: 'external',
          url: 'https://example.com',
          line: 1,
          type: 'inline'
        }
      ]);

      const result = await consolidator.validateLinks(content);

      expect(result.isValid).toBe(true);
      expect(result.totalLinks).toBe(2);
      expect(result.validLinks).toBe(2);
      expect(result.invalidLinks).toHaveLength(0);
      expect(result.warnings).toContain('External link not verified: https://example.com');
    });

    it('should identify invalid links', async () => {
      const content = 'Check [empty link]() and [no url]';
      
      MarkdownUtils.extractLinks.mockReturnValue([
        {
          text: 'empty link',
          url: '',
          line: 1,
          type: 'inline'
        }
      ]);

      const result = await consolidator.validateLinks(content);

      expect(result.isValid).toBe(false);
      expect(result.totalLinks).toBe(1);
      expect(result.validLinks).toBe(0);
      expect(result.invalidLinks).toHaveLength(1);
      expect(result.invalidLinks[0].reason).toBe('Empty URL');
    });

    it('should handle empty content', async () => {
      const result = await consolidator.validateLinks('');

      expect(result.isValid).toBe(true);
      expect(result.totalLinks).toBe(0);
      expect(result.validLinks).toBe(0);
      expect(result.invalidLinks).toHaveLength(0);
    });
  });

  describe('consolidateContent', () => {
    it('should consolidate multiple sections into files', async () => {
      const sections = [
        {
          id: 'section-1',
          title: 'Section 1',
          category: 'setup',
          priority: 'high',
          targetFile: 'docs/setup.md',
          content: [
            {
              type: 'text',
              content: 'Setup content',
              metadata: { source: 'setup.md' }
            }
          ]
        },
        {
          id: 'section-2',
          title: 'Section 2',
          category: 'setup',
          priority: 'medium',
          targetFile: 'docs/setup.md',
          content: [
            {
              type: 'text',
              content: 'More setup content',
              metadata: { source: 'setup2.md' }
            }
          ]
        }
      ];

      MarkdownUtils.standardizeFormatting.mockResolvedValue('Formatted content\n');
      MarkdownUtils.extractLinks.mockReturnValue([]);
      MarkdownUtils.createAnchor.mockReturnValue('section-anchor');

      const result = await consolidator.consolidateContent(sections);

      expect(result.success).toBe(true);
      expect(result.processedSections).toBe(2);
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0].path).toBe('docs/setup.md');
      expect(result.generatedFiles[0].sections).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors during consolidation', async () => {
      const sections = [
        {
          id: 'error-section',
          title: 'Error Section',
          category: 'setup',
          priority: 'high',
          targetFile: 'docs/error.md',
          content: null // This will cause an error
        }
      ];

      const result = await consolidator.consolidateContent(sections);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].targetFile).toBe('docs/error.md');
    });

    it('should throw error for invalid input', async () => {
      await expect(consolidator.consolidateContent(null)).rejects.toThrow('Sections must be an array');
      await expect(consolidator.consolidateContent('not-array')).rejects.toThrow('Sections must be an array');
    });
  });

  describe('standardizeFormatting', () => {
    it('should delegate to MarkdownUtils', async () => {
      const content = 'Test content';
      const formattedContent = 'Formatted content\n';
      
      MarkdownUtils.standardizeFormatting.mockResolvedValue(formattedContent);

      const result = await consolidator.standardizeFormatting(content);

      expect(result).toBe(formattedContent);
      expect(MarkdownUtils.standardizeFormatting).toHaveBeenCalledWith(content);
    });

    it('should handle empty content', async () => {
      expect(await consolidator.standardizeFormatting('')).toBe('');
      expect(await consolidator.standardizeFormatting(null)).toBe('');
      expect(await consolidator.standardizeFormatting(undefined)).toBe('');
    });
  });

  describe('updateReferences', () => {
    it('should update references using provided map', async () => {
      const content = 'Check [old link](old-path.md)';
      const referenceMap = { 'old-path.md': 'new-path.md' };
      const updatedContent = 'Check [old link](new-path.md)';

      MarkdownUtils.updateLinks.mockReturnValue(updatedContent);

      const result = await consolidator.updateReferences(content, referenceMap);

      expect(result).toBe(updatedContent);
      expect(MarkdownUtils.updateLinks).toHaveBeenCalledWith(
        content,
        expect.objectContaining(referenceMap)
      );
    });

    it('should handle empty content', async () => {
      expect(await consolidator.updateReferences('')).toBe('');
      expect(await consolidator.updateReferences(null)).toBe('');
    });
  });

  describe('generateTableOfContents', () => {
    it('should generate table of contents for sections', async () => {
      const sections = [
        {
          id: 'section-1',
          title: 'Installation',
          category: 'setup'
        },
        {
          id: 'section-2',
          title: 'Configuration',
          category: 'setup'
        },
        {
          id: 'section-3',
          title: 'Development',
          category: 'development'
        }
      ];

      MarkdownUtils.createAnchor
        .mockReturnValueOnce('installation')
        .mockReturnValueOnce('configuration')
        .mockReturnValueOnce('development');

      const result = await consolidator.generateTableOfContents(sections);

      expect(result).toContain('## Table of Contents');
      expect(result).toContain('### Setup');
      expect(result).toContain('### Development');
      expect(result).toContain('[Installation](#installation)');
      expect(result).toContain('[Configuration](#configuration)');
      expect(result).toContain('[Development](#development)');
    });

    it('should handle empty sections', async () => {
      const result = await consolidator.generateTableOfContents([]);
      expect(result).toBe('');
    });

    it('should handle single category without category headers', async () => {
      const sections = [
        {
          id: 'section-1',
          title: 'Single Section',
          category: 'setup'
        }
      ];

      MarkdownUtils.createAnchor.mockReturnValue('single-section');

      const result = await consolidator.generateTableOfContents(sections);

      expect(result).toContain('## Table of Contents');
      expect(result).not.toContain('### Setup'); // No category header for single category
      expect(result).toContain('[Single Section](#single-section)');
    });
  });

  describe('private methods', () => {
    describe('_formatTable', () => {
      it('should format simple table content', () => {
        const consolidatorInstance = new ContentConsolidator();
        const content = 'Header\nRow 1\nRow 2';
        
        const result = consolidatorInstance._formatTable(content);
        
        expect(result).toContain('| Header |');
        expect(result).toContain('| --- |');
        expect(result).toContain('| Row 1 |');
        expect(result).toContain('| Row 2 |');
      });

      it('should return existing markdown table unchanged', () => {
        const consolidatorInstance = new ContentConsolidator();
        const content = '| Header | Value |\n| --- | --- |\n| Row 1 | Data 1 |';
        
        const result = consolidatorInstance._formatTable(content);
        
        expect(result).toBe(content);
      });
    });

    describe('_buildCommonReferenceMap', () => {
      it('should return reference mapping for common moves', () => {
        const consolidatorInstance = new ContentConsolidator();
        const referenceMap = consolidatorInstance._buildCommonReferenceMap();
        
        // Check that the reference map is an object and has expected properties
        expect(typeof referenceMap).toBe('object');
        expect(referenceMap['docs/README-Local.md']).toBe('docs/setup/local-development.md');
        expect(referenceMap['docs/README-DEVTOOLS.md']).toBe('docs/setup/devtools.md');
        expect(referenceMap['.txt']).toBe('.md');
        expect(Object.keys(referenceMap).length).toBeGreaterThan(0);
      });
    });

    describe('_formatCategoryTitle', () => {
      it('should format category titles correctly', () => {
        const consolidatorInstance = new ContentConsolidator();
        
        expect(consolidatorInstance._formatCategoryTitle('setup')).toBe('Setup');
        expect(consolidatorInstance._formatCategoryTitle('development')).toBe('Development');
        expect(consolidatorInstance._formatCategoryTitle('apiReference')).toBe('Api Reference');
      });
    });
  });
});