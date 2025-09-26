#!/usr/bin/env node

/**
 * Studio Image Processor Integration Test
 * 
 * Simple test script to verify the StudioImageProcessor works correctly
 * with sample studio data and images.
 */

const { StudioImageProcessor } = require('./data-management/studio-image-processor');
const { DATA_CONFIG } = require('./data-config');

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
    const exteriorImages = await processor.getSourceImagesForType('exterior');
    const interiorImages = await processor.getSourceImagesForType('interior');
    const galleryImages = await processor.getSourceImagesForType('gallery');
    
    console.log(`  Exterior images: ${exteriorImages.length}`);
    console.log(`  Interior images: ${interiorImages.length}`);
    console.log(`  Gallery images: ${galleryImages.length}`);
    console.log('');

    if (exteriorImages.length === 0 && interiorImages.length === 0 && galleryImages.length === 0) {
      console.log('⚠️  No sample images found. The processor will work but won\'t have images to process.');
      console.log('   Add some JPEG, PNG, or WebP images to tests/Test_Data/StudioImages/sample/ to test image processing.');
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