import { render, screen } from '@testing-library/react';
import ContactOptions from '../ContactOptions';

describe('ContactOptions', () => {
  it('displays Instagram contact', () => {
    render(<ContactOptions instagramHandle="@testartist" />);
    
    const instagramLink = screen.getByRole('link');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/testartist');
    expect(screen.getByText('@testartist')).toBeInTheDocument();
  });

  it('displays website contact', () => {
    const contactInfo = { website: 'https://example.com' };
    render(<ContactOptions contactInfo={contactInfo} />);
    
    const websiteLink = screen.getByRole('link');
    expect(websiteLink).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('Website')).toBeInTheDocument();
  });

  it('displays email contact', () => {
    const contactInfo = { email: 'artist@example.com' };
    render(<ContactOptions contactInfo={contactInfo} />);
    
    const emailLink = screen.getByRole('link');
    expect(emailLink).toHaveAttribute('href', 'mailto:artist@example.com');
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays phone contact', () => {
    const contactInfo = { phone: '+44 123 456 7890' };
    render(<ContactOptions contactInfo={contactInfo} />);
    
    const phoneLink = screen.getByRole('link');
    expect(phoneLink).toHaveAttribute('href', 'tel:+44 123 456 7890');
    expect(screen.getByText('Call')).toBeInTheDocument();
  });

  it('displays multiple contact methods', () => {
    const contactInfo = { 
      email: 'artist@example.com',
      website: 'https://example.com',
      phone: '+44 123 456 7890'
    };
    render(<ContactOptions contactInfo={contactInfo} instagramHandle="@testartist" />);
    
    expect(screen.getByText('@testartist')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    // Should only show first 3 contacts
    expect(screen.queryByText('Call')).not.toBeInTheDocument();
  });

  it('handles website without protocol', () => {
    const contactInfo = { website: 'example.com' };
    render(<ContactOptions contactInfo={contactInfo} />);
    
    const websiteLink = screen.getByRole('link');
    expect(websiteLink).toHaveAttribute('href', 'https://example.com');
  });

  it('removes @ from Instagram handle in URL', () => {
    render(<ContactOptions instagramHandle="@testartist" />);
    
    const instagramLink = screen.getByRole('link');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/testartist');
  });

  it('returns null when no contact info provided', () => {
    const { container } = render(<ContactOptions />);
    expect(container.firstChild).toBeNull();
  });

  it('prioritizes Instagram from contactInfo over instagramHandle', () => {
    const contactInfo = { instagram: 'contactinfo_handle' };
    render(<ContactOptions contactInfo={contactInfo} instagramHandle="@separate_handle" />);
    
    expect(screen.getByText('contactinfo_handle')).toBeInTheDocument();
    expect(screen.queryByText('@separate_handle')).not.toBeInTheDocument();
  });
});