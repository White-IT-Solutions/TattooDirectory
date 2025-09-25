"use client";

import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * AccessibilityControls Component
 * Provides user controls for accessibility preferences
 */
const AccessibilityControls = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    reducedMotion,
    highContrast,
    fontSize,
    touchTargetSize,
    setReducedMotion,
    setHighContrast,
    setFontSize,
    setTouchTargetSize
  } = useAccessibility();

  const handleToggle = () => {
    console.log('Toggle button clicked, current isOpen:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    console.log('Close button clicked');
    setIsOpen(false);
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  const touchTargetOptions = [
    { value: 'normal', label: 'Normal (44px)' },
    { value: 'large', label: 'Large (56px)' },
    { value: 'extra-large', label: 'Extra Large (64px)' }
  ];

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? 'Close accessibility controls' : 'Open accessibility controls'}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '80px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          backgroundColor: '#2563eb',
          color: 'white',
          borderRadius: '50%',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#1d4ed8';
          e.target.style.transform = isOpen ? 'rotate(45deg) scale(1.05)' : 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#2563eb';
          e.target.style.transform = isOpen ? 'rotate(45deg)' : 'scale(1)';
        }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998
          }}
        />
      )}

      {/* Controls Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '80px',
            zIndex: 9999,
            width: '320px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>
              Accessibility
            </h3>
            <button
              onClick={handleClose}
              aria-label="Close accessibility controls"
              style={{
                color: '#6b7280',
                border: 'none',
                background: 'none',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151';
                e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#6b7280';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div style={{ padding: '8px' }}>
            {/* Reduced Motion Toggle */}
            <button
              onClick={() => {
                console.log('Reduce Motion clicked, current:', reducedMotion);
                setReducedMotion(!reducedMotion);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: '500', color: '#111827' }}>
                  Reduce Motion
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Minimize animations and transitions
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: reducedMotion ? '#2563eb' : '#d1d5db',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: reducedMotion ? '26px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }} />
              </div>
            </button>

            {/* High Contrast Toggle */}
            <button
              onClick={() => {
                console.log('High Contrast clicked, current:', highContrast);
                setHighContrast(!highContrast);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: '500', color: '#111827' }}>
                  High Contrast
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Increase color contrast for better visibility
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: highContrast ? '#2563eb' : '#d1d5db',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: highContrast ? '26px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }} />
              </div>
            </button>

            {/* Font Size Control */}
            <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                Font Size
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFontSize(option.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: fontSize === option.value ? '#2563eb' : '#f3f4f6',
                      color: fontSize === option.value ? 'white' : '#111827',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (fontSize !== option.value) {
                        e.target.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (fontSize !== option.value) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Touch Target Size Control */}
            <div style={{ padding: '12px' }}>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                Touch Target Size
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {touchTargetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTouchTargetSize(option.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      textAlign: 'left',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: touchTargetSize === option.value ? '#2563eb' : '#f3f4f6',
                      color: touchTargetSize === option.value ? 'white' : '#111827',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (touchTargetSize !== option.value) {
                        e.target.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (touchTargetSize !== option.value) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Settings are saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AccessibilityStatus Component
 * Shows current accessibility settings status
 */
const AccessibilityStatus = () => {
  const {
    reducedMotion,
    highContrast,
    fontSize,
    touchTargetSize,
    screenReaderMode
  } = useAccessibility();

  const activeSettings = [];
  if (reducedMotion) activeSettings.push('Reduced Motion');
  if (highContrast) activeSettings.push('High Contrast');
  if (fontSize !== 'normal') activeSettings.push(`Font: ${fontSize}`);
  if (touchTargetSize !== 'normal') activeSettings.push(`Touch: ${touchTargetSize}`);
  if (screenReaderMode) activeSettings.push('Screen Reader');

  if (activeSettings.length === 0) return null;

  return (
    <div className="sr-only" aria-live="polite">
      Active accessibility settings: {activeSettings.join(', ')}
    </div>
  );
};

/**
 * AccessibilityAnnouncer Component
 * Announces accessibility changes to screen readers
 */
const AccessibilityAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  const accessibility = useAccessibility();

  React.useEffect(() => {
    const changes = [];
    
    if (accessibility.reducedMotion) {
      changes.push('Motion reduced');
    }
    if (accessibility.highContrast) {
      changes.push('High contrast enabled');
    }
    if (accessibility.fontSize !== 'normal') {
      changes.push(`Font size set to ${accessibility.fontSize}`);
    }
    if (accessibility.touchTargetSize !== 'normal') {
      changes.push(`Touch targets set to ${accessibility.touchTargetSize}`);
    }

    if (changes.length > 0) {
      setAnnouncement(changes.join(', '));
      // Clear announcement after a delay
      setTimeout(() => setAnnouncement(''), 3000);
    }
  }, [accessibility]);

  return (
    <div className="sr-only" aria-live="assertive" aria-atomic="true">
      {announcement}
    </div>
  );
};

export default AccessibilityControls;
export {
  AccessibilityControls,
  AccessibilityStatus,
  AccessibilityAnnouncer
};