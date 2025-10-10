# Docker Environment Quick Reference

## Overview

The tattoo directory uses a multi-container Docker architecture with LocalStack for AWS service emulation, supporting different deployment phases and platform-specific configurations.

## Architecture Flow

```
Platform Launcher → Docker Compose → Base Images → Service Containers → Environment Variables
       ↓                  ↓              ↓              ↓                    ↓
   Phase Profiles    Service Definitions  Image Layers   Running Services   Config Injection
```

## Docker Compose Structure

### Main Compose Files

```
devtools/docker/
├── docker-compose.local.yml          # Core development services
├── docker-compose.windows.yml        # Windows-specific overrides
├── docker-compose.monitoring.yml     # Monitoring stack (Grafana, Prometheus)
├── docker-compose.seeder.yml         # Data seeding services
└── docker-compose.override.yml       # Local developer overrides (gitignored)
```

### Service Hierarchy

```yaml
# Core Services (Phase 1)
services:
  localstack:           # AWS service emulation
  backend:              # Lambda RIE container
  frontend:             # Next.js development server
  opensearch:           # Search engine
  
# Extended Services (Phase 2)  
  grafana:              # Monitoring dashboard
  prometheus:           # Metrics collection
  data-seeder:          # Database initialization
  image-processor:      # Image optimization pipeline
```

## Base Images & Inheritance

### Image Hierarchy

```dockerfile
# Base Images
localstack/localstack:latest
  └── Custom LocalStack configuration
      └── AWS service emulation (DynamoDB, OpenSearch, S3, etc.)

node:18-alpine
  └── backend/Dockerfile
      └── Lambda Runtime Interface Emulator
          └── API handlers and business logic

node:18-alpine  
  └── frontend/Dockerfile (production)
      └── Next.js static build
          └── Nginx serving layer

opensearchproject/opensearch:2.11.0
  └── Custom OpenSearch configuration
      └── Index templates and mappings
```

### Dockerfile Locations

```
backend/docker/
├── Dockerfile                  # Production Lambda container
├── Dockerfile.dev              # Development with Lambda RIE
└── lambda-rie-entrypoint.sh    # Lambda RIE startup script

frontend/docker/
├── Dockerfile                  # Production static build
└── Dockerfile.dev              # Development with hot reload

devtools/docker/
├── opensearch/
│   └── Dockerfile              # Custom OpenSearch image
├── monitoring/
│   └── grafana/Dockerfile      # Custom Grafana with dashboards
└── seeder/
    └── Dockerfile              # Data seeding container
```

## Environment Variables Flow

### Variable Sources & Precedence

```
1. docker-compose.yml (defaults)
2. .env files (project-level)
3. docker-compose.override.yml (developer-specific)
4. Platform launcher environment injection
5. Container runtime environment
```

### Environment File Structure

```
# Project Root
.env                             # Shared defaults (committed)
.env.local                       # Local overrides (gitignored)

# Service-Specific
backend/.env.development         # Backend development config
frontend/.env.local              # Frontend development config
devtools/.env.monitoring         # Monitoring stack config

# Docker-Specific
devtools/docker/.env.localstack  # LocalStack configuration
devtools/docker/.env.opensearch  # OpenSearch configuration
```

### Variable Reference Patterns

```yaml
# docker-compose.local.yml
services:
  localstack:
    environment:
      # Direct assignment
      DEBUG: 1
      
      # From .env file
      LOCALSTACK_API_KEY: ${LOCALSTACK_API_KEY:-}
      
      # From platform launcher
      PHASE: ${DEPLOYMENT_PHASE:-development}
      
      # Computed values
      SERVICES: ${LOCALSTACK_SERVICES:-dynamodb,opensearch,s3,apigateway,lambda}

  backend:
    environment:
      # Container-to-container communication
      AWS_ENDPOINT_URL: http://localstack:4566
      OPENSEARCH_ENDPOINT: http://tattoo-directory-opensearch:9200
      
      # Host-to-container (development)
      API_PROXY_URL: ${API_PROXY_URL:-http://host.docker.internal:9001}
      
      # Phase-specific configuration
      NODE_ENV: ${NODE_ENV:-development}
      LOG_LEVEL: ${LOG_LEVEL:-debug}
```

## Platform Launcher Integration

### Launcher Architecture

```javascript
// scripts/deployment/platform-launcher.js
class PlatformLauncher {
  constructor(phase) {
    this.phase = phase;                    // development, staging, production
    this.profile = this.getProfile(phase); // service profile configuration
    this.compose = this.getComposeFiles(); // docker-compose file selection
  }
}
```

### Phase Profiles

```javascript
// Phase Configuration
const PHASE_PROFILES = {
  development: {
    services: ['localstack', 'backend', 'frontend'],
    compose: ['docker-compose.local.yml'],
    env: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      LOCALSTACK_SERVICES: 'dynamodb,opensearch,s3'
    }
  },
  
  testing: {
    services: ['localstack', 'backend', 'data-seeder'],
    compose: ['docker-compose.local.yml', 'docker-compose.seeder.yml'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      SEED_DATA: 'test-dataset'
    }
  },
  
  monitoring: {
    services: ['localstack', 'backend', 'frontend', 'grafana', 'prometheus'],
    compose: ['docker-compose.local.yml', 'docker-compose.monitoring.yml'],
    env: {
      ENABLE_METRICS: 'true',
      GRAFANA_ADMIN_PASSWORD: 'admin'
    }
  }
};
```

