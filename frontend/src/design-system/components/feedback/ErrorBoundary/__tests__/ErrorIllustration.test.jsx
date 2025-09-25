import { render, screen } from '@testing-library/react';
import { 
  ErrorIllustration, 
  NetworkErrorIllustration, 
  ChunkLoadErrorIllustration 
} from '../ErrorIllustration';

describe('ErrorIllustration', () => {
  describe('ErrorIllustration', () => {
    it('renders simple variant correctly', () => {
      render(<ErrorIllustration variant="simple" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Error illustration');
    });

    it('renders detailed variant by default', () => {
      render(<ErrorIllustration />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Detailed error illustration showing a broken tattoo machine');
    });

    it('applies custom className', () => {
      render(<ErrorIllustration className="custom-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('custom-class');
    });

    it('has proper SVG structure for simple variant', () => {
      const { container } = render(<ErrorIllustration variant="simple" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
      expect(svg).toHaveAttribute('fill', 'none');
      
      // Check for basic elements
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('has proper SVG structure for detailed variant', () => {
      const { container } = render(<ErrorIllustration variant="detailed" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
      expect(svg).toHaveAttribute('fill', 'none');
      
      // Check for detailed elements
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(1);
      
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(1);
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(1);
    });

    it('includes animated elements in detailed variant', () => {
      const { container } = render(<ErrorIllustration variant="detailed" />);
      
      const animatedElements = container.querySelectorAll('animate');
      expect(animatedElements.length).toBeGreaterThan(0);
      
      // Check animation attributes
      animatedElements.forEach(element => {
        expect(element).toHaveAttribute('attributeName', 'opacity');
        expect(element).toHaveAttribute('repeatCount', 'indefinite');
      });
    });

    it('uses CSS custom properties for colors', () => {
      const { container } = render(<ErrorIllustration />);
      
      const svg = container.querySelector('svg');
      const innerHTML = svg.innerHTML;
      
      // Check for CSS custom property usage
      expect(innerHTML).toMatch(/var\(--color-error-/);
      expect(innerHTML).toMatch(/var\(--color-neutral-/);
      expect(innerHTML).toMatch(/var\(--color-primary-/);
    });
  });

  describe('NetworkErrorIllustration', () => {
    it('renders network error illustration correctly', () => {
      render(<NetworkErrorIllustration />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Network error illustration');
    });

    it('applies custom className', () => {
      render(<NetworkErrorIllustration className="network-error" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('network-error');
    });

    it('has proper SVG structure', () => {
      const { container } = render(<NetworkErrorIllustration />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
      
      // Check for signal bars (rectangles)
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThanOrEqual(4); // Signal bars
      
      // Check for warning triangle
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('uses warning color scheme', () => {
      const { container } = render(<NetworkErrorIllustration />);
      
      const svg = container.querySelector('svg');
      const innerHTML = svg.innerHTML;
      
      expect(innerHTML).toMatch(/var\(--color-warning-/);
    });
  });

  describe('ChunkLoadErrorIllustration', () => {
    it('renders chunk load error illustration correctly', () => {
      render(<ChunkLoadErrorIllustration />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Loading error illustration');
    });

    it('applies custom className', () => {
      render(<ChunkLoadErrorIllustration className="chunk-error" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('chunk-error');
    });

    it('has proper SVG structure', () => {
      const { container } = render(<ChunkLoadErrorIllustration />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
      
      // Check for loading circle
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      
      // Check for puzzle piece and refresh icon
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(1);
    });

    it('uses primary color scheme', () => {
      const { container } = render(<ChunkLoadErrorIllustration />);
      
      const svg = container.querySelector('svg');
      const innerHTML = svg.innerHTML;
      
      expect(innerHTML).toMatch(/var\(--color-primary-/);
    });

    it('includes dashed stroke for loading circle', () => {
      const { container } = render(<ChunkLoadErrorIllustration />);
      
      const circles = container.querySelectorAll('circle');
      const loadingCircle = Array.from(circles).find(circle => 
        circle.getAttribute('stroke-dasharray')
      );
      
      expect(loadingCircle).toBeTruthy();
      expect(loadingCircle).toHaveAttribute('stroke-dasharray', '20,10');
    });
  });

  describe('Accessibility', () => {
    it('all illustrations have proper ARIA labels', () => {
      const illustrations = [
        <ErrorIllustration key="error" />,
        <NetworkErrorIllustration key="network" />,
        <ChunkLoadErrorIllustration key="chunk" />
      ];

      illustrations.forEach((illustration, index) => {
        const { unmount } = render(illustration);
        
        const svg = screen.getByRole('img');
        expect(svg).toHaveAttribute('aria-label');
        expect(svg.getAttribute('aria-label')).toBeTruthy();
        
        unmount();
      });
    });

    it('SVGs have proper role attribute', () => {
      render(<ErrorIllustration />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('role', 'img');
    });

    it('animations do not cause accessibility issues', () => {
      const { container } = render(<ErrorIllustration variant="detailed" />);
      
      const animatedElements = container.querySelectorAll('animate');
      
      // Ensure animations are not too fast (accessibility guideline)
      animatedElements.forEach(element => {
        const duration = element.getAttribute('dur');
        const durationValue = parseFloat(duration);
        expect(durationValue).toBeGreaterThanOrEqual(0.5); // At least 0.5 seconds
      });
    });
  });

  describe('Responsive Design', () => {
    it('uses responsive width and height classes', () => {
      render(<ErrorIllustration />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('w-full', 'h-full');
    });

    it('maintains aspect ratio with viewBox', () => {
      const illustrations = [
        { component: <ErrorIllustration variant="simple" />, viewBox: '0 0 100 100' },
        { component: <ErrorIllustration variant="detailed" />, viewBox: '0 0 200 200' },
        { component: <NetworkErrorIllustration />, viewBox: '0 0 200 200' },
        { component: <ChunkLoadErrorIllustration />, viewBox: '0 0 200 200' }
      ];

      illustrations.forEach(({ component, viewBox }) => {
        const { unmount } = render(component);
        
        const svg = screen.getByRole('img');
        expect(svg).toHaveAttribute('viewBox', viewBox);
        
        unmount();
      });
    });
  });

  describe('Theme Integration', () => {
    it('uses design system color tokens', () => {
      const { container } = render(<ErrorIllustration />);
      
      const svg = container.querySelector('svg');
      const innerHTML = svg.innerHTML;
      
      // Check for various design system tokens
      const expectedTokens = [
        'var(--color-error-',
        'var(--color-neutral-',
        'var(--color-primary-',
        'var(--color-warning-',
        'var(--background-primary)',
        'var(--border-primary)',
        'var(--text-secondary)'
      ];

      expectedTokens.forEach(token => {
        expect(innerHTML).toMatch(new RegExp(token.replace(/[()]/g, '\\$&')));
      });
    });

    it('adapts to theme changes through CSS custom properties', () => {
      // This test ensures the illustrations will adapt to theme changes
      // since they use CSS custom properties instead of hardcoded colors
      
      const { container } = render(<ErrorIllustration />);
      
      const svg = container.querySelector('svg');
      const innerHTML = svg.innerHTML;
      
      // Check that CSS custom properties are used
      expect(innerHTML).toMatch(/var\(--/);
      
      // Ensure no hardcoded hex colors are used in the main elements
      const mainElements = container.querySelectorAll('circle, rect, path');
      let hasVarColors = false;
      
      mainElements.forEach(element => {
        const fill = element.getAttribute('fill');
        const stroke = element.getAttribute('stroke');
        if ((fill && fill.includes('var(--')) || (stroke && stroke.includes('var(--'))) {
          hasVarColors = true;
        }
      });
      
      expect(hasVarColors).toBe(true);
    });
  });
});