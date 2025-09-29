# Studio Test Data

This directory contains studio test data organized by testing scenarios. Each file provides realistic studio data for different testing purposes.

## File Structure

```
studios/
├── minimal.json           # Minimal dataset (2 studios)
├── london-artists.json    # London-focused studios (3 studios)
├── high-rated.json        # High-rated studios (2 studios)
├── full-dataset.json      # Comprehensive dataset (6 studios)
└── README.md             # This file
```

## Data Files

### minimal.json
- **Studios**: 2
- **Purpose**: Quick testing and development
- **Features**: Basic studio data with minimal complexity
- **Use Cases**: Unit tests, quick validation, development setup

### london-artists.json
- **Studios**: 3
- **Purpose**: Location-based testing
- **Features**: All studios in London with proper postcodes
- **Use Cases**: Geographic filtering, postcode validation, location search

### high-rated.json
- **Studios**: 2
- **Purpose**: Quality and rating testing
- **Features**: Studios with ratings 4.5+ and premium locations
- **Use Cases**: Rating filters, quality validation, premium features

### full-dataset.json
- **Studios**: 6
- **Purpose**: Comprehensive testing
- **Features**: Diverse locations, specialties, and studio types
- **Use Cases**: Integration tests, performance testing, full feature validation

## Data Structure

Each studio record contains:

```json
{
  "studioId": "studio-xxx-001",
  "studioName": "Studio Name",
  "address": "Full UK address",
  "postcode": "Valid UK postcode",
  "geohash": "Geographic hash",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "locationDisplay": "City, UK",
  "contactInfo": {
    "phone": "+44 20 1234 5678",
    "email": "studio@example.com",
    "website": "https://example.com",
    "instagram": "@studiohandle"
  },
  "openingHours": {
    "monday": "10:00-18:00",
    "tuesday": "10:00-18:00",
    "wednesday": "10:00-18:00",
    "thursday": "10:00-18:00",
    "friday": "10:00-18:00",
    "saturday": "10:00-16:00",
    "sunday": "closed"
  },
  "artists": ["artist-001", "artist-002"],
  "artistCount": 2,
  "rating": 4.7,
  "reviewCount": 89,
  "established": 2015,
  "specialties": ["traditional", "realism"],
  "images": [
    {
      "type": "exterior",
      "url": "S3 URL",
      "description": "Image description",
      "isPrimary": true
    }
  ]
}
```

## Usage Examples

### Loading Test Data in Node.js

```javascript
const fs = require('fs');
const path = require('path');

// Load minimal dataset
const minimalStudios = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'minimal.json'), 'utf8')
);

// Load scenario-specific data
const londonStudios = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'london-artists.json'), 'utf8')
);
```

### Using with Test Framework

```javascript
describe('Studio Data Processing', () => {
  let testStudios;
  
  beforeEach(() => {
    testStudios = require('./test-data/studios/minimal.json');
  });
  
  test('should process studio data correctly', () => {
    // Test implementation using testStudios
  });
});
```

## Validation Rules

All studio test data must follow these rules:

- **Studio IDs**: Unique across all files, format: `studio-{scenario}-{number}`
- **Postcodes**: Valid UK postcode format
- **Coordinates**: Within UK geographic bounds (49.9-60.9°N, -8.2-1.8°E)
- **Ratings**: Between 1.0 and 5.0
- **Established**: Between 1900 and current year
- **Phone Numbers**: Valid UK format starting with +44
- **Email**: Valid email format
- **Instagram**: Valid handle format starting with @

## Maintenance

When updating test data:

1. Ensure all validation rules are followed
2. Update the version in `studio-test-data-index.json`
3. Run validation tests to ensure data integrity
4. Update this README if structure changes

## Related Files

- `../studio-relationships.json` - Artist-studio relationship data
- `../frontend-studio-mock-examples.js` - Frontend mock data examples
- `../unit-test-fixtures.json` - Unit test fixtures
- `../integration-test-fixtures.json` - Integration test fixtures
- `../../Test_Data/StudioImages/` - Studio image test files