"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cva } from '../../../utils/cn';
import Button from '../../ui/Button/Button';
import Card from '../../ui/Card/Card';

// Contextual Help Context
const ContextualHelpContext = createContext({
  isOnboardingActive: false,
  currentStep: 0,
  startOnboarding: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipOnboarding: () => {},
  showHelp: () => {},
  hideHelp: () => {}
});

// Help tooltip variants
const helpTooltipVariants = cva(
  [
    'absolute z-50 max-w-xs',
    'bg-[var(--background-primary)]',
    'border border-[var(--border-primary)]',
    'rounded-[var(--radius-lg)]',
    'shadow-xl shadow-[var(--shadow-color)]/20',
    'p-4',
    'transition-all duration-200 ease-out'
  ].join(' '),
  {
    variants: {
      visible: {
        true: 'opacity-100 scale-100',
        false: 'opacity-0 scale-95 pointer-events-none'
      },
      position: {
        top: '-translate-y-full -translate-x-1/2 mb-2',
        bottom: 'translate-y-full -translate-x-1/2 mt-2',
        left: '-translate-x-full -translate-y-1/2 mr-2',
        right: 'translate-x-full -translate-y-1/2 ml-2',
        'top-left': '-translate-y-full mb-2',
        'top-right': '-translate-y-full -translate-x-full mb-2',
        'bottom-left': 'translate-y-full mt-2',
        'bottom-right': 'translate-y-full -translate-x-full mt-2'
      }
    },
    defaultVariants: {
      visible: false,
      position: 'top'
    }
  }
);

// Onboarding overlay variants
const onboardingOverlayVariants = cva(
  [
    'fixed inset-0 z-40',
    'bg-black/50 backdrop-blur-sm',
    'transition-opacity duration-300'
  ].join(' '),
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0 pointer-events-none'
      }
    },
    defaultVariants: {
      visible: false
    }
  }
);

// Spotlight variants
const spotlightVariants = cva(
  [
    'absolute z-50',
    'border-4 border-[var(--interactive-primary)]',
    'rounded-[var(--radius-lg)]',
    'shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
    'transition-all duration-500 ease-out'
  ].join(' ')
);

// Help trigger button variants
const helpTriggerVariants = cva(
  [
    'fixed bottom-4 left-4 z-30',
    'w-12 h-12 rounded-full',
    'bg-[var(--interactive-primary)]',
    'text-white',
    'shadow-lg shadow-[var(--interactive-primary)]/30',
    'transition-all duration-200',
    'hover:scale-110 hover:shadow-xl',
    'focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2'
  ].join(' ')
);

// Default onboarding steps
const defaultOnboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Tattoo Directory',
    content: 'Find the perfect tattoo artist for your next piece. Let us show you around!',
    target: null,
    position: 'center'
  },
  {
    id: 'search',
    title: 'Smart Search',
    content: 'Use our smart search to find artists by name, style, location, or studio. Try typing "/" to quickly focus the search.',
    target: '[type="search"], [placeholder*="search" i]',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Easy Navigation',
    content: 'Browse artists, studios, and styles using our main navigation. On mobile, tap the menu button for full navigation.',
    target: 'nav, [role="navigation"]',
    position: 'bottom'
  },
  {
    id: 'filters',
    title: 'Filter & Discover',
    content: 'Use filters to narrow down your search by style, location, and other preferences.',
    target: '[data-testid="style-filter"], .style-filter',
    position: 'top'
  }
];

