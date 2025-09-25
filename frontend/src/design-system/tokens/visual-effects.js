/**
 * Advanced Visual Effects System
 * Sophisticated visual effects for premium UI polish
 * Includes shadows, glassmorphism, gradients, textures, and dividers
 */

export const visualEffects = {
  // ===== SOPHISTICATED SHADOW SYSTEM =====
  shadows: {
    // Multiple elevation levels with sophisticated layering
    elevation: {
      // Surface level (cards, buttons)
      surface: {
        rest: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        active: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      
      // Raised elements (dropdowns, tooltips)
      raised: {
        rest: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        hover: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      
      // Floating elements (modals, overlays)
      floating: {
        rest: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        hover: '0 35px 60px -12px rgb(0 0 0 / 0.3)',
      },
      
      // Premium elements (hero sections, featured content)
      premium: {
        rest: '0 32px 64px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(255 255 255 / 0.05)',
        hover: '0 40px 80px -12px rgb(0 0 0 / 0.3), 0 0 0 1px rgb(255 255 255 / 0.1)',
      },
    },
    
    // Colored shadows using brand colors
    colored: {
      primary: {
        subtle: '0 4px 6px -1px rgb(92 71 92 / 0.1), 0 2px 4px -2px rgb(92 71 92 / 0.1)',
        medium: '0 10px 15px -3px rgb(92 71 92 / 0.15), 0 4px 6px -4px rgb(92 71 92 / 0.1)',
        strong: '0 20px 25px -5px rgb(92 71 92 / 0.2), 0 8px 10px -6px rgb(92 71 92 / 0.15)',
        glow: '0 0 20px rgb(92 71 92 / 0.3), 0 0 40px rgb(92 71 92 / 0.1)',
      },
      
      accent: {
        subtle: '0 4px 6px -1px rgb(239 131 84 / 0.1), 0 2px 4px -2px rgb(239 131 84 / 0.1)',
        medium: '0 10px 15px -3px rgb(239 131 84 / 0.15), 0 4px 6px -4px rgb(239 131 84 / 0.1)',
        strong: '0 20px 25px -5px rgb(239 131 84 / 0.2), 0 8px 10px -6px rgb(239 131 84 / 0.15)',
        glow: '0 0 20px rgb(239 131 84 / 0.3), 0 0 40px rgb(239 131 84 / 0.1)',
      },
      
      success: {
        subtle: '0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1)',
        glow: '0 0 20px rgb(34 197 94 / 0.3)',
      },
      
      warning: {
        subtle: '0 4px 6px -1px rgb(245 158 11 / 0.1), 0 2px 4px -2px rgb(245 158 11 / 0.1)',
        glow: '0 0 20px rgb(245 158 11 / 0.3)',
      },
      
      error: {
        subtle: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)',
        glow: '0 0 20px rgb(239 68 68 / 0.3)',
      },
    },
    
    // Inner shadows for depth
    inner: {
      subtle: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
      strong: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.15)',
    },
  },
  
  // ===== GLASSMORPHISM EFFECTS =====
  glassmorphism: {
    // Navigation glassmorphism
    navigation: {
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    
    // Modal overlay glassmorphism
    modal: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    
    // Card glassmorphism (subtle)
    card: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(8px) saturate(120%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
    },
    
    // Sidebar/panel glassmorphism
    panel: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px) saturate(150%)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 6px 24px 0 rgba(31, 38, 135, 0.3)',
    },
    
    // Dark mode variants
    dark: {
      navigation: {
        background: 'rgba(74, 71, 77, 0.85)',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      
      modal: {
        background: 'rgba(74, 71, 77, 0.9)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
      },
      
      card: {
        background: 'rgba(91, 88, 95, 0.7)',
        backdropFilter: 'blur(8px) saturate(120%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  
  // ===== GRADIENT OVERLAYS =====
  gradients: {
    // Brand color gradients (10-15% opacity)
    brand: {
      primary: {
        subtle: 'linear-gradient(135deg, rgba(92, 71, 92, 0.1) 0%, rgba(92, 71, 92, 0.05) 100%)',
        medium: 'linear-gradient(135deg, rgba(92, 71, 92, 0.15) 0%, rgba(92, 71, 92, 0.08) 100%)',
        overlay: 'linear-gradient(135deg, rgba(92, 71, 92, 0.12) 0%, transparent 100%)',
      },
      
      accent: {
        subtle: 'linear-gradient(135deg, rgba(239, 131, 84, 0.1) 0%, rgba(239, 131, 84, 0.05) 100%)',
        medium: 'linear-gradient(135deg, rgba(239, 131, 84, 0.15) 0%, rgba(239, 131, 84, 0.08) 100%)',
        overlay: 'linear-gradient(135deg, rgba(239, 131, 84, 0.12) 0%, transparent 100%)',
      },
      
      neutral: {
        subtle: 'linear-gradient(135deg, rgba(91, 88, 95, 0.1) 0%, rgba(191, 192, 192, 0.05) 100%)',
        medium: 'linear-gradient(135deg, rgba(91, 88, 95, 0.15) 0%, rgba(191, 192, 192, 0.08) 100%)',
      },
    },
    
    // Directional gradients
    directional: {
      topToBottom: {
        primary: 'linear-gradient(180deg, rgba(92, 71, 92, 0.12) 0%, transparent 100%)',
        accent: 'linear-gradient(180deg, rgba(239, 131, 84, 0.12) 0%, transparent 100%)',
        neutral: 'linear-gradient(180deg, rgba(91, 88, 95, 0.1) 0%, transparent 100%)',
      },
      
      leftToRight: {
        primary: 'linear-gradient(90deg, rgba(92, 71, 92, 0.12) 0%, transparent 100%)',
        accent: 'linear-gradient(90deg, rgba(239, 131, 84, 0.12) 0%, transparent 100%)',
      },
      
      radial: {
        primary: 'radial-gradient(circle at center, rgba(92, 71, 92, 0.15) 0%, transparent 70%)',
        accent: 'radial-gradient(circle at center, rgba(239, 131, 84, 0.15) 0%, transparent 70%)',
      },
    },
    
    // Hero section gradients
    hero: {
      primary: 'linear-gradient(135deg, rgba(92, 71, 92, 0.15) 0%, rgba(239, 131, 84, 0.1) 50%, transparent 100%)',
      accent: 'linear-gradient(135deg, rgba(239, 131, 84, 0.15) 0%, rgba(92, 71, 92, 0.1) 50%, transparent 100%)',
      neutral: 'linear-gradient(135deg, rgba(248, 248, 248, 0.8) 0%, rgba(235, 235, 235, 0.4) 100%)',
    },
  },
  
  // ===== TEXTURE AND NOISE PATTERNS =====
  textures: {
    // Subtle noise patterns for depth
    noise: {
      subtle: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
      },
      
      medium: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
      },
    },
    
    // Paper texture for premium feel
    paper: {
      subtle: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='37' cy='37' r='1'/%3E%3Ccircle cx='23' cy='23' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
    },
    
    // Fabric texture for warmth
    fabric: {
      subtle: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.015' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
      },
    },
  },
  
  // ===== ELEGANT DIVIDERS AND SEPARATORS =====
  dividers: {
    // Gradient fade dividers
    gradientFade: {
      horizontal: {
        primary: {
          background: 'linear-gradient(90deg, transparent 0%, rgba(92, 71, 92, 0.3) 50%, transparent 100%)',
          height: '1px',
        },
        accent: {
          background: 'linear-gradient(90deg, transparent 0%, rgba(239, 131, 84, 0.3) 50%, transparent 100%)',
          height: '1px',
        },
        neutral: {
          background: 'linear-gradient(90deg, transparent 0%, rgba(191, 192, 192, 0.4) 50%, transparent 100%)',
          height: '1px',
        },
      },
      
      vertical: {
        primary: {
          background: 'linear-gradient(180deg, transparent 0%, rgba(92, 71, 92, 0.3) 50%, transparent 100%)',
          width: '1px',
        },
        accent: {
          background: 'linear-gradient(180deg, transparent 0%, rgba(239, 131, 84, 0.3) 50%, transparent 100%)',
          width: '1px',
        },
      },
    },
    
    // Decorative dividers
    decorative: {
      dots: {
        primary: {
          background: `radial-gradient(circle, rgba(92, 71, 92, 0.4) 1px, transparent 1px)`,
          backgroundSize: '8px 8px',
          height: '1px',
        },
        accent: {
          background: `radial-gradient(circle, rgba(239, 131, 84, 0.4) 1px, transparent 1px)`,
          backgroundSize: '8px 8px',
          height: '1px',
        },
      },
      
      dashed: {
        primary: {
          borderTop: '1px dashed rgba(92, 71, 92, 0.3)',
        },
        accent: {
          borderTop: '1px dashed rgba(239, 131, 84, 0.3)',
        },
      },
    },
    
    // Section dividers with icons
    section: {
      withIcon: {
        primary: {
          background: 'linear-gradient(90deg, rgba(92, 71, 92, 0.3) 0%, rgba(92, 71, 92, 0.3) 45%, transparent 50%, rgba(92, 71, 92, 0.3) 55%, rgba(92, 71, 92, 0.3) 100%)',
          height: '1px',
          position: 'relative',
        },
      },
    },
  },
  
  // ===== BACKDROP FILTERS =====
  backdrops: {
    blur: {
      subtle: 'blur(4px)',
      medium: 'blur(8px)',
      strong: 'blur(12px)',
      intense: 'blur(16px)',
    },
    
    saturate: {
      subtle: 'saturate(120%)',
      medium: 'saturate(150%)',
      strong: 'saturate(180%)',
    },
    
    combined: {
      glass: 'blur(12px) saturate(180%)',
      frosted: 'blur(8px) saturate(120%) brightness(110%)',
      premium: 'blur(16px) saturate(200%) contrast(110%)',
    },
  },
  
  // ===== BORDER EFFECTS =====
  borders: {
    // Gradient borders
    gradient: {
      primary: {
        background: 'linear-gradient(135deg, rgba(92, 71, 92, 0.3), rgba(92, 71, 92, 0.1))',
        padding: '1px',
      },
      accent: {
        background: 'linear-gradient(135deg, rgba(239, 131, 84, 0.3), rgba(239, 131, 84, 0.1))',
        padding: '1px',
      },
    },
    
    // Animated borders
    animated: {
      shimmer: {
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      },
    },
  },
};

