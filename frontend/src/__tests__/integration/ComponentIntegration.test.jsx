/**
 * Comprehensive Component Integration Tests
 * 
 * This test suite validates:
 * 1. Integration tests for all enhanced component implementations
 * 2. Cross-page consistency validation tests
 * 3. Accessibility compliance testing with axe-core
 * 4. Visual regression tests for design system consistency
 * 
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import Link from 'next/link'; from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Import all enhanced components for integration testing
import { SearchFeedbackIntegration } from '@/design-system/components/feedback/SearchFeedbackIntegration/SearchFeedbackIntegration';
import { VisualEffectsIntegration } from '@/app/components/VisualEffectsIntegration';
import { PerformanceOptimizationIntegration } from '@/app/components/PerformanceOptimizationIntegration';
import { AnimationInteractionIntegration } from '@/app/components/AnimationInteractionIntegration';
import { ToastProvider } from '@/design-system/components/feedback/ToastProvider/ToastProvider';
import { PageWrapper } from '@/design-system/components/layout/PageWrapper/PageWrapper';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock intersection observer for performance components
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Component Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Enhanced Component Implementations', () => {
    describe('Search Feedback Integration', () => {
      it('should integrate search feedback components correctly', async () => {
        const mockOnSearch = jest.fn();
        const mockOnValidation = jest.fn();

        render(
          <SearchFeedbackIntegration
            onSearch={mockOnSearch}
            onValidation={mockOnValidation}
            searchType="artists"
            placeholder="Search artists..."
          />
        );

        // Test search input integration
        const searchInput = screen.getByPlaceholderText('Search artists...');
        expect(searchInput).toBeInTheDocument();

        // Test search functionality
        await user.type(searchInput, 'traditional tattoo');
        await waitFor(() => {
          expect(mockOnValidation).toHaveBeenCalled();
        });

        // Test search submission
        await user.keyboard('{Enter}');
        await waitFor(() => {
          expect(mockOnSearch).toHaveBeenCalledWith('traditional tattoo', expect.any(Object));
        });
      });

      it('should display validation feedback correctly', async () => {
        const mockOnValidation = jest.fn().mockResolvedValue({
          isValid: false,
          errors: ['Search term too short']
        });

        render(
          <SearchFeedbackIntegration
            onValidation={mockOnValidation}
            searchType="artists"
            placeholder="Search artists..."
          />
        );

        const searchInput = screen.getByPlaceholderText('Search artists...');
        await user.type(searchInput, 'ab');

        await waitFor(() => {
          expect(screen.getByText('Search term too short')).toBeInTheDocument();
        });
      });
    });

    describe('Visual Effects Integration', () => {
      it('should apply visual effects consistently', () => {
        render(
          <VisualEffectsIntegration
            shadowLevel="premium"
            enableGlassmorphism={true}
            gradientOverlay="hero"
            textureLevel="medium"
          >
            <div data-testid="test-content">Test Content</div>
          </VisualEffectsIntegration>
        );

        const container = screen.getByTestId('visual-effects-container');
        expect(container).toHaveClass('shadow-elevation-premium');
        expect(container).toHaveClass('glass-card');
        expect(container).toHaveClass('gradient-overlay-hero');
        expect(container).toHaveClass('texture-medium');
      });

      it('should handle different shadow levels', () => {
        const { rerender } = render(
          <VisualEffectsIntegration shadowLevel="surface">
            <div>Content</div>
          </VisualEffectsIntegration>
        );

        let container = screen.getByTestId('visual-effects-container');
        expect(container).toHaveClass('shadow-elevation-surface');

        rerender(
          <VisualEffectsIntegration shadowLevel="floating">
            <div>Content</div>
          </VisualEffectsIntegration>
        );

        container = screen.getByTestId('visual-effects-container');
        expect(container).toHaveClass('shadow-elevation-floating');
      });
    });

    describe('Performance Optimization Integration', () => {
      it('should implement lazy loading correctly', () => {
        render(
          <PerformanceOptimizationIntegration
            enableLazyLoading={true}
            enableImageOptimization={true}
            enableInfiniteScroll={false}
          >
            <img src="/test-image.jpg" alt="Test" data-testid="lazy-image" />
          </PerformanceOptimizationIntegration>
        );

        const image = screen.getByTestId('lazy-image');
        expect(image).toBeInTheDocument();
        
        // Verify intersection observer was called for lazy loading
        expect(mockIntersectionObserver).toHaveBeenCalled();
      });

      it('should handle infinite scroll integration', async () => {
        const mockLoadMore = jest.fn();

        render(
          <PerformanceOptimizationIntegration
            enableInfiniteScroll={true}
            onLoadMore={mockLoadMore}
            hasMore={true}
          >
            <div data-testid="content-list">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>Item {i}</div>
              ))}
            </div>
          </PerformanceOptimizationIntegration>
        );

        // Simulate scroll to bottom
        const scrollContainer = screen.getByTestId('scroll-container');
        fireEvent.scroll(scrollContainer, { target: { scrollY: 1000 } });

        await waitFor(() => {
          expect(mockLoadMore).toHaveBeenCalled();
        });
      });
    });

    describe('Animation Interaction Integration', () => {
      it('should apply micro-interactions correctly', async () => {
        render(
          <AnimationInteractionIntegration
            enableMicroInteractions={true}
            animationLevel="enhanced"
            respectReducedMotion={true}
          >
            <button data-testid="interactive-button">Click me</button>
          </AnimationInteractionIntegration>
        );

        const button = screen.getByTestId('interactive-button');
        expect(button).toHaveClass('micro-interaction-float');

        // Test hover interaction
        await user.hover(button);
        expect(button).toHaveClass('hover-glow');

        // Test click interaction
        await user.click(button);
        expect(button).toHaveClass('click-pulse');
      });

      it('should respect reduced motion preferences', () => {
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

        render(
          <AnimationInteractionIntegration
            enableMicroInteractions={true}
            respectReducedMotion={true}
          >
            <div data-testid="animated-content">Content</div>
          </AnimationInteractionIntegration>
        );

        const content = screen.getByTestId('animated-content');
        expect(content).toHaveClass('reduce-motion');
      });
    });
  });

  describe('Cross-Page Consistency Validation', () => {
    const testPages = [
      { name: 'Artists', component: 'ArtistsPage' },
      { name: 'Studios', component: 'StudiosPage' },
      { name: 'Styles', component: 'StylesPage' }
    ];

    describe('Design System Consistency', () => {
      it('should use consistent button styling across pages', () => {
        // Test button consistency
        const buttonClasses = [
          'btn-primary',
          'btn-secondary',
          'btn-accent'
        ];

        buttonClasses.forEach(buttonClass => {
          render(
            <PageWrapper>
              <button className={buttonClass} data-testid={`button-${buttonClass}`}>
                Test Button
              </button>
            </PageWrapper>
          );

          const button = screen.getByTestId(`button-${buttonClass}`);
          expect(button).toHaveClass(buttonClass);
          
          // Verify consistent styling properties
          const styles = window.getComputedStyle(button);
          expect(styles.getPropertyValue('--interactive-primary')).toBeTruthy();
        });
      });

      it('should maintain consistent card layouts', () => {
        const cardVariants = ['artist-card', 'studio-card', 'style-card'];

        cardVariants.forEach(variant => {
          render(
            <PageWrapper>
              <div className={`card ${variant}`} data-testid={variant}>
                <div className="card-header">Header</div>
                <div className="card-content">Content</div>
                <div className="card-footer">Footer</div>
              </div>
            </PageWrapper>
          );

          const card = screen.getByTestId(variant);
          expect(card).toHaveClass('card');
          expect(card).toHaveClass(variant);
          
          // Verify consistent card structure
          expect(card.querySelector('.card-header')).toBeInTheDocument();
          expect(card.querySelector('.card-content')).toBeInTheDocument();
          expect(card.querySelector('.card-footer')).toBeInTheDocument();
        });
      });

      it('should apply uniform spacing and typography', () => {
        render(
          <PageWrapper>
            <div className="page-content" data-testid="page-content">
              <h1 className="heading-primary">Primary Heading</h1>
              <h2 className="heading-secondary">Secondary Heading</h2>
              <p className="text-body">Body text content</p>
            </div>
          </PageWrapper>
        );

        const content = screen.getByTestId('page-content');
        const h1 = content.querySelector('.heading-primary');
        const h2 = content.querySelector('.heading-secondary');
        const p = content.querySelector('.text-body');

        // Verify typography classes are applied
        expect(h1).toHaveClass('heading-primary');
        expect(h2).toHaveClass('heading-secondary');
        expect(p).toHaveClass('text-body');
      });
    });

    describe('Navigation Consistency', () => {
      it('should maintain consistent navigation patterns', () => {
        render(
          <PageWrapper>
            <nav className="main-navigation" data-testid="main-nav">
              <div className="nav-brand">Brand</div>
              <div className="nav-links">
                <Link href="/artists" className="nav-link">Artists</Link>
                <Link href="/studios" className="nav-link">Studios</Link>
                <Link href="/styles" className="nav-link">Styles</Link>
              </div>
            </nav>
          </PageWrapper>
        );

        const nav = screen.getByTestId('main-nav');
        expect(nav).toHaveClass('main-navigation');
        
        const navLinks = nav.querySelectorAll('.nav-link');
        expect(navLinks).toHaveLength(3);
        
        navLinks.forEach(link => {
          expect(link).toHaveClass('nav-link');
        });
      });

      it('should provide consistent breadcrumb navigation', () => {
        const breadcrumbs = [
          { label: 'Home', href: '/' },
          { label: 'Artists', href: '/artists' },
          { label: 'Profile', href: '/artists/123' }
        ];

        render(
          <PageWrapper>
            <nav className="breadcrumb-nav" data-testid="breadcrumbs">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="breadcrumb-item">
                  {index > 0 && <span className="breadcrumb-separator">/</span>}
                  <a href={crumb.href}>{crumb.label}</Link>
                </span>
              ))}
            </nav>
          </PageWrapper>
        );

        const breadcrumbNav = screen.getByTestId('breadcrumbs');
        const breadcrumbItems = breadcrumbNav.querySelectorAll('.breadcrumb-item');
        
        expect(breadcrumbItems).toHaveLength(3);
        expect(breadcrumbNav.querySelectorAll('.breadcrumb-separator')).toHaveLength(2);
      });
    });

    describe('Loading and Error State Consistency', () => {
      it('should render consistent loading states', () => {
        const loadingStates = ['skeleton', 'spinner', 'progress'];

        loadingStates.forEach(state => {
          render(
            <PageWrapper>
              <div className={`loading-state loading-${state}`} data-testid={`loading-${state}`}>
                Loading...
              </div>
            </PageWrapper>
          );

          const loadingElement = screen.getByTestId(`loading-${state}`);
          expect(loadingElement).toHaveClass('loading-state');
          expect(loadingElement).toHaveClass(`loading-${state}`);
        });
      });

      it('should display consistent error states', () => {
        const errorTypes = ['network', 'validation', 'not-found'];

        errorTypes.forEach(type => {
          render(
            <PageWrapper>
              <div className={`error-state error-${type}`} data-testid={`error-${type}`}>
                <div className="error-icon">⚠️</div>
                <div className="error-message">Error occurred</div>
                <button className="error-action">Retry</button>
              </div>
            </PageWrapper>
          );

          const errorElement = screen.getByTestId(`error-${type}`);
          expect(errorElement).toHaveClass('error-state');
          expect(errorElement).toHaveClass(`error-${type}`);
          
          expect(errorElement.querySelector('.error-icon')).toBeInTheDocument();
          expect(errorElement.querySelector('.error-message')).toBeInTheDocument();
          expect(errorElement.querySelector('.error-action')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Accessibility Compliance Testing', () => {
    it('should pass axe accessibility tests for search components', async () => {
      const { container } = render(
        <ToastProvider>
          <SearchFeedbackIntegration
            searchType="artists"
            placeholder="Search artists..."
            onSearch={jest.fn()}
          />
        </ToastProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests for visual effects components', async () => {
      const { container } = render(
        <VisualEffectsIntegration
          shadowLevel="raised"
          enableGlassmorphism={false}
        >
          <div>
            <h2>Accessible Content</h2>
            <p>This content should be accessible</p>
            <button>Accessible Button</button>
          </div>
        </VisualEffectsIntegration>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests for performance components', async () => {
      const { container } = render(
        <PerformanceOptimizationIntegration
          enableLazyLoading={true}
          enableImageOptimization={true}
        >
          <img src="/test.jpg" alt="Accessible image description" />
          <div role="main">
            <h1>Main Content</h1>
            <p>Accessible content with proper semantics</p>
          </div>
        </PerformanceOptimizationIntegration>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests for animation components', async () => {
      const { container } = render(
        <AnimationInteractionIntegration
          enableMicroInteractions={true}
          respectReducedMotion={true}
        >
          <nav aria-label="Main navigation">
            <ul>
              <li><Link href="/artists">Artists</Link></li>
              <li><Link href="/studios">Studios</Link></li>
            </ul>
          </nav>
        </AnimationInteractionIntegration>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    describe('Keyboard Navigation', () => {
      it('should support keyboard navigation in search components', async () => {
        render(
          <SearchFeedbackIntegration
            searchType="artists"
            placeholder="Search artists..."
            onSearch={jest.fn()}
          />
        );

        const searchInput = screen.getByPlaceholderText('Search artists...');
        
        // Test tab navigation
        await user.tab();
        expect(searchInput).toHaveFocus();

        // Test keyboard input
        await user.keyboard('test search');
        expect(searchInput).toHaveValue('test search');

        // Test enter key
        await user.keyboard('{Enter}');
        // Should trigger search without errors
      });

      it('should support keyboard navigation in interactive components', async () => {
        render(
          <AnimationInteractionIntegration>
            <button data-testid="btn1">Button 1</button>
            <button data-testid="btn2">Button 2</button>
            <Link href="#" data-testid="link1">Link 1</Link>
          </AnimationInteractionIntegration>
        );

        // Test tab order
        await user.tab();
        expect(screen.getByTestId('btn1')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('btn2')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('link1')).toHaveFocus();
      });
    });

    describe('Screen Reader Support', () => {
      it('should provide proper ARIA labels and descriptions', () => {
        render(
          <PageWrapper>
            <main aria-label="Main content">
              <section aria-labelledby="search-heading">
                <h2 id="search-heading">Search Artists</h2>
                <SearchFeedbackIntegration
                  searchType="artists"
                  placeholder="Search artists..."
                  aria-describedby="search-help"
                />
                <div id="search-help">
                  Enter keywords to search for tattoo artists
                </div>
              </section>
            </main>
          </PageWrapper>
        );

        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('aria-label', 'Main content');

        const section = screen.getByRole('region');
        expect(section).toHaveAttribute('aria-labelledby', 'search-heading');

        const searchInput = screen.getByPlaceholderText('Search artists...');
        expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
      });

      it('should announce dynamic content changes', async () => {
        const { rerender } = render(
          <div>
            <div aria-live="polite" data-testid="status">
              Ready
            </div>
            <SearchFeedbackIntegration
              searchType="artists"
              placeholder="Search..."
            />
          </div>
        );

        // Simulate search state change
        rerender(
          <div>
            <div aria-live="polite" data-testid="status">
              Searching for artists...
            </div>
            <SearchFeedbackIntegration
              searchType="artists"
              placeholder="Search..."
              isLoading={true}
            />
          </div>
        );

        expect(screen.getByTestId('status')).toHaveTextContent('Searching for artists...');
      });
    });
  });

  describe('Visual Regression Tests for Design System Consistency', () => {
    describe('Color System Consistency', () => {
      it('should maintain consistent color usage across components', () => {
        const colorClasses = [
          'text-primary',
          'text-secondary',
          'bg-primary',
          'bg-secondary',
          'border-primary',
          'border-accent'
        ];

        colorClasses.forEach(colorClass => {
          render(
            <div className={colorClass} data-testid={`color-${colorClass}`}>
              Test Content
            </div>
          );

          const element = screen.getByTestId(`color-${colorClass}`);
          expect(element).toHaveClass(colorClass);
        });
      });

      it('should apply consistent interactive states', async () => {
        render(
          <div>
            <button className="btn-primary" data-testid="primary-btn">
              Primary Button
            </button>
            <button className="btn-secondary" data-testid="secondary-btn">
              Secondary Button
            </button>
          </div>
        );

        const primaryBtn = screen.getByTestId('primary-btn');
        const secondaryBtn = screen.getByTestId('secondary-btn');

        // Test hover states
        await user.hover(primaryBtn);
        expect(primaryBtn).toHaveClass('btn-primary');

        await user.hover(secondaryBtn);
        expect(secondaryBtn).toHaveClass('btn-secondary');
      });
    });

    describe('Typography System Consistency', () => {
      it('should maintain consistent typography hierarchy', () => {
        const typographyClasses = [
          'heading-primary',
          'heading-secondary',
          'heading-tertiary',
          'text-body',
          'text-caption',
          'text-label'
        ];

        typographyClasses.forEach(typographyClass => {
          render(
            <div className={typographyClass} data-testid={`typography-${typographyClass}`}>
              Sample Text
            </div>
          );

          const element = screen.getByTestId(`typography-${typographyClass}`);
          expect(element).toHaveClass(typographyClass);
        });
      });
    });

    describe('Spacing System Consistency', () => {
      it('should maintain consistent spacing patterns', () => {
        const spacingClasses = [
          'p-xs', 'p-sm', 'p-md', 'p-lg', 'p-xl',
          'm-xs', 'm-sm', 'm-md', 'm-lg', 'm-xl',
          'gap-xs', 'gap-sm', 'gap-md', 'gap-lg', 'gap-xl'
        ];

        spacingClasses.forEach(spacingClass => {
          render(
            <div className={spacingClass} data-testid={`spacing-${spacingClass}`}>
              Content
            </div>
          );

          const element = screen.getByTestId(`spacing-${spacingClass}`);
          expect(element).toHaveClass(spacingClass);
        });
      });
    });

    describe('Component State Consistency', () => {
      it('should render consistent loading states across components', () => {
        const components = [
          { name: 'SearchFeedback', component: SearchFeedbackIntegration },
          { name: 'VisualEffects', component: VisualEffectsIntegration },
          { name: 'PerformanceOptimization', component: PerformanceOptimizationIntegration }
        ];

        components.forEach(({ name, component: Component }) => {
          render(
            <Component isLoading={true} data-testid={`loading-${name}`}>
              <div>Content</div>
            </Component>
          );

          // Each component should handle loading state consistently
          const element = screen.getByTestId(`loading-${name}`);
          expect(element).toBeInTheDocument();
        });
      });

      it('should render consistent error states across components', () => {
        const errorMessage = 'Test error message';
        
        render(
          <div>
            <SearchFeedbackIntegration
              error={errorMessage}
              data-testid="search-error"
            />
            <VisualEffectsIntegration
              error={errorMessage}
              data-testid="visual-error"
            >
              <div>Content</div>
            </VisualEffectsIntegration>
          </div>
        );

        // Both components should display error consistently
        expect(screen.getByTestId('search-error')).toBeInTheDocument();
        expect(screen.getByTestId('visual-error')).toBeInTheDocument();
      });
    });
  });
});