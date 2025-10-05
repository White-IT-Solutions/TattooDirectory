# Unified Test CLI - Complete Usage Guide

## Overview

The Unified Test CLI provides a single entry point for executing all test suites in your project with intelligent service validation, data scenario management, and comprehensive reporting.

## Quick Start

### Basic Commands

```bash
# Interactive menu to select test suite
npm run test:cli

# List all available test suites
npm run test:cli:list

# Validate environment and services
npm run test:cli:validate

# Run specific test suite
npm run test:cli:frontend
npm run test:cli:backend
npm run test:cli:integration
```

### First Time Setup

1. **Start required services**:
   ```bash
   npm run local:start
   ```

2. **Validate environment**:
   ```bash
   npm run test:cli:validate
   ```

3. **Run your first test**:
   ```bash
   npm run test:cli:frontend
   ```

## Command Reference

### Interactive Mode

```bash
# Show interactive menu
npm run test:cli
```

This displays a menu where you can select test suites to run.

### Direct Execution

```bash
# Run specific test suite
npm run test:cli -- run <suite-name>

# Examples
npm run test:cli -- run frontend-unit
npm run test:cli -- run backend-unit
npm run test:cli -- run integration
```

### List Command

```bash
# List all available test suites
npm run test:cli:list

# List with JSON output
npm run test:cli -- list --json
```

### Validate Command

```bash
# Validate all services
npm run test:cli:validate

# Validate specific services
npm run test:cli -- validate --services localstack,frontend
```

## Advanced Usage

### Data Scenarios

```bash
# Run with specific data scenario
npm run test:cli -- run integration --scenario minimal
npm run test:cli -- run e2e --scenario frontend-ready
```

### Parallel Execution

```bash
# Run compatible tests in parallel
npm run test:cli:parallel

# Limit concurrent executions
npm run test:cli -- run --parallel --max-parallel 2
```

### Coverage Reports

```bash
# Generate coverage reports
npm run test:cli:coverage

# Run specific suite with coverage
npm run test:cli -- run frontend-unit --coverage
```

### CI/CD Mode

```bash
# Run in CI mode (non-interactive)
npm run test:cli:ci

# Generate CI artifacts
npm run test:cli -- run --ci --junit --json --coverage
```

## Configuration

See [SETUP.md](./SETUP.md) for detailed configuration instructions.

## Troubleshooting

See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common issues and solutions.