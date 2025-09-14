# Development Workflow Scripts

This directory contains scripts and utilities for managing the local development environment of the Tattoo Directory MVP.

## Quick Start - Complete Environment Setup

```bash
# 1. Set up test data with S3 images (first time only)
cd scripts
npm install
npm run setup

# 2. Start the complete local environment
cd ..
npm run local:start

# 3. Check if everything is running
npm run local:health

# 4. View logs from all services
npm run local:logs

# 5. Stop the environment when done
npm run local:stop
```

## First Time Setup

Before starting the local environment for the first time, you need to set up test data:

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install

# Set up test data with S3 images
npm run setup
```

This will:

- Upload test images to LocalStack S3
- Update test data files with S3 URLs
- Generate realistic artist avatars

## Available Scripts

### Environment Management

| Script          | Description                      | Usage                   |
| --------------- | -------------------------------- | ----------------------- |
| `local:start`   | Start complete local environment | `npm run local:start`   |
| `local:stop`    | Stop all services                | `npm run local:stop`    |
| `local:restart` | Restart environment              | `npm run local:restart` |
| `local:status`  | Show container status            | `npm run local:status`  |
| `local:health`  | Run health checks                | `npm run local:health`  |
| `local:clean`   | Stop and remove all data         | `npm run local:clean`   |
| `local:reset`   | Clean and restart                | `npm run local:reset`   |

### Logging and Monitoring

| Script                  | Description             | Usage                           |
| ----------------------- | ----------------------- | ------------------------------- |
| `local:logs`            | View all service logs   | `npm run local:logs`            |
| `local:logs:backend`    | View backend logs only  | `npm run local:logs:backend`    |
| `local:logs:frontend`   | View frontend logs only | `npm run local:logs:frontend`   |
| `local:logs:localstack` | View LocalStack logs    | `npm run local:logs:localstack` |
| `local:logs:viewer`     | Enhanced log viewer     | `npm run local:logs:viewer`     |

### Development Utilities

| Script           | Description                 | Usage                    |
| ---------------- | --------------------------- | ------------------------ |
| `local:utils`    | Development utilities menu  | `npm run local:utils`    |
| `local:test-api` | Test API endpoints          | `npm run local:test-api` |
| `local:reset`    | Reset LocalStack data       | `npm run local:reset`    |
| `local:cleanup`  | Clean Docker resources      | `npm run local:cleanup`  |
| `local:report`   | Generate environment report | `npm run local:report`   |

### Data Management

| Script          | Description                  | Usage                   |
| --------------- | ---------------------------- | ----------------------- |
| `seed`          | Seed test data to LocalStack | `npm run seed`          |
| `seed:clean`    | Clean existing seeded data   | `npm run seed:clean`    |
| `seed:validate` | Validate test data files     | `npm run seed:validate` |

### Test Data Setup (First Time)

| Script          | Description                             | Usage                                 |
| --------------- | --------------------------------------- | ------------------------------------- |
| `setup`         | Complete test data setup with S3 images | `cd scripts && npm run setup`         |
| `upload-images` | Upload images to LocalStack S3          | `cd scripts && npm run upload-images` |
| `update-data`   | Update test data with S3 URLs           | `cd scripts && npm run update-data`   |

## Individual Script Usage

### Start Script (`start-local.sh` / `start-local.bat`)

Starts the complete local development environment with:

- Docker container orchestration
- Service health checks
- Automatic test data seeding
- Status reporting

```bash
# Linux/macOS
./scripts/start-local.sh

# Windows
scripts\start-local.bat

# Via npm
npm run local:start
```

### Stop Script (`stop-local.sh` / `stop-local.bat`)

Cleanly stops all services with options:

```bash
# Graceful stop
npm run local:stop

# Stop and remove volumes (deletes data)
./scripts/stop-local.sh --volumes

# Force stop containers
./scripts/stop-local.sh --force

# Windows equivalent
scripts\stop-local.bat --volumes
```

### Health Check (`health-check.js`)

Comprehensive health monitoring:

```bash
# Basic health check
node scripts/health-check.js

# Quiet mode (minimal output)
node scripts/health-check.js --quiet

# JSON output
node scripts/health-check.js --json
```

### Log Viewer (`log-viewer.js`)

Enhanced log viewing with filtering:

```bash
# View all logs
node scripts/log-viewer.js

# Follow logs (like tail -f)
node scripts/log-viewer.js --follow

# View specific services
node scripts/log-viewer.js backend frontend

# Filter by log level
node scripts/log-viewer.js --level ERROR

# Search logs
node scripts/log-viewer.js --grep "search"

# Show last 100 lines and follow
node scripts/log-viewer.js --tail 100 --follow
```

### Development Utilities (`dev-utils.js`)

Various development helpers:

```bash
# Check environment status
node scripts/dev-utils.js status

# Test API endpoints
node scripts/dev-utils.js test

