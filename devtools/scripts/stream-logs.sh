#!/bin/bash

# CloudWatch Logs Streaming Utility for LocalStack
# This script provides real-time log viewing capabilities for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Function to display usage
show_usage() {
    echo "CloudWatch Logs Streaming Utility"
    echo ""
    echo "Usage: $0 [OPTIONS] [LOG_GROUP_NAME]"
    echo ""
    echo "Options:"
    echo "  -l, --list              List all available log groups"
    echo "  -f, --follow            Follow log stream in real-time (default)"
    echo "  -s, --since DURATION    Show logs since duration (e.g., 1h, 30m, 10s)"
    echo "  -n, --lines NUMBER      Number of lines to show (default: 100)"
    echo "  -g, --grep PATTERN      Filter logs by pattern"
    echo "  -a, --all               Stream all Lambda function logs simultaneously"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 /aws/lambda/api-handler                    # Stream API handler logs"
    echo "  $0 -s 1h /aws/lambda/dynamodb-sync          # Show last hour of sync logs"
    echo "  $0 -g ERROR /aws/lambda/api-handler          # Filter for ERROR messages"
    echo "  $0 -a                                        # Stream all Lambda logs"
    echo "  $0 -l                                        # List all log groups"
    echo ""
}

# Function to list all log groups
list_log_groups() {
    print_info "Available CloudWatch Log Groups:"
    
    awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups[].{Name:logGroupName,Retention:retentionInDays,Size:storedBytes}' \
        --output table 2>/dev/null || {
        print_error "Failed to retrieve log groups. Is LocalStack running?"
        exit 1
    }
}

# Function to stream logs from a specific log group
stream_log_group() {
    local log_group=$1
    local since_option=$2
    local lines_option=$3
    local grep_pattern=$4
    
    print_info "Streaming logs from: $log_group"
    
    # Build awslocal command
    local cmd="awslocal logs tail '$log_group' --region eu-west-2"
    
    if [ -n "$since_option" ]; then
        cmd="$cmd --since $since_option"
    fi
    
    if [ -n "$lines_option" ]; then
        cmd="$cmd --lines $lines_option"
    fi
    
    # Always follow by default
    cmd="$cmd --follow"
    
    # Add grep filter if specified
    if [ -n "$grep_pattern" ]; then
        cmd="$cmd | grep --color=always '$grep_pattern'"
    fi
    
    print_success "Starting log stream (Press Ctrl+C to stop)..."
    echo -e "${CYAN}Command: $cmd${NC}"
    echo ""
    
    # Execute the command
    eval $cmd
}

# Function to stream all Lambda logs simultaneously
stream_all_lambda_logs() {
    local since_option=$1
    local grep_pattern=$2
    
    print_info "Starting multi-log streaming for all Lambda functions..."
    
    # Get all Lambda log groups
    local lambda_log_groups=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --log-group-name-prefix "/aws/lambda/" \
        --query 'logGroups[].logGroupName' \
        --output text 2>/dev/null)
    
    if [ -z "$lambda_log_groups" ]; then
        print_error "No Lambda log groups found"
        exit 1
    fi
    
    print_success "Found Lambda log groups:"
    echo "$lambda_log_groups" | tr '\t' '\n' | sed 's/^/  - /'
    echo ""
    
    # Create a temporary directory for log files
    local temp_dir="/tmp/cloudwatch-logs-$$"
    mkdir -p "$temp_dir"
    
    print_info "Streaming logs to temporary files in: $temp_dir"
    
    # Start background processes for each log group
    local pids=()
    for log_group in $lambda_log_groups; do
        local log_file="$temp_dir/$(echo $log_group | sed 's/\//_/g').log"
        local cmd="awslocal logs tail '$log_group' --region eu-west-2 --follow"
        
        if [ -n "$since_option" ]; then
            cmd="$cmd --since $since_option"
        fi
        
        # Start background process
        eval "$cmd" > "$log_file" 2>&1 &
        local pid=$!
        pids+=($pid)
        
        print_success "Started streaming $log_group (PID: $pid)"
    done
    
    # Function to cleanup background processes
    cleanup() {
        print_warning "Stopping all log streams..."
        for pid in "${pids[@]}"; do
            kill $pid 2>/dev/null || true
        done
        rm -rf "$temp_dir"
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    print_success "All log streams started. Use 'tail -f $temp_dir/*.log' to view logs."
    print_info "Press Ctrl+C to stop all streams."
    
    # Monitor the log files
    if [ -n "$grep_pattern" ]; then
        tail -f "$temp_dir"/*.log | grep --color=always "$grep_pattern"
    else
        tail -f "$temp_dir"/*.log
    fi
}

# Parse command line arguments
FOLLOW=true
SINCE=""
LINES=""
GREP_PATTERN=""
LIST_ONLY=false
STREAM_ALL=false
LOG_GROUP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--list)
            LIST_ONLY=true
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -s|--since)
            SINCE="$2"
            shift 2
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -g|--grep)
            GREP_PATTERN="$2"
            shift 2
            ;;
        -a|--all)
            STREAM_ALL=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            LOG_GROUP="$1"
            shift
            ;;
    esac
done

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
    print_error "LocalStack is not running or not accessible at http://localhost:4566"
    print_info "Please start LocalStack first using: docker-compose up -d localstack"
    exit 1
fi

# Execute based on options
if [ "$LIST_ONLY" = true ]; then
    list_log_groups
elif [ "$STREAM_ALL" = true ]; then
    stream_all_lambda_logs "$SINCE" "$GREP_PATTERN"
elif [ -n "$LOG_GROUP" ]; then
    stream_log_group "$LOG_GROUP" "$SINCE" "$LINES" "$GREP_PATTERN"
else
    print_error "No log group specified"
    echo ""
    show_usage
    exit 1
fi