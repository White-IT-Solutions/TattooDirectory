"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../../utils/cn';
// Toast notifications are handled at a higher level to avoid SSR issues
import Input from '../../ui/Input/Input';
import Badge from '../../ui/Badge/Badge';

/**
 * SearchValidation - Real-time validation feedback for search forms
 * 
 * Features:
 * - Real-time validation as user types
 * - Visual feedback with success/warning/error states
 * - Helpful suggestions and corrections
 * - Debounced validation to avoid excessive API calls
 * - Integration with existing Input component validation states
 */

// Validation rules for different search types
const validationRules = {
  general: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.,&]+$/,
    message: 'Search must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation'
  },
  postcode: {
    pattern: /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i,
    message: 'Please enter a valid UK postcode (e.g., SW1A 1AA)'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    pattern: /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/,
    message: 'Please enter a valid UK mobile number'
  },
  artistName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: 'Artist name should contain only letters, spaces, hyphens, and apostrophes'
  },
  studioName: {
    minLength: 2,
    maxLength: 80,
    pattern: /^[a-zA-Z0-9\s\-'.,&]+$/,
    message: 'Studio name should contain only letters, numbers, spaces, and basic punctuation'
  }
};

// Common search suggestions
const searchSuggestions = {
  styles: [
    'Traditional', 'Realism', 'Watercolor', 'Japanese', 'Tribal', 'Geometric',
    'Minimalist', 'Black & Grey', 'Neo-Traditional', 'Biomechanical'
  ],
  locations: [
    'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield',
    'Bristol', 'Newcastle', 'Nottingham', 'Leicester'
  ],
  artists: [
    'Sarah Chen', 'Marcus Rodriguez', 'Emma Thompson', 'James Wilson',
    'Lisa Parker', 'David Brown', 'Sophie Taylor', 'Michael Davis'
  ],
  studios: [
    'Ink & Steel', 'Black Rose Tattoo', 'Sacred Art', 'Urban Canvas',
    'The Tattoo Studio', 'Skin Deep', 'Electric Ink', 'Royal Tattoo'
  ]
};

// Validation hook for search inputs
export function useSearchValidation(type = 'general', debounceMs = 300) {
  const [value, setValue] = useState('');
  const [validation, setValidation] = useState({
    isValid: true,
    message: '',
    suggestions: [],
    variant: 'default' // 'default', 'success', 'warning', 'error'
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateValue = useCallback(async (inputValue) => {
    if (!inputValue.trim()) {
      setValidation({
        isValid: true,
        message: '',
        suggestions: [],
        variant: 'default'
      });
      return;
    }

    setIsValidating(true);

    // Simulate async validation delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const rule = validationRules[type] || validationRules.general;
    const trimmedValue = inputValue.trim();
    
    // Length validation
    if (rule.minLength && trimmedValue.length < rule.minLength) {
      setValidation({
        isValid: false,
        message: `Minimum ${rule.minLength} characters required`,
        suggestions: getSuggestions(type, trimmedValue),
        variant: 'warning'
      });
      setIsValidating(false);
      return;
    }

    if (rule.maxLength && trimmedValue.length > rule.maxLength) {
      setValidation({
        isValid: false,
        message: `Maximum ${rule.maxLength} characters allowed`,
        suggestions: [],
        variant: 'error'
      });
      setIsValidating(false);
      return;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(trimmedValue)) {
      setValidation({
        isValid: false,
        message: rule.message,
        suggestions: getSuggestions(type, trimmedValue),
        variant: 'error'
      });
      setIsValidating(false);
      return;
    }

    // Special validations
    const specialValidation = await performSpecialValidation(type, trimmedValue);
    if (specialValidation) {
      setValidation(specialValidation);
      setIsValidating(false);
      return;
    }

    // Success state
    setValidation({
      isValid: true,
      message: getSuccessMessage(type, trimmedValue),
      suggestions: [],
      variant: 'success'
    });
    setIsValidating(false);
  }, [type]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validateValue, debounceMs]);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return {
    value,
    setValue,
    validation,
    isValidating,
    handleChange
  };
}

// Get suggestions based on search type and current value
function getSuggestions(type, value) {
  const suggestions = searchSuggestions[type] || [];
  const lowerValue = value.toLowerCase();
  
  return suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(lowerValue) ||
      lowerValue.includes(suggestion.toLowerCase())
    )
    .slice(0, 5);
}

// Perform special validation for specific types
async function performSpecialValidation(type, value) {
  switch (type) {
    case 'postcode': {
      // Simulate postcode validation API call
      const isValidPostcode = await validatePostcode(value);
      if (!isValidPostcode) {
        return {
          isValid: false,
          message: 'Postcode not found. Please check and try again.',
          suggestions: ['SW1A 1AA', 'M1 1AA', 'B1 1AA'],
          variant: 'error'
        };
      }
      break;
    }

    case 'artistName': {
      // Check if artist exists
      const artistExists = await checkArtistExists(value);
      if (!artistExists && value.length >= 3) {
        return {
          isValid: true,
          message: 'Artist not found. Showing similar results.',
          suggestions: getSuggestions('artists', value),
          variant: 'warning'
        };
      }
      break;
    }

    case 'studioName': {
      // Check if studio exists
      const studioExists = await checkStudioExists(value);
      if (!studioExists && value.length >= 3) {
        return {
          isValid: true,
          message: 'Studio not found. Showing similar results.',
          suggestions: getSuggestions('studios', value),
          variant: 'warning'
        };
      }
      break;
    }
  }

  return null;
}

