# Toast Notification System

A comprehensive toast notification system with multiple variants, positioning options, and accessibility support.

## Features

- ✅ **Multiple Variants**: Success, error, warning, and info toast types
- ✅ **Proper Positioning**: Configurable positioning (top/bottom + left/center/right)
- ✅ **Stacking Support**: Multiple toasts with visual stacking effects
- ✅ **Auto-dismiss**: Configurable timing with manual dismiss option
- ✅ **Action Buttons**: Optional action buttons for toast interactions
- ✅ **Accessibility**: Full screen reader support with ARIA attributes
- ✅ **Animations**: Smooth entrance and exit animations
- ✅ **Portal Rendering**: Renders outside component tree for proper layering

## Components

### Toast
Individual toast notification component with variants and animations.

### ToastContainer
Container component that handles positioning and stacking of multiple toasts.

### ToastProvider
Context provider that manages toast state and provides convenience methods.

## Usage

### Basic Setup

```jsx
import { ToastProvider } from '@/design-system/components/feedback/Toast';

function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

### Using Toasts

```jsx
import { useToast } from '@/design-system/components/feedback/Toast';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSuccess = () => {
    success('Operation completed successfully!');
  };

  const handleError = () => {
    error('Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    warning('This action cannot be undone.');
  };

  const handleInfo = () => {
    info('New features are available.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success Toast</button>
      <button onClick={handleError}>Error Toast</button>
      <button onClick={handleWarning}>Warning Toast</button>
      <button onClick={handleInfo}>Info Toast</button>
    </div>
  );
}
```

### Advanced Usage

```jsx
import { useToast } from '@/design-system/components/feedback/Toast';

function AdvancedComponent() {
  const { addToast, removeAllToasts } = useToast();

  const handleAdvancedToast = () => {
    addToast({
      type: 'success',
      title: 'Upload Complete',
      message: 'Your file has been uploaded successfully.',
      duration: 0, // No auto-dismiss
      action: {
        label: 'View File',
        onClick: () => {
          // Handle action
          console.log('View file clicked');
        },
      },
    });
  };

  return (
    <div>
      <button onClick={handleAdvancedToast}>
        Advanced Toast
      </button>
      <button onClick={removeAllToasts}>
        Clear All Toasts
      </button>
    </div>
  );
}
```

## API Reference

### ToastProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Toast position: `'top-right'`, `'top-left'`, `'top-center'`, `'bottom-right'`, `'bottom-left'`, `'bottom-center'` |
| `maxToasts` | `number` | `5` | Maximum number of visible toasts |
| `defaultDuration` | `number` | `5000` | Default auto-dismiss duration in milliseconds |

### useToast Hook

Returns an object with the following methods:

#### Convenience Methods
- `success(message, options?)` - Show success toast
- `error(message, options?)` - Show error toast  
- `warning(message, options?)` - Show warning toast
- `info(message, options?)` - Show info toast

#### Advanced Methods
- `addToast(toast)` - Add custom toast
- `removeToast(id)` - Remove specific toast
- `removeAllToasts()` - Remove all toasts
- `updateToast(id, updates)` - Update existing toast

#### State
- `toasts` - Array of current toasts

### Toast Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast variant |
| `title` | `string` | - | Optional toast title |
| `message` | `string` | **Required** | Toast message content |
| `duration` | `number` | `5000` | Auto-dismiss duration (0 = no auto-dismiss) |
| `action` | `object` | - | Optional action button `{ label: string, onClick: function }` |

## Styling

The toast system uses Tailwind CSS classes and follows the design system color palette:

- **Success**: Green color scheme (`bg-green-50`, `border-green-200`, `text-green-800`)
- **Error**: Red color scheme (`bg-red-50`, `border-red-200`, `text-red-800`)
- **Warning**: Yellow color scheme (`bg-yellow-50`, `border-yellow-200`, `text-yellow-800`)
- **Info**: Blue color scheme (`bg-blue-50`, `border-blue-200`, `text-blue-800`)

## Accessibility

The toast system includes comprehensive accessibility features:

- **ARIA Attributes**: `role="alert"`, `aria-live="polite"`, `aria-atomic="true"`
- **Screen Reader Support**: Proper labeling and live region announcements
- **Keyboard Navigation**: Focus management and keyboard dismissal
- **High Contrast**: Sufficient color contrast ratios for all variants
- **Semantic HTML**: Proper button and heading elements

## Animation

Toasts include smooth animations:

- **Entrance**: Slide in from the right with fade-in effect
- **Exit**: Slide out to the right with fade-out and scale effect
- **Stacking**: Visual stacking effect for multiple toasts
- **Duration**: 300ms transition duration for smooth interactions

## Testing

The toast system includes comprehensive test coverage:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Provider and hook testing
- **Accessibility Tests**: ARIA attributes and screen reader support
- **Animation Tests**: Entrance and exit animation behavior
- **Auto-dismiss Tests**: Timer-based functionality

Run tests with:
```bash
npm test -- Toast
```

## Examples

### Basic Notifications
```jsx
const { success, error } = useToast();

// Simple success message
success('Settings saved successfully!');

// Error with longer message
error('Failed to save settings. Please check your connection and try again.');
```

### Notifications with Actions
```jsx
const { addToast } = useToast();

// Undo action
addToast({
  type: 'success',
  title: 'Item Deleted',
  message: 'The item has been moved to trash.',
  action: {
    label: 'Undo',
    onClick: () => restoreItem(),
  },
});

// Retry action
addToast({
  type: 'error',
  title: 'Upload Failed',
  message: 'Could not upload file. Check your connection.',
  action: {
    label: 'Retry',
    onClick: () => retryUpload(),
  },
});
```

### Persistent Notifications
```jsx
const { addToast } = useToast();

// No auto-dismiss for important messages
addToast({
  type: 'warning',
  title: 'Maintenance Notice',
  message: 'System maintenance will begin in 10 minutes.',
  duration: 0, // No auto-dismiss
});
```

## Best Practices

1. **Message Length**: Keep messages concise and actionable
2. **Toast Types**: Use appropriate types for different scenarios
3. **Actions**: Provide clear, actionable buttons when needed
4. **Duration**: Use longer durations for complex messages
5. **Positioning**: Consider user workflow when choosing position
6. **Accessibility**: Always provide meaningful titles and messages
7. **Error Handling**: Include recovery actions for error toasts
8. **Success Feedback**: Confirm successful actions with success toasts