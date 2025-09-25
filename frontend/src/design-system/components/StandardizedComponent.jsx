"use client";

import { forwardRef } from 'react';
import { createStandardizedComponent } from '../utils/design-system-utils';
import { cn } from '../utils/cn';

/**
 * Standardized Component Wrapper
 * Ensures all enhanced components use consistent design system integration
 */

/**
 * Higher-order component that standardizes component behavior
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {string} componentType - Component type for configuration
 * @param {Object} defaultConfig - Default component configuration
 * @returns {React.Component} Standardized component
 */
export function withStandardizedDesignSystem(WrappedComponent, componentType, defaultConfig = {}) {
  const useStandardizedConfig = createStandardizedComponent(componentType, defaultConfig);
  
  const StandardizedComponent = forwardRef((props, ref) => {
    const standardizedProps = useStandardizedConfig(props);
    
    return (
      <WrappedComponent
        ref={ref}
        {...standardizedProps}
      />
    );
  });
  
  StandardizedComponent.displayName = `Standardized(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return StandardizedComponent;
}

/**
 * Base standardized component that provides consistent design system integration
 */
export const StandardizedComponent = forwardRef(({
  as: Component = 'div',
  componentType = 'base',
  children,
  className,
  ...props
}, ref) => {
  const useStandardizedConfig = createStandardizedComponent(componentType);
  const standardizedProps = useStandardizedConfig(props);
  
  return (
    <Component
      ref={ref}
      className={cn(standardizedProps.className, className)}
      {...standardizedProps}
    >
      {children}
    </Component>
  );
});

StandardizedComponent.displayName = 'StandardizedComponent';

/**
 * Hook for standardizing component props
 * @param {string} componentType - Component type
 * @param {Object} props - Component props
 * @returns {Object} Standardized props
 */
export function useStandardizedProps(componentType, props) {
  const useStandardizedConfig = createStandardizedComponent(componentType);
  return useStandardizedConfig(props);
}

/**
 * Utility for creating standardized component variants
 * @param {Object} variants - Variant configurations
 * @param {string} componentType - Component type
 * @returns {Object} Standardized variant components
 */
export function createStandardizedVariants(variants, componentType) {
  const standardizedVariants = {};
  
  Object.entries(variants).forEach(([variantName, VariantComponent]) => {
    standardizedVariants[variantName] = withStandardizedDesignSystem(
      VariantComponent,
      componentType,
      { variant: variantName }
    );
  });
  
  return standardizedVariants;
}

export default StandardizedComponent;