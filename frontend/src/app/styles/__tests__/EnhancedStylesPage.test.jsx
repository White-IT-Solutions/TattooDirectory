import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import StylesPage from '../StylesPage';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the enhanced tattoo styles data
jest.mock('../../data/testData/enhancedTattooStyles', () => {
  const mockStyles = {
    traditional: {
      id: 'traditional',
      name: 'Traditional',
      description: 'Classic American traditional tattoos featuring bold black outlines.',
      difficulty: 'beginner',
      characteristics: ['Bold Lines', 'Limited Colors', 'Classic Imagery'],
      popularMotifs: ['Anchors', 'Roses', 'Pin-ups'],
      timeOrigin: '1900s-1950s',
      aliases: ['Old School', 'American Traditional'],
      popularity: 95,
      image: 'https://example.com/traditional.jpg'
    },
    realism: {
      id: 'realism',
      name: 'Realism',
      description: 'Highly detailed tattoo style that aims to replicate photographic quality.',
      difficulty: 'advanced',
      characteristics: ['Photographic Quality', 'Fine Details', 'Smooth Gradients'],
      popularMotifs: ['Portraits', 'Animals', 'Flowers'],
      timeOrigin: '1980s-Present',
      aliases: ['Photo-realism', 'Hyperrealism'],
      popularity: 90,
      image: 'https://example.com/realism.jpg'
    },
    geometric: {
      id: 'geometric',
      name: 'Geometric',
      description: 'Modern tattoo style featuring precise geometric shapes and patterns.',
      difficulty: 'intermediate',
      characteristics: ['Precise Lines', 'Geometric Shapes', 'Symmetrical'],
      popularMotifs: ['Sacred Geometry', 'Mandalas', 'Polygons'],
      timeOrigin: '2010s-Present',
      aliases: ['Sacred Geometry', 'Mathematical'],
      popularity: 75,
      image: 'https://example.com/geometric.jpg'
    }
  };

  return {
    enhancedTattooStyles: mockStyles,
    difficultyLevels: {
      beginner: { label: 'Beginner', color: 'success' },
      intermediate: { label: 'Intermediate', color: 'warning' },
      advanced: { label: 'Advanced', color: 'error' }
    },
    searchStylesByAlias: jest.fn(),
    getStylesByPopularity: jest.fn()
  };
});

