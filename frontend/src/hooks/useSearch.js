import { useState, useCallback } from 'react';
import { mockArtistData } from '../app/data/mockArtistData';

/**
 * Search hook that provides search functionality
 * Can use either API or mock data based on environment
 */
export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to use API first, fallback to mock data
      const useAPI = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      
      if (useAPI) {
        // Use API endpoint
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.append('q', params.query);
        if (params.location) queryParams.append('location', params.location);
        if (params.style) queryParams.append('style', params.style);
        
        const response = await fetch(`/api/artists?${queryParams}`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'API request failed');
        }
        
        setResults(data.data.artists || []);
        return;
      }
      
      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      let filteredResults = [...mockArtistData];
      
      // Filter by text query (if provided)
      if (params.query && params.query.trim()) {
        const query = params.query.toLowerCase();
        filteredResults = filteredResults.filter(artist => 
          (artist.artistName || artist.name || '').toLowerCase().includes(query) ||
          (artist.bio || '').toLowerCase().includes(query) ||
          (artist.styles || []).some(style => style.toLowerCase().includes(query)) ||
          (artist.location || artist.locationDisplay || '').toLowerCase().includes(query)
        );
      }
      
      // Filter by location
      if (params.location) {
        const location = params.location.toLowerCase();
        filteredResults = filteredResults.filter(artist => 
          (artist.location || artist.locationDisplay || '').toLowerCase().includes(location)
        );
      }
      
      // Filter by style
      if (params.style) {
        const style = params.style.toLowerCase();
        filteredResults = filteredResults.filter(artist => 
          (artist.styles || []).some(s => s.toLowerCase().includes(style))
        );
      }
      
      // Add result type for consistency
      const resultsWithType = filteredResults.map(artist => ({
        ...artist,
        type: 'artist',
        id: artist.artistId || artist.PK
      }));
      
      setResults(resultsWithType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
};