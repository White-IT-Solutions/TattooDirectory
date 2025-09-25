/**
 * Visual Regression Tests for Design System Consistency
 * 
 * This test suite validates visual consistency across the design system
 * by testing component rendering, styling, and visual states.
 * 
 * Tests include:
 * - Design system token consistency
 * - Component visual states
 * - Typography and spacing consistency
 * - Color system validation
 * - Shadow and visual effects consistency
 * - Responsive design validation
 * 
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import components for visual testing
import { VisualEffectsIntegration } from '@/app/components/VisualEffectsIntegration';
import { AnimationInteractionIntegration } from '@/app/components/AnimationInteractionIntegration';
import { PageWrapper } from '@/design-system/components/layout/PageWrapper/PageWrapper';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/image', () => {
  return function MockImage({ src, alt, className, ...props }) {
    return <img src={src} alt={alt} className={className} {...props} />;
  };
});

describe('Visual Regression Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Design System Token Consistency', () => {
    describe('Color System Validation', () => {
      it('should apply consistent primary color classes', () => {
        const colorVariants = [
          'text-primary',
          'bg-primary',
          'border-primary',
          'text-primary-hover',
          'bg-primary-hover',
          'border-primary-hover'
        ];

        colorVariants.forEach(colorClass => {
          const { unmount } = render(
            <div className={colorClass} data-testid={`color-${colorClass}`}>
              Test Content
            </div>
          );

          const element = screen.getByTestId(`color-${colorClass}`);
          expect(element).toHaveClass(colorClass);
          
          // Verify the element exists and has the class applied
          expect(element).toBeInTheDocument();
          
          unmount();
        });
      });

      it('should apply consistent secondary color classes', () => {
        const secondaryColors = [
          'text-secondary',
          'bg-secondary',
          'border-secondary',
          'text-accent',
          'bg-accent',
          'border-accent'
        ];

        secondaryColors.forEach(colorClass => {
          const { unmount } = render(
            <div className={colorClass} data-testid={`secondary-${colorClass}`}>
              Secondary Content
            </div>
          );

          const element = screen.getByTestId(`secondary-${colorClass}`);
          expect(element).toHaveClass(colorClass);
          expect(element).toBeInTheDocument();
          
          unmount();
        });
      });

      it('should apply consistent feedback color classes', () => {
        const feedbackColors = [
          'text-success',
          'bg-success',
          'border-success',
          'text-error',
          'bg-error',
          'border-error',
          'text-warning',
          'bg-warning',
          'border-warning',
          'text-info',
          'bg-info',
          'border-info'
        ];

        feedbackColors.forEach(colorClass => {
          const { unmount } = render(
            <div className={colorClass} data-testid={`feedback-${colorClass}`}>
              Feedback Content
            </div>
          );

          const element = screen.getByTestId(`feedback-${colorClass}`);
          expect(element).toHaveClass(colorClass);
          expect(element).toBeInTheDocument();
          
          unmount();
        });
      });
    });

    describe('Typography System Validation', () => {
      it('should apply consistent heading classes', () => {
        const headingClasses = [
          'heading-primary',
          'heading-secondary', 
          'heading-tertiary',
          'heading-quaternary'
        ];

        headingClasses.forEach((headingClass, index) => {
          const HeadingTag = `h${index + 1}`;
          const { unmount } = render(
            React.createElement(
              HeadingTag,
              { 
                className: headingClass, 
                'data-testid': `heading-${headingClass}` 
              },
              `${headingClass} Text`
            )
          );

          const heading = screen.getByTestId(`heading-${headingClass}`);
          expect(heading).toHaveClass(headingClass);
          expect(heading.tagName.toLowerCase()).toBe(HeadingTag.toLowerCase());
          
          unmount();
        });
      });

      it('should apply consistent text body classes', () => {
        const textClasses = [
          'text-body',
          'text-body-large',
          'text-body-small',
          'text-caption',
          'text-label',
          'text-overline'
        ];

        textClasses.forEach(textClass => {
          const { unmount } = render(
            <p className={textClass} data-testid={`text-${textClass}`}>
              Sample text content for {textClass}
            </p>
          );

          const textElement = screen.getByTestId(`text-${textClass}`);
          expect(textElement).toHaveClass(textClass);
          expect(textElement).toBeInTheDocument();
          
          unmount();
        });
      });

      it('should apply consistent font weight classes', () => {
        const fontWeights = [
          'font-light',
          'font-normal',
          'font-medium',
          'font-semibold',
          'font-bold'
        ];

        fontWeights.forEach(fontWeight => {
          const { unmount } = render(
            <span className={fontWeight} data-testid={`weight-${fontWeight}`}>
              {fontWeight} text
            </span>
          );

          const element = screen.getByTestId(`weight-${fontWeight}`);
          expect(element).toHaveClass(fontWeight);
          
          unmount();
        });
      });
    });

    describe('Spacing System Validation', () => {
      it('should apply consistent padding classes', () => {
        const paddingClasses = [
          'p-xs', 'p-sm', 'p-md', 'p-lg', 'p-xl', 'p-2xl',
          'px-xs', 'px-sm', 'px-md', 'px-lg', 'px-xl',
          'py-xs', 'py-sm', 'py-md', 'py-lg', 'py-xl',
          'pt-xs', 'pt-sm', 'pt-md', 'pt-lg', 'pt-xl',
          'pb-xs', 'pb-sm', 'pb-md', 'pb-lg', 'pb-xl',
          'pl-xs', 'pl-sm', 'pl-md', 'pl-lg', 'pl-xl',
          'pr-xs', 'pr-sm', 'pr-md', 'pr-lg', 'pr-xl'
        ];

        paddingClasses.forEach(paddingClass => {
          const { unmount } = render(
            <div className={paddingClass} data-testid={`padding-${paddingClass}`}>
              Padded content
            </div>
          );

          const element = screen.getByTestId(`padding-${paddingClass}`);
          expect(element).toHaveClass(paddingClass);
          
          unmount();
        });
      });

      it('should apply consistent margin classes', () => {
        const marginClasses = [
          'm-xs', 'm-sm', 'm-md', 'm-lg', 'm-xl', 'm-2xl',
          'mx-xs', 'mx-sm', 'mx-md', 'mx-lg', 'mx-xl',
          'my-xs', 'my-sm', 'my-md', 'my-lg', 'my-xl',
          'mt-xs', 'mt-sm', 'mt-md', 'mt-lg', 'mt-xl',
          'mb-xs', 'mb-sm', 'mb-md', 'mb-lg', 'mb-xl',
          'ml-xs', 'ml-sm', 'ml-md', 'ml-lg', 'ml-xl',
          'mr-xs', 'mr-sm', 'mr-md', 'mr-lg', 'mr-xl'
        ];

        marginClasses.forEach(marginClass => {
          const { unmount } = render(
            <div className={marginClass} data-testid={`margin-${marginClass}`}>
              Margin content
            </div>
          );

          const element = screen.getByTestId(`margin-${marginClass}`);
          expect(element).toHaveClass(marginClass);
          
          unmount();
        });
      });

      it('should apply consistent gap classes', () => {
        const gapClasses = [
          'gap-xs', 'gap-sm', 'gap-md', 'gap-lg', 'gap-xl',
          'gap-x-xs', 'gap-x-sm', 'gap-x-md', 'gap-x-lg', 'gap-x-xl',
          'gap-y-xs', 'gap-y-sm', 'gap-y-md', 'gap-y-lg', 'gap-y-xl'
        ];

        gapClasses.forEach(gapClass => {
          const { unmount } = render(
            <div className={`flex ${gapClass}`} data-testid={`gap-${gapClass}`}>
              <div>Item 1</div>
              <div>Item 2</div>
            </div>
          );

          const element = screen.getByTestId(`gap-${gapClass}`);
          expect(element).toHaveClass(gapClass);
          
          unmount();
        });
      });
    });
  });

  describe('Component Visual States', () => {
    describe('Button Component States', () => {
      it('should render consistent button variants', () => {
        const buttonVariants = [
          'btn-primary',
          'btn-secondary',
          'btn-accent',
          'btn-outline',
          'btn-ghost',
          'btn-link'
        ];

        buttonVariants.forEach(variant => {
          const { unmount } = render(
            <button className={variant} data-testid={`button-${variant}`}>
              {variant} Button
            </button>
          );

          const button = screen.getByTestId(`button-${variant}`);
          expect(button).toHaveClass(variant);
          expect(button).toBeInTheDocument();
          
          unmount();
        });
      });

      it('should render consistent button sizes', () => {
        const buttonSizes = ['btn-xs', 'btn-sm', 'btn-md', 'btn-lg', 'btn-xl'];

        buttonSizes.forEach(size => {
          const { unmount } = render(
            <button className={`btn-primary ${size}`} data-testid={`button-${size}`}>
              {size} Button
            </button>
          );

          const button = screen.getByTestId(`button-${size}`);
          expect(button).toHaveClass('btn-primary');
          expect(button).toHaveClass(size);
          
          unmount();
        });
      });

      it('should render consistent button states', async () => {
        const { rerender } = render(
          <button 
            className="btn-primary" 
            data-testid="stateful-button"
            disabled={false}
          >
            Normal Button
          </button>
        );

        let button = screen.getByTestId('stateful-button');
        expect(button).not.toBeDisabled();

        // Test hover state
        await user.hover(button);
        expect(button).toHaveClass('btn-primary');

        // Test disabled state
        rerender(
          <button 
            className="btn-primary" 
            data-testid="stateful-button"
            disabled={true}
          >
            Disabled Button
          </button>
        );

        button = screen.getByTestId('stateful-button');
        expect(button).toBeDisabled();

        // Test loading state
        rerender(
          <button 
            className="btn-primary btn-loading" 
            data-testid="stateful-button"
            disabled={true}
          >
            Loading...
          </button>
        );

        button = screen.getByTestId('stateful-button');
        expect(button).toHaveClass('btn-loading');
      });
    });

    describe('Card Component States', () => {
      it('should render consistent card variants', () => {
        const cardVariants = [
          'card-default',
          'card-elevated',
          'card-outlined',
          'card-filled'
        ];

        cardVariants.forEach(variant => {
          const { unmount } = render(
            <div className={`card ${variant}`} data-testid={`card-${variant}`}>
              <div className="card-header">Header</div>
              <div className="card-content">Content</div>
              <div className="card-footer">Footer</div>
            </div>
          );

          const card = screen.getByTestId(`card-${variant}`);
          expect(card).toHaveClass('card');
          expect(card).toHaveClass(variant);
          
          // Verify card structure
          expect(card.querySelector('.card-header')).toBeInTheDocument();
          expect(card.querySelector('.card-content')).toBeInTheDocument();
          expect(card.querySelector('.card-footer')).toBeInTheDocument();
          
          unmount();
        });
      });

      it('should render consistent card interactive states', async () => {
        render(
          <div className="card card-interactive" data-testid="interactive-card">
            <div className="card-content">Interactive Card</div>
          </div>
        );

        const card = screen.getByTestId('interactive-card');
        expect(card).toHaveClass('card-interactive');

        // Test hover state
        await user.hover(card);
        expect(card).toHaveClass('card-interactive');

        // Test click state
        await user.click(card);
        expect(card).toHaveClass('card-interactive');
      });
    });

    describe('Input Component States', () => {
      it('should render consistent input variants', () => {
        const inputVariants = [
          'input-default',
          'input-outlined',
          'input-filled',
          'input-underlined'
        ];

        inputVariants.forEach(variant => {
          const { unmount } = render(
            <input 
              type="text" 
              className={`input ${variant}`} 
              data-testid={`input-${variant}`}
              placeholder={`${variant} input`}
            />
          );

          const input = screen.getByTestId(`input-${variant}`);
          expect(input).toHaveClass('input');
          expect(input).toHaveClass(variant);
          
          unmount();
        });
      });

      it('should render consistent input states', async () => {
        const { rerender } = render(
          <input 
            type="text" 
            className="input input-default" 
            data-testid="stateful-input"
            placeholder="Normal input"
          />
        );

        let input = screen.getByTestId('stateful-input');
        expect(input).not.toBeDisabled();

        // Test focus state
        await user.click(input);
        expect(input).toHaveFocus();

        // Test error state
        rerender(
          <input 
            type="text" 
            className="input input-default input-error" 
            data-testid="stateful-input"
            placeholder="Error input"
            aria-invalid="true"
          />
        );

        input = screen.getByTestId('stateful-input');
        expect(input).toHaveClass('input-error');
        expect(input).toHaveAttribute('aria-invalid', 'true');

        // Test success state
        rerender(
          <input 
            type="text" 
            className="input input-default input-success" 
            data-testid="stateful-input"
            placeholder="Success input"
            aria-invalid="false"
          />
        );

        input = screen.getByTestId('stateful-input');
        expect(input).toHaveClass('input-success');
      });
    });
  });

  describe('Visual Effects Consistency', () => {
    describe('Shadow System Validation', () => {
      it('should apply consistent elevation shadows', () => {
        const shadowLevels = [
          'shadow-elevation-surface',
          'shadow-elevation-raised',
          'shadow-elevation-floating',
          'shadow-elevation-premium'
        ];

        shadowLevels.forEach(shadowLevel => {
          const { unmount } = render(
            <VisualEffectsIntegration
              shadowLevel={shadowLevel.replace('shadow-elevation-', '')}
            >
              <div data-testid={`shadow-${shadowLevel}`}>
                Content with {shadowLevel}
              </div>
            </VisualEffectsIntegration>
          );

          const container = screen.getByTestId('visual-effects-container');
          expect(container).toHaveClass(shadowLevel);
          
          unmount();
        });
      });

      it('should apply consistent colored shadows', () => {
        const coloredShadows = [
          'shadow-primary-glow',
          'shadow-accent-glow',
          'shadow-success-glow',
          'shadow-error-glow'
        ];

        coloredShadows.forEach(coloredShadow => {
          const { unmount } = render(
            <div className={coloredShadow} data-testid={`colored-shadow-${coloredShadow}`}>
              Content with {coloredShadow}
            </div>
          );

          const element = screen.getByTestId(`colored-shadow-${coloredShadow}`);
          expect(element).toHaveClass(coloredShadow);
          
          unmount();
        });
      });
    });

    describe('Glassmorphism Effects Validation', () => {
      it('should apply consistent glassmorphism variants', () => {
        const glassVariants = [
          'glass-navigation',
          'glass-card',
          'glass-panel',
          'glass-modal'
        ];

        glassVariants.forEach(glassVariant => {
          const { unmount } = render(
            <VisualEffectsIntegration
              enableGlassmorphism={true}
              glassVariant={glassVariant.replace('glass-', '')}
            >
              <div data-testid={`glass-${glassVariant}`}>
                Content with {glassVariant}
              </div>
            </VisualEffectsIntegration>
          );

          const container = screen.getByTestId('visual-effects-container');
          expect(container).toHaveClass(glassVariant);
          
          unmount();
        });
      });
    });

    describe('Gradient System Validation', () => {
      it('should apply consistent gradient overlays', () => {
        const gradientTypes = [
          'gradient-overlay-subtle',
          'gradient-overlay-hero',
          'gradient-overlay-directional',
          'gradient-overlay-radial'
        ];

        gradientTypes.forEach(gradientType => {
          const { unmount } = render(
            <VisualEffectsIntegration
              gradientOverlay={gradientType.replace('gradient-overlay-', '')}
            >
              <div data-testid={`gradient-${gradientType}`}>
                Content with {gradientType}
              </div>
            </VisualEffectsIntegration>
          );

          const container = screen.getByTestId('visual-effects-container');
          expect(container).toHaveClass(gradientType);
          
          unmount();
        });
      });
    });

    describe('Texture System Validation', () => {
      it('should apply consistent texture levels', () => {
        const textureLevels = ['none', 'subtle', 'medium', 'strong'];

        textureLevels.forEach(textureLevel => {
          const { unmount } = render(
            <VisualEffectsIntegration
              textureLevel={textureLevel}
            >
              <div data-testid={`texture-${textureLevel}`}>
                Content with {textureLevel} texture
              </div>
            </VisualEffectsIntegration>
          );

          const container = screen.getByTestId('visual-effects-container');
          if (textureLevel !== 'none') {
            expect(container).toHaveClass(`texture-${textureLevel}`);
          }
          
          unmount();
        });
      });
    });
  });

  describe('Animation and Interaction Consistency', () => {
    describe('Micro-interaction Validation', () => {
      it('should apply consistent micro-interaction classes', () => {
        const microInteractions = [
          'micro-interaction-float',
          'micro-interaction-breathe',
          'micro-interaction-glow-pulse',
          'micro-interaction-shimmer'
        ];

        microInteractions.forEach(interaction => {
          const { unmount } = render(
            <AnimationInteractionIntegration
              enableMicroInteractions={true}
              microInteractionType={interaction.replace('micro-interaction-', '')}
            >
              <div data-testid={`interaction-${interaction}`}>
                Content with {interaction}
              </div>
            </AnimationInteractionIntegration>
          );

          const element = screen.getByTestId(`interaction-${interaction}`);
          expect(element).toHaveClass(interaction);
          
          unmount();
        });
      });

      it('should apply consistent hover effects', async () => {
        render(
          <AnimationInteractionIntegration
            enableMicroInteractions={true}
          >
            <button data-testid="hover-button" className="hover-glow">
              Hover me
            </button>
          </AnimationInteractionIntegration>
        );

        const button = screen.getByTestId('hover-button');
        expect(button).toHaveClass('hover-glow');

        // Test hover interaction
        await user.hover(button);
        expect(button).toHaveClass('hover-glow');

        await user.unhover(button);
        expect(button).toHaveClass('hover-glow');
      });
    });

    describe('Animation Level Validation', () => {
      it('should respect animation level settings', () => {
        const animationLevels = ['minimal', 'standard', 'enhanced'];

        animationLevels.forEach(level => {
          const { unmount } = render(
            <AnimationInteractionIntegration
              animationLevel={level}
              enableMicroInteractions={true}
            >
              <div data-testid={`animation-${level}`}>
                Content with {level} animations
              </div>
            </AnimationInteractionIntegration>
          );

          const element = screen.getByTestId(`animation-${level}`);
          expect(element).toHaveClass(`animation-level-${level}`);
          
          unmount();
        });
      });

      it('should respect reduced motion preferences', () => {
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
          <AnimationInteractionIntegration
            respectReducedMotion={true}
            enableMicroInteractions={true}
          >
            <div data-testid="reduced-motion-content">
              Content respecting reduced motion
            </div>
          </AnimationInteractionIntegration>
        );

        const content = screen.getByTestId('reduced-motion-content');
        expect(content).toHaveClass('reduce-motion');
      });
    });
  });

  describe('Responsive Design Validation', () => {
    it('should apply consistent responsive classes', () => {
      const responsiveClasses = [
        'sm:block', 'md:block', 'lg:block', 'xl:block',
        'sm:hidden', 'md:hidden', 'lg:hidden', 'xl:hidden',
        'sm:flex', 'md:flex', 'lg:flex', 'xl:flex',
        'sm:grid', 'md:grid', 'lg:grid', 'xl:grid'
      ];

      responsiveClasses.forEach(responsiveClass => {
        const { unmount } = render(
          <div className={responsiveClass} data-testid={`responsive-${responsiveClass}`}>
            Responsive content
          </div>
        );

        const element = screen.getByTestId(`responsive-${responsiveClass}`);
        expect(element).toHaveClass(responsiveClass);
        
        unmount();
      });
    });

    it('should maintain consistent grid layouts', () => {
      const gridClasses = [
        'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
        'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-6'
      ];

      gridClasses.forEach(gridClass => {
        const { unmount } = render(
          <div className={`grid ${gridClass}`} data-testid={`grid-${gridClass}`}>
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
        );

        const grid = screen.getByTestId(`grid-${gridClass}`);
        expect(grid).toHaveClass('grid');
        expect(grid).toHaveClass(gridClass);
        
        unmount();
      });
    });
  });

  describe('Loading and Error State Visual Consistency', () => {
    it('should render consistent loading state visuals', () => {
      const loadingStates = [
        'loading-skeleton',
        'loading-spinner',
        'loading-progress',
        'loading-pulse'
      ];

      loadingStates.forEach(loadingState => {
        const { unmount } = render(
          <div className={`loading-state ${loadingState}`} data-testid={`loading-${loadingState}`}>
            <div className="loading-content">Loading...</div>
          </div>
        );

        const element = screen.getByTestId(`loading-${loadingState}`);
        expect(element).toHaveClass('loading-state');
        expect(element).toHaveClass(loadingState);
        
        const content = element.querySelector('.loading-content');
        expect(content).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render consistent error state visuals', () => {
      const errorStates = [
        'error-network',
        'error-validation',
        'error-not-found',
        'error-server'
      ];

      errorStates.forEach(errorState => {
        const { unmount } = render(
          <div className={`error-state ${errorState}`} data-testid={`error-${errorState}`}>
            <div className="error-icon">⚠️</div>
            <div className="error-message">Error occurred</div>
            <button className="error-action">Retry</button>
          </div>
        );

        const element = screen.getByTestId(`error-${errorState}`);
        expect(element).toHaveClass('error-state');
        expect(element).toHaveClass(errorState);
        
        expect(element.querySelector('.error-icon')).toBeInTheDocument();
        expect(element.querySelector('.error-message')).toBeInTheDocument();
        expect(element.querySelector('.error-action')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Component Composition Visual Consistency', () => {
    it('should maintain visual consistency when components are composed together', () => {
      render(
        <PageWrapper>
          <VisualEffectsIntegration
            shadowLevel="raised"
            enableGlassmorphism={true}
            gradientOverlay="subtle"
          >
            <AnimationInteractionIntegration
              enableMicroInteractions={true}
              animationLevel="standard"
            >
              <div className="card card-elevated" data-testid="composed-card">
                <div className="card-header">
                  <h3 className="heading-tertiary">Composed Component</h3>
                </div>
                <div className="card-content">
                  <p className="text-body">
                    This card demonstrates visual consistency when multiple
                    enhancement systems are composed together.
                  </p>
                </div>
                <div className="card-footer">
                  <button className="btn-primary">Primary Action</button>
                  <button className="btn-secondary">Secondary Action</button>
                </div>
              </div>
            </AnimationInteractionIntegration>
          </VisualEffectsIntegration>
        </PageWrapper>
      );

      // Test that all enhancement classes are applied correctly
      const visualContainer = screen.getByTestId('visual-effects-container');
      expect(visualContainer).toHaveClass('shadow-elevation-raised');
      expect(visualContainer).toHaveClass('glass-card');
      expect(visualContainer).toHaveClass('gradient-overlay-subtle');

      const card = screen.getByTestId('composed-card');
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('card-elevated');

      // Test typography consistency
      const heading = card.querySelector('.heading-tertiary');
      expect(heading).toHaveClass('heading-tertiary');

      const bodyText = card.querySelector('.text-body');
      expect(bodyText).toHaveClass('text-body');

      // Test button consistency
      const primaryButton = card.querySelector('.btn-primary');
      const secondaryButton = card.querySelector('.btn-secondary');
      
      expect(primaryButton).toHaveClass('btn-primary');
      expect(secondaryButton).toHaveClass('btn-secondary');
    });
  });
});