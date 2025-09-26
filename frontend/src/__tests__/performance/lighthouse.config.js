/**
 * Lighthouse Performance Testing Configuration
 * Task 20: Core Web Vitals and Lighthouse score validation
 */

module.exports = {
  // Lighthouse CI configuration
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/artists',
        'http://localhost:3000/studios',
        'http://localhost:3000/styles',
        'http://localhost:3000/artists/test-artist-1',
        'http://localhost:3000/studios/test-studio-1'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        // Performance assertions
        'categories:performance': ['error', { minScore: 0.9 }], // 90+ score
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95+ score
        'categories:best-practices': ['error', { minScore: 0.85 }], // 85+ score
        'categories:seo': ['error', { minScore: 0.9 }], // 90+ score
        
        // Core Web Vitals
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8s
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'metrics:total-blocking-time': ['error', { maxNumericValue: 300 }], // 300ms
        
        // Resource optimization
        'metrics:speed-index': ['error', { maxNumericValue: 3000 }], // 3s
        'metrics:interactive': ['error', { maxNumericValue: 3800 }], // 3.8s
        
        // Specific audits
        'uses-webp-images': 'error',
        'uses-optimized-images': 'error',
        'uses-responsive-images': 'error',
        'offscreen-images': 'error',
        'render-blocking-resources': 'error',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'error',
        'efficient-animated-content': 'warn',
        'preload-lcp-image': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  },
  
  // Custom performance budgets
  budgets: [
    {
      path: '/*',
      timings: [
        {
          metric: 'first-contentful-paint',
          budget: 1800
        },
        {
          metric: 'largest-contentful-paint',
          budget: 2500
        },
        {
          metric: 'speed-index',
          budget: 3000
        },
        {
          metric: 'interactive',
          budget: 3800
        }
      ],
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 150000 // 150KB
        },
        {
          resourceType: 'stylesheet',
          budget: 50000 // 50KB
        },
        {
          resourceType: 'image',
          budget: 200000 // 200KB
        },
        {
          resourceType: 'font',
          budget: 100000 // 100KB
        },
        {
          resourceType: 'total',
          budget: 500000 // 500KB
        }
      ],
      resourceCounts: [
        {
          resourceType: 'script',
          budget: 10
        },
        {
          resourceType: 'stylesheet',
          budget: 5
        },
        {
          resourceType: 'image',
          budget: 20
        },
        {
          resourceType: 'font',
          budget: 4
        }
      ]
    }
  ],
  
  // Performance testing scenarios
  scenarios: {
    // Desktop performance
    desktop: {
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      },
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }]
      }
    },
    
    // Mobile performance
    mobile: {
      settings: {
        preset: 'perf',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      },
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }]
      }
    },
    
    // Slow 3G simulation
    slow3g: {
      settings: {
        throttling: {
          rttMs: 300,
          throughputKbps: 400,
          cpuSlowdownMultiplier: 4
        }
      },
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 4000 }]
      }
    }
  }
};