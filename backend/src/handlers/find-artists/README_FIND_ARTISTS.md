# Find Artists Handler

## Overview

The Find Artists Handler is a Lambda function that processes individual studio websites to extract detailed artist information. It receives studio data from the discover-studios step and performs targeted scraping to build comprehensive artist profiles.

## Functionality

### Primary Purpose
- Process studio websites to find individual artists
- Extract artist profiles, portfolio links, and contact information
- Generate complete artist data structures with proper DynamoDB keys
- Create mock portfolio images and contact information

### Input Format
```json
{
  "studioId": "studio-london-traditional-1",
  "location": "london",
  "style": "traditional",
  "metadata": {
    "studioName": "London Traditional Studio",
    "studioWebsite": "https://studio-london-traditional-1.com"
  },
  "keys": {
    "PK": "ARTIST#studio-london-traditional-1",
    "SK": "METADATA"
  }
}
```

### Output Format
```json
{
  "statusCode": 200,
  "studioId": "studio-london-traditional-1",
  "artists": [
    {
      "artistId": "studio-london-traditional-1-artist-1",
      "artistName": "Traditional Artist 1",
      "instagramHandle": "studiolondontraditional1_artist_1",
      "styles": ["traditional", "blackwork"],
      "geohash": "gcpvj0",
      "locationDisplay": "london",
      "studioId": "studio-london-traditional-1",
      "studioName": "London Traditional Studio",
      "keys": {
        "PK": "ARTIST#studio-london-traditional-1-artist-1",
        "SK": "METADATA",
        "gsi1pk": "STYLE#traditional#SHARD#0",
        "gsi1sk": "GEOHASH#gcpvj0#ARTIST#studio-london-traditional-1-artist-1",
        "gsi2pk": "ARTISTNAME#traditionalartist1",
        "gsi2sk": "ARTIST#studio-london-traditional-1-artist-1",
        "gsi3pk": "INSTAGRAM#studiolondontraditional1_artist_1"
      },
      "portfolioUrl": "https://instagram.com/studiolondontraditional1_artist_1",
      "discoverySource": "studio_website",
      "discoveryTimestamp": "2024-01-01T12:00:00.000Z",
      "contactInfo": {
        "instagram": "studiolondontraditional1_artist_1",
        "studioWebsite": "https://studio-london-traditional-1.com",
        "bookingMethod": "instagram_dm"
      },
      "portfolioImages": [
        {
          "imageId": "studio-london-traditional-1-artist-1-img-1",
          "url": "https://portfolio-images.tattoodirectory.com/studio-london-traditional-1-artist-1/image-1.jpg",
          "thumbnailUrl": "https://portfolio-images.tattoodirectory.com/studio-london-traditional-1-artist-1/thumb-1.jpg",
          "style": "traditional",
          "uploadDate": "2023-12-15T10:30:00.000Z",
          "tags": ["traditional", "portfolio", "tattoo"],
          "dimensions": {
            "width": 1200,
            "height": 900
          }
        }
      ],
      "metadata": {
        "confidence": 0.92,
        "lastUpdated": "2024-01-01T12:00:00.000Z",
        "sourceUrl": "https://studio-london-traditional-1.com/artists/studio-london-traditional-1-artist-1"
      }
    }
  ],
  "summary": {
    "studioId": "studio-london-traditional-1",
    "artistCount": 3,
    "location": "london",
    "style": "traditional",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Key Features

### Artist Profile Generation
- Creates 2-4 artists per studio (randomized for realistic simulation)
- Generates unique artist IDs based on studio ID
- Creates Instagram handles following consistent naming patterns
- Assigns primary and secondary tattoo styles

### Portfolio Image Creation
- Generates 5-12 portfolio images per artist
- Creates realistic image metadata with dimensions and upload dates
- Assigns appropriate style tags and categories
- Provides both full-size and thumbnail URLs

### Contact Information
- Generates Instagram handles for each artist
- Links artists to their studio websites
- Specifies booking methods (primarily Instagram DM)
- Maintains studio affiliation data

### Geohash Mapping
- Maps location names to appropriate geohashes
- Supports major UK cities with predefined mappings
- Ensures consistent geographic data for search functionality

### DynamoDB Key Structure
- Generates all required primary and GSI keys
- Ensures compliance with single-table design patterns
- Supports efficient querying by style, location, name, and Instagram handle

## Error Handling

### Input Validation
- Requires `studioId` parameter for processing
- Handles missing metadata gracefully with defaults
- Validates artist data before key generation

### Key Generation Errors
- Catches and logs key generation failures
- Returns structured error responses for Step Functions
- Maintains correlation IDs for distributed tracing

### Graceful Degradation
- Uses default studio websites when metadata is missing
- Generates fallback data for missing artist information
- Continues processing even with partial failures

## Environment Variables

None required - this handler operates with mock data for development.

## Dependencies

- `../../common/logger.js` - PII-scrubbing structured logger
- `../../common/dynamodb.js` - DynamoDB key generation utilities

## Usage in Step Functions

This handler is typically the second step in the data aggregation pipeline:

```json
{
  "Comment": "Artist Discovery Pipeline",
  "StartAt": "DiscoverStudios",
  "States": {
    "DiscoverStudios": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:discover-studios",
      "Next": "FindArtistsMap"
    },
    "FindArtistsMap": {
      "Type": "Map",
      "ItemsPath": "$.discoveredItems",
      "Iterator": {
        "StartAt": "FindArtists",
        "States": {
          "FindArtists": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:region:account:function:find-artists",
            "End": true
          }
        }
      },
      "Next": "QueueScraping"
    }
  }
}
```

## Testing

Run tests with:
```bash
npm test -- --testPathPattern="find-artists"
```

## Implementation Notes

- Currently uses mock data for development and testing
- In production, would perform actual website scraping
- Implements realistic data generation for comprehensive testing
- Follows consistent naming patterns for generated data
- Maintains referential integrity between artists and studios