/**
 * Component Integration Example
 * Demonstrates how to use the component integration utilities
 */

import React, { useState, useEffect } from 'react';
import {
  EnhancedPageConfigManager,
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  ComponentIntegrationTester
} from '../utils/component-integration';

// Example base components (these would be your existing components)
const BaseSearchComponent = ({ placeholder, onSearch, enableAdvancedSearch, ...props }) => (
  <div className={`search-component ${props.className || ''}`}>
    <input
      type="search"
      placeholder={placeholder}
      onChange={(e) => onSearch?.(e.target.value)}
      aria-label="Search input"
      {...props}
    />
    {enableAdvancedSearch && (
      <button className="advanced-search-toggle">Advanced</button>
    )}
  </div>
);

const BaseArtistCard = ({ artist, onClick, ...props }) => (
  <div 
    className={`artist-card ${props.className || ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={`View ${artist.name}'s profile`}
  >
    <img 
      src={artist.avatar} 
      alt={artist.name}
      loading={props.enableLazyLoading ? 'lazy' : 'eager'}
    />
    <h3>{artist.name}</h3>
    <p>{artist.styles.join(', ')}</p>
    <div className="rating">
      ⭐ {artist.rating} ({artist.reviewCount} reviews)
    </div>
  </div>
);

const BaseFilterComponent = ({ filters, onFilterChange, ...props }) => (
  <div className={`filter-component ${props.className || ''}`}>
    <h4>Filters</h4>
    {filters.map(filter => (
      <div key={filter.id} className="filter-item">
        <label>
          <input
            type="checkbox"
            checked={filter.active}
            onChange={(e) => onFilterChange?.(filter.id, e.target.checked)}
          />
          {filter.label}
        </label>
      </div>
    ))}
  </div>
);

// Create integrated components using the integration utilities
const IntegratedSearchComponent = createIntegratedComponent(
  BaseSearchComponent,
  'search',
  {
    useDesignTokens: true,
    shadowLevel: 'surface',
    respectReducedMotion: true
  }
);

const IntegratedArtistCard = createIntegratedComponent(
  BaseArtistCard,
  'card',
  {
    useDesignTokens: true,
    shadowLevel: 'raised',
    enableLazyLoading: true,
    respectReducedMotion: true
  }
);

const IntegratedFilterComponent = createIntegratedComponent(
  BaseFilterComponent,
  'navigation',
  {
    useDesignTokens: true,
    shadowLevel: 'surface'
  }
);

// Example page using component composition
const ExampleArtistsPage = () => {
  // 1. Set up configuration management
  const [configManager] = useState(() => 
    new EnhancedPageConfigManager('artists', {
      searchConfig: {
        placeholder: 'Search artists by name, style, or location...',
        enableAdvancedSearch: true,
        enableStyleFilter: true,
        enableLocationFilter: true
      },
      visualEffectsConfig: {
        shadowLevel: 'raised',
        enableGlassmorphism: false,
        animationLevel: 'standard'
      },
      performanceConfig: {
        enableLazyLoading: true,
        enableImageOptimization: true
      }
    })
  );

  const [config, setConfig] = useState(configManager.getConfig());
  const [artists, setArtists] = useState([]);
  const [filters, setFilters] = useState([
    { id: 'traditional', label: 'Traditional', active: false },
    { id: 'realism', label: 'Realism', active: false },
    { id: 'watercolor', label: 'Watercolor', active: false }
  ]);

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = configManager.subscribe(setConfig);
    return unsubscribe;
  }, [configManager]);

  // Mock data
  useEffect(() => {
    setArtists([
      {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        styles: ['watercolor', 'geometric'],
        rating: 4.8,
        reviewCount: 156
      },
      {
        id: '2',
        name: 'Mike Chen',
        avatar: '/avatars/mike.jpg',
        styles: ['traditional', 'japanese'],
        rating: 4.6,
        reviewCount: 89
      },
      {
        id: '3',
        name: 'Emma Rodriguez',
        avatar: '/avatars/emma.jpg',
        styles: ['realism', 'portrait'],
        rating: 4.9,
        reviewCount: 203
      }
    ]);
  }, []);

  // Event handlers
  const handleSearch = (query) => {
    console.log('Search query:', query);
    // Implement search logic
  };

  const handleFilterChange = (filterId, active) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, active } : filter
    ));
  };

  const handleArtistClick = (artist) => {
    console.log('Artist clicked:', artist);
    // Navigate to artist profile
  };

  return (
    <div className="artists-page">
      {/* Header */}
      <header className="page-header">
        <h1>Find Your Perfect Tattoo Artist</h1>
        <p>Discover talented artists in your area</p>
      </header>

      {/* Search Section */}
      <section className="search-section">
        <IntegratedSearchComponent
          {...config.searchConfig}
          onSearch={handleSearch}
        />
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <IntegratedFilterComponent
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Artists Grid */}
        <main className="artists-grid">
          {artists.map(artist => (
            <IntegratedArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => handleArtistClick(artist)}
              {...config.visualEffectsConfig}
              {...config.performanceConfig}
            />
          ))}
        </main>
      </div>
    </div>
  );
};

