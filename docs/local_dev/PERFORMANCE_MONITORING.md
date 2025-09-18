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
npm run performance:monitor

# Start continuous monitoring (30s intervals)
npm run performance:monitor:continuous

# Monitor startup times only
npm run performance:monitor:startup
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
npm run performance:resources

# Run one-time resource check
npm run performance:resources:once

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
npm run performance:benchmark

# Run quick performance check
npm run performance:benchmark:quick
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
npm run optimize:startup

# Benchmark startup times
npm run optimize:startup:benchmark
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
npm run optimize:cache

# Analyze current cache efficiency
npm run optimize:cache:analyze
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
   npm run performance:benchmark
   ```
   This creates a baseline for future comparisons.

2. **Apply Optimizations**
   ```bash
   npm run optimize:startup
   npm run optimize:cache
   ```

3. **Verify Improvements**
   ```bash
   npm run performance:benchmark
   ```

### Daily Development

1. **Quick Health Check**
   ```bash
   npm run performance:benchmark:quick
   ```

2. **Monitor Resources During Development**
   ```bash
   npm run performance:resources
   ```

3. **Check Startup Performance**
   ```bash
   npm run performance:monitor:startup
   ```

### Troubleshooting Performance Issues

#### High CPU Usage
1. Check which service is consuming CPU:
   ```bash
   npm run performance:resources:once
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
   npm run optimize:startup:benchmark
   ```

2. Apply startup optimizations:
   ```bash
   npm run optimize:startup
   ```

3. Check Docker cache efficiency:
   ```bash
   npm run optimize:cache:analyze
   ```

#### High Memory Usage
1. Monitor memory patterns:
   ```bash
   npm run performance:resources
   ```

2. Check for memory leaks in logs:
   ```bash
   npm run logs:errors
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
    npm run performance:benchmark:quick
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