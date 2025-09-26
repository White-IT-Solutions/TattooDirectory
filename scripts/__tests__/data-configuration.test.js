const { DataConfiguration, DATA_CONFIG, SCENARIOS, RESET_STATES } = require('../data-config');

describe('DataConfiguration', () => {
  let config;

  beforeEach(() => {
    config = new DataConfiguration();
  });

  test('should create instance with all required properties', () => {
    expect(config).toBeDefined();
    expect(config.environment).toBeDefined();
    expect(config.paths).toBeDefined();
    expect(config.services).toBeDefined();
    expect(config.scenarios).toBeDefined();
    expect(config.resetStates).toBeDefined();
    expect(config.validation).toBeDefined();
  });

  test('should have correct environment detection', () => {
    expect(config.environment.platform).toBeDefined();
    expect(typeof config.environment.isWindows).toBe('boolean');
    expect(typeof config.environment.isLinux).toBe('boolean');
    expect(typeof config.environment.isMacOS).toBe('boolean');
    expect(typeof config.environment.isDocker).toBe('boolean');
    expect(typeof config.environment.isCI).toBe('boolean');
    expect(config.environment.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test('should have all required paths defined', () => {
    const requiredPaths = [
      'projectRoot', 'scriptsDir', 'testsDir', 'frontendDir', 'backendDir',
      'testDataDir', 'imageSourceDir', 'frontendMockData', 'stateTrackingDir'
    ];
    
    requiredPaths.forEach(pathKey => {
      expect(config.paths[pathKey]).toBeDefined();
      expect(typeof config.paths[pathKey]).toBe('string');
    });
  });

  test('should have LocalStack configuration', () => {
    expect(config.services.localstack).toBeDefined();
    expect(config.services.localstack.endpoint).toMatch(/^http:\/\//);
    expect(config.services.localstack.host).toBeDefined();
    expect(config.services.localstack.port).toBeDefined();
  });

  test('should have AWS service configurations', () => {
    expect(config.services.aws).toBeDefined();
    expect(config.services.dynamodb).toBeDefined();
    expect(config.services.opensearch).toBeDefined();
    expect(config.services.s3).toBeDefined();
  });

  test('should get scenario configuration', () => {
    const minimalConfig = config.getScenarioConfig('minimal');
    expect(minimalConfig).toBeDefined();
    expect(minimalConfig.artistCount).toBe(3);
    expect(minimalConfig.description).toContain('minimal');
  });

  test('should validate configuration', () => {
    const validation = config.validate();
    expect(validation).toBeDefined();
    expect(typeof validation.isValid).toBe('boolean');
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);
  });
});

describe('Module Exports', () => {
  test('should export DATA_CONFIG instance', () => {
    expect(DATA_CONFIG).toBeDefined();
    expect(DATA_CONFIG).toBeInstanceOf(DataConfiguration);
  });

  test('should export SCENARIOS constant', () => {
    expect(SCENARIOS).toBeDefined();
    expect(typeof SCENARIOS).toBe('object');
    expect(SCENARIOS.minimal).toBeDefined();
  });

  test('should export RESET_STATES constant', () => {
    expect(RESET_STATES).toBeDefined();
    expect(typeof RESET_STATES).toBe('object');
    expect(RESET_STATES.clean).toBeDefined();
  });
});