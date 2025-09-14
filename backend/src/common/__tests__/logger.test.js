// logger.test.js - Unit tests for PII-scrubbing logger with correlation ID support

import logger, { scrub, getCorrelationId, createLogger } from '../logger.js';

const { info, warn, error } = logger;

// Mock console.log to capture log output
const originalConsoleLog = console.log;
let logOutput = [];

// Manual mock function
const mockFn = (fn) => {
  const mock = (...args) => {
    mock.calls.push(args);
    return fn ? fn(...args) : undefined;
  };
  mock.calls = [];
  return mock;
};

beforeEach(() => {
  logOutput = [];
  console.log = mockFn((message) => {
    logOutput.push(JSON.parse(message));
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Logger PII Scrubbing', () => {
  describe('scrub function', () => {
    test('should redact PII keys in simple objects', () => {
      const data = {
        artistName: 'John Doe',
        style: 'Traditional',
        email: 'john@example.com',
        location: 'London'
      };

      const scrubbed = scrub(data);

      expect(scrubbed.artistName).toBe('[REDACTED]');
      expect(scrubbed.style).toBe('Traditional');
      expect(scrubbed.email).toBe('[REDACTED]');
      expect(scrubbed.location).toBe('[REDACTED]');
    });

    test('should handle nested objects', () => {
      const data = {
        artist: {
          name: 'Jane Smith',
          instagramHandle: '@janesmith',
          portfolio: {
            images: ['img1.jpg', 'img2.jpg']
          }
        },
        studio: {
          studioLocation: 'Manchester',
          contact: {
            phone: '123-456-7890'
          }
        }
      };

      const scrubbed = scrub(data);

      expect(scrubbed.artist.name).toBe('[REDACTED]');
      expect(scrubbed.artist.instagramHandle).toBe('[REDACTED]');
      expect(scrubbed.artist.portfolio.images).toEqual(['img1.jpg', 'img2.jpg']);
      expect(scrubbed.studio.studioLocation).toBe('[REDACTED]');
      expect(scrubbed.studio.contact.phone).toBe('[REDACTED]');
    });

    test('should handle arrays', () => {
      const data = {
        artists: [
          { artistName: 'Artist 1', style: 'Realism' },
          { artistName: 'Artist 2', style: 'Traditional' }
        ]
      };

      const scrubbed = scrub(data);

      expect(scrubbed.artists[0].artistName).toBe('[REDACTED]');
      expect(scrubbed.artists[0].style).toBe('Realism');
      expect(scrubbed.artists[1].artistName).toBe('[REDACTED]');
      expect(scrubbed.artists[1].style).toBe('Traditional');
    });

    test('should handle DynamoDB keys', () => {
      const data = {
        PK: 'ARTIST#123',
        SK: 'METADATA',
        artistName: 'Test Artist',
        style: 'Blackwork'
      };

      const scrubbed = scrub(data);

      expect(scrubbed.PK).toBe('[REDACTED]');
      expect(scrubbed.SK).toBe('[REDACTED]');
      expect(scrubbed.artistName).toBe('[REDACTED]');
      expect(scrubbed.style).toBe('Blackwork');
    });

    test('should handle OpenSearch credentials', () => {
      const data = {
        master_user_password: 'secret123',
        password: 'another_secret',
        endpoint: 'https://search-domain.us-east-1.es.amazonaws.com'
      };

      const scrubbed = scrub(data);

      expect(scrubbed.master_user_password).toBe('[REDACTED]');
      expect(scrubbed.password).toBe('[REDACTED]');
      expect(scrubbed.endpoint).toBe('https://search-domain.us-east-1.es.amazonaws.com');
    });

    test('should handle null and undefined values', () => {
      expect(scrub(null)).toBe(null);
      expect(scrub(undefined)).toBe(undefined);
      expect(scrub('')).toBe('');
      expect(scrub(0)).toBe(0);
    });

    test('should handle primitive values', () => {
      expect(scrub('test string')).toBe('test string');
      expect(scrub(123)).toBe(123);
      expect(scrub(true)).toBe(true);
    });
  });

  describe('getCorrelationId function', () => {
    test('should use context.correlationId if available', () => {
      const context = { correlationId: 'custom-correlation-id' };
      const event = {};

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('custom-correlation-id');
    });

    test('should use event.requestContext.requestId if available', () => {
      const context = {};
      const event = {
        requestContext: {
          requestId: 'api-gateway-request-id'
        }
      };

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('api-gateway-request-id');
    });

    test('should use context.awsRequestId if available', () => {
      const context = { awsRequestId: 'lambda-request-id' };
      const event = {};

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('lambda-request-id');
    });

    test('should use x-correlation-id header if available', () => {
      const context = {};
      const event = {
        headers: {
          'x-correlation-id': 'header-correlation-id'
        }
      };

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('header-correlation-id');
    });

    test('should use X-Correlation-ID header if available', () => {
      const context = {};
      const event = {
        headers: {
          'X-Correlation-ID': 'header-correlation-id-caps'
        }
      };

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('header-correlation-id-caps');
    });

    test('should generate correlation ID if none available', () => {
      const context = {};
      const event = {};

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toMatch(/^gen-\d+-[a-z0-9]{9}$/);
    });

    test('should prioritize context.correlationId over other sources', () => {
      const context = { 
        correlationId: 'priority-id',
        awsRequestId: 'lambda-id'
      };
      const event = {
        requestContext: { requestId: 'api-id' },
        headers: { 'x-correlation-id': 'header-id' }
      };

      const correlationId = getCorrelationId(context, event);

      expect(correlationId).toBe('priority-id');
    });
  });

  describe('createLogger function', () => {
    test('should create logger with bound correlation ID', () => {
      const context = { awsRequestId: 'test-request-id' };
      const event = {};
      const logger = createLogger(context, event);

      logger.info('Test message', { key: 'value' });

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].correlationId).toBe('test-request-id');
      expect(logOutput[0].level).toBe('INFO');
      expect(logOutput[0].message).toBe('Test message');
    });

    test('should scrub PII in bound logger', () => {
      const context = { correlationId: 'test-correlation' };
      const event = {};
      const logger = createLogger(context, event);

      logger.error('Error occurred', { 
        artistName: 'Sensitive Name',
        errorCode: 'E001'
      });

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].data.artistName).toBe('[REDACTED]');
      expect(logOutput[0].data.errorCode).toBe('E001');
      expect(logOutput[0].correlationId).toBe('test-correlation');
    });

    test('should support debug level in bound logger', () => {
      const context = { awsRequestId: 'debug-bound-test' };
      const event = {};
      const logger = createLogger(context, event);

      logger.debug('Debug message', { debugData: 'value' });

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe('DEBUG');
      expect(logOutput[0].message).toBe('Debug message');
      expect(logOutput[0].correlationId).toBe('debug-bound-test');
      expect(logOutput[0].data.debugData).toBe('value');
    });
  });

  describe('default logger functions', () => {
    test('should log INFO level with correlation ID', () => {
      const context = { awsRequestId: 'info-test-id' };
      const event = {};

      info('Info message', { test: 'data' }, context, event);

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe('INFO');
      expect(logOutput[0].message).toBe('Info message');
      expect(logOutput[0].correlationId).toBe('info-test-id');
      expect(logOutput[0].data.test).toBe('data');
    });

    test('should log WARN level with PII scrubbing', () => {
      const context = {};
      const event = { requestContext: { requestId: 'warn-test-id' } };

      warn('Warning message', { 
        email: 'test@example.com',
        status: 'warning'
      }, context, event);

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe('WARN');
      expect(logOutput[0].message).toBe('Warning message');
      expect(logOutput[0].correlationId).toBe('warn-test-id');
      expect(logOutput[0].data.email).toBe('[REDACTED]');
      expect(logOutput[0].data.status).toBe('warning');
    });

    test('should log ERROR level with timestamp', () => {
      const context = { correlationId: 'error-test-id' };
      const event = {};

      error('Error message', { errorCode: 500 }, context, event);

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe('ERROR');
      expect(logOutput[0].message).toBe('Error message');
      expect(logOutput[0].correlationId).toBe('error-test-id');
      expect(logOutput[0].data.errorCode).toBe(500);
      expect(logOutput[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should generate correlation ID when none provided', () => {
      info('Test message without correlation ID');

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].correlationId).toMatch(/^gen-\d+-[a-z0-9]{9}$/);
    });

    test('should log DEBUG level with correlation ID', () => {
      const context = { correlationId: 'debug-test-id' };
      const event = {};

      logger.debug('Debug message', { debugInfo: 'test' }, context, event);

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe('DEBUG');
      expect(logOutput[0].message).toBe('Debug message');
      expect(logOutput[0].correlationId).toBe('debug-test-id');
      expect(logOutput[0].data.debugInfo).toBe('test');
    });
  });

  describe('structured logging format', () => {
    test('should produce valid JSON output', () => {
      const context = { correlationId: 'json-test' };
      const event = {};

      info('JSON test', { nested: { data: 'value' } }, context, event);

      expect(logOutput).toHaveLength(1);
      expect(typeof logOutput[0]).toBe('object');
      expect(logOutput[0]).toHaveProperty('timestamp');
      expect(logOutput[0]).toHaveProperty('level');
      expect(logOutput[0]).toHaveProperty('message');
      expect(logOutput[0]).toHaveProperty('correlationId');
      expect(logOutput[0]).toHaveProperty('data');
    });

    test('should include all required fields', () => {
      const context = { awsRequestId: 'required-fields-test' };
      const event = {};

      warn('Required fields test', { field1: 'value1' }, context, event);

      const logEntry = logOutput[0];
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.message).toBe('Required fields test');
      expect(logEntry.correlationId).toBe('required-fields-test');
      expect(logEntry.data.field1).toBe('value1');
    });
  });
});