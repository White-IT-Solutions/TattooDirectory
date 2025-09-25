"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../design-system/components/ui';

// Validation rules for different search types
const VALIDATION_RULES = {
  artistName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-'.]+$/,
    message: 'Artist name should contain only letters, spaces, hyphens, apostrophes, and periods'
  },
  studioName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.&]+$/,
    message: 'Studio name should contain only letters, numbers, spaces, and common punctuation'
  },
  location: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-,.]+$/,
    message: 'Location should be a valid city name or postcode'
  },
  postcode: {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    message: 'Please enter a valid UK postcode (e.g., SW1A 1AA)'
  },
  style: {
    minLength: 2,
    maxLength: 30,
    pattern: /^[a-zA-Z\s-]+$/,
    message: 'Style should contain only letters, spaces, and hyphens'
  },
  general: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.&,]+$/,
    message: 'Search should contain only letters, numbers, spaces, and common punctuation'
  }
};

// Common validation errors
const VALIDATION_ERRORS = {
  TOO_SHORT: 'too_short',
  TOO_LONG: 'too_long',
  INVALID_FORMAT: 'invalid_format',
  INVALID_CHARACTERS: 'invalid_characters',
  EMPTY: 'empty',
  VALID: 'valid'
};

// UK cities for location validation
const UK_CITIES = [
  'London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Sheffield',
  'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford',
  'Edinburgh', 'Glasgow', 'Cardiff', 'Belfast', 'Brighton', 'Oxford',
  'Cambridge', 'Bath', 'York', 'Canterbury', 'Chester', 'Durham'
];

// Common tattoo styles for validation
const TATTOO_STYLES = [
  'Traditional', 'Realism', 'Watercolor', 'Geometric', 'Japanese', 'Blackwork',
  'Minimalist', 'Neo-traditional', 'Tribal', 'Portrait', 'Abstract', 'Dotwork'
];

/**
 * Validates search input based on type and rules
 */
export function validateSearchInput(value, type = 'general') {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.EMPTY,
      message: 'This field is required',
      suggestions: []
    };
  }

  const trimmedValue = value.trim();
  const rules = VALIDATION_RULES[type] || VALIDATION_RULES.general;

  // Length validation
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.TOO_SHORT,
      message: `Must be at least ${rules.minLength} characters`,
      suggestions: []
    };
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.TOO_LONG,
      message: `Must be no more than ${rules.maxLength} characters`,
      suggestions: []
    };
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: rules.message,
      suggestions: getSuggestions(trimmedValue, type)
    };
  }

  // Type-specific validation
  const typeValidation = validateByType(trimmedValue, type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  return {
    isValid: true,
    error: VALIDATION_ERRORS.VALID,
    message: 'Valid input',
    suggestions: getSuggestions(trimmedValue, type)
  };
}

/**
 * Type-specific validation logic
 */
function validateByType(value, type) {
  switch (type) {
    case 'postcode':
      return validatePostcode(value);
    case 'location':
      return validateLocation(value);
    case 'style':
      return validateStyle(value);
    case 'artistName':
      return validateArtistName(value);
    case 'studioName':
      return validateStudioName(value);
    default:
      return { isValid: true };
  }
}

/**
 * Validate UK postcode format
 */
function validatePostcode(postcode) {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;
  
  if (!postcodeRegex.test(cleanPostcode)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: 'Please enter a valid UK postcode (e.g., SW1A 1AA)',
      suggestions: ['SW1A 1AA', 'M1 1AA', 'B1 1AA', 'LS1 1AA']
    };
  }

  return { isValid: true };
}

/**
 * Validate location (city name or postcode)
 */
