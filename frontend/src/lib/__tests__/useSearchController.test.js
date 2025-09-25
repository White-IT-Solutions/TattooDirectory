/**
 * Test suite for useSearchController React hooks
 */

import { renderHook, act } from '@testing-library/react';
import { 
  useSearchController, 
  useDebouncedSearch, 
  useSearchSuggestions,
  useSearchFacets,
  useSearchHistory 
} from '../useSearchController.js';
import { SearchQuery } from '../search-controller.js';

// Mock the search controller
jest.mock('../search-controller.js', () => {
  const mockSearchController = {
    getSearchState: jest.fn(),
    addListener: jest.fn(),
    executeSearch: jest.fn(),
    applyFilters: jest.fn(),
    clearFilters: jest.fn(),
    updateSearchState: jest.fn(),
    reset: jest.fn(),
    getRecentSearches: jest.fn(),
    clearSearchHistory: jest.fn(),
    cancelPendingSearch: jest.fn()
  };

  return {
    searchController: mockSearchController,
    SearchQuery: jest.fn().mockImplementation((params = {}) => ({
      text: params.text || '',
      styles: params.styles || [],
      location: params.location || null,
      difficulty: params.difficulty || [],
      hasFilters: jest.fn(() => !!(params.text || (params.styles && params.styles.length > 0))),
      ...params
    }))
  };
});

describe('useSearchController', () => {
  let mockSearchController;

  beforeEach(() => {
    // Get the mocked search controller
    const { searchController } = require('../search-controller.js');
    mockSearchController = searchController;
    
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery(),
      results: null,
      loading: false,
      error: null,
      totalCount: 0,
      facets: null,
      suggestions: [],
      executionTime: 0,
      lastUpdated: null
    });
    
    mockSearchController.addListener.mockReturnValue(() => {});
    mockSearchController.getRecentSearches.mockReturnValue([]);
    mockSearchController.executeSearch.mockResolvedValue({});
    mockSearchController.applyFilters.mockResolvedValue({});
    mockSearchController.clearFilters.mockResolvedValue({});
  });

  it('initializes with search controller state', () => {
    const mockState = {
      query: new SearchQuery({ text: 'dragon' }),
      results: [{ id: '1', name: 'Artist 1' }],
      loading: false,
      error: null,
      totalCount: 1
    };
    
    mockSearchController.getSearchState.mockReturnValue(mockState);
    
    const { result } = renderHook(() => useSearchController());
    
    expect(result.current.searchState).toEqual(mockState);
    expect(result.current.hasResults).toBe(true);
    expect(result.current.totalResults).toBe(1);
  });

  it('subscribes to search controller updates', () => {
    const mockListener = jest.fn();
    mockSearchController.addListener.mockReturnValue(mockListener);
    
    renderHook(() => useSearchController());
    
    expect(mockSearchController.addListener).toHaveBeenCalled();
  });

  it('executes search correctly', async () => {
    const { result } = renderHook(() => useSearchController());
    
    const query = new SearchQuery({ text: 'dragon' });
    
    await act(async () => {
      await result.current.executeSearch(query);
    });
    
    expect(mockSearchController.executeSearch).toHaveBeenCalledWith(query);
  });

  it('applies filters correctly', async () => {
    const { result } = renderHook(() => useSearchController());
    
    const filters = { styles: ['old_school'] };
    
    await act(async () => {
      await result.current.applyFilters(filters);
    });
    
    expect(mockSearchController.applyFilters).toHaveBeenCalledWith(filters);
  });

  it('clears filters correctly', async () => {
    const { result } = renderHook(() => useSearchController());
    
    await act(async () => {
      await result.current.clearFilters();
    });
    
    expect(mockSearchController.clearFilters).toHaveBeenCalled();
  });

  it('updates search state correctly', () => {
    const { result } = renderHook(() => useSearchController());
    
    const updates = { loading: true };
    
    act(() => {
      result.current.updateSearchState(updates);
    });
    
    expect(mockSearchController.updateSearchState).toHaveBeenCalledWith(updates);
  });

  it('resets search correctly', () => {
    const { result } = renderHook(() => useSearchController());
    
    act(() => {
      result.current.resetSearch();
    });
    
    expect(mockSearchController.reset).toHaveBeenCalled();
  });

  it('computes derived properties correctly', () => {
    const mockState = {
      query: new SearchQuery({ text: 'dragon' }),
      results: [{ id: '1' }, { id: '2' }],
      loading: true,
      error: new Error('Test error'),
      totalCount: 2,
      executionTime: 150
    };
    
    mockSearchController.getSearchState.mockReturnValue(mockState);
    
    const { result } = renderHook(() => useSearchController());
    
    expect(result.current.hasResults).toBe(true);
    expect(result.current.isSearching).toBe(true);
    expect(result.current.searchError).toEqual(new Error('Test error'));
    expect(result.current.totalResults).toBe(2);
    expect(result.current.executionTime).toBe(150);
  });

  it('handles search errors gracefully', async () => {
    const error = new Error('Search failed');
    mockSearchController.executeSearch.mockRejectedValue(error);
    
    const { result } = renderHook(() => useSearchController());
    
    await act(async () => {
      try {
        await result.current.executeSearch(new SearchQuery({ text: 'dragon' }));
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });
});

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces search text updates', () => {
    const { result } = renderHook(() => useDebouncedSearch(300));
    
    act(() => {
      result.current.updateSearchText('d');
    });
    
    expect(result.current.searchText).toBe('d');
    expect(result.current.debouncedText).toBe('');
    expect(result.current.isDebouncing).toBe(true);
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.debouncedText).toBe('d');
    expect(result.current.isDebouncing).toBe(false);
  });

  it('cancels previous debounce on new input', () => {
    const { result } = renderHook(() => useDebouncedSearch(300));
    
    act(() => {
      result.current.updateSearchText('d');
    });
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    act(() => {
      result.current.updateSearchText('dr');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.debouncedText).toBe('dr');
  });

  it('clears search text correctly', () => {
    const { result } = renderHook(() => useDebouncedSearch(300));
    
    act(() => {
      result.current.updateSearchText('dragon');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.searchText).toBe('dragon');
    expect(result.current.debouncedText).toBe('dragon');
    
    act(() => {
      result.current.clearSearchText();
    });
    
    expect(result.current.searchText).toBe('');
    expect(result.current.debouncedText).toBe('');
    expect(result.current.isDebouncing).toBe(false);
  });
});

