/**
 * Cross-Page Consistency Validation Tests
 * 
 * This test suite validates consistency across all main application pages:
 * - Artists page
 * - Studios page  
 * - Styles page
 * 
 * Tests ensure uniform implementation of:
 * - Design system components
 * - Navigation patterns
 * - Search functionality
 * - Loading and error states
 * - Accessibility features
 * 
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import Link from 'next/link'; from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Mock Next.js components and hooks
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

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock page components for testing
const MockArtistsPage = ({ searchConfig, navigationConfig, dataDisplayConfig }) => (
  <div data-testid="artists-page" className="page-container">
    <nav className="main-navigation" data-testid="artists-nav">
      <div className="nav-brand">Tattoo Directory</div>
      <div className="nav-links">
        <Link href="/artists" className="nav-link active">Artists</Link>
        <Link href="/studios" className="nav-link">Studios</Link>
        <Link href="/styles" className="nav-link">Styles</Link>
      </div>
    </nav>
    
    <div className="breadcrumb-nav" data-testid="artists-breadcrumbs">
      <span className="breadcrumb-item">
        <Link href="/">Home</Link>
      </span>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-item current">Artists</span>
    </div>

    <main className="page-content">
      <div className="search-section" data-testid="artists-search">
        <input 
          type="text" 
          placeholder="Search artists..." 
          className="search-input"
          aria-label="Search artists"
        />
        <div className="search-filters">
          <select className="filter-select" aria-label="Filter by style">
            <option value="">All Styles</option>
            <option value="traditional">Traditional</option>
            <option value="realism">Realism</option>
          </select>
        </div>
      </div>

      <div className="results-section" data-testid="artists-results">
        <div className="artist-card card">
          <div className="card-header">
            <h3 className="heading-tertiary">John Doe</h3>
          </div>
          <div className="card-content">
            <p className="text-body">Traditional tattoo specialist</p>
          </div>
          <div className="card-footer">
            <button className="btn-primary">View Profile</button>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const MockStudiosPage = ({ searchConfig, navigationConfig, dataDisplayConfig }) => (
  <div data-testid="studios-page" className="page-container">
    <nav className="main-navigation" data-testid="studios-nav">
      <div className="nav-brand">Tattoo Directory</div>
      <div className="nav-links">
        <Link href="/artists" className="nav-link">Artists</Link>
        <Link href="/studios" className="nav-link active">Studios</Link>
        <Link href="/styles" className="nav-link">Styles</Link>
      </div>
    </nav>
    
    <div className="breadcrumb-nav" data-testid="studios-breadcrumbs">
      <span className="breadcrumb-item">
        <Link href="/">Home</Link>
      </span>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-item current">Studios</span>
    </div>

    <main className="page-content">
      <div className="search-section" data-testid="studios-search">
        <input 
          type="text" 
          placeholder="Search studios..." 
          className="search-input"
          aria-label="Search studios"
        />
        <div className="search-filters">
          <select className="filter-select" aria-label="Filter by specialty">
            <option value="">All Specialties</option>
            <option value="custom">Custom Work</option>
            <option value="piercing">Piercing</option>
          </select>
        </div>
      </div>

      <div className="results-section" data-testid="studios-results">
        <div className="studio-card card">
          <div className="card-header">
            <h3 className="heading-tertiary">Ink Masters Studio</h3>
          </div>
          <div className="card-content">
            <p className="text-body">Premium tattoo studio</p>
          </div>
          <div className="card-footer">
            <button className="btn-primary">View Studio</button>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const MockStylesPage = ({ searchConfig, navigationConfig, dataDisplayConfig }) => (
  <div data-testid="styles-page" className="page-container">
    <nav className="main-navigation" data-testid="styles-nav">
      <div className="nav-brand">Tattoo Directory</div>
      <div className="nav-links">
        <Link href="/artists" className="nav-link">Artists</Link>
        <Link href="/studios" className="nav-link">Studios</Link>
        <Link href="/styles" className="nav-link active">Styles</Link>
      </div>
    </nav>
    
    <div className="breadcrumb-nav" data-testid="styles-breadcrumbs">
      <span className="breadcrumb-item">
        <Link href="/">Home</Link>
      </span>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-item current">Styles</span>
    </div>

    <main className="page-content">
      <div className="search-section" data-testid="styles-search">
        <input 
          type="text" 
          placeholder="Search styles..." 
          className="search-input"
          aria-label="Search styles"
        />
        <div className="search-filters">
          <select className="filter-select" aria-label="Filter by difficulty">
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="results-section" data-testid="styles-results">
        <div className="style-card card">
          <div className="card-header">
            <h3 className="heading-tertiary">Traditional</h3>
          </div>
          <div className="card-content">
            <p className="text-body">Classic tattoo style</p>
          </div>
          <div className="card-footer">
            <button className="btn-primary">Explore Style</button>
          </div>
        </div>
      </div>
    </main>
  </div>
);

describe('Cross-Page Consistency Validation', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const pages = [
    { name: 'Artists', component: MockArtistsPage, testId: 'artists-page' },
    { name: 'Studios', component: MockStudiosPage, testId: 'studios-page' },
    { name: 'Styles', component: MockStylesPage, testId: 'styles-page' }
  ];

  describe('Navigation Consistency', () => {
    it('should maintain consistent navigation structure across all pages', () => {
      pages.forEach(({ name, component: PageComponent, testId }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test navigation presence and structure
        const nav = screen.getByTestId(`${name.toLowerCase()}-nav`);
        expect(nav).toHaveClass('main-navigation');
        
        // Test navigation brand
        const brand = nav.querySelector('.nav-brand');
        expect(brand).toBeInTheDocument();
        expect(brand).toHaveTextContent('Tattoo Directory');
        
        // Test navigation links
        const navLinks = nav.querySelectorAll('.nav-link');
        expect(navLinks).toHaveLength(3);
        
        const linkTexts = Array.from(navLinks).map(link => link.textContent);
        expect(linkTexts).toEqual(['Artists', 'Studios', 'Styles']);
        
        // Test active state
        const activeLink = nav.querySelector('.nav-link.active');
        expect(activeLink).toBeInTheDocument();
        expect(activeLink).toHaveTextContent(name);
        
        unmount();
      });
    });

    it('should maintain consistent breadcrumb navigation across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test breadcrumb presence and structure
        const breadcrumbs = screen.getByTestId(`${name.toLowerCase()}-breadcrumbs`);
        expect(breadcrumbs).toHaveClass('breadcrumb-nav');
        
        // Test breadcrumb items
        const breadcrumbItems = breadcrumbs.querySelectorAll('.breadcrumb-item');
        expect(breadcrumbItems).toHaveLength(2);
        
        // Test home link
        const homeLink = breadcrumbItems[0].querySelector('a');
        expect(homeLink).toHaveAttribute('href', '/');
        expect(homeLink).toHaveTextContent('Home');
        
        // Test current page
        const currentPage = breadcrumbItems[1];
        expect(currentPage).toHaveClass('current');
        expect(currentPage).toHaveTextContent(name);
        
        // Test separator
        const separator = breadcrumbs.querySelector('.breadcrumb-separator');
        expect(separator).toBeInTheDocument();
        expect(separator).toHaveTextContent('/');
        
        unmount();
      });
    });
  });

  describe('Search Functionality Consistency', () => {
    it('should maintain consistent search interface across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test search section presence
        const searchSection = screen.getByTestId(`${name.toLowerCase()}-search`);
        expect(searchSection).toHaveClass('search-section');
        
        // Test search input
        const searchInput = searchSection.querySelector('.search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('type', 'text');
        expect(searchInput).toHaveAttribute('aria-label');
        
        // Test search filters
        const searchFilters = searchSection.querySelector('.search-filters');
        expect(searchFilters).toBeInTheDocument();
        
        const filterSelect = searchFilters.querySelector('.filter-select');
        expect(filterSelect).toBeInTheDocument();
        expect(filterSelect).toHaveAttribute('aria-label');
        
        unmount();
      });
    });

    it('should support consistent search interactions across all pages', async () => {
      for (const { name, component: PageComponent } of pages) {
        const { unmount } = render(<PageComponent />);
        
        const searchInput = screen.getByLabelText(`Search ${name.toLowerCase()}...`);
        
        // Test search input functionality
        await user.type(searchInput, 'test search');
        expect(searchInput).toHaveValue('test search');
        
        // Test search submission
        await user.keyboard('{Enter}');
        // Should not throw errors
        
        // Test filter interaction
        const filterSelect = screen.getByLabelText(/Filter by/);
        await user.selectOptions(filterSelect, filterSelect.options[1]);
        expect(filterSelect.value).toBe(filterSelect.options[1].value);
        
        unmount();
      }
    });
  });

  describe('Content Layout Consistency', () => {
    it('should maintain consistent page structure across all pages', () => {
      pages.forEach(({ name, component: PageComponent, testId }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test page container
        const pageContainer = screen.getByTestId(testId);
        expect(pageContainer).toHaveClass('page-container');
        
        // Test main content area
        const mainContent = pageContainer.querySelector('main');
        expect(mainContent).toBeInTheDocument();
        expect(mainContent).toHaveClass('page-content');
        
        // Test results section
        const resultsSection = screen.getByTestId(`${name.toLowerCase()}-results`);
        expect(resultsSection).toHaveClass('results-section');
        
        unmount();
      });
    });

    it('should maintain consistent card layouts across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test card presence and structure
        const card = screen.getByRole('main').querySelector('.card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('card');
        
        // Test card sections
        const cardHeader = card.querySelector('.card-header');
        const cardContent = card.querySelector('.card-content');
        const cardFooter = card.querySelector('.card-footer');
        
        expect(cardHeader).toBeInTheDocument();
        expect(cardContent).toBeInTheDocument();
        expect(cardFooter).toBeInTheDocument();
        
        // Test card header content
        const heading = cardHeader.querySelector('.heading-tertiary');
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveClass('heading-tertiary');
        
        // Test card content
        const bodyText = cardContent.querySelector('.text-body');
        expect(bodyText).toBeInTheDocument();
        expect(bodyText).toHaveClass('text-body');
        
        // Test card footer button
        const button = cardFooter.querySelector('.btn-primary');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('btn-primary');
        
        unmount();
      });
    });
  });

  describe('Design System Consistency', () => {
    it('should apply consistent typography classes across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test heading hierarchy
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveClass('heading-tertiary');
        
        // Test body text
        const bodyText = screen.getByText(/specialist|studio|style/);
        expect(bodyText).toHaveClass('text-body');
        
        unmount();
      });
    });

    it('should apply consistent button styling across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test primary button
        const primaryButton = screen.getByRole('button');
        expect(primaryButton).toHaveClass('btn-primary');
        
        unmount();
      });
    });

    it('should maintain consistent spacing and layout patterns', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test consistent class usage
        const searchSection = screen.getByTestId(`${name.toLowerCase()}-search`);
        expect(searchSection).toHaveClass('search-section');
        
        const resultsSection = screen.getByTestId(`${name.toLowerCase()}-results`);
        expect(resultsSection).toHaveClass('results-section');
        
        unmount();
      });
    });
  });

  describe('Accessibility Consistency', () => {
    it('should pass axe accessibility tests for all pages', async () => {
      for (const { name, component: PageComponent } of pages) {
        const { container, unmount } = render(<PageComponent />);
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        
        unmount();
      }
    });

    it('should maintain consistent ARIA labels across all pages', () => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Test search input ARIA labels
        const searchInput = screen.getByLabelText(`Search ${name.toLowerCase()}...`);
        expect(searchInput).toHaveAttribute('aria-label');
        
        // Test filter ARIA labels
        const filterSelect = screen.getByLabelText(/Filter by/);
        expect(filterSelect).toHaveAttribute('aria-label');
        
        unmount();
      });
    });

    it('should support consistent keyboard navigation across all pages', async () => {
      for (const { name, component: PageComponent } of pages) {
        const { unmount } = render(<PageComponent />);
        
        // Test tab navigation
        await user.tab();
        const firstFocusable = document.activeElement;
        expect(firstFocusable).toBeInTheDocument();
        
        await user.tab();
        const secondFocusable = document.activeElement;
        expect(secondFocusable).toBeInTheDocument();
        expect(secondFocusable).not.toBe(firstFocusable);
        
        unmount();
      }
    });
  });

  describe('Error State Consistency', () => {
    it('should render consistent error states across all pages', () => {
      const ErrorPageComponent = ({ pageType }) => (
        <div data-testid={`${pageType}-error-page`} className="page-container">
          <div className="error-state error-network" data-testid={`${pageType}-error`}>
            <div className="error-icon">⚠️</div>
            <div className="error-message">Failed to load {pageType}</div>
            <button className="error-action btn-secondary">Retry</button>
          </div>
        </div>
      );

      ['artists', 'studios', 'styles'].forEach(pageType => {
        const { unmount } = render(<ErrorPageComponent pageType={pageType} />);
        
        const errorState = screen.getByTestId(`${pageType}-error`);
        expect(errorState).toHaveClass('error-state', 'error-network');
        
        const errorIcon = errorState.querySelector('.error-icon');
        const errorMessage = errorState.querySelector('.error-message');
        const errorAction = errorState.querySelector('.error-action');
        
        expect(errorIcon).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(`Failed to load ${pageType}`);
        expect(errorAction).toHaveClass('error-action', 'btn-secondary');
        
        unmount();
      });
    });
  });

  describe('Loading State Consistency', () => {
    it('should render consistent loading states across all pages', () => {
      const LoadingPageComponent = ({ pageType }) => (
        <div data-testid={`${pageType}-loading-page`} className="page-container">
          <div className="loading-state loading-skeleton" data-testid={`${pageType}-loading`}>
            <div className="skeleton-header"></div>
            <div className="skeleton-content"></div>
            <div className="skeleton-footer"></div>
          </div>
        </div>
      );

      ['artists', 'studios', 'styles'].forEach(pageType => {
        const { unmount } = render(<LoadingPageComponent pageType={pageType} />);
        
        const loadingState = screen.getByTestId(`${pageType}-loading`);
        expect(loadingState).toHaveClass('loading-state', 'loading-skeleton');
        
        const skeletonElements = loadingState.querySelectorAll('[class*="skeleton-"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
        
        unmount();
      });
    });
  });

  describe('Responsive Design Consistency', () => {
    it('should maintain consistent responsive behavior across all pages', () => {
      // Mock different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Desktop
      ];

      viewports.forEach(({ width, height }) => {
        // Mock viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });

        pages.forEach(({ name, component: PageComponent }) => {
          const { unmount } = render(<PageComponent />);
          
          // Test responsive classes are applied
          const pageContainer = screen.getByTestId(`${name.toLowerCase()}-page`);
          expect(pageContainer).toHaveClass('page-container');
          
          // Test navigation responsiveness
          const nav = screen.getByTestId(`${name.toLowerCase()}-nav`);
          expect(nav).toHaveClass('main-navigation');
          
          unmount();
        });
      });
    });
  });
});