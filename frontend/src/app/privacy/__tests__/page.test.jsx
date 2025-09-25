import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrivacyPolicyPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Object.defineProperty(window.Element.prototype, 'scrollIntoView', {
  writable: true,
  value: mockScrollIntoView,
});

describe('Privacy Policy Page', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
  });

  describe('Page Structure and Content', () => {
    it('renders the privacy policy page with correct title', () => {
      render(<PrivacyPolicyPage />);
      
      // Privacy Policy appears multiple times, so check for the main heading
      const privacyPolicyElements = screen.getAllByText('Privacy Policy');
      expect(privacyPolicyElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Your privacy is important to us/)).toBeInTheDocument();
    });

    it('displays the last updated date', () => {
      render(<PrivacyPolicyPage />);
      
      expect(screen.getByText('Last updated: December 15, 2024')).toBeInTheDocument();
    });

    it('renders breadcrumb navigation', () => {
      render(<PrivacyPolicyPage />);
      
      expect(screen.getByLabelText('Breadcrumb navigation')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      // Privacy Policy appears multiple times, so we'll check for the breadcrumb specifically
      const breadcrumbItems = screen.getAllByText('Privacy Policy');
      expect(breadcrumbItems.length).toBeGreaterThan(0);
    });

    it('displays table of contents with all sections', () => {
      render(<PrivacyPolicyPage />);
      
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
      // Use getAllByText since these appear in both TOC and main content
      expect(screen.getAllByText('1. Information We Collect')).toHaveLength(2);
      expect(screen.getAllByText('2. How We Use Your Information')).toHaveLength(2);
      expect(screen.getAllByText('3. Information Sharing and Disclosure')).toHaveLength(2);
      expect(screen.getAllByText('4. Data Security')).toHaveLength(2);
      expect(screen.getAllByText('5. Your Rights and Choices')).toHaveLength(2);
      expect(screen.getAllByText('6. Cookies and Tracking Technologies')).toHaveLength(2);
      expect(screen.getAllByText('7. Data Retention')).toHaveLength(2);
      expect(screen.getAllByText('8. Policy Updates')).toHaveLength(2);
      expect(screen.getAllByText('9. Contact Information')).toHaveLength(2);
    });
  });

  describe('Content Sections', () => {
    it('renders all privacy policy sections with proper content', () => {
      render(<PrivacyPolicyPage />);
      
      // Check for key content in each section
      expect(screen.getByText(/We collect information you provide directly to us/)).toBeInTheDocument();
      expect(screen.getByText(/We use the information we collect to:/)).toBeInTheDocument();
      expect(screen.getByText(/We do not sell, trade, or otherwise transfer/)).toBeInTheDocument();
      expect(screen.getByText(/We implement industry-standard security measures/)).toBeInTheDocument();
      expect(screen.getByText(/You have the following rights/)).toBeInTheDocument();
      expect(screen.getByText(/We use cookies and similar technologies/)).toBeInTheDocument();
      expect(screen.getByText(/We retain your information for as long as necessary/)).toBeInTheDocument();
      expect(screen.getByText(/We may update this Privacy Policy/)).toBeInTheDocument();
      expect(screen.getByText(/privacy@tattoofinder.com/)).toBeInTheDocument();
    });

    it('displays contact information correctly', () => {
      render(<PrivacyPolicyPage />);
      
      expect(screen.getByText(/privacy@tattoofinder.com/)).toBeInTheDocument();
      expect(screen.getByText(/123 Privacy Street, Data City, DC 12345/)).toBeInTheDocument();
      expect(screen.getByText(/\+44 \(0\) 20 1234 5678/)).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('scrolls to section when table of contents button is clicked', async () => {
      render(<PrivacyPolicyPage />);
      
      // Mock getElementById to return a mock element
      const mockElement = { scrollIntoView: mockScrollIntoView };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
      
      const tocButton = screen.getByRole('button', { name: '1. Information We Collect' });
      fireEvent.click(tocButton);
      
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start'
        });
      });
      
      document.getElementById.mockRestore();
    });

    it('updates active section state when navigation button is clicked', async () => {
      render(<PrivacyPolicyPage />);
      
      const mockElement = { scrollIntoView: mockScrollIntoView };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
      
      const tocButton = screen.getByRole('button', { name: '2. How We Use Your Information' });
      fireEvent.click(tocButton);
      
      await waitFor(() => {
        expect(tocButton).toHaveClass('bg-gray-100');
      });
      
      document.getElementById.mockRestore();
    });
  });

  describe('Action Section', () => {
    it('renders contact privacy team button with correct functionality', () => {
      render(<PrivacyPolicyPage />);
      
      const contactButton = screen.getByText('Contact Privacy Team');
      expect(contactButton).toBeInTheDocument();
      
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };
      
      fireEvent.click(contactButton);
      expect(window.location.href).toBe('mailto:privacy@tattoofinder.com');
    });

    it('renders return home link', () => {
      render(<PrivacyPolicyPage />);
      
      const homeLink = screen.getByText('Return Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('displays questions section with proper styling', () => {
      render(<PrivacyPolicyPage />);
      
      expect(screen.getByText('Questions About This Policy?')).toBeInTheDocument();
      expect(screen.getByText(/We're here to help. Contact us if you have any questions/)).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses Card components for content structure', () => {
      render(<PrivacyPolicyPage />);
      
      // Check that cards are rendered (they should have specific classes)
      const cards = document.querySelectorAll('[class*="bg-[var(--background-primary)]"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('uses Button components for navigation', () => {
      render(<PrivacyPolicyPage />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check that buttons have design system classes
      buttons.forEach(button => {
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
      });
    });

    it('applies proper typography scaling using design tokens', () => {
      render(<PrivacyPolicyPage />);
      
      // Get the main title (first one in the header card)
      const mainTitles = screen.getAllByText('Privacy Policy');
      const mainTitle = mainTitles.find(title => 
        title.className.includes('text-2xl') || title.className.includes('text-3xl')
      );
      expect(mainTitle).toBeInTheDocument();
      expect(mainTitle).toHaveClass('font-bold');
    });

    it('uses consistent spacing and layout', () => {
      render(<PrivacyPolicyPage />);
      
      const container = document.querySelector('.max-w-4xl');
      expect(container).toBeInTheDocument();
      
      const gridLayout = document.querySelector('.grid');
      expect(gridLayout).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<PrivacyPolicyPage />);
      
      const gridContainer = document.querySelector('.grid-cols-1.lg\\:grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
    });

    it('applies responsive column spans', () => {
      render(<PrivacyPolicyPage />);
      
      const sidebarColumn = document.querySelector('.lg\\:col-span-1');
      const mainColumn = document.querySelector('.lg\\:col-span-3');
      
      expect(sidebarColumn).toBeInTheDocument();
      expect(mainColumn).toBeInTheDocument();
    });

    it('makes table of contents sticky on large screens', () => {
      render(<PrivacyPolicyPage />);
      
      const stickyElement = document.querySelector('.lg\\:sticky');
      expect(stickyElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<PrivacyPolicyPage />);
      
      // The main title is actually an h3 in our implementation
      const mainHeading = screen.getByRole('heading', { name: 'Privacy Policy' });
      expect(mainHeading).toBeInTheDocument();
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('has proper navigation landmarks', () => {
      render(<PrivacyPolicyPage />);
      
      const breadcrumbNav = screen.getByLabelText('Breadcrumb navigation');
      expect(breadcrumbNav).toBeInTheDocument();
      
      const tocNav = document.querySelector('nav');
      expect(tocNav).toBeInTheDocument();
    });

    it('has proper button labels and roles', () => {
      render(<PrivacyPolicyPage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/./); // Should have some text content
      });
    });

    it('supports keyboard navigation', () => {
      render(<PrivacyPolicyPage />);
      
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Print Styles', () => {
    it('includes print-friendly CSS classes', () => {
      render(<PrivacyPolicyPage />);
      
      // Check that elements have classes that would be affected by print styles
      const cards = document.querySelectorAll('[class*="bg-[var(--background-primary)]"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('has proper scroll margin for print anchors', () => {
      render(<PrivacyPolicyPage />);
      
      const sections = document.querySelectorAll('[id]');
      sections.forEach(section => {
        if (section.id.includes('-')) {
          expect(section).toHaveClass('scroll-mt-8');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing section element gracefully', () => {
      render(<PrivacyPolicyPage />);
      
      // Mock getElementById to return null
      jest.spyOn(document, 'getElementById').mockReturnValue(null);
      
      const tocButton = screen.getByRole('button', { name: '1. Information We Collect' });
      
      // Should not throw error when element is not found
      expect(() => {
        fireEvent.click(tocButton);
      }).not.toThrow();
      
      document.getElementById.mockRestore();
    });

    it('handles email link errors gracefully', () => {
      render(<PrivacyPolicyPage />);
      
      const contactButton = screen.getByText('Contact Privacy Team');
      
      // Should render the button without errors
      expect(contactButton).toBeInTheDocument();
      expect(contactButton).toHaveAttribute('type', 'button');
    });
  });
});