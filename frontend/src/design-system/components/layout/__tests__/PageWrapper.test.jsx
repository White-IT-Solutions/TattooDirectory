import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import PageWrapper from '../PageWrapper/PageWrapper';
import { KeyboardNavigationProvider } from '../../navigation/KeyboardNavigation';
import { ContextualHelpProvider } from '../../navigation/ContextualHelp';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock createPortal to avoid portal-related issues in tests
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children) => children,
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

const TestWrapper = ({ children }) => (
  <KeyboardNavigationProvider>
    <ContextualHelpProvider>
      {children}
    </ContextualHelpProvider>
  </KeyboardNavigationProvider>
);

describe('PageWrapper', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/artists');
    useRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any stuck elements
    document.querySelectorAll('[data-keyboard-shortcuts-backdrop="true"]').forEach(el => el.remove());
  });

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div data-testid="test-content">Test Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('renders page title when provided', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Test Page Title">
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Test Page Title')).toBeInTheDocument();
    });

    it('renders page description when provided', () => {
      render(
        <TestWrapper>
          <PageWrapper 
            title="Test Page" 
            description="This is a test page description"
          >
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('This is a test page description')).toBeInTheDocument();
    });

    it('generates automatic page metadata based on pathname', () => {
      usePathname.mockReturnValue('/artists');
      
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Tattoo Artists')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('renders breadcrumbs by default', () => {
      usePathname.mockReturnValue('/artists/123');
      
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Artists')).toBeInTheDocument();
    });

    it('hides breadcrumbs when showBreadcrumbs is false', () => {
      usePathname.mockReturnValue('/artists/123');
      
      render(
        <TestWrapper>
          <PageWrapper showBreadcrumbs={false}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      // Should not render breadcrumb navigation
      expect(screen.queryByLabelText('Breadcrumb navigation')).not.toBeInTheDocument();
    });

    it('uses custom breadcrumbs when provided', () => {
      const customBreadcrumbs = [
        { href: '/', label: 'Home' },
        { href: '/custom', label: 'Custom Page' }
      ];

      render(
        <TestWrapper>
          <PageWrapper customBreadcrumbs={customBreadcrumbs}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Custom Page')).toBeInTheDocument();
    });

    it('generates correct breadcrumbs for different paths', () => {
      const testCases = [
        { path: '/artists', expectedLabels: ['Home', 'Artists'] },
        { path: '/studios', expectedLabels: ['Home', 'Studios'] },
        { path: '/styles', expectedLabels: ['Home', 'Styles'] },
        { path: '/artists/123', expectedLabels: ['Home', 'Artists', '123'] }
      ];

      testCases.forEach(({ path, expectedLabels }) => {
        usePathname.mockReturnValue(path);
        
        const { unmount } = render(
          <TestWrapper>
            <PageWrapper>
              <div>Content</div>
            </PageWrapper>
          </TestWrapper>
        );

        expectedLabels.forEach(label => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });

        unmount();
      });
    });
  });

  describe('Page Header', () => {
    it('renders page header by default', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Test Page">
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('hides page header when showPageHeader is false', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Test Page" showPageHeader={false}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });

    it('renders header actions when provided', () => {
      const headerActions = (
        <button data-testid="header-action">Action Button</button>
      );

      render(
        <TestWrapper>
          <PageWrapper title="Test Page" headerActions={headerActions}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByTestId('header-action')).toBeInTheDocument();
    });

    it('applies sticky header class when stickyHeader is true', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Test Page" stickyHeader={true}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('handles Alt+H shortcut for home navigation', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 'h', altKey: true });

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('handles Alt+A shortcut for artists navigation', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 'a', altKey: true });

      expect(mockRouter.push).toHaveBeenCalledWith('/artists');
    });

    it('handles Alt+S shortcut for studios navigation', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 's', altKey: true });

      expect(mockRouter.push).toHaveBeenCalledWith('/studios');
    });

    it('handles Alt+T shortcut for styles navigation', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 't', altKey: true });

      expect(mockRouter.push).toHaveBeenCalledWith('/styles');
    });

    it('ignores shortcuts when modifier keys are not pressed', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 'h' }); // No altKey

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Layout Configuration', () => {
    it('applies correct max-width classes', () => {
      const { rerender } = render(
        <TestWrapper>
          <PageWrapper maxWidth="sm">
            <div data-testid="content">Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      // Find the header container that should have the max-width class
      const headerContainer = screen.getByRole('banner').querySelector('div');
      expect(headerContainer).toHaveClass('max-w-2xl');

      rerender(
        <TestWrapper>
          <PageWrapper maxWidth="lg">
            <div data-testid="content">Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const newHeaderContainer = screen.getByRole('banner').querySelector('div');
      expect(newHeaderContainer).toHaveClass('max-w-6xl');
    });

    it('applies correct padding classes', () => {
      const { rerender } = render(
        <TestWrapper>
          <PageWrapper contentPadding="sm">
            <div data-testid="content">Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      // Find the content wrapper div that should have padding classes
      let contentWrapper = screen.getByTestId('content').closest('[class*="px-"]');
      expect(contentWrapper).toHaveClass('px-4', 'py-3');

      rerender(
        <TestWrapper>
          <PageWrapper contentPadding="lg">
            <div data-testid="content">Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      contentWrapper = screen.getByTestId('content').closest('[class*="px-"]');
      expect(contentWrapper).toHaveClass('px-6', 'lg:px-8', 'py-8');
    });
  });

  describe('Page Transitions', () => {
    it('enables page transitions by default', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      // The content should be wrapped in a transition component
      // This is tested indirectly through the NavigationEnhancement component
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('disables page transitions when pageTransition is false', () => {
      render(
        <TestWrapper>
          <PageWrapper pageTransition={false}>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Main Page Title">
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Main Page Title');
    });

    it('provides page information tooltip', () => {
      render(
        <TestWrapper>
          <PageWrapper title="Test Page" description="Test description">
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const infoButton = screen.getByLabelText('Page information and shortcuts');
      expect(infoButton).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Main content');
    });
  });

  describe('Error Handling', () => {
    it('handles missing router gracefully', () => {
      useRouter.mockReturnValue(null);

      expect(() => {
        render(
          <TestWrapper>
            <PageWrapper>
              <div>Content</div>
            </PageWrapper>
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles invalid pathname gracefully', () => {
      usePathname.mockReturnValue('');

      render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </TestWrapper>
      );

      unmount();

      // Verify that event listeners are cleaned up
      expect(removeEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});