"use client";

import { cn } from '../../../utils/cn';

/**
 * Branded error illustrations for the tattoo directory
 * Features tattoo-themed graphics that reflect the creative industry
 */
export function ErrorIllustration({ variant = 'detailed', className }) {
  if (variant === 'simple') {
    return (
      <svg 
        className={cn("w-full h-full", className)} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Error illustration"
      >
        {/* Simple broken tattoo machine */}
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="var(--color-error-100)" 
          stroke="var(--color-error-300)" 
          strokeWidth="2"
        />
        <path 
          d="M35 35 L65 65 M65 35 L35 65" 
          stroke="var(--color-error-500)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="var(--color-error-500)"
        />
      </svg>
    );
  }

  return (
    <svg 
      className={cn("w-full h-full", className)} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Detailed error illustration showing a broken tattoo machine"
    >
      {/* Background circle */}
      <circle 
        cx="100" 
        cy="100" 
        r="90" 
        fill="var(--color-error-50)" 
        stroke="var(--color-error-200)" 
        strokeWidth="2"
      />
      
      {/* Tattoo machine body */}
      <rect 
        x="70" 
        y="60" 
        width="60" 
        height="25" 
        rx="5" 
        fill="var(--color-neutral-600)"
        stroke="var(--color-neutral-700)"
        strokeWidth="1"
      />
      
      {/* Machine grip */}
      <rect 
        x="75" 
        y="85" 
        width="8" 
        height="40" 
        rx="4" 
        fill="var(--color-neutral-700)"
      />
      
      {/* Needle assembly (broken) */}
      <rect 
        x="120" 
        y="70" 
        width="15" 
        height="4" 
        fill="var(--color-neutral-500)"
      />
      
      {/* Broken needle pieces */}
      <rect 
        x="135" 
        y="71" 
        width="8" 
        height="2" 
        fill="var(--color-error-500)"
        transform="rotate(15 139 72)"
      />
      <rect 
        x="145" 
        y="75" 
        width="6" 
        height="2" 
        fill="var(--color-error-500)"
        transform="rotate(-10 148 76)"
      />
      
      {/* Power cord */}
      <path 
        d="M70 75 Q50 85 45 100 Q40 115 50 125" 
        stroke="var(--color-neutral-600)" 
        strokeWidth="3" 
        fill="none"
      />
      
      {/* Spark effects */}
      <g fill="var(--color-warning-400)">
        <circle cx="140" cy="68" r="2">
          <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="148" cy="72" r="1.5">
          <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="145" cy="65" r="1">
          <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Error X overlay */}
      <g stroke="var(--color-error-500)" strokeWidth="4" strokeLinecap="round">
        <path d="M60 60 L140 140" opacity="0.8" />
        <path d="M140 60 L60 140" opacity="0.8" />
      </g>
      
      {/* Decorative tattoo elements */}
      <g fill="var(--color-primary-300)" opacity="0.3">
        {/* Small star */}
        <path d="M40 40 L42 46 L48 46 L43 50 L45 56 L40 52 L35 56 L37 50 L32 46 L38 46 Z" />
        
        {/* Heart */}
        <path d="M160 130 C160 125 165 120 170 125 C175 120 180 125 180 130 C180 135 170 145 170 145 C170 145 160 135 160 130 Z" />
        
        {/* Lightning bolt */}
        <path d="M30 120 L35 110 L32 110 L38 95 L33 105 L36 105 L30 120 Z" />
      </g>
      
      {/* Floating error message bubble */}
      <g>
        <ellipse 
          cx="100" 
          cy="160" 
          rx="35" 
          ry="15" 
          fill="var(--background-primary)" 
          stroke="var(--border-primary)" 
          strokeWidth="1"
          opacity="0.9"
        />
        <text 
          x="100" 
          y="165" 
          textAnchor="middle" 
          fontSize="10" 
          fill="var(--text-secondary)"
          fontFamily="var(--font-family-body)"
        >
          Something's not right...
        </text>
      </g>
    </svg>
  );
}

/**
 * Alternative illustration variants for different error types
 */
export function NetworkErrorIllustration({ className }) {
  return (
    <svg 
      className={cn("w-full h-full", className)} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Network error illustration"
    >
      {/* Background */}
      <circle 
        cx="100" 
        cy="100" 
        r="90" 
        fill="var(--color-warning-50)" 
        stroke="var(--color-warning-200)" 
        strokeWidth="2"
      />
      
      {/* Disconnected wifi/signal bars */}
      <g fill="var(--color-neutral-400)">
        <rect x="80" y="120" width="8" height="20" rx="2" />
        <rect x="92" y="110" width="8" height="30" rx="2" />
        <rect x="104" y="100" width="8" height="40" rx="2" />
        <rect x="116" y="90" width="8" height="50" rx="2" opacity="0.3" />
      </g>
      
      {/* Broken connection line */}
      <path 
        d="M60 80 Q80 70 100 80 Q120 90 140 80" 
        stroke="var(--color-warning-500)" 
        strokeWidth="3" 
        strokeDasharray="5,5"
        fill="none"
      />
      
      {/* Warning triangle */}
      <path 
        d="M100 50 L115 75 L85 75 Z" 
        fill="var(--color-warning-400)"
      />
      <circle cx="100" cy="65" r="2" fill="var(--background-primary)" />
      <rect x="99" y="68" width="2" height="4" fill="var(--background-primary)" />
    </svg>
  );
}

export function ChunkLoadErrorIllustration({ className }) {
  return (
    <svg 
      className={cn("w-full h-full", className)} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading error illustration"
    >
      {/* Background */}
      <circle 
        cx="100" 
        cy="100" 
        r="90" 
        fill="var(--color-primary-50)" 
        stroke="var(--color-primary-200)" 
        strokeWidth="2"
      />
      
      {/* Broken loading circle */}
      <circle 
        cx="100" 
        cy="100" 
        r="30" 
        stroke="var(--color-primary-300)" 
        strokeWidth="4" 
        strokeDasharray="20,10"
        fill="none"
      />
      
      {/* Missing puzzle piece */}
      <path 
        d="M120 80 L140 80 L140 100 L135 100 Q130 95 125 100 L120 100 Z" 
        fill="var(--color-error-200)"
        stroke="var(--color-error-400)"
        strokeWidth="1"
      />
      
      {/* Refresh icon */}
      <path 
        d="M85 85 Q85 75 95 75 Q105 75 105 85" 
        stroke="var(--color-primary-500)" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />
      <path 
        d="M102 82 L105 85 L102 88" 
        stroke="var(--color-primary-500)" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}