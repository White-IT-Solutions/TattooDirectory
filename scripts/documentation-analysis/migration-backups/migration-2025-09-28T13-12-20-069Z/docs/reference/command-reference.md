# Command Reference

This document provides a comprehensive reference for all npm scripts and CLI commands available in the Tattoo Artist Directory MVP project. Commands are organized by category for easy navigation.

## Quick Start Commands

Essential commands to get the development environment running:

```bash
# Start the complete local development environment
npm run local:start

# Stop all services
npm run local:stop

# Restart all services
npm run local:restart

# Check service status
npm run local:status

# View logs from all services
npm run local:logs
```

## Local Development Environment

### Platform Management

```bash
# Start/Stop Services
npm run local:start              # Start all services (cross-platform)
npm run local:stop               # Stop all services (cross-platform)
npm run local:restart            # Restart all services
npm run local:start:windows      # Windows-specific start script
npm run local:start:unix         # Unix/Linux-specific start script
npm run local:stop:windows       # Windows-specific stop script
npm run local:stop:unix          # Unix/Linux-specific stop script

# Service Management
npm run local:clean              # Clean up containers and volumes
npm run local:reset              # Clean and restart services
npm run local:status             # Show service status
npm run local:health             # Run health checks
npm run local:platform-info      # Show platform information
npm run local:docker-info        # Show Docker information

# Emergency Commands
npm run local:emergency-stop     # Force stop all services and cleanup
```

### Service Logs

```bash
# View Logs
npm run local:logs               # All service logs (follow mode)
npm run local:logs:backend       # Backend service logs only
npm run local:logs:frontend      # Frontend service logs only
npm run local:logs:localstack    # LocalStack service logs only
npm run local:logs:swagger       # Swagger UI logs only
npm run local:logs:viewer        # Interactive log viewer

# Alternative Log Commands
npm run logs:start               # Start log aggregator
npm run logs:view                # View logs with follow mode
npm run logs:backend             # Backend logs only
npm run logs:frontend            # Frontend logs only
npm run logs:errors              # Error-level logs only
```

### Development Utilities

```bash
# Development Tools
npm run local:utils              # Show available utilities
npm run local:test-api           # Test API endpoints
npm run local:cleanup            # Cleanup development artifacts
npm run local:report             # Generate development report

# Hot Reload & Development
npm run dev:hot-reload           # Start hot reload proxy
npm run dev:frontend             # Start frontend development server
npm run dev:backend              # Start backend in development mode
```

## Data Management

### Data Setup & Reset

```bash
# Initial Data Setup
npm run setup-data               # Setup complete test dataset
npm run setup-data:frontend-only # Setup minimal data for frontend
npm run setup-data:images-only   # Setup image data only
npm run setup-data:force         # Force setup (overwrite existing)

# Data Reset Operations
npm run reset-data               # Reset to default dataset
npm run reset-data:clean         # Clean reset (remove all data)
npm run reset-data:fresh         # Fresh start with minimal data
npm run reset-data:minimal       # Minimal dataset for testing
npm run reset-data:search-ready  # Dataset optimized for search testing
npm run reset-data:location-test # Location-specific test data
npm run reset-data:style-test    # Style-specific test data
npm run reset-data:performance-test # Performance testing dataset
npm run reset-data:frontend-ready # Frontend-optimized dataset
```

### Scenario-Based Data Seeding

```bash
# Scenario Management
npm run seed-scenario            # Interactive scenario selection
npm run seed-scenario:minimal    # Minimal test scenario
npm run seed-scenario:search-basic # Basic search functionality
npm run seed-scenario:london-artists # London-focused artists
npm run seed-scenario:high-rated # High-rated artists only
npm run seed-scenario:new-artists # Recently added artists
npm run seed-scenario:booking-available # Artists with booking availability
npm run seed-scenario:portfolio-rich # Artists with rich portfolios
npm run seed-scenario:multi-style # Multi-style artists
npm run seed-scenario:pricing-range # Various pricing ranges
npm run seed-scenario:full-dataset # Complete dataset
```

### Data Validation

```bash
# Data Validation
npm run validate-data            # Validate all data integrity
npm run validate-data:consistency # Check data consistency
npm run validate-data:images     # Validate image data
npm run validate-data:scenarios  # Validate scenario data
npm run health-check             # Overall system health check
npm run data-status              # Show data status summary
```

### Studio Management

