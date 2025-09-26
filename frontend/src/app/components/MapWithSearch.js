"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { api } from "../../lib/api";
import { useSearchParams } from "next/navigation";
import StyleFilter from "./StyleFilter";
import { safeApiCall } from "../../lib/dev-utils";
import { mockArtistData as mockArtists } from "../data/mockArtistData";

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffffff",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#dadada",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#c9c9c9",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
];

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "24px",
  overflow: "hidden",
  margin: "auto",
};

const defaultCenter = {
  lat: 53.799, // Leeds
  lng: -1.553,
};

const libraries = ["places"];

export default function MapWithSearch() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const searchParams = useSearchParams();

  const [center, setCenter] = useState(defaultCenter);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const inputRef = useRef(null);
  const mapRef = useRef();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const selectedStyles = searchParams.get("styles")?.split(",") || [];
        let result;

        if (selectedStyles.length > 0) {
          result = await safeApiCall(
            () => api.getArtistsByStyles(selectedStyles),
            { items: mockArtists.filter((artist) =>
              artist.styles.some((style) => selectedStyles.includes(style))
            )}
          );
        } else {
          result = await safeApiCall(
            () => api.getArtists(),
            { items: mockArtists }
          );
        }

        setFilteredArtists(result.items || []);
      } catch (error) {
        console.error("Failed to fetch artists:", error);
        // Fallback to mock data
        const selectedStyles = searchParams.get("styles")?.split(",") || [];
        if (selectedStyles.length > 0) {
          setFilteredArtists(
            mockArtists.filter((artist) =>
              artist.styles.some((style) => selectedStyles.includes(style))
            )
          );
        } else {
          setFilteredArtists(mockArtists);
        }
      }
    };

    fetchArtists();
  }, [searchParams]);

  // When the user picks a place, move the map
  const handlePlaceSelect = () => {
    if (!isLoaded) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current
    );
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Search Bar */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search address or city..."
        className="w-full max-w-md rounded-full px-6 py-3 text-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/60 transition-all shadow-md mb-6"
        onFocus={handlePlaceSelect}
      />
      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        options={{
          styles: darkMapStyle,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={(map) => (mapRef.current = map)}
      >
        {filteredArtists
          .filter(
            (artist) =>
              artist.tattooStudio?.address?.latitude &&
              artist.tattooStudio?.address?.longitude
          )
          .map((artist) => (
            <Marker
              key={artist.artistId || artist.pk}
              position={{
                lat: artist.tattooStudio.address.latitude,
                lng: artist.tattooStudio.address.longitude,
              }}
              onClick={() => setSelectedStudio(artist)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8,%3csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' fill='%23ef4444'/%3e%3c/svg%3e",
              }}
            />
          ))}

        {selectedStudio && (
          <InfoWindow
            position={{
              lat: selectedStudio.tattooStudio.address.latitude,
              lng: selectedStudio.tattooStudio.address.longitude,
            }}
            onCloseClick={() => setSelectedStudio(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-sm">
                {selectedStudio.tattooStudio.studioName}
              </h3>
              <p className="text-xs text-gray-600 mb-1">
                {selectedStudio.artistsName}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {selectedStudio.tattooStudio.address.city}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedStudio.styles.slice(0, 3).map((style, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {/* Style Filter */}
      <StyleFilter />
    </div>
  );
}
