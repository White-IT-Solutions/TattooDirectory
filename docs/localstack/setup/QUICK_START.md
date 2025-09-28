# Quick Start Guide

Get the Tattoo Directory MVP running locally in under 5 minutes.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## Setup Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd Tattoo_MVP
npm install
```

### 2. Set Up Test Data

```bash
cd scripts
npm install
npm run setup
cd ..
```

This uploads 127 realistic tattoo images to LocalStack S3 and creates test data for 10 artists across 17 tattoo styles.

### 3. Start the Environment

```bash
npm run local:start
```

Wait for all services to start (usually 30-60 seconds).

### 4. Verify Setup

```bash
npm run local:health
```

You should see all services reporting as healthy.

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8080
- **LocalStack UI**: http://localhost:4566/_localstack/cockpit

## What You Get

- **10 Realistic Artists** with professional avatars and portfolios
- **3 Studios** across London, Manchester, and Birmingham
- **17 Tattoo Styles** with actual tattoo images
- **Full Search Functionality** with location and style filtering
- **Complete API** with Swagger documentation

## Common Commands

```bash
# View logs
npm run local:logs

# Stop environment
npm run local:stop

# Restart everything
npm run local:restart

# Check what's running
npm run local:status

# Clean reset
npm run local:reset
```

## Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker info

# If Docker isn't running, start Docker Desktop and retry
```

### Port Conflicts
```bash
# Check what's using port 3000
netstat -tulpn | grep :3000

# Stop conflicting services or change ports in docker-compose.local.yml
```

### Services Not Starting
```bash
# Check logs for errors
npm run local:logs

# Try a clean restart
npm run local:reset
```

### LocalStack Issues
```bash
# Reset LocalStack data
npm run local:clean

# Check LocalStack health
curl http://localhost:4566/_localstack/health
```

## Next Steps

- Explore the [Development Workflow](scripts/README-Development-Workflow.md)
- Check out the [API Documentation](http://localhost:8080) when running
- Review the [Project Documentation](docs/) for architecture details
- Run tests with `npm run test:integration`

## Need Help?

- Check the [Development Workflow Guide](scripts/README-Development-Workflow.md)
- Review service logs with `npm run local:logs`
- Verify environment health with `npm run local:health`