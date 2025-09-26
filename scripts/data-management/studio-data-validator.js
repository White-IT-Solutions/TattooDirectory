#!/usr/bin/env node

/**
 * Studio Data Validator
 * 
 * Comprehensive validation for studio data including required fields,
 * UK postcode format, coordinate accuracy, opening hours format,
 * specialty validation, and contact information format validation.
 */

const { DATA_CONFIG } = require('../data-config');

class StudioDataValidator {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.validationRules = config.validation.studio;
    this.studioConfig = config.studio;
    
    // UK postcode pattern (more comprehensive)
    this.postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    
    // Contact validation patterns
    this.contactPatterns = {
      phone: /^(\+44\s?(\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{6})|0\d{10})$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      website: /^https?:\/\/.+/,
      instagram: /^@[a-zA-Z0-9._]+$/
    };
    
    // Opening hours patterns
    this.openingHoursPattern = /^(closed|([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9])$/;
    
    // Valid days of the week
    this.validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Valid specialties (from config)
    this.validSpecialties = this.studioConfig.generation.defaultSpecialties;
  }

  /**
   * Validate a single studio object
   * @param {Object} studio - Studio data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateStudio(studio) {
    const errors = [];
    const warnings = [];

    try {
      // Validate required fields
      this.validateRequiredFields(studio, errors);
      
      // Validate studio ID format
      this.validateStudioId(studio.studioId, errors);
      
      // Validate studio name
      this.validateStudioName(studio.studioName, errors);
      
      // Validate address and postcode
      this.validateAddress(studio, errors);
      
      // Validate coordinates
      this.validateCoordinates(studio, errors);
      
      // Validate contact information
      this.validateContactInfo(studio.contactInfo, errors);
      
      // Validate opening hours
      this.validateOpeningHours(studio.openingHours, errors);
      
      // Validate specialties
      this.validateSpecialties(studio.specialties, errors);
      
      // Validate rating and review count
      this.validateRatingData(studio, errors, warnings);
      
      // Validate established year
      this.validateEstablishedYear(studio.established, errors, warnings);
      
      // Validate artist relationships
      this.validateArtistRelationships(studio, errors, warnings);

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      studioId: studio?.studioId || 'unknown'
    };
  }

  /**
   * Validate multiple studios
   * @param {Array} studios - Array of studio objects to validate
   * @returns {Object} Validation summary with overall result and individual results
   */
  validateStudios(studios) {
    if (!Array.isArray(studios)) {
      return {
        isValid: false,
        errors: ['Studios data must be an array'],
        warnings: [],
        results: [],
        summary: { total: 0, valid: 0, invalid: 0 }
      };
    }

    const results = [];
    const allErrors = [];
    const allWarnings = [];
    let validCount = 0;

    // Validate each studio
    for (let i = 0; i < studios.length; i++) {
      const studio = studios[i];
      const result = this.validateStudio(studio);
      
      // Add index information for easier debugging
      result.index = i;
      results.push(result);
      
      if (result.isValid) {
        validCount++;
      } else {
        // Prefix errors with studio identifier
        const studioId = studio?.studioId || `index-${i}`;
        result.errors.forEach(error => {
          allErrors.push(`Studio ${studioId}: ${error}`);
        });
      }
      
      // Collect warnings
      result.warnings.forEach(warning => {
        const studioId = studio?.studioId || `index-${i}`;
        allWarnings.push(`Studio ${studioId}: ${warning}`);
      });
    }

    // Check for duplicate studio IDs
    this.validateUniqueStudioIds(studios, allErrors);

    const summary = {
      total: studios.length,
      valid: validCount,
      invalid: studios.length - validCount
    };

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      results,
      summary
    };
  }

  /**
   * Validate required fields are present and not empty
   */
  validateRequiredFields(studio, errors) {
    const requiredFields = this.validationRules.requiredFields;
    
    for (const field of requiredFields) {
      if (!studio.hasOwnProperty(field)) {
        errors.push(`Missing required field: ${field}`);
      } else if (studio[field] === null || studio[field] === undefined) {
        errors.push(`Required field ${field} cannot be null or undefined`);
      } else if (typeof studio[field] === 'string' && studio[field].trim() === '') {
        errors.push(`Required field ${field} cannot be empty`);
      } else if (Array.isArray(studio[field]) && studio[field].length === 0) {
        errors.push(`Required field ${field} cannot be an empty array`);
      }
    }
  }

  /**
   * Validate studio ID format
   */
  validateStudioId(studioId, errors) {
    if (!studioId) return;
    
    if (typeof studioId !== 'string') {
      errors.push('Studio ID must be a string');
      return;
    }
    
    // Check format: should be like "studio-001", "studio-002", etc.
    const studioIdPattern = /^studio-\d{3,}$/;
    if (!studioIdPattern.test(studioId)) {
      errors.push('Studio ID must follow format "studio-XXX" where XXX is a number with at least 3 digits');
    }
  }

  /**
   * Validate studio name
   */
  validateStudioName(studioName, errors) {
    if (!studioName) return;
    
    if (typeof studioName !== 'string') {
      errors.push('Studio name must be a string');
      return;
    }
    
    if (studioName.trim().length < 2) {
      errors.push('Studio name must be at least 2 characters long');
    }
    
    if (studioName.length > 100) {
      errors.push('Studio name must be less than 100 characters');
    }
  }

  /**
   * Validate address and postcode
   */
  validateAddress(studio, errors) {
    // Validate address
    if (studio.address) {
      if (typeof studio.address !== 'string') {
        errors.push('Address must be a string');
      } else if (studio.address.trim().length < 10) {
        errors.push('Address must be at least 10 characters long');
      }
    }
    
    // Validate postcode format
    if (studio.postcode) {
      if (typeof studio.postcode !== 'string') {
        errors.push('Postcode must be a string');
      } else if (!this.postcodePattern.test(studio.postcode.trim())) {
        errors.push(`Invalid UK postcode format: ${studio.postcode}`);
      }
    }
    
    // Validate location display
    if (studio.locationDisplay) {
      if (typeof studio.locationDisplay !== 'string') {
        errors.push('Location display must be a string');
      } else if (!studio.locationDisplay.includes('UK')) {
        errors.push('Location display should include "UK" for UK-based studios');
      }
    }
  }

  /**
   * Validate coordinate accuracy for latitude/longitude
   */
  validateCoordinates(studio, errors) {
    const { latitude, longitude } = studio;
    const ranges = this.validationRules.coordinateRanges;
    
    // Validate latitude
    if (latitude !== undefined) {
      if (typeof latitude !== 'number') {
        errors.push('Latitude must be a number');
      } else if (latitude < ranges.latitude.min || latitude > ranges.latitude.max) {
        errors.push(`Latitude ${latitude} is outside UK range (${ranges.latitude.min} to ${ranges.latitude.max})`);
      }
    }
    
    // Validate longitude
    if (longitude !== undefined) {
      if (typeof longitude !== 'number') {
        errors.push('Longitude must be a number');
      } else if (longitude < ranges.longitude.min || longitude > ranges.longitude.max) {
        errors.push(`Longitude ${longitude} is outside UK range (${ranges.longitude.min} to ${ranges.longitude.max})`);
      }
    }
    
    // Validate geohash if present
    if (studio.geohash) {
      if (typeof studio.geohash !== 'string') {
        errors.push('Geohash must be a string');
      } else if (studio.geohash.length < 5 || studio.geohash.length > 12) {
        errors.push('Geohash should be between 5 and 12 characters');
      }
    }
  }

  /**
   * Validate contact information format
   */
  validateContactInfo(contactInfo, errors) {
    if (!contactInfo || typeof contactInfo !== 'object') {
      errors.push('Contact info must be an object');
      return;
    }
    
    // Validate phone number
    if (contactInfo.phone) {
      if (typeof contactInfo.phone !== 'string') {
        errors.push('Phone number must be a string');
      } else if (!this.contactPatterns.phone.test(contactInfo.phone)) {
        errors.push(`Invalid UK phone number format: ${contactInfo.phone}`);
      }
    }
    
    // Validate email
    if (contactInfo.email) {
      if (typeof contactInfo.email !== 'string') {
        errors.push('Email must be a string');
      } else if (!this.contactPatterns.email.test(contactInfo.email)) {
        errors.push(`Invalid email format: ${contactInfo.email}`);
      }
    }
    
    // Validate website
    if (contactInfo.website) {
      if (typeof contactInfo.website !== 'string') {
        errors.push('Website must be a string');
      } else if (!this.contactPatterns.website.test(contactInfo.website)) {
        errors.push(`Invalid website URL format: ${contactInfo.website}`);
      }
    }
    
    // Validate Instagram handle
    if (contactInfo.instagram) {
      if (typeof contactInfo.instagram !== 'string') {
        errors.push('Instagram handle must be a string');
      } else if (!this.contactPatterns.instagram.test(contactInfo.instagram)) {
        errors.push(`Invalid Instagram handle format: ${contactInfo.instagram} (should start with @)`);
      }
    }
  }

  /**
   * Validate opening hours format
   */
  validateOpeningHours(openingHours, errors) {
    if (!openingHours || typeof openingHours !== 'object') {
      errors.push('Opening hours must be an object');
      return;
    }
    
    // Check all days are present
    for (const day of this.validDays) {
      if (!openingHours.hasOwnProperty(day)) {
        errors.push(`Missing opening hours for ${day}`);
      } else {
        const hours = openingHours[day];
        if (typeof hours !== 'string') {
          errors.push(`Opening hours for ${day} must be a string`);
        } else if (!this.openingHoursPattern.test(hours)) {
          errors.push(`Invalid opening hours format for ${day}: ${hours} (expected "HH:MM-HH:MM" or "closed")`);
        }
      }
    }
    
    // Check for invalid days
    Object.keys(openingHours).forEach(day => {
      if (!this.validDays.includes(day)) {
        errors.push(`Invalid day in opening hours: ${day}`);
      }
    });
  }

  /**
   * Validate specialties against allowed values
   */
  validateSpecialties(specialties, errors) {
    if (!Array.isArray(specialties)) {
      errors.push('Specialties must be an array');
      return;
    }
    
    if (specialties.length === 0) {
      errors.push('Studio must have at least one specialty');
      return;
    }
    
    if (specialties.length > 8) {
      errors.push('Studio cannot have more than 8 specialties');
    }
    
    // Check each specialty is valid
    specialties.forEach((specialty, index) => {
      if (typeof specialty !== 'string') {
        errors.push(`Specialty at index ${index} must be a string`);
      } else if (!this.validSpecialties.includes(specialty)) {
        errors.push(`Invalid specialty: ${specialty}. Valid specialties: ${this.validSpecialties.join(', ')}`);
      }
    });
    
    // Check for duplicates
    const uniqueSpecialties = [...new Set(specialties)];
    if (uniqueSpecialties.length !== specialties.length) {
      errors.push('Specialties array contains duplicates');
    }
  }

  /**
   * Validate rating and review count data
   */
  validateRatingData(studio, errors, warnings) {
    // Validate rating
    if (studio.rating !== undefined) {
      if (typeof studio.rating !== 'number') {
        errors.push('Rating must be a number');
      } else if (studio.rating < 1.0 || studio.rating > 5.0) {
        errors.push('Rating must be between 1.0 and 5.0');
      } else if (studio.rating < 3.5) {
        warnings.push('Rating is below 3.5, which may indicate quality issues');
      }
    }
    
    // Validate review count
    if (studio.reviewCount !== undefined) {
      if (typeof studio.reviewCount !== 'number' || !Number.isInteger(studio.reviewCount)) {
        errors.push('Review count must be an integer');
      } else if (studio.reviewCount < 0) {
        errors.push('Review count cannot be negative');
      } else if (studio.reviewCount < 10) {
        warnings.push('Review count is low (less than 10), which may affect credibility');
      }
    }
  }

  /**
   * Validate established year
   */
  validateEstablishedYear(established, errors, warnings) {
    if (established !== undefined) {
      if (typeof established !== 'number' || !Number.isInteger(established)) {
        errors.push('Established year must be an integer');
      } else {
        const currentYear = new Date().getFullYear();
        const minYear = 1950; // Reasonable minimum for tattoo studios
        
        if (established < minYear || established > currentYear) {
          errors.push(`Established year ${established} is outside reasonable range (${minYear}-${currentYear})`);
        } else if (established > currentYear - 1) {
          warnings.push('Studio was established very recently (within last year)');
        }
      }
    }
  }

  /**
   * Validate artist relationships
   */
  validateArtistRelationships(studio, errors, warnings) {
    if (studio.artists) {
      if (!Array.isArray(studio.artists)) {
        errors.push('Artists must be an array');
      } else {
        if (studio.artists.length === 0) {
          warnings.push('Studio has no associated artists');
        }
        
        // Validate artist ID format
        studio.artists.forEach((artistId, index) => {
          if (typeof artistId !== 'string') {
            errors.push(`Artist ID at index ${index} must be a string`);
          } else if (!/^artist-\d{3,}$/.test(artistId)) {
            errors.push(`Invalid artist ID format at index ${index}: ${artistId}`);
          }
        });
        
        // Check for duplicate artist IDs
        const uniqueArtists = [...new Set(studio.artists)];
        if (uniqueArtists.length !== studio.artists.length) {
          errors.push('Artists array contains duplicate IDs');
        }
      }
    }
    
    // Validate artist count consistency
    if (studio.artistCount !== undefined) {
      if (typeof studio.artistCount !== 'number' || !Number.isInteger(studio.artistCount)) {
        errors.push('Artist count must be an integer');
      } else if (studio.artists && studio.artistCount !== studio.artists.length) {
        errors.push(`Artist count (${studio.artistCount}) does not match artists array length (${studio.artists.length})`);
      }
    }
  }

  /**
   * Validate unique studio IDs across all studios
   */
  validateUniqueStudioIds(studios, errors) {
    const studioIds = studios
      .map(studio => studio.studioId)
      .filter(id => id); // Filter out undefined/null IDs
    
    const uniqueIds = [...new Set(studioIds)];
    
    if (uniqueIds.length !== studioIds.length) {
      // Find duplicates
      const duplicates = studioIds.filter((id, index) => studioIds.indexOf(id) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];
      errors.push(`Duplicate studio IDs found: ${uniqueDuplicates.join(', ')}`);
    }
  }

  /**
   * Generate a validation report
   */
  generateValidationReport(validationResult) {
    const { isValid, errors, warnings, results, summary } = validationResult;
    
    const report = {
      timestamp: new Date().toISOString(),
      overall: {
        isValid,
        totalStudios: summary?.total || 0,
        validStudios: summary?.valid || 0,
        invalidStudios: summary?.invalid || 0
      },
      errors: errors || [],
      warnings: warnings || [],
      details: results || []
    };
    
    return report;
  }

  /**
   * Format validation report as human-readable text
   */
  formatValidationReport(validationResult) {
    const report = this.generateValidationReport(validationResult);
    const lines = [];
    
    lines.push('🏢 Studio Data Validation Report');
    lines.push('================================');
    lines.push(`Generated: ${report.timestamp}`);
    lines.push('');
    
    // Overall summary
    lines.push('📊 Summary:');
    lines.push(`  Total Studios: ${report.overall.totalStudios}`);
    lines.push(`  Valid Studios: ${report.overall.validStudios}`);
    lines.push(`  Invalid Studios: ${report.overall.invalidStudios}`);
    lines.push(`  Overall Status: ${report.overall.isValid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push('');
    
    // Errors
    if (report.errors.length > 0) {
      lines.push('❌ Errors:');
      report.errors.forEach(error => {
        lines.push(`  • ${error}`);
      });
      lines.push('');
    }
    
    // Warnings
    if (report.warnings.length > 0) {
      lines.push('⚠️  Warnings:');
      report.warnings.forEach(warning => {
        lines.push(`  • ${warning}`);
      });
      lines.push('');
    }
    
    // Individual studio results (only show invalid ones)
    const invalidStudios = report.details.filter(result => !result.isValid);
    if (invalidStudios.length > 0) {
      lines.push('🔍 Invalid Studios:');
      invalidStudios.forEach(result => {
        lines.push(`  Studio ${result.studioId}:`);
        result.errors.forEach(error => {
          lines.push(`    • ${error}`);
        });
      });
    }
    
    return lines.join('\n');
  }
}

module.exports = {
  StudioDataValidator
};

// CLI usage when run directly
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  async function main() {
    const args = process.argv.slice(2);
    const filePath = args[0];
    
    if (!filePath) {
      console.error('❌ Usage: node studio-data-validator.js <path-to-studios.json>');
      console.log('\nExample:');
      console.log('  node studio-data-validator.js ../test-data/studios.json');
      process.exit(1);
    }
    
    try {
      // Read studio data
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
      }
      
      const studiosData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      // Validate studios
      const validator = new StudioDataValidator();
      const result = validator.validateStudios(studiosData);
      
      // Display report
      console.log(validator.formatValidationReport(result));
      
      // Exit with appropriate code
      process.exit(result.isValid ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}