### Launcher Commands

```bash
# Start development environment
node scripts/deployment/platform-launcher.js --phase=development --action=start

# Start with monitoring
node scripts/deployment/platform-launcher.js --phase=monitoring --action=start

# Start testing environment with data seeding
node scripts/deployment/platform-launcher.js --phase=testing --action=start --seed=true

# Stop all services
node scripts/deployment/platform-launcher.js --action=stop
```

## Service Configuration Details

### LocalStack Configuration

```yaml
# docker-compose.local.yml
localstack:
  image: localstack/localstack:latest
  container_name: tattoo-directory-localstack
  ports:
    - "4566:4566"     # LocalStack gateway
    - "4571:4571"     # OpenSearch direct access
  environment:
    # Core services
    SERVICES: ${LOCALSTACK_SERVICES:-dynamodb,opensearch,s3,apigateway,lambda,iam,secretsmanager,logs,sns}
    
    # Configuration
    DEBUG: ${LOCALSTACK_DEBUG:-1}
    PERSISTENCE: ${LOCALSTACK_PERSISTENCE:-1}
    LAMBDA_EXECUTOR: ${LAMBDA_EXECUTOR:-docker-reuse}
    
    # OpenSearch configuration
    OPENSEARCH_CUSTOM_BACKEND: ${OPENSEARCH_CUSTOM_BACKEND:-http://tattoo-directory-opensearch:9200}
    
    # Data persistence
    DATA_DIR: /tmp/localstack/data
    
  volumes:
    - "localstack-data:/tmp/localstack"
    - "/var/run/docker.sock:/var/run/docker.sock"
    - "./localstack-init:/etc/localstack/init/ready.d"
  networks:
    - tattoo-network
```

### Backend Service Configuration

```yaml
# docker-compose.local.yml
backend:
  build:
    context: ../../backend
    dockerfile: docker/Dockerfile.dev
  container_name: tattoo-directory-backend
  ports:
    - "9000:8080"     # Lambda RIE port
  environment:
    # AWS configuration (container-to-container)
    AWS_ENDPOINT_URL: http://localstack:4566
    AWS_ACCESS_KEY_ID: test
    AWS_SECRET_ACCESS_KEY: test
    AWS_DEFAULT_REGION: eu-west-2
    
    # Service endpoints
    DYNAMODB_ENDPOINT: http://localstack:4566
    OPENSEARCH_ENDPOINT: http://tattoo-directory-opensearch:9200
    
    # Application configuration
    DYNAMODB_TABLE_NAME: ${DYNAMODB_TABLE_NAME:-tattoo-directory-local}
    OPENSEARCH_INDEX: ${OPENSEARCH_INDEX:-artists}
    NODE_ENV: ${NODE_ENV:-development}
    LOG_LEVEL: ${LOG_LEVEL:-debug}
    
    # Lambda RIE configuration
    _LAMBDA_SERVER_PORT: 8080
    AWS_LAMBDA_RUNTIME_API: localhost:8080
    
  volumes:
    - "../../backend/src:/var/task/src:ro"
  networks:
    - tattoo-network
  depends_on:
    - localstack
    - opensearch
```

### Frontend Service Configuration

```yaml
# docker-compose.local.yml (development)
frontend:
  build:
    context: ../../frontend
    dockerfile: docker/Dockerfile.dev
  container_name: tattoo-directory-frontend
  ports:
    - "3000:3000"
  environment:
    # API configuration (host-to-container via proxy)
    NEXT_PUBLIC_API_URL: http://localhost:9001
    
    # Development configuration
    NODE_ENV: development
    NEXT_TELEMETRY_DISABLED: 1
    
    # Hot reload configuration
    WATCHPACK_POLLING: true
    
  volumes:
    - "../../frontend/src:/app/src"
    - "../../frontend/public:/app/public"
  networks:
    - tattoo-network
```

## Network Architecture

### Docker Networks

```yaml
# Network configuration
networks:
  tattoo-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Communication

```
# Container-to-Container (Internal Network)
backend → localstack:4566          # AWS services
backend → tattoo-directory-opensearch:9200  # Direct OpenSearch
frontend → backend:8080            # Internal API calls (if needed)

# Host-to-Container (Development)
localhost:3000 → frontend          # Next.js dev server
localhost:9001 → api-proxy         # CORS proxy (host process)
localhost:9000 → backend           # Lambda RIE
localhost:4566 → localstack        # LocalStack gateway
localhost:4571 → opensearch        # OpenSearch direct access
```

## Volume Management

### Volume Types & Usage

```yaml
volumes:
  # Named volumes (persistent data)
  localstack-data:
    driver: local
  opensearch-data:
    driver: local
  grafana-data:
    driver: local
    
  # Bind mounts (development)
  - "../../backend/src:/var/task/src:ro"      # Backend source code
  - "../../frontend/src:/app/src"             # Frontend source code
  - "./localstack-init:/etc/localstack/init/ready.d"  # Init scripts
  
  # Docker socket (LocalStack)
  - "/var/run/docker.sock:/var/run/docker.sock"