// Mock validation functions (replace with real API calls)
async function validatePostcode(postcode) {
  // Simulate API call
  const validPostcodes = ['SW1A 1AA', 'M1 1AA', 'B1 1AA', 'LS1 1AA'];
  return validPostcodes.some(valid => 
    valid.toLowerCase().replace(/\s/g, '') === postcode.toLowerCase().replace(/\s/g, '')
  );
}

async function checkArtistExists(name) {
  // Simulate API call
  const existingArtists = searchSuggestions.artists;
  return existingArtists.some(artist => 
    artist.toLowerCase().includes(name.toLowerCase())
  );
}

async function checkStudioExists(name) {
  // Simulate API call
  const existingStudios = searchSuggestions.studios;
  return existingStudios.some(studio => 
    studio.toLowerCase().includes(name.toLowerCase())
  );
}

// Get success message for valid input
function getSuccessMessage(type) {
  switch (type) {
    case 'postcode':
      return 'Valid postcode';
    case 'email':
      return 'Valid email address';
    case 'phone':
      return 'Valid phone number';
    case 'artistName':
      return 'Artist found';
    case 'studioName':
      return 'Studio found';
    default:
      return 'Valid input';
  }
}

// Validated Search Input Component
export function ValidatedSearchInput({
  type = 'general',
  label,
  placeholder,
  onValidatedChange,
  showSuggestions = true,
  className,
  ...props
}) {
  const { value, validation, isValidating, handleChange } = useSearchValidation(type);
  const callbackRef = useRef(onValidatedChange);
  
  // Update callback ref
  useEffect(() => {
    callbackRef.current = onValidatedChange;
  });

  // Notify parent of validated changes
  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current({
        value,
        isValid: validation.isValid,
        validation
      });
    }
  }, [value, validation.isValid, validation.variant, validation.message]);

  const handleSuggestionClick = (suggestion) => {
    const event = { target: { value: suggestion } };
    handleChange(event);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        type="search"
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        variant={validation.variant}
        error={validation.variant === 'error' ? validation.message : undefined}
        warning={validation.variant === 'warning' ? validation.message : undefined}
        success={validation.variant === 'success' ? validation.message : undefined}
        {...props}
      />

      {/* Validation Indicator */}
      {isValidating && (
        <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-[var(--interactive-primary)]" />
          <span>Validating...</span>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && validation.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Suggestions:
          </p>
          <div className="flex flex-wrap gap-1">
            {validation.suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-[var(--interactive-secondary)] transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
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

// Multi-field search form with validation
export function ValidatedSearchForm({
  fields = [],
  onSubmit,
  onValidationChange,
  className
}) {
  const [fieldStates, setFieldStates] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Update field state
  const handleFieldChange = useCallback((fieldName, fieldData) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: fieldData
    }));
  }, []);

  // Check overall form validity
  useEffect(() => {
    const allFieldsValid = fields.every(field => {
      const fieldState = fieldStates[field.name];
      return !fieldState || fieldState.isValid;
    });

    setIsFormValid(allFieldsValid);
    
    if (onValidationChange) {
      onValidationChange({
        isValid: allFieldsValid,
        fields: fieldStates
      });
    }
  }, [fieldStates, fields, onValidationChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isFormValid && onSubmit) {
      const formData = {};
      fields.forEach(field => {
        const fieldState = fieldStates[field.name];
        formData[field.name] = fieldState?.value || '';
      });
      
      onSubmit(formData, fieldStates);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {fields.map((field) => (
        <ValidatedSearchInput
          key={field.name}
          type={field.type}
          label={field.label}
          placeholder={field.placeholder}
          onValidatedChange={(data) => handleFieldChange(field.name, data)}
          showSuggestions={field.showSuggestions !== false}
          required={field.required}
        />
      ))}

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-[var(--text-secondary)]">
          {isFormValid ? (
            <span className="text-[var(--feedback-success)]">✓ Form is valid</span>
          ) : (
            <span>Please complete all required fields</span>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={cn(
            'px-4 py-2 rounded-[var(--radius)] font-medium transition-all duration-200',
            isFormValid
              ? 'bg-[var(--interactive-primary)] text-white hover:bg-[var(--interactive-primary-hover)]'
              : 'bg-[var(--background-muted)] text-[var(--text-muted)] cursor-not-allowed'
          )}
        >
          Search
        </button>
      </div>
    </form>
  );
}

// Simple SearchValidation component for displaying validation messages
export function SearchValidation({ isValid, message, className = "" }) {
  if (!message) return null;

  return (
    <div className={`text-sm mt-1 ${className}`}>
      <span className={isValid ? "text-green-600" : "text-red-600"}>
        {message}
      </span>
    </div>
  );
}

export default ValidatedSearchInput;