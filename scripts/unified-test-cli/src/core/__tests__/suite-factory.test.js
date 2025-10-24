/**
 * Unit tests for SuiteFactory class
 */

import { jest } from '@jest/globals';
import { SuiteFactory } from '../suite-factory.js';
import { BaseSuite } from '../../suites/base-suite.js';
import { BackendUnitSuite } from '../../suites/backend-unit.js';
import { FrontendUnitSuite } from '../../suites/frontend-unit.js';
import { IntegrationSuite } from '../../suites/integration.js';

// Mock dependencies
jest.mock('../../utils/logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('SuiteFactory', () => {
  let factory;

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new SuiteFactory();
  });

  describe('constructor', () => {
    it('should initialize with default suite classes', () => {
      expect(factory.suiteClasses).toBeInstanceOf(Map);
      expect(factory.suiteClasses.has('backend-unit')).toBe(true);
      expect(factory.suiteClasses.get('backend-unit')).toBe(BackendUnitSuite);
      expect(factory.suiteClasses.has('frontend-unit')).toBe(true);
      expect(factory.suiteClasses.get('frontend-unit')).toBe(FrontendUnitSuite);
      expect(factory.suiteClasses.has('integration')).toBe(true);
      expect(factory.suiteClasses.get('integration')).toBe(IntegrationSuite);
    });
  });

  describe('createSuite', () => {
    it('should create BackendUnitSuite for backend-unit configuration', () => {
      const config = {
        name: 'backend-unit',
        type: 'unit',
        workspace: 'backend',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(BackendUnitSuite);
      expect(suite.name).toBe('backend-unit');
      expect(suite.workspace).toBe('backend');
    });

    it('should create FrontendUnitSuite for frontend-unit configuration', () => {
      const config = {
        name: 'frontend-unit',
        type: 'unit',
        workspace: 'frontend',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(FrontendUnitSuite);
      expect(suite.name).toBe('frontend-unit');
      expect(suite.workspace).toBe('frontend');
    });

    it('should create IntegrationSuite for integration configuration', () => {
      const config = {
        name: 'integration',
        type: 'integration',
        workspace: 'tests/integration',
        command: 'npm run test:integration',
        requiredServices: ['localstack'],
        dataScenario: 'minimal'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(IntegrationSuite);
      expect(suite.name).toBe('integration');
      expect(suite.workspace).toBe('tests/integration');
      expect(suite.requiredServices).toContain('localstack');
    });

    it('should create BaseSuite for unknown configuration', () => {
      const config = {
        name: 'unknown-suite',
        type: 'unknown',
        workspace: 'test',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(BaseSuite);
      expect(suite.name).toBe('unknown-suite');
    });

    it('should match backend suite by type pattern', () => {
      const config = {
        name: 'custom-backend-unit-tests',
        type: 'unit',
        workspace: 'backend',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(BackendUnitSuite);
    });

    it('should match frontend suite by type pattern', () => {
      const config = {
        name: 'custom-frontend-unit-tests',
        type: 'unit',
        workspace: 'frontend',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(FrontendUnitSuite);
    });

    it('should match integration suite by type pattern', () => {
      const config = {
        name: 'custom-integration-tests',
        type: 'integration',
        workspace: 'tests/integration',
        command: 'npm run test'
      };

      const suite = factory.createSuite(config);

      expect(suite).toBeInstanceOf(IntegrationSuite);
    });

    it('should throw error if suite creation fails', () => {
      const config = null;

      expect(() => factory.createSuite(config)).toThrow('Suite creation failed');
    });
  });

  describe('getSuiteClass', () => {
    it('should return exact match by name for backend', () => {
      const config = { name: 'backend-unit' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(BackendUnitSuite);
    });

    it('should return exact match by name for frontend', () => {
      const config = { name: 'frontend-unit' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(FrontendUnitSuite);
    });

    it('should return exact match by name for integration', () => {
      const config = { name: 'integration' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(IntegrationSuite);
    });

    it('should return match by backend type pattern', () => {
      const config = { name: 'my-backend-unit-tests', type: 'unit' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(BackendUnitSuite);
    });

    it('should return match by frontend type pattern', () => {
      const config = { name: 'my-frontend-unit-tests', type: 'unit' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(FrontendUnitSuite);
    });

    it('should return match by integration type pattern', () => {
      const config = { name: 'my-integration-tests', type: 'integration' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(IntegrationSuite);
    });

    it('should return BaseSuite for unknown types', () => {
      const config = { name: 'unknown', type: 'unknown' };

      const SuiteClass = factory.getSuiteClass(config);

      expect(SuiteClass).toBe(BaseSuite);
      expect(factory.logger.warn).toHaveBeenCalledWith(
        'No specific suite class found for unknown, using BaseSuite'
      );
    });
  });

  describe('registerSuite', () => {
    it('should register a new suite class', () => {
      class CustomSuite extends BaseSuite {}

      factory.registerSuite('custom', CustomSuite);

      expect(factory.suiteClasses.has('custom')).toBe(true);
      expect(factory.suiteClasses.get('custom')).toBe(CustomSuite);
      expect(factory.logger.debug).toHaveBeenCalledWith(
        'Registered suite class: custom',
        { class: 'CustomSuite' }
      );
    });

    it('should throw error if suite class is not a function', () => {
      expect(() => factory.registerSuite('invalid', 'not-a-function')).toThrow(
        'Suite class must be a constructor function'
      );
    });
  });

  describe('getRegisteredSuites', () => {
    it('should return array of registered suite names', () => {
      const suites = factory.getRegisteredSuites();

      expect(Array.isArray(suites)).toBe(true);
      expect(suites).toContain('backend-unit');
      expect(suites).toContain('frontend-unit');
      expect(suites).toContain('integration');
    });
  });

  describe('isSuiteRegistered', () => {
    it('should return true for registered suite', () => {
      const result = factory.isSuiteRegistered('backend-unit');

      expect(result).toBe(true);
    });

    it('should return false for unregistered suite', () => {
      const result = factory.isSuiteRegistered('unknown-suite');

      expect(result).toBe(false);
    });
  });
});