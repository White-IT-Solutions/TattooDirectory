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

# Check if LocalStack is running
check_localstack_health() {
    print_info "Checking LocalStack health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:4566/_localstack/health" > /dev/null 2>&1; then
            print_success "LocalStack is healthy"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts - waiting for LocalStack..."
        sleep 2
        ((attempt++))
    done
    
    print_error "LocalStack health check failed after $max_attempts attempts"
    return 1
}

# Check Phase 1 services
check_phase1_services() {
    print_info "Validating Phase 1 services..."
    
    local services=("dynamodb" "opensearch" "s3" "apigateway" "lambda" "logs" "sns")
    local failed_services=()
    
    for service in "${services[@]}"; do
        print_info "Checking $service..."
        
        case $service in
            "dynamodb")
                if aws --endpoint-url=http://localhost:4566 dynamodb list-tables --region eu-west-2 > /dev/null 2>&1; then
                    print_success "DynamoDB is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "opensearch")
                if curl -s "http://localhost:4566/_aws/opensearch/domain-info" > /dev/null 2>&1; then
                    print_success "OpenSearch is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "s3")
                if aws --endpoint-url=http://localhost:4566 s3 ls --region eu-west-2 > /dev/null 2>&1; then
                    print_success "S3 is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "apigateway")
                if aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis --region eu-west-2 > /dev/null 2>&1; then
                    print_success "API Gateway is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "lambda")
                if aws --endpoint-url=http://localhost:4566 lambda list-functions --region eu-west-2 > /dev/null 2>&1; then
                    print_success "Lambda is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "logs")
                if aws --endpoint-url=http://localhost:4566 logs describe-log-groups --region eu-west-2 > /dev/null 2>&1; then
                    print_success "CloudWatch Logs is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "sns")
                if aws --endpoint-url=http://localhost:4566 sns list-topics --region eu-west-2 > /dev/null 2>&1; then
                    print_success "SNS is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
        esac
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All Phase 1 services are accessible"
        return 0
    else
        print_error "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Check Phase 2 services (if running)
check_phase2_services() {
    print_info "Validating Phase 2 services..."
    
    local services=("sqs" "events" "cloudwatch")
    local failed_services=()
    
    for service in "${services[@]}"; do
        print_info "Checking $service..."
        
        case $service in
            "sqs")
                if aws --endpoint-url=http://localhost:4566 sqs list-queues --region eu-west-2 > /dev/null 2>&1; then
                    print_success "SQS is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "events")
                if aws --endpoint-url=http://localhost:4566 events list-rules --region eu-west-2 > /dev/null 2>&1; then
                    print_success "EventBridge is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
            "cloudwatch")
                if aws --endpoint-url=http://localhost:4566 cloudwatch list-metrics --region eu-west-2 > /dev/null 2>&1; then
                    print_success "CloudWatch Metrics is accessible"
                else
                    failed_services+=("$service")
                fi
                ;;
        esac
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All Phase 2 services are accessible"
        return 0
    else
        print_warning "Some Phase 2 services failed (may not be running): ${failed_services[*]}"
        return 1
    fi
}

# Check data persistence
check_data_persistence() {
    print_info "Checking data persistence configuration..."
    
    local directories=("devtools/localstack-data" "devtools/localstack-logs" "devtools/localstack-tmp")
    local missing_dirs=()
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Directory exists: $dir"
        else
            missing_dirs+=("$dir")
        fi
    done
    
    if [ ${#missing_dirs[@]} -eq 0 ]; then
        print_success "All persistence directories exist"
        return 0
    else
        print_error "Missing directories: ${missing_dirs[*]}"
        return 1
    fi
}

# Check environment configuration
check_environment_config() {
    print_info "Checking environment configuration..."
    
    if [ -f "devtools/.env.local" ]; then
        print_success "Environment file exists: devtools/.env.local"
    else
        print_error "Missing environment file: devtools/.env.local"
        return 1
    fi
    
    if [ -f "devtools/localstack-config/localstack.conf" ]; then
        print_success "LocalStack config exists: devtools/localstack-config/localstack.conf"
    else
        print_error "Missing LocalStack config: devtools/localstack-config/localstack.conf"
        return 1
    fi
    
    if [ -f "devtools/localstack-config/services.json" ]; then
        print_success "Services config exists: devtools/localstack-config/services.json"
    else
        print_error "Missing services config: devtools/localstack-config/services.json"
        return 1
    fi
    
    return 0
}

# Main validation function
main() {
    print_info "Starting LocalStack configuration validation..."
    echo
    
    # Check prerequisites
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is required but not installed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    # Run validation checks
    local failed_checks=0
    
    check_environment_config || ((failed_checks++))
    echo
    
    check_data_persistence || ((failed_checks++))
    echo
    
    check_localstack_health || ((failed_checks++))
    echo
    
    check_phase1_services || ((failed_checks++))
    echo
    
    # Try Phase 2 services (optional)
    check_phase2_services || print_warning "Phase 2 services check failed (may not be running)"
    echo
    
    # Summary
    if [ $failed_checks -eq 0 ]; then
        print_success "✨ All validation checks passed!"
        print_info "Enhanced LocalStack configuration is working correctly"
        exit 0
    else
        print_error "❌ $failed_checks validation check(s) failed"
        print_info "Please review the errors above and fix the configuration"
        exit 1
    fi
}

main "$@"