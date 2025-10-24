#!/usr/bin/env node

/**
 * Check S3 bucket contents to see what images are actually there
 */

const AWS = require('aws-sdk');
const DATA_CONFIG = require('../data-config');

// Configure AWS SDK for LocalStack
AWS.config.update({
  region: DATA_CONFIG.services.aws.region,
  endpoint: DATA_CONFIG.services.aws.endpoint,
  accessKeyId: DATA_CONFIG.services.aws.accessKeyId,
  secretAccessKey: DATA_CONFIG.services.aws.secretAccessKey,
  s3ForcePathStyle: true
});

const s3 = new AWS.S3();

async function checkS3Contents() {
  console.log('🔍 Checking S3 bucket contents...\n');
  
  try {
    // List all buckets first
    const bucketsResult = await s3.listBuckets().promise();
    console.log(`📊 Found ${bucketsResult.Buckets.length} S3 buckets:`);
    bucketsResult.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
    });
    
    const bucketName = 'tattoo-directory-images';
    console.log(`\n🔍 Checking contents of bucket: ${bucketName}`);
    
    // Check if bucket exists
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log('✅ Bucket exists');
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log('❌ Bucket does not exist');
        console.log('\n💡 The bucket needs to be created and populated with images.');
        console.log('   This is likely why there are no images available.');
        return;
      } else {
        throw error;
      }
    }
    
    // List objects in the bucket
    let allObjects = [];
    let continuationToken = null;
    
    do {
      const params = {
        Bucket: bucketName,
        MaxKeys: 1000
      };
      
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      
      const result = await s3.listObjectsV2(params).promise();
      allObjects = allObjects.concat(result.Contents || []);
      continuationToken = result.NextContinuationToken;
      
    } while (continuationToken);

    console.log(`📊 Total objects in bucket: ${allObjects.length}`);
    
    if (allObjects.length === 0) {
      console.log('❌ No objects found in the bucket');
      console.log('\n💡 The S3 bucket is empty. This explains why there are no images.');
      console.log('   You need to populate the bucket with tattoo images.');
      return;
    }
    
    // Analyze the structure
    const byFolder = {};
    const byExtension = {};
    
    allObjects.forEach(obj => {
      const key = obj.Key;
      const parts = key.split('/');
      const folder = parts.length > 1 ? parts[0] : 'root';
      const extension = key.split('.').pop().toLowerCase();
      
      if (!byFolder[folder]) byFolder[folder] = 0;
      if (!byExtension[extension]) byExtension[extension] = 0;
      
      byFolder[folder]++;
      byExtension[extension]++;
    });
    
    console.log('\n📁 Objects by folder:');
    Object.entries(byFolder).forEach(([folder, count]) => {
      console.log(`   ${folder}: ${count} files`);
    });
    
    console.log('\n📄 Objects by file type:');
    Object.entries(byExtension).forEach(([ext, count]) => {
      console.log(`   .${ext}: ${count} files`);
    });
    
    // Show some sample files
    console.log('\n📋 Sample files (first 10):');
    allObjects.slice(0, 10).forEach(obj => {
      console.log(`   ${obj.Key} (${obj.Size} bytes, modified: ${obj.LastModified})`);
    });
    
    if (allObjects.length > 10) {
      console.log(`   ... and ${allObjects.length - 10} more files`);
    }
    
    // Check if images are accessible
    console.log('\n🔗 Testing image accessibility...');
    if (allObjects.length > 0) {
      const testImage = allObjects[0];
      const imageUrl = `http://localhost:4566/tattoo-directory-images/${testImage.Key}`;
      console.log(`   Testing URL: ${imageUrl}`);
      
      try {
        const response = await s3.getObject({
          Bucket: bucketName,
          Key: testImage.Key
        }).promise();
        
        console.log(`   ✅ Image accessible (${response.ContentLength} bytes, type: ${response.ContentType})`);
      } catch (error) {
        console.log(`   ❌ Image not accessible: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check S3 contents:', error.message);
    console.error('   This might indicate that LocalStack S3 is not running or configured properly.');
  }
}

checkS3Contents();