#!/bin/bash

# CloudWatch Logs Management Utility for LocalStack
# This script provides a unified interface for log streaming, cleanup, and monitoring

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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Function to display usage
show_usage() {
    print_header "CloudWatch Logs Management Utility"
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  stream [LOG_GROUP]     Stream logs from specific log group or all Lambda logs"
    echo "  list                   List all available log groups with storage info"
    echo "  cleanup                Clean up old logs based on retention policies"
    echo "  monitor                Real-time monitoring dashboard for all services"
    echo "  export [LOG_GROUP]     Export logs to file for analysis"
    echo "  health                 Check CloudWatch Logs service health"
    echo ""
    echo "Stream Options:"
    echo "  -f, --follow           Follow log stream in real-time (default)"
    echo "  -s, --since DURATION   Show logs since duration (e.g., 1h, 30m, 10s)"
    echo "  -n, --lines NUMBER     Number of lines to show (default: 100)"
    echo "  -g, --grep PATTERN     Filter logs by pattern"
    echo "  -a, --all              Stream all Lambda function logs simultaneously"
    echo ""
    echo "Cleanup Options:"
    echo "  -d, --days DAYS        Delete logs older than DAYS (default: 7)"
    echo "  -z, --size SIZE_MB     Delete logs if total size exceeds SIZE_MB (default: 100)"
    echo "  --force                Force cleanup without confirmation"
    echo ""
    echo "Export Options:"
    echo "  -o, --output FILE      Output file path (default: logs-export-TIMESTAMP.json)"
    echo "  --format FORMAT        Export format: json, text, csv (default: json)"
    echo ""
    echo "Examples:"
    echo "  $0 stream /aws/lambda/api-handler              # Stream API handler logs"
    echo "  $0 stream -a -g ERROR                          # Stream all Lambda logs, filter errors"
    echo "  $0 cleanup -d 3 --force                        # Force cleanup logs older than 3 days"
    echo "  $0 monitor                                      # Start monitoring dashboard"
    echo "  $0 export /aws/lambda/dynamodb-sync -o sync.json  # Export sync logs to file"
    echo ""
}

# Function to check LocalStack health
check_localstack_health() {
    if ! curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
        print_error "LocalStack is not running or not accessible at http://localhost:4566"
        print_info "Please start LocalStack first using: docker-compose up -d localstack"
        exit 1
    fi
    
    # Check if CloudWatch Logs service is available
    local logs_status=$(curl -s http://localhost:4566/_localstack/health | jq -r '.services.logs // "unavailable"' 2>/dev/null || echo "unavailable")
    
    if [ "$logs_status" != "available" ]; then
        print_error "CloudWatch Logs service is not available in LocalStack"
        print_info "Make sure 'logs' is included in SERVICES environment variable"
        exit 1
    fi
}

# Function to list log groups with enhanced information
list_log_groups_enhanced() {
    print_info "Retrieving CloudWatch Log Groups information..."
    
    # Get log groups with detailed information
    local log_groups_json=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups[].{Name:logGroupName,Retention:retentionInDays,Size:storedBytes,CreationTime:creationTime,StreamCount:metricFilterCount}' \
        --output json 2>/dev/null)
    
    if [ -z "$log_groups_json" ] || [ "$log_groups_json" = "[]" ]; then
        print_warning "No log groups found"
        return 1
    fi
    
    # Calculate totals
    local total_bytes=$(echo "$log_groups_json" | jq -r '[.[].Size // 0] | add')
    local total_mb=$((total_bytes / 1024 / 1024))
    local log_group_count=$(echo "$log_groups_json" | jq length)
    
    print_header "📊 CloudWatch Logs Overview"
    echo "=================================="
    echo "Total log groups: $log_group_count"
    echo "Total storage: ${total_mb}MB"
    echo ""
    
    # Display log groups in a formatted table
    print_header "📋 Log Groups Details:"
    printf "%-50s %-10s %-10s %-15s\n" "Log Group Name" "Size (MB)" "Retention" "Type"
    printf "%-50s %-10s %-10s %-15s\n" "$(printf '%*s' 50 '' | tr ' ' '-')" "$(printf '%*s' 10 '' | tr ' ' '-')" "$(printf '%*s' 10 '' | tr ' ' '-')" "$(printf '%*s' 15 '' | tr ' ' '-')"
    
    echo "$log_groups_json" | jq -r '.[] | 
        "\(.Name) \((.Size // 0) / 1024 / 1024 | floor) \(.Retention // "∞") \(
            if (.Name | startswith("/aws/lambda/")) then "Lambda"
            elif (.Name | startswith("/aws/apigateway/")) then "API Gateway"
            elif (.Name | startswith("/tattoo-directory/")) then "Application"
            else "System"
            end
        )"' | while read -r name size retention type; do
        printf "%-50s %-10s %-10s %-15s\n" "$name" "${size}MB" "$retention" "$type"
    done
    
    echo ""
    
    # Show service distribution
    print_header "🏷️  Service Distribution:"
    echo "$log_groups_json" | jq -r '.[] | 
        if (.Name | startswith("/aws/lambda/")) then "Lambda"
        elif (.Name | startswith("/aws/apigateway/")) then "API Gateway"
        elif (.Name | startswith("/tattoo-directory/")) then "Application"
        else "System"
        end' | sort | uniq -c | while read -r count type; do
        echo "  $type: $count log groups"
    done
    
    echo ""
}

