import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Grid,
  Map,
  MapPin,
  Instagram,
  ExternalLink,
  Filter,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StyleFilter from "../components/features/search/StyleFilter";
import MasonryView from "../components/features/artist/MasonryView";

const ArtistSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "masonry">(
    searchParams.get("view") === "map"
      ? "map"
      : searchParams.get("view") === "masonry"
      ? "masonry"
      : "grid"
  );

  const tattooStyles = [
    "Geometric",
    "Dotwork",
    "Watercolor",
    "Neotraditional",
    "Blackwork",
    "Minimalism",
    "Japanese",
    "Newschool",
    "Traditional",
    "Realism",
    "Tribal",
    "Illustrative",
    "Lettering",
    "Sketch",
    "Floral",
    "Anime",
    "Fineline",
  ];

  // Mock artist data
  const mockArtists = [
    {
      id: 1,
      name: "Alex Rivera",
      location: "Los Angeles, CA",
      styles: ["Geometric", "Dotwork", "Minimalism"],
      portfolio: [
        "https://images.unsplash.com/photo-1565058739-8f60b7c6f9b3",
        "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d",
      ],
      instagram: "@alexrivera_ink",
      bio: "Specializing in geometric and minimalist designs with 8+ years experience.",
    },
    {
      id: 2,
      name: "Maya Chen",
      location: "Portland, OR",
      styles: ["Watercolor", "Floral", "Illustrative"],
      portfolio: [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        "https://images.unsplash.com/photo-1590736969955-71cc94901144",
      ],
      instagram: "@mayachen_tattoo",
      bio: "Artist focused on watercolor and botanical tattoo artistry.",
    },
    {
      id: 3,
      name: "Jake Morrison",
      location: "Austin, TX",
      styles: ["Traditional", "Neotraditional", "Realism"],
      portfolio: [
        "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d",
        "https://images.unsplash.com/photo-1565058739-8f60b7c6f9b3",
      ],
      instagram: "@jakeink_austin",
      bio: "Traditional and neo-traditional specialist with award-winning portfolio.",
    },
  ];

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "map") {
      setViewMode("map");
    } else if (view === "masonry") {
      setViewMode("masonry");
    }
  }, [searchParams]);

  const handleStyleToggle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleViewChange = (view: "grid" | "map" | "masonry") => {
    setViewMode(view);
    if (view === "map") {
      setSearchParams({ view: "map" });
    } else if (view === "masonry") {
      setSearchParams({ view: "masonry" });
    } else {
      setSearchParams({});
    }
  };

  const filteredArtists = mockArtists.filter((artist) => {
    const matchesSearch =
      searchTerm === "" ||
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStyles =
      selectedStyles.length === 0 ||
      selectedStyles.some((style) => artist.styles.includes(style));

    return matchesSearch && matchesStyles;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Tattoo Artists
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover talented artists and explore their portfolios
          </p>
        </div>

        {/* Search Controls */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by artist name, location, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          {/* Enhanced Style Filters */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground text-lg">
                Browse by Style:
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3">
              {tattooStyles.map((style) => (
                <StyleFilter
                  key={style}
                  style={style}
                  isSelected={selectedStyles.includes(style)}
                  onToggle={handleStyleToggle}
                />
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">View:</span>
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("grid")}
                className="h-8"
              >
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === "masonry" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("masonry")}
                className="h-8"
              >
                <Columns3 className="w-4 h-4 mr-1" />
                Masonry
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("map")}
                className="h-8"
              >
                <Map className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Card
                key={artist.id}
                className="group hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  {/* Portfolio Images */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {artist.portfolio.slice(0, 2).map((image, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${artist.name} portfolio ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Artist Info */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {artist.name}
                  </h3>

                  <div className="flex items-center text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{artist.location}</span>
                  </div>

                  {/* Styles */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {artist.styles.map((style) => (
                      <Badge
                        key={style}
                        variant="secondary"
                        className="text-xs"
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>

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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === "masonry" ? (
          <MasonryView artists={filteredArtists} />
        ) : (
          <Card className="h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Interactive Map
              </h3>
              <p className="text-muted-foreground">
                Map integration would be implemented here using Mapbox or
                similar service
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mt-8 text-center text-muted-foreground">
          Showing {filteredArtists.length} of {mockArtists.length} artists
        </div>
      </div>
    </div>
  );
};

export default ArtistSearch;