# Show resource usage
node scripts/dev-utils.js resources

# Show all URLs
node scripts/dev-utils.js urls

# Reset LocalStack data
node scripts/dev-utils.js reset

# Clean Docker resources
node scripts/dev-utils.js cleanup

# Generate development report
node scripts/dev-utils.js report
```

## Environment URLs

When the local environment is running, these services are available:

| Service           | URL                                        | Description                       |
| ----------------- | ------------------------------------------ | --------------------------------- |
| Frontend          | http://localhost:3000                      | Next.js application               |
| API Documentation | http://localhost:8080                      | Swagger UI                        |
| Backend API       | http://localhost:9000                      | Lambda Runtime Interface Emulator |
| LocalStack        | http://localhost:4566                      | AWS services simulation           |
| LocalStack UI     | http://localhost:4566/\_localstack/cockpit | Management interface              |

## Troubleshooting

### Common Issues

1. **Docker not running**

   ```bash
   # Check Docker status
   docker info

   # Start Docker Desktop and retry
   npm run local:start
   ```

2. **Port conflicts**

   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3000

   # Stop conflicting services or modify docker-compose.local.yml
   ```

3. **Services not responding**

   ```bash
   # Check service health
   npm run local:health

   # View logs for errors
   npm run local:logs

   # Restart specific service
   docker-compose -f dev-tools/docker/docker-compose.local.yml restart backend
   ```

4. **LocalStack issues**

   ```bash
   # Reset LocalStack data
   npm run local:reset

   # Check LocalStack logs
   npm run local:logs:localstack
   ```

5. **Test data issues**

   ```bash
   # Re-setup test data
   cd scripts
   npm run setup
   cd ..

   # Re-seed database
   npm run seed
   ```

6. **Out of disk space**

   ```bash
   # Clean up Docker resources
   npm run local:cleanup

   # Check disk usage
   docker system df
   ```

### Performance Issues

1. **Slow startup**

   - Ensure Docker has sufficient resources allocated
   - Close unnecessary applications
   - Use SSD storage for Docker data

2. **High memory usage**

   ```bash
   # Check resource usage
   node scripts/dev-utils.js resources

   # Adjust Docker memory limits in docker-compose.local.yml
   ```

3. **API response times**

   ```bash
   # Test API performance
   npm run local:test-api

   # Check backend logs for errors
   npm run local:logs:backend
   ```

## Development Workflow

### First Time Setup

1. **Initial setup (one time only)**

   ```bash
   # Set up test data with S3 images
   cd scripts
   npm install
   npm run setup
   cd ..

   # Start environment
   npm run local:start
   npm run local:health
   ```

### Daily Development

1. **Start your day**

   ```bash
   npm run local:start
   npm run local:health
   ```

2. **During development**

   ```bash
   # Monitor logs
   npm run local:logs:viewer --follow

   # Test changes
   npm run local:test-api
   ```

3. **End of day**
   ```bash
   npm run local:stop
   ```

### Weekly Maintenance

```bash
# Clean up resources
npm run local:cleanup

# Generate environment report
npm run local:report

# Update Docker images
docker-compose -f docker-compose.local.yml pull
```

### Debugging Sessions

```bash
# Start with clean environment
npm run local:reset

# Re-seed test data if needed
npm run seed

# Enable detailed logging
npm run local:logs:viewer --level DEBUG --follow

# Test specific functionality
npm run local:test-api
```

### Resetting Test Data

If you need to reset or update test data:

```bash
# Clean existing data
npm run seed:clean

# Re-upload images and update data (if images changed)
cd scripts
npm run setup
cd ..

# Re-seed the database
npm run seed
```

## Complete Setup from Scratch

To set up a completely new environment from scratch:

### Prerequisites

- Node.js 18+
- Docker Desktop (running)
- Git

### Step-by-Step Setup

1. **Clone and navigate to project**

   ```bash
   git clone <repository-url>
   cd Tattoo_MVP
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Set up test data with images**

   ```bash
   cd scripts
   npm install
   npm run setup
   cd ..
   ```

4. **Start the local environment**

   ```bash
   npm run local:start
   ```

5. **Verify everything is working**

   ```bash
   npm run local:health
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8080
   - LocalStack UI: http://localhost:4566/\_localstack/cockpit

### What Gets Set Up

- **LocalStack S3**: 127 test images across 17 tattoo styles
- **DynamoDB**: Artist, studio, and style data
- **OpenSearch**: Searchable artist index
- **Frontend**: Next.js application with realistic data
- **Backend**: Lambda functions with API Gateway

## Script Dependencies

All scripts require:

- Node.js 18+
- Docker Desktop
- docker-compose

Additional dependencies are installed automatically via npm.

## Contributing

When adding new development scripts:

1. Follow the existing naming convention
2. Add appropriate error handling
3. Include help text and examples
4. Update this README
5. Add npm script aliases in package.json
6. Test on both Windows and Unix systems
