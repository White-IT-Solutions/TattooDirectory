#!/bin/bash

# CloudWatch Logs Cleanup Script for LocalStack
# This script manages local storage usage by cleaning up old logs
# and provides maintenance utilities for log management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
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

# Configuration
DEFAULT_RETENTION_DAYS=7
DEFAULT_MAX_SIZE_MB=100
LOCALSTACK_LOGS_DIR="./devtools/localstack-logs"
TEMP_DIR="/tmp"

# Function to display usage
show_usage() {
    echo "CloudWatch Logs Cleanup Utility"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --days DAYS         Delete logs older than DAYS (default: $DEFAULT_RETENTION_DAYS)"
    echo "  -s, --size SIZE_MB      Delete logs if total size exceeds SIZE_MB (default: $DEFAULT_MAX_SIZE_MB)"
    echo "  -g, --group LOG_GROUP   Clean specific log group only"
    echo "  -f, --force             Force cleanup without confirmation"
    echo "  -r, --report            Show storage usage report only"
    echo "  -a, --all               Clean all logs regardless of retention policy"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d 3                                      # Delete logs older than 3 days"
    echo "  $0 -s 50                                     # Clean if logs exceed 50MB"
    echo "  $0 -g /aws/lambda/api-handler               # Clean specific log group"
    echo "  $0 -r                                       # Show storage report"
    echo "  $0 -f -a                                    # Force clean all logs"
    echo ""
}

# Function to get log storage usage
get_storage_usage() {
    print_info "Analyzing CloudWatch Logs storage usage..."
    
    # Get log groups with storage information
    local log_groups_info=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups[].{Name:logGroupName,Size:storedBytes,Retention:retentionInDays,CreationTime:creationTime}' \
        --output json 2>/dev/null)
    
    if [ -z "$log_groups_info" ] || [ "$log_groups_info" = "[]" ]; then
        print_warning "No log groups found"
        return 1
    fi
    
    # Calculate total storage
    local total_bytes=$(echo "$log_groups_info" | jq -r '[.[].Size // 0] | add')
    local total_mb=$((total_bytes / 1024 / 1024))
    local log_group_count=$(echo "$log_groups_info" | jq length)
    
    echo ""
    echo "📊 CloudWatch Logs Storage Report"
    echo "=================================="
    echo "Total log groups: $log_group_count"
    echo "Total storage: ${total_mb}MB (${total_bytes} bytes)"
    echo ""
    
    # Show top 10 largest log groups
    echo "🔝 Top 10 Largest Log Groups:"
    echo "$log_groups_info" | jq -r '
        sort_by(.Size // 0) | reverse | .[0:10] | 
        .[] | 
        "\(.Name): \((.Size // 0) / 1024 / 1024 | floor)MB (\(.Retention // "∞") day retention)"
    ' | sed 's/^/  /'
    
    echo ""
    return 0
}

# Function to clean logs by age
clean_logs_by_age() {
    local retention_days=$1
    local specific_group=$2
    local force_cleanup=$3
    
    print_info "Cleaning logs older than $retention_days days..."
    
    # Calculate cutoff timestamp (retention_days ago)
    local cutoff_timestamp=$(date -d "$retention_days days ago" +%s)
    local cutoff_millis=$((cutoff_timestamp * 1000))
    
    # Get log groups
    local query_filter=""
    if [ -n "$specific_group" ]; then
        query_filter="--log-group-name-prefix $specific_group"
    fi
    
    local log_groups=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        $query_filter \
        --query 'logGroups[].logGroupName' \
        --output text 2>/dev/null)
    
    if [ -z "$log_groups" ]; then
        print_warning "No log groups found for cleanup"
        return 0
    fi
    
    local cleaned_count=0
    local total_freed_bytes=0
    
    for log_group in $log_groups; do
        print_info "Processing log group: $log_group"
        
        # Get log streams older than cutoff
        local old_streams=$(awslocal logs describe-log-streams \
            --log-group-name "$log_group" \
            --region eu-west-2 \
            --query "logStreams[?lastEventTime < \`$cutoff_millis\`].logStreamName" \
            --output text 2>/dev/null)
        
        if [ -n "$old_streams" ] && [ "$old_streams" != "None" ]; then
            local stream_count=$(echo "$old_streams" | wc -w)
            
            if [ "$force_cleanup" != "true" ]; then
                echo -e "${YELLOW}Found $stream_count old log streams in $log_group${NC}"
                read -p "Delete these streams? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_info "Skipping $log_group"
                    continue
                fi
            fi
            
            # Delete old log streams
            for stream in $old_streams; do
                local stream_size=$(awslocal logs describe-log-streams \
                    --log-group-name "$log_group" \
                    --log-stream-name-prefix "$stream" \
                    --region eu-west-2 \
                    --query 'logStreams[0].storedBytes' \
                    --output text 2>/dev/null || echo "0")
                
                awslocal logs delete-log-stream \
                    --log-group-name "$log_group" \
                    --log-stream-name "$stream" \
                    --region eu-west-2 2>/dev/null || true
                
                total_freed_bytes=$((total_freed_bytes + stream_size))
                cleaned_count=$((cleaned_count + 1))
            done
            
            print_success "Cleaned $stream_count streams from $log_group"
        else
            print_info "No old streams found in $log_group"
        fi
    done
    
    local freed_mb=$((total_freed_bytes / 1024 / 1024))
    print_success "Cleanup completed: $cleaned_count streams deleted, ${freed_mb}MB freed"
}

