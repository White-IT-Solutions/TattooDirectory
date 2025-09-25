import { render, screen } from '@testing-library/react';
import StudioArtists from '../StudioArtists';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

// Simple mock artist data
const mockArtists = [
  {
    artistId: 'artist-001',
    artistName: 'Test Artist 1',
    bio: 'Test bio 1',
    styles: ['geometric', 'realism'],
    rating: 4.5,
    reviewCount: 100
  },
  {
    artistId: 'artist-002',
    artistName: 'Test Artist 2',
    bio: 'Test bio 2',
    styles: ['traditional'],
    rating: 4.2,
    reviewCount: 50
  }
];

describe('StudioArtists Simple Tests', () => {
  it('renders without crashing', () => {
    render(<StudioArtists artists={mockArtists} studioName="Test Studio" />);
    expect(screen.getByText('Artists at Test Studio')).toBeInTheDocument();
  });

  it('displays artist names', () => {
    render(<StudioArtists artists={mockArtists} studioName="Test Studio" />);
    expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
  });

  it('shows correct artist count', () => {
    render(<StudioArtists artists={mockArtists} studioName="Test Studio" />);
    expect(screen.getByText('Meet our talented team of 2 artists')).toBeInTheDocument();
  });

  it('renders view profile buttons', () => {
    render(<StudioArtists artists={mockArtists} studioName="Test Studio" />);
    const buttons = screen.getAllByText('View Profile');
    expect(buttons).toHaveLength(2);
  });

  it('handles empty artists array', () => {
    render(<StudioArtists artists={[]} studioName="Empty Studio" />);
    expect(screen.getByText('No artists currently listed')).toBeInTheDocument();
  });
});