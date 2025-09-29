# Documentation Analysis Tools

This directory contains a comprehensive suite of tools for analyzing, validating, consolidating, and maintaining project documentation.

## 🚀 Quick Start

```bash
# Run complete documentation consolidation pipeline
node run-consolidation.js

# Run validation pipeline only
node run-validation.js

# Clean up old documentation files
node cleanup-old-docs.js

# Quick validation check
node run-validation.js --quick
```

## Architecture

### Core Components

- **DocumentationAnalyzer**: Scans and analyzes existing documentation files
- **ContentConsolidator**: Merges and organizes documentation content
- **CommandDocumentationGenerator**: Generates documentation from npm scripts
- **DocumentationValidator**: Validates documentation accuracy
- **GapAnalysisReporter**: Identifies documentation gaps and priorities

### Utilities

- **FileUtils**: Common file system operations
- **MarkdownUtils**: Markdown parsing and manipulation utilities

### Configuration

- **documentation-config.js**: Central configuration for all processing rules

## Installation

```bash
cd scripts/documentation-analysis
npm install
```

## Usage

### Basic Analysis

```bash
# Analyze current documentation structure
npm run analyze

# Generate gap analysis report
npm run gap-analysis

# Validate existing documentation
npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis

# Consolidate documentation
npm run consolidate
```

### Programmatic Usage

```javascript
const {
  DocumentationAnalyzer,
  ContentConsolidator,
  CommandDocumentationGenerator,
  DocumentationValidator,
  GapAnalysisReporter
} = require('./index');

// Analyze documentation structure
const analyzer = new DocumentationAnalyzer();
const documentationMap = await analyzer.analyzeStructure();

// Consolidate content
const consolidator = new ContentConsolidator();
const consolidatedContent = await consolidator.consolidateContent(sections);

// Generate command documentation
const commandGenerator = new CommandDocumentationGenerator();
const commandDocs = await commandGenerator.generateCommandReference();

// Validate documentation
const validator = new DocumentationValidator();
const validationReport = await validator.validateDocumentationSet(docs);

// Generate gap analysis
const gapReporter = new GapAnalysisReporter();
const gapReport = await gapReporter.generateGapReport(analysisData);
```

## Configuration

The system is configured through `config/documentation-config.js`. Key configuration options include:

### Documentation Paths
- Directories to scan for documentation
- File patterns to include/exclude
- Target documentation structure

### Content Categorization
- Rules for categorizing content by type
- Priority levels for different content types
- Keywords for automatic categorization

### Command Processing
- Package.json files to analyze
- Command categorization rules
- Validation settings

### Gap Analysis
- Importance levels for missing documentation
- Effort estimation for documentation tasks
- Priority matrix configuration

## Directory Structure

```
scripts/documentation-analysis/
├── index.js                           # Main entry point
├── package.json                       # Package configuration
├── README.md                          # This file
├── config/
│   └── documentation-config.js        # Configuration settings
├── src/
│   ├── DocumentationAnalyzer.js       # Documentation analysis
│   ├── ContentConsolidator.js         # Content consolidation
│   ├── CommandDocumentationGenerator.js # Command documentation
│   ├── DocumentationValidator.js      # Documentation validation
│   ├── GapAnalysisReporter.js         # Gap analysis reporting
│   ├── interfaces/                    # Interface definitions
│   │   ├── IDocumentationAnalyzer.js
│   │   ├── IContentConsolidator.js
│   │   ├── ICommandDocumentationGenerator.js
│   │   ├── IDocumentationValidator.js
│   │   └── IGapAnalysisReporter.js
│   ├── types/
│   │   └── DocumentationTypes.js      # Type definitions
│   └── utils/
│       ├── FileUtils.js               # File system utilities
│       └── MarkdownUtils.js           # Markdown utilities
├── scripts/                           # Execution scripts (to be created)
├── reports/                           # Generated reports (created at runtime)
└── backups/                           # File backups (created at runtime)
```

## Implementation Status

This infrastructure is currently set up with interfaces and base implementations. The actual functionality will be implemented in subsequent tasks:

- **Task 2**: DocumentationAnalyzer implementation
- **Task 3**: ContentConsolidator implementation  
- **Task 4**: CommandDocumentationGenerator implementation
- **Task 5**: DocumentationValidator implementation
- **Task 6**: GapAnalysisReporter implementation

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

When implementing new functionality:

1. Follow the interface contracts defined in `src/interfaces/`
2. Use the type definitions from `src/types/DocumentationTypes.js`
3. Leverage utilities from `src/utils/` for common operations
4. Add comprehensive tests for new functionality
5. Update configuration in `config/documentation-config.js` as needed

## Requirements Addressed

This infrastructure addresses the following requirements from the documentation consolidation spec:

- **Requirement 1.1**: Hierarchical documentation structure analysis
- **Requirement 2.1**: Accurate documentation validation and npm script matching
- **Requirement 2.2**: File location and functionality validation
- **Requirement 5.1**: Gap analysis and missing documentation identification

The modular design ensures each component can be developed and tested independently while working together as a cohesive system.