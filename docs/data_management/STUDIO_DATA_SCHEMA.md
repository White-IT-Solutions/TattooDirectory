# Studio Data Schema Documentation

## Overview

This document describes the complete data schema for studio entities in the Tattoo Artist Directory MVP. Studios are first-class entities with bidirectional relationships to artists, comprehensive location data, and full integration across all system components.

## Studio Data Model

### Primary Studio Entity

```typescript
interface Studio {
  // Primary identifiers
  studioId: string;           // "studio-001", "studio-002", etc.
  studioName: string;         // "Ink & Steel Studio"
  
  // Location information
  address: string;            // "123 Brick Lane, Shoreditch, London E1 6SB"
  postcode: string;           // "E1 6SB"
  locationDisplay: string;    // "Shoreditch, London, UK"
  latitude: number;           // 51.5225
  longitude: number;          // -0.0786
  geohash: string;           // "gcpvj0u" (for geographic indexing)
  
  // Contact information
  contactInfo: {
    phone: string;            // "+44 20 7946 0958"
    email: string;            // "info@inkandsteel.com"
    website: string;          // "https://inkandsteel.com"
    instagram: string;        // "@inkandsteelstudio"
  };
  
  // Business information
  openingHours: {
    monday: string;           // "10:00-18:00" or "closed"
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  
  // Artist relationships
  artists: string[];          // ["artist-001", "artist-002"]
  artistCount: number;        // 2
  artistDetails: {            // Denormalized for quick access
    artistId: string;
    artistName: string;
    styles: string[];
    rating: number;
  }[];
  
  // Studio characteristics
  rating: number;             // 4.7
  reviewCount: number;        // 89
  established: number;        // 2015
  specialties: string[];      // ["traditional", "neo_traditional"]
  
  // Media
  images: {
    type: string;             // "exterior", "interior", "gallery"
    url: string;              // S3 URL
    description: string;
    isPrimary: boolean;
  }[];
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  opted_out: boolean;         // Privacy control
}
```

### Enhanced Artist Model (Studio Integration)

```typescript
interface Artist {
  // Existing artist fields...
  
  // Enhanced studio relationship
  tattooStudio?: {
    studioId: string;         // "studio-001"
    studioName: string;       // "Ink & Steel Studio"
    address: {
      street: string;         // "123 Brick Lane, Shoreditch, London E1 6SB"
      city: string;           // "London"
      postcode: string;       // "E1 6SB"
      latitude: number;       // 51.5225
      longitude: number;      // -0.0786
    };
  };
}
```

## Database Storage Schemas

### DynamoDB Schema

#### Studio Records

```javascript
// Primary studio record
{
  pk: "STUDIO#studio-001",
  sk: "PROFILE",
  studioId: "studio-001",
  studioName: "Ink & Steel Studio",
  address: "123 Brick Lane, Shoreditch, London E1 6SB",
  postcode: "E1 6SB",
  locationDisplay: "Shoreditch, London, UK",
  latitude: 51.5225,
  longitude: -0.0786,
  geohash: "gcpvj0u",
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
    thursday: "10:00-18:00",
    friday: "10:00-20:00",
    saturday: "10:00-20:00",
    sunday: "closed"
  },
  artists: ["artist-001", "artist-002"],
  artistCount: 2,
  artistDetails: [
    {
      artistId: "artist-001",
      artistName: "Sarah Mitchell",
      styles: ["traditional", "neo_traditional"],
      rating: 4.8
    }
  ],
  rating: 4.7,
  reviewCount: 89,
  established: 2015,
  specialties: ["traditional", "neo_traditional"],
  images: [
    {
      type: "exterior",
      url: "https://s3.amazonaws.com/tattoo-images/studios/studio-001/exterior-1.webp",
      description: "Studio front entrance",
      isPrimary: true
    }
  ],
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  opted_out: false
}
```

#### Artist Records (Enhanced)

