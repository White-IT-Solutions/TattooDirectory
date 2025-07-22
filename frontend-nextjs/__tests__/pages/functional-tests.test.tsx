import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import HomePage from '@/app/page';
import SearchPage from '@/app/search/page';
import ArtistProfilePage from '@/app/artist/[id]/page';
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';
import FAQPage from '@/app/faq/page';
import StatusPage from '@/app/status/page';
import NotFoundPage from '@/app/not-found';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Setup test providers
const TestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Page Functional Tests', () => {
  beforeEach(() => {
    // Mock router functions
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Landing Page', () => {
    it('renders the landing page correctly', async () => {
      render(
        <TestProviders>
          <HomePage />
        </TestProviders>
      );
      
      // Wait for the page to load
      await waitFor(() => {
        // Check for key landing page elements
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      
      // Check for search functionality if it exists on landing page
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        expect(searchInput).toBeInTheDocument();
      }
    });
  });

  describe('Artist Search Page', () => {
    it('renders the search page with filters', async () => {
      render(
        <TestProviders>
          <SearchPage />
        </TestProviders>
      );
      
      // Wait for the search page to load
      await waitFor(() => {
        // Check for search input
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Check for filter components
      const filterElements = screen.getAllByRole('button');
      expect(filterElements.length).toBeGreaterThan(0);
    });
  });

  describe('Artist Profile Page', () => {
    it('renders artist profile with dynamic id parameter', async () => {
      const testId = 'test-artist-id';
      
      render(
        <TestProviders>
          <ArtistProfilePage params={{ id: testId }} />
        </TestProviders>
      );
      
      // Wait for profile to load
      await waitFor(() => {
        // Check for artist information sections
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Check if artist ID is used in the component
      const profileContent = screen.getByRole('main').textContent;
      expect(profileContent).toContain(testId);
    });
  });

  describe('Static Pages', () => {
    it('renders the Privacy page correctly', async () => {
      render(
        <TestProviders>
          <PrivacyPage />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /privacy/i })).toBeInTheDocument();
      });
    });

    it('renders the Terms page correctly', async () => {
      render(
        <TestProviders>
          <TermsPage />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /terms/i })).toBeInTheDocument();
      });
    });

    it('renders the FAQ page correctly', async () => {
      render(
        <TestProviders>
          <FAQPage />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /faq|frequently asked questions/i })).toBeInTheDocument();
      });
    });

    it('renders the Status page correctly', async () => {
      render(
        <TestProviders>
          <StatusPage />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /status/i })).toBeInTheDocument();
      });
    });
  });

  describe('404 Not Found Page', () => {
    it('renders the not found page correctly', async () => {
      render(
        <TestProviders>
          <NotFoundPage />
        </TestProviders>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/not found|404/i)).toBeInTheDocument();
      });
    });
  });
});