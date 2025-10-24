# Unified Test CLI

A comprehensive command-line interface that provides a single entry point for executing all test suites in the tattoo directory MVP project. The CLI integrates with existing test infrastructure while adding intelligent service validation, data scenario management, and comprehensive reporting capabilities.

## Features

- **Single Entry Point**: Run any test suite with a unified command interface
- **Environment Validation**: Automatic validation of required services (LocalStack, frontend, backend)
- **Data Scenario Management**: Automatic seeding of test data scenarios
- **Parallel Execution**: Run independent test suites concurrently
- **Comprehensive Reporting**: Console, JUnit XML, and JSON output formats
- **CI/CD Integration**: Non-interactive mode with proper exit codes
- **Interactive Menu**: User-friendly test suite selection

## Quick Start

### Installation

The CLI is already integrated into the npm workspace. No additional installation required.

### Basic Usage

```bash
# Interactive menu to select test suite
npm run test:cli -- run

# Run specific test suite
npm run test:cli:frontend
npm run test:cli:backend
npm run test:cli:integration

# List all available test suites
npm run test:cli:list

# Validate environment
npm run test:cli:validate
```

### Advanced Usage

```bash
# Run with specific data scenario
npm run test:cli -- run frontend-unit --scenario minimal

# Run tests in parallel
npm run test:cli:parallel

# Generate coverage reports
npm run test:cli:coverage

# CI/CD mode (non-interactive)
npm run test:cli:ci

# Generate JUnit XML output
npm run test:cli -- run --junit --output-dir ./test-results

# Verbose output
npm run test:cli -- run backend-unit --verbose
```

## Available Test Suites

| Suite           | Description                     | Services Required             | Data Scenario    | Parallel |
| --------------- | ------------------------------- | ----------------------------- | ---------------- | -------- |
| `frontend-unit` | React component unit tests      | None                          | None             | ✅       |
| `backend-unit`  | Lambda handler unit tests       | None                          | None             | ✅       |
| `integration`   | Cross-service integration tests | LocalStack                    | minimal          | ✅       |
| `e2e`           | End-to-end Playwright tests     | LocalStack, Frontend, Backend | frontend-ready   | ❌       |
| `security`      | Security vulnerability tests    | LocalStack, Backend           | minimal          | ✅       |
| `performance`   | Load testing and benchmarks     | LocalStack, Backend           | performance-test | ❌       |
| `contracts`     | API contract validation         | LocalStack, Backend           | minimal          | ✅       |

## Command Reference

### `run [suite]`

Execute a test suite or show interactive menu.

**Options:**

- `-s, --scenario <name>`: Specify data scenario to use
- `-p, --parallel`: Run tests in parallel where possible
- `--max-parallel <number>`: Maximum number of parallel executions (default: 3)
- `--ci`: Run in CI mode (non-interactive)
- `--coverage`: Generate coverage reports
- `--report`: Generate comprehensive test reports
- `--junit`: Generate JUnit XML output
- `--json`: Generate JSON output
- `--quiet`: Suppress console output
- `--verbose`: Enable verbose output
- `--output-dir <dir>`: Specify output directory for reports (default: ./test-results)

**Examples:**

```bash
# Interactive menu
npm run test:cli

# Run specific suite
npm run test:cli -- run frontend-unit

# Run with custom scenario
npm run test:cli -- run e2e --scenario frontend-ready

# Parallel execution with coverage
npm run test:cli -- run --parallel --coverage

# CI mode with JUnit output
npm run test:cli -- run --ci --junit --output-dir ./ci-results
```

### `list`

List all available test suites with descriptions.

**Options:**

- `--json`: Output in JSON format

**Examples:**

```bash
# Human-readable list
npm run test:cli:list

# JSON output
npm run test:cli -- list --json
```

### `validate`

Validate environment and service availability.

**Options:**

- `--services <services>`: Comma-separated list of services to validate

**Examples:**

```bash
# Validate all services
npm run test:cli:validate

# Validate specific services
npm run test:cli -- validate --services localstack,frontend
```

## Data Scenarios

The CLI automatically manages test data scenarios based on the test suite requirements:

| Scenario           | Description                     | Use Cases                        |
| ------------------ | ------------------------------- | -------------------------------- |
| `minimal`          | Basic dataset for fast tests    | Integration, Security, Contracts |
| `frontend-ready`   | Complete dataset for UI testing | E2E tests                        |
| `performance-test` | Large dataset for load testing  | Performance tests                |
| `search-basic`     | Search-optimized dataset        | Search functionality tests       |

### Custom Scenarios

You can specify custom scenarios using the `--scenario` option:

```bash
npm run test:cli -- run integration --scenario search-basic
```

## Environment Validation

The CLI automatically validates required services before running tests:

### LocalStack Services

- DynamoDB
- OpenSearch
- S3
- Lambda Runtime

### Application Services

- Frontend development server (port 3000)
- Backend Lambda functions

### Validation Errors

