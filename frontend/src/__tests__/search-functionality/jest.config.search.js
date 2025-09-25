/**
 * Jest Configuration for Search Functionality Tests
 * 
 * This configuration extends the main Jest config with specific settings
 * for comprehensive search functionality testing.
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const searchTestConfig = {
  // Extend the main Jest configuration
  displayName: 'Search Functionality Tests',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/search-functionality/**/*.test.{js,jsx}',
    '<rootDir>/src/lib/__tests__/search-controller.test.js',
    '<rootDir>/src/app/studios/__tests__/StudiosStyleFiltering.test.jsx',
    '<rootDir>/src/design-system/components/navigation/__tests__/NavigationEnhancement.test.jsx'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/search-functionality/setup.js'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/design-system/(.*)$': '<rootDir>/src/design-system/$1',
    '^@/components/(.*)$': '<rootDir>/src/app/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/data/(.*)$': '<rootDir>/src/app/data/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    // Search-related components
    'src/app/components/EnhancedStyleFilter.jsx',
    'src/app/components/SearchResultsDisplay.jsx',
    'src/app/components/AdvancedSearchInterface.jsx',
    'src/app/components/SearchFeedbackSystem.jsx',
    'src/app/components/SearchLoadingStates.jsx',
    'src/app/components/SearchResultsContainer.jsx',
    
    // Search controller and utilities
    'src/lib/search-controller.js',
    'src/lib/useSearchController.js',
    
    // Page components with search functionality
    'src/app/artists/page.jsx',
    'src/app/artists/EnhancedArtistsPage.jsx',
    'src/app/studios/page.js',
    'src/app/styles/page.js',
    'src/app/styles/StylesPage.jsx',
    
    // Standardized data model
    'src/app/data/testdata/enhancedtattoostyles.js',
    
    // Design system search components
    'src/design-system/components/ui/StudioSearch/**/*.{js,jsx}',
    'src/design-system/components/navigation/**/*.{js,jsx}',
    
    // Exclude test files and config
    '!**/*.test.{js,jsx}',
    '!**/*.config.{js,jsx}',
    '!**/*.stories.{js,jsx}',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  
  // Coverage thresholds based on requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical search components
    'src/lib/search-controller.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/app/components/EnhancedStyleFilter.jsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/app/data/testdata/enhancedtattoostyles.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage reporting
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/search-functionality',
  
  // Test timeout for performance tests
  testTimeout: 30000,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Global test variables
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.NEXT_PUBLIC_API_URL': 'http://localhost:3001'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Test result processors
  testResultsProcessor: '<rootDir>/src/__tests__/search-functionality/testResultsProcessor.js',
  
  // Custom reporters
  reporters: [
    'default',
    ['<rootDir>/src/__tests__/search-functionality/customReporter.js', {
      outputFile: 'coverage/search-functionality/test-results.json'
    }]
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/'
  ],
  
  // Snapshot configuration
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Mock configuration
  modulePathIgnorePatterns: [
    '<rootDir>/.next/'
  ],
  
  // Test sequencer for optimal test order
  testSequencer: '<rootDir>/src/__tests__/search-functionality/testSequencer.js'
};

// Export the configuration
module.exports = createJestConfig(searchTestConfig);