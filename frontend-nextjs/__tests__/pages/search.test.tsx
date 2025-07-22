import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import SearchPage from '../../app/search/page'

// Mock the API calls
jest.mock('../../lib/api', () => ({
  searchArtists: jest.fn(() => Promise.resolve({
    artists: [
      {
        id: '1',
        name: 'Search Result Artist',
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

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search page with filters', () => {
    renderWithProviders(<SearchPage />)
    
    // Check for search input
    expect(screen.getByPlaceholderText(/search artists/i)).toBeInTheDocument()
    
    // Check for filter sections
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Style')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  it('allows users to enter search terms', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchPage />)
    
    const searchInput = screen.getByPlaceholderText(/search artists/i)
    await user.type(searchInput, 'traditional tattoo')
    
    expect(searchInput).toHaveValue('traditional tattoo')
  })

  it('displays search results', async () => {
    renderWithProviders(<SearchPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Search Result Artist')).toBeInTheDocument()
    })
  })

  it('shows filter options for styles', () => {
    renderWithProviders(<SearchPage />)
    
    // Check for common tattoo styles
    expect(screen.getByLabelText('Traditional')).toBeInTheDocument()
    expect(screen.getByLabelText('Realism')).toBeInTheDocument()
    expect(screen.getByLabelText('Japanese')).toBeInTheDocument()
  })

  it('allows filtering by rating', () => {
    renderWithProviders(<SearchPage />)
    
    // Check for rating filter
    expect(screen.getByText('4+ Stars')).toBeInTheDocument()
    expect(screen.getByText('3+ Stars')).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    renderWithProviders(<SearchPage />)
    
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})