# Component Integration API Reference

## Overview

This document provides a comprehensive API reference for all component integration utilities, configuration managers, and testing tools.

## Table of Contents

1. [Configuration Management API](#configuration-management-api)
2. [Component Composition API](#component-composition-api)
3. [Testing Utilities API](#testing-utilities-api)
4. [Design System Utilities API](#design-system-utilities-api)
5. [Type Definitions](#type-definitions)

## Configuration Management API

### EnhancedPageConfigManager

Manages configuration for enhanced page components with reactive updates.

#### Constructor

```typescript
new EnhancedPageConfigManager(pageType: string, initialConfig?: object)
```

**Parameters:**
- `pageType`: Page type ('artists', 'studios', 'styles')
- `initialConfig`: Optional initial configuration object

#### Methods

##### updateConfig(updates: object): void

Updates the configuration with new values.

```javascript
configManager.updateConfig({
  searchConfig: {
    enableAdvancedSearch: true,
    placeholder: 'New placeholder...'
  }
});
```

##### getConfig(): object

Returns the current complete configuration.

```javascript
const config = configManager.getConfig();
```

##### getConfigSection(section: string): object

Returns a specific configuration section.

```javascript
const searchConfig = configManager.getConfigSection('searchConfig');
```

##### subscribe(listener: function): function

Subscribes to configuration changes. Returns unsubscribe function.

```javascript
const unsubscribe = configManager.subscribe((newConfig) => {
  console.log('Config updated:', newConfig);
});

// Later...
unsubscribe();
```

##### validateConfig(): ValidationResult

Validates the current configuration.

```javascript
const validation = configManager.validateConfig();
// Returns: { isValid: boolean, errors: string[], warnings: string[] }
```

### createEnhancedPageConfig

Creates a standardized page configuration object.

```typescript
createEnhancedPageConfig(pageType: string, customConfig?: object): PageConfig
```

**Parameters:**
- `pageType`: Page type identifier
- `customConfig`: Custom configuration overrides

**Returns:** Complete page configuration object

**Example:**
```javascript
const config = createEnhancedPageConfig('artists', {
  searchConfig: {
    placeholder: 'Search artists...'
  }
});
```

## Component Composition API

### createIntegratedComponent

Creates a standardized component wrapper with consistent integration features.

```typescript
createIntegratedComponent(
  BaseComponent: React.Component,
  componentType: string,
  defaultProps?: object
): React.Component
```

**Parameters:**
- `BaseComponent`: The component to wrap
- `componentType`: Component type for configuration lookup
- `defaultProps`: Default props to apply

**Returns:** Enhanced component with integration features

**Example:**
```javascript
const IntegratedButton = createIntegratedComponent(Button, 'button', {
  useDesignTokens: true,
  shadowLevel: 'surface'
});
```

### ComponentComposer

Utility class for composing complex layouts with multiple components.

#### Constructor

```typescript
new ComponentComposer()
```

#### Methods

##### register(name: string, component: React.Component, config?: object): ComponentComposer

Registers a component for composition.

```javascript
composer.register('search', SearchComponent, {
  placeholder: 'Search...',
  enableAdvancedSearch: true
});
```

##### setLayout(layout: LayoutDefinition[]): ComponentComposer

Defines the layout structure.

```javascript
composer.setLayout([
  'search',
  { layout: ['filters', 'results'], className: 'main-content' }
]);
```

##### compose(props?: object): React.Component

Composes the final component based on registered components and layout.

```javascript
const ComposedPage = composer.compose({ additionalProp: 'value' });
```

### createPageComposer

Creates a page layout composer with standard sections pre-registered.

```typescript
createPageComposer(pageType: string): ComponentComposer
```

**Parameters:**
- `pageType`: Page type for default layout selection

**Returns:** Configured ComponentComposer instance

**Example:**
```javascript
const pageComposer = createPageComposer('artists');
const ArtistsPage = pageComposer.compose();
```

## Testing Utilities API

### ComponentIntegrationTester

Tests component integration consistency and compliance.

#### Constructor

```typescript
new ComponentIntegrationTester()
```

#### Methods

##### setGlobalConfig(config: object): void

Sets global configuration for all tests.

```javascript
tester.setGlobalConfig({
  enableAccessibilityTests: true,
  performanceThresholds: {
    renderTime: 100 // ms
  }
});
```

##### testComponent(Component: React.Component, props?: object, options?: TestOptions): Promise<TestResult>

Tests a component for integration compliance.

```javascript
const results = await tester.testComponent(ArtistCard, {
  artist: mockData,
  useDesignTokens: true
}, {
  testName: 'ArtistCard Integration Test'
});
```

**TestOptions:**
- `testName`: Optional test name for reporting

**TestResult:**
```typescript
{
  testName: string;
  timestamp: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    designSystemElements: number;
    accessibilityScore: number;
    // ... other metrics
  };
}
```

##### generateReport(): TestReport

Generates a comprehensive test report for all tested components.

```javascript
const report = tester.generateReport();
```

### CrossPageConsistencyTester

Tests consistency across multiple pages.

#### Constructor

```typescript
new CrossPageConsistencyTester()
```

#### Methods

##### addPageTest(pageName: string, pageComponent: React.Component, config: object): void

Adds a page test to the consistency test suite.

```javascript
consistencyTester.addPageTest('artists', ArtistsPage, artistsConfig);
```

##### runConsistencyTests(): Promise<ConsistencyTestResult>

Runs consistency tests across all registered pages.

```javascript
const results = await consistencyTester.runConsistencyTests();
```

**ConsistencyTestResult:**
```typescript
{
  pages: { [pageName: string]: TestResult };
  consistency: {
    designSystem: boolean;
    navigation: boolean;
    search: boolean;
    accessibility: boolean;
  };
  issues: string[];
}
```

### ComponentPerformanceTester

Tests component performance characteristics.

#### Constructor

```typescript
new ComponentPerformanceTester()
```

#### Methods

##### measureRenderPerformance(Component: React.Component, props?: object, iterations?: number): Promise<PerformanceResult>

Measures component render performance over multiple iterations.

```javascript
const performance = await performanceTester.measureRenderPerformance(
  StyleGallery,
  { maxImages: 50 },
  10
);
```

**PerformanceResult:**
```typescript
{
  average: number;
  min: number;
  max: number;
  measurements: number[];
}
```

##### testMemoryUsage(Component: React.Component, props?: object): Promise<MemoryResult>

Tests component memory usage patterns.

```javascript
const memoryUsage = await performanceTester.testMemoryUsage(StyleGallery, {
  maxImages: 100
});
```

**MemoryResult:**
```typescript
{
  initial: number;
  peak: number;
  final: number;
  increase: number;
  leaked: number;
}
```

### AccessibilityTester

Comprehensive accessibility testing utilities.

#### Constructor

```typescript
new AccessibilityTester()
```

#### Methods

##### testKeyboardNavigation(container: HTMLElement): Promise<KeyboardTestResult>

Tests keyboard navigation functionality.

```javascript
const keyboardResults = await accessibilityTester.testKeyboardNavigation(container);
```

**KeyboardTestResult:**
```typescript
{
  totalFocusableElements: number;
  keyboardAccessible: number;
  issues: string[];
}
```

##### testScreenReaderCompatibility(container: HTMLElement): Promise<ScreenReaderTestResult>

Tests screen reader compatibility.

```javascript
const screenReaderResults = await accessibilityTester.testScreenReaderCompatibility(container);
```

**ScreenReaderTestResult:**
```typescript
{
  ariaLabels: number;
  semanticElements: number;
  headingStructure: boolean;
  issues: string[];
}
```

### createComponentTestSuite

Creates a complete test suite for a component.

```typescript
createComponentTestSuite(
  Component: React.Component,
  defaultProps?: object
): ComponentTestSuite
```

**Returns:** ComponentTestSuite with `runFullTestSuite` method

**Example:**
```javascript
const testSuite = createComponentTestSuite(ArtistCard, {
  artist: mockArtistData
});

const results = await testSuite.runFullTestSuite({
  shadowLevel: 'floating'
});
```

## Design System Utilities API

### designSystemUtils

Collection of design system integration utilities.

#### Token Utilities

##### getDesignToken(tokenName: string, fallback?: string): string

Gets a design token value from CSS custom properties.

```javascript
const primaryColor = designSystemUtils.getDesignToken('color-primary-500', '#3B82F6');
```

##### setDesignToken(tokenName: string, value: string): void

Sets a design token value.

```javascript
designSystemUtils.setDesignToken('color-primary-500', '#1D4ED8');
```

##### getSemanticColor(colorName: string, shade?: string|number): string

Gets a semantic color token.

```javascript
const primaryColor = designSystemUtils.getSemanticColor('primary', 500);
```

#### Component Utilities

##### generateComponentClasses(config: object): string

Generates component class names based on design system patterns.

```javascript
const classes = designSystemUtils.generateComponentClasses({
  size: 'md',
  variant: 'primary',
  shadowLevel: 'raised'
});
// Returns: 'design-system-component size-md variant-primary shadow-elevation-raised'
```

##### applyVisualEffects(config: object): string

Applies visual effects based on configuration.

```javascript
const effectClasses = designSystemUtils.applyVisualEffects({
  enableGlassmorphism: true,
  glassVariant: 'card',
  enableGradientOverlays: true,
  gradientType: 'subtle'
});
```

##### createStandardizedComponent(componentType: string, defaultConfig?: object): function

Creates a standardized component hook.

```javascript
const useStandardizedButton = designSystemUtils.createStandardizedComponent('button', {
  shadowLevel: 'surface',
  useDesignTokens: true
});

// In component:
const buttonProps = useStandardizedButton(userProps);
```

#### Responsive Utilities

##### getCurrentBreakpoint(): string

Gets the current responsive breakpoint.

```javascript
const breakpoint = designSystemUtils.getCurrentBreakpoint();
// Returns: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

##### matchesBreakpoint(breakpoint: string): boolean

Checks if current viewport matches a breakpoint.

```javascript
const isMobile = designSystemUtils.matchesBreakpoint('sm');
```

##### generateResponsiveClasses(baseClass: string, responsiveValues: object): string

Generates responsive class names.

```javascript
const responsiveClasses = designSystemUtils.generateResponsiveClasses('grid-cols', {
  default: 1,
  md: 2,
  lg: 3,
  xl: 4
});
// Returns: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
```

#### Accessibility Utilities

##### generateA11yAttributes(config: object): object

Generates accessibility attributes based on configuration.

```javascript
const a11yAttributes = designSystemUtils.generateA11yAttributes({
  'aria-label': 'Close dialog',
  disabled: false,
  loading: true
});
// Returns: { 'aria-label': 'Close dialog', 'aria-busy': true }
```

##### prefersReducedMotion(): boolean

Checks if user prefers reduced motion.

```javascript
const reduceMotion = designSystemUtils.prefersReducedMotion();
```

##### prefersHighContrast(): boolean

Checks if user prefers high contrast.

```javascript
const highContrast = designSystemUtils.prefersHighContrast();
```

#### Theme Utilities

##### getCurrentTheme(): string

Gets the current theme mode.

```javascript
const theme = designSystemUtils.getCurrentTheme();
// Returns: 'light' | 'dark' | 'system'
```

##### setTheme(theme: string): void

Sets the theme mode.

```javascript
designSystemUtils.setTheme('dark');
```

##### getSystemTheme(): string

Gets the system theme preference.

```javascript
const systemTheme = designSystemUtils.getSystemTheme();
// Returns: 'light' | 'dark'
```

## Type Definitions

### PageConfig

```typescript
interface PageConfig {
  searchConfig: SearchConfig;
  navigationConfig: NavigationConfig;
  dataDisplayConfig: DataDisplayConfig;
  feedbackConfig: FeedbackConfig;
  visualEffectsConfig: VisualEffectsConfig;
  performanceConfig: PerformanceConfig;
}
```

### SearchConfig

```typescript
interface SearchConfig {
  enableAdvancedSearch: boolean;
  enableStyleFilter: boolean;
  enableLocationFilter: boolean;
  enableSavedSearches: boolean;
  enableRealTimeValidation: boolean;
  enableProgressIndicators: boolean;
  placeholder: string;
  suggestions: SearchSuggestion[];
  maxResults: number;
  debounceMs: number;
}
```

### NavigationConfig

```typescript
interface NavigationConfig {
  breadcrumbs: BreadcrumbItem[];
  contextualHelp: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'sidebar';
  };
  keyboardShortcuts: KeyboardShortcut[];
  gestureSupport: {
    enabled: boolean;
    swipeNavigation: boolean;
    pullToRefresh: boolean;
  };
  tooltipConfig: {
    delay: number;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
}
```

### DataDisplayConfig

```typescript
interface DataDisplayConfig {
  displayMode: 'grid' | 'list' | 'map' | 'gallery';
  cardType: 'artist' | 'studio' | 'style' | 'default';
  loadingState: {
    showSkeleton: boolean;
    showProgress: boolean;
  };
  emptyState: {
    variant: string;
    showSuggestions: boolean;
  };
  errorState: {
    showRecovery: boolean;
    showDetails: boolean;
  };
  pagination: {
    enabled: boolean;
    itemsPerPage: number;
  };
}
```

### VisualEffectsConfig

```typescript
interface VisualEffectsConfig {
  shadowLevel: 'flat' | 'surface' | 'raised' | 'floating' | 'premium';
  enableGlassmorphism: boolean;
  gradientOverlay: 'subtle' | 'medium' | 'hero';
  textureLevel: 'none' | 'subtle' | 'medium';
  animationLevel: 'none' | 'minimal' | 'standard' | 'enhanced';
}
```

### PerformanceConfig

```typescript
interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableInfiniteScroll: boolean;
  enableImageOptimization: boolean;
  enableSmartPreloading: boolean;
  connectionAware: boolean;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### TestResult

```typescript
interface TestResult {
  testName: string;
  timestamp: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    designSystemElements: number;
    accessibilityScore: number;
    responsiveElements: number;
    performanceScore: number;
  };
}
```

### LayoutDefinition

```typescript
type LayoutDefinition = 
  | string 
  | {
      component: string;
      props?: object;
    }
  | {
      layout: LayoutDefinition[];
      className?: string;
    };
```

## Usage Examples

### Complete Integration Example

```javascript
import {
  EnhancedPageConfigManager,
  createIntegratedComponent,
  ComponentIntegrationTester
} from '../utils/component-integration';

// 1. Create page configuration
const configManager = new EnhancedPageConfigManager('artists', {
  searchConfig: {
    placeholder: 'Search artists...',
    enableAdvancedSearch: true
  },
  visualEffectsConfig: {
    shadowLevel: 'floating',
    enableGlassmorphism: true
  }
});

// 2. Create integrated components
const IntegratedArtistCard = createIntegratedComponent(ArtistCard, 'card', {
  useDesignTokens: true,
  shadowLevel: 'raised'
});

// 3. Test integration
const tester = new ComponentIntegrationTester();
const testResults = await tester.testComponent(IntegratedArtistCard, {
  artist: mockArtistData
});

// 4. Use in page
const ArtistsPage = () => {
  const config = configManager.getConfig();
  
  return (
    <div className="artists-page">
      <SearchComponent {...config.searchConfig} />
      <div className="artists-grid">
        {artists.map(artist => (
          <IntegratedArtistCard 
            key={artist.id} 
            artist={artist}
            {...config.visualEffectsConfig}
          />
        ))}
      </div>
    </div>
  );
};
```

This API reference provides comprehensive documentation for all component integration utilities, enabling developers to effectively integrate enhanced components across the tattoo artist directory application.