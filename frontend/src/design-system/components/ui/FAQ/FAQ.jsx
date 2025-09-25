"use client";

import { forwardRef, useState } from 'react';
import { cva } from '../../../utils/cn';
import Card from '../Card/Card';

// FAQ variant configurations
const faqVariants = cva(
  [
    'space-y-4'
  ].join(' ')
);

const faqItemVariants = cva(
  [
    'transition-all duration-200 ease-out'
  ].join(' ')
);

const faqQuestionVariants = cva(
  [
    'w-full text-left flex justify-between items-center',
    'p-4 transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2',
    'hover:bg-[var(--background-secondary)]',
    'text-[var(--typography-body-size)]',
    'font-weight-[var(--typography-label-weight)]',
    'text-[var(--text-primary)]'
  ].join(' ')
);

const faqAnswerVariants = cva(
  [
    'px-4 pb-4 pt-0',
    'text-[var(--typography-body-size)]',
    'text-[var(--text-secondary)]',
    'line-height-[var(--typography-body-line-height)]'
  ].join(' ')
);

const faqCategoryVariants = cva(
  [
    'mb-6'
  ].join(' ')
);

const faqCategoryTitleVariants = cva(
  [
    'text-[var(--typography-heading-3-size)]',
    'font-weight-[var(--typography-heading-3-weight)]',
    'text-[var(--text-primary)]',
    'mb-4'
  ].join(' ')
);

// Expand/Collapse Icons
const ChevronDownIcon = ({ className, isOpen }) => (
  <svg 
    className={`${className} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M19 9l-7 7-7-7" 
    />
  </svg>
);

const PlusMinusIcon = ({ className, isOpen }) => (
  <span 
    className={`${className} text-[var(--interactive-primary)] font-bold text-lg transition-transform duration-200`}
    aria-hidden="true"
  >
    {isOpen ? '−' : '+'}
  </span>
);

// FAQ Item Component
const FAQItem = forwardRef(({ 
  question,
  answer,
  isOpen = false,
  onToggle,
  id,
  iconType = 'chevron', // 'chevron' or 'plus'
  className,
  ...props 
}, ref) => {
  const Icon = iconType === 'chevron' ? ChevronDownIcon : PlusMinusIcon;

  return (
    <Card 
      elevation="low" 
      padding="none" 
      className={faqItemVariants({ className })}
      ref={ref}
      {...props}
    >
      <button
        className={faqQuestionVariants()}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${id}`}
        id={`faq-question-${id}`}
      >
        <span className="text-left pr-4">{question}</span>
        <Icon 
          className="h-5 w-5 flex-shrink-0" 
          isOpen={isOpen}
        />
      </button>
      
      {isOpen && (
        <div 
          className={faqAnswerVariants()}
          id={`faq-answer-${id}`}
          role="region"
          aria-labelledby={`faq-question-${id}`}
        >
          {typeof answer === 'string' ? (
            <p>{answer}</p>
          ) : (
            answer
          )}
        </div>
      )}
    </Card>
  );
});

FAQItem.displayName = 'FAQItem';

// FAQ Category Component
const FAQCategory = forwardRef(({ 
  title,
  questions = [],
  openQuestions = new Set(),
  onToggleQuestion,
  categoryId,
  iconType = 'chevron',
  className,
  ...props 
}, ref) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div 
      className={faqCategoryVariants({ className })}
      ref={ref}
      {...props}
    >
      <h2 className={faqCategoryTitleVariants()}>
        {title}
      </h2>
      
      <div className="space-y-3">
        {questions.map((q, index) => {
          const questionId = `${categoryId}-${index}`;
          const isOpen = openQuestions.has(questionId);
          
          return (
            <FAQItem
              key={questionId}
              id={questionId}
              question={q.question}
              answer={q.answer}
              isOpen={isOpen}
              onToggle={() => onToggleQuestion(questionId)}
              iconType={iconType}
            />
          );
        })}
      </div>
    </div>
  );
});

FAQCategory.displayName = 'FAQCategory';

// Main FAQ Component
const FAQ = forwardRef(({ 
  categories = [],
  searchTerm = '',
  iconType = 'chevron',
  allowMultipleOpen = false,
  className,
  ...props 
}, ref) => {
  const [openQuestions, setOpenQuestions] = useState(new Set());

  const handleToggleQuestion = (questionId) => {
    setOpenQuestions(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        if (!allowMultipleOpen) {
          newSet.clear();
        }
        newSet.add(questionId);
      }
      
      return newSet;
    });
  };

  // Filter categories and questions based on search term
  const filteredCategories = categories.map(category => {
    const filteredQuestions = category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return {
      ...category,
      questions: filteredQuestions
    };
  }).filter(category => category.questions.length > 0);

  // Filter out non-DOM props
  const { iconType: _, allowMultipleOpen: __, ...domProps } = props;

  return (
    <div 
      className={faqVariants({ className })}
      ref={ref}
      {...domProps}
    >
      {filteredCategories.map((category, index) => (
        <FAQCategory
          key={category.category || index}
          title={category.category}
          questions={category.questions}
          categoryId={category.category?.toLowerCase().replace(/\s+/g, '-') || `category-${index}`}
          openQuestions={openQuestions}
          onToggleQuestion={handleToggleQuestion}
          iconType={iconType}
        />
      ))}
      
      {filteredCategories.length === 0 && searchTerm && (
        <Card elevation="low" padding="lg" className="text-center">
          <div className="text-[var(--text-muted)]">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-[var(--typography-heading-4-size)] font-semibold text-[var(--text-primary)] mb-2">
              No results found
            </h3>
            <p className="text-[var(--typography-body-size)]">
              No FAQs match your search for &quot;{searchTerm}&quot;. Try different keywords or browse all categories.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
});

FAQ.displayName = 'FAQ';

export default FAQ;
export { 
  FAQ, 
  FAQItem, 
  FAQCategory,
  faqVariants,
  faqItemVariants,
  faqQuestionVariants,
  faqAnswerVariants,
  faqCategoryVariants,
  faqCategoryTitleVariants
};