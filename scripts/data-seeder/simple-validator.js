const fs = require('fs');
const path = require('path');

/**
 * Simple data validation without external dependencies
 */
function validateArtistData(artist) {
  const errors = [];
  
  // Required fields
  if (!artist.artistId || typeof artist.artistId !== 'string') {
    errors.push('artistId is required and must be a string');
  }
  if (!artist.artistName || typeof artist.artistName !== 'string') {
    errors.push('artistName is required and must be a string');
  }
  if (!artist.instagramHandle || typeof artist.instagramHandle !== 'string') {
    errors.push('instagramHandle is required and must be a string');
  }
  if (!artist.geohash || typeof artist.geohash !== 'string') {
    errors.push('geohash is required and must be a string');
  }
  if (!artist.locationDisplay || typeof artist.locationDisplay !== 'string') {
    errors.push('locationDisplay is required and must be a string');
  }
  if (typeof artist.latitude !== 'number' || artist.latitude < -90 || artist.latitude > 90) {
    errors.push('latitude must be a number between -90 and 90');
  }
  if (typeof artist.longitude !== 'number' || artist.longitude < -180 || artist.longitude > 180) {
    errors.push('longitude must be a number between -180 and 180');
  }
  if (!Array.isArray(artist.styles) || artist.styles.length === 0) {
    errors.push('styles must be a non-empty array');
  }
  if (!Array.isArray(artist.portfolioImages) || artist.portfolioImages.length === 0) {
    errors.push('portfolioImages must be a non-empty array');
  }
  if (!artist.contactInfo || typeof artist.contactInfo !== 'object') {
    errors.push('contactInfo is required and must be an object');
  }
  
  return errors;
}

function validateStudioData(studio) {
  const errors = [];
  
  // Required fields
  if (!studio.studioId || typeof studio.studioId !== 'string') {
    errors.push('studioId is required and must be a string');
  }
  if (!studio.studioName || typeof studio.studioName !== 'string') {
    errors.push('studioName is required and must be a string');
  }
  if (!studio.address || typeof studio.address !== 'string') {
    errors.push('address is required and must be a string');
  }
  if (!studio.postcode || typeof studio.postcode !== 'string') {
    errors.push('postcode is required and must be a string');
  }
  if (!studio.geohash || typeof studio.geohash !== 'string') {
    errors.push('geohash is required and must be a string');
  }
  if (typeof studio.latitude !== 'number' || studio.latitude < -90 || studio.latitude > 90) {
    errors.push('latitude must be a number between -90 and 90');
  }
  if (typeof studio.longitude !== 'number' || studio.longitude < -180 || studio.longitude > 180) {
    errors.push('longitude must be a number between -180 and 180');
  }
  if (!studio.contactInfo || typeof studio.contactInfo !== 'object') {
    errors.push('contactInfo is required and must be an object');
  }
  if (!Array.isArray(studio.artists)) {
    errors.push('artists must be an array');
  }
  
  return errors;
}

function validateStyleData(style) {
  const errors = [];
  
  // Required fields
  if (!style.styleId || typeof style.styleId !== 'string') {
    errors.push('styleId is required and must be a string');
  }
  if (!style.styleName || typeof style.styleName !== 'string') {
    errors.push('styleName is required and must be a string');
  }
  if (!style.description || typeof style.description !== 'string') {
    errors.push('description is required and must be a string');
  }
  if (!Array.isArray(style.characteristics) || style.characteristics.length === 0) {
    errors.push('characteristics must be a non-empty array');
  }
  if (!Array.isArray(style.popularMotifs) || style.popularMotifs.length === 0) {
    errors.push('popularMotifs must be a non-empty array');
  }
  if (!Array.isArray(style.colorPalette) || style.colorPalette.length === 0) {
    errors.push('colorPalette must be a non-empty array');
  }
  if (!style.difficulty || !['beginner', 'intermediate', 'advanced'].includes(style.difficulty)) {
    errors.push('difficulty must be one of: beginner, intermediate, advanced');
  }
  
  return errors;
}

async function main() {
  console.log('🔍 Validating test data files...');
  
  const testDataDir = path.join(__dirname, '..', 'test-data');
  let totalValid = 0;
  let totalInvalid = 0;
  let hasErrors = false;
  
  // Validate artists
  try {
    const artistsPath = path.join(testDataDir, 'artists.json');
    if (fs.existsSync(artistsPath)) {
      const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
      console.log(`\n📊 Validating ${artists.length} artists...`);
      
      artists.forEach((artist, index) => {
        const errors = validateArtistData(artist);
        if (errors.length > 0) {
          hasErrors = true;
          totalInvalid++;
          console.log(`❌ Artist ${artist.artistId || `index ${index}`}:`);
          errors.forEach(error => console.log(`  - ${error}`));
        } else {
          totalValid++;
        }
      });
    }
  } catch (error) {
    console.error('❌ Error validating artists.json:', error.message);
    hasErrors = true;
  }
  
  // Validate studios
  try {
    const studiosPath = path.join(testDataDir, 'studios.json');
    if (fs.existsSync(studiosPath)) {
      const studios = JSON.parse(fs.readFileSync(studiosPath, 'utf8'));
      console.log(`\n📊 Validating ${studios.length} studios...`);
      
      studios.forEach((studio, index) => {
        const errors = validateStudioData(studio);
        if (errors.length > 0) {
          hasErrors = true;
          totalInvalid++;
          console.log(`❌ Studio ${studio.studioId || `index ${index}`}:`);
          errors.forEach(error => console.log(`  - ${error}`));
        } else {
          totalValid++;
        }
      });
    }
  } catch (error) {
    console.error('❌ Error validating studios.json:', error.message);
    hasErrors = true;
  }
  
  // Validate styles
  try {
    const stylesPath = path.join(testDataDir, 'styles.json');
    if (fs.existsSync(stylesPath)) {
      const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'));
      console.log(`\n📊 Validating ${styles.length} styles...`);
      
      styles.forEach((style, index) => {
        const errors = validateStyleData(style);
        if (errors.length > 0) {
          hasErrors = true;
          totalInvalid++;
          console.log(`❌ Style ${style.styleId || `index ${index}`}:`);
          errors.forEach(error => console.log(`  - ${error}`));
        } else {
          totalValid++;
        }
      });
    }
  } catch (error) {
    console.error('❌ Error validating styles.json:', error.message);
    hasErrors = true;
  }
  
  console.log('\n📈 Validation Summary:');
  console.log(`✅ Valid records: ${totalValid}`);
  console.log(`❌ Invalid records: ${totalInvalid}`);
  
  if (hasErrors) {
    console.log('\n❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All test data is valid!');
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { 
  validateArtistData, 
  validateStudioData, 
  validateStyleData 
};