// Example using ComponentComposer for more complex layouts
const ComposedArtistsPage = () => {
  const [configManager] = useState(() => 
    new EnhancedPageConfigManager('artists')
  );
  const [config] = useState(configManager.getConfig());

  // Create composer
  const composer = new ComponentComposer();

  // Register components
  composer
    .register('search', IntegratedSearchComponent, config.searchConfig)
    .register('filters', IntegratedFilterComponent, {
      filters: [
        { id: 'style', label: 'Style', active: false },
        { id: 'location', label: 'Location', active: false }
      ]
    })
    .register('artistGrid', ({ artists = [] }) => (
      <div className="artists-grid">
        {artists.map(artist => (
          <IntegratedArtistCard
            key={artist.id}
            artist={artist}
            {...config.visualEffectsConfig}
          />
        ))}
      </div>
    ));

  // Define layout
  composer.setLayout([
    {
      component: 'search',
      props: { className: 'mb-6' }
    },
    {
      layout: [
        {
          component: 'filters',
          props: { className: 'w-1/4' }
        },
        {
          component: 'artistGrid',
          props: { className: 'w-3/4' }
        }
      ],
      className: 'flex gap-6'
    }
  ]);

  const ComposedLayout = composer.compose();

  return (
    <div className="composed-artists-page">
      <ComposedLayout />
    </div>
  );
};

