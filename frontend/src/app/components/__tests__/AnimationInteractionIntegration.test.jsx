/**
 * Animation and Interaction Integration Tests
 * 
 * Comprehensive test suite for animation and interaction systems integration
 * including micro-interactions, page transitions, hover effects, focus indicators,
 * and accessibility considerations.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import {
  AnimationInteractionIntegration,
  useMicroInteractions,
  HoverEffectsProvider,
  FocusIndicator,
  PageTransitionManager,
  LoadingAnimation,
  ScrollToTopButton,
  StaggeredContainer,
  FullyAnimatedCard
} from '../AnimationInteractionIntegration';

// Mock window.matchMedia for reduced motion testing
const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Test component for useMicroInteractions hook
const TestMicroInteractionsComponent = ({ options }) => {
  const { 
    prefersReducedMotion, 
    isHovered, 
    isFocused, 
    isActive, 
    getAnimationClasses, 
    interactionHandlers 
  } = useMicroInteractions(options);

  return (
    <div 
      data-testid="micro-interactions-test"
      data-reduced-motion={prefersReducedMotion}
      data-hovered={isHovered}
      data-focused={isFocused}
      data-active={isActive}
      className={getAnimationClasses('float')}
      {...interactionHandlers}
    >
      Test Component
    </div>
  );
};

describe('AnimationInteractionIntegration', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia(false);
    
    // Mock scrollTo
    window.scrollTo = jest.fn();
    
    // Mock pageYOffset
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useMicroInteractions Hook', () => {
    it('should initialize with default values', () => {
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      expect(element).toHaveAttribute('data-reduced-motion', 'false');
      expect(element).toHaveAttribute('data-hovered', 'false');
      expect(element).toHaveAttribute('data-focused', 'false');
      expect(element).toHaveAttribute('data-active', 'false');
    });

    it('should detect reduced motion preference', () => {
      mockMatchMedia(true);
      
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      expect(element).toHaveAttribute('data-reduced-motion', 'true');
    });

    it('should handle hover interactions', async () => {
      const user = userEvent.setup();
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      
      await user.hover(element);
      expect(element).toHaveAttribute('data-hovered', 'true');
      
      await user.unhover(element);
      expect(element).toHaveAttribute('data-hovered', 'false');
    });

    it('should handle focus interactions', async () => {
      const user = userEvent.setup();
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      
      await user.click(element);
      expect(element).toHaveAttribute('data-focused', 'true');
      
      await user.tab();
      expect(element).toHaveAttribute('data-focused', 'false');
    });

    it('should return animation classes when motion is enabled', () => {
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      expect(element).toHaveClass('animate-float');
    });

    it('should not return animation classes when motion is reduced', () => {
      mockMatchMedia(true);
      
      render(<TestMicroInteractionsComponent />);
      
      const element = screen.getByTestId('micro-interactions-test');
      expect(element).not.toHaveClass('animate-float');
    });
  });

  describe('HoverEffectsProvider', () => {
    it('should render with default hover effect', () => {
      render(
        <HoverEffectsProvider data-testid="hover-provider">
          <div>Content</div>
        </HoverEffectsProvider>
      );
      
      const element = screen.getByTestId('hover-provider');
      expect(element).toHaveClass('hover-lift');
      expect(element).toHaveClass('transition-all');
    });

    it('should apply different hover effects', () => {
      const { rerender } = render(
        <HoverEffectsProvider effect="glow" data-testid="hover-provider">
          <div>Content</div>
        </HoverEffectsProvider>
      );
      
      expect(screen.getByTestId('hover-provider')).toHaveClass('hover-glow');
      
      rerender(
        <HoverEffectsProvider effect="scale" data-testid="hover-provider">
          <div>Content</div>
        </HoverEffectsProvider>
      );
      
      expect(screen.getByTestId('hover-provider')).toHaveClass('hover-scale');
    });

    it('should apply motion-reduced class when reduced motion is preferred', () => {
      mockMatchMedia(true);
      
      render(
        <HoverEffectsProvider data-testid="hover-provider">
          <div>Content</div>
        </HoverEffectsProvider>
      );
      
      expect(screen.getByTestId('hover-provider')).toHaveClass('motion-reduced');
    });
  });

  describe('FocusIndicator', () => {
    it('should render with default focus ring', () => {
      render(
        <FocusIndicator data-testid="focus-indicator">
          <button>Test Button</button>
        </FocusIndicator>
      );
      
      const element = screen.getByTestId('focus-indicator');
      expect(element).toHaveClass('focus:ring-blue-500');
    });

    it('should apply different focus variants', () => {
      const { rerender } = render(
        <FocusIndicator variant="glow" data-testid="focus-indicator">
          <button>Test Button</button>
        </FocusIndicator>
      );
      
      expect(screen.getByTestId('focus-indicator')).toHaveClass('focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]');
      
      rerender(
        <FocusIndicator variant="underline" data-testid="focus-indicator">
          <button>Test Button</button>
        </FocusIndicator>
      );
      
      expect(screen.getByTestId('focus-indicator')).toHaveClass('focus:border-blue-500');
    });

    it('should apply different colors', () => {
      render(
        <FocusIndicator color="success" data-testid="focus-indicator">
          <button>Test Button</button>
        </FocusIndicator>
      );
      
      expect(screen.getByTestId('focus-indicator')).toHaveClass('focus:ring-green-500');
    });
  });

  describe('PageTransitionManager', () => {
    it('should render with fade transition by default', async () => {
      render(
        <PageTransitionManager data-testid="page-transition">
          <div>Page Content</div>
        </PageTransitionManager>
      );
      
      const element = screen.getByTestId('page-transition');
      expect(element).toHaveClass('transition-all');
      
      // Should become visible after mount
      await waitFor(() => {
        expect(element).toHaveClass('opacity-100');
      });
    });

    it('should apply different transition types', async () => {
      render(
        <PageTransitionManager transitionType="slideUp" data-testid="page-transition">
          <div>Page Content</div>
        </PageTransitionManager>
      );
      
      const element = screen.getByTestId('page-transition');
      
      await waitFor(() => {
        expect(element).toHaveClass('translate-y-0');
        expect(element).toHaveClass('opacity-100');
      });
    });

    it('should apply motion-reduced class when reduced motion is preferred', () => {
      mockMatchMedia(true);
      
      render(
        <PageTransitionManager data-testid="page-transition">
          <div>Page Content</div>
        </PageTransitionManager>
      );
      
      expect(screen.getByTestId('page-transition')).toHaveClass('motion-reduced');
    });

    it('should apply stagger children class when enabled', () => {
      render(
        <PageTransitionManager staggerChildren data-testid="page-transition">
          <div>Child 1</div>
          <div>Child 2</div>
        </PageTransitionManager>
      );
      
      expect(screen.getByTestId('page-transition')).toHaveClass('stagger-children');
    });
  });

  describe('LoadingAnimation', () => {
    it('should render pulse animation by default', () => {
      render(<LoadingAnimation data-testid="loading" />);
      
      const element = screen.getByTestId('loading');
      expect(element).toHaveClass('animate-pulse');
      expect(element).toHaveClass('w-8'); // medium size
    });

    it('should render different animation types', () => {
      const { rerender } = render(<LoadingAnimation type="spin" data-testid="loading" />);
      
      expect(screen.getByTestId('loading')).toHaveClass('animate-spin');
      
      rerender(<LoadingAnimation type="bounce" data-testid="loading" />);
      
      // Bounce creates multiple elements
      const bounceElements = screen.getAllByTestId('loading')[0].children;
      expect(bounceElements).toHaveLength(3);
    });

    it('should apply different sizes', () => {
      const { rerender } = render(<LoadingAnimation size="small" data-testid="loading" />);
      
      expect(screen.getByTestId('loading')).toHaveClass('w-4');
      
      rerender(<LoadingAnimation size="large" data-testid="loading" />);
      
      expect(screen.getByTestId('loading')).toHaveClass('w-12');
    });

    it('should show static version when reduced motion is preferred', () => {
      mockMatchMedia(true);
      
      render(<LoadingAnimation data-testid="loading" />);
      
      const element = screen.getByTestId('loading');
      expect(element).not.toHaveClass('animate-pulse');
      expect(element).toHaveClass('opacity-50');
    });
  });

  describe('ScrollToTopButton', () => {
    it('should not be visible initially', () => {
      render(<ScrollToTopButton />);
      
      expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument();
    });

    it('should become visible when scrolled past threshold', async () => {
      render(<ScrollToTopButton threshold={100} />);
      
      // Simulate scroll
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 200
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
      });
    });

    it('should scroll to top when clicked', async () => {
      render(<ScrollToTopButton threshold={100} />);
      
      // Make button visible
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 200
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Scroll to top');
      await userEvent.click(button);
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });

    it('should use instant scroll when reduced motion is preferred', async () => {
      mockMatchMedia(true);
      
      render(<ScrollToTopButton threshold={100} />);
      
      // Make button visible
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 200
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Scroll to top');
      await userEvent.click(button);
      
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('StaggeredContainer', () => {
    it('should render children with stagger animation', async () => {
      render(
        <StaggeredContainer data-testid="stagger-container">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </StaggeredContainer>
      );
      
      const container = screen.getByTestId('stagger-container');
      expect(container).toHaveClass('stagger-children');
      
      // Children should have transition classes
      await waitFor(() => {
        const child1 = screen.getByTestId('child-1').parentElement;
        expect(child1).toHaveClass('transition-all');
      });
    });

    it('should apply motion-reduced class when reduced motion is preferred', () => {
      mockMatchMedia(true);
      
      render(
        <StaggeredContainer data-testid="stagger-container">
          <div>Child 1</div>
        </StaggeredContainer>
      );
      
      expect(screen.getByTestId('stagger-container')).toHaveClass('motion-reduced');
    });
  });

  describe('FullyAnimatedCard', () => {
    it('should render with default animations', () => {
      render(
        <FullyAnimatedCard data-testid="animated-card">
          <div>Card Content</div>
        </FullyAnimatedCard>
      );
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should handle click interactions', async () => {
      const handleClick = jest.fn();
      
      render(
        <FullyAnimatedCard onClick={handleClick} data-testid="animated-card">
          <div>Card Content</div>
        </FullyAnimatedCard>
      );
      
      const card = screen.getByTestId('animated-card');
      await userEvent.click(card);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should apply motion-reduced class when reduced motion is preferred', () => {
      mockMatchMedia(true);
      
      render(
        <FullyAnimatedCard data-testid="animated-card">
          <div>Card Content</div>
        </FullyAnimatedCard>
      );
      
      expect(screen.getByTestId('animated-card')).toHaveClass('motion-reduced');
    });
  });

  describe('AnimationInteractionIntegration', () => {
    it('should render main integration component', () => {
      render(
        <AnimationInteractionIntegration data-testid="main-integration">
          <div>App Content</div>
        </AnimationInteractionIntegration>
      );
      
      const integration = screen.getByTestId('main-integration');
      expect(integration).toHaveClass('min-h-screen');
      expect(screen.getByText('App Content')).toBeInTheDocument();
    });

    it('should include scroll to top button', () => {
      render(
        <AnimationInteractionIntegration>
          <div>App Content</div>
        </AnimationInteractionIntegration>
      );
      
      // Simulate scroll to make button visible
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 400
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should respect reduced motion preferences across all components', () => {
      mockMatchMedia(true);
      
      render(
        <AnimationInteractionIntegration>
          <HoverEffectsProvider data-testid="hover">
            <FocusIndicator data-testid="focus">
              <PageTransitionManager data-testid="transition">
                <LoadingAnimation data-testid="loading" />
                <StaggeredContainer data-testid="stagger">
                  <FullyAnimatedCard data-testid="card">
                    Content
                  </FullyAnimatedCard>
                </StaggeredContainer>
              </PageTransitionManager>
            </FocusIndicator>
          </HoverEffectsProvider>
        </AnimationInteractionIntegration>
      );
      
      expect(screen.getByTestId('hover')).toHaveClass('motion-reduced');
      expect(screen.getByTestId('focus')).toHaveClass('motion-reduced');
      expect(screen.getByTestId('transition')).toHaveClass('motion-reduced');
      expect(screen.getByTestId('stagger')).toHaveClass('motion-reduced');
      expect(screen.getByTestId('card')).toHaveClass('motion-reduced');
    });

    it('should provide proper focus management', async () => {
      render(
        <FocusIndicator>
          <button>Focusable Button</button>
        </FocusIndicator>
      );
      
      const button = screen.getByRole('button');
      await userEvent.tab();
      
      expect(button).toHaveFocus();
    });

    it('should provide proper ARIA labels', () => {
      render(<ScrollToTopButton threshold={0} />);
      
      // Make button visible
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 400
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      waitFor(() => {
        const button = screen.getByLabelText('Scroll to top');
        expect(button).toHaveAttribute('aria-label', 'Scroll to top');
      });
    });
  });

  describe('Performance', () => {
    it('should use will-change and transform optimizations', () => {
      render(
        <HoverEffectsProvider effect="float">
          <div>Content</div>
        </HoverEffectsProvider>
      );
      
      // Check that CSS classes for performance optimization are applied
      const element = screen.getByText('Content').parentElement;
      expect(element).toHaveClass('animate-float');
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<ScrollToTopButton />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});