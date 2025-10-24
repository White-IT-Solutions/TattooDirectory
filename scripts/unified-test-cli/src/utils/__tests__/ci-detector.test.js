/**
 * Tests for CI Environment Detection Utility
 */

import { CIDetector } from '../ci-detector.js';

describe('CIDetector', () => {
  let ciDetector;
  let originalEnv;

  beforeEach(() => {
    ciDetector = new CIDetector();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('isCI', () => {
    test('should detect CI environment with CI=true', () => {
      process.env.CI = 'true';
      expect(ciDetector.isCI()).toBe(true);
    });

    test('should detect CI environment with CONTINUOUS_INTEGRATION=true', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';
      expect(ciDetector.isCI()).toBe(true);
    });

    test('should detect GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(ciDetector.isCI()).toBe(true);
    });

    test('should not detect CI in clean environment', () => {
      // Clear all CI-related env vars
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;
      
      expect(ciDetector.isCI()).toBe(false);
    });
  });

  describe('detectCIEnvironment', () => {
    test('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_WORKFLOW = 'test';
      process.env.GITHUB_RUN_ID = '123';
      process.env.GITHUB_REF_NAME = 'main';
      process.env.GITHUB_SHA = 'abc123';
      process.env.GITHUB_SERVER_URL = 'https://github.com';
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      const result = ciDetector.detectCIEnvironment();
      
      expect(result).toEqual({
        type: 'github',
        name: 'GitHub Actions',
        features: ['junit-xml', 'json-output', 'artifacts'],
        buildId: '123',
        buildUrl: 'https://github.com/owner/repo/actions/runs/123',
        branch: 'main',
        commit: 'abc123'
      });
    });

    test('should detect Jenkins', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      process.env.BUILD_NUMBER = '456';
      process.env.BUILD_URL = 'http://jenkins.example.com/job/test/456';
      process.env.GIT_BRANCH = 'develop';
      process.env.GIT_COMMIT = 'def456';

      const result = ciDetector.detectCIEnvironment();
      
      expect(result).toEqual({
        type: 'jenkins',
        name: 'Jenkins',
        features: ['junit-xml', 'json-output', 'artifacts'],
        buildId: '456',
        buildUrl: 'http://jenkins.example.com/job/test/456',
        branch: 'develop',
        commit: 'def456'
      });
    });

    test('should detect GitLab CI', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_JOB_ID = '789';
      process.env.CI_JOB_URL = 'https://gitlab.com/project/-/jobs/789';
      process.env.CI_COMMIT_REF_NAME = 'feature-branch';
      process.env.CI_COMMIT_SHA = 'ghi789';

      const result = ciDetector.detectCIEnvironment();
      
      expect(result).toEqual({
        type: 'gitlab',
        name: 'GitLab CI',
        features: ['junit-xml', 'json-output', 'artifacts'],
        buildId: '789',
        buildUrl: 'https://gitlab.com/project/-/jobs/789',
        branch: 'feature-branch',
        commit: 'ghi789'
      });
    });

    test('should return null for non-CI environment', () => {
      // Clear all CI-related env vars
      Object.keys(process.env).forEach(key => {
        if (key.includes('CI') || key.includes('BUILD') || key.includes('GITHUB')) {
          delete process.env[key];
        }
      });

      const result = ciDetector.detectCIEnvironment();
      expect(result).toBeNull();
    });
  });

  describe('getCIConfig', () => {
    test('should return non-CI config for local environment', () => {
      // Clear CI environment
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;

      const config = ciDetector.getCIConfig();
      
      expect(config).toEqual({
        isCI: false,
        nonInteractive: false,
        outputFormats: ['console'],
        artifactDir: './test-results',
        exitOnFailure: false
      });
    });

    test('should return CI config for GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_WORKFLOW = 'test';

      const config = ciDetector.getCIConfig();
      
      expect(config.isCI).toBe(true);
      expect(config.nonInteractive).toBe(true);
      expect(config.exitOnFailure).toBe(true);
      expect(config.outputFormats).toContain('junit');
      expect(config.outputFormats).toContain('json');
      expect(config.parallelDefault).toBe(true);
    });

    test('should return CI config for Jenkins', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      process.env.BUILD_NUMBER = '123';

      const config = ciDetector.getCIConfig();
      
      expect(config.isCI).toBe(true);
      expect(config.nonInteractive).toBe(true);
      expect(config.exitOnFailure).toBe(true);
      expect(config.parallelDefault).toBe(false); // Jenkins not in parallel-friendly list
    });
  });

  describe('getExitCode', () => {
    test('should return 0 for success', () => {
      const exitCode = ciDetector.getExitCode(true, 0);
      expect(exitCode).toBe(0);
    });

    test('should return 1 for test failures', () => {
      const exitCode = ciDetector.getExitCode(false, 5);
      expect(exitCode).toBe(1);
    });

    test('should return 2 for other errors', () => {
      const exitCode = ciDetector.getExitCode(false, 0);
      expect(exitCode).toBe(2);
    });
  });

  describe('supportsFeature', () => {
    test('should return true for supported features in CI', () => {
      process.env.GITHUB_ACTIONS = 'true';
      
      expect(ciDetector.supportsFeature('junit-xml')).toBe(true);
      expect(ciDetector.supportsFeature('json-output')).toBe(true);
      expect(ciDetector.supportsFeature('artifacts')).toBe(true);
    });

    test('should return false for unsupported features', () => {
      process.env.GITHUB_ACTIONS = 'true';
      
      expect(ciDetector.supportsFeature('unsupported-feature')).toBe(false);
    });

    test('should return false for features in non-CI environment', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      
      expect(ciDetector.supportsFeature('junit-xml')).toBe(false);
    });
  });

  describe('getArtifactPaths', () => {
    test('should return default paths for non-CI environment', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;

      const paths = ciDetector.getArtifactPaths();
      
      expect(paths.testResults).toBe('./test-results/test-results');
      expect(paths.junit).toBe('./test-results/junit.xml');
      expect(paths.json).toBe('./test-results/results.json');
    });

    test('should return GitHub-specific paths', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.RUNNER_TEMP = '/tmp/runner';

      const paths = ciDetector.getArtifactPaths();
      
      expect(paths.testResults).toBe('/tmp/runner/test-results/test-results');
      expect(paths.junit).toBe('/tmp/runner/test-results/junit.xml');
    });

    test('should return Jenkins-specific paths', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      process.env.WORKSPACE = '/var/jenkins/workspace/job';

      const paths = ciDetector.getArtifactPaths();
      
      expect(paths.testResults).toBe('/var/jenkins/workspace/job/test-results/test-results');
    });
  });
});