// CSS Custom Properties for Visual Effects
export const visualEffectsCSSProperties = `
  /* Advanced Shadow System */
  --shadow-elevation-surface: ${visualEffects.shadows.elevation.surface.rest};
  --shadow-elevation-surface-hover: ${visualEffects.shadows.elevation.surface.hover};
  --shadow-elevation-raised: ${visualEffects.shadows.elevation.raised.rest};
  --shadow-elevation-floating: ${visualEffects.shadows.elevation.floating.rest};
  --shadow-elevation-premium: ${visualEffects.shadows.elevation.premium.rest};
  
  /* Colored Shadows */
  --shadow-primary-subtle: ${visualEffects.shadows.colored.primary.subtle};
  --shadow-primary-glow: ${visualEffects.shadows.colored.primary.glow};
  --shadow-accent-subtle: ${visualEffects.shadows.colored.accent.subtle};
  --shadow-accent-glow: ${visualEffects.shadows.colored.accent.glow};
  
  /* Glassmorphism */
  --glass-navigation-bg: ${visualEffects.glassmorphism.navigation.background};
  --glass-navigation-backdrop: ${visualEffects.glassmorphism.navigation.backdropFilter};
  --glass-modal-bg: ${visualEffects.glassmorphism.modal.background};
  --glass-modal-backdrop: ${visualEffects.glassmorphism.modal.backdropFilter};
  
  /* Gradients */
  --gradient-primary-subtle: ${visualEffects.gradients.brand.primary.subtle};
  --gradient-accent-subtle: ${visualEffects.gradients.brand.accent.subtle};
  --gradient-hero-primary: ${visualEffects.gradients.hero.primary};
  
  /* Textures */
  --texture-noise-subtle: ${visualEffects.textures.noise.subtle.backgroundImage};
  --texture-paper-subtle: ${visualEffects.textures.paper.subtle.backgroundImage};
  
  /* Dividers */
  --divider-gradient-primary: ${visualEffects.dividers.gradientFade.horizontal.primary.background};
  --divider-gradient-accent: ${visualEffects.dividers.gradientFade.horizontal.accent.background};
`;

