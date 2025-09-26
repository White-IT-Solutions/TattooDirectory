#!/bin/bash
set -e

# Enhanced LocalStack Service Initialization Script
# Handles dependency ordering, health checks, and comprehensive reporting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

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

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Get script directory and project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVTOOLS_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEVTOOLS_DIR")"
LOCALSTACK_INIT_DIR="$PROJECT_ROOT/localstack-init"
ENV_FILE="$DEVTOOLS_DIR/.env.local"

# Configuration
LOCALSTACK_ENDPOINT="http://localhost:4566"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=2   # 2 seconds
MAX_RETRY_ATTEMPTS=3

# Service definitions with dependencies and health check commands
declare -A SERVICE_DEPENDENCIES
declare -A SERVICE_HEALTH_CHECKS
declare -A SERVICE_DESCRIPTIONS
declare -A SERVICE_ENDPOINTS
declare -A SERVICE_INIT_SCRIPTS

# Phase 1 Services
SERVICE_DEPENDENCIES[dynamodb]=""
SERVICE_DEPENDENCIES[opensearch]=""
SERVICE_DEPENDENCIES[s3]=""
SERVICE_DEPENDENCIES[apigateway]="dynamodb s3"
SERVICE_DEPENDENCIES[lambda]="dynamodb s3"
SERVICE_DEPENDENCIES[cloudwatch-logs]=""
SERVICE_DEPENDENCIES[sns]="lambda"
SERVICE_DEPENDENCIES[dynamodb-streams]="dynamodb lambda"

# Phase 2 Services (optional)
SERVICE_DEPENDENCIES[sqs]=""
SERVICE_DEPENDENCIES[eventbridge]="lambda sqs"
SERVICE_DEPENDENCIES[cloudwatch-metrics]=""

# Health check commands
SERVICE_HEALTH_CHECKS[dynamodb]="awslocal dynamodb list-tables"
SERVICE_HEALTH_CHECKS[opensearch]="curl -f $LOCALSTACK_ENDPOINT/tattoo-directory-local/_cluster/health"
SERVICE_HEALTH_CHECKS[s3]="awslocal s3 ls"
SERVICE_HEALTH_CHECKS[apigateway]="awslocal apigateway get-rest-apis"
SERVICE_HEALTH_CHECKS[lambda]="awslocal lambda list-functions"
SERVICE_HEALTH_CHECKS[cloudwatch-logs]="awslocal logs describe-log-groups"
SERVICE_HEALTH_CHECKS[sns]="awslocal sns list-topics"
SERVICE_HEALTH_CHECKS[dynamodb-streams]="awslocal dynamodb describe-table --table-name TattooArtistDirectory"
SERVICE_HEALTH_CHECKS[sqs]="awslocal sqs list-queues"
SERVICE_HEALTH_CHECKS[eventbridge]="awslocal events list-rules"
SERVICE_HEALTH_CHECKS[cloudwatch-metrics]="awslocal cloudwatch list-metrics"

# Service descriptions
SERVICE_DESCRIPTIONS[dynamodb]="DynamoDB database service"
SERVICE_DESCRIPTIONS[opensearch]="OpenSearch search engine"
SERVICE_DESCRIPTIONS[s3]="S3 object storage"
SERVICE_DESCRIPTIONS[apigateway]="API Gateway REST API"
SERVICE_DESCRIPTIONS[lambda]="Lambda serverless functions"
SERVICE_DESCRIPTIONS[cloudwatch-logs]="CloudWatch Logs monitoring"
SERVICE_DESCRIPTIONS[sns]="SNS notification service"
SERVICE_DESCRIPTIONS[dynamodb-streams]="DynamoDB Streams for real-time sync"
SERVICE_DESCRIPTIONS[sqs]="SQS message queues"
SERVICE_DESCRIPTIONS[eventbridge]="EventBridge event scheduling"
SERVICE_DESCRIPTIONS[cloudwatch-metrics]="CloudWatch Metrics monitoring"

