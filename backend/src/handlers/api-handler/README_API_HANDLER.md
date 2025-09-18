# API Handler

This is the consolidated API handler for the Tattoo Artist Directory backend. It implements all the main API endpoints with circuit breaker pattern, structured logging, and RFC 9457 compliant error responses.

## Features

- **Circuit Breaker**: Uses opossum circuit breaker to handle OpenSearch failures gracefully
- **Structured Logging**: Integrates with PII-scrubbing logger with correlation ID support
- **RFC 9457 Error Responses**: All errors follow the Problem Details for HTTP APIs standard
- **OpenSearch Integration**: Connects to OpenSearch via AWS Secrets Manager for credentials

## Endpoints

### GET /v1/artists
Search for artists by query, style, or location.

**Query Parameters:**
- `query` (optional): Search term for artist names
- `style` (optional): Filter by tattoo style
- `location` (optional): Filter by location

**Response:** Array of artist objects

### GET /v1/artists/{artistId}
Get a specific artist by ID.

**Path Parameters:**
- `artistId` (required): The unique identifier for the artist

**Response:** Single artist object

### GET /v1/styles
Get all available tattoo styles with counts.

**Response:** Array of style objects with name and count

## Error Handling

All errors follow RFC 9457 format:
```json
{
  "type": "https://api.tattoodirectory.com/docs/errors#400",
  "title": "Bad Request",
  "status": 400,
  "detail": "Detailed error message",
  "instance": "request-id"
}
```

## Environment Variables

- `APP_SECRETS_ARN`: ARN of the AWS Secrets Manager secret containing OpenSearch credentials
- `OPENSEARCH_ENDPOINT`: OpenSearch cluster endpoint
- `OPENSEARCH_INDEX`: Index name for artist data (defaults to 'artists')

## Circuit Breaker Configuration

- **Timeout**: 3 seconds
- **Error Threshold**: 50% failure rate
- **Reset Timeout**: 30 seconds

When the circuit breaker is open, the API returns a 503 Service Unavailable response.