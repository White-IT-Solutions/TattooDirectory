import { render, screen, fireEvent } from '@testing-library/react';
import {
  NoSearchResults,
  NewUserOnboarding,
  EmptyFavorites,
  EmptyPortfolio,
  LoadingEmptyState,
  CustomEmptyState,
  ErrorEmptyState,
  NoFilterResults
} from '../EmptyStateVariants';

describe('NoSearchResults Component', () => {
  it('renders with search term', () => {
    render(<NoSearchResults searchTerm="traditional" />);
    
    expect(screen.getByText('No artists found for "traditional"')).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument();
  });

  it('renders without search term', () => {
    render(<NoSearchResults />);
    
    expect(screen.getByText('No artists found')).toBeInTheDocument();
    expect(screen.getByText(/couldn't find any artists matching/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const handleClear = jest.fn();
    const handleBrowse = jest.fn();
    
    render(
      <NoSearchResults 
        onClearSearch={handleClear}
        onBrowseAll={handleBrowse}
      />
    );
    
    const clearButton = screen.getByText('Clear Search');
    const browseButton = screen.getByText('Browse All Artists');
    
    fireEvent.click(clearButton);
    fireEvent.click(browseButton);
    
    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(handleBrowse).toHaveBeenCalledTimes(1);
  });

  it('renders search suggestions', () => {
    const suggestions = ['Traditional', 'Realism', 'Blackwork'];
    const handleClear = jest.fn();
    
    render(
      <NoSearchResults 
        suggestions={suggestions}
        onClearSearch={handleClear}
      />
    );
    
    expect(screen.getByText('Try searching for:')).toBeInTheDocument();
    
    suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
    
    // Test clicking a suggestion
    fireEvent.click(screen.getByText('Traditional'));
    expect(handleClear).toHaveBeenCalledWith('Traditional');
  });
});

describe('NewUserOnboarding Component', () => {
  it('renders with user name', () => {
    render(<NewUserOnboarding userName="John" />);
    
    expect(screen.getByText('Welcome to the tattoo community, John!')).toBeInTheDocument();
  });

  it('renders without user name', () => {
    render(<NewUserOnboarding />);
    
    expect(screen.getByText('Welcome to your tattoo journey!')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const handleExplore = jest.fn();
    const handleGuide = jest.fn();
    
    render(
      <NewUserOnboarding 
        onStartExploring={handleExplore}
        onViewGuide={handleGuide}
      />
    );
    
    const exploreButton = screen.getByText('Start Exploring Artists');
    const guideButton = screen.getByText('View Getting Started Guide');
    
    fireEvent.click(exploreButton);
    fireEvent.click(guideButton);
    
    expect(handleExplore).toHaveBeenCalledTimes(1);
    expect(handleGuide).toHaveBeenCalledTimes(1);
  });

  it('uses onboarding illustration variant', () => {
    render(<NewUserOnboarding />);
    expect(screen.getByRole('img', { name: /welcome onboarding/i })).toBeInTheDocument();
  });
});

describe('EmptyFavorites Component', () => {
  it('renders correct content', () => {
    render(<EmptyFavorites />);
    
    expect(screen.getByRole('heading', { name: 'No favorites yet' })).toBeInTheDocument();
    expect(screen.getByText(/start building your collection/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const handleBrowse = jest.fn();
    const handleExplore = jest.fn();
    
    render(
      <EmptyFavorites 
        onBrowseArtists={handleBrowse}
        onExploreStyles={handleExplore}
      />
    );
    
    const browseButton = screen.getByText('Browse Artists');
    const exploreButton = screen.getByText('Explore Styles');
    
    fireEvent.click(browseButton);
    fireEvent.click(exploreButton);
    
    expect(handleBrowse).toHaveBeenCalledTimes(1);
    expect(handleExplore).toHaveBeenCalledTimes(1);
  });

  it('uses favorites illustration variant', () => {
    render(<EmptyFavorites />);
    expect(screen.getByRole('img', { name: /no favorites/i })).toBeInTheDocument();
  });
});

describe('EmptyPortfolio Component', () => {
  it('renders for own profile', () => {
    const handleUpload = jest.fn();
    
    render(
      <EmptyPortfolio 
        isOwnProfile={true}
        onUploadImages={handleUpload}
      />
    );
    
    expect(screen.getByText('Your portfolio is empty')).toBeInTheDocument();
    expect(screen.getByText(/upload your best tattoo work/i)).toBeInTheDocument();
    
    const uploadButton = screen.getByText('Upload Your Work');
    fireEvent.click(uploadButton);
    expect(handleUpload).toHaveBeenCalledTimes(1);
  });

  it('renders for other artist profile', () => {
    const handleContact = jest.fn();
    
    render(
      <EmptyPortfolio 
        isOwnProfile={false}
        artistName="Jane Doe"
        onContactArtist={handleContact}
      />
    );
    
    expect(screen.getByText("Jane Doe hasn't uploaded any work yet")).toBeInTheDocument();
    expect(screen.getByText(/check back soon to see/i)).toBeInTheDocument();
    
    const contactButton = screen.getByText('Contact Artist');
    fireEvent.click(contactButton);
    expect(handleContact).toHaveBeenCalledTimes(1);
  });

  it('renders without artist name', () => {
    render(<EmptyPortfolio isOwnProfile={false} />);
    
    expect(screen.getByText("This artist hasn't uploaded any work yet")).toBeInTheDocument();
  });

  it('uses portfolio illustration variant', () => {
    render(<EmptyPortfolio />);
    expect(screen.getByRole('img', { name: /empty portfolio/i })).toBeInTheDocument();
  });
});

describe('LoadingEmptyState Component', () => {
  it('renders with default message', () => {
    render(<LoadingEmptyState />);
    
    expect(screen.getByRole('heading', { name: 'Just a moment' })).toBeInTheDocument();
    // Use getAllByText to handle duplicate text in SVG and main content
    const loadingTexts = screen.getAllByText('Loading amazing content...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it('renders with custom message', () => {
    render(<LoadingEmptyState message="Loading your favorites..." />);
    
    expect(screen.getByText('Loading your favorites...')).toBeInTheDocument();
  });

  it('uses loading illustration variant', () => {
    render(<LoadingEmptyState />);
    expect(screen.getByRole('img', { name: /loading content/i })).toBeInTheDocument();
  });
});

describe('CustomEmptyState Component', () => {
  it('renders with custom content', () => {
    const handlePrimary = jest.fn();
    const handleSecondary = jest.fn();
    
    render(
      <CustomEmptyState 
        title="Custom Title"
        description="Custom description"
        primaryAction={{
          label: 'Primary Action',
          onClick: handlePrimary
        }}
        secondaryAction={{
          label: 'Secondary Action',
          onClick: handleSecondary
        }}
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
    
    const primaryButton = screen.getByText('Primary Action');
    const secondaryButton = screen.getByText('Secondary Action');
    
    fireEvent.click(primaryButton);
    fireEvent.click(secondaryButton);
    
    expect(handlePrimary).toHaveBeenCalledTimes(1);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders with custom illustration', () => {
    const CustomIllustration = () => <div data-testid="custom-illustration">Custom</div>;
    
    render(
      <CustomEmptyState 
        illustration={<CustomIllustration />}
      />
    );
    
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('applies custom size and variant', () => {
    render(
      <CustomEmptyState 
        variant="favorites"
        size="lg"
        data-testid="custom-empty"
      />
    );
    
    expect(screen.getByRole('img', { name: /no favorites/i })).toBeInTheDocument();
  });
});

describe('ErrorEmptyState Component', () => {
  it('renders with default error content', () => {
    render(<ErrorEmptyState />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/having trouble loading/i)).toBeInTheDocument();
  });

  it('renders with custom error content', () => {
    render(
      <ErrorEmptyState 
        title="Custom Error"
        description="Custom error description"
      />
    );
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom error description')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const handleRetry = jest.fn();
    const handleHome = jest.fn();
    
    render(
      <ErrorEmptyState 
        onRetry={handleRetry}
        onGoHome={handleHome}
      />
    );
    
    const retryButton = screen.getByText('Try Again');
    const homeButton = screen.getByText('Go Home');
    
    fireEvent.click(retryButton);
    fireEvent.click(homeButton);
    
    expect(handleRetry).toHaveBeenCalledTimes(1);
    expect(handleHome).toHaveBeenCalledTimes(1);
  });
});

describe('NoFilterResults Component', () => {
  it('renders with default filter type', () => {
    const handleClear = jest.fn();
    render(<NoFilterResults onClearFilters={handleClear} />);
    
    expect(screen.getByText('No results with current filters')).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('renders with custom filter type', () => {
    const handleClear = jest.fn();
    render(<NoFilterResults filterType="styles" onClearFilters={handleClear} />);
    
    expect(screen.getByText('No results with current styles')).toBeInTheDocument();
    expect(screen.getByText('Clear styles')).toBeInTheDocument();
  });

  it('shows active filters count in description', () => {
    render(<NoFilterResults activeFiltersCount={3} />);
    
    expect(screen.getByText(/try removing some filters/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const handleClear = jest.fn();
    const handleReset = jest.fn();
    
    render(
      <NoFilterResults 
        onClearFilters={handleClear}
        onResetAll={handleReset}
      />
    );
    
    const clearButton = screen.getByText('Clear filters');
    const resetButton = screen.getByText('Show All Results');
    
    fireEvent.click(clearButton);
    fireEvent.click(resetButton);
    
    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState Variants Accessibility', () => {
  it('all variants have proper heading structure', () => {
    const variants = [
      <NoSearchResults key="search" />,
      <NewUserOnboarding key="onboarding" />,
      <EmptyFavorites key="favorites" />,
      <EmptyPortfolio key="portfolio" />,
      <LoadingEmptyState key="loading" />,
      <ErrorEmptyState key="error" />,
      <NoFilterResults key="filter" />
    ];
    
    variants.forEach((variant, index) => {
      const { unmount } = render(variant);
      
      // Each should have a heading
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      unmount();
    });
  });

  it('action buttons have proper accessibility', () => {
    const handleAction = jest.fn();
    
    render(
      <NoSearchResults 
        onClearSearch={handleAction}
        onBrowseAll={handleAction}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type');
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
    });
  });
});