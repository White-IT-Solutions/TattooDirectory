import { NextResponse } from 'next/server';
import { mockArtistData } from '../../data/mockArtistData';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const style = searchParams.get('style') || '';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filteredResults = [...mockArtistData];
    
    // Filter by text query
    if (query.trim()) {
      const searchQuery = query.toLowerCase();
      filteredResults = filteredResults.filter(artist => 
        (artist.artistName || artist.name || '').toLowerCase().includes(searchQuery) ||
        (artist.bio || '').toLowerCase().includes(searchQuery) ||
        (artist.styles || []).some(s => s.toLowerCase().includes(searchQuery)) ||
        (artist.location || artist.locationDisplay || '').toLowerCase().includes(searchQuery)
      );
    }
    
    // Filter by location
    if (location.trim()) {
      const locationQuery = location.toLowerCase();
      filteredResults = filteredResults.filter(artist => 
        (artist.location || artist.locationDisplay || '').toLowerCase().includes(locationQuery)
      );
    }
    
    // Filter by style
    if (style.trim()) {
      const styleQuery = style.toLowerCase();
      filteredResults = filteredResults.filter(artist => 
        (artist.styles || []).some(s => s.toLowerCase().includes(styleQuery))
      );
    }
    
    // Add result metadata
    const results = filteredResults.map(artist => ({
      ...artist,
      type: 'artist',
      id: artist.artistId || artist.PK
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        artists: results,
        total: results.length,
        query: {
          text: query,
          location,
          style
        }
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}