# Search Functionality Test Suite - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Test Execution Issues

#### Tests Timing Out

**Symptoms**:
- Tests fail with timeout errors
- Jest reports "Exceeded timeout of X ms for a test"
- Tests hang indefinitely

**Solutions**:

1. **Increase Global Timeout**:
```bash
# Set environment variable
JEST_TIMEOUT=60000 node runSearchTests.js

# Or modify jest.config.search.js
testTimeout: 60000
```

2. **Use Fast Mode**:
```bash
node runSearchTests.js --fast
```

3. **Reduce Worker Count**:
```bash
npx jest --maxWorkers=1
```

4. **Check for Infinite Loops**:
```javascript
// Look for problematic async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 }); // Add explicit timeout
```

#### Memory Issues

**Symptoms**:
- "JavaScript heap out of memory" errors
- Tests become progressively slower
- System becomes unresponsive

**Solutions**:

1. **Increase Node.js Memory**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" node runSearchTests.js
```

2. **Clear Jest Cache**:
```bash
npx jest --clearCache
rm -rf node_modules/.cache
```

3. **Reduce Concurrent Tests**:
```bash
npx jest --maxWorkers=2 --runInBand
```

4. **Check for Memory Leaks**:
```javascript
// Ensure proper cleanup in tests
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear timers
  jest.clearAllTimers();
});
```

#### Mock Issues

**Symptoms**:
- "Cannot read property of undefined" errors
- Mocks not working as expected
- Tests pass in isolation but fail together

**Solutions**:

1. **Reset Mocks Between Tests**:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

2. **Check Mock Implementation**:
```javascript
// Verify mock is properly implemented
const mockApi = require('../../lib/api').api;
expect(mockApi.searchArtists).toHaveBeenCalledWith(expectedQuery);
```

3. **Clear Module Cache**:
```bash
npx jest --clearCache
```

4. **Debug Mock Setup**:
```javascript
// Add debugging to setup.js
console.log('Mock setup complete:', {
  localStorage: !!global.localStorage,
  fetch: !!global.fetch,
  IntersectionObserver: !!global.IntersectionObserver
});
```

### Performance Issues

#### Slow Test Execution

**Symptoms**:
- Tests take longer than expected
- Performance tests fail timing assertions
- Overall test suite runs slowly

**Diagnosis**:

1. **Identify Slow Tests**:
```bash
# Run with verbose output
node runSearchTests.js --verbose

