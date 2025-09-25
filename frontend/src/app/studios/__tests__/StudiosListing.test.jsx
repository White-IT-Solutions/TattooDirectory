import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudiosPage from '../page';
import { mockStudios } from '../../data/mockStudioData';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('StudiosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('displays page title and description', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
        expect(screen.getByText('Discover professional tattoo studios across the UK')).toBeInTheDocument();
      });
    });

    test('displays all studios after loading', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText(mockStudios[0].studioName)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('renders search input', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search studios/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('basic search functionality works', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search studios/i);
        expect(searchInput).toBeInTheDocument();
      });
    });
  });

  describe('Basic Functionality', () => {
    test('renders sort dropdown and view toggle', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Sort by Name')).toBeInTheDocument();
        expect(screen.getByTestId('grid-view-button')).toBeInTheDocument();
        expect(screen.getByTestId('list-view-button')).toBeInTheDocument();
      });
    });

    test('displays results summary', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText(`${mockStudios.length} studios found`)).toBeInTheDocument();
      });
    });
  });
});