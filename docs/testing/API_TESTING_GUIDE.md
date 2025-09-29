# API Testing Guide - Local Development

This guide explains how to test the Tattoo Artist Directory API using Swagger UI in the local development environment.

## Quick Start

1. **Start the local environment:**
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

2. **Access Swagger UI:**
   - Open your browser and navigate to: http://localhost:8080
   - The interactive API documentation will load automatically

3. **Test API endpoints:**
   - Use the "Try it out" button on any endpoint
   - Fill in the parameters and click "Execute"
   - View the response in real-time

## Available Endpoints

### 🔍 Search Artists - `GET /v1/artists`

Search for tattoo artists with optional filtering.

**Required:** At least one of `query`, `style`, or `location` parameters.

**Example requests:**
- Search by name: `?query=Sarah`
- Filter by style: `?style=traditional`
- Search by location: `?location=London`
- Combined search: `?query=Sarah&style=traditional&location=London&limit=10`

**Sample Response:**
```json
[
  {
    "artistId": "artist-001",
    "artistName": "Sarah Mitchell",
    "instagramHandle": "sarahtattoos",
    "geohash": "gcpvj0",
    "locationDisplay": "London, UK",
    "styles": ["traditional", "neo-traditional"],
    "portfolioImages": [
      {
        "url": "https://example.com/portfolio/sarah-001.jpg",
        "description": "Traditional rose tattoo on forearm",
        "style": "traditional",
        "tags": ["rose", "forearm", "color"],
        "bodyPart": "arm",
        "isColor": true,
        "size": "medium"
      }
    ],
    "contactInfo": {
      "instagram": "@sarahtattoos",
      "website": "https://sarahmitchelltattoo.com",
      "email": "sarah@example.com"
    }
  }
]
```

### 👤 Get Artist by ID - `GET /v1/artists/{artistId}`

Retrieve detailed information about a specific artist.

**Example request:**
- Get artist: `/v1/artists/artist-001`

**Sample Response:**
```json
{
  "artistId": "artist-001",
  "artistName": "Sarah Mitchell",
  "instagramHandle": "sarahtattoos",
  "geohash": "gcpvj0",
  "locationDisplay": "London, UK",
  "styles": ["traditional", "neo-traditional"],
  "portfolioImages": [
    {
      "url": "https://example.com/portfolio/sarah-001.jpg",
      "description": "Traditional rose tattoo on forearm",
      "style": "traditional",
      "tags": ["rose", "forearm", "color"],
      "bodyPart": "arm",
      "isColor": true,
      "size": "medium"
    }
  ],
  "contactInfo": {
    "instagram": "@sarahtattoos",
    "website": "https://sarahmitchelltattoo.com",
    "email": "sarah@example.com",
    "phone": "+44 20 7946 0958"
  },
  "studioInfo": {
    "studioName": "Ink & Art Studio",
    "address": "123 High Street, London, SW1A 1AA, UK",
    "website": "https://inkartstudio.com"
  },
  "rating": 4.8,
  "reviewCount": 127,
  "isVerified": true,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### 🎨 Get Tattoo Styles - `GET /v1/styles`

Retrieve all available tattoo styles with usage counts.

**Example request:**
- Get all styles: `/v1/styles`

**Sample Response:**
```json
[
  {
    "name": "traditional",
    "count": 45
  },
  {
    "name": "realism",
    "count": 32
  },
  {
    "name": "blackwork",
    "count": 28
  }
]
```

## Error Responses (RFC 9457 Format)

All error responses follow the RFC 9457 Problem Details standard:

### 400 Bad Request
```json
{
  "type": "https://api.tattoodirectory.com/docs/errors#400",
  "title": "Bad Request",
  "status": 400,
  "detail": "At least one search parameter is required: 'query', 'style', or 'location'.",
  "instance": "req-12345",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 404 Not Found
```json
{
  "type": "https://api.tattoodirectory.com/docs/errors#404",
  "title": "Not Found",
  "status": 404,
  "detail": "Artist with ID 'artist-999' was not found.",
  "instance": "req-12345",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 503 Service Unavailable (Circuit Breaker)
```json
{
  "type": "https://api.tattoodirectory.com/docs/errors#503",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "The search service is temporarily unavailable. Please try again later.",
  "instance": "req-12345",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Advanced Testing Methods

### Using Postman

#### Setting Up Postman Collection

1. **Import OpenAPI Specification**:
   - Open Postman
   - Click "Import"
   - Select "Link" tab
   - Enter: `http://localhost:8080/openapi/openapi.yaml`
   - Click "Continue" and "Import"

2. **Configure Environment**:
   - Create new environment: "Local Development"
   - Add variables:
     - `baseUrl`: `http://localhost:9000/2015-03-31/functions/function/invocations`
     - `apiVersion`: `v1`

#### Automated Testing with Newman

```bash
# Install Newman (Postman CLI)
npm install -g newman

# Run Postman collection
newman run postman-collection.json \
  --environment postman-environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Integration Testing

The project includes comprehensive integration tests in `tests/integration/`:

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- --grep "artists"

# Run tests with verbose output
npm run test:integration -- --reporter spec
```

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Generate HTML report
artillery run load-test.yml --output report.json
artillery report report.json
```

## Testing with curl

You can also test the API directly using curl commands:

### Search Artists
```bash
# Search by query
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "rawPath": "/v1/artists",
    "requestContext": {
      "http": { "method": "GET" },
      "requestId": "test-123"
    },
    "queryStringParameters": {
      "query": "Sarah",
      "limit": "5"
    }
  }'

# Search by style
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "rawPath": "/v1/artists",
    "requestContext": {
      "http": { "method": "GET" },
      "requestId": "test-124"
    },
    "queryStringParameters": {
      "style": "traditional"
    }
  }'
