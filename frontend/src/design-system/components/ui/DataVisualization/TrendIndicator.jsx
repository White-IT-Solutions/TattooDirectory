"use client";
import { cn } from '../../../utils/cn';
import { FormattedNumber } from './DataFormatting';

// Trend direction icons
const TrendUpIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const TrendFlatIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
  </svg>
);

// Main trend indicator component
export default function TrendIndicator({ 
  value, 
  previousValue,
  label,
  format = 'number',
  showIcon = true,
  showPercentage = true,
  size = 'md',
  variant = 'auto',
  className 
}) {
  // Calculate trend
  const change = value - (previousValue || 0);
  const percentageChange = previousValue ? (change / previousValue) * 100 : 0;
  
  // Determine trend direction
  let trendDirection = 'flat';
  if (Math.abs(percentageChange) > 0.1) { // Only show trend if change > 0.1%
    trendDirection = change > 0 ? 'up' : 'down';
  }

  // Auto-determine variant based on trend direction
  const actualVariant = variant === 'auto' 
    ? trendDirection === 'up' ? 'success' : trendDirection === 'down' ? 'error' : 'neutral'
    : variant;

  const sizeClasses = {
    sm: {
      text: 'text-sm',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    md: {
      text: 'text-base',
      icon: 'w-4 h-4',
      gap: 'gap-1.5'
    },
    lg: {
      text: 'text-lg',
      icon: 'w-5 h-5',
      gap: 'gap-2'
    }
  };

  const variantClasses = {
    success: 'text-green-600',
    error: 'text-red-600',
    neutral: 'text-neutral-600',
    primary: 'text-primary-600'
  };

  const TrendIcon = {
    up: TrendUpIcon,
    down: TrendDownIcon,
    flat: TrendFlatIcon
  }[trendDirection];

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Main value */}
      <div className={cn(
        'flex items-center font-semibold',
        sizeClasses[size].gap,
        sizeClasses[size].text
      )}>
        <FormattedNumber 
          value={value} 
          decimals={format === 'percentage' ? 1 : 0}
          percentage={format === 'percentage'}
          compact={format === 'compact'}
        />
        
        {/* Trend indicator */}
        {showIcon && (
          <div className={cn(
            'flex items-center',
            sizeClasses[size].gap,
            variantClasses[actualVariant]
          )}>
            <TrendIcon className={sizeClasses[size].icon} />
            {showPercentage && Math.abs(percentageChange) > 0.1 && (
              <span className="text-xs">
                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Label */}
      {label && (
        <span className="text-xs text-neutral-500 mt-0.5">
          {label}
        </span>
      )}
    </div>
  );
}

// Popularity trend component specifically for artists
export function PopularityTrend({ 
  currentViews, 
  previousViews,
  currentBookings,
  previousBookings,
  size = 'sm',
  className 
}) {
  const viewsTrend = currentViews && previousViews 
    ? ((currentViews - previousViews) / previousViews) * 100 
    : 0;
  
  const bookingsTrend = currentBookings && previousBookings 
    ? ((currentBookings - previousBookings) / previousBookings) * 100 
    : 0;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Views trend */}
      <TrendIndicator
        value={currentViews}
        previousValue={previousViews}
        label="Profile views"
        format="compact"
        size={size}
        showPercentage={true}
      />
      
      {/* Bookings trend */}
      <TrendIndicator
        value={currentBookings}
        previousValue={previousBookings}
        label="Inquiries"
        format="number"
        size={size}
        showPercentage={true}
      />
    </div>
  );
}

// Simple trend badge for compact display
export function TrendBadge({ 
  value, 
  previousValue,
  showValue = false,
  className 
}) {
  const change = value - (previousValue || 0);
  const percentageChange = previousValue ? (change / previousValue) * 100 : 0;
  
  if (Math.abs(percentageChange) < 0.1) return null; // Don't show for minimal changes

  const isPositive = change > 0;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      isPositive 
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-red-50 text-red-700 border border-red-200',
      className
    )}>
      {isPositive ? (
        <TrendUpIcon className="w-3 h-3" />
      ) : (
        <TrendDownIcon className="w-3 h-3" />
      )}
      {showValue && (
        <FormattedNumber value={value} compact />
      )}
      <span>
        {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
      </span>
    </span>
  );
}

// Metric card with trend
export function MetricCard({ 
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  className 
}) {
  return (
    <div className={cn(
      'bg-white rounded-lg border border-neutral-200 p-4',
      'hover:shadow-md transition-shadow duration-200',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-neutral-400" />}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-neutral-900">
          <FormattedNumber 
            value={value} 
            decimals={format === 'percentage' ? 1 : 0}
            percentage={format === 'percentage'}
            compact={format === 'compact'}
          />
        </div>
        
        <TrendBadge 
          value={value} 
          previousValue={previousValue}
          className="ml-2"
        />
      </div>
    </div>
  );
}