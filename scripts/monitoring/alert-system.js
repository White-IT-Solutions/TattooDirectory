#!/usr/bin/env node

/**
 * Alert System for Local Development Environment
 * 
 * Provides comprehensive alerting for:
 * - Service failures and performance issues
 * - LocalStack service functionality problems
 * - Environment configuration issues
 * - Resource usage thresholds
 * - Dependency validation failures
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class AlertSystem extends EventEmitter {
    constructor() {
        super();
        
        this.alerts = [];
        this.alertRules = [];
        this.notificationChannels = [];
        this.alertHistory = [];
        this.suppressedAlerts = new Set();
        
        this.setupDefaultAlertRules();
        this.setupDefaultNotificationChannels();
    }

    /**
     * Setup default alert rules
     */
    setupDefaultAlertRules() {
        this.alertRules = [
            // Service health rules
            {
                id: 'service-down',
                name: 'Service Down',
                condition: (data) => data.services && Object.values(data.services).some(s => s.status === 'unhealthy'),
                severity: 'critical',
                message: (data) => {
                    const downServices = Object.values(data.services).filter(s => s.status === 'unhealthy');
                    return `Critical: ${downServices.length} service(s) down: ${downServices.map(s => s.name).join(', ')}`;
                },
                cooldown: 300000 // 5 minutes
            },
            {
                id: 'service-degraded',
                name: 'Service Degraded',
                condition: (data) => data.services && Object.values(data.services).some(s => s.status === 'degraded'),
                severity: 'warning',
                message: (data) => {
                    const degradedServices = Object.values(data.services).filter(s => s.status === 'degraded');
                    return `Warning: ${degradedServices.length} service(s) degraded: ${degradedServices.map(s => s.name).join(', ')}`;
                },
                cooldown: 600000 // 10 minutes
            },
            
            // Performance rules
            {
                id: 'high-response-time',
                name: 'High Response Time',
                condition: (data) => data.services && Object.values(data.services).some(s => s.responseTime > 2000),
                severity: 'warning',
                message: (data) => {
                    const slowServices = Object.values(data.services).filter(s => s.responseTime > 2000);
                    return `Warning: High response times detected: ${slowServices.map(s => `${s.name} (${s.responseTime}ms)`).join(', ')}`;
                },
                cooldown: 300000 // 5 minutes
            },
            {
                id: 'memory-usage-high',
                name: 'High Memory Usage',
                condition: (data) => data.performance?.memory?.percentage > 85,
                severity: 'warning',
                message: (data) => `Warning: High memory usage: ${data.performance.memory.percentage}% (${data.performance.memory.used}MB used)`,
                cooldown: 600000 // 10 minutes
            },
            {
                id: 'memory-usage-critical',
                name: 'Critical Memory Usage',
                condition: (data) => data.performance?.memory?.percentage > 95,
                severity: 'critical',
                message: (data) => `Critical: Memory usage critical: ${data.performance.memory.percentage}% (${data.performance.memory.used}MB used)`,
                cooldown: 180000 // 3 minutes
            },
            
            // LocalStack rules
            {
                id: 'localstack-service-down',
                name: 'LocalStack Service Down',
                condition: (data) => data.localStackServices && Object.values(data.localStackServices).some(s => s.status === 'unhealthy'),
                severity: 'critical',
                message: (data) => {
                    const downServices = Object.values(data.localStackServices).filter(s => s.status === 'unhealthy');
                    return `Critical: LocalStack services down: ${downServices.map(s => s.name).join(', ')}`;
                },
                cooldown: 300000 // 5 minutes
            },
            
            // Dependency rules
            {
                id: 'dependency-failure',
                name: 'Service Dependency Failure',
                condition: (data) => {
                    if (!data.services) return false;
                    return Object.values(data.services).some(service => 
                        Object.values(service.dependencies || {}).some(dep => dep.status === 'unhealthy')
                    );
                },
                severity: 'critical',
                message: (data) => {
                    const servicesWithFailedDeps = Object.values(data.services).filter(service =>
                        Object.values(service.dependencies || {}).some(dep => dep.status === 'unhealthy')
                    );
                    return `Critical: Service dependencies failed for: ${servicesWithFailedDeps.map(s => s.name).join(', ')}`;
                },
                cooldown: 300000 // 5 minutes
            }
        ];
    }

    /**
     * Setup default notification channels
     */
    setupDefaultNotificationChannels() {
        this.notificationChannels = [
            {
                id: 'console',
                name: 'Console Output',
                enabled: true,
                handler: this.consoleNotificationHandler.bind(this)
            },
            {
                id: 'file',
                name: 'File Logging',
                enabled: true,
                handler: this.fileNotificationHandler.bind(this)
            },
            {
                id: 'webhook',
                name: 'Webhook Notifications',
                enabled: false,
                url: process.env.ALERT_WEBHOOK_URL,
                handler: this.webhookNotificationHandler.bind(this)
            }
        ];
    }

    /**
     * Process monitoring data and generate alerts
     */
    async processMonitoringData(data) {
        const newAlerts = [];
        const timestamp = new Date().toISOString();

        for (const rule of this.alertRules) {
            try {
                if (rule.condition(data)) {
                    // Check if alert is in cooldown
                    if (this.isInCooldown(rule.id, rule.cooldown)) {
                        continue;
                    }

                    const alert = {
                        id: `${rule.id}-${Date.now()}`,
                        ruleId: rule.id,
                        ruleName: rule.name,
                        severity: rule.severity,
                        message: rule.message(data),
                        timestamp,
                        data: this.extractRelevantData(data, rule),
                        acknowledged: false,
                        resolved: false
                    };

                    newAlerts.push(alert);
                    this.alerts.push(alert);
                    
                    // Update cooldown
                    this.updateCooldown(rule.id);
                    
                    // Emit alert event
                    this.emit('alert', alert);
                }
            } catch (error) {
                console.error(`Error processing alert rule ${rule.id}:`, error.message);
            }
        }

        // Store alerts in history
        this.alertHistory.push(...newAlerts);
        if (this.alertHistory.length > 1000) {
            this.alertHistory = this.alertHistory.slice(-1000);
        }

        // Send notifications for new alerts
        for (const alert of newAlerts) {
            await this.sendNotifications(alert);
        }

        return newAlerts;
    }

    /**
     * Check if alert rule is in cooldown period
     */
    isInCooldown(ruleId, cooldownMs) {
        const lastAlert = this.alertHistory
            .filter(alert => alert.ruleId === ruleId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (!lastAlert) return false;

        const timeSinceLastAlert = Date.now() - new Date(lastAlert.timestamp).getTime();
        return timeSinceLastAlert < cooldownMs;
    }

    /**
     * Update cooldown tracking
     */
    updateCooldown(ruleId) {
        // Cooldown is tracked via alertHistory timestamps
        // No additional tracking needed
    }

    /**
     * Extract relevant data for alert context
     */
    extractRelevantData(data, rule) {
        const relevant = {
            timestamp: data.timestamp,
            overallHealth: data.overallHealth
        };

        // Extract specific data based on rule type
        if (rule.id.includes('service')) {
            relevant.services = data.services;
        }
        if (rule.id.includes('memory')) {
            relevant.memory = data.performance?.memory;
        }
        if (rule.id.includes('localstack')) {
            relevant.localStackServices = data.localStackServices;
        }

        return relevant;
    }

    /**
     * Send notifications through all enabled channels
     */
    async sendNotifications(alert) {
        const enabledChannels = this.notificationChannels.filter(channel => channel.enabled);
        
        for (const channel of enabledChannels) {
            try {
                await channel.handler(alert);
            } catch (error) {
                console.error(`Failed to send notification via ${channel.name}:`, error.message);
            }
        }
    }

    /**
     * Console notification handler
     */
    async consoleNotificationHandler(alert) {
        const severityEmoji = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨'
        };

        const emoji = severityEmoji[alert.severity] || '📢';
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();
        
        console.log(`\n${emoji} ALERT [${alert.severity.toUpperCase()}] - ${timestamp}`);
        console.log(`Rule: ${alert.ruleName}`);
        console.log(`Message: ${alert.message}`);
        console.log(`ID: ${alert.id}\n`);
    }

    /**
     * File notification handler
     */
    async fileNotificationHandler(alert) {
        const alertsDir = path.join(process.cwd(), '.metrics', 'alerts');
        await fs.mkdir(alertsDir, { recursive: true });
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `alerts-${date}.jsonl`;
        const filepath = path.join(alertsDir, filename);
        
        const logEntry = JSON.stringify(alert) + '\n';
        await fs.appendFile(filepath, logEntry);
    }

    /**
     * Webhook notification handler
     */
    async webhookNotificationHandler(alert) {
        const webhookChannel = this.notificationChannels.find(c => c.id === 'webhook');
        if (!webhookChannel?.url) {
            throw new Error('Webhook URL not configured');
        }

        const payload = {
            alert: {
                id: alert.id,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp,
                ruleName: alert.ruleName
            },
            environment: 'local-development',
            source: 'tattoo-directory-monitoring'
        };

        await axios.post(webhookChannel.url, payload, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TattooDirectory-AlertSystem/1.0'
            }
        });
    }

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId, acknowledgedBy = 'system') {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = acknowledgedBy;
            alert.acknowledgedAt = new Date().toISOString();
            
            this.emit('alert-acknowledged', alert);
            return true;
        }
        return false;
    }

    /**
     * Resolve an alert
     */
    resolveAlert(alertId, resolvedBy = 'system') {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedBy = resolvedBy;
            alert.resolvedAt = new Date().toISOString();
            
            this.emit('alert-resolved', alert);
            return true;
        }
        return false;
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }

    /**
     * Get alert statistics
     */
    getAlertStatistics(timeRangeMs = 24 * 60 * 60 * 1000) { // 24 hours default
        const cutoff = new Date(Date.now() - timeRangeMs);
        const recentAlerts = this.alertHistory.filter(alert => 
            new Date(alert.timestamp) > cutoff
        );

        const stats = {
            total: recentAlerts.length,
            bySeverity: {
                critical: recentAlerts.filter(a => a.severity === 'critical').length,
                warning: recentAlerts.filter(a => a.severity === 'warning').length,
                info: recentAlerts.filter(a => a.severity === 'info').length
            },
            byRule: {},
            active: this.getActiveAlerts().length,
            resolved: recentAlerts.filter(a => a.resolved).length
        };

        // Count by rule
        recentAlerts.forEach(alert => {
            stats.byRule[alert.ruleName] = (stats.byRule[alert.ruleName] || 0) + 1;
        });

        return stats;
    }

    /**
     * Add custom alert rule
     */
    addAlertRule(rule) {
        if (!rule.id || !rule.name || !rule.condition || !rule.message) {
            throw new Error('Alert rule must have id, name, condition, and message');
        }

        this.alertRules.push({
            severity: 'warning',
            cooldown: 300000, // 5 minutes default
            ...rule
        });
    }

    /**
     * Remove alert rule
     */
    removeAlertRule(ruleId) {
        const index = this.alertRules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            this.alertRules.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Configure notification channel
     */
    configureNotificationChannel(channelId, config) {
        const channel = this.notificationChannels.find(c => c.id === channelId);
        if (channel) {
            Object.assign(channel, config);
            return true;
        }
        return false;
    }

    /**
     * Save alert configuration
     */
    async saveConfiguration() {
        const config = {
            alertRules: this.alertRules,
            notificationChannels: this.notificationChannels.map(channel => ({
                id: channel.id,
                name: channel.name,
                enabled: channel.enabled,
                url: channel.url
            }))
        };

        const configDir = path.join(process.cwd(), '.metrics');
        await fs.mkdir(configDir, { recursive: true });
        
        const configPath = path.join(configDir, 'alert-config.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        
        return configPath;
    }

    /**
     * Load alert configuration
     */
    async loadConfiguration() {
        try {
            const configPath = path.join(process.cwd(), '.metrics', 'alert-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            if (config.alertRules) {
                this.alertRules = config.alertRules;
            }
            
            if (config.notificationChannels) {
                // Merge with existing channels, preserving handlers
                config.notificationChannels.forEach(savedChannel => {
                    const existingChannel = this.notificationChannels.find(c => c.id === savedChannel.id);
                    if (existingChannel) {
                        Object.assign(existingChannel, savedChannel);
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.warn('Could not load alert configuration:', error.message);
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const alertSystem = new AlertSystem();
    
    // Load configuration
    alertSystem.loadConfiguration().then(() => {
        console.log('📢 Alert system initialized');
        
        // Setup event listeners for demonstration
        alertSystem.on('alert', (alert) => {
            console.log(`🚨 New alert generated: ${alert.message}`);
        });
        
        alertSystem.on('alert-acknowledged', (alert) => {
            console.log(`✅ Alert acknowledged: ${alert.id}`);
        });
        
        alertSystem.on('alert-resolved', (alert) => {
            console.log(`🔧 Alert resolved: ${alert.id}`);
        });
        
        // Example: Process some test data
        const testData = {
            timestamp: new Date().toISOString(),
            services: {
                'Backend Lambda': {
                    name: 'Backend Lambda',
                    status: 'unhealthy',
                    responseTime: 5000,
                    error: 'Connection timeout'
                }
            },
            performance: {
                memory: {
                    percentage: 90,
                    used: 3600
                }
            },
            overallHealth: 'unhealthy'
        };
        
        console.log('🧪 Processing test monitoring data...');
        alertSystem.processMonitoringData(testData).then(alerts => {
            console.log(`Generated ${alerts.length} alerts`);
            
            // Show statistics
            const stats = alertSystem.getAlertStatistics();
            console.log('📊 Alert Statistics:', stats);
        });
    });
}

module.exports = AlertSystem;