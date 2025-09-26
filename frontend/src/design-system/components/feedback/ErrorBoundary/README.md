# Enhanced ErrorBoundary Component

A comprehensive React Error Boundary component with branded error pages, user-friendly messaging, and advanced error handling capabilities for the Tattoo Artist Directory.

## Features

### 🎨 Branded Design
- Custom tattoo-themed error illustrations
- Design system integration with CSS custom properties
- Dark/light mode support
- Responsive layouts for all screen sizes

### 🔧 Advanced Error Handling
- Automatic error categorization and user-friendly messages
- Retry mechanisms for transient errors (network, loading, timeout)
- Error reporting with unique tracking IDs
- Graceful fallbacks for component failures

### 📊 Error Reporting & Analytics
- Comprehensive error reporting with context
- Integration with monitoring services
- Development vs production error handling
- Retry attempt tracking

### ♿ Accessibility & UX
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Touch-friendly button targets (44px minimum)

## Basic Usage

### Simple Error Boundary

```jsx
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Error Handling

```jsx
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function App() {
  const handleError = (error, errorInfo, errorId) => {
    console.log('Error caught:', { error, errorInfo, errorId });
    // Send to your monitoring service
  };

  const handleRetry = (retryCount) => {
    console.log(`Retry attempt #${retryCount}`);
  };

  return (
    <ErrorBoundary 
      onError={handleError}
      onRetry={handleRetry}
      maxRetries={3}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Compact Variant for Smaller Spaces

```jsx
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function ComponentCard() {
  return (
    <ErrorBoundary variant="compact">
      <CardContent />
    </ErrorBoundary>
  );
}
```

## Advanced Usage

### Custom Fallback UI

```jsx
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function App() {
  const customFallback = (error, actions) => (
    <div className="custom-error-page">
      <h1>Custom Error Page</h1>
      <p>Something went wrong: {error.message}</p>
      <button onClick={actions.retry}>Try Again</button>
      <button onClick={actions.goHome}>Go Home</button>
    </div>
  );

  return (
    <ErrorBoundary fallback={customFallback}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Higher-Order Component

```jsx
import { withErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

const MyComponent = () => <div>My Component</div>;

const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
  showRetry: true,
  maxRetries: 2,
  onError: (error) => console.log('HOC Error:', error)
});
```

### Hook for Functional Components

```jsx
import { useErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function MyComponent() {
  const throwError = useErrorBoundary();

  const handleAsyncError = async () => {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      throwError(error); // This will trigger the error boundary
    }
  };

  return (
    <button onClick={handleAsyncError}>
      Perform Risky Operation
    </button>
  );
}
```

## Props

### ErrorBoundary Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Components to wrap with error boundary |
| `fallback` | `Function` | - | Custom fallback UI renderer |
| `variant` | `'full' \| 'compact'` | `'full'` | Display variant |
| `showRetry` | `boolean` | `true` | Show retry button for retryable errors |
| `showReload` | `boolean` | `true` | Show reload page button |
| `showHome` | `boolean` | `true` | Show go home button |
| `showFeedback` | `boolean` | `true` | Show send feedback button |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `onError` | `Function` | - | Error callback `(error, errorInfo, errorId) => void` |
| `onRetry` | `Function` | - | Retry callback `(retryCount) => void` |
| `onReload` | `Function` | - | Reload callback `() => void` |
| `onGoHome` | `Function` | - | Go home callback `() => void` |
| `onSendFeedback` | `Function` | - | Send feedback callback `(errorId, error) => void` |
| `onReportError` | `Function` | - | Error reporting callback `(errorReport) => void` |
| `userId` | `string` | `'anonymous'` | User ID for error reporting |

### Fallback Function Signature

```typescript
type FallbackFunction = (
  error: Error,
  actions: {
    retry: () => void;
    reload: () => void;
    goHome: () => void;
    errorId: string;
    retryCount: number;
  }
) => ReactNode;
```

## Error Types & User Messages

The ErrorBoundary automatically provides user-friendly messages based on error patterns:

### Network Errors
- **Pattern**: `/network|fetch|connection/i`
- **Message**: "We're having trouble connecting to our servers. Please check your internet connection."

### Chunk Load Errors
- **Pattern**: `/ChunkLoadError|Loading chunk/i`
- **Message**: "We're having trouble loading part of the application. This usually happens after an update."

### Timeout Errors
- **Pattern**: `/timeout/i`
- **Message**: "The request is taking longer than expected. Please try again."

### Generic Errors
- **Fallback**: "Something unexpected happened. Our team has been notified and we're working to fix it."

## Error Reporting

The ErrorBoundary automatically generates comprehensive error reports:

```typescript
interface ErrorReport {
  errorId: string;           // Unique error identifier
  message: string;           // Error message
  stack: string;             // Error stack trace
  componentStack: string;    // React component stack
  timestamp: string;         // ISO timestamp
  userAgent: string;         // Browser user agent
  url: string;              // Current page URL
  userId: string;           // User identifier
  buildVersion: string;     // App build version
  retryCount: number;       // Number of retry attempts
}
```

### Custom Error Reporting

```jsx
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

function App() {
  const reportError = async (errorReport) => {
    // Send to your monitoring service
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    });
    
    // Send to analytics
    analytics.track('Error Occurred', errorReport);
  };

  return (
    <ErrorBoundary onReportError={reportError}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Illustrations

The ErrorBoundary includes branded tattoo-themed illustrations:

### ErrorIllustration
- **Simple variant**: Minimalist broken tattoo machine icon
- **Detailed variant**: Animated tattoo machine with sparks and decorative elements

### Specialized Illustrations
- **NetworkErrorIllustration**: Disconnected signal bars with warning
- **ChunkLoadErrorIllustration**: Broken loading circle with missing puzzle piece

```jsx
import { 
  ErrorIllustration, 
  NetworkErrorIllustration, 
  ChunkLoadErrorIllustration 
} from '@/design-system/components/feedback/ErrorBoundary';

// Use in custom error pages
<ErrorIllustration variant="detailed" className="w-32 h-32" />
<NetworkErrorIllustration className="w-24 h-24" />
<ChunkLoadErrorIllustration className="w-20 h-20" />
```

## Testing

### Unit Tests

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

// Test component that throws an error
function ThrowError({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

test('catches and displays error', () => {
  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});

test('retry functionality works', () => {
  const { rerender } = render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  fireEvent.click(screen.getByRole('button', { name: /try again/i }));

  rerender(
    <ErrorBoundary>
      <ThrowError shouldThrow={false} />
    </ErrorBoundary>
  );

  expect(screen.getByText('No error')).toBeInTheDocument();
});
```

### Integration with Testing Libraries

```jsx
// Mock console methods to avoid noise in tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'group').mockImplementation(() => {});
  jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.group.mockRestore();
  console.groupEnd.mockRestore();
});
```

## Best Practices

### 1. Strategic Placement
```jsx
// ✅ Good: Wrap entire app or major sections
<ErrorBoundary>
  <App />
</ErrorBoundary>

// ✅ Good: Wrap individual features
<ErrorBoundary variant="compact">
  <ArtistCard />
</ErrorBoundary>

// ❌ Avoid: Wrapping every small component
```

### 2. Error Reporting Integration
```jsx
// ✅ Good: Integrate with monitoring service
<ErrorBoundary 
  onReportError={sendToSentry}
  userId={user.id}
>
  <App />
</ErrorBoundary>
```

### 3. Graceful Degradation
```jsx
// ✅ Good: Provide meaningful fallbacks
<ErrorBoundary 
  fallback={(error, actions) => (
    <div>
      <h2>Artist profiles are temporarily unavailable</h2>
      <button onClick={actions.retry}>Try Again</button>
      <Link to="/studios">Browse Studios Instead</Link>
    </div>
  )}
>
  <ArtistProfiles />
</ErrorBoundary>
```

### 4. Development vs Production
```jsx
// ✅ Good: Different behavior for different environments
<ErrorBoundary 
  showRetry={process.env.NODE_ENV === 'production'}
  onReportError={process.env.NODE_ENV === 'production' ? sendToMonitoring : undefined}
>
  <App />
</ErrorBoundary>
```

## Accessibility Features

- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and visible focus indicators
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Color Contrast**: WCAG AA compliant color combinations
- **Animation Respect**: Respects `prefers-reduced-motion` settings

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Error Boundaries**: React 16+ feature, graceful degradation for older versions
- **CSS Custom Properties**: Fallback values provided for older browsers
- **Fetch API**: Polyfill recommended for IE11 if error reporting is needed

## Migration from Legacy ErrorBoundary

```jsx
// Old usage
import ErrorBoundary from '@/components/ErrorBoundary';

// New usage
import { ErrorBoundary } from '@/design-system/components/feedback/ErrorBoundary';

// The API is mostly compatible, with additional features:
<ErrorBoundary 
  // Legacy props still work
  onError={handleError}
  
  // New enhanced features
  variant="compact"
  maxRetries={3}
  showFeedback={true}
  onReportError={reportToMonitoring}
>
  <YourComponent />
</ErrorBoundary>
```

## Related Components

- **Toast**: For non-critical error notifications
- **Modal**: For error dialogs that require user action
- **Alert**: For inline error messages in forms
- **Loading**: For loading states that prevent errors