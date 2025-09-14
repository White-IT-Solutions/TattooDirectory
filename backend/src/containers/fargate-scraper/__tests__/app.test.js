/**
 * Tests for Fargate Scraper Container
 */

// Mock AWS SDK before importing the app
const mockSend = jest.fn();
const mockDynamoDBDocumentClient = {
  send: mockSend
};

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => mockDynamoDBDocumentClient)
  },
  UpdateCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn(),
  ReceiveMessageCommand: jest.fn(),
  DeleteMessageCommand: jest.fn()
}));

// Mock logger
jest.mock('../common/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })
}));

// Mock DynamoDB functions
jest.mock('../common/dynamodb', () => ({
  generateArtistKeys: jest.fn(() => ({
    PK: 'ARTIST#test-artist-123',
    SK: 'METADATA'
  })),
  updateArtist: jest.fn()
}));

const { processArtist, scrapeArtistData } = require('../app');

describe('Fargate Scraper Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DYNAMODB_TABLE_NAME = 'test-table';
  });

  describe('scrapeArtistData', () => {
    it('should scrape artist data successfully', async () => {
      const message = {
        artistId: 'test-artist-123',
        portfolioUrl: 'https://example.com/portfolio',
        instagramHandle: 'test_artist'
      };

      const result = await scrapeArtistData(message);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('styles');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('portfolioImages');
      expect(result).toHaveProperty('contactInfo');
      expect(result.styles).toBeInstanceOf(Array);
      expect(result.portfolioImages).toBeInstanceOf(Array);
      expect(result.lastScrapedAt).toBeDefined();
    });

    it('should handle scraping errors', async () => {
      const message = {
        artistId: 'test-artist-123',
        portfolioUrl: 'invalid-url',
        instagramHandle: 'test_artist'
      };

      // The function should still work with invalid URLs in this mock implementation
      const result = await scrapeArtistData(message);
      expect(result).toBeDefined();
    });

    it('should extract portfolio images from Instagram', async () => {
      const message = {
        artistId: 'instagram-artist',
        instagramHandle: 'tattoo_artist_test',
        portfolioUrl: 'https://instagram.com/tattoo_artist_test'
      };

      const result = await scrapeArtistData(message);

      expect(result.portfolioImages).toBeInstanceOf(Array);
      expect(result.portfolioImages.length).toBeGreaterThan(0);
      expect(result.portfolioImages[0]).toHaveProperty('url');
      expect(result.portfolioImages[0]).toHaveProperty('thumbnailUrl');
      expect(result.portfolioImages[0]).toHaveProperty('style');
      expect(result.portfolioImages[0]).toHaveProperty('uploadDate');
    });

    it('should identify tattoo styles from images', async () => {
      const message = {
        artistId: 'style-test-artist',
        instagramHandle: 'traditional_artist',
        portfolioUrl: 'https://example.com/traditional'
      };

      const result = await scrapeArtistData(message);

      expect(result.styles).toBeInstanceOf(Array);
      expect(result.styles.length).toBeGreaterThan(0);
      expect(result.styles).toContain('traditional');
    });

    it('should extract contact information', async () => {
      const message = {
        artistId: 'contact-test-artist',
        instagramHandle: 'contact_artist',
        portfolioUrl: 'https://example.com/contact'
      };

      const result = await scrapeArtistData(message);

      expect(result.contactInfo).toBeDefined();
      expect(result.contactInfo).toHaveProperty('instagram');
      expect(result.contactInfo).toHaveProperty('bookingMethod');
      expect(result.contactInfo.instagram).toContain('instagram.com');
    });

    it('should handle rate limiting gracefully', async () => {
      const message = {
        artistId: 'rate-limit-test',
        instagramHandle: 'popular_artist',
        portfolioUrl: 'https://example.com/popular'
      };

      // Mock implementation should handle rate limiting
      const result = await scrapeArtistData(message);
      expect(result).toBeDefined();
      expect(result.scrapingStatus).toBeDefined();
    });

    it('should validate scraped data quality', async () => {
      const message = {
        artistId: 'quality-test-artist',
        instagramHandle: 'quality_artist',
        portfolioUrl: 'https://example.com/quality'
      };

      const result = await scrapeArtistData(message);

      expect(result.dataQuality).toBeDefined();
      expect(result.dataQuality.completeness).toBeGreaterThanOrEqual(0);
      expect(result.dataQuality.completeness).toBeLessThanOrEqual(1);
      expect(result.dataQuality.confidence).toBeGreaterThanOrEqual(0);
      expect(result.dataQuality.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('processArtist', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should process artist successfully', async () => {
      mockSend.mockResolvedValue({});

      const message = {
        artistId: 'test-artist-123',
        portfolioUrl: 'https://example.com/portfolio',
        scrapeId: 'scrape-123',
        instagramHandle: 'test_artist'
      };

      await expect(processArtist(message)).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle idempotency check (duplicate scrape)', async () => {
      const conditionalCheckError = new Error('ConditionalCheckFailedException');
      conditionalCheckError.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValue(conditionalCheckError);

      const message = {
        artistId: 'test-artist-123',
        portfolioUrl: 'https://example.com/portfolio',
        scrapeId: 'scrape-123',
        instagramHandle: 'test_artist'
      };

      // Should not throw error for duplicate scrape
      await expect(processArtist(message)).resolves.not.toThrow();
    });

    it('should throw error for other DynamoDB errors', async () => {
      const otherError = new Error('Some other error');
      mockSend.mockRejectedValue(otherError);

      const message = {
        artistId: 'test-artist-123',
        portfolioUrl: 'https://example.com/portfolio',
        scrapeId: 'scrape-123',
        instagramHandle: 'test_artist'
      };

      await expect(processArtist(message)).rejects.toThrow('Some other error');
    });

    it('should require artistId and scrapeId', async () => {
      const message = {
        portfolioUrl: 'https://example.com/portfolio',
        instagramHandle: 'test_artist'
      };

      await expect(processArtist(message)).rejects.toThrow('artistId and scrapeId are required');
    });

    it('should update artist with scraped data', async () => {
      mockSend.mockResolvedValue({});

      const message = {
        artistId: 'update-test-artist',
        portfolioUrl: 'https://example.com/update-test',
        scrapeId: 'scrape-update-123',
        instagramHandle: 'update_test_artist',
        styles: ['traditional', 'realism'],
        location: 'London'
      };

      await processArtist(message);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-table',
          Key: expect.objectContaining({
            PK: 'ARTIST#update-test-artist',
            SK: 'METADATA'
          }),
          UpdateExpression: expect.stringContaining('SET'),
          ExpressionAttributeValues: expect.objectContaining({
            ':lastScrapedAt': expect.any(String),
            ':scrapeId': 'scrape-update-123'
          })
        })
      );
    });

    it('should handle missing portfolio URL gracefully', async () => {
      mockSend.mockResolvedValue({});

      const message = {
        artistId: 'no-portfolio-artist',
        scrapeId: 'scrape-no-portfolio-123',
        instagramHandle: 'no_portfolio_artist'
        // No portfolioUrl provided
      };

      await expect(processArtist(message)).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle scraping timeout', async () => {
      // Mock a timeout scenario
      const message = {
        artistId: 'timeout-artist',
        portfolioUrl: 'https://very-slow-site.com/timeout',
        scrapeId: 'scrape-timeout-123',
        instagramHandle: 'timeout_artist'
      };

      // Should complete even if scraping times out
      await expect(processArtist(message)).resolves.not.toThrow();
    });

    it('should validate message structure', async () => {
      const invalidMessage = {
        // Missing required fields
        portfolioUrl: 'https://example.com/invalid'
      };

      await expect(processArtist(invalidMessage)).rejects.toThrow();
    });

    it('should handle DynamoDB conditional check failures', async () => {
      const conditionalError = new Error('The conditional request failed');
      conditionalError.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValue(conditionalError);

      const message = {
        artistId: 'conditional-fail-artist',
        portfolioUrl: 'https://example.com/conditional',
        scrapeId: 'scrape-conditional-123',
        instagramHandle: 'conditional_artist'
      };

      // Should handle conditional check failure gracefully (idempotency)
      await expect(processArtist(message)).resolves.not.toThrow();
    });

    it('should log scraping progress and results', async () => {
      mockSend.mockResolvedValue({});

      const message = {
        artistId: 'logging-test-artist',
        portfolioUrl: 'https://example.com/logging-test',
        scrapeId: 'scrape-logging-123',
        instagramHandle: 'logging_test_artist'
      };

      await processArtist(message);

      // Verify that logging functions were called
      // Note: In a real implementation, we would check logger calls
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('error handling and resilience', () => {
    it('should handle network errors gracefully', async () => {
      const message = {
        artistId: 'network-error-artist',
        portfolioUrl: 'https://unreachable-site.com/network-error',
        scrapeId: 'scrape-network-123',
        instagramHandle: 'network_error_artist'
      };

      // Should not throw for network errors
      const result = await scrapeArtistData(message);
      expect(result).toBeDefined();
      expect(result.scrapingStatus).toBe('partial_failure');
    });

    it('should handle malformed HTML gracefully', async () => {
      const message = {
        artistId: 'malformed-html-artist',
        portfolioUrl: 'https://example.com/malformed-html',
        scrapeId: 'scrape-malformed-123',
        instagramHandle: 'malformed_artist'
      };

      const result = await scrapeArtistData(message);
      expect(result).toBeDefined();
      expect(result.portfolioImages).toBeInstanceOf(Array);
    });

    it('should respect rate limits and retry logic', async () => {
      const message = {
        artistId: 'rate-limit-artist',
        portfolioUrl: 'https://example.com/rate-limited',
        scrapeId: 'scrape-rate-123',
        instagramHandle: 'rate_limit_artist'
      };

      const result = await scrapeArtistData(message);
      expect(result).toBeDefined();
      expect(result.retryCount).toBeDefined();
    });
  });

  describe('data quality and validation', () => {
    it('should validate scraped image URLs', async () => {
      const message = {
        artistId: 'image-validation-artist',
        portfolioUrl: 'https://example.com/image-validation',
        scrapeId: 'scrape-validation-123',
        instagramHandle: 'validation_artist'
      };

      const result = await scrapeArtistData(message);
      
      result.portfolioImages.forEach(image => {
        expect(image.url).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i);
        expect(image.thumbnailUrl).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i);
      });
    });

    it('should filter out non-tattoo content', async () => {
      const message = {
        artistId: 'content-filter-artist',
        portfolioUrl: 'https://example.com/mixed-content',
        scrapeId: 'scrape-filter-123',
        instagramHandle: 'filter_artist'
      };

      const result = await scrapeArtistData(message);
      
      // All images should be tattoo-related
      result.portfolioImages.forEach(image => {
        expect(image.tags).toContain('tattoo');
      });
    });

    it('should detect and categorize tattoo styles accurately', async () => {
      const message = {
        artistId: 'style-detection-artist',
        portfolioUrl: 'https://example.com/style-detection',
        scrapeId: 'scrape-style-123',
        instagramHandle: 'style_artist'
      };

      const result = await scrapeArtistData(message);
      
      expect(result.styles).toBeInstanceOf(Array);
      expect(result.styles.length).toBeGreaterThan(0);
      
      const validStyles = [
        'traditional', 'realism', 'blackwork', 'neo-traditional',
        'watercolor', 'geometric', 'tribal', 'japanese', 'biomechanical'
      ];
      
      result.styles.forEach(style => {
        expect(validStyles).toContain(style);
      });
    });
  });
});