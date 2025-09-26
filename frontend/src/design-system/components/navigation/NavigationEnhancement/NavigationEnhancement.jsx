"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PageTransition } from '../../layout/PageTransition';
import { useKeyboardNavigation } from '../KeyboardNavigation';
import { useContextualHelp } from '../ContextualHelp';
import { Tooltip } from '../../ui/Tooltip';
import { cva } from '../../../utils/cn';

// Navigation enhancement variants
const navigationEnhancementVariants = cva(
  [
    'min-h-screen',
    'transition-all duration-300 ease-out'
  ].join(' '),
  {
    variants: {
      keyboardMode: {
        true: 'keyboard-navigation-active',
        false: ''
      }
    },
    defaultVariants: {
      keyboardMode: false
    }
  }
);

// Page content wrapper variants
const pageContentVariants = cva(
  [
    'relative',
    'focus:outline-none'
  ].join(' ')
);

// Skip to content link variants
const skipToContentVariants = cva(
  [
    'sr-only focus:not-sr-only',
    'absolute top-0 left-0 z-[9999]',
    'bg-[var(--interactive-primary)] text-white',
    'px-4 py-2 rounded-br-[var(--radius)]',
    'font-semibold text-sm',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2'
  ].join(' ')
);

/**
 * NavigationEnhancement Component
 * Provides comprehensive navigation and UX enhancements for all pages
 * 
 * Features:
 * - Page transitions with loading states
 * - Keyboard navigation support
 * - Contextual help integration
 * - Accessibility enhancements
 * - Mobile-friendly navigation
 * - Smooth scrolling and focus management
 */
const NavigationEnhancement = ({ 
  children, 
  pageTitle,
  pageDescription,
  showPageTransition = true,
  transitionType = 'fade',
  className,
  ...props 
}) => {
  const pathname = usePathname();
  const { isKeyboardMode } = useKeyboardNavigation();
  const { showHelp } = useContextualHelp();
  const [isLoading, setIsLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  // Handle page transitions and loading states
  useEffect(() => {
    setIsLoading(true);
    setPageReady(false);

    // Simulate page loading and setup
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      setPageReady(true);
      
      // Focus management for accessibility
      if (isKeyboardMode) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
        }
      }
    }, 100);

    return () => clearTimeout(loadingTimer);
  }, [pathname, isKeyboardMode]);

  // Update document title and meta description
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | Tattoo Directory`;
    }
    
    if (pageDescription) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = pageDescription;
    }
  }, [pageTitle, pageDescription]);

  // Handle smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;

      const href = target.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Focus the target element for accessibility
        if (isKeyboardMode) {
          targetElement.focus();
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, [isKeyboardMode]);

  // Generate contextual help for current page
  const getPageHelpContent = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentPage = pathSegments[0] || 'home';
    
    const helpContent = {
      home: {
        title: 'Welcome to Tattoo Directory',
        content: 'Use the search bar to find artists, browse by style, or explore studios. Click on any artist card to view their full profile.',
        shortcuts: ['Press "/" to focus search', 'Use Tab to navigate', 'Press Enter to select items']
      },
      artists: {
        title: 'Artist Directory',
        content: 'Browse tattoo artists by style, location, and rating. Use filters to narrow down your search and find the perfect artist for your next tattoo.',
        shortcuts: ['Use filters to refine results', 'Click artist cards for full profiles', 'Use map view for location-based search']
      },
      studios: {
        title: 'Studio Directory',
        content: 'Explore tattoo studios across the UK. View studio profiles, see their artists, and find contact information.',
        shortcuts: ['Filter by specialties and location', 'Switch between grid and map views', 'Click studio cards for detailed information']
      },
      styles: {
        title: 'Tattoo Styles Guide',
        content: 'Learn about different tattoo styles and find artists who specialize in each style. Explore style characteristics and popular motifs.',
        shortcuts: ['Click style cards to see specialists', 'Use difficulty filters', 'Hover for detailed style information']
      }
    };

    return helpContent[currentPage] || helpContent.home;
  };

  return (
    <div 
      className={navigationEnhancementVariants({ 
        keyboardMode: isKeyboardMode,
        className 
      })}
      {...props}
    >
      {/* Skip to Content Link */}
      <a 
        href="#main-content" 
        className={skipToContentVariants()}
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to main content
      </a>

      {/* Page Help Trigger */}
      <Tooltip
        content={
          <div>
            <div className="font-semibold mb-1">Page Help</div>
            <div className="text-sm">{getPageHelpContent().title}</div>
            <div className="text-xs mt-1 opacity-75">Press ? for keyboard shortcuts</div>
          </div>
        }
        position="left"
        delay={300}
      >
        <button
          className="fixed top-20 right-4 z-30 w-10 h-10 rounded-full bg-[var(--interactive-secondary)] text-[var(--text-primary)] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2"
          onClick={() => showHelp('navigation')}
          aria-label="Show page help"
          title="Get help for this page"
        >
          <svg className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </Tooltip>

      {/* Main Content with Page Transitions */}
      <main 
        id="main-content"
        className={pageContentVariants()}
        tabIndex={-1}
        role="main"
        aria-label="Main content"
      >
        {showPageTransition ? (
          <PageTransition 
            type={transitionType}
            duration={300}
          >
            {children}
          </PageTransition>
        ) : (
          children
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--interactive-primary)]"></div>
            <span className="text-[var(--text-primary)] font-medium">Loading...</span>
          </div>
        </div>
      )}

      {/* Keyboard Navigation Indicator */}
      {isKeyboardMode && (
        <div className="fixed bottom-4 left-4 z-30 bg-[var(--interactive-primary)] text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Keyboard navigation active</span>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

/**
 * Scroll to Top Button Component
 */
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Tooltip content="Scroll to top" position="left" delay={300}>
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-[var(--interactive-primary)] text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2"
        aria-label="Scroll to top"
      >
        <svg className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </Tooltip>
  );
};

export default NavigationEnhancement;
export { NavigationEnhancement, ScrollToTopButton };