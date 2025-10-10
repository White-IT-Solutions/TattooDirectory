import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

/**
 * Hook for fetching featured artists for the homepage
 * Fetches artists and filters for high-rated ones
 */
export function useFeaturedArtists(limit = 20) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedArtists = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use search API with a broad query to get all artists
        const response = await api.searchArtists({ 
          query: 'tattoo' // Broad search term to get all artists
        });
        
        if (response && Array.isArray(response)) {
          // Filter for high-rated artists (4.2+ rating) and take first 6
          const featuredArtists = response
            .filter(artist => artist.rating >= 4.2)
            .slice(0, 6);
          
          setArtists(featuredArtists);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching featured artists:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured artists');
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedArtists();
  }, [limit]);

  return { artists, loading, error };
}