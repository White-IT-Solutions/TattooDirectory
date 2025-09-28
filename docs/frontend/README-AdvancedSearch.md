# Advanced Search Interface Implementation

## Overview

This implementation provides a comprehensive advanced search system for the tattoo artist directory, featuring multi-criteria search, saved searches, search presets, location-based filtering, and result export capabilities. The system is designed to meet all requirements specified in task 8 of the search functionality cohesiveness spec.

## Components

### 1. AdvancedSearchInterface.jsx

The main modal component that provides the advanced search interface.

**Features:**
- **Multi-criteria Search Builder**: Combine text, location, styles, difficulty, experience, price, availability, and rating filters
- **Tabbed Interface**: Organized into Search Criteria, Presets, and Saved Searches tabs
- **Search Presets**: Pre-configured search combinations for common use cases
- **Saved Searches**: Save and reuse complex search configurations
- **Export Functionality**: Export search results in JSON format
- **Accessibility**: Full keyboard navigation and screen reader support

**Props:**
```javascript
{
  isOpen: boolean,           // Controls modal visibility
  onClose: function,         // Called when modal is closed
  onSearch: function         // Called when search is executed (optional)
}
```

**Usage:**
```jsx
import AdvancedSearchInterface from './components/AdvancedSearchInterface';

function MyComponent() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowAdvanced(true)}>
        Advanced Search
      </Button>
      
      <AdvancedSearchInterface
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onSearch={(criteria) => console.log('Search executed:', criteria)}
      />
    </>
  );
}
```

### 2. SearchController (lib/searchController.js)

Central coordinator for all search functionality across the application.

**Features:**
- **Debounced Search**: 300ms delay for optimal performance
- **State Management**: Centralized search state with loading, error, and result states
- **Multi-type Search**: Search across artists, studios, and styles simultaneously
- **Relevance Scoring**: Intelligent ranking of search results
- **Filter Management**: Apply and clear filters with automatic re-search
- **Search History**: Save and retrieve recent searches
- **Suggestions**: Auto-complete suggestions for search queries
- **Export**: Export results in JSON or CSV format

**Key Methods:**
```javascript
// Execute search with debouncing
await searchController.executeSearch(query, options);

// Apply filters and re-search
await searchController.applyFilters({ styles: ['traditional'] });

// Get search suggestions
const suggestions = searchController.getSearchSuggestions('trad');

// Export results
const json = searchController.exportResults('json');
const csv = searchController.exportResults('csv');
```

### 3. SearchMapView.jsx

Interactive map component for location-based search with radius filtering.

**Features:**
- **Interactive Map**: Mock map implementation (ready for Google Maps/Mapbox integration)
- **Radius Search**: Adjustable search radius with visual indicator
- **Result Markers**: Different markers for artists, studios, and styles
- **Marker Popups**: Detailed information on marker click
- **Location Search**: Geocoding support for address/postcode search
- **Current Location**: GPS-based location detection
- **Map Controls**: Zoom controls and legend

**Props:**
```javascript
{
  results: array,            // Search results to display as markers
  searchLocation: string,    // Current search location
  searchRadius: number,      // Search radius in miles
  onLocationChange: function,// Called when location changes
  onRadiusChange: function,  // Called when radius changes
  onResultSelect: function   // Called when marker is clicked
}
```

### 4. Search Results Page (search/page.jsx)

Comprehensive search results page with filtering, sorting, and view modes.

**Features:**
- **Multiple View Modes**: Grid, list, and map views
- **Dynamic Filtering**: Real-time filter application with URL updates
- **Sorting Options**: Sort by relevance, rating, distance, experience, price
- **Pagination**: Efficient pagination for large result sets
- **Active Filter Display**: Visual indicators for applied filters with easy removal
- **No Results Handling**: Helpful suggestions and alternative actions
- **Result Type Indicators**: Clear badges showing result types (artist/studio/style)

## Search Presets

The system includes 5 pre-configured search presets:

1. **Beginner Friendly**: Styles perfect for first-time clients
2. **Bold & Traditional**: Classic tattoo styles with strong visual impact
3. **Artistic & Detailed**: Complex styles requiring advanced skill
4. **Nature Inspired**: Styles featuring natural elements
5. **Modern & Minimal**: Contemporary styles with clean aesthetics

## Filter Options

### Location & Radius
- **Location Input**: City, postcode, or area search
- **Radius Options**: 5, 10, 25, 50, 100 miles
- **Current Location**: GPS-based location detection

### Style Filtering
- **All Available Styles**: Complete integration with enhanced tattoo styles data
- **Multi-select**: Choose multiple styles simultaneously
- **Visual Indicators**: Style cards with difficulty badges and popularity indicators

### Experience & Skill
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Artist Experience**: Apprentice (0-2 years), Junior (2-5 years), Experienced (5-10 years), Master (10+ years)

### Pricing
- **Budget**: £50-100/hour
- **Mid-range**: £100-150/hour
- **Premium**: £150-200/hour
- **Luxury**: £200+/hour

### Availability
- **Immediate**: Available now
- **Week**: Within a week
- **Month**: Within a month
- **Flexible**: Flexible timing

### Rating
- **Minimum Rating**: 1-5 star filtering

## Saved Searches

Users can save complex search configurations for quick reuse:

