"use client";
import { cn } from '../../../utils/cn';

// Format price with currency
export function FormattedPrice({ 
  amount, 
  currency = 'GBP', 
  variant = 'default',
  size = 'sm',
  showSymbol = true,
  className 
}) {
  const formatPrice = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const variantClasses = {
    default: 'text-neutral-900',
    primary: 'text-primary-600 font-semibold',
    accent: 'text-accent-600 font-semibold',
    success: 'text-success-600 font-semibold',
    muted: 'text-neutral-500'
  };

  return (
    <span className={cn(
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {formatPrice(amount, currency)}
    </span>
  );
}

// Format price range
export function PriceRange({ 
  min, 
  max, 
  currency = 'GBP', 
  variant = 'default',
  size = 'sm',
  separator = ' - ',
  className 
}) {
  return (
    <span className={cn('whitespace-nowrap', className)}>
      <FormattedPrice amount={min} currency={currency} variant={variant} size={size} />
      <span className="text-neutral-400 mx-1">{separator}</span>
      <FormattedPrice amount={max} currency={currency} variant={variant} size={size} />
    </span>
  );
}

// Format numbers with locale and options
export function FormattedNumber({ 
  value, 
  format = 'number',
  decimals = 0,
  compact = false,
  variant = 'default',
  size = 'sm',
  className 
}) {
  const formatNumber = (value, format, decimals, compact) => {
    const options = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    };

    if (compact) {
      options.notation = 'compact';
      options.compactDisplay = 'short';
    }

    switch (format) {
      case 'percentage':
        return new Intl.NumberFormat('en-GB', {
          ...options,
          style: 'percent',
        }).format(value);
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          ...options,
          style: 'currency',
          currency: 'GBP',
        }).format(value);
      default:
        return new Intl.NumberFormat('en-GB', options).format(value);
    }
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const variantClasses = {
    default: 'text-neutral-900',
    primary: 'text-primary-600',
    accent: 'text-accent-600',
    success: 'text-success-600',
    muted: 'text-neutral-500'
  };

  return (
    <span className={cn(
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {formatNumber(value, format, decimals, compact)}
    </span>
  );
}

// Format dates with various options
export function FormattedDate({ 
  date, 
  format = 'short',
  variant = 'default',
  size = 'sm',
  className 
}) {
  const formatDate = (date, format) => {
    const dateObj = new Date(date);
    const now = new Date();
    
    switch (format) {
      case 'relative': {
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return dateObj > now ? 'Tomorrow' : 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ${dateObj > now ? 'from now' : 'ago'}`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ${dateObj > now ? 'from now' : 'ago'}`;
        return dateObj.toLocaleDateString('en-GB', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      case 'short':
        return dateObj.toLocaleDateString('en-GB', { 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'long':
        return dateObj.toLocaleDateString('en-GB', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      
      case 'time':
        return dateObj.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      
      default:
        return dateObj.toLocaleDateString('en-GB');
    }
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const variantClasses = {
    default: 'text-neutral-900',
    primary: 'text-primary-600',
    accent: 'text-accent-600',
    muted: 'text-neutral-500'
  };

  return (
    <span className={cn(
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {formatDate(date, format)}
    </span>
  );
}