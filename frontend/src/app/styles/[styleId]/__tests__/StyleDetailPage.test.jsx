import { render, screen, waitFor } from '@testing-library/react';
import StyleDetailPage from '../StyleDetailPage';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('StyleDetailPage', () => {
  it('renders loading state initially', () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    // Should show skeleton loading states (check for skeleton class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders style details for traditional style', async () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    // Wait for loading to complete by checking for the main heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Traditional', level: 1 })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check main content
    expect(screen.getByRole('heading', { name: 'Traditional', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Bold, iconic tattoo style/)).toBeInTheDocument();
    
    // Check that beginner difficulty appears somewhere
    expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0);
    
    // Check characteristics section
    expect(screen.getByText('Key Characteristics')).toBeInTheDocument();
    expect(screen.getByText('Bold black outlines')).toBeInTheDocument();
    
    // Check popular motifs
    expect(screen.getByText('Popular Motifs')).toBeInTheDocument();
    expect(screen.getByText('Anchors')).toBeInTheDocument();
    expect(screen.getByText('Roses')).toBeInTheDocument();
    
    // Check historical context
    expect(screen.getByText('Historical Context')).toBeInTheDocument();
    expect(screen.getByText(/Early 1900s/)).toBeInTheDocument();
    
    // Check portfolio section
    expect(screen.getByText('Portfolio Examples')).toBeInTheDocument();
  });

  it('renders not found state for invalid style', async () => {
    render(<StyleDetailPage styleId="invalid-style" />);
    
    await waitFor(() => {
      expect(screen.getByText('Style Not Found')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/The tattoo style you're looking for doesn't exist/)).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', async () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that breadcrumb navigation exists
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('displays color palette correctly', async () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    await waitFor(() => {
      expect(screen.getByText('Color Palette')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check color names
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  it('shows technical notes section', async () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    await waitFor(() => {
      expect(screen.getByText('Technical Notes')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Requires steady hand for bold outlines/)).toBeInTheDocument();
    expect(screen.getByText(/Color saturation is key/)).toBeInTheDocument();
  });

  it('displays aliases correctly', async () => {
    render(<StyleDetailPage styleId="traditional" />);
    
    await waitFor(() => {
      expect(screen.getByText('Also Known As')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Old School')).toBeInTheDocument();
    expect(screen.getByText('American Traditional')).toBeInTheDocument();
  });
});