**Features:**
- **Local Storage**: Persistent storage across browser sessions
- **Search Metadata**: Name, creation date, and filter summary
- **Quick Load**: One-click loading of saved searches
- **Management**: Delete unwanted saved searches
- **Limit**: Maximum 10 saved searches (configurable)

## Export Functionality

Search results can be exported in multiple formats:

### JSON Export
```json
{
  "searchQuery": "traditional tattoo",
  "activeFilters": {
    "styles": ["traditional"],
    "location": "London",
    "radius": 25
  },
  "results": [...],
  "totalResults": 42,
  "timestamp": "2023-12-07T10:30:00.000Z",
  "sortBy": "relevance"
}
```

### CSV Export
```csv
"Type","Name","Location","Rating","Styles/Specialties"
"artist","John Smith","London","4.5","Traditional; Old School"
"studio","Ink Masters","London","4.2","Traditional; Realism; Portrait"
```

## Performance Optimizations

### Search Debouncing
- **300ms Delay**: Prevents excessive API calls during typing
- **Automatic Cancellation**: Previous searches cancelled when new ones start

### Result Caching
- **5-minute Cache**: Identical queries served from cache
- **Memory Management**: Automatic cleanup of old cache entries

### Lazy Loading
- **Progressive Loading**: Results loaded as needed
- **Skeleton States**: Loading indicators maintain layout stability

### Virtual Scrolling
- **Large Result Sets**: Efficient handling of 1000+ results
- **Memory Efficient**: Only visible items rendered

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and visible focus indicators
- **Color Contrast**: Minimum 4.5:1 contrast ratio

### Keyboard Shortcuts
- **Escape**: Close modal
- **Enter/Space**: Activate buttons and toggles
- **Tab/Shift+Tab**: Navigate between elements
- **Arrow Keys**: Navigate within filter groups

### Screen Reader Announcements
- **Search Progress**: Loading and completion announcements
- **Filter Changes**: Announce when filters are applied/removed
- **Result Updates**: Announce result count changes

## Integration Points

### URL State Management
Search parameters are synchronized with the URL for:
- **Bookmarkable Searches**: Users can bookmark and share search URLs
- **Browser History**: Back/forward navigation works correctly
- **Deep Linking**: Direct links to specific search results

### Design System Integration
All components use the established design system:
- **Button Component**: Consistent button styling and behavior
- **Input Component**: Standardized form inputs with validation
- **Card Component**: Consistent card layouts for results
- **Badge/Tag Components**: Filter indicators and metadata display

### Data Integration
- **Enhanced Tattoo Styles**: Full integration with standardized style model
- **Mock Data**: Compatible with existing artist and studio data
- **API Ready**: Structured for easy backend integration

## Testing

### Unit Tests
- **Component Testing**: Full test coverage for AdvancedSearchInterface
- **Controller Testing**: Comprehensive tests for SearchController
- **Accessibility Testing**: Automated accessibility compliance checks

### Integration Tests
- **Cross-component**: Tests for component interaction
- **URL Synchronization**: Tests for URL parameter handling
- **Local Storage**: Tests for saved search persistence

### Performance Tests
- **Search Response Time**: < 300ms for basic queries
- **Filter Application**: < 100ms for client-side filtering
- **Component Rendering**: < 50ms for search result updates

## Future Enhancements

### Map Integration
- **Google Maps API**: Replace mock map with real Google Maps
- **Mapbox Integration**: Alternative mapping solution
- **Clustering**: Marker clustering for dense result areas

### Advanced Filters
- **Date Ranges**: Filter by artist availability dates
- **Portfolio Filters**: Filter by portfolio image count/quality
- **Social Media**: Filter by Instagram follower count

### AI-Powered Features
- **Smart Suggestions**: ML-based search suggestions
- **Style Matching**: AI-powered style recommendation
- **Semantic Search**: Natural language query processing

### Analytics
- **Search Analytics**: Track popular searches and filters
- **Performance Monitoring**: Real-time performance metrics
- **A/B Testing**: Test different search interface variations

## Error Handling

### Graceful Degradation
- **Network Errors**: Offline mode with cached results
- **API Failures**: Fallback to local data where possible
- **Browser Compatibility**: Progressive enhancement approach

### User Feedback
- **Clear Error Messages**: User-friendly error descriptions
- **Recovery Suggestions**: Actionable steps to resolve issues
- **Loading States**: Clear indication of system status

### Logging
- **Error Tracking**: Comprehensive error logging for debugging
- **Performance Metrics**: Automatic performance monitoring
- **User Actions**: Track user interactions for optimization

## Configuration

### Environment Variables
```javascript
// Search configuration
SEARCH_DEBOUNCE_DELAY=300
SEARCH_CACHE_DURATION=300000
MAX_SEARCH_RESULTS=1000
MAX_SAVED_SEARCHES=10

// Map configuration
GOOGLE_MAPS_API_KEY=your_api_key
DEFAULT_MAP_ZOOM=10
DEFAULT_SEARCH_RADIUS=25
```

### Customization Options
- **Search Presets**: Easily configurable preset definitions
- **Filter Options**: Customizable filter categories and values
- **Export Formats**: Extensible export format system
- **Styling**: Full theme customization through design system

This implementation provides a robust, accessible, and performant advanced search system that meets all specified requirements while maintaining consistency with the existing design system and architecture patterns.