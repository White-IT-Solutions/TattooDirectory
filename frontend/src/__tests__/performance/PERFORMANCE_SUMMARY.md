# Performance Optimization Validation Report

## Summary

- **Overall Score**: 89% (Grade: B)
- **Total Tests**: 9
- **Passed**: 8 ✓
- **Failed**: 1 ✗
- **Warnings**: 0 ⚠

## Test Results

### Jest Performance Tests

- **Status**: Failed
- **Passed**: 0
- **Failed**: 1
- **Error**: Command failed: npm test -- --testPathPattern=performance --verbose --coverage=false
(node:31468) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/__tests__/performance/lighthouse.config.js
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (../node_modules/@jest/core/build/TestScheduler.js:133:18)
      at ../node_modules/@jest/core/build/TestScheduler.js:254:19
      at ../node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (../node_modules/emittery/index.js:361:23)

(node:50968) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/__tests__/performance/performanceUtils.js
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (../node_modules/@jest/core/build/TestScheduler.js:133:18)
      at ../node_modules/@jest/core/build/TestScheduler.js:254:19
      at ../node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (../node_modules/emittery/index.js:361:23)

(node:49156) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/__tests__/performance/runPerformanceTests.js
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (../node_modules/@jest/core/build/TestScheduler.js:133:18)
      at ../node_modules/@jest/core/build/TestScheduler.js:254:19
      at ../node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (../node_modules/emittery/index.js:361:23)

(node:54560) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/__tests__/performance/PerformanceMonitor.jsx
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (../node_modules/@jest/core/build/TestScheduler.js:133:18)
      at ../node_modules/@jest/core/build/TestScheduler.js:254:19
      at ../node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (../node_modules/emittery/index.js:361:23)

