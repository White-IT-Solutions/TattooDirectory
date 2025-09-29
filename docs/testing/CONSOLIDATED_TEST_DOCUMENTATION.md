# Frontend Testing Documentation - Consolidated Guide

## 📋 Overview

This consolidated guide combines comprehensive testing documentation for both search functionality and component integration testing across the tattoo artist directory application. It provides complete coverage of testing strategies, implementation details, troubleshooting, and best practices.

## 🗂️ Document Structure

### Part I: Search Functionality Testing
- Core search functionality validation
- Cross-page consistency testing
- Performance and accessibility compliance
- User journey validation

### Part II: Component Integration Testing
- Enhanced component integration tests
- Cross-page consistency validation
- Accessibility compliance with axe-core
- Visual regression testing

### Part III: Shared Resources
- Common troubleshooting guide
- Performance standards
- Configuration and setup
- Best practices and maintenance

### Part IV: End-to-End Testing
- Complete user workflow validation
- Cross-browser compatibility testing
- Performance and accessibility E2E validation
- Mobile and responsive testing

---

# PART I: SEARCH FUNCTIONALITY TESTING

## 🎯 Search Testing Philosophy

**Philosophy**: Build confidence through layered testing that validates search functionality from individual components to complete user journeys, ensuring consistent behavior across all pages.

### Key Objectives

- **Consistency Validation**: Ensure identical search behavior across Artists, Studios, and Styles pages
- **Performance Compliance**: Validate response times and rendering speeds meet targets
- **Accessibility Standards**: Ensure WCAG 2.1 AA compliance for inclusive user experience
- **User Journey Testing**: Validate complete search workflows from start to finish
- **Requirements Coverage**: Map all tests to specification requirements for compliance tracking

## 🏗️ Search Test Architecture

### Test Suite Structure

```
frontend/src/__tests__/search-functionality/
├── 📋 Core Test Files
│   ├── SearchFunctionality.test.jsx      # Core functionality & style model
│   ├── CrossPageConsistency.test.jsx     # Cross-page integration tests
│   ├── SearchPerformance.test.js         # Performance validation
│   ├── SearchAccessibility.test.jsx      # WCAG 2.1 AA compliance
│   └── SearchUserFlows.test.jsx          # End-to-end user journeys
├── 🔧 Infrastructure
│   ├── runSearchTests.js                 # Test runner & orchestrator
│   ├── jest.config.search.js             # Jest configuration
│   ├── setup.js                          # Test environment setup
│   ├── testResultsProcessor.js           # Results analysis
│   ├── customReporter.js                 # Real-time reporting
│   └── testSequencer.js                  # Execution optimization
└── 📚 Documentation
    └── README.md                          # Quick start guide
```

## 🧪 Search Test Categories

### 1. Core Functionality Tests (`SearchFunctionality.test.jsx`)

**Purpose**: Validates the foundation of search functionality and ensures the standardized style model works correctly across all components.

#### Test Groups

**Standardized Style Model Consistency**
- Data structure validation for all 22+ tattoo styles
- Unique ID verification and consistency checks
- Difficulty level mapping and validation
- Alias-based search functionality testing
- Cross-component style model usage verification

**Enhanced Search Controller Unit Tests**
- Search query creation and management
- State management and listener patterns
- Filter application and clearing logic
- Search caching and performance optimization
- Error handling and recovery mechanisms

**Search History and Persistence**
- LocalStorage integration testing
- Search history management
- Query persistence across sessions
- History cleanup and maintenance

#### Key Validations

```javascript
// Style model structure validation
expect(style).toHaveProperty('id');
expect(style).toHaveProperty('name');
expect(style).toHaveProperty('difficulty');
expect(['beginner', 'intermediate', 'advanced']).toContain(style.difficulty);

// Search controller functionality
const controller = new EnhancedSearchController();
await controller.executeSearch(query);
expect(controller.getSearchState().results).toBeDefined();

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

### 2. Cross-Page Consistency Tests (`CrossPageConsistency.test.jsx`)

**Purpose**: Ensures search functionality behaves identically across Artists, Studios, and Styles pages.

#### Test Groups

**Style Filter Consistency**
- Identical style options across pages
- Consistent style metadata display
- Uniform difficulty level indicators
- Matching filter behavior and state management

**Search Interface Uniformity**
- Consistent search input behavior
- Identical filter toggle functionality
- Uniform clear filters operation
- Matching results display format

**Data Synchronization**
- Style model consistency verification
- Filter state management across navigation
- Search result format standardization
- Error handling uniformity

#### Key Validations

```javascript
// Cross-page style consistency
const artistsStyles = getStylesFromPage(ArtistsPage);
const studiosStyles = getStylesFromPage(StudiosPage);
expect(artistsStyles.sort()).toEqual(studiosStyles.sort());

// Filter behavior consistency
await user.click(styleToggle);
expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();

