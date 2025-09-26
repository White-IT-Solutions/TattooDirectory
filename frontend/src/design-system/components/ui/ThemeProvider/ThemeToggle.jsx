"use client";

import { useTheme } from './ThemeProvider';
import { cn } from '../../../utils/cn';

/**
 * ThemeToggle - Interactive theme switcher component
 * 
 * Features:
 * - Toggle between light/dark/system themes
 * - Smooth animations and transitions
 * - Accessible keyboard navigation
 * - Visual feedback for current theme
 * - Support for different display variants
 */
export function ThemeToggle({ 
  variant = 'button',
  size = 'md',
  showLabel = false,
  className,
  ...props 
}) {
  const { theme, setTheme, toggleTheme, getThemeIcon, getThemeLabel, mounted } = useTheme();

  if (!mounted) {
    return (
      <div 
        className={cn(
          'animate-pulse bg-neutral-200 rounded',
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-10 w-10',
          size === 'lg' && 'h-12 w-12'
        )}
      />
    );
  }

  if (variant === 'dropdown') {
    return <ThemeDropdown size={size} showLabel={showLabel} className={className} {...props} />;
  }

  const sizeClasses = {
    sm: 'h-8 min-w-8 text-sm px-2',
    md: 'h-10 min-w-10 text-base px-3',
    lg: 'h-12 min-w-12 text-lg px-4'
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'rounded-lg border',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'active:scale-95',
        // Size variants
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: 'var(--background-primary)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)',
        '--tw-ring-color': 'var(--interactive-primary)',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = 'var(--background-secondary)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'var(--background-primary)';
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      aria-label={`Current theme: ${getThemeLabel()}. Click to switch theme.`}
      {...props}
    >
      <span className="transition-transform duration-200 ease-out hover:scale-110">
        {getThemeIcon()}
      </span>
      {showLabel && (
        <span className="ml-2 text-sm font-medium whitespace-nowrap">
          {getThemeLabel()}
        </span>
      )}
    </button>
  );
}

/**
 * ThemeDropdown - Dropdown theme selector with all options
 */
function ThemeDropdown({ size = 'md', showLabel = false, className, ...props }) {
  const { theme, setTheme, getThemeIcon, getThemeLabel, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={cn('animate-pulse bg-neutral-200 rounded h-10 w-32', className)} />
    );
  }

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <div className="relative">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className={cn(
          // Base styles
          'appearance-none cursor-pointer',
          'rounded-lg border border-neutral-300',
          'bg-white hover:bg-neutral-50',
          'text-neutral-700 hover:text-neutral-900',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          // Dark mode styles
          'dark:bg-neutral-800 dark:hover:bg-neutral-700',
          'dark:border-neutral-600 dark:text-neutral-300 dark:hover:text-neutral-100',
          'dark:focus:ring-primary-400',
          // Size variants
          sizeClasses[size],
          className
        )}
        aria-label="Select theme"
        {...props}
      >
        {themes.map((themeOption) => (
          <option key={themeOption.value} value={themeOption.value}>
            {showLabel ? `${themeOption.icon} ${themeOption.label}` : themeOption.icon}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="h-4 w-4 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * ThemeSegmentedControl - Segmented control for theme selection
 */
export function ThemeSegmentedControl({ 
  size = 'md',
  showIcons = true,
  showLabels = true,
  className,
  ...props 
}) {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={cn('animate-pulse bg-neutral-200 rounded-lg h-10 w-48', className)} />
    );
  }

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs min-w-16',
    md: 'h-10 px-4 text-sm min-w-20',
    lg: 'h-12 px-5 text-base min-w-24'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center',
        'rounded-lg p-1',
        'transition-colors duration-200',
        className
      )}
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border-primary)',
        border: '1px solid'
      }}
      role="radiogroup"
      aria-label="Theme selection"
      {...props}
    >
      {themes.map((themeOption) => (
        <button
          key={themeOption.value}
          onClick={() => setTheme(themeOption.value)}
          className={cn(
            // Base styles
            'inline-flex items-center justify-center',
            'rounded-md font-medium',
            'transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            // Size variants
            sizeClasses[size]
          )}
          style={{
            backgroundColor: theme === themeOption.value 
              ? 'var(--background-primary)' 
              : 'transparent',
            color: theme === themeOption.value 
              ? 'var(--interactive-primary)' 
              : 'var(--text-secondary)',
            boxShadow: theme === themeOption.value ? 'var(--shadow-sm)' : 'none',
            '--tw-ring-color': 'var(--interactive-primary)',
          }}
          onMouseEnter={(e) => {
            if (theme !== themeOption.value) {
              e.target.style.backgroundColor = 'var(--background-primary)';
              e.target.style.opacity = '0.5';
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== themeOption.value) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.opacity = '1';
            }
          }}
          role="radio"
          aria-checked={theme === themeOption.value}
          aria-label={`${themeOption.label} theme`}
        >
          {showIcons && (
            <span className="transition-transform duration-200 ease-out hover:scale-110">
              {themeOption.icon}
            </span>
          )}
          {showLabels && (
            <span className={cn(showIcons && 'ml-2')}>
              {themeOption.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;