# Check performance report
grep "SLOW" coverage/search-functionality/test-analysis-summary.txt
```

2. **Profile Individual Tests**:
```javascript
// Add performance measurement
const startTime = performance.now();
// ... test code
const endTime = performance.now();
console.log(`Test duration: ${endTime - startTime}ms`);
```

**Solutions**:

1. **Optimize Mock Implementations**:
```javascript
// Use efficient mocks
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve(cachedResponse) // Use cached data
}));
```

2. **Reduce Test Complexity**:
```javascript
// Split complex tests into smaller units
describe('Complex Feature', () => {
  it('should handle basic case', () => { /* simple test */ });
  it('should handle edge case', () => { /* focused test */ });
});
```

3. **Use Test Sequencing**:
```javascript
// Ensure fast tests run first
// This is handled automatically by testSequencer.js
```

#### Memory Leaks

**Symptoms**:
- Memory usage increases over time
- Tests become slower as suite progresses
- System runs out of memory

**Detection**:

1. **Monitor Memory Usage**:
```javascript
// Add to test setup
beforeEach(() => {
  const memUsage = process.memoryUsage();
  console.log(`Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
});
```

2. **Check for Uncleaned Resources**:
```javascript
// Verify cleanup in components
const { unmount } = render(<Component />);
unmount();
// Check that no timers or listeners remain
```

**Solutions**:

1. **Implement Proper Cleanup**:
```javascript
// In component tests
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear event listeners
  document.removeAllListeners?.();
});
```

2. **Use Memory-Efficient Patterns**:
```javascript
// Avoid creating large objects in loops
const mockData = useMemo(() => createLargeDataset(), []);
```

### Coverage Issues

#### Low Coverage Warnings

**Symptoms**:
- Coverage reports show low percentages
- Tests fail coverage thresholds
- Missing coverage for specific files

**Diagnosis**:

1. **Check Coverage Report**:
```bash
open coverage/search-functionality/index.html
```

2. **Identify Uncovered Lines**:
```bash
# Look for red lines in HTML report
# Or check text report
cat coverage/search-functionality/lcov-report/index.html
```

**Solutions**:

1. **Add Missing Tests**:
```javascript
// Test uncovered branches
it('should handle error case', () => {
  mockApi.searchArtists.mockRejectedValue(new Error('API Error'));
  // Test error handling path
});
```

2. **Remove Dead Code**:
```javascript
// Remove unused functions or branches
// Or add istanbul ignore comments for intentionally untested code
/* istanbul ignore next */
function debugOnlyFunction() {
  // Development-only code
}
```

3. **Adjust Coverage Thresholds**:
```javascript
// In jest.config.search.js - only if justified
coverageThreshold: {
  global: {
    branches: 75, // Reduced from 80 if appropriate
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

#### Coverage Threshold Failures

**Symptoms**:
- Jest exits with coverage threshold errors
- Specific files fail individual thresholds
- Global coverage below minimum

**Solutions**:

1. **Focus on Critical Files**:
```javascript
// Prioritize high-impact files
'src/lib/search-controller.js': {
  branches: 95, // Higher threshold for critical code
  functions: 95,
  lines: 95,
  statements: 95
}
```

2. **Add Comprehensive Tests**:
```javascript
// Test all code paths
describe('Error Handling', () => {
  it('should handle network errors', () => { /* test */ });
  it('should handle validation errors', () => { /* test */ });
  it('should handle timeout errors', () => { /* test */ });
});
```

### Accessibility Test Issues

#### axe-core Violations

**Symptoms**:
- Accessibility tests fail with axe violations
- WCAG compliance tests report issues
- Screen reader tests fail

**Diagnosis**:

1. **Check Violation Details**:
```javascript
// Add detailed logging
const results = await axe(container);
if (results.violations.length > 0) {
  console.log('Accessibility violations:', results.violations);
}
expect(results).toHaveNoViolations();
```

**Solutions**:

1. **Fix Common Issues**:
```javascript
// Add missing ARIA labels
<button aria-label="Close dialog">×</button>

// Ensure proper heading hierarchy
<h1>Main Title</h1>
<h2>Section Title</h2>

// Add alt text for images
<img src="..." alt="Descriptive text" />
```

2. **Update Component Implementation**:
```javascript
// In the actual component, not just tests
const SearchInput = () => (
  <input
    type="search"
    aria-label="Search for tattoo artists"
    aria-describedby="search-help"
  />
);
```

#### Keyboard Navigation Issues

**Symptoms**:
- Keyboard navigation tests fail
- Focus management doesn't work as expected
- Tab order is incorrect

**Solutions**:

1. **Fix Tab Order**:
```javascript
// Ensure logical tab order in components
<div>
  <input tabIndex={1} />
  <button tabIndex={2}>Search</button>
  <button tabIndex={3}>Clear</button>
</div>
```

2. **Implement Focus Management**:
```javascript
// In component
useEffect(() => {
  if (isOpen) {
    firstFocusableElement.current?.focus();
  }
}, [isOpen]);
```

### Integration Issues

#### Cross-Page Consistency Failures

**Symptoms**:
- Tests pass individually but fail in integration
- Inconsistent behavior across pages
- State management issues

**Solutions**:

1. **Check Component Props**:
```javascript
// Ensure consistent props across pages
const ArtistsPage = () => (
  <EnhancedStyleFilter 
    onStylesChange={handleStylesChange}
    selectedStyles={selectedStyles}
    // Ensure same props as StudiosPage
  />
);
```

2. **Verify State Management**:
```javascript
// Test state persistence
it('should maintain state across navigation', () => {
  const controller = new EnhancedSearchController();
  controller.updateSearchState({ query: testQuery });
  
  // Simulate navigation
  const newState = controller.getSearchState();
  expect(newState.query).toEqual(testQuery);
});
```

#### API Integration Issues

**Symptoms**:
- API mocks don't match real API behavior
- Integration tests fail with real API
- Response format mismatches

**Solutions**:

1. **Update Mock Responses**:
```javascript
// Ensure mocks match real API
mockApi.searchArtists.mockResolvedValue({
  artists: mockArtists,
  totalCount: mockArtists.length,
  // Include all fields from real API
  pagination: { page: 1, limit: 20 },
  filters: { styles: [], location: null }
});
```

2. **Validate Response Formats**:
```javascript
// Test response structure
it('should handle API response format', async () => {
  const response = await api.searchArtists(query);
  expect(response).toHaveProperty('artists');
  expect(response).toHaveProperty('totalCount');
  expect(Array.isArray(response.artists)).toBe(true);
});
```

## 🔧 Debug Mode and Logging

### Enable Debug Output

```bash
# Full debug mode
DEBUG=true VERBOSE=true node runSearchTests.js

# Specific debug categories
DEBUG_TEST_SEQUENCER=true node runSearchTests.js
PERFORMANCE_DEBUG=true node runSearchTests.js
```

### Custom Debug Logging

```javascript
// Add to test files
const debug = require('debug')('search-tests');

describe('Search Feature', () => {
  it('should work correctly', () => {
    debug('Starting test with query:', testQuery);
    // ... test implementation
    debug('Test completed successfully');
  });
});
```

### Performance Profiling

```javascript
// Add performance markers
performance.mark('test-start');
// ... test code
performance.mark('test-end');
performance.measure('test-duration', 'test-start', 'test-end');

const measures = performance.getEntriesByType('measure');
console.log('Test performance:', measures);
```

## 🛠️ Environment-Specific Issues

### Windows-Specific Issues

**Path Separator Issues**:
```javascript
// Use path.join for cross-platform compatibility
const testPath = path.join(__dirname, 'test-data', 'styles.json');
```

**Line Ending Issues**:
```bash
# Configure git to handle line endings
git config core.autocrlf true
```

### Node.js Version Issues

**Compatibility Problems**:
```bash
# Check Node.js version
node --version

# Use specific Node.js version
nvm use 18
```

**Module Resolution Issues**:
```javascript
// Use explicit file extensions
import { searchController } from './search-controller.js';
```

### Jest Version Compatibility

**Configuration Issues**:
```javascript
// Check Jest version compatibility
const jestVersion = require('jest/package.json').version;
console.log('Jest version:', jestVersion);

// Update configuration for newer Jest versions
module.exports = {
  // Use new configuration format
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup.js']
};
```

## 📊 Monitoring and Alerts

### Performance Monitoring

```javascript
// Set up performance alerts
const PERFORMANCE_THRESHOLDS = {
  searchResponse: 300,
  componentRender: 50,
  testExecution: 30000
};

function checkPerformance(metric, value) {
  if (value > PERFORMANCE_THRESHOLDS[metric]) {
    console.warn(`Performance alert: ${metric} took ${value}ms (threshold: ${PERFORMANCE_THRESHOLDS[metric]}ms)`);
  }
}
```

### Coverage Monitoring

```javascript
// Monitor coverage trends
function checkCoverageRegression(currentCoverage, baselineCoverage) {
  const threshold = 5; // 5% regression threshold
  
  Object.keys(currentCoverage).forEach(metric => {
    const current = currentCoverage[metric];
    const baseline = baselineCoverage[metric];
    const regression = baseline - current;
    
    if (regression > threshold) {
      console.error(`Coverage regression detected: ${metric} dropped by ${regression}%`);
    }
  });
}
```

## 🆘 Getting Help

### Internal Resources

1. **Check Documentation**:
   - `README.md` - Quick start guide
   - `DOCUMENTATION.md` - Comprehensive guide
   - `API_REFERENCE.md` - API documentation

2. **Review Test Files**:
   - Look at existing test patterns
   - Check similar test implementations
   - Review mock setups

3. **Examine Reports**:
   - Coverage reports in `coverage/search-functionality/`
   - Test analysis in `test-analysis.json`
   - Performance data in test output

### Debug Checklist

Before seeking help, try these steps:

- [ ] Clear Jest cache: `npx jest --clearCache`
- [ ] Check Node.js version compatibility
- [ ] Verify all dependencies are installed
- [ ] Run tests in isolation to identify conflicts
- [ ] Check for recent changes in test files
- [ ] Review error messages and stack traces
- [ ] Enable debug mode for detailed output
- [ ] Check system resources (CPU, memory)

### Reporting Issues

When reporting issues, include:

1. **Environment Information**:
   - Node.js version
   - Jest version
   - Operating system
   - Available memory/CPU

2. **Error Details**:
   - Complete error message
   - Stack trace
   - Steps to reproduce

3. **Test Context**:
   - Which test file/suite
   - Test configuration used
   - Any recent changes

4. **Debug Output**:
   - Debug logs if available
   - Performance metrics
   - Coverage reports

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: December 2024  
**Covers**: Jest 29+, Node.js 18+, Windows/Linux/macOS