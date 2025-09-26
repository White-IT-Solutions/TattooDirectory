#!/bin/bash

# LocalStack Service Health Monitoring Script (Linux/macOS)
# Comprehensive health checks for all LocalStack services with detailed reporting

set -e

# Configuration
LOCALSTACK_ENDPOINT=${LOCALSTACK_ENDPOINT:-"http://localhost:4566"}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}
MONITOR_INTERVAL=${MONITOR_INTERVAL:-30}
DETAILED=${DETAILED:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Services to check
SERVICES=("dynamodb" "opensearch" "s3" "lambda" "apigateway" "sns" "logs")

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

print_status() {
    echo -e "${MAGENTA}📊 $1${NC}"
}

# Function to test LocalStack core health
test_localstack_core() {
    local response
    local status="Unhealthy"
    local error=""
    
    if response=$(curl -s --max-time "$HEALTH_CHECK_TIMEOUT" "$LOCALSTACK_ENDPOINT/health" 2>&1); then
        if echo "$response" | jq . >/dev/null 2>&1; then
            status="Healthy"
        else
            error="Invalid JSON response"
        fi
    else
        error="Connection failed: $response"
    fi
    
    echo "$status|$error|$response"
}

# Function to test DynamoDB service
test_dynamodb_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal dynamodb list-tables --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local table_count=$(echo "$result" | jq '.TableNames | length')
            status="Healthy"
            details="Tables: $table_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test OpenSearch service
test_opensearch_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal opensearch list-domain-names --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local domain_count=$(echo "$result" | jq '.DomainNames | length')
            status="Healthy"
            details="Domains: $domain_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test S3 service
test_s3_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal s3 ls --region eu-west-2 2>&1); then
        local bucket_count=$(echo "$result" | wc -l)
        status="Healthy"
        details="Buckets: $bucket_count"
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test Lambda service
test_lambda_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal lambda list-functions --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local function_count=$(echo "$result" | jq '.Functions | length')
            status="Healthy"
            details="Functions: $function_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test API Gateway service
test_apigateway_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal apigateway get-rest-apis --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local api_count=$(echo "$result" | jq '.items | length')
            status="Healthy"
            details="APIs: $api_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test SNS service
test_sns_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal sns list-topics --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local topic_count=$(echo "$result" | jq '.Topics | length')
            status="Healthy"
            details="Topics: $topic_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to test CloudWatch Logs service
test_cloudwatch_logs_service() {
    local result
    local status="Unhealthy"
    local details="Connection failed"
    local error=""
    
    if result=$(awslocal logs describe-log-groups --region eu-west-2 --output json 2>&1); then
        if echo "$result" | jq . >/dev/null 2>&1; then
            local log_group_count=$(echo "$result" | jq '.logGroups | length')
            status="Healthy"
            details="Log Groups: $log_group_count"
        else
            error="Invalid response format"
        fi
    else
        error="$result"
    fi
    
    echo "$status|$details|$error"
}

# Function to get comprehensive health status
get_service_health_status() {
    print_info "Checking LocalStack service health..."
    
    declare -A health_results
    
    # Test core LocalStack health
    print_info "  Checking LocalStack Core..."
    local core_result=$(test_localstack_core)
    IFS='|' read -r core_status core_error core_response <<< "$core_result"
    health_results["Core"]="$core_status|Core LocalStack|$core_error"
    
    if [ "$core_status" = "Healthy" ]; then
        print_success "LocalStack Core: Healthy"
        
        # Test individual services
        declare -A service_tests=(
            ["DynamoDB"]="test_dynamodb_service"
            ["OpenSearch"]="test_opensearch_service"
            ["S3"]="test_s3_service"
            ["Lambda"]="test_lambda_service"
            ["API Gateway"]="test_apigateway_service"
            ["SNS"]="test_sns_service"
            ["CloudWatch Logs"]="test_cloudwatch_logs_service"
        )
        
        for service_name in "${!service_tests[@]}"; do
            print_info "  Checking $service_name..."
            local test_function="${service_tests[$service_name]}"
            local result=$($test_function)
            health_results["$service_name"]="$result"
            
            IFS='|' read -r status details error <<< "$result"
            if [ "$status" = "Healthy" ]; then
                print_success "$service_name: $details"
            else
                print_error "$service_name: $details"
                if [ "$DETAILED" = "true" ] && [ -n "$error" ]; then
                    print_warning "     Error: $error"
                fi
            fi
        done
    else
        print_error "LocalStack Core: Unhealthy"
        if [ "$DETAILED" = "true" ] && [ -n "$core_error" ]; then
            print_warning "   Error: $core_error"
        fi
    fi
    
    # Export results for other functions
    for key in "${!health_results[@]}"; do
        echo "HEALTH_$key=${health_results[$key]}"
    done > /tmp/health_results.env
}