// Help content database
const helpContent = {
  search: {
    title: 'Search Tips',
    content: 'Try searching for artist names, tattoo styles (like "traditional" or "realism"), studio names, or locations. Use quotes for exact phrases.',
    shortcuts: ['Press "/" to focus search', 'Use arrow keys to navigate results', 'Press Enter to select']
  },
  filters: {
    title: 'Using Filters',
    content: 'Filters help you narrow down results. You can combine multiple filters to find exactly what you\'re looking for.',
    shortcuts: ['Click multiple styles to combine them', 'Use location filter for nearby artists', 'Clear all filters with the "Clear" button']
  },
  navigation: {
    title: 'Navigation Help',
    content: 'Use the main navigation to browse different sections. On mobile, the menu button reveals all navigation options.',
    shortcuts: ['Tab to navigate with keyboard', 'Press "?" for keyboard shortcuts', 'Use breadcrumbs to see your location']
  },
  artists: {
    title: 'Artist Profiles',
    content: 'Artist profiles show portfolios, styles, contact information, and availability. Click on any artist card to view their full profile.',
    shortcuts: ['Click portfolio images for larger view', 'Use contact buttons to get in touch', 'Check availability status']
  }
};

// Hook for contextual help
const useContextualHelp = () => {
  const context = useContext(ContextualHelpContext);
  if (!context) {
    throw new Error('useContextualHelp must be used within ContextualHelpProvider');
  }
  return context;
};

// Help tooltip component
const HelpTooltip = ({ 
  target, 
  content, 
  title, 
  visible, 
  position = 'top',
  onClose,
  showArrow = true 
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!target || !visible) return;

    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;

    if (!targetElement || !tooltipRef.current) return;

    const updatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 8;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + 8;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + 8;
          break;
        default:
          top = targetRect.bottom + 8;
          left = targetRect.left;
      }

      // Keep tooltip within viewport
      if (left < 8) left = 8;
      if (left + tooltipRect.width > viewport.width - 8) {
        left = viewport.width - tooltipRect.width - 8;
      }
      if (top < 8) top = 8;
      if (top + tooltipRect.height > viewport.height - 8) {
        top = viewport.height - tooltipRect.height - 8;
      }

      setTooltipPosition({ top: top + window.scrollY, left: left + window.scrollX });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [target, visible, position]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className={helpTooltipVariants({ visible, position })}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left
      }}
      role="tooltip"
      aria-live="polite"
    >
      {title && (
        <h4 className="font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h4>
      )}
      <div className="text-sm text-[var(--text-secondary)] mb-3">
        {content}
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Got it
        </Button>
      </div>
      
      {/* Arrow */}
      {showArrow && (
        <div 
          className={`absolute w-3 h-3 bg-[var(--background-primary)] border-[var(--border-primary)] transform rotate-45 ${
            position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
            position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
            position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
            'left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
          }`}
        />
      )}
    </div>
  );
};

// Onboarding spotlight component
const OnboardingSpotlight = ({ target, visible }) => {
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!target || !visible) return;

    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;

    if (!targetElement) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      setSpotlightPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX - 8,
        width: rect.width + 16,
        height: rect.height + 16
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [target, visible]);

  if (!visible || !target) return null;

  return (
    <div
      className={spotlightVariants()}
      style={{
        top: spotlightPosition.top,
        left: spotlightPosition.left,
        width: spotlightPosition.width,
        height: spotlightPosition.height
      }}
    />
  );
};

