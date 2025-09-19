#!/usr/bin/env node

const { uploadAllImages } = require('../aws/upload-images-to-s3');
const { updateTestData } = require('./update-test-data');
const { configureCORS } = require('../aws/configure-s3-cors');

async function setupTestData() {
  console.log('🚀 Setting up test data with S3 images...');
  
  try {
    // Step 1: Upload images to LocalStack S3
    console.log('\n📤 Step 1: Uploading images to LocalStack S3...');
    await uploadAllImages();
    
    // Step 2: Configure CORS for S3 bucket
    console.log('\n🔧 Step 2: Configuring CORS for S3 bucket...');
    await configureCORS();
    
    // Step 3: Update test data files with new URLs and styles
    console.log('\n🔄 Step 3: Updating test data files...');
    await updateTestData();
    
    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Images uploaded to LocalStack S3');
    console.log('  ✅ styles.json updated with new style IDs');
    console.log('  ✅ artists.json updated with S3 image URLs and avatars');
    console.log('  ✅ studios.json updated with matching specialties');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };