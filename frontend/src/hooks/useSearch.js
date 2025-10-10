import { useState, useCallback } from 'react';
import { apiService } from '../lib/api-service';

/**
 * Search hook that provides search functionality
 * Uses API service layer for environment-based switching
 */
export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = {
        q: params.query || '',
        location: params.location || '',
        style: params.style || ''
      };
      
      const response = await apiService.searchArtists(searchParams);
      
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }
      
      setResults(response.data.artists || []);
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