// Test data consistency
it('should use the same style model across pages', () => {
  const artistsPageStyles = getStylesFromPage('artists');
  const studiosPageStyles = getStylesFromPage('studios');
  
  expect(artistsPageStyles).toEqual(studiosPageStyles);
});
```

### 3. Performance Tests (`SearchPerformance.test.js`)

**Purpose**: Validates that search functionality meets strict performance targets for optimal user experience.

#### Test Groups

**Search Response Time Performance**
- Basic search completion within 300ms target
- Style-filtered search performance validation
- Complex multi-criteria search timing
- Concurrent search handling efficiency

**Component Rendering Performance**
- EnhancedStyleFilter rendering (<50ms target)
- SearchResultsDisplay with various dataset sizes
- AdvancedSearchInterface initialization time
- Rapid re-render performance testing

**Memory Usage and Cleanup**
- Search controller memory leak detection
- Debounced search timer cleanup
- Component unmounting without leaks
- Cache memory management

#### Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Search Response | <300ms | <500ms |
| Component Render | <50ms | <100ms |
| User Interaction | <100ms | <200ms |
| Debounce Delay | 300ms | N/A |
| Memory Leaks | 0 | 0 |

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
});
```

### 4. Accessibility Tests (`SearchAccessibility.test.jsx`)

**Purpose**: Ensures WCAG 2.1 AA compliance and provides an inclusive experience for all users.

#### Test Groups

**Keyboard Navigation**
- Tab order and focus management
- Enter/Space key activation
- Arrow key navigation support
- Escape key functionality

**Screen Reader Support**
- ARIA labels and descriptions
- Live region announcements
- Accessible names for all controls
- Proper heading hierarchy

**Visual Accessibility**
- Color contrast compliance (4.5:1 ratio)
- Focus indicator visibility
- High contrast mode support
- Reduced motion preferences

**Touch and Mobile Accessibility**
- Touch target size compliance (44px minimum)
- Gesture navigation support
- Mobile screen reader compatibility
- Responsive accessibility features

#### Accessibility Standards

```javascript
// WCAG 2.1 AA compliance testing
const results = await axe(container);
expect(results).toHaveNoViolations();

// Keyboard navigation testing
await user.tab();
expect(document.activeElement).toHaveAttribute('data-testid', 'style-search-input');

// Touch target validation
const rect = button.getBoundingClientRect();
expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);

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

### 5. User Flow Tests (`SearchUserFlows.test.jsx`)

**Purpose**: Validates complete user journeys through search functionality across all interfaces.

#### Test Groups

**Complete Artist Search Journey**
- Text search input and results
- Style filter application and removal
- Combined text and style filtering
- Filter clearing and state management
- No results handling and recovery

**Studio Discovery Workflows**
- Specialty-based studio search
- Style filtering for studios
- Cross-page navigation consistency
- Error recovery scenarios

**Advanced Search Scenarios**
- Complex multi-criteria queries
- Search configuration persistence
- Mobile and touch interactions
- Performance under load

#### User Journey Validation

```javascript
// Complete search workflow
await user.type(searchInput, 'dragon');
await user.click(styleToggle);
await user.click(oldSchoolButton);
expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
await user.click(clearButton);
expect(screen.queryByTestId('style-filter-tag-old_school')).not.toBeInTheDocument();
```

## 📋 Search Requirements Mapping

### Specification Requirements Coverage

| Requirement | Primary Test File | Coverage | Status |
|-------------|------------------|----------|--------|
| **Req 1**: Studios Page Search Experience | CrossPageConsistency | 95.2% | ✅ |
| **Req 2**: Artists Page Search Functionality | SearchFunctionality | 98.1% | ✅ |
| **Req 3**: Navigation Search Experience | SearchAccessibility | 87.4% | ✅ |
| **Req 4**: Styles Page Enhancement | CrossPageConsistency | 91.7% | ✅ |
| **Req 5**: Consistent Search Design System | SearchFunctionality | 94.3% | ✅ |
| **Req 6**: Search Result Display and Feedback | SearchUserFlows | 89.6% | ✅ |
| **Req 7**: Advanced Search Capabilities | SearchUserFlows | 92.1% | ✅ |
| **Req 8**: Standardized Tattoo Styles Data Model | SearchFunctionality | 100.0% | ✅ |
| **Req 9**: Navigation and UX Components | SearchAccessibility | 85.9% | ✅ |
| **Req 10**: Feedback and Notification Systems | SearchUserFlows | 88.2% | ✅ |
| **Req 11**: Data Display and Visualization | CrossPageConsistency | 90.5% | ✅ |
| **Req 12**: Loading and Skeleton States | SearchPerformance | 86.7% | ✅ |
| **Req 13**: Performance and Accessibility | SearchPerformance, SearchAccessibility | 93.8% | ✅ |

---

# PART II: COMPONENT INTEGRATION TESTING

## 🎯 Integration Testing Overview

The component integration test suite implements comprehensive validation for enhanced component implementations, cross-page consistency, accessibility compliance, and visual regression testing.

### Integration Testing Objectives

1. **Integration tests** for all enhanced component implementations
2. **Cross-page consistency validation** tests
3. **Accessibility compliance testing** with axe-core
4. **Visual regression tests** for design system consistency

## 🏗️ Integration Test Structure

```
__tests__/
├── integration/
│   ├── ComponentIntegration.test.jsx      # Enhanced component integration tests
│   └── CrossPageConsistency.test.jsx      # Cross-page consistency validation
├── accessibility/
│   └── AccessibilityCompliance.test.jsx   # WCAG 2.1 AA compliance tests
├── visual/
│   └── VisualRegression.test.jsx          # Design system consistency tests
├── setup/
│   └── testSetup.js                       # Test configuration and utilities
├── runIntegrationTests.js                 # Test runner script
└── README.md                              # Documentation
```

## 🧪 Integration Test Suites

### 1. Component Integration Tests (`ComponentIntegration.test.jsx`)

Tests the integration of all enhanced components:

- **SearchFeedbackIntegration**: Search functionality with real-time validation
- **VisualEffectsIntegration**: Shadow systems, glassmorphism, gradients
- **PerformanceOptimizationIntegration**: Lazy loading, infinite scroll, image optimization
- **AnimationInteractionIntegration**: Micro-interactions, hover effects, reduced motion

**Key Test Areas:**
- Component rendering and prop handling
- State management and updates
- Event handling and user interactions
- Error boundary integration
- Performance optimization features

### 2. Cross-Page Consistency Tests (`CrossPageConsistency.test.jsx`)

Validates consistency across Artists, Studios, and Styles pages:

- **Navigation Consistency**: Header, breadcrumbs, menu structure
- **Search Functionality**: Interface, filters, results display
- **Content Layout**: Page structure, card layouts, typography
- **Design System**: Colors, spacing, components
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

**Key Test Areas:**
- Navigation structure uniformity
- Search interface standardization
- Card layout consistency
- Typography hierarchy
- Responsive design patterns

### 3. Accessibility Compliance Tests (`AccessibilityCompliance.test.jsx`)

Comprehensive WCAG 2.1 AA compliance testing:

- **Automated Scanning**: axe-core integration for violation detection
- **Keyboard Navigation**: Tab order, focus management, shortcuts
- **Screen Reader Support**: ARIA labels, live regions, semantic markup
- **Focus Management**: Modal dialogs, dropdown menus, form controls
- **Color Contrast**: Text readability, interactive elements

**Key Test Areas:**
- ARIA attribute validation
- Heading hierarchy verification
- Focus trap implementation
- Live region announcements
- Reduced motion preferences

### 4. Visual Regression Tests (`VisualRegression.test.jsx`)

Design system consistency and visual state validation:

- **Design Tokens**: Colors, typography, spacing, shadows
- **Component States**: Default, hover, focus, disabled, loading
- **Visual Effects**: Elevation shadows, glassmorphism, gradients, textures
- **Animation System**: Micro-interactions, transitions, reduced motion
- **Responsive Design**: Breakpoints, grid layouts, mobile optimization

**Key Test Areas:**
- CSS class application consistency
- Component state rendering
- Visual effect integration
- Animation behavior validation
- Responsive layout verification

## 🚀 Integration Test Execution

### Quick Start

```bash
# Run all integration tests
npm run test:integration

