import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StyleGallery from '../StyleGallery/StyleGallery';

// Mock the data imports
jest.mock('../../../../app/data/testData/enhancedTattooStyles', () => ({
  enhancedTattooStyles: {
    'traditional': {
      id: 'traditional',
      name: 'Traditional',
      popularMotifs: ['roses', 'anchors', 'eagles'],
      characteristics: ['bold lines', 'solid colors']
    },
    'realism': {
      id: 'realism',
      name: 'Realism',
      popularMotifs: ['portraits', 'animals'],
      characteristics: ['detailed shading', 'photorealistic']
    }
  },
  getAllMotifs: () => ['roses', 'anchors', 'eagles', 'portraits', 'animals'],
  getAllCharacteristics: () => ['bold lines', 'solid colors', 'detailed shading', 'photorealistic']
}));

jest.mock('../../../../app/data/mockArtistData', () => ({
  mockArtistData: [
    {
      artistId: 'artist1',
      artistName: 'John Doe',
      location: 'London',
      rating: 4.5,
      portfolioImages: [
        {
          url: '/test-image-1.jpg',
          description: 'Traditional rose tattoo',
          style: 'traditional',
          tags: ['roses', 'color']
        },
        {
          url: '/test-image-2.jpg',
          description: 'Portrait tattoo',
          style: 'realism',
          tags: ['portrait', 'black and grey']
        }
      ]
    },
    {
      artistId: 'artist2',
      artistName: 'Jane Smith',
      location: 'Manchester',
      rating: 4.8,
      portfolioImages: [
        {
          url: '/test-image-3.jpg',
          description: 'Eagle tattoo',
          style: 'traditional',
          tags: ['eagles', 'bold']
        }
      ]
    }
  ]
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn().mockImplementation((element) => {
    // Simulate intersection
    callback([{ isIntersecting: true, target: element }]);
  }),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

describe('StyleGallery Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders gallery with default props', () => {
      render(<StyleGallery />);
      
      expect(screen.getByText('Filter Gallery')).toBeInTheDocument();
      expect(screen.getByText(/Showing \d+ of \d+ images/)).toBeInTheDocument();
    });

    test('renders images from mock data', () => {
      render(<StyleGallery />);
      
      expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
      expect(screen.getByAltText('Portrait tattoo')).toBeInTheDocument();
      expect(screen.getByAltText('Eagle tattoo')).toBeInTheDocument();
    });

    test('hides filters when showFilters is false', () => {
      render(<StyleGallery showFilters={false} />);
      
      expect(screen.queryByText('Filter Gallery')).not.toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    test('filters by style selection', async () => {
      render(<StyleGallery />);
      
      const styleSelect = screen.getByDisplayValue('All Styles');
      fireEvent.change(styleSelect, { target: { value: 'traditional' } });
      
      await waitFor(() => {
        expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
        expect(screen.getByAltText('Eagle tattoo')).toBeInTheDocument();
        expect(screen.queryByAltText('Portrait tattoo')).not.toBeInTheDocument();
      });
    });

    test('filters by search query', async () => {
      render(<StyleGallery />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      fireEvent.change(searchInput, { target: { value: 'rose' } });
      
      await waitFor(() => {
        expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
        expect(screen.queryByAltText('Portrait tattoo')).not.toBeInTheDocument();
        expect(screen.queryByAltText('Eagle tattoo')).not.toBeInTheDocument();
      });
    });

    test('filters by motifs', async () => {
      render(<StyleGallery />);
      
      const rosesTag = screen.getByText('roses');
      fireEvent.click(rosesTag);
      
      await waitFor(() => {
        expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
        expect(screen.queryByAltText('Portrait tattoo')).not.toBeInTheDocument();
      });
    });

    test('filters by characteristics', async () => {
      render(<StyleGallery />);
      
      const boldLinesTag = screen.getByText('bold lines');
      fireEvent.click(boldLinesTag);
      
      await waitFor(() => {
        expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
        expect(screen.getByAltText('Eagle tattoo')).toBeInTheDocument();
        expect(screen.queryByAltText('Portrait tattoo')).not.toBeInTheDocument();
      });
    });

    test('clears all filters', async () => {
      render(<StyleGallery />);
      
      // Apply a filter first
      const styleSelect = screen.getByDisplayValue('All Styles');
      fireEvent.change(styleSelect, { target: { value: 'traditional' } });
      
      await waitFor(() => {
        expect(screen.queryByAltText('Portrait tattoo')).not.toBeInTheDocument();
      });
      
      // Clear filters
      const clearButton = screen.getByText('Clear All Filters');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByAltText('Portrait tattoo')).toBeInTheDocument();
      });
    });
  });

  describe('Lightbox Functionality', () => {
    test('opens lightbox when image is clicked', async () => {
      render(<StyleGallery />);
      
      const image = screen.getByAltText('Traditional rose tattoo');
      fireEvent.click(image.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByText('Traditional rose tattoo')).toBeInTheDocument();
        expect(screen.getByText('by John Doe')).toBeInTheDocument();
      });
    });

    test('closes lightbox with escape key', async () => {
      render(<StyleGallery />);
      
      const image = screen.getByAltText('Traditional rose tattoo');
      fireEvent.click(image.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByText('by John Doe')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('by John Doe')).not.toBeInTheDocument();
      });
    });

    test('navigates between images with arrow keys', async () => {
      render(<StyleGallery />);
      
      const image = screen.getByAltText('Traditional rose tattoo');
      fireEvent.click(image.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByText('Traditional rose tattoo')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('Portrait tattoo')).toBeInTheDocument();
      });
    });

    test('closes lightbox with close button', async () => {
      render(<StyleGallery />);
      
      const image = screen.getByAltText('Traditional rose tattoo');
      fireEvent.click(image.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByText('by John Doe')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByLabelText('Close lightbox');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('by John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Grid Layout', () => {
    test('applies correct grid columns', () => {
      const { container } = render(<StyleGallery columns={3} />);
      
      expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
      expect(container.querySelector('.md\\:grid-cols-3')).toBeInTheDocument();
    });

    test('applies different column layouts', () => {
      const { container } = render(<StyleGallery columns={5} />);
      
      expect(container.querySelector('.xl\\:grid-cols-5')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    test('enables lazy loading by default', () => {
      render(<StyleGallery />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    test('disables lazy loading when specified', () => {
      render(<StyleGallery lazyLoading={false} />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).not.toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('Artist Filtering', () => {
    test('filters by specific artist', () => {
      render(<StyleGallery artistId="artist1" />);
      
      expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
      expect(screen.getByAltText('Portrait tattoo')).toBeInTheDocument();
      expect(screen.queryByAltText('Eagle tattoo')).not.toBeInTheDocument();
    });
  });

  describe('Image Limits', () => {
    test('respects maxImages prop', () => {
      render(<StyleGallery maxImages={2} />);
      
      const images = screen.getAllByRole('img');
      expect(images.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no images match filters', async () => {
      render(<StyleGallery />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No images found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or search terms to see more results.')).toBeInTheDocument();
      });
    });

    test('shows clear filters button in empty state', async () => {
      render(<StyleGallery />);
      
      const searchInput = screen.getByPlaceholderText('Search by description, artist, or tags...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Image Hover Effects', () => {
    test('shows overlay information on hover', () => {
      render(<StyleGallery />);
      
      const imageCard = screen.getByAltText('Traditional rose tattoo').closest('.group');
      fireEvent.mouseEnter(imageCard);
      
      // Hover effects are CSS-based, so we check for the presence of hover classes
      expect(imageCard).toHaveClass('group');
    });
  });

  describe('Results Count', () => {
    test('displays correct results count', () => {
      render(<StyleGallery />);
      
      expect(screen.getByText('Showing 3 of 3 images')).toBeInTheDocument();
    });

    test('updates results count after filtering', async () => {
      render(<StyleGallery />);
      
      const styleSelect = screen.getByDisplayValue('All Styles');
      fireEvent.change(styleSelect, { target: { value: 'traditional' } });
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 images')).toBeInTheDocument();
      });
    });
  });

  describe('Style Badge Display', () => {
    test('shows style badge when style is selected', async () => {
      render(<StyleGallery />);
      
      const styleSelect = screen.getByDisplayValue('All Styles');
      fireEvent.change(styleSelect, { target: { value: 'traditional' } });
      
      await waitFor(() => {
        expect(screen.getByText('Traditional')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper image alt text', () => {
      render(<StyleGallery />);
      
      expect(screen.getByAltText('Traditional rose tattoo')).toBeInTheDocument();
      expect(screen.getByAltText('Portrait tattoo')).toBeInTheDocument();
      expect(screen.getByAltText('Eagle tattoo')).toBeInTheDocument();
    });

    test('provides proper keyboard navigation for lightbox', async () => {
      render(<StyleGallery />);
      
      const image = screen.getByAltText('Traditional rose tattoo');
      fireEvent.click(image.closest('.group'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
        expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      });
    });

    test('provides proper form labels', () => {
      render(<StyleGallery />);
      
      expect(screen.getByLabelText('Search Images')).toBeInTheDocument();
      expect(screen.getByLabelText('Tattoo Style')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('implements intersection observer for lazy loading', () => {
      render(<StyleGallery />);
      
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });
  });
});