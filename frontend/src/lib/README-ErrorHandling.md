# RFC 9457 Error Handling System

This document explains how to use the RFC 9457 compliant error handling system implemented in the frontend.

## Overview

The error handling system provides:

- **RFC 9457 Compliant**: Handles error responses that follow the RFC 9457 Problem Details standard
- **User-Friendly Messages**: Converts technical errors into user-friendly messages
- **Comprehensive Logging**: Logs errors for debugging with proper context
- **React Integration**: Hooks and components for easy integration with React components
- **Retry Logic**: Built-in retry functionality for recoverable errors
- **Error Boundaries**: Catches unhandled JavaScript errors

## Core Components

### 1. Error Utilities (`errors.js`)

#### `ApiError` Class
Represents an RFC 9457 compliant API error:

```javascript
import { ApiError } from './errors.js';

// Create an API error
const error = new ApiError({
  type: 'https://api.tattoodirectory.com/docs/errors#404',
  title: 'Not Found',
  status: 404,
  detail: 'Artist not found',
  instance: '/v1/artists/123'
});

// Check error properties
console.log(error.getUserFriendlyMessage()); // "The artist you're looking for could not be found."
console.log(error.isClientError()); // true
console.log(error.isServerError()); // false
```

#### `apiRequest` Function
Enhanced fetch wrapper with automatic error handling:

```javascript
import { apiRequest } from './errors.js';

try {
  const response = await apiRequest('/api/artists', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const result = await response.json();
} catch (error) {
  // Automatically converted to ApiError
  console.log(error.getUserFriendlyMessage());
}
```

#### `withRetry` Function
Adds retry logic to API calls:

```javascript
import { withRetry, apiRequest } from './errors.js';

const retryableRequest = withRetry(apiRequest, {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
});

const response = await retryableRequest('/api/artists');
```

### 2. React Hooks (`useApiError.js`)

#### `useApiError` Hook
Basic error handling for components:

```javascript
import { useApiError } from './useApiError.js';
import { api } from './api.js';

function MyComponent() {
  const { 
    error, 
    errorMessage, 
    isLoading, 
    executeApiCall, 
    clearError 
  } = useApiError();

  const handleSearch = async () => {
    try {
      const result = await executeApiCall(
        () => api.searchArtists({ query: 'tattoo' }),
        { operation: 'search' }
      );
      console.log(result);
    } catch (error) {
      // Error is automatically handled and logged
    }
  };

  return (
    <div>
      {error && (
        <div className="error">
          {errorMessage}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={handleSearch} disabled={isLoading}>
        Search
      </button>
    </div>
  );
}
```

#### `useApiOperation` Hook
Manages a single API operation with built-in state:

```javascript
import { useApiOperation } from './useApiError.js';
import { api } from './api.js';

function ArtistProfile({ artistId }) {
  const artistOperation = useApiOperation(api.getArtist, {
    onSuccess: (data) => console.log('Artist loaded:', data),
    onError: (error) => console.log('Failed to load artist:', error)
  });

  useEffect(() => {
    artistOperation.execute(artistId);
  }, [artistId]);

  if (artistOperation.isLoading) return <div>Loading...</div>;
  if (artistOperation.error) return <ErrorDisplay error={artistOperation.error} />;
  if (artistOperation.data) return <ArtistCard artist={artistOperation.data} />;
  
  return null;
}
```

#### `useApiOperations` Hook
Manages multiple API operations:

```javascript
import { useApiOperations } from './useApiError.js';
import { api } from './api.js';

function Dashboard() {
  const operations = useApiOperations({
    artists: api.getArtists,
    styles: api.getStyles
  });

  useEffect(() => {
    operations.artists.execute();
    operations.styles.execute();
  }, []);

  return (
    <div>
      {operations.artists.error && <ErrorDisplay error={operations.artists.error} />}
      {operations.styles.error && <ErrorDisplay error={operations.styles.error} />}
      
      {operations.isAnyLoading && <div>Loading...</div>}
      
      {operations.artists.data && <ArtistList artists={operations.artists.data} />}
      {operations.styles.data && <StyleFilter styles={operations.styles.data} />}
    </div>
  );
}
```

### 3. Error Display Components

#### `ErrorDisplay` Component
Main error display component with customizable appearance:

```javascript
import ErrorDisplay from './components/ErrorDisplay.jsx';

function MyComponent() {
  const [error, setError] = useState(null);

  return (
    <ErrorDisplay
      error={error}
      onRetry={() => retryOperation()}
      onDismiss={() => setError(null)}
      showDetails={true}
      variant="card" // 'banner', 'card', 'inline'
    />
  );
}
```

#### `ErrorBanner` Component
Simplified banner for top-level errors:

```javascript
import { ErrorBanner } from './components/ErrorDisplay.jsx';

function App() {
  return (
    <div>
      <ErrorBanner 
        error={globalError} 
        onDismiss={() => setGlobalError(null)} 
      />
      {/* Rest of app */}
    </div>
  );
}
```

