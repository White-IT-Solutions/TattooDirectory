import { useState, useEffect } from 'react';
import { mockArtistData } from '../app/data/mockArtistData';

/**
 * Artist hook that provides individual artist data
 * Uses mock data for now, can be easily switched to real API
 */
export const useArtist = (id) => {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchArtist = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find artist in mock data
        const foundArtist = mockArtistData.find(artist => 
          artist.artistId === id || 
          artist.PK === id ||
          artist.id === id
        );
        
        if (!foundArtist) {
          throw new Error(`Artist with ID ${id} not found`);
        }
        
        setArtist(foundArtist);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist');
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  return { artist, loading, error };
};