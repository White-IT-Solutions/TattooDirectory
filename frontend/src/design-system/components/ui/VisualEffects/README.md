# Advanced Visual Effects System

A comprehensive visual effects system that provides sophisticated UI polish for premium applications. This system includes shadows, glassmorphism, gradients, textures, elegant dividers, and premium component combinations.

## Features

- **Sophisticated Shadow System**: Multiple elevation levels with colored shadows
- **Glassmorphism Effects**: Modern glass-like blur effects for overlays and navigation
- **Gradient Overlays**: Subtle brand-colored gradients (10-15% opacity)
- **Texture Patterns**: Subtle noise and texture patterns for depth
- **Elegant Dividers**: Gradient fade dividers and decorative separators
- **Premium Components**: Pre-built combinations for high-end UI elements
- **Responsive Design**: Optimized for mobile performance
- **Accessibility**: Full support for reduced motion and high contrast preferences

## Installation

The visual effects system is automatically included when you import from the design system:

```javascript
import { 
  ShadowEffect, 
  GlassEffect, 
  GradientEffect,
  PremiumCard 
} from '@/design-system';
```

## Components

### ShadowEffect

Applies sophisticated shadow effects with multiple elevation levels and colored variants.

```jsx
import { ShadowEffect } from '@/design-system';

// Basic elevation shadows
<ShadowEffect elevation="surface">Basic card shadow</ShadowEffect>
<ShadowEffect elevation="raised">Dropdown shadow</ShadowEffect>
<ShadowEffect elevation="floating">Modal shadow</ShadowEffect>
<ShadowEffect elevation="premium">Hero section shadow</ShadowEffect>

// Colored shadows
<ShadowEffect color="primary">Primary brand glow</ShadowEffect>
<ShadowEffect color="accent">Coral accent glow</ShadowEffect>
<ShadowEffect color="success">Success state glow</ShadowEffect>
<ShadowEffect color="error">Error state glow</ShadowEffect>
```

**Props:**
- `elevation`: `'surface' | 'raised' | 'floating' | 'premium'` (default: `'surface'`)
- `color`: `'primary' | 'accent' | 'success' | 'warning' | 'error' | null` (default: `null`)
- `className`: Additional CSS classes
- All standard div props

### GlassEffect

Creates modern glassmorphism effects with backdrop blur and saturation.

```jsx
import { GlassEffect } from '@/design-system';

<GlassEffect variant="navigation">Glass navigation bar</GlassEffect>
<GlassEffect variant="modal">Glass modal overlay</GlassEffect>
<GlassEffect variant="card">Glass content card</GlassEffect>
<GlassEffect variant="panel">Glass sidebar panel</GlassEffect>
```

**Props:**
- `variant`: `'navigation' | 'modal' | 'card' | 'panel'` (default: `'card'`)
- `className`: Additional CSS classes
- All standard div props

### GradientEffect

Applies subtle gradient overlays using brand colors.

```jsx
import { GradientEffect } from '@/design-system';

// Brand gradients
<GradientEffect variant="primary-subtle">Subtle primary gradient</GradientEffect>
<GradientEffect variant="accent-medium">Medium accent gradient</GradientEffect>

// Hero section gradients
<GradientEffect variant="hero-primary">Hero primary blend</GradientEffect>
<GradientEffect variant="hero-accent">Hero accent blend</GradientEffect>

// Directional gradients
<GradientEffect variant="top-primary">Top fade gradient</GradientEffect>
<GradientEffect variant="radial-accent">Radial accent gradient</GradientEffect>

// Overlay gradients
<GradientEffect variant="primary-subtle" overlay>
  Content with gradient overlay
</GradientEffect>
```

**Props:**
- `variant`: Gradient variant (see examples above)
- `overlay`: `boolean` - Apply as overlay instead of background
- `className`: Additional CSS classes
- All standard div props

### TextureEffect

Adds subtle texture patterns for depth and premium feel.

```jsx
import { TextureEffect } from '@/design-system';

<TextureEffect variant="noise-subtle">Subtle noise texture</TextureEffect>
<TextureEffect variant="noise-medium">Medium noise texture</TextureEffect>
<TextureEffect variant="paper-subtle">Paper texture</TextureEffect>
<TextureEffect variant="fabric-subtle">Fabric texture</TextureEffect>

// Texture overlay
<TextureEffect overlay>
  Content with noise overlay
</TextureEffect>
```

