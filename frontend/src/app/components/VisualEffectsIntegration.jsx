"use client";

import React from 'react';
import { 
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
  combineEffects
} from '../../design-system/components/ui/VisualEffects';

/**
 * Visual Effects Integration Component
 * Provides sophisticated visual effects integration for main application pages
 * Implements elevation shadows, glassmorphism, gradients, textures, and premium polish
 */

// Enhanced Card Component with Visual Effects
export const EnhancedCard = ({ 
  children, 
  elevation = 'surface',
  glassmorphism = false,
  gradient = null,
  texture = null,
  premium = false,
  className = '',
  ...props 
}) => {
  if (premium) {
    return (
      <PremiumCard className={className} {...props}>
        {children}
      </PremiumCard>
    );
  }

  const CardWrapper = glassmorphism ? GlassEffect : ShadowEffect;
  const cardProps = glassmorphism 
    ? { variant: 'card', className }
    : { elevation, className };

  let content = (
    <CardWrapper {...cardProps} {...props}>
      {children}
    </CardWrapper>
  );

  // Apply gradient overlay if specified
  if (gradient) {
    content = (
      <GradientEffect variant={gradient} overlay>
        {content}
      </GradientEffect>
    );
  }

  // Apply texture overlay if specified
  if (texture) {
    content = (
      <TextureEffect variant={texture} overlay>
        {content}
      </TextureEffect>
    );
  }

  return content;
};

// Enhanced Button Component with Visual Effects
export const EnhancedButton = ({ 
  children, 
  variant = 'primary',
  elevation = 'surface',
  glow = false,
  premium = false,
  animation = null,
  className = '',
  ...props 
}) => {
  if (premium) {
    return (
      <PremiumButton className={className} {...props}>
        {children}
      </PremiumButton>
    );
  }

  const shadowColor = glow ? variant : null;
  const shadowElevation = glow ? 'raised' : elevation;

  let button = (
    <ShadowEffect 
      elevation={shadowElevation} 
      color={shadowColor}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </ShadowEffect>
  );

  // Apply animation if specified
  if (animation) {
    button = (
      <AnimationEffect animation={animation}>
        {button}
      </AnimationEffect>
    );
  }

  return button;
};

// Enhanced Navigation Component with Glassmorphism
export const EnhancedNavigation = ({ 
  children, 
  glassmorphism = true,
  premium = false,
  className = '',
  ...props 
}) => {
  if (premium) {
    return (
      <PremiumNavigation className={className} {...props}>
        {children}
      </PremiumNavigation>
    );
  }

  if (glassmorphism) {
    return (
      <GlassEffect variant="navigation" className={className} {...props}>
        {children}
      </GlassEffect>
    );
  }

  return (
    <ShadowEffect elevation="raised" className={className} {...props}>
      {children}
    </ShadowEffect>
  );
};

// Enhanced Modal Component with Glassmorphism
export const EnhancedModal = ({ 
  children, 
  glassmorphism = true,
  premium = false,
  className = '',
  ...props 
}) => {
  if (premium) {
    return (
      <PremiumModal className={className} {...props}>
        {children}
      </PremiumModal>
    );
  }

  if (glassmorphism) {
    return (
      <GlassEffect variant="modal" className={className} {...props}>
        {children}
      </GlassEffect>
    );
  }

  return (
    <ShadowEffect elevation="floating" className={className} {...props}>
      {children}
    </ShadowEffect>
  );
};

// Enhanced Hero Section Component
export const EnhancedHero = ({ 
  children, 
  gradient = 'hero-primary',
  texture = 'noise-subtle',
  premium = false,
  className = '',
  ...props 
}) => {
  if (premium) {
    return (
      <PremiumHero className={className} {...props}>
        {children}
      </PremiumHero>
    );
  }

  return (
    <GradientEffect variant={gradient} className={className} {...props}>
      <TextureEffect variant={texture} overlay>
        {children}
      </TextureEffect>
    </GradientEffect>
  );
};

// Enhanced Section Divider Component
export const EnhancedDivider = ({ 
  variant = 'gradient-primary',
  orientation = 'horizontal',
  decorative = false,
  className = '',
  ...props 
}) => {
  const dividerVariant = decorative 
    ? `section-${variant.split('-')[1] || 'primary'}`
    : variant;

  return (
    <Divider 
      variant={dividerVariant} 
      orientation={orientation}
      className={className}
      {...props}
    />
  );
};

// Enhanced Page Container with Visual Effects
export const EnhancedPageContainer = ({ 
  children, 
  gradient = null,
  texture = null,
  className = '',
  ...props 
}) => {
  let content = (
    <div className={`min-h-screen ${className}`} {...props}>
      {children}
    </div>
  );

  // Apply background gradient if specified
  if (gradient) {
    content = (
      <GradientEffect variant={gradient}>
        {content}
      </GradientEffect>
    );
  }

  // Apply background texture if specified
  if (texture) {
    content = (
      <TextureEffect variant={texture}>
        {content}
      </TextureEffect>
    );
  }

  return content;
};

