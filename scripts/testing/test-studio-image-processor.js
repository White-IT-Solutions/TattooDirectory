#!/usr/bin/env node

/**
 * Studio Image Processor Integration Test
 * 
 * Simple test script to verify the StudioImageProcessor works correctly
 * with sample studio data and images.
 */

const fs = require('fs');
const path = require('path');
const { StudioImageProcessor } = require('../data-management/studio-image-processor');
const { DATA_CONFIG } = require('../data-config');

async function testStudioImageProcessor() {
  console.log('🧪 Testing Studio Image Processor Integration');
  console.log('==============================================\n');

  const processor = new StudioImageProcessor();
  
  // Sample studio data
  const sampleStudio = {
    studioId: 'studio-test-001',
    studioName: 'Test Tattoo Studio',
    address: '123 Test Street, London, UK',
    postcode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278,
    specialties: ['traditional', 'realism', 'blackwork'],
    contactInfo: {
      phone: '+44 20 7946 0958',
      email: 'info@teststudio.com',
      website: 'https://teststudio.com',
      instagram: '@teststudio'
    },
    rating: 4.5,
    reviewCount: 89,
    established: 2015
  };

  try {
    console.log('📋 Configuration Check:');
    console.log(`  Bucket: ${processor.bucketName}`);
    console.log(`  S3 Endpoint: ${processor.config.services.s3.endpoint}`);
    console.log(`  Studio Images Path: ${processor.studioImageBasePath}`);
    console.log('');

    console.log('🔍 Checking for sample images...');
    const externalImages = await processor.getSourceImagesForType('external');
    const internalImages = await processor.getSourceImagesForType('internal');
    const workingImages = await processor.getSourceImagesForType('working');
    
    console.log(`  External images: ${externalImages.length}`);
    console.log(`  Internal images: ${internalImages.length}`);
    console.log(`  Working images: ${workingImages.length}`);
    console.log('');

    // Check for studio-first test data
    const studioTestDirs = fs.readdirSync(DATA_CONFIG.paths.studioImageSourceDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .slice(0, 5); // Show first 5 studios
    
    console.log(`📁 Found ${studioTestDirs.length} studio test directories (showing first 5):`);
    studioTestDirs.forEach(dir => {
      const studioPath = path.join(DATA_CONFIG.paths.studioImageSourceDir, dir.name);
      const imageCount = fs.readdirSync(studioPath)
        .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file)).length;
      console.log(`   ${dir.name}: ${imageCount} images`);
    });
    console.log('');

    if (externalImages.length === 0 && internalImages.length === 0 && workingImages.length === 0 && studioTestDirs.length === 0) {
      console.log('⚠️  No sample images found. The processor will work but won\'t have images to process.');
      console.log('   Studio test data is now organized by studio directory in scripts/test-data/image_set/studio_source/');
      console.log('');
    }

    console.log('🏢 Processing sample studio...');
    const processedStudio = await processor.processStudioImages(sampleStudio);
    
    console.log('✅ Processing completed!');
    console.log(`  Studio ID: ${processedStudio.studioId}`);
    console.log(`  Total images: ${processedStudio.images.length}`);
    console.log(`  Image types processed: ${Object.keys(processedStudio.imagesByType).join(', ')}`);
    console.log('');

    // Display image details
    if (processedStudio.images.length > 0) {
      console.log('📸 Processed Images:');
      processedStudio.images.forEach((image, index) => {
        console.log(`  ${index + 1}. ${image.type} (${image.isPrimary ? 'primary' : 'secondary'})`);
        console.log(`     Thumbnail: ${image.thumbnail}`);
        console.log(`     Medium: ${image.medium}`);
        console.log(`     Large: ${image.large}`);
      });
      console.log('');
    }

    // Display statistics
    const stats = processor.getStats();
    console.log('📊 Processing Statistics:');
    console.log(`  Processed: ${stats.processed}`);
    console.log(`  Uploaded: ${stats.uploaded}`);
    console.log(`  Optimized: ${stats.optimized}`);
    console.log(`  Thumbnails created: ${stats.thumbnailsCreated}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type}: ${error.message}`);
      });
    }
    
    console.log('\n🎉 Studio Image Processor test completed successfully!');
    
    return {
      success: true,
      processedStudio,
      stats
    };

  } catch (error) {
    console.error('\n❌ Studio Image Processor test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testStudioImageProcessor()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error.message);
      process.exit(1);
    });
}

module.exports = { testStudioImageProcessor };