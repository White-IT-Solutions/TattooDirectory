"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Instagram, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";

interface ArtistProfileProps {
  id: string;
}

interface Artist {
  id: string;
  name: string;
  location: string;
  bio: string;
  styles: string[];
  instagram: string;
  portfolio: string[];
  profileImage: string;
}

const ArtistProfile = ({ id }: ArtistProfileProps) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate and sanitize the id parameter
  const validateId = (id: string): boolean => {
    // Check if id is a non-empty string and contains only alphanumeric characters and hyphens
    return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9-_]+$/.test(id);
  };

  // Mock data fetching function - in real app, this would fetch from API
  const fetchArtistData = async (artistId: string): Promise<Artist> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock artist data - in real app, this would be fetched based on id
    return {
      id: artistId,
      name: "Alex Rivera",
      location: "Los Angeles, CA",
      bio: "Alex is a renowned tattoo artist specializing in geometric and minimalist designs. With over 8 years of experience in the industry, Alex has developed a unique style that combines precision with artistic flair. Known for clean lines, perfect symmetry, and innovative geometric patterns that flow naturally with the body's contours.",
      styles: ["Geometric", "Dotwork", "Minimalism", "Abstract"],
      instagram: "@alexrivera_ink",
      portfolio: [
        "https://images.unsplash.com/photo-1565058739-8f60b7c6f9b3",
        "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d",
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        "https://images.unsplash.com/photo-1590736969955-71cc94901144",
        "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96"
      ],
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
    };
  };

  // Effect to fetch artist data when component mounts or id changes
  useEffect(() => {
    const loadArtistData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate the id parameter
        if (!validateId(id)) {
          throw new Error('Invalid artist ID format');
        }

        const artistData = await fetchArtistData(id);
        setArtist(artistData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist data');
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    loadArtistData();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Artist Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested artist profile could not be found.'}
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Artist Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted shadow-elegant">
                <img 
                  src={artist.profileImage} 
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">{artist.name}</h1>
              
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg">{artist.location}</span>
              </div>

              {/* Styles */}
              <div className="flex flex-wrap gap-2 mb-6">
                {artist.styles.map((style) => (
                  <Badge key={style} variant="default" className="cursor-pointer hover:shadow-sm">
                    {style}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="lg">
                  <Instagram className="w-5 h-5 mr-2" />
                  Follow on Instagram
                </Button>
                <Button variant="outline" size="lg">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit Website
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Biography */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {artist.bio}
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Gallery */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Portfolio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artist.portfolio.map((image, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group">
                    <img 
                      src={image} 
                      alt={`${artist.name} portfolio ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full p-0">
                  <div className="aspect-square w-full">
                    <img 
                      src={image} 
                      alt={`${artist.name} portfolio ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>

        {/* Delisting Notice */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Artist Information Management
                </h3>
                <p className="text-muted-foreground mb-4">
                  If you are this artist and would like to update your information or request removal from our directory, please use the form below.
                </p>
                <Button variant="accent">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Artist Delisting Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArtistProfile;