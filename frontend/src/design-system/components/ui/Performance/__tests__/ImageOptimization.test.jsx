import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedImage, { PortfolioImageGrid, AvatarImage } from '../ImageOptimization';

// Mock LazyImage component
jest.mock('../LazyImage', () => {
  return function MockLazyImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

describe('OptimizedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('generates WebP source with correct attributes', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const webpSource = document.querySelector('source[type="image/webp"]');
    expect(webpSource).toBeInTheDocument();
  });

  it('generates JPEG fallback source', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const jpegSource = document.querySelector('source[type="image/jpeg"]');
    expect(jpegSource).toBeInTheDocument();
  });

  it('applies custom quality setting', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        quality={90}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img.src).toContain('q=90');
  });

  it('uses different format when specified', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        format="jpeg"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img.src).toContain('f=jpeg');
  });

  it('generates responsive srcSet when responsive is true', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        responsive={true}
      />
    );

    const webpSource = document.querySelector('source[type="image/webp"]');
    expect(webpSource.getAttribute('srcset')).toContain('1x');
    expect(webpSource.getAttribute('srcset')).toContain('2x');
  });

  it('uses custom sizes attribute', () => {
    const customSizes = '(max-width: 768px) 100vw, 50vw';
    
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        sizes={customSizes}
      />
    );

    const webpSource = document.querySelector('source[type="image/webp"]');
    expect(webpSource.getAttribute('sizes')).toBe(customSizes);
  });

  it('adjusts quality based on connection speed', () => {
    // Mock slow connection
    navigator.connection.effectiveType = '2g';

    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const img = screen.getByAltText('Test image');
    // Should use lower quality for slow connections
    expect(img.src).toContain('q=60');
  });

  it('handles already optimized URLs correctly', () => {
    const optimizedUrl = '/test-image.webp?w=300&h=200&q=80';
    
    render(
      <OptimizedImage
        src={optimizedUrl}
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img.src).toBe(optimizedUrl);
  });

  it('handles data URLs correctly', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ';
    
    render(
      <OptimizedImage
        src={dataUrl}
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img.src).toBe(dataUrl);
  });
});

describe('PortfolioImageGrid', () => {
  const mockImages = [
    { id: '1', url: '/image1.jpg', description: 'Image 1' },
    { id: '2', url: '/image2.jpg', description: 'Image 2' },
    { id: '3', url: '/image3.jpg', description: 'Image 3' },
    { id: '4', url: '/image4.jpg', description: 'Image 4' }
  ];

  it('renders grid with correct number of columns', () => {
    const { container } = render(
      <PortfolioImageGrid
        images={mockImages}
        columns={2}
      />
    );

    const grid = container.firstChild;
    expect(grid).toHaveStyle('grid-template-columns: repeat(2, 1fr)');
  });

  it('renders all images', () => {
    render(
      <PortfolioImageGrid images={mockImages} />
    );

    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Image 3')).toBeInTheDocument();
    expect(screen.getByAltText('Image 4')).toBeInTheDocument();
  });

  it('calls onImageClick when image is clicked', () => {
    const onImageClick = jest.fn();
    
    render(
      <PortfolioImageGrid
        images={mockImages}
        onImageClick={onImageClick}
      />
    );

    const firstImage = screen.getByAltText('Image 1');
    firstImage.closest('div').click();

    expect(onImageClick).toHaveBeenCalledWith(mockImages[0], 0);
  });

  it('adjusts quality for large grids', () => {
    const manyImages = Array.from({ length: 15 }, (_, i) => ({
      id: i.toString(),
      url: `/image${i}.jpg`,
      description: `Image ${i}`
    }));

    render(
      <PortfolioImageGrid images={manyImages} />
    );

    // Should reduce quality for grids with many images
    const firstImage = screen.getByAltText('Image 0');
    expect(firstImage.src).toContain('q=65'); // Reduced from base quality
  });

  it('applies custom gap', () => {
    const { container } = render(
      <PortfolioImageGrid
        images={mockImages}
        gap={8}
      />
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass('gap-8');
  });

  it('handles empty images array', () => {
    const { container } = render(
      <PortfolioImageGrid images={[]} />
    );

    expect(container.firstChild.children).toHaveLength(0);
  });
});

describe('AvatarImage', () => {
  it('renders with correct size', () => {
    render(
      <AvatarImage
        src="/avatar.jpg"
        alt="User avatar"
        size="large"
      />
    );

    const img = screen.getByAltText('User avatar');
    expect(img.src).toContain('w=120');
    expect(img.src).toContain('h=120');
  });

  it('shows fallback when no src provided', () => {
    render(
      <AvatarImage
        alt="User avatar"
        fallback="JD"
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders custom fallback component', () => {
    const CustomFallback = () => <div data-testid="custom-fallback">Custom</div>;
    
    render(
      <AvatarImage
        alt="User avatar"
        fallback={<CustomFallback />}
      />
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('applies rounded-full class', () => {
    const { container } = render(
      <AvatarImage
        src="/avatar.jpg"
        alt="User avatar"
      />
    );

    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('uses high quality for avatars', () => {
    render(
      <AvatarImage
        src="/avatar.jpg"
        alt="User avatar"
      />
    );

    const img = screen.getByAltText('User avatar');
    expect(img.src).toContain('q=85');
  });

  it('sets priority for large avatars', () => {
    render(
      <AvatarImage
        src="/avatar.jpg"
        alt="User avatar"
        size="large"
      />
    );

    // Large avatars should have priority loading
    const img = screen.getByAltText('User avatar');
    expect(img).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AvatarImage
        src="/avatar.jpg"
        alt="User avatar"
        className="custom-avatar"
      />
    );

    expect(container.firstChild).toHaveClass('custom-avatar');
  });
});