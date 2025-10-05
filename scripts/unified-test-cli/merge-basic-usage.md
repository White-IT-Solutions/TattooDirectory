# Basic Usage Examples

This document provides practical examples of using the Unified Test CLI for common testing scenarios.

## Getting Started

### 1. First Time Setup

```bash
# Start required services
npm run local:start

# Validate environment
npm run test:cli:validate

# List available test suites
npm run test:cli:list
```

### 2. Running Your First Test

```bash
# Interactive menu (recommended for beginners)
npm run test:cli

# Run a specific test suite
npm run test:cli:frontend
```

## Common Usage Patterns

### Unit Testing

```bash
# Run frontend unit tests
npm run test:cli:frontend

# Run backend unit tests
npm run test:cli:backend

# Run both with coverage
npm run test:cli -- run frontend-unit --coverage
npm run test:cli -- run backend-unit --coverage
```

### Integration Testing

```bash
# Run integration tests (requires LocalStack)
npm run test:cli:integration

# Run with specific data scenario
npm run test:cli -- run integration --scenario minimal

# Validate services first, then run tests
npm run test:cli:validate && npm run test:cli:integration
```

### End-to-End Testing

```bash
# Run E2E tests (requires full stack)
npm run test:cli:e2e

# Run with frontend-ready data
npm run test:cli -- run e2e --scenario frontend-ready

# Run in headless mode with verbose output
npm run test:cli -- run e2e --verbose
```

### Specialized Testing

```bash
# Security testing
npm run test:cli:security

# Performance testing
npm run test:cli:performance

# Contract testing
npm run test:cli:contracts
```

## Parallel Execution

### Basic Parallel Testing

```bash
# Run compatible tests in parallel
npm run test:cli:parallel

# Limit concurrent executions
npm run test:cli -- run --parallel --max-parallel 2
```

### Advanced Parallel Scenarios

```bash
# Run unit tests in parallel with coverage
npm run test:cli -- run --parallel --coverage --max-parallel 4

# Run specific suites in parallel
npm run test:cli -- run frontend-unit,backend-unit,integration --parallel
```

## Data Scenario Management

### Using Predefined Scenarios

```bash
# Use minimal data for fast tests
npm run test:cli -- run integration --scenario minimal

# Use rich dataset for comprehensive testing
npm run test:cli -- run e2e --scenario frontend-ready

# Use performance dataset for load testing
npm run test:cli -- run performance --scenario performance-test
```

### Custom Data Scenarios

```bash
# Create custom scenario
npm run seed-scenario:custom-test-data

# Run tests with custom scenario
npm run test:cli -- run integration --scenario custom-test-data

# Clean up after testing
npm run reset-data:clean
```

## Output and Reporting

### Console Output

```bash
# Default console output
npm run test:cli:frontend

# Quiet mode (minimal output)
npm run test:cli -- run frontend-unit --quiet

# Verbose mode (detailed output)
npm run test:cli -- run frontend-unit --verbose
```

### File Output

```bash
# Generate JUnit XML for CI
npm run test:cli -- run --junit --output-dir ./test-results

# Generate JSON report
npm run test:cli -- run --json --output-dir ./test-results

# Generate comprehensive report
npm run test:cli -- run --report --output-dir ./test-results
```

### Coverage Reports

```bash
# Generate coverage for single suite
npm run test:cli -- run frontend-unit --coverage

# Generate coverage for multiple suites
npm run test:cli -- run --parallel --coverage

# Specify coverage output directory
npm run test:cli -- run --coverage --output-dir ./coverage-reports
```

## Environment Validation

### Basic Validation

```bash
# Validate all services
npm run test:cli:validate

# Validate specific services
npm run test:cli -- validate --services localstack,frontend
```

### Troubleshooting with Validation

```bash
# Check if LocalStack is running
npm run test:cli -- validate --services localstack

# Validate before running tests
npm run test:cli:validate && npm run test:cli:e2e

# Get detailed validation information
npm run test:cli -- validate --verbose
```

