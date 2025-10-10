import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

/**
 * Hook for fetching artist statistics for the homepage
 * Gets all artists to calculate stats like total count, styles, cities
 */
export function useArtistsStats() {
  const [stats, setStats] = useState({
    totalArtists: 0,
    totalStyles: 0,
    totalCities: 0,
    allArtists: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtistsStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use search API with a broad query to get all artists
        const response = await api.searchArtists({ 
          query: 'tattoo' // Broad search term to get all artists
        });
        
        if (response && Array.isArray(response)) {
          const artists = response;
          
          // Calculate stats
          const totalArtists = artists.length;
          const allStyles = artists.flatMap(artist => artist.styles || []);
          const uniqueStyles = [...new Set(allStyles)];
          const totalStyles = uniqueStyles.length;
          
          // Extract cities from location data
          const cities = artists
            .map(artist => {
              if (artist.locationDisplay) {
                const parts = artist.locationDisplay.split(',');
                return parts[1]?.trim() || 'UK';
              }
              return 'UK';
            })
            .filter(city => city !== 'UK');
          const uniqueCities = [...new Set(cities)];
          const totalCities = uniqueCities.length || 1; // At least 1 for UK
          
          setStats({
            totalArtists,
            totalStyles,
            totalCities,
            allArtists: artists
          });
        } else {
          throw new Error(response.message || 'Failed to fetch artists stats');
        }
      } catch (err) {
        console.error('Error fetching artists stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch artists stats');
        // Set default stats on error
        setStats({
          totalArtists: 0,
          totalStyles: 0,
          totalCities: 0,
          allArtists: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtistsStats();
  }, []);

  return { stats, loading, error };
}