# Local Development Guide

## Overview

This comprehensive guide covers best practices for local development of the Tattoo Artist Directory application using Docker containers and LocalStack to simulate AWS services.

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Development Workflows](#development-workflows)
5. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
6. [Performance Optimization](#performance-optimization)
7. [Cross-Platform Considerations](#cross-platform-considerations)
8. [Best Practices](#best-practices)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Advanced Features](#advanced-features)

## Quick Start

### Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Node.js 18+ and npm
- Git
- 8GB+ RAM recommended
- 20GB+ free disk space

### Start Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd tattoo-artist-directory

# Start the complete local environment
npm run local:start

# Or use the script directly
./scripts/start-local.sh
```

### Access Points
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8080
- **Backend API**: http://localhost:9000
- **LocalStack Dashboard**: http://localhost:4566

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 8GB (4GB available for Docker)
- **CPU**: 2+ cores
- **Storage**: 20GB free space
- **Network**: Stable internet connection for initial setup

### Recommended Requirements
- **RAM**: 16GB (8GB available for Docker)
- **CPU**: 4+ cores
- **Storage**: SSD with 50GB+ free space
- **Network**: High-speed internet connection

### Software Dependencies
- **Docker Desktop**: Latest stable version
- **Node.js**: Version 18.x or 20.x
- **npm**: Version 8.x or higher
- **Git**: Latest version

## Installation Guide

### Windows Installation

1. **Install Docker Desktop**
   ```powershell
   # Download from https://docker.com/products/docker-desktop
   # Enable WSL 2 integration during installation
   ```

2. **Install Node.js**
   ```powershell
   # Download from https://nodejs.org
   # Or use Chocolatey
   choco install nodejs
   ```

3. **Configure WSL 2 (Recommended)**
   ```powershell
   # Enable WSL 2
   wsl --install
   
   # Set WSL 2 as default
   wsl --set-default-version 2
   ```

4. **Clone and Setup**
   ```powershell
   git clone <repository-url>
   cd tattoo-artist-directory
   npm install
   ```

### macOS Installation

1. **Install Docker Desktop**
   ```bash
   # Download from https://docker.com/products/docker-desktop
   # Or use Homebrew
   brew install --cask docker
   ```

2. **Install Node.js**
   ```bash
   # Using Homebrew
   brew install node
   
   # Or download from https://nodejs.org
   ```

3. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd tattoo-artist-directory
   npm install
   ```

### Linux Installation

1. **Install Docker Engine**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Install Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Install Node.js**
   ```bash
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd tattoo-artist-directory
   npm install
   ```

## Development Workflows

### Starting Development

1. **Environment Startup**
   ```bash
   # Start all services
   npm run local:start
   
   # Check service health
   npm run local:health
   
   # View logs
   npm run local:logs
   ```

2. **Verify Setup**
   ```bash
   # Run integration tests
   npm run test:integration
   
   # Run final integration test
   node scripts/final-integration-tester.js
   ```

### Daily Development Workflow

1. **Morning Setup**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Start environment
   npm run local:start
   
   # Seed fresh test data
   npm run seed:fresh
   ```

2. **Development Cycle**
   ```bash
   # Make code changes
   # Frontend changes auto-reload at http://localhost:3000
   # Backend changes require container restart
   
   # Test changes
   npm run test:unit
   npm run test:integration
   
   # Validate API changes
   # Visit http://localhost:8080 for Swagger UI
   ```

3. **End of Day**
   ```bash
   # Commit changes
   git add .
   git commit -m "Your commit message"
   git push origin feature-branch
   
   # Stop environment
   npm run local:stop
   ```

### Feature Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop with Test Data**
   ```bash
   # Start with clean environment
   npm run local:restart
   
   # Seed specific test scenario
   npm run seed:scenario -- feature-testing
   
   # Develop and test iteratively
   ```

3. **Test Feature Thoroughly**
   ```bash
   # Run comprehensive tests
   npm run test:all
   
   # Run production parity validation
   node scripts/comprehensive-parity-validator.js validate
   
   # Test cross-platform compatibility
   node scripts/final-integration-tester.js
   ```

4. **Prepare for Review**
   ```bash
   # Generate documentation
   npm run docs:generate
   
   # Run final validation
   npm run validate:final
   ```

## Debugging and Troubleshooting

### Debug Configuration

#### VS Code Debug Setup
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend (Docker)",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/backend/src",
      "remoteRoot": "/var/task/src",
      "protocol": "inspector",
      "restart": true
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/frontend",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

#### Enable Backend Debugging
```bash
# Start backend with debug mode
docker-compose -f docker-compose.local.yml up backend-debug

# Or modify docker-compose.local.yml to add debug port
```

### Common Debugging Scenarios

#### API Issues
```bash
# Check API logs
docker-compose -f docker-compose.local.yml logs backend

# Test API directly
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod":"GET","path":"/v1/artists","queryStringParameters":{"limit":"10"}}'

# Use Swagger UI for interactive testing
# Visit http://localhost:8080
```

#### Database Issues
```bash
# Check DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Query data directly
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name tattoo-directory-local

# Check LocalStack logs
docker-compose -f docker-compose.local.yml logs localstack
```

#### Frontend Issues
```bash
# Check frontend logs
docker-compose -f docker-compose.local.yml logs frontend

# Access frontend container
docker-compose -f docker-compose.local.yml exec frontend sh

# Check network connectivity
curl http://localhost:9000/2015-03-31/functions/function/invocations
```

### Log Analysis

#### Centralized Logging
```bash
# View all logs
npm run local:logs

# Filter specific service
npm run local:logs -- backend

# Follow logs in real-time
npm run local:logs -- --follow

# Search logs
npm run local:logs | grep "ERROR"
```

#### Log Levels
- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Potential issues that should be monitored
- **INFO**: General operational information
- **DEBUG**: Detailed debugging information (development only)

## Performance Optimization

### Docker Performance

#### Memory Allocation
```bash
# Check Docker memory usage
docker stats

# Increase Docker Desktop memory allocation
# Docker Desktop → Settings → Resources → Memory: 8GB+
```

#### Volume Optimization
```yaml
# Use bind mounts for development
volumes:
  - ./backend/src:/var/task/src:ro  # Read-only for better performance
  - node_modules:/var/task/node_modules  # Named volume for node_modules
```

#### Build Optimization
```dockerfile
# Multi-stage builds for smaller images
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
```

### Application Performance

#### Backend Optimization
```javascript
// Use connection pooling
const AWS = require('aws-sdk');
AWS.config.update({
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100;
    }
  }
});

// Implement caching
const cache = new Map();
const getCachedData = (key) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // Fetch and cache data
};
```

#### Frontend Optimization
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Implement lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use React Query for data fetching
const { data, isLoading } = useQuery('artists', fetchArtists, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Database Performance

#### DynamoDB Optimization
```javascript
// Use batch operations
const batchWrite = {
  RequestItems: {
    'tattoo-directory-local': [
      {
        PutRequest: {
          Item: { PK: 'ARTIST#1', SK: 'PROFILE', /* ... */ }
        }
      }
      // ... more items
    ]
  }
};

// Optimize queries with proper key design
const queryParams = {
  TableName: 'tattoo-directory-local',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': 'ARTIST#123',
    ':sk': 'PORTFOLIO#'
  },
  Limit: 20
};
```

#### OpenSearch Optimization
```javascript
// Use appropriate index settings
const indexSettings = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0, // No replicas needed for local development
    refresh_interval: '5s'
  },
  mappings: {
    properties: {
      artistName: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' }
        }
      }
    }
  }
};