```bash
# Studio Data Operations
npm run seed-studios             # Seed studio data
npm run seed-studios:force       # Force seed studios (overwrite)
npm run seed-studios:validate    # Seed and validate studios
npm run reset-studios            # Reset studio data
npm run reset-studios:preserve   # Reset while preserving relationships
npm run validate-studios         # Validate studio data integrity
npm run studio-status            # Show studio data status

# Studio Data Processing
npm run process-studio-images    # Process studio images
npm run process-studio-images:force # Force process images
npm run process-studio-images:validate # Process and validate images

# Studio Relationships
npm run manage-studio-relationships # Manage studio relationships
npm run manage-studio-relationships:validate # Validate relationships
npm run manage-studio-relationships:rebuild # Rebuild relationships
npm run manage-studio-relationships:repair # Repair broken relationships
npm run manage-studio-relationships:report # Generate relationship report

# Studio Health & Validation
npm run validate-studio-data-e2e # End-to-end studio validation
npm run validate-studio-data-e2e:verbose # Verbose validation
npm run validate-studio-data-e2e:save-report # Save validation report
npm run validate-studio-data-e2e:full # Full validation with report
npm run studio-health            # Studio health check
npm run studio-troubleshoot      # Studio troubleshooting
```

### Legacy Data Commands

```bash
# Legacy Script Commands (via scripts workspace)
npm run seed                     # Legacy seed command
npm run seed:clean               # Legacy clean seed
npm run seed:validate            # Legacy validate seed
npm run config                   # Show configuration
npm run config:validate          # Validate configuration
npm run config:test              # Test configuration
npm run state                    # Show state information
npm run state:reset              # Reset state tracking
```

## Testing

### Frontend Testing

```bash
# Unit & Integration Tests
npm run test --workspace=frontend # Run all frontend tests
npm run test:watch --workspace=frontend # Watch mode
npm run test:coverage --workspace=frontend # With coverage
npm run test:integration --workspace=frontend # Integration tests
npm run test:cross-page --workspace=frontend # Cross-page consistency

# End-to-End Testing
npm run test:e2e --workspace=frontend # Run E2E tests
npm run test:e2e:headed --workspace=frontend # With browser UI
npm run test:e2e:debug --workspace=frontend # Debug mode
npm run test:e2e:ui --workspace=frontend # Interactive UI mode

# Specialized E2E Tests
npm run test:e2e:visual --workspace=frontend # Visual regression
npm run test:e2e:accessibility --workspace=frontend # Accessibility
npm run test:e2e:theme --workspace=frontend # Theme testing
npm run test:e2e:responsive --workspace=frontend # Responsive design
npm run test:e2e:comprehensive --workspace=frontend # Comprehensive coverage
npm run test:e2e:portfolio --workspace=frontend # Portfolio functionality
npm run test:e2e:auth --workspace=frontend # Authentication flows
npm run test:e2e:search --workspace=frontend # Search interface
npm run test:e2e:errors --workspace=frontend # Error handling

# Comprehensive Test Suites
npm run test:comprehensive --workspace=frontend # All comprehensive tests
npm run test:comprehensive:core --workspace=frontend # Core functionality
npm run test:comprehensive:search --workspace=frontend # Search features
npm run test:comprehensive:portfolio --workspace=frontend # Portfolio features
npm run test:comprehensive:auth --workspace=frontend # Authentication
npm run test:comprehensive:errors --workspace=frontend # Error scenarios
npm run test:comprehensive:dark --workspace=frontend # Dark theme
npm run test:comprehensive:mobile --workspace=frontend # Mobile viewport
npm run test:comprehensive:headed --workspace=frontend # With browser UI
npm run test:comprehensive:debug --workspace=frontend # Debug mode

# UI Auditing
npm run test:ui-audit --workspace=frontend # Complete UI audit
npm run test:ui-audit:visual --workspace=frontend # Visual regression audit
npm run test:ui-audit:accessibility --workspace=frontend # Accessibility audit
npm run test:ui-audit:theme --workspace=frontend # Theme audit
npm run test:ui-audit:responsive --workspace=frontend # Responsive audit

# Test Baselines
npm run baselines:update --workspace=frontend # Update visual baselines
npm run baselines:validate --workspace=frontend # Validate baselines
```

### Backend Testing

```bash
# Backend Tests
npm run test --workspace=backend # Run backend tests
npm run test:watch --workspace=backend # Watch mode
npm run test:coverage --workspace=backend # With coverage
```

### Integration & E2E Testing

