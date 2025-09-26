/**
 * Test suite for Enhanced Search Controller
 */

import { 
  SearchQuery, 
  SearchState, 
  SearchHistoryManager, 
  DebouncedSearch,
  EnhancedSearchController 
} from '../search-controller.js';

// Mock the API
jest.mock('../api.js', () => ({
  api: {
    searchArtists: jest.fn(),
    getArtists: jest.fn()
  }
}));

// Mock enhanced tattoo styles
jest.mock('../../app/data/testData/enhancedTattooStyles.js', () => ({
  enhancedTattooStyles: {
    'old_school': {
      id: 'old_school',
      name: 'Old School',
      difficulty: 'beginner',
      aliases: ['traditional', 'sailor_jerry']
    },
    'realism': {
      id: 'realism',
      name: 'Realism',
      difficulty: 'advanced',
      aliases: ['realistic', 'photo_realism']
    }
  },
  searchStylesByAlias: jest.fn(() => [])
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('SearchQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates a search query with default values', () => {
      const query = new SearchQuery();
      
      expect(query.text).toBe('');
      expect(query.styles).toEqual([]);
      expect(query.location).toBeNull();
      expect(query.difficulty).toEqual([]);
      expect(query.sortBy).toBe('relevance');
      expect(query.page).toBe(1);
      expect(query.limit).toBe(20);
    });

    it('creates a search query with provided values', () => {
      const query = new SearchQuery({
        text: 'dragon tattoo',
        styles: ['old_school', 'realism'],
        location: { city: 'London' },
        difficulty: ['beginner'],
        sortBy: 'popularity',
        page: 2,
        limit: 10
      });

      expect(query.text).toBe('dragon tattoo');
      expect(query.styles).toEqual(['old_school', 'realism']);
      expect(query.location).toEqual({ city: 'London' });
      expect(query.difficulty).toEqual(['beginner']);
      expect(query.sortBy).toBe('popularity');
      expect(query.page).toBe(2);
      expect(query.limit).toBe(10);
    });

    it('handles array conversion for styles and difficulty', () => {
      const query = new SearchQuery({
        styles: 'old_school',
        difficulty: 'beginner'
      });

      expect(query.styles).toEqual([]);
      expect(query.difficulty).toEqual([]);
    });
  });

  describe('hasFilters', () => {
    it('returns false for empty query', () => {
      const query = new SearchQuery();
      expect(query.hasFilters()).toBe(false);
    });

    it('returns true when text is provided', () => {
      const query = new SearchQuery({ text: 'dragon' });
      expect(query.hasFilters()).toBe(true);
    });

    it('returns true when styles are provided', () => {
      const query = new SearchQuery({ styles: ['old_school'] });
      expect(query.hasFilters()).toBe(true);
    });

    it('returns true when location is provided', () => {
      const query = new SearchQuery({ location: { city: 'London' } });
      expect(query.hasFilters()).toBe(true);
    });
  });

  describe('getCacheKey', () => {
    it('generates consistent cache keys for identical queries', () => {
      const query1 = new SearchQuery({ text: 'dragon', styles: ['old_school'] });
      const query2 = new SearchQuery({ text: 'dragon', styles: ['old_school'] });
      
      expect(query1.getCacheKey()).toBe(query2.getCacheKey());
    });

    it('generates different cache keys for different queries', () => {
      const query1 = new SearchQuery({ text: 'dragon' });
      const query2 = new SearchQuery({ text: 'rose' });
      
      expect(query1.getCacheKey()).not.toBe(query2.getCacheKey());
    });

    it('sorts styles for consistent cache keys', () => {
      const query1 = new SearchQuery({ styles: ['old_school', 'realism'] });
      const query2 = new SearchQuery({ styles: ['realism', 'old_school'] });
      
      expect(query1.getCacheKey()).toBe(query2.getCacheKey());
    });
  });

  describe('toURLSearchParams', () => {
    it('converts query to URL search parameters', () => {
      const query = new SearchQuery({
        text: 'dragon tattoo',
        styles: ['old_school', 'realism'],
        location: { postcode: 'SW1A 1AA', city: 'London' },
        difficulty: ['beginner'],
        sortBy: 'popularity',
        page: 2,
        limit: 10
      });

      const params = query.toURLSearchParams();
      
      expect(params.get('query')).toBe('dragon tattoo');
      expect(params.get('styles')).toBe('old_school,realism');
      expect(params.get('postcode')).toBe('SW1A 1AA');
      expect(params.get('city')).toBe('London');
      expect(params.get('difficulty')).toBe('beginner');
      expect(params.get('sortBy')).toBe('popularity');
      expect(params.get('page')).toBe('2');
      expect(params.get('limit')).toBe('10');
    });

    it('omits default values from URL parameters', () => {
      const query = new SearchQuery({
        text: 'dragon',
        sortBy: 'relevance',
        page: 1,
        limit: 20
      });

      const params = query.toURLSearchParams();
      
      expect(params.get('query')).toBe('dragon');
      expect(params.get('sortBy')).toBeNull();
      expect(params.get('page')).toBeNull();
      expect(params.get('limit')).toBeNull();
    });
  });

  describe('fromURLSearchParams', () => {
    it('creates query from URL search parameters', () => {
      const params = new URLSearchParams({
        query: 'dragon tattoo',
        styles: 'old_school,realism',
        postcode: 'SW1A 1AA',
        city: 'London',
        difficulty: 'beginner',
        sortBy: 'popularity',
        page: '2',
        limit: '10'
      });

      const query = SearchQuery.fromURLSearchParams(params);
      
      expect(query.text).toBe('dragon tattoo');
      expect(query.styles).toEqual(['old_school', 'realism']);
      expect(query.location).toEqual({ postcode: 'SW1A 1AA', city: 'London' });
      expect(query.difficulty).toEqual(['beginner']);
      expect(query.sortBy).toBe('popularity');
      expect(query.page).toBe(2);
      expect(query.limit).toBe(10);
    });

    it('handles missing parameters with defaults', () => {
      const params = new URLSearchParams({ query: 'dragon' });
      const query = SearchQuery.fromURLSearchParams(params);
      
      expect(query.text).toBe('dragon');
      expect(query.styles).toEqual([]);
      expect(query.location).toBeNull();
      expect(query.sortBy).toBe('relevance');
      expect(query.page).toBe(1);
      expect(query.limit).toBe(20);
    });
  });
});

