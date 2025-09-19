# Local Development Best Practices

## Overview

This document outlines comprehensive best practices for local development of the Tattoo Artist Directory application. Following these practices ensures consistent, efficient, and maintainable development across all team members and platforms.

## Table of Contents

1. [Environment Management](#environment-management)
2. [Code Quality Standards](#code-quality-standards)
3. [Testing Practices](#testing-practices)
4. [Performance Optimization](#performance-optimization)
5. [Security Practices](#security-practices)
6. [Documentation Standards](#documentation-standards)
7. [Collaboration Guidelines](#collaboration-guidelines)
8. [Troubleshooting Methodology](#troubleshooting-methodology)
9. [Deployment Preparation](#deployment-preparation)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Environment Management

### Daily Workflow Best Practices

#### Morning Setup Routine
```bash
# 1. Update codebase
git pull origin main

# 2. Check for dependency updates
npm outdated

# 3. Start clean environment
npm run local:restart

# 4. Verify environment health
npm run local:health

# 5. Seed fresh test data
npm run seed:fresh
```

#### End of Day Routine
```bash
# 1. Run comprehensive tests
npm run test:all

# 2. Check code quality
npm run lint
npm run type-check

# 3. Commit changes with meaningful messages
git add .
git commit -m "feat(search): implement advanced filtering"

# 4. Push to feature branch
git push origin feature/advanced-search

# 5. Stop environment to free resources
npm run local:stop
```

### Environment Configuration

#### Environment Variables Management
```bash
# Use .env.local for local overrides (never commit)
# .env.local
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=eu-west-2
DYNAMODB_TABLE_NAME=tattoo-directory-local
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true

# Use .env.example as template (commit this)
# .env.example
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=eu-west-2
DYNAMODB_TABLE_NAME=your-table-name
LOG_LEVEL=info
```

#### Docker Resource Management
```yaml
# docker-compose.local.yml - Resource limits
services:
  localstack:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Service Management

#### Health Check Implementation
```javascript
// backend/src/health/health-check.js
class HealthCheck {
  async checkServices() {
    const checks = {
      database: await this.checkDynamoDB(),
      search: await this.checkOpenSearch(),
      storage: await this.checkS3(),
      timestamp: new Date().toISOString()
    };

    const allHealthy = Object.values(checks)
      .filter(check => typeof check === 'object')
      .every(check => check.healthy);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    };
  }

  async checkDynamoDB() {
    try {
      await this.dynamodb.describeTable({
        TableName: process.env.DYNAMODB_TABLE_NAME
      }).promise();
      
      return { healthy: true, message: 'DynamoDB accessible' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }
}
```

#### Service Dependency Management
```javascript
// backend/src/utils/service-dependencies.js
class ServiceDependencies {
  constructor() {
    this.dependencies = [
      { name: 'DynamoDB', check: () => this.checkDynamoDB() },
      { name: 'OpenSearch', check: () => this.checkOpenSearch() },
      { name: 'S3', check: () => this.checkS3() }
    ];
  }

  async waitForDependencies(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const results = await Promise.all(
        this.dependencies.map(async dep => ({
          name: dep.name,
          healthy: await dep.check()
        }))
      );

      if (results.every(result => result.healthy)) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Service dependencies not ready within timeout');
  }
}
```

## Code Quality Standards

### TypeScript Best Practices

#### Strict Type Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Type Definitions
```typescript
// src/types/artist.ts
export interface Artist {
  readonly artistId: string;
  artistName: string;
  instagramHandle?: string;
  styles: ArtistStyle[];
  location: Location;
  portfolioImages: PortfolioImage[];
  contactInfo: ContactInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistStyle {
  style: TattooStyle;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city: string;
  country: string;
  geohash: string;
}
```

#### Error Handling Types
```typescript
// src/types/api.ts
export type ApiResponse<T> = {
  success: true;
  data: T;
  metadata?: {
    pagination?: PaginationInfo;
    filters?: FilterInfo;
  };
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### Code Organization

#### File Structure Standards
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── services/            # API and business logic
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
└── constants/           # Application constants
```

#### Naming Conventions
```typescript
// Files: kebab-case
artist-profile.tsx
search-filters.component.tsx
api-client.service.ts

// Components: PascalCase
export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artist }) => {
  // Component implementation
};

// Functions: camelCase
export const getArtistById = async (artistId: string): Promise<Artist> => {
  // Function implementation
};

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const DEFAULT_PAGE_SIZE = 20;

// Types/Interfaces: PascalCase
export interface ArtistSearchFilters {
  styles?: string[];
  location?: LocationFilter;
  radius?: number;
}
```

### Code Documentation

#### JSDoc Standards
```typescript
/**
 * Searches for artists based on provided filters
 * 
 * @param filters - Search filters to apply
 * @param pagination - Pagination options
 * @returns Promise resolving to paginated artist results
 * 
 * @example
 * ```typescript
 * const results = await searchArtists({
 *   styles: ['traditional', 'neo-traditional'],
 *   location: { lat: 51.5074, lng: -0.1278 },
 *   radius: 50
 * }, { page: 1, limit: 20 });
 * ```
 */
export async function searchArtists(
  filters: ArtistSearchFilters,
  pagination: PaginationOptions
): Promise<ApiResponse<PaginatedArtists>> {
  // Implementation
}
```

#### Component Documentation
```typescript
/**
 * Artist profile card component displaying key artist information
 * 
 * @component
 * @example
 * ```tsx
 * <ArtistCard 
 *   artist={artist} 
 *   onSelect={(id) => navigate(`/artists/${id}`)}
 *   showContactInfo={false}
 * />
 * ```
 */
export interface ArtistCardProps {
  /** Artist data to display */
  artist: Artist;
  /** Callback when artist is selected */
  onSelect?: (artistId: string) => void;
  /** Whether to show contact information */
  showContactInfo?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onSelect,
  showContactInfo = true,
  className
}) => {
  // Component implementation
};
```

## Testing Practices

### Test Structure and Organization

#### Test File Organization
```
tests/
├── unit/                # Unit tests
│   ├── components/      # Component tests
│   ├── services/        # Service tests
│   ├── utils/           # Utility tests
│   └── hooks/           # Hook tests
├── integration/         # Integration tests
│   ├── api/             # API integration tests
│   ├── database/        # Database tests
│   └── search/          # Search functionality tests
└── e2e/                 # End-to-end tests
    ├── user-journeys/   # Complete user flows
    ├── admin/           # Admin functionality
    └── performance/     # Performance tests
```

#### Unit Testing Best Practices
```typescript
// tests/unit/services/artist.service.test.ts
import { ArtistService } from '@/services/artist.service';
import { mockDynamoDBClient } from '@/tests/mocks/aws-clients';

describe('ArtistService', () => {
  let artistService: ArtistService;

  beforeEach(() => {
    artistService = new ArtistService(mockDynamoDBClient);
    jest.clearAllMocks();
  });

  describe('getArtistById', () => {
    it('should return artist when found', async () => {
      // Arrange
      const artistId = 'artist-123';
      const expectedArtist = createMockArtist({ artistId });
      mockDynamoDBClient.get.mockResolvedValue({ Item: expectedArtist });

      // Act
      const result = await artistService.getArtistById(artistId);

      // Assert
      expect(result).toEqual(expectedArtist);
      expect(mockDynamoDBClient.get).toHaveBeenCalledWith({
        TableName: expect.any(String),
        Key: { PK: `ARTIST#${artistId}`, SK: 'PROFILE' }
      });
    });

    it('should throw error when artist not found', async () => {
      // Arrange
      const artistId = 'non-existent';
      mockDynamoDBClient.get.mockResolvedValue({});

      // Act & Assert
      await expect(artistService.getArtistById(artistId))
        .rejects
        .toThrow('Artist not found');
    });
  });
});
```

#### Integration Testing Best Practices
```typescript
// tests/integration/api/artists.test.ts
import request from 'supertest';
import { app } from '@/app';
import { setupTestDatabase, cleanupTestDatabase } from '@/tests/helpers/database';

describe('Artists API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await seedTestData();
  });

  describe('GET /v1/artists', () => {
    it('should return paginated artist list', async () => {
      const response = await request(app)
        .get('/v1/artists')
        .query({ limit: 10, page: 1 })
        .expect(200);

      expect(response.body).toMatchObject({
        artists: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrevious: false
        }
      });

      expect(response.body.artists).toHaveLength(10);
      expect(response.body.artists[0]).toMatchObject({
        artistId: expect.any(String),
        artistName: expect.any(String),
        styles: expect.any(Array)
      });
    });

    it('should filter artists by style', async () => {
      const response = await request(app)
        .get('/v1/artists')
        .query({ styles: 'traditional,neo-traditional' })
        .expect(200);

      expect(response.body.artists).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            styles: expect.arrayContaining(['traditional'])
          })
        ])
      );
    });
  });
});
```

#### End-to-End Testing Best Practices
```typescript
// tests/e2e/artist-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Artist Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should search artists by location', async ({ page }) => {
    // Enter location
    await page.fill('[data-testid="location-input"]', 'London, UK');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="artist-card"]');

    // Verify results
    const artistCards = await page.locator('[data-testid="artist-card"]').count();
    expect(artistCards).toBeGreaterThan(0);

    // Check first result contains location info
    const firstCard = page.locator('[data-testid="artist-card"]').first();
    await expect(firstCard.locator('[data-testid="artist-location"]'))
      .toContainText('London');
  });

  test('should filter artists by style', async ({ page }) => {
    // Open style filter
    await page.click('[data-testid="style-filter-button"]');
    
    // Select traditional style
    await page.check('[data-testid="style-traditional"]');
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await page.waitForSelector('[data-testid="artist-card"]');

    // Verify all results have traditional style
    const styleElements = await page.locator('[data-testid="artist-styles"]').all();
    for (const element of styleElements) {
      await expect(element).toContainText('Traditional');
    }
  });
});
```

### Test Data Management

#### Mock Data Creation
```typescript
// tests/helpers/mock-data.ts
export const createMockArtist = (overrides: Partial<Artist> = {}): Artist => ({
  artistId: 'artist-123',
  artistName: 'John Doe',
  instagramHandle: 'johndoe_tattoo',
  styles: ['traditional', 'neo-traditional'],
  location: {
    lat: 51.5074,
    lng: -0.1278,
    city: 'London',
    country: 'UK',
    geohash: 'gcpvj0'
  },
  portfolioImages: [
    {
      url: 'https://example.com/image1.jpg',
      description: 'Traditional rose tattoo',
      style: 'traditional'
    }
  ],
  contactInfo: {
    instagram: '@johndoe_tattoo',
    website: 'https://johndoe.com',
    email: 'john@example.com'
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides
});

export const createMockArtistList = (count: number): Artist[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockArtist({
      artistId: `artist-${index + 1}`,
      artistName: `Artist ${index + 1}`
    })
  );
};
```

#### Test Database Setup
```typescript
// tests/helpers/database.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const setupTestDatabase = async () => {
  const client = new DynamoDBClient({
    endpoint: 'http://localhost:4566',
    region: 'eu-west-2',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  });

  const docClient = DynamoDBDocumentClient.from(client);

  // Create test table if it doesn't exist
  try {
    await client.send(new CreateTableCommand({
      TableName: 'tattoo-directory-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  } catch (error) {
    // Table might already exist
  }

  return docClient;
};

export const seedTestData = async () => {
  const docClient = await setupTestDatabase();
  const testArtists = createMockArtistList(50);

  for (const artist of testArtists) {
    await docClient.send(new PutCommand({
      TableName: 'tattoo-directory-test',
      Item: {
        PK: `ARTIST#${artist.artistId}`,
        SK: 'PROFILE',
        ...artist
      }
    }));
  }
};
```

## Performance Optimization

### Frontend Performance

#### Component Optimization
```typescript
// Memoize expensive components
const ArtistCard = React.memo<ArtistCardProps>(({ artist, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect?.(artist.artistId);
  }, [artist.artistId, onSelect]);

  return (
    <div onClick={handleClick}>
      {/* Component content */}
    </div>
  );
});

// Use useMemo for expensive calculations
const ArtistList: React.FC<ArtistListProps> = ({ artists, filters }) => {
  const filteredArtists = useMemo(() => {
    return artists.filter(artist => 
      filters.styles.some(style => artist.styles.includes(style))
    );
  }, [artists, filters.styles]);

  return (
    <div>
      {filteredArtists.map(artist => (
        <ArtistCard key={artist.artistId} artist={artist} />
      ))}
    </div>
  );
};
```

#### Image Optimization
```typescript
// Use Next.js Image component with optimization
import Image from 'next/image';

const ArtistPortfolio: React.FC<{ images: PortfolioImage[] }> = ({ images }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.url}
          alt={image.description}
          width={400}
          height={300}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </div>
  );
};
```

#### Data Fetching Optimization
```typescript
// Use React Query for efficient data fetching
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

