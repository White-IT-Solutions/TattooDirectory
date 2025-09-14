# Comprehensive Environment Monitoring System

This document describes the comprehensive monitoring system implemented for the Tattoo Directory local development environment. The system provides real-time health monitoring, environment validation, alerting, and performance tracking.

## Overview

The monitoring system consists of several integrated components:

- **Health Monitor**: Real-time service health checks with dependency validation
- **Environment Validator**: Comprehensive environment validation with security and performance checks
- **Alert System**: Multi-channel alerting with configurable rules and notifications
- **Monitoring Dashboard**: Web-based real-time dashboard with interactive controls
- **Performance Monitoring**: Baseline validation and performance metrics tracking

## Quick Start

### Start Comprehensive Monitoring

```bash
# Start full monitoring system with dashboard
npm run monitor:comprehensive

# Or use the direct script
node scripts/start-monitoring.js start
```

This will start:
- Real-time health monitoring (every 30 seconds)
- Environment validation (every 5 minutes)
- Alert system with console and file notifications
- Web dashboard at http://localhost:3001

### Run Single Validation Check

```bash
# Run a single comprehensive validation
npm run monitor:validate

# Or use the direct script
node scripts/start-monitoring.js validate
```

### Check Monitoring Status

```bash
# Show current monitoring status
npm run monitor:status
```

## Components

### 1. Health Monitor (`scripts/health-monitor.js`)

Provides real-time health monitoring for all services with dependency validation.

**Features:**
- Service health checks with response time measurement
- Dependency validation (e.g., Backend depends on LocalStack)
- LocalStack service functionality testing
- Performance metrics collection
- Alert generation based on health status

**Usage:**
```bash
# Single health check
npm run monitor:health-advanced

# Continuous monitoring
npm run monitor:health-continuous

# Or direct usage
node scripts/health-monitor.js check
node scripts/health-monitor.js monitor [interval_ms]
```

**Services Monitored:**
- LocalStack (AWS services simulation)
- Backend Lambda (API endpoints)
- Frontend (Next.js development server)
- Swagger UI (API documentation)

### 2. Environment Validator (`scripts/environment-health-validator.js`)

Comprehensive environment validation with security and performance checks.

**Features:**
- Service dependency validation with startup order verification
- LocalStack functionality testing with real operations
- Security configuration validation
- Performance baseline validation
- Environment variable validation
- Docker configuration validation

**Usage:**
```bash
# Single validation
npm run monitor:environment

# Continuous validation
npm run monitor:environment-continuous

# Or direct usage
node scripts/environment-health-validator.js validate
node scripts/environment-health-validator.js monitor [interval_ms]
```

**Validation Areas:**
- Docker environment and container status
- Service dependencies and startup order
- LocalStack service functionality (DynamoDB, OpenSearch, S3, API Gateway)
- Security configuration (environment variables, network isolation)
- Performance baselines (response times, resource usage)

### 3. Alert System (`scripts/alert-system.js`)

Multi-channel alerting system with configurable rules and notifications.

**Features:**
- Configurable alert rules with conditions and cooldowns
- Multiple notification channels (console, file, webhook)
- Alert acknowledgment and resolution tracking
- Alert history and statistics
- Custom alert rule creation

**Usage:**
```bash
# Test alert system
npm run alerts:test

# Or direct usage
node scripts/alert-system.js
```

**Default Alert Rules:**
- Service down (critical)
- Service degraded (warning)
- High response time (warning)
- High memory usage (warning/critical)
- LocalStack service failures (critical)
- Dependency failures (critical)

**Notification Channels:**
- **Console**: Real-time console output with colored formatting
- **File**: JSON log files in `.metrics/alerts/`
- **Webhook**: HTTP POST notifications (configurable URL)

### 4. Comprehensive Monitoring Dashboard (`scripts/comprehensive-monitoring-dashboard.js`)

Web-based real-time dashboard with interactive controls and real-time updates.

**Features:**
- Real-time service health display
- Environment validation status with scores
- Active alerts with acknowledgment/resolution controls
- Performance metrics visualization
- WebSocket-based real-time updates
- Interactive alert management

**Usage:**
```bash
# Start dashboard only
npm run monitor:dashboard

# Or direct usage
node scripts/comprehensive-monitoring-dashboard.js
```

