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
# npm run local:monitor  # Comprehensive monitoring not yet implemented

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
npm run local:monitor:live

# Or use the direct script
node scripts/start-monitoring.js validate
```

### Check Monitoring Status

```bash
# Show current monitoring status
npm run local:monitor:live
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
npm run local:health

# Continuous monitoring
npm run local:health

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
npm run local:monitor:live

# Continuous validation
npm run local:health

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
# npm run local:health  # Alert testing not yet implemented

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
npm run local:monitor:live

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
npm run local:monitor:live

# Reset to defaults
npm run local:monitor:live
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
npm run local:start && # npm run local:monitor  # Comprehensive monitoring not yet implemented
```

### CI/CD Integration

Use validation checks in CI/CD:

```bash
# Validate environment before tests
npm run local:monitor:live
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
   MONITORING_PORT=3002 # npm run local:monitor  # Comprehensive monitoring not yet implemented
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
DEBUG=true # npm run local:monitor  # Comprehensive monitoring not yet implemented
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
   npm run local:monitor:live && npm run local:start
   ```

2. **Monitor resource usage during development**
   ```bash
   # npm run local:monitor  # Comprehensive monitoring not yet implemented
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
   npm run local:health
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

# Studio Health Monitoring

## Overview

The enhanced health monitor provides comprehensive validation and monitoring capabilities for studio data across all services in the tattoo directory system. This includes studio data consistency validation, artist-studio relationship integrity checking, address and coordinate validation, image accessibility verification, and detailed troubleshooting guidance.

## Features

### 🏢 Studio Data Validation

- **Required Field Validation**: Ensures all studios have essential fields (studioId, studioName, address, postcode, coordinates)
- **UK Postcode Validation**: Validates UK postcode format using regex patterns
- **Coordinate Accuracy**: Verifies latitude/longitude coordinates are within UK geographic bounds
- **Contact Information**: Validates email format, UK phone numbers, and Instagram handle format
- **Opening Hours**: Validates opening hours format (HH:MM-HH:MM or "closed")
- **Specialties**: Validates studio specialties against allowed values
- **Rating Validation**: Ensures ratings are within 1.0-5.0 range

### 🔗 Artist-Studio Relationship Validation

- **Bidirectional Consistency**: Verifies artist-studio references are consistent in both directions
- **Orphaned Reference Detection**: Identifies artists referencing non-existent studios and vice versa
- **Artist Count Validation**: Ensures studio artist count matches actual artist array length
- **Relationship Integrity**: Validates that all relationships are properly maintained

### 🖼️ Studio Image Validation

- **URL Format Validation**: Ensures image URLs are valid HTTP/HTTPS URLs
- **S3 Naming Convention**: Validates studio images follow the `studios/{studioId}/...` pattern
- **Image Accessibility**: Tests actual HTTP accessibility of studio image URLs
- **Image Type Validation**: Validates image types (exterior, interior, gallery)

### 📱 Frontend Mock Data Consistency

- **File Accessibility**: Checks if frontend mock studio data file exists and is readable
- **Data Structure Validation**: Validates mock data contains required fields
- **Count Consistency**: Ensures frontend mock studio count matches backend data
- **Format Validation**: Validates JSON structure and data format

## CLI Commands

### Studio Health Check
```bash
npm run studio-health
```
Runs comprehensive studio health check and displays summary with troubleshooting guidance.

### Studio Data Validation
```bash
npm run validate-data:studios
```
Runs detailed studio data validation and returns JSON results.

### Studio Troubleshooting
```bash
npm run studio-troubleshoot
```
Generates detailed troubleshooting guidance for studio data issues.

### Validation by Type
```bash
# Validate only studio data
npm run validate-data:studios

# Validate all data types including studios
npm run validate-data
```

## Direct CLI Usage

You can also run the health monitor directly:

```bash
# Studio health check
node scripts/health-monitor.js health

# Studio validation
node scripts/health-monitor.js validate --type=studios

# System status
node scripts/health-monitor.js status

# Troubleshooting guidance
node scripts/health-monitor.js troubleshoot

# Help
node scripts/health-monitor.js
```

## Validation Results

### Studio Validation Response Structure

