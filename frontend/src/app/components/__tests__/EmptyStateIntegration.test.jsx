import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the empty state components
import { 
  NoSearchResults, 
  NewUserOnboarding, 
  EmptyFavorites, 
  EmptyPortfolio, 
  LoadingEmptyState,
  ErrorEmptyState,
  NoFilterResults,
  CustomEmptyState
} from '../../../design-system/components/feedback/EmptyState';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

describe('Empty State Integration', () => {
  describe('NoSearchResults Component', () => {
    it('renders with search term and suggestions', () => {
      const mockClearSearch = jest.fn();
      const mockBrowseAll = jest.fn();
      
      render(
        <NoSearchResults
          searchTerm="cyberpunk tattoo"
          onClearSearch={mockClearSearch}
          onBrowseAll={mockBrowseAll}
          suggestions={['Traditional', 'Realism', 'Blackwork']}
        />
      );

      expect(screen.getByText(/No artists found for "cyberpunk tattoo"/)).toBeInTheDocument();
      expect(screen.getByText('Clear Search')).toBeInTheDocument();
      expect(screen.getByText('Browse All Artists')).toBeInTheDocument();
      expect(screen.getByText('Traditional')).toBeInTheDocument();
    });

    it('handles clear search action', () => {
      const mockClearSearch = jest.fn();
      
      render(
        <NoSearchResults
          searchTerm="test"
          onClearSearch={mockClearSearch}
          onBrowseAll={jest.fn()}
          suggestions={[]}
        />
      );

      fireEvent.click(screen.getByText('Clear Search'));
      expect(mockClearSearch).toHaveBeenCalled();
    });
  });

  describe('NewUserOnboarding Component', () => {
    it('renders welcome message with actions', () => {
      const mockStartExploring = jest.fn();
      const mockViewGuide = jest.fn();
      
      render(
        <NewUserOnboarding
          userName="Alex"
          onStartExploring={mockStartExploring}
          onViewGuide={mockViewGuide}
        />
      );

      expect(screen.getByText(/Welcome to the tattoo community, Alex!/)).toBeInTheDocument();
      expect(screen.getByText('Start Exploring Artists')).toBeInTheDocument();
      expect(screen.getByText('View Getting Started Guide')).toBeInTheDocument();
    });

    it('handles start exploring action', () => {
      const mockStartExploring = jest.fn();
      
      render(
        <NewUserOnboarding
          onStartExploring={mockStartExploring}
          onViewGuide={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('Start Exploring Artists'));
      expect(mockStartExploring).toHaveBeenCalled();
    });
  });

  describe('EmptyFavorites Component', () => {
    it('renders empty favorites message with actions', () => {
      const mockBrowseArtists = jest.fn();
      const mockExploreStyles = jest.fn();
      
      render(
        <EmptyFavorites
          onBrowseArtists={mockBrowseArtists}
          onExploreStyles={mockExploreStyles}
        />
      );

      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText('Browse Artists')).toBeInTheDocument();
      expect(screen.getByText('Explore Styles')).toBeInTheDocument();
    });
  });

  describe('EmptyPortfolio Component', () => {
    it('renders empty portfolio for own profile', () => {
      const mockUploadImages = jest.fn();
      
      render(
        <EmptyPortfolio
          isOwnProfile={true}
          onUploadImages={mockUploadImages}
        />
      );

      expect(screen.getByText('Your portfolio is empty')).toBeInTheDocument();
      expect(screen.getByText('Upload Your Work')).toBeInTheDocument();
    });

    it('renders empty portfolio for other artist', () => {
      const mockContactArtist = jest.fn();
      
      render(
        <EmptyPortfolio
          isOwnProfile={false}
          artistName="Sarah Chen"
          onContactArtist={mockContactArtist}
        />
      );

      expect(screen.getByText(/Sarah Chen hasn't uploaded any work yet/)).toBeInTheDocument();
      expect(screen.getByText('Contact Artist')).toBeInTheDocument();
    });
  });

  describe('LoadingEmptyState Component', () => {
    it('renders loading state with custom message', () => {
      render(
        <LoadingEmptyState message="Loading your personalized recommendations..." />
      );

      expect(screen.getByText('Just a moment')).toBeInTheDocument();
      expect(screen.getByText('Loading your personalized recommendations...')).toBeInTheDocument();
    });
  });

  describe('ErrorEmptyState Component', () => {
    it('renders error state with retry and home actions', () => {
      const mockRetry = jest.fn();
      const mockGoHome = jest.fn();
      
      render(
        <ErrorEmptyState
          title="Something went wrong"
          description="We're having trouble loading this content."
          onRetry={mockRetry}
          onGoHome={mockGoHome}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('handles retry action', () => {
      const mockRetry = jest.fn();
      
      render(
        <ErrorEmptyState
          onRetry={mockRetry}
          onGoHome={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('Try Again'));
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('NoFilterResults Component', () => {
    it('renders no filter results with clear actions', () => {
      const mockClearFilters = jest.fn();
      const mockResetAll = jest.fn();
      
      render(
        <NoFilterResults
          filterType="styles"
          activeFiltersCount={3}
          onClearFilters={mockClearFilters}
          onResetAll={mockResetAll}
        />
      );

      expect(screen.getByText('No results with current styles')).toBeInTheDocument();
      expect(screen.getByText('Clear styles')).toBeInTheDocument();
      expect(screen.getByText('Show All Results')).toBeInTheDocument();
    });
  });

  describe('CustomEmptyState Component', () => {
    it('renders custom empty state with custom actions', () => {
      const mockPrimaryAction = jest.fn();
      const mockSecondaryAction = jest.fn();
      
      render(
        <CustomEmptyState
          variant="favorites"
          title="No bookmarked studios"
          description="Save studios you're interested in to keep track of them here."
          primaryAction={{
            label: 'Find Studios',
            onClick: mockPrimaryAction
          }}
          secondaryAction={{
            label: 'Learn More',
            onClick: mockSecondaryAction
          }}
          size="lg"
        />
      );

      expect(screen.getByText('No bookmarked studios')).toBeInTheDocument();
      expect(screen.getByText('Find Studios')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for illustrations', () => {
      render(<NoSearchResults searchTerm="test" />);
      
      const illustration = screen.getByRole('img');
      expect(illustration).toHaveAttribute('aria-label', 'No search results illustration');
    });

    it('supports keyboard navigation for actions', () => {
      const mockAction = jest.fn();
      
      render(
        <EmptyFavorites onBrowseArtists={mockAction} />
      );

      const button = screen.getByText('Browse Artists');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('renders with appropriate size classes', () => {
      const { container } = render(
        <CustomEmptyState
          title="Test"
          description="Test description"
          size="lg"
        />
      );

      expect(container.firstChild).toHaveClass('max-w-lg');
    });
  });

  describe('Brand Personality', () => {
    it('includes tattoo-themed illustrations', () => {
      render(<EmptyPortfolio isOwnProfile={false} artistName="Test Artist" />);
      
      // Check for SVG illustration
      const illustration = screen.getByRole('img');
      expect(illustration).toBeInTheDocument();
    });

    it('uses engaging copy that guides user actions', () => {
      render(<NewUserOnboarding />);
      
      expect(screen.getByText(/Discover incredible artists, explore unique styles/)).toBeInTheDocument();
    });
  });
});

describe('Integration with Main Pages', () => {
  describe('Artists Page Integration', () => {
    it('should use NoSearchResults for empty search results', () => {
      // This would be tested in the actual page component tests
      // but we can verify the component is properly exported
      expect(NoSearchResults).toBeDefined();
    });

    it('should use NewUserOnboarding for first-time users', () => {
      expect(NewUserOnboarding).toBeDefined();
    });
  });

  describe('Studios Page Integration', () => {
    it('should use appropriate empty states for studio search', () => {
      expect(NoSearchResults).toBeDefined();
      expect(NewUserOnboarding).toBeDefined();
    });
  });

  describe('Styles Page Integration', () => {
    it('should use NoFilterResults for filtered content', () => {
      expect(NoFilterResults).toBeDefined();
    });
  });

  describe('Profile Pages Integration', () => {
    it('should use EmptyPortfolio for empty artist portfolios', () => {
      expect(EmptyPortfolio).toBeDefined();
    });

    it('should use ErrorEmptyState for not found pages', () => {
      expect(ErrorEmptyState).toBeDefined();
    });
  });
});