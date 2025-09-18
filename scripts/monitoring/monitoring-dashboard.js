#!/usr/bin/env node

/**
 * Real-time Monitoring Dashboard for Local Development Environment
 * 
 * Provides:
 * - Web-based dashboard for monitoring service health
 * - Real-time alerts and notifications
 * - Performance metrics visualization
 * - Service dependency tracking
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const HealthMonitor = require('./health-monitor');
const EnvironmentValidator = require('./environment-validator');

class MonitoringDashboard {
    constructor(port = 3001) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.healthMonitor = new HealthMonitor();
        this.environmentValidator = new EnvironmentValidator();
        
        this.monitoringInterval = null;
        this.connectedClients = new Set();
        this.alertHistory = [];
        this.metricsHistory = [];
        
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'dashboard-static')));
        
        // API endpoints
        this.app.get('/api/health', async (req, res) => {
            try {
                const healthResults = await this.healthMonitor.runHealthCheck();
                res.json(healthResults);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/validation', async (req, res) => {
            try {
                const validationResults = await this.environmentValidator.validateEnvironment();
                res.json(validationResults);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/metrics/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            res.json(this.metricsHistory.slice(-limit));
        });

        this.app.get('/api/alerts/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            res.json(this.alertHistory.slice(-limit));
        });

        // Dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }

    /**
     * Setup Socket.IO handlers
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Send initial data
            socket.emit('initial-data', {
                metricsHistory: this.metricsHistory.slice(-20),
                alertHistory: this.alertHistory.slice(-10)
            });

            socket.on('disconnect', () => {
                console.log(`📱 Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });

            socket.on('request-health-check', async () => {
                try {
                    const results = await this.healthMonitor.runHealthCheck();
                    socket.emit('health-check-result', results);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('request-validation', async () => {
                try {
                    const results = await this.environmentValidator.validateEnvironment();
                    socket.emit('validation-result', results);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
        });
    }

    /**
     * Start monitoring with real-time updates
     */
    async startMonitoring(intervalMs = 30000) {
        console.log(`🔄 Starting real-time monitoring (interval: ${intervalMs/1000}s)`);
        
        const runMonitoringCycle = async () => {
            try {
                // Run health check
                const healthResults = await this.healthMonitor.runHealthCheck();
                
                // Store metrics
                this.metricsHistory.push({
                    timestamp: new Date().toISOString(),
                    health: healthResults,
                    type: 'health-check'
                });

                // Limit history size
                if (this.metricsHistory.length > 200) {
                    this.metricsHistory = this.metricsHistory.slice(-200);
                }

                // Process alerts
                const newAlerts = this.processAlerts(healthResults);
                if (newAlerts.length > 0) {
                    this.alertHistory.push(...newAlerts);
                    if (this.alertHistory.length > 500) {
                        this.alertHistory = this.alertHistory.slice(-500);
                    }
                }

                // Broadcast to connected clients
                this.io.emit('health-update', healthResults);
                
                if (newAlerts.length > 0) {
                    this.io.emit('new-alerts', newAlerts);
                }

                // Log status
                const healthyServices = Object.values(healthResults.services).filter(s => s.status === 'healthy').length;
                const totalServices = Object.keys(healthResults.services).length;
                console.log(`📊 Health check: ${healthyServices}/${totalServices} services healthy, ${newAlerts.length} new alerts`);

            } catch (error) {
                console.error('❌ Monitoring cycle error:', error.message);
                
                const errorAlert = {
                    type: 'error',
                    service: 'Monitoring System',
                    message: `Monitoring error: ${error.message}`,
                    timestamp: new Date().toISOString()
                };
                
                this.alertHistory.push(errorAlert);
                this.io.emit('new-alerts', [errorAlert]);
            }
        };

        // Run initial cycle
        await runMonitoringCycle();
        
        // Set up interval
        this.monitoringInterval = setInterval(runMonitoringCycle, intervalMs);
        
        return this.monitoringInterval;
    }

    /**
     * Process health results and generate alerts
     */
    processAlerts(healthResults) {
        const alerts = [];
        const now = new Date().toISOString();

        // Service health alerts
        Object.values(healthResults.services).forEach(service => {
            if (service.status === 'unhealthy') {
                alerts.push({
                    type: 'error',
                    service: service.name,
                    message: `Service ${service.name} is unhealthy: ${service.error}`,
                    timestamp: now,
                    severity: 'high'
                });
            } else if (service.status === 'degraded') {
                alerts.push({
                    type: 'warning',
                    service: service.name,
                    message: `Service ${service.name} is degraded: ${service.error}`,
                    timestamp: now,
                    severity: 'medium'
                });
            }

            // Performance alerts
            if (service.responseTime > 2000) {
                alerts.push({
                    type: 'warning',
                    service: service.name,
                    message: `High response time: ${service.responseTime}ms`,
                    timestamp: now,
                    severity: 'medium'
                });
            }
        });

        // LocalStack service alerts
        Object.values(healthResults.localStackServices).forEach(service => {
            if (service.status === 'unhealthy') {
                alerts.push({
                    type: 'error',
                    service: `LocalStack ${service.name}`,
                    message: `LocalStack service ${service.name} is not working`,
                    timestamp: now,
                    severity: 'high'
                });
            }
        });

        // Memory usage alerts
        if (healthResults.performance?.memory?.percentage > 85) {
            alerts.push({
                type: 'warning',
                service: 'System',
                message: `High memory usage: ${healthResults.performance.memory.percentage}%`,
                timestamp: now,
                severity: 'medium'
            });
        }

        return alerts;
    }

    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tattoo Directory - Local Environment Monitor</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2d2d2d;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .status-dot.healthy { background: #4ade80; }
        .status-dot.degraded { background: #fbbf24; }
        .status-dot.unhealthy { background: #ef4444; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: #2d2d2d;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #404040;
        }
        
        .card h3 {
            margin-bottom: 15px;
            color: #60a5fa;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #404040;
        }
        
        .service-item:last-child {
            border-bottom: none;
        }
        
        .service-name {
            font-weight: 500;
        }
        
        .service-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .response-time {
            font-size: 0.9em;
            color: #9ca3af;
        }
        
        .alert-item {
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid;
        }
        
        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border-left-color: #ef4444;
        }
        
        .alert-warning {
            background: rgba(251, 191, 36, 0.1);
            border-left-color: #fbbf24;
        }
        
        .alert-info {
            background: rgba(96, 165, 250, 0.1);
            border-left-color: #60a5fa;
        }
        
        .alert-time {
            font-size: 0.8em;
            color: #9ca3af;
            margin-top: 5px;
        }
        
        .metrics-chart {
            height: 200px;
            background: #1a1a1a;
            border-radius: 6px;
            padding: 10px;
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #3b82f6;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #2563eb;
        }
        
        .btn.secondary {
            background: #6b7280;
        }
        
        .btn.secondary:hover {
            background: #4b5563;
        }
        
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        .timestamp {
            font-size: 0.9em;
            color: #9ca3af;
        }
        
        .connection-status {
            font-size: 0.9em;
        }
        
        .connection-status.connected {
            color: #4ade80;
        }
        
        .connection-status.disconnected {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Local Environment Monitor</h1>
            <p>Real-time monitoring for Tattoo Directory development environment</p>
        </div>
        
        <div class="status-bar">
            <div class="status-indicator">
                <div class="status-dot healthy" id="overall-status"></div>
                <span id="overall-text">Checking status...</span>
            </div>
            <div class="connection-status connected" id="connection-status">
                🔗 Connected
            </div>
            <div class="timestamp" id="last-update">
                Last update: Never
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="requestHealthCheck()">🔍 Run Health Check</button>
            <button class="btn secondary" onclick="requestValidation()">✅ Run Validation</button>
            <button class="btn secondary" onclick="toggleAutoRefresh()">⏸️ Pause Auto-refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔧 Services Status</h3>
                <div id="services-list">
                    <div class="service-item">
                        <span class="service-name">Loading...</span>
                        <span class="service-status">⏳</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>☁️ LocalStack Services</h3>
                <div id="localstack-list">
                    <div class="service-item">
                        <span class="service-name">Loading...</span>
                        <span class="service-status">⏳</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Performance Metrics</h3>
                <div id="performance-metrics">
                    <div>Memory Usage: <span id="memory-usage">--</span></div>
                    <div>Avg Response Time: <span id="avg-response-time">--</span></div>
                    <div>Active Containers: <span id="active-containers">--</span></div>
                </div>
                <div class="metrics-chart">
                    📊 Response Time Chart (Coming Soon)
                </div>
            </div>
            
            <div class="card">
                <h3>🚨 Recent Alerts</h3>
                <div id="alerts-list">
                    <div class="alert-item alert-info">
                        <div>No alerts yet</div>
                        <div class="alert-time">Monitoring started</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let autoRefresh = true;
        
        // Connection status
        socket.on('connect', () => {
            document.getElementById('connection-status').textContent = '🔗 Connected';
            document.getElementById('connection-status').className = 'connection-status connected';
        });
        
        socket.on('disconnect', () => {
            document.getElementById('connection-status').textContent = '❌ Disconnected';
            document.getElementById('connection-status').className = 'connection-status disconnected';
        });
        
        // Health updates
        socket.on('health-update', (data) => {
            updateHealthDisplay(data);
        });
        
        socket.on('new-alerts', (alerts) => {
            updateAlertsDisplay(alerts);
        });
        
        socket.on('initial-data', (data) => {
            if (data.metricsHistory.length > 0) {
                const latest = data.metricsHistory[data.metricsHistory.length - 1];
                updateHealthDisplay(latest.health);
            }
            if (data.alertHistory.length > 0) {
                updateAlertsDisplay(data.alertHistory.slice(-5));
            }
        });
        
        function updateHealthDisplay(healthData) {
            // Update overall status
            const overallStatus = healthData.overallHealth;
            const statusDot = document.getElementById('overall-status');
            const statusText = document.getElementById('overall-text');
            
            statusDot.className = \`status-dot \${overallStatus}\`;
            statusText.textContent = \`Overall: \${overallStatus.toUpperCase()}\`;
            
            // Update services
            const servicesList = document.getElementById('services-list');
            servicesList.innerHTML = '';
            
            Object.values(healthData.services).forEach(service => {
                const item = document.createElement('div');
                item.className = 'service-item';
                
                const statusEmoji = service.status === 'healthy' ? '✅' : 
                                  service.status === 'degraded' ? '⚠️' : '❌';
                
                item.innerHTML = \`
                    <span class="service-name">\${service.name}</span>
                    <div class="service-status">
                        \${statusEmoji} \${service.status}
                        <div class="response-time">\${service.responseTime}ms</div>
                    </div>
                \`;
                
                servicesList.appendChild(item);
            });
            
            // Update LocalStack services
            const localstackList = document.getElementById('localstack-list');
            localstackList.innerHTML = '';
            
            Object.values(healthData.localStackServices).forEach(service => {
                const item = document.createElement('div');
                item.className = 'service-item';
                
                const statusEmoji = service.status === 'healthy' ? '✅' : '❌';
                
                item.innerHTML = \`
                    <span class="service-name">\${service.name}</span>
                    <span class="service-status">\${statusEmoji} \${service.status}</span>
                \`;
                
                localstackList.appendChild(item);
            });
            
            // Update performance metrics
            if (healthData.performance) {
                if (healthData.performance.memory) {
                    document.getElementById('memory-usage').textContent = 
                        \`\${healthData.performance.memory.percentage}% (\${healthData.performance.memory.used}MB)\`;
                }
                
                if (healthData.performance.responseTime) {
                    document.getElementById('avg-response-time').textContent = 
                        \`\${healthData.performance.responseTime.average}ms\`;
                }
                
                if (healthData.performance.containers) {
                    document.getElementById('active-containers').textContent = 
                        \`\${healthData.performance.containers.running}/\${healthData.performance.containers.containers}\`;
                }
            }
            
            // Update timestamp
            document.getElementById('last-update').textContent = 
                \`Last update: \${new Date().toLocaleTimeString()}\`;
        }
        
        function updateAlertsDisplay(alerts) {
            const alertsList = document.getElementById('alerts-list');
            
            alerts.forEach(alert => {
                const item = document.createElement('div');
                item.className = \`alert-item alert-\${alert.type}\`;
                
                const time = new Date(alert.timestamp).toLocaleTimeString();
                
                item.innerHTML = \`
                    <div><strong>\${alert.service}:</strong> \${alert.message}</div>
                    <div class="alert-time">\${time}</div>
                \`;
                
                alertsList.insertBefore(item, alertsList.firstChild);
            });
            
            // Keep only last 10 alerts
            while (alertsList.children.length > 10) {
                alertsList.removeChild(alertsList.lastChild);
            }
        }
        
        function requestHealthCheck() {
            socket.emit('request-health-check');
        }
        
        function requestValidation() {
            socket.emit('request-validation');
        }
        
        function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            const btn = event.target;
            btn.textContent = autoRefresh ? '⏸️ Pause Auto-refresh' : '▶️ Resume Auto-refresh';
        }
        
        // Request initial health check
        setTimeout(() => {
            requestHealthCheck();
        }, 1000);
    </script>
</body>
</html>`;
    }

    /**
     * Start the dashboard server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🌐 Monitoring dashboard started on http://localhost:${this.port}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Stop the dashboard server
     */
    async stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Monitoring dashboard stopped');
                resolve();
            });
        });
    }
}

// CLI interface
if (require.main === module) {
    const dashboard = new MonitoringDashboard();
    
    dashboard.start()
        .then(() => {
            return dashboard.startMonitoring(15000); // 15 second intervals
        })
        .then(() => {
            console.log('📊 Real-time monitoring active');
            console.log('🌐 Dashboard: http://localhost:3001');
            console.log('Press Ctrl+C to stop');
        })
        .catch(error => {
            console.error('❌ Failed to start monitoring dashboard:', error.message);
            process.exit(1);
        });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down monitoring dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
}

module.exports = MonitoringDashboard;