import { render } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Visual Tests', () => {
  const TestIcon = () => <span>★</span>;

  it('renders all badge variants correctly', () => {
    const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'outline', 'ghost'];
    
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        {variants.map(variant => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('badge-variants');
  });

  it('renders all badge sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    const { container } = render(
      <div className="flex items-center gap-2 p-4">
        {sizes.map(size => (
          <Badge key={size} size={size}>
            {size}
          </Badge>
        ))}
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('badge-sizes');
  });

  it('renders badges with icons correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Badge icon={<TestIcon />}>With Icon</Badge>
        <Badge variant="accent" icon={<TestIcon />}>Accent Icon</Badge>
        <Badge variant="outline" size="lg" icon={<TestIcon />}>Large Outline</Badge>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('badge-with-icons');
  });

  it('renders semantic color badges correctly', () => {
    const { container } = render(
      <div className="flex flex-wrap gap-2 p-4">
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('badge-semantic-colors');
  });

  it('renders badge combinations correctly', () => {
    const { container } = render(
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary" size="sm">Small Primary</Badge>
          <Badge variant="secondary" size="md">Medium Secondary</Badge>
          <Badge variant="accent" size="lg">Large Accent</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" icon={<TestIcon />}>Outline with Icon</Badge>
          <Badge variant="ghost" icon={<TestIcon />}>Ghost with Icon</Badge>
        </div>
      </div>
    );

    expect(container.firstChild).toMatchSnapshot('badge-combinations');
  });
});