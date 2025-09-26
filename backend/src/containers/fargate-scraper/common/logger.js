// logger.js - PII-scrubbing structured logger with correlation ID support (CommonJS version)

// Define PII keys based on the Data Protection Policy and data models.
// Using a Set for efficient O(1) lookups.
const piiKeys = new Set([
  // From DPP
  'artistName',
  'artistProfilePicture',
  'instagramHandle',
  'artistBiography',
  'studioLocation',
  // From DynamoDB model and common variations
  'name',
  'location',
  'locationCity',
  'locationCountry',
  'PK', // Can contain artist ID which might be sensitive
  'SK',
  // From OpenSearch credentials
  'master_user_password',
  'password',
  // Other common sensitive keys
  'email',
  'phone',
  'address',
  'secret'
]);

const REDACTION_TEXT = '[REDACTED]';

/**
 * Recursively scrubs an object for keys that match the piiKeys list.
 * It handles nested objects and arrays.
 * @param {any} data - The data to scrub (object, array, or primitive).
 * @returns {any} The scrubbed data.
 */
function scrub(data) {
  if (!data) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => scrub(item));
  }

  if (typeof data === 'object' && data !== null) {
    const scrubbedObject = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (piiKeys.has(key)) {
          scrubbedObject[key] = REDACTION_TEXT;
        } else {
          scrubbedObject[key] = scrub(data[key]);
        }
      }
    }
    return scrubbedObject;
  }

  return data;
}

/**
 * Extracts correlation ID from various sources
 * @param {Object} context - Lambda context or custom context object
 * @param {Object} event - Lambda event object
 * @returns {string} Correlation ID for distributed tracing
 */
function getCorrelationId(context = {}, event = {}) {
  // Try to get correlation ID from various sources in order of preference
  if (context.correlationId) {
    return context.correlationId;
  }
  
  if (event.requestContext?.requestId) {
    return event.requestContext.requestId;
  }
  
  if (context.awsRequestId) {
    return context.awsRequestId;
  }
  
  if (event.headers?.['x-correlation-id']) {
    return event.headers['x-correlation-id'];
  }
  
  if (event.headers?.['X-Correlation-ID']) {
    return event.headers['X-Correlation-ID'];
  }
  
  // Generate a new correlation ID if none found
  return `gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Creates a structured log entry with PII scrubbing and correlation ID
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {Object} context - Lambda context or custom context
 * @param {Object} event - Lambda event object
 */
function log(level, message, data = {}, context = {}, event = {}) {
  const correlationId = getCorrelationId(context, event);
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId,
    ...scrub({ data })
  };
  
  console.log(JSON.stringify(logEntry));
}

/**
 * Creates a logger instance with bound context and event for correlation ID tracking
 * @param {Object} context - Lambda context object
 * @param {Object} event - Lambda event object
 * @returns {Object} Logger instance with bound correlation ID
 */
function createLogger(context = {}, event = {}) {
  return {
    info: (message, data) => log('INFO', message, data, context, event),
    warn: (message, data) => log('WARN', message, data, context, event),
    error: (message, data) => log('ERROR', message, data, context, event),
    debug: (message, data) => log('DEBUG', message, data, context, event),
  };
}

// Default logger instance (backwards compatibility)
const defaultLogger = {
  info: (message, data, context, event) => log('INFO', message, data, context, event),
  warn: (message, data, context, event) => log('WARN', message, data, context, event),
  error: (message, data, context, event) => log('ERROR', message, data, context, event),
  debug: (message, data, context, event) => log('DEBUG', message, data, context, event),
};

module.exports = {
  createLogger,
  scrub,
  getCorrelationId,
  logger: defaultLogger,
  default: defaultLogger
};