```javascript
// Enhanced artist record with studio information
{
  pk: "ARTIST#artist-001",
  sk: "PROFILE",
  artistId: "artist-001",
  artistName: "Sarah Mitchell",
  // ... existing artist fields ...
  tattooStudio: {
    studioId: "studio-001",
    studioName: "Ink & Steel Studio",
    address: {
      street: "123 Brick Lane, Shoreditch, London E1 6SB",
      city: "London",
      postcode: "E1 6SB",
      latitude: 51.5225,
      longitude: -0.0786
    }
  }
}
```

### OpenSearch Index Schema

```javascript
// Studio index mapping
{
  "mappings": {
    "properties": {
      "studioId": { "type": "keyword" },
      "studioName": { 
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "location": {
        "type": "geo_point"
      },
      "locationDisplay": {
        "type": "text",
        "analyzer": "standard"
      },
      "address": {
        "type": "text",
        "analyzer": "standard"
      },
      "postcode": { "type": "keyword" },
      "specialties": { "type": "keyword" },
      "rating": { "type": "float" },
      "reviewCount": { "type": "integer" },
      "established": { "type": "integer" },
      "artistCount": { "type": "integer" },
      "artists": { "type": "keyword" },
      "contactInfo": {
        "properties": {
          "phone": { "type": "keyword" },
          "email": { "type": "keyword" },
          "website": { "type": "keyword" },
          "instagram": { "type": "keyword" }
        }
      },
      "openingHours": {
        "properties": {
          "monday": { "type": "keyword" },
          "tuesday": { "type": "keyword" },
          "wednesday": { "type": "keyword" },
          "thursday": { "type": "keyword" },
          "friday": { "type": "keyword" },
          "saturday": { "type": "keyword" },
          "sunday": { "type": "keyword" }
        }
      }
    }
  }
}
```

## Frontend Mock Data Schema

### Studio Mock Data Structure

```javascript
// mockStudioData.js
export const mockStudios = [
  {
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
      thursday: "10:00-18:00",
      friday: "10:00-20:00",
      saturday: "10:00-20:00",
      sunday: "closed"
    },
    artists: ["artist-001", "artist-002"],
    artistCount: 2,
    rating: 4.7,
    reviewCount: 89,
    established: 2015,
    specialties: ["traditional", "neo_traditional"],
    images: [
      {
        type: "exterior",
        url: "/images/studios/studio-001/exterior-1.webp",
        description: "Studio front entrance",
        isPrimary: true
      }
    ],
    geohash: "gcpvj0u"
  }
];
```

## Data Relationships

### Artist-Studio Relationships

#### Bidirectional Consistency Rules

1. **Artist → Studio Reference**: Every artist with a `tattooStudio` field must reference a valid studio
2. **Studio → Artist Reference**: Every studio's `artists` array must contain valid artist IDs
3. **Consistency Validation**: Artist's studio reference must match the studio's artist list
4. **Specialty Alignment**: Studio specialties should reflect the styles of assigned artists

#### Relationship Management

