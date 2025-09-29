# Component Integration Testing Guidelines

## Overview

This document provides comprehensive guidelines for testing component integration consistency, quality assurance, and cross-page functionality in the tattoo artist directory application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Integration Testing](#integration-testing)
3. [Accessibility Testing](#accessibility-testing)
4. [Performance Testing](#performance-testing)
5. [Cross-Page Consistency Testing](#cross-page-consistency-testing)
6. [Test Automation](#test-automation)
7. [Best Practices](#best-practices)

## Testing Strategy

### Testing Pyramid for Component Integration

```
    ┌─────────────────────┐
    │   E2E Tests         │  ← Cross-page workflows
    │   (Few, Slow)       │
    ├─────────────────────┤
    │   Integration Tests │  ← Component integration
    │   (Some, Medium)    │
    ├─────────────────────┤
    │   Unit Tests        │  ← Individual components
    │   (Many, Fast)      │
    └─────────────────────┘
```

### Test Categories

1. **Unit Tests**: Individual component functionality
2. **Integration Tests**: Component integration consistency
3. **Accessibility Tests**: WCAG 2.1 AA compliance
4. **Performance Tests**: Render performance and memory usage
5. **Cross-Page Tests**: Consistency across pages
6. **E2E Tests**: Complete user workflows

### Test Coverage Requirements

- **Component Integration**: 90%+ coverage for all enhanced components
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Performance**: All components under performance budgets
- **Cross-Page Consistency**: 95%+ consistency score across pages

## Integration Testing

### Component Integration Test Structure

```javascript
import { ComponentIntegrationTester } from '../utils/component-testing';
import { render, screen } from '@testing-library/react';

describe('ArtistCard Integration', () => {
  let tester;
  
  beforeEach(() => {
    tester = new ComponentIntegrationTester();
  });
  
  it('should integrate with design system', async () => {
    const results = await tester.testComponent(ArtistCard, {
      artist: mockArtistData,
      useDesignTokens: true,
      shadowLevel: 'raised'
    });
    
    expect(results.passed).toBe(true);
    expect(results.metrics.designSystemElements).toBeGreaterThan(0);
  });
  
  it('should meet accessibility standards', async () => {
    const results = await tester.testComponent(ArtistCard, {
      artist: mockArtistData,
      'aria-label': `View ${mockArtistData.name}'s profile`
    });
    
    expect(results.metrics.accessibilityScore).toBeGreaterThanOrEqual(90);
  });
  
  it('should have consistent visual effects', async () => {
    const results = await tester.testComponent(ArtistCard, {
      artist: mockArtistData,
      shadowLevel: 'floating',
      enableGlassmorphism: true
    });
    
    expect(results.warnings).not.toContain('Inconsistent visual effects');
  });
});
```

### Design System Integration Tests

```javascript
describe('Design System Integration', () => {
  it('should use consistent design tokens', () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        useDesignTokens={true}
      />
    );
    
    const component = container.querySelector('.design-system-component');
    expect(component).toBeInTheDocument();
    
    // Check for consistent class naming
    const classes = Array.from(component.classList);
    const sizeClasses = classes.filter(cls => cls.startsWith('size-'));
    expect(sizeClasses).toHaveLength(1);
  });
  
  it('should apply visual effects consistently', () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        shadowLevel="floating"
        enableGlassmorphism={true}
      />
    );
    
    const component = container.querySelector('.shadow-elevation-floating');
    expect(component).toBeInTheDocument();
    
    const glassComponent = container.querySelector('.glass-card');
    expect(glassComponent).toBeInTheDocument();
  });
  
  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        respectReducedMotion={true}
        animationLevel="enhanced"
      />
    );
    
    // Should not have animation classes when reduced motion is preferred
    const animatedElements = container.querySelectorAll('[class*="animate-"]');
    expect(animatedElements).toHaveLength(0);
  });
});
```

### Performance Integration Tests

```javascript
describe('Performance Integration', () => {
  it('should enable lazy loading when configured', () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        enableLazyLoading={true}
      />
    );
    
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });
  
  it('should use intersection observer for lazy loading', () => {
    const { container } = render(
      <StyleGallery 
        maxImages={50}
        enableIntersectionObserver={true}
      />
    );
    
    const observedElements = container.querySelectorAll('.intersection-observer');
    expect(observedElements.length).toBeGreaterThan(0);
  });
  
  it('should optimize images when enabled', () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        enableImageOptimization={true}
      />
    );
    
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      // Check for WebP support or responsive sizing
      expect(img.src).toMatch(/\.(webp|jpg|jpeg|png)$/);
    });
  });
});
```

## Accessibility Testing

### Automated Accessibility Tests

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Compliance', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        aria-label={`View ${mockArtistData.name}'s profile`}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', () => {
    const { container } = render(
      <ArtistCard 
        artist={mockArtistData}
        tabIndex={0}
      />
    );
    
    const focusableElement = container.querySelector('[tabindex="0"]');
    expect(focusableElement).toBeInTheDocument();
    
    focusableElement.focus();
    expect(document.activeElement).toBe(focusableElement);
  });
  
  it('should have proper ARIA attributes', () => {
    const { container } = render(
      <SearchComponent 
        placeholder="Search artists..."
        aria-label="Search for tattoo artists"
        aria-describedby="search-help"
      />
    );
    
    const searchInput = container.querySelector('input');
    expect(searchInput).toHaveAttribute('aria-label', 'Search for tattoo artists');
    expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
  });
});
```

### Manual Accessibility Testing Checklist

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements are focusable
  - [ ] Tab order is logical
  - [ ] Focus indicators are visible
  - [ ] Escape key closes modals/dropdowns

- [ ] **Screen Reader Support**
  - [ ] All images have alt text
  - [ ] Form inputs have labels
  - [ ] Headings are properly structured
  - [ ] ARIA landmarks are used

- [ ] **Color and Contrast**
  - [ ] Text contrast meets WCAG AA standards
  - [ ] Color is not the only way to convey information
  - [ ] Focus indicators have sufficient contrast

- [ ] **Responsive Design**
  - [ ] Content is accessible at 200% zoom
  - [ ] Touch targets are at least 44px
  - [ ] Content reflows properly

### Accessibility Testing with Real Assistive Technology

```javascript
describe('Screen Reader Compatibility', () => {
  it('should announce content changes', async () => {
    const announcements = [];
    
    // Mock screen reader announcements
    const mockAnnounce = jest.fn((message) => {
      announcements.push(message);
    });
    
    global.speechSynthesis = {
      speak: mockAnnounce
    };
    
    const { rerender } = render(
      <SearchResults 
        results={[]}
        loading={false}
      />
    );
    
    rerender(
      <SearchResults 
        results={mockResults}
        loading={false}
      />
    );
    
    expect(announcements).toContain('Search results updated');
  });
});
```

## Performance Testing

### Render Performance Tests

```javascript
import { ComponentPerformanceTester } from '../utils/component-testing';

