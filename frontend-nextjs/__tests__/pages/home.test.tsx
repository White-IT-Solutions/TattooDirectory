import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import HomePage from '../../app/page'

// Mock the API calls
jest.mock('../../lib/api', () => ({
  fetchArtists: jest.fn(() => Promise.resolve({
    artists: [
      {
        id: '1',
        name: 'Test Artist',
        bio: 'Test bio',
        location: 'Test City',
        styles: ['Traditional'],
        rating: 4.5,
        reviewCount: 10,
        images: ['test-image.jpg'],
        contact: { email: 'test@example.com' }
      }
    ],
    total: 1
  }))
}))

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the home page with hero section', async () => {
    renderWithProviders(<HomePage />)
    
    // Check for hero section elements
    expect(screen.getByText('Find Your Perfect Tattoo Artist')).toBeInTheDocument()
    expect(screen.getByText(/Discover talented tattoo artists/)).toBeInTheDocument()
    
    // Check for search functionality
    expect(screen.getByPlaceholderText(/Search by location, style/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('displays featured artists section', async () => {
    renderWithProviders(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Featured Artists')).toBeInTheDocument()
    })
  })

  it('renders navigation correctly', () => {
    renderWithProviders(<HomePage />)
    
    // Check for navigation elements
    expect(screen.getByText('Ink Flow Finder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('has proper page structure and accessibility', () => {
    renderWithProviders(<HomePage />)
    
    // Check for main content area
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})