function validateLocation(location) {
  const trimmedLocation = location.trim();
  
  // Check if it's a postcode
  if (/^[A-Z]{1,2}[0-9]/.test(trimmedLocation.toUpperCase())) {
    return validatePostcode(trimmedLocation);
  }

  // Check if it's a known UK city
  const matchingCities = UK_CITIES.filter(city => 
    city.toLowerCase().includes(trimmedLocation.toLowerCase())
  );

  if (matchingCities.length === 0 && trimmedLocation.length > 2) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: 'Location not recognized. Try a major UK city or postcode.',
      suggestions: UK_CITIES.slice(0, 5)
    };
  }

  return { isValid: true };
}

/**
 * Validate tattoo style
 */
function validateStyle(style) {
  const trimmedStyle = style.trim();
  const matchingStyles = TATTOO_STYLES.filter(s => 
    s.toLowerCase().includes(trimmedStyle.toLowerCase())
  );

  if (matchingStyles.length === 0 && trimmedStyle.length > 2) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: 'Style not recognized. Try a common tattoo style.',
      suggestions: TATTOO_STYLES.slice(0, 6)
    };
  }

  return { isValid: true };
}

/**
 * Validate artist name
 */
function validateArtistName(name) {
  const trimmedName = name.trim();
  
  // Check for common invalid patterns
  if (/^\d+$/.test(trimmedName)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: 'Artist name cannot be only numbers',
      suggestions: []
    };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.TOO_SHORT,
      message: 'Artist name must be at least 2 characters',
      suggestions: []
    };
  }

  return { isValid: true };
}

/**
 * Validate studio name
 */
function validateStudioName(name) {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.TOO_SHORT,
      message: 'Studio name must be at least 2 characters',
      suggestions: []
    };
  }

  return { isValid: true };
}

/**
 * Get suggestions based on input and type
 */
function getSuggestions(value, type) {
  const lowerValue = value.toLowerCase();
  
  switch (type) {
    case 'location':
      return UK_CITIES
        .filter(city => city.toLowerCase().includes(lowerValue))
        .slice(0, 5);
    
    case 'style':
      return TATTOO_STYLES
        .filter(style => style.toLowerCase().includes(lowerValue))
        .slice(0, 5);
    
    case 'postcode':
      if (value.length < 3) {
        return ['SW1A 1AA', 'M1 1AA', 'B1 1AA', 'LS1 1AA'];
      }
      return [];
    
    default:
      return [];
  }
}

/**
 * React component for search validation with visual feedback
 */
export function SearchValidationIndicator({ 
  validation, 
  showSuggestions = true, 
  onSuggestionClick,
  className = '' 
}) {
  if (!validation) return null;

  const getValidationColor = () => {
    if (validation.isValid) return 'text-green-600';
    if (validation.error === VALIDATION_ERRORS.EMPTY) return 'text-neutral-400';
    return 'text-red-600';
  };

  const getValidationIcon = () => {
    if (validation.isValid) return '✓';
    if (validation.error === VALIDATION_ERRORS.EMPTY) return '';
    return '⚠';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Validation Message */}
      {validation.message && (
        <div className={`flex items-center space-x-2 text-sm ${getValidationColor()}`}>
          <span>{getValidationIcon()}</span>
          <span>{validation.message}</span>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-neutral-500">Suggestions:</div>
          <div className="flex flex-wrap gap-1">
            {validation.suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-accent-50 transition-colors"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for real-time search validation with debouncing
 */
export function useSearchValidation(initialValue = '', type = 'general', debounceMs = 300) {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation effect
  useEffect(() => {
    if (!value) {
      setValidation(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    
    const timeoutId = setTimeout(() => {
      const result = validateSearchInput(value, type);
      setValidation(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, type, debounceMs]);

  const updateValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  const clearValue = useCallback(() => {
    setValue('');
    setValidation(null);
    setIsValidating(false);
  }, []);

  return {
    value,
    validation,
    isValidating,
    updateValue,
    clearValue,
    isValid: validation?.isValid || false,
    hasError: validation && !validation.isValid,
    suggestions: validation?.suggestions || []
  };
}

export default SearchValidationIndicator;