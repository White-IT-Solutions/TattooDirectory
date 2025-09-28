# Enhanced Search Controller

A comprehensive search system for the tattoo artist directory that provides unified search functionality across all pages with debounced search, state management, caching, and search history.

## Features

- **Centralized Search Management**: Single controller manages search state across all pages
- **Debounced Search**: 300ms debouncing for optimal performance
- **Search History**: Local storage persistence with recent searches
- **Caching**: 5-minute cache for search results
- **Comprehensive Filtering**: Text, style, location, difficulty, and advanced filters
- **React Integration**: Custom hooks for easy React component integration
- **Error Handling**: Robust error handling with user-friendly messages
- **Search Suggestions**: Intelligent suggestions for no results and few results scenarios

## Core Components

### SearchQuery

Represents a search query with all possible filters and parameters.

```javascript
import { SearchQuery } from './search-controller.js';

const query = new SearchQuery({
  text: 'dragon tattoo',
  styles: ['old_school', 'realism'],
  location: { city: 'London', postcode: 'SW1A 1AA' },
  difficulty: ['beginner', 'intermediate'],
  sortBy: 'popularity',
  page: 1,
  limit: 20,
  radius: 25,
  priceRange: { min: 50, max: 200 },
  availability: 'available',
  rating: 4.0
});

// Check if query has active filters
console.log(query.hasFilters()); // true

// Get cache key for result caching
console.log(query.getCacheKey()); // "dragon tattoo|old_school,realism|London|..."

// Convert to URL parameters
const params = query.toURLSearchParams();
console.log(params.toString()); // "query=dragon+tattoo&styles=old_school,realism&..."
```

### EnhancedSearchController

The main controller that manages all search operations.

```javascript
import { searchController } from './search-controller.js';

// Execute a search
const query = new SearchQuery({ text: 'dragon' });
const results = await searchController.executeSearch(query);

// Apply filters
await searchController.applyFilters({ styles: ['old_school'] });

// Clear filters (keeps text search)
await searchController.clearFilters();

// Get current state
const state = searchController.getSearchState();

// Listen to state changes
const unsubscribe = searchController.addListener((newState) => {
  console.log('Search state updated:', newState);
});

// Get recent searches
const recentSearches = searchController.getRecentSearches();

// Reset everything
searchController.reset();
```

## React Hooks

### useSearchController

Main hook for search functionality in React components.

```javascript
import { useSearchController, SearchQuery } from './useSearchController.js';

function SearchComponent() {
  const {
    searchState,
    executeSearch,
    applyFilters,
    clearFilters,
    recentSearches,
    hasResults,
    isSearching,
    searchError,
    totalResults,
    executionTime
  } = useSearchController();

  const handleSearch = async () => {
    const query = new SearchQuery({ text: 'dragon' });
    await executeSearch(query);
  };

  const handleStyleFilter = async (styleId) => {
    await applyFilters({ styles: [styleId] });
  };

  return (
    <div>
      {isSearching && <div>Searching...</div>}
      {searchError && <div>Error: {searchError.message}</div>}
      {hasResults && <div>Found {totalResults} results in {executionTime}ms</div>}
      
      <button onClick={handleSearch}>Search Dragons</button>
      <button onClick={() => handleStyleFilter('old_school')}>Filter Old School</button>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}
```

### useDebouncedSearch

Hook for debounced text input search.

```javascript
import { useDebouncedSearch } from './useSearchController.js';

function SearchInput() {
  const {
    searchText,
    debouncedText,
    updateSearchText,
    clearSearchText,
    isDebouncing
  } = useDebouncedSearch(300);

  // Execute search when debounced text changes
  React.useEffect(() => {
    if (debouncedText) {
      // Perform search with debouncedText
    }
  }, [debouncedText]);

  return (
    <div>
      <input
        value={searchText}
        onChange={(e) => updateSearchText(e.target.value)}
        placeholder="Search..."
      />
      {isDebouncing && <span>Typing...</span>}
      <button onClick={clearSearchText}>Clear</button>
    </div>
  );
}
```

### useSearchSuggestions

Hook for managing search suggestions.

```javascript
import { useSearchSuggestions } from './useSearchController.js';

function SearchSuggestions() {
  const {
    suggestions,
    showSuggestions,
    hasNoResults,
    hasFewResults,
    toggleSuggestions,
    hideSuggestions
  } = useSearchSuggestions();

  return (
    <div>
      {hasNoResults && <div>No results found</div>}
      {hasFewResults && <div>Only a few results found</div>}
      
      <button onClick={toggleSuggestions}>
        {showSuggestions ? 'Hide' : 'Show'} Suggestions
      </button>
      
      {showSuggestions && suggestions.map((suggestion, index) => (
        <div key={index} onClick={() => executeSearch(suggestion.query)}>
          {suggestion.text}
        </div>
      ))}
    </div>
  );
}
```

