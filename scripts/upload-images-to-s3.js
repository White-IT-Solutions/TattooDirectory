#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK for LocalStack
const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  s3ForcePathStyle: true
});

const BUCKET_NAME = 'tattoo-directory-images';
const IMAGE_BASE_PATH = path.join(__dirname, '..', 'tests', 'Test_Data', 'ImageSet');

// Style mapping from folder names to styleIds
const STYLE_MAPPING = {
  'watercolour': 'watercolour',
  'tribal': 'tribal', 
  'traditional': 'traditional',
  'surrealism': 'surrealism',
  'sketch': 'sketch',
  'realism': 'realism',
  'psychelic': 'psychedelic', // Note: folder has typo
  'old_school': 'old_school',
  'new_school': 'new_school',
  'neo_traditional': 'neo_traditional',
  'minimalism': 'minimalism',
  'lettering': 'lettering',
  'geometric': 'geometric',
  'floral': 'floral',
  'fine_line': 'fineline',
  'blackwork': 'blackwork',
  'dotwork': 'dotwork'
};

async function createBucket() {
  try {
    await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ Created bucket: ${BUCKET_NAME}`);
  } catch (error) {
    if (error.code === 'BucketAlreadyOwnedByYou') {
      console.log(`✅ Bucket already exists: ${BUCKET_NAME}`);
    } else {
      console.error('❌ Error creating bucket:', error.message);
      throw error;
    }
  }
}

async function uploadImage(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'image/png',
    ACL: 'public-read'
  };

  try {
    await s3.upload(params).promise();
    const imageUrl = `${process.env.AWS_ENDPOINT_URL || 'http://localhost:4566'}/${BUCKET_NAME}/${s3Key}`;
    console.log(`✅ Uploaded: ${s3Key}`);
    return imageUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${s3Key}:`, error.message);
    throw error;
  }
}

async function uploadAllImages() {
  console.log('🚀 Starting image upload to LocalStack S3...');
  
  await createBucket();
  
  const imageUrls = {};
  
  // Read all style directories
  const styleDirs = fs.readdirSync(IMAGE_BASE_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const styleDir of styleDirs) {
    const styleId = STYLE_MAPPING[styleDir];
    if (!styleId) {
      console.log(`⚠️  Skipping unknown style directory: ${styleDir}`);
      continue;
    }

    console.log(`📁 Processing style: ${styleId} (${styleDir})`);
    
    const stylePath = path.join(IMAGE_BASE_PATH, styleDir);
    const imageFiles = fs.readdirSync(stylePath)
      .filter(file => file.endsWith('.png'));

    imageUrls[styleId] = [];

    for (const imageFile of imageFiles) {
      const filePath = path.join(stylePath, imageFile);
      const s3Key = `styles/${styleId}/${imageFile}`;
      
      try {
        const imageUrl = await uploadImage(filePath, s3Key);
        imageUrls[styleId].push({
          filename: imageFile,
          url: imageUrl,
          s3Key: s3Key
        });
      } catch (error) {
        console.error(`❌ Failed to upload ${imageFile}:`, error.message);
      }
    }

    console.log(`✅ Uploaded ${imageUrls[styleId].length} images for ${styleId}`);
  }

  // Save the mapping to a JSON file
  const outputPath = path.join(__dirname, 'image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(imageUrls, null, 2));
  console.log(`💾 Saved image URL mapping to: ${outputPath}`);

  return imageUrls;
}

if (require.main === module) {
  uploadAllImages()
    .then(() => {
      console.log('🎉 Image upload completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Image upload failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadAllImages, STYLE_MAPPING };