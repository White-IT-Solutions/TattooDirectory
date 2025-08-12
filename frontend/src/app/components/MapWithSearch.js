"use client";
import React, { useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

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

export default function MapWithSearch() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [center, setCenter] = useState(defaultCenter);
  const inputRef = useRef(null);
  const mapRef = useRef();

  // When the user picks a place, move the map
  const handlePlaceSelect = () => {
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
      <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
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
        />
      </LoadScript>
    </div>
  );
}