```

### Get Artist by ID
```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "rawPath": "/v1/artists/artist-001",
    "requestContext": {
      "http": { "method": "GET" },
      "requestId": "test-125"
    },
    "pathParameters": {
      "artistId": "artist-001"
    }
  }'
```

### Get Styles
```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "rawPath": "/v1/styles",
    "requestContext": {
      "http": { "method": "GET" },
      "requestId": "test-126"
    }
  }'
```

## Lambda RIE Integration

The Swagger UI is configured to automatically transform standard HTTP requests into the Lambda Runtime Interface Emulator format. This means:

1. **Automatic Transformation**: When you use "Try it out" in Swagger UI, your requests are automatically converted to the Lambda event format
2. **Response Handling**: Lambda responses are automatically parsed and displayed in a user-friendly format
3. **Error Handling**: Circuit breaker responses and error conditions are properly displayed

## Troubleshooting

### Common Issues

1. **Swagger UI not loading**
   - Check if the container is running: `docker-compose -f docker-compose.local.yml ps swagger-ui`
   - Check container logs: `docker-compose -f docker-compose.local.yml logs swagger-ui`

2. **API requests failing**
   - Ensure the backend container is running and healthy
   - Check backend logs: `docker-compose -f docker-compose.local.yml logs backend`
   - Verify LocalStack is running: `docker-compose -f docker-compose.local.yml ps localstack`

3. **No test data**
   - Run the data seeder: `docker-compose -f docker-compose.local.yml --profile seeding up data-seeder`
   - Check seeder logs for any errors

### Service URLs

- **Swagger UI**: http://localhost:8080
- **Backend API**: http://localhost:9000/2015-03-31/functions/function/invocations
- **LocalStack**: http://localhost:4566
- **Frontend**: http://localhost:3000 (when running)

### Health Checks

Check if all services are healthy:
```bash
docker-compose -f docker-compose.local.yml ps
```

All services should show "healthy" status when ready.

## Performance Testing

### Response Time Monitoring

```javascript
// Measure API response times
const performanceTest = async (endpoint, iterations = 10) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await apiClient.get(endpoint);
    const end = Date.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`Performance for ${endpoint}:`, {
    average: `${avg}ms`,
    min: `${min}ms`,
    max: `${max}ms`,
    iterations
  });
};
```

### Load Testing Configuration

```yaml
# load-test.yml
config:
  target: 'http://localhost:9000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"

scenarios:
  - name: "Get artists list"
    weight: 70
    flow:
      - post:
          url: "/2015-03-31/functions/function/invocations"
          headers:
            Content-Type: "application/json"
          json:
            httpMethod: "GET"
            path: "/v1/artists"
            queryStringParameters:
              limit: "10"
```

## Best Practices

### API Testing Best Practices

1. **Test both success and error scenarios**
2. **Validate response schemas** against OpenAPI specification
3. **Test edge cases** (empty results, invalid parameters)
4. **Monitor performance** and response times
5. **Use realistic test data** that matches production patterns
6. **Automate repetitive tests** with integration test suite
7. **Document test procedures** for team consistency

### Test Data Management

1. **Use consistent test data** across all testing methods
2. **Reset test data** between test runs when needed
3. **Include edge cases** in test datasets
4. **Validate data integrity** before running tests
5. **Maintain test data** in version control

### Documentation Maintenance

1. **Keep OpenAPI spec updated** with code changes
2. **Test all documented examples** regularly
3. **Include error response examples** in documentation
4. **Validate documentation** against actual API behavior
5. **Review and update** testing procedures regularly

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Postman Documentation](https://learning.postman.com/docs/)
- [Artillery Load Testing](https://artillery.io/docs/)
- [Integration Testing Guide](docs/workflows/testing-strategies.md)
- [End-to-End Testing Guide](docs/workflows/testing-strategies.md)