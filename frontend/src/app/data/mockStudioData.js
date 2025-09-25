// Mock Studio Data for Testing StudioCard Component
// Based on the studio data structure from the design document

export const mockStudios = [
  {
    studioId: "studio-001",
    studioName: "Rebel Ink Studio",
    locationDisplay: "Manchester, UK",
    address: {
      street: "67 Deansgate",
      city: "Manchester",
      postcode: "M2 3BB",
      latitude: 53.48312691614093,
      longitude: -2.242141046238823
    },
    rating: 4.8,
    reviewCount: 127,
    artistCount: 5,
    artists: ["artist-001", "artist-005", "artist-007", "artist-009", "artist-011"],
    specialties: ["geometric", "realism", "traditional", "blackwork"],
    styles: ["geometric", "realism", "traditional", "blackwork"],
    contactInfo: {
      phone: "+44 161 123 4567",
      email: "info@rebelinkstudio.co.uk",
      website: "https://rebelinkstudio.co.uk",
      instagram: "@rebelinkstudio"
    },
    openingHours: {
      monday: "10:00-18:00",
      tuesday: "10:00-18:00", 
      wednesday: "10:00-18:00",
      thursday: "10:00-20:00",
      friday: "10:00-20:00",
      saturday: "09:00-17:00",
      sunday: "Closed"
    },
    established: 2015,
    avatar: "/studio-logos/rebel-ink.jpg",
    galleryImages: [
      "/studio-gallery/rebel-ink-1.jpg",
      "/studio-gallery/rebel-ink-2.jpg", 
      "/studio-gallery/rebel-ink-3.jpg"
    ]
  },
  {
    studioId: "studio-002",
    studioName: "Modern Ink Studio",
    locationDisplay: "London, UK",
    address: {
      street: "42 Brick Lane",
      city: "London",
      postcode: "E1 6RF",
      latitude: 51.52130,
      longitude: -0.07180
    },
    rating: 4.6,
    reviewCount: 89,
    artistCount: 3,
    artists: ["artist-002", "artist-004", "artist-006"],
    specialties: ["minimalist", "fine line", "watercolor", "neo-traditional"],
    styles: ["minimalist", "fineline", "watercolour", "neo_traditional"],
    contactInfo: {
      phone: "+44 20 7123 4567",
      email: "hello@moderninkstudio.com",
      website: "https://moderninkstudio.com",
      instagram: "@moderninkstudio"
    },
    openingHours: {
      monday: "11:00-19:00",
      tuesday: "11:00-19:00",
      wednesday: "11:00-19:00", 
      thursday: "11:00-21:00",
      friday: "11:00-21:00",
      saturday: "10:00-18:00",
      sunday: "12:00-17:00"
    },
    established: 2018,
    avatar: "/studio-logos/modern-ink.jpg",
    galleryImages: [
      "/studio-gallery/modern-ink-1.jpg",
      "/studio-gallery/modern-ink-2.jpg",
      "/studio-gallery/modern-ink-3.jpg"
    ]
  },
  {
    studioId: "studio-003", 
    studioName: "Electric Needle Studio",
    locationDisplay: "Birmingham, UK",
    address: {
      street: "15 Digbeth High Street",
      city: "Birmingham",
      postcode: "B5 6DY",
      latitude: 52.47624,
      longitude: -1.89026
    },
    rating: 4.9,
    reviewCount: 203,
    artistCount: 7,
    artists: ["artist-003", "artist-008", "artist-010", "artist-012", "artist-013", "artist-014", "artist-015"],
    specialties: ["japanese", "biomechanical", "portrait", "cover-up", "color realism"],
    styles: ["japanese", "biomechanical", "portrait", "realism"],
    contactInfo: {
      phone: "+44 121 234 5678",
      email: "bookings@electricneedlestudio.co.uk",
      website: "https://electricneedlestudio.co.uk",
      instagram: "@electricneedlestudio"
    },
    openingHours: {
      monday: "Closed",
      tuesday: "10:00-18:00",
      wednesday: "10:00-18:00",
      thursday: "10:00-20:00", 
      friday: "10:00-20:00",
      saturday: "09:00-19:00",
      sunday: "11:00-17:00"
    },
    established: 2012,
    avatar: "/studio-logos/electric-needle.jpg",
    galleryImages: [
      "/studio-gallery/electric-needle-1.jpg",
      "/studio-gallery/electric-needle-2.jpg",
      "/studio-gallery/electric-needle-3.jpg"
    ]
  },
  {
    studioId: "studio-004",
    studioName: "Ink & Art Collective",
    locationDisplay: "Bristol, UK", 
    address: {
      street: "28 Stokes Croft",
      city: "Bristol",
      postcode: "BS1 3QD",
      latitude: 51.46523,
      longitude: -2.58791
    },
    rating: 4.7,
    reviewCount: 156,
    artistCount: 4,
    artists: ["artist-016", "artist-017", "artist-018", "artist-019"],
    specialties: ["illustrative", "dotwork", "ornamental", "script"],
    styles: ["illustrative", "dotwork", "ornamental", "lettering"],
    contactInfo: {
      phone: "+44 117 987 6543",
      email: "studio@inkartcollective.co.uk",
      website: "https://inkartcollective.co.uk",
      instagram: "@inkartcollective"
    },
    openingHours: {
      monday: "10:00-17:00",
      tuesday: "10:00-17:00",
      wednesday: "10:00-17:00",
      thursday: "10:00-19:00",
      friday: "10:00-19:00", 
      saturday: "09:00-18:00",
      sunday: "Closed"
    },
    established: 2020,
    avatar: "/studio-logos/ink-art-collective.jpg",
    galleryImages: [
      "/studio-gallery/ink-art-1.jpg",
      "/studio-gallery/ink-art-2.jpg",
      "/studio-gallery/ink-art-3.jpg"
    ]
  }
];

export const mockStudioData = mockStudios;
export default mockStudios;