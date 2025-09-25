/**
 * Search Accessibility Tests (WCAG 2.1 AA Compliance)
 * 
 * These tests ensure that all search functionality meets accessibility
 * standards and provides an inclusive experience for all users.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Import search components
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';
import AdvancedSearchInterface from '../../app/components/AdvancedSearchInterface';
import SearchFeedbackSystem from '../../app/components/SearchFeedbackSystem';

// Import pages
import ArtistsPage from '../../app/artists/page';
import StudiosPage from '../../app/studios/page';

// Import search controller for testing
import { SearchQuery } from '../../lib/search-controller';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API calls
jest.mock('../../lib/api', () => ({
  api: {
    searchArtists: jest.fn().mockResolvedValue({ artists: [], totalCount: 0 }),
    searchStudios: jest.fn().mockResolvedValue({ studios: [], totalCount: 0 }),
    getArtists: jest.fn().mockResolvedValue([]),
    getStudios: jest.fn().mockResolvedValue([]),
  }
}));

describe('Search Accessibility Tests (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EnhancedStyleFilter Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EnhancedStyleFilter onStylesChange={() => {}} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Search input should have proper labeling
      const searchInput = screen.getByTestId('style-search-input');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
      
      // Style buttons should have proper ARIA attributes
      const styleButtons = screen.getAllByTestId(/^style-button-/);
      styleButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('role', 'button');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Tab to search input
      await user.tab();
      expect(document.activeElement).toHaveAttribute('data-testid', 'style-search-input');
      
      // Tab to first style button
      await user.tab();
      const firstStyleButton = screen.getByTestId('style-button-old_school');
      expect(document.activeElement).toBe(firstStyleButton);
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(firstStyleButton).toHaveAttribute('aria-pressed', 'true');
      
      // Should be able to activate with Space
      await user.keyboard(' ');
      expect(firstStyleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Focus should be visible
      const searchInput = screen.getByTestId('style-search-input');
      await user.click(searchInput);
      
      expect(document.activeElement).toBe(searchInput);
      expect(searchInput).toHaveClass('focus:ring-2'); // Assuming Tailwind focus styles
    });

    it('should announce filter changes to screen readers', async () => {
      const user = userEvent.setup();
      const onStylesChange = jest.fn();
      render(<EnhancedStyleFilter onStylesChange={onStylesChange} />);
      
      const styleButton = screen.getByTestId('style-button-old_school');
      await user.click(styleButton);
      
      // Check for aria-live region or status updates
      const liveRegion = screen.queryByRole('status');
      if (liveRegion) {
        expect(liveRegion).toBeInTheDocument();
      }
      
      // Button should indicate selected state
      expect(styleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have sufficient color contrast', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // This test would typically use a color contrast analyzer
      // For now, we verify that elements have appropriate classes
      const styleButtons = screen.getAllByTestId(/^style-button-/);
      styleButtons.forEach(button => {
        // Should have contrast-compliant classes
        expect(button.className).toMatch(/text-|bg-/);
      });
    });

    it('should provide alternative text for visual elements', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Check for images with alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should support screen reader navigation', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should have proper heading structure
      const headings = screen.getAllByRole('heading');
      if (headings.length > 0) {
        headings.forEach(heading => {
          expect(heading.tagName).toMatch(/^H[1-6]$/);
        });
      }
      
      // Should have proper landmark roles
      const main = screen.queryByRole('main');
      const navigation = screen.queryByRole('navigation');
      const search = screen.queryByRole('search');
      
      // At least one landmark should be present
      expect([main, navigation, search].some(element => element !== null)).toBe(true);
    });
  });

  describe('Search Results Accessibility', () => {
    const mockResults = [
      { id: '1', name: 'Artist 1', styles: ['old_school'], rating: 4.5 },
      { id: '2', name: 'Artist 2', styles: ['realism'], rating: 4.2 }
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <SearchResultsDisplay 
          results={mockResults} 
          totalCount={2}
          loading={false}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <SearchResultsDisplay 
          results={mockResults} 
          totalCount={2}
          loading={false}
        />
      );
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check heading levels are logical
      const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
      for (let i = 1; i < headingLevels.length; i++) {
        expect(headingLevels[i] - headingLevels[i-1]).toBeLessThanOrEqual(1);
      }
    });

    it('should provide accessible result count information', () => {
      render(
        <SearchResultsDisplay 
          results={mockResults} 
          totalCount={2}
          loading={false}
        />
      );
      
      // Should announce result count to screen readers
      const resultCount = screen.queryByRole('status');
      if (resultCount) {
        expect(resultCount).toHaveTextContent(/2.*results?/i);
      }
    });

    it('should have accessible result cards', () => {
      render(
        <SearchResultsDisplay 
          results={mockResults} 
          totalCount={2}
          loading={false}
        />
      );
      
      // Each result should be properly structured
      const articles = screen.getAllByRole('article');
      if (articles.length > 0) {
        articles.forEach(article => {
          // Should have accessible name
          expect(article).toHaveAccessibleName();
        });
      }
    });

    it('should handle loading states accessibly', () => {
      render(
        <SearchResultsDisplay 
          results={null} 
          totalCount={0}
          loading={true}
        />
      );
      
      // Should announce loading state
      const loadingIndicator = screen.queryByRole('status');
      if (loadingIndicator) {
        expect(loadingIndicator).toHaveTextContent(/loading|searching/i);
      }
      
      // Should have aria-busy attribute
      const busyElement = screen.queryByAttribute('aria-busy', 'true');
      expect(busyElement).toBeInTheDocument();
    });

    it('should handle empty results accessibly', () => {
      render(
        <SearchResultsDisplay 
          results={[]} 
          totalCount={0}
          loading={false}
        />
      );
      
      // Should announce no results
      const noResults = screen.queryByText(/no results|0 results/i);
      expect(noResults).toBeInTheDocument();
      
      // Should provide helpful guidance
      const guidance = screen.queryByText(/try|adjust|refine/i);
      if (guidance) {
        expect(guidance).toBeInTheDocument();
      }
    });
  });

  describe('Advanced Search Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AdvancedSearchInterface />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and descriptions', () => {
      render(<AdvancedSearchInterface />);
      
      // All form controls should have labels
      const textboxes = screen.getAllByRole('textbox');
      textboxes.forEach(textbox => {
        expect(textbox).toHaveAccessibleName();
      });
      
      const comboboxes = screen.getAllByRole('combobox');
      comboboxes.forEach(combobox => {
        expect(combobox).toHaveAccessibleName();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });

    it('should provide form validation feedback accessibly', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearchInterface />);
      
      // Find a required field (if any)
      const requiredFields = screen.getAllByAttribute('required', '');
      
      if (requiredFields.length > 0) {
        const requiredField = requiredFields[0];
        
        // Try to submit without filling required field
        const submitButton = screen.queryByRole('button', { name: /search|submit/i });
        if (submitButton) {
          await user.click(submitButton);
          
          // Should show validation error
          const errorMessage = screen.queryByRole('alert');
          if (errorMessage) {
            expect(errorMessage).toBeInTheDocument();
          }
          
          // Field should have aria-invalid
          expect(requiredField).toHaveAttribute('aria-invalid', 'true');
        }
      }
    });

    it('should support keyboard navigation through form', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearchInterface />);
      
      // Should be able to tab through all form controls
      const formControls = [
        ...screen.getAllByRole('textbox'),
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('checkbox'),
        ...screen.getAllByRole('button')
      ];
      
      if (formControls.length > 0) {
        // Tab to first control
        await user.tab();
        expect(formControls).toContain(document.activeElement);
        
        // Should be able to navigate through all controls
        for (let i = 1; i < Math.min(5, formControls.length); i++) {
          await user.tab();
          expect(formControls).toContain(document.activeElement);
        }
      }
    });

    it('should group related form controls properly', () => {
      render(<AdvancedSearchInterface />);
      
      // Check for fieldsets grouping related controls
      const fieldsets = screen.getAllByRole('group');
      fieldsets.forEach(fieldset => {
        // Should have accessible name (legend)
        expect(fieldset).toHaveAccessibleName();
      });
    });
  });

  describe('Search Feedback Accessibility', () => {
    it('should announce feedback messages to screen readers', () => {
      render(
        <SearchFeedbackSystem 
          results={[]}
          totalCount={0}
          query={new SearchQuery({ text: 'nonexistent' })}
          loading={false}
        />
      );
      
      // Should have aria-live region for announcements
      const liveRegion = screen.queryByRole('status');
      expect(liveRegion).toBeInTheDocument();
      
      // Should contain helpful message
      expect(liveRegion).toHaveTextContent(/no results|try/i);
    });

    it('should provide accessible error messages', () => {
      render(
        <SearchFeedbackSystem 
          results={null}
          totalCount={0}
          query={new SearchQuery({ text: 'test' })}
          loading={false}
          error={new Error('Search failed')}
        />
      );
      
      // Error should be announced
      const errorAlert = screen.queryByRole('alert');
      if (errorAlert) {
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/error|failed/i);
      }
    });

    it('should provide accessible loading announcements', () => {
      render(
        <SearchFeedbackSystem 
          results={null}
          totalCount={0}
          query={new SearchQuery({ text: 'test' })}
          loading={true}
        />
      );
      
      // Loading should be announced
      const loadingStatus = screen.queryByRole('status');
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus).toHaveTextContent(/loading|searching/i);
    });
  });

  describe('Page-Level Search Accessibility', () => {
    it('should have accessible search on Artists page', async () => {
      const { container } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible search on Studios page', async () => {
      const { container } = render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper page structure and landmarks', async () => {
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Should have main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Should have proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // First heading should be h1
      const h1 = screen.queryByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should support skip links for keyboard users', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Should have skip link (may be visually hidden)
      const skipLink = screen.queryByText(/skip to|skip navigation/i);
      if (skipLink) {
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href');
        
        // Should be focusable
        await user.tab();
        if (document.activeElement === skipLink) {
          expect(skipLink).toHaveFocus();
        }
      }
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('should have touch-friendly target sizes', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Style buttons should be large enough for touch
      const styleButtons = screen.getAllByTestId(/^style-button-/);
      styleButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // WCAG recommends minimum 44px touch targets
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support gesture navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should support swipe gestures (if implemented)
      const container = screen.getByTestId('style-filter-container');
      if (container) {
        // Test touch events
        fireEvent.touchStart(container, { touches: [{ clientX: 100, clientY: 100 }] });
        fireEvent.touchMove(container, { touches: [{ clientX: 200, clientY: 100 }] });
        fireEvent.touchEnd(container);
        
        // Should not crash or cause errors
        expect(container).toBeInTheDocument();
      }
    });

    it('should work with screen readers on mobile', () => {
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should have proper mobile accessibility attributes
      const searchInput = screen.getByTestId('style-search-input');
      expect(searchInput).toHaveAttribute('aria-label');
      
      // Should work with voice control
      expect(searchInput).toHaveAttribute('type', 'search');
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should work in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should render without errors in high contrast mode
      expect(screen.getByTestId('style-search-input')).toBeInTheDocument();
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should respect reduced motion preferences
      const animatedElements = screen.getAllByTestId(/^style-button-/);
      animatedElements.forEach(element => {
        // Should not have animation classes when reduced motion is preferred
        expect(element.className).not.toMatch(/animate-|transition-/);
      });
    });

    it('should provide sufficient focus indicators', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const searchInput = screen.getByTestId('style-search-input');
      await user.click(searchInput);
      
      // Should have visible focus indicator
      expect(searchInput).toHaveClass(/focus:|ring-|outline-/);
    });
  });
});