```bash
# Integration Tests
npm run test:integration         # Run integration tests
npm run test:integration:api     # API integration tests
npm run test:integration:data    # Data integration tests
npm run test:integration:setup   # Setup integration tests
npm run test:integration:cleanup # Cleanup after tests
npm run test:integration:coverage # Integration test coverage

# E2E Test Management
npm run test:e2e                 # Run E2E tests
npm run test:e2e:setup           # Setup E2E environment
npm run test:e2e:workflows       # Workflow E2E tests
npm run test:e2e:integration     # Integration E2E tests
npm run test:e2e:visual          # Visual E2E tests
npm run test:e2e:headless        # Headless E2E tests
npm run test:e2e:debug           # Debug E2E tests
npm run test:e2e:clean           # Clean E2E artifacts
```

### Studio Testing

```bash
# Studio-Specific Tests
npm run test:studio              # All studio tests
npm run test:studio:unit         # Studio unit tests
npm run test:studio:integration  # Studio integration tests
npm run test:studio:relationships # Relationship tests
npm run test:studio:health       # Studio health tests
npm run test:studio:cli          # Studio CLI tests
npm run test:studio:data         # Studio data tests
npm run test:studio:frontend     # Studio frontend tests
npm run test:studio:coverage     # Studio test coverage
npm run test:studio:watch        # Studio tests in watch mode

# Studio Health Testing
npm run studio-health:comprehensive # Comprehensive health check
npm run studio-health:quick      # Quick health check
npm run studio-health:relationships # Relationship health
npm run studio-health:images     # Image health check
npm run studio-health:addresses  # Address validation

# Studio Development Workflows
npm run studio:dev-setup         # Setup studio development environment
npm run studio:quick-test        # Quick studio test
npm run studio:full-test         # Full studio test suite
```

### Comprehensive Testing

```bash
# System-Wide Testing
npm run test:comprehensive       # Complete system test
npm run test:final-integration   # Final integration test
npm run test:frontend-sync-errors # Frontend sync error tests
npm run test:frontend-sync-errors:verbose # Verbose sync error tests
npm run test:monitoring          # Test monitoring system
```

## Monitoring & Performance

### System Monitoring

```bash
# Resource Monitoring
npm run local:monitor            # Full system monitoring
npm run local:monitor:live       # Live monitoring dashboard
npm run local:resources          # Resource usage recommendations
npm run monitor:localstack       # LocalStack monitoring
npm run monitor:health           # Health monitoring
npm run monitor:report           # Generate monitoring report
npm run monitor:reset            # Reset monitoring data

# Advanced Monitoring
npm run monitor:comprehensive    # Start comprehensive monitoring
npm run monitor:validate         # Validate monitoring setup
npm run monitor:status           # Show monitoring status
npm run monitor:config           # Show monitoring configuration
npm run monitor:config:reset     # Reset monitoring configuration
npm run monitor:dashboard        # Launch monitoring dashboard
npm run monitor:health-advanced  # Advanced health monitoring
npm run monitor:health-continuous # Continuous health monitoring
npm run monitor:environment      # Environment health validation
npm run monitor:environment-continuous # Continuous environment monitoring
```

### Performance Monitoring

```bash
# Performance Analysis
npm run performance:monitor      # Performance monitoring
npm run performance:monitor:continuous # Continuous performance monitoring
npm run performance:monitor:startup # Startup performance monitoring
npm run performance:resources    # Resource usage monitoring
npm run performance:resources:once # One-time resource check
npm run performance:benchmark    # Full performance benchmark
npm run performance:benchmark:quick # Quick performance benchmark
npm run performance:dashboard    # Performance dashboard
npm run performance:export       # Export performance data
npm run performance:demo         # Performance monitoring demo
npm run performance:test         # Test performance monitoring

# Performance Optimization
npm run optimize:startup         # Optimize startup performance
npm run optimize:startup:benchmark # Benchmark startup optimization
npm run optimize:cache           # Optimize Docker cache
npm run optimize:cache:analyze   # Analyze cache optimization
```

### Alerting & Testing

```bash
# Alert System
npm run alerts:test              # Test alert system

# Monitoring Testing
npm run test:monitoring          # Test monitoring system
```

## Development Tools

### Mock Data & Testing

```bash
# Mock Data Generation
npm run dev:mock-data            # Generate mock data
npm run dev:mock-dataset         # Generate mock dataset
npm run dev:mock-artists         # Generate mock artists (20 count)
npm run dev:mock-search          # Generate mock search data (traditional style)
npm run dev:mock-errors          # Generate mock validation errors

# Error Testing
npm run dev:error-tester         # Error scenario tester
npm run dev:test-errors          # Run error test suite
npm run dev:list-scenarios       # List available error scenarios
npm run dev:activate-error       # Activate error scenario
npm run dev:deactivate-errors    # Deactivate all error scenarios

# Debug Tools
npm run dev:debug-logger         # Debug logger utility
npm run dev:debug-test           # Test debug logging
npm run dev:debug-export         # Export debug logs

# Advanced Development Manager
npm run dev:advanced             # Start advanced development manager
npm run dev:advanced:stop        # Stop advanced development manager
npm run dev:advanced:restart     # Restart advanced development manager
npm run dev:advanced:status      # Show advanced manager status
npm run dev:advanced:health      # Advanced manager health check
```

### Debug & Development

```bash
# Debug Mode
npm run debug:start              # Start with full debugging
npm run debug:backend            # Start with backend debugging
npm run debug:frontend           # Start with frontend debugging
```

## Validation & Quality Assurance

### Cross-Platform Validation

```bash
# Platform Validation
npm run validate:cross-platform  # Cross-platform compatibility
npm run validate:parity          # Validate parity across environments
npm run validate:production-parity # Production parity validation
npm run validate:deployment      # Deployment simulation
npm run validate:readiness       # Production readiness checklist
npm run validate:all             # Run all validations
npm run validate:complete        # Complete validation suite
```

### Security Validation

```bash
# Security Checks
npm run security:validate        # Validate security configuration
npm run security:validate-env    # Validate environment security
npm run security:validate-network # Validate network security
npm run security:validate-access # Validate access controls
npm run security:scan-images     # Scan Docker images for vulnerabilities

# Security Configuration
npm run security:fix             # Fix security issues
npm run security:configure       # Configure security settings
npm run security:monitor         # Monitor security status
npm run security:report          # Generate security report
npm run security:template        # Generate security templates
npm run security:sanitize        # Sanitize environment
npm run security:configure-network # Configure network security
npm run security:configure-access # Configure access controls

# Secure Operations
npm run local:start:secure       # Start with security validation
```

## CI/CD & Deployment

### CI Integration

```bash
# CI Commands
npm run ci:test                  # CI test suite
npm run ci:validate              # CI validation suite
npm run ci:setup --workspace=frontend # Setup CI environment
npm run ci:test-integration --workspace=frontend # CI integration tests
npm run ci:test-config --workspace=frontend # Test CI configuration
npm run ci:status --workspace=frontend # CI status check
npm run ci:local-workflow --workspace=frontend # Run local CI workflow
```

### Build & Deployment

```bash
# Frontend Build
npm run build --workspace=frontend # Build frontend
npm run build:analyze --workspace=frontend # Build with analysis
npm run fix:build --workspace=frontend # Fix build issues
npm run validate:build --workspace=frontend # Validate build
npm run deploy:prep --workspace=frontend # Prepare for deployment
```

## Workspace Management

### Individual Workspace Commands

```bash
# Frontend Workspace
npm run dev --workspace=frontend # Start frontend development
npm run start --workspace=frontend # Start frontend production server
npm run build --workspace=frontend # Build frontend
npm run test --workspace=frontend # Test frontend
npm run lint --workspace=frontend # Lint frontend code
npm run clean --workspace=frontend # Clean frontend build artifacts

# Backend Workspace
npm run test --workspace=backend # Test backend
npm run test:watch --workspace=backend # Backend tests in watch mode
npm run test:coverage --workspace=backend # Backend test coverage
npm run lint --workspace=backend # Lint backend code
npm run clean --workspace=backend # Clean backend build artifacts
npm run package --workspace=backend # Package backend for deployment

# Scripts Workspace
npm run setup --workspace=scripts # Setup scripts
npm run test --workspace=scripts # Test scripts
npm run config --workspace=scripts # Show scripts configuration
npm run info --workspace=scripts # Show scripts information
npm run state-manager --workspace=scripts # Manage script state
npm run incremental-processor --workspace=scripts # Run incremental processing
npm run update-data --workspace=scripts # Update data
npm run upload-images --workspace=scripts # Upload images

# E2E Tests Workspace
npm run setup --workspace=tests/e2e # Setup E2E tests
npm run test --workspace=tests/e2e # Run E2E tests
npm run clean --workspace=tests/e2e # Clean E2E test artifacts

# Integration Tests Workspace
npm run test --workspace=tests/integration # Run integration tests
npm run test:setup --workspace=tests/integration # Setup integration tests
npm run test:cleanup --workspace=tests/integration # Cleanup integration tests
npm run test:api --workspace=tests/integration # API integration tests
npm run test:data --workspace=tests/integration # Data integration tests
```

### Multi-Workspace Commands

```bash
# Cross-Workspace Operations
npm install                       # Install dependencies for all workspaces
npm run build --workspaces       # Build all workspaces
npm run test --workspaces         # Test all workspaces
```

## Documentation Management

### Documentation Analysis & Consolidation

