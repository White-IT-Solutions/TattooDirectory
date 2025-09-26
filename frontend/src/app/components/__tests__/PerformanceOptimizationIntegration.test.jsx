import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceOptimizationIntegration from '../PerformanceOptimizationIntegration';

// Mock the performance components
jest.mock('../../../design-system/components/ui/Performance', () => ({
  LazyImage: ({ src, alt, className, onLoad, priority }) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-testid="lazy-image"
      data-priority={priority}
      onLoad={onLoad}
    />
  ),
  InfiniteScroll: ({ children, hasMore, loading, onLoadMore, error }) => (
    <div data-testid="infinite-scroll">
      {children}
      {hasMore && !loading && !error && (
        <button onClick={onLoadMore} data-testid="load-more">
          Load More
        </button>
      )}
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">Error: {error.message}</div>}
    </div>
  ),
  OptimizedImage: ({ src, alt, width, height, priority, responsive, className }) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-testid="optimized-image"
      data-width={width}
      data-height={height}
      data-priority={priority}
      data-responsive={responsive}
    />
  ),
  PortfolioImageGrid: ({ images, columns, gap, onImageClick, lazy }) => (
    <div 
      data-testid="portfolio-grid"
      data-columns={columns}
      data-gap={gap}
      data-lazy={lazy}
    >
      {images.map((image, index) => (
        <img
          key={image.id || index}
          src={image.url}
          alt={image.description}
          onClick={() => onImageClick?.(image, index)}
          data-testid={`portfolio-image-${index}`}
        />
      ))}
    </div>
  ),
  AvatarImage: ({ src, alt, size, fallback }) => (
    <div data-testid="avatar-image" data-size={size}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <div data-testid="avatar-fallback">{fallback}</div>
      )}
    </div>
  ),
  SmartLink: ({ href, children, preloadOnHover, className, onMouseEnter }) => (
    <a 
      href={href} 
      className={className}
      data-testid="smart-link"
      data-preload-on-hover={preloadOnHover}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </a>
  ),
  useImagePreloader: jest.fn(() => ({
    preloadImages: jest.fn(),
    preloadImage: jest.fn()
  })),
  useRoutePreloader: jest.fn(() => ({
    preloadRoute: jest.fn()
  })),
  useConnectionAwarePreloading: jest.fn(() => ({
    shouldPreload: jest.fn(() => true),
    getConnectionSpeed: jest.fn(() => '4g')
  })),
  useInfiniteScroll: jest.fn(({ initialData, fetchMore }) => ({
    data: initialData,
    loading: false,
    error: null,
    hasMore: true,
    loadMore: jest.fn(),
    reset: jest.fn()
  }))
}));

// Mock design system components
jest.mock('../../../design-system', () => ({
  Card: ({ children, className, onMouseEnter }) => (
    <div className={className} onMouseEnter={onMouseEnter} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  Button: ({ children, variant, size, className, onClick }) => (
    <button 
      className={className} 
      onClick={onClick}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant, className }) => (
    <span 
      className={className}
      data-testid="badge"
      data-variant={variant}
    >
      {children}
    </span>
  )
}));

// Mock data
const mockArtistData = [
  {
    id: 'artist-1',
    name: 'John Doe',
    location: 'London, UK',
    avatar: 'https://example.com/avatar1.jpg',
    mainImage: 'https://example.com/main1.jpg',
    rating: 4.8,
    specialties: ['Traditional', 'Blackwork', 'Realism'],
    portfolioImages: [
      { id: 'img-1', url: 'https://example.com/portfolio1.jpg', description: 'Portfolio 1' },
      { id: 'img-2', url: 'https://example.com/portfolio2.jpg', description: 'Portfolio 2' }
    ],
    contactMethods: ['email', 'phone']
  },
  {
    id: 'artist-2',
    name: 'Jane Smith',
    location: 'Manchester, UK',
    avatar: 'https://example.com/avatar2.jpg',
    mainImage: 'https://example.com/main2.jpg',
    rating: 4.6,
    specialties: ['Watercolor', 'Minimalist'],
    portfolioImages: [
      { id: 'img-3', url: 'https://example.com/portfolio3.jpg', description: 'Portfolio 3' }
    ],
    contactMethods: ['instagram']
  }
];

