# Frontend E2E Testing Framework

Comprehensive end-to-end testing framework for the Tattoo Directory MVP frontend application using Playwright.

## Overview

This E2E testing suite ensures the frontend application works correctly from a user's perspective, testing complete user workflows across different browsers and devices.

## Framework Architecture

```
tests/e2e/
├── fixtures/           # Test data and setup utilities
├── pages/             # Page Object Model classes
├── specs/             # Test specifications
├── utils/             # Helper utilities
├── config/            # Test configurations
└── reports/           # Test execution reports
```

## Test Categories

### Core User Flows
- **Artist Search**: Location-based and filter-based search
- **Artist Profiles**: Profile viewing and interaction
- **Map Navigation**: Interactive map usage
- **Mobile Experience**: Touch interactions and responsive design

### Performance Tests
- **Page Load Times**: Core Web Vitals measurement
- **Search Performance**: Search response time validation
- **Image Loading**: Portfolio image optimization testing
- **Bundle Size**: JavaScript bundle analysis

### Accessibility Tests
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: ARIA compliance and screen reader support
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Proper focus handling

### Cross-Browser Tests
- **Chrome/Chromium**: Primary browser support
- **Firefox**: Secondary browser support
- **Safari/WebKit**: macOS and iOS compatibility
- **Mobile Browsers**: iOS Safari and Android Chrome

## Getting Started

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

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

---

*This E2E testing framework ensures comprehensive coverage of user workflows and maintains high quality standards.*
