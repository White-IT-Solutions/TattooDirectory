/**
 * Takedown Notification Handler
 * Processes artist takedown requests from SNS
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

/**
 * Lambda handler for takedown notifications
 * @param {Object} event - SNS event containing takedown request
 * @param {Object} context - Lambda context
 * @returns {Object} Response object
 */
exports.handler = async (event, context) => {
    console.log('Takedown handler received event:', JSON.stringify(event, null, 2));
    
    const results = [];
    
    try {
        // Process each SNS record
        for (const record of event.Records || []) {
            if (record.EventSource === 'aws:sns') {
                const result = await processTakedownNotification(record);
                results.push(result);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Takedown notifications processed successfully',
                processedCount: results.length,
                results: results
            })
        };
    } catch (error) {
        console.error('Error processing takedown notifications:', error);
        
        // Log error to CloudWatch
        await logError(error, event, context);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process takedown notifications',
                message: error.message
            })
        };
    }
};

/**
 * Process a single takedown notification
 * @param {Object} record - SNS record
 * @returns {Object} Processing result
 */
async function processTakedownNotification(record) {
    const snsMessage = record.Sns;
    console.log('Processing takedown notification:', snsMessage.Subject);
    
    try {
        // Parse the message
        const message = JSON.parse(snsMessage.Message);
        
        // Validate message format
        validateTakedownMessage(message);
        
        // Process the takedown request
        const result = await processTakedownRequest(message);
        
        console.log('Takedown request processed successfully:', result);
        
        return {
            success: true,
            artistId: message.artistId,
            action: 'takedown_processed',
            timestamp: new Date().toISOString(),
            result: result
        };
        
    } catch (error) {
        console.error('Error processing takedown notification:', error);
        
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            messageId: snsMessage.MessageId
        };
    }
}

/**
 * Validate takedown message format
 * @param {Object} message - Parsed SNS message
 * @throws {Error} If message format is invalid
 */
function validateTakedownMessage(message) {
    const requiredFields = ['type', 'artistId', 'message', 'timestamp'];
    
    for (const field of requiredFields) {
        if (!message[field]) {
            throw new Error(`Invalid takedown message: missing required field '${field}'`);
        }
    }
    
    if (message.type !== 'takedown') {
        throw new Error(`Invalid message type: expected 'takedown', got '${message.type}'`);
    }
    
    // Validate artistId format
    if (typeof message.artistId !== 'string' || message.artistId.length === 0) {
        throw new Error('Invalid artistId: must be a non-empty string');
    }
    
    // Validate timestamp format
    if (!isValidTimestamp(message.timestamp)) {
        throw new Error('Invalid timestamp format');
    }
}

/**
 * Process the takedown request
 * @param {Object} message - Validated takedown message
 * @returns {Object} Processing result
 */
async function processTakedownRequest(message) {
    const { artistId, message: takedownMessage, metadata = {} } = message;
    
    console.log(`Processing takedown request for artist ${artistId}: ${takedownMessage}`);
    
    // In a real implementation, this would:
    // 1. Update artist status in DynamoDB to 'removed' or 'takedown_requested'
    // 2. Remove artist from OpenSearch index
    // 3. Send confirmation notification
    // 4. Create audit log entry
    
    const actions = [];
    
    try {
        // 1. Update artist status in DynamoDB
        const updateResult = await updateArtistStatus(artistId, 'takedown_requested', {
            takedownReason: takedownMessage,
            takedownTimestamp: message.timestamp,
            requestedBy: metadata.requestedBy || 'system',
            originalStatus: metadata.originalStatus || 'active'
        });
        
        actions.push({
            action: 'update_artist_status',
            success: true,
            result: updateResult
        });
        
        // 2. Create audit log entry
        const auditResult = await createAuditLogEntry({
            entityType: 'artist',
            entityId: artistId,
            action: 'takedown_requested',
            details: {
                reason: takedownMessage,
                requestedBy: metadata.requestedBy || 'system',
                timestamp: message.timestamp
            }
        });
        
        actions.push({
            action: 'create_audit_log',
            success: true,
            result: auditResult
        });
        
        console.log(`Takedown request processed successfully for artist ${artistId}`);
        
        return {
            artistId: artistId,
            status: 'takedown_requested',
            actions: actions,
            processedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error processing takedown for artist ${artistId}:`, error);
        
        actions.push({
            action: 'error',
            success: false,
            error: error.message
        });
        
        throw new Error(`Failed to process takedown for artist ${artistId}: ${error.message}`);
    }
}

/**
 * Update artist status in DynamoDB
 * @param {string} artistId - Artist ID
 * @param {string} status - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Update result
 */
async function updateArtistStatus(artistId, status, metadata = {}) {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'TattooArtistDirectory';
    
    const params = {
        TableName: tableName,
        Key: {
            PK: `ARTIST#${artistId}`,
            SK: `ARTIST#${artistId}`
        },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #takedownMetadata = :metadata',
        ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
            '#takedownMetadata': 'takedownMetadata'
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString(),
            ':metadata': metadata
        },
        ReturnValues: 'ALL_NEW'
    };
    
    try {
        const result = await dynamodb.update(params).promise();
        console.log(`Updated artist ${artistId} status to ${status}`);
        return result.Attributes;
    } catch (error) {
        console.error(`Failed to update artist ${artistId} status:`, error);
        throw error;
    }
}

/**
 * Create audit log entry
 * @param {Object} auditData - Audit log data
 * @returns {Object} Audit log entry
 */
async function createAuditLogEntry(auditData) {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'TattooArtistDirectory';
    const auditId = `AUDIT#${Date.now()}#${Math.random().toString(36).substr(2, 9)}`;
    
    const auditEntry = {
        PK: auditId,
        SK: auditId,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        action: auditData.action,
        details: auditData.details,
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
    };
    
    const params = {
        TableName: tableName,
        Item: auditEntry
    };
    
    try {
        await dynamodb.put(params).promise();
        console.log(`Created audit log entry: ${auditId}`);
        return auditEntry;
    } catch (error) {
        console.error('Failed to create audit log entry:', error);
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
        const logGroupName = '/aws/lambda/takedown-notification-handler';
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