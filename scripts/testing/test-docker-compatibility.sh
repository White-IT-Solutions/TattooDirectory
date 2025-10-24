#!/bin/bash
set -e

# Docker and Cross-Platform Compatibility Test Script for Linux/macOS
# Tests enhanced frontend-sync-processor in Docker environments

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🐳 Docker and Cross-Platform Compatibility Tests${NC}"
echo "================================================"
echo

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not available. Please install Docker."
    echo "  Install instructions: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
DOCKER_COMPOSE_CMD=""
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    print_error "Docker Compose is not available."
    exit 1
fi

print_success "Docker available: $(docker --version)"
print_success "Docker Compose available: $DOCKER_COMPOSE_CMD"
echo

# Set environment variables
export LOCALSTACK_PORT=4566
export BACKEND_PORT=9000
export FRONTEND_PORT=3000
export ENABLE_BACKEND_DEBUG=false
export ENABLE_FRONTEND_DEBUG=false

# Detect platform and set platform-specific variables
PLATFORM=$(uname -s)
case $PLATFORM in
    Darwin)
        print_info "Detected macOS platform"
        export DOCKER_COMPOSE_OVERRIDE="devtools/docker/docker-compose.macos.yml"
        ;;
    Linux)
        print_info "Detected Linux platform"
        export DOCKER_COMPOSE_OVERRIDE=""
        ;;
    *)
        print_warning "Unknown platform: $PLATFORM"
        export DOCKER_COMPOSE_OVERRIDE=""
        ;;
esac

# Run the comprehensive test suite
print_info "Running Docker and Cross-Platform Compatibility Tests..."
echo

node scripts/test-docker-cross-platform-compatibility.js
TEST_EXIT_CODE=$?

echo
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All Docker and cross-platform compatibility tests passed!"
    echo
    echo "📋 Task 1.12 Status: COMPLETED"
    echo "   ✅ Enhanced frontend-sync-processor tested in Docker container environment"
    echo "   ✅ Cross-platform path handling validated with new data export features"
    echo "   ✅ Windows/Linux/macOS compatibility tested with enhanced CLI options"
    echo "   ✅ Docker networking validated with enhanced service integrations"
    echo "   ✅ CI/CD environment compatibility tested with enhanced processor"
else
    print_error "Some Docker and cross-platform compatibility tests failed."
    echo "   Check the test report for details."
fi

echo
print_info "Test reports available in: scripts/test-results/"
echo "   - docker-cross-platform-test-report.json"
echo "   - task-1-12-docker-compatibility-summary.md"

exit $TEST_EXIT_CODE