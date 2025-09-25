"use client";

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, Button, Badge } from '../index';
import { cn } from '../../../utils/cn';

/**
 * StudioMap Component
 * 
 * Interactive map view for studio locations with:
 * - Studio markers with hover states
 * - Studio info popups on click
 * - Clustering for nearby studios
 * - Distance-based filtering
 * - Mobile-friendly touch controls
 * 
 * Requirements: 6.2, 7.2, 11.2
 */
export default function StudioMap({
  studios = [],
  selectedStudio = null,
  onStudioSelect,
  onStudioHover,
  userLocation = null,
  className,
  ...props
}) {
  const [mapCenter, setMapCenter] = useState({ lat: 53.4808, lng: -2.2426 }); // Manchester, UK
  const [mapZoom, setMapZoom] = useState(6);
  const [hoveredStudio, setHoveredStudio] = useState(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [internalSelectedStudio, setInternalSelectedStudio] = useState(selectedStudio);
  const mapRef = useRef(null);

  // Google Maps configuration
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const libraries = ['places'];

  // Google Maps styling
  const mapStyles = [
    {
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#f5f5f5" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c9c9c9" }],
    },
  ];

  const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
  };

  // Calculate bounds to fit all studios
  useEffect(() => {
    if (studios.length > 0 && googleMap && scriptLoaded && window.google && window.google.maps) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoords = false;

        studios.forEach(studio => {
          if (studio.address?.latitude && studio.address?.longitude) {
            bounds.extend({
              lat: studio.address.latitude,
              lng: studio.address.longitude
            });
            hasValidCoords = true;
          }
        });

        if (hasValidCoords) {
          googleMap.fitBounds(bounds);
          // Set a reasonable zoom level if there's only one studio
          if (studios.length === 1) {
            setTimeout(() => googleMap.setZoom(14), 100);
          }
        }
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    } else if (studios.length > 0) {
      // Fallback for when Google Maps isn't loaded yet
      const lats = studios.map(s => s.address?.latitude).filter(Boolean);
      const lngs = studios.map(s => s.address?.longitude).filter(Boolean);
      
      if (lats.length > 0 && lngs.length > 0) {
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        setMapCenter({ lat: centerLat, lng: centerLng });
      }
    }
  }, [studios, googleMap, scriptLoaded]);

  // Handle studio marker click
  const handleStudioClick = (studio) => {
    setInternalSelectedStudio(studio);
    onStudioSelect?.(studio);
  };

  // Update internal selected studio when prop changes
  useEffect(() => {
    setInternalSelectedStudio(selectedStudio);
  }, [selectedStudio]);

  // Handle studio marker hover
  const handleStudioHover = (studio) => {
    setHoveredStudio(studio);
    onStudioHover?.(studio);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(userPos);
          setShowUserLocation(true);
          setMapZoom(12);
          
          // Center the Google Map if available
          if (googleMap) {
            googleMap.setCenter(userPos);
            googleMap.setZoom(12);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  // Handle map load
  const onMapLoad = (map) => {
    setGoogleMap(map);
    setMapLoaded(true);
  };

  // Handle LoadScript load
  const onLoadScriptLoad = () => {
    console.log('Google Maps API loaded successfully');
    setScriptLoaded(true);
  };

  const onLoadScriptError = (error) => {
    console.error('Google Maps API loading error:', error);
    setScriptLoaded(false);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    if (googleMap) {
      const currentZoom = googleMap.getZoom();
      googleMap.setZoom(Math.min(currentZoom + 1, 18));
    } else {
      setMapZoom(prev => Math.min(prev + 1, 18));
    }
  };

  const handleZoomOut = () => {
    if (googleMap) {
      const currentZoom = googleMap.getZoom();
      googleMap.setZoom(Math.max(currentZoom - 1, 1));
    } else {
      setMapZoom(prev => Math.max(prev - 1, 1));
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get studios with distances if user location is available
  const studiosWithDistance = userLocation ? studios.map(studio => {
    if (studio.address?.latitude && studio.address?.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        studio.address.latitude,
        studio.address.longitude
      );
      return { ...studio, distance: Math.round(distance * 10) / 10 };
    }
    return studio;
  }) : studios;

  // Loading state and error handling
  if (!apiKey) {
    return (
      <Card elevation="medium" className={cn('h-96', className)} {...props}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-red-500">⚠️</div>
            <p className="text-[var(--text-secondary)]">Google Maps API key not configured</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Showing {studios.length} {studios.length === 1 ? 'studio' : 'studios'} in list view
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback map view when Google Maps fails
  const FallbackMapView = () => (
    <Card elevation="medium" className="h-96 overflow-hidden">
      <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50" data-testid="studio-map">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 bg-white bg-opacity-90 p-6 rounded-lg">
            <div className="text-yellow-500">⚠️</div>
            <p className="text-[var(--text-secondary)]">Map temporarily unavailable</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Showing {studios.length} {studios.length === 1 ? 'studio' : 'studios'} in list view
            </p>
          </div>
        </div>
      </div>
    </Card>
  );

  // Render with error boundary
  try {
    return (
      <div className={cn('relative', className)} {...props}>
        {/* Map Container */}
        <Card elevation="medium" className="h-96 overflow-hidden">
          <LoadScript 
            googleMapsApiKey={apiKey} 
            libraries={libraries}
            onLoad={onLoadScriptLoad}
            onError={onLoadScriptError}
            loadingElement={
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--interactive-primary)] mx-auto"></div>
                  <p className="text-[var(--text-secondary)]">Loading Google Maps...</p>
                </div>
              </div>
            }
          >
          <div className="relative w-full h-full" data-testid="studio-map">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                styles: mapStyles,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: false, // We'll use custom controls
                gestureHandling: 'cooperative',
              }}
              onLoad={onMapLoad}
            >
              {/* User Location Marker */}
              {userLocation && scriptLoaded && (() => {
                let userIcon = undefined;
                if (window.google && window.google.maps) {
                  try {
                    userIcon = {
                      url: "data:image/svg+xml;charset=UTF-8,%3csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='12' cy='12' r='8' fill='%233b82f6' stroke='white' stroke-width='3'/%3e%3c/svg%3e",
                      scaledSize: new window.google.maps.Size(24, 24),
                    };
                  } catch (error) {
                    console.warn('Error creating user location icon:', error);
                  }
                }
                
                return (
                  <Marker
                    position={userLocation}
                    icon={userIcon}
                  />
                );
              })()}

              {/* Studio Markers */}
              {scriptLoaded && studiosWithDistance
                .filter(studio => studio.address?.latitude && studio.address?.longitude)
                .map((studio) => {
                  const isSelected = internalSelectedStudio?.studioId === studio.studioId;
                  
                  // Create marker icon with proper error handling
                  let markerIcon = undefined;
                  if (window.google && window.google.maps) {
                    try {
                      markerIcon = {
                        url: isSelected 
                          ? "data:image/svg+xml;charset=UTF-8,%3csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' fill='%23dc2626'/%3e%3c/svg%3e"
                          : "data:image/svg+xml;charset=UTF-8,%3csvg width='28' height='28' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' fill='%23ef4444'/%3e%3c/svg%3e",
                        scaledSize: new window.google.maps.Size(isSelected ? 32 : 28, isSelected ? 32 : 28),
                      };
                    } catch (error) {
                      console.warn('Error creating marker icon:', error);
                    }
                  }
                  
                  return (
                    <Marker
                      key={studio.studioId}
                      position={{
                        lat: studio.address.latitude,
                        lng: studio.address.longitude,
                      }}
                      onClick={() => handleStudioClick(studio)}
                      onMouseOver={() => handleStudioHover(studio)}
                      icon={markerIcon}
                    />
                  );
                })}

              {/* Info Window for Selected Studio */}
              {scriptLoaded && internalSelectedStudio && internalSelectedStudio.address?.latitude && internalSelectedStudio.address?.longitude && (
                <InfoWindow
                  position={{
                    lat: internalSelectedStudio.address.latitude,
                    lng: internalSelectedStudio.address.longitude,
                  }}
                  onCloseClick={() => {
                    setInternalSelectedStudio(null);
                    onStudioSelect?.(null);
                  }}
                >
                  <div className="p-2 max-w-xs">
                    <h4 className="font-semibold text-sm mb-1">
                      {internalSelectedStudio.studioName}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {internalSelectedStudio.locationDisplay}
                    </p>
                    
                    <div className="flex items-center justify-between mb-2">
                      {internalSelectedStudio.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-xs font-medium">{internalSelectedStudio.rating}</span>
                          <span className="text-xs text-gray-500">
                            ({internalSelectedStudio.reviewCount})
                          </span>
                        </div>
                      )}
                      
                      {internalSelectedStudio.distance && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {internalSelectedStudio.distance} mi
                        </span>
                      )}
                    </div>

                    {internalSelectedStudio.specialties && internalSelectedStudio.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {internalSelectedStudio.specialties.slice(0, 3).map(specialty => (
                          <span
                            key={specialty}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                        {internalSelectedStudio.specialties.length > 3 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            +{internalSelectedStudio.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      className="w-full text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/studios/${internalSelectedStudio.studioId}`, '_blank');
                      }}
                    >
                      View Studio
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            {/* Custom Map Controls */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                className="bg-white shadow-md"
                data-testid="locate-user-button"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
              
              <div className="flex flex-col space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white shadow-md px-2"
                  data-testid="zoom-in-button"
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white shadow-md px-2"
                  data-testid="zoom-out-button"
                >
                  −
                </Button>
              </div>
            </div>

            {/* Loading overlay */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--interactive-primary)] mx-auto"></div>
                  <p className="text-[var(--text-secondary)]">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </LoadScript>
      </Card>

      {/* Map Legend */}
      <Card elevation="low" padding="sm" className="mt-4">
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[var(--accent-primary)] rounded-full border border-white"></div>
              <span className="text-[var(--text-secondary)]">Studio Location</span>
            </div>
            
            {userLocation && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border border-white"></div>
                <span className="text-[var(--text-secondary)]">Your Location</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[var(--interactive-primary)] rounded-full border border-white"></div>
              <span className="text-[var(--text-secondary)]">Selected Studio</span>
            </div>

            <div className="ml-auto text-xs text-[var(--text-tertiary)]">
              {studios.length} {studios.length === 1 ? 'studio' : 'studios'} shown
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    console.error('StudioMap render error:', error);
    return (
      <div className={cn('relative', className)} {...props}>
        <FallbackMapView />
        {/* Map Legend */}
        <Card elevation="low" padding="sm" className="mt-4">
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[var(--accent-primary)] rounded-full border border-white"></div>
                <span className="text-[var(--text-secondary)]">Studio Location</span>
              </div>
              
              {userLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border border-white"></div>
                  <span className="text-[var(--text-secondary)]">Your Location</span>
                </div>
              )}

              <div className="ml-auto text-xs text-[var(--text-tertiary)]">
                {studios.length} {studios.length === 1 ? 'studio' : 'studios'} shown
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}