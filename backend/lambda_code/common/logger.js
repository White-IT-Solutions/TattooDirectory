// logger.js

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

function log(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...scrub({ data })
  };
  console.log(JSON.stringify(logEntry));
}

module.exports = {
  info: (message, data) => log('INFO', message, data),
  warn: (message, data) => log('WARN', message, data),
  error: (message, data) => log('ERROR', message, data),
};