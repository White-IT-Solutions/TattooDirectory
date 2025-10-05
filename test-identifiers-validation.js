#!/usr/bin/env node

/**
 * Quick validation script to check if critical test identifiers are present
 */

const fs = require('fs');
const path = require('path');

// Expected test identifiers from E2E tests
const expectedTestIds = [
  'search-input',
  'search-button', 
  'location-filter',
  'style-filter',
  'search-results',
  'artist-card',
  'artist-name',
  'artist-location',
  'artist-styles',
  'artist-profile',
  'portfolio-images',
  'contact-info',
  'instagram-link',
  'loading-spinner',
  'error-message',
  'pagination'
];

// Files to check
const filesToCheck = [
  'frontend/src/app/page.js',
  'frontend/src/app/search/page.jsx',
  'frontend/src/app/components/ArtistCard.js',
  'frontend/src/app/components/SearchResultsContainer.jsx',
  'frontend/src/app/components/SearchResultsDisplay.jsx',
  'frontend/src/app/components/EnhancedStyleFilter.jsx',
  'frontend/src/app/components/AdvancedSearchInterface.jsx',
  'frontend/src/app/artists/[id]/page.jsx',
  'frontend/src/design-system/components/ui/ContactOptions/ContactOptions.jsx'
];

console.log('🔍 Validating test identifiers...\n');

let foundTestIds = new Set();
let missingTestIds = [];

// Check each file for test identifiers
filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all data-testid attributes (including conditional ones)
    const testIdMatches = content.match(/data-testid[=\s]*["{]?[^"}]*["'}]?[^>]*["']([^"']+)["']/g) || 
                         content.match(/data-testid="([^"]+)"/g) ||
                         content.match(/instagram-link/g);
    
    if (testIdMatches) {
      testIdMatches.forEach(match => {
        const testId = match.match(/data-testid="([^"]+)"/)[1];
        foundTestIds.add(testId);
      });
      
      console.log(`✅ ${filePath}: Found ${testIdMatches.length} test identifiers`);
    } else {
      console.log(`❌ ${filePath}: No test identifiers found`);
    }
  } else {
    console.log(`⚠️  ${filePath}: File not found`);
  }
});

console.log('\n📊 Summary:');
console.log(`Found test identifiers: ${foundTestIds.size}`);
console.log(`Expected test identifiers: ${expectedTestIds.length}`);

// Check which expected test IDs are missing
expectedTestIds.forEach(testId => {
  if (!foundTestIds.has(testId)) {
    missingTestIds.push(testId);
  }
});

if (missingTestIds.length === 0) {
  console.log('🎉 All expected test identifiers are present!');
} else {
  console.log(`\n❌ Missing test identifiers (${missingTestIds.length}):`);
  missingTestIds.forEach(testId => {
    console.log(`  - ${testId}`);
  });
}

console.log('\n🔍 Found test identifiers:');
Array.from(foundTestIds).sort().forEach(testId => {
  const isExpected = expectedTestIds.includes(testId);
  console.log(`  ${isExpected ? '✅' : '➕'} ${testId}`);
});

console.log(`\n📈 Progress: ${expectedTestIds.length - missingTestIds.length}/${expectedTestIds.length} (${Math.round(((expectedTestIds.length - missingTestIds.length) / expectedTestIds.length) * 100)}%)`);