export const useArtists = (filters: ArtistSearchFilters) => {
  return useQuery({
    queryKey: ['artists', filters],
    queryFn: () => searchArtists(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true
  });
};

export const useInfiniteArtists = (filters: ArtistSearchFilters) => {
  return useInfiniteQuery({
    queryKey: ['artists', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => 
      searchArtists(filters, { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 5 * 60 * 1000
  });
};
```

### Backend Performance

#### Database Query Optimization
```typescript
// Efficient DynamoDB queries
export class ArtistRepository {
  async getArtistsByStyle(style: string, limit = 20): Promise<Artist[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'style-geohash-index',
      KeyConditionExpression: 'gsi1pk = :style',
      ExpressionAttributeValues: {
        ':style': `STYLE#${style}`
      },
      Limit: limit,
      ScanIndexForward: false // Get most recent first
    };

    const result = await this.docClient.query(params).promise();
    return result.Items as Artist[];
  }

  async getArtistsByLocation(
    geohash: string, 
    radius: number,
    limit = 20
  ): Promise<Artist[]> {
    // Use geohash prefix for efficient location queries
    const geohashPrefix = geohash.substring(0, Math.min(geohash.length, 6));
    
    const params = {
      TableName: this.tableName,
      IndexName: 'location-index',
      KeyConditionExpression: 'begins_with(geohash, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': geohashPrefix
      },
      Limit: limit * 2 // Get more results to filter by exact radius
    };

    const result = await this.docClient.query(params).promise();
    
    // Filter by exact radius calculation
    return result.Items
      .filter(item => this.calculateDistance(item.location, { geohash }) <= radius)
      .slice(0, limit) as Artist[];
  }
}
```

#### Caching Strategy
```typescript
// Implement multi-level caching
export class CacheService {
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expiry > Date.now()) {
      return memoryResult.data;
    }

    // Check Redis cache (if available)
    if (this.redisClient) {
      const redisResult = await this.redisClient.get(key);
      if (redisResult) {
        const data = JSON.parse(redisResult);
        // Update memory cache
        this.memoryCache.set(key, {
          data,
          expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
        return data;
      }
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl = 300): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000
    });

    // Set in Redis cache (if available)
    if (this.redisClient) {
      await this.redisClient.setex(key, ttl, JSON.stringify(data));
    }
  }
}
```

### Database Performance

#### Index Strategy
```typescript
// Optimize DynamoDB table design
export const TableSchema = {
  TableName: 'tattoo-directory',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'gsi1pk', AttributeType: 'S' },
    { AttributeName: 'gsi1sk', AttributeType: 'S' },
    { AttributeName: 'gsi2pk', AttributeType: 'S' },
    { AttributeName: 'gsi2sk', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'style-geohash-index',
      KeySchema: [
        { AttributeName: 'gsi1pk', KeyType: 'HASH' }, // STYLE#{style}
        { AttributeName: 'gsi1sk', KeyType: 'RANGE' }  // GEOHASH#{geohash}
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'artist-name-index',
      KeySchema: [
        { AttributeName: 'gsi2pk', KeyType: 'HASH' }, // ARTIST_NAME#{firstLetter}
        { AttributeName: 'gsi2sk', KeyType: 'RANGE' }  // {artistName}#{artistId}
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ]
};
```

#### OpenSearch Optimization
```typescript
// Optimize search index settings
export const SearchIndexSettings = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0, // No replicas for local development
    refresh_interval: '5s',
    analysis: {
      analyzer: {
        artist_name_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'stop']
        }
      }
    }
  },
  mappings: {
    properties: {
      artistId: { type: 'keyword' },
      artistName: {
        type: 'text',
        analyzer: 'artist_name_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple'
          }
        }
      },
      styles: { type: 'keyword' },
      location: { type: 'geo_point' },
      geohash: { type: 'keyword' },
      portfolioImages: {
        type: 'nested',
        properties: {
          url: { type: 'keyword', index: false },
          description: { type: 'text' },
          style: { type: 'keyword' }
        }
      }
    }
  }
};
```

## Security Practices

### Local Development Security

#### Environment Isolation
```typescript
// Ensure local environment isolation
export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasLocalStackEndpoint = process.env.AWS_ENDPOINT_URL?.includes('localhost');
  
  if (isProduction && hasLocalStackEndpoint) {
    throw new Error('LocalStack endpoint detected in production environment');
  }

  if (isProduction && process.env.AWS_ACCESS_KEY_ID === 'test') {
    throw new Error('Test AWS credentials detected in production environment');
  }
};

