/**
 * Unit tests for GapAnalysisReporter
 */

const GapAnalysisReporter = require('../src/GapAnalysisReporter');
const FileUtils = require('../src/utils/FileUtils');
const path = require('path');

// Mock FileUtils
jest.mock('../src/utils/FileUtils');

// Mock configuration
jest.mock('../config/documentation-config', () => ({
  getGapAnalysisConfig: () => ({
    importanceLevels: {
      critical: { score: 4, description: 'Essential for project onboarding and development' },
      high: { score: 3, description: 'Important for efficient development workflow' },
      medium: { score: 2, description: 'Helpful for understanding project structure' },
      low: { score: 1, description: 'Nice to have for complete documentation' }
    },
    effortLevels: {
      small: { hours: 2, description: 'Simple documentation update or creation' },
      medium: { hours: 8, description: 'Comprehensive documentation section' },
      large: { hours: 16, description: 'Major documentation overhaul or new system' }
    }
  }),
  getContentCategories: () => ({
    setup: { keywords: ['install', 'setup', 'configuration'], priority: 'high' },
    api: { keywords: ['api', 'endpoint', 'handler'], priority: 'high' }
  }),
  getCommandCategories: () => ({
    data: { keywords: ['seed', 'data', 'database'], description: 'Data management commands' },
    development: { keywords: ['dev', 'start', 'serve'], description: 'Development commands' }
  }),
  getProjectRoot: () => '/test/project'
}));

