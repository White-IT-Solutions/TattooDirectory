/**
 * Frontend Studio Mock Data Examples
 * 
 * These examples show the expected structure for studio mock data
 * that will be generated for frontend development and testing.
 */

export const studioMockDataExamples = {
  // Basic studio structure for StudioSearch component
  basicStudio: {
    studioId: "studio-001",
    studioName: "Ink & Steel Studio",
    locationDisplay: "Shoreditch, London, UK",
    address: {
      street: "123 Brick Lane, Shoreditch, London E1 6SB",
      city: "London",
      postcode: "E1 6SB",
      latitude: 51.5225,
      longitude: -0.0786
    },
    contactInfo: {
      phone: "+44 20 7946 0958",
      email: "info@inkandsteel.com",
      website: "https://inkandsteel.com",
      instagram: "@inkandsteelstudio"
    },
    openingHours: {
      monday: "10:00-18:00",
      tuesday: "10:00-18:00",
      wednesday: "10:00-18:00",
      thursday: "10:00-20:00",
      friday: "10:00-20:00",
      saturday: "10:00-18:00",
      sunday: "12:00-16:00"
    },
    artists: ["artist-001"],
    artistCount: 1,
    rating: 4.7,
    reviewCount: 89,
    established: 2015,
    specialties: ["traditional", "neo_traditional"],
    images: [
      {
        type: "exterior",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-001/exterior-1.jpg",
        description: "Studio front entrance",
        isPrimary: true
      }
    ],
    geohash: "gcpvj0u"
  },

  // Studio with multiple artists for relationship testing
  multiArtistStudio: {
    studioId: "studio-002",
    studioName: "Northern Ink Collective",
    locationDisplay: "Northern Quarter, Manchester, UK",
    address: {
      street: "45 Oldham Street, Northern Quarter, Manchester M1 1JG",
      city: "Manchester",
      postcode: "M1 1JG",
      latitude: 53.4839,
      longitude: -2.2374
    },
    contactInfo: {
      phone: "+44 161 234 5678",
      email: "hello@northernink.co.uk",
      website: "https://northernink.co.uk",
      instagram: "@northerninkcollective"
    },
    openingHours: {
      monday: "closed",
      tuesday: "11:00-19:00",
      wednesday: "11:00-19:00",
      thursday: "11:00-19:00",
      friday: "11:00-19:00",
      saturday: "10:00-18:00",
      sunday: "12:00-17:00"
    },
    artists: ["artist-002", "artist-003", "artist-004"],
    artistCount: 3,
    rating: 4.9,
    reviewCount: 156,
    established: 2012,
    specialties: ["realism", "blackwork", "traditional"],
    images: [
      {
        type: "exterior",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-002/exterior-1.jpg",
        description: "Northern Quarter studio front",
        isPrimary: true
      },
      {
        type: "interior",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-002/interior-1.jpg",
        description: "Modern collective workspace",
        isPrimary: false
      },
      {
        type: "gallery",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-002/gallery-1.jpg",
        description: "Portfolio wall display",
        isPrimary: false
      }
    ],
    geohash: "gcw2j1k"
  },

  // High-rated studio for filtering tests
  highRatedStudio: {
    studioId: "studio-003",
    studioName: "Elite Ink London",
    locationDisplay: "Marylebone, London, UK",
    address: {
      street: "45 Marylebone High Street, Marylebone, London W1U 5HG",
      city: "London",
      postcode: "W1U 5HG",
      latitude: 51.5186,
      longitude: -0.1493
    },
    contactInfo: {
      phone: "+44 20 7935 1234",
      email: "bookings@eliteinklondon.com",
      website: "https://eliteinklondon.com",
      instagram: "@eliteinklondon"
    },
    openingHours: {
      monday: "10:00-18:00",
      tuesday: "10:00-18:00",
      wednesday: "10:00-18:00",
      thursday: "10:00-18:00",
      friday: "10:00-18:00",
      saturday: "10:00-17:00",
      sunday: "closed"
    },
    artists: ["artist-005"],
    artistCount: 1,
    rating: 4.9,
    reviewCount: 234,
    established: 2010,
    specialties: ["realism"],
    images: [
      {
        type: "exterior",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-003/exterior-1.jpg",
        description: "Premium Marylebone location",
        isPrimary: true
      },
      {
        type: "interior",
        url: "http://localhost:4566/tattoo-directory-images/studios/studio-003/interior-1.jpg",
        description: "Luxury tattoo suite",
        isPrimary: false
      }
    ],
    geohash: "gcpvn4k"
  }
};

// Expected structure for StudioSearch component props
export const studioSearchProps = {
  studios: [
    // Array of studio objects matching basicStudio structure above
  ],
  filters: {
    location: "",
    specialties: [],
    rating: 0,
    distance: 50
  },
  sorting: {
    field: "rating", // "rating", "distance", "reviewCount", "established"
    direction: "desc" // "asc", "desc"
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
};

// Expected structure for StudioProfile component props
export const studioProfileProps = {
  studio: {
    // Full studio object with all fields
    ...studioMockDataExamples.basicStudio,
    // Additional fields for profile page
    description: "Award-winning tattoo studio specializing in traditional and neo-traditional work.",
    amenities: ["Free consultation", "Aftercare products", "Private rooms"],
    bookingInfo: {
      acceptsWalkIns: false,
      bookingRequired: true,
      depositRequired: true,
      cancellationPolicy: "48 hours notice required"
    }
  },
  artists: [
    // Array of artist objects associated with this studio
  ]
};

// Validation schema for studio mock data
export const studioMockDataSchema = {
  required: [
    "studioId",
    "studioName", 
    "locationDisplay",
    "address",
    "contactInfo",
    "openingHours",
    "artists",
    "artistCount",
    "rating",
    "reviewCount",
    "established",
    "specialties",
    "geohash"
  ],
  optional: [
    "images",
    "description",
    "amenities",
    "bookingInfo"
  ],
  validation: {
    studioId: "string, format: studio-XXX",
    studioName: "string, 1-100 characters",
    rating: "number, 1.0-5.0",
    reviewCount: "number, >= 0",
    established: "number, 1900-current year",
    artistCount: "number, >= 1",
    specialties: "array of strings, valid tattoo styles",
    postcode: "string, valid UK postcode format",
    latitude: "number, UK latitude range",
    longitude: "number, UK longitude range"
  }
};

export default studioMockDataExamples;