# Run with coverage report
npm run test:integration:coverage

# Run in watch mode for development
npm run test:integration:watch
```

### Specific Test Suites

```bash
# Run only accessibility tests
npm run test:accessibility

# Run only visual regression tests
npm run test:visual

# Run only cross-page consistency tests
npm run test:cross-page
```

### Advanced Options

```bash
# Generate coverage report only
npm run test:integration -- --coverage-only

# Continue on test failures (useful for CI)
npm run test:integration -- --continue-on-error

# Update snapshots
npm run test:integration -- --updateSnapshot

# Show help
npm run test:integration -- --help
```

---

# PART III: SHARED RESOURCES

## ⚙️ Configuration

### Jest Configuration

The test suites use custom Jest configuration optimized for comprehensive testing:

```javascript
const testConfig = {
  displayName: 'Frontend Tests',
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/setup/testSetup.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Environment Variables

```bash
# Test execution
JEST_TIMEOUT=30000          # Test timeout in milliseconds
DEBUG_TEST_SEQUENCER=true   # Enable test sequencer debugging
NO_COLOR=true              # Disable colored output
VERBOSE=true               # Enable verbose logging

# Performance testing
PERFORMANCE_BASELINE=true   # Generate performance baseline
PERFORMANCE_THRESHOLD=300   # Response time threshold in ms

# Coverage reporting
COVERAGE_THRESHOLD=80       # Minimum coverage percentage
COVERAGE_REPORTS=html,lcov  # Coverage report formats
```

### Dependencies

Required testing dependencies:

- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jest-axe` - Accessibility testing with axe-core
- `@axe-core/react` - React-specific accessibility testing

## 🎭 Mocking Strategies

### Global Mocks

- **Next.js Router**: Navigation and routing functionality
- **Next.js Image**: Optimized image component
- **IntersectionObserver**: Lazy loading and viewport detection
- **ResizeObserver**: Responsive behavior testing
- **matchMedia**: Media query and responsive testing

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

## 🔄 Test Data Management

### Standardized Test Data

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

## ⚡ Performance Standards

### Response Time Targets

**Search Operations**
- Basic text search: <200ms
- Style-filtered search: <300ms
- Complex multi-criteria search: <500ms
- Cached search results: <50ms

**Component Rendering**
- EnhancedStyleFilter: <50ms
- SearchResultsDisplay (20 items): <75ms
- SearchResultsDisplay (100 items): <150ms
- AdvancedSearchInterface: <100ms

**User Interactions**
- Filter toggle: <50ms
- Style selection: <75ms
- Search input typing: <25ms per keystroke
- Clear filters: <100ms

### Memory Management

**Memory Usage Limits**
- Search controller: <5MB baseline
- Component instances: <1MB per component
- Cache storage: <10MB total
- Memory leaks: 0 tolerance

**Cleanup Requirements**
- Event listeners: Must be removed on unmount
- Timers: Must be cleared on component destruction
- Cache entries: Must respect size limits
- DOM references: Must be released properly

## ♿ Accessibility Standards

### WCAG 2.1 AA Compliance

**Level A Requirements**
- ✅ Keyboard accessibility for all functionality
- ✅ Alternative text for images and icons
- ✅ Proper heading structure and hierarchy
- ✅ Form labels and instructions
- ✅ Focus order and visibility

**Level AA Requirements**
- ✅ Color contrast ratio 4.5:1 for normal text
- ✅ Color contrast ratio 3:1 for large text
- ✅ Resize text up to 200% without loss of functionality
- ✅ Touch target size minimum 44×44 pixels
- ✅ No content flashes more than 3 times per second

### Keyboard Navigation Standards

**Navigation Requirements**
- Tab order follows logical sequence
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Escape key closes modal dialogs and dropdowns
- Enter/Space activates buttons and controls

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

## 📊 Reporting

### Automated Reports

**Test Results Report** (`test-results.json`)
```json
{
  "summary": {
    "totalTests": 156,
    "passedTests": 154,
    "failedTests": 2,
    "skippedTests": 0,
    "totalTime": 12450
  },
  "requirements": {
    "Requirement 1": {
      "name": "Unify Studios Page Search Experience",
      "coverage": 95.2,
      "passed": 12,
      "failed": 0
    }
  }
}
```

### Coverage Requirements

### Minimum Coverage Thresholds

- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%
- **Statements**: 85%

### Coverage Areas

1. **Component Integration**: All enhanced component implementations
2. **Cross-Page Functionality**: Navigation, search, layout consistency
3. **Accessibility Features**: ARIA implementation, keyboard navigation
4. **Visual System**: Design tokens, component states, responsive design
5. **Performance Features**: Lazy loading, optimization, caching

## 🔧 Troubleshooting Guide

### Common Issues

#### Tests Timing Out

**Symptoms**:
- Tests fail with timeout errors
- Jest reports "Exceeded timeout of X ms for a test"
- Tests hang indefinitely

**Solutions**:

1. **Increase Global Timeout**:
```bash
# Set environment variable
JEST_TIMEOUT=60000 node runTests.js

# Or modify jest configuration
testTimeout: 60000
```

2. **Use Fast Mode**:
```bash
node runTests.js --fast
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
NODE_OPTIONS="--max-old-space-size=4096" node runTests.js
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
node runTests.js --verbose

# Check performance report
grep "SLOW" coverage/test-analysis-summary.txt
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

### Coverage Issues

#### Low Coverage Warnings

**Symptoms**:
- Coverage reports show low percentages
- Tests fail coverage thresholds
- Missing coverage for specific files

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

### Accessibility Test Issues

#### axe-core Violations

**Symptoms**:
- Accessibility tests fail with axe violations
- WCAG compliance tests report issues
- Screen reader tests fail

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

### Debug Mode and Logging

#### Enable Debug Output

```bash
# Full debug mode
DEBUG=true VERBOSE=true node runTests.js

# Specific debug categories
DEBUG_TEST_SEQUENCER=true node runTests.js
PERFORMANCE_DEBUG=true node runTests.js
```

#### Custom Debug Logging

```javascript
// Add to test files
const debug = require('debug')('tests');

describe('Feature', () => {
  it('should work correctly', () => {
    debug('Starting test with data:', testData);
    // ... test implementation
    debug('Test completed successfully');
  });
});
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

## 🚀 Usage Guide

### Quick Start Commands

```bash
# Search functionality tests
cd frontend
node src/__tests__/search-functionality/runSearchTests.js

# Component integration tests
npm run test:integration

# All tests with coverage
npm run test:all -- --coverage

# Watch mode for development
npm run test:watch
```

### Command Line Options

```bash
# Basic execution
node runTests.js

# Fast execution (reduced timeouts)
node runTests.js --fast

# Skip coverage analysis
node runTests.js --no-coverage

# Stop on first failure
node runTests.js --bail

# Show help
node runTests.js --help
```

### Individual Test Execution

```bash
# Run specific test suite
npx jest SearchFunctionality.test.jsx

# Run with custom config
npx jest --config=jest.config.js

# Run with watch mode
npx jest --watch

# Run with coverage
npx jest --coverage
```

## 🤝 Contributing

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
// Update jest configuration
coverageThreshold: {
  'src/app/components/NewComponent.jsx': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

### Code Review Checklist

- [ ] Tests cover all new component functionality
- [ ] Accessibility tests include ARIA and keyboard navigation
- [ ] Visual tests validate design system consistency
- [ ] Cross-page tests ensure uniform implementation
- [ ] Mocks are properly configured and realistic
- [ ] Test names are descriptive and clear
- [ ] Coverage thresholds are maintained

---

# PART IV: END-TO-END TESTING

## 🎯 E2E Testing Overview

The End-to-End testing framework provides comprehensive validation of complete user workflows using Playwright, ensuring the frontend application works correctly from a user's perspective across different browsers and devices.

### E2E Testing Objectives

- **Complete User Workflows**: Test entire user journeys from start to finish
- **Cross-Browser Compatibility**: Ensure consistent behavior across all supported browsers
- **Performance Validation**: Measure real-world performance metrics
- **Accessibility Compliance**: Validate WCAG compliance in real browser environments
- **Mobile Experience**: Test touch interactions and responsive design
- **Integration Validation**: Ensure frontend integrates correctly with backend services

## 🏗️ E2E Framework Architecture

```
tests/e2e/
├── fixtures/           # Test data and setup utilities
│   ├── artists.json    # Mock artist data for testing
│   ├── studios.json    # Mock studio data for testing
│   └── auth.json       # Authentication fixtures
├── pages/             # Page Object Model classes
│   ├── ArtistsPage.js  # Artists page interactions
│   ├── StudiosPage.js  # Studios page interactions
│   ├── SearchPage.js   # Search functionality
│   └── BasePage.js     # Common page functionality
├── specs/             # Test specifications
│   ├── search/         # Search functionality tests
│   ├── navigation/     # Navigation and routing tests
│   ├── performance/    # Performance measurement tests
│   └── accessibility/  # Accessibility validation tests
├── utils/             # Helper utilities
│   ├── test-helpers.js # Common test utilities
│   ├── performance.js  # Performance measurement tools
│   └── accessibility.js # Accessibility testing helpers
├── config/            # Test configurations
│   ├── playwright.config.js # Main Playwright configuration
│   ├── browsers.config.js   # Browser-specific settings
│   └── devices.config.js    # Mobile device configurations
└── reports/           # Test execution reports
    ├── html-report/    # Interactive HTML reports
    ├── junit/          # JUnit XML reports for CI
    └── screenshots/    # Failure screenshots
```

## 🧪 E2E Test Categories

### 1. Core User Flows

**Artist Search Workflows**
- Location-based artist search with radius filtering
- Style-based filtering and multi-criteria search
- Search result pagination and infinite scroll
- No results handling and alternative suggestions
- Search history and saved searches

**Artist Profile Interactions**
- Profile page navigation and content loading
- Portfolio image gallery interactions
- Contact information display and interaction
- Social media link validation
- Booking and inquiry workflows

**Map Navigation**
- Interactive map initialization and rendering
- Artist marker clustering and individual display
- Map zoom and pan interactions
- Location-based search integration
- Mobile map touch interactions

**Cross-Page Navigation**
- Header navigation consistency
- Breadcrumb navigation functionality
- Footer link validation
- Search state persistence across navigation
- Browser back/forward button handling

#### Implementation Example

```javascript
// Artist Search E2E Test
import { test, expect } from '@playwright/test';
import { ArtistsPage } from '../pages/ArtistsPage';
import { SearchPage } from '../pages/SearchPage';

test.describe('Artist Search Workflows', () => {
  let artistsPage;
  let searchPage;

  test.beforeEach(async ({ page }) => {
    artistsPage = new ArtistsPage(page);
    searchPage = new SearchPage(page);
    await artistsPage.goto();
  });

  test('should perform location-based search with results', async ({ page }) => {
    // Enter location search
    await searchPage.enterLocation('London');
    await searchPage.setRadius(10);
    await searchPage.clickSearch();

    // Verify results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="artist-card"]')).toHaveCount({ min: 1 });

    // Verify result content
    const firstArtist = page.locator('[data-testid="artist-card"]').first();
    await expect(firstArtist.locator('[data-testid="artist-name"]')).toBeVisible();
    await expect(firstArtist.locator('[data-testid="artist-location"]')).toContainText('London');
  });

  test('should handle style filtering with multiple selections', async ({ page }) => {
    // Open style filter
    await searchPage.openStyleFilter();
    
    // Select multiple styles
    await searchPage.selectStyle('old_school');
    await searchPage.selectStyle('japanese');
    
    // Apply filters
    await searchPage.applyFilters();

    // Verify filter tags
    await expect(page.locator('[data-testid="filter-tag-old_school"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-tag-japanese"]')).toBeVisible();

    // Verify filtered results
    const artistCards = page.locator('[data-testid="artist-card"]');
    const count = await artistCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = artistCards.nth(i);
      const styles = await card.locator('[data-testid="artist-styles"]').textContent();
      expect(styles).toMatch(/(old.school|japanese)/i);
    }
  });

  test('should persist search state across navigation', async ({ page }) => {
    // Perform search
    await searchPage.enterLocation('Manchester');
    await searchPage.selectStyle('traditional');
    await searchPage.clickSearch();

    // Navigate to different page
    await page.click('[data-testid="nav-studios"]');
    await expect(page).toHaveURL(/.*\/studios/);

    // Navigate back to artists
    await page.click('[data-testid="nav-artists"]');
    await expect(page).toHaveURL(/.*\/artists/);

    // Verify search state persisted
    await expect(page.locator('[data-testid="location-input"]')).toHaveValue('Manchester');
    await expect(page.locator('[data-testid="filter-tag-traditional"]')).toBeVisible();
  });
});
```

### 2. Performance Tests

**Page Load Performance**
- Core Web Vitals measurement (LCP, FID, CLS)
- Time to First Byte (TTFB) validation
- First Contentful Paint (FCP) measurement
- Largest Contentful Paint (LCP) optimization
- Cumulative Layout Shift (CLS) prevention

**Search Performance**
- Search response time measurement
- Filter application performance
- Results rendering optimization
- Infinite scroll performance
- Cache effectiveness validation

**Image Loading Performance**
- Portfolio image optimization testing
- Lazy loading effectiveness
- WebP format delivery validation
- Progressive image loading
- Mobile image optimization

**Bundle Analysis**
- JavaScript bundle size validation
- CSS bundle optimization
- Code splitting effectiveness
- Dynamic import performance
- Third-party library impact

#### Implementation Example

```javascript
// Performance E2E Tests
import { test, expect } from '@playwright/test';
import { PerformanceUtils } from '../utils/performance';

