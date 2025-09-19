/**
 * Migration Utility Tests
 * 
 * Tests the migration utility to ensure it properly analyzes projects
 * and provides accurate migration guidance.
 */

const { MigrationUtility } = require('../migration-utility');
const { UnifiedDataManager } = require('../unified-data-manager');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../unified-data-manager');
jest.mock('fs');

describe('MigrationUtility', () => {
  let migrationUtility;
  let mockManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock manager
    mockManager = {
      setupData: jest.fn().mockResolvedValue({ success: true }),
      seedScenario: jest.fn().mockResolvedValue({ success: true }),
      resetData: jest.fn().mockResolvedValue({ success: true }),
      validateData: jest.fn().mockResolvedValue({ success: true }),
      healthCheck: jest.fn().mockResolvedValue({ success: true }),
      getDataStatus: jest.fn().mockResolvedValue({ success: true })
    };
    
    // Mock the constructor
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    migrationUtility = new MigrationUtility();
  });

  describe('Legacy Script Detection', () => {
    test('should find existing legacy scripts', () => {
      // Mock fs.existsSync to return true for some scripts
      fs.existsSync.mockImplementation((path) => {
        return path.includes('seed.js') || path.includes('selective-seeder.js');
      });
      
      // Mock fs.statSync for file stats
      fs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2024-01-01')
      });

      const legacyScripts = migrationUtility.findLegacyScripts();
      
      expect(legacyScripts.found.length).toBeGreaterThan(0);
      expect(legacyScripts.found[0]).toHaveProperty('path');
      expect(legacyScripts.found[0]).toHaveProperty('size');
      expect(legacyScripts.found[0]).toHaveProperty('type');
    });

    test('should handle missing legacy scripts', () => {
      // Mock fs.existsSync to return false for all scripts
      fs.existsSync.mockReturnValue(false);

      const legacyScripts = migrationUtility.findLegacyScripts();
      
      expect(legacyScripts.found.length).toBe(0);
      expect(legacyScripts.missing.length).toBeGreaterThan(0);
    });

    test('should classify script types correctly', () => {
      const testCases = [
        { path: 'scripts/data-seeder/seed.js', expected: 'seeding' },
        { path: 'scripts/data-seeder/selective-seeder.js', expected: 'scenario-seeding' },
        { path: 'scripts/data-seeder/health-check.js', expected: 'health-monitoring' },
        { path: 'scripts/data-seeder/validate-data.js', expected: 'validation' },
        { path: 'scripts/data-management/data-management.sh', expected: 'management' }
      ];

      testCases.forEach(({ path, expected }) => {
        const result = migrationUtility.classifyScript(path);
        expect(result).toBe(expected);
      });
    });
  });

  describe('npm Scripts Analysis', () => {
    test('should analyze package.json scripts correctly', () => {
      // Mock fs.readFileSync for package.json
      const mockPackageJson = {
        scripts: {
          'setup-data': 'node scripts/data-cli.js setup-data',
          'reset-data': 'node scripts/data-cli.js reset-data',
          'seed-scenario': 'node scripts/data-cli.js seed-scenario',
          'data:seed': 'legacy command',
          'data:reset': 'legacy command',
          'build': 'npm run build --workspaces'
        }
      };
      
      fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

      const analysis = migrationUtility.analyzeNpmScripts();
      
      expect(analysis.hasNewSystem).toBe(true);
      expect(analysis.hasLegacy).toBe(true);
      expect(analysis.newSystem.length).toBe(3);
      expect(analysis.legacy.length).toBe(2);
    });

    test('should handle missing package.json', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const analysis = migrationUtility.analyzeNpmScripts();
      
      expect(analysis.error).toBeDefined();
    });
  });

  describe('Docker Integration Analysis', () => {
    test('should detect Docker files', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('docker-compose') || path.includes('Dockerfile');
      });

      const analysis = migrationUtility.analyzeDockerIntegration();
      
      expect(analysis.hasDocker).toBe(true);
      expect(analysis.files.length).toBeGreaterThan(0);
      expect(analysis.needsUpdate).toBe(true);
    });

    test('should handle projects without Docker', () => {
      fs.existsSync.mockReturnValue(false);

      const analysis = migrationUtility.analyzeDockerIntegration();
      
      expect(analysis.hasDocker).toBe(false);
      expect(analysis.files.length).toBe(0);
    });
  });

  describe('Migration Testing', () => {
    test('should test migration operations successfully', async () => {
      const operations = ['setup-data', 'health-check'];
      
      const results = await migrationUtility.testMigration(operations);
      
      expect(results.tested.length).toBe(2);
      expect(results.passed.length).toBe(2);
      expect(results.failed.length).toBe(0);
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });

    test('should handle migration test failures', async () => {
      mockManager.healthCheck.mockRejectedValue(new Error('Health check failed'));
      
      const operations = ['health-check'];
      
      const results = await migrationUtility.testMigration(operations);
      
      expect(results.tested.length).toBe(1);
      expect(results.passed.length).toBe(0);
      expect(results.failed.length).toBe(1);
      expect(results.failed[0].operation).toBe('health-check');
    });

    test('should use default operations when none specified', async () => {
      const results = await migrationUtility.testMigration();
      
      expect(results.tested.length).toBe(3); // Default operations: setup-data, health-check, validate-data
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Comparison Operations', () => {
    test('should compare operation results', async () => {
      const result = await migrationUtility.compareOperationResults('health-check');
      
      expect(result.success).toBe(true);
      expect(result.newResult).toBeDefined();
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });

    test('should handle unknown operations', async () => {
      const result = await migrationUtility.compareOperationResults('unknown-operation');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Unknown operation');
    });

    test('should handle operation failures', async () => {
      mockManager.validateData.mockRejectedValue(new Error('Validation failed'));
      
      const result = await migrationUtility.compareOperationResults('validate-data');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Operation failed');
      expect(result.details).toBe('Validation failed');
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate recommendations based on analysis', () => {
      const analysis = {
        legacyScripts: { found: [{ path: 'test.js' }], missing: [] },
        npmScripts: { hasLegacy: true, hasNewSystem: false },
        dockerIntegration: { hasDocker: true },
        dependencies: { hasWorkspaces: true, hasScriptsWorkspace: false }
      };

      const recommendations = migrationUtility.generateRecommendations(analysis);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.type === 'action')).toBe(true);
    });

    test('should handle projects with no issues', () => {
      const analysis = {
        legacyScripts: { found: [], missing: [] },
        npmScripts: { hasLegacy: false, hasNewSystem: true },
        dockerIntegration: { hasDocker: false },
        dependencies: { hasWorkspaces: true, hasScriptsWorkspace: true }
      };

      const recommendations = migrationUtility.generateRecommendations(analysis);
      
      expect(recommendations.length).toBe(0);
    });
  });

  describe('Migration Plan Generation', () => {
    test('should generate comprehensive migration plan', () => {
      const analysis = {
        legacyScripts: { found: [{ path: 'test.js' }] },
        npmScripts: { hasLegacy: true },
        dockerIntegration: { hasDocker: true },
        dependencies: { hasWorkspaces: true }
      };

      const plan = migrationUtility.generateMigrationPlan(analysis);
      
      expect(plan.phases.length).toBe(4);
      expect(plan.estimatedTime).toBeDefined();
      expect(plan.riskLevel).toBeDefined();
      expect(plan.phases[0].title).toBe('Preparation');
    });
  });

  describe('Functionality Preservation Validation', () => {
    test('should validate configuration loading', async () => {
      const result = await migrationUtility.validateConfigurationLoading();
      
      expect(result.configLoaded).toBe(true);
      expect(result.services).toBeGreaterThan(0);
    });

    test('should validate service connectivity', async () => {
      const result = await migrationUtility.validateServiceConnectivity();
      
      expect(result.connectivity).toBe('verified');
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });

    test('should validate command interface', async () => {
      const result = await migrationUtility.validateCommandInterface();
      
      expect(result.interfaceValid).toBe(true);
      expect(result.methods).toBe(6); // Number of required methods
    });

    test('should validate error handling', async () => {
      mockManager.seedScenario.mockRejectedValue(new Error('Unknown scenario: invalid-scenario-name'));
      
      const result = await migrationUtility.validateErrorHandling();
      
      expect(result.errorHandling).toBe('working');
      expect(result.errorMessage).toContain('invalid-scenario-name');
    });

    test('should validate Docker compatibility', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('docker-compatibility.js');
      });
      
      const result = await migrationUtility.validateDockerCompatibility();
      
      expect(result.dockerCompatibility).toBe('available');
    });
  });

  describe('Migration Checklist', () => {
    test('should create comprehensive migration checklist', () => {
      const checklist = migrationUtility.createMigrationChecklist();
      
      expect(Array.isArray(checklist)).toBe(true);
      expect(checklist.length).toBeGreaterThan(10);
      expect(checklist.every(item => item.startsWith('□'))).toBe(true);
    });
  });

  describe('Full Migration Analysis', () => {
    test('should run complete migration readiness analysis', async () => {
      // Mock file system for comprehensive test
      fs.existsSync.mockImplementation((path) => {
        return path.includes('seed.js') || path.includes('docker-compose');
      });
      
      fs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2024-01-01')
      });
      
      fs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {
          'setup-data': 'node scripts/data-cli.js setup-data',
          'data:seed': 'legacy command'
        },
        workspaces: ['scripts']
      }));

      const analysis = await migrationUtility.analyzeMigrationReadiness();
      
      expect(analysis.legacyScripts).toBeDefined();
      expect(analysis.npmScripts).toBeDefined();
      expect(analysis.dockerIntegration).toBeDefined();
      expect(analysis.dependencies).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });
  });
});