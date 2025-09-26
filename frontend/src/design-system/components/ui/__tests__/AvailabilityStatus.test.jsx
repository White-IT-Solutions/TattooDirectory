import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailabilityStatus from '../AvailabilityStatus/AvailabilityStatus';

describe('AvailabilityStatus Component', () => {
  const mockAvailability = {
    bookingOpen: true,
    nextAvailable: '2024-02-15',
    waitingList: false,
    waitingListCount: 0,
    estimatedWaitTime: '2-3 weeks',
    bookingUrl: 'https://example.com/book',
    consultationRequired: true,
    emergencySlots: false
  };

  describe('Basic Rendering', () => {
    test('renders available status correctly', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('handles null availability gracefully', () => {
      render(<AvailabilityStatus availability={null} />);
      
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('renders booking closed status', () => {
      const closedAvailability = { ...mockAvailability, bookingOpen: false };
      render(<AvailabilityStatus availability={closedAvailability} />);
      
      expect(screen.getByText('Booking Closed')).toBeInTheDocument();
      expect(screen.getByText('🚫')).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    test('shows waiting list status', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true,
        waitingListCount: 5
      };
      
      render(<AvailabilityStatus availability={waitingListAvailability} />);
      
      expect(screen.getByText('Waiting List')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('5 waiting')).toBeInTheDocument();
    });

    test('shows emergency slots status', () => {
      const emergencyAvailability = {
        ...mockAvailability,
        emergencySlots: true
      };
      
      render(<AvailabilityStatus availability={emergencyAvailability} />);
      
      expect(screen.getByText('Emergency Slots')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  describe('Availability Details', () => {
    test('shows next available date', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      expect(screen.getByText('Next available:')).toBeInTheDocument();
      // Date formatting depends on FormattedDate component
      expect(screen.getByText(/Feb/)).toBeInTheDocument();
    });

    test('shows estimated wait time for waiting list', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true,
        estimatedWaitTime: '2-3 weeks'
      };
      
      render(<AvailabilityStatus availability={waitingListAvailability} />);
      
      expect(screen.getByText('Est. wait:')).toBeInTheDocument();
      expect(screen.getByText('2-3 weeks')).toBeInTheDocument();
    });

    test('shows consultation required indicator', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      expect(screen.getByText('💬')).toBeInTheDocument();
      expect(screen.getByText('Consultation required')).toBeInTheDocument();
    });

    test('shows emergency slots indicator', () => {
      const emergencyAvailability = {
        ...mockAvailability,
        emergencySlots: true
      };
      
      render(<AvailabilityStatus availability={emergencyAvailability} />);
      
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('Last-minute slots available')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    test('shows book now button when available', () => {
      const mockOnBookingClick = jest.fn();
      render(
        <AvailabilityStatus 
          availability={mockAvailability} 
          showActions={true}
          onBookingClick={mockOnBookingClick}
        />
      );
      
      const bookButton = screen.getByText('Book Now');
      expect(bookButton).toBeInTheDocument();
      
      fireEvent.click(bookButton);
      expect(mockOnBookingClick).toHaveBeenCalled();
    });

    test('shows join wait list button when on waiting list', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true
      };
      const mockOnWaitListClick = jest.fn();
      
      render(
        <AvailabilityStatus 
          availability={waitingListAvailability} 
          showActions={true}
          onWaitListClick={mockOnWaitListClick}
        />
      );
      
      const waitListButton = screen.getByText('Join Wait List');
      expect(waitListButton).toBeInTheDocument();
      
      fireEvent.click(waitListButton);
      expect(mockOnWaitListClick).toHaveBeenCalled();
    });

    test('shows disabled button when booking closed', () => {
      const closedAvailability = { ...mockAvailability, bookingOpen: false };
      
      render(
        <AvailabilityStatus 
          availability={closedAvailability} 
          showActions={true}
        />
      );
      
      const closedButton = screen.getByText('Bookings Closed');
      expect(closedButton).toBeInTheDocument();
      expect(closedButton).toBeDisabled();
    });

    test('shows consultation button when consultation required', () => {
      const mockOnBookingClick = jest.fn();
      render(
        <AvailabilityStatus 
          availability={mockAvailability} 
          showActions={true}
          onBookingClick={mockOnBookingClick}
        />
      );
      
      const consultationButton = screen.getByText('Book Consultation');
      expect(consultationButton).toBeInTheDocument();
      
      fireEvent.click(consultationButton);
      expect(mockOnBookingClick).toHaveBeenCalledWith('consultation');
    });
  });

  describe('Booking Link', () => {
    test('shows booking link when no actions shown', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      const bookingLink = screen.getByText('Book online →');
      expect(bookingLink).toBeInTheDocument();
      expect(bookingLink.closest('a')).toHaveAttribute('href', 'https://example.com/book');
      expect(bookingLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    test('hides booking link when actions are shown', () => {
      render(
        <AvailabilityStatus 
          availability={mockAvailability} 
          showActions={true}
        />
      );
      
      expect(screen.queryByText('Book online →')).not.toBeInTheDocument();
    });
  });

  describe('Badge Variants', () => {
    test('applies correct badge variant for available status', () => {
      const { container } = render(
        <AvailabilityStatus availability={mockAvailability} />
      );
      
      // Should have success variant styling
      expect(container.querySelector('[class*="success"]')).toBeInTheDocument();
    });

    test('applies correct badge variant for closed status', () => {
      const closedAvailability = { ...mockAvailability, bookingOpen: false };
      const { container } = render(
        <AvailabilityStatus availability={closedAvailability} />
      );
      
      // Should have error variant styling
      expect(container.querySelector('[class*="error"]')).toBeInTheDocument();
    });

    test('applies correct badge variant for waiting list', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true
      };
      const { container } = render(
        <AvailabilityStatus availability={waitingListAvailability} />
      );
      
      // Should have warning variant styling
      expect(container.querySelector('[class*="warning"]')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      render(<AvailabilityStatus availability={mockAvailability} size="lg" />);
      
      // Should apply large size to badges and text
      expect(document.querySelector('[class*="text-lg"]')).toBeInTheDocument();
    });
  });

  describe('Waiting List Count', () => {
    test('shows waiting list count when greater than 0', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true,
        waitingListCount: 12
      };
      
      render(<AvailabilityStatus availability={waitingListAvailability} />);
      
      expect(screen.getByText('12 waiting')).toBeInTheDocument();
    });

    test('hides waiting list count when 0', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true,
        waitingListCount: 0
      };
      
      render(<AvailabilityStatus availability={waitingListAvailability} />);
      
      expect(screen.queryByText('0 waiting')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper button accessibility', () => {
      render(
        <AvailabilityStatus 
          availability={mockAvailability} 
          showActions={true}
        />
      );
      
      const bookButton = screen.getByRole('button', { name: 'Book Now' });
      expect(bookButton).toBeInTheDocument();
    });

    test('provides proper link accessibility', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      const bookingLink = screen.getByRole('link', { name: 'Book online →' });
      expect(bookingLink).toBeInTheDocument();
      expect(bookingLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});