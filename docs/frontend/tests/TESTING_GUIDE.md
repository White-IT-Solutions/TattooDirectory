# Search Functionality Testing Guide

## 🎯 Testing Philosophy and Approach

**Philosophy**: Build confidence through layered testing that validates search functionality from individual components to complete user journeys.

## 📋 Test Categories and Coverage

### 1. Unit Tests (70% of test suite)

**Purpose**: Validate individual components and functions in isolation.

**Coverage Areas**:
- Search controller logic
- Style filter components
- Data model validation
- Utility functions
- State management

**Example Test Structure**:
```javascript
describe('EnhancedSearchController', () => {
  describe('Search Query Management', () => {
    it('should create search queries with proper defaults', () => {
      const query = new SearchQuery();
      expect(query.text).toBe('');
      expect(query.styles).toEqual([]);
    });
  });
});
```

### 2. Integration Tests (25% of test suite)

**Purpose**: Validate component interactions and cross-page consistency.

**Coverage Areas**:
- Cross-page search behavior
- Component communication
- State synchronization
- API integration
- Error propagation

**Example Test Structure**:
```javascript
describe('Cross-Page Search Consistency', () => {
  it('should use identical style options on artists and studios pages', () => {
    // Test implementation
  });
});
```

### 3. End-to-End Tests (5% of test suite)

**Purpose**: Validate complete user workflows and real-world scenarios.

**Coverage Areas**:
- Complete search journeys
- Cross-browser compatibility
- Performance under load
- Accessibility with real assistive technology

## 🧪 Testing Strategies by Component

### Search Controller Testing

**Key Areas**:
- Query construction and validation
- Caching mechanisms
- State management
- Error handling
- Performance optimization

**Testing Approach**:
```javascript
// Test query caching
it('should cache search results for improved performance', async () => {
  const controller = new EnhancedSearchController();
  const query = new SearchQuery({ text: 'dragon' });
  
  // First search (should hit API)
  const startTime1 = performance.now();
  await controller.executeSearch(query);
  const firstSearchTime = performance.now() - startTime1;
  
  // Second search (should use cache)
  const startTime2 = performance.now();
  await controller.executeSearch(query);
  const secondSearchTime = performance.now() - startTime2;
  
  expect(secondSearchTime).toBeLessThan(firstSearchTime * 0.5);
});
```

### Style Filter Component Testing

**Key Areas**:
- Style selection/deselection
- Search functionality within filters
- Visual feedback
- Keyboard navigation
- Screen reader support

**Testing Approach**:
```javascript
// Test accessibility
it('should support keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<EnhancedStyleFilter onStylesChange={() => {}} />);
  
  await user.tab(); // Focus search input
  expect(document.activeElement).toHaveAttribute('data-testid', 'style-search-input');
  
  await user.tab(); // Focus first style button
  const firstButton = screen.getByTestId('style-button-old_school');
  expect(document.activeElement).toBe(firstButton);
});
```

### Cross-Page Consistency Testing

**Key Areas**:
- Identical component behavior
- Consistent data usage
- Uniform error handling
- Synchronized state management

**Testing Approach**:
```javascript
// Test data consistency
it('should use the same style model across pages', () => {
  const artistsPageStyles = getStylesFromPage('artists');
  const studiosPageStyles = getStylesFromPage('studios');
  
  expect(artistsPageStyles).toEqual(studiosPageStyles);
});
```

## 🚀 Performance Testing Guidelines

### Response Time Targets

| Operation | Target | Critical |
|-----------|--------|----------|
| Search API Response | <300ms | <500ms |
| Component Rendering | <50ms | <100ms |
| User Interactions | <100ms | <200ms |
| Page Navigation | <200ms | <400ms |

### Performance Test Implementation

```javascript
describe('Search Performance', () => {
  it('should complete search within performance target', async () => {
    const controller = new EnhancedSearchController();
    const query = new SearchQuery({ text: 'dragon' });

    const startTime = performance.now();
    await controller.executeSearch(query);
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(300); // 300ms target
  });
});
```

### Memory Usage Testing

```javascript
it('should not create memory leaks', () => {
  const controller = new EnhancedSearchController();
  const listeners = [];
  
  // Add multiple listeners
  for (let i = 0; i < 50; i++) {
    listeners.push(controller.addListener(() => {}));
  }
  
  // Remove all listeners
  listeners.forEach(unsubscribe => unsubscribe());
  
  expect(controller.listeners).toHaveLength(0);
});
```

## ♿ Accessibility Testing Standards

### WCAG 2.1 AA Compliance

**Level A Requirements**:
- Keyboard accessibility
- Alternative text for images
- Proper heading structure
- Color contrast (4.5:1 minimum)

**Level AA Requirements**:
- Focus indicators
- Consistent navigation
- Error identification
- Resize text to 200%

