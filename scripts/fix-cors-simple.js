#!/usr/bin/env node

/**
 * Simple CORS Fix for LocalStack S3
 */

const AWS = require("aws-sdk");
const { DATA_CONFIG } = require("./data-config");

async function fixCORS() {
  console.log("🔧 Fixing LocalStack S3 CORS...");

  const s3 = new AWS.S3({
    endpoint: "http://localhost:4566",
    accessKeyId: "test",
    secretAccessKey: "test",
    region: "us-east-1",
    s3ForcePathStyle: true,
  });

  const bucketName = "tattoo-directory-images";

  try {
    // Simple CORS configuration
    const corsConfig = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["*"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    };

    console.log("🌐 Applying CORS configuration...");
    await s3.putBucketCors(corsConfig).promise();
    console.log("✅ CORS applied successfully");

    // Set bucket ACL to public-read
    console.log("🔐 Setting bucket ACL to public-read...");
    try {
      await s3
        .putBucketAcl({
          Bucket: bucketName,
          ACL: "public-read",
        })
        .promise();
      console.log("✅ Bucket ACL set to public-read");
    } catch (error) {
      console.warn("⚠️  Could not set bucket ACL:", error.message);
    }

    // List some objects to verify
    console.log("🖼️  Checking uploaded images...");
    const objects = await s3
      .listObjectsV2({
        Bucket: bucketName,
        MaxKeys: 5,
      })
      .promise();

    if (objects.Contents && objects.Contents.length > 0) {
      console.log(`✅ Found ${objects.Contents.length} objects in bucket`);
      objects.Contents.forEach((obj) => {
        console.log(`   - ${obj.Key}`);
      });
    } else {
      console.warn("⚠️  No objects found in bucket");
    }

    console.log("\n🎉 CORS fix completed!");
    console.log("📋 Next steps:");
    console.log("   1. Refresh your browser");
    console.log("   2. Images should now load without CORS errors");
  } catch (error) {
    console.error("❌ CORS fix failed:", error.message);
    process.exit(1);
  }
}

fixCORS();