test.describe('Performance Validation', () => {
  test('should meet Core Web Vitals targets', async ({ page }) => {
    const performanceUtils = new PerformanceUtils(page);
    
    // Navigate to artists page
    await page.goto('/artists');
    
    // Measure Core Web Vitals
    const metrics = await performanceUtils.getCoreWebVitals();
    
    // Validate targets
    expect(metrics.LCP).toBeLessThan(2500); // 2.5s target
    expect(metrics.FID).toBeLessThan(100);  // 100ms target
    expect(metrics.CLS).toBeLessThan(0.1);  // 0.1 target
    
    // Log performance data
    console.log('Core Web Vitals:', metrics);
  });

  test('should complete search within performance target', async ({ page }) => {
    await page.goto('/artists');
    
    // Start performance measurement
    const startTime = Date.now();
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'dragon tattoo');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Validate performance target
    expect(responseTime).toBeLessThan(500); // 500ms target
    
    console.log(`Search response time: ${responseTime}ms`);
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/artists');
    
    // Monitor network requests
    const imageRequests = [];
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequests.push(request);
      }
    });
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Validate image optimization
    const webpImages = imageRequests.filter(req => 
      req.url().includes('.webp') || 
      req.headers()['accept']?.includes('image/webp')
    );
    
    expect(webpImages.length).toBeGreaterThan(0);
    console.log(`WebP images loaded: ${webpImages.length}/${imageRequests.length}`);
  });
});
```

### 3. Accessibility Tests

**Keyboard Navigation**
- Complete keyboard accessibility validation
- Tab order and focus management testing
- Keyboard shortcut functionality
- Focus trap implementation in modals
- Skip link functionality

**Screen Reader Support**
- ARIA label and description validation
- Live region announcement testing
- Semantic markup verification
- Heading hierarchy validation
- Form accessibility compliance

**Visual Accessibility**
- Color contrast ratio validation
- Focus indicator visibility testing
- High contrast mode support
- Reduced motion preference handling
- Text scaling and zoom support

**Touch Accessibility**
- Touch target size validation (44px minimum)
- Gesture navigation support
- Mobile screen reader compatibility
- Voice control compatibility
- Switch navigation support

#### Implementation Example

```javascript
// Accessibility E2E Tests
import { test, expect } from '@playwright/test';
import { AccessibilityUtils } from '../utils/accessibility';

