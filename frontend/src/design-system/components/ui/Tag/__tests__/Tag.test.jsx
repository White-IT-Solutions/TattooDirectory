import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tag from '../Tag';

describe('Tag Component', () => {
  it('renders with default props', () => {
    render(<Tag>Test Tag</Tag>);
    const tagText = screen.getByText('Test Tag');
    expect(tagText).toBeInTheDocument();
    
    // Check the parent span has the correct classes
    const tagElement = tagText.parentElement;
    expect(tagElement).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'neutral'];
    
    variants.forEach((variant, index) => {
      const { unmount } = render(<Tag variant={variant}>{variant}</Tag>);
      const tag = screen.getByText(variant);
      expect(tag).toBeInTheDocument();
      unmount(); // Clean up for next iteration
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    sizes.forEach((size, index) => {
      const { unmount } = render(<Tag size={size}>{size}</Tag>);
      const tag = screen.getByText(size);
      expect(tag).toBeInTheDocument();
      unmount(); // Clean up for next iteration
    });
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">★</span>;
    render(
      <Tag icon={<TestIcon />}>
        Tag with Icon
      </Tag>
    );
    
    expect(screen.getByText('Tag with Icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders removable tag with remove button', () => {
    const onRemove = jest.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    expect(screen.getByText('Removable Tag')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when Delete key is pressed on removable tag', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    const tagText = screen.getByText('Removable Tag');
    const tagElement = tagText.parentElement;
    tagElement.focus();
    await user.keyboard('{Delete}');
    
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when Backspace key is pressed on removable tag', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    const tagText = screen.getByText('Removable Tag');
    const tagElement = tagText.parentElement;
    tagElement.focus();
    await user.keyboard('{Backspace}');
    
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove for other keys', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    const tagText = screen.getByText('Removable Tag');
    const tagElement = tagText.parentElement;
    tagElement.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Space}');
    await user.keyboard('{Escape}');
    
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Tag className="custom-class">Test</Tag>);
    const tagText = screen.getByText('Test');
    const tagElement = tagText.parentElement;
    expect(tagElement).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Tag ref={ref}>Test</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes through additional props', () => {
    render(<Tag data-testid="tag" title="Test title">Test</Tag>);
    const tag = screen.getByTestId('tag');
    expect(tag).toHaveAttribute('title', 'Test title');
  });

  it('has proper accessibility attributes for removable tags', () => {
    const onRemove = jest.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Accessible Tag
      </Tag>
    );
    
    const tagText = screen.getByText('Accessible Tag');
    const tagElement = tagText.parentElement;
    expect(tagElement).toHaveAttribute('role', 'button');
    expect(tagElement).toHaveAttribute('tabIndex', '0');
    expect(tagElement).toHaveAttribute('aria-label', 'Accessible Tag (removable)');
  });

  it('does not have button role for non-removable tags', () => {
    render(<Tag>Non-removable Tag</Tag>);
    
    const tagText = screen.getByText('Non-removable Tag');
    const tagElement = tagText.parentElement;
    expect(tagElement).not.toHaveAttribute('role');
    expect(tagElement).not.toHaveAttribute('tabIndex');
  });

  it('uses custom remove aria label when provided', () => {
    const onRemove = jest.fn();
    render(
      <Tag removable onRemove={onRemove} removeAriaLabel="Custom remove label">
        Tag
      </Tag>
    );
    
    const removeButton = screen.getByRole('button', { name: 'Custom remove label' });
    expect(removeButton).toBeInTheDocument();
  });

  describe('Tag variants styling', () => {
    it('applies primary variant styles correctly', () => {
      render(<Tag variant="primary">Primary</Tag>);
      const tagText = screen.getByText('Primary');
      const tagElement = tagText.parentElement;
      expect(tagElement).toHaveClass('text-[var(--interactive-primary)]');
    });

    it('applies neutral variant styles correctly', () => {
      render(<Tag variant="neutral">Neutral</Tag>);
      const tagText = screen.getByText('Neutral');
      const tagElement = tagText.parentElement;
      expect(tagElement).toHaveClass('text-[var(--text-secondary)]');
    });
  });

  describe('Tag sizes', () => {
    it('applies small size styles correctly', () => {
      render(<Tag size="sm">Small</Tag>);
      const tagText = screen.getByText('Small');
      const tagElement = tagText.parentElement;
      expect(tagElement).toHaveClass('h-6', 'px-2', 'text-xs');
    });

    it('applies medium size styles correctly', () => {
      render(<Tag size="md">Medium</Tag>);
      const tagText = screen.getByText('Medium');
      const tagElement = tagText.parentElement;
      expect(tagElement).toHaveClass('h-7', 'px-2.5', 'text-sm');
    });

    it('applies large size styles correctly', () => {
      render(<Tag size="lg">Large</Tag>);
      const tagText = screen.getByText('Large');
      const tagElement = tagText.parentElement;
      expect(tagElement).toHaveClass('h-8', 'px-3', 'text-sm');
    });
  });
});