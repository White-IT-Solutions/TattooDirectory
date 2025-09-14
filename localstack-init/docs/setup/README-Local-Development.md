# Local Development Environment Setup

## Overview

This guide provides complete setup instructions for running the Tattoo Artist Directory MVP in a local Docker environment that simulates AWS services using LocalStack. The local environment includes all necessary services for full-stack development and testing.

## Quick Start

For experienced developers who want to get started immediately:

```bash
# Clone and navigate to project
git clone <repository-url>
cd tattoo-artist-directory

# Start the local environment
npm run local:start

# Access the application
# Frontend: http://localhost:3000
# API Documentation: http://localhost:8080
# Backend API: http://localhost:9000
# LocalStack Dashboard: http://localhost:4566
```

## Prerequisites

### Required Software

- **Docker Desktop** (v4.0+)
  - Windows: Download from [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
  - macOS: Download from [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
  - Linux: Install Docker Engine and Docker Compose separately

- **Node.js** (v18+)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **Git**
  - Windows: Download from [git-scm.com](https://git-scm.com/)
  - macOS: Install via Xcode Command Line Tools or Homebrew
  - Linux: Install via package manager (`apt install git`, `yum install git`, etc.)

### System Requirements

- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 10GB free space for Docker images and containers
- **CPU**: Multi-core processor recommended for optimal performance

## Detailed Setup Instructions

### 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd tattoo-artist-directory

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment files and configure them:

```bash
# Copy environment templates
cp dev-tools/.env.local.example .env.local
cp frontend/.env.local.example frontend/.env.local
```

Edit `.env.local` with your local configuration:

```bash
# Local Development Configuration
NODE_ENV=development
AWS_REGION=eu-west-2
LOCALSTACK_ENDPOINT=http://localhost:4566

# Database Configuration
DYNAMODB_TABLE_NAME=tattoo-directory-local
OPENSEARCH_ENDPOINT=http://localhost:4566

# API Configuration
API_BASE_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Local Environment

#### Option A: Using NPM Scripts (Recommended)

```bash
# Start all services
npm run local:start

# View logs from all services
npm run local:logs

# Stop all services
npm run local:stop

# Restart the environment
npm run local:restart
```

#### Option B: Using Docker Compose Directly

```bash
# Start services in background
docker-compose -f dev-tools/docker/docker-compose.local.yml up -d

# View logs
docker-compose -f dev-tools/docker/docker-compose.local.yml logs -f

# Stop services
docker-compose -f dev-tools/docker/docker-compose.local.yml down
```

### 4. Verify Installation

After starting the environment, verify all services are running:

```bash
# Run health checks
npm run local:health

# Or manually check each service
curl http://localhost:4566/_localstack/health  # LocalStack
curl http://localhost:3000                     # Frontend
curl http://localhost:8080                     # Swagger UI
curl http://localhost:9000                     # Backend API
```

## Service Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js development server |
| API Documentation | http://localhost:8080 | Swagger UI for API testing |
| Backend API | http://localhost:9000 | Lambda functions via RIE |
| LocalStack Dashboard | http://localhost:4566 | AWS services simulation |
| LocalStack Health | http://localhost:4566/_localstack/health | Service status |

## Development Workflows

### Making Code Changes

#### Frontend Development

1. Navigate to the frontend directory: `cd frontend`
2. Make your changes to files in `src/`
3. Changes are automatically hot-reloaded in the browser
4. View changes at http://localhost:3000

#### Backend Development

1. Navigate to the backend directory: `cd backend`
2. Make changes to files in `src/`
3. Restart the backend container to see changes:
   ```bash
   docker-compose -f dev-tools/docker/docker-compose.local.yml restart backend
   ```
4. Test changes using Swagger UI at http://localhost:8080

### Running Tests

#### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- --grep "artists"
```

#### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (with browser UI)
npm run test:e2e:headed
```

### Debugging

#### Frontend Debugging

1. Open browser developer tools
2. Set breakpoints in your code
3. Use React Developer Tools extension for component inspection

#### Backend Debugging

1. Attach VS Code debugger to the backend container
2. Use the provided launch configuration in `.vscode/launch.json`
3. Set breakpoints in Lambda function code

See [Debugging Guide](docs/DEBUGGING_GUIDE.md) for detailed debugging instructions.

### API Testing

#### Using Swagger UI

1. Open http://localhost:8080 in your browser
2. Explore available endpoints in the API documentation
3. Click "Try it out" on any endpoint to test it
4. View request/response examples and schemas

#### Using curl

```bash
# Get all artists
curl -X GET "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "path": "/v1/artists",
    "queryStringParameters": {"limit": "10"}
  }'

# Get specific artist
curl -X GET "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "path": "/v1/artists/artist-001",
    "pathParameters": {"artistId": "artist-001"}
  }'
```

See [API Testing Guide](docs/API_TESTING_GUIDE.md) for comprehensive API testing instructions.

## Data Management

### Test Data

The environment automatically seeds test data on startup. The data includes:

- **Artists**: Sample tattoo artists with portfolios and contact information
- **Studios**: Tattoo studios with location and artist associations
- **Styles**: Tattoo style categories and descriptions

### Resetting Data

```bash
# Reset all data to initial state
npm run local:reset-data

# Or manually reseed data
docker-compose -f dev-tools/docker/docker-compose.local.yml run --rm data-seeder
```

### Custom Test Data

To add custom test data:

1. Edit files in `scripts/test-data/`
2. Restart the data seeder:
   ```bash
   docker-compose -f dev-tools/docker/docker-compose.local.yml run --rm data-seeder
   ```

## Performance Optimization

### Improving Startup Time

1. **Use Docker layer caching**: Avoid changing package.json frequently
2. **Allocate more resources**: Increase Docker Desktop memory allocation
3. **Use SSD storage**: Store Docker data on SSD for faster I/O

### Monitoring Resource Usage

```bash
# Monitor container resource usage
docker stats

# View detailed container information
docker-compose -f dev-tools/docker/docker-compose.local.yml ps
```

## Common Issues and Solutions

### Docker Issues

**Issue**: Docker containers fail to start
```bash
# Solution: Check Docker Desktop is running and has sufficient resources
docker info
docker system prune  # Clean up unused resources
```

**Issue**: Port conflicts
```bash
# Solution: Check what's using the ports
netstat -tulpn | grep :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Stop conflicting services or change ports in dev-tools/docker/docker-compose.local.yml
```

### LocalStack Issues

**Issue**: LocalStack services not responding
```bash
# Solution: Check LocalStack health and restart if needed
curl http://localhost:4566/_localstack/health
docker-compose -f dev-tools/docker/docker-compose.local.yml restart localstack
```

**Issue**: AWS SDK connection errors
```bash
# Solution: Verify environment variables are set correctly
echo $AWS_ENDPOINT_URL
# Should output: http://localhost:4566
```

### Application Issues

**Issue**: Frontend can't connect to backend
```bash
# Solution: Verify backend is running and accessible
curl http://localhost:9000
# Check frontend environment variables in frontend/.env.local
```

**Issue**: No test data visible
```bash
# Solution: Reseed the database
docker-compose -f dev-tools/docker/docker-compose.local.yml run --rm data-seeder
```

For more troubleshooting information, see:
- [Platform-Specific Setup Guide](docs/PLATFORM_SETUP.md)
- [Cross-Platform Summary](docs/CROSS_PLATFORM_SUMMARY.md)
- [Debugging Guide](docs/DEBUGGING_GUIDE.md)

## Platform-Specific Notes

### Windows

- Use PowerShell or Command Prompt as administrator
- Ensure Windows Subsystem for Linux (WSL2) is enabled for Docker
- File paths use backslashes in Windows-specific scripts

### macOS

- Docker Desktop requires macOS 10.15 or later
- Use Terminal or iTerm2 for command execution
- Ensure sufficient disk space for Docker VM

### Linux

- Install Docker Engine and Docker Compose separately
- Add your user to the docker group: `sudo usermod -aG docker $USER`
- Log out and back in for group changes to take effect

## Next Steps

1. **Explore the API**: Use Swagger UI to understand available endpoints
2. **Run Tests**: Execute integration and E2E tests to verify functionality
3. **Make Changes**: Start developing features using the hot-reload capabilities
4. **Debug Issues**: Use the debugging tools and guides provided

## Additional Resources

- [Development Workflow Guide](scripts/README-Development-Workflow.md)
- [API Testing Guide](docs/API_TESTING_GUIDE.md)
- [Debugging Guide](docs/DEBUGGING_GUIDE.md)
- [Platform Setup Guide](docs/PLATFORM_SETUP.md)

## Support

If you encounter issues not covered in this guide:

1. Check the troubleshooting sections in platform-specific guides
2. Review Docker Desktop logs and container logs
3. Ensure all prerequisites are properly installed
4. Verify environment variables are correctly configured

For additional help, refer to the project documentation in the `docs/` directory.
