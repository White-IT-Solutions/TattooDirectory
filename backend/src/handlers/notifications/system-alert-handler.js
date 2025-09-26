/**
 * System Alert Notification Handler
 * Processes system alerts and monitoring notifications from SNS
 * Requirements: 1.3, 4.1, 4.2, 4.3, 4.5
 */

const AWS = require('aws-sdk');

// Configure AWS SDK for LocalStack
const awsConfig = {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
};

const dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);
const cloudWatchLogs = new AWS.CloudWatchLogs(awsConfig);
const cloudWatch = new AWS.CloudWatch(awsConfig);

/**
 * Lambda handler for system alert notifications
 * @param {Object} event - SNS event containing system alert
 * @param {Object} context - Lambda context
 * @returns {Object} Response object
 */
exports.handler = async (event, context) => {
    console.log('System alert handler received event:', JSON.stringify(event, null, 2));
    
    const results = [];
    
    try {
        // Process each SNS record
        for (const record of event.Records || []) {
            if (record.EventSource === 'aws:sns') {
                const result = await processSystemAlert(record);
                results.push(result);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'System alerts processed successfully',
                processedCount: results.length,
                results: results
            })
        };
    } catch (error) {
        console.error('Error processing system alerts:', error);
        
        // Log error to CloudWatch
        await logError(error, event, context);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process system alerts',
                message: error.message
            })
        };
    }
};

/**
 * Process a single system alert notification
 * @param {Object} record - SNS record
 * @returns {Object} Processing result
 */
async function processSystemAlert(record) {
    const snsMessage = record.Sns;
    console.log('Processing system alert:', snsMessage.Subject);
    
    try {
        // Parse the message
        const message = JSON.parse(snsMessage.Message);
        
        // Validate message format
        validateAlertMessage(message);
        
        // Process the system alert
        const result = await processAlert(message);
        
        console.log('System alert processed successfully:', result);
        
        return {
            success: true,
            alertType: message.type,
            severity: message.severity || 'INFO',
            action: 'alert_processed',
            timestamp: new Date().toISOString(),
            result: result
        };
        
    } catch (error) {
        console.error('Error processing system alert:', error);
        
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            messageId: snsMessage.MessageId
        };
    }
}

/**
 * Validate system alert message format
 * @param {Object} message - Parsed SNS message
 * @throws {Error} If message format is invalid
 */
function validateAlertMessage(message) {
    const requiredFields = ['type', 'message', 'timestamp'];
    
    for (const field of requiredFields) {
        if (!message[field]) {
            throw new Error(`Invalid alert message: missing required field '${field}'`);
        }
    }
    
    if (message.type !== 'alert') {
        throw new Error(`Invalid message type: expected 'alert', got '${message.type}'`);
    }
    
    // Validate severity level if provided
    if (message.severity) {
        const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
        if (!validSeverities.includes(message.severity)) {
            throw new Error(`Invalid severity level: ${message.severity}. Must be one of: ${validSeverities.join(', ')}`);
        }
    }
    
    // Validate timestamp format
    if (!isValidTimestamp(message.timestamp)) {
        throw new Error('Invalid timestamp format');
    }
}

/**
 * Process the system alert
 * @param {Object} message - Validated alert message
 * @returns {Object} Processing result
 */
