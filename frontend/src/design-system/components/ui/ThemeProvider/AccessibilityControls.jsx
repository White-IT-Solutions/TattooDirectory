"use client";

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { cn } from '../../../utils/cn';

/**
 * AccessibilityControls - Comprehensive accessibility preference controls
 * 
 * Features:
 * - High contrast mode toggle
 * - Reduced motion preference
 * - Font size adjustment
 * - Focus indicator enhancement
 * - Screen reader announcements
 */
export function AccessibilityControls({ 
  variant = 'panel',
  className,
  ...props 
}) {
  const { 
    isHighContrast, 
    setHighContrast, 
    isReducedMotion,
    mounted 
  } = useTheme();

  if (!mounted) {
    return (
      <div className={cn('animate-pulse bg-neutral-200 rounded-lg h-32 w-64', className)} />
    );
  }

  if (variant === 'compact') {
    return <CompactAccessibilityControls className={className} {...props} />;
  }

  return (
    <div
      className={cn(
        'rounded-lg p-6 space-y-4',
        'transition-colors duration-200',
        className
      )}
      style={{
        backgroundColor: 'var(--background-primary)',
        borderColor: 'var(--border-primary)',
        border: '1px solid'
      }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Accessibility
        </h3>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Preferences
        </span>
      </div>

      {/* High Contrast Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label 
            htmlFor="high-contrast-toggle"
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            High Contrast
          </label>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Increase contrast for better visibility
          </p>
        </div>
        <ToggleSwitch
          id="high-contrast-toggle"
          checked={isHighContrast}
          onChange={setHighContrast}
          aria-label="Toggle high contrast mode"
        />
      </div>

      {/* Reduced Motion Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Reduced Motion
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {isReducedMotion 
              ? 'System preference detected - animations reduced'
              : 'Full animations enabled'
            }
          </p>
        </div>
        <div className={cn(
          'w-3 h-3 rounded-full',
          isReducedMotion 
            ? 'bg-warning-500' 
            : 'bg-success-500'
        )} />
      </div>

      {/* Font Size Controls */}
      <FontSizeControls />

      {/* Focus Enhancement */}
      <FocusEnhancementToggle />
    </div>
  );
}

/**
 * CompactAccessibilityControls - Minimal accessibility controls
 */
function CompactAccessibilityControls({ className, ...props }) {
  const { isHighContrast, setHighContrast, isReducedMotion } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        'bg-neutral-50 dark:bg-neutral-800',
        'border border-neutral-200 dark:border-neutral-700',
        'rounded-lg px-3 py-2',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      {/* High Contrast Toggle */}
      <button
        onClick={() => setHighContrast(!isHighContrast)}
        className={cn(
          'inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isHighContrast
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
        )}
        aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      >
        <span className="text-sm">🔍</span>
        HC
      </button>

      {/* Reduced Motion Indicator */}
      <div 
        className="inline-flex items-center gap-2 px-2 py-1 text-xs"
        title={isReducedMotion ? 'Reduced motion active' : 'Full animations enabled'}
      >
        <div className={cn(
          'w-2 h-2 rounded-full',
          isReducedMotion ? 'bg-warning-500' : 'bg-success-500'
        )} />
        <span className="text-neutral-600 dark:text-neutral-400">
          {isReducedMotion ? 'RM' : 'AN'}
        </span>
      </div>
    </div>
  );
}

/**
 * ToggleSwitch - Accessible toggle switch component
 */
function ToggleSwitch({ 
  id,
  checked, 
  onChange, 
  disabled = false,
  size = 'md',
  className,
  ...props 
}) {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        // Base styles
        'relative inline-flex items-center',
        'rounded-full border-2 border-transparent',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Size variants
        sizeClasses[size],
        // State styles
        checked
          ? 'bg-primary-500 hover:bg-primary-600'
          : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          // Base thumb styles
          'inline-block rounded-full bg-white shadow-sm',
          'transition-transform duration-200 ease-out',
          // Size variants
          thumbSizeClasses[size],
          // Position based on state
          checked 
            ? size === 'sm' ? 'translate-x-4' : size === 'md' ? 'translate-x-5' : 'translate-x-6'
            : 'translate-x-0'
        )}
      />
    </button>
  );
}

/**
 * FontSizeControls - Font size adjustment controls
 */
function FontSizeControls() {
  const handleFontSizeChange = (scale) => {
    const root = document.documentElement;
    root.style.fontSize = `${16 * scale}px`;
    
    // Persist font size preference
    localStorage.setItem('tattoo-directory-font-scale', scale.toString());
    
    // Announce change to screen readers
    const announcement = `Font size ${scale === 1 ? 'reset to normal' : scale > 1 ? 'increased' : 'decreased'}`;
    announceToScreenReader(announcement);
  };

  const getCurrentFontScale = () => {
    const stored = localStorage.getItem('tattoo-directory-font-scale');
    return stored ? parseFloat(stored) : 1;
  };

  const currentScale = getCurrentFontScale();

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Font Size
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Adjust text size for better readability
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFontSizeChange(0.9)}
          className={cn(
            'w-8 h-8 rounded-md border border-neutral-300 dark:border-neutral-600',
            'flex items-center justify-center text-sm font-medium',
            'transition-colors duration-200',
            'hover:bg-neutral-100 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            currentScale === 0.9 && 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
          )}
          aria-label="Decrease font size"
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange(1)}
          className={cn(
            'w-8 h-8 rounded-md border border-neutral-300 dark:border-neutral-600',
            'flex items-center justify-center text-base font-medium',
            'transition-colors duration-200',
            'hover:bg-neutral-100 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            currentScale === 1 && 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
          )}
          aria-label="Normal font size"
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange(1.1)}
          className={cn(
            'w-8 h-8 rounded-md border border-neutral-300 dark:border-neutral-600',
            'flex items-center justify-center text-lg font-medium',
            'transition-colors duration-200',
            'hover:bg-neutral-100 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            currentScale === 1.1 && 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
          )}
          aria-label="Increase font size"
        >
          A
        </button>
      </div>
    </div>
  );
}

/**
 * FocusEnhancementToggle - Enhanced focus indicators
 */
function FocusEnhancementToggle() {
  const [enhancedFocus, setEnhancedFocus] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tattoo-directory-enhanced-focus');
    setEnhancedFocus(stored === 'true');
  }, []);

  const handleToggle = (enabled) => {
    setEnhancedFocus(enabled);
    localStorage.setItem('tattoo-directory-enhanced-focus', enabled.toString());
    
    // Apply enhanced focus styles
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    announceToScreenReader(`Enhanced focus indicators ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label 
          htmlFor="enhanced-focus-toggle"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Enhanced Focus
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Stronger focus indicators for keyboard navigation
        </p>
      </div>
      <ToggleSwitch
        id="enhanced-focus-toggle"
        checked={enhancedFocus}
        onChange={handleToggle}
        aria-label="Toggle enhanced focus indicators"
      />
    </div>
  );
}

/**
 * Announce changes to screen readers
 */
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export default AccessibilityControls;