**Dashboard Sections:**
- **Status Bar**: Overall health, connection status, last update time, active alerts
- **Services Health**: Real-time status of all services with response times
- **LocalStack Services**: Status of AWS service simulations
- **Environment Validation**: Validation scores and detailed status
- **Performance Metrics**: Memory usage, response times, container status
- **Active Alerts**: Interactive alert management with acknowledge/resolve actions

### 5. Monitoring Orchestrator (`scripts/start-monitoring.js`)

Central orchestrator that integrates all monitoring components.

**Features:**
- Unified startup and configuration management
- Prerequisite validation
- Configuration management with persistence
- Graceful shutdown handling
- Status reporting

**Usage:**
```bash
# Start comprehensive monitoring
node scripts/start-monitoring.js start

# Run validation check
node scripts/start-monitoring.js validate

# Show status
node scripts/start-monitoring.js status

# Configuration management
node scripts/start-monitoring.js config show
node scripts/start-monitoring.js config reset
```

## Configuration

### Default Configuration

The monitoring system uses the following default configuration:

```json
{
  "dashboard": {
    "port": 3001,
    "healthInterval": 30000,
    "validationInterval": 300000
  },
  "alerts": {
    "enableConsole": true,
    "enableFile": true,
    "enableWebhook": false,
    "webhookUrl": null
  },
  "validation": {
    "enableContinuous": true,
    "interval": 60000,
    "scoreThreshold": 70
  }
}
```

### Configuration Management

```bash
# Show current configuration
npm run monitor:config

# Reset to defaults
npm run monitor:config:reset
```

Configuration is automatically saved to `.metrics/monitoring-config.json`.

### Environment Variables

- `ALERT_WEBHOOK_URL`: Webhook URL for alert notifications
- `MONITORING_PORT`: Dashboard port (default: 3001)

## Alert Rules

### Built-in Alert Rules

| Rule ID | Name | Condition | Severity | Cooldown |
|---------|------|-----------|----------|----------|
| `service-down` | Service Down | Any service status is 'unhealthy' | Critical | 5 minutes |
| `service-degraded` | Service Degraded | Any service status is 'degraded' | Warning | 10 minutes |
| `high-response-time` | High Response Time | Response time > 2000ms | Warning | 5 minutes |
| `memory-usage-high` | High Memory Usage | Memory usage > 85% | Warning | 10 minutes |
| `memory-usage-critical` | Critical Memory Usage | Memory usage > 95% | Critical | 3 minutes |
| `localstack-service-down` | LocalStack Service Down | Any LocalStack service unhealthy | Critical | 5 minutes |
| `dependency-failure` | Service Dependency Failure | Service dependencies failed | Critical | 5 minutes |

### Custom Alert Rules

You can add custom alert rules programmatically:

```javascript
const AlertSystem = require('./scripts/alert-system');
const alertSystem = new AlertSystem();

alertSystem.addAlertRule({
    id: 'custom-rule',
    name: 'Custom Alert Rule',
    condition: (data) => {
        // Your custom condition logic
        return data.someMetric > threshold;
    },
    severity: 'warning',
    message: (data) => `Custom alert: ${data.someMetric}`,
    cooldown: 300000 // 5 minutes
});
```

## Performance Baselines

The system validates performance against these baselines:

| Metric | Baseline | Alert Threshold |
|--------|----------|-----------------|
| LocalStack Response Time | 2000ms | > 2000ms |
| Backend Response Time | 1000ms | > 1000ms |
| Frontend Response Time | 500ms | > 500ms |
| Memory Usage | 85% | > 85% (warning), > 95% (critical) |
| API Throughput | 10 req/s | < 10 req/s |

## File Structure

```
scripts/
├── health-monitor.js                    # Core health monitoring
├── environment-health-validator.js      # Environment validation
├── alert-system.js                     # Alert system
├── comprehensive-monitoring-dashboard.js # Web dashboard
├── start-monitoring.js                  # Orchestrator
├── health-check.js                     # Basic health checks
├── environment-validator.js            # Basic environment validation
└── monitoring-dashboard.js             # Basic dashboard

.metrics/
├── monitoring-config.json              # Configuration
├── alerts/                             # Alert logs
│   └── alerts-YYYY-MM-DD.jsonl
├── validation/                         # Validation reports
│   └── validation-*.json
└── health-report-*.json               # Health reports
```

## Integration with Development Workflow