// Utility classes for visual effects
export const visualEffectsClasses = {
  // Shadow utilities
  'shadow-elevation-surface': 'shadow-[var(--shadow-elevation-surface)]',
  'shadow-elevation-raised': 'shadow-[var(--shadow-elevation-raised)]',
  'shadow-elevation-floating': 'shadow-[var(--shadow-elevation-floating)]',
  'shadow-elevation-premium': 'shadow-[var(--shadow-elevation-premium)]',
  'shadow-primary-glow': 'shadow-[var(--shadow-primary-glow)]',
  'shadow-accent-glow': 'shadow-[var(--shadow-accent-glow)]',
  
  // Glassmorphism utilities
  'glass-navigation': 'bg-[var(--glass-navigation-bg)] backdrop-blur-[12px] backdrop-saturate-[180%]',
  'glass-modal': 'bg-[var(--glass-modal-bg)] backdrop-blur-[16px] backdrop-saturate-[180%]',
  'glass-card': 'bg-white/70 backdrop-blur-[8px] backdrop-saturate-[120%]',
  
  // Gradient utilities
  'gradient-primary-subtle': 'bg-gradient-to-br from-primary-500/10 to-primary-500/5',
  'gradient-accent-subtle': 'bg-gradient-to-br from-accent-500/10 to-accent-500/5',
  'gradient-hero': 'bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-transparent',
  
  // Texture utilities
  'texture-noise': 'relative before:absolute before:inset-0 before:bg-[var(--texture-noise-subtle)] before:pointer-events-none',
  'texture-paper': 'bg-[var(--texture-paper-subtle)]',
  
  // Border utilities
  'border-gradient-primary': 'border border-transparent bg-gradient-to-r from-primary-500/30 to-primary-500/10 bg-clip-border',
  'border-gradient-accent': 'border border-transparent bg-gradient-to-r from-accent-500/30 to-accent-500/10 bg-clip-border',
};

// Keyframes for animations
export const visualEffectsKeyframes = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes glow-pulse {
    0%, 100% { box-shadow: var(--shadow-primary-glow); }
    50% { box-shadow: var(--shadow-accent-glow); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export default visualEffects;