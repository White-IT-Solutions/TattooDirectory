/**
 * Performance Utilities Tests
 * 
 * Tests for the performance optimization utilities
 */

import { 
  debounce, 
  PerformanceMonitor, 
  LRUCache, 
  RequestDeduplicator 
} from '../performance-utils';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should support cancellation', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      debouncedFn.cancel();

      jest.advanceTimersByTime(300);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should support immediate flush', () => {
      const mockFn = jest.fn().mockReturnValue('result');
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      const result = debouncedFn.flush();

      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('should track operation timing', () => {
      const operationName = 'test-operation';

      monitor.startTiming(operationName);
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }
      
      const duration = monitor.endTiming(operationName);

      expect(duration).toBeGreaterThan(0);
      expect(monitor.getTiming(operationName)).toBe(duration);
    });

    it('should provide performance summary', () => {
      monitor.startTiming('op1');
      monitor.endTiming('op1');
      
      monitor.startTiming('op2');
      monitor.endTiming('op2');

      const summary = monitor.getSummary();

      expect(summary.totalOperations).toBe(2);
      expect(summary.averageDuration).toBeGreaterThan(0);
    });

    it('should notify observers', () => {
      const observer = jest.fn();
      const unsubscribe = monitor.addObserver(observer);

      monitor.startTiming('test');
      monitor.endTiming('test');

      expect(observer).toHaveBeenCalledWith('test', expect.any(Number));

      unsubscribe();
    });
  });

  describe('LRUCache', () => {
    let cache;

    beforeEach(() => {
      cache = new LRUCache(3, 1000); // 3 items, 1 second TTL
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should implement LRU eviction', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should expire items after TTL', async () => {
      const shortCache = new LRUCache(10, 100); // 100ms TTL
      
      shortCache.set('key', 'value');
      expect(shortCache.get('key')).toBe('value');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.get('key')).toBeNull();
    });

    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.ttl).toBe(1000);
    });
  });

  describe('RequestDeduplicator', () => {
    let deduplicator;

    beforeEach(() => {
      deduplicator = new RequestDeduplicator();
    });

    it('should deduplicate identical requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const key = 'test-request';

      const promises = [
        deduplicator.execute(key, mockFn),
        deduplicator.execute(key, mockFn),
        deduplicator.execute(key, mockFn)
      ];

      const results = await Promise.all(promises);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(results).toEqual(['result', 'result', 'result']);
    });

    it('should handle request cancellation', () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const key = 'test-request';

      deduplicator.execute(key, mockFn);
      deduplicator.cancel(key);

      expect(deduplicator.getPendingCount()).toBe(0);
    });

    it('should track pending requests', () => {
      const mockFn = jest.fn(() => new Promise(() => {})); // Never resolves
      
      deduplicator.execute('key1', mockFn);
      deduplicator.execute('key2', mockFn);

      expect(deduplicator.getPendingCount()).toBe(2);

      deduplicator.cancelAll();
      expect(deduplicator.getPendingCount()).toBe(0);
    });
  });
});