"use client";
import { cn } from '../../../utils/cn';
import { FormattedNumber } from './DataFormatting';

// Simple Bar Chart component
export function BarChart({ 
  data = [], 
  height = 200, 
  color = '#8B5CF6',
  showValues = false,
  className 
}) {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((item, index) => {
          const heightPercent = ((item.value - minValue) / range) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex-1 flex items-end w-full">
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              {showValues && (
                <div className="text-xs text-neutral-600 mt-1">
                  <FormattedNumber value={item.value} compact />
                </div>
              )}
              <div className="text-xs text-neutral-500 mt-1 text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple Line Chart component
export function LineChart({ 
  data = [], 
  height = 200, 
  color = '#06B6D4',
  strokeWidth = 2,
  showDots = true,
  className 
}) {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.y - minValue) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn('w-full relative', className)} style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          points={points}
          className="transition-all duration-300"
        />
        
        {/* Dots */}
        {showDots && data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (((item.y - minValue) / range) * 100);
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              className="hover:r-2 transition-all duration-200"
            >
              <title>{`${item.x}: ${item.y}`}</title>
            </circle>
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-neutral-500">
            {item.x}
          </span>
        ))}
      </div>
    </div>
  );
}

// Simple Donut Chart component
export function DonutChart({ 
  data = [], 
  size = 120,
  strokeWidth = 20,
  showLabels = true,
  className 
}) {
  if (!data.length) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              >
                <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-neutral-900">
              <FormattedNumber value={total} compact />
            </div>
            <div className="text-xs text-neutral-500">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      {showLabels && (
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-neutral-700">{item.label}</span>
                <span className="text-neutral-500">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Trend Indicator component
export function TrendIndicator({ 
  value, 
  trend = 'neutral', 
  label,
  size = 'sm',
  showIcon = true,
  className 
}) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const trendConfig = {
    up: {
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      icon: '↗'
    },
    down: {
      color: 'text-error-600',
      bgColor: 'bg-error-50',
      icon: '↘'
    },
    neutral: {
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      icon: '→'
    }
  };

  const config = trendConfig[trend];

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full',
      config.bgColor,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <span className={config.color}>{config.icon}</span>
      )}
      <span className={cn('font-medium', config.color)}>
        <FormattedNumber value={value} decimals={1} />
        {trend !== 'neutral' && '%'}
      </span>
      {label && (
        <span className="text-neutral-600">{label}</span>
      )}
    </div>
  );
}

// Metric Card component
export function MetricCard({ 
  title, 
  value, 
  change,
  trend,
  subtitle,
  icon,
  className 
}) {
  return (
    <div className={cn(
      'bg-white rounded-lg border border-neutral-200 p-4',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-neutral-400">{icon}</span>}
            <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
          </div>
          
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            <FormattedNumber value={value} compact />
          </div>
          
          {subtitle && (
            <p className="text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>
        
        {change !== undefined && trend && (
          <TrendIndicator 
            value={change} 
            trend={trend} 
            size="sm"
          />
        )}
      </div>
    </div>
  );
}