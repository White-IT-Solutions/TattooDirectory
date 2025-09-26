import { render, screen } from '@testing-library/react';
import AvailabilityStatus from '../AvailabilityStatus';

describe('AvailabilityStatus', () => {
  it('shows available status when booking is open', () => {
    const availability = { bookingOpen: true, waitingList: false };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows booking closed status', () => {
    const availability = { bookingOpen: false };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.getByText('Booking Closed')).toBeInTheDocument();
  });

  it('shows waiting list status', () => {
    const availability = { bookingOpen: true, waitingList: true };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.getByText('Waiting List')).toBeInTheDocument();
  });

  it('displays next available date when provided', () => {
    const availability = { 
      bookingOpen: true, 
      waitingList: false,
      nextAvailable: '2024-03-15T10:00:00Z'
    };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.getByText(/Next:/)).toBeInTheDocument();
  });

  it('does not show next available when booking is closed', () => {
    const availability = { 
      bookingOpen: false,
      nextAvailable: '2024-03-15T10:00:00Z'
    };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
  });

  it('returns null when no availability provided', () => {
    const { container } = render(<AvailabilityStatus availability={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles invalid date gracefully', () => {
    const availability = { 
      bookingOpen: true,
      nextAvailable: 'invalid-date'
    };
    render(<AvailabilityStatus availability={availability} />);
    
    expect(screen.getByText('Next: invalid-date')).toBeInTheDocument();
  });
});