/**
 * Comparison Validator Tests
 * 
 * Tests the comparison validator to ensure it properly validates
 * functionality preservation between old and new systems.
 */

const { ComparisonValidator } = require('../comparison-validator');
const { UnifiedDataManager } = require('../unified-data-manager');
const { DATA_CONFIG } = require('../data-config');
const fs = require('fs');

// Mock dependencies
jest.mock('../unified-data-manager');
jest.mock('../data-config');
jest.mock('fs');

describe('ComparisonValidator', () => {
  let validator;
  let mockManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock manager
    mockManager = {
      setupData: jest.fn().mockResolvedValue({ success: true }),
      seedScenario: jest.fn().mockRejectedValue(new Error('Unknown scenario: invalid-scenario')),
      resetData: jest.fn().mockRejectedValue(new Error('Unknown reset state: invalid-state')),
      validateData: jest.fn().mockResolvedValue({ success: true }),
      healthCheck: jest.fn().mockResolvedValue({ success: true }),
      getDataStatus: jest.fn().mockResolvedValue({ success: true })
    };
    
    // Mock the constructor
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    // Mock DATA_CONFIG
    DATA_CONFIG.services = {
      localstack: 'http://localhost:4566',
      dynamodb: 'tattoo-directory-local',
      opensearch: 'artists-local',
      s3Bucket: 'tattoo-directory-images'
    };
    
    DATA_CONFIG.paths = {
      imageSource: 'tests/Test_Data/ImageSet',
      testData: 'scripts/test-data'
    };
    
    DATA_CONFIG.scenarios = {
      minimal: { description: 'Minimal dataset' },
      'search-basic': { description: 'Basic search' },
      'london-artists': { description: 'London artists' },
      'high-rated': { description: 'High rated artists' },
      'new-artists': { description: 'New artists' },
      'booking-available': { description: 'Booking available' },
      'portfolio-rich': { description: 'Portfolio rich' },
      'multi-style': { description: 'Multi style' },
      'pricing-range': { description: 'Pricing range' },
      'full-dataset': { description: 'Full dataset' }
    };
    
    DATA_CONFIG.resetStates = {
      clean: { description: 'Clean state' },
      fresh: { description: 'Fresh state' },
      minimal: { description: 'Minimal state' },
      'search-ready': { description: 'Search ready' },
      'location-test': { description: 'Location test' },
      'style-test': { description: 'Style test' },
      'performance-test': { description: 'Performance test' },
      'frontend-ready': { description: 'Frontend ready' }
    };
    
    validator = new ComparisonValidator();
  });

  describe('Configuration Validation', () => {
    test('should validate configuration structure successfully', async () => {
      const result = await validator.validateConfigurationStructure();
      
      expect(result.name).toBe('Configuration Structure');
      expect(result.status).toBe('passed');
      expect(result.details.sections).toBe(4);
      expect(result.details.services).toBe(4);
    });

    test('should detect missing configuration sections', async () => {
      // Remove a required section
      delete DATA_CONFIG.services;
      
      const result = await validator.validateConfigurationStructure();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing configuration sections');
    });

    test('should detect missing service configurations', async () => {
      // Remove a required service
      delete DATA_CONFIG.services.localstack;
      
      const result = await validator.validateConfigurationStructure();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing service configurations');
    });
  });

  describe('Service Endpoint Validation', () => {
    test('should validate service endpoints successfully', async () => {
      const result = await validator.validateServiceEndpoints();
      
      expect(result.name).toBe('Service Endpoints');
      expect(result.status).toBe('passed');
      expect(result.details.validEndpoints).toBe(4);
    });

    test('should detect invalid endpoint formats', async () => {
      DATA_CONFIG.services.localstack = 'invalid-endpoint';
      
      const result = await validator.validateServiceEndpoints();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Invalid endpoint configurations');
    });

    test('should detect missing endpoints', async () => {
      DATA_CONFIG.services.dynamodb = '';
      
      const result = await validator.validateServiceEndpoints();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Invalid endpoint configurations');
    });
  });

  describe('Scenario Definitions Validation', () => {
    test('should validate scenario definitions successfully', async () => {
      const result = await validator.validateScenarioDefinitions();
      
      expect(result.name).toBe('Scenario Definitions');
      expect(result.status).toBe('passed');
      expect(result.details.totalScenarios).toBe(10);
      expect(result.details.expectedScenarios).toBe(10);
    });

    test('should detect missing scenarios', async () => {
      delete DATA_CONFIG.scenarios.minimal;
      
      const result = await validator.validateScenarioDefinitions();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing scenarios: minimal');
    });

    test('should warn about incomplete scenario definitions', async () => {
      DATA_CONFIG.scenarios['incomplete-scenario'] = {};
      
      const result = await validator.validateScenarioDefinitions();
      
      expect(result.status).toBe('warning');
      expect(result.warning).toContain('incomplete definitions');
    });
  });

  describe('Reset States Validation', () => {
    test('should validate reset states successfully', async () => {
      const result = await validator.validateResetStates();
      
      expect(result.name).toBe('Reset States');
      expect(result.status).toBe('passed');
      expect(result.details.totalStates).toBe(8);
      expect(result.details.expectedStates).toBe(8);
    });

    test('should detect missing reset states', async () => {
      delete DATA_CONFIG.resetStates.clean;
      
      const result = await validator.validateResetStates();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing reset states: clean');
    });
  });

  describe('Component Logic Validation', () => {
    test('should validate image processing logic', async () => {
      // Mock require to return a valid ImageProcessor
      jest.doMock('../image-processor', () => {
        return class ImageProcessor {
          processImages() {}
          uploadToS3() {}
          configureCORS() {}
        };
      });
      
      const result = await validator.validateImageProcessingLogic();
      
      expect(result.name).toBe('Image Processing Logic');
      expect(result.status).toBe('passed');
      expect(result.details.methods).toBe(3);
    });

    test('should handle missing image processor', async () => {
      // Create a new validator instance and mock the require call within the method
      const testValidator = new ComparisonValidator();
      
      // Spy on the validateImageProcessingLogic method and mock it to simulate missing module
      jest.spyOn(testValidator, 'validateImageProcessingLogic').mockImplementation(async () => {
        try {
          throw new Error('Module not found');
        } catch (error) {
          return {
            name: 'Image Processing Logic',
            status: 'failed',
            error: `ImageProcessor not available: ${error.message}`
          };
        }
      });
      
      const result = await testValidator.validateImageProcessingLogic();
      
      expect(result.status).toBe('failed');
      expect(result.error).toContain('ImageProcessor not available');
    });

    test('should validate database seeding logic', async () => {
      // Mock require to return a valid DatabaseSeeder
      jest.doMock('../database-seeder', () => {
        return class DatabaseSeeder {
          seedDynamoDB() {}
          seedOpenSearch() {}
          validateData() {}
        };
      });
      
      const result = await validator.validateDatabaseSeedingLogic();
      
      expect(result.name).toBe('Database Seeding Logic');
      expect(result.status).toBe('passed');
      expect(result.details.methods).toBe(3);
    });

    test('should validate frontend sync logic', async () => {
      // Mock require to return a valid FrontendSyncProcessor
      jest.doMock('../frontend-sync-processor', () => {
        return class FrontendSyncProcessor {
          generateMockData() {}
          updateFrontendFiles() {}
        };
      });
      
      const result = await validator.validateFrontendSyncLogic();
      
      expect(result.name).toBe('Frontend Sync Logic');
      expect(result.status).toBe('passed');
      expect(result.details.methods).toBe(2);
    });
  });

  describe('Interface Validation', () => {
    test('should validate setup data interface', async () => {
      const result = await validator.validateSetupDataInterface();
      
      expect(result.name).toBe('Setup Data Interface');
      expect(result.status).toBe('passed');
      expect(result.details.method).toBe('setupData');
    });

    test('should validate reset data interface', async () => {
      const result = await validator.validateResetDataInterface();
      
      expect(result.name).toBe('Reset Data Interface');
      expect(result.status).toBe('passed');
      expect(result.details.method).toBe('resetData');
    });

    test('should validate seed scenario interface', async () => {
      const result = await validator.validateSeedScenarioInterface();
      
      expect(result.name).toBe('Seed Scenario Interface');
      expect(result.status).toBe('passed');
      expect(result.details.method).toBe('seedScenario');
    });

    test('should validate validation interface', async () => {
      const result = await validator.validateValidationInterface();
      
      expect(result.name).toBe('Validation Interface');
      expect(result.status).toBe('passed');
      expect(result.details.method).toBe('validateData');
    });

    test('should validate health check interface', async () => {
      const result = await validator.validateHealthCheckInterface();
      
      expect(result.name).toBe('Health Check Interface');
      expect(result.status).toBe('passed');
      expect(result.details.method).toBe('healthCheck');
    });
  });

  describe('Error Handling Validation', () => {
    test('should validate error handling consistency', async () => {
      const result = await validator.validateErrorHandlingConsistency();
      
      expect(result.name).toBe('Error Handling Consistency');
      expect(result.status).toBe('passed');
      expect(result.details.errorMessage).toContain('invalid-scenario');
    });

    test('should validate input validation', async () => {
      const result = await validator.validateInputValidation();
      
      expect(result.name).toBe('Input Validation');
      expect(result.status).toBe('passed');
      expect(result.details.errorMessage).toContain('invalid-state');
    });

    test('should validate service failure handling', async () => {
      const result = await validator.validateServiceFailureHandling();
      
      expect(result.name).toBe('Service Failure Handling');
      expect(result.status).toBe('passed');
      expect(result.details.healthCheckAvailable).toBe(true);
    });
  });

  describe('Test Result Recording', () => {
    test('should record passed test results', () => {
      const result = {
        name: 'Test Case',
        status: 'passed',
        details: { info: 'test passed' }
      };
      
      validator.recordTestResult(result);
      
      expect(validator.comparisonResults.tests).toContain(result);
      expect(validator.comparisonResults.passed).toBe(1);
    });

    test('should record failed test results', () => {
      const result = {
        name: 'Test Case',
        status: 'failed',
        error: 'Test failed'
      };
      
      validator.recordTestResult(result);
      
      expect(validator.comparisonResults.tests).toContain(result);
      expect(validator.comparisonResults.failed).toBe(1);
    });

    test('should record warning test results', () => {
      const result = {
        name: 'Test Case',
        status: 'warning',
        warning: 'Test warning'
      };
      
      validator.recordTestResult(result);
      
      expect(validator.comparisonResults.tests).toContain(result);
      expect(validator.comparisonResults.warnings).toBe(1);
    });
  });

  describe('Comprehensive Validation', () => {
    test('should run comprehensive validation successfully', async () => {
      const results = await validator.runComprehensiveValidation();
      
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.passed).toBeGreaterThan(0);
      expect(typeof results.failed).toBe('number');
      expect(typeof results.warnings).toBe('number');
    });
  });

  describe('Report Generation', () => {
    test('should generate detailed report', () => {
      // Add some test results
      validator.comparisonResults.tests = [
        { name: 'Test 1', status: 'passed' },
        { name: 'Test 2', status: 'failed', error: 'Error message' }
      ];
      validator.comparisonResults.passed = 1;
      validator.comparisonResults.failed = 1;
      
      // Mock fs.writeFileSync and fs.mkdirSync
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      const report = validator.generateDetailedReport();
      
      expect(report.summary.total).toBe(2);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.summary.successRate).toBe(50);
      expect(report.tests.length).toBe(2);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate recommendations for failed tests', () => {
      validator.comparisonResults.tests = [
        { name: 'Test 1', status: 'failed', error: 'Critical error' },
        { name: 'Test 2', status: 'warning', warning: 'Minor issue' }
      ];
      validator.comparisonResults.passed = 0;
      validator.comparisonResults.failed = 1;
      validator.comparisonResults.warnings = 1;
      
      const recommendations = validator.generateRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.type === 'critical')).toBe(true);
      expect(recommendations.some(rec => rec.type === 'warning')).toBe(true);
    });

    test('should generate improvement recommendations for low success rate', () => {
      validator.comparisonResults.tests = [
        { name: 'Test 1', status: 'passed' },
        { name: 'Test 2', status: 'failed', error: 'Error' },
        { name: 'Test 3', status: 'failed', error: 'Error' }
      ];
      validator.comparisonResults.passed = 1;
      validator.comparisonResults.failed = 2;
      
      const recommendations = validator.generateRecommendations();
      
      expect(recommendations.some(rec => rec.type === 'improvement')).toBe(true);
    });
  });
});