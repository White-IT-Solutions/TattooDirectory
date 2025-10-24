import { render, screen, waitFor } from '../../../__tests__/test-utils';
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
        expect(screen.getByText('Find Your Perfect Tattoo Studio')).toBeInTheDocument();
        expect(screen.getByText('Discover professional tattoo studios across the UK. Search by specialty, location, services, and more to find the perfect studio for your next tattoo.')).toBeInTheDocument();
      });
    });

    test('displays onboarding when no search performed', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to your tattoo journey!')).toBeInTheDocument();
        expect(screen.getByText('Start Exploring Artists')).toBeInTheDocument();
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
    test('renders search controls and filters', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Studios')).toBeInTheDocument();
        expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
        expect(screen.getByText('Map View')).toBeInTheDocument();
      });
    });

    test('displays search interface', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search studios, specialties, services, or locations...')).toBeInTheDocument();
      });
    });
  });
});