```json
{
  "type": "studios",
  "timestamp": "2025-09-23T14:50:44.716Z",
  "results": {
    "studios": {
      "totalStudios": 5,
      "validStudios": 4,
      "validationRate": "80.0",
      "validationErrors": [
        {
          "studioId": "STUDIO#studio-001",
          "field": "email",
          "value": "invalid-email",
          "error": "Invalid email format",
          "severity": "warning"
        }
      ],
      "relationshipErrors": [
        {
          "type": "orphaned_artist_reference",
          "artistId": "ARTIST#artist-001",
          "studioId": "studio-999",
          "error": "Artist references non-existent studio: studio-999",
          "severity": "error"
        }
      ],
      "addressErrors": [
        {
          "studioId": "STUDIO#studio-002",
          "field": "postcode",
          "value": "INVALID",
          "error": "Invalid UK postcode format",
          "severity": "error"
        }
      ],
      "imageErrors": [
        {
          "studioId": "STUDIO#studio-003",
          "imageUrl": "invalid-url",
          "error": "Image URL should be a valid HTTP/HTTPS URL",
          "severity": "error"
        }
      ],
      "dataConsistencyErrors": [
        {
          "type": "mock_data_count_mismatch",
          "error": "Frontend mock studio count (3) doesn't match backend count (5)",
          "severity": "warning"
        }
      ],
      "lastCheck": "2025-09-23T14:50:44.785Z"
    }
  },
  "errors": []
}
```

### Health Check Summary

```
📊 Studio Health Summary:
  Total Studios: 5
  Valid Studios: 4
  Validation Rate: 80.0%
  Relationship Errors: 1
  Address Errors: 2
  Image Errors: 1
```

## Troubleshooting Guidance

The health monitor provides automatic troubleshooting guidance based on detected issues:

### Low Validation Rate
- Check studio data generation parameters in data-config.js
- Verify studio data seeding completed successfully
- Run: `npm run validate-data:studios` for detailed error report
- Consider regenerating studio data: `npm run seed-studios`

### Relationship Errors
- Check artist-studio relationship consistency
- Verify bidirectional references are maintained
- Run: `npm run validate-data:studios --type=relationships`
- Consider running relationship repair: `npm run manage-studio-relationships:repair`

### Address Validation Errors
- Check UK postcode format validation
- Verify coordinate accuracy for UK locations
- Review address data generation in studio data generator
- Consider updating address validation rules

### Image Accessibility Issues
- Check S3 bucket accessibility and CORS configuration
- Verify studio image naming conventions: `studios/{studioId}/...`
- Run: `npm run process-studio-images` to regenerate images
- Check LocalStack S3 service status

### Studio Count Mismatch
- Check OpenSearch studio index exists and is populated
- Verify studio data seeding completed for both services
- Run: `npm run seed-studios` to reseed studio data
- Check OpenSearch service connectivity

## Integration with Existing Health Monitor

The studio validation is fully integrated with the existing health monitoring system:

- **Service Connectivity**: Includes studio-specific service checks
- **Cross-Service Consistency**: Validates studio data consistency between DynamoDB and OpenSearch
- **Image Accessibility**: Extended to include studio images alongside artist images
- **Data Validation**: Studio validation is part of the comprehensive data validation suite

## Error Severity Levels

- **Error**: Critical issues that prevent proper functionality (missing required fields, invalid relationships)
- **Warning**: Issues that may affect user experience but don't break functionality (invalid contact info, coordinate bounds)

## Monitoring Integration

The studio health monitoring integrates with:

- **Data CLI**: Studio validation available through `data-cli.js`
- **Pipeline Engine**: Health checks run as part of data processing pipeline
- **State Manager**: Studio validation state is tracked and persisted
- **Frontend Sync**: Mock data consistency validation ensures frontend compatibility

## Best Practices

1. **Regular Monitoring**: Run `npm run studio-health` regularly to catch issues early
2. **Validation After Changes**: Always run studio validation after data updates
3. **Address Issues by Severity**: Fix error-level issues before warning-level issues
4. **Monitor Relationships**: Pay special attention to artist-studio relationship consistency
5. **Frontend Consistency**: Ensure frontend mock data stays synchronized with backend data

## Testing

The studio health monitoring includes comprehensive tests:

```bash
# Run studio validation tests
node scripts/__tests__/health-monitor-studio.test.js
```

Test coverage includes:
- Valid studio data validation
- Invalid studio data detection
- Email and phone format validation
- Troubleshooting guidance generation
- Recommendation system testing

## Future Enhancements

Planned improvements include:
- Automated relationship repair functionality
- Performance monitoring for studio data operations
- Advanced geographic validation using external APIs
- Integration with monitoring dashboards
- Automated alerting for critical studio data issues

# Performance Monitoring Guide

This guide covers the performance monitoring and optimization tools available for the local development environment.

## Overview

The performance monitoring system provides comprehensive insights into:
- Container resource usage (CPU, memory, network, disk I/O)
- Service startup times
- API response times
- Frontend load times
- Docker build cache efficiency

## Available Tools

### 1. Performance Monitor (`performance-monitor.js`)

Monitors overall performance metrics including startup times and resource usage.

```bash
# Run one-time performance check
# npm run local:monitor  # Performance monitoring not yet implemented

# Start continuous monitoring (30s intervals)
# npm run local:monitor  # Performance monitoring not yet implemented:continuous

# Monitor startup times only
# npm run local:monitor  # Performance monitoring not yet implemented:startup
```

**Features:**
- Service startup time tracking
- Health check monitoring
- Historical metrics storage
- Alert system for performance issues

### 2. Resource Usage Monitor (`resource-usage-monitor.js`)

Provides detailed real-time monitoring of container resources.

```bash
# Start continuous resource monitoring
npm run local:resources

# Run one-time resource check
npm run local:resources:once

# Custom interval monitoring
node scripts/resource-usage-monitor.js --continuous --interval 5
```

**Metrics Tracked:**
- CPU usage per service
- Memory consumption and limits
- Network I/O (in/out bytes)
- Disk I/O (read/write bytes)
- Process counts
- Container uptime and restart counts

**Thresholds:**
- CPU Warning: 70%, Critical: 85%
- Memory Warning: 75%, Critical: 90%
- Network Warning: 100MB/s, Critical: 500MB/s

### 3. Performance Benchmarks (`performance-benchmarks.js`)

Comprehensive benchmarking suite for measuring environment performance.

```bash
# Run full benchmark suite
# npm run local:monitor  # Performance benchmarking not yet implemented

# Run quick performance check
# npm run local:monitor  # Performance benchmarking not yet implemented:quick
```

**Benchmark Categories:**

#### Startup Performance (Weight: 30%)
- Target: < 60 seconds
- Measures time from `docker-compose up` to all services ready
- Runs multiple iterations for accuracy

#### API Response Time (Weight: 25%)
- Target: < 500ms average
- Tests multiple endpoints:
  - Health check
  - Artists list
  - Artist detail
- Measures p95 response times

#### Frontend Load Time (Weight: 25%)
- Target: < 2000ms
- Tests page load times:
  - Homepage (localhost:3000)
  - API Documentation (localhost:8080)

#### Resource Efficiency (Weight: 20%)
- Target: 80% efficiency score
- Measures resource utilization efficiency
- Lower resource usage = higher score

**Scoring:**
- A+ (90-100): Excellent performance
- A (80-89): Very good performance
- B (70-79): Good performance
- C (60-69): Fair performance
- D (50-59): Poor performance
- F (0-49): Needs improvement

### 4. Startup Optimizer (`startup-optimizer.js`)

Optimizes Docker Compose and container configurations for faster startup.

```bash
# Run all startup optimizations
# npm run local:start  # Startup optimization not yet implemented

# Benchmark startup times
# npm run local:start  # Startup optimization not yet implemented:benchmark
```

**Optimizations Applied:**
- Parallel service startup
- Optimized health check intervals
- Volume caching configuration
- Resource limit tuning
- Dependency optimization

### 5. Docker Cache Optimizer (`docker-cache-optimizer.js`)

Optimizes Docker build processes for better layer caching.

```bash
# Run cache optimizations
# npm run local:clean  # Cache optimization not yet implemented

# Analyze current cache efficiency
# npm run local:clean  # Cache optimization not yet implemented:analyze
```

**Optimizations:**
- Dockerfile layer ordering
- .dockerignore file creation
- Build cache configuration
- Multi-stage build optimization

## Performance Monitoring Workflow

### Initial Setup

1. **Run Baseline Benchmark**
   ```bash
   # npm run local:monitor  # Performance benchmarking not yet implemented
   ```
   This creates a baseline for future comparisons.

2. **Apply Optimizations**
   ```bash
   # npm run local:start  # Startup optimization not yet implemented
   # npm run local:clean  # Cache optimization not yet implemented
   ```

3. **Verify Improvements**
   ```bash
   # npm run local:monitor  # Performance benchmarking not yet implemented
   ```

### Daily Development

1. **Quick Health Check**
   ```bash
   # npm run local:monitor  # Performance benchmarking not yet implemented:quick
   ```

2. **Monitor Resources During Development**
   ```bash
   npm run local:resources
   ```

3. **Check Startup Performance**
   ```bash
   # npm run local:monitor  # Performance monitoring not yet implemented:startup
   ```

