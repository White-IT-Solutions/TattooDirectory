"use client";

import { forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import { useStandardizedProps } from '../../StandardizedComponent';
import { generateComponentClasses, applyVisualEffects } from '../../../utils/design-system-utils';

// Card variant configurations using our design system
const cardVariants = cva(
  // Base styles - common to all cards
  [
    'bg-[var(--background-primary)]',
    'border border-[var(--border-subtle)]',
    'transition-all duration-200 ease-out',
    'overflow-hidden'
  ].join(' '),
  {
    variants: {
      elevation: {
        flat: [
          'shadow-none',
          'border-[var(--border-primary)]'
        ].join(' '),
        low: [
          'shadow-[var(--shadow-sm)]',
          'hover:shadow-[var(--shadow)]',
          'border-[var(--border-secondary)]'
        ].join(' '),
        medium: [
          'shadow-[var(--shadow)]',
          'hover:shadow-[var(--shadow-md)]',
          'border-[var(--border-subtle)]'
        ].join(' '),
        high: [
          'shadow-[var(--shadow-lg)]',
          'hover:shadow-[var(--shadow-xl)]',
          'border-transparent'
        ].join(' '),
        floating: [
          'shadow-[var(--shadow-xl)]',
          'hover:shadow-[var(--shadow-2xl)]',
          'border-transparent',
          'hover:-translate-y-1'
        ].join(' ')
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-[var(--radius)]',
        md: 'rounded-[var(--radius-md)]',
        lg: 'rounded-[var(--radius-lg)]',
        xl: 'rounded-[var(--radius-xl)]'
      }
    },
    defaultVariants: {
      elevation: 'medium',
      padding: 'md',
      radius: 'lg'
    }
  }
);

const Card = forwardRef(({ 
  className, 
  elevation = 'medium', 
  padding = 'md',
  radius = 'lg',
  children,
  ...props 
}, ref) => {
  // Apply standardized design system integration
  const standardizedProps = useStandardizedProps('card', {
    className,
    elevation,
    padding,
    radius,
    ...props
  });

  // Generate design system classes
  const designSystemClasses = generateComponentClasses(standardizedProps);
  const visualEffectsClasses = applyVisualEffects(standardizedProps);

  return (
    <div
      className={cardVariants({ 
        elevation: standardizedProps.elevation, 
        padding: standardizedProps.padding, 
        radius: standardizedProps.radius, 
        className: `${designSystemClasses} ${visualEffectsClasses} ${standardizedProps.className}` 
      })}
      ref={ref}
      {...standardizedProps}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card composition components
const CardHeader = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)] ${className || ''}`}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-[var(--text-secondary)] ${className || ''}`}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center pt-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export default Card;
export { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  cardVariants 
};