// Example using createPageComposer for standardized layouts
const StandardizedArtistsPage = () => {
  const pageComposer = createPageComposer('artists');

  // Register custom components
  pageComposer
    .register('customSearch', IntegratedSearchComponent)
    .register('customFilters', IntegratedFilterComponent)
    .register('customContent', ({ artists = [] }) => (
      <div className="artists-content">
        {artists.map(artist => (
          <IntegratedArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    ));

  // Update layout with custom components
  pageComposer.setLayout([
    'header',
    'navigation',
    {
      component: 'customSearch',
      props: { placeholder: 'Search artists...' }
    },
    {
      layout: [
        {
          component: 'customFilters',
          props: { className: 'sidebar' }
        },
        {
          component: 'customContent',
          props: { className: 'main-content' }
        }
      ],
      className: 'page-body flex'
    },
    'footer'
  ]);

  const StandardizedLayout = pageComposer.compose();

  return <StandardizedLayout />;
};

// Example integration testing component
const IntegrationTestExample = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const runIntegrationTests = async () => {
    setTesting(true);
    
    try {
      const tester = new ComponentIntegrationTester();
      
      // Test individual components
      const searchResults = await tester.testComponent(
        IntegratedSearchComponent,
        {
          placeholder: 'Test search...',
          enableAdvancedSearch: true
        }
      );
      
      const cardResults = await tester.testComponent(
        IntegratedArtistCard,
        {
          artist: {
            id: '1',
            name: 'Test Artist',
            avatar: '/test-avatar.jpg',
            styles: ['test'],
            rating: 4.5,
            reviewCount: 100
          }
        }
      );
      
      // Generate report
      const report = tester.generateReport();
      
      setTestResults({
        searchResults,
        cardResults,
        report
      });
    } catch (error) {
      console.error('Integration test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="integration-test-example">
      <h2>Integration Testing Example</h2>
      
      <button 
        onClick={runIntegrationTests}
        disabled={testing}
        className="test-button"
      >
        {testing ? 'Running Tests...' : 'Run Integration Tests'}
      </button>
      
      {testResults && (
        <div className="test-results">
          <h3>Test Results</h3>
          
          <div className="test-summary">
            <p>Overall Score: {testResults.report.summary.overallScore}%</p>
            <p>Passed Tests: {testResults.report.summary.passedTests}/{testResults.report.summary.totalTests}</p>
          </div>
          
          <details>
            <summary>Search Component Results</summary>
            <pre>{JSON.stringify(testResults.searchResults, null, 2)}</pre>
          </details>
          
          <details>
            <summary>Artist Card Results</summary>
            <pre>{JSON.stringify(testResults.cardResults, null, 2)}</pre>
          </details>
          
          <details>
            <summary>Full Report</summary>
            <pre>{JSON.stringify(testResults.report, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

// Configuration management example
const ConfigurationExample = () => {
  const [configManager] = useState(() => 
    new EnhancedPageConfigManager('artists')
  );
  const [config, setConfig] = useState(configManager.getConfig());

  useEffect(() => {
    const unsubscribe = configManager.subscribe(setConfig);
    return unsubscribe;
  }, [configManager]);

  const updateVisualEffects = (shadowLevel) => {
    configManager.updateConfig({
      visualEffectsConfig: {
        ...config.visualEffectsConfig,
        shadowLevel
      }
    });
  };

  const toggleGlassmorphism = () => {
    configManager.updateConfig({
      visualEffectsConfig: {
        ...config.visualEffectsConfig,
        enableGlassmorphism: !config.visualEffectsConfig.enableGlassmorphism
      }
    });
  };

  return (
    <div className="configuration-example">
      <h2>Configuration Management Example</h2>
      
      <div className="config-controls">
        <div className="control-group">
          <label>Shadow Level:</label>
          <select 
            value={config.visualEffectsConfig.shadowLevel}
            onChange={(e) => updateVisualEffects(e.target.value)}
          >
            <option value="flat">Flat</option>
            <option value="surface">Surface</option>
            <option value="raised">Raised</option>
            <option value="floating">Floating</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={config.visualEffectsConfig.enableGlassmorphism}
              onChange={toggleGlassmorphism}
            />
            Enable Glassmorphism
          </label>
        </div>
      </div>
      
      <div className="config-preview">
        <h3>Current Configuration:</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
      
      <div className="component-preview">
        <h3>Component Preview:</h3>
        <IntegratedArtistCard
          artist={{
            id: '1',
            name: 'Preview Artist',
            avatar: '/preview-avatar.jpg',
            styles: ['preview'],
            rating: 4.5,
            reviewCount: 100
          }}
          {...config.visualEffectsConfig}
        />
      </div>
    </div>
  );
};

// Main example component showcasing all features
const ComponentIntegrationExample = () => {
  const [activeExample, setActiveExample] = useState('basic');

  const examples = {
    basic: ExampleArtistsPage,
    composed: ComposedArtistsPage,
    standardized: StandardizedArtistsPage,
    testing: IntegrationTestExample,
    configuration: ConfigurationExample
  };

  const ActiveExample = examples[activeExample];

  return (
    <div className="component-integration-example">
      <nav className="example-nav">
        <h1>Component Integration Examples</h1>
        <div className="nav-buttons">
          {Object.keys(examples).map(key => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={activeExample === key ? 'active' : ''}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </nav>
      
      <main className="example-content">
        <ActiveExample />
      </main>
    </div>
  );
};

export default ComponentIntegrationExample;

// Export individual examples for testing
export {
  ExampleArtistsPage,
  ComposedArtistsPage,
  StandardizedArtistsPage,
  IntegrationTestExample,
  ConfigurationExample,
  IntegratedSearchComponent,
  IntegratedArtistCard,
  IntegratedFilterComponent
};