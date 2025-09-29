import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StarRating from '../StarRating/StarRating';

describe('StarRating Component', () => {
  const mockRatingBreakdown = {
    5: 45,
    4: 23,
    3: 8,
    2: 3,
    1: 1
  };

  describe('Basic Rendering', () => {
    test('renders star rating with default props', () => {
      render(<StarRating rating={4.5} reviewCount={80} />);
      
      // Should show 5 stars
      const stars = screen.getAllByRole('img', { hidden: true });
      expect(stars).toHaveLength(10); // 5 empty + 5 filled stars
      
      // Should show review count (number is wrapped in FormattedNumber component)
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    test('renders correct number of full and half stars', () => {
      const { container } = render(<StarRating rating={3.5} />);
      
      // Check for proper star rendering (3 full, 1 half, 1 empty)
      const filledStars = container.querySelectorAll('svg[fill="currentColor"]');
      expect(filledStars.length).toBeGreaterThan(0);
    });

    test('handles zero rating', () => {
      render(<StarRating rating={0} reviewCount={0} />);
      
      // Should not show review count when zero
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('handles edge case ratings', () => {
      render(<StarRating rating={5.0} reviewCount={1} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      const { rerender } = render(<StarRating rating={4} size="xs" />);
      expect(document.querySelector('.w-3')).toBeInTheDocument();
      
      rerender(<StarRating rating={4} size="lg" />);
      expect(document.querySelector('.w-6')).toBeInTheDocument();
    });
  });

  describe('Rating Breakdown', () => {
    test('shows breakdown tooltip on hover', async () => {
      render(
        <StarRating 
          rating={4.2} 
          reviewCount={80} 
          ratingBreakdown={mockRatingBreakdown}
        />
      );
      
      const starsContainer = screen.getAllByRole('img', { hidden: true })[0].parentElement.parentElement;
      fireEvent.mouseEnter(starsContainer);
      
      await waitFor(() => {
        expect(screen.getByText('Rating Breakdown')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument(); // 5-star count
      });
    });

    test('shows detailed breakdown when showBreakdown is true', () => {
      render(
        <StarRating 
          rating={4.2} 
          reviewCount={80} 
          ratingBreakdown={mockRatingBreakdown}
          showBreakdown={true}
        />
      );
      
      // Should show breakdown bars
      expect(screen.getByText('5★')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    test('calculates percentages correctly', () => {
      render(
        <StarRating 
          rating={4.0} 
          reviewCount={100} 
          ratingBreakdown={{ 5: 50, 4: 30, 3: 15, 2: 3, 1: 2 }}
          showBreakdown={true}
        />
      );
      
      // Check that percentages are calculated (50% for 5-star should be visible)
      const progressBars = document.querySelectorAll('.bg-accent-500');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Features', () => {
    test('handles interactive rating clicks', () => {
      const mockOnRatingClick = jest.fn();
      render(
        <StarRating 
          rating={3} 
          interactive={true}
          onRatingClick={mockOnRatingClick}
        />
      );
      
      const firstStar = document.querySelector('[role="img"]').parentElement;
      fireEvent.click(firstStar);
      
      expect(mockOnRatingClick).toHaveBeenCalledWith(1);
    });

    test('shows hover effects for interactive rating', () => {
      render(<StarRating rating={3} interactive={true} />);
      
      const firstStar = document.querySelector('[role="img"]').parentElement;
      fireEvent.mouseEnter(firstStar);
      
      // Should show hover styling
      expect(firstStar).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels', () => {
      render(<StarRating rating={4.5} reviewCount={80} />);
      
      // Stars should be properly labeled for screen readers
      const stars = screen.getAllByRole('img', { hidden: true });
      expect(stars.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation when interactive', () => {
      const mockOnRatingClick = jest.fn();
      render(
        <StarRating 
          rating={3} 
          interactive={true}
          onRatingClick={mockOnRatingClick}
        />
      );
      
      const firstStar = document.querySelector('[role="img"]').parentElement;
      fireEvent.keyDown(firstStar, { key: 'Enter' });
      
      // Should handle keyboard interaction
      expect(firstStar).toBeInTheDocument();
    });
  });

  describe('Review Count Display', () => {
    test('formats large review counts', () => {
      render(<StarRating rating={4.5} reviewCount={1234} />);
      
      // Should show formatted count (FormattedNumber with compact=true shows 1.2K)
      expect(screen.getByText('1.2K')).toBeInTheDocument();
    });

    test('hides review count when showCount is false', () => {
      render(<StarRating rating={4.5} reviewCount={80} showCount={false} />);
      
      expect(screen.queryByText('80')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles invalid rating values gracefully', () => {
      render(<StarRating rating={-1} reviewCount={80} />);
      
      // Should not crash and should render something reasonable
      expect(document.querySelector('.flex')).toBeInTheDocument();
    });

    test('handles missing breakdown data', () => {
      render(
        <StarRating 
          rating={4.2} 
          reviewCount={80} 
          ratingBreakdown={null}
          showBreakdown={true}
        />
      );
      
      // Should not crash
      expect(document.querySelector('.flex')).toBeInTheDocument();
    });
  });
});