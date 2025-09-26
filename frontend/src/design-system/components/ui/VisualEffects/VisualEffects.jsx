"use client";

import { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

/**
 * VisualEffects Component
 * A utility component for applying advanced visual effects
 * Provides easy access to the sophisticated visual effects system
 */

// Shadow Effect Component
export const ShadowEffect = forwardRef(({ 
  children, 
  elevation = 'surface', 
  color = null, 
  className, 
  ...props 
}, ref) => {
  const shadowClasses = {
    surface: 'shadow-elevation-surface',
    raised: 'shadow-elevation-raised',
    floating: 'shadow-elevation-floating',
    premium: 'shadow-elevation-premium',
  };

  const coloredShadowClasses = {
    primary: {
      subtle: 'shadow-primary-subtle',
      glow: 'shadow-primary-glow',
    },
    accent: {
      subtle: 'shadow-accent-subtle',
      glow: 'shadow-accent-glow',
    },
    success: {
      subtle: 'shadow-success-subtle',
      glow: 'shadow-success-glow',
    },
    warning: {
      subtle: 'shadow-warning-subtle',
      glow: 'shadow-warning-glow',
    },
    error: {
      subtle: 'shadow-error-subtle',
      glow: 'shadow-error-glow',
    },
  };

  const shadowClass = color 
    ? coloredShadowClasses[color]?.glow || coloredShadowClasses[color]?.subtle
    : shadowClasses[elevation];

  return (
    <div
      ref={ref}
      className={cn(shadowClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});

ShadowEffect.displayName = 'ShadowEffect';

// Glassmorphism Effect Component
export const GlassEffect = forwardRef(({ 
  children, 
  variant = 'card', 
  className, 
  ...props 
}, ref) => {
  const glassClasses = {
    navigation: 'glass-navigation',
    modal: 'glass-modal',
    card: 'glass-card',
    panel: 'glass-panel',
  };

  return (
    <div
      ref={ref}
      className={cn(glassClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
});

GlassEffect.displayName = 'GlassEffect';

// Gradient Effect Component
export const GradientEffect = forwardRef(({ 
  children, 
  variant = 'primary-subtle', 
  overlay = false,
  className, 
  ...props 
}, ref) => {
  const gradientClasses = {
    // Brand gradients
    'primary-subtle': 'gradient-primary-subtle',
    'primary-medium': 'gradient-primary-medium',
    'accent-subtle': 'gradient-accent-subtle',
    'accent-medium': 'gradient-accent-medium',
    'neutral-subtle': 'gradient-neutral-subtle',
    
    // Hero gradients
    'hero-primary': 'gradient-hero-primary',
    'hero-accent': 'gradient-hero-accent',
    'hero-neutral': 'gradient-hero-neutral',
    
    // Directional gradients
    'top-primary': 'gradient-top-primary',
    'top-accent': 'gradient-top-accent',
    'left-primary': 'gradient-left-primary',
    'left-accent': 'gradient-left-accent',
    'radial-primary': 'gradient-radial-primary',
    'radial-accent': 'gradient-radial-accent',
  };

  const overlayClasses = {
    'primary-overlay': 'gradient-primary-overlay',
    'accent-overlay': 'gradient-accent-overlay',
  };

  const gradientClass = overlay 
    ? overlayClasses[`${variant.split('-')[0]}-overlay`]
    : gradientClasses[variant];

  return (
    <div
      ref={ref}
      className={cn(gradientClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});

GradientEffect.displayName = 'GradientEffect';

// Texture Effect Component
export const TextureEffect = forwardRef(({ 
  children, 
  variant = 'noise-subtle', 
  overlay = false,
  className, 
  ...props 
}, ref) => {
  const textureClasses = {
    'noise-subtle': 'texture-noise-subtle',
    'noise-medium': 'texture-noise-medium',
    'paper-subtle': 'texture-paper-subtle',
    'fabric-subtle': 'texture-fabric-subtle',
  };

  const overlayClasses = {
    'noise-overlay': 'texture-noise-overlay',
  };

  const textureClass = overlay 
    ? overlayClasses['noise-overlay']
    : textureClasses[variant];

  return (
    <div
      ref={ref}
      className={cn(textureClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});

TextureEffect.displayName = 'TextureEffect';

// Divider Component
export const Divider = forwardRef(({ 
  variant = 'gradient-primary', 
  orientation = 'horizontal',
  className, 
  ...props 
}, ref) => {
  const dividerClasses = {
    // Horizontal dividers
    'gradient-primary': 'divider-gradient-primary',
    'gradient-accent': 'divider-gradient-accent',
    'gradient-neutral': 'divider-gradient-neutral',
    'dots-primary': 'divider-dots-primary',
    'dots-accent': 'divider-dots-accent',
    'dashed-primary': 'divider-dashed-primary',
    'dashed-accent': 'divider-dashed-accent',
    'section-primary': 'divider-section-primary',
    
    // Vertical dividers
    'vertical-primary': 'divider-gradient-vertical-primary',
    'vertical-accent': 'divider-gradient-vertical-accent',
  };

  const dividerClass = orientation === 'vertical' 
    ? dividerClasses[`vertical-${variant.split('-')[1] || 'primary'}`]
    : dividerClasses[variant];

  return (
    <hr
      ref={ref}
      className={cn(dividerClass, className)}
      {...props}
    />
  );
});

Divider.displayName = 'Divider';

// Premium Component Combinations
export const PremiumCard = forwardRef(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('premium-card', className)}
      {...props}
    >
      {children}
    </div>
  );
});

PremiumCard.displayName = 'PremiumCard';

export const PremiumButton = forwardRef(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn('premium-button', className)}
      {...props}
    >
      {children}
    </button>
  );
});

PremiumButton.displayName = 'PremiumButton';

export const PremiumModal = forwardRef(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('premium-modal', className)}
      {...props}
    >
      {children}
    </div>
  );
});

PremiumModal.displayName = 'PremiumModal';

export const PremiumNavigation = forwardRef(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <nav
      ref={ref}
      className={cn('premium-navigation', className)}
      {...props}
    >
      {children}
    </nav>
  );
});

PremiumNavigation.displayName = 'PremiumNavigation';

export const PremiumHero = forwardRef(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <section
      ref={ref}
      className={cn('premium-hero', className)}
      {...props}
    >
      {children}
    </section>
  );
});

