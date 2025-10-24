#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testImageUrl(url, description) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    if (response.status === 200) {
      console.log(`✅ ${description}: ${url}`);
      return true;
    } else {
      console.log(`❌ ${description}: ${url} (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ${url} (Error: ${error.message})`);
    return false;
  }
}

async function testAllImages() {
  console.log('🧪 Testing image URLs from artist data...\n');
  
  // Load artist data
  const artistsPath = path.join(__dirname, '..', 'test-data', 'artists.json');
  const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const artist of artists) {
    console.log(`👤 Testing images for ${artist.artistName}:`);
    
    // Test avatar
    totalTests++;
    if (await testImageUrl(artist.avatar, `Avatar`)) {
      passedTests++;
    }
    
    // Test portfolio images
    for (let i = 0; i < Math.min(2, artist.portfolioImages.length); i++) {
      const image = artist.portfolioImages[i];
      totalTests++;
      if (await testImageUrl(image.url, `Portfolio ${i + 1}`)) {
        passedTests++;
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Test Results: ${passedTests}/${totalTests} images accessible`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All images are accessible!');
    return true;
  } else {
    console.log('⚠️  Some images are not accessible.');
    return false;
  }
}

if (require.main === module) {
  testAllImages()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllImages };