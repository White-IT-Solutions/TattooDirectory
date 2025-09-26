"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cva } from '../../../utils/cn';
import SmartSearch from '../SmartSearch/SmartSearchWrapper';
import { Breadcrumb, HomeBreadcrumb, BreadcrumbItem } from '../../ui/Breadcrumb';
import Button from '../../ui/Button/Button';
import { useKeyboardNavigation } from '../KeyboardNavigation';
import { ThemeToggle } from '../../ui/ThemeProvider';

// Enhanced navbar variant configurations
const enhancedNavbarVariants = cva(
  [
    'sticky top-0 z-40',
    'backdrop-filter backdrop-blur-xl',
    'border-b border-[var(--border-primary)]',
    'transition-all duration-300 ease-out'
  ].join(' '),
  {
    variants: {
      collapsed: {
        true: '-translate-y-full',
        false: 'translate-y-0'
      },
      transparent: {
        true: 'bg-transparent',
        false: 'bg-[var(--background-primary)]/85'
      }
    },
    defaultVariants: {
      collapsed: false,
      transparent: false
    }
  }
);

const navContentVariants = cva(
  [
    'mx-auto px-4 lg:px-6',
    'transition-all duration-300'
  ].join(' '),
  {
    variants: {
      size: {
        compact: 'max-w-7xl',
        full: 'max-w-none',
        contained: 'max-w-6xl'
      }
    },
    defaultVariants: {
      size: 'compact'
    }
  }
);

const navItemVariants = cva(
  [
    'relative px-3 py-2 rounded-[var(--radius)]',
    'text-base font-medium',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2',
    'hover:bg-[var(--interactive-secondary)]'
  ].join(' '),
  {
    variants: {
      active: {
        true: [
          'text-[var(--interactive-primary)]',
          'bg-[var(--interactive-secondary)]',
          'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2',
          'after:w-1 after:h-1 after:bg-[var(--interactive-primary)] after:rounded-full'
        ].join(' '),
        false: [
          'text-[var(--text-primary)]',
          'hover:text-[var(--interactive-primary)]'
        ].join(' ')
      }
    },
    defaultVariants: {
      active: false
    }
  }
);

// Generate breadcrumbs from pathname
const generateBreadcrumbs = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ href: '/', label: 'Home' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable label
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Handle special cases
    switch (segment) {
      case 'artists':
        label = 'Artists';
        break;
      case 'studios':
        label = 'Studios';
        break;
      case 'styles':
        label = 'Styles';
        break;
      case 'design-test':
        label = 'Design System';
        break;
      case 'style-filter-demo':
        label = 'Style Filter Demo';
        break;
      case 'style-gallery-demo':
        label = 'Style Gallery Demo';
        break;
      default:
        // For dynamic routes like [id], try to get a more meaningful name
        if (segment.length > 10) {
          label = segment.substring(0, 10) + '...';
        }
    }

    breadcrumbs.push({
      href: currentPath,
      label: label
    });
  });

  return breadcrumbs;
};

// Default navigation items
const defaultNavItems = [
  { href: '/artists', label: 'Artists' },
  { href: '/studios', label: 'Studios' },
  { href: '/styles', label: 'Styles' }
];

const EnhancedNavbar = ({
  className,
  navItems = defaultNavItems,
  showSearch = true,
  showBreadcrumbs = true,
  autoHide = false,
  size = 'compact',
  transparent = false,
  onSearchFocus,
  ...props
}) => {
  const pathname = usePathname();
  const { isKeyboardMode } = useKeyboardNavigation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsCollapsed(true);
      } else if (currentScrollY < lastScrollY) {
        setIsCollapsed(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, autoHide]);

  // Generate breadcrumbs
  const breadcrumbs = showBreadcrumbs ? generateBreadcrumbs(pathname) : [];

  // Handle search focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
    onSearchFocus?.();
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  return (
    <nav 
      className={enhancedNavbarVariants({ 
        collapsed: isCollapsed, 
        transparent,
        className 
      })}
      role="navigation"
      aria-label="Main navigation"
      id="navigation"
      {...props}
    >
      <div className={navContentVariants({ size })}>
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-2xl font-bold font-brand text-[var(--interactive-primary)] transition-colors duration-200 hover:text-[var(--interactive-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2 rounded"
              style={{ fontFamily: 'Rock Salt, cursive' }}
            >
              TD
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navItemVariants({ active: isActive })}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            {showSearch && (
              <div className="hidden md:block w-96">
                <SmartSearch
                  placeholder="Search artists, studios, styles..."
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  data-help="search"
                />
              </div>
            )}

            {/* Mobile Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="md"
                className="md:hidden min-h-[44px] min-w-[44px]"
                aria-label="Search"
                onClick={() => {
                  // This will be handled by mobile navigation
                  const searchInput = document.querySelector('[type="search"]');
                  searchInput?.focus();
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            )}

            {/* Additional Action Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              <Link
                href="/design-test"
                className="text-sm font-medium text-[var(--interactive-accent)] hover:text-[var(--interactive-accent-hover)] transition-colors duration-200 px-3 py-2 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-accent)] focus:ring-offset-2"
              >
                Design
              </Link>
              <Link
                href="/design-test"
                className="text-sm font-medium text-[var(--interactive-accent)] hover:text-[var(--interactive-accent-hover)] transition-colors duration-200 px-3 py-2 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-accent)] focus:ring-offset-2"
              >
                Theme
              </Link>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="md" />
          </div>
        </div>

        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 1 && (
          <div className="pb-3 border-b border-[var(--border-muted)]">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        {/* Search Bar (Mobile Expanded) */}
        {showSearch && searchFocused && (
          <div className="md:hidden py-3 border-t border-[var(--border-muted)]">
            <SmartSearch
              placeholder="Search artists, studios, styles..."
              data-help="search"
            />
          </div>
        )}
      </div>

      {/* Keyboard Navigation Indicator */}
      {isKeyboardMode && (
        <div className="absolute top-full left-0 right-0 bg-[var(--interactive-primary)] text-white text-xs text-center py-1">
          Keyboard navigation active - Press ? for shortcuts
        </div>
      )}
    </nav>
  );
};

export default EnhancedNavbar;
export { EnhancedNavbar, enhancedNavbarVariants, navItemVariants };