"use client";
import { 
  EnhancedNavbar,
  KeyboardNavigationProvider,
  ContextualHelpProvider,
  MobileNavigation
} from '../../design-system/components/navigation';

// Navigation items configuration
const navItems = [
  { href: '/artists', label: 'Artists' },
  { href: '/studios', label: 'Studios' },
  { href: '/styles', label: 'Styles' }
];

export default function Navbar() {
  return (
    <KeyboardNavigationProvider
      showFocusIndicator={true}
      showSkipLinks={true}
    >
      <ContextualHelpProvider
        showHelpTrigger={true}
        autoStartOnboarding={false}
      >
        {/* Enhanced Desktop/Tablet Navigation */}
        <EnhancedNavbar
          navItems={navItems}
          showSearch={true}
          showBreadcrumbs={true}
          autoHide={false}
          size="compact"
        />

        {/* Mobile Navigation */}
        <MobileNavigation
          navItems={navItems}
          showSearch={true}
          autoHide={true}
        />
      </ContextualHelpProvider>
    </KeyboardNavigationProvider>
  );
}
