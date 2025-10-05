/**
 * Tests for Artifact Generator
 */

import fs from 'fs/promises';
import path from 'path';

// Mock dependencies before importing
jest.mock('fs/promises');
jest.mock('../ci-detector.js');
jest.mock('../logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

import { ArtifactGenerator } from '../artifact-generator.js';
import { CIDetector } from '../ci-detector.js';

describe('ArtifactGenerator', () => {
  let generator;
  let mockFs;
  let mockCIDetector;

  beforeEach(() => {
    mockFs = fs;
    mockFs.mkdir = jest.fn().mockResolvedValue();
    mockFs.writeFile = jest.fn().mockResolvedValue();
    mockFs.appendFile = jest.fn().mockResolvedValue();

    mockCIDetector = {
      isCI: jest.fn().mockReturnValue(false),
      detectCIEnvironment: jest.fn().mockReturnValue(null),
      getCIConfig: jest.fn().mockReturnValue({ isCI: false }),
      getExitCode: jest.fn().mockReturnValue(0),
      getArtifactPaths: jest.fn().mockReturnValue({
        testResults: './test-results',
        coverage: './test-results/coverage',
        reports: './test-results/reports'
      })
    };

    CIDetector.mockImplementation(() => mockCIDetector);

    generator = new ArtifactGenerator({
      outputDir: './test-artifacts'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      const defaultGenerator = new ArtifactGenerator();
      
      expect(defaultGenerator.options.outputDir).toBe('./test-results');
      expect(defaultGenerator.options.generateSummary).toBe(true);
      expect(defaultGenerator.options.generateBadges).toBe(true);
      expect(defaultGenerator.options.generateManifest).toBe(true);
    });

    test('should accept custom options', () => {
      const customGenerator = new ArtifactGenerator({
        outputDir: './custom-artifacts',
        generateSummary: false,
        generateBadges: false
      });
      
      expect(customGenerator.options.outputDir).toBe('./custom-artifacts');
      expect(customGenerator.options.generateSummary).toBe(false);
      expect(customGenerator.options.generateBadges).toBe(false);
    });
  });

  describe('generateArtifacts', () => {
    const testResults = {
      success: true,
      totalSuites: 2,
      totalTests: 15,
      passedTests: 15,
      failedTests: 0,
      skippedTests: 0,
      duration: 8000,
      successRate: 100,
      suites: [
        { suite: 'frontend-unit', status: 'passed', duration: 5000 },
        { suite: 'backend-unit', status: 'passed', duration: 3000 }
      ]
    };

    const reporters = [
      { type: 'junit', outputPath: './test-results/junit.xml', success: true },
      { type: 'json', outputPath: './test-results/results.json', success: true }
    ];

    test('should generate all artifacts successfully', async () => {
      const result = await generator.generateArtifacts(testResults, reporters);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('./test-artifacts', { recursive: true });
      expect(result).toMatchObject({
        success: true,
        artifactCount: expect.any(Number),
        artifacts: expect.any(Array),
        outputDir: './test-artifacts'
      });
      expect(result.artifactCount).toBeGreaterThan(0);
    });

    test('should generate summary file', async () => {
      await generator.generateArtifacts(testResults, reporters);
      
      const summaryCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('summary.json')
      );
      expect(summaryCall).toBeDefined();
      
      const summaryContent = JSON.parse(summaryCall[1]);
      expect(summaryContent).toMatchObject({
        success: true,
        summary: {
          totalSuites: 2,
          totalTests: 15,
          passed: 15,
          failed: 0
        },
        exitCode: 0
      });
    });

    test('should generate manifest file', async () => {
      await generator.generateArtifacts(testResults, reporters);
      
      const manifestCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('manifest.json')
      );
      expect(manifestCall).toBeDefined();
      
      const manifestContent = JSON.parse(manifestCall[1]);
      expect(manifestContent).toMatchObject({
        version: '1.0',
        testFramework: 'Unified Test CLI',
        results: {
          success: true,
          totalSuites: 2,
          totalTests: 15
        },
        reporters: [
          { type: 'junit', outputPath: './test-results/junit.xml', success: true },
          { type: 'json', outputPath: './test-results/results.json', success: true }
        ]
      });
    });

    test('should generate badges', async () => {
      await generator.generateArtifacts(testResults, reporters);
      
      const badgesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('badges.json')
      );
      expect(badgesCall).toBeDefined();
      
      const badgesContent = JSON.parse(badgesCall[1]);
      expect(badgesContent).toHaveProperty('tests');
      expect(badgesContent).toHaveProperty('status');
      expect(badgesContent.tests).toMatchObject({
        label: 'tests',
        message: '15/15',
        color: 'brightgreen'
      });
    });

    test('should generate artifact index', async () => {
      await generator.generateArtifacts(testResults, reporters);
      
      const indexCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('index.json')
      );
      expect(indexCall).toBeDefined();
      
      const indexContent = JSON.parse(indexCall[1]);
      expect(indexContent).toHaveProperty('totalArtifacts');
      expect(indexContent).toHaveProperty('artifacts');
      expect(indexContent.artifacts).toBeInstanceOf(Array);
    });

    test('should skip optional artifacts when disabled', async () => {
      const minimalGenerator = new ArtifactGenerator({
        outputDir: './test-artifacts',
        generateSummary: false,
        generateBadges: false,
        generateManifest: false
      });

      await minimalGenerator.generateArtifacts(testResults, reporters);
      
      // Should only generate index and CI-specific artifacts
      const writeFileCalls = mockFs.writeFile.mock.calls;
      const fileNames = writeFileCalls.map(call => path.basename(call[0]));
      
      expect(fileNames).not.toContain('summary.json');
      expect(fileNames).not.toContain('badges.json');
      expect(fileNames).not.toContain('manifest.json');
      expect(fileNames).toContain('index.json');
    });

    test('should handle CI-specific artifacts for GitHub Actions', async () => {
      mockCIDetector.detectCIEnvironment.mockReturnValue({
        type: 'github',
        name: 'GitHub Actions'
      });

      // Mock GitHub environment
      process.env.GITHUB_STEP_SUMMARY = '/tmp/github-summary';

      await generator.generateArtifacts(testResults, reporters);
      
      const githubSummaryCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('github-summary.md')
      );
      expect(githubSummaryCall).toBeDefined();
      
      // Should also append to GitHub step summary
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        '/tmp/github-summary',
        expect.stringContaining('# Test Results'),
        'utf8'
      );

      delete process.env.GITHUB_STEP_SUMMARY;
    });

    test('should handle CI-specific artifacts for Jenkins', async () => {
      mockCIDetector.detectCIEnvironment.mockReturnValue({
        type: 'jenkins',
        name: 'Jenkins'
      });

      await generator.generateArtifacts(testResults, reporters);
      
      const propertiesCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('test.properties')
      );
      expect(propertiesCall).toBeDefined();
      
      const propertiesContent = propertiesCall[1];
      expect(propertiesContent).toContain('test.success=true');
      expect(propertiesContent).toContain('test.total=15');
      expect(propertiesContent).toContain('test.passed=15');
    });

    test('should handle CI-specific artifacts for GitLab', async () => {
      mockCIDetector.detectCIEnvironment.mockReturnValue({
        type: 'gitlab',
        name: 'GitLab CI'
      });

      await generator.generateArtifacts(testResults, reporters);
      
      const gitlabReportCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('gitlab-report.json')
      );
      expect(gitlabReportCall).toBeDefined();
      
      const reportContent = JSON.parse(gitlabReportCall[1]);
      expect(reportContent).toMatchObject({
        success: true,
        summary: '15/15 tests passed',
        details: {
          totalSuites: 2,
          totalTests: 15,
          duration: 8000
        }
      });
    });

    test('should handle file system errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(generator.generateArtifacts(testResults, reporters))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('getExitCode', () => {
    test('should delegate to CI detector', () => {
      const testResults = { success: false, failedTests: 3 };
      mockCIDetector.getExitCode.mockReturnValue(1);
      
      const exitCode = generator.getExitCode(testResults);
      
      expect(mockCIDetector.getExitCode).toHaveBeenCalledWith(false, 3);
      expect(exitCode).toBe(1);
    });
  });

  describe('getCIConfig', () => {
    test('should delegate to CI detector', () => {
      const mockConfig = { isCI: true, nonInteractive: true };
      mockCIDetector.getCIConfig.mockReturnValue(mockConfig);
      
      const config = generator.getCIConfig();
      
      expect(mockCIDetector.getCIConfig).toHaveBeenCalled();
      expect(config).toBe(mockConfig);
    });
  });

  describe('badge generation', () => {
    test('should generate correct badge colors for different success rates', async () => {
      const testCases = [
        { successRate: 95, expectedColor: 'brightgreen' },
        { successRate: 75, expectedColor: 'yellow' },
        { successRate: 45, expectedColor: 'red' }
      ];

      for (const testCase of testCases) {
        const testResults = {
          success: testCase.successRate === 100,
          coverage: { overall: testCase.successRate }
        };

        await generator.generateArtifacts(testResults, []);
        
        const badgesCall = mockFs.writeFile.mock.calls.find(call => 
          call[0].includes('badges.json')
        );
        const badgesContent = JSON.parse(badgesCall[1]);
        
        if (badgesContent.coverage) {
          expect(badgesContent.coverage.color).toBe(testCase.expectedColor);
        }

        // Clear mocks for next iteration
        mockFs.writeFile.mockClear();
      }
    });
  });
});