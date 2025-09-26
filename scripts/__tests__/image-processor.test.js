#!/usr/bin/env node

/**
 * Unit Tests for ImageProcessor Class
 * 
 * Comprehensive test suite for image processing functionality including
 * S3 operations, incremental processing, and error handling.
 */

const fs = require('fs');
const path = require('path');
const { ImageProcessor, STYLE_MAPPING } = require('../image-processor');
const { DATA_CONFIG } = require('../data-config');

// Mock AWS SDK
const mockS3 = {
  createBucket: jest.fn(),
  putBucketCors: jest.fn(),
  upload: jest.fn(),
  headObject: jest.fn(),
  listObjectsV2: jest.fn(),
  deleteObject: jest.fn()
};

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockS3)
}));

// Mock file system operations
jest.mock('fs');
jest.mock('../state-manager', () => ({
  STATE_MANAGER: {
    detectChanges: jest.fn()
  }
}));

describe('ImageProcessor', () => {
  let processor;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock configuration
    mockConfig = {
      services: {
        s3: {
          endpoint: 'http://localhost:4566',
          bucketName: 'test-bucket',
          region: 'eu-west-2',
          forcePathStyle: true
        },
        aws: {
          accessKeyId: 'test',
          secretAccessKey: 'test'
        }
      },
      paths: {
        imageSourceDir: '/test/images',
        outputDir: '/test/output'
      }
    };
    
    processor = new ImageProcessor(mockConfig);
    
    // Mock file system
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockReturnValue(true);
    fs.writeFileSync.mockReturnValue(true);
  });

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const defaultProcessor = new ImageProcessor();
      expect(defaultProcessor.config).toBeDefined();
      expect(defaultProcessor.bucketName).toBe(DATA_CONFIG.services.s3.bucketName);
    });

    test('should initialize with custom config', () => {
      expect(processor.bucketName).toBe('test-bucket');
      expect(processor.imageBasePath).toBe('/test/images');
    });

    test('should initialize statistics', () => {
      expect(processor.stats).toEqual({
        processed: 0,
        uploaded: 0,
        failed: 0,
        skipped: 0,
        errors: []
      });
    });
  });

  describe('ensureBucket', () => {
    test('should create bucket successfully', async () => {
      mockS3.createBucket.mockReturnValue({
        promise: () => Promise.resolve()
      });

      await processor.ensureBucket();
      
      expect(mockS3.createBucket).toHaveBeenCalledWith({
        Bucket: 'test-bucket'
      });
    });

    test('should handle existing bucket', async () => {
      mockS3.createBucket.mockReturnValue({
        promise: () => Promise.reject({ code: 'BucketAlreadyOwnedByYou' })
      });

      await expect(processor.ensureBucket()).resolves.not.toThrow();
    });

    test('should throw on other errors', async () => {
      mockS3.createBucket.mockReturnValue({
        promise: () => Promise.reject(new Error('Network error'))
      });

      await expect(processor.ensureBucket()).rejects.toThrow('Network error');
    });
  });

  describe('configureCORS', () => {
    test('should configure CORS successfully', async () => {
      mockS3.putBucketCors.mockReturnValue({
        promise: () => Promise.resolve()
      });

      await processor.configureCORS();
      
      expect(mockS3.putBucketCors).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        CORSConfiguration: {
          CORSRules: [{
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
          }]
        }
      });
    });

    test('should handle CORS configuration errors gracefully', async () => {
      mockS3.putBucketCors.mockReturnValue({
        promise: () => Promise.reject(new Error('CORS error'))
      });

      // Should not throw, just warn
      await expect(processor.configureCORS()).resolves.not.toThrow();
    });
  });

  describe('isImageFile', () => {
    test('should identify supported image formats', () => {
      expect(processor.isImageFile('test.jpg')).toBe(true);
      expect(processor.isImageFile('test.jpeg')).toBe(true);
      expect(processor.isImageFile('test.png')).toBe(true);
      expect(processor.isImageFile('test.webp')).toBe(true);
      expect(processor.isImageFile('test.gif')).toBe(true);
    });

    test('should reject unsupported formats', () => {
      expect(processor.isImageFile('test.txt')).toBe(false);
      expect(processor.isImageFile('test.pdf')).toBe(false);
      expect(processor.isImageFile('test')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(processor.isImageFile('test.JPG')).toBe(true);
      expect(processor.isImageFile('test.PNG')).toBe(true);
    });
  });

  describe('getContentType', () => {
    test('should return correct content types', () => {
      expect(processor.getContentType('test.jpg')).toBe('image/jpeg');
      expect(processor.getContentType('test.jpeg')).toBe('image/jpeg');
      expect(processor.getContentType('test.png')).toBe('image/png');
      expect(processor.getContentType('test.webp')).toBe('image/webp');
      expect(processor.getContentType('test.gif')).toBe('image/gif');
    });

    test('should return default for unknown types', () => {
      expect(processor.getContentType('test.unknown')).toBe('application/octet-stream');
    });
  });

  describe('generateImageUrl', () => {
    test('should generate correct LocalStack URL', () => {
      const url = processor.generateImageUrl('styles/traditional/image1.png');
      expect(url).toBe('http://localhost:4566/test-bucket/styles/traditional/image1.png');
    });
  });

  describe('shouldProcessImage', () => {
    test('should process when file does not exist in S3', async () => {
      mockS3.headObject.mockReturnValue({
        promise: () => Promise.reject({ code: 'NotFound' })
      });

      const result = await processor.shouldProcessImage('/test/image.png', 'styles/test/image.png');
      expect(result).toBe(true);
    });

    test('should process when local file is newer', async () => {
      const localTime = new Date('2023-01-02');
      const s3Time = new Date('2023-01-01');
      
      fs.statSync.mockReturnValue({ mtime: localTime });
      mockS3.headObject
        .mockReturnValueOnce({
          promise: () => Promise.resolve()
        })
        .mockReturnValueOnce({
          promise: () => Promise.resolve({ LastModified: s3Time })
        });

      const result = await processor.shouldProcessImage('/test/image.png', 'styles/test/image.png');
      expect(result).toBe(true);
    });

    test('should skip when S3 file is newer', async () => {
      const localTime = new Date('2023-01-01');
      const s3Time = new Date('2023-01-02');
      
      fs.statSync.mockReturnValue({ mtime: localTime });
      mockS3.headObject
        .mockReturnValueOnce({
          promise: () => Promise.resolve()
        })
        .mockReturnValueOnce({
          promise: () => Promise.resolve({ LastModified: s3Time })
        });

      const result = await processor.shouldProcessImage('/test/image.png', 'styles/test/image.png');
      expect(result).toBe(false);
    });
  });

  describe('uploadImage', () => {
    test('should upload image successfully', async () => {
      const mockFileContent = Buffer.from('fake image data');
      fs.readFileSync.mockReturnValue(mockFileContent);
      
      mockS3.upload.mockReturnValue({
        promise: () => Promise.resolve()
      });

      const result = await processor.uploadImage('/test/image.png', 'styles/test/image.png');
      
      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'styles/test/image.png',
        Body: mockFileContent,
        ContentType: 'image/png',
        ACL: 'public-read'
      });
      
      expect(result).toBe('http://localhost:4566/test-bucket/styles/test/image.png');
    });

    test('should handle upload errors', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('fake image data'));
      mockS3.upload.mockReturnValue({
        promise: () => Promise.reject(new Error('Upload failed'))
      });

      await expect(processor.uploadImage('/test/image.png', 'styles/test/image.png'))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('processStyleDirectory', () => {
    beforeEach(() => {
      fs.readdirSync.mockReturnValue(['image1.png', 'image2.jpg', 'readme.txt']);
      processor.shouldProcessImage = jest.fn().mockResolvedValue(true);
      processor.uploadImage = jest.fn().mockResolvedValue('http://test.com/image.png');
    });

    test('should process all images in directory', async () => {
      const result = await processor.processStyleDirectory('traditional', 'traditional');
      
      expect(result).toHaveLength(2); // Only image files
      expect(result[0]).toMatchObject({
        filename: 'image1.png',
        style: 'traditional',
        s3Key: 'styles/traditional/image1.png'
      });
    });

    test('should handle processing errors gracefully', async () => {
      processor.uploadImage.mockRejectedValueOnce(new Error('Upload failed'));
      
      const result = await processor.processStyleDirectory('traditional', 'traditional');
      
      expect(result).toHaveLength(1); // One succeeded, one failed
      expect(processor.stats.failed).toBe(1);
      expect(processor.stats.errors).toHaveLength(1);
    });

    test('should skip unchanged images', async () => {
      processor.shouldProcessImage
        .mockResolvedValueOnce(false) // Skip first image
        .mockResolvedValueOnce(true);  // Process second image
      
      const result = await processor.processStyleDirectory('traditional', 'traditional');
      
      expect(result).toHaveLength(2);
      expect(result[0].skipped).toBe(true);
      expect(result[1].skipped).toBeUndefined();
      expect(processor.stats.skipped).toBe(1);
      expect(processor.stats.uploaded).toBe(1);
    });
  });

  describe('processImages', () => {
    beforeEach(() => {
      // Mock filesystem operations
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockImplementation((path, options) => {
        if (options && options.withFileTypes) {
          return [
            { name: 'traditional', isDirectory: () => true },
            { name: 'realism', isDirectory: () => true }
          ];
        }
        return ['traditional', 'realism'];
      });
      
      processor.ensureBucket = jest.fn().mockResolvedValue();
      processor.configureCORS = jest.fn().mockResolvedValue();
      processor.processStyleDirectory = jest.fn().mockResolvedValue([
        { filename: 'image1.png', url: 'http://test.com/image1.png' }
      ]);
      processor.saveImageUrls = jest.fn().mockResolvedValue();
      processor.stateManager.detectChanges = jest.fn().mockReturnValue({
        imagesChanged: true
      });
    });

    test('should process all images successfully', async () => {
      const result = await processor.processImages();
      
      expect(result.success).toBe(true);
      expect(result.imageUrls).toHaveProperty('traditional');
      expect(result.imageUrls).toHaveProperty('realism');
      expect(processor.ensureBucket).toHaveBeenCalled();
      expect(processor.configureCORS).toHaveBeenCalled();
    });

    test('should skip processing when no changes detected', async () => {
      processor.stateManager.detectChanges.mockReturnValue({
        imagesChanged: false
      });
      processor.getExistingResults = jest.fn().mockReturnValue({
        success: true,
        imageUrls: { traditional: [] }
      });

      const result = await processor.processImages();
      
      expect(processor.ensureBucket).not.toHaveBeenCalled();
      expect(processor.getExistingResults).toHaveBeenCalled();
    });

    test('should force processing when requested', async () => {
      processor.stateManager.detectChanges.mockReturnValue({
        imagesChanged: false
      });

      const result = await processor.processImages({ force: true });
      
      expect(result.success).toBe(true);
      expect(processor.ensureBucket).toHaveBeenCalled();
    });

    test('should filter styles when specified', async () => {
      const result = await processor.processImages({ styles: ['traditional'] });
      
      expect(processor.processStyleDirectory).toHaveBeenCalledWith('traditional', 'traditional');
      expect(processor.processStyleDirectory).not.toHaveBeenCalledWith('realism', 'realism');
    });

    test('should handle processing errors', async () => {
      processor.ensureBucket.mockRejectedValue(new Error('Bucket error'));
      
      const result = await processor.processImages();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bucket error');
    });
  });

  describe('validateResults', () => {
    test('should validate image accessibility', async () => {
      const imageUrls = {
        traditional: [
          { s3Key: 'styles/traditional/image1.png', filename: 'image1.png' },
          { s3Key: 'styles/traditional/image2.png', filename: 'image2.png' }
        ]
      };

      mockS3.headObject.mockReturnValue({
        promise: () => Promise.resolve()
      });

      const result = await processor.validateResults(imageUrls);
      
      expect(result.totalImages).toBe(2);
      expect(result.accessibleUrls).toBe(2);
      expect(result.inaccessibleUrls).toBe(0);
    });

    test('should detect inaccessible images', async () => {
      const imageUrls = {
        traditional: [
          { s3Key: 'styles/traditional/image1.png', filename: 'image1.png' }
        ]
      };

      mockS3.headObject.mockReturnValue({
        promise: () => Promise.reject(new Error('Not found'))
      });

      const result = await processor.validateResults(imageUrls);
      
      expect(result.accessibleUrls).toBe(0);
      expect(result.inaccessibleUrls).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('listS3Images', () => {
    test('should list all images in bucket', async () => {
      mockS3.listObjectsV2.mockReturnValue({
        promise: () => Promise.resolve({
          Contents: [
            {
              Key: 'styles/traditional/image1.png',
              Size: 1024,
              LastModified: new Date('2023-01-01')
            }
          ]
        })
      });

      const result = await processor.listS3Images();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        key: 'styles/traditional/image1.png',
        size: 1024,
        url: 'http://localhost:4566/test-bucket/styles/traditional/image1.png'
      });
    });
  });

  describe('cleanupOrphanedImages', () => {
    test('should delete orphaned images', async () => {
      processor.listS3Images = jest.fn().mockResolvedValue([
        { key: 'styles/traditional/orphan.png' }
      ]);
      processor.getLocalImageList = jest.fn().mockReturnValue([
        { filename: 'local.png' }
      ]);
      
      mockS3.deleteObject.mockReturnValue({
        promise: () => Promise.resolve()
      });

      const result = await processor.cleanupOrphanedImages();
      
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'styles/traditional/orphan.png'
      });
    });

    test('should handle no orphaned images', async () => {
      processor.listS3Images = jest.fn().mockResolvedValue([
        { key: 'styles/traditional/local.png' }
      ]);
      processor.getLocalImageList = jest.fn().mockReturnValue([
        { filename: 'local.png' }
      ]);

      const result = await processor.cleanupOrphanedImages();
      
      expect(result.deleted).toBe(0);
      expect(mockS3.deleteObject).not.toHaveBeenCalled();
    });
  });

  describe('Statistics Management', () => {
    test('should track processing statistics', () => {
      processor.stats.processed = 5;
      processor.stats.uploaded = 3;
      processor.stats.failed = 1;
      processor.stats.skipped = 1;

      const stats = processor.getStats();
      expect(stats).toEqual({
        processed: 5,
        uploaded: 3,
        failed: 1,
        skipped: 1,
        errors: []
      });
    });

    test('should reset statistics', () => {
      processor.stats.processed = 5;
      processor.resetStats();
      
      expect(processor.stats.processed).toBe(0);
      expect(processor.stats.uploaded).toBe(0);
    });
  });

  describe('STYLE_MAPPING', () => {
    test('should include all expected styles', () => {
      const expectedStyles = [
        'watercolour', 'tribal', 'traditional', 'surrealism', 'sketch',
        'realism', 'old_school', 'new_school', 'neo_traditional', 'minimalism',
        'lettering', 'geometric', 'floral', 'blackwork', 'dotwork'
      ];

      expectedStyles.forEach(style => {
        expect(Object.values(STYLE_MAPPING)).toContain(style);
      });
    });

    test('should handle typo correction', () => {
      expect(STYLE_MAPPING['psychelic']).toBe('psychedelic');
      expect(STYLE_MAPPING['fine_line']).toBe('fineline');
    });
  });
});