// Optimize search queries
const searchQuery = {
  query: {
    bool: {
      must: [
        { match: { artistName: searchTerm } }
      ],
      filter: [
        { terms: { styles: selectedStyles } },
        { geo_distance: { distance: '50km', location: userLocation } }
      ]
    }
  },
  size: 20,
  from: offset
};
```

## Cross-Platform Considerations

### Path Handling
```javascript
// Always use path.join() for cross-platform compatibility
const filePath = path.join(__dirname, 'data', 'artists.json');

// Avoid hardcoded path separators
// ❌ const filePath = __dirname + '/data/artists.json';
// ✅ const filePath = path.join(__dirname, 'data', 'artists.json');
```

### Environment Variables
```bash
# Use cross-platform environment variable syntax
# In package.json scripts:
"scripts": {
  "start": "cross-env NODE_ENV=development node server.js"
}

# Install cross-env for Windows compatibility
npm install --save-dev cross-env
```

### File Permissions
```bash
# Linux/macOS: Make scripts executable
chmod +x scripts/*.sh

# Windows: Use .bat files or PowerShell
# Create both .sh and .bat versions for cross-platform support
```

### Docker Considerations
```yaml
# Use platform-specific configurations when needed
services:
  backend:
    platform: linux/amd64  # Specify platform for M1 Macs
    volumes:
      # Use consistent volume syntax
      - type: bind
        source: ./backend/src
        target: /var/task/src
        read_only: true
```

## Best Practices

### Code Organization

#### Project Structure
```
tattoo-artist-directory/
├── backend/                 # Backend Lambda functions
│   ├── src/
│   │   ├── handlers/       # Lambda handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── Dockerfile.local    # Local development Dockerfile
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── Dockerfile.local   # Local development Dockerfile
├── scripts/               # Development scripts
├── docs/                  # Documentation
└── docker-compose.local.yml
```

#### Naming Conventions
- **Files**: kebab-case (`artist-profile.tsx`)
- **Components**: PascalCase (`ArtistCard.tsx`)
- **Functions**: camelCase (`getArtistById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Database Keys**: Composite format (`ARTIST#{artistId}`)

### Development Practices

#### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/artist-search
# Make changes
git add .
git commit -m "feat: implement artist search functionality"
git push origin feature/artist-search
# Create pull request
```

#### Testing Strategy
```bash
# Test pyramid approach
npm run test:unit        # Fast, isolated unit tests
npm run test:integration # API and database integration tests
npm run test:e2e         # End-to-end user journey tests

# Run tests before committing
npm run test:all
```

#### Code Quality
```bash
# Use linting and formatting
npm run lint
npm run format

# Type checking (TypeScript)
npm run type-check

# Security scanning
npm audit
npm run security:scan
```

### Environment Management

#### Environment Variables
```bash
# Use .env files for local development
# .env.local (not committed)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=eu-west-2
DYNAMODB_TABLE_NAME=tattoo-directory-local
OPENSEARCH_ENDPOINT=http://localhost:4566

# .env.example (committed as template)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=eu-west-2
DYNAMODB_TABLE_NAME=your-table-name
```

#### Configuration Management
```javascript
// config/index.js
const config = {
  development: {
    aws: {
      endpoint: process.env.AWS_ENDPOINT_URL,
      region: process.env.AWS_DEFAULT_REGION || 'eu-west-2'
    },
    database: {
      tableName: process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local'
    }
  },
  production: {
    aws: {
      region: 'eu-west-2'
    },
    database: {
      tableName: 'tattoo-directory-prod'
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

### Security Practices

#### Local Development Security
```javascript
// Never commit real AWS credentials
// Use LocalStack test credentials only
const awsConfig = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'eu-west-2',
  endpoint: 'http://localhost:4566'
};

// Validate environment
if (process.env.NODE_ENV === 'production' && awsConfig.endpoint) {
  throw new Error('LocalStack endpoint detected in production');
}
```

#### Input Validation
```javascript
// Use Zod for runtime validation
import { z } from 'zod';

const ArtistSchema = z.object({
  artistName: z.string().min(1).max(100),
  styles: z.array(z.string()).min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })
});

// Validate input
const validateArtist = (data) => {
  return ArtistSchema.parse(data);
};
```

## Common Issues and Solutions

### Docker Issues

#### Port Conflicts
```bash
# Problem: Port already in use
Error: bind: address already in use

# Solution: Find and kill process using port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use different ports in docker-compose.local.yml
```

#### Memory Issues
```bash
# Problem: Out of memory errors
# Solution: Increase Docker memory allocation
# Docker Desktop → Settings → Resources → Memory: 8GB+

# Check current usage
docker stats

# Clean up unused resources
docker system prune -a
```

#### Volume Mount Issues
```bash
# Problem: File changes not reflected in container
# Solution: Check volume mount syntax
volumes:
  - ./backend/src:/var/task/src:ro  # Correct
  # - ./backend/src:/var/task/src/  # Incorrect (trailing slash)

# Windows: Ensure drive sharing is enabled
# Docker Desktop → Settings → Resources → File Sharing
```

### LocalStack Issues

#### Service Not Starting
```bash
# Problem: LocalStack services not available
# Solution: Check LocalStack logs
docker-compose -f docker-compose.local.yml logs localstack

# Restart LocalStack
docker-compose -f docker-compose.local.yml restart localstack

# Check service health
curl http://localhost:4566/_localstack/health
```

#### DynamoDB Issues
```bash
# Problem: Table not found
# Solution: Recreate table
aws --endpoint-url=http://localhost:4566 dynamodb delete-table \
  --table-name tattoo-directory-local

# Run initialization script
./localstack-init/01-create-dynamodb-table.sh
```

### Application Issues

#### API Not Responding
```bash
# Problem: Backend API not accessible
# Solution: Check backend container status
docker-compose -f docker-compose.local.yml ps backend

# Check backend logs
docker-compose -f docker-compose.local.yml logs backend

# Test API directly
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod":"GET","path":"/health"}'
```

#### Frontend Build Issues
```bash
# Problem: Frontend build failures
# Solution: Clear cache and reinstall
rm -rf frontend/node_modules frontend/.next
cd frontend && npm install

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

### Performance Issues

#### Slow Startup
```bash
# Problem: Environment takes too long to start
# Solution: Optimize Docker images
# Use multi-stage builds
# Cache node_modules in named volumes
# Increase Docker memory allocation

# Check startup time
time npm run local:start
```

#### Slow API Responses
```bash
# Problem: API responses are slow
# Solution: Check database queries
# Optimize DynamoDB key design
# Add appropriate indexes
# Implement caching

# Profile API performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:9000/...
```

## Advanced Features

### Hot Reloading

#### Frontend Hot Reloading
```javascript
// Next.js hot reloading is enabled by default
// Configure in next.config.js
module.exports = {
  experimental: {
    fastRefresh: true
  }
};
```

#### Backend Hot Reloading
```dockerfile
# Use nodemon for backend hot reloading
FROM node:18-alpine
WORKDIR /var/task
COPY package*.json ./
RUN npm install && npm install -g nodemon
COPY . .
CMD ["nodemon", "--watch", "src", "--ext", "js,json", "src/index.js"]
```

### Debugging Tools

#### Database GUI
```bash
# Use DynamoDB Admin for GUI access
npm install -g dynamodb-admin
dynamodb-admin --port 8001 --host localhost
# Access at http://localhost:8001
```

#### API Testing
```bash
# Use HTTPie for API testing
pip install httpie

# Test API endpoints
http POST localhost:9000/2015-03-31/functions/function/invocations \
  httpMethod=GET \
  path=/v1/artists \
  queryStringParameters:='{"limit":"10"}'
```

### Monitoring and Metrics

#### Application Monitoring
```javascript
// Add performance monitoring
const performanceMonitor = {
  startTimer: (operation) => {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      console.log(`${operation} took ${duration}ms`);
      return duration;
    };
  }
};

// Usage
const timer = performanceMonitor.startTimer('database-query');
const result = await dynamodb.query(params).promise();
timer();
```

#### Resource Monitoring
```bash
# Monitor Docker resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Monitor system resources
# macOS
top -o cpu

# Linux
htop

# Windows
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
```

### Automation Scripts

#### Development Automation
```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🚀 Setting up development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start environment
echo "🔧 Starting local environment..."
npm run local:start

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🔍 Running health checks..."
npm run local:health

# Seed test data
echo "🌱 Seeding test data..."
npm run seed:fresh

echo "✅ Development environment ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8080"
```

#### Testing Automation
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🧪 Running comprehensive test suite..."

# Unit tests
echo "Running unit tests..."
npm run test:unit

# Integration tests
echo "Running integration tests..."
npm run test:integration

# E2E tests
echo "Running E2E tests..."
npm run test:e2e

# Production parity validation
echo "Running production parity validation..."
node scripts/comprehensive-parity-validator.js validate

# Final integration test
echo "Running final integration test..."
node scripts/final-integration-tester.js

echo "✅ All tests completed!"
```

This guide provides comprehensive coverage of local development practices, troubleshooting, and optimization techniques for the Tattoo Artist Directory application. Regular updates to this documentation ensure it remains current with the evolving development environment and best practices.