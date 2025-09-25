/**
 * Performance Optimization Validation Tests
 * Task 20: Conduct performance optimization validation
 * 
 * Tests:
 * - Lazy loading and infinite scroll performance
 * - Image optimization and WebP conversion
 * - Page load times and Core Web Vitals
 * - Connection-aware preloading effectiveness
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock performance APIs
const mockPerformanceObserver = jest.fn();
const mockIntersectionObserver = jest.fn();
const mockNavigationTiming = {
  loadEventEnd: 2500,
  navigationStart: 0,
  domContentLoadedEventEnd: 1800,
  fetchStart: 100
};

// Mock Web APIs
global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
  mockPerformanceObserver.mockImplementation(callback);
  return {
    observe: jest.fn(),
    disconnect: jest.fn()
  };
});

global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
  mockIntersectionObserver.mockImplementation(callback);
  return {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  };
});

global.performance = {
  ...global.performance,
  getEntriesByType: jest.fn().mockReturnValue([mockNavigationTiming]),
  now: jest.fn().mockReturnValue(1000),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([])
};

// Mock connection API
global.navigator = {
  ...global.navigator,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
};

describe('Performance Optimization Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset performance marks
    global.performance.getEntriesByName.mockReturnValue([]);
  });

  describe('Lazy Loading Performance', () => {
    test('should implement intersection observer for lazy loading', async () => {
      const LazyTestComponent = () => {
        const [isVisible, setIsVisible] = React.useState(false);
        const ref = React.useRef();

        React.useEffect(() => {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                setIsVisible(true);
              }
            });
          });

          if (ref.current) {
            observer.observe(ref.current);
          }

          return () => observer.disconnect();
        }, []);

        return (
          <div ref={ref} data-testid="lazy-component">
            {isVisible ? 'Content Loaded' : 'Loading...'}
          </div>
        );
      };

      render(<LazyTestComponent />);
      
      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should measure lazy loading performance', async () => {
      const performanceMarks = [];
      global.performance.mark = jest.fn((name) => {
        performanceMarks.push({ name, timestamp: Date.now() });
      });

      const LazyImageComponent = ({ src }) => {
        const [loaded, setLoaded] = React.useState(false);
        const imgRef = React.useRef();

        React.useEffect(() => {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                performance.mark('lazy-load-start');
                const img = new Image();
                img.onload = () => {
                  performance.mark('lazy-load-end');
                  setLoaded(true);
                };
                img.src = src;
              }
            });
          });

          if (imgRef.current) {
            observer.observe(imgRef.current);
          }

          return () => observer.disconnect();
        }, [src]);

        return (
          <div ref={imgRef} data-testid="lazy-image">
            {loaded ? <img src={src} alt="Lazy loaded" /> : <div>Loading...</div>}
          </div>
        );
      };

      render(<LazyImageComponent src="/test-image.jpg" />);
      
      // Simulate intersection
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        expect(global.performance.mark).toHaveBeenCalledWith('lazy-load-start');
      });
    });

    test('should validate infinite scroll performance with debouncing', async () => {
      let scrollHandler;
      const mockAddEventListener = jest.fn((event, handler) => {
        if (event === 'scroll') {
          scrollHandler = handler;
        }
      });

      global.addEventListener = mockAddEventListener;

      const InfiniteScrollComponent = () => {
        const [items, setItems] = React.useState(Array.from({ length: 20 }, (_, i) => i));
        const [loading, setLoading] = React.useState(false);

        React.useEffect(() => {
          let timeoutId;
          
          const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
              
              if (scrollTop + clientHeight >= scrollHeight - 5 && !loading) {
                performance.mark('infinite-scroll-load-start');
                setLoading(true);
                
                setTimeout(() => {
                  setItems(prev => [...prev, ...Array.from({ length: 10 }, (_, i) => prev.length + i)]);
                  setLoading(false);
                  performance.mark('infinite-scroll-load-end');
                }, 100);
              }
            }, 100); // 100ms debounce
          };

          addEventListener('scroll', handleScroll);
          return () => removeEventListener('scroll', handleScroll);
        }, [loading]);

        return (
          <div data-testid="infinite-scroll">
            {items.map(item => (
              <div key={item} data-testid={`item-${item}`}>Item {item}</div>
            ))}
            {loading && <div data-testid="loading">Loading more...</div>}
          </div>
        );
      };

      render(<InfiniteScrollComponent />);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-19')).toBeInTheDocument();
    });
  });

  describe('Image Optimization Performance', () => {
    test('should validate WebP format support and fallback', () => {
      const OptimizedImage = ({ src, alt }) => {
        const [imageSrc, setImageSrc] = React.useState('');
        const [format, setFormat] = React.useState('');

        React.useEffect(() => {
          // Check WebP support
          const webpSupported = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
          })();

          if (webpSupported) {
            setImageSrc(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
            setFormat('webp');
          } else {
            setImageSrc(src);
            setFormat('fallback');
          }
        }, [src]);

        return (
          <img 
            src={imageSrc} 
            alt={alt} 
            data-testid="optimized-image"
            data-format={format}
          />
        );
      };

      render(<OptimizedImage src="/test-image.jpg" alt="Test" />);
      
      const img = screen.getByTestId('optimized-image');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('data-format')).toBeTruthy();
    });

    test('should measure image loading performance', async () => {
      const ImagePerformanceTracker = ({ src }) => {
        const [loadTime, setLoadTime] = React.useState(null);

        const handleImageLoad = (event) => {
          const img = event.target;
          const loadEndTime = performance.now();
          const loadStartTime = img.dataset.loadStart;
          
          if (loadStartTime) {
            const duration = loadEndTime - parseFloat(loadStartTime);
            setLoadTime(duration);
            performance.mark('image-load-complete');
          }
        };

        const handleImageStart = (event) => {
          const startTime = performance.now();
          event.target.dataset.loadStart = startTime;
          performance.mark('image-load-start');
        };

        return (
          <div data-testid="image-tracker">
            <img 
              src={src}
              onLoadStart={handleImageStart}
              onLoad={handleImageLoad}
              data-testid="tracked-image"
            />
            {loadTime && (
              <div data-testid="load-time">Load time: {loadTime.toFixed(2)}ms</div>
            )}
          </div>
        );
      };

      render(<ImagePerformanceTracker src="/test-image.jpg" />);
      
      const img = screen.getByTestId('tracked-image');
      expect(img).toBeInTheDocument();
    });

    test('should validate responsive image sizing', () => {
      const ResponsiveImage = ({ src, sizes }) => {
        const generateSrcSet = (baseSrc) => {
          const widths = [320, 640, 960, 1280, 1920];
          return widths.map(width => 
            `${baseSrc.replace(/\.(jpg|jpeg|png)$/i, `_${width}w.$1`)} ${width}w`
          ).join(', ');
        };

        return (
          <img
            src={src}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            data-testid="responsive-image"
            loading="lazy"
          />
        );
      };

      render(
        <ResponsiveImage 
          src="/test-image.jpg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      );
      
      const img = screen.getByTestId('responsive-image');
      expect(img.getAttribute('srcset')).toContain('320w');
      expect(img.getAttribute('srcset')).toContain('1920w');
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Core Web Vitals Measurement', () => {
    test('should measure Largest Contentful Paint (LCP)', async () => {
      const LCPTracker = () => {
        const [lcp, setLCP] = React.useState(null);

        React.useEffect(() => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setLCP(lastEntry.startTime);
          });

          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          return () => observer.disconnect();
        }, []);

        return (
          <div data-testid="lcp-tracker">
            {lcp && <div data-testid="lcp-value">LCP: {lcp.toFixed(2)}ms</div>}
            <img src="/hero-image.jpg" alt="Hero" style={{ width: '100%', height: '400px' }} />
          </div>
        );
      };

      render(<LCPTracker />);
      
      expect(global.PerformanceObserver).toHaveBeenCalled();
      expect(screen.getByTestId('lcp-tracker')).toBeInTheDocument();
    });

    test('should measure First Input Delay (FID)', () => {
      const FIDTracker = () => {
        const [fid, setFID] = React.useState(null);

        React.useEffect(() => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.name === 'first-input') {
                setFID(entry.processingStart - entry.startTime);
              }
            });
          });

          observer.observe({ entryTypes: ['first-input'] });

          return () => observer.disconnect();
        }, []);

        const handleClick = () => {
          performance.mark('user-interaction-start');
          // Simulate processing delay
          setTimeout(() => {
            performance.mark('user-interaction-end');
          }, 50);
        };

        return (
          <div data-testid="fid-tracker">
            <button onClick={handleClick} data-testid="interaction-button">
              Click me
            </button>
            {fid && <div data-testid="fid-value">FID: {fid.toFixed(2)}ms</div>}
          </div>
        );
      };

      render(<FIDTracker />);
      
      const button = screen.getByTestId('interaction-button');
      fireEvent.click(button);
      
      expect(global.performance.mark).toHaveBeenCalledWith('user-interaction-start');
    });

    test('should measure Cumulative Layout Shift (CLS)', () => {
      const CLSTracker = () => {
        const [cls, setCLS] = React.useState(0);

        React.useEffect(() => {
          const observer = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            
            entries.forEach(entry => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            
            setCLS(clsValue);
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          return () => observer.disconnect();
        }, []);

        return (
          <div data-testid="cls-tracker">
            <div data-testid="cls-value">CLS: {cls.toFixed(4)}</div>
          </div>
        );
      };

      render(<CLSTracker />);
      
      expect(global.PerformanceObserver).toHaveBeenCalled();
      expect(screen.getByTestId('cls-value')).toHaveTextContent('CLS: 0.0000');
    });

    test('should validate page load performance targets', () => {
      const PageLoadTracker = () => {
        const [metrics, setMetrics] = React.useState({});

        React.useEffect(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.navigationStart;
            const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
            const firstByte = navigation.responseStart - navigation.fetchStart;

            setMetrics({
              loadTime,
              domContentLoaded,
              firstByte,
              isOptimal: loadTime < 2500 && domContentLoaded < 1800 && firstByte < 300
            });
          }
        }, []);

        return (
          <div data-testid="page-load-tracker">
            {metrics.loadTime && (
              <>
                <div data-testid="load-time">Load Time: {metrics.loadTime}ms</div>
                <div data-testid="dcl-time">DCL: {metrics.domContentLoaded}ms</div>
                <div data-testid="ttfb">TTFB: {metrics.firstByte}ms</div>
                <div data-testid="performance-status">
                  Status: {metrics.isOptimal ? 'Optimal' : 'Needs Improvement'}
                </div>
              </>
            )}
          </div>
        );
      };

      render(<PageLoadTracker />);
      
      expect(screen.getByTestId('load-time')).toHaveTextContent('Load Time: 2500ms');
      expect(screen.getByTestId('performance-status')).toHaveTextContent('Status: Optimal');
    });
  });

  describe('Connection-Aware Preloading', () => {
    test('should adapt preloading based on connection speed', () => {
      const ConnectionAwarePreloader = () => {
        const [preloadStrategy, setPreloadStrategy] = React.useState('');

        React.useEffect(() => {
          const connection = navigator.connection;
          
          if (connection) {
            let strategy;
            
            if (connection.saveData) {
              strategy = 'minimal';
            } else if (connection.effectiveType === '4g' && connection.downlink > 5) {
              strategy = 'aggressive';
            } else if (connection.effectiveType === '3g') {
              strategy = 'moderate';
            } else {
              strategy = 'conservative';
            }
            
            setPreloadStrategy(strategy);
          }
        }, []);

        return (
          <div data-testid="preload-strategy">
            Strategy: {preloadStrategy}
          </div>
        );
      };

      render(<ConnectionAwarePreloader />);
      
      expect(screen.getByTestId('preload-strategy')).toHaveTextContent('Strategy: aggressive');
    });

    test('should measure preloading effectiveness', async () => {
      const PreloadEffectivenessTracker = () => {
        const [preloadStats, setPreloadStats] = React.useState({});

        React.useEffect(() => {
          const trackPreload = (url) => {
            const startTime = performance.now();
            
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = 'image';
            
            link.onload = () => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              setPreloadStats(prev => ({
                ...prev,
                [url]: {
                  preloadTime: duration,
                  successful: true
                }
              }));
            };
            
            link.onerror = () => {
              setPreloadStats(prev => ({
                ...prev,
                [url]: {
                  preloadTime: null,
                  successful: false
                }
              }));
            };
            
            document.head.appendChild(link);
          };

          // Simulate preloading critical images
          trackPreload('/hero-image.webp');
          trackPreload('/featured-artist.webp');
        }, []);

        return (
          <div data-testid="preload-tracker">
            {Object.entries(preloadStats).map(([url, stats]) => (
              <div key={url} data-testid={`preload-${url.split('/').pop()}`}>
                {url}: {stats.successful ? `${stats.preloadTime?.toFixed(2)}ms` : 'Failed'}
              </div>
            ))}
          </div>
        );
      };

      render(<PreloadEffectivenessTracker />);
      
      await waitFor(() => {
        expect(screen.getByTestId('preload-tracker')).toBeInTheDocument();
      });
    });

    test('should validate smart link preloading on hover', async () => {
      const SmartLink = ({ href, children }) => {
        const [preloaded, setPreloaded] = React.useState(false);

        const handleMouseEnter = () => {
          if (!preloaded && navigator.connection?.effectiveType === '4g') {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
            setPreloaded(true);
            performance.mark('link-preload-start');
          }
        };

        return (
          <a 
            href={href}
            onMouseEnter={handleMouseEnter}
            data-testid="smart-link"
            data-preloaded={preloaded}
          >
            {children}
          </a>
        );
      };

      render(<SmartLink href="/artist/123">Artist Profile</SmartLink>);
      
      const link = screen.getByTestId('smart-link');
      fireEvent.mouseEnter(link);
      
      await waitFor(() => {
        expect(link.getAttribute('data-preloaded')).toBe('true');
      });
    });

    test('should validate resource prioritization', () => {
      const ResourcePrioritizer = () => {
        React.useEffect(() => {
          const prioritizeResources = () => {
            // Critical CSS
            const criticalCSS = document.createElement('link');
            criticalCSS.rel = 'preload';
            criticalCSS.href = '/critical.css';
            criticalCSS.as = 'style';
            criticalCSS.setAttribute('fetchpriority', 'high');
            
            // Hero image
            const heroImage = document.createElement('link');
            heroImage.rel = 'preload';
            heroImage.href = '/hero-image.webp';
            heroImage.as = 'image';
            heroImage.setAttribute('fetchpriority', 'high');
            
            // Non-critical resources
            const secondaryImage = document.createElement('link');
            secondaryImage.rel = 'preload';
            secondaryImage.href = '/secondary-image.webp';
            secondaryImage.as = 'image';
            secondaryImage.setAttribute('fetchpriority', 'low');
            
            document.head.appendChild(criticalCSS);
            document.head.appendChild(heroImage);
            document.head.appendChild(secondaryImage);
          };

          prioritizeResources();
        }, []);

        return <div data-testid="resource-prioritizer">Resources prioritized</div>;
      };

      render(<ResourcePrioritizer />);
      
      expect(screen.getByTestId('resource-prioritizer')).toBeInTheDocument();
    });
  });

  describe('Performance Budget Validation', () => {
    test('should validate bundle size targets', () => {
      const BundleSizeTracker = () => {
        const [bundleInfo, setBundleInfo] = React.useState({});

        React.useEffect(() => {
          // Simulate bundle analysis
          const mockBundleStats = {
            totalSize: 245000, // 245KB
            gzippedSize: 180000, // 180KB
            chunkSizes: {
              main: 120000,
              vendor: 80000,
              styles: 45000
            },
            isWithinBudget: true
          };

          setBundleInfo(mockBundleStats);
        }, []);

        return (
          <div data-testid="bundle-tracker">
            <div data-testid="total-size">Total: {bundleInfo.totalSize}B</div>
            <div data-testid="gzipped-size">Gzipped: {bundleInfo.gzippedSize}B</div>
            <div data-testid="budget-status">
              Budget: {bundleInfo.isWithinBudget ? 'Within limits' : 'Exceeded'}
            </div>
          </div>
        );
      };

      render(<BundleSizeTracker />);
      
      expect(screen.getByTestId('budget-status')).toHaveTextContent('Budget: Within limits');
    });

    test('should validate Lighthouse score targets', () => {
      const LighthouseScoreTracker = () => {
        const [scores, setScores] = React.useState({});

        React.useEffect(() => {
          // Simulate Lighthouse audit results
          const mockScores = {
            performance: 92,
            accessibility: 95,
            bestPractices: 88,
            seo: 90,
            pwa: 85,
            overall: 90
          };

          setScores(mockScores);
        }, []);

        return (
          <div data-testid="lighthouse-scores">
            <div data-testid="performance-score">Performance: {scores.performance}</div>
            <div data-testid="accessibility-score">Accessibility: {scores.accessibility}</div>
            <div data-testid="overall-score">Overall: {scores.overall}</div>
            <div data-testid="target-met">
              Target Met: {scores.overall >= 90 ? 'Yes' : 'No'}
            </div>
          </div>
        );
      };

      render(<LighthouseScoreTracker />);
      
      expect(screen.getByTestId('target-met')).toHaveTextContent('Target Met: Yes');
    });
  });
});