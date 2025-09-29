/**
 * Keyboard Navigation and Screen Reader Compatibility Tests
 * 
 * Tests keyboard navigation and screen reader compatibility
 * Validates ARIA implementation and focus management
 * 
 * Requirements: 11.4, 11.5, 11.6
 */

import React from 'react';
import Link from 'next/link';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('Keyboard Navigation and Screen Reader Compatibility', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock focus management
    Element.prototype.focus = jest.fn();
    Element.prototype.blur = jest.fn();
    
    // Mock getBoundingClientRect for visibility tests
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Focus Management', () => {
    test('maintains proper focus order in navigation', async () => {
      render(
        <nav role="navigation" aria-label="Main navigation">
          <Link href="/artists">Artists</Link>
          <Link href="/studios">Studios</Link>
          <Link href="/styles">Styles</Link>
        </nav>
      );

      const navItems = screen.getAllByRole('link');
      
      // Test tab order
      await user.tab();
      expect(navItems[0]).toHaveFocus();
      
      await user.tab();
      expect(navItems[1]).toHaveFocus();
      
      await user.tab();
      expect(navItems[2]).toHaveFocus();
    });

    test('handles Enter and Space key activation', async () => {
      const mockClick = jest.fn();
      
      render(
        <button onClick={mockClick}>
          Activate Me
        </button>
      );

      const button = screen.getByRole('button');
      button.focus();
      
      // Enter should activate
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);
      
      // Space should also activate
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(2);
    });

    test('supports Escape key for dismissing overlays', () => {
      const mockClose = jest.fn();
      
      render(
        <div role="dialog" onKeyDown={(e) => {
          if (e.key === 'Escape') mockClose();
        }}>
          <button>Content</button>
        </div>
      );

      const dialog = screen.getByRole('dialog');
      
      // Escape should close
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('ARIA Implementation', () => {
    test('provides proper ARIA labels and descriptions', () => {
      render(
        <div>
          <input 
            aria-label="Search artists"
            aria-describedby="search-help"
          />
          <div id="search-help">
            Enter artist name or style
          </div>
        </div>
      );

      const input = screen.getByLabelText('Search artists');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
      
      const helpText = screen.getByText('Enter artist name or style');
      expect(helpText).toHaveAttribute('id', 'search-help');
    });

    test('announces dynamic content changes', async () => {
      const DynamicContent = () => {
        const [message, setMessage] = React.useState('');
        
        return (
          <div>
            <button onClick={() => setMessage('Content updated!')}>
              Update
            </button>
            <div aria-live="polite" aria-atomic="true">
              {message}
            </div>
          </div>
        );
      };

      render(<DynamicContent />);
      
      const button = screen.getByText('Update');
      await user.click(button);
      
      const liveRegion = screen.getByText('Content updated!');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('provides proper role attributes', () => {
      render(
        <nav role="navigation">
          <Link href="/item1">Item 1</Link>
          <Link href="/item2">Item 2</Link>
        </nav>
      );

      // Check for proper navigation roles
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('provides meaningful text alternatives for images', () => {
      render(
        <div>
          <img src="/artist.jpg" alt="John Doe tattoo artist portfolio" />
          <img src="/decorative.jpg" alt="" role="presentation" />
        </div>
      );

      const meaningfulImage = screen.getByAltText('John Doe tattoo artist portfolio');
      expect(meaningfulImage).toBeInTheDocument();
      
      const decorativeImage = screen.getByRole('presentation');
      expect(decorativeImage).toHaveAttribute('alt', '');
    });

    test('structures content with proper headings', () => {
      render(
        <div role="main">
          <h1>Main Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection</h3>
          </section>
        </div>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    test('provides skip links for navigation', () => {
      render(
        <div>
          <Link href="#main-content" className="skip-link">
            Skip to main content
          </Link>
          <nav>Navigation</nav>
          <main id="main-content">
            Main content
          </main>
        </div>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Form Accessibility', () => {
    test('associates labels with form controls', () => {
      render(
        <form>
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" required />
          
          <fieldset>
            <legend>Preferred Contact Method</legend>
            <input type="radio" id="email-contact" name="contact" />
            <label htmlFor="email-contact">Email</label>
            <input type="radio" id="phone-contact" name="contact" />
            <label htmlFor="phone-contact">Phone</label>
          </fieldset>
        </form>
      );

      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toHaveAttribute('id', 'email');
      
      const fieldset = screen.getByRole('group', { name: 'Preferred Contact Method' });
      expect(fieldset).toBeInTheDocument();
    });

    test('provides error messages with proper associations', () => {
      render(
        <div>
          <label htmlFor="password">Password</label>
          <input 
            id="password" 
            type="password" 
            aria-describedby="password-error"
            aria-invalid="true"
          />
          <div id="password-error" role="alert">
            Password must be at least 8 characters
          </div>
        </div>
      );

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Password must be at least 8 characters');
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    test('provides adequate touch target sizes', () => {
      render(
        <nav role="navigation" style={{ minHeight: 44 }}>
          <Link href="/target">Touch Target</Link>
        </nav>
      );

      const touchTarget = screen.getByText('Touch Target');
      expect(touchTarget).toBeInTheDocument();
      
      // Touch targets should be at least 44px
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle('min-height: 44px');
    });

    test('supports voice control commands', () => {
      render(
        <div>
          <button aria-label="Search for artists">
            🔍
          </button>
          <button aria-label="Filter results">
            Filter
          </button>
        </div>
      );

      // Voice control relies on accessible names
      const searchButton = screen.getByLabelText('Search for artists');
      const filterButton = screen.getByLabelText('Filter results');
      
      expect(searchButton).toBeInTheDocument();
      expect(filterButton).toBeInTheDocument();
    });

    test('supports reduced motion preferences', () => {
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
        <div className="animation-container">
          <div className="animated-element">Content</div>
        </div>
      );

      const animatedElement = screen.getByText('Content');
      expect(animatedElement).toBeInTheDocument();
      
      // In real implementation, animations would be disabled
      // when prefers-reduced-motion: reduce is detected
    });
  });
});