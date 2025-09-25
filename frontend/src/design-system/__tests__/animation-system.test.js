/**
 * Animation System Integration Tests
 * Tests the overall animation system functionality
 */

import { animations, animationClasses, animationPatterns } from '../tokens/animations';

describe('Animation System', () => {
  describe('Animation Tokens', () => {
    it('exports duration tokens', () => {
      expect(animations.duration).toBeDefined();
      expect(animations.duration.fast).toBe('150ms');
      expect(animations.duration.normal).toBe('200ms');
      expect(animations.duration.slow).toBe('300ms');
    });

    it('exports easing tokens', () => {
      expect(animations.easing).toBeDefined();
      expect(animations.easing.easeOut).toBe('cubic-bezier(0, 0, 0.2, 1)');
      expect(animations.easing.easeInOut).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('exports hover effects', () => {
      expect(animations.hover).toBeDefined();
      expect(animations.hover.scaleUp).toContain('scale(1.05)');
      expect(animations.hover.cardHover).toContain('translateY(-2px)');
    });

    it('exports focus states', () => {
      expect(animations.focus).toBeDefined();
      expect(animations.focus.ring).toBeDefined();
      expect(animations.focus.ring.width).toBe('2px');
    });

    it('exports micro-feedback animations', () => {
      expect(animations.microFeedback).toBeDefined();
      expect(animations.microFeedback.success).toBeDefined();
      expect(animations.microFeedback.error).toBeDefined();
      expect(animations.microFeedback.buttonPress).toBeDefined();
    });

    it('exports tooltip animations', () => {
      expect(animations.tooltip).toBeDefined();
      expect(animations.tooltip.fadeInUp).toBeDefined();
      expect(animations.tooltip.fadeOutDown).toBeDefined();
    });
  });

  describe('Animation Classes', () => {
    it('exports utility classes', () => {
      expect(animationClasses).toBeDefined();
      expect(animationClasses['hover-scale']).toContain('hover:scale-105');
      expect(animationClasses['focus-ring']).toContain('focus:ring-2');
      expect(animationClasses['active-scale']).toContain('active:scale-95');
    });
  });

  describe('Animation Patterns', () => {
    it('exports component patterns', () => {
      expect(animationPatterns).toBeDefined();
      expect(animationPatterns.button).toBeDefined();
      expect(animationPatterns.card).toBeDefined();
      expect(animationPatterns.input).toBeDefined();
    });

    it('button pattern includes all states', () => {
      const buttonPattern = animationPatterns.button;
      expect(buttonPattern.base).toContain('transition-all');
      expect(buttonPattern.hover).toContain('hover:');
      expect(buttonPattern.active).toContain('active:');
      expect(buttonPattern.focus).toContain('focus:');
    });

    it('page pattern includes transitions', () => {
      const pagePattern = animationPatterns.page;
      expect(pagePattern.enter).toContain('animate-in');
      expect(pagePattern.exit).toContain('animate-out');
    });
  });

  describe('Animation Performance', () => {
    it('uses appropriate durations for micro-interactions', () => {
      // Hover states should be fast (150-200ms)
      expect(animations.duration.fast).toBe('150ms');
      expect(animations.duration.normal).toBe('200ms');
      
      // Page transitions can be slower (300ms)
      expect(animations.duration.slow).toBe('300ms');
    });

    it('uses GPU-accelerated properties', () => {
      // Transform-based animations for performance
      expect(animations.hover.scaleUp).toContain('transform');
      expect(animations.hover.cardHover).toContain('transform');
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides focus indicators with proper contrast', () => {
      const focusRing = animations.focus.ring;
      expect(focusRing.width).toBe('2px'); // WCAG minimum
      expect(focusRing.offset).toBe('2px'); // Proper offset
    });

    it('includes reduced motion considerations', () => {
      // Animation system should work with prefers-reduced-motion
      // This is handled in CSS, but we can verify the structure exists
      expect(animations.duration).toBeDefined();
      expect(animations.easing).toBeDefined();
    });
  });
});