const Joi = require('joi');

// Artist data validation schema
const artistSchema = Joi.object({
  artistId: Joi.string().required().pattern(/^artist-\d+$/),
  artistName: Joi.string().required().min(2).max(100),
  instagramHandle: Joi.string().required().min(1).max(50),
  geohash: Joi.string().required().min(5).max(12),
  locationDisplay: Joi.string().required().min(5).max(200),
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  styles: Joi.array().items(Joi.string()).min(1).max(10).required(),
  specialties: Joi.array().items(Joi.string()).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  portfolioImages: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      description: Joi.string().required().min(5).max(200),
      style: Joi.string().required(),
      tags: Joi.array().items(Joi.string()).optional()
    })
  ).min(1).max(20).required(),
  contactInfo: Joi.object({
    instagram: Joi.string().required(),
    website: Joi.string().uri().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional()
  }).required(),
  studioInfo: Joi.object({
    studioName: Joi.string().required(),
    address: Joi.string().required(),
    postcode: Joi.string().required()
  }).optional(),
  pricing: Joi.object({
    hourlyRate: Joi.number().integer().min(0).max(1000).optional(),
    minimumCharge: Joi.number().integer().min(0).max(500).optional(),
    currency: Joi.string().valid('GBP', 'USD', 'EUR').optional()
  }).optional(),
  availability: Joi.object({
    bookingOpen: Joi.boolean().required(),
    nextAvailable: Joi.string().isoDate().optional(),
    waitingList: Joi.boolean().optional()
  }).optional(),
  experience: Joi.object({
    yearsActive: Joi.number().integer().min(0).max(50).optional(),
    apprenticeshipCompleted: Joi.boolean().optional(),
    certifications: Joi.array().items(Joi.string()).optional()
  }).optional()
});

// Studio data validation schema
const studioSchema = Joi.object({
  studioId: Joi.string().required().pattern(/^studio-\d+$/),
  studioName: Joi.string().required().min(2).max(100),
  address: Joi.string().required().min(10).max(200),
  postcode: Joi.string().required().min(3).max(10),
  geohash: Joi.string().required().min(5).max(12),
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  locationDisplay: Joi.string().required().min(5).max(200),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional(),
    instagram: Joi.string().optional()
  }).required(),
  openingHours: Joi.object().pattern(
    Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    Joi.alternatives().try(
      Joi.string().valid('closed'),
      Joi.string().pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    )
  ).required(),
  artists: Joi.array().items(Joi.string().pattern(/^artist-\d+$/)).min(0).required(),
  rating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  established: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  specialties: Joi.array().items(Joi.string()).optional()
});

// Style data validation schema
const styleSchema = Joi.object({
  styleId: Joi.string().required().min(2).max(50),
  styleName: Joi.string().required().min(2).max(100),
  description: Joi.string().required().min(10).max(500),
  characteristics: Joi.array().items(Joi.string()).min(1).max(20).required(),
  popularMotifs: Joi.array().items(Joi.string()).min(1).max(20).required(),
  colorPalette: Joi.array().items(Joi.string()).min(1).max(20).required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  timeOrigin: Joi.string().required().min(4).max(50),
  aliases: Joi.array().items(Joi.string()).optional()
});

/**
 * Validate artist data against schema
 * @param {Object} artistData - Artist data to validate
 * @returns {Object} Joi validation result
 */
function validateArtistData(artistData) {
  return artistSchema.validate(artistData, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });
}

/**
 * Validate studio data against schema
 * @param {Object} studioData - Studio data to validate
 * @returns {Object} Joi validation result
 */
function validateStudioData(studioData) {
  return studioSchema.validate(studioData, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });
}

/**
 * Validate style data against schema
 * @param {Object} styleData - Style data to validate
 * @returns {Object} Joi validation result
 */
function validateStyleData(styleData) {
  return styleSchema.validate(styleData, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });
}

/**
 * Validate all test data files
 * @param {string} testDataDir - Directory containing test data files
 * @returns {Object} Validation results for all files
 */
function validateAllTestData(testDataDir) {
  const fs = require('fs');
  const path = require('path');
  
  const results = {
    artists: { valid: 0, invalid: 0, errors: [] },
    studios: { valid: 0, invalid: 0, errors: [] },
    styles: { valid: 0, invalid: 0, errors: [] }
  };

  // Validate artists
  try {
    const artistsPath = path.join(testDataDir, 'artists.json');
    if (fs.existsSync(artistsPath)) {
      const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
      artists.forEach((artist, index) => {
        const validation = validateArtistData(artist);
        if (validation.error) {
          results.artists.invalid++;
          results.artists.errors.push({
            index,
            artistId: artist.artistId,
            errors: validation.error.details.map(d => d.message)
          });
        } else {
          results.artists.valid++;
        }
      });
    }
  } catch (error) {
    results.artists.errors.push({ file: 'artists.json', error: error.message });
  }

  // Validate studios
  try {
    const studiosPath = path.join(testDataDir, 'studios.json');
    if (fs.existsSync(studiosPath)) {
      const studios = JSON.parse(fs.readFileSync(studiosPath, 'utf8'));
      studios.forEach((studio, index) => {
        const validation = validateStudioData(studio);
        if (validation.error) {
          results.studios.invalid++;
          results.studios.errors.push({
            index,
            studioId: studio.studioId,
            errors: validation.error.details.map(d => d.message)
          });
        } else {
          results.studios.valid++;
        }
      });
    }
  } catch (error) {
    results.studios.errors.push({ file: 'studios.json', error: error.message });
  }

  // Validate styles
  try {
    const stylesPath = path.join(testDataDir, 'styles.json');
    if (fs.existsSync(stylesPath)) {
      const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'));
      styles.forEach((style, index) => {
        const validation = validateStyleData(style);
        if (validation.error) {
          results.styles.invalid++;
          results.styles.errors.push({
            index,
            styleId: style.styleId,
            errors: validation.error.details.map(d => d.message)
          });
        } else {
          results.styles.valid++;
        }
      });
    }
  } catch (error) {
    results.styles.errors.push({ file: 'styles.json', error: error.message });
  }

  return results;
}

module.exports = {
  validateArtistData,
  validateStudioData,
  validateStyleData,
  validateAllTestData,
  artistSchema,
  studioSchema,
  styleSchema
};