describe('Component Performance', () => {
  let performanceTester;
  
  beforeEach(() => {
    performanceTester = new ComponentPerformanceTester();
  });
  
  it('should render within performance budget', async () => {
    const performance = await performanceTester.measureRenderPerformance(
      ArtistCard,
      { artist: mockArtistData },
      10 // iterations
    );
    
    expect(performance.average).toBeLessThan(50); // 50ms budget
    expect(performance.max).toBeLessThan(100); // 100ms max
  });
  
  it('should not leak memory', async () => {
    const memoryUsage = await performanceTester.testMemoryUsage(
      StyleGallery,
      { maxImages: 100 }
    );
    
    expect(memoryUsage.leaked).toBeLessThan(1024 * 1024); // 1MB leak threshold
  });
  
  it('should handle large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Artist ${i}`,
      avatar: `avatar-${i}.jpg`
    }));
    
    const startTime = performance.now();
    
    render(
      <ArtistGrid 
        artists={largeDataset}
        enableVirtualization={true}
      />
    );
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(200); // 200ms for large dataset
  });
});
```

### Performance Monitoring

```javascript
describe('Performance Monitoring', () => {
  it('should track Core Web Vitals', () => {
    const vitals = [];
    
    // Mock Web Vitals API
    global.PerformanceObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {
        // Simulate performance entries
        this.callback({
          getEntries: () => [
            { name: 'LCP', value: 1500 },
            { name: 'FID', value: 50 },
            { name: 'CLS', value: 0.05 }
          ]
        });
      }
    };
    
    render(<ArtistCard artist={mockArtistData} />);
    
    // Verify performance metrics are within thresholds
    expect(vitals.find(v => v.name === 'LCP')?.value).toBeLessThan(2500);
    expect(vitals.find(v => v.name === 'FID')?.value).toBeLessThan(100);
    expect(vitals.find(v => v.name === 'CLS')?.value).toBeLessThan(0.1);
  });
});
```

## Cross-Page Consistency Testing

### Consistency Test Suite

```javascript
import { CrossPageConsistencyTester } from '../utils/component-testing';