# Function to show health summary
show_health_summary() {
    print_status ""
    print_status "Health Summary"
    print_status "=============="
    
    # Source health results
    if [ -f /tmp/health_results.env ]; then
        source /tmp/health_results.env
    else
        print_error "No health results available"
        return 1
    fi
    
    local total_services=0
    local healthy_services=0
    local unhealthy_services=0
    
    # Count services
    for var in $(compgen -v | grep "^HEALTH_"); do
        total_services=$((total_services + 1))
        local result="${!var}"
        IFS='|' read -r status details error <<< "$result"
        if [ "$status" = "Healthy" ]; then
            healthy_services=$((healthy_services + 1))
        else
            unhealthy_services=$((unhealthy_services + 1))
        fi
    done
    
    print_info "Total Services: $total_services"
    print_success "Healthy: $healthy_services"
    
    if [ $unhealthy_services -eq 0 ]; then
        print_success "Unhealthy: $unhealthy_services"
    else
        print_error "Unhealthy: $unhealthy_services"
    fi
    
    local health_percentage=$(( (healthy_services * 100) / total_services ))
    if [ $health_percentage -ge 90 ]; then
        print_success "Health Score: $health_percentage%"
    elif [ $health_percentage -ge 70 ]; then
        print_warning "Health Score: $health_percentage%"
    else
        print_error "Health Score: $health_percentage%"
    fi
    
    # Show unhealthy services
    if [ $unhealthy_services -gt 0 ]; then
        print_warning ""
        print_warning "Unhealthy Services:"
        for var in $(compgen -v | grep "^HEALTH_"); do
            local service_name="${var#HEALTH_}"
            local result="${!var}"
            IFS='|' read -r status details error <<< "$result"
            if [ "$status" = "Unhealthy" ]; then
                print_error "  - $service_name: $details"
            fi
        done
    fi
    
    return $unhealthy_services
}

# Function to show recovery instructions
show_recovery_instructions() {
    local unhealthy_count=$1
    
    if [ $unhealthy_count -gt 0 ]; then
        print_info ""
        print_info "Recovery Instructions"
        print_info "===================="
        
        # Check if core is unhealthy
        if [ -n "$HEALTH_Core" ]; then
            IFS='|' read -r core_status core_details core_error <<< "$HEALTH_Core"
            if [ "$core_status" = "Unhealthy" ]; then
                print_error "LocalStack Core is unhealthy:"
                print_warning "  1. Check if LocalStack container is running: docker ps"
                print_warning "  2. Restart LocalStack: ./devtools/scripts/restart-localstack-with-logs.sh"
                print_warning "  3. Check LocalStack logs: docker logs localstack"
            else
                print_warning "Individual services are unhealthy:"
                print_warning "  1. Restart LocalStack services: ./devtools/scripts/restart-localstack-with-logs.sh"
                print_warning "  2. Re-initialize services: ./devtools/scripts/init-localstack-services.sh"
                print_warning "  3. Check service-specific logs in CloudWatch"
            fi
        fi
        
        print_info ""
        print_info "For detailed troubleshooting, see:"
        print_warning "  docs/TROUBLESHOOTING.md"
    fi
}

# Function to start continuous monitoring
start_health_monitoring() {
    local interval=${1:-$MONITOR_INTERVAL}
    
    print_info "Starting continuous health monitoring (interval: $interval seconds)"
    print_warning "Press Ctrl+C to stop monitoring"
    echo ""
    
    trap 'echo -e "\n${YELLOW}Monitoring stopped.${NC}"; exit 0' INT
    
    while true; do
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        print_status "[$timestamp] Checking health..."
        
        get_service_health_status
        local unhealthy_count
        show_health_summary
        unhealthy_count=$?
        
        print_info ""
        print_info "Next check in $interval seconds..."
        echo ""
        sleep "$interval"
    done
}

# Function to show detailed status
show_detailed_status() {
    get_service_health_status
    show_health_summary
    
    if [ "$DETAILED" = "true" ]; then
        print_info ""
        print_info "Detailed Service Status"
        print_info "======================="
        
        for var in $(compgen -v | grep "^HEALTH_"); do
            local service_name="${var#HEALTH_}"
            local result="${!var}"
            IFS='|' read -r status details error <<< "$result"
            
            echo ""
            print_info "$service_name:"
            if [ "$status" = "Healthy" ]; then
                print_success "  Status: $status"
            else
                print_error "  Status: $status"
            fi
            
            if [ -n "$details" ]; then
                print_warning "  Details: $details"
            fi
            
            if [ -n "$error" ]; then
                print_error "  Error: $error"
            fi
        done
    fi
}

# Function to show help
show_help() {
    echo ""
    print_info "LocalStack Service Health Monitor"
    print_info "================================="
    echo ""
    print_info "Usage: $0 [command] [options]"
    echo ""
    print_info "Commands:"
    print_success "  check     Perform one-time health check (default)"
    print_success "  monitor   Start continuous monitoring"
    print_success "  status    Show detailed service status"
    print_success "  help      Show this help message"
    echo ""
    print_info "Environment Variables:"
    print_warning "  LOCALSTACK_ENDPOINT     LocalStack endpoint (default: http://localhost:4566)"
    print_warning "  HEALTH_CHECK_TIMEOUT    Health check timeout in seconds (default: 10)"
    print_warning "  MONITOR_INTERVAL        Monitoring interval in seconds (default: 30)"
    print_warning "  DETAILED                Show detailed error information (true/false)"
    echo ""
    print_info "Examples:"
    print_warning "  $0"
    print_warning "  $0 monitor"
    print_warning "  MONITOR_INTERVAL=60 $0 monitor"
    print_warning "  DETAILED=true $0 status"
    echo ""
}

# Main execution
main() {
    local command=${1:-"check"}
    
    case "$command" in
        "check")
            get_service_health_status
            local unhealthy_count
            show_health_summary
            unhealthy_count=$?
            show_recovery_instructions $unhealthy_count
            
            # Exit with error code if any service is unhealthy
            exit $unhealthy_count
            ;;
        "monitor")
            local interval=${2:-$MONITOR_INTERVAL}
            start_health_monitoring "$interval"
            ;;
        "status")
            DETAILED=true
            show_detailed_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"