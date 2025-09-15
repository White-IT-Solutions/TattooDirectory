#!/usr/bin/env node

/**
 * Hot Module Replacement Proxy for Backend Lambda Functions
 * 
 * This proxy sits between the frontend and backend Lambda container,
 * providing hot reloading capabilities and development features:
 * - Automatic Lambda function reloading on code changes
 * - Request/response logging and debugging
 * - Error scenario simulation
 * - API Gateway simulation with enhanced features
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const chokidar = require('chokidar');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class HotReloadProxy {
    constructor(options = {}) {
        this.port = options.port || 9001;
        this.backendUrl = options.backendUrl || 'http://localhost:9000';
        this.watchPath = options.watchPath || path.join(process.cwd(), 'backend/src');
        this.logRequests = options.logRequests !== false;
        this.enableMocking = options.enableMocking !== false;
        
        this.app = express();
        this.isReloading = false;
        this.requestCount = 0;
        this.errorScenarios = new Map();
        this.mockResponses = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupFileWatcher();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Request logging middleware
        if (this.logRequests) {
            this.app.use((req, res, next) => {
                const startTime = Date.now();
                const requestId = ++this.requestCount;
                
                console.log(`🔍 [${requestId}] ${req.method} ${req.path}`);
                console.log(`📝 [${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
                
                if (req.body && Object.keys(req.body).length > 0) {
                    console.log(`📦 [${requestId}] Body:`, JSON.stringify(req.body, null, 2));
                }

                // Override res.json to log responses
                const originalJson = res.json;
                res.json = function(data) {
                    const responseTime = Date.now() - startTime;
                    console.log(`📤 [${requestId}] Response (${responseTime}ms):`, JSON.stringify(data, null, 2));
                    return originalJson.call(this, data);
                };

                next();
            });
        }

        // JSON body parser
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    /**
     * Setup development routes
     */
    setupRoutes() {
        // Development control endpoints
        this.app.get('/_dev/status', (req, res) => {
            res.json({
                status: 'running',
                isReloading: this.isReloading,
                requestCount: this.requestCount,
                errorScenarios: Array.from(this.errorScenarios.keys()),
                mockResponses: Array.from(this.mockResponses.keys()),
                backendUrl: this.backendUrl,
                watchPath: this.watchPath
            });
        });

        this.app.post('/_dev/reload', async (req, res) => {
            try {
                await this.reloadBackend();
                res.json({ success: true, message: 'Backend reloaded successfully' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/_dev/mock/:endpoint', (req, res) => {
            const endpoint = req.params.endpoint;
            const mockResponse = req.body;
            
            this.mockResponses.set(endpoint, mockResponse);
            console.log(`🎭 Mock response set for ${endpoint}`);
            
            res.json({ success: true, message: `Mock response set for ${endpoint}` });
        });

        this.app.delete('/_dev/mock/:endpoint', (req, res) => {
            const endpoint = req.params.endpoint;
            this.mockResponses.delete(endpoint);
            
            console.log(`🎭 Mock response removed for ${endpoint}`);
            res.json({ success: true, message: `Mock response removed for ${endpoint}` });
        });

        this.app.post('/_dev/error/:endpoint', (req, res) => {
            const endpoint = req.params.endpoint;
            const errorConfig = req.body;
            
            this.errorScenarios.set(endpoint, errorConfig);
            console.log(`💥 Error scenario set for ${endpoint}:`, errorConfig);
            
            res.json({ success: true, message: `Error scenario set for ${endpoint}` });
        });

        this.app.delete('/_dev/error/:endpoint', (req, res) => {
            const endpoint = req.params.endpoint;
            this.errorScenarios.delete(endpoint);
            
            console.log(`💥 Error scenario removed for ${endpoint}`);
            res.json({ success: true, message: `Error scenario removed for ${endpoint}` });
        });

        // Lambda invocation proxy with enhancements
        this.app.use('/2015-03-31/functions/function/invocations', 
            this.createLambdaProxy()
        );

        // Direct API proxy (for easier frontend integration)
        this.app.use('/v1', this.createApiProxy());
    }

    /**
     * Create Lambda invocation proxy middleware
     */
    createLambdaProxy() {
        return async (req, res, next) => {
            try {
                // Check if backend is reloading
                if (this.isReloading) {
                    return res.status(503).json({
                        error: 'Backend is reloading, please try again in a moment'
                    });
                }

                // Extract API path from Lambda event
                const lambdaEvent = req.body;
                const apiPath = lambdaEvent?.path || '/unknown';
                
                // Check for mock responses
                if (this.mockResponses.has(apiPath)) {
                    console.log(`🎭 Returning mock response for ${apiPath}`);
                    return res.json(this.mockResponses.get(apiPath));
                }

                // Check for error scenarios
                if (this.errorScenarios.has(apiPath)) {
                    const errorConfig = this.errorScenarios.get(apiPath);
                    console.log(`💥 Simulating error for ${apiPath}:`, errorConfig);
                    
                    return res.status(errorConfig.statusCode || 500).json({
                        error: errorConfig.message || 'Simulated error',
                        type: errorConfig.type || 'SimulatedError',
                        details: errorConfig.details || {}
                    });
                }

                // Proxy to actual backend
                const response = await axios.post(
                    `${this.backendUrl}/2015-03-31/functions/function/invocations`,
                    req.body,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                res.json(response.data);

            } catch (error) {
                console.error('🚨 Proxy error:', error.message);
                
                if (error.code === 'ECONNREFUSED') {
                    res.status(503).json({
                        error: 'Backend service unavailable',
                        message: 'The backend Lambda container is not responding'
                    });
                } else if (error.response) {
                    res.status(error.response.status).json(error.response.data);
                } else {
                    res.status(500).json({
                        error: 'Proxy error',
                        message: error.message
                    });
                }
            }
        };
    }

    /**
     * Create direct API proxy middleware
     */
    createApiProxy() {
        return async (req, res, next) => {
            try {
                // Convert direct API call to Lambda event format
                const lambdaEvent = {
                    httpMethod: req.method,
                    path: req.path,
                    pathParameters: req.params,
                    queryStringParameters: req.query,
                    headers: req.headers,
                    body: req.body ? JSON.stringify(req.body) : null,
                    isBase64Encoded: false
                };

                // Forward to Lambda proxy
                req.body = lambdaEvent;
                req.path = '/2015-03-31/functions/function/invocations';
                req.method = 'POST';
                
                next();

            } catch (error) {
                console.error('🚨 API proxy error:', error.message);
                res.status(500).json({
                    error: 'API proxy error',
                    message: error.message
                });
            }
        };
    }

    /**
     * Setup file watcher for hot reloading
     */
    setupFileWatcher() {
        console.log(`👀 Watching for changes in: ${this.watchPath}`);
        
        const watcher = chokidar.watch(this.watchPath, {
            ignored: /node_modules|\.git/,
            persistent: true,
            ignoreInitial: true
        });

        let reloadTimeout;

        watcher.on('change', (filePath) => {
            console.log(`📝 File changed: ${filePath}`);
            
            // Debounce reload calls
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => {
                this.reloadBackend().catch(error => {
                    console.error('🚨 Auto-reload failed:', error.message);
                });
            }, 1000);
        });

        watcher.on('error', (error) => {
            console.error('👀 File watcher error:', error);
        });
    }

    /**
     * Reload backend Lambda container
     */
    async reloadBackend() {
        if (this.isReloading) {
            console.log('🔄 Reload already in progress, skipping...');
            return;
        }

        this.isReloading = true;
        console.log('🔄 Reloading backend Lambda container...');

        try {
            // Restart the backend container
            execSync(
                'docker-compose -f dev-tools/docker/docker-compose.local.yml restart backend',
                { stdio: 'inherit' }
            );

            // Wait for backend to be ready
            await this.waitForBackend();
            
            console.log('✅ Backend reloaded successfully');

        } catch (error) {
            console.error('❌ Backend reload failed:', error.message);
            throw error;
        } finally {
            this.isReloading = false;
        }
    }

    /**
     * Wait for backend to be ready
     */
    async waitForBackend(maxAttempts = 30) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await axios.post(
                    `${this.backendUrl}/2015-03-31/functions/function/invocations`,
                    {
                        httpMethod: 'GET',
                        path: '/health',
                        headers: {}
                    },
                    { timeout: 5000 }
                );
                
                console.log(`✅ Backend ready after ${attempt} attempts`);
                return;

            } catch (error) {
                if (attempt === maxAttempts) {
                    throw new Error(`Backend not ready after ${maxAttempts} attempts`);
                }
                
                console.log(`⏳ Waiting for backend... (${attempt}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    /**
     * Start the proxy server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🚀 Hot Reload Proxy started on http://localhost:${this.port}`);
                    console.log(`🔗 Proxying to backend: ${this.backendUrl}`);
                    console.log(`👀 Watching: ${this.watchPath}`);
                    console.log('');
                    console.log('Development endpoints:');
                    console.log(`  GET  /_dev/status           - Proxy status`);
                    console.log(`  POST /_dev/reload           - Manual reload`);
                    console.log(`  POST /_dev/mock/:endpoint   - Set mock response`);
                    console.log(`  POST /_dev/error/:endpoint  - Set error scenario`);
                    console.log('');
                    resolve();
                }
            });
        });
    }

    /**
     * Stop the proxy server
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 Hot Reload Proxy stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// CLI interface
if (require.main === module) {
    const proxy = new HotReloadProxy({
        port: process.env.PROXY_PORT || 9001,
        backendUrl: process.env.BACKEND_URL || 'http://localhost:9000',
        watchPath: process.env.WATCH_PATH || path.join(process.cwd(), 'backend/src'),
        logRequests: process.env.LOG_REQUESTS !== 'false',
        enableMocking: process.env.ENABLE_MOCKING !== 'false'
    });

    proxy.start()
        .then(() => {
            console.log('Press Ctrl+C to stop');
        })
        .catch(error => {
            console.error('❌ Failed to start Hot Reload Proxy:', error.message);
            process.exit(1);
        });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Hot Reload Proxy...');
        await proxy.stop();
        process.exit(0);
    });
}

module.exports = HotReloadProxy;