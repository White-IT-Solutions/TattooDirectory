/**
 * Utility function for combining class names
 * Combines multiple class names and filters out falsy values
 * 
 * @param {...(string|undefined|null|false)} classes - Class names to combine
 * @returns {string} Combined class names
 * 
 * @example
 * cn('base-class', condition && 'conditional-class', 'another-class')
 * // Returns: 'base-class conditional-class another-class' (if condition is true)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility function for creating variant-based class combinations
 * This is a simplified version of class-variance-authority (cva)
 * 
 * @param {string} base - Base class names
 * @param {Object} config - Configuration object with variants and defaultVariants
 * @returns {Function} Function that accepts props and returns combined class names
 * 
 * @example
 * const buttonVariants = cva(
 *   'inline-flex items-center',
 *   {
 *     variants: {
 *       variant: {
 *         primary: 'bg-primary-500 text-white',
 *         secondary: 'bg-ink-100 text-ink-900'
 *       },
 *       size: {
 *         sm: 'h-8 px-3',
 *         md: 'h-10 px-4'
 *       }
 *     },
 *     defaultVariants: {
 *       variant: 'primary',
 *       size: 'md'
 *     }
 *   }
 * );
 * 
 * buttonVariants({ variant: 'primary', size: 'md', className: 'custom-class' })
 * // Returns: 'inline-flex items-center bg-primary-500 text-white h-10 px-4 custom-class'
 */
export function cva(base, config = {}) {
  const { variants = {}, defaultVariants = {} } = config;
  
  return function(props = {}) {
    const { className, ...variantProps } = props;
    
    // Merge default variants with provided props
    const resolvedProps = { ...defaultVariants, ...variantProps };
    
    // Get variant classes
    const variantClasses = Object.keys(variants).map(key => {
      const variant = resolvedProps[key];
      return variant && variants[key] && variants[key][variant];
    }).filter(Boolean);

    return cn(base, ...variantClasses, className);
  };
}

export default cn;