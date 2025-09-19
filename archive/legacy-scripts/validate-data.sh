#!/bin/bash

# Unified Data Management - Validate Data (Linux/Unix)
# This script validates data consistency and integrity

set -e  # Exit on any error

echo "🔍 Validating data consistency..."
echo "=============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to scripts directory
cd "$SCRIPT_DIR"

# Execute the unified data CLI
node data-cli.js validate-data "$@"

# Check exit code
if [ $? -ne 0 ]; then
    print_error "Data validation failed"
    exit 1
fi

print_success "Data validation completed successfully!"