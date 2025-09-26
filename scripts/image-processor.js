#!/usr/bin/env node

/**
 * Image Processor Class
 * 
 * Handles image processing operations including S3 upload, CORS configuration,
 * and incremental processing based on file changes. Extracted from existing
 * upload-images-to-s3.js with enhanced error handling and state management.
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('./data-config');
const { STATE_MANAGER } = require('./state-manager');

/**
 * Style mapping from folder names to styleIds
 * Preserves existing mapping including typo correction
 */
const STYLE_MAPPING = {
  'watercolour': 'watercolour',
  'tribal': 'tribal', 
  'traditional': 'traditional',
  'surrealism': 'surrealism',
  'sketch': 'sketch',
  'realism': 'realism',
  'psychelic': 'psychedelic', // Note: folder has typo, corrected in mapping
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

/**
 * ImageProcessor class with incremental processing and error handling
 */
class ImageProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateManager = STATE_MANAGER;
    
    // Configure AWS SDK for LocalStack
    this.s3 = new AWS.S3({
      endpoint: config.services.s3.endpoint,
      accessKeyId: config.services.aws.accessKeyId,
      secretAccessKey: config.services.aws.secretAccessKey,
      region: config.services.s3.region,
      s3ForcePathStyle: config.services.s3.forcePathStyle
    });
    
    this.bucketName = config.services.s3.bucketName;
    this.imageBasePath = config.paths.imageSourceDir;
    this.outputPath = path.join(config.paths.outputDir, 'image-urls.json');
    
    // Processing statistics
    this.stats = {
      processed: 0,
      uploaded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  /**
   * Process all images with incremental support
   */
  async processImages(options = {}) {
    const { force = false, styles = null } = options;
    
    console.log('🖼️  Starting image processing...');
    
    try {
      // Check for changes unless forced
      if (!force) {
        const changes = this.stateManager.detectChanges();
        if (!changes.imagesChanged) {
          console.log('📋 No image changes detected, skipping processing');
          return this.getExistingResults();
        }
        console.log('🔄 Image changes detected, processing...');
      }
      
      // Ensure bucket exists
      await this.ensureBucket();
      
      // Configure CORS
      await this.configureCORS();
      
      // Process images by style
      const imageUrls = await this.processImagesByStyle(styles);
      
      // Save results
      await this.saveImageUrls(imageUrls);
      
      console.log(`✅ Image processing completed: ${this.stats.processed} processed, ${this.stats.uploaded} uploaded, ${this.stats.failed} failed`);
      
      return {
        success: true,
        imageUrls,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Image processing failed:', error.message);
      this.stats.errors.push({
        type: 'processing_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Ensure S3 bucket exists
   */
  async ensureBucket() {
    try {
      await this.s3.createBucket({ Bucket: this.bucketName }).promise();
      console.log(`✅ Created bucket: ${this.bucketName}`);
    } catch (error) {
      if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
        console.log(`✅ Bucket already exists: ${this.bucketName}`);
      } else {
        console.error('❌ Error creating bucket:', error.message);
        throw error;
      }
    }
  }

  /**
   * Configure CORS for the S3 bucket
   */
  async configureCORS() {
    const corsConfiguration = {
      Bucket: this.bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
          }
        ]
      }
    };

    try {
      await this.s3.putBucketCors(corsConfiguration).promise();
      console.log('✅ CORS configuration applied to bucket');
    } catch (error) {
      console.warn('⚠️  Could not configure CORS:', error.message);
      // Don't fail the entire process for CORS issues
    }
  }

  /**
   * Process images organized by style directories
   */
  async processImagesByStyle(filterStyles = null) {
    if (!fs.existsSync(this.imageBasePath)) {
      throw new Error(`Image source directory not found: ${this.imageBasePath}`);
    }

    const imageUrls = {};
    
    // Read all style directories
    const styleDirs = fs.readdirSync(this.imageBasePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📁 Found ${styleDirs.length} style directories`);

    for (const styleDir of styleDirs) {
      const styleId = STYLE_MAPPING[styleDir];
      if (!styleId) {
        console.log(`⚠️  Skipping unknown style directory: ${styleDir}`);
        continue;
      }

      // Filter styles if specified
      if (filterStyles && !filterStyles.includes(styleId)) {
        console.log(`⏭️  Skipping filtered style: ${styleId}`);
        continue;
      }

      console.log(`📁 Processing style: ${styleId} (${styleDir})`);
      
      try {
        const styleImages = await this.processStyleDirectory(styleDir, styleId);
        imageUrls[styleId] = styleImages;
        
        console.log(`✅ Processed ${styleImages.length} images for ${styleId}`);
      } catch (error) {
        console.error(`❌ Failed to process style ${styleId}:`, error.message);
        this.stats.errors.push({
          type: 'style_processing_error',
          style: styleId,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Continue with other styles
        imageUrls[styleId] = [];
      }
    }

    return imageUrls;
  }

  /**
   * Process all images in a style directory
   */
  async processStyleDirectory(styleDir, styleId) {
    const stylePath = path.join(this.imageBasePath, styleDir);
    const imageFiles = fs.readdirSync(stylePath)
      .filter(file => this.isImageFile(file));

    const styleImages = [];

    for (const imageFile of imageFiles) {
      try {
        const filePath = path.join(stylePath, imageFile);
        const s3Key = `styles/${styleId}/${imageFile}`;
        
        // Check if image needs processing
        if (await this.shouldProcessImage(filePath, s3Key)) {
          const imageUrl = await this.uploadImage(filePath, s3Key);
          
          styleImages.push({
            filename: imageFile,
            url: imageUrl,
            s3Key: s3Key,
            style: styleId,
            uploadedAt: new Date().toISOString()
          });
          
          this.stats.uploaded++;
        } else {
          // Image already exists and is up to date
          const existingUrl = this.generateImageUrl(s3Key);
          styleImages.push({
            filename: imageFile,
            url: existingUrl,
            s3Key: s3Key,
            style: styleId,
            skipped: true
          });
          
          this.stats.skipped++;
        }
        
        this.stats.processed++;
        
      } catch (error) {
        console.error(`❌ Failed to process ${imageFile}:`, error.message);
        this.stats.failed++;
        this.stats.errors.push({
          type: 'image_upload_error',
          file: imageFile,
          style: styleId,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return styleImages;
  }

  /**
   * Check if a file is a supported image format
   */
  isImageFile(filename) {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(ext);
  }

  /**
   * Check if an image needs processing (incremental processing)
   */
  async shouldProcessImage(filePath, s3Key) {
    try {
      // Check if file exists in S3
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: s3Key
      }).promise();
      
      // File exists in S3, check if local file is newer
      const localStat = fs.statSync(filePath);
      const s3Object = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: s3Key
      }).promise();
      
      // Compare modification times
      const localModified = localStat.mtime;
      const s3Modified = new Date(s3Object.LastModified);
      
      return localModified > s3Modified;
      
    } catch (error) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        // File doesn't exist in S3, needs upload
        return true;
      }
      
      // Other errors, assume needs upload
      console.warn(`⚠️  Could not check S3 object ${s3Key}:`, error.message);
      return true;
    }
  }

  /**
   * Upload a single image to S3
   */
  async uploadImage(filePath, s3Key) {
    const fileContent = fs.readFileSync(filePath);
    const contentType = this.getContentType(filePath);
    
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      await this.s3.upload(params).promise();
      const imageUrl = this.generateImageUrl(s3Key);
      console.log(`✅ Uploaded: ${s3Key} -> ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      console.error(`❌ Error uploading ${s3Key}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate image URL for LocalStack
   */
  generateImageUrl(s3Key) {
    // Use LocalStack path-style URL (virtual-hosted style doesn't work reliably)
    const endpoint = this.config.services.s3.endpoint;
    return `${endpoint}/${this.bucketName}/${s3Key}`;
  }

  /**
   * Get content type for image file
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Save image URLs to output file
   */
  async saveImageUrls(imageUrls) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const content = JSON.stringify(imageUrls, null, 2);
      fs.writeFileSync(this.outputPath, content, 'utf8');
      
      console.log(`💾 Saved image URL mapping to: ${this.outputPath}`);
      return true;
    } catch (error) {
      console.error('❌ Could not save image URLs:', error.message);
      throw error;
    }
  }

  /**
   * Get existing results from previous run
   */
  getExistingResults() {
    try {
      if (fs.existsSync(this.outputPath)) {
        const content = fs.readFileSync(this.outputPath, 'utf8');
        const imageUrls = JSON.parse(content);
        
        // Count existing images
        let totalImages = 0;
        Object.values(imageUrls).forEach(styleImages => {
          totalImages += styleImages.length;
        });
        
        return {
          success: true,
          imageUrls,
          stats: {
            processed: totalImages,
            uploaded: 0,
            failed: 0,
            skipped: totalImages,
            fromCache: true
          }
        };
      }
    } catch (error) {
      console.warn('⚠️  Could not load existing results:', error.message);
    }
    
    return {
      success: false,
      imageUrls: {},
      stats: { processed: 0, uploaded: 0, failed: 0, skipped: 0 }
    };
  }

  /**
   * Validate image processing results
   */
  async validateResults(imageUrls) {
    console.log('🔍 Validating image processing results...');
    
    const validation = {
      totalStyles: Object.keys(imageUrls).length,
      totalImages: 0,
      accessibleUrls: 0,
      inaccessibleUrls: 0,
      errors: []
    };

    for (const [styleId, images] of Object.entries(imageUrls)) {
      validation.totalImages += images.length;
      
      // Sample check a few URLs from each style
      const sampleSize = Math.min(3, images.length);
      const sampleImages = images.slice(0, sampleSize);
      
      for (const image of sampleImages) {
        try {
          await this.s3.headObject({
            Bucket: this.bucketName,
            Key: image.s3Key
          }).promise();
          
          validation.accessibleUrls++;
        } catch (error) {
          validation.inaccessibleUrls++;
          validation.errors.push({
            style: styleId,
            image: image.filename,
            error: error.message
          });
        }
      }
    }

    console.log(`✅ Validation complete: ${validation.totalImages} images across ${validation.totalStyles} styles`);
    
    if (validation.errors.length > 0) {
      console.warn(`⚠️  Found ${validation.errors.length} accessibility issues`);
    }
    
    return validation;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset processing statistics
   */
  resetStats() {
    this.stats = {
      processed: 0,
      uploaded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  /**
   * List all images in S3 bucket
   */
  async listS3Images() {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: 'styles/'
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: this.generateImageUrl(obj.Key)
      }));
      
    } catch (error) {
      console.error('❌ Could not list S3 images:', error.message);
      throw error;
    }
  }

  /**
   * Clean up orphaned images in S3
   */
  async cleanupOrphanedImages() {
    console.log('🧹 Cleaning up orphaned images...');
    
    try {
      const s3Images = await this.listS3Images();
      const localImages = this.getLocalImageList();
      
      const orphaned = s3Images.filter(s3Image => {
        const filename = path.basename(s3Image.key);
        return !localImages.some(local => local.filename === filename);
      });
      
      if (orphaned.length === 0) {
        console.log('✅ No orphaned images found');
        return { deleted: 0, errors: [] };
      }
      
      console.log(`🗑️  Found ${orphaned.length} orphaned images, deleting...`);
      
      const deleteResults = {
        deleted: 0,
        errors: []
      };
      
      for (const image of orphaned) {
        try {
          await this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: image.key
          }).promise();
          
          deleteResults.deleted++;
          console.log(`🗑️  Deleted: ${image.key}`);
        } catch (error) {
          deleteResults.errors.push({
            key: image.key,
            error: error.message
          });
          console.error(`❌ Could not delete ${image.key}:`, error.message);
        }
      }
      
      console.log(`✅ Cleanup complete: ${deleteResults.deleted} deleted, ${deleteResults.errors.length} errors`);
      return deleteResults;
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get list of local images
   */
  getLocalImageList() {
    const images = [];
    
    if (!fs.existsSync(this.imageBasePath)) {
      return images;
    }
    
    const styleDirs = fs.readdirSync(this.imageBasePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const styleDir of styleDirs) {
      const styleId = STYLE_MAPPING[styleDir];
      if (!styleId) continue;
      
      const stylePath = path.join(this.imageBasePath, styleDir);
      const imageFiles = fs.readdirSync(stylePath)
        .filter(file => this.isImageFile(file));
      
      for (const imageFile of imageFiles) {
        images.push({
          filename: imageFile,
          style: styleId,
          path: path.join(stylePath, imageFile)
        });
      }
    }
    
    return images;
  }
}

// Export the class and style mapping
module.exports = {
  ImageProcessor,
  STYLE_MAPPING
};

// CLI usage when run directly
if (require.main === module) {
  const processor = new ImageProcessor();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    validate: args.includes('--validate'),
    cleanup: args.includes('--cleanup'),
    list: args.includes('--list')
  };
  
  // Extract styles filter if provided
  const stylesIndex = args.indexOf('--styles');
  if (stylesIndex !== -1 && args[stylesIndex + 1]) {
    options.styles = args[stylesIndex + 1].split(',');
  }
  
  async function main() {
    try {
      if (options.list) {
        console.log('📋 Listing S3 images...');
        const images = await processor.listS3Images();
        console.log(`Found ${images.length} images in S3:`);
        images.forEach(img => {
          console.log(`  ${img.key} (${img.size} bytes, ${img.lastModified})`);
        });
        return;
      }
      
      if (options.cleanup) {
        const result = await processor.cleanupOrphanedImages();
        console.log(`🧹 Cleanup result: ${result.deleted} deleted, ${result.errors.length} errors`);
        return;
      }
      
      // Process images
      const result = await processor.processImages(options);
      
      if (result.success) {
        console.log('🎉 Image processing completed successfully!');
        
        if (options.validate) {
          const validation = await processor.validateResults(result.imageUrls);
          console.log(`🔍 Validation: ${validation.accessibleUrls}/${validation.totalImages} URLs accessible`);
        }
      } else {
        console.error('💥 Image processing failed:', result.error);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}