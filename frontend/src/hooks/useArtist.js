import { useState, useCallback } from 'react';
import { apiService } from '../lib/api-service';

/**
 * Artist hook for fetching individual artist data
 * Uses API service layer for environment-based switching
 */
export const useArtist = () => {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArtist = useCallback(async (id) => {
    if (!id) {
      setError('Artist ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setArtist(null);
    
    try {
      const response = await apiService.getArtistById(id);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch artist');
      }
      
      setArtist(response.data.artist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artist');
      setArtist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearArtist = useCallback(() => {
    setArtist(null);
    setError(null);
  }, []);

  return { artist, loading, error, fetchArtist, clearArtist };
};