#### `InlineError` Component
Compact error display for forms:

```javascript
import { InlineError } from './components/ErrorDisplay.jsx';

function FormField() {
  return (
    <div>
      <input type="text" />
      <InlineError error={fieldError} />
    </div>
  );
}
```

### 4. Error Boundary

#### `ErrorBoundary` Component
Catches unhandled JavaScript errors:

```javascript
import ErrorBoundary from './components/ErrorBoundary.jsx';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log('Boundary caught error:', error);
      }}
      fallback={(error, retry) => (
        <div>
          <h1>Something went wrong</h1>
          <button onClick={retry}>Try Again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### `withErrorBoundary` HOC
Wrap components with error boundary:

```javascript
import { withErrorBoundary } from './components/ErrorBoundary.jsx';

const SafeComponent = withErrorBoundary(MyComponent, {
  onError: (error) => console.log('Error in MyComponent:', error)
});
```

#### `useErrorBoundary` Hook
Manually trigger error boundary from functional components:

```javascript
import { useErrorBoundary } from './components/ErrorBoundary.jsx';

function MyComponent() {
  const throwError = useErrorBoundary();

  const handleCriticalError = () => {
    throwError(new Error('Critical error occurred'));
  };

  return <button onClick={handleCriticalError}>Trigger Error</button>;
}
```

## Updated API Client

The API client (`api.js`) has been updated to use the new error handling:

```javascript
import { api, ApiError } from './api.js';

// All API methods now throw ApiError instances
try {
  const artists = await api.getArtists();
  const artist = await api.getArtist('123');
  const styles = await api.getStyles();
} catch (error) {
  if (error instanceof ApiError) {
    console.log('User message:', error.getUserFriendlyMessage());
    console.log('Technical details:', error.detail);
    console.log('Error type:', error.type);
    console.log('Status code:', error.status);
  }
}
```

## Error Types and User Messages

The system provides user-friendly messages for common error scenarios:

| Status Code | Error Type | User Message |
|-------------|------------|--------------|
| 400 | Bad Request | "Please check your search parameters and try again." |
| 401 | Unauthorized | "You need to be logged in to access this feature." |
| 403 | Forbidden | "You don't have permission to access this resource." |
| 404 | Not Found | "The artist you're looking for could not be found." |
| 408 | Request Timeout | "The request took too long to complete. Please try again." |
| 429 | Too Many Requests | "You're making requests too quickly. Please wait a moment and try again." |
| 500 | Internal Server Error | "Something went wrong on our end. Please try again later." |
| 503 | Service Unavailable | "Our search service is temporarily unavailable. Please try again in a few moments." |

## Best Practices

### 1. Use Appropriate Error Handling Method

- **Simple operations**: Use `useApiError` hook
- **Single API operation**: Use `useApiOperation` hook  
- **Multiple operations**: Use `useApiOperations` hook
- **Direct API calls**: Use try/catch with `ApiError`

### 2. Provide Context for Logging

```javascript
const { executeApiCall } = useApiError();

await executeApiCall(
  () => api.searchArtists(params),
  { 
    operation: 'artist-search',
    searchParams: params,
    userId: currentUser?.id 
  }
);
```

### 3. Handle Retryable Errors

```javascript
if (error.isRetryable) {
  // Show retry button
  <button onClick={retryOperation}>Try Again</button>
}
```

### 4. Use Error Boundaries for Critical Sections

```javascript
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>
```

### 5. Validate Input Before API Calls

```javascript
// The API client includes basic validation
try {
  await api.getArtist(''); // Throws validation error
} catch (error) {
  // Handle validation error
}
```

## Development vs Production

### Development Mode
- Detailed error logging to console
- Stack traces displayed
- Technical error details shown in UI
- Component stack traces in error boundary

### Production Mode
- Minimal error logging
- User-friendly messages only
- Error reporting to external service (configurable)
- Generic error messages for security

## Integration with Existing Components

To integrate error handling into existing components:

1. **Replace direct fetch calls** with the updated `api` client
2. **Add error handling hooks** (`useApiError`, `useApiOperation`)
3. **Use error display components** (`ErrorDisplay`, `ErrorBanner`, `InlineError`)
4. **Wrap critical sections** with `ErrorBoundary`

Example migration:

```javascript
// Before
function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/artists')
      .then(res => res.json())
      .then(setArtists)
      .finally(() => setLoading(false));
  }, []);

  return loading ? <div>Loading...</div> : <div>{/* render artists */}</div>;
}

// After
function ArtistList() {
  const artistsOperation = useApiOperation(api.getArtists);

  useEffect(() => {
    artistsOperation.execute();
  }, []);

  if (artistsOperation.isLoading) return <div>Loading...</div>;
  if (artistsOperation.error) return <ErrorDisplay error={artistsOperation.error} />;
  
  return <div>{/* render artists */}</div>;
}
```

This error handling system provides comprehensive, user-friendly error management while maintaining developer productivity and debugging capabilities.