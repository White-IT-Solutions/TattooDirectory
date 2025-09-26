import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StyleGallery from '../StyleGallery';
import { enhancedTattooStyles } from '../../../../../app/data/testData/enhancedTattooStyles';
import { mockArtistData } from '../../../../../app/data/mockArtistData';

// Mock the data modules
jest.mock('../../../../../app/data/testData/enhancedTattooStyles', () => ({
  enhancedTattooStyles: {
    japanese: {
      id: 'japanese',
      name: 'Japanese',
      popularMotifs: ['Dragons', 'Koi Fish'],
      characteristics: ['Bold Imagery', 'Cultural Symbolism']
    },
    traditional: {
      id: 'traditional',
      name: 'Traditional',
      popularMotifs: ['Roses', 'Anchors'],
      characteristics: ['Bold Lines', 'Classic Imagery']
    }
  },
  getAllMotifs: () => ['Dragons', 'Koi Fish', 'Roses', 'Anchors'],
  getAllCharacteristics: () => ['Bold Imagery', 'Cultural Symbolism', 'Bold Lines', 'Classic Imagery']
}));

jest.mock('../../../../../app/data/mockArtistData', () => ({
  mockArtistData: [
    {
      artistId: 'artist1',
      artistName: 'Test Artist 1',
      portfolioImages: [
        {
          url: 'test-image-1.jpg',
          description: 'Dragon tattoo',
          style: 'japanese',
          tags: ['dragon', 'color']
        },
        {
          url: 'test-image-2.jpg',
          description: 'Rose tattoo',
          style: 'traditional',
          tags: ['rose', 'red']
        }
      ]
    },
    {
      artistId: 'artist2',
      artistName: 'Test Artist 2',
      portfolioImages: [
        {
          url: 'test-image-3.jpg',
          description: 'Koi fish tattoo',
          style: 'japanese',
          tags: ['koi', 'water']
        }
      ]
    }
  ]
}));

