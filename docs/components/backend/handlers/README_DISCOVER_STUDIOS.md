# Discover Studios Handler

## Overview

The Discover Studios Handler is a Lambda function responsible for discovering tattoo studios and artists from various data sources as part of the data aggregation pipeline. It serves as the first step in the artist discovery workflow.

## Functionality

### Primary Purpose
- Discover tattoo studios from external data sources (Google Maps API, directory websites)
- Generate initial artist profiles based on studio information
- Prepare structured data for downstream processing steps

### Input Format
```json
{
  "searchParams": {
    "locations": ["london", "manchester", "birmingham"],
    "styles": ["traditional", "realism", "blackwork"],
    "maxResults": 50
  }
}
```

### Output Format
```json
{
  "statusCode": 200,
  "body": "Studios discovered successfully",
  "discoveredItems": [
    {
      "artistId": "studio-london-traditional-1-artist-1",
      "studioId": "studio-london-traditional-1",
      "source": "google_maps",
      "location": "london",
      "style": "traditional",
      "discoveryTimestamp": "2024-01-01T12:00:00.000Z",
      "keys": {
        "PK": "ARTIST#studio-london-traditional-1-artist-1",
        "SK": "METADATA",
        "gsi1pk": "STYLE#traditional#SHARD#0",
        "gsi1sk": "GEOHASH#gcpvj0#ARTIST#studio-london-traditional-1-artist-1",
        "gsi2pk": "ARTISTNAME#artist1traditional",
        "gsi2sk": "ARTIST#studio-london-traditional-1-artist-1",
        "gsi3pk": "INSTAGRAM#artist_london_traditional_1"
      },
      "metadata": {
        "studioName": "London Traditional Studio 1",
        "studioWebsite": "https://studio-studio-london-traditional-1.com",
        "confidence": 0.85
      }
    }
  ],
  "summary": {
    "totalItems": 15,
    "locations": 3,
    "styles": 3,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Key Features

### DynamoDB Key Generation
- Generates proper primary keys (`PK`, `SK`) for each discovered artist
- Creates all required GSI keys for efficient querying
- Ensures data structure compliance with the single-table design

### Geohash Integration
- Maps location names to appropriate geohashes for geographic queries
- Supports major UK cities with predefined geohash mappings
- Falls back to London geohash for unknown locations

### Confidence Scoring
- Assigns confidence scores (0.7-1.0) to discovered items
- Higher scores indicate more reliable data sources
- Used for prioritization in downstream processing

### Error Handling
- Graceful handling of key generation failures
- Structured error responses for Step Functions integration
- Comprehensive logging with PII scrubbing

## Environment Variables

None required - this handler operates with mock data for development.

## Dependencies

- `../../common/logger.js` - PII-scrubbing structured logger
- `../../common/dynamodb.js` - DynamoDB key generation utilities

## Usage in Step Functions

This handler is typically the first step in the data aggregation pipeline:

```json
{
  "Comment": "Artist Discovery Pipeline",
  "StartAt": "DiscoverStudios",
  "States": {
    "DiscoverStudios": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:discover-studios",
      "Next": "FindArtists"
    }
  }
}
```

## Testing

Run tests with:
```bash
npm test -- --testPathPattern="discover-studios"
```

## Implementation Notes

- Currently uses mock data for development and testing
- In production, would integrate with Google Maps API and other data sources
- Implements proper correlation ID tracking for distributed tracing
- Follows RFC 9457 error response format for consistency