"use client";
import { cn } from '../../../utils/cn';
import Link from 'next/link';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';

export default function ContactOptions({ 
  contactInfo, 
  instagramHandle,
  size = 'sm',
  variant = 'default',
  showLabels = true,
  showResponseTime = false,
  className 
}) {
  if (!contactInfo && !instagramHandle) return null;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const contacts = [];

  // Instagram (priority contact method)
  if (contactInfo?.instagram || instagramHandle) {
    const handle = contactInfo?.instagram || instagramHandle;
    contacts.push({
      type: 'instagram',
      value: showLabels ? handle : 'Instagram',
      label: 'Instagram',
      href: `https://instagram.com/${handle.replace('@', '')}`,
      priority: 1,
      responseTime: contactInfo?.responseTime?.instagram || 'Usually responds within hours',
      icon: (
        <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    });
  }

  // WhatsApp
  if (contactInfo?.whatsapp) {
    contacts.push({
      type: 'whatsapp',
      value: showLabels ? 'WhatsApp' : 'Chat',
      label: 'WhatsApp',
      href: `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`,
      priority: 2,
      responseTime: contactInfo?.responseTime?.whatsapp || 'Usually responds within minutes',
      icon: (
        <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      )
    });
  }

  // Website
  if (contactInfo?.website) {
    contacts.push({
      type: 'website',
      value: 'Website',
      label: 'Portfolio Website',
      href: contactInfo.website.startsWith('http') ? contactInfo.website : `https://${contactInfo.website}`,
      priority: 3,
      responseTime: 'View portfolio and booking info',
      icon: (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m0 0a9 9 0 019-9" />
        </svg>
      )
    });
  }

  // Email
  if (contactInfo?.email) {
    contacts.push({
      type: 'email',
      value: 'Email',
      label: 'Email',
      href: `mailto:${contactInfo.email}`,
      priority: 4,
      responseTime: contactInfo?.responseTime?.email || 'Usually responds within 24 hours',
      icon: (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    });
  }

  // Phone
  if (contactInfo?.phone) {
    contacts.push({
      type: 'phone',
      value: 'Call',
      label: 'Phone',
      href: `tel:${contactInfo.phone}`,
      priority: 5,
      responseTime: contactInfo?.responseTime?.phone || 'Call during business hours',
      icon: (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    });
  }

  // TikTok
  if (contactInfo?.tiktok) {
    contacts.push({
      type: 'tiktok',
      value: 'TikTok',
      label: 'TikTok',
      href: `https://tiktok.com/@${contactInfo.tiktok.replace('@', '')}`,
      priority: 6,
      responseTime: 'View latest work and process videos',
      icon: (
        <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    });
  }

  // Facebook
  if (contactInfo?.facebook) {
    contacts.push({
      type: 'facebook',
      value: 'Facebook',
      label: 'Facebook',
      href: `https://facebook.com/${contactInfo.facebook}`,
      priority: 7,
      responseTime: 'View reviews and portfolio',
      icon: (
        <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    });
  }

  if (contacts.length === 0) return null;

  // Sort by priority
  contacts.sort((a, b) => a.priority - b.priority);

  const renderContact = (contact, index) => {
    const isExternal = ['instagram', 'website', 'whatsapp', 'tiktok', 'facebook'].includes(contact.type);
    
    if (variant === 'buttons') {
      return (
        <Button
          key={index}
          variant={index === 0 ? 'primary' : 'outline'}
          size={size}
          asChild
          className="flex-1"
        >
          <Link
            href={contact.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            {contact.icon}
            {showLabels && <span className="ml-1">{contact.value}</span>}
          </Link>
        </Button>
      );
    }

    return (
      <div key={index} className="relative group">
        <Link
          href={contact.href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-neutral-100 hover:bg-neutral-200 transition-colors',
            'text-neutral-700 hover:text-primary-600',
            sizeClasses[size],
            variant === 'compact' && 'px-2 py-1'
          )}
        >
          {contact.icon}
          {showLabels && <span>{contact.value}</span>}
          {contact.type === 'whatsapp' && (
            <Badge variant="success" size="sm">Fast</Badge>
          )}
        </Link>
        
        {/* Response time tooltip */}
        {showResponseTime && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="bg-neutral-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {contact.responseTime}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      variant === 'buttons' ? 'flex gap-2' : 'flex flex-wrap gap-2',
      className
    )}>
      {contacts.slice(0, variant === 'compact' ? 3 : 6).map(renderContact)}
      
      {/* Show more indicator */}
      {contacts.length > (variant === 'compact' ? 3 : 6) && (
        <div className={cn(
          'flex items-center justify-center px-2 py-1 rounded-md',
          'bg-neutral-100 text-neutral-500',
          sizeClasses[size]
        )}>
          +{contacts.length - (variant === 'compact' ? 3 : 6)}
        </div>
      )}
    </div>
  );
}