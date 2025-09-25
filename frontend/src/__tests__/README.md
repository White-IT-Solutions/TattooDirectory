# Comprehensive Component Integration Tests

This directory contains the comprehensive test suite for validating component integration, cross-page consistency, accessibility compliance, and visual regression testing across the tattoo artist directory application.

## Overview

The test suite implements **Task 19** from the component integration consolidation specification, providing:

1. **Integration tests** for all enhanced component implementations
2. **Cross-page consistency validation** tests
3. **Accessibility compliance testing** with axe-core
4. **Visual regression tests** for design system consistency

## Test Structure

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
└── README.md                              # This documentation
```

## Requirements Coverage

### Requirement 11.1: Component Integration Testing
- ✅ Integration tests for all enhanced component implementations
- ✅ Cross-page consistency validation tests
- ✅ Component composition testing
- ✅ State management validation
- ✅ Error handling verification

### Requirement 11.2: Quality Assurance
- ✅ Accessibility compliance testing with axe-core
- ✅ Visual regression tests for design system consistency
- ✅ Performance optimization validation
- ✅ Cross-browser compatibility testing
- ✅ Mobile responsiveness validation

## Test Suites

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

## Running Tests

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

## Test Configuration

### Jest Configuration

The test suite uses custom Jest configuration optimized for integration testing:

```javascript
{
  testTimeout: 30000,
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/setup/testSetup.js'
  ],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  }
}
```

### Dependencies

Required testing dependencies:

- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jest-axe` - Accessibility testing with axe-core
- `@axe-core/react` - React-specific accessibility testing

## Test Utilities

### Accessibility Testing

```javascript
import { testUtils } from '../setup/testSetup';

// Check ARIA attributes
testUtils.accessibility.checkAriaAttributes(element, ['aria-label', 'aria-describedby']);

// Validate heading hierarchy
testUtils.accessibility.checkHeadingHierarchy(container);

// Test focus management
await testUtils.accessibility.checkFocusManagement(user, focusableElements);
```

### Visual Testing

```javascript
// Check class consistency
testUtils.visual.checkClassConsistency(elements, ['btn-primary', 'shadow-raised']);

// Validate responsive classes
testUtils.visual.checkResponsiveClasses(element, [
  { breakpoint: 'sm', classes: ['block'] },
  { breakpoint: 'md', classes: ['flex'] }
]);
```

### Performance Testing

```javascript
// Mock lazy loading
const mockObserver = testUtils.performance.mockLazyLoading();

// Mock performance observer
const perfObserver = testUtils.performance.mockPerformanceObserver();
```

### Cross-Page Testing

```javascript
// Test page consistency
testUtils.crossPage.testPageConsistency(pageComponents, consistencyChecks);

// Test navigation consistency
testUtils.crossPage.testNavigationConsistency(pages);
```

## Mocking Strategy

### Global Mocks

- **Next.js Router**: Navigation and routing functionality
- **Next.js Image**: Optimized image component
- **IntersectionObserver**: Lazy loading and viewport detection
- **ResizeObserver**: Responsive behavior testing
- **matchMedia**: Media query and responsive testing

### Component Mocks

- **CSS Custom Properties**: Design system token values
- **Performance APIs**: Performance measurement and optimization
- **Device APIs**: Touch, gesture, and capability detection

## Coverage Requirements

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

## Continuous Integration

### CI/CD Integration

The test suite is designed for CI/CD environments:

```bash
# CI-optimized test run
CI=true npm run test:integration -- --ci --coverage

# Generate coverage reports for CI
npm run test:integration -- --coverage-only
```

### Quality Gates

Tests serve as quality gates for:

- **Component Integration**: Ensure all enhanced components work together
- **Design Consistency**: Maintain visual and interaction standards
- **Accessibility Compliance**: Meet WCAG 2.1 AA requirements
- **Performance Standards**: Validate optimization implementations

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout for complex integration tests
2. **Mock Failures**: Ensure all required mocks are properly configured
3. **Accessibility Violations**: Check ARIA attributes and semantic markup
4. **Visual Inconsistencies**: Verify CSS class applications and design tokens

### Debug Mode

```bash
# Run tests with verbose output
npm run test:integration -- --verbose

# Run specific test file for debugging
npx jest __tests__/integration/ComponentIntegration.test.jsx --verbose
```

### Performance Debugging

```bash
# Run with performance profiling
npm run test:integration -- --detectOpenHandles --forceExit
```

## Contributing

### Adding New Tests

1. **Component Tests**: Add to `ComponentIntegration.test.jsx`
2. **Page Tests**: Add to `CrossPageConsistency.test.jsx`
3. **Accessibility Tests**: Add to `AccessibilityCompliance.test.jsx`
4. **Visual Tests**: Add to `VisualRegression.test.jsx`

### Test Guidelines

- Use descriptive test names that explain the behavior being tested
- Group related tests using `describe` blocks
- Include both positive and negative test cases
- Mock external dependencies appropriately
- Follow the AAA pattern (Arrange, Act, Assert)

### Code Review Checklist

- [ ] Tests cover all new component functionality
- [ ] Accessibility tests include ARIA and keyboard navigation
- [ ] Visual tests validate design system consistency
- [ ] Cross-page tests ensure uniform implementation
- [ ] Mocks are properly configured and realistic
- [ ] Test names are descriptive and clear
- [ ] Coverage thresholds are maintained

## Results and Reporting

### Test Output

The test runner provides comprehensive reporting:

- **Suite Summary**: Pass/fail status for each test suite
- **Coverage Report**: Detailed coverage metrics and reports
- **Accessibility Report**: WCAG compliance violations and fixes
- **Performance Metrics**: Optimization validation results

### Coverage Reports

Generated coverage reports include:

- **HTML Report**: Interactive coverage browser (`coverage/lcov-report/index.html`)
- **Text Summary**: Console coverage summary
- **LCOV Data**: Machine-readable coverage data for CI integration

### Accessibility Reports

Accessibility testing provides:

- **Violation Details**: Specific WCAG violations with element references
- **Remediation Guidance**: Suggested fixes for accessibility issues
- **Compliance Score**: Overall accessibility compliance percentage

This comprehensive test suite ensures that all enhanced components are properly integrated, maintain consistency across pages, meet accessibility standards, and preserve visual design system integrity throughout the tattoo artist directory application.