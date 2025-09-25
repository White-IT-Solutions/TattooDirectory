import { render } from '@testing-library/react';
import Tag from '../Tag';

describe('Tag Visual Tests', () => {
  const TestIcon = () => <span>🏷️</span>;
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  it('renders all tag variants correctly', () => {
    const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'neutral'];
    
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        {variants.map(variant => (
          <Tag key={variant} variant={variant}>
            {variant}
          </Tag>
        ))}
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-variants');
  });

  it('renders all tag sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    const { container } = render(
      <div className="flex items-center gap-2 p-4">
        {sizes.map(size => (
          <Tag key={size} size={size}>
            {size}
          </Tag>
        ))}
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-sizes');
  });

  it('renders tags with icons correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Tag icon={<TestIcon />}>With Icon</Tag>
        <Tag variant="accent" icon={<TestIcon />}>Accent Icon</Tag>
        <Tag variant="success" size="lg" icon={<TestIcon />}>Large Success</Tag>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-with-icons');
  });

  it('renders removable tags correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Tag removable onRemove={mockOnRemove}>Removable</Tag>
        <Tag variant="accent" removable onRemove={mockOnRemove}>Accent Removable</Tag>
        <Tag variant="success" size="lg" removable onRemove={mockOnRemove}>Large Removable</Tag>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-removable');
  });

  it('renders tags with icons and remove buttons correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Tag icon={<TestIcon />} removable onRemove={mockOnRemove}>
          Icon + Remove
        </Tag>
        <Tag variant="warning" icon={<TestIcon />} removable onRemove={mockOnRemove}>
          Warning Icon
        </Tag>
        <Tag variant="error" size="sm" icon={<TestIcon />} removable onRemove={mockOnRemove}>
          Small Error
        </Tag>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-icon-removable');
  });

  it('renders semantic color tags correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Tag variant="success">Success</Tag>
        <Tag variant="warning">Warning</Tag>
        <Tag variant="error">Error</Tag>
        <Tag variant="neutral">Neutral</Tag>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-semantic-colors');
  });

  it('renders tag filter examples correctly', () => {
    const { container } = render(
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Style Filters</h3>
          <div className="flex flex-wrap gap-2">
            <Tag variant="primary" removable onRemove={mockOnRemove}>Traditional</Tag>
            <Tag variant="primary" removable onRemove={mockOnRemove}>Realism</Tag>
            <Tag variant="primary" removable onRemove={mockOnRemove}>Blackwork</Tag>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Location Filters</h3>
          <div className="flex flex-wrap gap-2">
            <Tag variant="accent" removable onRemove={mockOnRemove}>London</Tag>
            <Tag variant="accent" removable onRemove={mockOnRemove}>Manchester</Tag>
            <Tag variant="accent" removable onRemove={mockOnRemove}>Birmingham</Tag>
          </div>
        </div>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-filter-examples');
  });

  it('renders tag combinations correctly', () => {
    const { container } = render(
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Tag variant="primary" size="sm">Small Primary</Tag>
          <Tag variant="secondary" size="md">Medium Secondary</Tag>
          <Tag variant="accent" size="lg">Large Accent</Tag>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag variant="success" icon={<TestIcon />}>Success with Icon</Tag>
          <Tag variant="warning" icon={<TestIcon />} removable onRemove={mockOnRemove}>
            Warning Removable
          </Tag>
        </div>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('tag-combinations');
  });
});