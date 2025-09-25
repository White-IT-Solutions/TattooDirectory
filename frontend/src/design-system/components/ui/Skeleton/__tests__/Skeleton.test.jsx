import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonVariants } from '../Skeleton';

describe('Skeleton Component', () => {
  it('renders with default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-neutral-200');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveClass('custom-class');
  });

  it('forwards props correctly', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading content" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });
});

describe('SkeletonVariants', () => {
  describe('Avatar', () => {
    it('renders with default medium size', () => {
      render(<SkeletonVariants.Avatar data-testid="avatar-skeleton" />);
      const avatar = screen.getByTestId('avatar-skeleton');
      
      expect(avatar).toHaveClass('h-20', 'w-20', 'rounded-full');
    });

    it('renders with different sizes', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'];
      const expectedClasses = ['h-8 w-8', 'h-20 w-20', 'h-24 w-24', 'h-32 w-32'];
      
      sizes.forEach((size, index) => {
        const { unmount } = render(
          <SkeletonVariants.Avatar size={size} data-testid={`avatar-${size}`} />
        );
        const avatar = screen.getByTestId(`avatar-${size}`);
        
        expectedClasses[index].split(' ').forEach(cls => {
          expect(avatar).toHaveClass(cls);
        });
        
        unmount();
      });
    });
  });

  describe('Text', () => {
    it('renders single line by default', () => {
      render(<SkeletonVariants.Text data-testid="text-skeleton" />);
      const text = screen.getByTestId('text-skeleton');
      
      expect(text).toHaveClass('h-4', 'w-full');
    });

    it('renders multiple lines', () => {
      const { container } = render(<SkeletonVariants.Text lines={3} />);
      const wrapper = container.firstChild;
      const lines = wrapper.querySelectorAll('div');
      
      expect(lines).toHaveLength(3);
      expect(lines[2]).toHaveClass('w-3/4'); // Last line shorter
    });
  });

  describe('Button', () => {
    it('renders with default medium size', () => {
      render(<SkeletonVariants.Button data-testid="button-skeleton" />);
      const button = screen.getByTestId('button-skeleton');
      
      expect(button).toHaveClass('h-10', 'w-24', 'rounded-lg');
    });

    it('renders with different sizes', () => {
      const sizes = ['sm', 'md', 'lg'];
      const expectedClasses = ['h-8 w-20', 'h-10 w-24', 'h-12 w-32'];
      
      sizes.forEach((size, index) => {
        const { unmount } = render(
          <SkeletonVariants.Button size={size} data-testid={`button-${size}`} />
        );
        const button = screen.getByTestId(`button-${size}`);
        
        expectedClasses[index].split(' ').forEach(cls => {
          expect(button).toHaveClass(cls);
        });
        
        unmount();
      });
    });
  });

  describe('Image', () => {
    it('renders with square aspect ratio by default', () => {
      render(<SkeletonVariants.Image data-testid="image-skeleton" />);
      const image = screen.getByTestId('image-skeleton');
      
      expect(image).toHaveClass('aspect-square', 'w-full', 'rounded-md');
    });

    it('renders with different aspect ratios', () => {
      const ratios = ['square', 'video', 'portrait', 'landscape'];
      const expectedClasses = ['aspect-square', 'aspect-video', 'aspect-[3/4]', 'aspect-[4/3]'];
      
      ratios.forEach((ratio, index) => {
        const { unmount } = render(
          <SkeletonVariants.Image aspectRatio={ratio} data-testid={`image-${ratio}`} />
        );
        const image = screen.getByTestId(`image-${ratio}`);
        
        expect(image).toHaveClass(expectedClasses[index]);
        
        unmount();
      });
    });
  });

  describe('Badge', () => {
    it('renders with correct classes', () => {
      render(<SkeletonVariants.Badge data-testid="badge-skeleton" />);
      const badge = screen.getByTestId('badge-skeleton');
      
      expect(badge).toHaveClass('h-6', 'w-16', 'rounded-full');
    });
  });
});