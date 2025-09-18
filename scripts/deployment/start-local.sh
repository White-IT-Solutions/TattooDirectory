#!/bin/bash

# Tattoo Directory Local Environment Startup Script
# This script starts the complete local development environment

set -e  # Exit on any error

echo "🚀 Starting Tattoo Directory Local Environment..."
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
print_success "Docker is running"

# Check if docker-compose.local.yml exists
if [ ! -f "devtools/docker/docker-compose.local.yml" ]; then
    print_error "docker-compose.local.yml not found. Please ensure you're in the project root directory."
    exit 1
fi

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose -f devtools/docker/docker-compose.local.yml down --remove-orphans > /dev/null 2>&1 || true

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f devtools/docker/docker-compose.local.yml pull

# Start services in detached mode
print_status "Starting containers..."
docker-compose -f devtools/docker/docker-compose.local.yml up -d

# Wait for services to initialize
print_status "Waiting for services to initialize..."
sleep 10

# Check service health
print_status "Checking service health..."
node scripts/health-check.js

# Seed test data if seeder is available
if docker-compose -f devtools/docker/docker-compose.local.yml ps | grep -q "data-seeder"; then
    print_status "Seeding test data..."
    docker-compose -f devtools/docker/docker-compose.local.yml run --rm data-seeder
    print_success "Test data seeded successfully"
fi

echo ""
echo "✅ Local environment is ready!"
echo "=================================================="
echo "🌐 Frontend:     http://localhost:${FRONTEND_PORT:-3000}"
echo "📚 API Docs:     http://localhost:${SWAGGER_PORT:-8080}"
echo "🔧 Backend API:  http://localhost:${BACKEND_PORT:-9000}"
echo "☁️  LocalStack:   http://localhost:${LOCALSTACK_PORT:-4566}"
echo "📊 LocalStack UI: http://localhost:${LOCALSTACK_PORT:-4566}/_localstack/cockpit"
echo ""
echo "📝 Useful commands:"
echo "   npm run local:logs      - View all service logs"
echo "   npm run local:stop      - Stop all services"
echo "   npm run local:restart   - Restart environment"
echo "   npm run local:monitor   - Monitor resource usage"
echo "   npm run local:resources - Get optimization tips"
echo ""
echo "🔍 To monitor services: docker-compose -f devtools/docker/docker-compose.local.yml logs -f"
