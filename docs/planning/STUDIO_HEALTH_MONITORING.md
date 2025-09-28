# Studio Health Monitoring Documentation

## Overview

The enhanced health monitor provides comprehensive validation and monitoring capabilities for studio data across all services in the tattoo directory system. This includes studio data consistency validation, artist-studio relationship integrity checking, address and coordinate validation, image accessibility verification, and detailed troubleshooting guidance.

## Features

### 🏢 Studio Data Validation

- **Required Field Validation**: Ensures all studios have essential fields (studioId, studioName, address, postcode, coordinates)
- **UK Postcode Validation**: Validates UK postcode format using regex patterns
- **Coordinate Accuracy**: Verifies latitude/longitude coordinates are within UK geographic bounds
- **Contact Information**: Validates email format, UK phone numbers, and Instagram handle format
- **Opening Hours**: Validates opening hours format (HH:MM-HH:MM or "closed")
- **Specialties**: Validates studio specialties against allowed values
- **Rating Validation**: Ensures ratings are within 1.0-5.0 range

### 🔗 Artist-Studio Relationship Validation

- **Bidirectional Consistency**: Verifies artist-studio references are consistent in both directions
- **Orphaned Reference Detection**: Identifies artists referencing non-existent studios and vice versa
- **Artist Count Validation**: Ensures studio artist count matches actual artist array length
- **Relationship Integrity**: Validates that all relationships are properly maintained

### 🖼️ Studio Image Validation

- **URL Format Validation**: Ensures image URLs are valid HTTP/HTTPS URLs
- **S3 Naming Convention**: Validates studio images follow the `studios/{studioId}/...` pattern
- **Image Accessibility**: Tests actual HTTP accessibility of studio image URLs
- **Image Type Validation**: Validates image types (exterior, interior, gallery)

### 📱 Frontend Mock Data Consistency

- **File Accessibility**: Checks if frontend mock studio data file exists and is readable
- **Data Structure Validation**: Validates mock data contains required fields
- **Count Consistency**: Ensures frontend mock studio count matches backend data
- **Format Validation**: Validates JSON structure and data format

## CLI Commands

### Studio Health Check
```bash
npm run studio-health
```
Runs comprehensive studio health check and displays summary with troubleshooting guidance.

### Studio Data Validation
```bash
npm run validate-studios
```
Runs detailed studio data validation and returns JSON results.

### Studio Troubleshooting
```bash
npm run studio-troubleshoot
```
Generates detailed troubleshooting guidance for studio data issues.

### Validation by Type
```bash
# Validate only studio data
npm run validate-data:studios

# Validate all data types including studios
npm run validate-data
```

## Direct CLI Usage

You can also run the health monitor directly:

```bash
# Studio health check
node scripts/health-monitor.js health

# Studio validation
node scripts/health-monitor.js validate --type=studios

# System status
node scripts/health-monitor.js status

# Troubleshooting guidance
node scripts/health-monitor.js troubleshoot

# Help
node scripts/health-monitor.js
```

## Validation Results

### Studio Validation Response Structure

```json
{
  "type": "studios",
  "timestamp": "2025-09-23T14:50:44.716Z",
  "results": {
    "studios": {
      "totalStudios": 5,
      "validStudios": 4,
      "validationRate": "80.0",
      "validationErrors": [
        {
          "studioId": "STUDIO#studio-001",
          "field": "email",
          "value": "invalid-email",
          "error": "Invalid email format",
          "severity": "warning"
        }
      ],
      "relationshipErrors": [
        {
          "type": "orphaned_artist_reference",
          "artistId": "ARTIST#artist-001",
          "studioId": "studio-999",
          "error": "Artist references non-existent studio: studio-999",
          "severity": "error"
        }
      ],
      "addressErrors": [
        {
          "studioId": "STUDIO#studio-002",
          "field": "postcode",
          "value": "INVALID",
          "error": "Invalid UK postcode format",
          "severity": "error"
        }
      ],
      "imageErrors": [
        {
          "studioId": "STUDIO#studio-003",
          "imageUrl": "invalid-url",
          "error": "Image URL should be a valid HTTP/HTTPS URL",
          "severity": "error"
        }
      ],
      "dataConsistencyErrors": [
        {
          "type": "mock_data_count_mismatch",
          "error": "Frontend mock studio count (3) doesn't match backend count (5)",
          "severity": "warning"
        }
      ],
      "lastCheck": "2025-09-23T14:50:44.785Z"
    }
  },
  "errors": []
}
```

