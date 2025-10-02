#!/usr/bin/env node

/**
 * Studio Image Processor Class
 * 
 * Handles studio-specific image processing operations including generation,
 * S3 upload with proper naming conventions, image optimization, WebP conversion,
 * thumbnail creation, CORS configuration, and accessibility validation.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { DATA_CONFIG } = require('../data-config');

/**
 * Studio image types and their characteristics
 */
const STUDIO_IMAGE_TYPES = {
  exterior: {
    description: 'Studio exterior and entrance photos',
    minImages: 1,
    maxImages: 3,
    preferredAspectRatio: '4:3',
    keywords: ['exterior', 'entrance', 'building', 'signage']
  },
  interior: {
    description: 'Studio interior and workspace photos',
    minImages: 1,
    maxImages: 3,
    preferredAspectRatio: '16:9',
    keywords: ['interior', 'workspace', 'reception', 'stations']
  },
  gallery: {
    description: 'Studio gallery and portfolio display photos',
    minImages: 1,
    maxImages: 2,
    preferredAspectRatio: '4:3',
    keywords: ['gallery', 'portfolio', 'artwork', 'displays']
  }
};

/**
 * Image processing configurations
 */
const IMAGE_PROCESSING_CONFIG = {
  formats: {
    webp: { quality: 85, effort: 4 },
    jpeg: { quality: 90, progressive: true },
    png: { compressionLevel: 8 }
  },
  sizes: {
    thumbnail: { width: 300, height: 225, fit: 'cover' },
    medium: { width: 800, height: 600, fit: 'inside' },
    large: { width: 1200, height: 900, fit: 'inside' }
  },
  optimization: {
    removeMetadata: true,
    stripColorProfile: false,
    interlace: true
  }
};

/**
 * StudioImageProcessor class for handling studio image operations
 */
class StudioImageProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    
    // Configure AWS SDK for LocalStack
    this.s3 = new AWS.S3({
      endpoint: config.services.s3.endpoint,
      accessKeyId: config.services.aws.accessKeyId,
      secretAccessKey: config.services.aws.secretAccessKey,
      region: config.services.s3.region,
      s3ForcePathStyle: config.services.s3.forcePathStyle
    });
    
    this.bucketName = config.services.s3.bucketName;
    this.studioImageBasePath = config.paths.studioImageSourceDir;
    
    // Processing statistics
    this.stats = {
      processed: 0,
      uploaded: 0,
      failed: 0,
      skipped: 0,
      optimized: 0,
      thumbnailsCreated: 0,
      errors: []
    };
  }

  /**
   * Process studio images for a single studio
   * Now uses studio-first structure from test data
   */
  async processStudioImages(studio) {
    console.log(`🖼️  Processing images for studio: ${studio.studioName} (${studio.studioId})`);
    
    try {
      // Ensure bucket exists and CORS is configured
      await this.ensureBucketAndCORS();
      
      // Check if studio has test images in new structure
      const studioTestDir = path.join(this.studioImageBasePath, studio.studioId);
      const hasTestImages = fs.existsSync(studioTestDir);
      
      let processedImages = {};
      
      if (hasTestImages) {
        console.log(`📁 Found test images for ${studio.studioId}, processing from test data`);
        processedImages = await this.processStudioTestImages(studio, studioTestDir);
      } else {
        console.log(`🎨 No test images found for ${studio.studioId}, generating new images`);
        // Fallback to generation for studios without test data
        for (const imageType of this.config.studio.generation.imageTypes) {
          console.log(`📸 Generating ${imageType} images for ${studio.studioId}`);
          
          const typeImages = await this.processImageType(studio, imageType);
          processedImages[imageType] = typeImages;
          
          console.log(`✅ Generated ${typeImages.length} ${imageType} images`);
        }
      }
      
      // Update studio object with image information
      const studioWithImages = {
        ...studio,
        images: this.flattenImageStructure(processedImages),
        imagesByType: processedImages
      };
      
      console.log(`✅ Completed image processing for ${studio.studioId}: ${studioWithImages.images.length} total images`);
      
      return studioWithImages;
      
    } catch (error) {
      console.error(`❌ Failed to process images for studio ${studio.studioId}:`, error.message);
      this.stats.failed++;
      this.stats.errors.push({
        type: 'studio_image_processing_error',
        studioId: studio.studioId,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Return studio with empty images array on failure
      return {
        ...studio,
        images: [],
        imagesByType: {}
      };
    }
  }

  /**
   * Process studio images from test data directory (studio-first structure)
   */
  async processStudioTestImages(studio, studioTestDir) {
    const processedImages = {};
    
    // Read studio metadata if available
    const studioInfoPath = path.join(studioTestDir, 'studio_info.json');
    let studioInfo = null;
    if (fs.existsSync(studioInfoPath)) {
      studioInfo = JSON.parse(fs.readFileSync(studioInfoPath, 'utf8'));
      console.log(`📋 Loaded studio metadata for ${studioInfo.name}`);
    }
    
    // Get all image files in the studio directory
    const imageFiles = fs.readdirSync(studioTestDir)
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => path.join(studioTestDir, file));
    
    console.log(`📸 Found ${imageFiles.length} test images for ${studio.studioId}`);
    
    // Categorize images by type based on filename patterns
    const imagesByType = {
      external: imageFiles.filter(file => path.basename(file).includes('external')),
      internal: imageFiles.filter(file => path.basename(file).includes('internal')),
      working: imageFiles.filter(file => path.basename(file).includes('working'))
    };
    
    // Process each image type
    for (const [imageType, typePaths] of Object.entries(imagesByType)) {
      if (typePaths.length === 0) continue;
      
      console.log(`📸 Processing ${typePaths.length} ${imageType} images`);
      processedImages[imageType] = [];
      
      for (const imagePath of typePaths) {
        try {
          const processedImage = await this.processTestImage(studio, imagePath, imageType);
          if (processedImage) {
            processedImages[imageType].push(processedImage);
            this.stats.processed++;
          }
        } catch (error) {
          console.error(`❌ Failed to process test image ${imagePath}:`, error.message);
          this.stats.failed++;
        }
      }
    }
    
    return processedImages;
  }

  /**
   * Process a single test image file
   */
  async processTestImage(studio, imagePath, imageType) {
    const filename = path.basename(imagePath);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    
    // Generate S3 key following the naming convention
    const s3Key = `studios/${studio.studioId}/${imageType}/${baseName}${ext}`;
    
    console.log(`📤 Uploading ${filename} to ${s3Key}`);
    
    try {
      // Read and upload the image
      const imageBuffer = fs.readFileSync(imagePath);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: this.getContentType(ext),
        Metadata: {
          studioId: studio.studioId,
          imageType: imageType,
          originalFilename: filename,
          processedAt: new Date().toISOString()
        }
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      this.stats.uploaded++;
      
      // Generate thumbnail if needed
      let thumbnailUrl = null;
      if (this.config.studio.generation.generateThumbnails) {
        thumbnailUrl = await this.generateThumbnail(imageBuffer, s3Key, studio.studioId);
      }
      
      return {
        url: result.Location,
        s3Key: s3Key,
        thumbnailUrl: thumbnailUrl,
        filename: filename,
        imageType: imageType,
        metadata: {
          size: imageBuffer.length,
          uploadedAt: new Date().toISOString(),
          source: 'test_data'
        }
      };
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Process images for a specific image type (exterior, interior, gallery)
   */
  async processImageType(studio, imageType) {
    const typeConfig = STUDIO_IMAGE_TYPES[imageType];
    if (!typeConfig) {
      throw new Error(`Unknown image type: ${imageType}`);
    }
    
    // Get available source images for this type
    const sourceImages = await this.getSourceImagesForType(imageType);
    
    if (sourceImages.length === 0) {
      console.warn(`⚠️  No source images found for type: ${imageType}`);
      return [];
    }
    
    // Select random images for this studio
    const imagesToProcess = this.selectImagesForStudio(sourceImages, typeConfig);
    const processedImages = [];
    
    for (let i = 0; i < imagesToProcess.length; i++) {
      const sourceImage = imagesToProcess[i];
      const imageIndex = i + 1;
      
      try {
        const processedImage = await this.processAndUploadImage(
          studio,
          imageType,
          sourceImage,
          imageIndex
        );
        
        processedImages.push(processedImage);
        this.stats.processed++;
        
      } catch (error) {
        console.error(`❌ Failed to process ${imageType} image ${imageIndex} for ${studio.studioId}:`, error.message);
        this.stats.failed++;
        this.stats.errors.push({
          type: 'image_processing_error',
          studioId: studio.studioId,
          imageType,
          imageIndex,
          sourceImage: sourceImage.filename,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return processedImages;
  }

  /**
   * Get source images for a specific type from studio-first structure
   * Scans all studio directories for images of the specified type
   */
  async getSourceImagesForType(imageType) {
    const allImages = [];
    
    try {
      // Get all studio directories
      const studioDirectories = fs.readdirSync(this.studioImageBasePath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      // Scan each studio directory for images of the specified type
      for (const studioDir of studioDirectories) {
        const studioPath = path.join(this.studioImageBasePath, studioDir);
        const imageFiles = fs.readdirSync(studioPath)
          .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
          .filter(file => file.includes(imageType)); // Filter by type in filename
        
        for (const filename of imageFiles) {
          allImages.push({
            filename,
            path: path.join(studioPath, filename),
            type: imageType,
            studioId: studioDir
          });
        }
      }
      
      return allImages;
      
    } catch (error) {
      console.warn(`⚠️  Could not scan studio directories for ${imageType} images:`, error.message);
      
      // Fallback to legacy sample directory if it exists
      const sampleDir = path.join(this.studioImageBasePath, 'sample');
      if (fs.existsSync(sampleDir)) {
        return this.getImagesFromDirectory(sampleDir, imageType);
      }
      
      return [];
    }
  }

  /**
   * Get image files from a directory
   */
  getImagesFromDirectory(directory, imageType) {
    try {
      const files = fs.readdirSync(directory);
      const imageFiles = files.filter(file => this.isImageFile(file));
      
      return imageFiles.map(filename => ({
        filename,
        path: path.join(directory, filename),
        type: imageType
      }));
      
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${directory}:`, error.message);
      return [];
    }
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
   * Select appropriate number of images for a studio based on type configuration
   */
  selectImagesForStudio(sourceImages, typeConfig) {
    const targetCount = Math.min(
      Math.max(typeConfig.minImages, 1),
      Math.min(typeConfig.maxImages, sourceImages.length)
    );
    
    // Randomly select images
    const shuffled = [...sourceImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, targetCount);
  }

  /**
   * Process and upload a single image with optimization and multiple sizes
   * Requirements 8.2, 8.3, 8.4: S3 upload with naming conventions, optimization, WebP conversion, thumbnails
   */
  async processAndUploadImage(studio, imageType, sourceImage, imageIndex) {
    const baseKey = `studios/${studio.studioId}/${imageType}/${imageIndex}`;
    
    // Read source image
    const sourceBuffer = fs.readFileSync(sourceImage.path);
    const imageInfo = await sharp(sourceBuffer).metadata();
    
    // Process different sizes and formats
    const processedVersions = {};
    
    // Create thumbnail, medium, and large versions
    for (const [sizeName, sizeConfig] of Object.entries(IMAGE_PROCESSING_CONFIG.sizes)) {
      // WebP version (preferred)
      const webpBuffer = await this.optimizeImage(sourceBuffer, sizeConfig, 'webp');
      const webpKey = `${baseKey}_${sizeName}.webp`;
      const webpUrl = await this.uploadToS3(webpBuffer, webpKey, 'image/webp');
      
      // JPEG fallback
      const jpegBuffer = await this.optimizeImage(sourceBuffer, sizeConfig, 'jpeg');
      const jpegKey = `${baseKey}_${sizeName}.jpg`;
      const jpegUrl = await this.uploadToS3(jpegBuffer, jpegKey, 'image/jpeg');
      
      processedVersions[sizeName] = {
        webp: { url: webpUrl, key: webpKey },
        jpeg: { url: jpegUrl, key: jpegKey }
      };
      
      this.stats.optimized++;
      if (sizeName === 'thumbnail') {
        this.stats.thumbnailsCreated++;
      }
    }
    
    // Validate image accessibility
    await this.validateImageAccessibility(processedVersions.medium.webp.key);
    
    return {
      type: imageType,
      index: imageIndex,
      originalFilename: sourceImage.filename,
      versions: processedVersions,
      metadata: {
        originalWidth: imageInfo.width,
        originalHeight: imageInfo.height,
        originalFormat: imageInfo.format,
        originalSize: sourceBuffer.length
      },
      uploadedAt: new Date().toISOString(),
      isPrimary: imageIndex === 1 // First image of each type is primary
    };
  }

  /**
   * Optimize image with Sharp
   * Requirement 8.4: Image optimization and WebP format conversion
   */
  async optimizeImage(sourceBuffer, sizeConfig, format) {
    let pipeline = sharp(sourceBuffer)
      .resize(sizeConfig.width, sizeConfig.height, { 
        fit: sizeConfig.fit,
        withoutEnlargement: true
      });
    
    // Apply optimization settings
    if (IMAGE_PROCESSING_CONFIG.optimization.removeMetadata) {
      pipeline = pipeline.withMetadata(false);
    }
    
    // Format-specific optimization
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp(IMAGE_PROCESSING_CONFIG.formats.webp);
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg(IMAGE_PROCESSING_CONFIG.formats.jpeg);
        break;
      case 'png':
        pipeline = pipeline.png(IMAGE_PROCESSING_CONFIG.formats.png);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    return await pipeline.toBuffer();
  }

  /**
   * Upload buffer to S3 with proper naming conventions
   * Requirement 8.2: S3 upload with proper naming conventions (studios/{studioId}/...)
   */
  async uploadToS3(buffer, s3Key, contentType) {
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000', // 1 year cache
      Metadata: {
        'processed-by': 'studio-image-processor',
        'processed-at': new Date().toISOString()
      }
    };

    try {
      await this.s3.upload(params).promise();
      const imageUrl = this.generateImageUrl(s3Key);
      
      console.log(`✅ Uploaded: ${s3Key}`);
      this.stats.uploaded++;
      
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
    const endpoint = this.config.services.s3.endpoint;
    return `${endpoint}/${this.bucketName}/${s3Key}`;
  }

  /**
   * Ensure S3 bucket exists and configure CORS
   * Requirement 8.6: CORS configuration for frontend access
   */
  async ensureBucketAndCORS() {
    try {
      // Ensure bucket exists
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

    // Configure CORS for frontend access
    await this.configureCORS();
  }

  /**
   * Configure CORS for the S3 bucket
   * Requirement 8.6: CORS configuration for frontend access
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
            ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
            MaxAgeSeconds: 3600
          },
          {
            // Specific rule for studio images
            AllowedHeaders: ['Authorization', 'Content-Type'],
            AllowedMethods: ['GET'],
            AllowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 86400 // 24 hours
          }
        ]
      }
    };

    try {
      await this.s3.putBucketCors(corsConfiguration).promise();
      console.log('✅ CORS configuration applied to bucket for studio images');
    } catch (error) {
      console.warn('⚠️  Could not configure CORS:', error.message);
      // Don't fail the entire process for CORS issues
    }
  }

  /**
   * Validate image accessibility
   * Requirement 8.7: Image accessibility validation
   */
  async validateImageAccessibility(s3Key) {
    try {
      // Check if image exists and is accessible
      const headResult = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: s3Key
      }).promise();
      
      // Validate content type
      if (!headResult.ContentType || !headResult.ContentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${headResult.ContentType}`);
      }
      
      // Validate size (should be reasonable)
      if (headResult.ContentLength > this.config.validation.thresholds.maxImageSize) {
        console.warn(`⚠️  Image ${s3Key} is larger than recommended: ${headResult.ContentLength} bytes`);
      }
      
      // Test actual accessibility by attempting to get the object
      await this.s3.getObject({
        Bucket: this.bucketName,
        Key: s3Key,
        Range: 'bytes=0-1023' // Just get first 1KB to test accessibility
      }).promise();
      
      console.log(`✅ Image accessibility validated: ${s3Key}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Image accessibility validation failed for ${s3Key}:`, error.message);
      this.stats.errors.push({
        type: 'accessibility_validation_error',
        s3Key,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Flatten image structure for studio object
   */
  flattenImageStructure(imagesByType) {
    const flatImages = [];
    
    for (const [imageType, images] of Object.entries(imagesByType)) {
      for (const image of images) {
        flatImages.push({
          type: imageType,
          index: image.index,
          isPrimary: image.isPrimary,
          thumbnail: image.versions.thumbnail.webp.url,
          thumbnailJpeg: image.versions.thumbnail.jpeg.url,
          medium: image.versions.medium.webp.url,
          mediumJpeg: image.versions.medium.jpeg.url,
          large: image.versions.large.webp.url,
          largeJpeg: image.versions.large.jpeg.url,
          uploadedAt: image.uploadedAt
        });
      }
    }
    
    return flatImages;
  }

  /**
   * Process multiple studios in batch
   */
  async processMultipleStudios(studios) {
    console.log(`🏢 Processing images for ${studios.length} studios...`);
    
    const processedStudios = [];
    
    for (const studio of studios) {
      try {
        const studioWithImages = await this.processStudioImages(studio);
        processedStudios.push(studioWithImages);
      } catch (error) {
        console.error(`❌ Failed to process studio ${studio.studioId}:`, error.message);
        // Add studio without images to maintain data integrity
        processedStudios.push({
          ...studio,
          images: [],
          imagesByType: {}
        });
      }
    }
    
    console.log(`✅ Completed batch processing: ${processedStudios.length} studios processed`);
    return processedStudios;
  }

  /**
   * Validate all studio images in S3
   */
  async validateAllStudioImages() {
    console.log('🔍 Validating all studio images in S3...');
    
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: 'studios/'
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      const studioImages = result.Contents || [];
      
      const validation = {
        totalImages: studioImages.length,
        accessibleImages: 0,
        inaccessibleImages: 0,
        errors: []
      };
      
      // Sample validation (check every 10th image to avoid overwhelming the system)
      const sampleImages = studioImages.filter((_, index) => index % 10 === 0);
      
      for (const image of sampleImages) {
        try {
          await this.validateImageAccessibility(image.Key);
          validation.accessibleImages++;
        } catch (error) {
          validation.inaccessibleImages++;
          validation.errors.push({
            key: image.Key,
            error: error.message
          });
        }
      }
      
      console.log(`✅ Studio image validation complete: ${validation.accessibleImages}/${sampleImages.length} sample images accessible`);
      return validation;
      
    } catch (error) {
      console.error('❌ Studio image validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up orphaned studio images
   */
  async cleanupOrphanedStudioImages(activeStudioIds) {
    console.log('🧹 Cleaning up orphaned studio images...');
    
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: 'studios/'
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      const studioImages = result.Contents || [];
      
      const orphanedImages = studioImages.filter(image => {
        const keyParts = image.Key.split('/');
        if (keyParts.length < 3) return false; // Invalid key format
        
        const studioId = keyParts[1]; // studios/{studioId}/...
        return !activeStudioIds.includes(studioId);
      });
      
      if (orphanedImages.length === 0) {
        console.log('✅ No orphaned studio images found');
        return { deleted: 0, errors: [] };
      }
      
      console.log(`🗑️  Found ${orphanedImages.length} orphaned studio images, deleting...`);
      
      const deleteResults = {
        deleted: 0,
        errors: []
      };
      
      // Delete in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < orphanedImages.length; i += batchSize) {
        const batch = orphanedImages.slice(i, i + batchSize);
        
        for (const image of batch) {
          try {
            await this.s3.deleteObject({
              Bucket: this.bucketName,
              Key: image.Key
            }).promise();
            
            deleteResults.deleted++;
            console.log(`🗑️  Deleted: ${image.Key}`);
          } catch (error) {
            deleteResults.errors.push({
              key: image.Key,
              error: error.message
            });
            console.error(`❌ Could not delete ${image.Key}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Cleanup complete: ${deleteResults.deleted} deleted, ${deleteResults.errors.length} errors`);
      return deleteResults;
      
    } catch (error) {
      console.error('❌ Studio image cleanup failed:', error.message);
      throw error;
    }
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
      optimized: 0,
      thumbnailsCreated: 0,
      errors: []
    };
  }

  /**
   * Get content type for file extension
   */
  getContentType(ext) {
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    
    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}

// Export the class
module.exports = {
  StudioImageProcessor,
  STUDIO_IMAGE_TYPES,
  IMAGE_PROCESSING_CONFIG
};

// CLI usage when run directly
if (require.main === module) {
  const processor = new StudioImageProcessor();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    validate: args.includes('--validate'),
    cleanup: args.includes('--cleanup')
  };
  
  async function main() {
    try {
      if (options.validate) {
        console.log('🔍 Validating studio images...');
        const validation = await processor.validateAllStudioImages();
        console.log(`🔍 Validation result: ${validation.accessibleImages}/${validation.totalImages} images accessible`);
        return;
      }
      
      if (options.cleanup) {
        console.log('🧹 Cleaning up orphaned studio images...');
        // This would need active studio IDs from somewhere
        console.log('⚠️  Cleanup requires active studio IDs. Use this method from the main pipeline.');
        return;
      }
      
      console.log('🏢 Studio Image Processor');
      console.log('Usage: node studio-image-processor.js [--validate] [--cleanup]');
      console.log('  --validate: Validate all studio images in S3');
      console.log('  --cleanup:  Clean up orphaned studio images');
      
    } catch (error) {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}