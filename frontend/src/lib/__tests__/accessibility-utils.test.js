/**
 * Accessibility Utilities Tests
 * 
 * Tests for the accessibility optimization utilities
 */

import { 
  AriaLiveRegion, 
  KeyboardNavigationManager, 
  TouchAccessibilityManager,
  ScreenReaderUtils 
} from '../accessibility-utils';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  })
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Accessibility Utilities', () => {
  describe('AriaLiveRegion', () => {
    let ariaLiveRegion;

    beforeEach(() => {
      // Clear any existing live regions
      document.body.innerHTML = '';
      ariaLiveRegion = new AriaLiveRegion();
    });

    it('should create default live regions', () => {
      const politeRegion = document.getElementById('aria-live-polite');
      const assertiveRegion = document.getElementById('aria-live-assertive');
      const statusRegion = document.getElementById('aria-live-status');

      expect(politeRegion).toBeTruthy();
      expect(assertiveRegion).toBeTruthy();
      expect(statusRegion).toBeTruthy();

      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(statusRegion.getAttribute('role')).toBe('status');
    });

    it('should announce messages', (done) => {
      const message = 'Test announcement';
      
      ariaLiveRegion.announce(message, 'polite');
      
      // Check after timeout to allow for the delay
      setTimeout(() => {
        const politeRegion = document.getElementById('aria-live-polite');
        expect(politeRegion.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should announce search results', (done) => {
      ariaLiveRegion.announceSearchResults(5, 'dragon tattoo');
      
      setTimeout(() => {
        const politeRegion = document.getElementById('aria-live-polite');
        expect(politeRegion.textContent).toContain('5 results found for "dragon tattoo"');
        done();
      }, 150);
    });

    it('should announce no results', (done) => {
      ariaLiveRegion.announceSearchResults(0, 'nonexistent');
      
      setTimeout(() => {
        const politeRegion = document.getElementById('aria-live-polite');
        expect(politeRegion.textContent).toContain('No results found for "nonexistent"');
        done();
      }, 150);
    });

    it('should announce filter changes', (done) => {
      ariaLiveRegion.announceFilterChange('Style', 'Traditional', true);
      
      setTimeout(() => {
        const politeRegion = document.getElementById('aria-live-polite');
        expect(politeRegion.textContent).toContain('Style filter "Traditional" added');
        done();
      }, 150);
    });
  });

  describe('KeyboardNavigationManager', () => {
    let keyboardNavigation;

    beforeEach(() => {
      keyboardNavigation = new KeyboardNavigationManager();
      document.body.innerHTML = '';
    });

    it('should find focusable elements', () => {
      document.body.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <button disabled>Disabled Button</button>
      `;

      // Mock offsetWidth and offsetHeight for visibility check
      const elements = document.body.querySelectorAll('*');
      elements.forEach(el => {
        Object.defineProperty(el, 'offsetWidth', { value: 100 });
        Object.defineProperty(el, 'offsetHeight', { value: 30 });
      });

      const focusable = keyboardNavigation.getFocusableElements();
      
      expect(focusable).toHaveLength(3); // Should exclude disabled button
      expect(focusable[0].tagName).toBe('BUTTON');
      expect(focusable[1].tagName).toBe('INPUT');
      expect(focusable[2].tagName).toBe('A');
    });

    it('should focus first element', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

      // Mock offsetWidth and offsetHeight for visibility check
      const elements = document.body.querySelectorAll('*');
      elements.forEach(el => {
        Object.defineProperty(el, 'offsetWidth', { value: 100 });
        Object.defineProperty(el, 'offsetHeight', { value: 30 });
      });

      const focused = keyboardNavigation.focusFirst(document.body);
      
      expect(focused.id).toBe('btn1');
      expect(document.activeElement).toBe(focused);
    });

    it('should focus last element', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

      // Mock offsetWidth and offsetHeight for visibility check
      const elements = document.body.querySelectorAll('*');
      elements.forEach(el => {
        Object.defineProperty(el, 'offsetWidth', { value: 100 });
        Object.defineProperty(el, 'offsetHeight', { value: 30 });
      });

      const focused = keyboardNavigation.focusLast(document.body);
      
      expect(focused.id).toBe('btn2');
      expect(document.activeElement).toBe(focused);
    });

    it('should handle arrow navigation', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button')
      ];

      items.forEach((item, index) => {
        item.id = `item-${index}`;
        item.focus = jest.fn();
        document.body.appendChild(item);
      });

      const event = { key: 'ArrowDown', preventDefault: jest.fn() };
      const newIndex = keyboardNavigation.handleArrowNavigation(event, items, 0, {
        orientation: 'vertical'
      });

      expect(newIndex).toBe(1);
      expect(items[1].focus).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('TouchAccessibilityManager', () => {
    let touchAccessibility;

    beforeEach(() => {
      touchAccessibility = new TouchAccessibilityManager();
    });

    it('should ensure minimum touch target size', () => {
      const element = document.createElement('button');
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 30,
        height: 30
      });

      touchAccessibility.ensureTouchTarget(element, 44);

      expect(element.style.minWidth).toBe('44px');
      expect(element.style.minHeight).toBe('44px');
    });

    it('should add touch handlers', () => {
      const element = document.createElement('button');
      const onTap = jest.fn();
      
      const cleanup = touchAccessibility.addTouchHandlers(element, { onTap });

      // Simulate touch events
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      element.dispatchEvent(touchEvent);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  describe('ScreenReaderUtils', () => {
    it('should generate search result labels', () => {
      const result = {
        name: 'John Doe',
        type: 'artist',
        location: { city: 'London' },
        rating: 4.5,
        styles: ['traditional', 'realism']
      };

      const label = ScreenReaderUtils.createSearchResultLabel(result, 0, 10);

      expect(label).toContain('John Doe');
      expect(label).toContain('artist');
      expect(label).toContain('London');
      expect(label).toContain('4.5 out of 5 stars');
      expect(label).toContain('traditional, realism');
      expect(label).toContain('Result 1 of 10');
    });

    it('should generate filter labels', () => {
      const label = ScreenReaderUtils.createFilterLabel('Style', 'Traditional', true, 25);

      expect(label).toContain('Style filter: Traditional');
      expect(label).toContain('currently active');
      expect(label).toContain('25 results available');
      expect(label).toContain('Press Enter or Space to toggle');
    });

    it('should generate inactive filter labels', () => {
      const label = ScreenReaderUtils.createFilterLabel('Style', 'Modern', false);

      expect(label).toContain('Style filter: Modern');
      expect(label).toContain('not active');
      expect(label).toContain('Press Enter or Space to toggle');
    });

    it('should generate descriptions for UI elements', () => {
      const description = ScreenReaderUtils.generateDescription(null, {
        type: 'button',
        state: 'pressed',
        position: 1,
        total: 5
      });

      expect(description).toContain('button');
      expect(description).toContain('pressed');
      expect(description).toContain('1 of 5');
    });
  });
});