```javascript
// Example relationship validation
function validateArtistStudioRelationship(artist, studios) {
  if (artist.tattooStudio) {
    const studio = studios.find(s => s.studioId === artist.tattooStudio.studioId);
    
    // Validate studio exists
    if (!studio) {
      throw new Error(`Artist ${artist.artistId} references non-existent studio ${artist.tattooStudio.studioId}`);
    }
    
    // Validate bidirectional reference
    if (!studio.artists.includes(artist.artistId)) {
      throw new Error(`Studio ${studio.studioId} doesn't list artist ${artist.artistId}`);
    }
    
    // Validate address consistency
    if (artist.tattooStudio.studioName !== studio.studioName) {
      throw new Error(`Artist ${artist.artistId} has outdated studio name reference`);
    }
  }
}
```

## Data Generation Rules

### Studio Count Calculation

```javascript
// Studio count based on artist count
function calculateStudioCount(artistCount, scenario) {
  if (scenario && SCENARIOS[scenario]?.studioCount) {
    return SCENARIOS[scenario].studioCount;
  }
  
  // Default: 1 studio per 2-3 artists, with min/max bounds
  const calculatedCount = Math.ceil(artistCount / 2.5);
  return Math.max(3, Math.min(10, calculatedCount));
}
```

### Artist Assignment Rules

1. **Geographic Compatibility**: Artists assigned to studios in same/nearby cities
2. **Style Compatibility**: Studio specialties should align with artist styles
3. **Capacity Limits**: 1-5 artists per studio (configurable)
4. **Distribution**: Ensure no studio is left without artists

### Data Quality Rules

#### Required Fields Validation

```javascript
const REQUIRED_STUDIO_FIELDS = [
  'studioId',
  'studioName', 
  'address',
  'postcode',
  'locationDisplay',
  'latitude',
  'longitude',
  'contactInfo.phone',
  'contactInfo.email',
  'openingHours',
  'artists',
  'artistCount',
  'rating',
  'reviewCount',
  'established',
  'specialties'
];
```

#### Format Validation Rules

- **Postcode**: UK postcode format validation
- **Coordinates**: Valid latitude (-90 to 90) and longitude (-180 to 180)
- **Phone**: UK phone number format
- **Email**: Valid email format
- **Instagram**: Valid Instagram handle format
- **Opening Hours**: "HH:MM-HH:MM" or "closed" format

## Image Schema

### Studio Image Types

```javascript
const STUDIO_IMAGE_TYPES = {
  EXTERIOR: 'exterior',    // Studio front/building exterior
  INTERIOR: 'interior',    // Studio interior/workspace
  GALLERY: 'gallery'       // Portfolio/gallery wall images
};
```

### Image Storage Structure

```
S3 Bucket: tattoo-images/
├── studios/
│   ├── studio-001/
│   │   ├── exterior-1.webp
│   │   ├── exterior-1-thumb.webp
│   │   ├── interior-1.webp
│   │   ├── interior-1-thumb.webp
│   │   ├── gallery-1.webp
│   │   └── gallery-1-thumb.webp
│   └── studio-002/
│       └── ...
```

### Image Metadata

```javascript
{
  type: "exterior",                    // Image category
  url: "https://s3.../exterior-1.webp", // Full-size image URL
  thumbnailUrl: "https://s3.../exterior-1-thumb.webp", // Thumbnail URL
  description: "Studio front entrance", // Alt text/description
  isPrimary: true,                     // Primary image for this type
  width: 1200,                         // Image dimensions
  height: 800,
  fileSize: 245760,                    // File size in bytes
  format: "webp"                       // Image format
}
```

## Validation and Constraints

### Business Rules

1. **Geographic Scope**: UK-only studios (validate postcodes)
2. **Minimum Data Quality**: All required fields must be present
3. **Relationship Integrity**: Bidirectional artist-studio references
4. **Image Requirements**: Minimum 1 exterior image per studio
5. **Contact Validation**: At least phone or email required

### System Constraints

1. **Performance**: Studio queries must complete within 300ms
2. **Scalability**: Support up to 1000 studios in initial deployment
3. **Consistency**: Cross-service data consistency validation
4. **Availability**: 99.9% uptime for studio data access

## Migration Considerations

### Existing Data Integration

When integrating with existing artist data:

1. **Preserve Artist Data**: Existing artist records remain unchanged
2. **Add Studio References**: Enhance artists with `tattooStudio` field
3. **Create Studio Records**: Generate new studio entities
4. **Validate Relationships**: Ensure bidirectional consistency
5. **Update Indexes**: Refresh OpenSearch indices with studio data

### Backward Compatibility

- All existing API endpoints continue to work
- Artist data includes optional studio information
- Frontend components gracefully handle missing studio data
- Search functionality enhanced but not breaking

This schema documentation provides the complete data model for studio integration while maintaining system consistency and performance requirements.