// Call validation on startup
validateEnvironment();
```

#### Input Validation
```typescript
// Use Zod for comprehensive input validation
import { z } from 'zod';

export const ArtistSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  styles: z.array(z.enum(['traditional', 'neo-traditional', 'realism', 'blackwork'])).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  radius: z.number().min(1).max(500).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

export const validateArtistSearch = (input: unknown) => {
  try {
    return ArtistSearchSchema.parse(input);
  } catch (error) {
    throw new ValidationError('Invalid search parameters', error);
  }
};
```

#### API Security Headers
```typescript
// Implement security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' http://localhost:*"
  );

  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};
```

### Data Protection

#### Sensitive Data Handling
```typescript
// Sanitize data before logging
export const sanitizeForLogging = (data: any): any => {
  const sensitiveFields = ['email', 'phone', 'password', 'token'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

// Use in logging
logger.info('Artist created', sanitizeForLogging(artistData));
```

#### Error Handling Security
```typescript
// Secure error responses
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse() {
    // Don't expose internal details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      error: {
        code: this.code || 'INTERNAL_ERROR',
        message: this.message,
        ...(isProduction ? {} : { details: this.details })
      }
    };
  }
}
```

## Documentation Standards

### Code Documentation

#### API Documentation
```typescript
/**
 * @swagger
 * /v1/artists:
 *   get:
 *     summary: Search for tattoo artists
 *     description: Search and filter tattoo artists based on various criteria
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for artist names
 *       - in: query
 *         name: styles
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tattoo styles
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Artist'
 */
