# Studio CLI Commands Documentation

## Overview

The Data CLI has been extended with comprehensive studio-specific commands that allow developers to manage studio data independently from artist data. These commands support studio-only operations, validation, relationship management, and image processing.

## Available Studio Commands

### 1. `seed-studios` - Studio Data Seeding

Seed only studio data without affecting existing artist data.

**Usage:**
```bash
npm run seed-studios [options]
node scripts/data-cli.js seed-studios [options]
```

**Options:**
- `--scenario <name>` - Use specific scenario for studio generation
- `--count <number>` - Override studio count for generation
- `--force` - Force regeneration of existing studio data
- `--validate` - Validate studio data after seeding

**Examples:**
```bash
# Basic studio seeding
npm run seed-studios

# Seed with specific scenario
npm run seed-studios --scenario studio-diverse

# Seed with custom count and validation
npm run seed-studios --count 5 --validate

# Force regeneration with scenario
npm run seed-studios --force --scenario london-studios
```

**Requirements Addressed:** 6.1, 6.4, 6.5

### 2. `validate-studios` - Studio Data Validation

Validate only studio-related data and relationships.

**Usage:**
```bash
npm run validate-studios [type]
node scripts/data-cli.js validate-studios [type]
```

**Validation Types:**
- `all` - Comprehensive studio validation (default)
- `data` - Studio data structure and required fields
- `relationships` - Artist-studio relationship consistency
- `images` - Studio image accessibility and format
- `addresses` - Studio address and postcode validation
- `consistency` - Cross-service studio data consistency

**Examples:**
```bash
# Comprehensive validation
npm run validate-studios

# Validate relationships only
npm run validate-studios:relationships

# Validate studio images
npm run validate-studios:images

# Validate addresses and postcodes
npm run validate-studios:addresses
```

**Requirements Addressed:** 6.2, 6.4, 6.5

### 3. `reset-studios` - Studio Data Reset

Reset studio data while preserving artist data.

**Usage:**
```bash
npm run reset-studios [options]
node scripts/data-cli.js reset-studios [options]
```

**Options:**
- `--preserve-relationships` - Clear studio data but keep artist-studio references
- `--scenario <name>` - Reseed with specific scenario after reset
- `--validate` - Validate data consistency after reset

**Examples:**
```bash
# Basic studio reset
npm run reset-studios

# Reset and reseed with scenario
npm run reset-studios --scenario studio-diverse

# Reset while preserving relationships
npm run reset-studios:preserve --validate
```

**Requirements Addressed:** 6.3, 6.4, 6.5

### 4. `studio-status` - Studio Status Information

Display studio data counts and status information.

**Usage:**
```bash
npm run studio-status
node scripts/data-cli.js studio-status
```

**Information Provided:**
- Total studio count and active studios
- Studios with images and artist assignments
- Artist-studio relationship statistics
- Studio image accessibility status
- Data consistency across services

**Example:**
```bash
npm run studio-status
```

**Requirements Addressed:** 6.4, 6.5, 6.6

### 5. `process-studio-images` - Studio Image Processing

Process and upload studio images to S3.

**Usage:**
```bash
npm run process-studio-images [options]
node scripts/data-cli.js process-studio-images [options]
```

**Options:**
- `--studio-id <id>` - Process images for specific studio only
- `--force` - Reprocess existing images
- `--validate` - Validate image accessibility after processing

**Examples:**
```bash
# Process all studio images
npm run process-studio-images

# Process specific studio
npm run process-studio-images --studio-id studio-001

# Force reprocessing with validation
npm run process-studio-images:force --validate
```

**Requirements Addressed:** 6.6

### 6. `manage-studio-relationships` - Relationship Management

Manage artist-studio relationship assignments.

**Usage:**
```bash
npm run manage-studio-relationships [action]
node scripts/data-cli.js manage-studio-relationships [action]
```

**Actions:**
- `validate` - Validate all artist-studio relationships
- `rebuild` - Rebuild relationships based on location and style compatibility
- `repair` - Repair inconsistent or broken relationships
- `report` - Generate relationship status report

**Examples:**
```bash
# Validate relationships
npm run manage-studio-relationships:validate

# Rebuild all relationships
npm run manage-studio-relationships:rebuild

# Repair inconsistent relationships
npm run manage-studio-relationships:repair

# Generate relationship report
npm run manage-studio-relationships:report
```

**Requirements Addressed:** 6.5, 6.6