# Function to clean logs by size
clean_logs_by_size() {
    local max_size_mb=$1
    local force_cleanup=$2
    
    print_info "Checking if logs exceed ${max_size_mb}MB limit..."
    
    # Get current total size
    local total_bytes=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups[].storedBytes' \
        --output text 2>/dev/null | awk '{sum += $1} END {print sum}')
    
    local current_mb=$((total_bytes / 1024 / 1024))
    
    if [ $current_mb -le $max_size_mb ]; then
        print_success "Current usage (${current_mb}MB) is within limit (${max_size_mb}MB)"
        return 0
    fi
    
    print_warning "Current usage (${current_mb}MB) exceeds limit (${max_size_mb}MB)"
    
    # Calculate how much to clean
    local excess_mb=$((current_mb - max_size_mb))
    local target_bytes=$((excess_mb * 1024 * 1024))
    
    print_info "Need to free approximately ${excess_mb}MB"
    
    # Get log groups sorted by size (largest first)
    local log_groups_by_size=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups | sort_by(@, &storedBytes) | reverse(@)[].{Name:logGroupName,Size:storedBytes}' \
        --output json 2>/dev/null)
    
    local freed_bytes=0
    local cleaned_groups=0
    
    echo "$log_groups_by_size" | jq -r '.[] | "\(.Name) \(.Size)"' | while read -r group_name group_size; do
        if [ $freed_bytes -ge $target_bytes ]; then
            break
        fi
        
        local group_mb=$((group_size / 1024 / 1024))
        
        if [ "$force_cleanup" != "true" ]; then
            echo -e "${YELLOW}Clean log group $group_name (${group_mb}MB)?${NC}"
            read -p "Continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                continue
            fi
        fi
        
        # Delete oldest log streams from this group
        local streams=$(awslocal logs describe-log-streams \
            --log-group-name "$group_name" \
            --region eu-west-2 \
            --order-by LastEventTime \
            --query 'logStreams[].logStreamName' \
            --output text 2>/dev/null)
        
        for stream in $streams; do
            if [ $freed_bytes -ge $target_bytes ]; then
                break
            fi
            
            awslocal logs delete-log-stream \
                --log-group-name "$group_name" \
                --log-stream-name "$stream" \
                --region eu-west-2 2>/dev/null || true
            
            freed_bytes=$((freed_bytes + group_size / 10)) # Rough estimate
        done
        
        cleaned_groups=$((cleaned_groups + 1))
        print_success "Cleaned log group: $group_name"
    done
    
    local freed_mb=$((freed_bytes / 1024 / 1024))
    print_success "Size-based cleanup completed: $cleaned_groups groups processed, ~${freed_mb}MB freed"
}

