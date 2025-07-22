import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Navigation from '@/components/Navigation';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
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

describe('Navigation and Routing Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  describe('Navigation Component', () => {
    it('renders all navigation links correctly', () => {
      render(
        <TestProviders>
          <Navigation />
        </TestProviders>
      );
      
      // Check for main navigation links
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/search/i)).toBeInTheDocument();
      // Add other expected navigation links
    });

    it('highlights the active link based on current path', () => {
      // Mock the current path to be /search
      (usePathname as jest.Mock).mockReturnValue('/search');
      
      render(
        <TestProviders>
          <Navigation />
        </TestProviders>
      );
      
      // Check that the search link has the active class or attribute
      const searchLink = screen.getByText(/search/i).closest('a');
      expect(searchLink).toHaveClass('active'); // Adjust based on your actual active class name
    });

    it('navigates to the correct route when links are clicked', async () => {
      render(
        <TestProviders>
          <Navigation />
        </TestProviders>
      );
      
      // Find and click the search link
      const searchLink = screen.getByText(/search/i).closest('a');
      fireEvent.click(searchLink);
      
      // Verify router.push was called with the correct path
      expect(mockRouter.push).toHaveBeenCalledWith('/search');
    });
  });

  describe('Back/Forward Navigation', () => {
    it('calls router.back when back navigation is triggered', () => {
      // This would typically be tested in a component with a back button
      // For demonstration, we'll create a simple test component
      const TestComponent = () => {
        const router = useRouter();
        return <button onClick={() => router.back()}>Go Back</button>;
      };
      
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );
      
      // Click the back button
      fireEvent.click(screen.getByText('Go Back'));
      
      // Verify router.back was called
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('calls router.forward when forward navigation is triggered', () => {
      // Similar to back test, create a simple component
      const TestComponent = () => {
        const router = useRouter();
        return <button onClick={() => router.forward()}>Go Forward</button>;
      };
      
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );
      
      // Click the forward button
      fireEvent.click(screen.getByText('Go Forward'));
      
      // Verify router.forward was called
      expect(mockRouter.forward).toHaveBeenCalled();
    });
  });

  describe('Dynamic Routing', () => {
    it('handles dynamic route parameters correctly', () => {
      // Create a test component that uses route parameters
      const TestComponent = ({ params }: { params: { id: string } }) => {
        return <div>Artist ID: {params.id}</div>;
      };
      
      render(
        <TestProviders>
          <TestComponent params={{ id: 'test-artist-123' }} />
        </TestProviders>
      );
      
      // Verify the parameter is displayed correctly
      expect(screen.getByText('Artist ID: test-artist-123')).toBeInTheDocument();
    });
  });

  describe('404 Handling', () => {
    it('renders the not-found page for invalid routes', () => {
      // This would typically be tested by navigating to an invalid route
      // For unit testing, we can directly render the NotFound component
      const NotFound = require('@/app/not-found').default;
      
      render(
        <TestProviders>
          <NotFound />
        </TestProviders>
      );
      
      // Verify not found content is displayed
      expect(screen.getByText(/not found|404/i)).toBeInTheDocument();
    });
  });
});