#!/bin/bash

# Tattoo Directory Local Environment Shutdown Script
# This script cleanly stops all local development services

set -e  # Exit on any error

echo "🛑 Stopping Tattoo Directory Local Environment..."
echo "================================================="

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
    print_warning "Docker is not running. Nothing to stop."
    exit 0
fi

# Check if docker-compose.local.yml exists
if [ ! -f "dev-tools/docker/docker-compose.local.yml" ]; then
    print_error "docker-compose.local.yml not found. Please ensure you're in the project root directory."
    exit 1
fi

# Parse command line arguments
REMOVE_VOLUMES=false
REMOVE_IMAGES=false
FORCE_STOP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --volumes|-v)
            REMOVE_VOLUMES=true
            shift
            ;;
        --images|-i)
            REMOVE_IMAGES=true
            shift
            ;;
        --force|-f)
            FORCE_STOP=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --volumes, -v    Remove volumes (deletes all data)"
            echo "  --images, -i     Remove images (forces rebuild next time)"
            echo "  --force, -f      Force stop containers (kill instead of graceful stop)"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                # Graceful stop"
            echo "  $0 --volumes      # Stop and remove data"
            echo "  $0 --force        # Force stop all containers"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show current running containers
print_status "Current running containers:"
docker-compose -f dev-tools/docker/docker-compose.local.yml ps

# Stop containers
if [ "$FORCE_STOP" = true ]; then
    print_status "Force stopping containers..."
    docker-compose -f dev-tools/docker/docker-compose.local.yml kill
else
    print_status "Gracefully stopping containers..."
    docker-compose -f dev-tools/docker/docker-compose.local.yml stop
fi

# Remove containers and networks
print_status "Removing containers and networks..."
if [ "$REMOVE_VOLUMES" = true ]; then
    print_warning "Removing volumes (this will delete all data)..."
    docker-compose -f dev-tools/docker/docker-compose.local.yml down --volumes --remove-orphans
else
    docker-compose -f dev-tools/docker/docker-compose.local.yml down --remove-orphans
fi

# Remove images if requested
if [ "$REMOVE_IMAGES" = true ]; then
    print_status "Removing Docker images..."
    docker-compose -f dev-tools/docker/docker-compose.local.yml down --rmi all
fi

# Clean up dangling resources
print_status "Cleaning up dangling resources..."
docker system prune -f > /dev/null 2>&1 || true

# Show disk space freed (if any)
print_status "Checking Docker disk usage..."
docker system df

print_success "Local environment stopped successfully!"

if [ "$REMOVE_VOLUMES" = true ]; then
    print_warning "All data has been removed. Next startup will create fresh data."
fi

if [ "$REMOVE_IMAGES" = true ]; then
    print_warning "Images have been removed. Next startup will rebuild containers."
fi

echo ""
echo "📝 To start the environment again:"
echo "   npm run local:start"
echo "   # or"
echo "   ./scripts/start-local.sh"