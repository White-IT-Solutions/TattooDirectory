"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { KeyboardNavigationProvider } from '../navigation/KeyboardNavigation/KeyboardNavigation';
import { GestureSupport } from '../navigation/GestureSupport/GestureSupport';

// Accessibility Context
const AccessibilityContext = createContext({
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  touchTargetSize: 'normal',
  screenReaderMode: false,
  setReducedMotion: () => {},
  setHighContrast: () => {},
  setFontSize: () => {},
  setTouchTargetSize: () => {},
  setScreenReaderMode: () => {}
});

// Hook for accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Accessibility Provider Component
const AccessibilityProvider = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [touchTargetSize, setTouchTargetSize] = useState('normal');
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // Detect user preferences on mount
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    setHighContrast(prefersHighContrast);

    // Check for screen reader usage
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis?.getVoices().length > 0;
    setScreenReaderMode(hasScreenReader);

    // Load saved preferences
    const savedPreferences = localStorage.getItem('accessibility-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setFontSize(preferences.fontSize || 'normal');
        setTouchTargetSize(preferences.touchTargetSize || 'normal');
        if (preferences.highContrast !== undefined) {
          setHighContrast(preferences.highContrast);
        }
        if (preferences.reducedMotion !== undefined) {
          setReducedMotion(preferences.reducedMotion);
        }
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const preferences = {
      fontSize,
      touchTargetSize,
      highContrast,
      reducedMotion
    };
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [fontSize, touchTargetSize, highContrast, reducedMotion]);

  // Apply accessibility classes to document
  useEffect(() => {
    const classes = [];
    
    if (reducedMotion) classes.push('reduce-motion');
    if (highContrast) classes.push('high-contrast');
    if (fontSize !== 'normal') classes.push(`font-size-${fontSize}`);
    if (touchTargetSize !== 'normal') classes.push(`touch-target-${touchTargetSize}`);
    if (screenReaderMode) classes.push('screen-reader-mode');

    // Remove existing accessibility classes
    document.documentElement.classList.remove(
      'reduce-motion', 'high-contrast', 'screen-reader-mode',
      'font-size-small', 'font-size-large', 'font-size-extra-large',
      'touch-target-large', 'touch-target-extra-large'
    );

    // Add current accessibility classes
    if (classes.length > 0) {
      document.documentElement.classList.add(...classes);
    }
  }, [reducedMotion, highContrast, fontSize, touchTargetSize, screenReaderMode]);

  const contextValue = {
    reducedMotion,
    highContrast,
    fontSize,
    touchTargetSize,
    screenReaderMode,
    setReducedMotion,
    setHighContrast,
    setFontSize,
    setTouchTargetSize,
    setScreenReaderMode
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <KeyboardNavigationProvider>
        <GestureSupport enableSwipeNavigation={true} enablePullToRefresh={false}>
          {children}
        </GestureSupport>
      </KeyboardNavigationProvider>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;