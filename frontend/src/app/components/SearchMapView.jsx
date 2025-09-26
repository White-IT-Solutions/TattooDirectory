"use client";

import React, { useState, useEffect, useRef } from "react";
import Card from "../../design-system/components/ui/Card/Card";
import Button from "../../design-system/components/ui/Button/Button";
import Badge from "../../design-system/components/ui/Badge/Badge";
import Input from "../../design-system/components/ui/Input/Input";

// Mock map component (in real app would use Google Maps, Mapbox, etc.)
const MapContainer = ({ 
  center, 
  zoom, 
  markers, 
  onMarkerClick, 
  onMapClick,
  searchRadius,
  onRadiusChange 
}) => {
  const mapRef = useRef(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Simulate map interaction
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) onMarkerClick(marker);
  };

  return (
    <div className="relative w-full h-full bg-neutral-100 rounded-lg overflow-hidden">
      {/* Mock map background */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative cursor-crosshair"
        onClick={onMapClick}
      >
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#666" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Center marker (search location) */}
        {center && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ 
              left: '50%', 
              top: '50%' 
            }}
          >
            <div className="relative">
              {/* Search radius circle */}
              <div 
                className="absolute border-2 border-primary-500 border-dashed rounded-full opacity-30"
                style={{
                  width: `${searchRadius * 4}px`,
                  height: `${searchRadius * 4}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {/* Center pin */}
              <div className="w-6 h-6 bg-primary-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Result markers */}
        {markers.map((marker, index) => {
          const x = 30 + (index % 8) * 80; // Distribute markers across map
          const y = 30 + Math.floor(index / 8) * 80;
          
          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className={`
                w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold
                ${marker.type === 'artist' ? 'bg-blue-500' : 
                  marker.type === 'studio' ? 'bg-green-500' : 'bg-purple-500'}
                ${selectedMarker?.id === marker.id ? 'ring-2 ring-yellow-400' : ''}
                hover:scale-110 transition-transform
              `}>
                {marker.type === 'artist' ? '👤' : 
                 marker.type === 'studio' ? '🏢' : '🎨'}
              </div>
              
              {/* Marker popup */}
              {selectedMarker?.id === marker.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30">
                  <Card className="p-3 min-w-48 shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{marker.name}</h4>
                      <Badge 
                        variant={marker.type === 'artist' ? 'primary' : 
                                marker.type === 'studio' ? 'secondary' : 'accent'}
                        size="sm"
                      >
                        {marker.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 mb-2">{marker.location}</p>
                    {marker.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-yellow-500 text-xs">⭐</span>
                        <span className="text-xs">{marker.rating}</span>
                      </div>
                    )}
                    <Button size="sm" onClick={() => onMarkerClick(marker)}>
                      View Details
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0"
          onClick={() => console.log("Zoom in")}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0"
          onClick={() => console.log("Zoom out")}
        >
          −
        </Button>
      </div>

      {/* Radius control */}
      <div className="absolute bottom-4 left-4 z-20">
        <Card className="p-3">
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Search Radius
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="100"
              value={searchRadius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-neutral-600">{searchRadius} miles</span>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20">
        <Card className="p-3">
          <h4 className="text-xs font-medium text-neutral-700 mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs">Artists</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-xs">Studios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
              <span className="text-xs">Search Center</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function SearchMapView({ 
  results = [], 
  searchLocation = "", 
  searchRadius = 25,
  onLocationChange,
  onRadiusChange,
  onResultSelect 
}) {
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(10);
  const [locationInput, setLocationInput] = useState(searchLocation);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Convert results to map markers
  const markers = results.map(result => ({
    id: result.id || `${result.type}-${result.name}`,
    name: result.name,
    type: result.type,
    location: result.location,
    rating: result.rating,
    coordinates: {
      // Mock coordinates - in real app would geocode addresses
      lat: 51.5074 + (Math.random() - 0.5) * 0.1,
      lng: -0.1278 + (Math.random() - 0.5) * 0.1
    }
  }));

  // Handle location search
  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return;

    setIsGeocoding(true);
    
    // Mock geocoding - in real app would use Google Maps Geocoding API
    setTimeout(() => {
      setMapCenter({
        lat: 51.5074 + (Math.random() - 0.5) * 0.05,
        lng: -0.1278 + (Math.random() - 0.5) * 0.05
      });
      setIsGeocoding(false);
      
      if (onLocationChange) {
        onLocationChange(locationInput);
      }
    }, 1000);
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationInput("Current Location");
          if (onLocationChange) {
            onLocationChange("Current Location");
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your current location. Please enter a location manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Handle marker click
  const handleMarkerClick = (marker) => {
    const result = results.find(r => 
      (r.id && r.id === marker.id) || 
      (r.name === marker.name && r.type === marker.type)
    );
    
    if (result && onResultSelect) {
      onResultSelect(result);
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Location Search Header */}
      <div className="p-4 border-b border-neutral-200 bg-white">
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter city, postcode, or area..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
            />
          </div>
          <Button
            onClick={handleLocationSearch}
            disabled={isGeocoding || !locationInput.trim()}
          >
            {isGeocoding ? "Searching..." : "Search"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCurrentLocation}
            title="Use current location"
          >
            📍
          </Button>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            {results.length} results 
            {searchLocation && ` near ${searchLocation}`}
            {searchRadius && ` within ${searchRadius} miles`}
          </span>
          <div className="flex items-center gap-4">
            <span>Artists: {results.filter(r => r.type === 'artist').length}</span>
            <span>Studios: {results.filter(r => r.type === 'studio').length}</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {mapCenter ? (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onMapClick={(e) => console.log("Map clicked", e)}
            searchRadius={searchRadius}
            onRadiusChange={handleRadiusChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-neutral-100">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Search a Location
              </h3>
              <p className="text-neutral-600 mb-4">
                Enter a location above to see results on the map
              </p>
              <Button onClick={handleCurrentLocation}>
                Use Current Location
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Map Instructions */}
      <div className="p-3 bg-neutral-50 border-t border-neutral-200">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>Click markers to view details • Drag to adjust search radius</span>
          <div className="flex items-center gap-4">
            <span>🔵 Artists</span>
            <span>🟢 Studios</span>
            <span>🔴 Search Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}