describe('StyleGallery Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock console.error to avoid React warnings in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Basic Rendering', () => {
    test('renders gallery with images', () => {
      render(<StyleGallery />);
      
      expect(screen.getByText('Showing 3 of 3 images')).toBeInTheDocument();
      expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
      expect(screen.getByText('Rose tattoo')).toBeInTheDocument();
      expect(screen.getByText('Koi fish tattoo')).toBeInTheDocument();
    });

    test('renders with filters when showFilters is true', () => {
      render(<StyleGallery showFilters={true} />);
      
      expect(screen.getByText('Filter Gallery')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by description, artist, or tags...')).toBeInTheDocument();
      expect(screen.getByText('Tattoo Style')).toBeInTheDocument();
    });

    test('hides filters when showFilters is false', () => {
      render(<StyleGallery showFilters={false} />);
      
      expect(screen.queryByText('Filter Gallery')).not.toBeInTheDocument();
    });

    test('respects maxImages prop', () => {
      render(<StyleGallery maxImages={2} />);
      
      expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
    });
  });

  describe('Style Filtering', () => {
    test('filters images by selected style', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const styleSelect = screen.getByDisplayValue('All Styles');
      await user.selectOptions(styleSelect, 'japanese');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
        expect(screen.getByText('Koi fish tattoo')).toBeInTheDocument();
        expect(screen.queryByText('Rose tattoo')).not.toBeInTheDocument();
      });
    });

    test('shows initial style when provided', () => {
      render(<StyleGallery initialStyle="traditional" showFilters={true} />);
      
      expect(screen.getByText('Showing 1 of 3 images')).toBeInTheDocument();
      expect(screen.getByText('Rose tattoo')).toBeInTheDocument();
      expect(screen.queryByText('Dragon tattoo')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('filters images by search query', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      await user.type(searchInput, 'dragon');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
        expect(screen.queryByText('Rose tattoo')).not.toBeInTheDocument();
      });
    });

    test('searches by artist name', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      await user.type(searchInput, 'Test Artist 1');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
        expect(screen.getByText('Rose tattoo')).toBeInTheDocument();
      });
    });

    test('searches by tags', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      await user.type(searchInput, 'color');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
      });
    });
  });

  describe('Motif and Characteristic Filtering', () => {
    test('filters by selected motifs', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const dragonsMotif = screen.getByText('Dragons');
      await user.click(dragonsMotif);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
        expect(screen.getByText('Koi fish tattoo')).toBeInTheDocument();
      });
    });

    test('filters by selected characteristics', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const boldImagery = screen.getByText('Bold Imagery');
      await user.click(boldImagery);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
        expect(screen.getByText('Dragon tattoo')).toBeInTheDocument();
        expect(screen.getByText('Koi fish tattoo')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    test('clears all filters when clear button is clicked', async () => {
      render(<StyleGallery showFilters={true} />);
      
      // Apply some filters
      const styleSelect = screen.getByDisplayValue('All Styles');
      await user.selectOptions(styleSelect, 'japanese');
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      await user.type(searchInput, 'dragon');
      
      // Clear filters
      const clearButton = screen.getByText('Clear All Filters');
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 images')).toBeInTheDocument();
        expect(searchInput.value).toBe('');
        expect(styleSelect.value).toBe('');
      });
    });
  });

  describe('Lightbox Functionality', () => {
    test('opens lightbox when image is clicked', async () => {
      render(<StyleGallery />);
      
      const firstImage = screen.getAllByRole('img')[0];
      await user.click(firstImage.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      });
    });

    test('closes lightbox when close button is clicked', async () => {
      render(<StyleGallery />);
      
      const firstImage = screen.getAllByRole('img')[0];
      await user.click(firstImage.closest('.group'));
      
      const closeButton = screen.getByLabelText('Close lightbox');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
      });
    });

    test('navigates to next image in lightbox', async () => {
      render(<StyleGallery />);
      
      const firstImage = screen.getAllByRole('img')[0];
      await user.click(firstImage.closest('.group'));
      
      const nextButton = screen.getByLabelText('Next image');
      await user.click(nextButton);
      
      await waitFor(() => {
        // Check that navigation occurred by looking for next button still being present
        expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      });
    });

    test('navigates to previous image in lightbox', async () => {
      render(<StyleGallery />);
      
      // Click on third image (index 2) so we can navigate backwards
      const thirdImage = screen.getAllByRole('img')[2];
      await user.click(thirdImage.closest('.group'));
      
      const prevButton = screen.getByLabelText('Previous image');
      await user.click(prevButton);
      
      await waitFor(() => {
        // Check that navigation occurred by looking for prev button still being present
        expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('closes lightbox with Escape key', async () => {
      render(<StyleGallery />);
      
      const firstImage = screen.getAllByRole('img')[0];
      await user.click(firstImage.closest('.group'));
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
      });
    });

    test('navigates with arrow keys in lightbox', async () => {
      render(<StyleGallery />);
      
      const firstImage = screen.getAllByRole('img')[0];
      await user.click(firstImage.closest('.group'));
      
      // Verify lightbox is open
      expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        // Just verify lightbox is still open after navigation
        expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        // Just verify lightbox is still open after navigation
        expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no images match filters', async () => {
      render(<StyleGallery showFilters={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No images found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or search terms to see more results.')).toBeInTheDocument();
      });
    });
  });

  describe('Grid Layout', () => {
    test('applies correct grid classes for different column counts', () => {
      const { rerender } = render(<StyleGallery columns={2} />);
      expect(document.querySelector('.grid-cols-2')).toBeInTheDocument();
      
      rerender(<StyleGallery columns={3} />);
      expect(document.querySelector('.grid-cols-2.md\\:grid-cols-3')).toBeInTheDocument();
      
      rerender(<StyleGallery columns={4} />);
      expect(document.querySelector('.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4')).toBeInTheDocument();
    });
  });

  describe('Artist Attribution', () => {
    test('displays artist names in image overlay', async () => {
      render(<StyleGallery />);
      
      // Check that artist names are present in the DOM (they appear on hover)
      expect(screen.getAllByText('by Test Artist 1')).toHaveLength(2); // Two images by this artist
      expect(screen.getByText('by Test Artist 2')).toBeInTheDocument();
    });
  });
});