describe('useSearchSuggestions', () => {
  let mockSearchController;

  beforeEach(() => {
    // Get the mocked search controller
    const { searchController } = require('../search-controller.js');
    mockSearchController = searchController;
    
    jest.clearAllMocks();
    
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery(),
      results: null,
      loading: false,
      error: null,
      suggestions: []
    });
    
    mockSearchController.addListener.mockReturnValue(() => {});
    mockSearchController.getRecentSearches.mockReturnValue([]);
  });

  it('provides suggestions from search state', () => {
    const mockSuggestions = [
      { type: 'style', text: 'Try Old School style', query: new SearchQuery() }
    ];
    
    mockSearchController.getSearchState.mockReturnValue({
      suggestions: mockSuggestions,
      results: []
    });
    
    const { result } = renderHook(() => useSearchSuggestions());
    
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.hasNoResults).toBe(true);
  });

  it('detects no results state', () => {
    mockSearchController.getSearchState.mockReturnValue({
      results: [],
      suggestions: []
    });
    
    const { result } = renderHook(() => useSearchSuggestions());
    
    expect(result.current.hasNoResults).toBe(true);
    expect(result.current.hasFewResults).toBe(false);
  });

  it('detects few results state', () => {
    mockSearchController.getSearchState.mockReturnValue({
      results: [{ id: '1' }, { id: '2' }],
      suggestions: []
    });
    
    const { result } = renderHook(() => useSearchSuggestions());
    
    expect(result.current.hasNoResults).toBe(false);
    expect(result.current.hasFewResults).toBe(true);
  });

  it('toggles suggestions visibility', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    
    expect(result.current.showSuggestions).toBe(false);
    
    act(() => {
      result.current.toggleSuggestions();
    });
    
    expect(result.current.showSuggestions).toBe(true);
    
    act(() => {
      result.current.hideSuggestions();
    });
    
    expect(result.current.showSuggestions).toBe(false);
  });
});

