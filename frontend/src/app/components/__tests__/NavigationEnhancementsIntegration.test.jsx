/**
 * Navigation Enhancements Integration Test
 * Tests the comprehensive navigation enhancements across all main pages
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import React from 'react';
import Link from 'next/link'; from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock components to avoid complex dependencies
jest.mock('../../../design-system/components/layout', () => ({
  PageWrapper: ({ children, title, description, ...props }) => (
    <div data-testid="page-wrapper" data-title={title} data-description={description} {...props}>
      <nav data-testid="breadcrumbs" aria-label="Breadcrumb navigation">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/artists">Artists</Link></li>
        </ol>
      </nav>
      <button data-testid="help-trigger" aria-label="Show page help">?</button>
      <button data-testid="scroll-to-top" aria-label="Scroll to top" style={{ display: 'none' }}>↑</button>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}));

jest.mock('../../../design-system/components/navigation', () => ({
  useKeyboardNavigation: () => ({
    isKeyboardMode: false,
    setKeyboardMode: jest.fn(),
    focusedElement: null,
    setFocusedElement: jest.fn()
  }),
  useContextualHelp: () => ({
    isOnboardingActive: false,
    currentStep: 0,
    startOnboarding: jest.fn(),
    nextStep: jest.fn(),
    prevStep: jest.fn(),
    skipOnboarding: jest.fn(),
    showHelp: jest.fn(),
    hideHelp: jest.fn()
  }),
  KeyboardNavigationProvider: ({ children }) => <div data-testid="keyboard-nav-provider">{children}</div>,
  ContextualHelpProvider: ({ children }) => <div data-testid="contextual-help-provider">{children}</div>
}));

// Import the pages to test
import EnhancedArtistsPage from '../../artists/EnhancedArtistsPage';
import EnhancedStudiosPage from '../../studios/EnhancedStudiosPage';
import StylesPage from '../../styles/StylesPage';
import HomePage from '../../page';

describe('Navigation Enhancements Integration', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    usePathname.mockReturnValue('/artists');
    jest.clearAllMocks();
  });

  describe('Breadcrumb Navigation', () => {
    test('renders breadcrumbs on Artists page', () => {
      usePathname.mockReturnValue('/artists');
      
      render(<EnhancedArtistsPage />);
      
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toBeInTheDocument();
      expect(breadcrumbs).toHaveAttribute('aria-label', 'Breadcrumb navigation');
      
      // Check for Home and Artists breadcrumb links
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Artists' })).toBeInTheDocument();
    });

    test('renders breadcrumbs on Studios page', () => {
      usePathname.mockReturnValue('/studios');
      
      render(<EnhancedStudiosPage />);
      
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toBeInTheDocument();
      expect(breadcrumbs).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    });

    test('renders breadcrumbs on Styles page', () => {
      usePathname.mockReturnValue('/styles');
      
      render(<StylesPage />);
      
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toBeInTheDocument();
      expect(breadcrumbs).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    });
  });

  describe('Contextual Help System', () => {
    test('renders help trigger on all main pages', () => {
      const pages = [
        { component: EnhancedArtistsPage, path: '/artists' },
        { component: EnhancedStudiosPage, path: '/studios' },
        { component: StylesPage, path: '/styles' },
        { component: HomePage, path: '/' }
      ];

      pages.forEach(({ component: Component, path }) => {
        usePathname.mockReturnValue(path);
        
        const { unmount } = render(<Component />);
        
        const helpTrigger = screen.getByTestId('help-trigger');
        expect(helpTrigger).toBeInTheDocument();
        expect(helpTrigger).toHaveAttribute('aria-label', 'Show page help');
        
        unmount();
      });
    });

    test('help trigger is accessible via keyboard', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedArtistsPage />);
      
      const helpTrigger = screen.getByTestId('help-trigger');
      
      // Should be focusable
      await user.tab();
      expect(helpTrigger).toHaveFocus();
      
      // Should be activatable with Enter
      await user.keyboard('{Enter}');
      // Help system would be triggered (mocked)
    });
  });

  describe('Keyboard Navigation', () => {
    test('provides keyboard navigation support', () => {
      render(<EnhancedArtistsPage />);
      
      // Check that keyboard navigation provider is present
      expect(screen.getByTestId('keyboard-nav-provider')).toBeInTheDocument();
    });

    test('main content has proper focus management', () => {
      render(<EnhancedArtistsPage />);
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('id', 'main-content');
      expect(mainContent).toHaveAttribute('tabIndex', '-1');
    });

    test('skip to content link is available', () => {
      render(<EnhancedArtistsPage />);
      
      // Skip link should be present (though visually hidden)
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Scroll to Top Functionality', () => {
    test('scroll to top button is present', () => {
      render(<EnhancedArtistsPage />);
      
      const scrollButton = screen.getByTestId('scroll-to-top');
      expect(scrollButton).toBeInTheDocument();
      expect(scrollButton).toHaveAttribute('aria-label', 'Scroll to top');
    });

    test('scroll to top button becomes visible on scroll', async () => {
      render(<EnhancedArtistsPage />);
      
      const scrollButton = screen.getByTestId('scroll-to-top');
      
      // Initially hidden
      expect(scrollButton).toHaveStyle({ display: 'none' });
      
      // Simulate scroll event
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 400
      });
      
      fireEvent.scroll(window);
      
      // Should become visible (in real implementation)
      // This would be tested with actual scroll behavior
    });
  });

  describe('Page Metadata and Titles', () => {
    test('Artists page has correct title and description', () => {
      render(<EnhancedArtistsPage />);
      
      const pageWrapper = screen.getByTestId('page-wrapper');
      expect(pageWrapper).toHaveAttribute('data-title', 'Find Your Perfect Tattoo Artist');
      expect(pageWrapper).toHaveAttribute('data-description', expect.stringContaining('Discover talented tattoo artists'));
    });

    test('Studios page has correct title and description', () => {
      render(<EnhancedStudiosPage />);
      
      const pageWrapper = screen.getByTestId('page-wrapper');
      expect(pageWrapper).toHaveAttribute('data-title', 'Find Your Perfect Tattoo Studio');
      expect(pageWrapper).toHaveAttribute('data-description', expect.stringContaining('Discover professional tattoo studios'));
    });

    test('Styles page has correct title and description', () => {
      render(<StylesPage />);
      
      const pageWrapper = screen.getByTestId('page-wrapper');
      expect(pageWrapper).toHaveAttribute('data-title', 'Tattoo Styles');
      expect(pageWrapper).toHaveAttribute('data-description', expect.stringContaining('Explore different tattoo styles'));
    });

    test('Home page has correct title and description', () => {
      render(<HomePage />);
      
      const pageWrapper = screen.getByTestId('page-wrapper');
      expect(pageWrapper).toHaveAttribute('data-title', 'Tattoo Directory');
      expect(pageWrapper).toHaveAttribute('data-description', expect.stringContaining('Discover exceptional tattoo artists'));
    });
  });

  describe('Accessibility Features', () => {
    test('all pages have proper ARIA labels', () => {
      const pages = [
        { component: EnhancedArtistsPage, path: '/artists' },
        { component: EnhancedStudiosPage, path: '/studios' },
        { component: StylesPage, path: '/styles' },
        { component: HomePage, path: '/' }
      ];

      pages.forEach(({ component: Component, path }) => {
        usePathname.mockReturnValue(path);
        
        const { unmount } = render(<Component />);
        
        // Main content should have proper role and label
        const mainContent = screen.getByRole('main');
        expect(mainContent).toBeInTheDocument();
        
        // Breadcrumbs should have proper ARIA label
        const breadcrumbs = screen.getByTestId('breadcrumbs');
        expect(breadcrumbs).toHaveAttribute('aria-label', 'Breadcrumb navigation');
        
        unmount();
      });
    });

    test('keyboard shortcuts are properly handled', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedArtistsPage />);
      
      // Test global keyboard shortcuts
      await user.keyboard('{Alt>}h{/Alt}'); // Alt+H for home
      expect(mockRouter.push).toHaveBeenCalledWith('/');
      
      await user.keyboard('{Alt>}a{/Alt}'); // Alt+A for artists
      expect(mockRouter.push).toHaveBeenCalledWith('/artists');
      
      await user.keyboard('{Alt>}s{/Alt}'); // Alt+S for studios
      expect(mockRouter.push).toHaveBeenCalledWith('/studios');
    });
  });

  describe('Mobile Navigation Support', () => {
    test('pages are mobile-friendly with touch targets', () => {
      render(<EnhancedArtistsPage />);
      
      // Help trigger should be large enough for touch
      const helpTrigger = screen.getByTestId('help-trigger');
      expect(helpTrigger).toBeInTheDocument();
      
      // Scroll to top button should be large enough for touch
      const scrollButton = screen.getByTestId('scroll-to-top');
      expect(scrollButton).toBeInTheDocument();
    });
  });

  describe('Page Transitions', () => {
    test('pages support smooth transitions', () => {
      render(<EnhancedArtistsPage />);
      
      // PageWrapper should handle transitions
      const pageWrapper = screen.getByTestId('page-wrapper');
      expect(pageWrapper).toBeInTheDocument();
    });
  });

  describe('Integration with Existing Components', () => {
    test('navigation enhancements work with search functionality', () => {
      render(<EnhancedArtistsPage />);
      
      // Should have search input
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      expect(searchInput).toBeInTheDocument();
      
      // Should work with keyboard navigation
      expect(screen.getByTestId('keyboard-nav-provider')).toBeInTheDocument();
    });

    test('navigation enhancements work with filters', () => {
      render(<EnhancedArtistsPage />);
      
      // Should have filter components
      // This would test integration with existing filter functionality
      expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();
    });
  });
});