describe('GapAnalysisReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new GapAnalysisReporter();
    jest.clearAllMocks();
  });

  describe('analyzeMissingDocumentation', () => {
    it('should identify missing main documentation files', async () => {
      // Mock file existence checks - no files exist
      FileUtils.fileExists.mockResolvedValue(false);

      const projectStructure = {};
      const result = await reporter.analyzeMissingDocumentation(projectStructure);

      // Should find missing main docs + setup docs + workflow docs + reference docs
      expect(result.length).toBeGreaterThan(4);
      
      const mainDocs = result.filter(doc => doc.component === 'main-documentation');
      expect(mainDocs).toHaveLength(4); // QUICK_START, DEVELOPMENT_GUIDE, API_REFERENCE, TROUBLESHOOTING
      expect(mainDocs[0]).toMatchObject({
        feature: 'QUICK START',
        component: 'main-documentation',
        importance: 'critical',
        estimatedEffort: 'small'
      });
    });

    it('should identify missing component documentation', async () => {
      // Mock that no files exist
      FileUtils.fileExists.mockResolvedValue(false);

      const result = await reporter.analyzeMissingDocumentation({});

      // Should find missing docs for all categories since no files exist
      expect(result.length).toBeGreaterThan(10); // Should find many missing docs
      
      // Verify the method runs and returns results without errors
      expect(Array.isArray(result)).toBe(true);
      
      // Verify we have different types of missing documentation
      const components = result.map(r => r.component);
      expect(components).toContain('main-documentation');
      expect(components).toContain('setup');
      expect(components).toContain('workflows');
      expect(components).toContain('reference');
    });

    it('should identify missing setup documentation', async () => {
      FileUtils.fileExists.mockResolvedValue(false);

      const result = await reporter.analyzeMissingDocumentation({});

      const setupDocs = result.filter(doc => doc.component === 'setup');
      expect(setupDocs.length).toBe(4); // local-development, frontend-only, docker-setup, dependencies
      expect(setupDocs[0]).toMatchObject({
        component: 'setup',
        importance: 'critical',
        estimatedEffort: 'small'
      });
    });

    it('should identify undocumented npm scripts', async () => {
      FileUtils.fileExists.mockImplementation((filePath) => {
        return Promise.resolve(filePath.includes('package.json'));
      });

      FileUtils.readFile.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            scripts: {
              'test': 'jest',
              'build': 'webpack',
              'undocumented-script': 'echo test'
            }
          }));
        }
        return Promise.resolve(''); // Empty command reference
      });

      const result = await reporter.analyzeMissingDocumentation({});

      const scriptDocs = result.filter(doc => doc.component === 'commands');
      expect(scriptDocs.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      FileUtils.fileExists.mockRejectedValue(new Error('File system error'));

      const result = await reporter.analyzeMissingDocumentation({});

      expect(result).toEqual([]);
    });
  });

  describe('identifyOutdatedContent', () => {
    it('should identify old files', async () => {
      const oldDate = new Date('2020-01-01');
      const documentationMap = {
        currentFiles: [
          {
            path: '/test/old-file.md',
            lastModified: oldDate,
            status: 'active'
          }
        ],
        movedFiles: []
      };

      FileUtils.readFile.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve('{}'); // Empty package.json
        }
        return Promise.resolve('# Test content');
      });
      FileUtils.fileExists.mockResolvedValue(true); // For broken reference checks

      const result = await reporter.identifyOutdatedContent(documentationMap);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        filePath: '/test/old-file.md',
        lastUpdated: oldDate,
        recommendedAction: 'update'
      });
      expect(result[0].issues).toContain('File has not been updated in over 6 months');
    });

    it('should identify moved files', async () => {
      const documentationMap = {
        currentFiles: [
          {
            path: '/test/moved-file.md',
            lastModified: new Date(),
            status: 'moved'
          }
        ],
        movedFiles: []
      };

      FileUtils.readFile.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve('{}'); // Empty package.json
        }
        return Promise.resolve('# Test content');
      });
      FileUtils.fileExists.mockResolvedValue(true); // For broken reference checks

      const result = await reporter.identifyOutdatedContent(documentationMap);

      expect(result).toHaveLength(1);
      expect(result[0].issues).toContain('File is marked as moved but still exists in original location');
      expect(result[0].recommendedAction).toBe('consolidate');
    });

    it('should identify broken references', async () => {
      const documentationMap = {
        currentFiles: [
          {
            path: '/test/file-with-links.md',
            lastModified: new Date(),
            status: 'active'
          }
        ],
        movedFiles: []
      };

      FileUtils.readFile.mockResolvedValue('# Test\n[Link](./non-existent.md)');
      FileUtils.fileExists.mockResolvedValue(false); // Broken link

      const result = await reporter.identifyOutdatedContent(documentationMap);

      expect(result).toHaveLength(1);
      expect(result[0].issues.some(issue => issue.includes('broken references'))).toBe(true);
      expect(result[0].recommendedAction).toBe('fix-references');
    });

    it('should identify unmigrated moved files', async () => {
      const documentationMap = {
        currentFiles: [],
        movedFiles: [
          {
            originalPath: '/test/moved.md',
            newPath: '/test/new-location.md',
            contentMigrated: false
          }
        ]
      };

      const result = await reporter.identifyOutdatedContent(documentationMap);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        filePath: '/test/moved.md',
        recommendedAction: 'migrate-content'
      });
      expect(result[0].issues).toContain('File marked as moved but content not migrated');
    });

    it('should handle errors gracefully', async () => {
      const documentationMap = {
        currentFiles: [{ path: '/test/error.md', lastModified: new Date(), status: 'active' }],
        movedFiles: []
      };

      FileUtils.readFile.mockRejectedValue(new Error('Read error'));

      const result = await reporter.identifyOutdatedContent(documentationMap);

      expect(result).toEqual([]);
    });
  });

  describe('generatePriorityMatrix', () => {
    it('should categorize items by priority correctly', async () => {
      const missingDocs = [
        {
          feature: 'Critical Setup',
          component: 'setup',
          importance: 'critical',
          estimatedEffort: 'small'
        },
        {
          feature: 'Nice Feature',
          component: 'feature',
          importance: 'low',
          estimatedEffort: 'large'
        }
      ];

      const outdatedContent = [
        {
          filePath: '/test/urgent.md',
          issues: ['broken references'],
          recommendedAction: 'migrate-content'
        }
      ];

      const result = await reporter.generatePriorityMatrix(missingDocs, outdatedContent);

      expect(result.high.total).toBeGreaterThan(0);
      expect(result.low.total).toBeGreaterThan(0);
      expect(result.high.critical).toHaveLength(1);
      expect(result.high.critical[0].title).toBe('Critical Setup');
    });

    it('should sort items by score within categories', async () => {
      const missingDocs = [
        {
          feature: 'High Score Item',
          component: 'test',
          importance: 'critical',
          estimatedEffort: 'small'
        },
        {
          feature: 'Lower Score Item',
          component: 'test',
          importance: 'high',
          estimatedEffort: 'small'
        }
      ];

      const result = await reporter.generatePriorityMatrix(missingDocs, []);

      expect(result.high.critical).toHaveLength(1);
      expect(result.high.important).toHaveLength(1);
      expect(result.high.critical[0].score).toBeGreaterThan(result.high.important[0].score);
    });

    it('should handle empty input', async () => {
      const result = await reporter.generatePriorityMatrix([], []);

      expect(result).toMatchObject({
        high: { total: 0 },
        medium: { total: 0 },
        low: { total: 0 }
      });
    });

    it('should handle errors gracefully', async () => {
      // Pass invalid data to trigger error handling
      const result = await reporter.generatePriorityMatrix(null, null);

      expect(result).toMatchObject({
        high: { total: 0 },
        medium: { total: 0 },
        low: { total: 0 }
      });
    });
  });

  describe('generateGapReport', () => {
    it('should generate comprehensive report', async () => {
      const analysisData = {
        projectStructure: {},
        documentationMap: {
          currentFiles: [],
          movedFiles: [],
          duplicateContent: []
        },
        missingDocs: [
          {
            feature: 'Test Doc',
            component: 'test',
            importance: 'critical',
            estimatedEffort: 'small'
          }
        ],
        outdatedContent: [
          {
            filePath: '/test/old.md',
            issues: ['old file'],
            recommendedAction: 'update'
          }
        ],
        priorityMatrix: {
          high: { total: 1 },
          medium: { total: 0 },
          low: { total: 1 }
        }
      };

      const result = await reporter.generateGapReport(analysisData);

      expect(result).toHaveProperty('missingDocumentation');
      expect(result).toHaveProperty('outdatedContent');
      expect(result).toHaveProperty('inconsistencies');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('priorityMatrix');
      expect(result).toHaveProperty('summary');

      expect(result.summary).toMatchObject({
        totalIssues: 2,
        criticalIssues: 1,
        highPriorityItems: 1,
        lowPriorityItems: 1
      });
      expect(result.summary.generatedAt).toBeDefined();
    });

    it('should generate recommendations based on analysis', async () => {
      const analysisData = {
        documentationMap: { 
          duplicateContent: [],
          currentFiles: []
        },
        missingDocs: [
          { importance: 'critical', feature: 'Critical Doc' }
        ],
        outdatedContent: [
          { filePath: '/test/old.md' }
        ],
        priorityMatrix: { high: { total: 0 }, medium: { total: 0 }, low: { total: 0 } }
      };

      const result = await reporter.generateGapReport(analysisData);

      expect(result.recommendations).toHaveLength(3); // critical, content, automation (no inconsistencies)
      expect(result.recommendations[0]).toMatchObject({
        category: 'critical-documentation',
        title: 'Create Critical Documentation',
        priority: 'high'
      });
    });

    it('should handle missing analysis data', async () => {
      const result = await reporter.generateGapReport({
        documentationMap: { duplicateContent: [], currentFiles: [] }
      });

      expect(result).toHaveProperty('missingDocumentation', []);
      expect(result).toHaveProperty('outdatedContent', []);
      expect(result.summary.totalIssues).toBe(0);
    });

    it('should handle errors and rethrow', async () => {
      // Mock a method to throw an error
      const originalMethod = reporter._findInconsistencies;
      reporter._findInconsistencies = jest.fn().mockRejectedValue(new Error('Test error'));

      const analysisData = {
        documentationMap: { duplicateContent: [], currentFiles: [] }
      };

      await expect(reporter.generateGapReport(analysisData)).rejects.toThrow('Test error');
      
      // Restore original method
      reporter._findInconsistencies = originalMethod;
    });
  });

  describe('helper methods', () => {
    describe('_getImportanceLevel', () => {
      it('should return correct importance levels', () => {
        expect(reporter._getImportanceLevel('README.md')).toBe('critical');
        expect(reporter._getImportanceLevel('QUICK_START.md')).toBe('critical');
        expect(reporter._getImportanceLevel('DEVELOPMENT_GUIDE.md')).toBe('high');
        expect(reporter._getImportanceLevel('API_REFERENCE.md')).toBe('high');
        expect(reporter._getImportanceLevel('OTHER.md')).toBe('medium');
      });
    });

    describe('_getEffortLevel', () => {
      it('should return correct effort levels', () => {
        expect(reporter._getEffortLevel('API_REFERENCE.md')).toBe('large');
        expect(reporter._getEffortLevel('DEVELOPMENT_GUIDE.md')).toBe('large');
        expect(reporter._getEffortLevel('README.md')).toBe('medium');
        expect(reporter._getEffortLevel('TROUBLESHOOTING.md')).toBe('medium');
        expect(reporter._getEffortLevel('OTHER.md')).toBe('small');
      });
    });

    describe('_calculatePriority', () => {
      it('should calculate priority correctly', () => {
        expect(reporter._calculatePriority('critical', 'small')).toBe('high');
        expect(reporter._calculatePriority('critical', 'large')).toBe('medium');
        expect(reporter._calculatePriority('medium', 'small')).toBe('medium');
        expect(reporter._calculatePriority('low', 'small')).toBe('low');
      });
    });

    describe('_calculateScore', () => {
      it('should calculate score correctly', () => {
        const highImportanceLowEffort = reporter._calculateScore('critical', 'small');
        const lowImportanceHighEffort = reporter._calculateScore('low', 'large');
        
        expect(highImportanceLowEffort).toBeGreaterThan(lowImportanceHighEffort);
      });
    });

    describe('_calculateOutdatedPriority', () => {
      it('should prioritize migration and broken references', () => {
        expect(reporter._calculateOutdatedPriority({
          recommendedAction: 'migrate-content'
        })).toBe('high');

        expect(reporter._calculateOutdatedPriority({
          issues: ['Contains 5 broken references']
        })).toBe('high');

        expect(reporter._calculateOutdatedPriority({
          recommendedAction: 'update-commands'
        })).toBe('medium');

        expect(reporter._calculateOutdatedPriority({
          recommendedAction: 'review'
        })).toBe('low');
      });
    });
  });
});