# Function to stream logs with enhanced features
stream_logs_enhanced() {
    local log_group=$1
    local since_option=$2
    local lines_option=$3
    local grep_pattern=$4
    local stream_all=$5
    
    if [ "$stream_all" = "true" ]; then
        print_info "Starting enhanced multi-log streaming..."
        
        # Get all Lambda log groups
        local lambda_groups=$(awslocal logs describe-log-groups \
            --region eu-west-2 \
            --log-group-name-prefix "/aws/lambda/" \
            --query 'logGroups[].logGroupName' \
            --output text 2>/dev/null)
        
        if [ -z "$lambda_groups" ]; then
            print_error "No Lambda log groups found"
            exit 1
        fi
        
        print_success "Found Lambda log groups:"
        echo "$lambda_groups" | tr '\t' '\n' | sed 's/^/  - /'
        echo ""
        
        # Create named pipes for each log group
        local temp_dir="/tmp/log-manager-$$"
        mkdir -p "$temp_dir"
        
        local pids=()
        for group in $lambda_groups; do
            local pipe_file="$temp_dir/$(echo $group | sed 's/\//_/g').pipe"
            mkfifo "$pipe_file"
            
            # Start background log streaming
            (
                local cmd="awslocal logs tail '$group' --region eu-west-2 --follow"
                if [ -n "$since_option" ]; then
                    cmd="$cmd --since $since_option"
                fi
                
                eval "$cmd" | while IFS= read -r line; do
                    echo "[$(date '+%H:%M:%S')] [$group] $line"
                done > "$pipe_file"
            ) &
            
            pids+=($!)
        done
        
        # Function to cleanup
        cleanup_streaming() {
            print_warning "Stopping all log streams..."
            for pid in "${pids[@]}"; do
                kill $pid 2>/dev/null || true
            done
            rm -rf "$temp_dir"
            exit 0
        }
        
        trap cleanup_streaming SIGINT SIGTERM
        
        print_success "Multi-log streaming started. Press Ctrl+C to stop."
        
        # Merge and display all streams
        if [ -n "$grep_pattern" ]; then
            cat "$temp_dir"/*.pipe | grep --color=always "$grep_pattern"
        else
            cat "$temp_dir"/*.pipe
        fi
        
    else
        # Single log group streaming
        print_info "Streaming logs from: $log_group"
        
        local cmd="awslocal logs tail '$log_group' --region eu-west-2 --follow"
        
        if [ -n "$since_option" ]; then
            cmd="$cmd --since $since_option"
        fi
        
        if [ -n "$lines_option" ]; then
            cmd="$cmd --lines $lines_option"
        fi
        
        print_success "Starting log stream (Press Ctrl+C to stop)..."
        
        if [ -n "$grep_pattern" ]; then
            eval "$cmd" | grep --color=always "$grep_pattern"
        else
            eval "$cmd"
        fi
    fi
}

# Function to export logs
export_logs() {
    local log_group=$1
    local output_file=$2
    local format=$3
    
    if [ -z "$output_file" ]; then
        output_file="logs-export-$(date +%Y%m%d-%H%M%S).json"
    fi
    
    print_info "Exporting logs from $log_group to $output_file (format: $format)..."
    
    # Get log events
    local log_events=$(awslocal logs filter-log-events \
        --log-group-name "$log_group" \
        --region eu-west-2 \
        --output json 2>/dev/null)
    
    if [ -z "$log_events" ] || [ "$log_events" = '{"events":[]}' ]; then
        print_warning "No log events found in $log_group"
        return 1
    fi
    
    case $format in
        json)
            echo "$log_events" > "$output_file"
            ;;
        text)
            echo "$log_events" | jq -r '.events[] | "\(.timestamp | strftime("%Y-%m-%d %H:%M:%S")) \(.message)"' > "$output_file"
            ;;
        csv)
            echo "timestamp,message" > "$output_file"
            echo "$log_events" | jq -r '.events[] | "\(.timestamp | strftime("%Y-%m-%d %H:%M:%S")),\"\(.message | gsub("\""; "\"\""))\""' >> "$output_file"
            ;;
        *)
            print_error "Unsupported format: $format"
            return 1
            ;;
    esac
    
    local event_count=$(echo "$log_events" | jq '.events | length')
    print_success "Exported $event_count log events to $output_file"
}

# Function to show monitoring dashboard
show_monitoring_dashboard() {
    print_header "🖥️  CloudWatch Logs Monitoring Dashboard"
    echo "========================================"
    
    while true; do
        clear
        print_header "CloudWatch Logs Real-time Dashboard - $(date)"
        echo ""
        
        # Service health
        local logs_status=$(curl -s http://localhost:4566/_localstack/health | jq -r '.services.logs // "unavailable"' 2>/dev/null || echo "unavailable")
        if [ "$logs_status" = "available" ]; then
            print_success "CloudWatch Logs Service: HEALTHY"
        else
            print_error "CloudWatch Logs Service: UNHEALTHY"
        fi
        
        echo ""
        
        # Storage usage
        local total_bytes=$(awslocal logs describe-log-groups \
            --region eu-west-2 \
            --query 'logGroups[].storedBytes' \
            --output text 2>/dev/null | awk '{sum += $1} END {print sum}')
        local total_mb=$((total_bytes / 1024 / 1024))
        
        echo "📊 Storage Usage: ${total_mb}MB"
        
        # Recent activity (last 5 minutes)
        local recent_activity=$(awslocal logs filter-log-events \
            --region eu-west-2 \
            --start-time $(($(date +%s) * 1000 - 300000)) \
            --query 'events | length(@)' \
            --output text 2>/dev/null || echo "0")
        
        echo "📈 Recent Activity (5min): $recent_activity events"
        
        # Top active log groups
        echo ""
        print_header "🔥 Most Active Log Groups:"
        awslocal logs describe-log-groups \
            --region eu-west-2 \
            --query 'logGroups | sort_by(@, &storedBytes) | reverse(@)[0:5].{Name:logGroupName,Size:storedBytes}' \
            --output table 2>/dev/null || echo "No data available"
        
        echo ""
        echo "Press Ctrl+C to exit dashboard"
        sleep 10
    done
}

# Parse command and options
COMMAND=""
LOG_GROUP=""
SINCE=""
LINES=""
GREP_PATTERN=""
STREAM_ALL=false
CLEANUP_DAYS=7
CLEANUP_SIZE=100
FORCE_CLEANUP=false
OUTPUT_FILE=""
EXPORT_FORMAT="json"

if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1
shift

# Parse options based on command
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            # Follow is default for streaming
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
        -d|--days)
            CLEANUP_DAYS="$2"
            shift 2
            ;;
        -z|--size)
            CLEANUP_SIZE="$2"
            shift 2
            ;;
        --force)
            FORCE_CLEANUP=true
            shift
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --format)
            EXPORT_FORMAT="$2"
            shift 2
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
            if [ -z "$LOG_GROUP" ]; then
                LOG_GROUP="$1"
            fi
            shift
            ;;
    esac
done

# Check LocalStack health
check_localstack_health

# Execute command
case $COMMAND in
    stream)
        if [ "$STREAM_ALL" = true ]; then
            stream_logs_enhanced "" "$SINCE" "$LINES" "$GREP_PATTERN" true
        elif [ -n "$LOG_GROUP" ]; then
            stream_logs_enhanced "$LOG_GROUP" "$SINCE" "$LINES" "$GREP_PATTERN" false
        else
            print_error "No log group specified for streaming"
            show_usage
            exit 1
        fi
        ;;
    list)
        list_log_groups_enhanced
        ;;
    cleanup)
        ./cleanup-logs.sh -d "$CLEANUP_DAYS" -s "$CLEANUP_SIZE" $([ "$FORCE_CLEANUP" = true ] && echo "-f")
        ;;
    monitor)
        show_monitoring_dashboard
        ;;
    export)
        if [ -n "$LOG_GROUP" ]; then
            export_logs "$LOG_GROUP" "$OUTPUT_FILE" "$EXPORT_FORMAT"
        else
            print_error "No log group specified for export"
            show_usage
            exit 1
        fi
        ;;
    health)
        print_success "CloudWatch Logs service is healthy and accessible"
        list_log_groups_enhanced
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac