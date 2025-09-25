# Search Functionality Test Suite - API Reference

## 📚 Table of Contents

1. [Test Runner API](#test-runner-api)
2. [Test Utilities API](#test-utilities-api)
3. [Mock Implementations](#mock-implementations)
4. [Configuration API](#configuration-api)
5. [Reporter API](#reporter-api)
6. [Test Sequencer API](#test-sequencer-api)
7. [Results Processor API](#results-processor-api)

## 🚀 Test Runner API

### `runSearchTests.js`

The main test runner orchestrates the entire test suite execution.

#### Functions

##### `main()`
Executes the complete test suite with comprehensive reporting.

```javascript
function main()
```

**Returns**: `void`  
**Exit Codes**: 
- `0` - All tests passed
- `1` - Some tests failed

**Example**:
```bash
node runSearchTests.js
```

##### `runTestSuite(testSuite, options)`
Executes a single test suite with specified options.

```javascript
function runTestSuite(testSuite, options = {})
```

**Parameters**:
- `testSuite` (Object): Test suite configuration
  - `name` (string): Display name for the test suite
  - `pattern` (string): File pattern to match test files
  - `description` (string): Description of what the suite tests
- `options` (Object): Execution options
  - `coverage` (boolean): Enable coverage reporting
  - `maxWorkers` (number): Maximum worker processes
  - `testTimeout` (number): Test timeout in milliseconds
  - `bail` (boolean): Stop on first failure

**Returns**: `Object`
```javascript
{
  success: boolean,
  output?: string,
  error?: string,
  testSuite: Object
}
```

**Example**:
```javascript
const result = runTestSuite({
  name: 'Core Search Tests',
  pattern: 'SearchFunctionality.test.jsx',
  description: 'Core search functionality validation'
}, {
  coverage: true,
  maxWorkers: 4,
  testTimeout: 30000
});
```

##### `checkTestFiles()`
Validates that all required test files exist.

```javascript
function checkTestFiles()
```

**Returns**: `Object`
```javascript
{
  existingFiles: Array<TestSuite>,
  missingFiles: Array<TestSuite>
}
```

##### `generateTestReport(results)`
Generates a comprehensive test execution report.

```javascript
function generateTestReport(results)
```

**Parameters**:
- `results` (Array): Array of test suite results

**Returns**: `Object`
```javascript
{
  passed: number,
  failed: number,
  successRate: number
}
```

#### Configuration Constants

```javascript
const TEST_CONFIG = {
  testTimeout: 30000,
  maxWorkers: 4,
  coverage: true,
  verbose: true,
  bail: false
};

const TEST_SUITES = [
  {
    name: 'Search Functionality Core Tests',
    pattern: 'src/__tests__/search-functionality/SearchFunctionality.test.jsx',
    description: 'Core search functionality, standardized style model, and search controller tests'
  }
  // ... additional suites
];
```

## 🛠️ Test Utilities API

### `setup.js`

Provides comprehensive test utilities and mock implementations.

#### Utility Functions

##### `searchTestUtils.createMockArtists(count)`
Creates mock artist data for testing.

```javascript
searchTestUtils.createMockArtists(count = 5)
```

**Parameters**:
- `count` (number): Number of mock artists to create

**Returns**: `Array<Artist>`
```javascript
[
  {
    id: string,
    name: string,
    styles: Array<string>,
    location: { city: string },
    rating: number,
    portfolioImages: Array<string>,
    contactMethods: Array<string>
  }
]
```

**Example**:
```javascript
const mockArtists = searchTestUtils.createMockArtists(10);
expect(mockArtists).toHaveLength(10);
expect(mockArtists[0]).toHaveProperty('id');
```

##### `searchTestUtils.createMockStudios(count)`
Creates mock studio data for testing.

```javascript
searchTestUtils.createMockStudios(count = 5)
```

**Parameters**:
- `count` (number): Number of mock studios to create

**Returns**: `Array<Studio>`
```javascript
[
  {
    id: string,
    name: string,
    specialties: Array<string>,
    location: { city: string },
    rating: number,
    artists: Array<string>
  }
]
```

##### `searchTestUtils.mockApiSuccess(data)`
Mocks a successful API response.

```javascript
searchTestUtils.mockApiSuccess(data)
```

**Parameters**:
- `data` (Object): Response data to return

**Example**:
```javascript
searchTestUtils.mockApiSuccess({
  artists: mockArtists,
  totalCount: mockArtists.length
});
```

##### `searchTestUtils.mockApiError(error)`
Mocks an API error response.

```javascript
searchTestUtils.mockApiError(error = 'API Error')
```

**Parameters**:
- `error` (string): Error message

##### `searchTestUtils.measurePerformance(fn)`
Measures the execution time of a function.

```javascript
searchTestUtils.measurePerformance(fn)
```

**Parameters**:
- `fn` (Function): Function to measure

**Returns**: `Object`
```javascript
{
  result: any,
  duration: number
}
```

**Example**:
```javascript
const { result, duration } = searchTestUtils.measurePerformance(() => {
  return expensiveOperation();
});
expect(duration).toBeLessThan(100);
```

##### `searchTestUtils.simulateKeyboardNavigation(user, element, key)`
Simulates keyboard navigation for accessibility testing.

```javascript
async searchTestUtils.simulateKeyboardNavigation(user, element, key = 'Tab')
```

**Parameters**:
- `user` (UserEvent): Testing Library user event instance
- `element` (HTMLElement): Starting element
- `key` (string): Key to simulate

**Returns**: `Promise<HTMLElement>` - The focused element after navigation

##### `searchTestUtils.validateStyleStructure(style)`
Validates that a style object has the required structure.

```javascript
searchTestUtils.validateStyleStructure(style)
```

**Parameters**:
- `style` (Object): Style object to validate

**Returns**: `boolean` - True if structure is valid

#### Configuration Objects

##### `testConfig`
Global test configuration constants.

```javascript
const testConfig = {
  performanceThresholds: {
    componentRender: 50,    // ms
    searchResponse: 300,    // ms
    userInteraction: 100    // ms
  },
  accessibilityStandards: {
    contrastRatio: 4.5,
    touchTargetSize: 44,    // px
    focusIndicatorSize: 2   // px
  },
  searchDefaults: {
    debounceDelay: 300,     // ms
    resultsPerPage: 20,
    maxCacheSize: 100
  }
};
```

## 🎭 Mock Implementations

### Browser API Mocks

#### `localStorage` Mock
```javascript
const localStorageMock = {
  getItem: jest.fn((key) => { /* implementation */ }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
```

#### `fetch` Mock
```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      artists: [],
      studios: [],
      totalCount: 0
    }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    url: 'http://localhost:3001/api/test'
  })
);
```

#### `IntersectionObserver` Mock
```javascript
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  
  observe() {
    // Immediately trigger callback for testing
    this.callback([{
      isIntersecting: true,
      target: document.createElement('div'),
      intersectionRatio: 1,
      // ... additional properties
    }]);
  }
  
  unobserve() {}
  disconnect() {}
};
```

### Next.js Component Mocks

#### Image Component Mock
```javascript
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});
```

#### Navigation Hooks Mock
```javascript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));
```

## ⚙️ Configuration API

### `jest.config.search.js`

#### Configuration Object
```javascript
const searchTestConfig = {
  displayName: 'Search Functionality Tests',
  testEnvironment: 'jsdom',
  testMatch: Array<string>,
  setupFilesAfterEnv: Array<string>,
  moduleNameMapping: Object,
  collectCoverageFrom: Array<string>,
  coverageThreshold: Object,
  coverageReporters: Array<string>,
  testTimeout: number,
  verbose: boolean
};
```

#### Coverage Configuration
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  'src/lib/search-controller.js': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

## 📊 Reporter API

### `customReporter.js`

#### Class: `SearchFunctionalityReporter`

##### Constructor
```javascript
constructor(globalConfig, options)
```

**Parameters**:
- `globalConfig` (Object): Jest global configuration
- `options` (Object): Reporter options
  - `outputFile` (string): Output file path for results

##### Methods

##### `onRunStart(results, options)`
Called when test run begins.

```javascript
onRunStart(results, options)
```

##### `onTestSuiteStart(test)`
Called when a test suite begins execution.

```javascript
onTestSuiteStart(test)
```

**Parameters**:
- `test` (Object): Test suite information

##### `onTestResult(test, testResult)`
Called when an individual test completes.

```javascript
onTestResult(test, testResult)
```

**Parameters**:
- `test` (Object): Test information
- `testResult` (Object): Test execution result

##### `onRunComplete(contexts, results)`
Called when all tests complete.

```javascript
onRunComplete(contexts, results)
```

**Parameters**:
- `contexts` (Array): Test contexts
- `results` (Object): Complete test results

##### `analyzeRequirements()`
Maps test results to specification requirements.

```javascript
analyzeRequirements()
```

**Returns**: `void` - Updates internal requirements tracking

##### `generateRecommendations()`
Generates improvement recommendations based on test results.

```javascript
generateRecommendations()
```

**Returns**: `Array<Recommendation>`
```javascript
[
  {
    type: 'performance' | 'coverage' | 'quality' | 'missing',
    message: string
  }
]
```

## 🔄 Test Sequencer API

### `testSequencer.js`

#### Class: `SearchFunctionalityTestSequencer`

##### Methods

##### `sort(tests)`
Sorts tests in optimal execution order.

```javascript
sort(tests)
```

**Parameters**:
- `tests` (Array): Array of test objects

**Returns**: `Array` - Sorted test array

##### `getTestPriority(testPath, priorities)`
Determines test execution priority.

```javascript
getTestPriority(testPath, priorities)
```

**Parameters**:
- `testPath` (string): Path to test file
- `priorities` (Object): Priority mapping object

**Returns**: `number` - Priority value (lower = higher priority)

##### `resolveDependencies(tests)`
Ensures tests run in dependency order.

```javascript
resolveDependencies(tests)
```

**Parameters**:
- `tests` (Array): Array of test objects

**Returns**: `Array` - Tests sorted by dependencies

##### `optimizeForResources(tests)`
Optimizes test order based on system resources.

```javascript
optimizeForResources(tests)
```

**Parameters**:
- `tests` (Array): Array of test objects

**Returns**: `Array` - Resource-optimized test order

## 📈 Results Processor API

### `testResultsProcessor.js`

#### Functions

##### `processTestResults(results)`
Main processor function that analyzes test results.

```javascript
function processTestResults(results)
```

**Parameters**:
- `results` (Object): Jest test results object

**Returns**: `Object` - Original results (for Jest compatibility)

##### `analyzeTestResults(results)`
Analyzes test results and generates insights.

```javascript
function analyzeTestResults(results)
```

**Parameters**:
- `results` (Object): Jest test results

**Returns**: `Object`
```javascript
{
  summary: {
    totalTests: number,
    passedTests: number,
    failedTests: number,
    skippedTests: number,
    totalTime: number
  },
  requirements: Object,
  performance: {
    slowTests: Array,
    fastTests: Array,
    averageTime: number
  },
  coverage: Object,
  issues: Array,
  recommendations: Array
}
```

##### `generateReport(analysis)`
Generates comprehensive test report.

```javascript
function generateReport(analysis)
```

**Parameters**:
- `analysis` (Object): Analysis results from `analyzeTestResults`

**Returns**: `Object`
```javascript
{
  timestamp: string,
  summary: Object,
  requirements: Object,
  performance: Object,
  issues: Array,
  recommendations: Array,
  healthScore: {
    overall: number,
    testPassRate: number,
    requirementCoverage: number,
    performanceScore: number
  }
}
```

##### `saveReport(report, outputPath)`
Saves report to file system.

```javascript
function saveReport(report, outputPath)
```

**Parameters**:
- `report` (Object): Report object from `generateReport`
- `outputPath` (string): File path for saving report

##### `generateTextSummary(report)`
Generates human-readable text summary.

```javascript
function generateTextSummary(report)
```

**Parameters**:
- `report` (Object): Report object

**Returns**: `string` - Formatted text summary

## 🔍 Usage Examples

### Running Specific Test Categories

```javascript
// Run only performance tests
const performanceTests = TEST_SUITES.filter(suite => 
  suite.name.includes('Performance')
);

performanceTests.forEach(suite => {
  const result = runTestSuite(suite, { 
    coverage: false, 
    maxWorkers: 1 
  });
  console.log(`${suite.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
});
```

### Custom Test Execution

```javascript
// Custom test runner with specific configuration
const customConfig = {
  testTimeout: 60000,
  maxWorkers: 2,
  coverage: true,
  verbose: true,
  bail: true
};

const results = [];
for (const suite of TEST_SUITES) {
  const result = runTestSuite(suite, customConfig);
  results.push(result);
  
  if (!result.success && customConfig.bail) {
    console.log('Stopping execution due to failure');
    break;
  }
}

const summary = generateTestReport(results);
console.log(`Overall success rate: ${summary.successRate}%`);
```

### Performance Monitoring

```javascript
// Monitor test performance over time
const performanceData = [];

TEST_SUITES.forEach(suite => {
  const startTime = performance.now();
  const result = runTestSuite(suite, { coverage: false });
  const endTime = performance.now();
  
  performanceData.push({
    suite: suite.name,
    duration: endTime - startTime,
    success: result.success
  });
});

// Identify performance regressions
const slowSuites = performanceData.filter(data => data.duration > 10000);
if (slowSuites.length > 0) {
  console.warn('Slow test suites detected:', slowSuites);
}
```

### Requirements Coverage Analysis

```javascript
// Analyze requirements coverage
const analysis = analyzeTestResults(jestResults);
const requirementsCoverage = Object.entries(analysis.requirements)
  .map(([reqId, req]) => ({
    id: reqId,
    name: req.name,
    coverage: req.tests.length > 0 ? (req.passed / req.tests.length) * 100 : 0,
    tests: req.tests.length
  }))
  .sort((a, b) => a.coverage - b.coverage);

console.log('Requirements Coverage (lowest first):');
requirementsCoverage.forEach(req => {
  const status = req.coverage >= 80 ? '✅' : req.coverage >= 50 ? '⚠️' : '❌';
  console.log(`${status} ${req.id}: ${req.name} (${req.coverage.toFixed(1)}%)`);
});
```

---

**API Reference Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatible With**: Jest 29+, Node.js 18+