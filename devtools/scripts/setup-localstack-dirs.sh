#!/bin/bash
set -e

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVTOOLS_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEVTOOLS_DIR")"

print_info "Setting up LocalStack directory structure..."

# Create LocalStack data directories
LOCALSTACK_DATA_DIR="$DEVTOOLS_DIR/localstack-data"
LOCALSTACK_LOGS_DIR="$DEVTOOLS_DIR/localstack-logs"

# Create directories if they don't exist
if [ ! -d "$LOCALSTACK_DATA_DIR" ]; then
    mkdir -p "$LOCALSTACK_DATA_DIR"
    print_success "Created LocalStack data directory: $LOCALSTACK_DATA_DIR"
else
    print_info "LocalStack data directory already exists: $LOCALSTACK_DATA_DIR"
fi

if [ ! -d "$LOCALSTACK_LOGS_DIR" ]; then
    mkdir -p "$LOCALSTACK_LOGS_DIR"
    print_success "Created LocalStack logs directory: $LOCALSTACK_LOGS_DIR"
else
    print_info "LocalStack logs directory already exists: $LOCALSTACK_LOGS_DIR"
fi

# Set appropriate permissions
chmod 755 "$LOCALSTACK_DATA_DIR"
chmod 755 "$LOCALSTACK_LOGS_DIR"

print_success "LocalStack directory structure setup complete!"

# Display directory structure
print_info "Directory structure:"
echo "  📁 $LOCALSTACK_DATA_DIR (LocalStack persistent data)"
echo "  📁 $LOCALSTACK_LOGS_DIR (LocalStack logs)"

print_info "You can now start LocalStack with: docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack"