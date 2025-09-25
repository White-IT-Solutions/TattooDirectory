# Theme Management System

A comprehensive theme management system for the Tattoo Artist Directory with support for light/dark modes, accessibility features, and smooth transitions.

## Features

### ✅ Core Theme Management
- **Light/Dark Mode Toggle**: Switch between light and dark themes
- **System Preference Detection**: Automatically detect and follow system theme preference
- **Theme Persistence**: Save theme preference across browser sessions
- **Smooth Transitions**: Animated transitions between theme changes (respects reduced motion)

### ✅ Accessibility Features
- **High Contrast Mode**: Enhanced contrast for better visibility
- **Reduced Motion Support**: Respects user's motion preferences
- **Font Size Controls**: Adjustable text size for better readability
- **Enhanced Focus Indicators**: Stronger focus outlines for keyboard navigation
- **Screen Reader Support**: Proper announcements for theme changes

### ✅ Component Integration
- **Universal Compatibility**: All design system components work in both themes
- **CSS Custom Properties**: Semantic color tokens that adapt to theme
- **Smooth Animations**: Theme-aware transitions and micro-interactions
- **Mobile Optimization**: Touch-friendly controls and responsive design

## Components

### ThemeProvider
Main provider component that wraps your application.

```jsx
import { ThemeProvider } from '@/design-system/components/ui/ThemeProvider';

function App() {
  return (
    <ThemeProvider 
      defaultTheme="system" 
      enableTransitions={true}
      storageKey="my-app-theme"
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

**Props:**
- `defaultTheme`: `'light' | 'dark' | 'system'` - Default theme (default: 'system')
- `enableTransitions`: `boolean` - Enable smooth theme transitions (default: true)
- `storageKey`: `string` - localStorage key for persistence (default: 'tattoo-directory-theme')
- `attribute`: `'class' | 'data-theme'` - How to apply theme (default: 'class')
- `themeValues`: `object` - Theme class names (default: { light: 'light', dark: 'dark' })

### ThemeToggle
Simple toggle button for switching themes.

```jsx
import { ThemeToggle } from '@/design-system/components/ui/ThemeProvider';

function Header() {
  return (
    <header>
      <ThemeToggle size="md" showLabel />
    </header>
  );
}
```

**Props:**
- `variant`: `'button' | 'dropdown'` - Display style (default: 'button')
- `size`: `'sm' | 'md' | 'lg'` - Button size (default: 'md')
- `showLabel`: `boolean` - Show theme label text (default: false)

### ThemeSegmentedControl
Segmented control for all theme options.

```jsx
import { ThemeSegmentedControl } from '@/design-system/components/ui/ThemeProvider';

function Settings() {
  return (
    <div>
      <label>Theme Preference</label>
      <ThemeSegmentedControl showIcons showLabels />
    </div>
  );
}
```

**Props:**
- `size`: `'sm' | 'md' | 'lg'` - Control size (default: 'md')
- `showIcons`: `boolean` - Show theme icons (default: true)
- `showLabels`: `boolean` - Show theme labels (default: true)

### AccessibilityControls
Comprehensive accessibility preference panel.

```jsx
import { AccessibilityControls } from '@/design-system/components/ui/ThemeProvider';

function SettingsPage() {
  return (
    <div>
      <AccessibilityControls variant="panel" />
    </div>
  );
}
```

**Props:**
- `variant`: `'panel' | 'compact'` - Display style (default: 'panel')

## Hook Usage

### useTheme
Access theme state and controls.

```jsx
import { useTheme } from '@/design-system/components/ui/ThemeProvider';