async function processAlert(message) {
    const { message: alertMessage, severity = 'INFO', metadata = {} } = message;
    
    console.log(`Processing system alert [${severity}]: ${alertMessage}`);
    
    const actions = [];
    
    try {
        // 1. Store alert in DynamoDB for audit trail
        const storeResult = await storeAlert(message);
        actions.push({
            action: 'store_alert',
            success: true,
            result: storeResult
        });
        
        // 2. Send metrics to CloudWatch
        const metricsResult = await sendAlertMetrics(message);
        actions.push({
            action: 'send_metrics',
            success: true,
            result: metricsResult
        });
        
        // 3. Handle severity-specific actions
        if (severity === 'CRITICAL' || severity === 'HIGH') {
            const escalationResult = await handleHighSeverityAlert(message);
            actions.push({
                action: 'escalate_alert',
                success: true,
                result: escalationResult
            });
        }
        
        // 4. Update system status if needed
        if (metadata.component) {
            const statusResult = await updateComponentStatus(metadata.component, severity, alertMessage);
            actions.push({
                action: 'update_component_status',
                success: true,
                result: statusResult
            });
        }
        
        console.log(`System alert processed successfully: ${alertMessage}`);
        
        return {
            alertId: storeResult.alertId,
            severity: severity,
            actions: actions,
            processedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error processing system alert: ${alertMessage}`, error);
        
        actions.push({
            action: 'error',
            success: false,
            error: error.message
        });
        
        throw new Error(`Failed to process system alert: ${error.message}`);
    }
}

/**
 * Store alert in DynamoDB
 * @param {Object} message - Alert message
 * @returns {Object} Storage result
 */
async function storeAlert(message) {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'TattooArtistDirectory';
    const alertId = `ALERT#${Date.now()}#${Math.random().toString(36).substr(2, 9)}`;
    
    const alertEntry = {
        PK: alertId,
        SK: alertId,
        type: 'system_alert',
        severity: message.severity || 'INFO',
        message: message.message,
        component: message.metadata?.component || 'unknown',
        timestamp: message.timestamp,
        metadata: message.metadata || {},
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };
    
    const params = {
        TableName: tableName,
        Item: alertEntry
    };
    
    try {
        await dynamodb.put(params).promise();
        console.log(`Stored system alert: ${alertId}`);
        return { alertId, stored: true };
    } catch (error) {
        console.error('Failed to store system alert:', error);
        throw error;
    }
}

/**
 * Send alert metrics to CloudWatch
 * @param {Object} message - Alert message
 * @returns {Object} Metrics result
 */
async function sendAlertMetrics(message) {
    const severity = message.severity || 'INFO';
    const component = message.metadata?.component || 'unknown';
    
    const params = {
        Namespace: 'TattooDirectory/Alerts',
        MetricData: [
            {
                MetricName: 'AlertCount',
                Dimensions: [
                    {
                        Name: 'Severity',
                        Value: severity
                    },
                    {
                        Name: 'Component',
                        Value: component
                    }
                ],
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date()
            }
        ]
    };
    
    try {
        await cloudWatch.putMetricData(params).promise();
        console.log(`Sent alert metrics for ${severity} alert from ${component}`);
        return { metricsSent: true, severity, component };
    } catch (error) {
        console.error('Failed to send alert metrics:', error);
        throw error;
    }
}

/**
 * Handle high severity alerts with escalation
 * @param {Object} message - Alert message
 * @returns {Object} Escalation result
 */
async function handleHighSeverityAlert(message) {
    const { severity, message: alertMessage, metadata = {} } = message;
    
    console.log(`Escalating ${severity} severity alert: ${alertMessage}`);
    
    // In a real implementation, this would:
    // 1. Send immediate notifications to on-call team
    // 2. Create incident in incident management system
    // 3. Trigger automated remediation if available
    // 4. Update status page if customer-facing
    
    const escalationActions = [];
    
    // Log escalation
    escalationActions.push({
        action: 'log_escalation',
        severity: severity,
        message: alertMessage,
        timestamp: new Date().toISOString()
    });
    
    // For CRITICAL alerts, simulate immediate response
    if (severity === 'CRITICAL') {
        escalationActions.push({
            action: 'immediate_notification',
            target: 'on_call_team',
            message: `CRITICAL ALERT: ${alertMessage}`,
            timestamp: new Date().toISOString()
        });
        
        // Create incident record
        const incidentId = await createIncident(message);
        escalationActions.push({
            action: 'create_incident',
            incidentId: incidentId,
            timestamp: new Date().toISOString()
        });
    }
    
    return {
        escalated: true,
        severity: severity,
        actions: escalationActions
    };
}

/**
 * Create incident record for critical alerts
 * @param {Object} message - Alert message
 * @returns {string} Incident ID
 */
async function createIncident(message) {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'TattooArtistDirectory';
    const incidentId = `INCIDENT#${Date.now()}#${Math.random().toString(36).substr(2, 9)}`;
    
    const incidentEntry = {
        PK: incidentId,
        SK: incidentId,
        type: 'incident',
        status: 'open',
        severity: message.severity,
        title: `System Alert: ${message.message}`,
        description: message.message,
        component: message.metadata?.component || 'unknown',
        createdAt: new Date().toISOString(),
        alertTimestamp: message.timestamp,
        metadata: message.metadata || {}
    };
    
    const params = {
        TableName: tableName,
        Item: incidentEntry
    };
    
    try {
        await dynamodb.put(params).promise();
        console.log(`Created incident: ${incidentId}`);
        return incidentId;
    } catch (error) {
        console.error('Failed to create incident:', error);
        throw error;
    }
}

/**
 * Update component status based on alert
 * @param {string} component - Component name
 * @param {string} severity - Alert severity
 * @param {string} message - Alert message
 * @returns {Object} Status update result
 */
async function updateComponentStatus(component, severity, message) {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'TattooArtistDirectory';
    const statusId = `STATUS#${component}`;
    
    // Determine component status based on severity
    let status = 'operational';
    if (severity === 'CRITICAL') {
        status = 'major_outage';
    } else if (severity === 'HIGH') {
        status = 'partial_outage';
    } else if (severity === 'MEDIUM') {
        status = 'degraded_performance';
    }
    
    const params = {
        TableName: tableName,
        Key: {
            PK: statusId,
            SK: statusId
        },
        UpdateExpression: 'SET #status = :status, #lastAlert = :lastAlert, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
            '#lastAlert': 'lastAlert',
            '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':lastAlert': message,
            ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
    };
    
    try {
        const result = await dynamodb.update(params).promise();
        console.log(`Updated ${component} status to ${status}`);
        return { component, status, updated: true };
    } catch (error) {
        console.error(`Failed to update ${component} status:`, error);
        throw error;
    }
}

/**
 * Log error to CloudWatch
 * @param {Error} error - Error object
 * @param {Object} event - Lambda event
 * @param {Object} context - Lambda context
 */
async function logError(error, event, context) {
    try {
        const logGroupName = '/aws/lambda/system-alert-handler';
        const logStreamName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${context.awsRequestId}`;
        
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
                    level: 'ERROR',
                    message: error.message,
                    stack: error.stack,
                    event: event,
                    context: {
                        functionName: context.functionName,
                        functionVersion: context.functionVersion,
                        awsRequestId: context.awsRequestId
                    }
                })
            }]
        }).promise();
        
        console.log('Error logged to CloudWatch');
    } catch (logError) {
        console.error('Failed to log error to CloudWatch:', logError);
    }
}

/**
 * Validate timestamp format
 * @param {string} timestamp - Timestamp string
 * @returns {boolean} True if valid
 */
function isValidTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime());
}