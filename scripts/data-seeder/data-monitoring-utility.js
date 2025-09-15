#!/usr/bin/env node

/**
 * Data Monitoring Utility
 * Provides real-time monitoring and alerting for data management operations
 * Tracks data health, performance metrics, and system status
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');

// Configure AWS SDK for LocalStack
const isRunningInContainer = process.env.DOCKER_CONTAINER === 'true' || fs.existsSync('/.dockerenv');
const defaultEndpoint = isRunningInContainer ? 'http://localstack:4566' : 'http://localhost:4566';

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  endpoint: process.env.AWS_ENDPOINT_URL || defaultEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';

class DataMonitoringUtility extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      dynamodb: {
        itemCount: 0,
        lastUpdate: null,
        responseTime: 0,
        errorCount: 0
      },
      opensearch: {
        documentCount: 0,
        lastUpdate: null,
        responseTime: 0,
        errorCount: 0
      },
      consistency: {
        lastCheck: null,
        inconsistencies: 0,
        status: 'unknown'
      }
    };
    this.alerts = [];
    this.thresholds = {
      responseTime: 1000, // ms
      errorRate: 0.05, // 5%
      inconsistencyThreshold: 5
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const hostname = isRunningInContainer ? 'localstack' : 'localhost';
      const options = {
        hostname: hostname,
        port: 4566,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async checkDynamoDBHealth() {
    const startTime = Date.now();
    
    try {
      const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        Select: 'COUNT'
      }).promise();
      
      const responseTime = Date.now() - startTime;
      
      this.metrics.dynamodb = {
        itemCount: result.Count,
        lastUpdate: new Date().toISOString(),
        responseTime: responseTime,
        errorCount: 0
      };
      
      // Check for performance issues
      if (responseTime > this.thresholds.responseTime) {
        this.createAlert('performance', 'DynamoDB', `Response time ${responseTime}ms exceeds threshold`);
      }
      
      return this.metrics.dynamodb;
      
    } catch (error) {
      this.metrics.dynamodb.errorCount++;
      this.createAlert('error', 'DynamoDB', error.message);
      throw error;
    }
  }

  async checkOpenSearchHealth() {
    const startTime = Date.now();
    
    try {
      const result = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
      const responseTime = Date.now() - startTime;
      
      this.metrics.opensearch = {
        documentCount: result.count,
        lastUpdate: new Date().toISOString(),
        responseTime: responseTime,
        errorCount: 0
      };
      
      // Check for performance issues
      if (responseTime > this.thresholds.responseTime) {
        this.createAlert('performance', 'OpenSearch', `Response time ${responseTime}ms exceeds threshold`);
      }
      
      return this.metrics.opensearch;
      
    } catch (error) {
      this.metrics.opensearch.errorCount++;
      this.createAlert('error', 'OpenSearch', error.message);
      throw error;
    }
  }

  async checkDataConsistency() {
    try {
      const dynamoCount = this.metrics.dynamodb.itemCount;
      const osCount = this.metrics.opensearch.documentCount;
      
      // Count only artists for consistency check
      const artistResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: { ':pk': 'ARTIST#' },
        Select: 'COUNT'
      }).promise();
      
      const artistCount = artistResult.Count;
      const inconsistencies = Math.abs(artistCount - osCount);
      
      this.metrics.consistency = {
        lastCheck: new Date().toISOString(),
        inconsistencies: inconsistencies,
        status: inconsistencies === 0 ? 'consistent' : 'inconsistent'
      };
      
      // Check for consistency issues
      if (inconsistencies > this.thresholds.inconsistencyThreshold) {
        this.createAlert('consistency', 'Data', `${inconsistencies} inconsistencies detected`);
      }
      
      return this.metrics.consistency;
      
    } catch (error) {
      this.createAlert('error', 'Consistency Check', error.message);
      throw error;
    }
  }

  createAlert(type, service, message) {
    const alert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: type,
      service: service,
      message: message,
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    this.emit('alert', alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    return alert;
  }

  getAlertSeverity(type) {
    const severityMap = {
      'error': 'high',
      'performance': 'medium',
      'consistency': 'high',
      'warning': 'low'
    };
    return severityMap[type] || 'low';
  }

  async runHealthCheck() {
    console.log('🔍 Running comprehensive health check...');
    
    try {
      await this.checkDynamoDBHealth();
      await this.checkOpenSearchHealth();
      await this.checkDataConsistency();
      
      this.printHealthStatus();
      return true;
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring is already running');
      return;
    }
    
    console.log(`🔄 Starting data monitoring (interval: ${intervalMs}ms)...`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('❌ Monitoring check failed:', error.message);
      }
    }, intervalMs);
    
    // Initial check
    this.runHealthCheck();
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️  Monitoring is not running');
      return;
    }
    
    console.log('🛑 Stopping data monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  printHealthStatus() {
    console.log('\n🏥 System Health Status:');
    console.log('┌─────────────────┬─────────────┬──────────────┬─────────────┐');
    console.log('│ Service         │ Status      │ Response Time│ Last Update │');
    console.log('├─────────────────┼─────────────┼──────────────┼─────────────┤');
    
    const dynamoStatus = this.metrics.dynamodb.errorCount === 0 ? 'Healthy' : 'Error';
    const osStatus = this.metrics.opensearch.errorCount === 0 ? 'Healthy' : 'Error';
    
    console.log(`│ DynamoDB        │ ${dynamoStatus.padEnd(11)} │ ${(this.metrics.dynamodb.responseTime + 'ms').padStart(12)} │ ${(this.metrics.dynamodb.lastUpdate || 'Never').slice(11, 19)} │`);
    console.log(`│ OpenSearch      │ ${osStatus.padEnd(11)} │ ${(this.metrics.opensearch.responseTime + 'ms').padStart(12)} │ ${(this.metrics.opensearch.lastUpdate || 'Never').slice(11, 19)} │`);
    console.log(`│ Consistency     │ ${this.metrics.consistency.status.padEnd(11)} │ ${'N/A'.padStart(12)} │ ${(this.metrics.consistency.lastCheck || 'Never').slice(11, 19)} │`);
    console.log('└─────────────────┴─────────────┴──────────────┴─────────────┘');
    
    console.log('\n📊 Data Metrics:');
    console.log(`  • DynamoDB Items: ${this.metrics.dynamodb.itemCount}`);
    console.log(`  • OpenSearch Documents: ${this.metrics.opensearch.documentCount}`);
    console.log(`  • Data Inconsistencies: ${this.metrics.consistency.inconsistencies}`);
    
    // Show recent alerts
    const recentAlerts = this.alerts.slice(-5);
    if (recentAlerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      recentAlerts.forEach(alert => {
        const severity = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
        console.log(`  ${severity} [${alert.timestamp.slice(11, 19)}] ${alert.service}: ${alert.message}`);
      });
    }
  }

  async generateReport() {
    console.log('📊 Generating monitoring report...');
    
    await this.runHealthCheck();
    
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts.slice(-20), // Last 20 alerts
      summary: {
        totalAlerts: this.alerts.length,
        highSeverityAlerts: this.alerts.filter(a => a.severity === 'high').length,
        systemHealth: this.getOverallHealth(),
        uptime: this.calculateUptime()
      }
    };
    
    const filename = `monitoring-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log(`✅ Report saved to: ${filename}`);
    return report;
  }

  getOverallHealth() {
    const hasErrors = this.metrics.dynamodb.errorCount > 0 || this.metrics.opensearch.errorCount > 0;
    const hasInconsistencies = this.metrics.consistency.inconsistencies > this.thresholds.inconsistencyThreshold;
    const hasPerformanceIssues = this.metrics.dynamodb.responseTime > this.thresholds.responseTime || 
                                 this.metrics.opensearch.responseTime > this.thresholds.responseTime;
    
    if (hasErrors) return 'critical';
    if (hasInconsistencies) return 'degraded';
    if (hasPerformanceIssues) return 'warning';
    return 'healthy';
  }

  calculateUptime() {
    // Simple uptime calculation based on error rate
    const totalChecks = this.metrics.dynamodb.errorCount + this.metrics.opensearch.errorCount + 100; // Assume 100 successful checks
    const errorRate = (this.metrics.dynamodb.errorCount + this.metrics.opensearch.errorCount) / totalChecks;
    return ((1 - errorRate) * 100).toFixed(2) + '%';
  }

  listAlerts(severity = null) {
    console.log('\n🚨 Alert History:');
    
    let filteredAlerts = this.alerts;
    if (severity) {
      filteredAlerts = this.alerts.filter(alert => alert.severity === severity);
    }
    
    if (filteredAlerts.length === 0) {
      console.log('  No alerts found');
      return;
    }
    
    console.log('┌─────────────────────┬──────────────┬─────────────┬─────────────────────────────────────┐');
    console.log('│ Timestamp           │ Service      │ Severity    │ Message                             │');
    console.log('├─────────────────────┼──────────────┼─────────────┼─────────────────────────────────────┤');
    
    filteredAlerts.slice(-10).forEach(alert => {
      const timestamp = alert.timestamp.slice(0, 19).replace('T', ' ');
      const message = alert.message.length > 35 ? alert.message.substring(0, 32) + '...' : alert.message;
      console.log(`│ ${timestamp} │ ${alert.service.padEnd(12)} │ ${alert.severity.padEnd(11)} │ ${message.padEnd(35)} │`);
    });
    
    console.log('└─────────────────────┴──────────────┴─────────────┴─────────────────────────────────────┘');
  }

  clearAlerts() {
    const count = this.alerts.length;
    this.alerts = [];
    console.log(`✅ Cleared ${count} alerts`);
  }

  async testAlertSystem() {
    console.log('🧪 Testing alert system...');
    
    // Create test alerts
    this.createAlert('error', 'Test Service', 'Test error alert');
    this.createAlert('performance', 'Test Service', 'Test performance alert');
    this.createAlert('warning', 'Test Service', 'Test warning alert');
    
    console.log('✅ Test alerts created');
    this.listAlerts();
  }

  // Event handlers for real-time monitoring
  setupEventHandlers() {
    this.on('alert', (alert) => {
      const severity = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${severity} ALERT: [${alert.service}] ${alert.message}`);
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const monitor = new DataMonitoringUtility();
  
  // Setup event handlers
  monitor.setupEventHandlers();

  try {
    switch (command) {
      case 'check':
        await monitor.runHealthCheck();
        break;
        
      case 'monitor':
        const interval = parseInt(args[1]) || 30000;
        monitor.startMonitoring(interval);
        
        // Keep process running
        process.on('SIGINT', () => {
          monitor.stopMonitoring();
          process.exit(0);
        });
        
        // Prevent process from exiting
        setInterval(() => {}, 1000);
        break;
        
      case 'report':
        await monitor.generateReport();
        break;
        
      case 'alerts':
        const severity = args[1];
        monitor.listAlerts(severity);
        break;
        
      case 'clear-alerts':
        monitor.clearAlerts();
        break;
        
      case 'test-alerts':
        await monitor.testAlertSystem();
        break;
        
      default:
        console.log('📊 Data Monitoring Utility Usage:');
        console.log('  node data-monitoring-utility.js check                    - Run single health check');
        console.log('  node data-monitoring-utility.js monitor [interval]       - Start continuous monitoring');
        console.log('  node data-monitoring-utility.js report                   - Generate monitoring report');
        console.log('  node data-monitoring-utility.js alerts [severity]        - List alerts');
        console.log('  node data-monitoring-utility.js clear-alerts             - Clear all alerts');
        console.log('  node data-monitoring-utility.js test-alerts              - Test alert system');
        console.log('\nExample:');
        console.log('  node data-monitoring-utility.js monitor 10000  # Monitor every 10 seconds');
        console.log('  node data-monitoring-utility.js alerts high    # Show only high severity alerts');
        process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Monitoring operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataMonitoringUtility;