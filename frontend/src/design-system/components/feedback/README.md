# Search Feedback System

A comprehensive feedback and notification system for search functionality that provides toast notifications, progress indicators, error handling, real-time validation, and success confirmations.

## Overview

This system addresses **Task 11** from the search functionality cohesiveness spec by implementing:

- ✅ Toast notification system for search actions (success, error, warning, info)
- ✅ Progress indicators for multi-step search processes
- ✅ Loading states with progress bars and estimated completion times
- ✅ Error messages with recovery suggestions and clear next steps
- ✅ Real-time validation feedback for search forms
- ✅ Integration with established design system styling and behavior

## Components

### Core Components

#### `SearchFeedbackProvider`
Main provider component that orchestrates all feedback functionality.

```jsx
import { SearchFeedbackProvider } from '@/design-system/components/feedback';

function App() {
  return (
    <SearchFeedbackProvider
      toastPosition="top-right"
      maxToasts={5}
      defaultToastDuration={5000}
    >
      {/* Your app content */}
    </SearchFeedbackProvider>
  );
}
```

#### `EnhancedSearchWithFeedback`
Complete search component with integrated feedback system.

```jsx
import { EnhancedSearchWithFeedback } from '@/design-system/components/feedback';

function SearchPage() {
  return (
    <EnhancedSearchWithFeedback
      searchType="general"
      placeholder="Search for artists, studios, or styles..."
      onSearch={(data) => console.log('Search completed:', data)}
      onValidatedChange={(data) => console.log('Validation changed:', data)}
      showValidation={true}
      showProgress={true}
    />
  );
}
```

### Toast Notifications

#### `useToast` Hook
Provides methods for showing different types of toast notifications.

```jsx
import { useToast } from '@/design-system/components/feedback';

function SearchComponent() {
  const { success, error, warning, info } = useToast();

  const handleSearchSuccess = (resultCount) => {
    success(`Found ${resultCount} results`, {
      title: 'Search Complete',
      duration: 3000
    });
  };

  const handleSearchError = (error) => {
    error('Search failed. Please try again.', {
      title: 'Search Error',
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => retrySearch()
      }
    });
  };

  return (
    // Your component JSX
  );
}
```

#### Toast Types
- **Success**: Green toast for successful operations
- **Error**: Red toast for errors with optional retry actions
- **Warning**: Yellow toast for warnings and non-critical issues
- **Info**: Blue toast for informational messages

### Progress Indicators

#### `SearchProgressIndicator`
Visual progress tracking for multi-step operations.

```jsx
import { SearchProgressIndicator } from '@/design-system/components/feedback';

const searchSteps = [
  { label: 'Validating query', description: 'Checking search parameters' },
  { label: 'Searching database', description: 'Finding matching results' },
  { label: 'Processing results', description: 'Organizing and ranking results' },
  { label: 'Finalizing', description: 'Preparing results for display' }
];

function SearchProgress({ currentStep }) {
  return (
    <SearchProgressIndicator
      steps={searchSteps}
      currentStep={currentStep}
      estimatedTimeRemaining={30}
      showEstimatedTime={true}
    />
  );
}
```

#### `SearchLoadingState`
Loading state with progress bars and skeleton components.

```jsx
import { SearchLoadingState } from '@/design-system/components/feedback';

function LoadingSearch() {
  return (
    <SearchLoadingState
      message="Searching for artists"
      progress={75}
      estimatedTime={5}
      showSkeleton={true}
      skeletonCount={3}
    />
  );
}
```

### Error Handling

#### `SearchErrorMessage`
Comprehensive error display with recovery options.

```jsx
import { SearchErrorMessage } from '@/design-system/components/feedback';

function SearchError({ error }) {
  return (
    <SearchErrorMessage
      error={{
        id: 'search_error_123',
        type: 'network',
        message: 'Unable to connect to search service'
      }}
      onRetry={() => retrySearch()}
      onClearFilters={() => clearAllFilters()}
      onGoHome={() => navigateHome()}
      suggestions={[
        { label: 'Traditional', value: 'traditional', onClick: (value) => searchFor(value) },
        { label: 'Realism', value: 'realism', onClick: (value) => searchFor(value) }
      ]}
    />
  );
}
```

#### Error Types
- **Network**: Connection issues
- **Timeout**: Request timeout
- **Validation**: Input validation errors
- **Server**: Server-side errors
- **Unknown**: Unexpected errors

### Real-time Validation

#### `ValidatedSearchInput`
Input component with real-time validation feedback.

```jsx
import { ValidatedSearchInput } from '@/design-system/components/feedback';

function ArtistSearch() {
  return (
    <ValidatedSearchInput
      type="artistName"
      label="Artist Name"
      placeholder="Enter artist name"
      showSuggestions={true}
      onValidatedChange={(data) => {
        console.log('Validation result:', data);
        // data: { value, isValid, validation }
      }}
    />
  );
}
```

#### Validation Types
- **general**: Basic text validation
- **postcode**: UK postcode format validation
- **email**: Email address validation
- **phone**: UK mobile number validation
- **artistName**: Artist name validation
- **studioName**: Studio name validation

#### `ValidatedSearchForm`
Multi-field form with comprehensive validation.

```jsx
import { ValidatedSearchForm } from '@/design-system/components/feedback';

const formFields = [
  {
    name: 'artist',
    type: 'artistName',
    label: 'Artist Name',
    placeholder: 'Enter artist name',
    required: true
  },
  {
    name: 'location',
    type: 'postcode',
    label: 'Location',
    placeholder: 'Enter UK postcode',
    required: false
  }
];

function AdvancedSearch() {
  return (
    <ValidatedSearchForm
      fields={formFields}
      onSubmit={(formData, fieldStates) => {
        console.log('Form submitted:', formData);
      }}
      onValidationChange={(formState) => {
        console.log('Form validation changed:', formState);
      }}
    />
  );
}
```

### Search Notifications

#### `useSearchNotifications` Hook
Centralized notification system for search operations.

```jsx
import { useSearchNotifications } from '@/design-system/components/feedback';

function SearchComponent() {
  const notifications = useSearchNotifications();

  const handleSearch = async (query) => {
    // Notify search started
    notifications.notifySearchStarted(query);

    try {
      const results = await performSearch(query);
      
      // Notify success
      notifications.notifySearchCompleted(results.length, results.searchTime);
    } catch (error) {
      // Notify error with retry option
      notifications.notifySearchFailed(error, () => handleSearch(query));
    }
  };

  return (
    // Your component JSX
  );
}
```

#### Notification Methods
- `notifySearchStarted(query)`
- `notifySearchCompleted(resultCount, searchTime)`
- `notifySearchFailed(error, onRetry)`
- `notifyNoResults(query, onClearFilters)`
- `notifyFilterApplied(filterName, filterValue)`
- `notifyFilterCleared(filterCount)`
- `notifyLocationDetected(location)`
- `notifyValidationError(field, message)`

## Integration with Design System

### Available Components Used
- ✅ **ErrorBoundary**: Comprehensive error handling with branded error pages
- ✅ **Toast System**: Complete toast notification system with provider
- ✅ **Skeleton Components**: Loading states that match final content layout
- ✅ **Input Component**: Validation states (error, success, warning)
- ✅ **Button, Card, Badge**: Consistent design system styling

### Design System Integration
- Uses CSS custom properties for consistent theming
- Follows established spacing and typography scales
- Maintains consistent interaction patterns
- Integrates with focus management and accessibility features

## Accessibility Features

### WCAG 2.1 AA Compliance
- ✅ Proper ARIA labels and descriptions
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Alternative text for icons

### Keyboard Support
- Tab navigation through all interactive elements
- Enter key for form submission
- Escape key to dismiss notifications
- Arrow keys for suggestion navigation

