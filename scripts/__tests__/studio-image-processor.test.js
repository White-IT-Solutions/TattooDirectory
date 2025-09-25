/**
 * Studio Image Processor Tests
 * 
 * Tests for the StudioImageProcessor class functionality including
 * image processing, S3 upload, optimization, and validation.
 */

const { StudioImageProcessor, STUDIO_IMAGE_TYPES, IMAGE_PROCESSING_CONFIG } = require('../data-management/studio-image-processor');
const { DATA_CONFIG } = require('../data-config');
const fs = require('fs');
const path = require('path');

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    createBucket: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    putBucketCors: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Location: 'http://localhost:4566/test-bucket/test-key' })
    }),
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentType: 'image/webp',
        ContentLength: 1024,
        LastModified: new Date()
      })
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Body: Buffer.from('test') })
    }),
    listObjectsV2: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [
          { Key: 'studios/studio-001/exterior/1_medium.webp', Size: 1024, LastModified: new Date() }
        ]
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  }))
}));

// Mock Sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1200,
      height: 800,
      format: 'jpeg'
    }),
    resize: jest.fn().mockReturnThis(),
    withMetadata: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
  }));
  
  return mockSharp;
});

// Mock fs for file operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('StudioImageProcessor', () => {
  let processor;
  let mockStudio;

  beforeEach(() => {
    processor = new StudioImageProcessor();
    mockStudio = {
      studioId: 'studio-001',
      studioName: 'Test Studio',
      address: '123 Test Street',
      specialties: ['traditional', 'realism']
    };

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['test-image.jpg', 'another-image.png']);
    fs.readFileSync.mockReturnValue(Buffer.from('test-image-data'));
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(processor.config).toBeDefined();
      expect(processor.s3).toBeDefined();
      expect(processor.bucketName).toBe(DATA_CONFIG.services.s3.bucketName);
      expect(processor.stats).toEqual({
        processed: 0,
        uploaded: 0,
        failed: 0,
        skipped: 0,
        optimized: 0,
        thumbnailsCreated: 0,
        errors: []
      });
    });

    test('should accept custom configuration', () => {
      const customConfig = { ...DATA_CONFIG, services: { ...DATA_CONFIG.services, s3: { ...DATA_CONFIG.services.s3, bucketName: 'custom-bucket' } } };
      const customProcessor = new StudioImageProcessor(customConfig);
      expect(customProcessor.bucketName).toBe('custom-bucket');
    });
  });

  describe('Image Type Configuration', () => {
    test('should have correct studio image types', () => {
      expect(STUDIO_IMAGE_TYPES).toHaveProperty('exterior');
      expect(STUDIO_IMAGE_TYPES).toHaveProperty('interior');
      expect(STUDIO_IMAGE_TYPES).toHaveProperty('gallery');
      
      expect(STUDIO_IMAGE_TYPES.exterior.minImages).toBe(1);
      expect(STUDIO_IMAGE_TYPES.interior.minImages).toBe(1);
      expect(STUDIO_IMAGE_TYPES.gallery.minImages).toBe(1);
    });

    test('should have correct image processing configuration', () => {
      expect(IMAGE_PROCESSING_CONFIG.formats).toHaveProperty('webp');
      expect(IMAGE_PROCESSING_CONFIG.formats).toHaveProperty('jpeg');
      expect(IMAGE_PROCESSING_CONFIG.sizes).toHaveProperty('thumbnail');
      expect(IMAGE_PROCESSING_CONFIG.sizes).toHaveProperty('medium');
      expect(IMAGE_PROCESSING_CONFIG.sizes).toHaveProperty('large');
    });
  });

  describe('isImageFile', () => {
    test('should identify valid image files', () => {
      expect(processor.isImageFile('test.jpg')).toBe(true);
      expect(processor.isImageFile('test.jpeg')).toBe(true);
      expect(processor.isImageFile('test.png')).toBe(true);
      expect(processor.isImageFile('test.webp')).toBe(true);
      expect(processor.isImageFile('test.gif')).toBe(true);
    });

    test('should reject non-image files', () => {
      expect(processor.isImageFile('test.txt')).toBe(false);
      expect(processor.isImageFile('test.pdf')).toBe(false);
      expect(processor.isImageFile('test')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(processor.isImageFile('test.JPG')).toBe(true);
      expect(processor.isImageFile('test.PNG')).toBe(true);
      expect(processor.isImageFile('test.WEBP')).toBe(true);
    });
  });

  describe('getSourceImagesForType', () => {
    test('should get images from specific type directory', async () => {
      const images = await processor.getSourceImagesForType('exterior');
      
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('StudioImages', 'exterior'))
      );
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveProperty('filename', 'test-image.jpg');
      expect(images[0]).toHaveProperty('type', 'exterior');
    });

    test('should fallback to sample directory if type directory does not exist', async () => {
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('exterior')) return false;
        if (path.includes('sample')) return true;
        return true;
      });

      const images = await processor.getSourceImagesForType('exterior');
      
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveProperty('type', 'exterior');
    });

    test('should return empty array if no directories exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const images = await processor.getSourceImagesForType('exterior');
      expect(images).toHaveLength(0);
    });
  });

  describe('selectImagesForStudio', () => {
    test('should select correct number of images based on type configuration', () => {
      const sourceImages = [
        { filename: 'img1.jpg' },
        { filename: 'img2.jpg' },
        { filename: 'img3.jpg' },
        { filename: 'img4.jpg' }
      ];
      
      const typeConfig = STUDIO_IMAGE_TYPES.exterior;
      const selected = processor.selectImagesForStudio(sourceImages, typeConfig);
      
      expect(selected.length).toBeGreaterThanOrEqual(typeConfig.minImages);
      expect(selected.length).toBeLessThanOrEqual(typeConfig.maxImages);
    });

    test('should not select more images than available', () => {
      const sourceImages = [{ filename: 'img1.jpg' }];
      const typeConfig = STUDIO_IMAGE_TYPES.exterior;
      
      const selected = processor.selectImagesForStudio(sourceImages, typeConfig);
      expect(selected.length).toBe(1);
    });
  });

  describe('generateImageUrl', () => {
    test('should generate correct LocalStack URL', () => {
      const s3Key = 'studios/studio-001/exterior/1_medium.webp';
      const url = processor.generateImageUrl(s3Key);
      
      expect(url).toBe(`${DATA_CONFIG.services.s3.endpoint}/${DATA_CONFIG.services.s3.bucketName}/${s3Key}`);
    });
  });

  describe('ensureBucketAndCORS', () => {
    test('should create bucket and configure CORS', async () => {
      await processor.ensureBucketAndCORS();
      
      expect(processor.s3.createBucket).toHaveBeenCalledWith({
        Bucket: processor.bucketName
      });
      expect(processor.s3.putBucketCors).toHaveBeenCalled();
    });

    test('should handle existing bucket gracefully', async () => {
      processor.s3.createBucket.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'BucketAlreadyOwnedByYou' })
      });
      
      await expect(processor.ensureBucketAndCORS()).resolves.not.toThrow();
    });
  });

  describe('validateImageAccessibility', () => {
    test('should validate accessible image', async () => {
      const result = await processor.validateImageAccessibility('test-key');
      
      expect(processor.s3.headObject).toHaveBeenCalledWith({
        Bucket: processor.bucketName,
        Key: 'test-key'
      });
      expect(processor.s3.getObject).toHaveBeenCalledWith({
        Bucket: processor.bucketName,
        Key: 'test-key',
        Range: 'bytes=0-1023'
      });
      expect(result).toBe(true);
    });

    test('should throw error for inaccessible image', async () => {
      processor.s3.headObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Not found'))
      });
      
      await expect(processor.validateImageAccessibility('test-key')).rejects.toThrow('Not found');
    });

    test('should validate content type', async () => {
      processor.s3.headObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentType: 'text/plain',
          ContentLength: 1024
        })
      });
      
      await expect(processor.validateImageAccessibility('test-key')).rejects.toThrow('Invalid content type');
    });
  });

  describe('flattenImageStructure', () => {
    test('should flatten image structure correctly', () => {
      const imagesByType = {
        exterior: [
          {
            type: 'exterior',
            index: 1,
            isPrimary: true,
            versions: {
              thumbnail: { webp: { url: 'thumb.webp' }, jpeg: { url: 'thumb.jpg' } },
              medium: { webp: { url: 'medium.webp' }, jpeg: { url: 'medium.jpg' } },
              large: { webp: { url: 'large.webp' }, jpeg: { url: 'large.jpg' } }
            },
            uploadedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };
      
      const flattened = processor.flattenImageStructure(imagesByType);
      
      expect(flattened).toHaveLength(1);
      expect(flattened[0]).toHaveProperty('type', 'exterior');
      expect(flattened[0]).toHaveProperty('isPrimary', true);
      expect(flattened[0]).toHaveProperty('thumbnail', 'thumb.webp');
      expect(flattened[0]).toHaveProperty('medium', 'medium.webp');
      expect(flattened[0]).toHaveProperty('large', 'large.webp');
    });
  });

  describe('getStats and resetStats', () => {
    test('should return current statistics', () => {
      processor.stats.processed = 5;
      processor.stats.uploaded = 3;
      
      const stats = processor.getStats();
      expect(stats.processed).toBe(5);
      expect(stats.uploaded).toBe(3);
    });

    test('should reset statistics', () => {
      processor.stats.processed = 5;
      processor.stats.errors = ['error1'];
      
      processor.resetStats();
      
      expect(processor.stats.processed).toBe(0);
      expect(processor.stats.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Mock an error during image processing
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const result = await processor.processStudioImages(mockStudio);
      
      expect(result.images).toHaveLength(0);
      expect(result.imagesByType).toEqual({
        exterior: [],
        interior: [],
        gallery: []
      });
      expect(processor.stats.failed).toBeGreaterThan(0);
    });

    test('should track errors in statistics', async () => {
      processor.stats.errors.push({
        type: 'test_error',
        message: 'Test error message'
      });
      
      const stats = processor.getStats();
      expect(stats.errors).toHaveLength(1);
      expect(stats.errors[0].type).toBe('test_error');
    });
  });

  describe('Integration Tests', () => {
    test('should process studio images end-to-end', async () => {
      // This test would require actual image files and S3 setup
      // For now, we'll test the flow with mocks
      
      const result = await processor.processStudioImages(mockStudio);
      
      expect(result).toHaveProperty('studioId', 'studio-001');
      expect(result).toHaveProperty('images');
      expect(result).toHaveProperty('imagesByType');
    });
  });
});

describe('CLI Usage', () => {
  test('should handle CLI arguments correctly', () => {
    // Test CLI argument parsing
    const originalArgv = process.argv;
    process.argv = ['node', 'studio-image-processor.js', '--validate'];
    
    // This would test the CLI functionality
    // For now, we just verify the module can be required
    expect(() => require('../data-management/studio-image-processor')).not.toThrow();
    
    process.argv = originalArgv;
  });
});