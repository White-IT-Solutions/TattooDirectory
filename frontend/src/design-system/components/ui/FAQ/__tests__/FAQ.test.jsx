import { render, screen, fireEvent } from '@testing-library/react';
import { FAQ, FAQItem, FAQCategory } from '../FAQ';

const mockFAQData = [
  {
    category: "Test Category 1",
    questions: [
      {
        question: "Test question 1?",
        answer: "Test answer 1"
      },
      {
        question: "Test question 2?",
        answer: "Test answer 2"
      }
    ]
  },
  {
    category: "Test Category 2",
    questions: [
      {
        question: "Another test question?",
        answer: "Another test answer"
      }
    ]
  }
];

describe('FAQ Component', () => {
  it('renders all categories and questions', () => {
    render(<FAQ categories={mockFAQData} />);

    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
    expect(screen.getByText('Test question 1?')).toBeInTheDocument();
    expect(screen.getByText('Test question 2?')).toBeInTheDocument();
    expect(screen.getByText('Another test question?')).toBeInTheDocument();
  });

  it('filters questions based on search term', () => {
    render(<FAQ categories={mockFAQData} searchTerm="question 1" />);

    expect(screen.getByText('Test question 1?')).toBeInTheDocument();
    expect(screen.queryByText('Test question 2?')).not.toBeInTheDocument();
    expect(screen.queryByText('Another test question?')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', () => {
    render(<FAQ categories={mockFAQData} searchTerm="nonexistent" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No FAQs match your search for.*nonexistent/)).toBeInTheDocument();
  });

  it('hides categories with no matching questions', () => {
    render(<FAQ categories={mockFAQData} searchTerm="Another" />);

    expect(screen.queryByText('Test Category 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
    expect(screen.getByText('Another test question?')).toBeInTheDocument();
  });
});

describe('FAQItem Component', () => {
  const mockToggle = jest.fn();

  beforeEach(() => {
    mockToggle.mockClear();
  });

  it('renders question and calls onToggle when clicked', () => {
    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer="Test answer"
        isOpen={false}
        onToggle={mockToggle}
      />
    );

    const button = screen.getByRole('button', { name: /test question/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows answer when isOpen is true', () => {
    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer="Test answer"
        isOpen={true}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText('Test answer')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('hides answer when isOpen is false', () => {
    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer="Test answer"
        isOpen={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.queryByText('Test answer')).not.toBeInTheDocument();
  });

  it('renders with plus/minus icon when iconType is plus', () => {
    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer="Test answer"
        isOpen={false}
        onToggle={mockToggle}
        iconType="plus"
      />
    );

    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('renders JSX answer content', () => {
    const jsxAnswer = (
      <div>
        <p>Complex answer</p>
        <a href="/link">Learn more</a>
      </div>
    );

    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer={jsxAnswer}
        isOpen={true}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText('Complex answer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <FAQItem
        id="test-1"
        question="Test question?"
        answer="Test answer"
        isOpen={true}
        onToggle={mockToggle}
      />
    );

    const button = screen.getByRole('button');
    const answer = screen.getByRole('region');

    expect(button).toHaveAttribute('aria-controls', 'faq-answer-test-1');
    expect(button).toHaveAttribute('id', 'faq-question-test-1');
    expect(answer).toHaveAttribute('aria-labelledby', 'faq-question-test-1');
    expect(answer).toHaveAttribute('id', 'faq-answer-test-1');
  });
});

describe('FAQCategory Component', () => {
  const mockToggle = jest.fn();
  const mockQuestions = [
    { question: "Q1?", answer: "A1" },
    { question: "Q2?", answer: "A2" }
  ];

  beforeEach(() => {
    mockToggle.mockClear();
  });

  it('renders category title and questions', () => {
    render(
      <FAQCategory
        title="Test Category"
        questions={mockQuestions}
        categoryId="test-category"
        openQuestions={new Set()}
        onToggleQuestion={mockToggle}
      />
    );

    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Q1?')).toBeInTheDocument();
    expect(screen.getByText('Q2?')).toBeInTheDocument();
  });

  it('does not render when questions array is empty', () => {
    const { container } = render(
      <FAQCategory
        title="Empty Category"
        questions={[]}
        categoryId="empty-category"
        openQuestions={new Set()}
        onToggleQuestion={mockToggle}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows open questions based on openQuestions set', () => {
    const openQuestions = new Set(['test-category-0']);
    
    render(
      <FAQCategory
        title="Test Category"
        questions={mockQuestions}
        categoryId="test-category"
        openQuestions={openQuestions}
        onToggleQuestion={mockToggle}
      />
    );

    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.queryByText('A2')).not.toBeInTheDocument();
  });

  it('calls onToggleQuestion with correct question ID', () => {
    render(
      <FAQCategory
        title="Test Category"
        questions={mockQuestions}
        categoryId="test-category"
        openQuestions={new Set()}
        onToggleQuestion={mockToggle}
      />
    );

    const firstQuestion = screen.getByRole('button', { name: /q1/i });
    fireEvent.click(firstQuestion);

    expect(mockToggle).toHaveBeenCalledWith('test-category-0');
  });
});