### Screen Reader Support
- Descriptive ARIA labels
- Live regions for dynamic content updates
- Proper heading hierarchy
- Alternative text for visual indicators

## Performance Optimizations

### Debounced Validation
- 300ms debounce delay for text input validation
- Prevents excessive API calls during typing
- Smooth user experience without lag

### Efficient Rendering
- Memoized components to prevent unnecessary re-renders
- Optimized state management
- Lazy loading for heavy components

### Memory Management
- Automatic cleanup of timers and intervals
- Proper event listener removal
- Efficient toast notification limits

## Error Handling Strategy

### Progressive Enhancement
1. **Basic Functionality**: Core search works without JavaScript
2. **Enhanced Features**: Interactive feedback with JavaScript enabled
3. **Graceful Degradation**: Fallbacks for failed operations

### Error Recovery
- Clear recovery action suggestions
- Retry mechanisms for transient errors
- Alternative search suggestions
- Navigation options (home, clear filters)

### Error Reporting
- Unique error IDs for support tracking
- Structured error logging
- User-friendly error messages
- Developer information in development mode

## Testing

### Unit Tests
- ✅ Component rendering and behavior
- ✅ Validation logic and edge cases
- ✅ Toast notification functionality
- ✅ Error handling scenarios
- ✅ Accessibility compliance

### Integration Tests
- ✅ Cross-component communication
- ✅ State management consistency
- ✅ User interaction flows
- ✅ Error boundary integration

### Test Coverage
- 80%+ coverage on core functionality
- Edge case handling
- Accessibility testing
- Performance testing

## Usage Examples

### Basic Search with Feedback
```jsx
import { SearchFeedbackProvider, EnhancedSearchWithFeedback } from '@/design-system/components/feedback';

function App() {
  return (
    <SearchFeedbackProvider>
      <EnhancedSearchWithFeedback
        placeholder="Search artists, studios, styles..."
        onSearch={(data) => console.log('Search:', data)}
      />
    </SearchFeedbackProvider>
  );
}
```

### Advanced Form with Validation
```jsx
import { SearchFeedbackProvider, EnhancedSearchForm } from '@/design-system/components/feedback';

const fields = [
  { name: 'artist', type: 'artistName', label: 'Artist', required: true },
  { name: 'location', type: 'postcode', label: 'Location', required: false }
];

function AdvancedSearch() {
  return (
    <SearchFeedbackProvider>
      <EnhancedSearchForm
        fields={fields}
        onSubmit={(data) => console.log('Submit:', data)}
      />
    </SearchFeedbackProvider>
  );
}
```

### Custom Error Handling
```jsx
import { SearchFeedbackProvider, useSearchFeedback } from '@/design-system/components/feedback';

function CustomSearch() {
  const { failSearch, notifications } = useSearchFeedback();

  const handleError = (error) => {
    failSearch({
      type: 'network',
      message: 'Custom error message'
    });
    
    notifications.notifyNetworkError(() => retrySearch());
  };

  return (
    // Your custom search component
  );
}
```

## Demo

Visit `/search-feedback-demo` to see all components in action with:
- Interactive examples
- Validation testing
- Progress simulation
- Error handling demonstration
- Accessibility features showcase

## Requirements Fulfilled

This implementation fulfills all requirements from Task 11:

- ✅ **10.1**: Toast notifications for search actions (success, error, warning, info)
- ✅ **10.2**: Progress indicators for multi-step search processes
- ✅ **10.3**: Loading states with progress bars and estimated completion times
- ✅ **10.4**: Helpful error messages with recovery suggestions and clear next steps
- ✅ **10.5**: Real-time validation feedback for search forms
- ✅ **10.6**: All feedback follows established design system styling and behavior

The system provides a comprehensive, accessible, and user-friendly feedback experience for all search operations while maintaining consistency with the existing design system.