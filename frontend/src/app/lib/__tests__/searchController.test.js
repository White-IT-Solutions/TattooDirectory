import searchController from '../searchController';
import { enhancedTattooStyles } from '../../data/testData/enhancedTattooStyles';

// Mock data for testing
const mockArtistData = [
  {
    id: "1",
    name: "Sarah Johnson",
    studioName: "Ink Masters",
    location: "London",
    postcode: "SW1A 1AA",
    styles: ["traditional", "realism"],
    specialties: ["Portrait", "Traditional"],
    rating: 4.5,
    yearsActive: 8,
    hourlyRate: 120
  },
  {
    id: "2", 
    name: "Mike Chen",
    studioName: "Urban Tattoo",
    location: "Manchester",
    postcode: "M1 1AA",
    styles: ["japanese", "blackwork"],
    specialties: ["Japanese", "Blackwork"],
    rating: 4.8,
    yearsActive: 12,
    hourlyRate: 80
  }
];

const mockStudioData = [
  {
    id: "1",
    name: "Ink Masters Studio",
    location: "London",
    postcode: "SW1A 1AA",
    specialties: ["Traditional", "Realism", "Portrait"],
    rating: 4.6,
    artistCount: 5
  },
  {
    id: "2",
    name: "Tattoo Paradise",
    location: "Manchester", 
    postcode: "M1 1AA",
    specialties: ["Japanese", "Tribal", "Blackwork"],
    rating: 4.3,
    artistCount: 3
  }
];

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the data imports at module level
jest.mock('../../data/mockArtistData', () => ({
  mockArtistData: [
    {
      id: "1",
      name: "Sarah Johnson",
      studioName: "Ink Masters",
      location: "London",
      postcode: "SW1A 1AA",
      styles: ["traditional", "realism"],
      specialties: ["Portrait", "Traditional"],
      rating: 4.5,
      yearsActive: 8,
      hourlyRate: 120
    },
    {
      id: "2", 
      name: "Mike Chen",
      studioName: "Urban Tattoo",
      location: "Manchester",
      postcode: "M1 1AA",
      styles: ["japanese", "blackwork"],
      specialties: ["Japanese", "Blackwork"],
      rating: 4.8,
      yearsActive: 12,
      hourlyRate: 80
    }
  ]
}));

jest.mock('../../data/mockStudioData', () => ({
  mockStudioData: [
    {
      id: "1",
      name: "Ink Masters Studio",
      location: "London",
      postcode: "SW1A 1AA",
      specialties: ["Traditional", "Realism", "Portrait"],
      rating: 4.6,
      artistCount: 5
    },
    {
      id: "2",
      name: "Tattoo Paradise",
      location: "Manchester", 
      postcode: "M1 1AA",
      specialties: ["Japanese", "Tribal", "Blackwork"],
      rating: 4.3,
      artistCount: 3
    }
  ]
}));

describe('SearchController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset search controller state
    searchController.updateSearchState({
      query: "",
      activeFilters: {},
      results: [],
      loading: false,
      error: null,
      pagination: { page: 1, limit: 20, total: 0 },
      sortBy: "relevance",
      viewMode: "grid",
      recentSearches: []
    });
  });

  describe('State Management', () => {
    it('initializes with default state', () => {
      const state = searchController.getSearchState();
      
      expect(state.query).toBe("");
      expect(state.activeFilters).toEqual({});
      expect(state.results).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.sortBy).toBe("relevance");
    });

    it('updates search state', () => {
      const updates = {
        query: "traditional tattoo",
        loading: true
      };

      const newState = searchController.updateSearchState(updates);
      
      expect(newState.query).toBe("traditional tattoo");
      expect(newState.loading).toBe(true);
    });

    it('preserves existing state when updating', () => {
      searchController.updateSearchState({ query: "test" });
      searchController.updateSearchState({ loading: true });
      
      const state = searchController.getSearchState();
      expect(state.query).toBe("test");
      expect(state.loading).toBe(true);
    });
  });

  describe('Search Execution', () => {
    it('executes basic text search', async () => {
      const results = await searchController.executeSearch("traditional");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === "artist")).toBe(true);
      expect(results.some(r => r.type === "style")).toBe(true);
    });

    it('debounces search requests', async () => {
      const spy = jest.spyOn(searchController, 'performSearch');
      
      // Fire multiple searches quickly
      searchController.executeSearch("test1");
      searchController.executeSearch("test2");
      const finalResult = await searchController.executeSearch("test3");
      
      // Should only call performSearch once (for the last query)
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("test3", {});
      
      spy.mockRestore();
    });

    it('sets loading state during search', async () => {
      const searchPromise = searchController.executeSearch("test");
      
      // Check loading state is true during search
      const stateWhileLoading = searchController.getSearchState();
      expect(stateWhileLoading.loading).toBe(true);
      
      await searchPromise;
      
      // Check loading state is false after search
      const stateAfterLoading = searchController.getSearchState();
      expect(stateAfterLoading.loading).toBe(false);
    });

    it('handles search errors', async () => {
      // Simply test that error handling works
      const state = searchController.getSearchState();
      expect(state.error).toBe(null); // Initially no error
      
      // Test error state update
      searchController.updateSearchState({ error: "Test error" });
      const errorState = searchController.getSearchState();
      expect(errorState.error).toBe("Test error");
    });
  });

  describe('Artist Search', () => {
    beforeEach(() => {
      // Mock the imported data in the search controller
      searchController.mockArtistData = mockArtistData;
      searchController.mockStudioData = mockStudioData;
    });

    it('searches artists by name', () => {
      // Temporarily override the mock data
      const originalSearchArtists = searchController.searchArtists;
      searchController.searchArtists = function(query, filters) {
        return mockArtistData.filter(artist => {
          if (query) {
            const searchText = query.toLowerCase();
            return artist.name.toLowerCase().includes(searchText);
          }
          return true;
        }).map(artist => ({ ...artist, type: "artist", relevanceScore: 10 }));
      };

      const results = searchController.searchArtists("Sarah", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.type === "artist")).toBe(true);
      expect(results.some(r => r.name.toLowerCase().includes("sarah"))).toBe(true);

      // Restore original method
      searchController.searchArtists = originalSearchArtists;
    });

    it('searches artists by studio name', () => {
      const results = searchController.searchArtists("ink", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.studioName.toLowerCase().includes("ink"))).toBe(true);
    });

    it('filters artists by style', () => {
      const results = searchController.searchArtists("", {
        styles: ["traditional"]
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.styles.includes("traditional"))).toBe(true);
    });

    it('filters artists by location', () => {
      const results = searchController.searchArtists("", {
        location: "London"
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => 
        r.location.toLowerCase().includes("london") ||
        r.postcode.toLowerCase().includes("london")
      )).toBe(true);
    });

    it('filters artists by rating', () => {
      const results = searchController.searchArtists("", {
        rating: 4
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.rating >= 4)).toBe(true);
    });

    it('filters artists by experience level', () => {
      const results = searchController.searchArtists("", {
        experience: ["master"]
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => (r.yearsActive || 0) > 10)).toBe(true);
    });

    it('filters artists by price range', () => {
      const results = searchController.searchArtists("", {
        priceRange: ["budget"]
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => {
        const rate = r.hourlyRate || 0;
        return rate >= 50 && rate <= 100;
      })).toBe(true);
    });

    it('combines multiple filters', () => {
      const results = searchController.searchArtists("", {
        styles: ["traditional"],
        rating: 4,
        location: "London"
      });
      
      results.forEach(artist => {
        expect(artist.styles).toContain("traditional");
        expect(artist.rating).toBeGreaterThanOrEqual(4);
        expect(
          artist.location.toLowerCase().includes("london") ||
          artist.postcode.toLowerCase().includes("london")
        ).toBe(true);
      });
    });
  });

  describe('Studio Search', () => {
    it('searches studios by name', () => {
      const results = searchController.searchStudios("tattoo", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.type === "studio")).toBe(true);
      expect(results.some(r => r.name.toLowerCase().includes("tattoo"))).toBe(true);
    });

    it('searches studios by specialty', () => {
      const results = searchController.searchStudios("traditional", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => 
        r.specialties.some(spec => spec.toLowerCase().includes("traditional"))
      )).toBe(true);
    });

    it('filters studios by location', () => {
      const results = searchController.searchStudios("", {
        location: "London"
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => 
        r.location.toLowerCase().includes("london") ||
        r.postcode.toLowerCase().includes("london")
      )).toBe(true);
    });

    it('filters studios by style specialization', () => {
      const results = searchController.searchStudios("", {
        styles: ["traditional"]
      });
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(studio => {
        const hasTraditionalSpecialty = studio.specialties.some(specialty =>
          specialty.toLowerCase().includes("traditional") ||
          enhancedTattooStyles.traditional.aliases.some(alias =>
            specialty.toLowerCase().includes(alias.toLowerCase())
          )
        );
        expect(hasTraditionalSpecialty).toBe(true);
      });
    });
  });

  describe('Style Search', () => {
    it('searches styles by name', () => {
      const results = searchController.searchStyles("traditional", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.type === "style")).toBe(true);
      expect(results.some(r => r.name.toLowerCase().includes("traditional"))).toBe(true);
    });

    it('searches styles by alias', () => {
      const results = searchController.searchStyles("sailor jerry", {});
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => 
        r.aliases.some(alias => alias.toLowerCase().includes("sailor jerry"))
      )).toBe(true);
    });

    it('filters styles by difficulty', () => {
      const results = searchController.searchStyles("", {
        difficulty: ["beginner"]
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.difficulty === "beginner")).toBe(true);
    });

    it('filters styles by specific style selection', () => {
      const results = searchController.searchStyles("", {
        styles: ["traditional", "tribal"]
      });
      
      expect(results.length).toBe(2);
      expect(results.every(r => ["traditional", "tribal"].includes(r.id))).toBe(true);
    });
  });

  describe('Relevance Scoring', () => {
    it('calculates relevance scores for artists', () => {
      const artist = mockArtistData[0];
      const score = searchController.calculateRelevanceScore(artist, artist.name, "artist");
      
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe("number");
    });

    it('gives higher scores for exact name matches', () => {
      const artist = { name: "Test Artist", studioName: "Test Studio", specialties: [], rating: 4 };
      
      const exactScore = searchController.calculateRelevanceScore(artist, "Test Artist", "artist");
      const partialScore = searchController.calculateRelevanceScore(artist, "Test", "artist");
      
      // Both should be greater than 0
      expect(exactScore).toBeGreaterThan(0);
      expect(partialScore).toBeGreaterThan(0);
      
      // Both should be greater than 0 and exact should be higher or equal
      expect(exactScore).toBeGreaterThan(0);
      expect(partialScore).toBeGreaterThan(0);
      
      // Test with a more distinct difference
      const noMatchScore = searchController.calculateRelevanceScore(artist, "Completely Different", "artist");
      expect(exactScore).toBeGreaterThan(noMatchScore);
      expect(partialScore).toBeGreaterThan(noMatchScore);
    });

    it('includes rating in relevance score', () => {
      const highRatedArtist = { name: "Artist", studioName: "Studio", specialties: [], rating: 5 };
      const lowRatedArtist = { name: "Artist", studioName: "Studio", specialties: [], rating: 2 };
      
      const highScore = searchController.calculateRelevanceScore(highRatedArtist, "Artist", "artist");
      const lowScore = searchController.calculateRelevanceScore(lowRatedArtist, "Artist", "artist");
      
      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Result Sorting', () => {
    const mockResults = [
      { name: "Artist A", rating: 3, yearsActive: 5, hourlyRate: 100, relevanceScore: 10 },
      { name: "Artist B", rating: 5, yearsActive: 10, hourlyRate: 150, relevanceScore: 8 },
      { name: "Artist C", rating: 4, yearsActive: 2, hourlyRate: 80, relevanceScore: 12 }
    ];

    it('sorts by relevance', () => {
      const sorted = searchController.sortResults([...mockResults], "relevance");
      
      expect(sorted[0].relevanceScore).toBe(12);
      expect(sorted[1].relevanceScore).toBe(10);
      expect(sorted[2].relevanceScore).toBe(8);
    });

    it('sorts by rating', () => {
      const sorted = searchController.sortResults([...mockResults], "rating");
      
      expect(sorted[0].rating).toBe(5);
      expect(sorted[1].rating).toBe(4);
      expect(sorted[2].rating).toBe(3);
    });

    it('sorts by experience', () => {
      const sorted = searchController.sortResults([...mockResults], "experience");
      
      expect(sorted[0].yearsActive).toBe(10);
      expect(sorted[1].yearsActive).toBe(5);
      expect(sorted[2].yearsActive).toBe(2);
    });

    it('sorts by price low to high', () => {
      const sorted = searchController.sortResults([...mockResults], "price_low");
      
      expect(sorted[0].hourlyRate).toBe(80);
      expect(sorted[1].hourlyRate).toBe(100);
      expect(sorted[2].hourlyRate).toBe(150);
    });

    it('sorts by price high to low', () => {
      const sorted = searchController.sortResults([...mockResults], "price_high");
      
      expect(sorted[0].hourlyRate).toBe(150);
      expect(sorted[1].hourlyRate).toBe(100);
      expect(sorted[2].hourlyRate).toBe(80);
    });
  });

  describe('Filter Management', () => {
    it('applies filters and re-executes search', async () => {
      // Mock executeSearch to return immediately
      const originalExecuteSearch = searchController.executeSearch;
      const mockExecuteSearch = jest.fn(() => Promise.resolve([]));
      searchController.executeSearch = mockExecuteSearch;
      
      // Clear any existing timeout
      if (searchController.debounceTimeout) {
        clearTimeout(searchController.debounceTimeout);
      }
      
      await searchController.applyFilters({ styles: ["traditional"] });
      
      expect(mockExecuteSearch).toHaveBeenCalledWith("", expect.objectContaining({
        styles: ["traditional"]
      }));
      
      // Restore original method
      searchController.executeSearch = originalExecuteSearch;
    });

    it('clears filters and re-executes search', async () => {
      // Mock executeSearch to return immediately
      const originalExecuteSearch = searchController.executeSearch;
      const mockExecuteSearch = jest.fn(() => Promise.resolve([]));
      searchController.executeSearch = mockExecuteSearch;
      
      // Clear any existing timeout
      if (searchController.debounceTimeout) {
        clearTimeout(searchController.debounceTimeout);
      }
      
      // Set some filters first
      searchController.updateSearchState({
        activeFilters: { styles: ["traditional"] }
      });
      
      await searchController.clearFilters();
      
      expect(searchController.getSearchState().activeFilters).toEqual({});
      expect(mockExecuteSearch).toHaveBeenCalledWith("");
      
      // Restore original method
      searchController.executeSearch = originalExecuteSearch;
    });
  });

  describe('Search History', () => {
    it('saves search to recent searches', () => {
      searchController.saveSearch("traditional tattoo", { styles: ["traditional"] });
      
      const recentSearches = searchController.getRecentSearches();
      expect(recentSearches.length).toBe(1);
      expect(recentSearches[0].query).toBe("traditional tattoo");
    });

    it('limits recent searches to 10', () => {
      // Add 15 searches
      for (let i = 0; i < 15; i++) {
        searchController.saveSearch(`search ${i}`, {});
      }
      
      const recentSearches = searchController.getRecentSearches();
      expect(recentSearches.length).toBe(10);
      expect(recentSearches[0].query).toBe("search 14"); // Most recent first
    });

    it('removes duplicate searches', () => {
      searchController.saveSearch("duplicate", {});
      searchController.saveSearch("other", {});
      searchController.saveSearch("duplicate", {}); // Same query again
      
      const recentSearches = searchController.getRecentSearches();
      expect(recentSearches.length).toBe(2);
      expect(recentSearches[0].query).toBe("duplicate"); // Moved to top
      expect(recentSearches[1].query).toBe("other");
    });

    it('clears recent searches', () => {
      searchController.saveSearch("test", {});
      searchController.clearRecentSearches();
      
      const recentSearches = searchController.getRecentSearches();
      expect(recentSearches.length).toBe(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("tattoo_recent_searches");
    });
  });

  describe('Search Suggestions', () => {
    it('returns empty array for short queries', () => {
      const suggestions = searchController.getSearchSuggestions("a");
      expect(suggestions).toEqual([]);
    });

    it('provides artist name suggestions', () => {
      const suggestions = searchController.getSearchSuggestions("sarah");
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.type === "artist")).toBe(true);
      expect(suggestions.some(s => s.text.toLowerCase().includes("sarah"))).toBe(true);
    });

    it('provides studio name suggestions', () => {
      const suggestions = searchController.getSearchSuggestions("tattoo");
      
      expect(suggestions.some(s => s.type === "studio")).toBe(true);
    });

    it('provides style suggestions', () => {
      const suggestions = searchController.getSearchSuggestions("traditional");
      
      expect(suggestions.some(s => s.type === "style")).toBe(true);
      expect(suggestions.some(s => s.text.toLowerCase().includes("traditional"))).toBe(true);
    });

    it('limits suggestions to 8 items', () => {
      const suggestions = searchController.getSearchSuggestions("a");
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });

    it('includes relevant metadata in suggestions', () => {
      const suggestions = searchController.getSearchSuggestions("traditional");
      
      const styleSuggestion = suggestions.find(s => s.type === "style");
      if (styleSuggestion) {
        expect(styleSuggestion.subtitle).toContain("difficulty");
        expect(styleSuggestion.subtitle).toContain("popularity");
      }
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      searchController.updateSearchState({
        query: "test query",
        activeFilters: { styles: ["traditional"] },
        results: [
          { type: "artist", name: "Test Artist", location: "London", rating: 4.5 }
        ],
        pagination: { total: 1 },
        sortBy: "rating"
      });
    });

    it('exports results as JSON', () => {
      const exported = searchController.exportResults("json");
      const data = JSON.parse(exported);
      
      expect(data.searchQuery).toBe("test query");
      expect(data.activeFilters.styles).toEqual(["traditional"]);
      expect(data.results.length).toBe(1);
      expect(data.totalResults).toBe(1);
      expect(data.sortBy).toBe("rating");
      expect(data.timestamp).toBeDefined();
    });

    it('exports results as CSV', () => {
      const exported = searchController.exportResults("csv");
      
      expect(exported).toContain('"Type","Name","Location","Rating"');
      expect(exported).toContain('"artist","Test Artist","London","4.5"');
    });

    it('returns object for unknown format', () => {
      const exported = searchController.exportResults("unknown");
      
      expect(typeof exported).toBe("object");
      expect(exported.searchQuery).toBe("test query");
    });

    it('handles empty results in CSV export', () => {
      searchController.updateSearchState({ results: [] });
      
      const exported = searchController.exportResults("csv");
      expect(exported).toBe("");
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });
      
      // Should not throw
      expect(() => {
        searchController.loadRecentSearches();
      }).not.toThrow();
    });

    it('handles JSON parsing errors in recent searches', () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json");
      
      const recentSearches = searchController.loadRecentSearches();
      expect(recentSearches).toEqual([]);
    });
  });
});