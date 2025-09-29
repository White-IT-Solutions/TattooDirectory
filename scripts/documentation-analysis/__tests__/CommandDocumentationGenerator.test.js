/**
 * Unit tests for CommandDocumentationGenerator
 */

const CommandDocumentationGenerator = require('../src/CommandDocumentationGenerator');
const FileUtils = require('../src/utils/FileUtils');
const path = require('path');

// Mock FileUtils
jest.mock('../src/utils/FileUtils');

// Mock config
jest.mock('../config/documentation-config', () => ({
  getCommandCategories: () => ({
    data: {
      keywords: ['seed', 'data', 'database', 'migration', 'reset'],
      description: 'Data management and seeding commands'
    },
    development: {
      keywords: ['dev', 'start', 'serve', 'watch', 'hot'],
      description: 'Development server and tooling commands'
    },
    testing: {
      keywords: ['test', 'spec', 'coverage', 'e2e', 'integration'],
      description: 'Testing and quality assurance commands'
    },
    deployment: {
      keywords: ['build', 'deploy', 'publish', 'release', 'docker'],
      description: 'Build and deployment commands'
    },
    monitoring: {
      keywords: ['monitor', 'health', 'performance', 'benchmark', 'validate'],
      description: 'Monitoring and performance commands'
    }
  }),
  getValidationConfig: () => ({
    skipCommandValidation: ['dev', 'start', 'serve', 'watch']
  }),
  getProjectRoot: () => '/test/project'
}));

