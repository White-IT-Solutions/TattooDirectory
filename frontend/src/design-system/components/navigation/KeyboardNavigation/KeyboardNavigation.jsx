"use client";

import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cva } from '../../../utils/cn';

// Keyboard Navigation Context
const KeyboardNavigationContext = createContext({
  isKeyboardMode: false,
  setKeyboardMode: () => {},
  focusedElement: null,
  setFocusedElement: () => {}
});

// Focus indicator variants
const focusIndicatorVariants = cva(
  [
    'absolute pointer-events-none z-50',
    'border-2 border-[var(--interactive-primary)]',
    'rounded-[var(--radius)]',
    'transition-all duration-150 ease-out',
    'shadow-lg shadow-[var(--interactive-primary)]/20'
  ].join(' '),
  {
    variants: {
      visible: {
        true: 'opacity-100 scale-100',
        false: 'opacity-0 scale-95'
      }
    },
    defaultVariants: {
      visible: false
    }
  }
);

// Skip link variants
const skipLinkVariants = cva(
  [
    'absolute top-0 left-0 z-[9999]',
    'bg-[var(--interactive-primary)] text-white',
    'px-4 py-2 rounded-br-[var(--radius)]',
    'font-semibold text-sm',
    'transition-transform duration-200',
    'focus:outline-none'
  ].join(' '),
  {
    variants: {
      visible: {
        true: 'translate-y-0',
        false: '-translate-y-full'
      }
    },
    defaultVariants: {
      visible: false
    }
  }
);

// Keyboard shortcuts help variants
const shortcutsHelpVariants = cva(
  [
    'fixed bottom-4 right-4 z-50',
    'bg-[var(--background-primary)]',
    'border border-[var(--border-primary)]',
    'rounded-[var(--radius-lg)]',
    'shadow-xl shadow-[var(--shadow-color)]/20',
    'p-4 max-w-sm',
    'transition-all duration-300 ease-out'
  ].join(' '),
  {
    variants: {
      visible: {
        true: 'opacity-100 translate-y-0 scale-100',
        false: 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }
    },
    defaultVariants: {
      visible: false
    }
  }
);

// Default keyboard shortcuts
const defaultShortcuts = [
  { key: '/', description: 'Focus search', action: 'focusSearch' },
  { key: 'Escape', description: 'Close modals/menus', action: 'escape' },
  { key: 'Tab', description: 'Navigate forward', action: 'tab' },
  { key: 'Shift+Tab', description: 'Navigate backward', action: 'shiftTab' },
  { key: 'Enter', description: 'Activate element', action: 'enter' },
  { key: 'Space', description: 'Activate buttons', action: 'space' },
  { key: 'Arrow Keys', description: 'Navigate lists/menus', action: 'arrows' },
  { key: '?', description: 'Show keyboard shortcuts', action: 'help' }
];

// Skip links configuration
const defaultSkipLinks = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' }
];

// Hook for keyboard navigation context
const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
};

// Focus trap utility
const useFocusTrap = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive, containerRef]);
};

// Focus indicator component
const FocusIndicator = ({ targetElement, visible }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!targetElement || !visible) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 2,
        left: rect.left + window.scrollX - 2,
        width: rect.width + 4,
        height: rect.height + 4
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetElement, visible]);

  if (!visible || !targetElement) return null;

  return (
    <div
      className={focusIndicatorVariants({ visible })}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height
      }}
      aria-hidden="true"
    />
  );
};

// Skip links component
const SkipLinks = ({ links = defaultSkipLinks, className }) => {
  const [activeLink, setActiveLink] = useState(null);

  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className={skipLinkVariants({ 
            visible: activeLink === index,
            className 
          })}
          onFocus={() => setActiveLink(index)}
          onBlur={() => setActiveLink(null)}
          style={{ top: `${index * 40}px` }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Keyboard shortcuts help component
const KeyboardShortcutsHelp = ({ shortcuts = defaultShortcuts, visible, onClose }) => {
  const helpRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  useFocusTrap(visible && mounted, helpRef);

  useEffect(() => {
    if (!visible || !mounted) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    const handleClickOutside = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    // Auto-close after 30 seconds as a safety measure
    const autoCloseTimer = setTimeout(() => {
      onClose?.();
    }, 30000);

    document.addEventListener('keydown', handleEscape, true);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(autoCloseTimer);
    };
  }, [visible, onClose, mounted]);

  // Don't render anything if not visible or not mounted
  if (!visible || !mounted || typeof window === 'undefined') {
    return null;
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
        onDoubleClick={onClose}
        aria-hidden="true"
        data-keyboard-shortcuts-backdrop="true"
      />
      
      {/* Modal */}
      <div 
        ref={helpRef}
        className={shortcutsHelpVariants({ visible })}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
      <div className="flex items-center justify-between mb-3">
        <h3 id="shortcuts-title" className="font-semibold text-[var(--text-primary)]">
          Keyboard Shortcuts
        </h3>
        <button
          onClick={onClose}
          onDoubleClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--interactive-secondary)]"
          aria-label="Close shortcuts help"
          title="Close (or press Escape)"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded text-xs font-mono">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
      
      {/* Footer with close instructions */}
      <div className="mt-4 pt-3 border-t border-[var(--border-muted)] text-center">
        <p className="text-xs text-[var(--text-muted)]">
          Press <kbd className="px-1 py-0.5 bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded text-xs">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
    </>
  );

  // Use createPortal to render the modal safely
  try {
    return createPortal(modalContent, document.body);
  } catch (error) {
    // Fallback to regular rendering if portal fails
    console.warn('Portal rendering failed, falling back to regular rendering:', error);
    return modalContent;
  }
};