# Service endpoints
SERVICE_ENDPOINTS[dynamodb]="$LOCALSTACK_ENDPOINT (DynamoDB API)"
SERVICE_ENDPOINTS[opensearch]="$LOCALSTACK_ENDPOINT/tattoo-directory-local"
SERVICE_ENDPOINTS[s3]="$LOCALSTACK_ENDPOINT (S3 API)"
SERVICE_ENDPOINTS[apigateway]="$LOCALSTACK_ENDPOINT (API Gateway)"
SERVICE_ENDPOINTS[lambda]="$LOCALSTACK_ENDPOINT (Lambda API)"
SERVICE_ENDPOINTS[cloudwatch-logs]="$LOCALSTACK_ENDPOINT (CloudWatch Logs API)"
SERVICE_ENDPOINTS[sns]="$LOCALSTACK_ENDPOINT (SNS API)"
SERVICE_ENDPOINTS[dynamodb-streams]="Integrated with DynamoDB"
SERVICE_ENDPOINTS[sqs]="$LOCALSTACK_ENDPOINT (SQS API)"
SERVICE_ENDPOINTS[eventbridge]="$LOCALSTACK_ENDPOINT (EventBridge API)"
SERVICE_ENDPOINTS[cloudwatch-metrics]="$LOCALSTACK_ENDPOINT (CloudWatch API)"

# Initialization scripts
SERVICE_INIT_SCRIPTS[dynamodb]="01-create-dynamodb-table.sh"
SERVICE_INIT_SCRIPTS[opensearch]="02-create-opensearch-domain.sh"
SERVICE_INIT_SCRIPTS[s3]="03-create-s3-buckets.sh"
SERVICE_INIT_SCRIPTS[apigateway]="04-create-api-gateway.sh"
SERVICE_INIT_SCRIPTS[lambda]="05-deploy-lambda.sh"
SERVICE_INIT_SCRIPTS[dynamodb-streams]="06-setup-dynamodb-stream-trigger.sh"
SERVICE_INIT_SCRIPTS[cloudwatch-logs]="07-create-cloudwatch-logs.sh"
SERVICE_INIT_SCRIPTS[sns]="08-create-sns-topics.sh"

# Global variables for tracking
declare -A SERVICE_STATUS
declare -A SERVICE_ERRORS
declare -A SERVICE_INIT_TIME
TOTAL_SERVICES=0
SUCCESSFUL_SERVICES=0
FAILED_SERVICES=0
START_TIME=$(date +%s)

# Function to get current phase
get_current_phase() {
    if [ -f "$ENV_FILE" ]; then
        grep "^LOCALSTACK_PHASE=" "$ENV_FILE" | cut -d'=' -f2 || echo "phase1"
    else
        echo "phase1"
    fi
}

# Function to check if LocalStack is running
check_localstack_running() {
    print_step "Checking if LocalStack is running..."
    
    if ! curl -f -s "$LOCALSTACK_ENDPOINT/_localstack/health" > /dev/null 2>&1; then
        print_error "LocalStack is not running or not accessible at $LOCALSTACK_ENDPOINT"
        print_info "Please start LocalStack first using: ./start-localstack.sh"
        return 1
    fi
    
    print_success "LocalStack is running and accessible"
    return 0
}

