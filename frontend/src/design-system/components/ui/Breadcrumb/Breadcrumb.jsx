"use client";

import { forwardRef } from 'react';
import Link from 'next/link';
import { cva } from '../../../utils/cn';

// Breadcrumb variant configurations
const breadcrumbVariants = cva(
  [
    'flex items-center space-x-1',
    'text-[var(--typography-body-small-size)]',
    'font-weight-[var(--typography-body-small-weight)]',
    'line-height-[var(--typography-body-small-line-height)]'
  ].join(' ')
);

const breadcrumbItemVariants = cva(
  [
    'transition-colors duration-200',
    'hover:text-[var(--interactive-primary)]'
  ].join(' '),
  {
    variants: {
      current: {
        true: 'text-[var(--text-primary)] font-semibold cursor-default',
        false: 'text-[var(--text-secondary)] hover:text-[var(--interactive-primary)]'
      }
    },
    defaultVariants: {
      current: false
    }
  }
);

const breadcrumbSeparatorVariants = cva(
  [
    'text-[var(--text-muted)]',
    'select-none'
  ].join(' ')
);

// Chevron Right Icon
const ChevronRightIcon = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 5l7 7-7 7" 
    />
  </svg>
);

// Home Icon
const HomeIcon = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
);

// Breadcrumb Item Component
const BreadcrumbItem = forwardRef(({ 
  href, 
  children, 
  current = false, 
  className,
  ...props 
}, ref) => {
  const content = (
    <span 
      className={breadcrumbItemVariants({ current, className })}
      {...(current && { 'aria-current': 'page' })}
    >
      {children}
    </span>
  );

  if (current || !href) {
    return content;
  }

  return (
    <Link 
      href={href} 
      ref={ref}
      className={breadcrumbItemVariants({ current: false, className })}
      {...props}
    >
      {children}
    </Link>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

// Breadcrumb Separator Component
const BreadcrumbSeparator = ({ className, ...props }) => (
  <span 
    className={breadcrumbSeparatorVariants({ className })}
    aria-hidden="true"
    {...props}
  >
    <ChevronRightIcon className="h-4 w-4" />
  </span>
);

// Main Breadcrumb Component
const Breadcrumb = forwardRef(({ 
  className, 
  children, 
  items,
  separator = <BreadcrumbSeparator />,
  ...props 
}, ref) => {
  // If items prop is provided, use it to generate breadcrumbs
  if (items && Array.isArray(items)) {
    return (
      <nav 
        className={breadcrumbVariants({ className })}
        aria-label="Breadcrumb navigation"
        ref={ref}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <BreadcrumbItem 
                href={item.href}
                current={index === items.length - 1}
              >
                {item.label}
              </BreadcrumbItem>
              {index < items.length - 1 && separator}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Fallback to children-based rendering
  const childrenArray = Array.isArray(children) ? children : [children];
  
  return (
    <nav 
      className={breadcrumbVariants({ className })}
      aria-label="Breadcrumb navigation"
      ref={ref}
      {...props}
    >
      <ol className="flex items-center space-x-1">
        {childrenArray.map((child, index) => (
          <li key={index} className="flex items-center">
            {child}
            {index < childrenArray.length - 1 && separator}
          </li>
        ))}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

// Convenience component for common home breadcrumb
const HomeBreadcrumb = ({ className, ...props }) => (
  <BreadcrumbItem 
    href="/" 
    className={`flex items-center space-x-1 ${className || ''}`}
    {...props}
  >
    <HomeIcon className="h-4 w-4" />
    <span>Home</span>
  </BreadcrumbItem>
);

export default Breadcrumb;
export { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbSeparator, 
  HomeBreadcrumb,
  breadcrumbVariants,
  breadcrumbItemVariants 
};