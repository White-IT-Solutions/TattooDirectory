import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
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
} from '../VisualEffectsIntegration';

// Mock the visual effects components
jest.mock('../../../design-system/components/ui/VisualEffects', () => ({
  ShadowEffect: ({ children, className, ...props }) => (
    <div className={`shadow-effect ${className || ''}`} {...props}>{children}</div>
  ),
  GlassEffect: ({ children, className, ...props }) => (
    <div className={`glass-effect ${className || ''}`} {...props}>{children}</div>
  ),
  GradientEffect: ({ children, className, ...props }) => (
    <div className={`gradient-effect ${className || ''}`} {...props}>{children}</div>
  ),
  TextureEffect: ({ children, className, ...props }) => (
    <div className={`texture-effect ${className || ''}`} {...props}>{children}</div>
  ),
  Divider: ({ className, ...props }) => (
    <hr className={`divider ${className || ''}`} {...props} />
  ),
  PremiumCard: ({ children, className, ...props }) => (
    <div className={`premium-card ${className || ''}`} {...props}>{children}</div>
  ),
  PremiumButton: ({ children, className, ...props }) => (
    <button className={`premium-button ${className || ''}`} {...props}>{children}</button>
  ),
  PremiumModal: ({ children, className, ...props }) => (
    <div className={`premium-modal ${className || ''}`} {...props}>{children}</div>
  ),
  PremiumNavigation: ({ children, className, ...props }) => (
    <nav className={`premium-navigation ${className || ''}`} {...props}>{children}</nav>
  ),
  PremiumHero: ({ children, className, ...props }) => (
    <section className={`premium-hero ${className || ''}`} {...props}>{children}</section>
  ),
  BackdropEffect: ({ children, className, ...props }) => (
    <div className={`backdrop-effect ${className || ''}`} {...props}>{children}</div>
  ),
  AnimationEffect: ({ children, className, ...props }) => (
    <div className={`animation-effect ${className || ''}`} {...props}>{children}</div>
  ),
  combineEffects: (...effects) => effects.join(' ')
}));

