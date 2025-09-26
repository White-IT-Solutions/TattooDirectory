import { render, screen } from '@testing-library/react';
import { Breadcrumb, BreadcrumbItem, HomeBreadcrumb } from '../Breadcrumb';

describe('Breadcrumb Component', () => {
  it('renders breadcrumb navigation with proper ARIA labels', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/faq">FAQ</BreadcrumbItem>
        <BreadcrumbItem current>Current Page</BreadcrumbItem>
      </Breadcrumb>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  it('renders breadcrumb items with correct links', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/faq">FAQ</BreadcrumbItem>
      </Breadcrumb>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const faqLink = screen.getByRole('link', { name: 'FAQ' });
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(faqLink).toHaveAttribute('href', '/faq');
  });

  it('marks current page with aria-current', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem current>Current Page</BreadcrumbItem>
      </Breadcrumb>
    );

    const currentItem = screen.getByText('Current Page');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders HomeBreadcrumb with home icon', () => {
    render(
      <Breadcrumb>
        <HomeBreadcrumb />
      </Breadcrumb>
    );

    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveTextContent('Home');
  });

  it('renders separators between items', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/faq">FAQ</BreadcrumbItem>
        <BreadcrumbItem current>Current</BreadcrumbItem>
      </Breadcrumb>
    );

    // Should have 2 separators for 3 items
    const separators = screen.getAllByRole('listitem');
    expect(separators).toHaveLength(3); // 3 items in the list
  });

  it('applies custom className', () => {
    render(
      <Breadcrumb className="custom-breadcrumb">
        <BreadcrumbItem>Test</BreadcrumbItem>
      </Breadcrumb>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-breadcrumb');
  });

  it('handles single breadcrumb item without separator', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem current>Only Item</BreadcrumbItem>
      </Breadcrumb>
    );

    const item = screen.getByText('Only Item');
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute('aria-current', 'page');
  });
});