## Studio-Specific Scenarios

The following scenarios are optimized for studio testing:

### Studio-Focused Scenarios
- `studio-diverse` - Diverse studio types and specializations
- `london-studios` - London-focused studios with proper postcodes
- `high-rated-studios` - High-rated studios (4.5+ stars)

### Usage Examples
```bash
# Seed diverse studio types
npm run seed-studios --scenario studio-diverse

# Reset to London-focused studios
npm run reset-studios --scenario london-studios

# Validate high-rated studios
npm run seed-studios --scenario high-rated-studios --validate
```

## Integration with Existing Commands

Studio commands integrate seamlessly with existing data management commands:

### Combined Operations
```bash
# Full setup including studios
npm run setup-data

# Reset all data including studios
npm run reset-data fresh

# Validate all data including studios
npm run validate-data all
```

### Studio-Specific Workflows
```bash
# Studio development workflow
npm run seed-studios --scenario studio-diverse
npm run validate-studios relationships
npm run process-studio-images --validate
npm run studio-status

# Studio troubleshooting workflow
npm run validate-studios all
npm run manage-studio-relationships repair
npm run reset-studios --preserve-relationships
```

## Error Handling and Troubleshooting

### Common Issues and Solutions

**Studio Seeding Failures:**
```bash
# Check system health
npm run health-check

# Validate existing data
npm run validate-studios consistency

# Reset and retry
npm run reset-studios --scenario minimal
```

**Relationship Inconsistencies:**
```bash
# Validate relationships
npm run manage-studio-relationships validate

# Repair inconsistencies
npm run manage-studio-relationships repair

# Rebuild if necessary
npm run manage-studio-relationships rebuild
```

**Image Processing Issues:**
```bash
# Check image accessibility
npm run validate-studios images

# Reprocess images
npm run process-studio-images --force

# Validate after processing
npm run process-studio-images --validate
```

## Command Validation

All studio commands include comprehensive validation:

### Scenario Validation
- Validates scenario names against available scenarios
- Provides suggestions for invalid scenarios
- Lists available scenarios on error

### Parameter Validation
- Studio count must be positive numbers
- Studio IDs must follow format `studio-XXX`
- Validation types must be from allowed list
- Relationship actions must be valid

### Example Validation Errors
```bash
# Invalid scenario
npm run seed-studios --scenario invalid-name
# Error: Invalid scenario: invalid-name
# Available scenarios: minimal, studio-diverse, london-studios...

# Invalid validation type
npm run validate-studios invalid-type
# Error: Invalid studio validation type: invalid-type
# Available types: all, data, relationships, images, addresses, consistency
```

## Performance Considerations

### Large Studio Datasets
```bash
# Performance testing with many studios
npm run seed-studios --scenario performance-test --count 50

# Monitor performance
npm run studio-status

# Validate performance impact
npm run validate-studios consistency
```

### Incremental Operations
```bash
# Process specific studio only
npm run process-studio-images --studio-id studio-001

# Validate specific aspects
npm run validate-studios relationships

# Targeted relationship management
npm run manage-studio-relationships repair
```

## Implementation Status

### ✅ Completed Features
- All 6 studio commands implemented and tested
- Command validation and error handling
- Help system integration
- npm script integration
- Basic test coverage

### 🔄 Placeholder Implementations
- UnifiedDataManager studio methods (return mock data)
- Actual studio data processing logic
- Database integration for studio operations
- Image processing implementation
- Relationship management algorithms

### 📋 Next Steps
1. Implement actual studio data processing in UnifiedDataManager
2. Add studio data generators and validators
3. Integrate with existing pipeline components
4. Add comprehensive test coverage
5. Update documentation with real examples

## Requirements Mapping

| Requirement | Commands | Status |
|-------------|----------|---------|
| 6.1 - Studio-only seeding | `seed-studios` | ✅ CLI Complete |
| 6.2 - Studio validation | `validate-studios` | ✅ CLI Complete |
| 6.3 - Studio reset | `reset-studios` | ✅ CLI Complete |
| 6.4 - Status reporting | `studio-status`, all commands | ✅ CLI Complete |
| 6.5 - Data consistency | `validate-studios`, `manage-studio-relationships` | ✅ CLI Complete |
| 6.6 - Image processing & relationships | `process-studio-images`, `manage-studio-relationships` | ✅ CLI Complete |

All CLI interfaces are complete and ready for backend implementation.