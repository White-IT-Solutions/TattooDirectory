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
DOCKER_COMPOSE_FILE="$DEVTOOLS_DIR/docker/docker-compose.local.yml"
ENV_FILE="$DEVTOOLS_DIR/.env.local"

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        print_info "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is required but not installed"
        print_info "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        print_info "Start Docker and try again"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to get current phase
get_current_phase() {
    if [ -f "$ENV_FILE" ]; then
        grep "^LOCALSTACK_PHASE=" "$ENV_FILE" | cut -d'=' -f2 || echo "phase1"
    else
        echo "phase1"
    fi
}

# Function to setup directories
setup_directories() {
    print_info "Setting up LocalStack directories..."
    
    # Run the directory setup script
    if [ -f "$SCRIPT_DIR/setup-localstack-dirs.sh" ]; then
        bash "$SCRIPT_DIR/setup-localstack-dirs.sh"
    else
        # Fallback: create directories manually
        mkdir -p "$DEVTOOLS_DIR/localstack-data"
        mkdir -p "$DEVTOOLS_DIR/localstack-logs"
        print_success "Created LocalStack directories"
    fi
}

# Function to start LocalStack
start_localstack() {
    local phase=$(get_current_phase)
    
    print_info "Starting LocalStack in $phase mode..."
    
    # Change to project root for docker-compose
    cd "$PROJECT_ROOT"
    
    if [ "$phase" = "phase2" ]; then
        print_info "Starting Phase 2 LocalStack (includes SQS, EventBridge, CloudWatch Metrics)..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" --profile phase2 up -d localstack-phase2
        CONTAINER_NAME="tattoo-directory-localstack-phase2"
    else
        print_info "Starting Phase 1 LocalStack (DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS)..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d localstack
        CONTAINER_NAME="tattoo-directory-localstack"
    fi
    
    print_success "LocalStack container started"
    
    # Wait for LocalStack to be healthy
    print_info "Waiting for LocalStack to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$CONTAINER_NAME" curl -f http://localhost:4566/_localstack/health &> /dev/null; then
            print_success "LocalStack is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "LocalStack failed to start within expected time"
            print_info "Check logs with: docker logs $CONTAINER_NAME"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo ""
}

# Function to show service status
show_status() {
    local phase=$(get_current_phase)
    
    print_info "LocalStack Status:"
    echo "  Phase: $phase"
    echo "  Endpoint: http://localhost:4566"
    echo "  Web UI: http://localhost:4566/_localstack/cockpit"
    
    # Show running services
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "tattoo-directory-localstack"; then
        print_success "LocalStack is running"
        
        # Show service health
        print_info "Service Health:"
        if curl -s http://localhost:4566/_localstack/health | jq -r 'to_entries[] | "\(.key): \(.value)"' 2>/dev/null; then
            echo ""
        else
            print_warning "Could not retrieve service health status"
        fi
    else
        print_warning "LocalStack is not running"
    fi
}

# Function to display usage
usage() {
    echo "Usage: $0 [start|stop|restart|status|logs]"
    echo ""
    echo "Commands:"
    echo "  start   - Start LocalStack (default)"
    echo "  stop    - Stop LocalStack"
    echo "  restart - Restart LocalStack"
    echo "  status  - Show LocalStack status"
    echo "  logs    - Show LocalStack logs"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start LocalStack"
    echo "  $0 status   # Show status"
    echo "  $0 logs     # Show logs"
}

# Main script logic
case "${1:-start}" in
    "start")
        check_prerequisites
        setup_directories
        start_localstack
        show_status
        ;;
    "stop")
        print_info "Stopping LocalStack..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        docker-compose -f "$DOCKER_COMPOSE_FILE" --profile phase2 down
        print_success "LocalStack stopped"
        ;;
    "restart")
        print_info "Restarting LocalStack..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        docker-compose -f "$DOCKER_COMPOSE_FILE" --profile phase2 down
        sleep 2
        check_prerequisites
        setup_directories
        start_localstack
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        local phase=$(get_current_phase)
        if [ "$phase" = "phase2" ]; then
            docker logs -f tattoo-directory-localstack-phase2
        else
            docker logs -f tattoo-directory-localstack
        fi
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        usage
        exit 1
        ;;
esac