### Startup Integration

Add monitoring to your development startup:

```bash
# Start local environment with monitoring
npm run local:start && npm run monitor:comprehensive
```

### CI/CD Integration

Use validation checks in CI/CD:

```bash
# Validate environment before tests
npm run monitor:validate
if [ $? -eq 0 ]; then
    echo "Environment validation passed"
    npm run test:integration
else
    echo "Environment validation failed"
    exit 1
fi
```

### Docker Compose Integration

The monitoring system integrates with the existing Docker Compose setup and monitors:

- LocalStack container health
- Backend Lambda container status
- Frontend development server
- Swagger UI availability
- Network connectivity between services

## Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   # Change port in configuration
   MONITORING_PORT=3002 npm run monitor:comprehensive
   ```

2. **Docker not running**
   ```bash
   # Start Docker Desktop first
   docker info
   ```

3. **Services not starting**
   ```bash
   # Check Docker Compose status
   npm run local:status
   
   # View logs
   npm run local:logs
   ```

4. **High memory usage alerts**
   ```bash
   # Check container resource usage
   docker stats
   
   # Restart services
   npm run local:restart
   ```

### Debug Mode

Enable debug logging:

```bash
DEBUG=true npm run monitor:comprehensive
```

### Log Files

Monitor logs are stored in:
- `.metrics/alerts/alerts-YYYY-MM-DD.jsonl` - Alert logs
- `.metrics/validation/validation-*.json` - Validation reports
- Console output for real-time monitoring

## API Endpoints

The monitoring dashboard exposes REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Current health status |
| `/api/validation` | GET | Run validation check |
| `/api/alerts` | GET | Active alerts |
| `/api/alerts/history` | GET | Alert history |
| `/api/alerts/statistics` | GET | Alert statistics |
| `/api/alerts/:id/acknowledge` | POST | Acknowledge alert |
| `/api/alerts/:id/resolve` | POST | Resolve alert |
| `/api/metrics/history` | GET | Metrics history |
| `/api/dashboard/status` | GET | Dashboard status |

## WebSocket Events

Real-time updates via WebSocket:

| Event | Description |
|-------|-------------|
| `health-update` | Service health status update |
| `validation-update` | Environment validation update |
| `new-alert` | New alert generated |
| `alert-acknowledged` | Alert acknowledged |
| `alert-resolved` | Alert resolved |

## Best Practices

1. **Always run validation before starting development**
   ```bash
   npm run monitor:validate && npm run local:start
   ```

2. **Monitor resource usage during development**
   ```bash
   npm run monitor:comprehensive
   ```

3. **Acknowledge alerts promptly to avoid noise**
   - Use the dashboard to acknowledge/resolve alerts
   - Set up webhook notifications for critical alerts

4. **Review alert history regularly**
   ```bash
   # Check alert statistics
   curl http://localhost:3001/api/alerts/statistics
   ```

5. **Customize alert rules for your workflow**
   - Add project-specific alert rules
   - Adjust cooldown periods based on your needs

6. **Use continuous validation for long development sessions**
   ```bash
   npm run monitor:environment-continuous
   ```

## Security Considerations

The monitoring system includes security validation:

- Environment variable security checks
- Network isolation validation
- Container security assessment
- Production environment conflict detection

**Security alerts include:**
- Production environment with local endpoints
- Weak or exposed secrets
- Missing required environment variables
- Excessive open ports
- Container privilege escalation risks

## Performance Impact

The monitoring system is designed to have minimal performance impact:

- Health checks: ~50ms overhead per check
- Memory usage: ~100MB additional
- CPU usage: <5% during monitoring cycles
- Network: Minimal localhost traffic only

## Future Enhancements

Planned improvements:

1. **Metrics Visualization**: Charts and graphs for performance trends
2. **Custom Dashboards**: User-configurable dashboard layouts
3. **Integration Testing**: Automated integration test triggering
4. **Slack/Teams Integration**: Native chat platform notifications
5. **Performance Profiling**: Detailed performance analysis tools
6. **Log Analysis**: Automated log parsing and issue detection

## Support

For issues or questions about the monitoring system:

1. Check the troubleshooting section above
2. Review log files in `.metrics/`
3. Run validation checks to identify issues
4. Check the dashboard for real-time status

The monitoring system is designed to be self-diagnosing and will alert you to most issues automatically.