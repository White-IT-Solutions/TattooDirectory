# End-to-End (E2E) Testing with Puppeteer

This directory contains comprehensive end-to-end tests for the Tattoo Artist Directory MVP using Puppeteer. The tests verify complete user workflows, frontend-backend integration, and visual consistency.

## Overview

The E2E test suite includes:

- **Workflow Tests**: Complete user journeys (search, view artist profiles)
- **Integration Tests**: Frontend-backend communication and data consistency
- **Visual Regression Tests**: UI component consistency and responsive design
- **Performance Tests**: Load times and user experience metrics

## Prerequisites

1. **Local Environment Running**: Ensure your local Docker environment is running
   ```bash
   npm run local:start
   ```

2. **Node.js**: Version 18+ required
3. **Docker**: For running the local test environment

## Installation

1. Navigate to the E2E test directory:
   ```bash
   cd tests/e2e
   ```

2. Install dependencies:
   ```bash
   npm run setup
   ```

## Running Tests

### All E2E Tests
```bash
npm test
```

### Specific Test Categories
```bash
# Workflow tests only
npm run test:workflows

# Visual regression tests only
npm run test:visual

# Integration tests only
npm run test:integration
```

### Development Mode
```bash
# Run tests with browser visible (non-headless)
HEADLESS=false npm test

# Run tests with debug output
DEBUG=true npm test

# Watch mode for development
npm run test:watch
```

## Test Structure

```
tests/e2e/
├── config/
│   └── test-config.js          # Test configuration and selectors
├── setup/
│   ├── test-setup.js           # Common test utilities
│   ├── visual-testing.js       # Visual regression utilities
│   ├── install-dependencies.js # Setup script
│   └── cleanup.js              # Cleanup script
├── tests/
│   ├── workflows/              # User workflow tests
│   │   ├── search-workflow.test.js
│   │   └── artist-profile.test.js
│   ├── integration/            # Frontend-backend integration
│   │   └── frontend-backend.test.js
│   └── visual/                 # Visual regression tests
│       └── ui-components.test.js
├── screenshots/                # Visual test artifacts
│   ├── baseline/              # Baseline images
│   └── diff/                  # Difference images
└── package.json               # E2E test dependencies
```

## Test Configuration

### Environment Variables

- `HEADLESS`: Set to `false` to run browser in visible mode
- `DEBUG`: Set to `true` for verbose logging
- `FRONTEND_URL`: Override frontend URL (default: http://localhost:3000)
- `BACKEND_URL`: Override backend URL (default: http://localhost:9000)

### Test Selectors

All UI element selectors are defined in `config/test-config.js`. Update this file when UI elements change:

```javascript
selectors: {
  searchInput: '[data-testid="search-input"]',
  searchButton: '[data-testid="search-button"]',
  artistCard: '[data-testid="artist-card"]',
  // ... more selectors
}
```

## Visual Regression Testing

### How It Works

1. **Baseline Creation**: First run creates baseline screenshots
2. **Comparison**: Subsequent runs compare against baselines
3. **Difference Detection**: Highlights visual changes with diff images
4. **Reporting**: Generates HTML report with visual comparisons

### Managing Baselines

```bash
# Update all baselines (run after intentional UI changes)
UPDATE_BASELINES=true npm run test:visual

# Clean up old diff images
npm run clean
```

### Visual Test Reports

After running visual tests, check the generated report:
```
tests/e2e/screenshots/visual-test-report.html
```

## Writing New Tests

### Workflow Test Example

```javascript
const { expect } = require('chai');
const TestSetup = require('../../setup/test-setup');
const config = require('../../config/test-config');

describe('My New Workflow', function() {
  let testSetup;
  let page;

  before(async function() {
    testSetup = new TestSetup();
    await testSetup.waitForServices();
    const { page: browserPage } = await testSetup.initBrowser();
    page = browserPage;
  });

  after(async function() {
    await testSetup.cleanup();
  });

  it('should complete my workflow', async function() {
    await testSetup.navigateToPage(config.urls.frontend);
    
    // Your test steps here
    await testSetup.typeText(config.selectors.searchInput, 'test');
    await testSetup.clickElement(config.selectors.searchButton);
    
    // Assertions
    const results = await testSetup.elementExists(config.selectors.searchResults);
    expect(results).to.be.true;
  });
});
```

### Visual Test Example

```javascript
const VisualTesting = require('../../setup/visual-testing');

// In your test
const visualTesting = new VisualTesting();
await visualTesting.init();

const screenshotPath = await testSetup.takeScreenshot('my-component');
const result = await visualTesting.compareScreenshot(screenshotPath, 'my-component');

expect(result.match || result.isNewBaseline).to.be.true;
```

## Best Practices

### Test Data

- Use consistent test data defined in `config/test-config.js`
- Don't rely on specific artist names that might change
- Test with various search terms and filters

### Selectors

- Always use `data-testid` attributes for test selectors
- Avoid CSS class names or IDs that might change
- Keep selectors in the config file for easy maintenance

### Assertions

- Test user-visible behavior, not implementation details
- Use meaningful error messages in assertions
- Test both positive and negative scenarios

### Performance

- Set appropriate timeouts for different operations
- Use `waitForElement` instead of fixed delays
- Monitor test execution time and optimize slow tests

## Troubleshooting

### Common Issues

1. **Services Not Ready**
   ```bash
   # Ensure local environment is running
   npm run local:health
   ```

2. **Puppeteer Installation Issues**
   ```bash
   # Reinstall Puppeteer
   npm run setup
   ```

3. **Visual Test Failures**
   - Check if UI changes are intentional
   - Update baselines if changes are expected
   - Review diff images in `screenshots/diff/`

4. **Timeout Errors**
   - Increase timeouts in `config/test-config.js`
   - Check if services are responding slowly
   - Verify network connectivity

### Debug Mode

Run tests in debug mode for detailed logging:
```bash
DEBUG=true HEADLESS=false npm test
```

This will:
- Show browser window
- Log all network requests
- Display console messages
- Provide detailed error information

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: |
    npm run local:start
    cd tests/e2e
    npm run setup
    npm test
    npm run clean
```

### Test Reports

E2E tests generate several reports:
- **Mocha Test Results**: Console output with pass/fail status
- **Visual Regression Report**: HTML report with image comparisons
- **Coverage Reports**: If enabled, code coverage from E2E tests

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep Puppeteer and test dependencies current
2. **Review Baselines**: Periodically review and update visual baselines
3. **Clean Artifacts**: Regularly clean up old screenshots and reports
4. **Monitor Performance**: Track test execution times and optimize

### When UI Changes

1. Run visual tests to identify changes
2. Review diff images to verify changes are correct
3. Update baselines for intentional changes
4. Update selectors if elements changed

## Contributing

When adding new E2E tests:

1. Follow the existing test structure and patterns
2. Add appropriate `data-testid` attributes to UI elements
3. Update selectors in `config/test-config.js`
4. Include both positive and negative test cases
5. Add visual regression tests for new UI components
6. Document any new test utilities or patterns