If services are not available, the CLI provides actionable error messages:

```
❌ Service localstack is not available: Connection refused
💡 Suggestions:
  • Start LocalStack: npm run local:start
  • Check Docker: docker ps
  • View logs: npm run local:logs:localstack
```

## Reporting

### Console Output

Default human-readable output with color coding:

- ✅ Green for passed tests
- ❌ Red for failed tests
- ⚠️ Yellow for warnings
- ℹ️ Blue for information

### JUnit XML

Generate JUnit XML reports for CI/CD integration:

```bash
npm run test:cli -- run --junit --output-dir ./test-results
```

Output: `./test-results/junit-results.xml`

### JSON Output

Machine-readable JSON format:

```bash
npm run test:cli -- run --json --output-dir ./test-results
```

Output: `./test-results/test-results.json`

### Coverage Reports

Generate test coverage reports:

```bash
npm run test:cli:coverage
```

Coverage reports are generated in `./test-results/coverage/` directory.

## Parallel Execution

The CLI supports parallel execution of independent test suites:

```bash
# Run all compatible suites in parallel
npm run test:cli:parallel

# Limit concurrent executions
npm run test:cli -- run --parallel --max-parallel 2
```

**Parallel-Compatible Suites:**

- frontend-unit
- backend-unit
- integration
- security
- contracts

**Sequential-Only Suites:**

- e2e (requires full application stack)
- performance (resource intensive)

## CI/CD Integration

### Non-Interactive Mode

The CLI automatically detects CI environments and runs in non-interactive mode:

```bash
# Explicit CI mode
npm run test:cli:ci

# Environment detection
CI=true npm run test:cli
```

### Exit Codes

- `0`: All tests passed
- `1`: Test failures or CLI errors
- `2`: Environment validation failed
- `3`: Data seeding failed

### Artifacts

Generate test artifacts for CI/CD pipelines:

```bash
npm run test:cli -- run --ci --junit --json --coverage --output-dir ./ci-artifacts
```

## Configuration

### Test Suite Configuration

Test suites are configured in `config/test-suites.json`. Each suite defines:

```json
{
  "name": "suite-name",
  "displayName": "Human Readable Name",
  "description": "Suite description",
  "type": "unit|integration|e2e|security|performance|contract",
  "workspace": "workspace-path",
  "command": "npm-command-to-run",
  "requiredServices": ["service1", "service2"],
  "dataScenario": "scenario-name",
  "timeout": 60000,
  "canRunParallel": true,
  "supportsCoverage": true,
  "tags": ["tag1", "tag2"]
}
```

### Data Scenario Configuration

Data scenarios are configured in `config/data-scenarios.json`:

```json
{
  "name": "scenario-name",
  "description": "Scenario description",
  "command": "node scripts/data-cli.js seed-scenario scenario-name",
  "estimatedTime": 30000,
  "dependencies": ["localstack"],
  "cleanup": "node scripts/data-cli.js reset-data clean"
}
```

### Service Endpoint Configuration

Service endpoints are configured in `config/service-endpoints.json`:

```json
{
  "localstack": {
    "url": "http://localhost:4566",
    "healthEndpoint": "/_localstack/health",
    "timeout": 5000
  }
}
```

## Troubleshooting

### Common Issues

**1. LocalStack not running**

```
❌ Service localstack is not available
```

**Solution:** Start LocalStack with `npm run local:start`

**2. Frontend not accessible**

```
❌ Service frontend is not available
```

**Solution:** Start frontend with `npm run dev:frontend`

**3. Data seeding failed**

```
❌ Failed to seed data scenario 'frontend-ready'
```

**Solution:** Check LocalStack status and reset data with `npm run reset-data`

**4. Test timeout**

```
❌ Test suite 'e2e' timed out after 300000ms
```

**Solution:** Increase timeout in test suite configuration or check system resources

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
npm run test:cli -- run frontend-unit --verbose
```

### Log Files

Test execution logs are saved to:

- `./test-results/logs/cli.log` - CLI execution log
- `./test-results/logs/[suite].log` - Individual suite logs

## Development

### Adding New Test Suites

1. Add suite configuration to `config/test-suites.json`
2. Create suite implementation in `src/suites/`
3. Add unit tests in `src/suites/__tests__/`
4. Update documentation

### Running CLI Tests

```bash
cd scripts/unified-test-cli
npm test
```

### Test Coverage

```bash
cd scripts/unified-test-cli
npm run test:coverage
```

## Architecture

The CLI follows a modular architecture:

```
src/
├── cli/                    # Command-line interface
├── core/                   # Core orchestration logic
├── suites/                 # Test suite implementations
├── reporters/              # Output formatters
├── utils/                  # Shared utilities
└── config/                 # Configuration files
```

## Contributing

1. Follow existing code patterns and conventions
2. Add unit tests for new functionality
3. Update documentation for user-facing changes
4. Test with all existing test suites before submitting

## License

This project is part of the Tattoo Directory MVP and follows the same licensing terms.