```

### Data Persistence Strategy

```
Development:
├── localstack-data/          # AWS service data (DynamoDB, S3)
├── opensearch-data/          # Search indices and data
├── grafana-data/            # Dashboards and configuration
└── logs/                    # Application and service logs

Production:
├── AWS RDS/DynamoDB         # Managed database services
├── AWS OpenSearch           # Managed search service
├── AWS CloudWatch           # Managed logging and monitoring
└── AWS S3                   # Static assets and backups
```

## Environment Variable Reference

### Core Variables

```bash
# Phase Configuration
DEPLOYMENT_PHASE=development|testing|monitoring|production
NODE_ENV=development|test|production
LOG_LEVEL=debug|info|warn|error

# Service Configuration
LOCALSTACK_SERVICES=dynamodb,opensearch,s3,apigateway,lambda
LOCALSTACK_DEBUG=0|1
LOCALSTACK_PERSISTENCE=0|1

# Database Configuration
DYNAMODB_TABLE_NAME=tattoo-directory-local
DYNAMODB_ENDPOINT=http://localstack:4566
OPENSEARCH_ENDPOINT=http://tattoo-directory-opensearch:9200
OPENSEARCH_INDEX=artists

# API Configuration
API_PROXY_URL=http://localhost:9001
NEXT_PUBLIC_API_URL=http://localhost:9001
LAMBDA_RIE_PORT=9000

# AWS Configuration (Development)
AWS_ENDPOINT_URL=http://localstack:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=eu-west-2
```

### Platform-Specific Variables

```bash
# Windows-Specific
COMPOSE_CONVERT_WINDOWS_PATHS=1
DOCKER_BUILDKIT=1

# Linux/macOS-Specific  
DOCKER_HOST=unix:///var/run/docker.sock

# Container Runtime
_LAMBDA_SERVER_PORT=8080
AWS_LAMBDA_RUNTIME_API=localhost:8080
WATCHPACK_POLLING=true
```

## Common Commands

### Platform Launcher Commands

```bash
# Start development environment
npm run local:start                    # Basic development stack
npm run local:start-monitoring         # With monitoring stack
npm run local:start-seeder             # With data seeding

# Using platform launcher directly
node scripts/deployment/platform-launcher.js --phase=development --action=start
node scripts/deployment/platform-launcher.js --phase=monitoring --action=start --services=all
node scripts/deployment/platform-launcher.js --action=stop
```

### Docker Compose Commands

```bash
# Start services
docker-compose -f devtools/docker/docker-compose.local.yml up -d
docker-compose -f devtools/docker/docker-compose.local.yml -f devtools/docker/docker-compose.monitoring.yml up -d

# View logs
docker-compose -f devtools/docker/docker-compose.local.yml logs -f localstack
docker-compose -f devtools/docker/docker-compose.local.yml logs -f backend

# Stop services
docker-compose -f devtools/docker/docker-compose.local.yml down
docker-compose -f devtools/docker/docker-compose.local.yml down -v  # Remove volumes

# Rebuild services
docker-compose -f devtools/docker/docker-compose.local.yml build --no-cache backend
docker-compose -f devtools/docker/docker-compose.local.yml up -d --force-recreate backend
```

### Service Health Checks

```bash
# Check service health
curl http://localhost:4566/_localstack/health     # LocalStack
curl http://localhost:4571/_cluster/health        # OpenSearch
curl http://localhost:9000/health                 # Backend Lambda RIE
curl http://localhost:3000                        # Frontend

# Check container status
docker-compose -f devtools/docker/docker-compose.local.yml ps
docker-compose -f devtools/docker/docker-compose.local.yml top
```

## Troubleshooting

### Common Issues

```bash
# Port conflicts
netstat -an | findstr :4566          # Windows
lsof -i :4566                        # macOS/Linux

# Container networking
docker network ls
docker network inspect tattoo-network

# Volume permissions
docker volume ls
docker volume inspect localstack-data

# Service dependencies
docker-compose -f devtools/docker/docker-compose.local.yml config
docker-compose -f devtools/docker/docker-compose.local.yml ps --services
```

### Debug Commands

```bash
# Container inspection
docker exec -it tattoo-directory-localstack bash
docker exec -it tattoo-directory-backend sh
docker exec -it tattoo-directory-opensearch bash

# Log analysis
docker-compose -f devtools/docker/docker-compose.local.yml logs --tail=100 localstack
docker-compose -f devtools/docker/docker-compose.local.yml logs --since=1h backend

# Resource usage
docker stats
docker system df
docker system prune -f
```

This Docker environment provides a complete development platform with AWS service emulation, supporting multiple deployment phases and maintaining production parity through consistent containerization patterns.