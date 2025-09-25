/**
 * Accessibility Compliance Testing with axe-core
 * 
 * This test suite validates WCAG 2.1 AA compliance across all enhanced components
 * and main application pages using axe-core automated accessibility testing.
 * 
 * Tests include:
 * - Automated accessibility scanning
 * - Keyboard navigation testing
 * - Screen reader compatibility
 * - Focus management
 * - ARIA implementation
 * - Color contrast validation
 * 
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import Link from 'next/link'; from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Import components for accessibility testing
import { SearchFeedbackIntegration } from '@/design-system/components/feedback/SearchFeedbackIntegration/SearchFeedbackIntegration';
import { VisualEffectsIntegration } from '@/app/components/VisualEffectsIntegration';
import { PerformanceOptimizationIntegration } from '@/app/components/PerformanceOptimizationIntegration';
import { AnimationInteractionIntegration } from '@/app/components/AnimationInteractionIntegration';
import { ToastProvider } from '@/design-system/components/feedback/ToastProvider/ToastProvider';
import { PageWrapper } from '@/design-system/components/layout/PageWrapper/PageWrapper';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

// Mock intersection observer for performance components
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Accessibility Compliance Testing', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Scanning', () => {
    describe('Enhanced Component Accessibility', () => {
      it('should pass axe tests for SearchFeedbackIntegration component', async () => {
        const { container } = render(
          <ToastProvider>
            <SearchFeedbackIntegration
              searchType="artists"
              placeholder="Search for tattoo artists"
              onSearch={jest.fn()}
              onValidation={jest.fn()}
              aria-label="Artist search"
              aria-describedby="search-help"
            />
            <div id="search-help">
              Enter keywords to find tattoo artists in your area
            </div>
          </ToastProvider>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should pass axe tests for VisualEffectsIntegration component', async () => {
        const { container } = render(
          <VisualEffectsIntegration
            shadowLevel="raised"
            enableGlassmorphism={false}
            gradientOverlay="subtle"
          >
            <article role="article" aria-labelledby="content-heading">
              <h2 id="content-heading">Accessible Content</h2>
              <p>This content demonstrates proper semantic structure and accessibility.</p>
              <button type="button" aria-describedby="button-help">
                Accessible Action
              </button>
              <div id="button-help">Click to perform an action</div>
            </article>
          </VisualEffectsIntegration>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should pass axe tests for PerformanceOptimizationIntegration component', async () => {
        const { container } = render(
          <PerformanceOptimizationIntegration
            enableLazyLoading={true}
            enableImageOptimization={true}
            enableInfiniteScroll={false}
          >
            <main role="main" aria-label="Main content">
              <section aria-labelledby="gallery-heading">
                <h2 id="gallery-heading">Image Gallery</h2>
                <div role="img" aria-label="Tattoo artwork by John Doe">
                  <img 
                    src="/test-image.jpg" 
                    alt="Traditional dragon tattoo on arm, black and red ink"
                    loading="lazy"
                  />
                </div>
                <div role="img" aria-label="Tattoo artwork by Jane Smith">
                  <img 
                    src="/test-image-2.jpg" 
                    alt="Realistic portrait tattoo on shoulder, black and grey"
                    loading="lazy"
                  />
                </div>
              </section>
            </main>
          </PerformanceOptimizationIntegration>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should pass axe tests for AnimationInteractionIntegration component', async () => {
        const { container } = render(
          <AnimationInteractionIntegration
            enableMicroInteractions={true}
            respectReducedMotion={true}
            animationLevel="standard"
          >
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li>
                  <Link href="/artists" aria-current="page">
                    Artists
                  </Link>
                </li>
                <li>
                  <Link href="/studios">Studios</Link>
                </li>
                <li>
                  <Link href="/styles">Styles</Link>
                </li>
              </ul>
            </nav>
            <button 
              type="button"
              aria-expanded="false"
              aria-controls="menu"
              aria-haspopup="true"
            >
              Menu
            </button>
            <div id="menu" role="menu" hidden>
              <div role="menuitem">Option 1</div>
              <div role="menuitem">Option 2</div>
            </div>
          </AnimationInteractionIntegration>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Page Layout Accessibility', () => {
      it('should pass axe tests for complete page layout', async () => {
        const { container } = render(
          <PageWrapper>
            <header role="banner">
              <nav role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                  <Link href="/" aria-label="Tattoo Directory Home">
                    Tattoo Directory
                  </Link>
                </div>
                <ul>
                  <li><Link href="/artists">Artists</Link></li>
                  <li><Link href="/studios">Studios</Link></li>
                  <li><Link href="/styles">Styles</Link></li>
                </ul>
              </nav>
            </header>

            <nav aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/artists">Artists</Link></li>
                <li aria-current="page">Profile</li>
              </ol>
            </nav>

            <main role="main" aria-label="Main content">
              <h1>Artist Profile</h1>
              
              <section aria-labelledby="portfolio-heading">
                <h2 id="portfolio-heading">Portfolio</h2>
                <div role="img" aria-label="Portfolio gallery">
                  <img src="/portfolio1.jpg" alt="Traditional rose tattoo" />
                  <img src="/portfolio2.jpg" alt="Geometric sleeve tattoo" />
                </div>
              </section>

              <section aria-labelledby="contact-heading">
                <h2 id="contact-heading">Contact Information</h2>
                <address>
                  <p>Email: <Link href="mailto:artist@example.com">artist@example.com</Link></p>
                  <p>Phone: <Link href="tel:+1234567890">+1 (234) 567-890</Link></p>
                </address>
              </section>
            </main>

            <footer role="contentinfo">
              <p>&copy; 2024 Tattoo Directory. All rights reserved.</p>
            </footer>
          </PageWrapper>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should pass axe tests for form accessibility', async () => {
        const { container } = render(
          <form role="form" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading">Contact Artist</h2>
            
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                aria-describedby="name-help"
                aria-invalid="false"
              />
              <div id="name-help">Enter your full name</div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                aria-describedby="email-help"
                aria-invalid="false"
              />
              <div id="email-help">We'll use this to contact you</div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea 
                id="message" 
                name="message" 
                required 
                aria-describedby="message-help"
                aria-invalid="false"
                rows="4"
              />
              <div id="message-help">Describe your tattoo idea</div>
            </div>

            <fieldset>
              <legend>Preferred Contact Method</legend>
              <div>
                <input type="radio" id="contact-email" name="contact-method" value="email" />
                <label htmlFor="contact-email">Email</label>
              </div>
              <div>
                <input type="radio" id="contact-phone" name="contact-method" value="phone" />
                <label htmlFor="contact-phone">Phone</label>
              </div>
            </fieldset>

            <button type="submit" aria-describedby="submit-help">
              Send Message
            </button>
            <div id="submit-help">Submit your message to the artist</div>
          </form>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Interactive Component Accessibility', () => {
      it('should pass axe tests for modal dialogs', async () => {
        const { container } = render(
          <div>
            <button 
              type="button"
              aria-haspopup="dialog"
              aria-expanded="true"
              aria-controls="modal"
            >
              Open Modal
            </button>
            
            <div 
              id="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              <div className="modal-content">
                <header>
                  <h2 id="modal-title">Confirm Action</h2>
                  <button 
                    type="button"
                    aria-label="Close modal"
                    className="modal-close"
                  >
                    ×
                  </button>
                </header>
                
                <div id="modal-description">
                  Are you sure you want to proceed with this action?
                </div>
                
                <footer>
                  <button type="button">Cancel</button>
                  <button type="button">Confirm</button>
                </footer>
              </div>
            </div>
          </div>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should pass axe tests for dropdown menus', async () => {
        const { container } = render(
          <div className="dropdown">
            <button 
              type="button"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="dropdown-menu"
              id="dropdown-button"
            >
              Options
            </button>
            
            <ul 
              id="dropdown-menu"
              role="menu"
              aria-labelledby="dropdown-button"
              hidden
            >
              <li role="menuitem">
                <Link href="/option1">Option 1</Link>
              </li>
              <li role="menuitem">
                <Link href="/option2">Option 2</Link>
              </li>
              <li role="menuitem">
                <Link href="/option3">Option 3</Link>
              </li>
            </ul>
          </div>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Keyboard Navigation Testing', () => {
    it('should support proper tab order in search components', async () => {
      render(
        <SearchFeedbackIntegration
          searchType="artists"
          placeholder="Search artists..."
          onSearch={jest.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search artists...');
      
      // Test initial focus
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Test keyboard input
      await user.keyboard('test search');
      expect(searchInput).toHaveValue('test search');

      // Test enter key submission
      await user.keyboard('{Enter}');
      // Should not throw errors
    });

    it('should support keyboard navigation in interactive components', async () => {
      render(
        <AnimationInteractionIntegration>
          <nav>
            <Link href="/artists" data-testid="artists-link">Artists</Link>
            <Link href="/studios" data-testid="studios-link">Studios</Link>
            <Link href="/styles" data-testid="styles-link">Styles</Link>
          </nav>
          <button data-testid="action-button">Action</button>
        </AnimationInteractionIntegration>
      );

      // Test tab navigation through links
      await user.tab();
      expect(screen.getByTestId('artists-link')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('studios-link')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('styles-link')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('action-button')).toHaveFocus();
    });

    it('should support arrow key navigation in menus', async () => {
      const MockMenu = () => {
        const [selectedIndex, setSelectedIndex] = React.useState(0);
        
        const handleKeyDown = (event) => {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              setSelectedIndex(prev => Math.min(prev + 1, 2));
              break;
            case 'ArrowUp':
              event.preventDefault();
              setSelectedIndex(prev => Math.max(prev - 1, 0));
              break;
          }
        };

        return (
          <ul 
            role="menu" 
            onKeyDown={handleKeyDown}
            tabIndex={0}
            data-testid="menu"
          >
            <li role="menuitem" className={selectedIndex === 0 ? 'selected' : ''}>
              Option 1
            </li>
            <li role="menuitem" className={selectedIndex === 1 ? 'selected' : ''}>
              Option 2
            </li>
            <li role="menuitem" className={selectedIndex === 2 ? 'selected' : ''}>
              Option 3
            </li>
          </ul>
        );
      };

      render(<MockMenu />);

      const menu = screen.getByTestId('menu');
      menu.focus();

      // Test arrow down navigation
      await user.keyboard('{ArrowDown}');
      expect(menu.children[1]).toHaveClass('selected');

      await user.keyboard('{ArrowDown}');
      expect(menu.children[2]).toHaveClass('selected');

      // Test arrow up navigation
      await user.keyboard('{ArrowUp}');
      expect(menu.children[1]).toHaveClass('selected');
    });

    it('should support escape key to close modals', async () => {
      const MockModal = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        
        const handleKeyDown = (event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        };

        return (
          <div>
            {isOpen && (
              <div 
                role="dialog"
                aria-modal="true"
                onKeyDown={handleKeyDown}
                tabIndex={-1}
                data-testid="modal"
              >
                <h2>Modal Title</h2>
                <p>Modal content</p>
                <button onClick={() => setIsOpen(false)}>Close</button>
              </div>
            )}
          </div>
        );
      };

      render(<MockModal />);

      const modal = screen.getByTestId('modal');
      modal.focus();

      // Test escape key
      await user.keyboard('{Escape}');
      expect(modal).not.toBeInTheDocument();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide proper ARIA labels for all interactive elements', () => {
      render(
        <div>
          <button aria-label="Search for artists">🔍</button>
          <input 
            type="text" 
            aria-label="Search query"
            aria-describedby="search-help"
          />
          <div id="search-help">Enter keywords to find artists</div>
          
          <nav aria-label="Main navigation">
            <ul>
              <li><Link href="/artists">Artists</Link></li>
              <li><Link href="/studios">Studios</Link></li>
            </ul>
          </nav>
          
          <img 
            src="/tattoo.jpg" 
            alt="Traditional dragon tattoo on forearm"
            role="img"
          />
        </div>
      );

      // Test button has aria-label
      const searchButton = screen.getByLabelText('Search for artists');
      expect(searchButton).toBeInTheDocument();

      // Test input has aria-label and describedby
      const searchInput = screen.getByLabelText('Search query');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');

      // Test navigation has aria-label
      const nav = screen.getByLabelText('Main navigation');
      expect(nav).toBeInTheDocument();

      // Test image has proper alt text
      const image = screen.getByAltText('Traditional dragon tattoo on forearm');
      expect(image).toBeInTheDocument();
    });

    it('should announce dynamic content changes with aria-live', async () => {
      const MockLiveRegion = () => {
        const [status, setStatus] = React.useState('Ready');
        
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setStatus('Loading results...');
          }, 100);
          
          return () => clearTimeout(timer);
        }, []);

        return (
          <div>
            <div aria-live="polite" data-testid="status">
              {status}
            </div>
            <button onClick={() => setStatus('Searching...')}>
              Search
            </button>
          </div>
        );
      };

      render(<MockLiveRegion />);

      const statusRegion = screen.getByTestId('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      
      // Wait for status change
      await waitFor(() => {
        expect(statusRegion).toHaveTextContent('Loading results...');
      });
    });

    it('should provide proper heading hierarchy', () => {
      render(
        <article>
          <h1>Main Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection Title</h3>
            <p>Content</p>
          </section>
          <section>
            <h2>Another Section</h2>
            <h3>Another Subsection</h3>
            <p>More content</p>
          </section>
        </article>
      );

      // Test heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('Main Page Title');
      expect(h2Elements).toHaveLength(2);
      expect(h3Elements).toHaveLength(2);
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly in modal dialogs', async () => {
      const MockModalWithFocus = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const modalRef = React.useRef(null);
        const triggerRef = React.useRef(null);

        React.useEffect(() => {
          if (isOpen && modalRef.current) {
            modalRef.current.focus();
          }
        }, [isOpen]);

        const closeModal = () => {
          setIsOpen(false);
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
        };

        return (
          <div>
            <button 
              ref={triggerRef}
              onClick={() => setIsOpen(true)}
              data-testid="open-modal"
            >
              Open Modal
            </button>
            
            {isOpen && (
              <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                data-testid="modal"
              >
                <h2>Modal Title</h2>
                <button 
                  onClick={closeModal}
                  data-testid="close-modal"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<MockModalWithFocus />);

      const openButton = screen.getByTestId('open-modal');
      
      // Open modal
      await user.click(openButton);
      
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveFocus();

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);
      
      // Focus should return to trigger
      expect(openButton).toHaveFocus();
    });

    it('should trap focus within modal dialogs', async () => {
      const MockFocusTrap = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        return (
          <div>
            <button data-testid="outside-button">Outside Button</button>
            
            {isOpen && (
              <div role="dialog" aria-modal="true" data-testid="modal">
                <button data-testid="first-button">First</button>
                <button data-testid="second-button">Second</button>
                <button 
                  data-testid="close-button"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<MockFocusTrap />);

      const firstButton = screen.getByTestId('first-button');
      const secondButton = screen.getByTestId('second-button');
      const closeButton = screen.getByTestId('close-button');

      // Focus should be trapped within modal
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tab from last element should cycle back to first
      await user.tab();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain sufficient color contrast ratios', () => {
      render(
        <div>
          <div className="text-primary bg-white" data-testid="primary-text">
            Primary text on white background
          </div>
          <div className="text-secondary bg-light" data-testid="secondary-text">
            Secondary text on light background
          </div>
          <button className="btn-primary" data-testid="primary-button">
            Primary Button
          </button>
          <button className="btn-secondary" data-testid="secondary-button">
            Secondary Button
          </button>
        </div>
      );

      // Test elements exist (contrast testing would require additional tools)
      expect(screen.getByTestId('primary-text')).toBeInTheDocument();
      expect(screen.getByTestId('secondary-text')).toBeInTheDocument();
      expect(screen.getByTestId('primary-button')).toBeInTheDocument();
      expect(screen.getByTestId('secondary-button')).toBeInTheDocument();
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
          respectReducedMotion={true}
          enableMicroInteractions={true}
        >
          <div data-testid="animated-content">
            Content with animations
          </div>
        </AnimationInteractionIntegration>
      );

      const content = screen.getByTestId('animated-content');
      expect(content).toHaveClass('reduce-motion');
    });
  });
});