describe('CommandDocumentationGenerator', () => {
  let generator;
  let mockPackageJson;

  beforeEach(() => {
    generator = new CommandDocumentationGenerator();
    
    mockPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: 'Test package',
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'test': 'jest',
        'test:watch': 'jest --watch',
        'seed:data': 'node scripts/seed-data.js',
        'reset:clean': 'node scripts/reset.js --clean',
        'monitor:health': 'node scripts/health-check.js',
        'deploy:prod': 'npm run build && deploy-script'
      }
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('extractCommands', () => {
    it('should extract commands from package.json', async () => {
      FileUtils.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await generator.extractCommands('/test/package.json');

      expect(result.commands).toHaveLength(8);
      expect(result.packageInfo).toEqual({
        name: 'test-package',
        version: '1.0.0',
        description: 'Test package',
        path: '/test/package.json'
      });

      const devCommand = result.commands.find(cmd => cmd.name === 'dev');
      expect(devCommand).toEqual({
        name: 'dev',
        script: 'next dev',
        description: 'Starts development server',
        category: 'development',
        parameters: [],
        examples: [],
        relatedCommands: [],
        packagePath: '/test/package.json'
      });
    });

    it('should handle missing package.json file', async () => {
      FileUtils.readFile.mockResolvedValue(null);

      const result = await generator.extractCommands('/test/missing.json');

      expect(result.commands).toHaveLength(0);
      expect(result.packageInfo).toBeNull();
    });

    it('should handle invalid JSON', async () => {
      FileUtils.readFile.mockResolvedValue('invalid json');

      const result = await generator.extractCommands('/test/invalid.json');

      expect(result.commands).toHaveLength(0);
      expect(result.packageInfo).toBeNull();
    });

    it('should handle package.json without scripts', async () => {
      const packageWithoutScripts = {
        name: 'test-package',
        version: '1.0.0'
      };
      FileUtils.readFile.mockResolvedValue(JSON.stringify(packageWithoutScripts));

      const result = await generator.extractCommands('/test/package.json');

      expect(result.commands).toHaveLength(0);
      expect(result.packageInfo).toEqual({
        name: 'test-package',
        version: '1.0.0',
        description: undefined,
        path: '/test/package.json'
      });
    });
  });

  describe('parsePackageJson', () => {
    it('should parse multiple package.json files', async () => {
      const packagePaths = ['/test/package.json', '/test/frontend/package.json'];
      
      FileUtils.readFile
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson))
        .mockResolvedValueOnce(JSON.stringify({
          name: 'frontend-package',
          scripts: {
            'dev': 'next dev',
            'build': 'next build'
          }
        }));

      const result = await generator.parsePackageJson(packagePaths);

      expect(result.commands).toHaveLength(10); // 8 + 2
      expect(result.packages).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors in individual files', async () => {
      const packagePaths = ['/test/package.json', '/test/invalid.json'];
      
      FileUtils.readFile
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson))
        .mockResolvedValueOnce(null);

      const result = await generator.parsePackageJson(packagePaths);

      expect(result.commands).toHaveLength(8);
      expect(result.packages).toHaveLength(1);
      expect(result.errors).toHaveLength(0); // extractCommands handles errors gracefully
    });
  });

  describe('categorizeCommands', () => {
    it('should categorize commands correctly', async () => {
      const commands = [
        { name: 'dev', script: 'next dev', category: 'development' },
        { name: 'test', script: 'jest', category: 'testing' },
        { name: 'seed', script: 'node seed.js', category: 'data' },
        { name: 'build', script: 'next build', category: 'deployment' },
        { name: 'monitor', script: 'node monitor.js', category: 'monitoring' },
        { name: 'custom', script: 'node custom.js', category: 'uncategorized' }
      ];

      const result = await generator.categorizeCommands(commands);

      expect(result.development).toHaveLength(1);
      expect(result.testing).toHaveLength(1);
      expect(result.data).toHaveLength(1);
      expect(result.deployment).toHaveLength(1);
      expect(result.monitoring).toHaveLength(1);
      expect(result.uncategorized).toHaveLength(1);
    });

    it('should sort commands within categories', async () => {
      const commands = [
        { name: 'z-command', script: 'test', category: 'testing' },
        { name: 'a-command', script: 'test', category: 'testing' }
      ];

      const result = await generator.categorizeCommands(commands);

      expect(result.testing[0].name).toBe('a-command');
      expect(result.testing[1].name).toBe('z-command');
    });
  });

  describe('createUsageExamples', () => {
    it('should create examples for data commands', async () => {
      const command = {
        name: 'seed:data',
        script: 'node seed.js',
        category: 'data'
      };

      const examples = await generator.createUsageExamples(command);

      expect(examples).toHaveLength(1);
      expect(examples[0].scenario).toBe('Basic data seeding');
      expect(examples[0].command).toBe('npm run seed --workspace=scripts --workspace=scripts:data');
      expect(examples[0].notes).toContain('Ensure LocalStack is running before seeding data');
    });

    it('should create examples for development commands', async () => {
      const command = {
        name: 'dev',
        script: 'next dev',
        category: 'development'
      };

      const examples = await generator.createUsageExamples(command);

      expect(examples).toHaveLength(1);
      expect(examples[0].scenario).toBe('Start development server');
      expect(examples[0].expectedOutput).toBe('Development server running on http://localhost:3000');
    });

    it('should create examples for testing commands', async () => {
      const command = {
        name: 'test:watch',
        script: 'jest --watch',
        category: 'testing'
      };

      const examples = await generator.createUsageExamples(command);

      expect(examples).toHaveLength(2); // Basic test + watch mode
      expect(examples[1].scenario).toBe('Run tests in watch mode');
    });

    it('should create generic example for uncategorized commands', async () => {
      const command = {
        name: 'custom',
        script: 'node custom.js',
        category: 'uncategorized'
      };

      const examples = await generator.createUsageExamples(command);

      expect(examples).toHaveLength(1);
      expect(examples[0].scenario).toBe('Run command');
      expect(examples[0].command).toBe('npm run custom');
    });
  });

  describe('generateCommandDocs', () => {
    it('should generate comprehensive documentation', async () => {
      const categorizedCommands = {
        development: [
          {
            name: 'dev',
            script: 'next dev',
            description: 'Starts development server',
            parameters: [],
            relatedCommands: ['build']
          }
        ],
        testing: [
          {
            name: 'test',
            script: 'jest',
            description: 'Runs tests',
            parameters: [
              { name: 'watch', type: 'flag', required: false, description: 'Watch mode' }
            ],
            relatedCommands: []
          }
        ]
      };

      const docs = await generator.generateCommandDocs(categorizedCommands);

      expect(docs).toContain('# Command Reference');
      expect(docs).toContain('## Table of Contents');
      expect(docs).toContain('## Development Commands');
      expect(docs).toContain('## Testing Commands');
      expect(docs).toContain('### `dev`');
      expect(docs).toContain('### `test`');
      expect(docs).toContain('**Script:** `next dev`');
      expect(docs).toContain('**Description:** Starts development server');
      expect(docs).toContain('**Parameters:**');
      expect(docs).toContain('**Related Commands:**');
    });

    it('should skip empty categories', async () => {
      const categorizedCommands = {
        development: [
          { name: 'dev', script: 'next dev', description: 'Dev server' }
        ],
        testing: []
      };

      const docs = await generator.generateCommandDocs(categorizedCommands);

      expect(docs).toContain('## Development Commands');
      expect(docs).not.toContain('## Testing Commands');
    });
  });

  describe('validateCommands', () => {
    it('should validate commands exist in package.json', async () => {
      const commands = [
        { name: 'build', packagePath: '/test/package.json' }, // exists in mockPackageJson
        { name: 'test', packagePath: '/test/package.json' }, // exists in mockPackageJson
        { name: 'missing', packagePath: '/test/package.json' } // doesn't exist
      ];

      FileUtils.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await generator.validateCommands(commands);

      expect(result.validatedCommands).toBe(2);
      expect(result.failedCommands).toHaveLength(1);
      expect(result.failedCommands[0].command).toBe('missing');
      expect(result.isValid).toBe(false);
    });

    it('should skip validation for interactive commands', async () => {
      const commands = [
        { name: 'dev', packagePath: '/test/package.json' },
        { name: 'start', packagePath: '/test/package.json' }
      ];

      const result = await generator.validateCommands(commands);

      expect(result.skippedCommands).toBe(2);
      expect(result.validatedCommands).toBe(0);
    });

    it('should handle file read errors', async () => {
      const commands = [
        { name: 'build', packagePath: '/test/package.json' } // Use non-interactive command
      ];

      FileUtils.readFile.mockRejectedValue(new Error('File not found'));

      const result = await generator.validateCommands(commands);

      expect(result.failedCommands).toHaveLength(1);
      expect(result.failedCommands[0].error).toBe('File not found');
      expect(result.isValid).toBe(false);
    });
  });

  describe('generateCommandReference', () => {
    it('should generate complete command reference', async () => {
      // Mock file system calls
      FileUtils.readFile
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson))
        .mockResolvedValueOnce(JSON.stringify({ name: 'frontend', scripts: { dev: 'next dev' } }))
        .mockResolvedValueOnce(JSON.stringify({ name: 'backend', scripts: { test: 'jest' } }))
        .mockResolvedValueOnce(JSON.stringify({ name: 'scripts', scripts: { seed: 'node seed.js' } }));

      const docs = await generator.generateCommandReference();

      expect(docs).toContain('# Command Reference');
      expect(docs).toContain('comprehensive reference for all npm scripts');
      expect(docs).toContain('## Development Commands');
      expect(docs).toContain('## Testing Commands');
      expect(docs).toContain('## Data Commands');
    });
  });

  describe('validateCommandAccuracy', () => {
    it('should validate all commands across packages', async () => {
      FileUtils.readFile
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson))
        .mockResolvedValueOnce(JSON.stringify({ name: 'frontend', scripts: { dev: 'next dev' } }))
        .mockResolvedValueOnce(JSON.stringify({ name: 'backend', scripts: { test: 'jest' } }))
        .mockResolvedValueOnce(JSON.stringify({ name: 'scripts', scripts: { seed: 'node seed.js' } }));

      const result = await generator.validateCommandAccuracy();

      expect(result.totalCommands).toBeGreaterThan(0);
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.failedCommands)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('private helper methods', () => {
    describe('_generateCommandDescription', () => {
      it('should generate descriptions based on command patterns', () => {
        expect(generator._generateCommandDescription('dev', 'next dev')).toBe('Starts development server');
        expect(generator._generateCommandDescription('build', 'next build')).toBe('Builds the application for production');
        expect(generator._generateCommandDescription('test', 'jest')).toBe('Runs tests');
        expect(generator._generateCommandDescription('seed:data', 'node seed.js')).toBe('Seeds data');
        expect(generator._generateCommandDescription('custom', 'custom script')).toBe('Custom command');
      });

      it('should infer from script content', () => {
        expect(generator._generateCommandDescription('unknown', 'jest --watch')).toBe('Runs Jest tests');
        expect(generator._generateCommandDescription('unknown', 'playwright test')).toBe('Runs Playwright tests');
        expect(generator._generateCommandDescription('unknown', 'next dev')).toBe('Starts Next.js development server');
        expect(generator._generateCommandDescription('unknown', 'docker-compose up')).toBe('Docker compose command');
      });
    });

    describe('_categorizeCommand', () => {
      it('should categorize commands based on keywords', () => {
        expect(generator._categorizeCommand('dev', 'next dev')).toBe('development');
        expect(generator._categorizeCommand('test', 'jest')).toBe('testing');
        expect(generator._categorizeCommand('seed', 'node seed.js')).toBe('data');
        expect(generator._categorizeCommand('build', 'next build')).toBe('deployment');
        expect(generator._categorizeCommand('monitor', 'node monitor.js')).toBe('monitoring');
        expect(generator._categorizeCommand('custom', 'custom script')).toBe('uncategorized');
      });
    });

    describe('_extractParameters', () => {
      it('should extract parameters from script', () => {
        const params = generator._extractParameters('node script.js --verbose --output=file -f');
        
        expect(params).toContainEqual({
          name: 'verbose',
          type: 'flag',
          required: false,
          description: 'flag parameter'
        });
        expect(params).toContainEqual({
          name: 'f',
          type: 'short-flag',
          required: false,
          description: 'short-flag parameter'
        });
      });

      it('should extract environment variables', () => {
        const params = generator._extractParameters('NODE_ENV=test ${DEBUG} node script.js');
        
        expect(params).toContainEqual({
          name: 'DEBUG',
          type: 'environment',
          required: false,
          description: 'environment parameter'
        });
      });
    });

    describe('_formatCategoryTitle', () => {
      it('should format category titles correctly', () => {
        expect(generator._formatCategoryTitle('data')).toBe('Data Commands');
        expect(generator._formatCategoryTitle('development')).toBe('Development Commands');
        expect(generator._formatCategoryTitle('uncategorized')).toBe('Uncategorized Commands');
      });
    });
  });
});