import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders card with default props', () => {
      render(<Card data-testid="card">Test content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Test content');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Card ref={ref} data-testid="card">Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Elevation Variants', () => {
    it('renders flat elevation variant', () => {
      render(<Card elevation="flat" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-none');
    });

    it('renders low elevation variant', () => {
      render(<Card elevation="low" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-[var(--shadow-sm)]');
    });

    it('renders medium elevation variant (default)', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-[var(--shadow)]');
    });

    it('renders high elevation variant', () => {
      render(<Card elevation="high" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-[var(--shadow-lg)]');
    });

    it('renders floating elevation variant', () => {
      render(<Card elevation="floating" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-[var(--shadow-xl)]');
      expect(card.className).toContain('hover:-translate-y-1');
    });
  });

  describe('Padding Variants', () => {
    it('renders with no padding', () => {
      render(<Card padding="none" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-0');
    });

    it('renders with small padding', () => {
      render(<Card padding="sm" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
    });

    it('renders with medium padding (default)', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });

    it('renders with large padding', () => {
      render(<Card padding="lg" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Radius Variants', () => {
    it('renders with no radius', () => {
      render(<Card radius="none" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-none');
    });

    it('renders with small radius', () => {
      render(<Card radius="sm" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-[var(--radius)]');
    });

    it('renders with large radius (default)', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-[var(--radius-lg)]');
    });
  });

  describe('Hover Effects', () => {
    it('includes hover shadow transition for low elevation', () => {
      render(<Card elevation="low" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('hover:shadow-[var(--shadow)]');
    });

    it('includes hover shadow transition for medium elevation', () => {
      render(<Card elevation="medium" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('hover:shadow-[var(--shadow-md)]');
    });

    it('includes hover transform for floating elevation', () => {
      render(<Card elevation="floating" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('hover:-translate-y-1');
    });
  });

  describe('Accessibility', () => {
    it('passes through ARIA attributes', () => {
      render(
        <Card 
          data-testid="card" 
          role="article" 
          aria-label="Test card"
        >
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });
});

describe('Card Composition Components', () => {
  describe('CardHeader', () => {
    it('renders header with correct styling', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardHeader ref={ref} data-testid="header">Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders title as h3 with correct styling', () => {
      render(<CardTitle data-testid="title">Card Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-semibold');
      expect(title.className).toContain('text-[var(--text-primary)]');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardTitle ref={ref} data-testid="title">Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders description with correct styling', () => {
      render(<CardDescription data-testid="description">Description text</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm');
      expect(description.className).toContain('text-[var(--text-secondary)]');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardDescription ref={ref} data-testid="desc">Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('renders content container', () => {
      render(<CardContent data-testid="content">Content here</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content here');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardContent ref={ref} data-testid="content">Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders footer with correct styling', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'pt-4');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardFooter ref={ref} data-testid="footer">Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Full Card Composition', () => {
    it('renders complete card with all components', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});