function MyComponent() {
  const { 
    theme,           // Current theme setting ('light' | 'dark' | 'system')
    actualTheme,     // Resolved theme ('light' | 'dark')
    setTheme,        // Function to set theme
    toggleTheme,     // Function to toggle between themes
    isHighContrast,  // High contrast mode status
    setHighContrast, // Function to toggle high contrast
    isReducedMotion, // Reduced motion preference
    getThemeIcon,    // Get icon for current theme
    getThemeLabel,   // Get label for current theme
    mounted          // Hydration safety flag
  } = useTheme();

  if (!mounted) {
    return <div>Loading...</div>; // Prevent hydration mismatch
  }

  return (
    <div>
      <p>Current theme: {getThemeLabel()}</p>
      <button onClick={toggleTheme}>
        {getThemeIcon()} Toggle Theme
      </button>
    </div>
  );
}
```

## CSS Integration

The theme system uses CSS custom properties for seamless integration:

```css
/* Your components automatically adapt */
.my-component {
  background-color: var(--background-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
  transition: all var(--duration-200) var(--ease-out);
}

/* Theme-specific overrides */
.dark .my-component {
  /* Dark mode styles are handled automatically */
}

/* High contrast support */
.high-contrast .my-component {
  border-width: 2px;
  outline: 2px solid var(--border-primary);
}

/* Reduced motion support */
.reduced-motion .my-component {
  transition: none;
}
```

## Design Tokens

The theme system provides semantic color tokens:

```javascript
// Background colors
--background-primary     // Main background
--background-secondary   // Secondary background
--background-muted       // Muted background
--background-subtle      // Subtle background

// Text colors
--text-primary          // Primary text
--text-secondary        // Secondary text
--text-muted           // Muted text
--text-subtle          // Subtle text

// Interactive colors
--interactive-primary          // Primary buttons/links
--interactive-primary-hover    // Primary hover state
--interactive-secondary        // Secondary buttons
--interactive-accent          // Accent elements

// Feedback colors
--feedback-success     // Success states
--feedback-warning     // Warning states
--feedback-error       // Error states
--feedback-info        // Info states
```

## Best Practices

### 1. Always Check Mounted State
```jsx
function MyComponent() {
  const { mounted } = useTheme();
  
  if (!mounted) {
    return <div>Loading...</div>; // Prevent hydration issues
  }
  
  // Rest of component
}
```

### 2. Use Semantic Tokens
```css
/* Good - uses semantic tokens */
.button {
  background-color: var(--interactive-primary);
  color: var(--text-inverse);
}

/* Avoid - uses raw color values */
.button {
  background-color: #5c475c;
  color: white;
}
```

### 3. Respect User Preferences
```jsx
function AnimatedComponent() {
  const { isReducedMotion } = useTheme();
  
  return (
    <div 
      className={cn(
        'transition-transform',
        !isReducedMotion && 'hover:scale-105'
      )}
    >
      Content
    </div>
  );
}
```

### 4. Provide Theme Controls
```jsx
function AppHeader() {
  return (
    <header>
      {/* Simple toggle */}
      <ThemeToggle />
      
      {/* Or full controls in settings */}
      <AccessibilityControls variant="compact" />
    </header>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with smooth transitions
- **Legacy Browsers**: Graceful degradation without transitions
- **Mobile**: Touch-friendly controls and proper viewport handling
- **Screen Readers**: Full accessibility support with announcements

## Performance

- **Lazy Loading**: Theme components are loaded only when needed
- **Efficient Updates**: Only affected elements transition during theme changes
- **Memory Optimized**: Minimal memory footprint with cleanup on unmount
- **Bundle Size**: ~8KB gzipped for complete theme system

## Migration Guide

### From Basic Dark Mode
```jsx
// Before
const [darkMode, setDarkMode] = useState(false);

// After
import { ThemeProvider, useTheme } from '@/design-system/components/ui/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### CSS Migration
```css
/* Before */
.component {
  background: white;
  color: black;
}

.dark .component {
  background: black;
  color: white;
}

/* After */
.component {
  background-color: var(--background-primary);
  color: var(--text-primary);
  transition: all var(--duration-200) var(--ease-out);
}
```

## Demo

Visit `/theme-demo` to see the complete theme system in action with:
- All theme controls
- Component compatibility showcase
- Accessibility features demonstration
- Performance metrics
- Interactive examples

## Testing

The theme system includes comprehensive tests:

```bash
npm test -- --testPathPattern=ThemeProvider.test.js
```

Tests cover:
- Theme switching functionality
- Persistence across sessions
- System preference detection
- Accessibility features
- Component integration
- Error handling