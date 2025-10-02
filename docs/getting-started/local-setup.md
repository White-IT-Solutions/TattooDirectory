# Local Development Setup

Complete setup instructions for running the Tattoo Artist Directory MVP in a local development environment.

## Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd tattoo-artist-directory
npm install

# Set up test data (first time only)
cd scripts
npm install
npm run setup
cd ..

# Start local environment
npm run local:start

# Verify everything is working
npm run local:health
```

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for initial setup

## Detailed Setup

For comprehensive setup instructions including platform-specific guidance, see:
- [SETUP_MASTER.md](../getting-started/SETUP_MASTER.md) - Complete setup guide
- [Docker Setup](docs/setup/docker-setup.md) - Docker configuration
- [Dependencies](docs/setup/dependencies.md) - Project dependencies

## Service Access Points

Once running, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js development server |
| API Documentation | http://localhost:8080 | Swagger UI for API testing |
| Backend API | http://localhost:9000 | Lambda functions via RIE |
| LocalStack Dashboard | http://localhost:4566 | AWS services simulation |

## Development Commands

```bash
# Environment management
npm run local:start    # Start all services
npm run local:stop     # Stop all services
npm run local:health   # Check service health
npm run local:logs     # View service logs

# Data management
npm run seed           # Seed test data
npm run seed:clean     # Clean existing data
npm run local:reset     # Reset to clean state

# Testing
npm run test:integration:integration  # Run integration tests
npm run test:integration:e2e         # Run end-to-end tests
```

## Troubleshooting

For common issues and solutions, see:
- [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING_GUIDE.md)
- [Development Workflow](../workflows/DEVELOPMENT_GUIDE.md)

## Next Steps

1. **Explore the API**: Use Swagger UI to understand available endpoints
2. **Run Tests**: Execute integration and E2E tests to verify functionality
3. **Make Changes**: Start developing features using the hot-reload capabilities
4. **Debug Issues**: Use the debugging tools and guides provided