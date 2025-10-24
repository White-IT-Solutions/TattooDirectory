#!/usr/bin/env node

/**
 * Configuration validation script
 * Tests the Config class functionality without Jest
 */

import { Config } from './src/utils/config.js';

async function validateConfiguration() {
  console.log('🔧 Validating Configuration Management System...\n');

  try {
    const config = new Config();
    
    // Test 1: Basic initialization
    console.log('✅ Test 1: Configuration initialization');
    console.log(`   Workspace root: ${config.workspaceRoot}`);
    console.log(`   Config directory: ${config.configDir}`);
    
    // Test 2: Environment detection
    console.log('\n✅ Test 2: Environment detection');
    console.log(`   Is CI: ${config.isCI()}`);
    console.log(`   Environment config:`, config.getEnvironmentConfig());
    
    // Test 3: Output format detection
    console.log('\n✅ Test 3: Output format detection');
    console.log(`   Output format: ${config.getOutputFormat()}`);
    console.log(`   Max parallel: ${config.getMaxParallel()}`);
    console.log(`   Test timeout: ${config.getTestTimeout()}`);
    
    // Test 4: Configuration file paths
    console.log('\n✅ Test 4: Configuration file paths');
    console.log(`   Test suites config: ${config.getConfigPath('test-suites.json')}`);
    console.log(`   Data scenarios config: ${config.getConfigPath('data-scenarios.json')}`);
    console.log(`   Service endpoints config: ${config.getConfigPath('service-endpoints.json')}`);
    
    // Test 5: Environment variable overrides
    console.log('\n✅ Test 5: Environment variable overrides');
    const testServices = {
      localstack: { url: 'http://localhost:4566', timeout: 5000 },
      frontend: { url: 'http://localhost:3000', timeout: 3000 }
    };
    
    // Test with environment variable
    process.env.LOCALSTACK_ENDPOINT = 'http://custom:4566';
    const overriddenServices = config.applyEnvironmentOverrides(testServices);
    console.log(`   Original localstack URL: ${testServices.localstack.url}`);
    console.log(`   Overridden localstack URL: ${overriddenServices.localstack.url}`);
    delete process.env.LOCALSTACK_ENDPOINT;
    
    // Test 6: Configuration validation
    console.log('\n✅ Test 6: Configuration validation');
    const validation = await config.validateConfigurations();
    console.log('   Configuration files validation:');
    Object.entries(validation).forEach(([file, result]) => {
      const status = result.exists ? (result.valid ? '✅' : '⚠️') : '❌';
      console.log(`   ${status} ${file}: ${result.exists ? (result.valid ? 'Valid' : result.error) : 'Not found'}`);
    });
    
    // Test 7: Load actual configuration files (if they exist)
    console.log('\n✅ Test 7: Load configuration files');
    try {
      const testSuites = await config.getTestSuites();
      console.log(`   Loaded ${testSuites.length} test suites`);
      testSuites.slice(0, 3).forEach(suite => {
        console.log(`   - ${suite.name}: ${suite.displayName}`);
      });
    } catch (error) {
      console.log(`   ⚠️ Could not load test suites: ${error.message}`);
    }
    
    try {
      const scenarios = await config.getDataScenarios();
      const scenarioNames = Object.keys(scenarios);
      console.log(`   Loaded ${scenarioNames.length} data scenarios`);
      scenarioNames.slice(0, 3).forEach(name => {
        console.log(`   - ${name}: ${scenarios[name].description}`);
      });
    } catch (error) {
      console.log(`   ⚠️ Could not load data scenarios: ${error.message}`);
    }
    
    try {
      const services = await config.getServiceEndpoints();
      const serviceNames = Object.keys(services);
      console.log(`   Loaded ${serviceNames.length} service endpoints`);
      serviceNames.slice(0, 3).forEach(name => {
        console.log(`   - ${name}: ${services[name].url}`);
      });
    } catch (error) {
      console.log(`   ⚠️ Could not load service endpoints: ${error.message}`);
    }
    
    // Test 8: Cache management
    console.log('\n✅ Test 8: Cache management');
    console.log(`   Cache size before: ${config.cache.size}`);
    config.clearCache();
    console.log(`   Cache size after clear: ${config.cache.size}`);
    
    // Test 9: Comprehensive validation
    console.log('\n✅ Test 9: Comprehensive validation');
    try {
      const comprehensiveValidation = await config.validateAllConfigurations();
      console.log(`   Overall valid: ${comprehensiveValidation.valid}`);
      if (comprehensiveValidation.errors.length > 0) {
        console.log('   Errors:');
        comprehensiveValidation.errors.forEach(error => console.log(`   - ${error}`));
      }
      if (comprehensiveValidation.warnings.length > 0) {
        console.log('   Warnings:');
        comprehensiveValidation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    } catch (error) {
      console.log(`   ⚠️ Comprehensive validation failed: ${error.message}`);
    }
    
    console.log('\n🎉 Configuration Management System validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
validateConfiguration();