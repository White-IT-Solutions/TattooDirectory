module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!coverage/**',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000, // Reduced from 30000 to 10000
  // Add cleanup configuration
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  // Detect open handles to help identify leaks
  detectOpenHandles: true,
  // Force exit after tests complete
  forceExit: true
};