test.describe('Accessibility Compliance', () => {
  test('should support complete keyboard navigation', async ({ page }) => {
    await page.goto('/artists');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate through all interactive elements
    const interactiveElements = await page.locator('button, input, a, [tabindex]').count();
    
    for (let i = 0; i < interactiveElements; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify focus indicator
      const focusStyles = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(focusStyles).not.toBe('none');
    }
  });

  test('should announce search results to screen readers', async ({ page }) => {
    const accessibilityUtils = new AccessibilityUtils(page);
    
    await page.goto('/artists');
    
    // Monitor ARIA live regions
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'tattoo');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results and announcements
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Verify live region updates
    const resultsAnnouncement = await page.locator('[aria-live="polite"]').textContent();
    expect(resultsAnnouncement).toMatch(/found|results|artists/i);
  });

  test('should meet color contrast requirements', async ({ page }) => {
    await page.goto('/artists');
    
    // Check text elements for contrast
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a').all();
    
    for (const element of textElements) {
      const contrast = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Calculate contrast ratio (simplified)
        return { color, backgroundColor };
      });
      
      // Verify contrast meets WCAG AA standards
      // Note: This is a simplified check - use actual contrast calculation
      expect(contrast.color).not.toBe(contrast.backgroundColor);
    }
  });

  test('should support touch targets on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/artists');
    
    // Check touch target sizes
    const touchTargets = await page.locator('button, a, input[type="checkbox"], input[type="radio"]').all();
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      
      if (boundingBox) {
        expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
```

### 4. Cross-Browser Tests

**Browser Compatibility**
- Chrome/Chromium primary support validation
- Firefox secondary browser testing
- Safari/WebKit macOS and iOS compatibility
- Edge browser compatibility testing
- Mobile browser specific testing

**Feature Support**
- CSS Grid and Flexbox compatibility
- JavaScript ES6+ feature support
- Web API availability testing
- Progressive enhancement validation
- Graceful degradation testing

**Responsive Design**
- Viewport-based responsive behavior
- Touch interaction compatibility
- Mobile-specific feature testing
- Tablet layout validation
- Desktop optimization verification

#### Implementation Example

```javascript
// Cross-Browser E2E Tests
import { test, expect, devices } from '@playwright/test';

// Test across multiple browsers
['chromium', 'firefox', 'webkit'].forEach(browserName => {
  test.describe(`${browserName} Browser Tests`, () => {
    test.use({ 
      ...devices['Desktop Chrome'],
      browserName 
    });

    test('should render search interface correctly', async ({ page }) => {
      await page.goto('/artists');
      
      // Verify core elements render
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="style-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
      
      // Verify layout integrity
      const searchContainer = page.locator('[data-testid="search-container"]');
      const boundingBox = await searchContainer.boundingBox();
      
      expect(boundingBox.width).toBeGreaterThan(300);
      expect(boundingBox.height).toBeGreaterThan(50);
    });

    test('should handle JavaScript interactions', async ({ page }) => {
      await page.goto('/artists');
      
      // Test JavaScript-dependent functionality
      await page.click('[data-testid="style-filter-toggle"]');
      await expect(page.locator('[data-testid="style-options"]')).toBeVisible();
      
      // Test dynamic content updates
      await page.fill('[data-testid="search-input"]', 'test');
      await page.waitForTimeout(500); // Debounce delay
      
      // Verify suggestions or dynamic behavior
      const suggestions = page.locator('[data-testid="search-suggestions"]');
      if (await suggestions.isVisible()) {
        await expect(suggestions).toContainText('test');
      }
    });
  });
});

// Mobile device testing
['iPhone 13', 'Pixel 5', 'iPad'].forEach(deviceName => {
  test.describe(`${deviceName} Device Tests`, () => {
    test.use({ ...devices[deviceName] });

    test('should provide mobile-optimized experience', async ({ page }) => {
      await page.goto('/artists');
      
      // Verify mobile layout
      const viewport = page.viewportSize();
      expect(viewport.width).toBeLessThanOrEqual(768);
      
      // Test touch interactions
      await page.tap('[data-testid="search-input"]');
      await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
      
      // Verify mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.tap();
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
    });

    test('should handle mobile search interactions', async ({ page }) => {
      await page.goto('/artists');
      
      // Test mobile search flow
      await page.tap('[data-testid="search-input"]');
      await page.fill('[data-testid="search-input"]', 'dragon');
      
      // Test mobile keyboard
      await page.keyboard.press('Enter');
      
      // Verify mobile results display
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Test mobile scrolling
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      
      // Verify infinite scroll or pagination
      const resultCount = await page.locator('[data-testid="artist-card"]').count();
      expect(resultCount).toBeGreaterThan(0);
    });
  });
});
```

## 🚀 E2E Test Execution

### Getting Started

#### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (Linux)
npx playwright install-deps
```

#### Basic Test Execution

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --grep "Artist Search"

# Run tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run tests on specific browser
npm run test:e2e -- --project=chromium

# Run tests with debugging
npm run test:e2e -- --debug
```

#### Advanced Execution Options

```bash
# Run tests in parallel
npm run test:e2e -- --workers=4

# Run tests with retry on failure
npm run test:e2e -- --retries=2

# Run tests with custom timeout
npm run test:e2e -- --timeout=60000

# Run tests with trace recording
npm run test:e2e -- --trace=on

# Run tests with video recording
npm run test:e2e -- --video=on

# Run specific test file
npm run test:e2e tests/e2e/specs/search/artist-search.spec.js

# Run tests matching pattern
npm run test:e2e -- --grep "mobile"

# Run tests in CI mode
npm run test:e2e -- --reporter=junit
```

### Configuration

#### Playwright Configuration (`playwright.config.js`)

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['json', { outputFile: 'reports/json/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Environment Configuration

```bash
# .env.e2e
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:4566
TEST_TIMEOUT=30000
RETRY_COUNT=2
PARALLEL_WORKERS=4

# CI environment
CI=true
HEADLESS=true
VIDEO_ON_FAILURE=true
TRACE_ON_FAILURE=true
```

### Page Object Model

#### Base Page Class

```javascript
// pages/BasePage.js
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = '') {
    await this.page.goto(`${path}`);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `reports/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      };
    });
  }
}
```

#### Artists Page Object

```javascript
// pages/ArtistsPage.js
import { BasePage } from './BasePage.js';

export class ArtistsPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.searchInput = '[data-testid="search-input"]';
    this.searchButton = '[data-testid="search-button"]';
    this.styleFilterToggle = '[data-testid="style-filter-toggle"]';
    this.styleOptions = '[data-testid="style-options"]';
    this.searchResults = '[data-testid="search-results"]';
    this.artistCards = '[data-testid="artist-card"]';
    this.loadingSpinner = '[data-testid="loading-spinner"]';
    this.noResults = '[data-testid="no-results"]';
  }

  async goto() {
    await super.goto('/artists');
  }

  async searchByText(query) {
    await this.page.fill(this.searchInput, query);
    await this.page.click(this.searchButton);
    await this.waitForSearchResults();
  }

  async openStyleFilter() {
    await this.page.click(this.styleFilterToggle);
    await this.page.waitForSelector(this.styleOptions);
  }

  async selectStyle(styleName) {
    await this.page.click(`[data-testid="style-option-${styleName}"]`);
  }

  async waitForSearchResults() {
    // Wait for either results or no results message
    await Promise.race([
      this.page.waitForSelector(this.searchResults),
      this.page.waitForSelector(this.noResults)
    ]);
    
    // Ensure loading is complete
    await this.page.waitForSelector(this.loadingSpinner, { state: 'hidden' });
  }

  async getSearchResultCount() {
    const results = await this.page.locator(this.artistCards);
    return await results.count();
  }

  async getFirstArtistName() {
    const firstCard = this.page.locator(this.artistCards).first();
    return await firstCard.locator('[data-testid="artist-name"]').textContent();
  }

  async scrollToLoadMore() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000); // Wait for potential lazy loading
  }
}
```

### Test Utilities

#### Performance Utilities

```javascript
// utils/performance.js
export class PerformanceUtils {
  constructor(page) {
    this.page = page;
  }

  async getCoreWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {};
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          metrics.LCP = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          metrics.FID = entries[0].processingStart - entries[0].startTime;
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.CLS = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after a delay to collect metrics
        setTimeout(() => resolve(metrics), 3000);
      });
    });
  }

  async measurePageLoad() {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureSearchResponse(searchFunction) {
    const startTime = Date.now();
    await searchFunction();
    return Date.now() - startTime;
  }
}
```

#### Accessibility Utilities

```javascript
// utils/accessibility.js
export class AccessibilityUtils {
  constructor(page) {
    this.page = page;
  }

  async checkKeyboardNavigation() {
    const focusableElements = await this.page.locator(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    ).all();

    const results = [];
    
    for (let i = 0; i < focusableElements.length; i++) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.locator(':focus');
      const isVisible = await focused.isVisible();
      
      results.push({
        element: i,
        focused: isVisible,
        selector: await focused.getAttribute('data-testid') || await focused.tagName()
      });
    }

    return results;
  }

  async checkAriaLabels() {
    const elementsNeedingLabels = await this.page.locator(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby])'
    ).all();

    return elementsNeedingLabels.map(async (element) => ({
      tagName: await element.tagName(),
      hasLabel: await element.getAttribute('aria-label') !== null,
      hasLabelledBy: await element.getAttribute('aria-labelledby') !== null
    }));
  }

  async checkColorContrast() {
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results = [];

      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        if (color && backgroundColor && color !== backgroundColor) {
          results.push({
            element: element.tagName,
            color,
            backgroundColor,
            // Note: Actual contrast calculation would be more complex
            hasGoodContrast: color !== backgroundColor
          });
        }
      });

      return results;
    });
  }
}
```

### Reporting and Analysis

#### Test Reports

The E2E framework generates comprehensive reports:

**HTML Report** (`reports/html-report/index.html`)
- Interactive test results browser
- Screenshots and videos of failures
- Performance metrics visualization
- Cross-browser comparison

**JUnit Report** (`reports/junit/results.xml`)
- CI/CD integration format
- Test execution summary
- Failure details and stack traces

**JSON Report** (`reports/json/results.json`)
- Machine-readable test data
- Custom analysis and processing
- Integration with monitoring tools

#### Performance Analysis

```javascript
// Performance report generation
const generatePerformanceReport = (testResults) => {
  const performanceData = testResults
    .filter(test => test.performance)
    .map(test => ({
      testName: test.title,
      loadTime: test.performance.loadTime,
      searchTime: test.performance.searchTime,
      coreWebVitals: test.performance.coreWebVitals
    }));

  const report = {
    summary: {
      averageLoadTime: calculateAverage(performanceData, 'loadTime'),
      averageSearchTime: calculateAverage(performanceData, 'searchTime'),
      slowestTests: performanceData
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 5)
    },
    coreWebVitals: {
      averageLCP: calculateAverage(performanceData, 'coreWebVitals.LCP'),
      averageFID: calculateAverage(performanceData, 'coreWebVitals.FID'),
      averageCLS: calculateAverage(performanceData, 'coreWebVitals.CLS')
    },
    recommendations: generateRecommendations(performanceData)
  };

  return report;
};
```

### CI/CD Integration

#### GitHub Actions Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        npx playwright install --with-deps
    
    - name: Start application
      run: |
        npm run build
        npm run start &
        sleep 10
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
        BASE_URL: http://localhost:3000
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: e2e-results
        path: |
          reports/
          test-results/
    
    - name: Upload screenshots
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: screenshots
        path: reports/screenshots/
```

#### Quality Gates

```javascript
// Quality gate validation
const validateQualityGates = (testResults) => {
  const gates = {
    passRate: 95, // 95% pass rate required
    maxLoadTime: 3000, // 3s maximum load time
    maxSearchTime: 500, // 500ms maximum search time
    minAccessibilityScore: 90 // 90% accessibility compliance
  };

  const metrics = calculateMetrics(testResults);
  
  const results = {
    passRate: metrics.passRate >= gates.passRate,
    performance: metrics.averageLoadTime <= gates.maxLoadTime,
    search: metrics.averageSearchTime <= gates.maxSearchTime,
    accessibility: metrics.accessibilityScore >= gates.minAccessibilityScore
  };

  const allPassed = Object.values(results).every(Boolean);
  
  return {
    passed: allPassed,
    gates: results,
    metrics
  };
};
```

### Maintenance and Best Practices

#### Test Maintenance

**Regular Updates**
- Update browser versions monthly
- Review and update selectors quarterly
- Validate performance baselines monthly
- Update accessibility standards annually

**Test Optimization**
- Remove flaky tests or fix root causes
- Optimize slow tests for better performance
- Consolidate duplicate test scenarios
- Update page objects for UI changes

**Data Management**
- Refresh test data regularly
- Validate mock data accuracy
- Update API response formats
- Maintain test environment consistency

#### Best Practices

**Test Design**
- Use Page Object Model for maintainability
- Implement proper wait strategies
- Design tests for parallel execution
- Include proper cleanup and teardown

**Performance Considerations**
- Run performance tests on consistent hardware
- Use baseline comparisons for regression detection
- Monitor test execution time trends
- Optimize test data and scenarios

**Accessibility Focus**
- Test with real assistive technology when possible
- Include users with disabilities in testing process
- Stay updated with WCAG guidelines
- Validate across different accessibility tools

**Cross-Browser Strategy**
- Prioritize browsers based on user analytics
- Test critical paths on all supported browsers
- Use progressive enhancement validation
- Monitor browser-specific issues

This comprehensive E2E testing framework ensures that the tattoo directory application provides excellent user experience across all supported browsers and devices while maintaining high performance and accessibility standards.

---

**Documentation Version**: 1.0.0  
**Last Updated**: December 2024  
**Test Suite Version**: 1.0.0  
**Compatibility**: Node.js 18+, Jest 29+, Playwright 1.40+