export const searchArtists = async (req: Request, res: Response) => {
  // Implementation
};
```

#### README Standards
```markdown
# Component Name

Brief description of what this component does.

## Usage

```typescript
import { ComponentName } from './component-name';

const Example = () => {
  return (
    <ComponentName
      prop1="value1"
      prop2={value2}
      onAction={handleAction}
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | number | 0 | Description of prop2 |
| onAction | function | - | Callback when action occurs |

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]

## Testing

```bash
npm run test -- component-name
```

## Notes

- Important implementation details
- Known limitations
- Future improvements
```

### Change Documentation

#### Commit Message Standards
```bash
# Format: type(scope): description

# Types:
feat(search): add advanced filtering options
fix(api): resolve artist profile loading issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(db): optimize artist query performance
test(api): add integration tests for search endpoint
chore(deps): update dependencies to latest versions

# Breaking changes:
feat(api)!: change artist response format

BREAKING CHANGE: Artist response now includes nested location object
```

#### Pull Request Templates
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Additional Notes
[Any additional information]
```

## Collaboration Guidelines

### Code Review Process

#### Review Checklist
```markdown
## Code Review Checklist

### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

### Code Quality
- [ ] Code is readable and well-structured
- [ ] Naming conventions followed
- [ ] No code duplication
- [ ] Comments explain complex logic