// Enhanced Artist Card with Premium Visual Effects
export const EnhancedArtistCard = ({ 
  artist, 
  premium = false,
  glassmorphism = false,
  elevation = 'surface',
  className = '',
  ...props 
}) => {
  const cardProps = {
    elevation: premium ? 'premium' : elevation,
    glassmorphism,
    gradient: premium ? 'primary-subtle' : null,
    texture: premium ? 'noise-subtle' : null,
    premium,
    className: `p-6 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-2 ${className}`,
    ...props
  };

  return (
    <EnhancedCard {...cardProps}>
      <div className="space-y-4">
        {/* Artist Avatar with Shadow Effect */}
        <ShadowEffect elevation="raised" className="w-20 h-20 rounded-full mx-auto overflow-hidden">
          <img 
            src={artist.avatar || '/placeholder-avatar.jpg'} 
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        </ShadowEffect>

        {/* Artist Info */}
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">{artist.name}</h3>
          <p className="text-neutral-600 text-sm mb-3">{artist.studio}</p>
          
          {/* Styles with Enhanced Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {artist.styles?.slice(0, 3).map((style, index) => (
              <ShadowEffect key={index} elevation="surface" className="inline-block">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {style}
                </span>
              </ShadowEffect>
            ))}
          </div>

          {/* Enhanced Divider */}
          <EnhancedDivider variant="gradient-primary" className="my-4" />

          {/* Action Button */}
          <EnhancedButton 
            variant="primary" 
            glow={premium}
            premium={premium}
            className="w-full"
          >
            View Portfolio
          </EnhancedButton>
        </div>
      </div>
    </EnhancedCard>
  );
};

// Enhanced Studio Card with Premium Visual Effects
export const EnhancedStudioCard = ({ 
  studio, 
  premium = false,
  glassmorphism = false,
  elevation = 'surface',
  className = '',
  ...props 
}) => {
  const cardProps = {
    elevation: premium ? 'premium' : elevation,
    glassmorphism,
    gradient: premium ? 'accent-subtle' : null,
    texture: premium ? 'paper-subtle' : null,
    premium,
    className: `p-6 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-2 ${className}`,
    ...props
  };

  return (
    <EnhancedCard {...cardProps}>
      <div className="space-y-4">
        {/* Studio Image with Shadow Effect */}
        <ShadowEffect elevation="raised" className="w-full h-32 rounded-lg overflow-hidden">
          <img 
            src={studio.image || '/placeholder-studio.jpg'} 
            alt={studio.name}
            className="w-full h-full object-cover"
          />
        </ShadowEffect>

        {/* Studio Info */}
        <div>
          <h3 className="font-semibold text-lg mb-2">{studio.name}</h3>
          <p className="text-neutral-600 text-sm mb-3">{studio.location}</p>
          
          {/* Studio Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="font-semibold text-accent-500">{studio.artistCount || 0}</div>
              <div className="text-xs text-neutral-500">Artists</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-accent-500">★ {studio.rating || 'N/A'}</div>
              <div className="text-xs text-neutral-500">Rating</div>
            </div>
          </div>

          {/* Enhanced Divider */}
          <EnhancedDivider variant="gradient-accent" className="my-4" />

          {/* Action Button */}
          <EnhancedButton 
            variant="accent" 
            glow={premium}
            premium={premium}
            className="w-full"
          >
            View Studio
          </EnhancedButton>
        </div>
      </div>
    </EnhancedCard>
  );
};

// Enhanced Search Bar with Visual Effects
export const EnhancedSearchBar = ({ 
  placeholder = "Search artists, styles, or locations...",
  glassmorphism = false,
  elevation = 'surface',
  className = '',
  ...props 
}) => {
  const containerProps = glassmorphism 
    ? { variant: 'card', className: `p-4 rounded-xl ${className}` }
    : { elevation, className: `p-4 rounded-xl bg-white ${className}` };

  const Container = glassmorphism ? GlassEffect : ShadowEffect;

  return (
    <Container {...containerProps}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          {...props}
        />
        <ShadowEffect elevation="surface" className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <button className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </ShadowEffect>
      </div>
    </Container>
  );
};

// Enhanced Filter Panel with Visual Effects
export const EnhancedFilterPanel = ({ 
  children,
  glassmorphism = true,
  className = '',
  ...props 
}) => {
  const panelProps = glassmorphism 
    ? { variant: 'panel', className: `p-6 rounded-xl ${className}` }
    : { elevation: 'raised', className: `p-6 rounded-xl bg-white ${className}` };

  const Container = glassmorphism ? GlassEffect : ShadowEffect;

  return (
    <Container {...panelProps} {...props}>
      {children}
    </Container>
  );
};

// Enhanced Loading State with Visual Effects
export const EnhancedLoadingState = ({ 
  message = "Loading...",
  glassmorphism = false,
  className = ''
}) => {
  const containerProps = glassmorphism 
    ? { variant: 'card', className: `p-8 rounded-xl text-center ${className}` }
    : { elevation: 'surface', className: `p-8 rounded-xl bg-white text-center ${className}` };

  const Container = glassmorphism ? GlassEffect : ShadowEffect;

  return (
    <Container {...containerProps}>
      <AnimationEffect animation="breathe">
        <div className="w-12 h-12 bg-primary-500 rounded-full mx-auto mb-4"></div>
      </AnimationEffect>
      <p className="text-neutral-600">{message}</p>
    </Container>
  );
};

// Export all enhanced components
export {
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
  combineEffects
};

export default {
  EnhancedCard,
  EnhancedButton,
  EnhancedNavigation,
  EnhancedModal,
  EnhancedHero,
  EnhancedDivider,
  EnhancedPageContainer,
  EnhancedArtistCard,
  EnhancedStudioCard,
  EnhancedSearchBar,
  EnhancedFilterPanel,
  EnhancedLoadingState
};