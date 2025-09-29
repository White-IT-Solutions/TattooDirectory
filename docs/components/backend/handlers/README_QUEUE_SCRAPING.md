# Queue Scraping Handler

## Overview

The Queue Scraping Handler is a Lambda function that receives discovered artists from the data aggregation pipeline and queues them for detailed scraping by Fargate containers. It manages SQS message batching, implements idempotency controls, and provides priority-based job scheduling.

## Functionality

### Primary Purpose
- Queue discovered artists for detailed scraping operations
- Manage SQS message batching for efficient processing
- Implement idempotency controls using unique scrape run IDs
- Prioritize scraping jobs based on artist characteristics
- Enrich items with proper DynamoDB key structures

### Input Format
```json
{
  "discoveredItems": [
    {
      "artistId": "artist-1",
      "artistName": "Test Artist 1",
      "instagramHandle": "test_artist_1",
      "styles": ["traditional"],
      "geohash": "gcpvj0",
      "location": "london",
      "source": "google_maps",
      "metadata": {
        "confidence": 0.85
      }
    }
  ]
}
```

Alternative input format (from find-artists step):
```json
{
  "artists": [
    {
      "artistId": "studio-artist-1",
      "artistName": "Studio Artist 1",
      "instagramHandle": "studio_artist_1",
      "styles": ["realism", "blackwork"],
      "geohash": "gcw2j0",
      "location": "manchester"
    }
  ]
}
```

### Output Format
```json
{
  "statusCode": 200,
  "body": "Scraping jobs queued",
  "scrapeId": "550e8400-e29b-41d4-a716-446655440000",
  "summary": {
    "totalAttempted": 25,
    "successfulCount": 23,
    "failedCount": 2,
    "successRate": 92.0,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "failedItems": [
    {
      "Id": "550e8400-e29b-41d4-a716-446655440000-23",
      "Code": "MessageTooLong",
      "Message": "Message body exceeds maximum size"
    }
  ]
}
```

## Key Features

### SQS Message Batching
- Processes items in batches of 10 (SQS maximum)
- Handles large datasets efficiently with automatic batching
- Tracks success and failure rates per batch
- Implements retry logic for failed batches

### Idempotency Control
- Generates unique scrape run IDs using UUID
- Prevents duplicate processing of the same dataset
- Enables Fargate containers to implement idempotency checks
- Tracks scraping operations across distributed systems

### Priority-Based Queuing
- Calculates priority scores (1-10) based on artist characteristics
- Higher priority for artists with Instagram handles
- Prioritizes popular tattoo styles (traditional, realism, blackwork)
- Boosts priority for major cities (London, Manchester, Birmingham)
- Considers confidence scores from discovery process

### Key Structure Enrichment
- Automatically generates missing DynamoDB keys
- Ensures all items have proper primary and GSI keys
- Handles items with existing key structures
- Gracefully handles key generation failures

### Message Attributes
- Includes scrape run ID for correlation
- Adds artist ID for message routing
- Specifies data source for processing logic
- Enables SQS message filtering and routing

## Priority Calculation

The handler calculates scraping priority based on multiple factors:

```javascript
let priority = 5; // Base priority

// +2 for Instagram handles (higher engagement potential)
if (item.instagramHandle) priority += 2;

// +1 for popular styles
const popularStyles = ['traditional', 'realism', 'blackwork', 'neo-traditional'];
if (item.styles?.some(style => popularStyles.includes(style))) priority += 1;

// +1 for major cities
const majorCities = ['london', 'manchester', 'birmingham', 'leeds', 'glasgow'];
if (item.location && majorCities.includes(item.location.toLowerCase())) priority += 1;

// +1 for high-confidence discoveries
if (item.metadata?.confidence > 0.9) priority += 1;

return Math.min(priority, 10); // Cap at 10
```

## Error Handling

### Input Validation
- Handles empty discovered items arrays
- Validates required environment variables
- Processes both `discoveredItems` and `artists` input formats

### SQS Failures
- Tracks failed messages per batch
- Logs detailed error information
- Returns comprehensive failure reports
- Implements graceful degradation for partial failures

### Key Generation Errors
- Continues processing when key generation fails
- Logs warnings for missing key data
- Enriches items with available information
- Maintains processing flow despite individual failures

## Environment Variables

### Required
- `SQS_QUEUE_URL` - URL of the SQS queue for scraping jobs
- `AWS_REGION` - AWS region for SQS client (defaults to 'eu-west-2')

## Dependencies

- `../../common/logger.js` - PII-scrubbing structured logger
- `../../common/dynamodb.js` - DynamoDB key generation utilities
- `@aws-sdk/client-sqs` - AWS SQS client for message queuing
- `crypto` - UUID generation for scrape run IDs

## Usage in Step Functions

This handler is typically the final step in the discovery pipeline:

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
      "ResultPath": "$.artistResults",
      "Next": "QueueScraping"
    },
    "QueueScraping": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:queue-scraping",
      "InputPath": "$.artistResults",
      "End": true
    }
  }
}
```

## SQS Message Format

Messages sent to the SQS queue include:

```json
{
  "artistId": "artist-123",
  "artistName": "Example Artist",
  "instagramHandle": "example_artist",
  "styles": ["traditional", "blackwork"],
  "geohash": "gcpvj0",
  "location": "london",
  "keys": {
    "PK": "ARTIST#artist-123",
    "SK": "METADATA",
    "gsi1pk": "STYLE#traditional#SHARD#0",
    "gsi1sk": "GEOHASH#gcpvj0#ARTIST#artist-123",
    "gsi2pk": "ARTISTNAME#exampleartist",
    "gsi2sk": "ARTIST#artist-123",
    "gsi3pk": "INSTAGRAM#example_artist"
  },
  "scrapeId": "550e8400-e29b-41d4-a716-446655440000",
  "queuedAt": "2024-01-01T12:00:00.000Z",
  "priority": 8
}
```

## Testing

Run tests with:
```bash
npm test -- src/handlers/queue-scraping/__tests__/basic.test.js
```

## Implementation Notes

- Implements comprehensive error handling and logging
- Supports both discovery and find-artists input formats
- Maintains correlation IDs for distributed tracing
- Provides detailed success/failure reporting
- Optimized for high-throughput batch processing
- Follows AWS SQS best practices for message batching