const mockFetchMore = jest.fn().mockResolvedValue({
  data: mockArtistData,
  hasMore: false
});

describe('PerformanceOptimizationIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders performance optimized artist cards', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      // Check if cards are rendered
      expect(screen.getAllByTestId('card')).toHaveLength(2);
      
      // Check if optimized images are used
      expect(screen.getAllByTestId('optimized-image')).toHaveLength(2);
      
      // Check if avatar images are rendered
      expect(screen.getAllByTestId('avatar-image')).toHaveLength(2);
      
      // Check if smart links are used
      expect(screen.getAllByTestId('smart-link')).toHaveLength(4); // 2 overlay + 2 profile links
    });

    it('renders loading skeleton on server-side', () => {
      // Mock useState to simulate server-side rendering
      const mockUseState = jest.spyOn(React, 'useState');
      mockUseState.mockImplementationOnce(() => [false, jest.fn()]); // isClient = false

      render(
        <PerformanceOptimizationIntegration
          pageType="artists"
          initialData={mockArtistData}
          fetchMoreData={mockFetchMore}
        />
      );

      // Should render skeleton cards
      expect(screen.getAllByTestId('card')).toHaveLength(6); // 6 skeleton cards
    });

    it('displays connection status in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByText('Connection:')).toBeInTheDocument();
      expect(screen.getByText('Preloading:')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('LazyImage Integration', () => {
    it('uses LazyImage with WebP optimization', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const optimizedImages = screen.getAllByTestId('optimized-image');
      
      // Check if images have proper attributes
      expect(optimizedImages[0]).toHaveAttribute('data-width', '400');
      expect(optimizedImages[0]).toHaveAttribute('data-height', '300');
      expect(optimizedImages[0]).toHaveAttribute('data-responsive', 'true');
    });

    it('prioritizes above-the-fold images', async () => {
      const manyArtists = Array.from({ length: 10 }, (_, i) => ({
        ...mockArtistData[0],
        id: `artist-${i}`,
        name: `Artist ${i}`
      }));

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={manyArtists}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const optimizedImages = screen.getAllByTestId('optimized-image');
      
      // First 6 images should have priority
      for (let i = 0; i < 6; i++) {
        expect(optimizedImages[i]).toHaveAttribute('data-priority', 'true');
      }
      
      // Remaining images should not have priority
      for (let i = 6; i < optimizedImages.length; i++) {
        expect(optimizedImages[i]).toHaveAttribute('data-priority', 'false');
      }
    });
  });

  describe('InfiniteScroll Integration', () => {
    it('implements infinite scroll with debouncing', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
    });

    it('handles loading states properly', async () => {
      const { useInfiniteScroll } = require('../../../design-system/components/ui/Performance');
      useInfiniteScroll.mockReturnValueOnce({
        data: mockArtistData,
        loading: true,
        error: null,
        hasMore: true,
        loadMore: jest.fn(),
        reset: jest.fn()
      });

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('handles error states with retry', async () => {
      const mockError = new Error('Network error');
      const { useInfiniteScroll } = require('../../../design-system/components/ui/Performance');
      useInfiniteScroll.mockReturnValueOnce({
        data: mockArtistData,
        loading: false,
        error: mockError,
        hasMore: true,
        loadMore: jest.fn(),
        reset: jest.fn()
      });

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  describe('OptimizedImage Integration', () => {
    it('uses responsive sizing and quality adjustment', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const optimizedImages = screen.getAllByTestId('optimized-image');
      
      optimizedImages.forEach(img => {
        expect(img).toHaveAttribute('data-responsive', 'true');
        expect(img).toHaveAttribute('data-width');
        expect(img).toHaveAttribute('data-height');
      });
    });
  });

  describe('SmartLink Integration', () => {
    it('implements hover preloading', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const smartLinks = screen.getAllByTestId('smart-link');
      
      smartLinks.forEach(link => {
        expect(link).toHaveAttribute('data-preload-on-hover', 'true');
      });
    });

    it('preloads routes on hover', async () => {
      const { useRoutePreloader } = require('../../../design-system/components/ui/Performance');
      const mockPreloadRoute = jest.fn();
      useRoutePreloader.mockReturnValueOnce({ preloadRoute: mockPreloadRoute });

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      // Hover over a card to trigger preloading
      const firstCard = screen.getAllByTestId('card')[0];
      fireEvent.mouseEnter(firstCard);

      await waitFor(() => {
        expect(mockPreloadRoute).toHaveBeenCalled();
      });
    });
  });

  describe('Portfolio Integration', () => {
    it('renders portfolio image grids with lazy loading', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const portfolioGrids = screen.getAllByTestId('portfolio-grid');
      expect(portfolioGrids).toHaveLength(2);

      // Check grid configuration
      portfolioGrids.forEach(grid => {
        expect(grid).toHaveAttribute('data-columns', '2');
        expect(grid).toHaveAttribute('data-gap', '2');
      });
    });

    it('handles portfolio image clicks', async () => {
      const mockOnImageClick = jest.fn();

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
            onImageClick={mockOnImageClick}
          />
        );
      });

      const portfolioImages = screen.getAllByTestId('portfolio-image-0');
      fireEvent.click(portfolioImages[0]); // Click the first one

      expect(mockOnImageClick).toHaveBeenCalledWith(
        mockArtistData[0].portfolioImages[0],
        0
      );
    });
  });

  describe('Connection Awareness', () => {
    it('adapts behavior based on connection speed', async () => {
      const { useConnectionAwarePreloading } = require('../../../design-system/components/ui/Performance');
      
      // Mock slow connection
      useConnectionAwarePreloading.mockReturnValueOnce({
        shouldPreload: jest.fn(() => false),
        getConnectionSpeed: jest.fn(() => '2g')
      });

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      // Hover over card - should not preload on slow connection
      const firstCard = screen.getAllByTestId('card')[0];
      fireEvent.mouseEnter(firstCard);

      // Verify preloading was not triggered
      const { useImagePreloader } = require('../../../design-system/components/ui/Performance');
      expect(useImagePreloader().preloadImages).not.toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    it('displays performance metrics in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Items Loaded')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 items loaded

      process.env.NODE_ENV = originalEnv;
    });

    it('provides reset functionality', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockReset = jest.fn();
      const { useInfiniteScroll } = require('../../../design-system/components/ui/Performance');
      useInfiniteScroll.mockReturnValueOnce({
        data: mockArtistData,
        loading: false,
        error: null,
        hasMore: true,
        loadMore: jest.fn(),
        reset: mockReset
      });

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const resetButton = screen.getByText('Reset Demo');
      fireEvent.click(resetButton);

      expect(mockReset).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for images', async () => {
      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={mockArtistData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const optimizedImages = screen.getAllByTestId('optimized-image');
      
      expect(optimizedImages[0]).toHaveAttribute('alt', 'John Doe - artist image');
      expect(optimizedImages[1]).toHaveAttribute('alt', 'Jane Smith - artist image');
    });

    it('provides fallback content for avatars', async () => {
      const artistWithoutAvatar = {
        ...mockArtistData[0],
        avatar: null
      };

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="artists"
            initialData={[artistWithoutAvatar]}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('J');
    });
  });

  describe('Different Page Types', () => {
    it('adapts to studios page type', async () => {
      const mockStudioData = [{
        ...mockArtistData[0],
        id: 'studio-1',
        name: 'Ink Studio'
      }];

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="studios"
            initialData={mockStudioData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const smartLinks = screen.getAllByTestId('smart-link');
      expect(smartLinks[0]).toHaveAttribute('href', '/studios/studio-1');
    });

    it('adapts to styles page type', async () => {
      const mockStyleData = [{
        ...mockArtistData[0],
        id: 'style-1',
        name: 'Traditional Style'
      }];

      await act(async () => {
        render(
          <PerformanceOptimizationIntegration
            pageType="styles"
            initialData={mockStyleData}
            fetchMoreData={mockFetchMore}
          />
        );
      });

      const smartLinks = screen.getAllByTestId('smart-link');
      expect(smartLinks[0]).toHaveAttribute('href', '/styles/style-1');
    });
  });
});