### Troubleshooting Performance Issues

#### High CPU Usage
1. Check which service is consuming CPU:
   ```bash
   npm run local:resources:once
   ```

2. Review service logs:
   ```bash
   npm run local:logs
   ```

3. Consider resource limits:
   ```bash
   docker-compose -f docker-compose.local.yml config
   ```

#### Slow Startup Times
1. Run startup benchmark:
   ```bash
   # npm run local:start  # Startup optimization not yet implemented:benchmark
   ```

2. Apply startup optimizations:
   ```bash
   # npm run local:start  # Startup optimization not yet implemented
   ```

3. Check Docker cache efficiency:
   ```bash
   # npm run local:clean  # Cache optimization not yet implemented:analyze
   ```

#### High Memory Usage
1. Monitor memory patterns:
   ```bash
   npm run local:resources
   ```

2. Check for memory leaks in logs:
   ```bash
   npm run local:logs:viewer
   ```

3. Restart problematic services:
   ```bash
   docker-compose -f docker-compose.local.yml restart <service>
   ```

## Performance Targets

### Development Environment Targets
- **Startup Time**: < 60 seconds (all services ready)
- **API Response**: < 500ms p95
- **Frontend Load**: < 2 seconds
- **CPU Usage**: < 70% average per service
- **Memory Usage**: < 75% of allocated limits

### Production Readiness Targets
- **Startup Time**: < 30 seconds
- **API Response**: < 200ms p95
- **Frontend Load**: < 1 second
- **CPU Usage**: < 50% average
- **Memory Usage**: < 60% of allocated limits

## Metrics Storage

### Performance History
- Metrics stored in `.metrics/` directory
- Daily files: `performance-YYYY-MM-DD.json`
- Automatic cleanup of old files (> 30 days)

### Benchmark Results
- Results stored in `.benchmark-results/` directory
- Timestamped files for historical comparison
- Baseline stored in `.performance-baseline.json`

### Resource Reports
- Generated automatically during monitoring
- Includes averages, peaks, and alert summaries
- Exportable for analysis

## Integration with CI/CD

### GitHub Actions Integration
```yaml
- name: Performance Benchmark
  run: |
    npm run local:start
    # npm run local:monitor  # Performance benchmarking not yet implemented:quick
    npm run local:stop
```

### Performance Regression Detection
- Compare benchmark scores with baseline
- Fail builds if performance degrades > 10%
- Generate performance reports in CI

## Advanced Configuration

### Custom Thresholds
Edit monitoring scripts to adjust alert thresholds:

```javascript
// In resource-usage-monitor.js
this.thresholds = {
    cpu: { warning: 60, critical: 80 },
    memory: { warning: 70, critical: 85 }
};
```

### Monitoring Intervals
Adjust monitoring frequency based on needs:

```bash
# Monitor every 5 seconds (high frequency)
node scripts/resource-usage-monitor.js --continuous --interval 5

# Monitor every 60 seconds (low frequency)
node scripts/resource-usage-monitor.js --continuous --interval 60
```

### Custom Benchmarks
Add custom benchmark tests by extending the `PerformanceBenchmarks` class:

```javascript
async benchmarkCustomEndpoint() {
    // Custom benchmark implementation
}
```

## Best Practices

1. **Regular Monitoring**: Run performance checks daily during development
2. **Baseline Updates**: Update baseline after major optimizations
3. **Resource Limits**: Set appropriate Docker resource limits
4. **Cache Management**: Regularly clean Docker cache to prevent disk bloat
5. **Alert Response**: Address performance alerts promptly
6. **Documentation**: Document performance changes and optimizations

## Troubleshooting

### Common Issues

#### "Docker not running" Error
```bash
# Check Docker status
docker info

# Start Docker Desktop (Windows/macOS)
# Or start Docker daemon (Linux)
sudo systemctl start docker
```

#### "Port already in use" Error
```bash
# Check port usage
lsof -i :3000
lsof -i :4566
lsof -i :8080
lsof -i :9000

# Stop conflicting processes or change ports
```

#### "Container not found" Error
```bash
# Check running containers
docker ps

# Check Docker Compose project
docker-compose -f docker-compose.local.yml ps
```

#### High Resource Usage
```bash
# Check system resources
docker system df
docker system prune

# Restart Docker Desktop
# Or restart Docker daemon
```

## Support

For performance-related issues:
1. Check the troubleshooting section above
2. Review performance monitoring logs
3. Run diagnostic commands provided in this guide
4. Check Docker and system resource availability