### Testing
- [ ] Adequate test coverage
- [ ] Tests are meaningful and comprehensive
- [ ] All tests pass
- [ ] No test-only changes without corresponding code changes

### Security
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] No security vulnerabilities introduced

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API changes documented
- [ ] README updated if necessary
```

#### Review Guidelines
```typescript
// Good: Clear, specific feedback
// "Consider using useMemo here to prevent unnecessary recalculations 
// when the component re-renders. The current implementation recalculates 
// filteredArtists on every render."

// Bad: Vague feedback
// "This could be optimized"

// Good: Suggest specific improvements
// "Instead of filtering in the component, consider moving this logic 
// to a custom hook like useFilteredArtists(artists, filters)"

// Bad: Just pointing out problems
// "This is inefficient"
```

### Team Communication

#### Development Updates
```markdown
## Daily Standup Format

### Yesterday
- Completed artist search filtering implementation
- Fixed bug in location-based queries
- Added unit tests for search service

### Today
- Implement artist profile page
- Add integration tests for new API endpoints
- Review PR #123 for search optimization

### Blockers
- Waiting for design approval on profile layout
- Need clarification on search result sorting requirements
```

#### Technical Discussions
```markdown
## Technical Decision Template

### Context
What is the problem we're trying to solve?

### Options Considered
1. Option A: [Description, pros, cons]
2. Option B: [Description, pros, cons]
3. Option C: [Description, pros, cons]

