/**
 * Mobile Navigation Component
 * 
 * Provides mobile-optimized navigation patterns including
 * bottom navigation, hamburger menu, and swipe gestures.
 * 
 * Requirements: 8.3, 8.5
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { deviceCapabilities } from '../../../../lib/device-capabilities';
import TouchTarget from '../TouchTargets/TouchTargets';
import GestureSupport from '../GestureSupport/GestureSupport';

const MobileNavigation = ({ 
  items = [],
  position = 'bottom', // 'bottom' | 'top' | 'side'
  showLabels = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobile(deviceCapabilities.isMobile());
  }, []);

  // Don't render on desktop
  if (!isMobile) return null;

  const defaultItems = [
    { 
      href: '/', 
      label: 'Home', 
      icon: '🏠',
      activeIcon: '🏠'
    },
    { 
      href: '/artists', 
      label: 'Artists', 
      icon: '🎨',
      activeIcon: '🎨'
    },
    { 
      href: '/studios', 
      label: 'Studios', 
      icon: '🏢',
      activeIcon: '🏢'
    },
    { 
      href: '/styles', 
      label: 'Styles', 
      icon: '✨',
      activeIcon: '✨'
    }
  ];

  const navigationItems = items.length > 0 ? items : defaultItems;

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Bottom navigation bar
  if (position === 'bottom') {
    return (
      <GestureSupport className="mobile-nav-gesture-wrapper">
        <nav 
          className={`mobile-nav mobile-nav--bottom ${className}`}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            padding: '8px 0',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            minHeight: '64px',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navigationItems.map((item) => (
            <TouchTarget
              key={item.href}
              size="large"
              spacing="4px"
              className={`mobile-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <Link 
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: isActive(item.href) ? '#3b82f6' : '#6b7280',
                  fontSize: '12px',
                  fontWeight: isActive(item.href) ? '600' : '400'
                }}
              >
                <span style={{ fontSize: '20px', marginBottom: '2px' }}>
                  {isActive(item.href) ? item.activeIcon : item.icon}
                </span>
                {showLabels && (
                  <span>{item.label}</span>
                )}
              </Link>
            </TouchTarget>
          ))}
        </nav>
      </GestureSupport>
    );
  }

  // Side hamburger menu
  if (position === 'side') {
    return (
      <>
        {/* Hamburger button */}
        <TouchTarget
          size="large"
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-nav-hamburger"
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1001,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          aria-label="Toggle navigation menu"
        >
          <span style={{ fontSize: '24px' }}>
            {isOpen ? '✕' : '☰'}
          </span>
        </TouchTarget>

        {/* Overlay */}
        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Side menu */}
        <GestureSupport
          onSwipeLeft={() => setIsOpen(false)}
          className="mobile-nav-side-wrapper"
        >
          <nav
            className={`mobile-nav mobile-nav--side ${isOpen ? 'open' : ''} ${className}`}
            style={{
              position: 'fixed',
              top: 0,
              left: isOpen ? 0 : '-280px',
              width: '280px',
              height: '100vh',
              backgroundColor: 'white',
              zIndex: 1000,
              transition: 'left 0.3s ease-in-out',
              padding: '80px 20px 20px',
              boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
              overflowY: 'auto'
            }}
            role="navigation"
            aria-label="Mobile side navigation"
          >
            {navigationItems.map((item) => (
              <TouchTarget
                key={item.href}
                size="large"
                spacing="8px"
                className={`mobile-nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <Link 
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: isActive(item.href) ? '#3b82f6' : '#374151',
                    fontSize: '16px',
                    fontWeight: isActive(item.href) ? '600' : '400',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isActive(item.href) ? '#eff6ff' : 'transparent'
                  }}
                >
                  <span style={{ fontSize: '24px', marginRight: '12px' }}>
                    {isActive(item.href) ? item.activeIcon : item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </TouchTarget>
            ))}
          </nav>
        </GestureSupport>
      </>
    );
  }

  return null;
};

export default MobileNavigation;