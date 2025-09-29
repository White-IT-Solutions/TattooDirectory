/**
 * Unit tests for DocumentationValidator
 * Tests validation functionality for documentation accuracy and completeness
 */

const DocumentationValidator = require('../src/DocumentationValidator');
const FileUtils = require('../src/utils/FileUtils');
const path = require('path');

// Mock FileUtils
jest.mock('../src/utils/FileUtils');

describe('DocumentationValidator', () => {
  let validator;
  const mockConfig = {
    projectRoot: '/test/project',
    commandTimeout: 5000,
    skipCommandValidation: ['dev', 'start'],
    codeFileExtensions: ['.js', '.ts', '.json']
  };

  beforeEach(() => {
    validator = new DocumentationValidator(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config when no config provided', () => {
      const defaultValidator = new DocumentationValidator();
      expect(defaultValidator.config.projectRoot).toBe(process.cwd());
      expect(defaultValidator.config.commandTimeout).toBe(30000);
    });

    it('should merge provided config with defaults', () => {
      expect(validator.config.projectRoot).toBe('/test/project');
      expect(validator.config.commandTimeout).toBe(5000);
      expect(validator.config.skipCommandValidation).toEqual(['dev', 'start']);
    });
  });

  describe('validatePaths', () => {
    it('should return valid result when all paths exist', async () => {
      const paths = ['file1.md', 'file2.js'];
      FileUtils.fileExists.mockResolvedValue(true);

      const result = await validator.validatePaths(paths);

      expect(result.isValid).toBe(true);
      expect(result.invalidPaths).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should identify invalid paths and provide suggestions', async () => {
      const paths = ['nonexistent.md', 'valid.js'];
      FileUtils.fileExists
        .mockResolvedValueOnce(false) // nonexistent.md
        .mockResolvedValueOnce(true); // valid.js

      // Mock suggestion logic
      FileUtils.findFiles.mockResolvedValue(['/test/project/existing.md']);
      
      const result = await validator.validatePaths(paths);

      expect(result.isValid).toBe(false);
      expect(result.invalidPaths).toContain('nonexistent.md');
      expect(result.invalidPaths).not.toContain('valid.js');
    });

    it('should handle absolute paths correctly', async () => {
      const paths = ['/absolute/path/file.md'];
      FileUtils.fileExists.mockResolvedValue(true);

      const result = await validator.validatePaths(paths);

      expect(FileUtils.fileExists).toHaveBeenCalledWith('/absolute/path/file.md');
      expect(result.isValid).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const paths = ['error-file.md'];
      FileUtils.fileExists.mockRejectedValue(new Error('File system error'));

      const result = await validator.validatePaths(paths);

      expect(result.isValid).toBe(false);
      expect(result.invalidPaths).toContain('error-file.md');
    });
  });

  describe('checkCommandAccuracy', () => {
    it('should validate npm scripts correctly', async () => {
      const commands = [
        {
          name: 'test',
          script: 'npm run test',
          source: '/test/project/package.json'
        }
      ];

      FileUtils.readFile.mockResolvedValue(JSON.stringify({
        scripts: { test: 'jest' }
      }));

      const result = await validator.checkCommandAccuracy(commands);

      expect(result.isValid).toBe(true);
      expect(result.failedCommands).toEqual([]);
    });

    it('should identify missing npm scripts', async () => {
      const commands = [
        {
          name: 'missing-script',
          script: 'npm run missing-script',
          source: '/test/project/package.json'
        }
      ];

      FileUtils.readFile.mockResolvedValue(JSON.stringify({
        scripts: { test: 'jest' }
      }));

      const result = await validator.checkCommandAccuracy(commands);

      expect(result.isValid).toBe(false);
      expect(result.failedCommands).toHaveLength(1);
      expect(result.failedCommands[0].error).toBe('Script not found in package.json');
    });

    it('should skip validation for interactive commands', async () => {
      const commands = [
        {
          name: 'dev',
          script: 'npm run dev',
          source: '/test/project/package.json'
        }
      ];

      const result = await validator.checkCommandAccuracy(commands);

      expect(result.isValid).toBe(true);
      expect(FileUtils.readFile).not.toHaveBeenCalled();
    });

    it('should validate command syntax for non-npm commands', async () => {
      const commands = [
        {
          name: 'valid-command',
          script: 'echo "hello world"'
        },
        {
          name: 'invalid-command',
          script: 'echo "unmatched quote'
        }
      ];

      const result = await validator.checkCommandAccuracy(commands);

      expect(result.isValid).toBe(false);
      expect(result.failedCommands).toHaveLength(1);
      expect(result.failedCommands[0].command).toBe('invalid-command');
    });
  });

  describe('validateCodeExamples', () => {
    it('should validate JavaScript code snippets', async () => {
      const snippets = [
        'const x = 5;\nfunction test() { return x; }',
        '{ "name": "test", "version": "1.0.0" }'
      ];

      const result = await validator.validateCodeExamples(snippets);

      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should identify syntax errors in JavaScript', async () => {
      const snippets = [
        'const x = 5;\nfunction test() { return x; // missing closing brace'
      ];

      const result = await validator.validateCodeExamples(snippets);

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Unmatched braces');
    });

    it('should validate JSON snippets', async () => {
      const snippets = [
        '{ "valid": "json" }',
        '{ "invalid": json }'
      ];

      const result = await validator.validateCodeExamples(snippets);

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    it('should validate shell commands', async () => {
      const snippets = [
        'echo "hello"\ncd /path && ls',
        'cd /path\nls' // Should warn about cd without &&
      ];

      const result = await validator.validateCodeExamples(snippets);

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('cd command should be followed by &&');
    });

    it('should handle empty snippets', async () => {
      const snippets = ['', '   ', 'valid code'];

      const result = await validator.validateCodeExamples(snippets);

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0]).toContain('Empty code snippet');
    });
  });

  describe('checkCompleteness', () => {
    it('should identify missing essential documentation files', async () => {
      FileUtils.fileExists.mockResolvedValue(false);

      const projectStructure = {
        components: [],
        apis: []
      };

      const result = await validator.checkCompleteness(projectStructure);

      expect(result.missingDocumentation.length).toBeGreaterThan(0);
      expect(result.missingDocumentation.some(doc => doc.name === 'README.md')).toBe(true);
      expect(result.completenessScore).toBeLessThan(100);
    });

    it('should identify missing component documentation', async () => {
      FileUtils.fileExists.mockResolvedValue(true); // Essential files exist

      const projectStructure = {
        components: [
          { name: 'ComponentA', documentation: true },
          { name: 'ComponentB', documentation: false },
          { name: 'ComponentC' } // No documentation property
        ],
        apis: []
      };

      const result = await validator.checkCompleteness(projectStructure);

      const componentDocs = result.missingDocumentation.filter(doc => doc.type === 'component');
      expect(componentDocs).toHaveLength(2);
      expect(componentDocs.some(doc => doc.name === 'ComponentB')).toBe(true);
      expect(componentDocs.some(doc => doc.name === 'ComponentC')).toBe(true);
    });

    it('should calculate completeness score correctly', async () => {
      FileUtils.fileExists.mockResolvedValue(true);

      const projectStructure = {
        components: [
          { name: 'ComponentA', documentation: true },
          { name: 'ComponentB', documentation: true }
        ],
        apis: [
          { name: 'ApiA', documentation: true }
        ]
      };

      const result = await validator.checkCompleteness(projectStructure);

      expect(result.completenessScore).toBe(100);
      expect(result.missingDocumentation).toHaveLength(0);
    });

    it('should provide recommendations for missing documentation', async () => {
      FileUtils.fileExists.mockResolvedValue(false);

      const projectStructure = {
        components: [{ name: 'ComponentA' }],
        apis: []
      };

      const result = await validator.checkCompleteness(projectStructure);

      expect(result.recommendations).toContain('Create missing essential documentation files');
      expect(result.recommendations).toContain('Document all public APIs and components');
    });
  });

  describe('validateDocumentationSet', () => {
    it('should perform comprehensive validation', async () => {
      FileUtils.fileExists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(JSON.stringify({
        scripts: { test: 'jest' }
      }));

      const docs = {
        paths: ['file1.md', 'file2.js'],
        commands: [{
          name: 'test',
          script: 'npm run test',
          source: '/test/project/package.json'
        }],
        codeSnippets: ['const x = 5;'],
        references: ['./valid-file.md']
      };

      const result = await validator.validateDocumentationSet(docs);

      expect(result.overallScore).toBe(100);
      expect(result.pathValidation.isValid).toBe(true);
      expect(result.commandValidation.isValid).toBe(true);
      expect(result.contentValidation.isValid).toBe(true);
      expect(result.crossReferenceValidation.isValid).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      FileUtils.fileExists.mockRejectedValue(new Error('File system error'));

      const docs = {
        paths: ['error-file.md'],
        commands: [],
        codeSnippets: [],
        references: []
      };

      const result = await validator.validateDocumentationSet(docs);

      // Only path validation fails, others succeed with empty arrays, so score is 75
      expect(result.overallScore).toBe(75);
      expect(result.pathValidation.isValid).toBe(false);
      expect(result.commandValidation.isValid).toBe(true); // Empty commands array is valid
      expect(result.contentValidation.isValid).toBe(true); // Empty snippets array is valid
      expect(result.crossReferenceValidation.isValid).toBe(true); // Empty references array is valid
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate comprehensive compliance report', async () => {
      FileUtils.findFiles.mockResolvedValue([
        '/test/project/package.json',
        '/test/project/README.md',
        '/test/project/docs/api.md'
      ]);

      FileUtils.readFile.mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) {
          return Promise.resolve(JSON.stringify({
            scripts: {
              test: 'jest',
              build: 'webpack',
              dev: 'webpack-dev-server'
            }
          }));
        }
        if (filePath.endsWith('.md')) {
          return Promise.resolve('# Test Documentation\n\n```javascript\nconst x = 5;\n```\n\n[Link](./other.md)');
        }
        return Promise.resolve('');
      });

      FileUtils.fileExists.mockResolvedValue(true);

      const result = await validator.generateComplianceReport();

      expect(result.timestamp).toBeDefined();
      expect(result.projectRoot).toBe('/test/project');
      expect(result.totalFiles).toBe(3);
      expect(result.documentationFiles).toBe(2);
      expect(result.packageJsonFiles).toBe(1);
      expect(result.totalCommands).toBe(3);
      expect(result.validationReport).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle errors in compliance report generation', async () => {
      FileUtils.findFiles.mockRejectedValue(new Error('File system error'));

      const result = await validator.generateComplianceReport();

      expect(result.error).toBe('File system error');
      expect(result.validationReport).toBeNull();
    });
  });

  describe('private helper methods', () => {
    describe('_calculateSimilarity', () => {
      it('should calculate string similarity correctly', () => {
        expect(validator._calculateSimilarity('test', 'test')).toBe(1.0);
        expect(validator._calculateSimilarity('test', 'best')).toBeCloseTo(0.75);
        expect(validator._calculateSimilarity('test', 'xyz')).toBeLessThan(0.5);
        expect(validator._calculateSimilarity('', '')).toBe(1.0);
      });
    });

    describe('_categorizeCommand', () => {
      it('should categorize commands correctly', () => {
        expect(validator._categorizeCommand('test')).toBe('testing');
        expect(validator._categorizeCommand('build')).toBe('deployment');
        expect(validator._categorizeCommand('dev')).toBe('development');
        expect(validator._categorizeCommand('seed-data')).toBe('data');
        expect(validator._categorizeCommand('monitor')).toBe('monitoring');
        expect(validator._categorizeCommand('unknown')).toBe('other');
      });
    });

    describe('_detectCodeLanguage', () => {
      it('should detect programming languages correctly', () => {
        expect(validator._detectCodeLanguage('function test() {}')).toBe('javascript');
        expect(validator._detectCodeLanguage('const x = 5;')).toBe('javascript');
        expect(validator._detectCodeLanguage('{ "name": "test" }')).toBe('json');
        expect(validator._detectCodeLanguage('#!/bin/bash\necho "hello"')).toBe('bash');
        expect(validator._detectCodeLanguage('npm install')).toBe('shell');
        expect(validator._detectCodeLanguage('SELECT * FROM table')).toBe('unknown');
      });
    });
  });
});