### useSearchFacets

Hook for managing search facets and filters.

```javascript
import { useSearchFacets } from './useSearchController.js';

function SearchFacets() {
  const {
    facets,
    currentQuery,
    applyStyleFilter,
    applyLocationFilter,
    applyDifficultyFilter,
    availableStyles,
    activeStylesCount,
    hasActiveFilters
  } = useSearchFacets();

  return (
    <div>
      <h3>Styles ({activeStylesCount} active)</h3>
      {availableStyles.map(styleId => (
        <button
          key={styleId}
          onClick={() => applyStyleFilter(styleId)}
          className={currentQuery.styles?.includes(styleId) ? 'active' : ''}
        >
          {styleId} ({facets.styles[styleId]} results)
        </button>
      ))}
      
      {hasActiveFilters && (
        <button onClick={clearFilters}>Clear All Filters</button>
      )}
    </div>
  );
}
```

### useSearchHistory

Hook for managing search history.

```javascript
import { useSearchHistory } from './useSearchController.js';

function SearchHistory() {
  const {
    recentSearches,
    showHistory,
    toggleHistory,
    executeHistorySearch,
    clearSearchHistory,
    hasHistory
  } = useSearchHistory();

  return (
    <div>
      {hasHistory && (
        <button onClick={toggleHistory}>
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      )}
      
      {showHistory && (
        <div>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => executeHistorySearch(search)}
            >
              {search.text || 'Style search'}
            </button>
          ))}
          <button onClick={clearSearchHistory}>Clear History</button>
        </div>
      )}
    </div>
  );
}
```

## Search State Structure

The search state contains all information about the current search:

```javascript
{
  query: SearchQuery,           // Current search query
  results: Array,              // Search results
  loading: boolean,            // Loading state
  error: Error|null,           // Error state
  totalCount: number,          // Total number of results
  facets: Object,              // Available facets for filtering
  suggestions: Array,          // Search suggestions
  executionTime: number,       // Last search execution time in ms
  lastUpdated: number          // Timestamp of last update
}
```

## Search Facets Structure

Facets provide information about available filters:

```javascript
{
  styles: {
    'old_school': 15,          // 15 artists with old school style
    'realism': 8,              // 8 artists with realism style
    // ...
  },
  locations: {
    'London': 25,              // 25 artists in London
    'Manchester': 12,          // 12 artists in Manchester
    // ...
  },
  difficulty: {
    'beginner': 20,            // 20 beginner-friendly styles
    'advanced': 5,             // 5 advanced styles
    // ...
  }
}
```

## Integration with Enhanced Tattoo Styles

The search controller integrates with the enhanced tattoo styles data model:

```javascript
import { enhancedTattooStyles, searchStylesByAlias } from '../app/data/testData/enhancedTattooStyles.js';

// Search by style alias
const results = searchStylesByAlias('sailor jerry'); // Returns Old School style

// Get style metadata
const style = enhancedTattooStyles['old_school'];
console.log(style.difficulty);      // 'beginner'
console.log(style.characteristics); // ['Bold Lines', 'Limited Colors', ...]
console.log(style.aliases);         // ['Traditional', 'American Traditional', ...]
```

## Performance Considerations

- **Debouncing**: 300ms delay prevents excessive API calls during typing
- **Caching**: 5-minute cache reduces redundant API requests
- **Lazy Loading**: Results are loaded progressively
- **Memory Management**: Cache is limited to 100 entries with LRU eviction

## Error Handling

The search controller provides comprehensive error handling:

```javascript
try {
  await searchController.executeSearch(query);
} catch (error) {
  if (error.status === 400) {
    // Validation error - show user-friendly message
  } else if (error.status >= 500) {
    // Server error - show retry option
  }
  console.error('Search failed:', error.message);
}
```

## Testing

The search controller includes comprehensive tests:

```bash
# Run search controller tests
npm test -- --testPathPattern="search-controller"

# Run React hooks tests
npm test -- --testPathPattern="useSearchController"
```

## Example Usage

See `frontend/src/lib/examples/SearchExample.js` for a complete working example that demonstrates:

- Text search with debouncing
- Style filtering
- Search suggestions
- Recent search history
- Error handling
- Loading states

## API Integration

The search controller integrates with the existing API:

```javascript
// Uses existing API methods
api.searchArtists({ query, style, location })
api.getArtists(limit, cursor)
api.getStyles()
```

## Local Storage

Search history is persisted in localStorage:

- **Key**: `tattoo-search-history`
- **Max Size**: 50 searches
- **Data**: Serialized SearchQuery objects with timestamps
- **Cleanup**: Automatic removal of old entries

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage support required for search history
- Graceful degradation when localStorage is unavailable