// Onboarding step component
const OnboardingStep = ({ 
  step, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip, 
  onFinish 
}) => {
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  if (step.position === 'center') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">
            {step.title}
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {step.content}
          </p>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onSkip}
            >
              Skip Tour
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[var(--text-secondary)]">
                {currentStep + 1} of {totalSteps}
              </span>
              <Button
                variant="primary"
                onClick={isLast ? onFinish : onNext}
              >
                {isLast ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <HelpTooltip
      target={step.target}
      title={step.title}
      content={
        <>
          <div className="mb-4">{step.content}</div>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {!isFirst && (
                <Button variant="ghost" size="sm" onClick={onPrev}>
                  Previous
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[var(--text-secondary)]">
                {currentStep + 1}/{totalSteps}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={isLast ? onFinish : onNext}
              >
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </>
      }
      visible={true}
      position={step.position}
      showArrow={true}
    />
  );
};

// Main contextual help provider
const ContextualHelpProvider = ({ 
  children, 
  onboardingSteps = defaultOnboardingSteps,
  showHelpTrigger = true,
  autoStartOnboarding = false
}) => {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeHelp, setActiveHelp] = useState(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const seen = localStorage.getItem('tattoo-directory-onboarding-seen');
    setHasSeenOnboarding(!!seen);
    
    if (autoStartOnboarding && !seen) {
      // Start onboarding after a short delay
      setTimeout(() => {
        startOnboarding();
      }, 1000);
    }
  }, [autoStartOnboarding]);

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
    setActiveHelp(null);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipOnboarding = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
    localStorage.setItem('tattoo-directory-onboarding-seen', 'true');
    setHasSeenOnboarding(true);
  };

  const showHelp = (helpKey) => {
    setActiveHelp(helpKey);
    setIsOnboardingActive(false);
  };

  const hideHelp = () => {
    setActiveHelp(null);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (isOnboardingActive) {
          skipOnboarding();
        } else if (activeHelp) {
          hideHelp();
        }
      }
    };

    document.addEventListener('keydown', handleEscape, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOnboardingActive, activeHelp]);

  const contextValue = {
    isOnboardingActive,
    currentStep,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    showHelp,
    hideHelp
  };

  const currentOnboardingStep = onboardingSteps[currentStep];

  // Render onboarding overlays safely
  const renderOnboardingOverlays = () => {
    if (typeof window === 'undefined') return null;
    
    const overlays = (
      <>
        {/* Onboarding Overlay */}
        {isOnboardingActive && (
          <div className={onboardingOverlayVariants({ visible: isOnboardingActive })} />
        )}

        {/* Onboarding Spotlight */}
        {isOnboardingActive && currentOnboardingStep?.target && (
          <OnboardingSpotlight
            target={currentOnboardingStep.target}
            visible={isOnboardingActive}
          />
        )}

        {/* Onboarding Step */}
        {isOnboardingActive && currentOnboardingStep && (
          <OnboardingStep
            step={currentOnboardingStep}
            currentStep={currentStep}
            totalSteps={onboardingSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipOnboarding}
            onFinish={finishOnboarding}
          />
        )}
      </>
    );

    try {
      return createPortal(overlays, document.body);
    } catch (error) {
      console.warn('Portal rendering failed for onboarding overlays:', error);
      return overlays;
    }
  };

  return (
    <ContextualHelpContext.Provider value={contextValue}>
      {children}

      {/* Render onboarding overlays via portal */}
      {renderOnboardingOverlays()}

      {/* Active Help Tooltip */}
      {activeHelp && helpContent[activeHelp] && (
        <HelpTooltip
          target={`[data-help="${activeHelp}"]`}
          title={helpContent[activeHelp].title}
          content={
            <>
              <div className="mb-3">{helpContent[activeHelp].content}</div>
              {helpContent[activeHelp].shortcuts && (
                <div className="mb-3">
                  <div className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                    Shortcuts
                  </div>
                  <ul className="text-xs space-y-1">
                    {helpContent[activeHelp].shortcuts.map((shortcut, index) => (
                      <li key={index} className="text-[var(--text-secondary)]">
                        • {shortcut}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          }
          visible={true}
          onClose={hideHelp}
        />
      )}

      {/* Help Trigger Button */}
      {showHelpTrigger && (
        <button
          className={helpTriggerVariants()}
          onClick={() => hasSeenOnboarding ? showHelp('navigation') : startOnboarding()}
          aria-label={hasSeenOnboarding ? 'Show help' : 'Start onboarding tour'}
          title={hasSeenOnboarding ? 'Help & Tips' : 'Take a tour'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </ContextualHelpContext.Provider>
  );
};

export default ContextualHelpProvider;
export { 
  ContextualHelpProvider,
  useContextualHelp,
  HelpTooltip,
  OnboardingSpotlight,
  helpContent
};