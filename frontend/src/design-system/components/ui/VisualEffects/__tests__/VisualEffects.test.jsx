import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
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
  combineEffects,
} from '../VisualEffects';

describe('Visual Effects Components', () => {
  describe('ShadowEffect', () => {
    it('renders with default surface elevation', () => {
      render(
        <ShadowEffect data-testid="shadow-effect">
          <div>Content</div>
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('shadow-effect');
      expect(element).toHaveClass('shadow-elevation-surface');
      expect(element).toHaveTextContent('Content');
    });

    it('applies different elevation levels', () => {
      const { rerender } = render(
        <ShadowEffect elevation="raised" data-testid="shadow-effect">
          Content
        </ShadowEffect>
      );
      
      expect(screen.getByTestId('shadow-effect')).toHaveClass('shadow-elevation-raised');
      
      rerender(
        <ShadowEffect elevation="floating" data-testid="shadow-effect">
          Content
        </ShadowEffect>
      );
      
      expect(screen.getByTestId('shadow-effect')).toHaveClass('shadow-elevation-floating');
    });

    it('applies colored shadows', () => {
      render(
        <ShadowEffect color="primary" data-testid="shadow-effect">
          Content
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('shadow-effect');
      expect(element).toHaveClass('shadow-primary-glow');
    });

    it('combines custom className with shadow classes', () => {
      render(
        <ShadowEffect className="custom-class" data-testid="shadow-effect">
          Content
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('shadow-effect');
      expect(element).toHaveClass('shadow-elevation-surface');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('GlassEffect', () => {
    it('renders with default card variant', () => {
      render(
        <GlassEffect data-testid="glass-effect">
          <div>Glass Content</div>
        </GlassEffect>
      );
      
      const element = screen.getByTestId('glass-effect');
      expect(element).toHaveClass('glass-card');
      expect(element).toHaveTextContent('Glass Content');
    });

    it('applies different glass variants', () => {
      const variants = ['navigation', 'modal', 'panel'];
      
      variants.forEach(variant => {
        render(
          <GlassEffect variant={variant} data-testid={`glass-${variant}`}>
            Content
          </GlassEffect>
        );
        
        expect(screen.getByTestId(`glass-${variant}`)).toHaveClass(`glass-${variant}`);
      });
    });
  });

  describe('GradientEffect', () => {
    it('renders with default primary-subtle variant', () => {
      render(
        <GradientEffect data-testid="gradient-effect">
          <div>Gradient Content</div>
        </GradientEffect>
      );
      
      const element = screen.getByTestId('gradient-effect');
      expect(element).toHaveClass('gradient-primary-subtle');
      expect(element).toHaveTextContent('Gradient Content');
    });

    it('applies different gradient variants', () => {
      const variants = [
        'accent-subtle',
        'hero-primary',
        'top-primary',
        'radial-accent'
      ];
      
      variants.forEach(variant => {
        render(
          <GradientEffect variant={variant} data-testid={`gradient-${variant}`}>
            Content
          </GradientEffect>
        );
        
        expect(screen.getByTestId(`gradient-${variant}`)).toHaveClass(`gradient-${variant}`);
      });
    });

    it('applies overlay gradients', () => {
      render(
        <GradientEffect variant="primary-subtle" overlay data-testid="gradient-overlay">
          Content
        </GradientEffect>
      );
      
      expect(screen.getByTestId('gradient-overlay')).toHaveClass('gradient-primary-overlay');
    });
  });

  describe('TextureEffect', () => {
    it('renders with default noise-subtle variant', () => {
      render(
        <TextureEffect data-testid="texture-effect">
          <div>Texture Content</div>
        </TextureEffect>
      );
      
      const element = screen.getByTestId('texture-effect');
      expect(element).toHaveClass('texture-noise-subtle');
      expect(element).toHaveTextContent('Texture Content');
    });

    it('applies different texture variants', () => {
      const variants = ['noise-medium', 'paper-subtle', 'fabric-subtle'];
      
      variants.forEach(variant => {
        render(
          <TextureEffect variant={variant} data-testid={`texture-${variant}`}>
            Content
          </TextureEffect>
        );
        
        expect(screen.getByTestId(`texture-${variant}`)).toHaveClass(`texture-${variant}`);
      });
    });

    it('applies texture overlay', () => {
      render(
        <TextureEffect overlay data-testid="texture-overlay">
          Content
        </TextureEffect>
      );
      
      expect(screen.getByTestId('texture-overlay')).toHaveClass('texture-noise-overlay');
    });
  });

  describe('Divider', () => {
    it('renders horizontal divider with default gradient-primary variant', () => {
      render(<Divider data-testid="divider" />);
      
      const element = screen.getByTestId('divider');
      expect(element.tagName).toBe('HR');
      expect(element).toHaveClass('divider-gradient-primary');
    });

    it('applies different divider variants', () => {
      const variants = [
        'gradient-accent',
        'dots-primary',
        'dashed-accent',
        'section-primary'
      ];
      
      variants.forEach(variant => {
        render(<Divider variant={variant} data-testid={`divider-${variant}`} />);
        expect(screen.getByTestId(`divider-${variant}`)).toHaveClass(`divider-${variant}`);
      });
    });

    it('renders vertical dividers', () => {
      render(<Divider orientation="vertical" variant="gradient-primary" data-testid="vertical-divider" />);
      
      expect(screen.getByTestId('vertical-divider')).toHaveClass('divider-gradient-vertical-primary');
    });
  });

  describe('Premium Components', () => {
    it('renders PremiumCard with premium styling', () => {
      render(
        <PremiumCard data-testid="premium-card">
          Premium Content
        </PremiumCard>
      );
      
      const element = screen.getByTestId('premium-card');
      expect(element).toHaveClass('premium-card');
      expect(element).toHaveTextContent('Premium Content');
    });

    it('renders PremiumButton with premium styling', () => {
      render(
        <PremiumButton data-testid="premium-button">
          Premium Button
        </PremiumButton>
      );
      
      const element = screen.getByTestId('premium-button');
      expect(element.tagName).toBe('BUTTON');
      expect(element).toHaveClass('premium-button');
      expect(element).toHaveTextContent('Premium Button');
    });

    it('renders PremiumModal with premium styling', () => {
      render(
        <PremiumModal data-testid="premium-modal">
          Modal Content
        </PremiumModal>
      );
      
      const element = screen.getByTestId('premium-modal');
      expect(element).toHaveClass('premium-modal');
      expect(element).toHaveTextContent('Modal Content');
    });

    it('renders PremiumNavigation with premium styling', () => {
      render(
        <PremiumNavigation data-testid="premium-nav">
          Navigation Content
        </PremiumNavigation>
      );
      
      const element = screen.getByTestId('premium-nav');
      expect(element.tagName).toBe('NAV');
      expect(element).toHaveClass('premium-navigation');
      expect(element).toHaveTextContent('Navigation Content');
    });

    it('renders PremiumHero with premium styling', () => {
      render(
        <PremiumHero data-testid="premium-hero">
          Hero Content
        </PremiumHero>
      );
      
      const element = screen.getByTestId('premium-hero');
      expect(element.tagName).toBe('SECTION');
      expect(element).toHaveClass('premium-hero');
      expect(element).toHaveTextContent('Hero Content');
    });
  });

  describe('BackdropEffect', () => {
    it('renders with default medium blur', () => {
      render(
        <BackdropEffect data-testid="backdrop-effect">
          Backdrop Content
        </BackdropEffect>
      );
      
      const element = screen.getByTestId('backdrop-effect');
      expect(element).toHaveClass('backdrop-blur-medium');
      expect(element).toHaveTextContent('Backdrop Content');
    });

    it('applies different blur levels', () => {
      const blurLevels = ['subtle', 'strong', 'intense'];
      
      blurLevels.forEach(blur => {
        render(
          <BackdropEffect blur={blur} data-testid={`backdrop-${blur}`}>
            Content
          </BackdropEffect>
        );
        
        expect(screen.getByTestId(`backdrop-${blur}`)).toHaveClass(`backdrop-blur-${blur}`);
      });
    });

    it('applies saturation effects', () => {
      render(
        <BackdropEffect saturate="strong" data-testid="backdrop-saturate">
          Content
        </BackdropEffect>
      );
      
      const element = screen.getByTestId('backdrop-saturate');
      expect(element).toHaveClass('backdrop-blur-medium');
      expect(element).toHaveClass('backdrop-saturate-strong');
    });
  });

  describe('AnimationEffect', () => {
    it('renders with default float animation', () => {
      render(
        <AnimationEffect data-testid="animation-effect">
          Animated Content
        </AnimationEffect>
      );
      
      const element = screen.getByTestId('animation-effect');
      expect(element).toHaveClass('animate-float');
      expect(element).toHaveTextContent('Animated Content');
    });

    it('applies different animations', () => {
      const animations = ['shimmer', 'glow-pulse', 'breathe', 'gradient-shift'];
      
      animations.forEach(animation => {
        render(
          <AnimationEffect animation={animation} data-testid={`animation-${animation}`}>
            Content
          </AnimationEffect>
        );
        
        expect(screen.getByTestId(`animation-${animation}`)).toHaveClass(`animate-${animation}`);
      });
    });
  });

  describe('Utility Functions', () => {
    it('combineEffects merges class names correctly', () => {
      const combined = combineEffects(
        'shadow-elevation-surface',
        'glass-card',
        'gradient-primary-subtle'
      );
      
      expect(combined).toContain('shadow-elevation-surface');
      expect(combined).toContain('glass-card');
      expect(combined).toContain('gradient-primary-subtle');
    });
  });

  describe('Accessibility', () => {
    it('preserves accessibility attributes', () => {
      render(
        <ShadowEffect 
          role="button" 
          aria-label="Shadow button"
          tabIndex={0}
          data-testid="accessible-shadow"
        >
          Accessible Content
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('accessible-shadow');
      expect(element).toHaveAttribute('role', 'button');
      expect(element).toHaveAttribute('aria-label', 'Shadow button');
      expect(element).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation for interactive elements', () => {
      render(
        <PremiumButton 
          onKeyDown={(e) => e.key === 'Enter' && e.target.click()}
          data-testid="keyboard-button"
        >
          Keyboard Accessible
        </PremiumButton>
      );
      
      const button = screen.getByTestId('keyboard-button');
      expect(button).toBeInTheDocument();
      // Button elements are naturally keyboard accessible
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Custom Props', () => {
    it('forwards custom props to underlying elements', () => {
      render(
        <ShadowEffect 
          data-custom="custom-value"
          id="custom-id"
          data-testid="custom-props"
        >
          Content
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('custom-props');
      expect(element).toHaveAttribute('data-custom', 'custom-value');
      expect(element).toHaveAttribute('id', 'custom-id');
    });

    it('handles event handlers correctly', () => {
      const handleClick = jest.fn();
      
      render(
        <PremiumButton onClick={handleClick} data-testid="clickable-button">
          Click Me
        </PremiumButton>
      );
      
      const button = screen.getByTestId('clickable-button');
      button.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains responsive classes when combined with effects', () => {
      render(
        <ShadowEffect className="md:shadow-lg lg:shadow-xl" data-testid="responsive-shadow">
          Responsive Content
        </ShadowEffect>
      );
      
      const element = screen.getByTestId('responsive-shadow');
      expect(element).toHaveClass('shadow-elevation-surface');
      expect(element).toHaveClass('md:shadow-lg');
      expect(element).toHaveClass('lg:shadow-xl');
    });
  });
});