**Props:**
- `variant`: `'noise-subtle' | 'noise-medium' | 'paper-subtle' | 'fabric-subtle'`
- `overlay`: `boolean` - Apply as overlay
- `className`: Additional CSS classes
- All standard div props

### Divider

Creates elegant dividers with gradient fades and decorative patterns.

```jsx
import { Divider } from '@/design-system';

// Gradient fade dividers
<Divider variant="gradient-primary" />
<Divider variant="gradient-accent" />
<Divider variant="gradient-neutral" />

// Decorative dividers
<Divider variant="dots-primary" />
<Divider variant="dashed-accent" />
<Divider variant="section-primary" />

// Vertical dividers
<Divider orientation="vertical" variant="gradient-primary" />
```

**Props:**
- `variant`: Divider style variant
- `orientation`: `'horizontal' | 'vertical'` (default: `'horizontal'`)
- `className`: Additional CSS classes
- All standard hr props

### Premium Components

Pre-built combinations of visual effects for high-end UI elements.

```jsx
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumModal,
  PremiumNavigation,
  PremiumHero 
} from '@/design-system';

// Premium card with multiple effects
<PremiumCard>
  <h3>Premium Content</h3>
  <p>Sophisticated visual effects combination</p>
</PremiumCard>

// Premium button with hover effects
<PremiumButton onClick={handleClick}>
  Premium Action
</PremiumButton>

// Premium modal with glassmorphism
<PremiumModal>
  <h2>Premium Modal</h2>
  <p>Enhanced modal with sophisticated effects</p>
</PremiumModal>

// Premium navigation with glass effect
<PremiumNavigation>
  <nav>Navigation content</nav>
</PremiumNavigation>

// Premium hero section
<PremiumHero>
  <h1>Hero Title</h1>
  <p>Hero description with premium effects</p>
</PremiumHero>
```

### BackdropEffect

Applies backdrop filters for blur and saturation effects.

```jsx
import { BackdropEffect } from '@/design-system';

<BackdropEffect blur="medium">Medium blur backdrop</BackdropEffect>
<BackdropEffect blur="strong" saturate="medium">
  Strong blur with saturation
</BackdropEffect>
```

**Props:**
- `blur`: `'subtle' | 'medium' | 'strong' | 'intense'` (default: `'medium'`)
- `saturate`: `'subtle' | 'medium' | 'strong' | null`
- `className`: Additional CSS classes
- All standard div props

### AnimationEffect

Adds sophisticated animations and micro-interactions.

```jsx
import { AnimationEffect } from '@/design-system';

<AnimationEffect animation="float">Floating animation</AnimationEffect>
<AnimationEffect animation="breathe">Breathing animation</AnimationEffect>
<AnimationEffect animation="glow-pulse">Glow pulse animation</AnimationEffect>
<AnimationEffect animation="shimmer">Shimmer animation</AnimationEffect>
```

**Props:**
- `animation`: `'float' | 'breathe' | 'glow-pulse' | 'shimmer' | 'gradient-shift'`
- `className`: Additional CSS classes
- All standard div props

## CSS Classes

You can also use the visual effects as CSS classes directly:

### Shadow Classes
```css
.shadow-elevation-surface     /* Basic card shadow */
.shadow-elevation-raised      /* Dropdown shadow */
.shadow-elevation-floating    /* Modal shadow */
.shadow-elevation-premium     /* Hero shadow */

.shadow-primary-glow          /* Primary brand glow */
.shadow-accent-glow           /* Accent glow */
.shadow-success-glow          /* Success glow */
```

### Glassmorphism Classes
```css
.glass-navigation             /* Navigation glass effect */
.glass-modal                  /* Modal glass effect */
.glass-card                   /* Card glass effect */
.glass-panel                  /* Panel glass effect */
```

### Gradient Classes
```css
.gradient-primary-subtle      /* Subtle primary gradient */
.gradient-accent-medium       /* Medium accent gradient */
.gradient-hero-primary        /* Hero primary blend */
.gradient-top-primary         /* Top fade gradient */
.gradient-radial-accent       /* Radial accent gradient */
```

### Texture Classes
```css
.texture-noise-subtle         /* Subtle noise texture */
.texture-paper-subtle         /* Paper texture */
.texture-noise-overlay        /* Noise overlay */
```