### Decision
Which option was chosen and why?

### Consequences
What are the implications of this decision?

### Action Items
- [ ] Update documentation
- [ ] Implement changes
- [ ] Communicate to team
```

## Troubleshooting Methodology

### Systematic Debugging Approach

#### Problem Identification
```typescript
// Debugging checklist
export const debuggingChecklist = {
  environment: [
    'Is Docker running?',
    'Are all services healthy?',
    'Are ports available?',
    'Are environment variables set correctly?'
  ],
  
  application: [
    'What is the exact error message?',
    'When did the issue start occurring?',
    'Can the issue be reproduced consistently?',
    'What was the last working state?'
  ],
  
  data: [
    'Is the database accessible?',
    'Is test data seeded correctly?',
    'Are queries returning expected results?',
    'Are indexes working properly?'
  ],
  
  network: [
    'Are API endpoints responding?',
    'Are there any CORS issues?',
    'Is the frontend connecting to the backend?',
    'Are external services accessible?'
  ]
};
```

#### Diagnostic Tools
```bash
#!/bin/bash
# scripts/diagnose-environment.sh

echo "🔍 Running environment diagnostics..."

# Check Docker
echo "Docker Status:"
docker info > /dev/null 2>&1 && echo "✅ Docker is running" || echo "❌ Docker is not running"