# Function to clean all logs
clean_all_logs() {
    local force_cleanup=$1
    
    print_warning "This will delete ALL CloudWatch logs!"
    
    if [ "$force_cleanup" != "true" ]; then
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleanup cancelled"
            return 0
        fi
    fi
    
    # Get all log groups
    local log_groups=$(awslocal logs describe-log-groups \
        --region eu-west-2 \
        --query 'logGroups[].logGroupName' \
        --output text 2>/dev/null)
    
    local deleted_count=0
    for log_group in $log_groups; do
        awslocal logs delete-log-group \
            --log-group-name "$log_group" \
            --region eu-west-2 2>/dev/null || true
        
        deleted_count=$((deleted_count + 1))
        print_success "Deleted log group: $log_group"
    done
    
    print_success "All logs cleaned: $deleted_count log groups deleted"
}

# Function to clean LocalStack container logs
clean_localstack_container_logs() {
    print_info "Cleaning LocalStack container logs..."
    
    if [ -d "$LOCALSTACK_LOGS_DIR" ]; then
        local log_files=$(find "$LOCALSTACK_LOGS_DIR" -name "*.log" -type f 2>/dev/null || true)
        
        if [ -n "$log_files" ]; then
            local file_count=$(echo "$log_files" | wc -l)
            local total_size=$(du -sh "$LOCALSTACK_LOGS_DIR" 2>/dev/null | cut -f1)
            
            print_info "Found $file_count log files ($total_size) in $LOCALSTACK_LOGS_DIR"
            
            # Clean files older than retention period
            find "$LOCALSTACK_LOGS_DIR" -name "*.log" -type f -mtime +$DEFAULT_RETENTION_DAYS -delete 2>/dev/null || true
            
            # Truncate large files
            find "$LOCALSTACK_LOGS_DIR" -name "*.log" -type f -size +10M -exec truncate -s 1M {} \; 2>/dev/null || true
            
            print_success "LocalStack container logs cleaned"
        else
            print_info "No LocalStack container logs found"
        fi
    else
        print_info "LocalStack logs directory not found: $LOCALSTACK_LOGS_DIR"
    fi
}

# Parse command line arguments
RETENTION_DAYS=$DEFAULT_RETENTION_DAYS
MAX_SIZE_MB=$DEFAULT_MAX_SIZE_MB
SPECIFIC_GROUP=""
FORCE_CLEANUP=false
REPORT_ONLY=false
CLEAN_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -s|--size)
            MAX_SIZE_MB="$2"
            shift 2
            ;;
        -g|--group)
            SPECIFIC_GROUP="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_CLEANUP=true
            shift
            ;;
        -r|--report)
            REPORT_ONLY=true
            shift
            ;;
        -a|--all)
            CLEAN_ALL=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
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
if [ "$REPORT_ONLY" = true ]; then
    get_storage_usage
elif [ "$CLEAN_ALL" = true ]; then
    clean_all_logs "$FORCE_CLEANUP"
else
    # Show current usage
    get_storage_usage
    
    # Clean by age
    clean_logs_by_age "$RETENTION_DAYS" "$SPECIFIC_GROUP" "$FORCE_CLEANUP"
    
    # Clean by size if needed
    clean_logs_by_size "$MAX_SIZE_MB" "$FORCE_CLEANUP"
    
    # Clean LocalStack container logs
    clean_localstack_container_logs
fi

print_success "Log cleanup completed!"