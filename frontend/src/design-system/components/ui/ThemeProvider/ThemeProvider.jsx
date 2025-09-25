"use client";

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

/**
 * ThemeProvider - Comprehensive theme management system
 * 
 * Features:
 * - Light/Dark mode with system preference detection
 * - Theme persistence across browser sessions
 * - Smooth transitions between theme changes
 * - High contrast mode support for accessibility
 * - Reduced motion support
 * - Automatic system preference listening
 */
export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'tattoo-directory-theme',
  enableTransitions = true,
  attribute = 'class',
  themeValues = {
    light: 'light',
    dark: 'dark'
  }
}) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [actualTheme, setActualTheme] = useState('light');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Get stored theme preference
    const stored = localStorage.getItem(storageKey);
    const initialTheme = stored || defaultTheme;
    
    // Get system preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Set initial states
    setThemeState(initialTheme);
    setIsHighContrast(prefersHighContrast);
    setIsReducedMotion(prefersReducedMotion);
    
    // Determine actual theme
    const resolvedTheme = initialTheme === 'system' ? (prefersDark ? 'dark' : 'light') : initialTheme;
    setActualTheme(resolvedTheme);
    
    // Apply theme to document
    applyTheme(resolvedTheme, prefersHighContrast, prefersReducedMotion);
  }, [defaultTheme, storageKey]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-motion: reduce)')
    ];

    const handleSystemChange = () => {
      const prefersDark = mediaQueries[0].matches;
      const prefersHighContrast = mediaQueries[1].matches;
      const prefersReducedMotion = mediaQueries[2].matches;
      
      setIsHighContrast(prefersHighContrast);
      setIsReducedMotion(prefersReducedMotion);
      
      // Only update actual theme if using system preference
      if (theme === 'system') {
        const newActualTheme = prefersDark ? 'dark' : 'light';
        setActualTheme(newActualTheme);
        applyTheme(newActualTheme, prefersHighContrast, prefersReducedMotion);
      } else {
        // Still apply accessibility preferences even with manual theme
        applyTheme(actualTheme, prefersHighContrast, prefersReducedMotion);
      }
    };

    // Add listeners
    mediaQueries.forEach(mq => mq.addEventListener('change', handleSystemChange));

    // Cleanup
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleSystemChange));
    };
  }, [mounted, theme, actualTheme]);

  /**
   * Apply theme to document with smooth transitions
   */
  const applyTheme = (resolvedTheme, highContrast = isHighContrast, reducedMotion = isReducedMotion) => {
    const root = document.documentElement;
    
    // Add transition class for smooth theme changes
    if (enableTransitions && !reducedMotion) {
      root.classList.add('theme-transitioning');
      
      // Remove transition class after animation completes
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 300);
    }

    // Apply theme class
    if (attribute === 'class') {
      root.classList.remove(themeValues.light, themeValues.dark);
      root.classList.add(themeValues[resolvedTheme]);
    } else {
      root.setAttribute(attribute, themeValues[resolvedTheme]);
    }

    // Apply accessibility classes
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(resolvedTheme);
  };

  /**
   * Update meta theme-color for mobile browser chrome
   */
  const updateMetaThemeColor = (resolvedTheme) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colors = {
      light: '#ffffff',
      dark: '#4a474d'
    };

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors[resolvedTheme]);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = colors[resolvedTheme];
      document.head.appendChild(meta);
    }
  };

  /**
   * Set theme with persistence and smooth transitions
   */
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    
    // Persist theme preference
    if (newTheme === 'system') {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, newTheme);
    }

    // Determine actual theme
    let resolvedTheme = newTheme;
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    setActualTheme(resolvedTheme);
    applyTheme(resolvedTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    if (theme === 'system') {
      // If system, switch to opposite of current actual theme
      setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If manual theme, toggle between light and dark
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  /**
   * Set high contrast mode
   */
  const setHighContrast = (enabled) => {
    setIsHighContrast(enabled);
    applyTheme(actualTheme, enabled, isReducedMotion);
    
    // Persist high contrast preference
    localStorage.setItem('tattoo-directory-high-contrast', enabled.toString());
  };

  /**
   * Get theme icon for UI display
   */
  const getThemeIcon = () => {
    if (theme === 'system') {
      return actualTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  /**
   * Get theme label for UI display
   */
  const getThemeLabel = () => {
    const labels = {
      light: 'Light',
      dark: 'Dark',
      system: `System (${actualTheme === 'dark' ? 'Dark' : 'Light'})`
    };
    return labels[theme] || 'Unknown';
  };

  const contextValue = {
    theme,
    setTheme,
    toggleTheme,
    actualTheme,
    isHighContrast,
    setHighContrast,
    isReducedMotion,
    getThemeIcon,
    getThemeLabel,
    mounted
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {/* Prevent hydration mismatch by hiding content until mounted */}
      {!mounted ? (
        <div style={{ visibility: 'hidden' }}>{children}</div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

export default ThemeProvider;