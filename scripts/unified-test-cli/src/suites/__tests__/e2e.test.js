/**
 * Unit tests for E2ESuite class
 * 
 * Tests E2E test suite functionality including service validation,
 * Playwright integration, and frontend-ready data scenario handling.
 */

import { jest } from '@jest/globals';
import { E2ESuite } from '../e2e.js';
import axios from 'axios';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn()
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('E2ESuite', () => {
  let e2eSuite;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      name: 'e2e',
      displayName: 'End-to-End Tests',
      description: 'Playwright E2E tests with full application stack',
      type: 'e2e',
      workspace: 'tests/e2e',
      command: 'npx playwright test',
      requiredServices: ['localstack', 'frontend', 'backend'],
      dataScenario: 'frontend-ready',
      timeout: 300000,
      canRunParallel: false,
      supportsCoverage: false,
      tags: ['e2e', 'playwright', 'slow', 'critical']
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    e2eSuite = new E2ESuite(mockConfig);
    e2eSuite.logger = mockLogger;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize E2E suite with correct configuration', () => {
      expect(e2eSuite.name).toBe('e2e');
      expect(e2eSuite.displayName).toBe('End-to-End Tests');
      expect(e2eSuite.type).toBe('e2e');
      expect(e2eSuite.workspace).toBe('tests/e2e');
      expect(e2eSuite.command).toBe('npx playwright test');
      expect(e2eSuite.testTimeout).toBe(300000);
      expect(e2eSuite.canRunParallel).toBe(false);
    });

    it('should set correct service endpoints', () => {
      expect(e2eSuite.serviceEndpoints).toEqual({
        localstack: 'http://localhost:4566',
        backend: 'http://localhost:9000',
        frontend: 'http://localhost:3000'
      });
    });

    it('should set correct browser and viewport configurations', () => {
      expect(e2eSuite.browsers).toEqual(['chromium', 'firefox', 'webkit']);
      expect(e2eSuite.viewports).toEqual({
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 }
      });
    });
  });

  describe('customValidation', () => {
    it('should validate E2E workspace exists', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: { '@playwright/test': '^1.0.0' }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'user-flows.test.js', isFile: () => true, isDirectory: () => false }
      ]);
      
      const result = await e2eSuite.customValidation();
      
      expect(fs.access).toHaveBeenCalledWith(expect.stringContaining(path.join('tests', 'e2e')));
      expect(result).toBe(true);
    });

    it('should validate package.json has Playwright dependencies', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: { '@playwright/test': '^1.0.0' }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'test.spec.js', isFile: () => true, isDirectory: () => false }
      ]);
      
      const result = await e2eSuite.customValidation();
      
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
      expect(result).toBe(true);
    });

    it('should accept Puppeteer as alternative to Playwright', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: { 'puppeteer': '^21.0.0' }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'test.spec.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await e2eSuite.customValidation();
      expect(result).toBe(true);
    });

    it('should fail validation if no E2E framework is found', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: { 'mocha': '^10.0.0' }
      }));

      const result = await e2eSuite.customValidation();
      expect(result).toBe(false);
    });

    it('should handle missing workspace gracefully', async () => {
      const fs = await import('fs/promises');
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await e2eSuite.customValidation();
      expect(result).toBe(false);
    });
  });

  describe('validateAllServices', () => {
    it('should validate all required services', async () => {
      axios.get.mockResolvedValue({ status: 200, data: 'OK' });
      
      // Mock AWS services validation
      jest.spyOn(e2eSuite, 'validateAWSServices').mockResolvedValue(true);

      const result = await e2eSuite.validateAllServices();
      
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4566/_localstack/health',
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    it('should fail if required services are not responding', async () => {
      axios.get.mockRejectedValue(new Error('Connection refused'));
      
      jest.spyOn(e2eSuite, 'validateAWSServices').mockResolvedValue(false);

      const result = await e2eSuite.validateAllServices();
      expect(result).toBe(false);
    });

    it('should provide helpful error messages for failed services', async () => {
      axios.get.mockRejectedValue(new Error('Connection refused'));
      
      jest.spyOn(e2eSuite, 'validateAWSServices').mockResolvedValue(false);

      const result = await e2eSuite.validateAllServices();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Please start them:')
      );
    });
  });

  describe('prepare', () => {
    it('should set correct environment variables', async () => {
      jest.spyOn(e2eSuite, 'validateAllServices').mockResolvedValue(true);
      jest.spyOn(e2eSuite, 'waitForFrontendReady').mockResolvedValue();
      
      await e2eSuite.prepare();
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.BASE_URL).toBe('http://localhost:3000');
      expect(process.env.API_BASE_URL).toBe('http://localhost:9000');
      expect(process.env.LOCALSTACK_ENDPOINT).toBe('http://localhost:4566');
      expect(process.env.PLAYWRIGHT_BROWSERS_PATH).toBe('0');
    });

    it('should validate services before preparation', async () => {
      const validateSpy = jest.spyOn(e2eSuite, 'validateAllServices').mockResolvedValue(true);
      jest.spyOn(e2eSuite, 'waitForFrontendReady').mockResolvedValue();
      
      await e2eSuite.prepare();
      
      expect(validateSpy).toHaveBeenCalled();
    });

    it('should throw error if service validation fails', async () => {
      jest.spyOn(e2eSuite, 'validateAllServices').mockResolvedValue(false);

      await expect(e2eSuite.prepare()).rejects.toThrow(
        'Service validation failed'
      );
    });
  });

  describe('waitForFrontendReady', () => {
    it('should wait for frontend to return HTML', async () => {
      const axios = await import('axios');
      axios.get.mockResolvedValue({ 
        status: 200, 
        data: '<!DOCTYPE html><html><head><title>App</title></head></html>' 
      });

      await expect(e2eSuite.waitForFrontendReady()).resolves.not.toThrow();
      
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.objectContaining({
          headers: { 'Accept': 'text/html' }
        })
      );
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform Playwright command with default options', () => {
      const args = e2eSuite.transformCommandArgs();
      
      expect(args).toEqual(['npx', 'playwright', 'test']);
    });

    it('should add Playwright config if available', () => {
      e2eSuite.playwrightConfig = '/path/to/playwright.config.ts';
      
      const args = e2eSuite.transformCommandArgs();
      
      expect(args).toContain('--config');
      expect(args).toContain('/path/to/playwright.config.ts');
    });

    it('should add browser selection option', () => {
      const args = e2eSuite.transformCommandArgs({ browser: 'chromium' });
      
      expect(args).toContain('--project');
      expect(args).toContain('chromium');
    });

    it('should add CI mode options', () => {
      const args = e2eSuite.transformCommandArgs({ ci: true });
      
      expect(args).toContain('--reporter=json');
      expect(args).toContain('--output-dir=test-results');
    });

    it('should handle Mocha-based commands', () => {
      e2eSuite.command = 'npm run test:e2e';
      
      const args = e2eSuite.transformCommandArgs();
      
      expect(args).toEqual(['npm', 'run', 'test:e2e', '--timeout', '300000']);
    });
  });

  describe('parseResults', () => {
    it('should parse Playwright JSON output', () => {
      const stdout = JSON.stringify({
        stats: {
          expected: 10,
          passed: 8,
          failed: 2,
          skipped: 0,
          duration: 45000
        },
        suites: [
          { title: 'chromium tests' },
          { title: 'firefox tests' }
        ],
        tests: []
      });

      const result = e2eSuite.parseResults(stdout, '', 0);
      
      expect(result.tests).toEqual({
        total: 10,
        passed: 8,
        failed: 2,
        skipped: 0
      });
      expect(result.duration).toBe(45000);
    });

    it('should parse Mocha JSON output', () => {
      const stdout = JSON.stringify({
        stats: {
          tests: 5,
          passes: 4,
          failures: 1,
          pending: 0,
          duration: 30000
        },
        failures: [
          {
            fullTitle: 'Login flow should authenticate user',
            err: {
              message: 'Element not found',
              stack: 'Error: Element not found\n    at test.js:10'
            }
          }
        ]
      });

      const result = e2eSuite.parseResults(stdout, '', 1);
      
      expect(result.tests).toEqual({
        total: 5,
        passed: 4,
        failed: 1,
        skipped: 0
      });
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].test).toBe('Login flow should authenticate user');
    });

    it('should handle parsing errors gracefully', () => {
      const stdout = 'Invalid JSON output';
      
      const result = e2eSuite.parseResults(stdout, '', 1);
      
      expect(result.exitCode).toBe(1);
      expect(result.tests).toEqual({
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      });
    });
  });

  describe('getRequiredDataScenario', () => {
    it('should return frontend-ready scenario', () => {
      const scenario = e2eSuite.getRequiredDataScenario();
      expect(scenario).toBe('frontend-ready');
    });
  });

  describe('getTestCategories', () => {
    it('should return E2E test categories', () => {
      const categories = e2eSuite.getTestCategories();
      
      expect(categories).toEqual([
        'user-flows',
        'browser-automation',
        'visual-regression',
        'cross-browser',
        'responsive-design'
      ]);
    });
  });

  describe('getSupportedBrowsers', () => {
    it('should return supported browsers', () => {
      const browsers = e2eSuite.getSupportedBrowsers();
      
      expect(browsers).toEqual(['chromium', 'firefox', 'webkit']);
    });
  });

  describe('getSupportedViewports', () => {
    it('should return supported viewports', () => {
      const viewports = e2eSuite.getSupportedViewports();
      
      expect(viewports).toEqual({
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 }
      });
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata with E2E-specific information', () => {
      e2eSuite.playwrightConfig = '/path/to/config';
      
      const metadata = e2eSuite.getMetadata();
      
      expect(metadata).toMatchObject({
        name: 'e2e',
        type: 'e2e',
        testCategories: expect.arrayContaining(['user-flows', 'browser-automation']),
        serviceEndpoints: expect.objectContaining({
          localstack: 'http://localhost:4566',
          frontend: 'http://localhost:3000'
        }),
        supportedBrowsers: ['chromium', 'firefox', 'webkit'],
        playwrightConfig: '/path/to/config',
        dataScenario: 'frontend-ready'
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up test artifacts', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      
      await e2eSuite.cleanup();
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up E2E test artifacts')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const fs = await import('fs/promises');
      fs.access.mockRejectedValue(new Error('Permission denied'));
      
      await expect(e2eSuite.cleanup()).resolves.not.toThrow();
    });
  });

  describe('integration with base suite', () => {
    it('should inherit base suite functionality', () => {
      expect(e2eSuite.validate).toBeDefined();
      expect(e2eSuite.getMetadata).toBeDefined();
      expect(e2eSuite.toJSON).toBeDefined();
    });

    it('should override base suite methods appropriately', () => {
      expect(e2eSuite.getRequiredDataScenario()).toBe('frontend-ready');
      expect(e2eSuite.canRunInParallel()).toBe(false);
    });
  });
});