// Main keyboard navigation provider
const KeyboardNavigationProvider = ({ 
  children, 
  showFocusIndicator = true,
  showSkipLinks = true,
  shortcuts = defaultShortcuts,
  skipLinks = defaultSkipLinks,
  onShortcut
}) => {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [focusedElement, setFocusedElement] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const lastInteractionRef = useRef('mouse');

  // Emergency escape mechanism
  useEffect(() => {
    window.forceCloseKeyboardShortcuts = () => {
      setShowShortcutsHelp(false);
      // Also force remove any stuck backdrop elements
      setTimeout(() => {
        document.querySelectorAll('[data-keyboard-shortcuts-backdrop="true"]').forEach(el => el.remove());
        document.querySelectorAll('.backdrop-blur-sm').forEach(el => {
          if (el.classList.contains('fixed') && el.classList.contains('inset-0')) {
            el.remove();
          }
        });
        document.querySelectorAll('.z-40.fixed.inset-0').forEach(el => el.remove());
      }, 100);
    };
    
    return () => {
      delete window.forceCloseKeyboardShortcuts;
      // Cleanup any stuck backdrops on unmount
      document.querySelectorAll('[data-keyboard-shortcuts-backdrop="true"]').forEach(el => el.remove());
    };
  }, []);

  // Detect keyboard vs mouse usage
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) {
        if (lastInteractionRef.current !== 'keyboard') {
          lastInteractionRef.current = 'keyboard';
          setIsKeyboardMode(true);
        }
      }

      // Handle global shortcuts
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        );
        
        if (!isInInput) {
          e.preventDefault();
          const searchInput = document.querySelector('[type="search"], [placeholder*="search" i]');
          searchInput?.focus();
          onShortcut?.('focusSearch', e);
        }
      }

      if (e.key === '?' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowShortcutsHelp(prev => !prev);
        onShortcut?.('help', e);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowShortcutsHelp(false);
        onShortcut?.('escape', e);
      }
    };

    const handleMouseDown = () => {
      if (lastInteractionRef.current !== 'mouse') {
        lastInteractionRef.current = 'mouse';
        setIsKeyboardMode(false);
        setFocusedElement(null);
      }
    };

    const handleFocus = (e) => {
      if (lastInteractionRef.current === 'keyboard') {
        setFocusedElement(e.target);
      }
    };

    const handleBlur = () => {
      if (lastInteractionRef.current === 'keyboard') {
        // Small delay to allow focus to move to new element
        setTimeout(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            setFocusedElement(null);
          }
        }, 10);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [onShortcut]);

  const contextValue = {
    isKeyboardMode,
    setKeyboardMode: setIsKeyboardMode,
    focusedElement,
    setFocusedElement
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {/* Skip Links */}
      {showSkipLinks && <SkipLinks links={skipLinks} />}
      
      {/* Focus Indicator */}
      {showFocusIndicator && (
        <FocusIndicator 
          targetElement={focusedElement} 
          visible={isKeyboardMode && !!focusedElement} 
        />
      )}
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        visible={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

// Enhanced focusable component wrapper
const Focusable = ({ 
  children, 
  onFocus, 
  onBlur, 
  onKeyDown,
  focusKey,
  className,
  ...props 
}) => {
  const { isKeyboardMode, setFocusedElement } = useKeyboardNavigation();
  const elementRef = useRef(null);

  const handleFocus = (e) => {
    if (isKeyboardMode) {
      setFocusedElement(e.target);
    }
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    if (isKeyboardMode) {
      setFocusedElement(null);
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e) => {
    // Handle focus key shortcut
    if (focusKey && e.key === focusKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      elementRef.current?.focus();
    }
    onKeyDown?.(e);
  };

  useEffect(() => {
    if (focusKey) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [focusKey]);

  return React.cloneElement(children, {
    ref: elementRef,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    className: `${children.props.className || ''} ${className || ''}`.trim(),
    ...props
  });
};

export default KeyboardNavigationProvider;
export { 
  KeyboardNavigationProvider,
  useKeyboardNavigation,
  useFocusTrap,
  Focusable,
  SkipLinks,
  KeyboardShortcutsHelp,
  FocusIndicator
};