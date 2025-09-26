import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactOptions from '../ContactOptions/ContactOptions';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('ContactOptions Component', () => {
  const mockContactInfo = {
    instagram: '@artist_example',
    whatsapp: '+447123456789',
    email: 'artist@example.com',
    phone: '+447123456789',
    website: 'https://artistexample.com',
    bookingUrl: 'https://example.com/book',
    studioAddress: '123 High Street, London, SW1A 1AA',
    preferredContact: 'instagram',
    responseTime: {
      instagram: 'Usually responds within hours',
      whatsapp: 'Usually responds within minutes',
      email: 'Usually responds within 24 hours'
    }
  };

  describe('Basic Rendering', () => {
    test('renders contact options correctly', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    test('handles null contactInfo gracefully', () => {
      render(<ContactOptions contactInfo={null} />);
      
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('renders with just Instagram handle prop', () => {
      render(<ContactOptions instagramHandle="@artist_test" />);
      
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    test('handles empty contactInfo object', () => {
      render(<ContactOptions contactInfo={{}} />);
      
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('Contact Method Priority', () => {
    test('prioritizes Instagram as first contact method', () => {
      const { container } = render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const contactLinks = container.querySelectorAll('a');
      expect(contactLinks[0]).toHaveAttribute('href', 'https://instagram.com/artist_example');
    });

    test('shows WhatsApp as second priority', () => {
      const { container } = render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const whatsappLink = container.querySelector('a[href*="wa.me"]');
      expect(whatsappLink).toBeInTheDocument();
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/447123456789');
    });

    test('handles Instagram handle with @ symbol', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const instagramLink = screen.getByText('Instagram').closest('a');
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/artist_example');
    });
  });

  describe('Contact Method Links', () => {
    test('creates correct Instagram link', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const instagramLink = screen.getByText('Instagram').closest('a');
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/artist_example');
      expect(instagramLink).toHaveAttribute('target', '_blank');
      expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('creates correct WhatsApp link', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const whatsappLink = screen.getByText('WhatsApp').closest('a');
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/447123456789');
    });

    test('creates correct email link', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const emailLink = screen.getByText('Email').closest('a');
      expect(emailLink).toHaveAttribute('href', 'mailto:artist@example.com');
    });

    test('creates correct phone link', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const phoneLink = screen.getByText('Call').closest('a');
      expect(phoneLink).toHaveAttribute('href', 'tel:+447123456789');
    });

    test('creates correct website link', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const websiteLink = screen.getByText('Website').closest('a');
      expect(websiteLink).toHaveAttribute('href', 'https://artistexample.com');
    });
  });

  describe('Variant Layouts', () => {
    test('renders buttons variant correctly', () => {
      render(<ContactOptions contactInfo={mockContactInfo} variant="buttons" />);
      
      // Should render as buttons instead of links
      expect(screen.getByRole('button', { name: /Instagram/i })).toBeInTheDocument();
    });

    test('renders compact variant with limited contacts', () => {
      render(<ContactOptions contactInfo={mockContactInfo} variant="compact" />);
      
      // Should limit to 3 contacts in compact mode
      const contactElements = screen.getAllByRole('link');
      expect(contactElements.length).toBeLessThanOrEqual(3);
    });

    test('shows more indicator in compact variant', () => {
      const manyContactsInfo = {
        ...mockContactInfo,
        tiktok: '@artist_tiktok',
        facebook: 'artist.facebook'
      };
      
      render(<ContactOptions contactInfo={manyContactsInfo} variant="compact" />);
      
      // Should show +X more indicator
      expect(screen.getByText(/\+\d+/)).toBeInTheDocument();
    });
  });

  describe('Response Time Display', () => {
    test('shows response time tooltips when enabled', () => {
      render(<ContactOptions contactInfo={mockContactInfo} showResponseTime={true} />);
      
      const whatsappLink = screen.getByText('WhatsApp').closest('div');
      fireEvent.mouseEnter(whatsappLink);
      
      // Should show tooltip with response time
      expect(screen.getByText('Usually responds within minutes')).toBeInTheDocument();
    });

    test('shows fast badge for WhatsApp', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      expect(screen.getByText('Fast')).toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    test('shows labels when showLabels is true', () => {
      render(<ContactOptions contactInfo={mockContactInfo} showLabels={true} />);
      
      expect(screen.getByText('@artist_example')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    test('hides labels when showLabels is false', () => {
      render(<ContactOptions contactInfo={mockContactInfo} showLabels={false} />);
      
      expect(screen.getByText('Instagram')).toBeInTheDocument(); // Still shows method name
      expect(screen.queryByText('@artist_example')).not.toBeInTheDocument();
    });
  });

  describe('Social Media Platforms', () => {
    test('renders TikTok link correctly', () => {
      const contactWithTikTok = { ...mockContactInfo, tiktok: '@artist_tiktok' };
      render(<ContactOptions contactInfo={contactWithTikTok} />);
      
      const tiktokLink = screen.getByText('TikTok').closest('a');
      expect(tiktokLink).toHaveAttribute('href', 'https://tiktok.com/@artist_tiktok');
    });

    test('renders Facebook link correctly', () => {
      const contactWithFacebook = { ...mockContactInfo, facebook: 'artist.facebook' };
      render(<ContactOptions contactInfo={contactWithFacebook} />);
      
      const facebookLink = screen.getByText('Facebook').closest('a');
      expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/artist.facebook');
    });

    test('handles TikTok handle with @ symbol', () => {
      const contactWithTikTok = { ...mockContactInfo, tiktok: '@artist_tiktok' };
      render(<ContactOptions contactInfo={contactWithTikTok} />);
      
      const tiktokLink = screen.getByText('TikTok').closest('a');
      expect(tiktokLink).toHaveAttribute('href', 'https://tiktok.com/@artist_tiktok');
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      const { container } = render(
        <ContactOptions contactInfo={mockContactInfo} size="lg" />
      );
      
      expect(container.querySelector('.text-lg')).toBeInTheDocument();
    });

    test('applies small size classes', () => {
      const { container } = render(
        <ContactOptions contactInfo={mockContactInfo} size="xs" />
      );
      
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });
  });

  describe('Website URL Handling', () => {
    test('handles website URL without protocol', () => {
      const contactWithoutProtocol = { 
        ...mockContactInfo, 
        website: 'artistexample.com' 
      };
      render(<ContactOptions contactInfo={contactWithoutProtocol} />);
      
      const websiteLink = screen.getByText('Website').closest('a');
      expect(websiteLink).toHaveAttribute('href', 'https://artistexample.com');
    });

    test('preserves website URL with protocol', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const websiteLink = screen.getByText('Website').closest('a');
      expect(websiteLink).toHaveAttribute('href', 'https://artistexample.com');
    });
  });

  describe('Phone Number Formatting', () => {
    test('strips non-digits from WhatsApp number', () => {
      const contactWithFormattedPhone = { 
        ...mockContactInfo, 
        whatsapp: '+44 (0) 7123 456 789' 
      };
      render(<ContactOptions contactInfo={contactWithFormattedPhone} />);
      
      const whatsappLink = screen.getByText('WhatsApp').closest('a');
      expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/447123456789');
    });
  });

  describe('Contact Limit', () => {
    test('limits contacts to 6 in default variant', () => {
      const manyContactsInfo = {
        instagram: '@artist',
        whatsapp: '+44123456789',
        email: 'artist@example.com',
        phone: '+44123456789',
        website: 'https://example.com',
        tiktok: '@artist_tiktok',
        facebook: 'artist.facebook',
        extraContact: 'extra'
      };
      
      render(<ContactOptions contactInfo={manyContactsInfo} />);
      
      const contactElements = screen.getAllByRole('link');
      expect(contactElements.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Accessibility', () => {
    test('provides proper link accessibility', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const instagramLink = screen.getByRole('link', { name: /Instagram/i });
      expect(instagramLink).toBeInTheDocument();
      expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('provides proper button accessibility in buttons variant', () => {
      render(<ContactOptions contactInfo={mockContactInfo} variant="buttons" />);
      
      const instagramButton = screen.getByRole('button', { name: /Instagram/i });
      expect(instagramButton).toBeInTheDocument();
    });

    test('provides proper ARIA labels for external links', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      const externalLinks = screen.getAllByRole('link');
      externalLinks.forEach(link => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  });

  describe('Icons Display', () => {
    test('renders contact method icons', () => {
      const { container } = render(<ContactOptions contactInfo={mockContactInfo} />);
      
      // Should have SVG icons for each contact method
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    test('applies correct icon sizes', () => {
      const { container } = render(
        <ContactOptions contactInfo={mockContactInfo} size="lg" />
      );
      
      const icons = container.querySelectorAll('svg.w-6');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});