#!/usr/bin/env node

/**
 * Comprehensive Monitoring Dashboard for Local Development Environment
 * 
 * Integrates:
 * - Real-time health monitoring with service dependency tracking
 * - Environment validation with security and performance checks
 * - Alert system with multiple notification channels
 * - Performance metrics with baseline validation
 * - Interactive web dashboard with real-time updates
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

const HealthMonitor = require('./health-monitor');
const AlertSystem = require('./alert-system');
const EnvironmentHealthValidator = require('./environment-health-validator');

class ComprehensiveMonitoringDashboard {
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
        this.alertSystem = new AlertSystem();
        this.environmentValidator = new EnvironmentHealthValidator();
        
        this.monitoringInterval = null;
        this.validationInterval = null;
        this.connectedClients = new Set();
        
        this.dashboardData = {
            health: null,
            validation: null,
            alerts: [],
            metrics: [],
            performance: {},
            lastUpdate: null
        };
        
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupAlertHandlers();
    }

    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'dashboard-static')));
        this.app.use(express.json());
        
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
                const validationResults = await this.environmentValidator.runComprehensiveValidation();
                res.json(validationResults);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/alerts', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            const alerts = this.alertSystem.getActiveAlerts().slice(-limit);
            res.json(alerts);
        });

        this.app.get('/api/alerts/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            res.json(this.alertSystem.alertHistory.slice(-limit));
        });

        this.app.get('/api/alerts/statistics', (req, res) => {
            const timeRange = parseInt(req.query.timeRange) || 24 * 60 * 60 * 1000; // 24 hours
            const stats = this.alertSystem.getAlertStatistics(timeRange);
            res.json(stats);
        });

        this.app.post('/api/alerts/:alertId/acknowledge', (req, res) => {
            const { alertId } = req.params;
            const { acknowledgedBy } = req.body;
            
            const success = this.alertSystem.acknowledgeAlert(alertId, acknowledgedBy || 'dashboard-user');
            
            if (success) {
                res.json({ success: true });
                this.io.emit('alert-acknowledged', { alertId, acknowledgedBy });
            } else {
                res.status(404).json({ error: 'Alert not found' });
            }
        });

        this.app.post('/api/alerts/:alertId/resolve', (req, res) => {
            const { alertId } = req.params;
            const { resolvedBy } = req.body;
            
            const success = this.alertSystem.resolveAlert(alertId, resolvedBy || 'dashboard-user');
            
            if (success) {
                res.json({ success: true });
                this.io.emit('alert-resolved', { alertId, resolvedBy });
            } else {
                res.status(404).json({ error: 'Alert not found' });
            }
        });

        this.app.get('/api/metrics/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            res.json(this.dashboardData.metrics.slice(-limit));
        });

        this.app.get('/api/dashboard/status', (req, res) => {
            res.json({
                status: 'running',
                connectedClients: this.connectedClients.size,
                lastUpdate: this.dashboardData.lastUpdate,
                monitoringActive: !!this.monitoringInterval,
                validationActive: !!this.validationInterval
            });
        });

        // Dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.generateComprehensiveDashboardHTML());
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
                health: this.dashboardData.health,
                validation: this.dashboardData.validation,
                alerts: this.alertSystem.getActiveAlerts().slice(-10),
                metrics: this.dashboardData.metrics.slice(-20),
                performance: this.dashboardData.performance
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
                    const results = await this.environmentValidator.runComprehensiveValidation();
                    socket.emit('validation-result', results);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('acknowledge-alert', (data) => {
                const success = this.alertSystem.acknowledgeAlert(data.alertId, data.acknowledgedBy || socket.id);
                socket.emit('alert-action-result', { success, action: 'acknowledge' });
            });

            socket.on('resolve-alert', (data) => {
                const success = this.alertSystem.resolveAlert(data.alertId, data.resolvedBy || socket.id);
                socket.emit('alert-action-result', { success, action: 'resolve' });
            });
        });
    }

    /**
     * Setup alert system event handlers
     */
    setupAlertHandlers() {
        this.alertSystem.on('alert', (alert) => {
            console.log(`🚨 New alert: ${alert.message}`);
            this.dashboardData.alerts.push(alert);
            this.io.emit('new-alert', alert);
        });

        this.alertSystem.on('alert-acknowledged', (alert) => {
            console.log(`✅ Alert acknowledged: ${alert.id}`);
            this.io.emit('alert-acknowledged', alert);
        });

        this.alertSystem.on('alert-resolved', (alert) => {
            console.log(`🔧 Alert resolved: ${alert.id}`);
            this.io.emit('alert-resolved', alert);
        });
    }

    /**
     * Start comprehensive monitoring
     */
    async startComprehensiveMonitoring(healthIntervalMs = 30000, validationIntervalMs = 300000) {
        console.log(`🔄 Starting comprehensive monitoring:`);
        console.log(`  Health checks: every ${healthIntervalMs/1000}s`);
        console.log(`  Validation: every ${validationIntervalMs/1000}s`);
        
        // Health monitoring cycle
        const healthMonitoringCycle = async () => {
            try {
                const healthResults = await this.healthMonitor.runHealthCheck();
                
                // Store health data
                this.dashboardData.health = healthResults;
                this.dashboardData.lastUpdate = new Date().toISOString();
                
                // Store metrics
                this.dashboardData.metrics.push({
                    timestamp: new Date().toISOString(),
                    type: 'health',
                    data: healthResults
                });

                // Limit metrics history
                if (this.dashboardData.metrics.length > 200) {
                    this.dashboardData.metrics = this.dashboardData.metrics.slice(-200);
                }

                // Process alerts
                const alertData = {
                    timestamp: healthResults.timestamp,
                    services: healthResults.services,
                    localStackServices: healthResults.localStackServices,
                    performance: healthResults.performance,
                    overallHealth: healthResults.overallHealth
                };
                
                await this.alertSystem.processMonitoringData(alertData);

                // Broadcast to clients
                this.io.emit('health-update', healthResults);

                // Log status
                const healthyServices = Object.values(healthResults.services).filter(s => s.status === 'healthy').length;
                const totalServices = Object.keys(healthResults.services).length;
                console.log(`📊 Health: ${healthyServices}/${totalServices} services healthy`);

            } catch (error) {
                console.error('❌ Health monitoring error:', error.message);
            }
        };

        // Validation monitoring cycle
        const validationMonitoringCycle = async () => {
            try {
                const validationResults = await this.environmentValidator.runComprehensiveValidation();
                
                // Store validation data
                this.dashboardData.validation = validationResults;
                
                // Store metrics
                this.dashboardData.metrics.push({
                    timestamp: new Date().toISOString(),
                    type: 'validation',
                    data: validationResults
                });

                // Broadcast to clients
                this.io.emit('validation-update', validationResults);

                console.log(`🔍 Validation: Score ${validationResults.score}/100, Status: ${validationResults.overallStatus}`);

            } catch (error) {
                console.error('❌ Validation monitoring error:', error.message);
            }
        };

        // Run initial cycles
        await healthMonitoringCycle();
        await validationMonitoringCycle();
        
        // Set up intervals
        this.monitoringInterval = setInterval(healthMonitoringCycle, healthIntervalMs);
        this.validationInterval = setInterval(validationMonitoringCycle, validationIntervalMs);
        
        return {
            healthInterval: this.monitoringInterval,
            validationInterval: this.validationInterval
        };
    }

    /**
     * Stop comprehensive monitoring
     */
    stopComprehensiveMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
        
        console.log('🛑 Comprehensive monitoring stopped');
    }

    /**
     * Generate comprehensive dashboard HTML
     */
    generateComprehensiveDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tattoo Directory - Comprehensive Environment Monitor</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #ffffff;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            font-size: 2.8em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.2em;
        }
        
        .status-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border: 1px solid #333;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .status-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .status-dot.excellent { background: #10b981; }
        .status-dot.good { background: #3b82f6; }
        .status-dot.fair { background: #f59e0b; }
        .status-dot.poor { background: #ef4444; }
        .status-dot.unknown { background: #6b7280; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .card {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #333;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        
        .card h3 {
            margin-bottom: 20px;
            color: #60a5fa;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.3em;
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #333;
        }
        
        .service-item:last-child {
            border-bottom: none;
        }
        
        .service-name {
            font-weight: 500;
            font-size: 1.05em;
        }
        
        .service-status {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .response-time {
            font-size: 0.9em;
            color: #9ca3af;
        }
        
        .alert-item {
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-left: 4px solid;
            position: relative;
        }
        
        .alert-critical {
            background: rgba(239, 68, 68, 0.15);
            border-left-color: #ef4444;
        }
        
        .alert-warning {
            background: rgba(251, 191, 36, 0.15);
            border-left-color: #fbbf24;
        }
        
        .alert-info {
            background: rgba(96, 165, 250, 0.15);
            border-left-color: #60a5fa;
        }
        
        .alert-actions {
            margin-top: 10px;
            display: flex;
            gap: 8px;
        }
        
        .alert-btn {
            padding: 4px 12px;
            border: none;
            border-radius: 4px;
            font-size: 0.8em;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .alert-btn.acknowledge {
            background: #3b82f6;
            color: white;
        }
        
        .alert-btn.resolve {
            background: #10b981;
            color: white;
        }
        
        .alert-btn:hover {
            opacity: 0.8;
        }
        
        .alert-time {
            font-size: 0.85em;
            color: #9ca3af;
            margin-top: 8px;
        }
        
        .metrics-chart {
            height: 220px;
            background: #0f0f0f;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            border: 1px solid #333;
        }
        
        .controls {
            display: flex;
            gap: 12px;
            margin-bottom: 25px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: #3b82f6;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .btn:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .btn.secondary {
            background: #6b7280;
            box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }
        
        .btn.secondary:hover {
            background: #4b5563;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
        }
        
        .btn.danger {
            background: #ef4444;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .btn.danger:hover {
            background: #dc2626;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
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
            font-size: 0.95em;
            font-weight: 500;
        }
        
        .connection-status.connected {
            color: #10b981;
        }
        
        .connection-status.disconnected {
            color: #ef4444;
        }
        
        .score-display {
            font-size: 2em;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
        }
        
        .score-excellent { color: #10b981; }
        .score-good { color: #3b82f6; }
        .score-fair { color: #f59e0b; }
        .score-poor { color: #ef4444; }
        
        .wide-card {
            grid-column: 1 / -1;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .performance-item {
            text-align: center;
            padding: 15px;
            background: #0f0f0f;
            border-radius: 8px;
            border: 1px solid #333;
        }
        
        .performance-value {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .performance-label {
            font-size: 0.9em;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Comprehensive Environment Monitor</h1>
            <p>Real-time health monitoring, validation, and alerting for Tattoo Directory local development</p>
        </div>
        
        <div class="status-bar">
            <div class="status-item">
                <div class="status-dot excellent" id="overall-status"></div>
                <span id="overall-text">Initializing...</span>
            </div>
            <div class="status-item">
                <div class="connection-status connected" id="connection-status">🔗 Connected</div>
            </div>
            <div class="status-item">
                <div class="timestamp" id="last-update">Last update: Never</div>
            </div>
            <div class="status-item">
                <span id="active-alerts">Active alerts: 0</span>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="requestHealthCheck()">🔍 Health Check</button>
            <button class="btn" onclick="requestValidation()">✅ Full Validation</button>
            <button class="btn secondary" onclick="toggleAutoRefresh()">⏸️ Pause Auto-refresh</button>
            <button class="btn secondary" onclick="clearAlerts()">🧹 Clear Resolved Alerts</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔧 Services Health</h3>
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
                <h3>🔍 Environment Validation</h3>
                <div class="score-display score-excellent" id="validation-score">--</div>
                <div id="validation-status">Validation Status: Unknown</div>
                <div id="validation-details">
                    <div>Security Score: <span id="security-score">--</span></div>
                    <div>Performance Score: <span id="performance-score">--</span></div>
                    <div>Dependencies: <span id="dependency-status">--</span></div>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Performance Metrics</h3>
                <div class="performance-grid">
                    <div class="performance-item">
                        <div class="performance-value" id="memory-usage">--</div>
                        <div class="performance-label">Memory Usage</div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-value" id="avg-response-time">--</div>
                        <div class="performance-label">Avg Response</div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-value" id="active-containers">--</div>
                        <div class="performance-label">Containers</div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-value" id="uptime">--</div>
                        <div class="performance-label">Uptime</div>
                    </div>
                </div>
            </div>
            
            <div class="card wide-card">
                <h3>🚨 Active Alerts</h3>
                <div id="alerts-list">
                    <div class="alert-item alert-info">
                        <div>No active alerts</div>
                        <div class="alert-time">System monitoring active</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let autoRefresh = true;
        let startTime = Date.now();
        
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
        
        // Validation updates
        socket.on('validation-update', (data) => {
            updateValidationDisplay(data);
        });
        
        // Alert updates
        socket.on('new-alert', (alert) => {
            addAlertToDisplay(alert);
            updateAlertCount();
        });
        
        socket.on('alert-acknowledged', (alert) => {
            updateAlertInDisplay(alert.id, 'acknowledged');
        });
        
        socket.on('alert-resolved', (alert) => {
            updateAlertInDisplay(alert.id, 'resolved');
            updateAlertCount();
        });
        
        socket.on('initial-data', (data) => {
            if (data.health) {
                updateHealthDisplay(data.health);
            }
            if (data.validation) {
                updateValidationDisplay(data.validation);
            }
            if (data.alerts) {
                updateAlertsDisplay(data.alerts);
            }
        });
        
        function updateHealthDisplay(healthData) {
            // Update overall status
            const overallStatus = healthData.overallHealth;
            const statusDot = document.getElementById('overall-status');
            const statusText = document.getElementById('overall-text');
            
            statusDot.className = \`status-dot \${overallStatus}\`;
            statusText.textContent = \`Health: \${overallStatus.toUpperCase()}\`;
            
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
                        \`\${healthData.performance.memory.percentage}%\`;
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
            
            // Update uptime
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            document.getElementById('uptime').textContent = \`\${hours}h \${minutes}m\`;
            
            // Update timestamp
            document.getElementById('last-update').textContent = 
                \`Last update: \${new Date().toLocaleTimeString()}\`;
        }
        
        function updateValidationDisplay(validationData) {
            const scoreElement = document.getElementById('validation-score');
            const statusElement = document.getElementById('validation-status');
            
            scoreElement.textContent = \`\${validationData.score}/100\`;
            scoreElement.className = \`score-display score-\${validationData.overallStatus}\`;
            
            statusElement.textContent = \`Status: \${validationData.overallStatus.toUpperCase()}\`;
            
            // Update detailed scores
            if (validationData.security) {
                document.getElementById('security-score').textContent = 
                    \`\${validationData.security.score || '--'}/100\`;
            }
            
            if (validationData.performance) {
                document.getElementById('performance-score').textContent = 
                    \`\${validationData.performance.score || '--'}/100\`;
            }
            
            if (validationData.dependencies) {
                const violations = validationData.dependencies.violations || [];
                document.getElementById('dependency-status').textContent = 
                    violations.length === 0 ? 'All OK' : \`\${violations.length} issues\`;
            }
        }
        
        function updateAlertsDisplay(alerts) {
            const alertsList = document.getElementById('alerts-list');
            alertsList.innerHTML = '';
            
            if (alerts.length === 0) {
                alertsList.innerHTML = \`
                    <div class="alert-item alert-info">
                        <div>No active alerts</div>
                        <div class="alert-time">All systems operational</div>
                    </div>
                \`;
                return;
            }
            
            alerts.forEach(alert => {
                addAlertToDisplay(alert);
            });
        }
        
        function addAlertToDisplay(alert) {
            const alertsList = document.getElementById('alerts-list');
            
            // Remove "no alerts" message if present
            if (alertsList.children.length === 1 && alertsList.children[0].textContent.includes('No active alerts')) {
                alertsList.innerHTML = '';
            }
            
            const item = document.createElement('div');
            item.className = \`alert-item alert-\${alert.severity}\`;
            item.id = \`alert-\${alert.id}\`;
            
            const time = new Date(alert.timestamp).toLocaleTimeString();
            
            item.innerHTML = \`
                <div><strong>\${alert.service || 'System'}:</strong> \${alert.message}</div>
                <div class="alert-actions">
                    <button class="alert-btn acknowledge" onclick="acknowledgeAlert('\${alert.id}')">
                        Acknowledge
                    </button>
                    <button class="alert-btn resolve" onclick="resolveAlert('\${alert.id}')">
                        Resolve
                    </button>
                </div>
                <div class="alert-time">\${time} - Severity: \${alert.severity}</div>
            \`;
            
            alertsList.insertBefore(item, alertsList.firstChild);
            
            // Keep only last 20 alerts
            while (alertsList.children.length > 20) {
                alertsList.removeChild(alertsList.lastChild);
            }
        }
        
        function updateAlertInDisplay(alertId, action) {
            const alertElement = document.getElementById(\`alert-\${alertId}\`);
            if (alertElement) {
                if (action === 'resolved') {
                    alertElement.style.opacity = '0.5';
                    alertElement.style.textDecoration = 'line-through';
                } else if (action === 'acknowledged') {
                    alertElement.style.borderLeftColor = '#3b82f6';
                }
            }
        }
        
        function updateAlertCount() {
            // This would be updated from server data
            // For now, count visible alerts
            const activeAlerts = document.querySelectorAll('.alert-item:not([style*="line-through"])').length;
            document.getElementById('active-alerts').textContent = \`Active alerts: \${activeAlerts}\`;
        }
        
        function acknowledgeAlert(alertId) {
            socket.emit('acknowledge-alert', { alertId, acknowledgedBy: 'dashboard-user' });
        }
        
        function resolveAlert(alertId) {
            socket.emit('resolve-alert', { alertId, resolvedBy: 'dashboard-user' });
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
        
        function clearAlerts() {
            const resolvedAlerts = document.querySelectorAll('.alert-item[style*="line-through"]');
            resolvedAlerts.forEach(alert => alert.remove());
        }
        
        // Request initial data
        setTimeout(() => {
            requestHealthCheck();
            requestValidation();
        }, 1000);
        
        // Update alert count initially
        updateAlertCount();
    </script>
</body>
</html>`;
    }

    /**
     * Start the comprehensive dashboard
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🌐 Comprehensive monitoring dashboard started on http://localhost:${this.port}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Stop the dashboard
     */
    async stop() {
        this.stopComprehensiveMonitoring();
        
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Comprehensive monitoring dashboard stopped');
                resolve();
            });
        });
    }
}

// CLI interface
if (require.main === module) {
    const dashboard = new ComprehensiveMonitoringDashboard();
    
    dashboard.start()
        .then(() => {
            return dashboard.startComprehensiveMonitoring(30000, 300000); // 30s health, 5min validation
        })
        .then(() => {
            console.log('📊 Comprehensive monitoring active');
            console.log('🌐 Dashboard: http://localhost:3001');
            console.log('Press Ctrl+C to stop');
        })
        .catch(error => {
            console.error('❌ Failed to start comprehensive monitoring dashboard:', error.message);
            process.exit(1);
        });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down comprehensive monitoring dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
}

module.exports = ComprehensiveMonitoringDashboard;