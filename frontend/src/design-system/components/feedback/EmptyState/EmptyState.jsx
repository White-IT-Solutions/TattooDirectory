"use client";

import { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import Button from '../../ui/Button/Button';

/**
 * Branded empty state illustrations for the tattoo directory
 * Features tattoo-themed graphics that reflect the creative industry
 */
export function EmptyStateIllustration({ variant = 'search', className }) {
  const illustrations = {
    search: (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="No search results illustration"
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="var(--color-neutral-50)" 
          stroke="var(--color-neutral-200)" 
          strokeWidth="2"
        />
        
        {/* Large magnifying glass */}
        <circle 
          cx="85" 
          cy="85" 
          r="25" 
          fill="none"
          stroke="var(--color-neutral-400)" 
          strokeWidth="3"
        />
        <path 
          d="M105 105 L125 125" 
          stroke="var(--color-neutral-400)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        
        {/* Empty search area with question mark */}
        <circle 
          cx="85" 
          cy="85" 
          r="15" 
          fill="var(--color-neutral-100)"
          stroke="var(--color-neutral-300)"
          strokeWidth="1"
        />
        <text 
          x="85" 
          y="92" 
          textAnchor="middle" 
          fontSize="16" 
          fill="var(--color-neutral-500)"
          fontFamily="var(--font-family-body)"
          fontWeight="bold"
        >
          ?
        </text>
        
        {/* Floating tattoo elements around the search */}
        <g fill="var(--color-primary-300)" opacity="0.4">
          {/* Star */}
          <path d="M140 60 L142 66 L148 66 L143 70 L145 76 L140 72 L135 76 L137 70 L132 66 L138 66 Z" />
          
          {/* Heart */}
          <path d="M50 130 C50 125 55 120 60 125 C65 120 70 125 70 130 C70 135 60 145 60 145 C60 145 50 135 50 130 Z" />
          
          {/* Lightning bolt */}
          <path d="M160 140 L165 130 L162 130 L168 115 L163 125 L166 125 L160 140 Z" />
          
          {/* Anchor */}
          <g transform="translate(40, 50)">
            <circle cx="10" cy="8" r="3" fill="none" stroke="var(--color-primary-300)" strokeWidth="1"/>
            <path d="M10 11 L10 20" stroke="var(--color-primary-300)" strokeWidth="1"/>
            <path d="M5 18 Q10 23 15 18" stroke="var(--color-primary-300)" strokeWidth="1" fill="none"/>
            <path d="M6 15 L14 15" stroke="var(--color-primary-300)" strokeWidth="1"/>
          </g>
        </g>
        
        {/* Subtle message bubble */}
        <ellipse 
          cx="100" 
          cy="160" 
          rx="40" 
          ry="12" 
          fill="var(--background-primary)" 
          stroke="var(--border-primary)" 
          strokeWidth="1"
          opacity="0.9"
        />
        <text 
          x="100" 
          y="165" 
          textAnchor="middle" 
          fontSize="9" 
          fill="var(--text-secondary)"
          fontFamily="var(--font-family-body)"
        >
          No matches found
        </text>
      </svg>
    ),

    onboarding: (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Welcome onboarding illustration"
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="var(--color-primary-50)" 
          stroke="var(--color-primary-200)" 
          strokeWidth="2"
        />
        
        {/* Welcome tattoo machine */}
        <g transform="translate(70, 70)">
          {/* Machine body */}
          <rect 
            x="0" 
            y="10" 
            width="50" 
            height="20" 
            rx="4" 
            fill="var(--color-primary-400)"
            stroke="var(--color-primary-500)"
            strokeWidth="1"
          />
          
          {/* Grip */}
          <rect 
            x="5" 
            y="30" 
            width="6" 
            height="30" 
            rx="3" 
            fill="var(--color-primary-500)"
          />
          
          {/* Needle assembly */}
          <rect 
            x="40" 
            y="17" 
            width="12" 
            height="3" 
            fill="var(--color-neutral-500)"
          />
          <rect 
            x="52" 
            y="18" 
            width="8" 
            height="1" 
            fill="var(--color-accent-500)"
          />
          
          {/* Power cord */}
          <path 
            d="M0 20 Q-15 25 -20 35 Q-25 45 -15 50" 
            stroke="var(--color-primary-600)" 
            strokeWidth="2" 
            fill="none"
          />
        </g>
        
        {/* Sparkle effects around machine */}
        <g fill="var(--color-accent-400)">
          <circle cx="130" cy="60" r="2">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="140" cy="80" r="1.5">
            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="125" cy="90" r="1">
            <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Welcome banner */}
        <rect 
          x="60" 
          y="130" 
          width="80" 
          height="25" 
          rx="12" 
          fill="var(--color-accent-500)"
          stroke="var(--color-accent-600)"
          strokeWidth="1"
        />
        <text 
          x="100" 
          y="145" 
          textAnchor="middle" 
          fontSize="12" 
          fill="white"
          fontFamily="var(--font-family-heading)"
          fontWeight="600"
        >
          Welcome!
        </text>
        
        {/* Decorative tattoo elements */}
        <g fill="var(--color-primary-300)" opacity="0.5">
          {/* Rose */}
          <g transform="translate(40, 40)">
            <circle cx="8" cy="8" r="6" fill="none" stroke="var(--color-primary-300)" strokeWidth="1"/>
            <circle cx="8" cy="8" r="3" fill="var(--color-primary-300)" opacity="0.3"/>
            <path d="M8 14 Q8 20 12 18 Q10 22 8 20" stroke="var(--color-primary-300)" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Swallow */}
          <g transform="translate(150, 40)">
            <path d="M0 8 Q5 5 10 8 Q8 12 5 10 Q2 12 0 8" fill="var(--color-primary-300)"/>
            <path d="M10 8 L15 6 L12 10 Z" fill="var(--color-primary-300)"/>
          </g>
        </g>
      </svg>
    ),

    favorites: (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="No favorites illustration"
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="var(--color-accent-50)" 
          stroke="var(--color-accent-200)" 
          strokeWidth="2"
        />
        
        {/* Large empty heart */}
        <path 
          d="M100 140 C100 140 70 110 70 85 C70 70 85 60 100 75 C115 60 130 70 130 85 C130 110 100 140 100 140 Z" 
          fill="none"
          stroke="var(--color-accent-400)" 
          strokeWidth="3"
          strokeDasharray="5,5"
        />
        
        {/* Plus sign in center of heart */}
        <g stroke="var(--color-accent-500)" strokeWidth="2" strokeLinecap="round">
          <path d="M100 90 L100 110" />
          <path d="M90 100 L110 100" />
        </g>
        
        {/* Floating mini hearts */}
        <g fill="var(--color-accent-300)" opacity="0.6">
          <path d="M60 60 C60 60 50 50 50 42 C50 37 55 35 60 40 C65 35 70 37 70 42 C70 50 60 60 60 60 Z">
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; 0,-5; 0,0" 
              dur="3s" 
              repeatCount="indefinite"
            />
          </path>
          
          <path d="M140 160 C140 160 130 150 130 142 C130 137 135 135 140 140 C145 135 150 137 150 142 C150 150 140 160 140 160 Z">
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; 0,-3; 0,0" 
              dur="2.5s" 
              repeatCount="indefinite"
            />
          </path>
          
          <path d="M160 70 C160 70 155 65 155 62 C155 60 157 59 160 61 C163 59 165 60 165 62 C165 65 160 70 160 70 Z">
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; 0,-2; 0,0" 
              dur="2s" 
              repeatCount="indefinite"
            />
          </path>
        </g>
        
        {/* Message */}
        <ellipse 
          cx="100" 
          cy="165" 
          rx="35" 
          ry="10" 
          fill="var(--background-primary)" 
          stroke="var(--border-primary)" 
          strokeWidth="1"
          opacity="0.9"
        />
        <text 
          x="100" 
          y="169" 
          textAnchor="middle" 
          fontSize="8" 
          fill="var(--text-secondary)"
          fontFamily="var(--font-family-body)"
        >
          No favorites yet
        </text>
      </svg>
    ),

    portfolio: (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Empty portfolio illustration"
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="var(--color-neutral-50)" 
          stroke="var(--color-neutral-200)" 
          strokeWidth="2"
        />
        
        {/* Empty picture frames */}
        <g stroke="var(--color-neutral-400)" strokeWidth="2" fill="var(--color-neutral-100)">
          <rect x="60" y="60" width="30" height="25" rx="2" />
          <rect x="110" y="60" width="30" height="25" rx="2" />
          <rect x="60" y="100" width="30" height="25" rx="2" />
          <rect x="110" y="100" width="30" height="25" rx="2" />
        </g>
        
        {/* Plus signs in frames */}
        <g stroke="var(--color-neutral-400)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M75 67 L75 78" />
          <path d="M69 72.5 L81 72.5" />
          
          <path d="M125 67 L125 78" />
          <path d="M119 72.5 L131 72.5" />
          
          <path d="M75 107 L75 118" />
          <path d="M69 112.5 L81 112.5" />
          
          <path d="M125 107 L125 118" />
          <path d="M119 112.5 L131 112.5" />
        </g>
        
        {/* Camera icon */}
        <g transform="translate(85, 140)">
          <rect 
            x="0" 
            y="5" 
            width="30" 
            height="20" 
            rx="3" 
            fill="var(--color-primary-300)"
            stroke="var(--color-primary-400)"
            strokeWidth="1"
          />
          <rect x="3" y="0" width="8" height="5" rx="2" fill="var(--color-primary-400)" />
          <circle cx="15" cy="15" r="6" fill="none" stroke="var(--color-primary-500)" strokeWidth="1.5" />
          <circle cx="15" cy="15" r="3" fill="var(--color-primary-500)" />
          <circle cx="25" cy="10" r="1" fill="var(--color-primary-500)" />
        </g>
        
        {/* Message */}
        <text 
          x="100" 
          y="180" 
          textAnchor="middle" 
          fontSize="10" 
          fill="var(--text-secondary)"
          fontFamily="var(--font-family-body)"
        >
          No images to display
        </text>
      </svg>
    ),

    loading: (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Loading content illustration"
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="var(--color-primary-50)" 
          stroke="var(--color-primary-200)" 
          strokeWidth="2"
        />
        
        {/* Animated loading circles */}
        <g>
          <circle cx="80" cy="100" r="8" fill="var(--color-primary-400)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="100" cy="100" r="8" fill="var(--color-primary-400)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="120" cy="100" r="8" fill="var(--color-primary-400)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="1s" />
          </circle>
        </g>
        
        {/* Rotating tattoo machine */}
        <g transform="translate(100, 60)">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            values="0 0 0; 360 0 0" 
            dur="3s" 
            repeatCount="indefinite"
          />
          
          <rect 
            x="-15" 
            y="-5" 
            width="30" 
            height="10" 
            rx="2" 
            fill="var(--color-primary-500)"
          />
          <rect x="15" y="-2" width="8" height="4" fill="var(--color-accent-500)" />
        </g>
        
        {/* Message */}
        <text 
          x="100" 
          y="160" 
          textAnchor="middle" 
          fontSize="10" 
          fill="var(--text-secondary)"
          fontFamily="var(--font-family-body)"
        >
          Loading amazing content...
        </text>
      </svg>
    )
  };

  return illustrations[variant] || illustrations.search;
}

/**
 * Main EmptyState component with brand personality and engaging copy
 */
const EmptyState = forwardRef(({ 
  variant = 'search',
  title,
  description,
  illustration,
  actions,
  className,
  size = 'md',
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const illustrationSizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
    xl: 'w-48 h-48'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        'space-y-6',
        sizeClasses[size],
        'mx-auto',
        className
      )}
      {...props}
    >
      {/* Illustration */}
      <div className={cn('flex-shrink-0', illustrationSizes[size])}>
        {illustration || <EmptyStateIllustration variant={variant} />}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {title && (
          <h3 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-family-heading)]">
            {title}
          </h3>
        )}
        
        {description && (
          <p className="text-[var(--text-secondary)] leading-relaxed max-w-sm">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;