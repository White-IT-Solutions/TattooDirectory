import { NextResponse } from 'next/server';
import { mockArtistData } from '../../../data/mockArtistData';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Find artist by ID
    const artist = mockArtistData.find(a => 
      a.artistId === id || 
      a.PK === id ||
      a.id === id
    );
    
    if (!artist) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Artist not found',
          message: `Artist with ID ${id} does not exist`
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        artist: {
          ...artist,
          type: 'artist',
          id: artist.artistId || artist.PK
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