### Premium Classes
```css
.premium-card                 /* Premium card combination */
.premium-button               /* Premium button combination */
.premium-modal                /* Premium modal combination */
.premium-navigation           /* Premium navigation combination */
.premium-hero                 /* Premium hero combination */
```

## Usage Examples

### Artist Profile Card
```jsx
<PremiumCard className="max-w-sm">
  <div className="text-center p-6">
    <ShadowEffect elevation="surface" className="w-20 h-20 rounded-full mx-auto mb-4">
      <img src="/artist-avatar.jpg" alt="Artist" className="w-full h-full object-cover rounded-full" />
    </ShadowEffect>
    
    <h3 className="font-semibold text-lg mb-2">Artist Name</h3>
    <p className="text-neutral-600 mb-4">Specializing in Traditional & Realism</p>
    
    <Divider variant="gradient-primary" className="my-4" />
    
    <PremiumButton className="w-full">
      View Portfolio
    </PremiumButton>
  </div>
</PremiumCard>
```

### Hero Section
```jsx
<PremiumHero className="min-h-screen flex items-center justify-center text-center">
  <div className="max-w-4xl mx-auto px-6">
    <h1 className="text-5xl font-bold text-white mb-6">
      Find Your Perfect Tattoo Artist
    </h1>
    <p className="text-xl text-white/90 mb-8">
      Discover talented artists in your area with our comprehensive directory
    </p>
    <PremiumButton className="px-8 py-4 text-lg">
      Start Exploring
    </PremiumButton>
  </div>
</PremiumHero>
```

### Modal with Glassmorphism
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
  <PremiumModal className="relative z-10 max-w-md w-full">
    <h2 className="text-xl font-semibold mb-4">Contact Artist</h2>
    <p className="text-neutral-600 mb-6">
      Send a message to discuss your tattoo ideas.
    </p>
    <div className="flex gap-3">
      <PremiumButton className="flex-1">Send Message</PremiumButton>
      <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
        Cancel
      </button>
    </div>
  </PremiumModal>
</div>
```

## Performance Considerations

### Mobile Optimization
- Glassmorphism effects use reduced blur on mobile devices
- Texture overlays are disabled on mobile for better performance
- Animations respect `prefers-reduced-motion` settings

### Browser Support
- Backdrop filters include `-webkit-` prefixes for Safari support
- Graceful fallbacks for older browsers
- CSS custom properties with fallback values

## Accessibility

### Reduced Motion Support
All animations automatically disable when `prefers-reduced-motion: reduce` is set:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-breathe,
  .animate-glow-pulse {
    animation: none;
  }
}
```

### High Contrast Support
Visual effects adapt to high contrast mode:

```css
@media (prefers-contrast: high) {
  .glass-navigation,
  .glass-modal {
    background: var(--background-primary);
    backdrop-filter: none;
    border: 2px solid var(--border-primary);
  }
}
```

## Customization

### CSS Custom Properties
All effects use CSS custom properties that can be customized:

```css
:root {
  --shadow-primary-glow: 0 0 20px rgb(92 71 92 / 0.3);
  --glass-card-bg: rgba(255, 255, 255, 0.7);
  --gradient-primary-subtle: linear-gradient(135deg, rgba(92, 71, 92, 0.1) 0%, rgba(92, 71, 92, 0.05) 100%);
}
```

### Combining Effects
Use the `combineEffects` utility to merge multiple effect classes:

```jsx
import { combineEffects } from '@/design-system';

const combinedClasses = combineEffects(
  'shadow-elevation-surface',
  'glass-card',
  'gradient-primary-subtle',
  'texture-noise-overlay'
);

<div className={combinedClasses}>
  Multiple effects combined
</div>
```

## Best Practices

1. **Use Sparingly**: Visual effects should enhance, not overwhelm the content
2. **Performance First**: Test on mobile devices and slower connections
3. **Accessibility**: Always respect user preferences for motion and contrast
4. **Brand Consistency**: Use the predefined brand color variants
5. **Progressive Enhancement**: Ensure the UI works without effects as a fallback

## Browser Support

- **Modern Browsers**: Full support for all effects
- **Safari**: Includes `-webkit-` prefixes for backdrop filters
- **Older Browsers**: Graceful degradation with fallback styles
- **Mobile**: Optimized performance with reduced effects

## Demo

Visit `/visual-effects-demo` to see all effects in action with interactive examples and code snippets.