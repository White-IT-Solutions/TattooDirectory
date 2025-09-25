import { render, screen, fireEvent } from '@testing-library/react';
import FAQPage from '../page';

// Mock the design system components
jest.mock('../../../design-system/components/ui/Breadcrumb', () => ({
  Breadcrumb: ({ children }) => <nav data-testid="breadcrumb">{children}</nav>,
  BreadcrumbItem: ({ children, current }) => (
    <span data-testid="breadcrumb-item" aria-current={current ? 'page' : undefined}>
      {children}
    </span>
  ),
  HomeBreadcrumb: () => <span data-testid="home-breadcrumb">Home</span>
}));

jest.mock('../../../design-system/components/ui/Input', () => ({
  SearchInput: ({ placeholder, value, onChange, ...props }) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}));

jest.mock('../../../design-system/components/ui/Button/Button', () => {
  return function Button({ children, onClick, ...props }) {
    return (
      <button data-testid="button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('../../../design-system/components/ui/FAQ', () => ({
  FAQ: ({ categories, searchTerm, ...props }) => (
    <div data-testid="faq-component" data-search-term={searchTerm} {...props}>
      {categories.map((category, index) => (
        <div key={index} data-testid={`category-${index}`}>
          <h3>{category.category}</h3>
          {category.questions.map((q, qIndex) => (
            <div key={qIndex} data-testid={`question-${index}-${qIndex}`}>
              {q.question}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}));

jest.mock('../../../design-system/components/ui/Contact', () => ({
  FAQContact: () => <div data-testid="faq-contact">FAQ Contact Component</div>
}));

describe('FAQ Page', () => {
  it('renders page header with title and description', () => {
    render(<FAQPage />);

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText(/Find answers to common questions/)).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(<FAQPage />);

    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.getByTestId('home-breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search FAQs...');
  });

  it('updates search term when typing in search input', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'artist' } });

    expect(searchInput.value).toBe('artist');
  });

  it('shows clear button when search term is entered', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
  });

  it('shows search results text when filtering', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'artist' } });

    expect(screen.getByText('Showing results for "artist"')).toBeInTheDocument();
  });

  it('renders FAQ component with correct props', () => {
    render(<FAQPage />);

    const faqComponent = screen.getByTestId('faq-component');
    expect(faqComponent).toBeInTheDocument();
    expect(faqComponent).toHaveAttribute('data-search-term', '');
  });

  it('passes search term to FAQ component', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'privacy' } });

    const faqComponent = screen.getByTestId('faq-component');
    expect(faqComponent).toHaveAttribute('data-search-term', 'privacy');
  });

  it('renders all FAQ categories', () => {
    render(<FAQPage />);

    expect(screen.getByText('Artist Search')).toBeInTheDocument();
    expect(screen.getByText('Artist Profiles')).toBeInTheDocument();
    expect(screen.getByText('Data Privacy')).toBeInTheDocument();
    expect(screen.getByText('General Usage')).toBeInTheDocument();
  });

  it('renders FAQ contact component', () => {
    render(<FAQPage />);

    expect(screen.getByTestId('faq-contact')).toBeInTheDocument();
  });

  it('has proper page structure and accessibility', () => {
    render(<FAQPage />);

    // Check for main content structure
    expect(screen.getByRole('textbox', { name: /search frequently asked questions/i })).toBeInTheDocument();
    
    // Check for headings hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Frequently Asked Questions');
  });

  it('handles empty search gracefully', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    
    // Enter search term
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(screen.getByText('Showing results for "test"')).toBeInTheDocument();
    
    // Clear search term
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.queryByText(/showing results for/i)).not.toBeInTheDocument();
  });

  it('maintains search state correctly', () => {
    render(<FAQPage />);

    const searchInput = screen.getByTestId('search-input');
    
    // Type multiple characters
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ar' } });
    fireEvent.change(searchInput, { target: { value: 'art' } });
    
    expect(searchInput.value).toBe('art');
    expect(screen.getByText('Showing results for "art"')).toBeInTheDocument();
  });
});