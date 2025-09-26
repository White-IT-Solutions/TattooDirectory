// Performance Optimization Components
export { default as LazyImage } from './LazyImage';
export { default as InfiniteScroll, useInfiniteScroll } from './InfiniteScroll';
export { 
  default as OptimizedImage, 
  PortfolioImageGrid, 
  AvatarImage 
} from './ImageOptimization';
export {
  SmartLink,
  PortfolioPreloader,
  CriticalResourcePreloader,
  useImagePreloader,
  useRoutePreloader,
  useConnectionAwarePreloading,
  useViewportPreloader,
  usePredictivePreloader
} from './Preloader';
export {
  CriticalPathOptimizer,
  LazyComponentLoader,
  useCriticalCSS,
  useResourcePriority,
  useProgressiveEnhancement,
  usePerformanceMetrics,
  usePerformanceBudget
} from './CriticalRenderingPath';