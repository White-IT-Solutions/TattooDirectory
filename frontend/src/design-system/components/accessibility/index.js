// Accessibility Components Export
// Comprehensive accessibility and responsive design system

// Core Accessibility Provider
export { default as AccessibilityProvider, useAccessibility } from './AccessibilityProvider';

// Touch Target Components
export {
  default as TouchTarget,
  TouchButton,
  TouchIconButton,
  TouchLink,
  TouchArea,
  useTouchTarget,
  touchTargetVariants
} from './TouchTargets';

// ARIA Labels and Screen Reader Support
export {
  default as AriaLabelsProvider,
  useAriaLabels,
  AriaLabel,
  ScreenReaderOnly,
  VisuallyHidden,
  LiveRegion,
  Landmark,
  FocusManager,
  AccessibleButton,
  defaultAriaLabels
} from './AriaLabels';

// Responsive Layout System
export {
  default as Container,
  Grid,
  Stack,
  Flex,
  ResponsiveImage,
  ShowAt,
  HideAt,
  AspectRatio,
  Spacer,
  useMediaQuery,
  useBreakpoint,
  breakpoints,
  containerVariants,
  gridVariants,
  stackVariants
} from './ResponsiveLayout';

// Accessibility Controls
export {
  default as AccessibilityControls,
  AccessibilityStatus,
  AccessibilityAnnouncer
} from './AccessibilityControls';

// Keyboard Navigation (re-export from navigation)
export {
  default as KeyboardNavigationProvider,
  useKeyboardNavigation,
  useFocusTrap,
  Focusable,
  SkipLinks,
  KeyboardShortcutsHelp,
  FocusIndicator
} from '../navigation/KeyboardNavigation/KeyboardNavigation';

// Gesture Support (re-export from navigation)
export {
  default as GestureSupport,
  useGestureSupport,
  TouchFriendlyButton
} from '../navigation/GestureSupport/GestureSupport';