# Function to wait for LocalStack to be fully ready
wait_for_localstack() {
    print_step "Waiting for LocalStack to be fully ready..."
    
    local attempt=1
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$LOCALSTACK_ENDPOINT/_localstack/health" | grep -q '"dynamodb": "available"'; then
            print_success "LocalStack is fully ready!"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            print_info "Still waiting for LocalStack... (attempt $attempt/$max_attempts)"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    
    print_error "LocalStack failed to become ready within $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Function to perform health check for a service
health_check_service() {
    local service=$1
    local health_cmd="${SERVICE_HEALTH_CHECKS[$service]}"
    
    if [ -z "$health_cmd" ]; then
        print_warning "No health check defined for service: $service"
        return 0
    fi
    
    # Execute health check with timeout
    if timeout 30 bash -c "$health_cmd" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check service dependencies
check_dependencies() {
    local service=$1
    local dependencies="${SERVICE_DEPENDENCIES[$service]}"
    
    if [ -z "$dependencies" ]; then
        return 0  # No dependencies
    fi
    
    for dep in $dependencies; do
        if [ "${SERVICE_STATUS[$dep]}" != "healthy" ]; then
            print_error "Dependency '$dep' is not healthy for service '$service'"
            return 1
        fi
    done
    
    return 0
}

# Function to initialize a single service
initialize_service() {
    local service=$1
    local start_time=$(date +%s)
    
    print_step "Initializing $service (${SERVICE_DESCRIPTIONS[$service]})..."
    
    # Check dependencies
    if ! check_dependencies "$service"; then
        SERVICE_STATUS[$service]="failed"
        SERVICE_ERRORS[$service]="Dependency check failed"
        return 1
    fi
    
    # Run initialization script if it exists
    local init_script="${SERVICE_INIT_SCRIPTS[$service]}"
    if [ -n "$init_script" ] && [ -f "$LOCALSTACK_INIT_DIR/$init_script" ]; then
        print_info "Running initialization script: $init_script"
        
        if ! bash "$LOCALSTACK_INIT_DIR/$init_script" > /dev/null 2>&1; then
            SERVICE_STATUS[$service]="failed"
            SERVICE_ERRORS[$service]="Initialization script failed"
            print_error "Failed to run initialization script for $service"
            return 1
        fi
    fi
    
    # Perform health check with retries
    local attempt=1
    while [ $attempt -le $MAX_RETRY_ATTEMPTS ]; do
        if health_check_service "$service"; then
            local end_time=$(date +%s)
            SERVICE_INIT_TIME[$service]=$((end_time - start_time))
            SERVICE_STATUS[$service]="healthy"
            print_success "$service initialized successfully (${SERVICE_INIT_TIME[$service]}s)"
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRY_ATTEMPTS ]; then
            print_warning "$service health check failed (attempt $attempt/$MAX_RETRY_ATTEMPTS), retrying..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
        
        ((attempt++))
    done
    
    SERVICE_STATUS[$service]="failed"
    SERVICE_ERRORS[$service]="Health check failed after $MAX_RETRY_ATTEMPTS attempts"
    print_error "$service failed health check after $MAX_RETRY_ATTEMPTS attempts"
    return 1
}

# Function to get services to initialize based on phase
get_services_for_phase() {
    local phase=$1
    local services=""
    
    # Phase 1 services (always included)
    services="dynamodb opensearch s3 cloudwatch-logs lambda apigateway sns dynamodb-streams"
    
    # Phase 2 services (optional)
    if [ "$phase" = "phase2" ]; then
        services="$services sqs eventbridge cloudwatch-metrics"
    fi
    
    echo $services
}

# Function to topologically sort services based on dependencies
topological_sort() {
    local services=($1)
    local sorted=()
    local visited=()
    local temp_visited=()
    
    # Simple dependency resolution - process services with no dependencies first
    local remaining=("${services[@]}")
    
    while [ ${#remaining[@]} -gt 0 ]; do
        local added_this_round=false
        local new_remaining=()
        
        for service in "${remaining[@]}"; do
            local dependencies="${SERVICE_DEPENDENCIES[$service]}"
            local can_add=true
            
            # Check if all dependencies are already in sorted list
            for dep in $dependencies; do
                if [[ ! " ${sorted[@]} " =~ " ${dep} " ]]; then
                    can_add=false
                    break
                fi
            done
            
            if [ "$can_add" = true ]; then
                sorted+=("$service")
                added_this_round=true
            else
                new_remaining+=("$service")
            fi
        done
        
        remaining=("${new_remaining[@]}")
        
        # Prevent infinite loop
        if [ "$added_this_round" = false ] && [ ${#remaining[@]} -gt 0 ]; then
            print_warning "Circular dependency detected, adding remaining services: ${remaining[*]}"
            sorted+=("${remaining[@]}")
            break
        fi
    done
    
    echo "${sorted[@]}"
}

# Function to generate initialization summary
generate_summary() {
    local end_time=$(date +%s)
    local total_time=$((end_time - START_TIME))
    
    print_header "INITIALIZATION SUMMARY"
    
    echo -e "${BLUE}Phase:${NC} $(get_current_phase)"
    echo -e "${BLUE}Total Time:${NC} ${total_time}s"
    echo -e "${BLUE}Services Processed:${NC} $TOTAL_SERVICES"
    echo -e "${GREEN}Successful:${NC} $SUCCESSFUL_SERVICES"
    echo -e "${RED}Failed:${NC} $FAILED_SERVICES"
    echo ""
    
    # Service status table
    echo -e "${PURPLE}SERVICE STATUS:${NC}"
    printf "%-20s %-10s %-8s %-50s\n" "Service" "Status" "Time" "Endpoint/Error"
    printf "%-20s %-10s %-8s %-50s\n" "-------" "------" "----" "-------------"
    
    for service in "${!SERVICE_STATUS[@]}"; do
        local status="${SERVICE_STATUS[$service]}"
        local time_taken="${SERVICE_INIT_TIME[$service]:-0}"
        local endpoint_or_error=""
        
        if [ "$status" = "healthy" ]; then
            endpoint_or_error="${SERVICE_ENDPOINTS[$service]}"
            printf "%-20s ${GREEN}%-10s${NC} %-8s %-50s\n" "$service" "$status" "${time_taken}s" "$endpoint_or_error"
        else
            endpoint_or_error="${SERVICE_ERRORS[$service]}"
            printf "%-20s ${RED}%-10s${NC} %-8s %-50s\n" "$service" "$status" "${time_taken}s" "$endpoint_or_error"
        fi
    done
    
    echo ""
    
    # Show healthy service endpoints
    if [ $SUCCESSFUL_SERVICES -gt 0 ]; then
        echo -e "${GREEN}AVAILABLE SERVICES:${NC}"
        for service in "${!SERVICE_STATUS[@]}"; do
            if [ "${SERVICE_STATUS[$service]}" = "healthy" ]; then
                echo "  • ${SERVICE_DESCRIPTIONS[$service]}: ${SERVICE_ENDPOINTS[$service]}"
            fi
        done
        echo ""
    fi
    
    # Show failed services with recovery instructions
    if [ $FAILED_SERVICES -gt 0 ]; then
        echo -e "${RED}FAILED SERVICES:${NC}"
        for service in "${!SERVICE_STATUS[@]}"; do
            if [ "${SERVICE_STATUS[$service]}" = "failed" ]; then
                echo "  • $service: ${SERVICE_ERRORS[$service]}"
                echo "    Recovery: Check LocalStack logs and retry initialization"
            fi
        done
        echo ""
        
        print_warning "Some services failed to initialize. Check the errors above and:"
        print_info "1. Verify LocalStack is running: docker logs tattoo-directory-localstack"
        print_info "2. Check service-specific logs in LocalStack"
        print_info "3. Retry initialization: $0"
        print_info "4. For persistent issues, restart LocalStack: ./start-localstack.sh restart"
    fi
    
    # Overall status
    if [ $FAILED_SERVICES -eq 0 ]; then
        print_success "All services initialized successfully! 🎉"
        echo ""
        print_info "You can now start developing with the full LocalStack environment."
        print_info "Use 'awslocal' commands to interact with services."
    else
        print_error "Initialization completed with $FAILED_SERVICES failed service(s)"
        echo ""
        print_info "You can still use the successfully initialized services."
        print_info "Failed services can be retried individually or by running this script again."
    fi
}

# Main initialization function
main() {
    print_header "LOCALSTACK SERVICE INITIALIZATION"
    
    # Check prerequisites
    if ! check_localstack_running; then
        exit 1
    fi
    
    # Wait for LocalStack to be ready
    if ! wait_for_localstack; then
        exit 1
    fi
    
    # Get services for current phase
    local phase=$(get_current_phase)
    local services_list=$(get_services_for_phase "$phase")
    local services_array=($services_list)
    
    print_info "Initializing services for $phase: ${services_array[*]}"
    
    # Sort services by dependencies
    local sorted_services=$(topological_sort "$services_list")
    local sorted_array=($sorted_services)
    
    print_info "Service initialization order: ${sorted_array[*]}"
    echo ""
    
    # Initialize services
    TOTAL_SERVICES=${#sorted_array[@]}
    
    for service in "${sorted_array[@]}"; do
        if initialize_service "$service"; then
            ((SUCCESSFUL_SERVICES++))
        else
            ((FAILED_SERVICES++))
        fi
        echo ""
    done
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [ $FAILED_SERVICES -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle command line arguments
case "${1:-init}" in
    "init"|"")
        main
        ;;
    "health"|"status")
        print_header "SERVICE HEALTH CHECK"
        
        if ! check_localstack_running; then
            exit 1
        fi
        
        local phase=$(get_current_phase)
        local services_list=$(get_services_for_phase "$phase")
        local services_array=($services_list)
        
        echo -e "${BLUE}Checking health of ${#services_array[@]} services...${NC}"
        echo ""
        
        printf "%-20s %-10s %-50s\n" "Service" "Status" "Endpoint"
        printf "%-20s %-10s %-50s\n" "-------" "------" "--------"
        
        for service in "${services_array[@]}"; do
            if health_check_service "$service"; then
                printf "%-20s ${GREEN}%-10s${NC} %-50s\n" "$service" "healthy" "${SERVICE_ENDPOINTS[$service]}"
            else
                printf "%-20s ${RED}%-10s${NC} %-50s\n" "$service" "unhealthy" "Health check failed"
            fi
        done
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [init|health|status|help]"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize all LocalStack services (default)"
        echo "  health   - Check health status of all services"
        echo "  status   - Alias for health"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0           # Initialize services"
        echo "  $0 init      # Initialize services"
        echo "  $0 health    # Check service health"
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac