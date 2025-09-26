"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationEnhancement } from '../../navigation/NavigationEnhancement';
import { MobileNavigation } from '../../navigation/MobileNavigation';
import { GestureSupport } from '../../navigation/GestureSupport';
import { Breadcrumb } from '../../ui/Breadcrumb';
import { Tooltip } from '../../ui/Tooltip';
import { cva } from '../../../utils/cn';
import { deviceCapabilities } from '../../../../lib/device-capabilities';

// Page wrapper variants
const pageWrapperVariants = cva(
  [
    'min-h-screen',
    'bg-[var(--background-subtle)]'
  ].join(' ')
);

// Page header variants
const pageHeaderVariants = cva(
  [
    'bg-[var(--background-primary)]',
    'border-b border-[var(--border-primary)]',
    'py-4 px-4 lg:px-6'
  ].join(' '),
  {
    variants: {
      size: {
        compact: 'py-3',
        normal: 'py-4',
        large: 'py-6'
      },
      sticky: {
        true: 'sticky top-16 z-20',
        false: ''
      }
    },
    defaultVariants: {
      size: 'normal',
      sticky: false
    }
  }
);

// Page content variants
const pageContentVariants = cva(
  [
    'flex-1',
    'px-4 lg:px-6 py-6'
  ].join(' '),
  {
    variants: {
      maxWidth: {
        none: '',
        sm: 'max-w-2xl mx-auto',
        md: 'max-w-4xl mx-auto',
        lg: 'max-w-6xl mx-auto',
        xl: 'max-w-7xl mx-auto',
        full: 'max-w-full'
      },
      padding: {
        none: 'p-0',
        sm: 'px-4 py-3',
        md: 'px-4 lg:px-6 py-6',
        lg: 'px-6 lg:px-8 py-8',
        xl: 'px-8 lg:px-12 py-12'
      }
    },
    defaultVariants: {
      maxWidth: 'xl',
      padding: 'md'
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
    
    // Handle special cases and dynamic routes
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
      case 'search':
        label = 'Search';
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
      case 'navigation-demo':
        label = 'Navigation Demo';
        break;
      default:
        // For dynamic routes like [id], try to get a more meaningful name
        if (segment.length > 20) {
          label = segment.substring(0, 20) + '...';
        }
        // If it looks like an ID, format it nicely
        if (/^[a-f0-9-]{20,}$/i.test(segment)) {
          label = `ID: ${segment.substring(0, 8)}...`;
        }
    }

    breadcrumbs.push({
      href: currentPath,
      label: label
    });
  });

  return breadcrumbs;
};

// Get page metadata based on pathname
const getPageMetadata = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentPage = pathSegments[0] || 'home';
  
  const metadata = {
    home: {
      title: 'Home',
      description: 'Discover exceptional tattoo artists across the UK. Find the perfect artist for your next tattoo.',
      keywords: ['tattoo artists', 'UK tattoos', 'tattoo directory', 'find tattoo artist']
    },
    artists: {
      title: 'Tattoo Artists',
      description: 'Browse our directory of talented tattoo artists. Filter by style, location, and rating to find your perfect match.',
      keywords: ['tattoo artists', 'artist directory', 'tattoo styles', 'UK artists']
    },
    studios: {
      title: 'Tattoo Studios',
      description: 'Explore professional tattoo studios across the UK. Find studios near you with verified artists and reviews.',
      keywords: ['tattoo studios', 'tattoo shops', 'UK studios', 'professional tattoos']
    },
    styles: {
      title: 'Tattoo Styles',
      description: 'Learn about different tattoo styles and find artists who specialize in each style. From traditional to modern.',
      keywords: ['tattoo styles', 'traditional tattoos', 'realism', 'geometric tattoos']
    },
    search: {
      title: 'Search',
      description: 'Advanced search for tattoo artists and studios. Find exactly what you\'re looking for with powerful filters.',
      keywords: ['tattoo search', 'find artist', 'advanced search', 'filter artists']
    }
  };

  return metadata[currentPage] || metadata.home;
};

/**
 * PageWrapper Component
 * Comprehensive page wrapper that provides:
 * - Navigation enhancements
 * - Breadcrumb navigation
 * - Page metadata management
 * - Consistent layout structure
 * - Accessibility features
 * - Mobile-friendly design
 */
const PageWrapper = ({
  children,
  title,
  description,
  showBreadcrumbs = true,
  showPageHeader = true,
  headerSize = 'normal',
  stickyHeader = false,
  maxWidth = 'xl',
  contentPadding = 'md',
  pageTransition = true,
  transitionType = 'fade',
  className,
  headerActions,
  customBreadcrumbs,
  enableGestures = true,
  enableMobileNav = true,
  onPullToRefresh,
  ...props
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get page metadata
  const pageMetadata = getPageMetadata(pathname);
  const pageTitle = title || pageMetadata.title;
  const pageDescription = description || pageMetadata.description;

  // Generate breadcrumbs
  const breadcrumbs = customBreadcrumbs || (showBreadcrumbs ? generateBreadcrumbs(pathname) : []);

  // Check if mobile device
  useEffect(() => {
    setIsMobile(deviceCapabilities.isMobile());
  }, []);

  // Handle navigation loading states
  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);

    // Listen for route changes (Next.js App Router doesn't have built-in events)
    // We'll use a simple timeout to simulate loading
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, isNavigating]);

  // Handle keyboard shortcuts for page navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + H for home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        router.push('/');
      }
      
      // Alt + A for artists
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        router.push('/artists');
      }
      
      // Alt + S for studios
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        router.push('/studios');
      }
      
      // Alt + T for styles (tattoo styles)
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        router.push('/styles');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Handle pull-to-refresh
  const handlePullToRefresh = () => {
    if (onPullToRefresh) {
      onPullToRefresh();
    } else {
      // Default behavior: reload the page
      window.location.reload();
    }
  };

  const pageContent = (
    <NavigationEnhancement
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      showPageTransition={pageTransition}
      transitionType={transitionType}
      className={pageWrapperVariants({ className })}
      {...props}
    >
      {/* Page Header with Breadcrumbs */}
      {showPageHeader && (
        <header className={pageHeaderVariants({ size: headerSize, sticky: stickyHeader })}>
          <div className={`mx-auto ${maxWidth === 'xl' ? 'max-w-7xl' : maxWidth === 'lg' ? 'max-w-6xl' : maxWidth === 'md' ? 'max-w-4xl' : maxWidth === 'sm' ? 'max-w-2xl' : 'max-w-full'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Breadcrumbs */}
                {showBreadcrumbs && breadcrumbs.length > 1 && (
                  <div className="mb-2">
                    <Breadcrumb items={breadcrumbs} />
                  </div>
                )}
                
                {/* Page Title */}
                {pageTitle && (
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] truncate">
                      {pageTitle}
                    </h1>
                    
                    {/* Page Help Tooltip */}
                    <Tooltip
                      content={
                        <div className="max-w-xs">
                          <div className="font-semibold mb-1">Page Information</div>
                          <div className="text-sm">{pageDescription}</div>
                          <div className="text-xs mt-2 opacity-75">
                            {isMobile 
                              ? "Swipe right to go back, swipe left to go forward, pull down to refresh"
                              : "Keyboard shortcuts: Alt+H (Home), Alt+A (Artists), Alt+S (Studios), Alt+T (Styles)"
                            }
                          </div>
                        </div>
                      }
                      position="bottom"
                      delay={300}
                    >
                      <button
                        className="text-[var(--text-secondary)] hover:text-[var(--interactive-primary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2 rounded"
                        aria-label="Page information and shortcuts"
                        style={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly size
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                )}
                
                {/* Page Description */}
                {pageDescription && (
                  <p className="mt-1 text-[var(--text-secondary)] text-sm lg:text-base">
                    {pageDescription}
                  </p>
                )}
              </div>
              
              {/* Header Actions */}
              {headerActions && (
                <div className="ml-4 flex-shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Page Content */}
      <div 
        className={pageContentVariants({ maxWidth, padding: contentPadding })}
        style={{ paddingBottom: isMobile && enableMobileNav ? '80px' : undefined }} // Add space for mobile nav
      >
        {children}
      </div>

      {/* Navigation Loading Indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--interactive-primary)] animate-pulse" />
      )}

      {/* Mobile Navigation */}
      {enableMobileNav && (
        <MobileNavigation 
          position="bottom"
          showLabels={true}
        />
      )}
    </NavigationEnhancement>
  );

  // Wrap with gesture support if enabled
  if (enableGestures && isMobile) {
    return (
      <GestureSupport
        enableSwipeNavigation={true}
        enablePullToRefresh={true}
        onPullToRefresh={handlePullToRefresh}
        swipeThreshold={50}
        pullThreshold={100}
      >
        {pageContent}
      </GestureSupport>
    );
  }

  return pageContent;
};

export default PageWrapper;
export { PageWrapper, generateBreadcrumbs, getPageMetadata };