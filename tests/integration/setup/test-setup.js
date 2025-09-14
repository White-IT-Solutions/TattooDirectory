import { initializeTestEnvironment, cleanupTestEnvironment } from './test-environment.js';

/**
 * Mocha hooks for setting up and tearing down the test environment.
 * This file is loaded via the --require flag in .mocharc.json.
 */
export const mochaHooks = {
  /**
   * Runs once before all tests in the suite.
   * This is the ideal place for global setup, like starting servers or seeding databases.
   */
  async beforeAll() {
    this.timeout(300000); // Set a longer timeout for setup (5 minutes)
    console.log('Setting up the integration test environment...');
    await initializeTestEnvironment();
    console.log('Test environment setup complete.');
  },

  /**
   * Runs once after all tests in the suite have finished.
   * This is used for global cleanup.
   */
  async afterAll() {
    this.timeout(30000); // Set a longer timeout for cleanup
    console.log('Cleaning up the integration test environment...');
    await cleanupTestEnvironment();
    console.log('Test environment cleanup complete.');
  }
};