"use client";
import { cn } from '../../../utils/cn';
import { FormattedPrice, PriceRange } from '../DataVisualization/DataFormatting';
import Badge from '../Badge/Badge';

export default function PricingDisplay({ 
  pricing, 
  size = 'sm',
  variant = 'default',
  showRange = false,
  showBadges = false,
  className 
}) {
  if (!pricing) return null;

  const { 
    hourlyRate, 
    minimumCharge, 
    sessionRate,
    packageDeals = [],
    currency = 'GBP',
    priceRange,
    consultationFee,
    touchUpPolicy
  } = pricing;
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = {
    default: 'space-y-2',
    compact: 'flex flex-wrap gap-2 items-center',
    detailed: 'space-y-3'
  };

  // Determine pricing tier for badge
  const getPricingTier = () => {
    const rate = hourlyRate || sessionRate || minimumCharge;
    if (!rate) return null;
    
    if (rate >= 150) return { label: 'Premium', variant: 'accent' };
    if (rate >= 100) return { label: 'Standard', variant: 'secondary' };
    return { label: 'Budget', variant: 'success' };
  };

  const pricingTier = getPricingTier();

  return (
    <div className={cn(containerClasses[variant], className)}>
      {/* Pricing tier badge */}
      {showBadges && pricingTier && (
        <Badge variant={pricingTier.variant} size="sm">
          {pricingTier.label}
        </Badge>
      )}

      {/* Price range display */}
      {showRange && priceRange && (
        <div className={cn('flex items-center gap-2', sizeClasses[size])}>
          <span className="text-neutral-600">Range:</span>
          <PriceRange 
            min={priceRange.min} 
            max={priceRange.max} 
            currency={currency}
            size={size}
            variant="accent"
          />
        </div>
      )}

      {/* Hourly rate */}
      {hourlyRate && (
        <div className={cn('flex items-center gap-2', sizeClasses[size])}>
          <span className="text-neutral-600">Hourly:</span>
          <FormattedPrice 
            amount={hourlyRate} 
            currency={currency}
            variant="accent"
            size={size}
          />
        </div>
      )}

      {/* Session rate */}
      {sessionRate && !hourlyRate && (
        <div className={cn('flex items-center gap-2', sizeClasses[size])}>
          <span className="text-neutral-600">Session:</span>
          <FormattedPrice 
            amount={sessionRate} 
            currency={currency}
            variant="accent"
            size={size}
          />
        </div>
      )}

      {/* Minimum charge */}
      {minimumCharge && (
        <div className={cn('flex items-center gap-2', sizeClasses[size])}>
          <span className="text-neutral-600">Minimum:</span>
          <FormattedPrice 
            amount={minimumCharge} 
            currency={currency}
            variant="primary"
            size={size}
          />
        </div>
      )}

      {/* Consultation fee */}
      {consultationFee && (
        <div className={cn('flex items-center gap-2', sizeClasses[size])}>
          <span className="text-neutral-600">Consultation:</span>
          <FormattedPrice 
            amount={consultationFee} 
            currency={currency}
            variant="muted"
            size={size}
          />
        </div>
      )}

      {/* Package deals */}
      {packageDeals.length > 0 && variant === 'detailed' && (
        <div className="space-y-1">
          <span className={cn('text-neutral-600 font-medium', sizeClasses[size])}>
            Package Deals:
          </span>
          {packageDeals.slice(0, 2).map((deal, index) => (
            <div key={index} className={cn('flex items-center justify-between', sizeClasses[size])}>
              <span className="text-neutral-700">{deal.description}</span>
              <FormattedPrice 
                amount={deal.price} 
                currency={currency}
                variant="success"
                size={size}
              />
            </div>
          ))}
        </div>
      )}

      {/* Touch-up policy */}
      {touchUpPolicy && variant === 'detailed' && (
        <div className={cn('text-neutral-600', sizeClasses[size])}>
          <span className="font-medium">Touch-ups:</span> {touchUpPolicy}
        </div>
      )}

      {/* Pricing notes */}
      {variant === 'detailed' && (
        <div className={cn('text-neutral-500 italic', sizeClasses[size])}>
          Prices may vary based on design complexity and size
        </div>
      )}
    </div>
  );
}