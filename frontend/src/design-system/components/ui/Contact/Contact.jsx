"use client";

import { forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import Card from '../Card/Card';
import Button from '../Button/Button';

// Contact variant configurations
const contactVariants = cva(
  [
    'space-y-4'
  ].join(' ')
);

const contactItemVariants = cva(
  [
    'flex items-center space-x-3',
    'text-[var(--typography-body-size)]',
    'text-[var(--text-primary)]'
  ].join(' ')
);

// Contact Icons
const EmailIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Contact Item Component
const ContactItem = forwardRef(({ 
  icon: Icon, 
  label, 
  value, 
  href,
  className,
  ...props 
}, ref) => {
  const content = (
    <div className={contactItemVariants({ className })} ref={ref} {...props}>
      {Icon && <Icon className="h-5 w-5 text-[var(--interactive-primary)] flex-shrink-0" />}
      <div className="flex-1">
        {label && (
          <div className="text-[var(--typography-caption-size)] text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
            {label}
          </div>
        )}
        <div className="text-[var(--text-primary)]">
          {href ? (
            <a 
              href={href}
              className="hover:text-[var(--interactive-primary)] transition-colors duration-200 underline"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {value}
            </a>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );

  return content;
});

ContactItem.displayName = 'ContactItem';

// Main Contact Component
const Contact = forwardRef(({ 
  className,
  title = "Contact Information",
  email,
  phone,
  address,
  hours,
  showCard = true,
  children,
  ...props 
}, ref) => {
  const contactContent = (
    <div className={contactVariants({ className })} ref={ref} {...props}>
      {title && (
        <h3 className="text-[var(--typography-heading-4-size)] font-weight-[var(--typography-heading-4-weight)] text-[var(--text-primary)] mb-4">
          {title}
        </h3>
      )}
      
      <div className="space-y-3">
        {email && (
          <ContactItem
            icon={EmailIcon}
            label="Email"
            value={email}
            href={`mailto:${email}`}
          />
        )}
        
        {phone && (
          <ContactItem
            icon={PhoneIcon}
            label="Phone"
            value={phone}
            href={`tel:${phone}`}
          />
        )}
        
        {address && (
          <ContactItem
            icon={LocationIcon}
            label="Address"
            value={address}
          />
        )}
        
        {hours && (
          <ContactItem
            icon={ClockIcon}
            label="Hours"
            value={hours}
          />
        )}
        
        {children}
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card elevation="low" padding="md">
        {contactContent}
      </Card>
    );
  }

  return contactContent;
});

Contact.displayName = 'Contact';

// FAQ Contact Component - specialized for FAQ page
const FAQContact = ({ className, ...props }) => (
  <Contact
    title="Still have questions?"
    email="support@tattoofinder.com"
    className={className}
    showCard={true}
    {...props}
  >
    <div className="pt-4 border-t border-[var(--border-subtle)]">
      <p className="text-[var(--typography-body-small-size)] text-[var(--text-secondary)] mb-3">
        Can&apos;t find what you&apos;re looking for? We&apos;re here to help!
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => window.location.href = 'mailto:support@tattoofinder.com'}
        >
          <EmailIcon className="h-4 w-4 mr-2" />
          Email Support
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/takedown'}
        >
          <QuestionIcon className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>
    </div>
  </Contact>
);

export default Contact;
export { 
  Contact, 
  ContactItem, 
  FAQContact,
  contactVariants,
  contactItemVariants,
  EmailIcon,
  PhoneIcon,
  LocationIcon,
  ClockIcon,
  QuestionIcon
};