### Accessibility Test Implementation

```javascript
describe('Search Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<EnhancedStyleFilter onStylesChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should announce filter changes to screen readers', async () => {
    const user = userEvent.setup();
    render(<EnhancedStyleFilter onStylesChange={() => {}} />);
    
    const styleButton = screen.getByTestId('style-button-old_school');
    await user.click(styleButton);
    
    // Check for aria-live region updates
    const liveRegion = screen.queryByRole('status');
    expect(liveRegion).toBeInTheDocument();
  });
});
```

### Keyboard Navigation Testing

```javascript
const testKeyboardNavigation = async (component) => {
  const user = userEvent.setup();
  render(component);
  
  // Test tab navigation
  await user.tab();
  const firstFocusable = document.activeElement;
  expect(firstFocusable).toBeVisible();
  
  // Test enter/space activation
  await user.keyboard('{Enter}');
  // Verify action occurred
  
  await user.keyboard(' ');
  // Verify space also works
};
```

## 🔄 Test Data Management

### Mock Data Strategy

**Standardized Test Data**:
```javascript
export const mockArtists = [
  {
    id: 'artist-1',
    name: 'Dragon Ink Master',
    styles: ['old_school', 'japanese'],
    location: { city: 'London', postcode: 'SW1A 1AA' },
    rating: 4.8,
    portfolioImages: ['dragon1.jpg', 'dragon2.jpg']
  }
];

export const mockStudios = [
  {
    id: 'studio-1',
    name: 'Ink & Steel Studio',
    specialties: ['old_school', 'traditional'],
    location: { city: 'London', postcode: 'SW1A 1AA' },
    rating: 4.9,
    artists: ['artist-1']
  }
];
```

### Dynamic Test Data Generation

```javascript
export const generateTestArtists = (count = 10, options = {}) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `artist-${i + 1}`,
    name: `Test Artist ${i + 1}`,
    styles: options.styles || ['old_school'],
    location: options.location || { city: 'London' },
    rating: 4.0 + (Math.random() * 1.0),
    portfolioImages: [`image-${i + 1}.jpg`]
  }));
};
```

### Test Data Validation

```javascript
const validateTestData = (data, schema) => {
  const requiredFields = ['id', 'name', 'styles', 'location'];
  
  return data.every(item => 
    requiredFields.every(field => item.hasOwnProperty(field))
  );
};
```

## 🎭 Mocking Strategies

### API Mocking

```javascript
// Mock successful API responses
const mockApiSuccess = (data) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data)
  });
};

// Mock API errors
const mockApiError = (error = 'API Error') => {
  global.fetch.mockRejectedValueOnce(new Error(error));
};

// Mock slow responses for performance testing
const mockSlowApi = (data, delay = 1000) => {
  global.fetch.mockImplementationOnce(() =>
    new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data)
      }), delay)
    )
  );
};
```

### Browser API Mocking

```javascript
// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
};
```

## 📊 Test Execution and Reporting

### Running Tests

**Full Test Suite**:
```bash
# Run all search functionality tests
node src/__tests__/search-functionality/runSearchTests.js

# With coverage analysis
node runSearchTests.js --coverage

# Fast execution (reduced timeouts)
node runSearchTests.js --fast

# Stop on first failure
node runSearchTests.js --bail
```

**Individual Test Categories**:
```bash
# Core functionality tests
npx jest SearchFunctionality.test.jsx

# Performance tests only
npx jest SearchPerformance.test.js

# Accessibility tests only
npx jest SearchAccessibility.test.jsx
```

### Test Reports

**Automated Reports Generated**:
- Test execution summary
- Requirements coverage analysis
- Performance metrics
- Accessibility compliance report
- Code coverage details

**Report Locations**:
```
coverage/search-functionality/
├── index.html                    # Coverage report
├── test-results.json            # Detailed test results
├── test-analysis.json           # Requirements analysis
└── test-analysis-summary.txt    # Human-readable summary
```

### Continuous Integration

**GitHub Actions Integration**:
```yaml
- name: Run Search Functionality Tests
  run: |
    cd frontend
    node src/__tests__/search-functionality/runSearchTests.js
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: search-test-results
    path: frontend/coverage/search-functionality/
```

## 🐛 Debugging and Troubleshooting

### Common Test Issues

**1. Timing Issues**:
```javascript
// Problem: Test fails due to async operations
it('should update results', async () => {
  render(<SearchComponent />);
  fireEvent.change(searchInput, { target: { value: 'test' } });
  
  // Solution: Wait for async updates
  await waitFor(() => {
    expect(screen.getByText('Results')).toBeInTheDocument();
  });
});
```