### Health Check Summary

```
📊 Studio Health Summary:
  Total Studios: 5
  Valid Studios: 4
  Validation Rate: 80.0%
  Relationship Errors: 1
  Address Errors: 2
  Image Errors: 1
```

## Troubleshooting Guidance

The health monitor provides automatic troubleshooting guidance based on detected issues:

### Low Validation Rate
- Check studio data generation parameters in data-config.js
- Verify studio data seeding completed successfully
- Run: `npm run validate-studios` for detailed error report
- Consider regenerating studio data: `npm run seed-studios`

### Relationship Errors
- Check artist-studio relationship consistency
- Verify bidirectional references are maintained
- Run: `npm run validate-studios --type=relationships`
- Consider running relationship repair: `npm run repair-relationships`

### Address Validation Errors
- Check UK postcode format validation
- Verify coordinate accuracy for UK locations
- Review address data generation in studio data generator
- Consider updating address validation rules

### Image Accessibility Issues
- Check S3 bucket accessibility and CORS configuration
- Verify studio image naming conventions: `studios/{studioId}/...`
- Run: `npm run process-studio-images` to regenerate images
- Check LocalStack S3 service status

### Studio Count Mismatch
- Check OpenSearch studio index exists and is populated
- Verify studio data seeding completed for both services
- Run: `npm run seed-studios` to reseed studio data
- Check OpenSearch service connectivity

## Integration with Existing Health Monitor

The studio validation is fully integrated with the existing health monitoring system:

- **Service Connectivity**: Includes studio-specific service checks
- **Cross-Service Consistency**: Validates studio data consistency between DynamoDB and OpenSearch
- **Image Accessibility**: Extended to include studio images alongside artist images
- **Data Validation**: Studio validation is part of the comprehensive data validation suite

## Error Severity Levels

- **Error**: Critical issues that prevent proper functionality (missing required fields, invalid relationships)
- **Warning**: Issues that may affect user experience but don't break functionality (invalid contact info, coordinate bounds)

## Monitoring Integration

The studio health monitoring integrates with:

- **Data CLI**: Studio validation available through `data-cli.js`
- **Pipeline Engine**: Health checks run as part of data processing pipeline
- **State Manager**: Studio validation state is tracked and persisted
- **Frontend Sync**: Mock data consistency validation ensures frontend compatibility

## Best Practices

1. **Regular Monitoring**: Run `npm run studio-health` regularly to catch issues early
2. **Validation After Changes**: Always run studio validation after data updates
3. **Address Issues by Severity**: Fix error-level issues before warning-level issues
4. **Monitor Relationships**: Pay special attention to artist-studio relationship consistency
5. **Frontend Consistency**: Ensure frontend mock data stays synchronized with backend data

## Testing

The studio health monitoring includes comprehensive tests:

```bash
# Run studio validation tests
node scripts/__tests__/health-monitor-studio.test.js
```

Test coverage includes:
- Valid studio data validation
- Invalid studio data detection
- Email and phone format validation
- Troubleshooting guidance generation
- Recommendation system testing

## Future Enhancements

Planned improvements include:
- Automated relationship repair functionality
- Performance monitoring for studio data operations
- Advanced geographic validation using external APIs
- Integration with monitoring dashboards
- Automated alerting for critical studio data issues