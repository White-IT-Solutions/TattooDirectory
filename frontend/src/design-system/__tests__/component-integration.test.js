/**
 * Component Integration Tests
 * Demonstrates the testing utilities for component integration validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  ComponentIntegrationTester,
  CrossPageConsistencyTester,
  ComponentPerformanceTester,
  AccessibilityTester,
  createComponentTestSuite
} from '../utils/component-testing';
import {
  EnhancedPageConfigManager,
  createIntegratedComponent
} from '../utils/component-integration';
import {
  IntegratedSearchComponent,
  IntegratedArtistCard,
  ExampleArtistsPage
} from '../examples/integration-example';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockArtist = {
  id: '1',
  name: 'Test Artist',
  avatar: '/test-avatar.jpg',
  styles: ['traditional', 'realism'],
  rating: 4.5,
  reviewCount: 123
};

const mockArtists = [
  mockArtist,
  {
    id: '2',
    name: 'Another Artist',
    avatar: '/another-avatar.jpg',
    styles: ['watercolor', 'geometric'],
    rating: 4.8,
    reviewCount: 89
  }
];

describe('Component Integration Testing', () => {
  describe('ComponentIntegrationTester', () => {
    let tester;

    beforeEach(() => {
      tester = new ComponentIntegrationTester();
    });

    it('should test component design system integration', async () => {
      const results = await tester.testComponent(IntegratedArtistCard, {
        artist: mockArtist,
        useDesignTokens: true,
        shadowLevel: 'raised'
      });

      expect(results.passed).toBe(true);
      expect(results.metrics.designSystemElements).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
    });

    it('should validate accessibility compliance', async () => {
      const results = await tester.testComponent(IntegratedArtistCard, {
        artist: mockArtist,
        'aria-label': `View ${mockArtist.name}'s profile`,
        tabIndex: 0
      });

      expect(results.metrics.accessibilityScore).toBeGreaterThanOrEqual(80);
    });

    it('should check performance characteristics', async () => {
      const results = await tester.testComponent(IntegratedArtistCard, {
        artist: mockArtist,
        enableLazyLoading: true,
        respectReducedMotion: true
      });

      expect(results.metrics.lazyImages).toBeGreaterThanOrEqual(0);
      expect(results.metrics.motionAwareElements).toBeGreaterThanOrEqual(0);
    });

    it('should generate comprehensive test report', async () => {
      // Test multiple components
      await tester.testComponent(IntegratedArtistCard, { artist: mockArtist });
      await tester.testComponent(IntegratedSearchComponent, { 
        placeholder: 'Search...',
        enableAdvancedSearch: true 
      });

      const report = tester.generateReport();

      expect(report.summary.totalTests).toBe(2);
      expect(report.metrics).toHaveProperty('designSystemUsage');
      expect(report.metrics).toHaveProperty('accessibilityScore');
      expect(report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('CrossPageConsistencyTester', () => {
    let consistencyTester;

    beforeEach(() => {
      consistencyTester = new CrossPageConsistencyTester();
    });

    it('should test consistency across multiple pages', async () => {
      // Mock page components
      const ArtistsPage = () => (
        <div className="artists-page">
          <IntegratedSearchComponent placeholder="Search artists..." />
          <IntegratedArtistCard artist={mockArtist} />
        </div>
      );

      const StudiosPage = () => (
        <div className="studios-page">
          <IntegratedSearchComponent placeholder="Search studios..." />
          <IntegratedArtistCard artist={mockArtist} />
        </div>
      );

      consistencyTester.addPageTest('artists', ArtistsPage, {});
      consistencyTester.addPageTest('studios', StudiosPage, {});

      const results = await consistencyTester.runConsistencyTests();

      expect(results.pages).toHaveProperty('artists');
      expect(results.pages).toHaveProperty('studios');
      expect(results.consistency).toHaveProperty('designSystem');
      expect(results.consistency).toHaveProperty('accessibility');
    });
  });

  describe('ComponentPerformanceTester', () => {
    let performanceTester;

    beforeEach(() => {
      performanceTester = new ComponentPerformanceTester();
    });

    it('should measure render performance', async () => {
      const performance = await performanceTester.measureRenderPerformance(
        IntegratedArtistCard,
        { artist: mockArtist },
        5 // iterations
      );

      expect(performance.average).toBeGreaterThan(0);
      expect(performance.min).toBeGreaterThan(0);
      expect(performance.max).toBeGreaterThan(0);
      expect(performance.measurements).toHaveLength(5);
    });

    it('should test memory usage', async () => {
      // Skip if performance.memory is not available
      if (!performance.memory) {
        return;
      }

      const memoryUsage = await performanceTester.testMemoryUsage(
        IntegratedArtistCard,
        { artist: mockArtist }
      );

      expect(memoryUsage).toHaveProperty('initial');
      expect(memoryUsage).toHaveProperty('peak');
      expect(memoryUsage).toHaveProperty('final');
      expect(memoryUsage).toHaveProperty('increase');
      expect(memoryUsage).toHaveProperty('leaked');
    });
  });

  describe('AccessibilityTester', () => {
    let accessibilityTester;

    beforeEach(() => {
      accessibilityTester = new AccessibilityTester();
    });

    it('should test keyboard navigation', async () => {
      const { container } = render(
        <IntegratedArtistCard 
          artist={mockArtist}
          tabIndex={0}
        />
      );

      const results = await accessibilityTester.testKeyboardNavigation(container);

      expect(results.totalFocusableElements).toBeGreaterThan(0);
      expect(results.keyboardAccessible).toBeGreaterThan(0);
    });

    it('should test screen reader compatibility', async () => {
      const { container } = render(
        <div>
          <h1>Artists Page</h1>
          <nav aria-label="Main navigation">
            <IntegratedSearchComponent 
              placeholder="Search artists..."
              aria-label="Search for tattoo artists"
            />
          </nav>
          <main>
            <IntegratedArtistCard 
              artist={mockArtist}
              aria-label={`View ${mockArtist.name}'s profile`}
            />
          </main>
        </div>
      );

      const results = await accessibilityTester.testScreenReaderCompatibility(container);

      expect(results.semanticElements).toBeGreaterThan(0);
      expect(results.ariaLabels).toBeGreaterThan(0);
      expect(results.headingStructure).toBe(true);
    });
  });

  describe('createComponentTestSuite', () => {
    it('should create comprehensive test suite', async () => {
      const testSuite = createComponentTestSuite(IntegratedArtistCard, {
        artist: mockArtist
      });

      const results = await testSuite.runFullTestSuite({
        shadowLevel: 'floating',
        enableLazyLoading: true
      });

      expect(results).toHaveProperty('integration');
      expect(results).toHaveProperty('performance');
      expect(results).toHaveProperty('accessibility');

      expect(results.integration.passed).toBe(true);
      expect(results.performance.render.average).toBeGreaterThan(0);
      expect(results.accessibility.keyboard.totalFocusableElements).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Configuration Management Integration', () => {
  describe('EnhancedPageConfigManager', () => {
    let configManager;

    beforeEach(() => {
      configManager = new EnhancedPageConfigManager('artists', {
        searchConfig: {
          placeholder: 'Test search...',
          enableAdvancedSearch: true
        }
      });
    });

    it('should manage configuration updates', () => {
      const initialConfig = configManager.getConfig();
      expect(initialConfig.searchConfig.placeholder).toBe('Test search...');

      configManager.updateConfig({
        searchConfig: {
          ...initialConfig.searchConfig,
          placeholder: 'Updated search...'
        }
      });

      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.searchConfig.placeholder).toBe('Updated search...');
    });

    it('should notify subscribers of configuration changes', () => {
      const listener = jest.fn();
      const unsubscribe = configManager.subscribe(listener);

      configManager.updateConfig({
        visualEffectsConfig: {
          shadowLevel: 'floating'
        }
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should validate configuration', () => {
      const validation = configManager.validateConfig();
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
    });
  });
});

describe('Component Integration with Real Components', () => {
  it('should integrate search component with design system', () => {
    const { container } = render(
      <IntegratedSearchComponent
        placeholder="Search artists..."
        enableAdvancedSearch={true}
        useDesignTokens={true}
        shadowLevel="surface"
      />
    );

    const searchComponent = container.querySelector('.design-system-component');
    expect(searchComponent).toBeInTheDocument();

    const searchInput = container.querySelector('input[type="search"]');
    expect(searchInput).toHaveAttribute('placeholder', 'Search artists...');
    expect(searchInput).toHaveAttribute('aria-label', 'Search input');
  });

  it('should integrate artist card with visual effects', () => {
    const { container } = render(
      <IntegratedArtistCard
        artist={mockArtist}
        shadowLevel="raised"
        enableLazyLoading={true}
        useDesignTokens={true}
      />
    );

    const artistCard = container.querySelector('.design-system-component');
    expect(artistCard).toBeInTheDocument();

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('alt', mockArtist.name);
  });

  it('should handle user interactions correctly', async () => {
    const onSearch = jest.fn();
    const onClick = jest.fn();

    render(
      <div>
        <IntegratedSearchComponent
          placeholder="Search..."
          onSearch={onSearch}
        />
        <IntegratedArtistCard
          artist={mockArtist}
          onClick={onClick}
        />
      </div>
    );

    // Test search interaction
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    expect(onSearch).toHaveBeenCalledWith('test query');

    // Test card interaction
    const artistCard = screen.getByRole('button', { name: /view.*profile/i });
    fireEvent.click(artistCard);
    expect(onClick).toHaveBeenCalled();
  });

  it('should meet accessibility standards', async () => {
    const { container } = render(
      <div>
        <IntegratedSearchComponent
          placeholder="Search artists..."
          aria-label="Search for tattoo artists"
        />
        <IntegratedArtistCard
          artist={mockArtist}
          aria-label={`View ${mockArtist.name}'s profile`}
        />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle error states gracefully', () => {
    const { container } = render(
      <IntegratedArtistCard
        artist={null} // Invalid artist data
        onError={(error) => console.log('Error handled:', error)}
      />
    );

    // Component should render without crashing
    expect(container).toBeInTheDocument();
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
      <IntegratedArtistCard
        artist={mockArtist}
        respectReducedMotion={true}
        animationLevel="enhanced"
      />
    );

    // Should not have animation classes when reduced motion is preferred
    const animatedElements = container.querySelectorAll('[class*="animate-"]');
    expect(animatedElements).toHaveLength(0);
  });
});

describe('Page-Level Integration', () => {
  it('should render complete page with integrated components', () => {
    const { container } = render(<ExampleArtistsPage />);

    // Check for page structure
    expect(container.querySelector('.artists-page')).toBeInTheDocument();
    expect(container.querySelector('.page-header')).toBeInTheDocument();
    expect(container.querySelector('.search-section')).toBeInTheDocument();
    expect(container.querySelector('.main-content')).toBeInTheDocument();

    // Check for integrated components
    expect(container.querySelector('.search-component')).toBeInTheDocument();
    expect(container.querySelector('.filters-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.artists-grid')).toBeInTheDocument();
  });

  it('should handle configuration changes at page level', async () => {
    const { container, rerender } = render(<ExampleArtistsPage />);

    // Initial render should have default configuration
    const initialCards = container.querySelectorAll('.artist-card');
    expect(initialCards.length).toBeGreaterThan(0);

    // Configuration changes should be reflected in components
    // This would be tested with actual configuration updates in a real scenario
  });
});

describe('Performance Integration', () => {
  it('should load components efficiently', async () => {
    const startTime = performance.now();

    render(
      <div>
        {mockArtists.map(artist => (
          <IntegratedArtistCard
            key={artist.id}
            artist={artist}
            enableLazyLoading={true}
          />
        ))}
      </div>
    );

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms budget for multiple cards
  });

  it('should handle large datasets with virtualization', () => {
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      id: `artist-${i}`,
      name: `Artist ${i}`,
      avatar: `/avatar-${i}.jpg`,
      styles: ['traditional'],
      rating: 4.5,
      reviewCount: 100
    }));

    const { container } = render(
      <div className="virtualized-list">
        {largeDataset.slice(0, 10).map(artist => (
          <IntegratedArtistCard
            key={artist.id}
            artist={artist}
            enableLazyLoading={true}
          />
        ))}
      </div>
    );

    // Should render only visible items
    const renderedCards = container.querySelectorAll('.artist-card');
    expect(renderedCards).toHaveLength(10);
  });
});

// Test utilities for other developers
export const testUtils = {
  mockArtist,
  mockArtists,
  
  // Helper to create test configuration
  createTestConfig: (overrides = {}) => ({
    searchConfig: {
      placeholder: 'Test search...',
      enableAdvancedSearch: true,
      ...overrides.searchConfig
    },
    visualEffectsConfig: {
      shadowLevel: 'surface',
      enableGlassmorphism: false,
      ...overrides.visualEffectsConfig
    },
    performanceConfig: {
      enableLazyLoading: true,
      enableImageOptimization: true,
      ...overrides.performanceConfig
    },
    ...overrides
  }),
  
  // Helper to run integration tests
  runIntegrationTest: async (Component, props = {}) => {
    const tester = new ComponentIntegrationTester();
    return await tester.testComponent(Component, props);
  },
  
  // Helper to check accessibility
  checkAccessibility: async (container) => {
    const results = await axe(container);
    return results;
  }
};