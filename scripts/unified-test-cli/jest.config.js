/**
 * Jest configuration for ES modules support
 */

const config = {
  testEnvironment: 'node',
  preset: null,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer|ansi-styles|strip-ansi|string-width|wrap-ansi|cli-cursor|cli-spinners|log-symbols|figures|escape-string-regexp|is-unicode-supported|yoctocolors-cjs|#ansi-styles|@aws-sdk)/)'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleFileExtensions: ['js', 'json'],
  verbose: true
};

export default config;