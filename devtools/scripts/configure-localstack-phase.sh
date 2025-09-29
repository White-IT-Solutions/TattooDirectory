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
ENV_FILE="$DEVTOOLS_DIR/.env.local"

# Function to display usage
usage() {
    echo "Usage: $0 [phase1|phase2|status]"
    echo ""
    echo "Commands:"
    echo "  phase1  - Configure LocalStack for Phase 1 services (DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS)"
    echo "  phase2  - Configure LocalStack for Phase 2 services (Phase 1 + SQS, EventBridge, CloudWatch Metrics)"
    echo "  status  - Show current phase configuration"
    echo ""
    echo "Examples:"
    echo "  $0 phase1    # Switch to Phase 1 configuration"
    echo "  $0 phase2    # Switch to Phase 2 configuration"
    echo "  $0 status    # Show current configuration"
}

# Function to get current phase
get_current_phase() {
    if [ -f "$ENV_FILE" ]; then
        grep "^LOCALSTACK_PHASE=" "$ENV_FILE" | cut -d'=' -f2 || echo "phase1"
    else
        echo "phase1"
    fi
}

# Function to show status
show_status() {
    local current_phase=$(get_current_phase)
    
    print_info "Current LocalStack Configuration:"
    echo "  Phase: $current_phase"
    
    if [ "$current_phase" = "phase1" ]; then
        echo "  Services: DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS"
        echo "  Profile: Default (no profile needed)"
        echo "  Memory: ~1.5GB"
    elif [ "$current_phase" = "phase2" ]; then
        echo "  Services: Phase 1 + SQS, EventBridge, CloudWatch Metrics"
        echo "  Profile: phase2"
        echo "  Memory: ~2GB"
    fi
    
    echo ""
    print_info "To start LocalStack:"
    if [ "$current_phase" = "phase1" ]; then
        echo "  docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack"
    else
        echo "  docker-compose -f devtools/docker/docker-compose.local.yml --profile phase2 up -d localstack-phase2"
    fi
}

# Function to configure phase
configure_phase() {
    local phase=$1
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Update the phase in the environment file
    if grep -q "^LOCALSTACK_PHASE=" "$ENV_FILE"; then
        sed -i "s/^LOCALSTACK_PHASE=.*/LOCALSTACK_PHASE=$phase/" "$ENV_FILE"
    else
        echo "LOCALSTACK_PHASE=$phase" >> "$ENV_FILE"
    fi
    
    print_success "LocalStack configured for $phase"
    
    # Show updated status
    show_status
    
    # Provide next steps
    echo ""
    print_info "Next steps:"
    echo "1. Stop any running LocalStack containers:"
    echo "   docker-compose -f devtools/docker/docker-compose.local.yml down"
    echo ""
    echo "2. Start LocalStack with new configuration:"
    if [ "$phase" = "phase1" ]; then
        echo "   docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack"
    else
        echo "   docker-compose -f devtools/docker/docker-compose.local.yml --profile phase2 up -d localstack-phase2"
    fi
}

# Main script logic
case "${1:-}" in
    "phase1")
        configure_phase "phase1"
        ;;
    "phase2")
        configure_phase "phase2"
        ;;
    "status")
        show_status
        ;;
    "")
        show_status
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        usage
        exit 1
        ;;
esac