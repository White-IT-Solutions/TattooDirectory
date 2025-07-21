
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Instagram, ExternalLink } from "lucide-react";

interface Artist {
  id: number;
  name: string;
  location: string;
  styles: string[];
  portfolio: string[];
  instagram: string;
  bio: string;
}

interface MasonryViewProps {
  artists: Artist[];
}

const MasonryView: React.FC<MasonryViewProps> = ({ artists }) => {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {artists.map((artist) => (
        <Card key={artist.id} className="break-inside-avoid group hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-0">
            {/* Portfolio Images - More Prominent */}
            <div className="space-y-2">
              {artist.portfolio.map((image, idx) => (
                <div key={idx} className="relative overflow-hidden bg-muted">
                  <img 
                    src={image} 
                    alt={`${artist.name} portfolio ${idx + 1}`}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ aspectRatio: idx === 0 ? '4/5' : '1/1' }}
                  />
                </div>
              ))}
            </div>

            {/* Artist Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">{artist.name}</h3>
              
              <div className="flex items-center text-muted-foreground mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{artist.location}</span>
              </div>

              {/* Styles */}
              <div className="flex flex-wrap gap-1 mb-4">
                {artist.styles.map((style) => (
                  <Badge key={style} variant="secondary" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>

              {/* Bio */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {artist.bio}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
                <Button variant="ghost" size="sm">
                  <Instagram className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MasonryView;
