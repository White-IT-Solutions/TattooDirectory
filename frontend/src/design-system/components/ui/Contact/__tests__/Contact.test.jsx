import { render, screen, fireEvent } from '@testing-library/react';
import { Contact, ContactItem, FAQContact } from '../Contact';

// Mock window.location.href
delete window.location;
window.location = { href: '' };

describe('Contact Component', () => {
  it('renders contact information with all fields', () => {
    render(
      <Contact
        title="Contact Us"
        email="test@example.com"
        phone="+1234567890"
        address="123 Test St, Test City"
        hours="9 AM - 5 PM"
      />
    );

    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();
    expect(screen.getByText('9 AM - 5 PM')).toBeInTheDocument();
  });

  it('renders email and phone as clickable links', () => {
    render(
      <Contact
        email="test@example.com"
        phone="+1234567890"
      />
    );

    const emailLink = screen.getByRole('link', { name: 'test@example.com' });
    const phoneLink = screen.getByRole('link', { name: '+1234567890' });

    expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com');
    expect(phoneLink).toHaveAttribute('href', 'tel:+1234567890');
  });

  it('renders without card wrapper when showCard is false', () => {
    const { container } = render(
      <Contact
        title="Test Contact"
        email="test@example.com"
        showCard={false}
      />
    );

    // Should not have card styling
    expect(container.firstChild).not.toHaveClass('bg-[var(--background-primary)]');
  });

  it('renders with card wrapper by default', () => {
    const { container } = render(
      <Contact
        title="Test Contact"
        email="test@example.com"
      />
    );

    // Should have card styling
    expect(container.firstChild).toHaveClass('bg-[var(--background-primary)]');
  });
});

describe('ContactItem Component', () => {
  it('renders contact item with icon and label', () => {
    const TestIcon = ({ className }) => <div className={className} data-testid="test-icon" />;
    
    render(
      <ContactItem
        icon={TestIcon}
        label="Email"
        value="test@example.com"
        href="mailto:test@example.com"
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test@example.com' })).toBeInTheDocument();
  });

  it('renders without link when href is not provided', () => {
    render(
      <ContactItem
        label="Address"
        value="123 Test St"
      />
    );

    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens external links in new tab', () => {
    render(
      <ContactItem
        label="Website"
        value="https://example.com"
        href="https://example.com"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('FAQContact Component', () => {
  it('renders FAQ-specific contact information', () => {
    render(<FAQContact />);

    expect(screen.getByText('Still have questions?')).toBeInTheDocument();
    expect(screen.getByText('support@tattoofinder.com')).toBeInTheDocument();
    expect(screen.getByText("Can't find what you're looking for? We're here to help!")).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<FAQContact />);

    expect(screen.getByRole('button', { name: /email support/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
  });

  it('handles email button click', () => {
    render(<FAQContact />);

    const emailButton = screen.getByRole('button', { name: /email support/i });
    fireEvent.click(emailButton);

    expect(window.location.href).toBe('mailto:support@tattoofinder.com');
  });

  it('handles report issue button click', () => {
    render(<FAQContact />);

    const reportButton = screen.getByRole('button', { name: /report issue/i });
    fireEvent.click(reportButton);

    expect(window.location.href).toBe('/takedown');
  });
});