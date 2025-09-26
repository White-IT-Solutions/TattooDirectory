/**
 * Migration Integration Tests
 * 
 * Integration tests for the complete migration system including
 * backward compatibility, migration utilities, and validation.
 */

const { BackwardCompatibilityLayer } = require('../../backward-compatibility');
const { MigrationUtility } = require('../../migration-utility');
const { ComparisonValidator } = require('../../comparison-validator');
const { UnifiedDataManager } = require('../../unified-data-manager');
const fs = require('fs');

// Mock dependencies
jest.mock('../../unified-data-manager');
jest.mock('fs');

describe('Migration Integration', () => {
  let compatLayer;
  let migrationUtility;
  let comparisonValidator;
  let mockManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock manager
    mockManager = {
      setupData: jest.fn().mockResolvedValue({ success: true, message: 'Setup completed' }),
      seedScenario: jest.fn().mockResolvedValue({ success: true, message: 'Scenario seeded' }),
      resetData: jest.fn().mockResolvedValue({ success: true, message: 'Data reset' }),
      validateData: jest.fn().mockResolvedValue({ success: true, message: 'Validation passed' }),
      healthCheck: jest.fn().mockResolvedValue({ 
        success: true, 
        services: { dynamodb: 'healthy', opensearch: 'healthy', s3: 'healthy' }
      }),
      getDataStatus: jest.fn().mockResolvedValue({ 
        success: true, 
        status: 'ready',
        counts: { artists: 10, studios: 5, images: 50 }
      })
    };
    
    // Mock the constructor
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    // Create instances
    compatLayer = new BackwardCompatibilityLayer();
    migrationUtility = new MigrationUtility();
    comparisonValidator = new ComparisonValidator();
  });

  describe('End-to-End Migration Workflow', () => {
    test('should complete full migration analysis workflow', async () => {
      // Mock file system for realistic project structure
      fs.existsSync.mockImplementation((path) => {
        return path.includes('seed.js') || 
               path.includes('selective-seeder.js') ||
               path.includes('docker-compose') ||
               path.includes('package.json');
      });
      
      fs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2024-01-01')
      });
      
      fs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {
          'setup-data': 'node scripts/data-cli.js setup-data',
          'reset-data': 'node scripts/data-cli.js reset-data',
          'data:seed': 'legacy command',
          'data:reset': 'legacy command'
        },
        workspaces: ['scripts', 'frontend', 'backend']
      }));

      // Step 1: Analyze migration readiness
      const analysis = await migrationUtility.analyzeMigrationReadiness();
      
      expect(analysis.legacyScripts.found.length).toBeGreaterThan(0);
      expect(analysis.npmScripts.hasNewSystem).toBe(true);
      expect(analysis.npmScripts.hasLegacy).toBe(true);
      expect(analysis.dockerIntegration.hasDocker).toBe(true);
      expect(analysis.recommendations.length).toBeGreaterThan(0);

      // Step 2: Test migration compatibility
      const migrationResults = await migrationUtility.testMigration(['setup-data', 'health-check']);
      
      expect(migrationResults.tested.length).toBe(2);
      expect(migrationResults.passed.length).toBe(2);
      expect(migrationResults.failed.length).toBe(0);

      // Step 3: Validate functionality preservation
      const validationResults = await migrationUtility.validateFunctionalityPreservation();
      
      expect(validationResults.successRate).toBeGreaterThan(50);
      expect(validationResults.results.length).toBeGreaterThan(0);
    });

    test('should handle backward compatibility during migration', async () => {
      // Test that legacy operations work during migration period
      const legacySeedResult = await compatLayer.legacySeed({ force: true });
      expect(legacySeedResult.success).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalledWith({
        force: true,
        frontendOnly: false
      });

      const legacyScenarioResult = await compatLayer.legacySelectiveSeeder('minimal');
      expect(legacyScenarioResult.success).toBe(true);
      expect(mockManager.seedScenario).toHaveBeenCalledWith('minimal');

      const legacyHealthResult = await compatLayer.legacyHealthCheck();
      expect(legacyHealthResult.success).toBe(true);
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });

    test('should validate system consistency after migration', async () => {
      // Mock DATA_CONFIG for validation
      const mockConfig = {
        services: {
          localstack: 'http://localhost:4566',
          dynamodb: 'tattoo-directory-local',
          opensearch: 'artists-local',
          s3Bucket: 'tattoo-directory-images'
        },
        paths: {
          imageSource: 'tests/Test_Data/ImageSet',
          testData: 'scripts/test-data'
        },
        scenarios: {
          minimal: { description: 'Minimal dataset' },
          'search-basic': { description: 'Basic search' }
        },
        resetStates: {
          clean: { description: 'Clean state' },
          fresh: { description: 'Fresh state' }
        }
      };

      // Mock the DATA_CONFIG import
      jest.doMock('../../data-config', () => ({ DATA_CONFIG: mockConfig }));

      const validationResults = await comparisonValidator.runComprehensiveValidation();
      
      expect(validationResults.tests.length).toBeGreaterThan(0);
      expect(validationResults.passed).toBeGreaterThan(0);
    });
  });

  describe('Migration Error Handling', () => {
    test('should handle migration failures gracefully', async () => {
      // Simulate service failure
      mockManager.healthCheck.mockRejectedValue(new Error('Service unavailable'));
      
      const migrationResults = await migrationUtility.testMigration(['health-check']);
      
      expect(migrationResults.failed.length).toBe(1);
      expect(migrationResults.failed[0].operation).toBe('health-check');
      expect(migrationResults.failed[0].reason).toBe('Operation failed');
    });

    test('should provide helpful error messages for common issues', async () => {
      // Test unknown scenario error
      mockManager.seedScenario.mockRejectedValue(new Error('Unknown scenario: invalid-scenario'));
      
      try {
        await compatLayer.legacySelectiveSeeder('invalid-scenario');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Unknown scenario');
      }

      // Test unknown reset state error
      mockManager.resetData.mockRejectedValue(new Error('Unknown reset state: invalid-state'));
      
      try {
        await compatLayer.legacyDataManagement('reset', { state: 'invalid-state' });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Unknown reset state');
      }
    });
  });

  describe('Migration Reporting', () => {
    test('should generate comprehensive migration reports', () => {
      // Mock file system for report generation
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('output')) return false;
        return path.includes('seed.js') || path.includes('package.json');
      });
      
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      // Generate migration report
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      compatLayer.generateMigrationReport();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MIGRATION ANALYSIS REPORT')
      );
      
      consoleSpy.mockRestore();
    });

    test('should create detailed validation reports', () => {
      // Add test results to validator
      comparisonValidator.comparisonResults.tests = [
        { name: 'Test 1', status: 'passed', details: { info: 'success' } },
        { name: 'Test 2', status: 'failed', error: 'Test failed' },
        { name: 'Test 3', status: 'warning', warning: 'Minor issue' }
      ];
      comparisonValidator.comparisonResults.passed = 1;
      comparisonValidator.comparisonResults.failed = 1;
      comparisonValidator.comparisonResults.warnings = 1;

      // Mock file system for report generation
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      const report = comparisonValidator.generateDetailedReport();
      
      expect(report.summary.total).toBe(3);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.summary.warnings).toBe(1);
      expect(report.summary.successRate).toBe(33.33333333333333);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Checklist Validation', () => {
    test('should validate all checklist items can be completed', () => {
      const checklist = migrationUtility.createMigrationChecklist();
      
      // Verify checklist completeness
      expect(checklist.length).toBeGreaterThan(10);
      expect(checklist.every(item => item.startsWith('□'))).toBe(true);
      
      // Verify key migration steps are included
      const checklistText = checklist.join(' ');
      expect(checklistText).toContain('Backup existing scripts');
      expect(checklistText).toContain('Run migration readiness analysis');
      expect(checklistText).toContain('Test new system');
      expect(checklistText).toContain('Update package.json');
      expect(checklistText).toContain('Update Docker configurations');
      expect(checklistText).toContain('Run final validation');
      expect(checklistText).toContain('Archive or remove legacy scripts');
    });
  });

  describe('Docker Integration During Migration', () => {
    test('should maintain Docker compatibility throughout migration', async () => {
      // Test Docker environment detection
      process.env.DOCKER_CONTAINER = 'true';
      
      const dockerCompatLayer = new BackwardCompatibilityLayer();
      
      // Test that Docker-aware operations work
      const result = await dockerCompatLayer.legacySeed();
      expect(result.success).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalled();
      
      // Clean up
      delete process.env.DOCKER_CONTAINER;
    });
  });

  describe('Performance During Migration', () => {
    test('should maintain acceptable performance during migration period', async () => {
      const startTime = Date.now();
      
      // Run multiple operations to simulate migration workload
      await Promise.all([
        compatLayer.legacySeed(),
        compatLayer.legacyHealthCheck(),
        compatLayer.legacyValidation(),
        migrationUtility.validateConfigurationLoading(),
        migrationUtility.validateServiceConnectivity()
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds for mocked operations)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Migration State Management', () => {
    test('should track migration progress correctly', async () => {
      // Test migration state tracking
      const operations = ['setup-data', 'health-check', 'validate-data'];
      const results = await migrationUtility.testMigration(operations);
      
      expect(results.tested).toEqual(operations);
      expect(results.passed.length + results.failed.length).toBe(operations.length);
      
      // Verify all operations were attempted
      operations.forEach(op => {
        expect(results.tested).toContain(op);
      });
    });
  });

  describe('Rollback Capabilities', () => {
    test('should support rollback to legacy system if needed', () => {
      // Test that legacy scripts can still be detected and used
      fs.existsSync.mockImplementation((path) => {
        return path.includes('seed.js') || path.includes('selective-seeder.js');
      });

      const legacyScripts = migrationUtility.findLegacyScripts();
      
      expect(legacyScripts.found.length).toBeGreaterThan(0);
      
      // Test that backward compatibility layer provides guidance
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      compatLayer.checkLegacyScript('scripts/data-seeder/seed.js');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Legacy script found')
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Migration System Integration', () => {
  test('should integrate all migration components seamlessly', async () => {
    // This test verifies that all migration components work together
    const compatLayer = new BackwardCompatibilityLayer();
    const migrationUtility = new MigrationUtility();
    const comparisonValidator = new ComparisonValidator();
    
    // Verify all components are properly instantiated
    expect(compatLayer).toBeInstanceOf(BackwardCompatibilityLayer);
    expect(migrationUtility).toBeInstanceOf(MigrationUtility);
    expect(comparisonValidator).toBeInstanceOf(ComparisonValidator);
    
    // Verify they all use the same underlying manager (mocked)
    expect(compatLayer.manager).toBeDefined();
    expect(migrationUtility.newManager).toBeDefined();
    expect(comparisonValidator.newManager).toBeDefined();
  });
});