describe('Cross-Page Consistency', () => {
  let consistencyTester;
  
  beforeEach(() => {
    consistencyTester = new CrossPageConsistencyTester();
  });
  
  it('should maintain design system consistency across pages', async () => {
    consistencyTester.addPageTest('artists', ArtistsPage, artistsConfig);
    consistencyTester.addPageTest('studios', StudiosPage, studiosConfig);
    consistencyTester.addPageTest('styles', StylesPage, stylesConfig);
    
    const results = await consistencyTester.runConsistencyTests();
    
    expect(results.consistency.designSystem).toBe(true);
    expect(results.issues).toHaveLength(0);
  });
  
  it('should have consistent search interfaces', async () => {
    const searchComponents = [
      { page: 'artists', component: ArtistsSearchComponent },
      { page: 'studios', component: StudiosSearchComponent },
      { page: 'styles', component: StylesSearchComponent }
    ];
    
    const searchProps = searchComponents.map(({ component }) => {
      const { container } = render(<component />);
      const searchInput = container.querySelector('input[type="search"]');
      return {
        placeholder: searchInput?.placeholder,
        className: searchInput?.className,
        ariaLabel: searchInput?.getAttribute('aria-label')
      };
    });
    
    // Check consistency
    const placeholders = searchProps.map(p => p.placeholder);
    const classNames = searchProps.map(p => p.className);
    
    expect(new Set(classNames).size).toBe(1); // All should have same classes
  });
  
  it('should have consistent navigation patterns', () => {
    const pages = [ArtistsPage, StudiosPage, StylesPage];
    
    pages.forEach(PageComponent => {
      const { container } = render(<PageComponent />);
      
      // Check for consistent navigation elements
      const breadcrumbs = container.querySelector('.breadcrumbs');
      const navigation = container.querySelector('nav');
      const helpButton = container.querySelector('[aria-label*="help"]');
      
      expect(breadcrumbs).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
      expect(helpButton).toBeInTheDocument();
    });
  });
});
```

### Visual Regression Testing

```javascript
describe('Visual Regression', () => {
  it('should maintain consistent visual appearance', async () => {
    const pages = ['artists', 'studios', 'styles'];
    
    for (const pageType of pages) {
      const PageComponent = getPageComponent(pageType);
      const { container } = render(<PageComponent />);
      
      // Take screenshot (using a tool like Puppeteer or Playwright)
      const screenshot = await takeScreenshot(container);
      
      // Compare with baseline
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: `${pageType}-page`,
        threshold: 0.1 // 10% difference threshold
      });
    }
  });
});
```

## Test Automation

### Continuous Integration Setup

```yaml
# .github/workflows/component-integration-tests.yml
name: Component Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration:integration
      
      - name: Run accessibility tests
        run: npm run test:integration:a11y
      
      - name: Run performance tests
        run: npm run test:integration:performance
      
      - name: Run cross-page consistency tests
        run: npm run test:integration:consistency
      
      - name: Generate test report
        run: npm run test:integration:report
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Test Scripts Configuration

