#!/bin/bash

# SNS Topics Creation Script for Enhanced LocalStack Infrastructure
# Creates SNS topics for takedown requests, system alerts, and admin notifications
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
AWS_REGION=${AWS_DEFAULT_REGION:-eu-west-2}

# SNS Topic Names
TAKEDOWN_TOPIC_NAME="TakedownRequests"
SYSTEM_ALERTS_TOPIC_NAME="SystemAlerts"
ADMIN_NOTIFICATIONS_TOPIC_NAME="AdminNotifications"

# Function to create SNS topic
create_sns_topic() {
    local topic_name=$1
    local description=$2
    
    print_info "Creating SNS topic: $topic_name"
    
    # Create the topic
    local topic_arn=$(awslocal sns create-topic \
        --name "$topic_name" \
        --attributes DisplayName="$description" \
        --region "$AWS_REGION" \
        --query 'TopicArn' \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$topic_arn" != "None" ]; then
        print_success "Created SNS topic: $topic_name (ARN: $topic_arn)"
        
        # Set topic attributes for better debugging
        awslocal sns set-topic-attributes \
            --topic-arn "$topic_arn" \
            --attribute-name DeliveryPolicy \
            --attribute-value '{"http":{"defaultHealthyRetryPolicy":{"minDelayTarget":20,"maxDelayTarget":20,"numRetries":3,"numMaxDelayRetries":0,"numMinDelayRetries":0,"numNoDelayRetries":0,"backoffFunction":"linear"},"disableSubscriptionOverrides":false}}' \
            --region "$AWS_REGION" \
            > /dev/null 2>&1
        
        echo "$topic_arn"
        return 0
    else
        print_error "Failed to create SNS topic: $topic_name"
        return 1
    fi
}

# Function to subscribe Lambda functions to SNS topics
subscribe_lambda_to_topic() {
    local function_name=$1
    local topic_arn=$2
    
    print_info "Subscribing Lambda $function_name to SNS topic"
    
    # Get Lambda function ARN
    local function_arn=$(awslocal lambda get-function \
        --function-name "$function_name" \
        --region "$AWS_REGION" \
        --query 'Configuration.FunctionArn' \
        --output text 2>/dev/null)
    
    if [ $? -ne 0 ] || [ "$function_arn" = "None" ]; then
        print_warning "Lambda function $function_name not found, skipping subscription"
        return 1
    fi
    
    # Subscribe Lambda to SNS topic
    local subscription_arn=$(awslocal sns subscribe \
        --topic-arn "$topic_arn" \
        --protocol lambda \
        --notification-endpoint "$function_arn" \
        --region "$AWS_REGION" \
        --query 'SubscriptionArn' \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$subscription_arn" != "None" ]; then
        print_success "Subscribed Lambda $function_name to SNS topic (Subscription ARN: $subscription_arn)"
        
        # Add permission for SNS to invoke Lambda
        awslocal lambda add-permission \
            --function-name "$function_name" \
            --statement-id "sns-invoke-$function_name" \
            --action lambda:InvokeFunction \
            --principal sns.amazonaws.com \
            --source-arn "$topic_arn" \
            --region "$AWS_REGION" \
            > /dev/null 2>&1
        
        print_success "Added SNS invoke permission for Lambda $function_name"
        return 0
    else
        print_error "Failed to subscribe Lambda $function_name to SNS topic"
        return 1
    fi
}

# Function to test SNS topics
test_sns_topics() {
    print_info "Testing SNS topics..."
    
    # Test takedown request
    local takedown_arn=$(awslocal sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, '$TAKEDOWN_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$takedown_arn" ]; then
        awslocal sns publish \
            --topic-arn "$takedown_arn" \
            --message '{"type":"takedown","artistId":"test-artist-123","message":"Test takedown request","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metadata":{"reason":"test","requestedBy":"system"}}' \
            --subject "Test Takedown Request" \
            --region "$AWS_REGION" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to takedown topic"
        else
            print_warning "Failed to send test message to takedown topic"
        fi
    fi
    
    # Test system alert
    local alert_arn=$(awslocal sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, '$SYSTEM_ALERTS_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$alert_arn" ]; then
        awslocal sns publish \
            --topic-arn "$alert_arn" \
            --message '{"type":"alert","message":"Test system alert","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","severity":"INFO","metadata":{"component":"sns-test"}}' \
            --subject "Test System Alert" \
            --region "$AWS_REGION" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to system alerts topic"
        else
            print_warning "Failed to send test message to system alerts topic"
        fi
    fi
    
    # Test admin notification
    local admin_arn=$(awslocal sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, '$ADMIN_NOTIFICATIONS_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$admin_arn" ]; then
        awslocal sns publish \
            --topic-arn "$admin_arn" \
            --message '{"type":"admin","message":"Test admin notification","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metadata":{"priority":"normal"}}' \
            --subject "Test Admin Notification" \
            --region "$AWS_REGION" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to admin notifications topic"
        else
            print_warning "Failed to send test message to admin notifications topic"
        fi
    fi
}

# Main execution
main() {
    print_info "Creating SNS topics for Enhanced LocalStack Infrastructure..."
    
    # Create SNS topics
    print_info "Creating SNS topics..."
    
    # Create takedown requests topic
    takedown_arn=$(create_sns_topic "$TAKEDOWN_TOPIC_NAME" "Artist takedown requests and content removal notifications")
    if [ $? -eq 0 ]; then
        subscribe_lambda_to_topic "takedown-handler" "$takedown_arn"
    fi
    
    # Create system alerts topic
    alert_arn=$(create_sns_topic "$SYSTEM_ALERTS_TOPIC_NAME" "System alerts and monitoring notifications")
    if [ $? -eq 0 ]; then
        subscribe_lambda_to_topic "system-alert-handler" "$alert_arn"
    fi
    
    # Create admin notifications topic
    admin_arn=$(create_sns_topic "$ADMIN_NOTIFICATIONS_TOPIC_NAME" "Administrative notifications and system updates")
    if [ $? -eq 0 ]; then
        subscribe_lambda_to_topic "admin-notification-handler" "$admin_arn"
    fi
    
    # Test the topics
    sleep 2  # Give Lambda functions time to be ready
    test_sns_topics
    
    # Save SNS configuration
    cat > /tmp/sns-topics-config.json << EOF
{
    "topics": {
        "takedown": "$takedown_arn",
        "systemAlerts": "$alert_arn", 
        "adminNotifications": "$admin_arn"
    },
    "region": "$AWS_REGION",
    "endpoint": "$AWS_ENDPOINT_URL"
}
EOF
    
    print_success "SNS notification system setup completed successfully!"
    print_info "Created topics:"
    print_info "  - $TAKEDOWN_TOPIC_NAME: Artist takedown requests"
    print_info "  - $SYSTEM_ALERTS_TOPIC_NAME: System alerts and monitoring"
    print_info "  - $ADMIN_NOTIFICATIONS_TOPIC_NAME: Administrative notifications"
    print_info ""
    print_info "Configuration saved to /tmp/sns-topics-config.json"
}

# Execute main function
main "$@"