(node:17084) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621
        const promise = requestFn().finally(()=>{
                                   ^

TypeError: Cannot read properties of undefined (reading 'finally')
    at RequestDeduplicator.execute (C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621:36)
    at Object.execute (C:\dev\Tattoo_MVP\frontend\src\lib\__tests__\performance-utils.test.js:188:20)
    at Promise.then.completed (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:316:40)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at _runTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:444:34)
    at Object.worker (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\testWorker.js:106:12)

Node.js v21.7.1
(node:22912) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:52496) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:20872) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/__tests__/performance/PerformanceValidation.test.jsx
  Performance Optimization Validation
    Lazy Loading Performance
      × should implement intersection observer for lazy loading (8 ms)
      × should measure lazy loading performance (1 ms)
      × should validate infinite scroll performance with debouncing (1 ms)
    Image Optimization Performance
      × should validate WebP format support and fallback
      × should measure image loading performance (1 ms)
      × should validate responsive image sizing (1 ms)
    Core Web Vitals Measurement
      × should measure Largest Contentful Paint (LCP)
      × should measure First Input Delay (FID)
      × should measure Cumulative Layout Shift (CLS) (1 ms)
      × should validate page load performance targets
    Connection-Aware Preloading
      × should adapt preloading based on connection speed
      × should measure preloading effectiveness (1 ms)
      × should validate smart link preloading on hover
      × should validate resource prioritization
    Performance Budget Validation
      × should validate bundle size targets
      × should validate Lighthouse score targets

  ● Performance Optimization Validation › Lazy Loading Performance › should implement intersection observer for lazy loading

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Lazy Loading Performance › should measure lazy loading performance

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Lazy Loading Performance › should validate infinite scroll performance with debouncing

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Image Optimization Performance › should validate WebP format support and fallback

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Image Optimization Performance › should measure image loading performance

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Image Optimization Performance › should validate responsive image sizing

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Core Web Vitals Measurement › should measure Largest Contentful Paint (LCP)

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Core Web Vitals Measurement › should measure First Input Delay (FID)

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Core Web Vitals Measurement › should measure Cumulative Layout Shift (CLS)

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Core Web Vitals Measurement › should validate page load performance targets

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Connection-Aware Preloading › should adapt preloading based on connection speed

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Connection-Aware Preloading › should measure preloading effectiveness

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Connection-Aware Preloading › should validate smart link preloading on hover

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Connection-Aware Preloading › should validate resource prioritization

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Performance Budget Validation › should validate bundle size targets

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

  ● Performance Optimization Validation › Performance Budget Validation › should validate Lighthouse score targets

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 66 |[39m     jest[33m.[39mclearAllMocks()[33m;[39m
     [90m 67 |[39m     [90m// Reset performance marks[39m
    [31m[1m>[22m[39m[90m 68 |[39m     global[33m.[39mperformance[33m.[39mgetEntriesByName[33m.[39mmockReturnValue([])[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 69 |[39m   })[33m;[39m
     [90m 70 |[39m
     [90m 71 |[39m   describe([32m'Lazy Loading Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.mockReturnValue (src/__tests__/performance/PerformanceValidation.test.jsx:68:41)

FAIL src/__tests__/search-functionality/SearchPerformance.test.js
  ● Test suite failed to run

    ReferenceError: Cannot access 'createMockApiWithDelay' before initialization

    [0m [90m 74 |[39m
     [90m 75 |[39m jest[33m.[39mmock([32m'../../lib/api'[39m[33m,[39m () [33m=>[39m ({
    [31m[1m>[22m[39m[90m 76 |[39m   api[33m:[39m createMockApiWithDelay([35m50[39m) [90m// Default 50ms delay[39m
     [90m    |[39m        [31m[1m^[22m[39m
     [90m 77 |[39m }))[33m;[39m
     [90m 78 |[39m
     [90m 79 |[39m describe([32m'Search Performance Tests'[39m[33m,[39m () [33m=>[39m {[0m

      at createMockApiWithDelay (src/__tests__/search-functionality/SearchPerformance.test.js:76:8)
      at Object.<anonymous> (src/lib/search-controller.js:37:14)
      at Object.<anonymous> (src/__tests__/search-functionality/SearchPerformance.test.js:39:27)

(node:21812) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:25056) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/design-system/components/ui/Performance/__tests__/ImageOptimization.test.jsx
  OptimizedImage
    √ renders with basic props (171 ms)
    √ generates WebP source with correct attributes (13 ms)
    √ generates JPEG fallback source (11 ms)
    √ applies custom quality setting (12 ms)
    √ uses different format when specified (10 ms)
    √ generates responsive srcSet when responsive is true (7 ms)
    √ uses custom sizes attribute (7 ms)
    √ adjusts quality based on connection speed (8 ms)
    × handles already optimized URLs correctly (12 ms)
    √ handles data URLs correctly (10 ms)
  PortfolioImageGrid
    × renders grid with correct number of columns (19 ms)
    √ renders all images (15 ms)
    √ calls onImageClick when image is clicked (22 ms)
    × adjusts quality for large grids (48 ms)
    √ applies custom gap (24 ms)
    √ handles empty images array (3 ms)
  AvatarImage
    √ renders with correct size (6 ms)
    √ shows fallback when no src provided (41 ms)
    √ renders custom fallback component (12 ms)
    √ applies rounded-full class (7 ms)
    √ uses high quality for avatars (12 ms)
    √ sets priority for large avatars (5 ms)
    √ applies custom className (6 ms)

  ● OptimizedImage › handles already optimized URLs correctly

    expect(received).toBe(expected) // Object.is equality

    Expected: "/test-image.webp?w=300&h=200&q=80"
    Received: "http://localhost/test-image.webp?w=300&h=200&q=80"

    [0m [90m 161 |[39m
     [90m 162 |[39m     [36mconst[39m img [33m=[39m screen[33m.[39mgetByAltText([32m'Test image'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 163 |[39m     expect(img[33m.[39msrc)[33m.[39mtoBe(optimizedUrl)[33m;[39m
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 164 |[39m   })[33m;[39m
     [90m 165 |[39m
     [90m 166 |[39m   it([32m'handles data URLs correctly'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toBe (src/design-system/components/ui/Performance/__tests__/ImageOptimization.test.jsx:163:21)

  ● PortfolioImageGrid › renders grid with correct number of columns

    expect(element).toHaveStyle()

    - Expected
    + Received

    - grid-template-columns: repeat(2, 1fr);

    [0m [90m 198 |[39m
     [90m 199 |[39m     [36mconst[39m grid [33m=[39m container[33m.[39mfirstChild[33m;[39m
    [31m[1m>[22m[39m[90m 200 |[39m     expect(grid)[33m.[39mtoHaveStyle([32m'grid-template-columns: repeat(2, 1fr)'[39m)[33m;[39m
     [90m     |[39m                  [31m[1m^[22m[39m
     [90m 201 |[39m   })[33m;[39m
     [90m 202 |[39m
     [90m 203 |[39m   it([32m'renders all images'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveStyle (src/design-system/components/ui/Performance/__tests__/ImageOptimization.test.jsx:200:18)

  ● PortfolioImageGrid › adjusts quality for large grids

    expect(received).toContain(expected) // indexOf

    Expected substring: "q=65"
    Received string:    "http://localhost/image0.jpg?w=300&h=300&q=50&f=webp&fit=cover"

    [0m [90m 241 |[39m     [90m// Should reduce quality for grids with many images[39m
     [90m 242 |[39m     [36mconst[39m firstImage [33m=[39m screen[33m.[39mgetByAltText([32m'Image 0'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 243 |[39m     expect(firstImage[33m.[39msrc)[33m.[39mtoContain([32m'q=65'[39m)[33m;[39m [90m// Reduced from base quality[39m
     [90m     |[39m                            [31m[1m^[22m[39m
     [90m 244 |[39m   })[33m;[39m
     [90m 245 |[39m
     [90m 246 |[39m   it([32m'applies custom gap'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toContain (src/design-system/components/ui/Performance/__tests__/ImageOptimization.test.jsx:243:28)

(node:43164) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
FAIL src/design-system/components/ui/Performance/__tests__/LazyImage.test.jsx
  LazyImage
    √ renders with placeholder initially (78 ms)
    √ loads image when priority is true (22 ms)
    √ sets up intersection observer when not priority (21 ms)
    √ handles image load success (143 ms)
    √ handles image load error with fallback (4 ms)
    × shows error state when both WebP and fallback fail (1024 ms)
    √ applies custom className (3 ms)
    √ uses blur placeholder by default (4 ms)
    √ uses skeleton placeholder when specified (6 ms)
    √ generates WebP URL correctly (3 ms)
    √ handles data URLs correctly (3 ms)
    × sets correct aspect ratio (6 ms)
    √ handles sizes prop correctly (3 ms)

  ● LazyImage › shows error state when both WebP and fallback fail

    Unable to find an element with the text: Failed to load. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"relative overflow-hidden bg-neutral-100"[39m
          [33mstyle[39m=[32m"width: 300px; height: 200px;"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"absolute inset-0 flex items-center justify-center"[39m
          [36m>[39m
            [36m<img[39m
              [33malt[39m=[32m""[39m
              [33mclass[39m=[32m"w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"[39m
              [33msrc[39m=[32m"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCA0MCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="[39m
              [33mstyle[39m=[32m"opacity: 1;"[39m
            [36m/>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 132 |[39m     mockImage[33m.[39monerror()[33m;[39m
     [90m 133 |[39m     
    [31m[1m>[22m[39m[90m 134 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
     [90m     |[39m                  [31m[1m^[22m[39m
     [90m 135 |[39m       expect(screen[33m.[39mgetByText([32m'Failed to load'[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m 136 |[39m     })[33m;[39m
     [90m 137 |[39m   })[33m;[39m[0m

      at waitForWrapper (../node_modules/@testing-library/dom/dist/wait-for.js:163:27)
      at Object.<anonymous> (src/design-system/components/ui/Performance/__tests__/LazyImage.test.jsx:134:18)

  ● LazyImage › sets correct aspect ratio

    expect(element).toHaveStyle()

    - Expected
    + Received

    - aspect-ratio: 300/200;

    [0m [90m 216 |[39m
     [90m 217 |[39m     [36mconst[39m element [33m=[39m container[33m.[39mfirstChild[33m;[39m
    [31m[1m>[22m[39m[90m 218 |[39m     expect(element)[33m.[39mtoHaveStyle([32m'aspect-ratio: 300/200'[39m)[33m;[39m
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 219 |[39m   })[33m;[39m
     [90m 220 |[39m
     [90m 221 |[39m   it([32m'handles sizes prop correctly'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveStyle (src/design-system/components/ui/Performance/__tests__/LazyImage.test.jsx:218:21)

FAIL src/app/components/__tests__/PerformanceOptimizationIntegration.test.jsx
  PerformanceOptimizationIntegration
    Component Rendering
      √ renders performance optimized artist cards (120 ms)
      √ renders loading skeleton on server-side (30 ms)
      √ displays connection status in development mode (59 ms)
    LazyImage Integration
      √ uses LazyImage with WebP optimization (38 ms)
      √ prioritizes above-the-fold images (75 ms)
    InfiniteScroll Integration
      √ implements infinite scroll with debouncing (31 ms)
      × handles loading states properly (41 ms)
      × handles error states with retry (45 ms)
    OptimizedImage Integration
      √ uses responsive sizing and quality adjustment (54 ms)
    SmartLink Integration
      √ implements hover preloading (34 ms)
      × preloads routes on hover (1057 ms)
    Portfolio Integration
      √ renders portfolio image grids with lazy loading (23 ms)
      √ handles portfolio image clicks (21 ms)
    Connection Awareness
      √ adapts behavior based on connection speed (20 ms)
    Performance Metrics
      √ displays performance metrics in development mode (23 ms)
      × provides reset functionality (29 ms)
    Accessibility
      √ provides proper alt text for images (15 ms)
      √ provides fallback content for avatars (15 ms)
    Different Page Types
      √ adapts to studios page type (11 ms)
      √ adapts to styles page type (16 ms)

  ● PerformanceOptimizationIntegration › InfiniteScroll Integration › handles loading states properly

    TestingLibraryElementError: Unable to find an element by: [data-testid="loading"]

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"performance-optimized-listing "[39m
        [36m>[39m
          [36m<div[39m
            [33mdata-testid[39m=[32m"infinite-scroll"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                [33mdata-testid[39m=[32m"card"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"p-0"[39m
                  [33mdata-testid[39m=[32m"card-content"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                  [36m>[39m
                    [36m<img[39m
                      [33malt[39m=[32m"John Doe - artist image"[39m
                      [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                      [33mdata-height[39m=[32m"300"[39m
                      [33mdata-priority[39m=[32m"true"[39m
                      [33mdata-responsive[39m=[32m"true"[39m
                      [33mdata-testid[39m=[32m"optimized-image"[39m
                      [33mdata-width[39m=[32m"400"[39m
                      [33msrc[39m=[32m"https://example.com/main1.jpg"[39m
                    [36m/>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-1"[39m
                      [36m>[39m
                        [0mView Details[0m
                      [36m</a>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-4"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-center space-x-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-size[39m=[32m"medium"[39m
                          [33mdata-testid[39m=[32m"avatar-image"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"John Doe"[39m
                            [33msrc[39m=[32m"https://example.com/avatar1.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                        [36m<div>[39m
                          [36m<h3[39m
                            [33mclass[39m=[32m"font-semibold text-lg"[39m
                          [36m>[39m
                            [0mJohn Doe[0m
                          [36m</h3>[39m
                          [36m<p[39m
                            [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                          [36m>[39m
                            [0mLondon, UK[0m
                          [36m</p>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center space-x-1"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"secondary"[39m
                      [36m>[39m
                        [36m<span>[39m
                          [0m⭐[0m
                        [36m</span>[39m
                        [36m<span>[39m
                          [0m4.8[0m
                        [36m</span>[39m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mTraditional[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mBlackwork[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mRealism[0m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"mb-3"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mdata-columns[39m=[32m"2"[39m
                        [33mdata-gap[39m=[32m"2"[39m
                        [33mdata-lazy[39m=[32m"false"[39m
                        [33mdata-testid[39m=[32m"portfolio-grid"[39m
                      [36m>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 1"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio1.jpg"[39m
                        [36m/>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 2"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-1"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio2.jpg"[39m
                        [36m/>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex space-x-2"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-1"[39m
                      [36m>[39m
                        [0mView Profile[0m
                      [36m</a>[39m
                      [36m<button[39m
                        [33mclass[39m=[32m"px-3 py-2"[39m
                        [33mdata-size[39m=[32m"sm"[39m
                        [33mdata-testid[39m=[32m"button"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mContact[0m
                      [36m</button>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                [33mdata-testid[39m=[32m"card"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"p-0"[39m
                  [33mdata-testid[39m=[32m"card-content"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                  [36m>[39m
                    [36m<img[39m
                      [33malt[39m=[32m"Jane Smith - artist image"[39m
                      [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                      [33mdata-height[39m=[32m"300"[39m
                      [33mdata-priority[39m=[32m"true"[39m
                      [33mdata-responsive[39m=[32m"true"[39m
                      [33mdata-testid[39m=[32m"optimized-image"[39m
                      [33mdata-width[39m=[32m"400"[39m
                      [33msrc[39m=[32m"https://example.com/main2.jpg"[39m
                    [36m/>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-2"[39m
                      [36m>[39m
                        [0mView Details[0m
                      [36m</a>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-4"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-center space-x-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-size[39m=[32m"medium"[39m
                          [33mdata-testid[39m=[32m"avatar-image"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"Jane Smith"[39m
                            [33msrc[39m=[32m"https://example.com/avatar2.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                        [36m<div>[39m
                          [36m<h3[39m
                            [33mclass[39m=[32m"font-semibold text-lg"[39m
                          [36m>[39m
                            [0mJane Smith[0m
                          [36m</h3>[39m
                          [36m<p[39m
                            [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                          [36m>[39m
                            [0mManchester, UK[0m
                          [36m</p>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center space-x-1"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"secondary"[39m
                      [36m>[39m
                        [36m<span>[39m
                          [0m⭐[0m
                        [36m</span>[39m
                        [36m<span>[39m
                          [0m4.6[0m
                        [36m</span>[39m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mWatercolor[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mMinimalist[0m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"mb-3"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mdata-columns[39m=[32m"2"[39m
                        [33mdata-gap[39m=[32m"2"[39m
                        [33mdata-lazy[39m=[32m"false"[39m
                        [33mdata-testid[39m=[32m"portfolio-grid"[39m
                      [36m>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 3"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio3.jpg"[39m
                        [36m/>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex space-x-2"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-2"[39m
                      [36m>[39m
                        [0mView Profile[0m
                      [36m</a>[39m
                      [36m<button[39m
                        [33mclass[39m=[32m"px-3 py-2"[39m
                        [33mdata-size[39m=[32m"sm"[39m
                        [33mdata-testid[39m=[32m"button"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mContact[0m
                      [36m</button>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<button[39m
              [33mdata-testid[39m=[32m"load-more"[39m
            [36m>[39m
              [0mLoad More[0m
            [36m</button>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 324 |[39m       })[33m;[39m
     [90m 325 |[39m
    [31m[1m>[22m[39m[90m 326 |[39m       expect(screen[33m.[39mgetByTestId([32m'loading'[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 327 |[39m     })[33m;[39m
     [90m 328 |[39m
     [90m 329 |[39m     it([32m'handles error states with retry'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.getElementError (../node_modules/@testing-library/dom/dist/config.js:37:19)
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:76:38
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:95:19
      at Object.getByTestId (src/app/components/__tests__/PerformanceOptimizationIntegration.test.jsx:326:21)

  ● PerformanceOptimizationIntegration › InfiniteScroll Integration › handles error states with retry

    TestingLibraryElementError: Unable to find an element by: [data-testid="error"]

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"performance-optimized-listing "[39m
        [36m>[39m
          [36m<div[39m
            [33mdata-testid[39m=[32m"infinite-scroll"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                [33mdata-testid[39m=[32m"card"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"p-0"[39m
                  [33mdata-testid[39m=[32m"card-content"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                  [36m>[39m
                    [36m<img[39m
                      [33malt[39m=[32m"John Doe - artist image"[39m
                      [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                      [33mdata-height[39m=[32m"300"[39m
                      [33mdata-priority[39m=[32m"true"[39m
                      [33mdata-responsive[39m=[32m"true"[39m
                      [33mdata-testid[39m=[32m"optimized-image"[39m
                      [33mdata-width[39m=[32m"400"[39m
                      [33msrc[39m=[32m"https://example.com/main1.jpg"[39m
                    [36m/>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-1"[39m
                      [36m>[39m
                        [0mView Details[0m
                      [36m</a>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-4"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-center space-x-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-size[39m=[32m"medium"[39m
                          [33mdata-testid[39m=[32m"avatar-image"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"John Doe"[39m
                            [33msrc[39m=[32m"https://example.com/avatar1.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                        [36m<div>[39m
                          [36m<h3[39m
                            [33mclass[39m=[32m"font-semibold text-lg"[39m
                          [36m>[39m
                            [0mJohn Doe[0m
                          [36m</h3>[39m
                          [36m<p[39m
                            [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                          [36m>[39m
                            [0mLondon, UK[0m
                          [36m</p>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center space-x-1"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"secondary"[39m
                      [36m>[39m
                        [36m<span>[39m
                          [0m⭐[0m
                        [36m</span>[39m
                        [36m<span>[39m
                          [0m4.8[0m
                        [36m</span>[39m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mTraditional[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mBlackwork[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mRealism[0m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"mb-3"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mdata-columns[39m=[32m"2"[39m
                        [33mdata-gap[39m=[32m"2"[39m
                        [33mdata-lazy[39m=[32m"false"[39m
                        [33mdata-testid[39m=[32m"portfolio-grid"[39m
                      [36m>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 1"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio1.jpg"[39m
                        [36m/>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 2"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-1"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio2.jpg"[39m
                        [36m/>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex space-x-2"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-1"[39m
                      [36m>[39m
                        [0mView Profile[0m
                      [36m</a>[39m
                      [36m<button[39m
                        [33mclass[39m=[32m"px-3 py-2"[39m
                        [33mdata-size[39m=[32m"sm"[39m
                        [33mdata-testid[39m=[32m"button"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mContact[0m
                      [36m</button>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                [33mdata-testid[39m=[32m"card"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"p-0"[39m
                  [33mdata-testid[39m=[32m"card-content"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                  [36m>[39m
                    [36m<img[39m
                      [33malt[39m=[32m"Jane Smith - artist image"[39m
                      [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                      [33mdata-height[39m=[32m"300"[39m
                      [33mdata-priority[39m=[32m"true"[39m
                      [33mdata-responsive[39m=[32m"true"[39m
                      [33mdata-testid[39m=[32m"optimized-image"[39m
                      [33mdata-width[39m=[32m"400"[39m
                      [33msrc[39m=[32m"https://example.com/main2.jpg"[39m
                    [36m/>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-2"[39m
                      [36m>[39m
                        [0mView Details[0m
                      [36m</a>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-4"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-center space-x-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-size[39m=[32m"medium"[39m
                          [33mdata-testid[39m=[32m"avatar-image"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"Jane Smith"[39m
                            [33msrc[39m=[32m"https://example.com/avatar2.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                        [36m<div>[39m
                          [36m<h3[39m
                            [33mclass[39m=[32m"font-semibold text-lg"[39m
                          [36m>[39m
                            [0mJane Smith[0m
                          [36m</h3>[39m
                          [36m<p[39m
                            [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                          [36m>[39m
                            [0mManchester, UK[0m
                          [36m</p>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center space-x-1"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"secondary"[39m
                      [36m>[39m
                        [36m<span>[39m
                          [0m⭐[0m
                        [36m</span>[39m
                        [36m<span>[39m
                          [0m4.6[0m
                        [36m</span>[39m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mWatercolor[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"text-xs"[39m
                        [33mdata-testid[39m=[32m"badge"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mMinimalist[0m
                      [36m</span>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"mb-3"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mdata-columns[39m=[32m"2"[39m
                        [33mdata-gap[39m=[32m"2"[39m
                        [33mdata-lazy[39m=[32m"false"[39m
                        [33mdata-testid[39m=[32m"portfolio-grid"[39m
                      [36m>[39m
                        [36m<img[39m
                          [33malt[39m=[32m"Portfolio 3"[39m
                          [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                          [33msrc[39m=[32m"https://example.com/portfolio3.jpg"[39m
                        [36m/>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex space-x-2"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                        [33mdata-preload-on-hover[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"smart-link"[39m
                        [33mhref[39m=[32m"/artists/artist-2"[39m
                      [36m>[39m
                        [0mView Profile[0m
                      [36m</a>[39m
                      [36m<button[39m
                        [33mclass[39m=[32m"px-3 py-2"[39m
                        [33mdata-size[39m=[32m"sm"[39m
                        [33mdata-testid[39m=[32m"button"[39m
                        [33mdata-variant[39m=[32m"outline"[39m
                      [36m>[39m
                        [0mContact[0m
                      [36m</button>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<button[39m
              [33mdata-testid[39m=[32m"load-more"[39m
            [36m>[39m
              [0mLoad More[0m
            [36m</button>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 349 |[39m       })[33m;[39m
     [90m 350 |[39m
    [31m[1m>[22m[39m[90m 351 |[39m       expect(screen[33m.[39mgetByTestId([32m'error'[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 352 |[39m       expect(screen[33m.[39mgetByText([32m'Error: Network error'[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m 353 |[39m     })[33m;[39m
     [90m 354 |[39m   })[33m;[39m[0m

      at Object.getElementError (../node_modules/@testing-library/dom/dist/config.js:37:19)
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:76:38
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at ../node_modules/@testing-library/dom/dist/query-helpers.js:95:19
      at Object.getByTestId (src/app/components/__tests__/PerformanceOptimizationIntegration.test.jsx:351:21)

  ● PerformanceOptimizationIntegration › SmartLink Integration › preloads routes on hover

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

    Ignored nodes: comments, script, style
    [36m<html>[39m
      [36m<head />[39m
      [36m<body>[39m
        [36m<div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"performance-optimized-listing "[39m
          [36m>[39m
            [36m<div[39m
              [33mdata-testid[39m=[32m"infinite-scroll"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                  [33mdata-testid[39m=[32m"card"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-0"[39m
                    [33mdata-testid[39m=[32m"card-content"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                    [36m>[39m
                      [36m<img[39m
                        [33malt[39m=[32m"John Doe - artist image"[39m
                        [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                        [33mdata-height[39m=[32m"300"[39m
                        [33mdata-priority[39m=[32m"true"[39m
                        [33mdata-responsive[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"optimized-image"[39m
                        [33mdata-width[39m=[32m"400"[39m
                        [33msrc[39m=[32m"https://example.com/main1.jpg"[39m
                      [36m/>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                      [36m>[39m
                        [36m<a[39m
                          [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                          [33mdata-preload-on-hover[39m=[32m"true"[39m
                          [33mdata-testid[39m=[32m"smart-link"[39m
                          [33mhref[39m=[32m"/artists/artist-1"[39m
                        [36m>[39m
                          [0mView Details[0m
                        [36m</a>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"p-4"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mclass[39m=[32m"flex items-center space-x-3"[39m
                        [36m>[39m
                          [36m<div[39m
                            [33mdata-size[39m=[32m"medium"[39m
                            [33mdata-testid[39m=[32m"avatar-image"[39m
                          [36m>[39m
                            [36m<img[39m
                              [33malt[39m=[32m"John Doe"[39m
                              [33msrc[39m=[32m"https://example.com/avatar1.jpg"[39m
                            [36m/>[39m
                          [36m</div>[39m
                          [36m<div>[39m
                            [36m<h3[39m
                              [33mclass[39m=[32m"font-semibold text-lg"[39m
                            [36m>[39m
                              [0mJohn Doe[0m
                            [36m</h3>[39m
                            [36m<p[39m
                              [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                            [36m>[39m
                              [0mLondon, UK[0m
                            [36m</p>[39m
                          [36m</div>[39m
                        [36m</div>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"flex items-center space-x-1"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"secondary"[39m
                        [36m>[39m
                          [36m<span>[39m
                            [0m⭐[0m
                          [36m</span>[39m
                          [36m<span>[39m
                            [0m4.8[0m
                          [36m</span>[39m
                        [36m</span>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                      [36m>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"text-xs"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mTraditional[0m
                        [36m</span>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"text-xs"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mBlackwork[0m
                        [36m</span>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"text-xs"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mRealism[0m
                        [36m</span>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"mb-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-columns[39m=[32m"2"[39m
                          [33mdata-gap[39m=[32m"2"[39m
                          [33mdata-lazy[39m=[32m"false"[39m
                          [33mdata-testid[39m=[32m"portfolio-grid"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"Portfolio 1"[39m
                            [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                            [33msrc[39m=[32m"https://example.com/portfolio1.jpg"[39m
                          [36m/>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"Portfolio 2"[39m
                            [33mdata-testid[39m=[32m"portfolio-image-1"[39m
                            [33msrc[39m=[32m"https://example.com/portfolio2.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex space-x-2"[39m
                      [36m>[39m
                        [36m<a[39m
                          [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                          [33mdata-preload-on-hover[39m=[32m"true"[39m
                          [33mdata-testid[39m=[32m"smart-link"[39m
                          [33mhref[39m=[32m"/artists/artist-1"[39m
                        [36m>[39m
                          [0mView Profile[0m
                        [36m</a>[39m
                        [36m<button[39m
                          [33mclass[39m=[32m"px-3 py-2"[39m
                          [33mdata-size[39m=[32m"sm"[39m
                          [33mdata-testid[39m=[32m"button"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mContact[0m
                        [36m</button>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"group hover:shadow-lg transition-shadow duration-300"[39m
                  [33mdata-testid[39m=[32m"card"[39m
                [36m>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"p-0"[39m
                    [33mdata-testid[39m=[32m"card-content"[39m
                  [36m>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"relative aspect-video overflow-hidden rounded-t-lg"[39m
                    [36m>[39m
                      [36m<img[39m
                        [33malt[39m=[32m"Jane Smith - artist image"[39m
                        [33mclass[39m=[32m"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"[39m
                        [33mdata-height[39m=[32m"300"[39m
                        [33mdata-priority[39m=[32m"true"[39m
                        [33mdata-responsive[39m=[32m"true"[39m
                        [33mdata-testid[39m=[32m"optimized-image"[39m
                        [33mdata-width[39m=[32m"400"[39m
                        [33msrc[39m=[32m"https://example.com/main2.jpg"[39m
                      [36m/>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"[39m
                      [36m>[39m
                        [36m<a[39m
                          [33mclass[39m=[32m"px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"[39m
                          [33mdata-preload-on-hover[39m=[32m"true"[39m
                          [33mdata-testid[39m=[32m"smart-link"[39m
                          [33mhref[39m=[32m"/artists/artist-2"[39m
                        [36m>[39m
                          [0mView Details[0m
                        [36m</a>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"p-4"[39m
                    [36m>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex items-start justify-between mb-2"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mclass[39m=[32m"flex items-center space-x-3"[39m
                        [36m>[39m
                          [36m<div[39m
                            [33mdata-size[39m=[32m"medium"[39m
                            [33mdata-testid[39m=[32m"avatar-image"[39m
                          [36m>[39m
                            [36m<img[39m
                              [33malt[39m=[32m"Jane Smith"[39m
                              [33msrc[39m=[32m"https://example.com/avatar2.jpg"[39m
                            [36m/>[39m
                          [36m</div>[39m
                          [36m<div>[39m
                            [36m<h3[39m
                              [33mclass[39m=[32m"font-semibold text-lg"[39m
                            [36m>[39m
                              [0mJane Smith[0m
                            [36m</h3>[39m
                            [36m<p[39m
                              [33mclass[39m=[32m"text-neutral-600 text-sm"[39m
                            [36m>[39m
                              [0mManchester, UK[0m
                            [36m</p>[39m
                          [36m</div>[39m
                        [36m</div>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"flex items-center space-x-1"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"secondary"[39m
                        [36m>[39m
                          [36m<span>[39m
                            [0m⭐[0m
                          [36m</span>[39m
                          [36m<span>[39m
                            [0m4.6[0m
                          [36m</span>[39m
                        [36m</span>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex flex-wrap gap-1 mb-3"[39m
                      [36m>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"text-xs"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mWatercolor[0m
                        [36m</span>[39m
                        [36m<span[39m
                          [33mclass[39m=[32m"text-xs"[39m
                          [33mdata-testid[39m=[32m"badge"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mMinimalist[0m
                        [36m</span>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"mb-3"[39m
                      [36m>[39m
                        [36m<div[39m
                          [33mdata-columns[39m=[32m"2"[39m
                          [33mdata-gap[39m=[32m"2"[39m
                          [33mdata-lazy[39m=[32m"false"[39m
                          [33mdata-testid[39m=[32m"portfolio-grid"[39m
                        [36m>[39m
                          [36m<img[39m
                            [33malt[39m=[32m"Portfolio 3"[39m
                            [33mdata-testid[39m=[32m"portfolio-image-0"[39m
                            [33msrc[39m=[32m"https://example.com/portfolio3.jpg"[39m
                          [36m/>[39m
                        [36m</div>[39m
                      [36m</div>[39m
                      [36m<div[39m
                        [33mclass[39m=[32m"flex space-x-2"[39m
                      [36m>[39m
                        [36m<a[39m
                          [33mclass[39m=[32m"flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"[39m
                          [33mdata-preload-on-hover[39m=[32m"true"[39m
                          [33mdata-testid[39m=[32m"smart-link"[39m
                          [33mhref[39m=[32m"/artists/artist-2"[39m
                        [36m>[39m
                          [0mView Profile[0m
                        [36m</a>[39m
                        [36m<button[39m
                          [33mclass[39m=[32m"px-3 py-2"[39m
                          [33mdata-size[39m=[32m"sm"[39m
                          [33mdata-testid[39m=[32m"button"[39m
                          [33mdata-variant[39m=[32m"outline"[39m
                        [36m>[39m
                          [0mContact[0m
                        [36m</button>[39m
                      [36m</div>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                [36m</div>[39m
              [36m</div>[39m
              [36m<button[39m
                [33mdata-testid[39m=[32m"load-more"[39m
              [36m>[39m
                [0mLoad More[0m
              [36m</button>[39m
            [36m</div>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</body>[39m
    [36m</html>[39m

    [0m [90m 415 |[39m
     [90m 416 |[39m       [36mawait[39m waitFor(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 417 |[39m         expect(mockPreloadRoute)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 418 |[39m       })[33m;[39m
     [90m 419 |[39m     })[33m;[39m
     [90m 420 |[39m   })[33m;[39m[0m

      at toHaveBeenCalled (src/app/components/__tests__/PerformanceOptimizationIntegration.test.jsx:417:34)
      at runWithExpensiveErrorDiagnosticsDisabled (../node_modules/@testing-library/dom/dist/config.js:47:12)
      at checkCallback (../node_modules/@testing-library/dom/dist/wait-for.js:124:77)
      at checkRealTimersCallback (../node_modules/@testing-library/dom/dist/wait-for.js:118:16)
      at Timeout.task [as _onTimeout] (../node_modules/jsdom/lib/jsdom/browser/Window.js:520:19)

  ● PerformanceOptimizationIntegration › Performance Metrics › provides reset functionality

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

    [0m [90m 546 |[39m       fireEvent[33m.[39mclick(resetButton)[33m;[39m
     [90m 547 |[39m
    [31m[1m>[22m[39m[90m 548 |[39m       expect(mockReset)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 549 |[39m
     [90m 550 |[39m       process[33m.[39menv[33m.[39m[33mNODE_ENV[39m [33m=[39m originalEnv[33m;[39m
     [90m 551 |[39m     })[33m;[39m[0m

      at Object.toHaveBeenCalled (src/app/components/__tests__/PerformanceOptimizationIntegration.test.jsx:548:25)

(node:13224) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621
        const promise = requestFn().finally(()=>{
                                   ^

TypeError: Cannot read properties of undefined (reading 'finally')
    at RequestDeduplicator.execute (C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621:36)
    at Object.execute (C:\dev\Tattoo_MVP\frontend\src\lib\__tests__\performance-utils.test.js:188:20)
    at Promise.then.completed (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:316:40)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at _runTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:444:34)
    at Object.worker (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\testWorker.js:106:12)

Node.js v21.7.1
FAIL src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx (5.322 s)
  InfiniteScroll
    √ renders children correctly (54 ms)
    √ shows loading indicator when loading (15 ms)
    √ shows error state when error occurs (15 ms)
    √ shows end message when no more content (9 ms)
    √ sets up intersection observer correctly (10 ms)
    √ uses custom loading component (7 ms)
    √ uses custom error component (13 ms)
    √ uses custom end message component (10 ms)
  useInfiniteScroll hook
    √ initializes with initial data (6 ms)
    × loads more data when fetchMore is called (1026 ms)
    × handles fetch errors correctly (1005 ms)
    × sets hasMore to false when no more data (1007 ms)
    × prevents multiple simultaneous loads (2 ms)
    × respects debounce timing (7 ms)

  ● useInfiniteScroll hook › loads more data when fetchMore is called

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

    Ignored nodes: comments, script, style
    [36m<html>[39m
      [36m<head />[39m
      [36m<body>[39m
        [36m<div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"w-full"[39m
          [36m>[39m
            [36m<div[39m
              [33mdata-testid[39m=[32m"content"[39m
            [36m>[39m
              [36m<div[39m
                [33mdata-testid[39m=[32m"item"[39m
              [36m>[39m
                [0mItem 1[0m
              [36m</div>[39m
            [36m</div>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex justify-center items-center py-8"[39m
            [36m/>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</body>[39m
    [36m</html>[39m

    [0m [90m 207 |[39m
     [90m 208 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 209 |[39m       expect(fetchMore)[33m.[39mtoHaveBeenCalledWith([35m1[39m)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 210 |[39m     })[33m;[39m
     [90m 211 |[39m   })[33m;[39m
     [90m 212 |[39m[0m

      at toHaveBeenCalledWith (src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx:209:25)
      at runWithExpensiveErrorDiagnosticsDisabled (../node_modules/@testing-library/dom/dist/config.js:47:12)
      at checkCallback (../node_modules/@testing-library/dom/dist/wait-for.js:124:77)
      at checkRealTimersCallback (../node_modules/@testing-library/dom/dist/wait-for.js:118:16)
      at Timeout.task [as _onTimeout] (../node_modules/jsdom/lib/jsdom/browser/Window.js:520:19)

  ● useInfiniteScroll hook › handles fetch errors correctly

    Unable to find an element with the text: Failed to load more content. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"w-full"[39m
        [36m>[39m
          [36m<div[39m
            [33mdata-testid[39m=[32m"content"[39m
          [36m>[39m
            [36m<div[39m
              [33mdata-testid[39m=[32m"item"[39m
            [36m>[39m
              [0mItem 1[0m
            [36m</div>[39m
          [36m</div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex justify-center items-center py-8"[39m
          [36m/>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 229 |[39m     })[33m;[39m
     [90m 230 |[39m
    [31m[1m>[22m[39m[90m 231 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
     [90m     |[39m                  [31m[1m^[22m[39m
     [90m 232 |[39m       expect(screen[33m.[39mgetByText([32m'Failed to load more content'[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m 233 |[39m     })[33m;[39m
     [90m 234 |[39m   })[33m;[39m[0m

      at waitForWrapper (../node_modules/@testing-library/dom/dist/wait-for.js:163:27)
      at Object.<anonymous> (src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx:231:18)

  ● useInfiniteScroll hook › sets hasMore to false when no more data

    Unable to find an element with the text: You've reached the end!. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"w-full"[39m
        [36m>[39m
          [36m<div[39m
            [33mdata-testid[39m=[32m"content"[39m
          [36m>[39m
            [36m<div[39m
              [33mdata-testid[39m=[32m"item"[39m
            [36m>[39m
              [0mItem 1[0m
            [36m</div>[39m
          [36m</div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex justify-center items-center py-8"[39m
          [36m/>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 255 |[39m     })[33m;[39m
     [90m 256 |[39m
    [31m[1m>[22m[39m[90m 257 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
     [90m     |[39m                  [31m[1m^[22m[39m
     [90m 258 |[39m       expect(screen[33m.[39mgetByText([32m"You've reached the end!"[39m))[33m.[39mtoBeInTheDocument()[33m;[39m
     [90m 259 |[39m     })[33m;[39m
     [90m 260 |[39m   })[33m;[39m[0m

      at waitForWrapper (../node_modules/@testing-library/dom/dist/wait-for.js:163:27)
      at Object.<anonymous> (src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx:257:18)

  ● useInfiniteScroll hook › prevents multiple simultaneous loads

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 0

    [0m [90m 283 |[39m
     [90m 284 |[39m     [90m// Should only call fetchMore once[39m
    [31m[1m>[22m[39m[90m 285 |[39m     expect(fetchMore)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m     |[39m                       [31m[1m^[22m[39m
     [90m 286 |[39m   })[33m;[39m
     [90m 287 |[39m
     [90m 288 |[39m   it([32m'respects debounce timing'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledTimes (src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx:285:23)

  ● useInfiniteScroll hook › respects debounce timing

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

    Ignored nodes: comments, script, style
    [36m<html>[39m
      [36m<head />[39m
      [36m<body>[39m
        [36m<div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"w-full"[39m
          [36m>[39m
            [36m<div[39m
              [33mdata-testid[39m=[32m"content"[39m
            [36m>[39m
              [36m<div[39m
                [33mdata-testid[39m=[32m"item"[39m
              [36m>[39m
                [0mItem 1[0m
              [36m</div>[39m
            [36m</div>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex justify-center items-center py-8"[39m
            [36m/>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</body>[39m
    [36m</html>[39m

    [0m [90m 318 |[39m
     [90m 319 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 320 |[39m       expect(fetchMore)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 321 |[39m     })[33m;[39m
     [90m 322 |[39m
     [90m 323 |[39m     jest[33m.[39museRealTimers()[33m;[39m[0m

      at toHaveBeenCalled (src/design-system/components/ui/Performance/__tests__/InfiniteScroll.test.jsx:320:25)
      at runWithExpensiveErrorDiagnosticsDisabled (../node_modules/@testing-library/dom/dist/config.js:47:12)
      at checkCallback (../node_modules/@testing-library/dom/dist/wait-for.js:124:77)
      at ../node_modules/@testing-library/dom/dist/wait-for.js:82:9

(node:38672) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621
        const promise = requestFn().finally(()=>{
                                   ^

TypeError: Cannot read properties of undefined (reading 'finally')
    at RequestDeduplicator.execute (C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621:36)
    at Object.execute (C:\dev\Tattoo_MVP\frontend\src\lib\__tests__\performance-utils.test.js:188:20)
    at Promise.then.completed (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:316:40)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at _runTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:444:34)
    at Object.worker (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\testWorker.js:106:12)

Node.js v21.7.1
(node:6084) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621
        const promise = requestFn().finally(()=>{
                                   ^

TypeError: Cannot read properties of undefined (reading 'finally')
    at RequestDeduplicator.execute (C:\dev\Tattoo_MVP\frontend\src\lib\performance-utils.js:621:36)
    at Object.execute (C:\dev\Tattoo_MVP\frontend\src\lib\__tests__\performance-utils.test.js:188:20)
    at Promise.then.completed (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:298:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\utils.js:231:10)
    at _callCircusTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:316:40)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at _runTest (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:252:3)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:126:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at _runTestsForDescribeBlock (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:121:9)
    at run (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\run.js:71:3)
    at runAndTransformResultsToJestFormat (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
    at jestAdapter (C:\dev\Tattoo_MVP\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
    at runTestInternal (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\runTest.js:444:34)
    at Object.worker (C:\dev\Tattoo_MVP\node_modules\jest-runner\build\testWorker.js:106:12)

Node.js v21.7.1
FAIL src/lib/__tests__/performance-utils.test.js
  ● Test suite failed to run

    Jest worker encountered 4 child process exceptions, exceeding retry limit

      at ChildProcessWorker.initialize (../node_modules/jest-worker/build/workers/ChildProcessWorker.js:181:21)

Test Suites: 11 failed, 11 total
Tests:       30 failed, 56 passed, 86 total
Snapshots:   0 total
Time:        11.027 s
Ran all test suites matching /performance/i.
npm ERR! Lifecycle script `test` failed with error: 
npm ERR! Error: command failed 
npm ERR!   in workspace: tattoo-artist-directory-fe@0.1.0 
npm ERR!   at location: C:\dev\Tattoo_MVP\frontend 



### Bundle Size Validation

- **Status**: Passed ✓
- **Gzipped Size**: 180000B
- **Target**: 250000B
- **Within Budget**: Yes


### Image Optimization

- **Status**: Passed ✓
- **Total Images**: 1
- **Optimized**: 1
- **Optimization Rate**: 100%


### Lazy Loading Implementation

- **Status**: Passed ✓
- **Implementations**: 41
- **Intersection Observer**: 20
- **Next.js Image**: 36


### Connection-Aware Features

- **Connection API**: Implemented ✓
- **Preloading**: Implemented ✓
- **Adaptive Loading**: Implemented ✓


## Recommendations


### Critical Issues
- Address failed tests to improve performance
- Focus on bundle size optimization if exceeded
- Implement missing lazy loading features




### Performance Targets
- **Load Time**: < 2.5s
- **Bundle Size**: < 250KB gzipped
- **Image Optimization**: > 80% optimized
- **Lazy Loading**: Intersection Observer implementation
- **Connection Awareness**: Adaptive loading features

---
*Report generated on 2025-09-24T21:57:43.383Z*
