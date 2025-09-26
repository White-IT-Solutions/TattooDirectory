#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS SDK for LocalStack
const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  s3ForcePathStyle: true
});

const BUCKET_NAME = 'tattoo-directory-images';

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: ['*'], // In production, restrict this to your domain
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600
    }
  ]
};

async function configureCORS() {
  try {
    console.log('🔧 Configuring CORS for S3 bucket...');
    
    await s3.putBucketCors({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    }).promise();
    
    console.log('✅ CORS configuration applied successfully!');
    
    // Verify CORS configuration
    const corsResult = await s3.getBucketCors({ Bucket: BUCKET_NAME }).promise();
    console.log('📋 Current CORS configuration:', JSON.stringify(corsResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    throw error;
  }
}

if (require.main === module) {
  configureCORS()
    .then(() => {
      console.log('🎉 CORS configuration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 CORS configuration failed:', error);
      process.exit(1);
    });
}

module.exports = { configureCORS };