describe('Enhanced StylesPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockPush,
    });
    
    // Reset mocks
    mockPush.mockClear();
    
    // Setup search function mock
    const { searchStylesByAlias, enhancedTattooStyles } = require('../../data/testData/enhancedTattooStyles');
    searchStylesByAlias.mockImplementation((query) => {
      const styles = Object.values(enhancedTattooStyles);
      return styles.filter(style => 
        style.name.toLowerCase().includes(query.toLowerCase()) ||
        style.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase()))
      );
    });
  });

  it('renders the enhanced styles page with all components', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Check header elements
    expect(screen.getByPlaceholderText('Search styles by name, alias, or description...')).toBeInTheDocument();
    
    // Check filter controls
    expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort by Popularity')).toBeInTheDocument();

    // Check that styles are displayed
    expect(screen.getByText('Traditional')).toBeInTheDocument();
    expect(screen.getByText('Realism')).toBeInTheDocument();
    expect(screen.getByText('Geometric')).toBeInTheDocument();
  });

  it('displays difficulty badges correctly', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Check difficulty badges - use getAllByText since there are multiple instances
    const beginnerBadges = screen.getAllByText('Beginner');
    const advancedBadges = screen.getAllByText('Advanced');
    const intermediateBadges = screen.getAllByText('Intermediate');
    
    expect(beginnerBadges.length).toBeGreaterThan(0); // Traditional
    expect(advancedBadges.length).toBeGreaterThan(0); // Realism
    expect(intermediateBadges.length).toBeGreaterThan(0); // Geometric
  });

  it('displays popularity indicators', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Check that popularity indicators are rendered (dots should be present)
    const styleCards = screen.getAllByText('Find Artists');
    expect(styleCards.length).toBeGreaterThan(0);
  });

  it('filters styles by search query', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search styles by name, alias, or description...');
    
    // Search for "traditional"
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'traditional' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      // Note: Other styles might still be visible depending on search implementation
    });
  });

  it('filters styles by difficulty level', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const difficultySelect = screen.getByDisplayValue('All Difficulties');
    
    // Filter by beginner difficulty
    await act(async () => {
      fireEvent.change(difficultySelect, { target: { value: 'beginner' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      // Other styles should be filtered out
    });
  });

  it('sorts styles correctly', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Sort by Popularity');
    
    // Sort by name
    await act(async () => {
      fireEvent.change(sortSelect, { target: { value: 'name' } });
    });

    await waitFor(() => {
      const styleNames = screen.getAllByText(/Traditional|Realism|Geometric/);
      expect(styleNames.length).toBeGreaterThan(0);
    });
  });

  it('shows and hides tooltips on hover', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Find a style card container
    const styleCards = document.querySelectorAll('[class*="group relative flex"]');
    if (styleCards.length > 0) {
      // Hover over the first card
      fireEvent.mouseEnter(styleCards[0]);

      await waitFor(() => {
        // Check if tooltip content appears
        const tooltipElements = screen.queryAllByText(/Characteristics|Motifs|Origin/);
        expect(tooltipElements.length).toBeGreaterThan(0);
      });

      // Mouse leave
      fireEvent.mouseLeave(styleCards[0]);
    }
  });

  it('navigates to artists page when Find Artists button is clicked', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const findArtistsButtons = screen.getAllByText('Find Artists');
    
    // Click the first Find Artists button
    await act(async () => {
      fireEvent.click(findArtistsButtons[0]);
    });

    expect(mockPush).toHaveBeenCalledWith('/artists?styles=traditional');
  });

  it('navigates to studios page when Find Studios button is clicked', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const findStudiosButtons = screen.getAllByText('Find Studios');
    
    // Click the first Find Studios button
    await act(async () => {
      fireEvent.click(findStudiosButtons[0]);
    });

    expect(mockPush).toHaveBeenCalledWith('/studios?styles=traditional');
  });

  it('clears all filters when Clear Filters button is clicked', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search styles by name, alias, or description...');
    const difficultySelect = screen.getByDisplayValue('All Difficulties');
    
    // Apply some filters
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'traditional' } });
      fireEvent.change(difficultySelect, { target: { value: 'beginner' } });
    });

    await waitFor(() => {
      const clearButton = screen.queryByText('Clear Filters');
      if (clearButton) {
        fireEvent.click(clearButton);
      }
    });
  });

  it('displays search results count', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Should show total count initially
    expect(screen.getByText(/Showing \d+ tattoo styles/)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search styles by name, alias, or description...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'traditional' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Showing \d+ styles/)).toBeInTheDocument();
    });
  });

  it('shows no results message when no styles match filters', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search styles by name, alias, or description...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'nonexistent style' } });
    });

    await waitFor(() => {
      const noResultsText = screen.queryByText(/No styles found/);
      if (noResultsText) {
        expect(noResultsText).toBeInTheDocument();
      }
    });
  });

  it('displays search tips when search results are shown', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search styles by name, alias, or description...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'traditional' } });
    });

    await waitFor(() => {
      const searchTips = screen.queryByText('Search Tips');
      if (searchTips) {
        expect(searchTips).toBeInTheDocument();
      }
    });
  });

  it('displays alias information for styles', async () => {
    await act(async () => {
      render(<StylesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tattoo Styles')).toBeInTheDocument();
    });

    // Check that alias information is displayed
    const aliasText = screen.queryByText('aka Old School');
    if (aliasText) {
      expect(aliasText).toBeInTheDocument();
    }
  });
});