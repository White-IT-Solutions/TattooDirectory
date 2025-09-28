# Enhanced StudioSearch Component

## Overview

The StudioSearch component has been enhanced with comprehensive style filtering capabilities that integrate with the standardized tattoo styles data model. This enhancement provides a rich, consistent search experience across the studios page.

## New Features

### 1. Style Filtering Integration

- **Enhanced Style Filter**: Integrates the existing `EnhancedStyleFilter` component functionality
- **Standardized Style Model**: Uses the centralized `enhancedTattooStyles` data model
- **Rich Metadata Display**: Shows difficulty badges, popularity indicators, and detailed tooltips
- **Alias Search Support**: Allows searching by style aliases (e.g., "sailor jerry" finds "Old School")

### 2. Visual Enhancements

- **Style Toggle Button**: Dedicated button for style filtering with active count display
- **Interactive Style Grid**: Visual style selection with hover effects and tooltips
- **Difficulty Badges**: Color-coded difficulty indicators for each style
- **Popularity Indicators**: 5-dot visual system showing style popularity
- **Rich Tooltips**: Comprehensive style information on hover

### 3. Enhanced Autocomplete

- **Style Suggestions**: Main search now includes style suggestions with metadata
- **Visual Indicators**: Difficulty badges and popularity indicators in suggestions
- **Type Categorization**: Clear labeling of suggestion types (studio, location, specialty, style)

### 4. Filter Management

- **Active Filter Tags**: Visual tags for selected styles with easy removal
- **Clear Functionality**: Ability to clear individual or all style filters
- **Persistent State**: Style selections persist across filter panel toggles

## Usage

### Basic Style Filtering

```jsx
import { StudioSearch } from '@/design-system';

function StudiosPage() {
  const handleFilterChange = (filters) => {
    // filters.styleFilters contains array of selected style IDs
    console.log('Selected styles:', filters.styleFilters);
  };

  return (
    <StudioSearch
      studios={studios}
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      onViewModeChange={handleViewModeChange}
      onMapToggle={handleMapToggle}
    />
  );
}
```

### Filter Object Structure

The `onFilterChange` callback now receives an enhanced filter object:

```javascript
{
  searchTerm: string,
  locationFilter: string,
  specialtyFilters: string[],
  styleFilters: string[],        // New: Array of style IDs
  ratingFilter: number,
  establishedYearRange: [number, number],
  artistCountRange: [number, number]
}
```

### Style Data Integration

Studios should include style information for filtering to work effectively:

```javascript
const studio = {
  studioId: "studio-001",
  studioName: "Example Studio",
  specialties: ["Traditional", "Realism"],
  styles: ["traditional", "realism"],  // Style IDs matching enhancedTattooStyles
  // ... other studio properties
};
```

## Implementation Details

### Style Filtering Logic

The component filters studios based on style selections by:

1. Checking `studio.styles` array for exact style ID matches
2. Checking `studio.specialties` for style name matches
3. Supporting case-insensitive name matching for flexibility

### Tooltip System

- **Trigger**: Mouse hover over style buttons
- **Delay**: 0.3s as specified in design system
- **Content**: Style description, difficulty, characteristics, motifs, time origin
- **Positioning**: Dynamic positioning to avoid viewport edges

### Performance Optimizations

- **Memoized Computations**: Style filtering and availability checks are memoized
- **Debounced Search**: Style search input uses 300ms debounce
- **Efficient Rendering**: Only renders available styles based on studio data

## Testing

### Unit Tests

- Style filter toggle functionality
- Style selection and deselection
- Filter tag display and removal
- Autocomplete integration
- Clear filters functionality

### Integration Tests

- End-to-end style filtering workflow
- Studio results filtering
- Filter persistence across interactions
- Search integration

### Test Files

- `StudioSearch.enhanced.test.jsx` - Enhanced functionality tests
- `StudiosStyleFiltering.test.jsx` - Integration tests

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support for style selection
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and visible focus indicators
- **Color Contrast**: Minimum 4.5:1 contrast ratio maintained
- **Touch Targets**: 44px minimum touch target size

### Accessibility Features

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Role Attributes**: Proper semantic roles for complex interactions
- **Keyboard Shortcuts**: Enter/Space for selection, Escape to close
- **Screen Reader Announcements**: Status updates for filter changes

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+
- **Responsive Design**: Optimized for 320px+ screen widths

## Dependencies

### Required Components

- `Badge` - For difficulty and type indicators
- `Tag` - For active filter display
- `Button` - For toggle and action buttons
- `Input` - For search functionality
- `Card` - For container styling

### Data Dependencies

- `enhancedTattooStyles` - Standardized style data model
- `difficultyLevels` - Difficulty configuration
- `searchStylesByAlias` - Alias search function

## Future Enhancements

### Planned Features

1. **Style Categories**: Group styles by categories (Classic, Modern, etc.)
2. **Advanced Style Filters**: Filter by difficulty, popularity, characteristics
3. **Style Recommendations**: Suggest related styles based on selections
4. **Visual Style Previews**: Enhanced image galleries for each style
5. **Style Analytics**: Track popular style combinations

### Performance Improvements

1. **Virtual Scrolling**: For large style collections
2. **Lazy Loading**: Load style images on demand
3. **Caching**: Client-side caching of style data
4. **Prefetching**: Preload related style information

## Migration Guide

### From Basic StudioSearch

If upgrading from the basic StudioSearch component:

1. **Update Studio Data**: Add `styles` array to studio objects
2. **Handle Style Filters**: Update filter handling to process `styleFilters`
3. **Import Dependencies**: Ensure enhanced tattoo styles data is available
4. **Update Tests**: Add tests for new style filtering functionality

### Breaking Changes

- Filter object now includes `styleFilters` property
- Component requires enhanced tattoo styles data import
- Additional CSS variables needed for style indicators

## Support

For issues or questions regarding the enhanced StudioSearch component:

1. Check existing tests for usage examples
2. Review the standardized style data model
3. Ensure all required dependencies are imported
4. Verify studio data includes style information