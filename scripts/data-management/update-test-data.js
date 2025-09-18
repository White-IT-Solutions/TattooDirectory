#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the image URLs mapping
const imageUrlsPath = path.join(__dirname, '..', 'aws', 'image-urls.json');
let imageUrls = {};

if (fs.existsSync(imageUrlsPath)) {
  imageUrls = JSON.parse(fs.readFileSync(imageUrlsPath, 'utf8'));
  console.log('📸 Loaded image URLs from S3 mapping');
} else {
  console.log('⚠️  No S3 image URLs found, using placeholder URLs');
}

// Style mapping for updating existing data
const STYLE_UPDATES = {
  'japanese': 'traditional', // Map japanese to traditional since we don't have japanese folder
  'celtic': 'tribal',
  'scottish-traditional': 'traditional',
  'mandala': 'dotwork',
  'ornamental': 'geometric',
  'biomechanical': 'blackwork',
  'horror': 'blackwork',
  'dark-art': 'blackwork',
  'cartoon': 'new_school',
  'pop-art': 'new_school',
  'cover-up': 'blackwork',
  'blackout': 'blackwork',
  'botanical': 'floral',
  'minimalist': 'minimalism',
  'portrait': 'realism',
  'abstract': 'surrealism',
  'american-traditional': 'traditional',
  'oriental': 'traditional'
};

function getRandomImages(styleId, count = 5) {
  const availableImages = imageUrls[styleId] || [];
  
  if (availableImages.length === 0) {
    // Fallback to placeholder images if no S3 images available
    return Array.from({ length: count }, (_, i) => ({
      url: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
      filename: `placeholder_${i + 1}.jpg`
    }));
  }

  // Shuffle and take up to count images
  const shuffled = [...availableImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function updateArtistStyles(artists) {
  return artists.map(artist => {
    // Update styles array
    const updatedStyles = artist.styles.map(style => {
      return STYLE_UPDATES[style] || style;
    }).filter((style, index, arr) => arr.indexOf(style) === index); // Remove duplicates

    // Update portfolio images with S3 URLs
    const primaryStyle = updatedStyles[0];
    const images = getRandomImages(primaryStyle, 5);
    
    const updatedPortfolioImages = images.map((img, index) => {
      const existingImage = artist.portfolioImages[index] || artist.portfolioImages[0];
      return {
        url: img.url,
        description: existingImage?.description || `${primaryStyle} tattoo design`,
        style: primaryStyle,
        tags: existingImage?.tags || [primaryStyle, "artwork", "tattoo"]
      };
    });

    // Add avatar using faker.js CDN
    const avatarId = Math.floor(Math.random() * 100) + 1;
    const avatar = `https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-${avatarId}.jpg`;

    return {
      ...artist,
      styles: updatedStyles,
      portfolioImages: updatedPortfolioImages,
      avatar: avatar
    };
  });
}

function updateStudioSpecialties(studios) {
  return studios.map(studio => {
    const updatedSpecialties = studio.specialties.map(specialty => {
      return STYLE_UPDATES[specialty] || specialty;
    }).filter((specialty, index, arr) => arr.indexOf(specialty) === index); // Remove duplicates

    return {
      ...studio,
      specialties: updatedSpecialties
    };
  });
}

async function updateTestData() {
  console.log('🔄 Updating test data files...');

  // Load current test data - try multiple paths for Docker compatibility
  const dockerArtistsPath = path.join('/app', 'test-data', 'artists.json');
  const dockerStudiosPath = path.join('/app', 'test-data', 'studios.json');
  const relativeArtistsPath = path.join(__dirname, '..', 'test-data', 'artists.json');
  const relativeStudiosPath = path.join(__dirname, '..', 'test-data', 'studios.json');
  
  const artistsPath = fs.existsSync(dockerArtistsPath) ? dockerArtistsPath : relativeArtistsPath;
  const studiosPath = fs.existsSync(dockerStudiosPath) ? dockerStudiosPath : relativeStudiosPath;

  const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
  const studios = JSON.parse(fs.readFileSync(studiosPath, 'utf8'));

  // Update artists
  const updatedArtists = updateArtistStyles(artists);
  fs.writeFileSync(artistsPath, JSON.stringify(updatedArtists, null, 2));
  console.log('✅ Updated artists.json');

  // Update studios
  const updatedStudios = updateStudioSpecialties(studios);
  fs.writeFileSync(studiosPath, JSON.stringify(updatedStudios, null, 2));
  console.log('✅ Updated studios.json');

  console.log('🎉 Test data update completed!');
}

if (require.main === module) {
  updateTestData()
    .then(() => {
      console.log('✨ All test data files updated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateTestData };