# Development Tools

This directory contains development tools and configuration files for the Tattoo Artist Directory project.

## Structure

````
devtools/
├── docker/                    # Docker Compose configurations
│   ├── docker-compose.local.yml      # Base local development setup
│   ├── docker-compose.windows.yml    # Windows-specific overrides
│   ├── docker-compose.macos.yml      # macOS-specific overrides
│   ├── docker-compose.linux.yml      # Linux-specific overrides
│   └── docker-compose.override.yml   # Cross-platform development overrides
├── scripts/                   # Advanced development utility scripts
│   ├── advanced-dev-manager.js       # Advanced development workflow manager
│   ├── debug-logger.js               # Debug logging utilities
│   ├── error-scenario-tester.js      # Error scenario testing
│   ├── hot-reload-proxy.js           # Hot reload proxy server
│   ├── mock-data-generator.js        # Mock data generation
│   └── security-config.json          # Security configuration
├── monitoring/                # Monitoring and health check tools
├── .env.local.example         # Environment configuration template
├── .env.debug.example         # Debug configuration template
├── README-DEVTOOLS.md         # This file
└── README-ADVANCED-FEATURES.md # Advanced features documentation
```## Advanced Development Features

The `scripts/` directory contains advanced development utilities:

- **advanced-dev-manager.js**: Unified interface for managing all development tools
- **hot-reload-proxy.js**: Automatic backend reloading with enhanced debugging
- **mock-data-generator.js**: Realistic test data generation for development
- **debug-logger.js**: Comprehensive request/response logging and debugging
- **error-scenario-tester.js**: Testing various error scenarios and edge cases

### Quick Start with Advanced Features

```bash
# Start all advanced development features
npm run dev:advanced

# Check status of all services
npm run dev:advanced:status

# Generate mock data
npm run dev:mock-artists

# List available error scenarios
npm run dev:list-scenarios
````

For detailed documentation on advanced features, see [README-ADVANCED-FEATURES.md]

### Environment Configuration

1.  Copy the environment template:

    ```bash
    cp devtools/.env.local.example devtools/.env.local
    ```

2.  Customize the values in `.env.local` as needed for your system:## Services

The Docker Compose setup includes:

- **LocalStack**: AWS services emulation (DynamoDB, OpenSearch, S3, etc.)
- **Backend**: Lambda Runtime Interface Emulator for API development
- **Frontend**: Next.js development server
- **Swagger UI**: API documentation interface
- **Data Seeder**: Test data population (optional profile)
- **Hot Reload Proxy**: Development proxy with automatic reloading (when using advanced features)## Available NPM Scripts

### Advanced Development Management

```bash
npm run dev:advanced              # Start all advanced features
npm run dev:advanced:stop         # Stop all services
npm run dev:advanced:restart      # Restart all services
npm run dev:advanced:status       # Check service status
npm run dev:advanced:health       # Run health check
```

### Individual Development Tools

```bash
npm run dev:hot-reload            # Start hot reload proxy
npm run dev:mock-data             # Mock data generator CLI
npm run dev:debug-logger          # Debug logger CLI
npm run dev:error-tester          # Error scenario tester CLI
```

### Mock Data Generation

```bash
npm run dev:mock-dataset          # Generate complete test dataset
npm run dev:mock-artists          # Generate mock artists (20 count)
npm run dev:mock-search           # Generate search results (traditional style)
npm run dev:mock-errors           # Generate validation error response
```

### Error Scenario Testing

```bash
npm run dev:test-errors           # Run comprehensive error test suite
npm run dev:list-scenarios        # List all available error scenarios
npm run dev:activate-error        # Activate error scenario (requires args)
npm run dev:deactivate-errors     # Deactivate all error scenarios
```

### Debug Logging

```bash
npm run dev:debug-test            # Test debug logging functionality
npm run dev:debug-export          # Export debug logs to file
```

## Development Workflow

### Standard Development

```bash
# Start the standard local environment
npm run local:start

# View logs
npm run local:logs
```

### Enhanced Development (with Advanced Features)

```bash
# Start enhanced development environment
npm run dev:advanced

# The enhanced environment includes:
# - Hot reload proxy on port 9001
# - Automatic backend reloading
# - Request/response logging
# - Mock data capabilities
# - Error scenario testing
```

## Migration Notes

Files have been reorganized as follows:

- `docs/openapi.yaml` → `backend/docs/openapi.yaml`
- `docs/swagger-*.{js,html}` → `backend/docs/swagger-*.{js,html}`
- `docker-compose*.yml` → `devtools/docker/docker-compose*.yml`
- `.env.local.example` → `devtools/.env.local.example`
- Advanced development scripts → `devtools/scripts/`
