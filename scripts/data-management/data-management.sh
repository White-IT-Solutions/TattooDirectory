#!/bin/bash

# Data Management Utilities for Tattoo Directory Local Testing
# This script provides easy access to all data management utilities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_SEEDER_DIR="$SCRIPT_DIR/data-seeder"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if LocalStack is running
check_localstack() {
    print_info "Checking LocalStack connectivity..."
    
    if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        print_success "LocalStack is running"
        return 0
    else
        print_error "LocalStack is not running or not accessible"
        print_info "Please start LocalStack with: docker-compose -f docker-compose.local.yml up -d localstack"
        return 1
    fi
}

# Function to run data management command
run_command() {
    local utility=$1
    shift
    local args="$@"
    
    print_info "Running: $utility $args"
    
    cd "$DATA_SEEDER_DIR"
    
    if [ "$utility" = "data-manager" ]; then
        node data-manager.js $args
    elif [ "$utility" = "selective-seeder" ]; then
        node selective-seeder.js $args
    elif [ "$utility" = "data-validator" ]; then
        node data-validator.js $args
    elif [ "$utility" = "data-reset" ]; then
        node data-reset.js $args
    elif [ "$utility" = "data-migration-utility" ]; then
        node data-migration-utility.js $args
    elif [ "$utility" = "data-monitoring-utility" ]; then
        node data-monitoring-utility.js $args
    elif [ "$utility" = "data-sync-utility" ]; then
        node data-sync-utility.js $args
    else
        print_error "Unknown utility: $utility"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "🔧 Data Management Utilities"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  reset <state>              - Reset environment to specific state"
    echo "  seed <scenario>            - Seed data for specific test scenario"
    echo "  validate [type]            - Validate data (files/database/opensearch/consistency/all)"
    echo "  export [path]              - Export current data"
    echo "  import <path>              - Import data from export"
    echo "  backup [name]              - Create backup"
    echo "  restore <backup-key>       - Restore from backup"
    echo "  snapshot <name>            - Create data snapshot"
    echo "  migrate <operation>        - Run data migrations (list/run/run-all/validate/rollback)"
    echo "  monitor [operation]        - Monitor data health (check/monitor/report/alerts)"
    echo "  sync <operation>           - Sync data between services (dynamo-to-os/os-to-dynamo/detect-conflicts)"
    echo "  list-scenarios             - List available test scenarios"
    echo "  list-states                - List available reset states"
    echo "  list-backups               - List available backups"
    echo "  status                     - Show current environment status"
    echo "  help                       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 reset fresh             # Reset to fresh state with full data"
    echo "  $0 seed search-basic       # Seed basic search test data"
    echo "  $0 validate all            # Run all validations"
    echo "  $0 backup daily-backup     # Create named backup"
    echo "  $0 status                  # Check current state"
}

# Function to show environment status
show_status() {
    print_info "Checking environment status..."
    
    if ! check_localstack; then
        return 1
    fi
    
    print_info "Validating current data state..."
    run_command "data-reset" "validate"
    
    print_info "Running consistency check..."
    run_command "data-validator" "consistency"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    local command=$1
    shift
    
    case $command in
        "reset")
            if [ $# -eq 0 ]; then
                print_error "Reset state is required"
                print_info "Available states: clean, fresh, minimal, search-ready, location-test, style-test, performance-test, backup-restore"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-reset" "reset" "$@"
            ;;
        "seed")
            if [ $# -eq 0 ]; then
                print_error "Scenario name is required"
                print_info "Use '$0 list-scenarios' to see available scenarios"
                exit 1
            fi
            check_localstack || exit 1
            run_command "selective-seeder" "seed" "$@"
            ;;
        "validate")
            local type=${1:-"all"}
            check_localstack || exit 1
            run_command "data-validator" "$type"
            ;;
        "export")
            check_localstack || exit 1
            run_command "data-manager" "export" "$@"
            ;;
        "import")
            if [ $# -eq 0 ]; then
                print_error "Import path is required"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-manager" "import" "$@"
            ;;
        "backup")
            check_localstack || exit 1
            run_command "data-manager" "backup" "$@"
            ;;
        "restore")
            if [ $# -eq 0 ]; then
                print_error "Backup key is required"
                print_info "Use '$0 list-backups' to see available backups"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-manager" "restore" "$@"
            ;;
        "snapshot")
            if [ $# -eq 0 ]; then
                print_error "Snapshot name is required"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-reset" "snapshot" "$@"
            ;;
        "list-scenarios")
            run_command "selective-seeder" "list"
            ;;
        "list-states")
            run_command "data-reset" "list"
            ;;
        "list-backups")
            check_localstack || exit 1
            run_command "data-manager" "list-backups"
            ;;
        "migrate")
            if [ $# -eq 0 ]; then
                print_error "Migration name is required"
                print_info "Use 'list' to see available migrations"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-migration-utility" "$@"
            ;;
        "monitor")
            check_localstack || exit 1
            run_command "data-monitoring-utility" "$@"
            ;;
        "sync")
            if [ $# -eq 0 ]; then
                print_error "Sync operation is required"
                print_info "Available operations: dynamo-to-os, os-to-dynamo, detect-conflicts, resolve-conflicts"
                exit 1
            fi
            check_localstack || exit 1
            run_command "data-sync-utility" "$@"
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"