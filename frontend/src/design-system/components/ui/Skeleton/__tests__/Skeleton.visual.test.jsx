import { render } from '@testing-library/react';
import { 
  Skeleton, 
  SkeletonVariants,
  ArtistCardSkeleton,
  StudioCardSkeleton,
  ProgressiveImage,
  StaggeredLoader
} from '../';

// Visual regression tests for Skeleton components
describe('Skeleton Visual Tests', () => {
  describe('Base Skeleton', () => {
    it('renders basic skeleton correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders skeleton with shimmer animation', () => {
      const { container } = render(
        <Skeleton className="h-20 w-full" />
      );
      
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('before:animate-[shimmer_2s_infinite]');
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Skeleton Variants', () => {
    it('renders avatar variants correctly', () => {
      const { container } = render(
        <div className="flex items-center gap-4 p-4">
          <SkeletonVariants.Avatar size="sm" />
          <SkeletonVariants.Avatar size="md" />
          <SkeletonVariants.Avatar size="lg" />
          <SkeletonVariants.Avatar size="xl" />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders text variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <SkeletonVariants.Text lines={1} />
          <SkeletonVariants.Text lines={3} />
          <SkeletonVariants.Text lines={5} />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders button variants correctly', () => {
      const { container } = render(
        <div className="flex items-center gap-4 p-4">
          <SkeletonVariants.Button size="sm" />
          <SkeletonVariants.Button size="md" />
          <SkeletonVariants.Button size="lg" />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders image variants correctly', () => {
      const { container } = render(
        <div className="grid grid-cols-2 gap-4 p-4 max-w-md">
          <SkeletonVariants.Image aspectRatio="square" />
          <SkeletonVariants.Image aspectRatio="video" />
          <SkeletonVariants.Image aspectRatio="portrait" />
          <SkeletonVariants.Image aspectRatio="landscape" />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders badge variants correctly', () => {
      const { container } = render(
        <div className="flex gap-2 p-4">
          <SkeletonVariants.Badge />
          <SkeletonVariants.Badge />
          <SkeletonVariants.Badge />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Card Skeletons', () => {
    it('renders ArtistCardSkeleton correctly', () => {
      const { container } = render(
        <div className="max-w-sm p-4">
          <ArtistCardSkeleton />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders StudioCardSkeleton correctly', () => {
      const { container } = render(
        <div className="max-w-md p-4">
          <StudioCardSkeleton />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Progressive Loading', () => {
    it('renders ProgressiveImage loading state', () => {
      const { container } = render(
        <div className="p-4">
          <ProgressiveImage
            src="https://example.com/test.jpg"
            alt="Test image"
            className="w-48 h-32 object-cover rounded"
            skeletonClassName="w-48 h-32"
          />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders StaggeredLoader correctly', () => {
      const { container } = render(
        <div className="p-4">
          <StaggeredLoader className="space-y-2">
            <div className="p-2 bg-gray-100 rounded">Item 1</div>
            <div className="p-2 bg-gray-100 rounded">Item 2</div>
            <div className="p-2 bg-gray-100 rounded">Item 3</div>
          </StaggeredLoader>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Complex Layouts', () => {
    it('renders skeleton grid layout', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-4">
                <SkeletonVariants.Avatar size="md" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <SkeletonVariants.Image aspectRatio="square" />
                <SkeletonVariants.Image aspectRatio="square" />
                <SkeletonVariants.Image aspectRatio="square" />
              </div>
              <SkeletonVariants.Button size="md" className="w-full" />
            </div>
          ))}
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders skeleton list layout', () => {
      const { container } = render(
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
              <SkeletonVariants.Avatar size="sm" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <SkeletonVariants.Button size="sm" />
            </div>
          ))}
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('renders skeleton in dark mode', () => {
      const { container } = render(
        <div className="dark bg-gray-900 p-4">
          <div className="space-y-4">
            <SkeletonVariants.Avatar size="lg" />
            <SkeletonVariants.Text lines={3} />
            <div className="flex gap-2">
              <SkeletonVariants.Badge />
              <SkeletonVariants.Badge />
            </div>
            <SkeletonVariants.Button size="md" />
          </div>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});