## CI/CD Integration

### Basic CI Usage

```bash
# Run in CI mode (non-interactive)
npm run test:cli:ci

# Generate CI artifacts
npm run test:cli -- run --ci --junit --json --coverage
```

### Advanced CI Scenarios

```bash
# Run critical tests only
npm run test:cli -- run frontend-unit,backend-unit,integration --ci

# Generate comprehensive CI report
npm run test:cli -- run --ci --junit --json --coverage --report --output-dir ./ci-results

# Set custom timeout for CI
TEST_TIMEOUT=300000 npm run test:cli:ci
```

## Error Handling and Debugging

### Debug Mode

```bash
# Enable verbose logging
npm run test:cli -- run frontend-unit --verbose

# Debug specific suite
DEBUG=true npm run test:cli -- run integration

# Check logs after failure
cat ./test-results/logs/cli.log
```

### Handling Failures

```bash
# Continue on failure (don't exit on first failure)
npm run test:cli -- run --parallel --continue-on-failure

# Retry failed tests
npm run test:cli -- run frontend-unit --retries 2

# Get detailed error information
npm run test:cli -- run integration --verbose --json
```

## Performance Optimization

### Fast Testing

```bash
# Run only fast tests
npm run test:cli -- run frontend-unit,backend-unit --parallel

# Use minimal data scenario
npm run test:cli -- run integration --scenario minimal

# Skip coverage for faster execution
npm run test:cli -- run --parallel --no-coverage
```

### Resource Management

```bash
# Limit parallel executions for resource-constrained environments
npm run test:cli -- run --parallel --max-parallel 2

# Monitor resource usage during testing
npm run performance:monitor &
npm run test:cli:parallel
```

## Custom Workflows

### Development Workflow

```bash
# Quick development check
npm run test:cli -- run frontend-unit,backend-unit --parallel --quiet

# Pre-commit validation
npm run test:cli:validate && npm run test:cli -- run --parallel --coverage

# Full development test suite
npm run test:cli -- run --parallel --coverage --report
```

### Release Workflow

```bash
# Comprehensive pre-release testing
npm run test:cli -- run --ci --parallel --coverage --junit --json --report

# Security and performance validation
npm run test:cli:security && npm run test:cli:performance

# Final integration test
npm run test:cli:e2e --scenario frontend-ready
```

### Debugging Workflow

```bash
# Isolate failing test
npm run test:cli -- run problematic-suite --verbose

# Test with clean data
npm run reset-data:clean && npm run test:cli -- run integration

# Validate environment after failure
npm run test:cli:validate
```

## Tips and Best Practices

### 1. Start Simple

Begin with unit tests before moving to integration and E2E tests:

```bash
npm run test:cli:frontend  # Start here
npm run test:cli:backend   # Then this
npm run test:cli:integration  # Then integration
npm run test:cli:e2e       # Finally E2E
```

### 2. Use Appropriate Data Scenarios

Match data scenarios to test requirements:

```bash
# Fast tests - minimal data
npm run test:cli -- run integration --scenario minimal

# UI tests - rich data
npm run test:cli -- run e2e --scenario frontend-ready

# Load tests - performance data
npm run test:cli -- run performance --scenario performance-test
```

### 3. Leverage Parallel Execution

Run independent tests in parallel for faster feedback:

```bash
# Good: Independent unit tests
npm run test:cli -- run frontend-unit,backend-unit --parallel

# Avoid: Dependent tests in parallel
# Don't run e2e and performance tests together
```

### 4. Monitor Resource Usage

Keep an eye on system resources during testing:

```bash
# Monitor while testing
npm run performance:monitor &
npm run test:cli:parallel

# Check resource recommendations
npm run local:resources
```

### 5. Use Validation Early

Always validate your environment before running tests:

```bash
# Good practice
npm run test:cli:validate && npm run test:cli:e2e

# Saves time debugging environment issues
```

These examples should help you get started with the Unified Test CLI and develop effective testing workflows for your project.
