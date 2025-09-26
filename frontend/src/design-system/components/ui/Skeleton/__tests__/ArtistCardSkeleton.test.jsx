import { render, screen } from '@testing-library/react';
import { ArtistCardSkeleton, ArtistCardSkeletonGrid } from '../ArtistCardSkeleton';

describe('ArtistCardSkeleton', () => {
  it('renders with correct structure', () => {
    render(<ArtistCardSkeleton data-testid="artist-card-skeleton" />);
    const card = screen.getByTestId('artist-card-skeleton');
    
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white', 'shadow-lg', 'rounded-lg', 'p-4');
  });

  it('contains all expected skeleton elements', () => {
    const { container } = render(<ArtistCardSkeleton />);
    
    // Check for avatar (circular skeleton)
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
    
    // Check for portfolio grid (3 columns)
    const portfolioGrid = container.querySelector('.grid-cols-3');
    expect(portfolioGrid).toBeInTheDocument();
    
    // Check for multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(5); // Avatar, name, bio, badges, location, portfolio, button
  });

  it('applies custom className', () => {
    render(<ArtistCardSkeleton className="custom-class" data-testid="artist-card-skeleton" />);
    const card = screen.getByTestId('artist-card-skeleton');
    
    expect(card).toHaveClass('custom-class');
  });

  it('forwards props correctly', () => {
    render(<ArtistCardSkeleton data-testid="artist-card-skeleton" aria-label="Loading artist" />);
    const card = screen.getByTestId('artist-card-skeleton');
    
    expect(card).toHaveAttribute('aria-label', 'Loading artist');
  });
});

describe('ArtistCardSkeletonGrid', () => {
  it('renders default number of skeletons (6)', () => {
    const { container } = render(<ArtistCardSkeletonGrid data-testid="skeleton-grid" />);
    const grid = screen.getByTestId('skeleton-grid');
    const cards = container.querySelectorAll('.bg-white.shadow-lg');
    
    expect(grid).toBeInTheDocument();
    expect(cards).toHaveLength(6);
  });

  it('renders custom number of skeletons', () => {
    const { container } = render(<ArtistCardSkeletonGrid count={3} />);
    const cards = container.querySelectorAll('.bg-white.shadow-lg');
    
    expect(cards).toHaveLength(3);
  });

  it('applies grid layout classes', () => {
    render(<ArtistCardSkeletonGrid data-testid="skeleton-grid" />);
    const grid = screen.getByTestId('skeleton-grid');
    
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('applies custom className', () => {
    render(<ArtistCardSkeletonGrid className="custom-grid" data-testid="skeleton-grid" />);
    const grid = screen.getByTestId('skeleton-grid');
    
    expect(grid).toHaveClass('custom-grid');
  });
});