```bash
# Documentation Analysis (via scripts/documentation-analysis workspace)
npm run analyze --workspace=scripts/documentation-analysis # Analyze documentation structure
npm run consolidate --workspace=scripts/documentation-analysis # Consolidate documentation
npm run validate --workspace=scripts/documentation-analysis # Validate documentation
npm run gap-analysis --workspace=scripts/documentation-analysis # Generate gap analysis report

# Documentation Cleanup (from scripts/documentation-analysis directory)
npm run cleanup # Preview cleanup (dry run)
npm run cleanup:live # Actually remove outdated files
npm run cross-reference # Check command documentation coverage

# Legacy Command Migration (from scripts/documentation-analysis directory)
npm run migrate-legacy # Preview legacy command migration (dry run)
npm run migrate-legacy:live # Actually migrate legacy commands

# Direct script usage (from scripts/documentation-analysis directory)
node run-consolidation.js       # Run consolidation pipeline
node run-validation.js          # Run validation pipeline
node cleanup-old-docs.js        # Preview cleanup (dry run)
node cleanup-old-docs.js --live # Actually remove files
node cleanup-old-docs.js --help # Show cleanup help
node cross-reference-commands.js # Check command documentation coverage
node migrate-legacy-commands.js # Preview legacy command migration (dry run)
node migrate-legacy-commands.js --live # Actually migrate legacy commands
```

### Documentation Testing

```bash
# Documentation Tests (via scripts/documentation-analysis workspace)
npm test --workspace=scripts/documentation-analysis # Run all documentation tests
npm run test:watch --workspace=scripts/documentation-analysis # Watch mode
npm run test:coverage --workspace=scripts/documentation-analysis # With coverage

# Specific Test Suites
npm test -- __tests__/DocumentationAnalyzer.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/ContentConsolidator.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/DocumentationValidator.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/GapAnalysisReporter.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/CommandDocumentationGenerator.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/TemplateValidator.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/TemplateProcessor.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/DocumentationCleanup.test.js --workspace=scripts/documentation-analysis
npm test -- __tests__/cleanup-integration.test.js --workspace=scripts/documentation-analysis
```

## Help & Information

### System Information

```bash
# Information Commands
npm run help                     # Show help information
npm run scenarios                # Show available scenarios
npm run reset-states             # Show reset state options
npm run local:platform-info      # Platform information
npm run local:docker-info        # Docker information
npm run data-status              # Data status summary
npm run studio-status            # Studio status summary
```

### Configuration

```bash
# Configuration Management
npm run config                   # Show configuration
npm run config:validate          # Validate configuration
npm run config:test              # Test configuration
npm run state                    # Show state information
npm run state:reset              # Reset state tracking
```

## Environment Variables

Key environment variables that affect command behavior:

```bash
# Debug Flags
ENABLE_BACKEND_DEBUG=true        # Enable backend debugging
ENABLE_FRONTEND_DEBUG=true       # Enable frontend debugging

# Test Flags
HEADLESS=false                   # Run tests with browser UI
DEBUG=true                       # Enable debug mode for tests

# Development Flags
NODE_ENV=development             # Set development environment
```

## Command Categories Summary

- **Local Development**: 40+ commands for environment management
- **Data Management**: 50+ commands for data operations (excluding 29 legacy commands)
- **Testing**: 60+ commands for various testing scenarios
- **Monitoring**: 25+ commands for system monitoring
- **Development Tools**: 20+ commands for development utilities
- **Documentation Management**: 15+ commands for documentation analysis and cleanup
- **Validation**: 15+ commands for quality assurance
- **Security**: 12+ commands for security validation
- **CI/CD**: 10+ commands for continuous integration

## Legacy Commands Notice

⚠️ **Legacy Commands Identified**: 29 commands from `backups/legacy-scripts-20250918/data-seeder/` are still referenced in documentation but should be migrated to their current equivalents in the `scripts/` workspace. Use `npm run cross-reference --workspace=scripts/documentation-analysis` to see the full legacy analysis.

## Usage Tips

1. **Start Simple**: Use `npm run local:start` to get everything running
2. **Check Status**: Use `npm run local:status` to verify services
3. **View Logs**: Use `npm run local:logs` to troubleshoot issues
4. **Reset When Stuck**: Use `npm run local:reset` for a fresh start
5. **Emergency Stop**: Use `npm run local:emergency-stop` if services hang
6. **Test Data**: Use `npm run setup-data` for initial data setup
7. **Health Checks**: Use `npm run local:health` to verify system health

For detailed information about specific commands, refer to the individual component documentation in the `docs/components/` directory.