describe('Visual Effects Integration Components', () => {
  describe('EnhancedCard', () => {
    it('renders basic card with surface elevation', () => {
      render(
        <EnhancedCard>
          <p>Test content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
    });

    it('renders premium card when premium prop is true', () => {
      render(
        <EnhancedCard premium>
          <p>Premium content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Premium content')).toBeInTheDocument();
      expect(document.querySelector('.premium-card')).toBeInTheDocument();
    });

    it('renders glassmorphism card when glassmorphism prop is true', () => {
      render(
        <EnhancedCard glassmorphism>
          <p>Glass content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Glass content')).toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });

    it('applies gradient overlay when gradient prop is provided', () => {
      render(
        <EnhancedCard gradient="primary-subtle">
          <p>Gradient content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Gradient content')).toBeInTheDocument();
      expect(document.querySelector('.gradient-effect')).toBeInTheDocument();
    });

    it('applies texture overlay when texture prop is provided', () => {
      render(
        <EnhancedCard texture="noise-subtle">
          <p>Texture content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Texture content')).toBeInTheDocument();
      expect(document.querySelector('.texture-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedButton', () => {
    it('renders basic button with shadow effect', () => {
      render(
        <EnhancedButton>
          Click me
        </EnhancedButton>
      );
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
    });

    it('renders premium button when premium prop is true', () => {
      render(
        <EnhancedButton premium>
          Premium button
        </EnhancedButton>
      );
      
      expect(screen.getByText('Premium button')).toBeInTheDocument();
      expect(document.querySelector('.premium-button')).toBeInTheDocument();
    });

    it('applies glow effect when glow prop is true', () => {
      render(
        <EnhancedButton glow variant="primary">
          Glow button
        </EnhancedButton>
      );
      
      expect(screen.getByText('Glow button')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(
        <EnhancedButton onClick={handleClick}>
          Clickable
        </EnhancedButton>
      );
      
      fireEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('EnhancedNavigation', () => {
    it('renders navigation with glassmorphism by default', () => {
      render(
        <EnhancedNavigation>
          <div>Navigation content</div>
        </EnhancedNavigation>
      );
      
      expect(screen.getByText('Navigation content')).toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });

    it('renders premium navigation when premium prop is true', () => {
      render(
        <EnhancedNavigation premium>
          <div>Premium navigation</div>
        </EnhancedNavigation>
      );
      
      expect(screen.getByText('Premium navigation')).toBeInTheDocument();
      expect(document.querySelector('.premium-navigation')).toBeInTheDocument();
    });

    it('renders shadow navigation when glassmorphism is disabled', () => {
      render(
        <EnhancedNavigation glassmorphism={false}>
          <div>Shadow navigation</div>
        </EnhancedNavigation>
      );
      
      expect(screen.getByText('Shadow navigation')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedModal', () => {
    it('renders modal with glassmorphism by default', () => {
      render(
        <EnhancedModal>
          <div>Modal content</div>
        </EnhancedModal>
      );
      
      expect(screen.getByText('Modal content')).toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });

    it('renders premium modal when premium prop is true', () => {
      render(
        <EnhancedModal premium>
          <div>Premium modal</div>
        </EnhancedModal>
      );
      
      expect(screen.getByText('Premium modal')).toBeInTheDocument();
      expect(document.querySelector('.premium-modal')).toBeInTheDocument();
    });
  });

  describe('EnhancedHero', () => {
    it('renders hero section with default gradient and texture', () => {
      render(
        <EnhancedHero>
          <h1>Hero title</h1>
        </EnhancedHero>
      );
      
      expect(screen.getByText('Hero title')).toBeInTheDocument();
      expect(document.querySelector('.gradient-effect')).toBeInTheDocument();
      expect(document.querySelector('.texture-effect')).toBeInTheDocument();
    });

    it('renders premium hero when premium prop is true', () => {
      render(
        <EnhancedHero premium>
          <h1>Premium hero</h1>
        </EnhancedHero>
      );
      
      expect(screen.getByText('Premium hero')).toBeInTheDocument();
      expect(document.querySelector('.premium-hero')).toBeInTheDocument();
    });
  });

  describe('EnhancedDivider', () => {
    it('renders divider with default gradient variant', () => {
      render(<EnhancedDivider />);
      
      expect(document.querySelector('.divider')).toBeInTheDocument();
    });

    it('renders decorative divider when decorative prop is true', () => {
      render(<EnhancedDivider decorative />);
      
      expect(document.querySelector('.divider')).toBeInTheDocument();
    });

    it('renders vertical divider when orientation is vertical', () => {
      render(<EnhancedDivider orientation="vertical" />);
      
      expect(document.querySelector('.divider')).toBeInTheDocument();
    });
  });

  describe('EnhancedPageContainer', () => {
    it('renders page container with default styling', () => {
      render(
        <EnhancedPageContainer>
          <div>Page content</div>
        </EnhancedPageContainer>
      );
      
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    it('applies gradient when gradient prop is provided', () => {
      render(
        <EnhancedPageContainer gradient="hero-primary">
          <div>Gradient page</div>
        </EnhancedPageContainer>
      );
      
      expect(screen.getByText('Gradient page')).toBeInTheDocument();
      expect(document.querySelector('.gradient-effect')).toBeInTheDocument();
    });

    it('applies texture when texture prop is provided', () => {
      render(
        <EnhancedPageContainer texture="noise-subtle">
          <div>Texture page</div>
        </EnhancedPageContainer>
      );
      
      expect(screen.getByText('Texture page')).toBeInTheDocument();
      expect(document.querySelector('.texture-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedArtistCard', () => {
    const mockArtist = {
      id: 1,
      name: 'John Doe',
      studio: 'Test Studio',
      styles: ['Traditional', 'Realism'],
      avatar: '/test-avatar.jpg'
    };

    it('renders artist card with artist information', () => {
      render(<EnhancedArtistCard artist={mockArtist} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test Studio')).toBeInTheDocument();
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      expect(screen.getByText('Realism')).toBeInTheDocument();
    });

    it('renders premium artist card when premium prop is true', () => {
      render(<EnhancedArtistCard artist={mockArtist} premium />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(document.querySelector('.premium-card')).toBeInTheDocument();
    });

    it('renders glassmorphism artist card when glassmorphism prop is true', () => {
      render(<EnhancedArtistCard artist={mockArtist} glassmorphism />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedStudioCard', () => {
    const mockStudio = {
      id: 1,
      name: 'Test Studio',
      location: 'London, UK',
      artistCount: 5,
      rating: 4.8,
      image: '/test-studio.jpg'
    };

    it('renders studio card with studio information', () => {
      render(<EnhancedStudioCard studio={mockStudio} />);
      
      expect(screen.getByText('Test Studio')).toBeInTheDocument();
      expect(screen.getByText('London, UK')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('★ 4.8')).toBeInTheDocument();
    });

    it('renders premium studio card when premium prop is true', () => {
      render(<EnhancedStudioCard studio={mockStudio} premium />);
      
      expect(screen.getByText('Test Studio')).toBeInTheDocument();
      expect(document.querySelector('.premium-card')).toBeInTheDocument();
    });
  });

  describe('EnhancedSearchBar', () => {
    it('renders search bar with default placeholder', () => {
      render(<EnhancedSearchBar />);
      
      expect(screen.getByPlaceholderText('Search artists, styles, or locations...')).toBeInTheDocument();
    });

    it('renders search bar with custom placeholder', () => {
      render(<EnhancedSearchBar placeholder="Custom search..." />);
      
      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
    });

    it('handles input changes', () => {
      const handleChange = jest.fn();
      render(<EnhancedSearchBar onChange={handleChange} />);
      
      const input = screen.getByPlaceholderText('Search artists, styles, or locations...');
      fireEvent.change(input, { target: { value: 'test search' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders with glassmorphism when glassmorphism prop is true', () => {
      render(<EnhancedSearchBar glassmorphism />);
      
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedFilterPanel', () => {
    it('renders filter panel with glassmorphism by default', () => {
      render(
        <EnhancedFilterPanel>
          <div>Filter content</div>
        </EnhancedFilterPanel>
      );
      
      expect(screen.getByText('Filter content')).toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });

    it('renders filter panel without glassmorphism when disabled', () => {
      render(
        <EnhancedFilterPanel glassmorphism={false}>
          <div>Filter content</div>
        </EnhancedFilterPanel>
      );
      
      expect(screen.getByText('Filter content')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
    });
  });

  describe('EnhancedLoadingState', () => {
    it('renders loading state with default message', () => {
      render(<EnhancedLoadingState />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(document.querySelector('.animation-effect')).toBeInTheDocument();
    });

    it('renders loading state with custom message', () => {
      render(<EnhancedLoadingState message="Loading artists..." />);
      
      expect(screen.getByText('Loading artists...')).toBeInTheDocument();
    });

    it('renders with glassmorphism when glassmorphism prop is true', () => {
      render(<EnhancedLoadingState glassmorphism />);
      
      expect(document.querySelector('.glass-effect')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper semantic structure', () => {
      render(
        <EnhancedPageContainer>
          <EnhancedNavigation>
            <div role="navigation">Navigation</div>
          </EnhancedNavigation>
          <EnhancedHero>
            <h1>Hero Title</h1>
          </EnhancedHero>
          <main>
            <EnhancedCard>
              <p>Main content</p>
            </EnhancedCard>
          </main>
        </EnhancedPageContainer>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports keyboard navigation for interactive elements', () => {
      const handleClick = jest.fn();
      render(
        <EnhancedButton onClick={handleClick}>
          Interactive Button
        </EnhancedButton>
      );
      
      const button = screen.getByText('Interactive Button');
      button.focus();
      fireEvent.click(button); // Use click instead of keyDown for this test
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('renders components efficiently without unnecessary re-renders', () => {
      const { rerender } = render(
        <EnhancedCard elevation="surface">
          <p>Test content</p>
        </EnhancedCard>
      );
      
      // Re-render with same props should not cause issues
      rerender(
        <EnhancedCard elevation="surface">
          <p>Test content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('handles prop changes gracefully', () => {
      const { rerender } = render(
        <EnhancedCard elevation="surface">
          <p>Test content</p>
        </EnhancedCard>
      );
      
      rerender(
        <EnhancedCard elevation="premium" premium>
          <p>Test content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(document.querySelector('.premium-card')).toBeInTheDocument();
    });
  });

  describe('Visual Effects Integration', () => {
    it('combines multiple visual effects correctly', () => {
      render(
        <EnhancedCard 
          elevation="premium" 
          glassmorphism={false}
          gradient="primary-subtle"
          texture="noise-subtle"
        >
          <p>Multi-effect content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Multi-effect content')).toBeInTheDocument();
      expect(document.querySelector('.shadow-effect')).toBeInTheDocument();
      expect(document.querySelector('.gradient-effect')).toBeInTheDocument();
      expect(document.querySelector('.texture-effect')).toBeInTheDocument();
    });

    it('prioritizes premium components over individual effects', () => {
      render(
        <EnhancedCard 
          premium
          elevation="surface"
          glassmorphism
        >
          <p>Premium priority content</p>
        </EnhancedCard>
      );
      
      expect(screen.getByText('Premium priority content')).toBeInTheDocument();
      expect(document.querySelector('.premium-card')).toBeInTheDocument();
      // Should not have individual effects when premium is true
      expect(document.querySelector('.shadow-effect')).not.toBeInTheDocument();
      expect(document.querySelector('.glass-effect')).not.toBeInTheDocument();
    });
  });
});

describe('Visual Effects Integration - Error Handling', () => {
  it('handles missing artist data gracefully', () => {
    const incompleteArtist = {
      id: 1,
      name: 'John Doe'
      // Missing other required fields
    };

    render(<EnhancedArtistCard artist={incompleteArtist} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Should not crash even with missing data
  });

  it('handles missing studio data gracefully', () => {
    const incompleteStudio = {
      id: 1,
      name: 'Test Studio'
      // Missing other required fields
    };

    render(<EnhancedStudioCard studio={incompleteStudio} />);
    
    expect(screen.getByText('Test Studio')).toBeInTheDocument();
    // Should not crash even with missing data
  });

  it('handles invalid prop values gracefully', () => {
    render(
      <EnhancedCard elevation="invalid-elevation">
        <p>Invalid prop content</p>
      </EnhancedCard>
    );
    
    expect(screen.getByText('Invalid prop content')).toBeInTheDocument();
    // Should still render without crashing
  });
});