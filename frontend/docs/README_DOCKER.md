# Frontend Docker Configuration

This document describes the Docker configuration for the frontend development environment.

## Files

- `Dockerfile.local` - Docker configuration for local development
- `next.config.docker.mjs` - Next.js configuration optimized for Docker
- `.dockerignore` - Files to exclude from Docker build context
- `health-check.js` - Health check script for Docker Compose
- `.env.docker.local` - Environment variables for Docker (not used directly, set via docker-compose)

## Features

### Hot Reloading
The Docker configuration supports hot reloading through:
- Volume mounts for source code
- Polling-based file watching (`WATCHPACK_POLLING=true`)
- Chokidar polling for cross-platform compatibility

### Environment Detection
The frontend automatically detects when running in Docker and:
- Uses the backend service URL (`http://backend:8080/...`)
- Falls back to localhost URLs when running outside Docker
- Configures appropriate API endpoints based on environment

### Performance Optimizations
- Excludes `node_modules` and `.next` from volume mounts
- Uses polling for file watching in Docker
- Optimized webpack configuration for development

## Usage

### With Docker Compose
```bash
# Start all services including frontend
docker-compose -f docker-compose.local.yml up

# Start only frontend (requires backend to be running)
docker-compose -f docker-compose.local.yml up frontend

# View frontend logs
docker-compose -f docker-compose.local.yml logs -f frontend
```

### Standalone Docker
```bash
# Build the image
docker build -f Dockerfile.local -t tattoo-frontend-local .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_ENVIRONMENT=local \
  -e NEXT_PUBLIC_API_URL=http://backend:8080/2015-03-31/functions/function/invocations \
  -v $(pwd)/src:/app/src:ro \
  tattoo-frontend-local
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENVIRONMENT` | Environment identifier | `local` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://backend:8080/...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | From .env.local |
| `WATCHPACK_POLLING` | Enable file watching polling | `true` |
| `CHOKIDAR_USEPOLLING` | Enable Chokidar polling | `true` |

## Troubleshooting

### Hot Reloading Not Working
1. Ensure volume mounts are configured correctly
2. Check that polling is enabled (`WATCHPACK_POLLING=true`)
3. Verify file permissions on mounted volumes

### Cannot Connect to Backend
1. Ensure backend service is running
2. Check network configuration in docker-compose
3. Verify `NEXT_PUBLIC_API_URL` environment variable

### Build Failures
1. Check `.dockerignore` excludes unnecessary files
2. Ensure `package.json` and `package-lock.json` are present
3. Verify Node.js version compatibility

## Development Workflow

1. Make changes to source files in `src/`
2. Changes are automatically detected via polling
3. Next.js rebuilds and hot reloads the application
4. Browser automatically refreshes with changes

The Docker setup maintains the same development experience as running Next.js locally while providing consistent environment across different machines.