**2. Mock Issues**:
```javascript
// Problem: Mocks not working correctly
beforeEach(() => {
  // Solution: Clear mocks between tests
  jest.clearAllMocks();
  
  // Reset mock implementations
  mockApi.searchArtists.mockResolvedValue({ artists: [], totalCount: 0 });
});
```

**3. Memory Leaks**:
```javascript
// Problem: Tests causing memory leaks
afterEach(() => {
  // Solution: Cleanup after each test
  cleanup();
  jest.clearAllTimers();
});
```

### Debug Mode

**Enable Debug Output**:
```bash
DEBUG=true node runSearchTests.js
```

**Debug Specific Components**:
```javascript
// Add debug logging in tests
console.log('Component state:', component.debug());

// Use screen.debug() for DOM inspection
screen.debug();

// Log test data
console.log('Test data:', JSON.stringify(testData, null, 2));
```

### Performance Debugging

**Identify Slow Tests**:
```bash
# Run with performance profiling
node runSearchTests.js --profile

# Check slow test report
cat coverage/search-functionality/slow-tests.json
```

**Memory Usage Monitoring**:
```javascript
const measureMemory = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};
```

## 📈 Test Maintenance and Evolution

### Adding New Tests

**1. Identify Test Category**:
- Unit test for isolated functionality
- Integration test for component interactions
- E2E test for complete user flows

**2. Follow Naming Conventions**:
```javascript
// Good: Descriptive and specific
describe('EnhancedStyleFilter - Style Selection', () => {
  it('should select multiple styles and update filter tags', () => {
    // Test implementation
  });
});

// Avoid: Vague or generic
describe('Component', () => {
  it('should work', () => {
    // Test implementation
  });
});
```

**3. Update Coverage Targets**:
```javascript
// Update jest.config.search.js
coverageThreshold: {
  'src/app/components/NewComponent.jsx': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

### Refactoring Tests

**Extract Common Patterns**:
```javascript
// Create reusable test utilities
const renderWithSearchProvider = (component, initialState = {}) => {
  return render(
    <SearchProvider initialState={initialState}>
      {component}
    </SearchProvider>
  );
};

// Use in multiple tests
it('should handle search state', () => {
  renderWithSearchProvider(<SearchComponent />);
  // Test implementation
});
```

**Maintain Test Data**:
```javascript
// Keep test data in sync with production data
const validateTestDataSchema = () => {
  const productionSchema = require('../../../data/schema.json');
  const testData = require('./mockData.js');
  
  expect(testData).toMatchSchema(productionSchema);
};
```

### Performance Optimization

**Optimize Test Execution**:
```javascript
// Use beforeAll for expensive setup
beforeAll(async () => {
  // Setup that can be shared across tests
  await setupTestDatabase();
});

// Use beforeEach for test-specific setup
beforeEach(() => {
  // Reset state for each test
  resetSearchState();
});
```

**Parallel Test Execution**:
```bash
# Run tests in parallel
npx jest --maxWorkers=4

# Optimize for CI environment
npx jest --maxWorkers=50%
```

## 🎯 Best Practices Summary

### Test Writing Guidelines

1. **Write Descriptive Test Names**
   - Use "should" statements
   - Include expected behavior
   - Specify conditions

2. **Follow AAA Pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the functionality being tested
   - **Assert**: Verify the expected outcome

3. **Test One Thing at a Time**
   - Each test should verify a single behavior
   - Avoid complex test scenarios
   - Use multiple tests for multiple behaviors

4. **Use Appropriate Assertions**
   - Be specific about expected outcomes
   - Use semantic matchers when available
   - Provide meaningful error messages

### Code Quality Standards

1. **Maintain High Coverage**
   - Aim for 80%+ coverage on critical components
   - Focus on meaningful coverage, not just numbers
   - Test edge cases and error conditions

2. **Keep Tests Fast**
   - Mock external dependencies
   - Avoid unnecessary async operations
   - Use efficient test data

3. **Ensure Test Reliability**
   - Avoid flaky tests
   - Use proper cleanup
   - Handle timing issues correctly

4. **Document Complex Tests**
   - Explain non-obvious test logic
   - Document test data requirements
   - Include examples for common patterns

### Continuous Improvement

1. **Regular Test Review**
   - Review test failures for patterns
   - Update tests when requirements change
   - Remove obsolete tests

2. **Performance Monitoring**
   - Track test execution times
   - Identify and optimize slow tests
   - Monitor resource usage

3. **Coverage Analysis**
   - Review coverage reports regularly
   - Identify untested code paths
   - Add tests for critical functionality

4. **Accessibility Validation**
   - Run accessibility tests regularly
   - Test with real assistive technology
   - Keep up with WCAG updates

---

This comprehensive testing guide ensures that search functionality is thoroughly validated, maintainable, and provides confidence in the implementation's quality and reliability.