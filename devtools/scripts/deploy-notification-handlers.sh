#!/bin/bash

# Deploy Notification Handlers Script
# Deploys the actual notification handler Lambda functions to LocalStack
# Requirements: 1.3, 4.1, 4.2, 4.3, 4.5

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

# Configuration
AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
HANDLERS_DIR="$BACKEND_DIR/src/handlers/notifications"

# Function to check if LocalStack is ready
wait_for_localstack() {
    print_info "Waiting for LocalStack to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${AWS_ENDPOINT_URL}/_localstack/health" > /dev/null 2>&1; then
            print_success "LocalStack is ready"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts - LocalStack not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "LocalStack failed to become ready after $max_attempts attempts"
    return 1
}

# Function to create deployment package for a handler
create_deployment_package() {
    local handler_name=$1
    local handler_file=$2
    
    print_info "Creating deployment package for $handler_name"
    
    # Create temporary directory for deployment package
    local temp_dir="/tmp/lambda-deploy-$handler_name"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Copy handler file
    if [ ! -f "$handler_file" ]; then
        print_error "Handler file not found: $handler_file"
        return 1
    fi
    
    cp "$handler_file" "$temp_dir/index.js"
    
    # Create package.json with AWS SDK dependency
    cat > "$temp_dir/package.json" << EOF
{
  "name": "$handler_name",
  "version": "1.0.0",
  "description": "Notification handler for LocalStack",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/client-cloudwatch-logs": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "aws-sdk": "^2.1000.0"
  }
}
EOF
    
    # Create deployment zip
    cd "$temp_dir"
    zip -q -r function.zip . -x "*.git*" "node_modules/*"
    
    echo "$temp_dir/function.zip"
    return 0
}

# Function to deploy Lambda function
deploy_lambda_function() {
    local function_name=$1
    local handler_file=$2
    local description=$3
    
    print_info "Deploying Lambda function: $function_name"
    
    # Create deployment package
    local zip_file=$(create_deployment_package "$function_name" "$handler_file")
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Check if function already exists
    local existing_function=$(awslocal lambda get-function --function-name "$function_name" 2>/dev/null || echo "")
    
    if [ -n "$existing_function" ]; then
        print_info "Updating existing Lambda function: $function_name"
        
        # Update function code
        awslocal lambda update-function-code \
            --function-name "$function_name" \
            --zip-file "fileb://$zip_file" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Updated Lambda function: $function_name"
        else
            print_error "Failed to update Lambda function: $function_name"
            return 1
        fi
    else
        print_info "Creating new Lambda function: $function_name"
        
        # Create new function
        local function_arn=$(awslocal lambda create-function \
            --function-name "$function_name" \
            --runtime nodejs18.x \
            --role "arn:aws:iam::000000000000:role/lambda-execution-role" \
            --handler index.handler \
            --zip-file "fileb://$zip_file" \
            --timeout 30 \
            --memory-size 256 \
            --description "$description" \
            --environment Variables="{AWS_ENDPOINT_URL=$AWS_ENDPOINT_URL,AWS_DEFAULT_REGION=$AWS_REGION,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" \
            --query 'FunctionArn' \
            --output text 2>/dev/null)
        
        if [ $? -eq 0 ] && [ "$function_arn" != "None" ]; then
            print_success "Created Lambda function: $function_name (ARN: $function_arn)"
        else
            print_error "Failed to create Lambda function: $function_name"
            return 1
        fi
    fi
    
    # Cleanup
    rm -rf "$(dirname "$zip_file")"
    
    return 0
}

# Function to subscribe Lambda to SNS topic
subscribe_to_sns_topic() {
    local function_name=$1
    local topic_name=$2
    
    print_info "Subscribing $function_name to SNS topic $topic_name"
    
    # Get topic ARN
    local topic_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, '$topic_name')].TopicArn" --output text)
    
    if [ -z "$topic_arn" ]; then
        print_error "SNS topic not found: $topic_name"
        return 1
    fi
    
    # Get function ARN
    local function_arn=$(awslocal lambda get-function --function-name "$function_name" --query 'Configuration.FunctionArn' --output text 2>/dev/null)
    
    if [ -z "$function_arn" ]; then
        print_error "Lambda function not found: $function_name"
        return 1
    fi
    
    # Check if subscription already exists
    local existing_subscription=$(awslocal sns list-subscriptions-by-topic --topic-arn "$topic_arn" --query "Subscriptions[?Endpoint=='$function_arn'].SubscriptionArn" --output text)
    
    if [ -n "$existing_subscription" ] && [ "$existing_subscription" != "None" ]; then
        print_success "Subscription already exists for $function_name to $topic_name"
        return 0
    fi
    
    # Create subscription
    local subscription_arn=$(awslocal sns subscribe \
        --topic-arn "$topic_arn" \
        --protocol lambda \
        --notification-endpoint "$function_arn" \
        --query 'SubscriptionArn' \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$subscription_arn" != "None" ]; then
        print_success "Subscribed $function_name to SNS topic $topic_name (Subscription ARN: $subscription_arn)"
        
        # Add permission for SNS to invoke Lambda
        awslocal lambda add-permission \
            --function-name "$function_name" \
            --statement-id "sns-invoke-$function_name-$(date +%s)" \
            --action lambda:InvokeFunction \
            --principal sns.amazonaws.com \
            --source-arn "$topic_arn" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Added SNS invoke permission for $function_name"
        else
            print_warning "Failed to add SNS invoke permission for $function_name (may already exist)"
        fi
    else
        print_error "Failed to subscribe $function_name to SNS topic $topic_name"
        return 1
    fi
    
    return 0
}

