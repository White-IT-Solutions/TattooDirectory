import { render, screen } from '@testing-library/react';
import StarRating from '../StarRating';

describe('StarRating', () => {
  it('renders 5 star containers', () => {
    const { container } = render(<StarRating rating={3.5} />);
    // Each star has a container div with class "relative", but there's also a parent container
    // Count only the star containers (direct children of the stars container)
    const starsContainer = container.querySelector('.flex.items-center.relative');
    const starContainers = starsContainer.querySelectorAll('.relative');
    expect(starContainers).toHaveLength(5); // 5 star containers
  });

  it('displays correct rating with full stars', () => {
    render(<StarRating rating={4} reviewCount={25} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays half stars correctly', () => {
    const { container } = render(<StarRating rating={3.5} />);
    const halfStars = container.querySelectorAll('[style*="clip-path"]');
    expect(halfStars).toHaveLength(1);
  });

  it('hides review count when showCount is false', () => {
    render(<StarRating rating={4} reviewCount={25} showCount={false} />);
    expect(screen.queryByText('25')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container } = render(<StarRating rating={4} size="lg" />);
    const stars = container.querySelectorAll('svg');
    expect(stars[0]).toHaveClass('w-6', 'h-6');
  });

  it('handles zero rating', () => {
    render(<StarRating rating={0} />);
    const { container } = render(<StarRating rating={0} />);
    const filledStars = container.querySelectorAll('.text-accent-500');
    expect(filledStars).toHaveLength(0);
  });

  it('handles maximum rating', () => {
    const { container } = render(<StarRating rating={5} />);
    const filledStars = container.querySelectorAll('.text-accent-500');
    expect(filledStars).toHaveLength(5);
  });
});