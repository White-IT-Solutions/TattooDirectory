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
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# SNS Topic Names
TAKEDOWN_TOPIC_NAME="TakedownRequests"
SYSTEM_ALERTS_TOPIC_NAME="SystemAlerts"
ADMIN_NOTIFICATIONS_TOPIC_NAME="AdminNotifications"

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

# Function to create SNS topic
create_sns_topic() {
    local topic_name=$1
    local description=$2
    
    print_info "Creating SNS topic: $topic_name"
    
    # Create the topic
    local topic_arn=$(awslocal sns create-topic \
        --name "$topic_name" \
        --attributes DisplayName="$description" \
        --query 'TopicArn' \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$topic_arn" != "None" ]; then
        print_success "Created SNS topic: $topic_name (ARN: $topic_arn)"
        
        # Set topic attributes for better debugging
        awslocal sns set-topic-attributes \
            --topic-arn "$topic_arn" \
            --attribute-name DeliveryPolicy \
            --attribute-value '{"http":{"defaultHealthyRetryPolicy":{"minDelayTarget":20,"maxDelayTarget":20,"numRetries":3,"numMaxDelayRetries":0,"numMinDelayRetries":0,"numNoDelayRetries":0,"backoffFunction":"linear"},"disableSubscriptionOverrides":false}}' \
            > /dev/null 2>&1
        
        echo "$topic_arn"
        return 0
    else
        print_error "Failed to create SNS topic: $topic_name"
        return 1
    fi
}

# Function to create Lambda function for notification handling
create_notification_handler() {
    local function_name=$1
    local topic_arn=$2
    local handler_type=$3
    
    print_info "Creating notification handler Lambda: $function_name"
    
    # Create Lambda function code
    local lambda_code_dir="/tmp/lambda-$function_name"
    mkdir -p "$lambda_code_dir"
    
    cat > "$lambda_code_dir/index.js" << EOF
const AWS = require('aws-sdk');

// Configure AWS SDK for LocalStack
const awsConfig = {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test'
};

const cloudWatchLogs = new AWS.CloudWatchLogs(awsConfig);

// Notification handler for $handler_type
exports.handler = async (event) => {
    console.log('Received SNS notification:', JSON.stringify(event, null, 2));
    
    try {
        // Process each SNS record
        for (const record of event.Records || []) {
            if (record.EventSource === 'aws:sns') {
                const message = JSON.parse(record.Sns.Message);
                await processNotification(message, '$handler_type');
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Notifications processed successfully',
                handlerType: '$handler_type'
            })
        };
    } catch (error) {
        console.error('Error processing notification:', error);
        
        // Log error to CloudWatch
        await logError(error, event);
        
        throw error;
    }
};

async function processNotification(message, handlerType) {
    console.log(\`Processing \${handlerType} notification:\`, message);
    
    // Validate message format
    if (!message.type || !message.message || !message.timestamp) {
        throw new Error('Invalid message format: missing required fields');
    }
    
    // Process based on handler type
    switch (handlerType) {
        case 'takedown':
            await processTakedownRequest(message);
            break;
        case 'system-alert':
            await processSystemAlert(message);
            break;
        case 'admin':
            await processAdminNotification(message);
            break;
        default:
            console.warn(\`Unknown handler type: \${handlerType}\`);
    }
}

async function processTakedownRequest(message) {
    console.log('Processing takedown request:', message);
    
    // Validate takedown-specific fields
    if (!message.artistId) {
        throw new Error('Takedown request missing artistId');
    }
    
    // Log takedown request for audit trail
    console.log(\`Takedown request for artist \${message.artistId}: \${message.message}\`);
    
    // In a real implementation, this would:
    // 1. Update artist status in DynamoDB
    // 2. Remove from OpenSearch index
    // 3. Send confirmation email
    // 4. Create audit log entry
}

async function processSystemAlert(message) {
    console.log('Processing system alert:', message);
    
    // Log system alert
    console.log(\`System alert [\${message.severity || 'INFO'}]: \${message.message}\`);
    
    // In a real implementation, this would:
    // 1. Check alert severity
    // 2. Send to monitoring system
    // 3. Escalate if critical
    // 4. Update system status dashboard
}

async function processAdminNotification(message) {
    console.log('Processing admin notification:', message);
    
    // Log admin notification
    console.log(\`Admin notification: \${message.message}\`);
    
    // In a real implementation, this would:
    // 1. Send email to admin team
    // 2. Create admin dashboard notification
    // 3. Log to admin audit trail
}

async function logError(error, event) {
    try {
        const logGroupName = '/aws/lambda/$function_name';
        const logStreamName = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.createLogStream({
                logGroupName,
                logStreamName
            }).promise();
        } catch (e) {
            // Log stream might already exist
        }
        
        // Put log event
        await cloudWatchLogs.putLogEvents({
            logGroupName,
            logStreamName,
            logEvents: [{
                timestamp: Date.now(),
                message: JSON.stringify({
                    error: error.message,
                    stack: error.stack,
                    event: event
                })
            }]
        }).promise();
    } catch (logError) {
        console.error('Failed to log error to CloudWatch:', logError);
    }
}
EOF

    # Create deployment package
    cd "$lambda_code_dir"
    zip -q function.zip index.js
    
    # Create Lambda function
    local function_arn=$(awslocal lambda create-function \
        --function-name "$function_name" \
        --runtime nodejs18.x \
        --role "arn:aws:iam::000000000000:role/lambda-execution-role" \
        --handler index.handler \
        --zip-file fileb://function.zip \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{AWS_ENDPOINT_URL=$AWS_ENDPOINT_URL,AWS_DEFAULT_REGION=$AWS_REGION}" \
        --query 'FunctionArn' \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$function_arn" != "None" ]; then
        print_success "Created Lambda function: $function_name (ARN: $function_arn)"
        
        # Subscribe Lambda to SNS topic
        local subscription_arn=$(awslocal sns subscribe \
            --topic-arn "$topic_arn" \
            --protocol lambda \
            --notification-endpoint "$function_arn" \
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
                > /dev/null 2>&1
            
            print_success "Added SNS invoke permission for Lambda $function_name"
        else
            print_error "Failed to subscribe Lambda $function_name to SNS topic"
            return 1
        fi
    else
        print_error "Failed to create Lambda function: $function_name"
        return 1
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$lambda_code_dir"
    
    return 0
}

# Function to create CloudWatch Log Groups for Lambda functions
create_log_groups() {
    local functions=("takedown-notification-handler" "system-alert-handler" "admin-notification-handler")
    
    for function_name in "${functions[@]}"; do
        local log_group_name="/aws/lambda/$function_name"
        
        print_info "Creating CloudWatch Log Group: $log_group_name"
        
        awslocal logs create-log-group \
            --log-group-name "$log_group_name" \
            --retention-in-days 7 \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Created CloudWatch Log Group: $log_group_name"
        else
            print_warning "CloudWatch Log Group may already exist: $log_group_name"
        fi
    done
}

# Function to test SNS topics
test_sns_topics() {
    print_info "Testing SNS topics..."
    
    # Test takedown request
    local takedown_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, '$TAKEDOWN_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$takedown_arn" ]; then
        awslocal sns publish \
            --topic-arn "$takedown_arn" \
            --message '{"type":"takedown","artistId":"test-artist-123","message":"Test takedown request","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metadata":{"reason":"test","requestedBy":"system"}}' \
            --subject "Test Takedown Request" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to takedown topic"
        else
            print_warning "Failed to send test message to takedown topic"
        fi
    fi
    
    # Test system alert
    local alert_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, '$SYSTEM_ALERTS_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$alert_arn" ]; then
        awslocal sns publish \
            --topic-arn "$alert_arn" \
            --message '{"type":"alert","message":"Test system alert","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","severity":"INFO","metadata":{"component":"sns-test"}}' \
            --subject "Test System Alert" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Test message sent to system alerts topic"
        else
            print_warning "Failed to send test message to system alerts topic"
        fi
    fi
    
    # Test admin notification
    local admin_arn=$(awslocal sns list-topics --query "Topics[?contains(TopicArn, '$ADMIN_NOTIFICATIONS_TOPIC_NAME')].TopicArn" --output text)
    if [ -n "$admin_arn" ]; then
        awslocal sns publish \
            --topic-arn "$admin_arn" \
            --message '{"type":"admin","message":"Test admin notification","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metadata":{"priority":"normal"}}' \
            --subject "Test Admin Notification" \
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
    print_info "Starting SNS topics creation for Enhanced LocalStack Infrastructure..."
    
    # Wait for LocalStack to be ready
    if ! wait_for_localstack; then
        exit 1
    fi
    
    # Create CloudWatch Log Groups first
    create_log_groups
    
    # Create SNS topics and Lambda handlers
    print_info "Creating SNS topics and notification handlers..."
    
    # Create takedown requests topic and handler
    takedown_arn=$(create_sns_topic "$TAKEDOWN_TOPIC_NAME" "Artist takedown requests and content removal notifications")
    if [ $? -eq 0 ]; then
        create_notification_handler "takedown-notification-handler" "$takedown_arn" "takedown"
    fi
    
    # Create system alerts topic and handler
    alert_arn=$(create_sns_topic "$SYSTEM_ALERTS_TOPIC_NAME" "System alerts and monitoring notifications")
    if [ $? -eq 0 ]; then
        create_notification_handler "system-alert-handler" "$alert_arn" "system-alert"
    fi
    
    # Create admin notifications topic and handler
    admin_arn=$(create_sns_topic "$ADMIN_NOTIFICATIONS_TOPIC_NAME" "Administrative notifications and system updates")
    if [ $? -eq 0 ]; then
        create_notification_handler "admin-notification-handler" "$admin_arn" "admin"
    fi
    
    # Test the topics
    sleep 2  # Give Lambda functions time to be ready
    test_sns_topics
    
    print_success "SNS notification system setup completed successfully!"
    print_info "Created topics:"
    print_info "  - $TAKEDOWN_TOPIC_NAME: Artist takedown requests"
    print_info "  - $SYSTEM_ALERTS_TOPIC_NAME: System alerts and monitoring"
    print_info "  - $ADMIN_NOTIFICATIONS_TOPIC_NAME: Administrative notifications"
    print_info ""
    print_info "Created Lambda handlers:"
    print_info "  - takedown-notification-handler: Processes takedown requests"
    print_info "  - system-alert-handler: Processes system alerts"
    print_info "  - admin-notification-handler: Processes admin notifications"
    print_info ""
    print_info "To deploy the actual notification handler code, run:"
    print_info "  Linux/macOS: ./devtools/scripts/deploy-notification-handlers.sh"
    print_info "  Windows: devtools\\scripts\\deploy-notification-handlers.bat"
}

# Execute main function
main "$@"