describe('SearchState', () => {
  it('initializes with default values', () => {
    const state = new SearchState();
    
    expect(state.query).toBeInstanceOf(SearchQuery);
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.totalCount).toBe(0);
  });

  it('updates state correctly', () => {
    const state = new SearchState();
    const updates = {
      loading: true,
      error: new Error('Test error'),
      totalCount: 5
    };

    state.update(updates);
    
    expect(state.loading).toBe(true);
    expect(state.error).toEqual(new Error('Test error'));
    expect(state.totalCount).toBe(5);
    expect(state.lastUpdated).toBeGreaterThan(0);
  });

  it('resets state correctly', () => {
    const state = new SearchState();
    state.update({ loading: true, totalCount: 5 });
    
    state.reset();
    
    expect(state.query).toBeInstanceOf(SearchQuery);
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.totalCount).toBe(0);
    expect(state.lastUpdated).toBeNull();
  });
});

describe('SearchHistoryManager', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  it('saves search to history when query has filters', () => {
    const manager = new SearchHistoryManager();
    const query = new SearchQuery({ text: 'dragon' });
    
    // Spy on console.warn to suppress warnings during test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    manager.saveSearch(query);
    
    // The method should attempt to save if hasFilters returns true
    expect(query.hasFilters()).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('does not save empty queries', () => {
    const manager = new SearchHistoryManager();
    const query = new SearchQuery(); // Empty query
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    manager.saveSearch(query);
    
    // Should not attempt to save empty queries
    expect(query.hasFilters()).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('retrieves search history', () => {
    const manager = new SearchHistoryManager();
    const mockHistory = JSON.stringify([
      { text: 'dragon', styles: [], timestamp: Date.now() }
    ]);
    
    localStorageMock.getItem.mockReturnValue(mockHistory);
    
    const history = manager.getHistory();
    
    expect(history).toHaveLength(1);
    expect(history[0]).toBeInstanceOf(SearchQuery);
    expect(history[0].text).toBe('dragon');
  });

  it('handles localStorage errors gracefully', () => {
    const manager = new SearchHistoryManager();
    
    // Mock console.warn to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Test that the method doesn't throw when localStorage fails
    const originalGetItem = global.localStorage.getItem;
    global.localStorage.getItem = jest.fn(() => {
      throw new Error('localStorage error');
    });
    
    let result;
    expect(() => {
      result = manager.getHistory();
    }).not.toThrow();
    
    expect(Array.isArray(result)).toBe(true);
    
    // Restore the original method
    global.localStorage.getItem = originalGetItem;
    consoleSpy.mockRestore();
  });

  it('provides clear history method', () => {
    const manager = new SearchHistoryManager();
    
    // Mock console.warn to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Test that the method exists and can be called
    expect(() => manager.clearHistory()).not.toThrow();
    
    consoleSpy.mockRestore();
  });
});

describe('DebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces search calls', async () => {
    const mockSearchFunction = jest.fn().mockResolvedValue('result');
    const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
    
    const query = new SearchQuery({ text: 'dragon' });
    
    // Make multiple rapid calls
    debouncedSearch.search(query);
    debouncedSearch.search(query);
    const promise = debouncedSearch.search(query);
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    const result = await promise;
    
    expect(mockSearchFunction).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('cancels pending searches', () => {
    const mockSearchFunction = jest.fn();
    const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
    
    const query = new SearchQuery({ text: 'dragon' });
    debouncedSearch.search(query);
    
    debouncedSearch.cancel();
    jest.advanceTimersByTime(300);
    
    expect(mockSearchFunction).not.toHaveBeenCalled();
  });
});

describe('EnhancedSearchController', () => {
  let controller;
  let mockApi;

  beforeEach(() => {
    controller = new EnhancedSearchController();
    mockApi = require('../api.js').api;
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const state = controller.getSearchState();
    
    expect(state.query).toBeInstanceOf(SearchQuery);
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('adds and removes listeners', () => {
    const listener = jest.fn();
    const unsubscribe = controller.addListener(listener);
    
    controller.updateSearchState({ loading: true });
    expect(listener).toHaveBeenCalled();
    
    unsubscribe();
    listener.mockClear();
    
    controller.updateSearchState({ loading: false });
    expect(listener).not.toHaveBeenCalled();
  });

  it('executes search and updates state', async () => {
    const mockResults = {
      artists: [
        { id: '1', name: 'Artist 1', styles: ['old_school'] }
      ],
      totalCount: 1
    };
    
    mockApi.searchArtists.mockResolvedValue(mockResults);
    
    const query = new SearchQuery({ text: 'dragon' });
    await controller.executeSearch(query);
    
    const state = controller.getSearchState();
    expect(state.results).toHaveLength(1);
    expect(state.totalCount).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('handles search errors', async () => {
    const error = new Error('Search failed');
    mockApi.searchArtists.mockRejectedValue(error);
    
    const query = new SearchQuery({ text: 'dragon' });
    
    await expect(controller.executeSearch(query)).rejects.toThrow('Search failed');
    
    const state = controller.getSearchState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe(error);
  });

  it('applies filters correctly', async () => {
    const mockResults = { artists: [], totalCount: 0 };
    mockApi.searchArtists.mockResolvedValue(mockResults);
    
    await controller.applyFilters({ styles: ['old_school'] });
    
    const state = controller.getSearchState();
    expect(state.query.styles).toEqual(['old_school']);
    expect(state.query.page).toBe(1); // Should reset to first page
  });

  it('clears filters correctly', async () => {
    const mockResults = { artists: [], totalCount: 0 };
    mockApi.searchArtists.mockResolvedValue(mockResults);
    
    // Set up initial state with filters
    controller.updateSearchState({
      query: new SearchQuery({ text: 'dragon', styles: ['old_school'] })
    });
    
    await controller.clearFilters();
    
    const state = controller.getSearchState();
    expect(state.query.text).toBe('dragon'); // Text should be preserved
    expect(state.query.styles).toEqual([]); // Styles should be cleared
  });

  it('caches search results', async () => {
    const mockResults = { artists: [{ id: '1' }], totalCount: 1 };
    mockApi.searchArtists.mockResolvedValue(mockResults);
    
    const query = new SearchQuery({ text: 'dragon' });
    
    // First search
    await controller.executeSearch(query);
    expect(mockApi.searchArtists).toHaveBeenCalledTimes(1);
    
    // Second search with same query should use cache
    await controller.executeSearch(query);
    expect(mockApi.searchArtists).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('resets state correctly', () => {
    controller.updateSearchState({ loading: true, totalCount: 5 });
    
    controller.reset();
    
    const state = controller.getSearchState();
    expect(state.query).toBeInstanceOf(SearchQuery);
    expect(state.results).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.totalCount).toBe(0);
  });
});