```json
{
  "scripts": {
    "test:integration": "jest --config=jest.integration.config.js",
    "test:a11y": "jest --config=jest.accessibility.config.js",
    "test:performance": "jest --config=jest.performance.config.js",
    "test:consistency": "jest --config=jest.consistency.config.js",
    "test:report": "node scripts/generate-test-report.js",
    "test:watch": "jest --watch --config=jest.integration.config.js"
  }
}
```

### Jest Configuration for Integration Tests

```javascript
// jest.integration.config.js
module.exports = {
  displayName: 'Integration Tests',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  setupFilesAfterEnv: [
    '<rootDir>/src/design-system/utils/test-setup.js'
  ],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/design-system/**/*.{js,jsx}',
    'src/app/components/**/*.{js,jsx}',
    '!**/*.test.{js,jsx}',
    '!**/node_modules/**'
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

### Test Setup File

```javascript
// src/design-system/utils/test-setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Setup performance mocks
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now())
};
```

## Best Practices

### 1. Test Organization

- **Group related tests**: Organize tests by component type and functionality
- **Use descriptive names**: Test names should clearly describe what is being tested
- **Follow AAA pattern**: Arrange, Act, Assert in each test
- **Keep tests focused**: Each test should verify one specific behavior

### 2. Test Data Management

```javascript
// Use factories for consistent test data
const createMockArtist = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  avatar: 'avatar.jpg',
  styles: ['traditional', 'realism'],
  rating: 4.5,
  reviewCount: 123,
  ...overrides
});

// Use realistic data
const mockArtistData = createMockArtist({
  name: 'Sarah Johnson',
  styles: ['watercolor', 'geometric']
});
```

### 3. Async Testing

```javascript
// Always use async/await for async operations
it('should load data asynchronously', async () => {
  const { findByText } = render(<ArtistCard artist={mockArtistData} />);
  
  const artistName = await findByText(mockArtistData.name);
  expect(artistName).toBeInTheDocument();
});

// Use waitFor for complex async scenarios
it('should update after configuration change', async () => {
  const configManager = new EnhancedPageConfigManager('artists');
  
  render(<ArtistsPage configManager={configManager} />);
  
  configManager.updateConfig({
    visualEffectsConfig: { shadowLevel: 'floating' }
  });
  
  await waitFor(() => {
    const floatingElements = screen.getAllByRole('article');
    expect(floatingElements[0]).toHaveClass('shadow-elevation-floating');
  });
});
```

### 4. Error Testing

```javascript
// Test error boundaries and error states
it('should handle component errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  const { container } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(container).toHaveTextContent('Something went wrong');
});

// Test error recovery
it('should allow error recovery', async () => {
  const onRetry = jest.fn();
  
  render(
    <ErrorDisplay 
      error="Network error"
      onRetry={onRetry}
    />
  );
  
  const retryButton = screen.getByRole('button', { name: /retry/i });
  fireEvent.click(retryButton);
  
  expect(onRetry).toHaveBeenCalled();
});
```

### 5. Performance Testing Best Practices

- **Use realistic data sizes**: Test with data similar to production
- **Test on different devices**: Include mobile and desktop scenarios
- **Monitor memory usage**: Check for memory leaks in long-running tests
- **Set performance budgets**: Define clear performance thresholds

### 6. Accessibility Testing Best Practices

- **Test with real assistive technology**: Use screen readers when possible
- **Include keyboard-only testing**: Test all functionality without a mouse
- **Test color contrast**: Verify contrast ratios meet WCAG standards
- **Test responsive design**: Ensure accessibility at different screen sizes

### 7. Continuous Improvement

- **Regular test reviews**: Review and update tests as components evolve
- **Performance monitoring**: Track test performance and optimize slow tests
- **Coverage analysis**: Regularly review coverage reports and improve gaps
- **User feedback integration**: Incorporate real user issues into test scenarios

This comprehensive testing strategy ensures that component integration maintains high quality, consistency, and accessibility standards across the entire tattoo artist directory application.