#!/usr/bin/env node

/**
 * Advanced Request/Response Logging and Debugging Tools
 * 
 * Provides comprehensive logging and debugging capabilities:
 * - Structured request/response logging
 * - Performance monitoring
 * - Error tracking and analysis
 * - Request replay functionality
 * - Debug session recording
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class DebugLogger extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logLevel = options.logLevel || 'info';
        this.logFile = options.logFile || path.join(process.cwd(), 'logs/debug.log');
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = options.maxLogFiles || 5;
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile !== false;
        this.enableMetrics = options.enableMetrics !== false;
        
        this.requestHistory = [];
        this.errorHistory = [];
        this.performanceMetrics = {
            requests: 0,
            errors: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowestRequest: null,
            fastestRequest: null
        };
        
        this.logLevels = {
            trace: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4,
            fatal: 5
        };
        
        this.colors = {
            trace: '\x1b[37m',    // white
            debug: '\x1b[36m',    // cyan
            info: '\x1b[32m',     // green
            warn: '\x1b[33m',     // yellow
            error: '\x1b[31m',    // red
            fatal: '\x1b[35m',    // magenta
            reset: '\x1b[0m'
        };
        
        this.setupLogDirectory();
    }

    /**
     * Setup log directory
     */
    async setupLogDirectory() {
        const logDir = path.dirname(this.logFile);
        try {
            await fs.mkdir(logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error.message);
        }
    }

    /**
     * Log a message with specified level
     */
    async log(level, message, data = {}) {
        if (this.logLevels[level] < this.logLevels[this.logLevel]) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            data,
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        // Emit event for listeners
        this.emit('log', logEntry);

        // Console output
        if (this.enableConsole) {
            this.writeToConsole(logEntry);
        }

        // File output
        if (this.enableFile) {
            await this.writeToFile(logEntry);
        }
    }

    /**
     * Write log entry to console
     */
    writeToConsole(logEntry) {
        const color = this.colors[logEntry.level.toLowerCase()] || this.colors.info;
        const timestamp = logEntry.timestamp.substring(11, 23);
        
        let output = `${color}[${timestamp}] ${logEntry.level.padEnd(5)} ${logEntry.message}${this.colors.reset}`;
        
        if (Object.keys(logEntry.data).length > 0) {
            output += `\n${JSON.stringify(logEntry.data, null, 2)}`;
        }
        
        console.log(output);
    }

    /**
     * Write log entry to file
     */
    async writeToFile(logEntry) {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            
            // Check file size and rotate if necessary
            await this.rotateLogIfNeeded();
            
            await fs.appendFile(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Rotate log file if it exceeds max size
     */
    async rotateLogIfNeeded() {
        try {
            const stats = await fs.stat(this.logFile);
            
            if (stats.size > this.maxLogSize) {
                // Rotate existing files
                for (let i = this.maxLogFiles - 1; i > 0; i--) {
                    const oldFile = `${this.logFile}.${i}`;
                    const newFile = `${this.logFile}.${i + 1}`;
                    
                    try {
                        await fs.rename(oldFile, newFile);
                    } catch (error) {
                        // File doesn't exist, continue
                    }
                }
                
                // Move current log to .1
                await fs.rename(this.logFile, `${this.logFile}.1`);
            }
        } catch (error) {
            // Log file doesn't exist yet, no rotation needed
        }
    }

    /**
     * Log request details
     */
    async logRequest(req, requestId) {
        const requestData = {
            requestId,
            method: req.method,
            url: req.url,
            path: req.path,
            query: req.query,
            headers: this.sanitizeHeaders(req.headers),
            body: this.sanitizeBody(req.body),
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            contentLength: req.get('Content-Length'),
            contentType: req.get('Content-Type')
        };

        await this.log('info', `Incoming request: ${req.method} ${req.path}`, requestData);
        
        // Store in history
        this.requestHistory.push({
            ...requestData,
            timestamp: new Date().toISOString(),
            type: 'request'
        });
        
        // Limit history size
        if (this.requestHistory.length > 1000) {
            this.requestHistory = this.requestHistory.slice(-1000);
        }
    }

    /**
     * Log response details
     */
    async logResponse(res, requestId, responseTime, responseData = null) {
        const responseInfo = {
            requestId,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: this.sanitizeHeaders(res.getHeaders()),
            responseTime: `${responseTime}ms`,
            contentLength: res.get('Content-Length'),
            contentType: res.get('Content-Type')
        };

        if (responseData) {
            responseInfo.body = this.sanitizeBody(responseData);
        }

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        await this.log(level, `Response sent: ${res.statusCode} (${responseTime}ms)`, responseInfo);
        
        // Update performance metrics
        if (this.enableMetrics) {
            this.updatePerformanceMetrics(responseTime, res.statusCode);
        }
        
        // Store in history
        this.requestHistory.push({
            ...responseInfo,
            timestamp: new Date().toISOString(),
            type: 'response'
        });
    }

    /**
     * Log error details
     */
    async logError(error, requestId = null, context = {}) {
        const errorData = {
            requestId,
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode,
            context
        };

        await this.log('error', `Error occurred: ${error.message}`, errorData);
        
        // Store in error history
        this.errorHistory.push({
            ...errorData,
            timestamp: new Date().toISOString()
        });
        
        // Limit error history size
        if (this.errorHistory.length > 500) {
            this.errorHistory = this.errorHistory.slice(-500);
        }
        
        // Update error metrics
        if (this.enableMetrics) {
            this.performanceMetrics.errors++;
        }
    }

    /**
     * Log performance metrics
     */
    async logPerformance(operation, duration, metadata = {}) {
        const performanceData = {
            operation,
            duration: `${duration}ms`,
            metadata
        };

        await this.log('debug', `Performance: ${operation} took ${duration}ms`, performanceData);
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(responseTime, statusCode) {
        this.performanceMetrics.requests++;
        this.performanceMetrics.totalResponseTime += responseTime;
        this.performanceMetrics.averageResponseTime = 
            Math.round(this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests);

        if (!this.performanceMetrics.slowestRequest || 
            responseTime > this.performanceMetrics.slowestRequest.responseTime) {
            this.performanceMetrics.slowestRequest = {
                responseTime,
                statusCode,
                timestamp: new Date().toISOString()
            };
        }

        if (!this.performanceMetrics.fastestRequest || 
            responseTime < this.performanceMetrics.fastestRequest.responseTime) {
            this.performanceMetrics.fastestRequest = {
                responseTime,
                statusCode,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Create Express middleware for automatic logging
     */
    createMiddleware() {
        return (req, res, next) => {
            const requestId = this.generateRequestId();
            const startTime = Date.now();
            
            // Add request ID to request object
            req.requestId = requestId;
            
            // Log incoming request
            this.logRequest(req, requestId);
            
            // Override res.json to capture response data
            const originalJson = res.json;
            res.json = (data) => {
                const responseTime = Date.now() - startTime;
                this.logResponse(res, requestId, responseTime, data);
                return originalJson.call(res, data);
            };
            
            // Override res.send to capture response data
            const originalSend = res.send;
            res.send = (data) => {
                const responseTime = Date.now() - startTime;
                this.logResponse(res, requestId, responseTime, data);
                return originalSend.call(res, data);
            };
            
            // Handle response end
            res.on('finish', () => {
                if (!res.headersSent) {
                    const responseTime = Date.now() - startTime;
                    this.logResponse(res, requestId, responseTime);
                }
            });
            
            next();
        };
    }

    /**
     * Get request history
     */
    getRequestHistory(limit = 100) {
        return this.requestHistory.slice(-limit);
    }

    /**
     * Get error history
     */
    getErrorHistory(limit = 50) {
        return this.errorHistory.slice(-limit);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Export logs to file
     */
    async exportLogs(outputPath, options = {}) {
        const {
            format = 'json',
            includeRequests = true,
            includeErrors = true,
            includeMetrics = true,
            startDate = null,
            endDate = null
        } = options;

        const exportData = {
            exportedAt: new Date().toISOString(),
            format,
            filters: { startDate, endDate }
        };

        if (includeRequests) {
            exportData.requests = this.requestHistory.filter(entry => {
                if (!startDate && !endDate) return true;
                const entryDate = new Date(entry.timestamp);
                if (startDate && entryDate < new Date(startDate)) return false;
                if (endDate && entryDate > new Date(endDate)) return false;
                return true;
            });
        }

        if (includeErrors) {
            exportData.errors = this.errorHistory.filter(entry => {
                if (!startDate && !endDate) return true;
                const entryDate = new Date(entry.timestamp);
                if (startDate && entryDate < new Date(startDate)) return false;
                if (endDate && entryDate > new Date(endDate)) return false;
                return true;
            });
        }

        if (includeMetrics) {
            exportData.metrics = this.getPerformanceMetrics();
        }

        let output;
        switch (format) {
            case 'csv':
                output = this.convertToCSV(exportData);
                break;
            case 'json':
            default:
                output = JSON.stringify(exportData, null, 2);
                break;
        }

        await fs.writeFile(outputPath, output);
        await this.log('info', `Logs exported to ${outputPath}`, { 
            recordCount: (exportData.requests?.length || 0) + (exportData.errors?.length || 0)
        });
    }

    /**
     * Sanitize headers for logging
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    /**
     * Sanitize request/response body for logging
     */
    sanitizeBody(body) {
        if (!body) return body;
        
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return body.length > 1000 ? body.substring(0, 1000) + '...' : body;
            }
        }
        
        if (typeof body === 'object') {
            const sanitized = { ...body };
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
            
            const sanitizeObject = (obj) => {
                Object.keys(obj).forEach(key => {
                    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                        obj[key] = '[REDACTED]';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    }
                });
            };
            
            sanitizeObject(sanitized);
            return sanitized;
        }
        
        return body;
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        // Simple CSV conversion for requests
        if (!data.requests || data.requests.length === 0) {
            return 'No request data to export';
        }
        
        const headers = Object.keys(data.requests[0]);
        const csvRows = [headers.join(',')];
        
        data.requests.forEach(request => {
            const values = headers.map(header => {
                const value = request[header];
                if (typeof value === 'object') {
                    return JSON.stringify(value).replace(/"/g, '""');
                }
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    // Convenience methods for different log levels
    async trace(message, data) { return this.log('trace', message, data); }
    async debug(message, data) { return this.log('debug', message, data); }
    async info(message, data) { return this.log('info', message, data); }
    async warn(message, data) { return this.log('warn', message, data); }
    async error(message, data) { return this.log('error', message, data); }
    async fatal(message, data) { return this.log('fatal', message, data); }
}

// CLI interface
if (require.main === module) {
    const logger = new DebugLogger({
        logLevel: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: true,
        enableMetrics: true
    });

    const command = process.argv[2];

    switch (command) {
        case 'test':
            // Test logging functionality
            (async () => {
                await logger.info('Testing debug logger');
                await logger.debug('Debug message with data', { test: true, number: 42 });
                await logger.warn('Warning message');
                await logger.error('Error message', { error: 'Test error' });
                
                console.log('\nPerformance Metrics:');
                console.log(JSON.stringify(logger.getPerformanceMetrics(), null, 2));
                
                console.log('\nRequest History:');
                console.log(JSON.stringify(logger.getRequestHistory(5), null, 2));
            })();
            break;

        case 'export':
            const outputPath = process.argv[3] || 'debug-export.json';
            logger.exportLogs(outputPath)
                .then(() => {
                    console.log(`Logs exported to ${outputPath}`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Export failed:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
Debug Logger for Tattoo Directory

Usage: node dev-tools/debug-logger.js <command> [options]

Commands:
  test        Test logging functionality
  export      Export logs to file

Environment Variables:
  LOG_LEVEL   Set log level (trace, debug, info, warn, error, fatal)

Examples:
  node dev-tools/debug-logger.js test
  node dev-tools/debug-logger.js export logs/debug-export.json
  LOG_LEVEL=debug node dev-tools/debug-logger.js test
`);
            break;
    }
}

module.exports = DebugLogger;