# Function to test notification handlers
test_notification_handlers() {
    print_info "Testing notification handlers..."
    
    # Test takedown handler
    local takedown_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, 'TakedownRequests')].TopicArn" --output text)
    if [ -n "$takedown_arn" ]; then
        print_info "Testing takedown notification handler..."
        awslocal sns publish \
            --topic-arn "$takedown_arn" \
            --message '{"type":"takedown","artistId":"test-artist-123","message":"Test takedown request from deployment script","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metadata":{"reason":"test","requestedBy":"deployment-script"}}' \
            --subject "Test Takedown Request - Deployment" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to takedown handler"
        else
            print_warning "Failed to send test message to takedown handler"
        fi
    fi
    
    # Test system alert handler
    local alert_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, 'SystemAlerts')].TopicArn" --output text)
    if [ -n "$alert_arn" ]; then
        print_info "Testing system alert handler..."
        awslocal sns publish \
            --topic-arn "$alert_arn" \
            --message '{"type":"alert","message":"Test system alert from deployment script","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","severity":"INFO","metadata":{"component":"deployment-test"}}' \
            --subject "Test System Alert - Deployment" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to system alert handler"
        else
            print_warning "Failed to send test message to system alert handler"
        fi
    fi
    
    # Test admin notification handler
    local admin_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, 'AdminNotifications')].TopicArn" --output text)
    if [ -n "$admin_arn" ]; then
        print_info "Testing admin notification handler..."
        awslocal sns publish \
            --topic-arn "$admin_arn" \
            --message '{"type":"admin","notificationType":"USER_REPORT","message":"Test admin notification from deployment script","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","severity":"INFO","metadata":{"priority":"normal","source":"deployment-test"}}' \
            --subject "Test Admin Notification - Deployment" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to admin notification handler"
        else
            print_warning "Failed to send test message to admin notification handler"
        fi
    fi
}

# Main execution
main() {
    print_info "Starting notification handlers deployment..."
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    # Check if handlers directory exists
    if [ ! -d "$HANDLERS_DIR" ]; then
        print_error "Handlers directory not found: $HANDLERS_DIR"
        exit 1
    fi
    
    # Wait for LocalStack to be ready
    if ! wait_for_localstack; then
        exit 1
    fi
    
    # Deploy notification handlers
    print_info "Deploying notification handlers from $HANDLERS_DIR"
    
    # Deploy takedown handler
    if [ -f "$HANDLERS_DIR/takedown-handler.js" ]; then
        deploy_lambda_function "takedown-notification-handler" "$HANDLERS_DIR/takedown-handler.js" "Processes artist takedown requests from SNS"
        subscribe_to_sns_topic "takedown-notification-handler" "TakedownRequests"
    else
        print_warning "Takedown handler file not found: $HANDLERS_DIR/takedown-handler.js"
    fi
    
    # Deploy system alert handler
    if [ -f "$HANDLERS_DIR/system-alert-handler.js" ]; then
        deploy_lambda_function "system-alert-handler" "$HANDLERS_DIR/system-alert-handler.js" "Processes system alerts and monitoring notifications from SNS"
        subscribe_to_sns_topic "system-alert-handler" "SystemAlerts"
    else
        print_warning "System alert handler file not found: $HANDLERS_DIR/system-alert-handler.js"
    fi
    
    # Deploy admin notification handler
    if [ -f "$HANDLERS_DIR/admin-notification-handler.js" ]; then
        deploy_lambda_function "admin-notification-handler" "$HANDLERS_DIR/admin-notification-handler.js" "Processes administrative notifications for system events, user reports, and operational alerts"
        subscribe_to_sns_topic "admin-notification-handler" "AdminNotifications"
    else
        print_warning "Admin notification handler file not found: $HANDLERS_DIR/admin-notification-handler.js"
    fi
    
    # Test the handlers
    sleep 3  # Give Lambda functions time to be ready
    test_notification_handlers
    
    print_success "Notification handlers deployment completed successfully!"
    print_info "Deployed handlers:"
    print_info "  - takedown-notification-handler: Processes takedown requests"
    print_info "  - system-alert-handler: Processes system alerts"
    print_info "  - admin-notification-handler: Processes admin notifications"
    print_info ""
    print_info "All handlers are subscribed to their respective SNS topics and ready to process messages."
}

# Execute main function
main "$@"