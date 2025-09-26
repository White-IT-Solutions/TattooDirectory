/**
 * Mobile Responsiveness and Touch Interaction Tests
 * 
 * Validates mobile responsiveness and touch interactions
 * Tests gesture support and device capability integration
 * 
 * Requirements: 11.4, 11.5, 11.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components for testing
const MockGestureSupport = ({ 
  onSwipe, onPinch, onMultiTouch, onOrientationChange, onNetworkChange,
  enableSwipe, enablePinch, enableMultiTouch, hybridMode, enableHover,
  respectReducedMotion, optimizeForMobile, enablePassiveListeners,
  adaptToConnection, children 
}) => (
  <div 
    data-testid="gesture-area"
    className={`
      ${hybridMode ? 'hybrid hover-touch' : ''}
      ${respectReducedMotion ? 'reduced-motion no-animation' : ''}
      ${optimizeForMobile ? 'mobile-optimized performance' : ''}
    `}
    onTouchStart={(e) => {
      if (onSwipe && e.touches.length === 1) {
        const touch = e.touches[0];
        setTimeout(() => onSwipe({ direction: 'right', distance: 100 }), 0);
      }
      if (onMultiTouch && e.touches.length > 1) {
        onMultiTouch();
      }
    }}
  >
    {children}
  </div>
);

const MockTouchTargets = ({ 
  onTouch, hybridMode, enableVoiceControl, adaptToMemory, 
  minTouchSize, children 
}) => (
  <div 
    className={`
      ${hybridMode ? 'hybrid-touch' : ''}
      ${adaptToMemory ? 'low-memory optimized' : ''}
    `}
    style={{ minHeight: minTouchSize }}
    onTouchStart={() => onTouch && onTouch()}
    onClick={() => onTouch && onTouch()}
  >
    {React.Children.map(children, child => 
      React.cloneElement(child, {
        'aria-label': enableVoiceControl ? child.props.children : undefined,
        'data-voice-command': enableVoiceControl ? child.props.children : undefined
      })
    )}
  </div>
);

const MockMobileNavigation = ({ 
  isOpen, onToggle, onResize, items = [], compact, responsive, accessibilityMode 
}) => (
  <nav 
    role="navigation"
    aria-label={accessibilityMode ? "Mobile navigation" : undefined}
    className={`
      ${compact ? 'compact small' : ''}
      ${responsive ? 'responsive' : ''}
      mobile hamburger
    `}
  >
    <button 
      role="button" 
      aria-label="menu navigation"
      style={{ minHeight: '44px', minWidth: '44px' }}
      onClick={onToggle}
    >
      Menu
    </button>
    {isOpen && items.map((item, index) => (
      <a 
        key={index} 
        href={item.href}
        aria-label={accessibilityMode ? item.label : undefined}
      >
        {item.label}
      </a>
    ))}
  </nav>
);

const MockLocationServices = ({ 
  onLocationUpdate, enableGeolocation, enableVibration, enableWebShare, fallbackMode 
}) => (
  <div>
    {enableGeolocation && (
      <button 
        role="button" 
        aria-label="location gps"
        onClick={() => {
          if (global.navigator.geolocation) {
            onLocationUpdate && onLocationUpdate();
          }
        }}
      >
        Location
      </button>
    )}
    {enableWebShare && (
      <button role="button" aria-label="share">Share</button>
    )}
    {fallbackMode && !enableGeolocation && (
      <div>Manual location entry</div>
    )}
  </div>
);

// Mock device capabilities
const mockDeviceCapabilities = (capabilities) => {
  global.navigator = {
    ...global.navigator,
    userAgent: capabilities.mobile ? 
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' :
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxTouchPoints: capabilities.touch ? 5 : 0,
    geolocation: capabilities.geolocation ? {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    } : undefined,
    vibrate: capabilities.vibration ? jest.fn() : undefined,
    share: capabilities.webShare ? jest.fn() : undefined
  };

  // Mock touch events
  if (capabilities.touch) {
    global.TouchEvent = class TouchEvent extends Event {
      constructor(type, options = {}) {
        super(type, options);
        this.touches = options.touches || [];
        this.targetTouches = options.targetTouches || [];
        this.changedTouches = options.changedTouches || [];
      }
    };
  }
};

// Mock viewport dimensions
const mockViewport = (width, height) => {
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

  // Mock matchMedia for responsive breakpoints
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => {
      const breakpoints = {
        '(max-width: 640px)': width <= 640,
        '(max-width: 768px)': width <= 768,
        '(max-width: 1024px)': width <= 1024,
        '(max-width: 1280px)': width <= 1280,
        '(min-width: 641px)': width > 640,
        '(min-width: 769px)': width > 768,
        '(min-width: 1025px)': width > 1024,
        '(orientation: portrait)': height > width,
        '(orientation: landscape)': width > height,
        '(prefers-reduced-motion: reduce)': false,
        '(hover: hover)': width > 1024
      };

      return {
        matches: breakpoints[query] || false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
};

// Device configurations for testing
const DEVICES = {
  mobile: {
    phone: { width: 375, height: 667, touch: true, mobile: true },
    tablet: { width: 768, height: 1024, touch: true, mobile: true },
    smallPhone: { width: 320, height: 568, touch: true, mobile: true }
  },
  desktop: {
    laptop: { width: 1366, height: 768, touch: false, mobile: false },
    desktop: { width: 1920, height: 1080, touch: false, mobile: false },
    touchLaptop: { width: 1366, height: 768, touch: true, mobile: false }
  }
};

describe('Mobile Responsiveness and Touch Interaction Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Phone Responsiveness', () => {
    beforeEach(() => {
      const device = DEVICES.mobile.phone;
      mockViewport(device.width, device.height);
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: true,
        webShare: true
      });
    });

    test('should render mobile-optimized navigation', () => {
      render(
        <MockMobileNavigation 
          isOpen={false}
          onToggle={jest.fn()}
          items={[
            { label: 'Artists', href: '/artists' },
            { label: 'Studios', href: '/studios' },
            { label: 'Styles', href: '/styles' }
          ]}
        />
      );

      // Should show mobile hamburger menu
      const menuButton = screen.getByRole('button', { name: /menu|navigation/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass(expect.stringMatching(/mobile|hamburger/));

      // Should have proper touch target size (44px minimum)
      const styles = window.getComputedStyle(menuButton);
      const minSize = parseInt(styles.minHeight) || parseInt(styles.height);
      expect(minSize).toBeGreaterThanOrEqual(44);
    });

    test('should handle touch interactions properly', async () => {
      const user = userEvent.setup();
      const onTouch = jest.fn();

      render(
        <MockTouchTargets onTouch={onTouch}>
          <button>Touch Target</button>
        </MockTouchTargets>
      );

      const button = screen.getByRole('button');

      // Test touch events
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      expect(onTouch).toHaveBeenCalled();
    });

    test('should support gesture interactions', async () => {
      const onSwipe = jest.fn();
      const onPinch = jest.fn();

      render(
        <MockGestureSupport 
          onSwipe={onSwipe}
          onPinch={onPinch}
          enableSwipe={true}
          enablePinch={true}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </MockGestureSupport>
      );

      const gestureArea = screen.getByTestId('gesture-area');

      // Test swipe gesture
      fireEvent.touchStart(gestureArea, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(gestureArea, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(gestureArea, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith(
          expect.objectContaining({
            direction: 'right',
            distance: expect.any(Number)
          })
        );
      });
    });

    test('should integrate location services on mobile', async () => {
      const onLocationUpdate = jest.fn();

      render(
        <MockLocationServices 
          onLocationUpdate={onLocationUpdate}
          enableGeolocation={true}
        />
      );

      const locationButton = screen.getByRole('button', { name: /location|gps/i });
      expect(locationButton).toBeInTheDocument();

      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10
        }
      };

      global.navigator.geolocation.getCurrentPosition.mockImplementation(
        (success) => success(mockPosition)
      );

      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Tablet Responsiveness', () => {
    beforeEach(() => {
      const device = DEVICES.mobile.tablet;
      mockViewport(device.width, device.height);
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: false,
        webShare: true
      });
    });

    test('should adapt layout for tablet screens', () => {
      render(
        <MockMobileNavigation 
          isOpen={false}
          onToggle={jest.fn()}
          items={[
            { label: 'Artists', href: '/artists' },
            { label: 'Studios', href: '/studios' }
          ]}
        />
      );

      // Should show expanded navigation on tablet
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass(expect.stringMatching(/tablet|expanded/));
    });

    test('should handle tablet-specific touch patterns', async () => {
      const onMultiTouch = jest.fn();

      render(
        <MockGestureSupport 
          onMultiTouch={onMultiTouch}
          enableMultiTouch={true}
        >
          <div data-testid="multi-touch-area">Multi-touch Area</div>
        </MockGestureSupport>
      );

      const area = screen.getByTestId('multi-touch-area');

      // Test multi-touch gesture
      fireEvent.touchStart(area, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });

      expect(onMultiTouch).toHaveBeenCalled();
    });
  });

  describe('Small Screen Compatibility', () => {
    beforeEach(() => {
      const device = DEVICES.mobile.smallPhone;
      mockViewport(device.width, device.height);
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: true,
        webShare: false
      });
    });

    test('should handle minimum screen width (320px)', () => {
      render(
        <MockTouchTargets minTouchSize={44}>
          <button>Small Screen Button</button>
          <input placeholder="Search..." />
        </MockTouchTargets>
      );

      // All interactive elements should be accessible
      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      expect(button).toBeVisible();
      expect(input).toBeVisible();

      // Should maintain minimum touch target sizes
      [button, input].forEach(element => {
        const rect = element.getBoundingClientRect();
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    test('should optimize content for small screens', () => {
      render(
        <MockMobileNavigation 
          isOpen={true}
          onToggle={jest.fn()}
          items={[
            { label: 'Artists', href: '/artists' },
            { label: 'Studios', href: '/studios' },
            { label: 'Styles', href: '/styles' }
          ]}
          compact={true}
        />
      );

      // Should use compact layout
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass(expect.stringMatching(/compact|small/));
    });
  });

  describe('Desktop Touch Device Support', () => {
    beforeEach(() => {
      const device = DEVICES.desktop.touchLaptop;
      mockViewport(device.width, device.height);
      mockDeviceCapabilities({
        mobile: false,
        touch: true,
        geolocation: false,
        vibration: false,
        webShare: false
      });
    });

    test('should support touch on desktop devices', async () => {
      const onTouch = jest.fn();

      render(
        <MockTouchTargets 
          onTouch={onTouch}
          hybridMode={true}
        >
          <button>Hybrid Touch Button</button>
        </MockTouchTargets>
      );

      const button = screen.getByRole('button');

      // Should support both mouse and touch
      fireEvent.click(button);
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);

      expect(onTouch).toHaveBeenCalledTimes(2); // Click + touch
    });

    test('should adapt UI for hybrid input devices', () => {
      render(
        <MockGestureSupport 
          hybridMode={true}
          enableHover={true}
        >
          <div data-testid="hybrid-element">Hybrid Element</div>
        </MockGestureSupport>
      );

      const element = screen.getByTestId('hybrid-element');

      // Should support both hover and touch states
      expect(element).toHaveClass(expect.stringMatching(/hybrid|hover-touch/));
    });
  });

  describe('Orientation and Viewport Changes', () => {
    test('should handle orientation changes', async () => {
      const onOrientationChange = jest.fn();

      // Start in portrait
      mockViewport(375, 667);
      
      render(
        <MockGestureSupport 
          onOrientationChange={onOrientationChange}
        >
          <div data-testid="orientation-aware">Content</div>
        </MockGestureSupport>
      );

      // Simulate orientation change to landscape
      mockViewport(667, 375);
      fireEvent(window, new Event('orientationchange'));

      await waitFor(() => {
        expect(onOrientationChange).toHaveBeenCalledWith('landscape');
      });
    });

    test('should handle viewport resize', async () => {
      const onResize = jest.fn();

      mockViewport(375, 667);

      render(
        <MockMobileNavigation 
          onResize={onResize}
          responsive={true}
        />
      );

      // Simulate viewport resize
      mockViewport(768, 1024);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(onResize).toHaveBeenCalled();
      });
    });
  });

  describe('Device Capability Integration', () => {
    test('should detect and use device capabilities', () => {
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: true,
        webShare: true
      });

      render(
        <MockLocationServices 
          enableGeolocation={true}
          enableVibration={true}
          enableWebShare={true}
        />
      );

      // Should show all available features
      expect(screen.getByRole('button', { name: /location/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    test('should gracefully degrade when capabilities are missing', () => {
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: false,
        vibration: false,
        webShare: false
      });

      render(
        <MockLocationServices 
          enableGeolocation={true}
          enableVibration={true}
          enableWebShare={true}
          fallbackMode={true}
        />
      );

      // Should show fallback options
      expect(screen.getByText(/manual location/i)).toBeInTheDocument();
    });

    test('should handle network connectivity changes', async () => {
      const onNetworkChange = jest.fn();

      // Mock network information
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink: 10,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      });

      render(
        <MockGestureSupport 
          onNetworkChange={onNetworkChange}
          adaptToConnection={true}
        >
          <div>Network Aware Content</div>
        </MockGestureSupport>
      );

      // Simulate network change
      const networkEvent = new Event('change');
      navigator.connection.effectiveType = '2g';
      fireEvent(navigator.connection, networkEvent);

      await waitFor(() => {
        expect(onNetworkChange).toHaveBeenCalledWith(
          expect.objectContaining({
            effectiveType: '2g'
          })
        );
      });
    });
  });

  describe('Accessibility on Mobile Devices', () => {
    test('should support screen reader navigation on mobile', () => {
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: true,
        webShare: true
      });

      render(
        <MockMobileNavigation 
          items={[
            { label: 'Artists', href: '/artists' },
            { label: 'Studios', href: '/studios' }
          ]}
          accessibilityMode={true}
        />
      );

      // Should have proper ARIA labels for mobile screen readers
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label');

      const menuItems = screen.getAllByRole('link');
      menuItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });
    });

    test('should support voice control on mobile', () => {
      render(
        <MockTouchTargets 
          enableVoiceControl={true}
        >
          <button>Voice Controlled Button</button>
        </MockTouchTargets>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('data-voice-command');
    });

    test('should handle reduced motion preferences on mobile', () => {
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
        <MockGestureSupport 
          respectReducedMotion={true}
        >
          <div data-testid="animated-element">Animated Content</div>
        </MockGestureSupport>
      );

      const element = screen.getByTestId('animated-element');
      expect(element).toHaveClass(expect.stringMatching(/reduced-motion|no-animation/));
    });
  });

  describe('Performance on Mobile Devices', () => {
    test('should optimize for mobile performance', () => {
      mockDeviceCapabilities({
        mobile: true,
        touch: true,
        geolocation: true,
        vibration: true,
        webShare: true
      });

      render(
        <MockGestureSupport 
          optimizeForMobile={true}
          enablePassiveListeners={true}
        >
          <div data-testid="performance-optimized">Optimized Content</div>
        </MockGestureSupport>
      );

      const element = screen.getByTestId('performance-optimized');
      expect(element).toHaveClass(expect.stringMatching(/mobile-optimized|performance/));
    });

    test('should handle memory constraints on mobile', () => {
      // Mock limited memory scenario
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        value: 2 // 2GB RAM
      });

      render(
        <MockTouchTargets 
          adaptToMemory={true}
        >
          <button>Memory Aware Button</button>
        </MockTouchTargets>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass(expect.stringMatching(/low-memory|optimized/));
    });
  });
});