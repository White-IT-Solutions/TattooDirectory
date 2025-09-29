"use client";
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import Card from '../Card/Card';
import { FormattedNumber } from '../DataVisualization/DataFormatting';
import { useStandardizedProps } from '../../StandardizedComponent';
import { generateComponentClasses, applyVisualEffects } from '../../../utils/design-system-utils';

export default function StarRating({ 
  rating = 0, 
  reviewCount = 0, 
  ratingBreakdown = null,
  size = 'sm',
  showCount = true,
  showBreakdown = false,
  interactive = false,
  onRatingClick,
  className,
  ...props
}) {
  // Apply standardized design system integration
  const standardizedProps = useStandardizedProps('starRating', {
    rating,
    reviewCount,
    ratingBreakdown,
    size,
    showCount,
    showBreakdown,
    interactive,
    onRatingClick,
    className,
    ...props
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(null);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Create 5 stars
  for (let i = 0; i < 5; i++) {
    let starType = 'empty';
    if (i < fullStars) {
      starType = 'full';
    } else if (i === fullStars && hasHalfStar) {
      starType = 'half';
    }

    stars.push(
      <div 
        key={i} 
        className={cn(
          "relative",
          interactive && "cursor-pointer hover:scale-110 transition-transform"
        )}
        onClick={() => interactive && onRatingClick && onRatingClick(i + 1)}
        onMouseEnter={() => interactive && setHoveredRating(i + 1)}
        onMouseLeave={() => interactive && setHoveredRating(null)}
      >
        {/* Empty star background */}
        <svg
          className={cn(sizeClasses[size], 'text-neutral-300')}
          fill="currentColor"
          viewBox="0 0 20 20"
          role="img"
          aria-label={`Star ${i + 1} empty`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        
        {/* Filled star overlay */}
        {(starType !== 'empty' || (interactive && hoveredRating && i < hoveredRating)) && (
          <svg
            className={cn(
              sizeClasses[size], 
              'absolute top-0 left-0',
              interactive && hoveredRating && i < hoveredRating 
                ? 'text-accent-400' 
                : 'text-accent-500',
              starType === 'half' ? 'overflow-hidden' : ''
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label={`Star ${i + 1} ${starType}`}
            style={starType === 'half' ? { clipPath: 'inset(0 50% 0 0)' } : {}}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </div>
    );
  }

  // Generate design system classes
  const designSystemClasses = generateComponentClasses(standardizedProps);
  const visualEffectsClasses = applyVisualEffects(standardizedProps);

  return (
    <div className={cn(
      'flex items-center gap-1', 
      designSystemClasses, 
      visualEffectsClasses, 
      standardizedProps.className
    )}>
      <div 
        className="flex items-center relative"
        onMouseEnter={() => standardizedProps.ratingBreakdown && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {stars}
        
        {/* Rating breakdown tooltip */}
        {showTooltip && ratingBreakdown && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
            <Card className="p-3 w-48 shadow-lg">
              <div className="text-sm font-semibold text-neutral-900 mb-2">
                Rating Breakdown
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star] || 0;
                  const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4">{star}★</span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-neutral-600">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-neutral-200 text-xs text-neutral-600">
                <FormattedNumber value={rating} decimals={1} /> average rating
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {showCount && reviewCount > 0 && (
        <span className={cn('text-neutral-600 ml-1', textSizeClasses[size])}>
          (<FormattedNumber value={reviewCount} compact />)
        </span>
      )}
      
      {/* Detailed breakdown display */}
      {showBreakdown && ratingBreakdown && (
        <div className="ml-4 min-w-0 flex-1">
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown[star] || 0;
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-neutral-600">{star}★</span>
                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-neutral-600 text-xs">
                    <FormattedNumber value={count} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}