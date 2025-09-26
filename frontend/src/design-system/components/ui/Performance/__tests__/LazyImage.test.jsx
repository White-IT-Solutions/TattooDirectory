import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyImage from '../LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Image constructor
const mockImage = {
  onload: null,
  onerror: null,
  src: ''
};
global.Image = jest.fn(() => mockImage);

describe('LazyImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder initially', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    // Should show loading state initially
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('loads image when priority is true', async () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={true}
      />
    );

    // Should start loading immediately when priority is true
    expect(global.Image).toHaveBeenCalled();
  });

  it('sets up intersection observer when not priority', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={false}
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '50px',
        threshold: 0.1
      })
    );
  });

  it('handles image load success', async () => {
    const onLoad = jest.fn();
    
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={true}
        onLoad={onLoad}
      />
    );

    // Simulate successful image load
    mockImage.onload();

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('handles image load error with fallback', async () => {
    const onError = jest.fn();
    
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={true}
        onError={onError}
      />
    );

    // Simulate image load error
    mockImage.onerror();

    // Should try fallback image
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('shows error state when both WebP and fallback fail', async () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={true}
      />
    );

    // Simulate both images failing
    mockImage.onerror();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses blur placeholder by default', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="blur"
      />
    );

    // Should have blur effect
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toHaveClass('blur-sm');
  });

  it('uses skeleton placeholder when specified', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="skeleton"
      />
    );

    // Should have skeleton animation
    const placeholder = document.querySelector('.animate-pulse');
    expect(placeholder).toBeInTheDocument();
  });

  it('generates WebP URL correctly', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Should try to load WebP version first
    expect(mockImage.src).toBe('/test-image.webp');
  });

  it('handles data URLs correctly', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ';
    
    render(
      <LazyImage
        src={dataUrl}
        alt="Test image"
        priority={true}
      />
    );

    // Should use data URL as-is
    expect(mockImage.src).toBe(dataUrl);
  });

  it('sets correct aspect ratio', () => {
    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const element = container.firstChild;
    expect(element).toHaveStyle('aspect-ratio: 300/200');
  });

  it('handles sizes prop correctly', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={true}
      />
    );

    // Image should be created with sizes
    expect(global.Image).toHaveBeenCalled();
  });
});