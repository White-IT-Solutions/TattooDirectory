// Artist-related type definitions based on the project documentation

export interface Artist {
  id: string;
  artistName: string;
  instagramHandle: string;
  locationCity: string;
  locationCountry: string;
  styles: string[];
  profilePicture?: string;
  biography?: string;
  portfolioImages: PortfolioImage[];
  studioName?: string;
  studioAddress?: string;
}

export interface PortfolioImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface ArtistSearchParams {
  styles?: string[];
  location?: string;
  keywords?: string;
  page?: number;
  limit?: number;
}

export interface ArtistSearchResponse {
  artists: Artist[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// Available tattoo styles as defined in the documentation
export const TATTOO_STYLES = [
  'Geometric',
  'Dotwork', 
  'Watercolor',
  'Neotraditional',
  'Blackwork',
  'Minimalism',
  'Japanese',
  'Newschool',
  'Traditional',
  'Realism',
  'Tribal',
  'Illustrative',
  'Lettering',
  'Sketch',
  'Floral',
  'Anime',
  'Fineline'
] as const;

export type TattooStyle = typeof TATTOO_STYLES[number];