PremiumHero.displayName = 'PremiumHero';

// Backdrop Filter Component
export const BackdropEffect = forwardRef(({ 
  children, 
  blur = 'medium', 
  saturate = null,
  className, 
  ...props 
}, ref) => {
  const backdropClasses = {
    // Blur levels
    'blur-subtle': 'backdrop-blur-subtle',
    'blur-medium': 'backdrop-blur-medium',
    'blur-strong': 'backdrop-blur-strong',
    'blur-intense': 'backdrop-blur-intense',
    
    // Saturation levels
    'saturate-subtle': 'backdrop-saturate-subtle',
    'saturate-medium': 'backdrop-saturate-medium',
    'saturate-strong': 'backdrop-saturate-strong',
    
    // Combined effects
    'glass': 'backdrop-glass',
    'frosted': 'backdrop-frosted',
    'premium': 'backdrop-premium',
  };

  const blurClass = backdropClasses[`blur-${blur}`];
  const saturateClass = saturate ? backdropClasses[`saturate-${saturate}`] : '';

  return (
    <div
      ref={ref}
      className={cn(blurClass, saturateClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});

BackdropEffect.displayName = 'BackdropEffect';

// Animation Effect Component
export const AnimationEffect = forwardRef(({ 
  children, 
  animation = 'float', 
  className, 
  ...props 
}, ref) => {
  const animationClasses = {
    shimmer: 'animate-shimmer',
    'glow-pulse': 'animate-glow-pulse',
    'gradient-shift': 'animate-gradient-shift',
    float: 'animate-float',
    breathe: 'animate-breathe',
  };

  return (
    <div
      ref={ref}
      className={cn(animationClasses[animation], className)}
      {...props}
    >
      {children}
    </div>
  );
});

AnimationEffect.displayName = 'AnimationEffect';

// Utility function to combine multiple effects
export const combineEffects = (...effects) => {
  return cn(...effects);
};

// Default export for convenience
const VisualEffectsComponents = {
  ShadowEffect,
  GlassEffect,
  GradientEffect,
  TextureEffect,
  Divider,
  PremiumCard,
  PremiumButton,
  PremiumModal,
  PremiumNavigation,
  PremiumHero,
  BackdropEffect,
  AnimationEffect,
  combineEffects,
};

export default VisualEffectsComponents;