# Check services
echo -e "\nService Health:"
services=("localstack:4566" "backend:9000" "frontend:3000" "swagger:8080")
for service in "${services[@]}"; do
  name=${service%:*}
  port=${service#*:}
  nc -z localhost $port && echo "✅ $name is running" || echo "❌ $name is not responding"
done

# Check disk space
echo -e "\nDisk Space:"
df -h | grep -E "(Filesystem|/dev/)"

# Check memory usage
echo -e "\nMemory Usage:"
free -h 2>/dev/null || vm_stat | head -5

# Check Docker resources
echo -e "\nDocker Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo -e "\n✅ Diagnostics complete"
```

#### Log Analysis
```typescript
// Log analysis utilities
export class LogAnalyzer {
  static analyzeErrorPatterns(logs: string[]): ErrorPattern[] {
    const patterns = [
      { pattern: /ECONNREFUSED.*:(\d+)/, type: 'connection_refused', severity: 'high' },
      { pattern: /Cannot find module/, type: 'missing_dependency', severity: 'high' },
      { pattern: /Port \d+ is already in use/, type: 'port_conflict', severity: 'medium' },
      { pattern: /Out of memory/, type: 'memory_issue', severity: 'high' },
      { pattern: /ENOENT.*no such file/, type: 'file_not_found', severity: 'medium' }
    ];

    const foundPatterns: ErrorPattern[] = [];

    for (const log of logs) {
      for (const { pattern, type, severity } of patterns) {
        const match = log.match(pattern);
        if (match) {
          foundPatterns.push({
            type,
            severity,
            message: log,
            match: match[0],
            suggestions: this.getSuggestions(type)
          });
        }
      }
    }

    return foundPatterns;
  }

  static getSuggestions(errorType: string): string[] {
    const suggestions = {
      connection_refused: [
        'Check if the service is running',
        'Verify the port number is correct',
        'Check firewall settings'
      ],
      missing_dependency: [
        'Run npm install',
        'Check package.json for missing dependencies',
        'Clear node_modules and reinstall'
      ],
      port_conflict: [
        'Stop the process using the port',
        'Use a different port',
        'Check for zombie processes'
      ],
      memory_issue: [
        'Increase Docker memory allocation',
        'Close unnecessary applications',
        'Check for memory leaks'
      ],
      file_not_found: [
        'Check if the file path is correct',
        'Verify file permissions',
        'Check if the file was moved or deleted'
      ]
    };

    return suggestions[errorType] || ['Check the error message for more details'];
  }
}
```

## Deployment Preparation

### Pre-Deployment Validation

#### Production Readiness Checklist
```bash
#!/bin/bash
# scripts/pre-deployment-check.sh

echo "🚀 Running pre-deployment validation..."

# Run all tests
echo "Running tests..."
npm run test:all || exit 1

# Check code quality
echo "Checking code quality..."
npm run lint || exit 1
npm run type-check || exit 1

# Run security audit
echo "Running security audit..."
npm audit --audit-level moderate || exit 1

# Run production parity validation
echo "Running production parity validation..."
node scripts/comprehensive-parity-validator.js validate || exit 1

# Run final integration test
echo "Running final integration test..."
node scripts/final-integration-tester.js || exit 1

# Check environment configuration
echo "Validating environment configuration..."
node scripts/validate-config.js || exit 1

echo "✅ Pre-deployment validation complete"
```

#### Configuration Validation
```typescript
// scripts/validate-config.js
export const validateProductionConfig = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'AWS_REGION',
    'DYNAMODB_TABLE_NAME',
    'OPENSEARCH_ENDPOINT',
    'S3_BUCKET_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate configuration values
  const validations = [
    {
      check: () => process.env.NODE_ENV === 'production',
      message: 'NODE_ENV must be set to production'
    },
    {
      check: () => !process.env.AWS_ENDPOINT_URL?.includes('localhost'),
      message: 'LocalStack endpoint detected in production configuration'
    },
    {
      check: () => process.env.AWS_ACCESS_KEY_ID !== 'test',
      message: 'Test AWS credentials detected in production configuration'
    }
  ];

  for (const validation of validations) {
    if (!validation.check()) {
      throw new Error(validation.message);
    }
  }

  console.log('✅ Production configuration validated');
};
```

## Monitoring and Maintenance

### Performance Monitoring

#### Metrics Collection
```typescript
// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetricSummary(name: string): MetricSummary | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  // Middleware for API response time monitoring
  responseTimeMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.recordMetric(`api.${req.method}.${req.route?.path || 'unknown'}`, responseTime);
      });
      
      next();
    };
  }
}
```

#### Health Monitoring
```typescript
// Health monitoring system
export class HealthMonitor {
  private checks: HealthCheck[] = [];
  private lastResults: Map<string, HealthCheckResult> = new Map();

  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  async runAllChecks(): Promise<HealthStatus> {
    const results = await Promise.allSettled(
      this.checks.map(async check => {
        const startTime = Date.now();
        try {
          await check.execute();
          const result: HealthCheckResult = {
            name: check.name,
            status: 'healthy',
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          };
          this.lastResults.set(check.name, result);
          return result;
        } catch (error) {
          const result: HealthCheckResult = {
            name: check.name,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error.message,
            timestamp: new Date().toISOString()
          };
          this.lastResults.set(check.name, result);
          return result;
        }
      })
    );

    const healthResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    const overallStatus = healthResults.every(result => result.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    return {
      status: overallStatus,
      checks: healthResults,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Maintenance Tasks

#### Regular Maintenance Script
```bash
#!/bin/bash
# scripts/maintenance.sh

echo "🔧 Running maintenance tasks..."

# Clean up Docker resources
echo "Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

# Update dependencies
echo "Checking for dependency updates..."
npm outdated

# Run security audit
echo "Running security audit..."
npm audit

# Clean up log files
echo "Cleaning up old log files..."
find .logs -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Validate environment
echo "Validating environment..."
node scripts/final-integration-tester.js

echo "✅ Maintenance tasks complete"
```

#### Automated Health Checks
```typescript
// Automated health check scheduler
export class HealthCheckScheduler {
  private monitor: HealthMonitor;
  private interval: NodeJS.Timeout | null = null;

  constructor(monitor: HealthMonitor) {
    this.monitor = monitor;
  }

  start(intervalMs = 60000): void {
    this.interval = setInterval(async () => {
      try {
        const status = await this.monitor.runAllChecks();
        
        if (status.status === 'unhealthy') {
          console.warn('Health check failed:', status);
          // Send alerts, notifications, etc.
        }
        
        // Log health status
        console.log(`Health check: ${status.status} (${status.checks.length} checks)`);
        
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

This comprehensive best practices guide ensures consistent, high-quality development practices across the entire team and provides a solid foundation for maintaining and scaling the Tattoo Artist Directory application.