describe('useSearchFacets', () => {
  let mockSearchController;

  beforeEach(() => {
    // Get the mocked search controller
    const { searchController } = require('../search-controller.js');
    mockSearchController = searchController;
    
    jest.clearAllMocks();
    
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery(),
      facets: {
        styles: { 'old_school': 5, 'realism': 3 },
        locations: { 'London': 8, 'Manchester': 2 },
        difficulty: { 'beginner': 6, 'advanced': 2 }
      }
    });
    
    mockSearchController.addListener.mockReturnValue(() => {});
    mockSearchController.getRecentSearches.mockReturnValue([]);
    mockSearchController.applyFilters.mockResolvedValue({});
  });

  it('provides facets from search state', () => {
    const { result } = renderHook(() => useSearchFacets());
    
    expect(result.current.availableStyles).toEqual(['old_school', 'realism']);
    expect(result.current.availableLocations).toEqual(['London', 'Manchester']);
    expect(result.current.availableDifficulties).toEqual(['beginner', 'advanced']);
  });

  it('applies style filter correctly', async () => {
    const { result } = renderHook(() => useSearchFacets());
    
    await act(async () => {
      await result.current.applyStyleFilter('old_school');
    });
    
    expect(mockSearchController.applyFilters).toHaveBeenCalledWith({
      styles: ['old_school']
    });
  });

  it('toggles style filter correctly', async () => {
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery({ styles: ['old_school'] }),
      facets: { styles: {}, locations: {}, difficulty: {} }
    });
    
    const { result } = renderHook(() => useSearchFacets());
    
    await act(async () => {
      await result.current.applyStyleFilter('old_school');
    });
    
    expect(mockSearchController.applyFilters).toHaveBeenCalledWith({
      styles: []
    });
  });

  it('computes active filter counts correctly', () => {
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery({ 
        styles: ['old_school', 'realism'], 
        difficulty: ['beginner'] 
      }),
      facets: { styles: {}, locations: {}, difficulty: {} }
    });
    
    const { result } = renderHook(() => useSearchFacets());
    
    expect(result.current.activeStylesCount).toBe(2);
    expect(result.current.activeDifficultyCount).toBe(1);
    expect(result.current.hasActiveFilters).toBe(true);
  });
});

describe('useSearchHistory', () => {
  let mockSearchController;

  beforeEach(() => {
    // Get the mocked search controller
    const { searchController } = require('../search-controller.js');
    mockSearchController = searchController;
    
    jest.clearAllMocks();
    
    const mockRecentSearches = [
      new SearchQuery({ text: 'dragon' }),
      new SearchQuery({ text: 'rose' })
    ];
    
    mockSearchController.getSearchState.mockReturnValue({
      query: new SearchQuery(),
      results: null
    });
    
    mockSearchController.addListener.mockReturnValue(() => {});
    mockSearchController.getRecentSearches.mockReturnValue(mockRecentSearches);
    mockSearchController.executeSearch.mockResolvedValue({});
  });

  it('provides recent searches', () => {
    const { result } = renderHook(() => useSearchHistory());
    
    expect(result.current.recentSearches).toHaveLength(2);
    expect(result.current.hasHistory).toBe(true);
  });

  it('toggles history visibility', () => {
    const { result } = renderHook(() => useSearchHistory());
    
    expect(result.current.showHistory).toBe(false);
    
    act(() => {
      result.current.toggleHistory();
    });
    
    expect(result.current.showHistory).toBe(true);
    
    act(() => {
      result.current.hideHistory();
    });
    
    expect(result.current.showHistory).toBe(false);
  });

  it('executes historical search correctly', async () => {
    const { result } = renderHook(() => useSearchHistory());
    
    const historicalQuery = new SearchQuery({ text: 'dragon' });
    
    // Set up the mock to resolve successfully
    const { searchController } = require('../search-controller.js');
    searchController.executeSearch.mockResolvedValue({
      items: [],
      totalCount: 0,
      facets: {},
      suggestions: []
    });
    
    await act(async () => {
      await result.current.executeHistorySearch(historicalQuery);
    });
    
    expect(result.current.showHistory).toBe(false);
    expect(searchController.executeSearch).toHaveBeenCalledWith(historicalQuery);
  });

  it('clears search history', () => {
    const { result } = renderHook(() => useSearchHistory());
    
    act(() => {
      result.current.clearSearchHistory();
    });
    
    expect(mockSearchController.clearSearchHistory).toHaveBeenCalled();
  });
});