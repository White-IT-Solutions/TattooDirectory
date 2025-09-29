# Command Reference

This document provides a comprehensive reference for all npm scripts and CLI commands available in the Tattoo Artist Directory MVP project.

## Table of Contents

- [All Commands](#all-commands)

## All Commands

Various commands

### `local:start`

**Script:** `node scripts/deployment/platform-launcher.js start`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run local:start
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `local:stop`

**Script:** `node scripts/deployment/platform-launcher.js stop`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

---

### `local:restart`

**Script:** `npm run local:stop && npm run local:start`

**Description:** Local development command

**Usage Examples:**

**Start local environment:**
```bash
npm run local:restart
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `local:start:windows`

**Script:** `scripts\start-local.bat`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run local:start:windows
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `local:start:unix`

**Script:** `bash scripts/start-local.sh`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run local:start:unix
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `local:stop:windows`

**Script:** `scripts\stop-local.bat`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run local:stop:windows
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `local:stop:unix`

**Script:** `bash scripts/stop-local.sh`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run local:stop:unix
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `local:logs`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml logs -f`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `local:logs:backend`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml logs -f backend`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `local:logs:frontend`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml logs -f frontend`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `local:logs:localstack`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml logs -f localstack`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `local:logs:swagger`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml logs -f swagger-ui`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter
- `u` (optional): short-flag parameter

---

### `local:logs:viewer`

**Script:** `node scripts/log-viewer.js`

**Description:** Local development command

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run local:logs:viewer
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `local:health`

**Script:** `node scripts/monitoring/health-check.js`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run local:health
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `local:clean`

**Script:** `node scripts/deployment/platform-launcher.js clean`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

---

### `local:reset`

**Script:** `npm run local:clean && npm run local:start`

**Description:** Local development command

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run local:reset
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `local:status`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml ps`

**Description:** Local development command

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `local:utils`

**Script:** `node scripts/dev-utils.js`

**Description:** Local development command

**Parameters:**

- `u` (optional): short-flag parameter

---

### `local:test-api`

**Script:** `node scripts/dev-utils.js test`

**Description:** Local development command

**Parameters:**

- `u` (optional): short-flag parameter

---

### `local:cleanup`

**Script:** `node scripts/dev-utils.js cleanup`

**Description:** Local development command

**Parameters:**

- `u` (optional): short-flag parameter

---

### `local:report`

**Script:** `node scripts/dev-utils.js report`

**Description:** Local development command

**Parameters:**

- `u` (optional): short-flag parameter

---

### `local:platform-info`

**Script:** `node scripts/deployment/platform-launcher.js info`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter

---

### `local:docker-info`

**Script:** `node scripts/deployment/platform-launcher.js docker-info`

**Description:** Local development command

**Parameters:**

- `l` (optional): short-flag parameter
- `i` (optional): short-flag parameter

---

### `local:monitor`

**Script:** `node scripts/resource-monitor.js full`

**Description:** Local development command

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run local:monitor
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `local:monitor:live`

**Script:** `node scripts/resource-monitor.js monitor`

**Description:** Local development command

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run local:monitor:live
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `local:resources`

**Script:** `node scripts/resource-monitor.js recommendations`

**Description:** Local development command

**Parameters:**

- `m` (optional): short-flag parameter

---

### `seed`

**Script:** `cd scripts && npm run seed --workspace=scripts --workspace=scripts`

**Description:** Seeds data

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed:clean`

**Script:** `cd scripts && npm run seed --workspace=scripts --workspace=scripts:clean`

**Description:** Seeds data

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed:clean
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed:validate`

**Script:** `cd scripts && npm run seed --workspace=scripts --workspace=scripts:validate`

**Description:** Seeds data

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed:validate
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

**Validate data integrity:**
```bash
npm run seed:validate
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `config`

**Script:** `cd scripts && npm run config`

**Description:** Custom command

**Usage Examples:**

**Run command:**
```bash
npm run config
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `config:validate`

**Script:** `cd scripts && npm run config:validate`

**Description:** Custom command

---

### `config:test`

**Script:** `cd scripts && node test-configuration.js`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run config:test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `state`

**Script:** `cd scripts && npm run state`

**Description:** Custom command

**Usage Examples:**

**Run command:**
```bash
npm run state
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `state:reset`

**Script:** `cd scripts && npm run state:reset`

**Description:** Custom command

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run state:reset
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `setup-data`

**Script:** `node scripts/data-cli.js setup-data`

**Description:** Sets up environment or data

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

---

### `setup-data:frontend-only`

**Script:** `node scripts/data-cli.js setup-data --frontend-only`

**Description:** Sets up environment or data

**Parameters:**

- `frontend` (optional): flag parameter
- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `f` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `setup-data:images-only`

**Script:** `node scripts/data-cli.js setup-data --images-only`

**Description:** Sets up environment or data

**Parameters:**

- `images` (optional): flag parameter
- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `i` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `setup-data:force`

**Script:** `node scripts/data-cli.js setup-data --force`

**Description:** Sets up environment or data

**Parameters:**

- `force` (optional): flag parameter
- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `reset-data`

**Script:** `node scripts/data-cli.js reset-data`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:clean`

**Script:** `node scripts/data-cli.js reset-data clean`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:clean
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:fresh`

**Script:** `node scripts/data-cli.js reset-data fresh`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:fresh
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:minimal`

**Script:** `node scripts/data-cli.js reset-data minimal`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:minimal
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:search-ready`

**Script:** `node scripts/data-cli.js reset-data search-ready`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:search-ready
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:location-test`

**Script:** `node scripts/data-cli.js reset-data location-test`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:location-test
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:style-test`

**Script:** `node scripts/data-cli.js reset-data style-test`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:style-test
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:performance-test`

**Script:** `node scripts/data-cli.js reset-data performance-test`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:performance-test
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-data:frontend-ready`

**Script:** `node scripts/data-cli.js reset-data frontend-ready`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-data:frontend-ready
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `seed-scenario`

**Script:** `node scripts/data-cli.js seed-scenario`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:minimal`

**Script:** `node scripts/data-cli.js seed-scenario minimal`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:minimal
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:search-basic`

**Script:** `node scripts/data-cli.js seed-scenario search-basic`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `b` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:search-basic
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:london-artists`

**Script:** `node scripts/data-cli.js seed-scenario london-artists`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `a` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:london-artists
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:high-rated`

**Script:** `node scripts/data-cli.js seed-scenario high-rated`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:high-rated
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:new-artists`

**Script:** `node scripts/data-cli.js seed-scenario new-artists`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `a` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:new-artists
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:booking-available`

**Script:** `node scripts/data-cli.js seed-scenario booking-available`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `a` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:booking-available
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:portfolio-rich`

**Script:** `node scripts/data-cli.js seed-scenario portfolio-rich`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:portfolio-rich
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:multi-style`

**Script:** `node scripts/data-cli.js seed-scenario multi-style`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:multi-style
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:pricing-range`

**Script:** `node scripts/data-cli.js seed-scenario pricing-range`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:pricing-range
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-scenario:full-dataset`

**Script:** `node scripts/data-cli.js seed-scenario full-dataset`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-scenario:full-dataset
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `validate-data`

**Script:** `node scripts/data-cli.js validate-data`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-data
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-data:consistency`

**Script:** `node scripts/data-cli.js validate-data consistency`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-data:consistency
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-data:images`

**Script:** `node scripts/data-cli.js validate-data images`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-data:images
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-data:studios`

**Script:** `node scripts/data-cli.js validate-studios`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-data:studios
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-data:scenarios`

**Script:** `node scripts/data-cli.js validate-data scenarios`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-data:scenarios
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios`

**Script:** `node scripts/data-cli.js validate-studios`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios:data`

**Script:** `node scripts/data-cli.js validate-studios data`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios:data
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios:relationships`

**Script:** `node scripts/data-cli.js validate-studios relationships`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios:relationships
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios:images`

**Script:** `node scripts/data-cli.js validate-studios images`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios:images
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios:addresses`

**Script:** `node scripts/data-cli.js validate-studios addresses`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios:addresses
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studios:consistency`

**Script:** `node scripts/data-cli.js validate-studios consistency`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studios:consistency
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `seed-studios`

**Script:** `node scripts/data-cli.js seed-studios`

**Description:** Seeds data

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-studios
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-studios:force`

**Script:** `node scripts/data-cli.js seed-studios --force`

**Description:** Seeds data

**Parameters:**

- `force` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-studios:force
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

---

### `seed-studios:validate`

**Script:** `node scripts/data-cli.js seed-studios --validate`

**Description:** Seeds data

**Parameters:**

- `validate` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Basic data seeding:**
```bash
npm run seed-studios:validate
```
Expected output: Data seeded successfully
Notes:
- Ensure LocalStack is running before seeding data

**Validate data integrity:**
```bash
npm run seed-studios:validate
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `reset-studios`

**Script:** `node scripts/data-cli.js reset-studios`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-studios
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `reset-studios:preserve`

**Script:** `node scripts/data-cli.js reset-studios --preserve-relationships`

**Description:** Resets data or state

**Parameters:**

- `preserve` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `p` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-studios:preserve
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `studio-status`

**Script:** `node scripts/data-cli.js studio-status`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `process-studio-images`

**Script:** `node scripts/data-cli.js process-studio-images`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `i` (optional): short-flag parameter

---

### `process-studio-images:force`

**Script:** `node scripts/data-cli.js process-studio-images --force`

**Description:** Runs Node.js script

**Parameters:**

- `force` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `i` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `process-studio-images:validate`

**Script:** `node scripts/data-cli.js process-studio-images --validate`

**Description:** Runs Node.js script

**Parameters:**

- `validate` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `i` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run process-studio-images:validate
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `manage-studio-relationships`

**Script:** `node scripts/data-cli.js manage-studio-relationships`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

---

### `manage-studio-relationships:validate`

**Script:** `node scripts/data-cli.js manage-studio-relationships validate`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run manage-studio-relationships:validate
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `manage-studio-relationships:rebuild`

**Script:** `node scripts/data-cli.js manage-studio-relationships rebuild`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

---

### `manage-studio-relationships:repair`

**Script:** `node scripts/data-cli.js manage-studio-relationships repair`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

---

### `manage-studio-relationships:report`

**Script:** `node scripts/data-cli.js manage-studio-relationships report`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `r` (optional): short-flag parameter

---

### `validate-studio-data-e2e`

**Script:** `node scripts/data-cli.js validate-studio-data-e2e`

**Description:** Validates data or configuration

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studio-data-e2e
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studio-data-e2e:verbose`

**Script:** `node scripts/data-cli.js validate-studio-data-e2e --verbose`

**Description:** Validates data or configuration

**Parameters:**

- `verbose` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studio-data-e2e:verbose
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studio-data-e2e:save-report`

**Script:** `node scripts/data-cli.js validate-studio-data-e2e --save-report`

**Description:** Validates data or configuration

**Parameters:**

- `save` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studio-data-e2e:save-report
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `validate-studio-data-e2e:full`

**Script:** `node scripts/data-cli.js validate-studio-data-e2e --verbose --save-report`

**Description:** Validates data or configuration

**Parameters:**

- `verbose` (optional): flag parameter
- `save` (optional): flag parameter
- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `v` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Validate data integrity:**
```bash
npm run validate-studio-data-e2e:full
```
Expected output: Validation completed with results
Notes:
- Check the output for any validation errors

---

### `health-check`

**Script:** `node scripts/data-cli.js health-check`

**Description:** Checks system health

**Parameters:**

- `c` (optional): short-flag parameter

---

### `studio-health`

**Script:** `node scripts/health-monitor.js health`

**Description:** Runs Node.js script

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio-troubleshoot`

**Script:** `node scripts/health-monitor.js troubleshoot`

**Description:** Runs Node.js script

**Parameters:**

- `m` (optional): short-flag parameter

---

### `data-status`

**Script:** `node scripts/data-cli.js data-status`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `scenarios`

**Script:** `node scripts/data-cli.js scenarios`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter

---

### `reset-states`

**Script:** `node scripts/data-cli.js reset-states`

**Description:** Resets data or state

**Parameters:**

- `c` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run reset-states
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `help`

**Script:** `node scripts/data-cli.js help`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter

---

### `dev:frontend`

**Script:** `cd frontend && npm run dev`

**Description:** Starts development server

**Usage Examples:**

**Start development server:**
```bash
npm run dev:frontend
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:backend`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml up backend`

**Description:** Starts development server

**Parameters:**

- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:backend
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `test:unit`

**Script:** `npm run test --workspace=frontend && npm run test --workspace=backend && npm run test --workspace=scripts`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:unit
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:unit:frontend`

**Script:** `npm run test --workspace=frontend`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:unit:frontend
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:unit:backend`

**Script:** `npm run test --workspace=backend`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:unit:backend
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:unit:scripts`

**Script:** `npm run test --workspace=scripts`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:unit:scripts
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:unit:coverage`

**Script:** `npm run test:coverage --workspace=frontend && npm run test:coverage --workspace=backend && npm run test:coverage --workspace=scripts`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:unit:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration`

**Script:** `npm test --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:api`

**Script:** `npm run test:api --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration:api
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:data`

**Script:** `npm run test:data --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

---

### `test:integration:setup`

**Script:** `npm run test:setup --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration:setup
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:cleanup`

**Script:** `npm run test:cleanup --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration:cleanup
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:coverage`

**Script:** `npm run test:coverage --workspace=@tattoo-directory/integration-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e`

**Script:** `npm test --workspace=tattoo-directory-e2e-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:setup`

**Script:** `npm run setup --workspace=tattoo-directory-e2e-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:setup
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:workflows`

**Script:** `npm run test:workflows --workspace=tattoo-directory-e2e-tests`

**Description:** Runs tests

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:workflows
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:integration`

**Script:** `cd tests/e2e && node run-tests.js tests/integration/**/*.test.js`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:visual`

**Script:** `cd tests/e2e && node run-tests.js tests/visual/**/*.test.js`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:visual
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:headless`

**Script:** `cd tests/e2e && HEADLESS=false npm test`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:headless
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:debug`

**Script:** `cd tests/e2e && DEBUG=true HEADLESS=false npm test`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:debug
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:clean`

**Script:** `cd tests/e2e && npm run local:clean`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:clean
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio`

**Script:** `cd scripts && npm test -- --testPathPattern=studio`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:unit`

**Script:** `cd scripts && npm test -- --testPathPattern=studio.*test.js`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:unit
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:integration`

**Script:** `cd scripts && npm test -- --testPathPattern=studio-pipeline.test.js`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `p` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:relationships`

**Script:** `cd scripts && npm test -- --testPathPattern=relationship-manager.test.js`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:relationships
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:health`

**Script:** `cd scripts && npm test -- --testPathPattern=studio-health`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `h` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:health
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:cli`

**Script:** `cd scripts && npm test -- --testPathPattern=studio-cli-commands.test.js`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:cli
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:data`

**Script:** `cd scripts && npm test -- --testPathPattern=studio-data`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter

---

### `test:studio:frontend`

**Script:** `cd scripts && npm test -- --testPathPattern=studio-frontend-mock.test.js`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter
- `f` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:frontend
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:coverage`

**Script:** `cd scripts && npm test -- --testPathPattern=studio --coverage`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `coverage` (optional): flag parameter
- `t` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:studio:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:studio:watch`

**Script:** `cd scripts && npm test -- --testPathPattern=studio --watch`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `watch` (optional): flag parameter
- `t` (optional): short-flag parameter
- `w` (optional): short-flag parameter

---

### `studio-health:comprehensive`

**Script:** `node scripts/health-monitor.js health --comprehensive`

**Description:** Runs Node.js script

**Parameters:**

- `comprehensive` (optional): flag parameter
- `m` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health:comprehensive
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio-health:quick`

**Script:** `node scripts/health-monitor.js health --quick`

**Description:** Runs Node.js script

**Parameters:**

- `quick` (optional): flag parameter
- `m` (optional): short-flag parameter
- `q` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health:quick
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio-health:relationships`

**Script:** `node scripts/health-monitor.js health --focus=relationships`

**Description:** Runs Node.js script

**Parameters:**

- `focus` (optional): flag parameter
- `m` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health:relationships
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio-health:images`

**Script:** `node scripts/health-monitor.js health --focus=images`

**Description:** Runs Node.js script

**Parameters:**

- `focus` (optional): flag parameter
- `m` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health:images
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio-health:addresses`

**Script:** `node scripts/health-monitor.js health --focus=addresses`

**Description:** Runs Node.js script

**Parameters:**

- `focus` (optional): flag parameter
- `m` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run studio-health:addresses
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `studio:dev-setup`

**Script:** `npm run reset-data --workspace=scripts-data --workspace=scripts-studios && npm run seed --workspace=scripts --workspace=scripts-studios --scenario studio-diverse && npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis-studios`

**Description:** Custom command

**Parameters:**

- `workspace` (optional): flag parameter
- `scenario` (optional): flag parameter
- `d` (optional): short-flag parameter
- `w` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `a` (optional): short-flag parameter

---

### `studio:quick-test`

**Script:** `npm run seed --workspace=scripts --workspace=scripts-studios --scenario minimal && npm run test:studio:unit`

**Description:** Custom command

**Parameters:**

- `workspace` (optional): flag parameter
- `scenario` (optional): flag parameter
- `w` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `studio:full-test`

**Script:** `npm run studio:dev-setup && npm run test:studio && npm run studio-health`

**Description:** Custom command

**Parameters:**

- `s` (optional): short-flag parameter
- `h` (optional): short-flag parameter

---

### `debug:start`

**Script:** `ENABLE_BACKEND_DEBUG=true ENABLE_FRONTEND_DEBUG=true npm run local:start`

**Description:** Custom command

**Usage Examples:**

**Start local environment:**
```bash
npm run debug:start
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `debug:backend`

**Script:** `ENABLE_BACKEND_DEBUG=true npm run local:start`

**Description:** Custom command

---

### `debug:frontend`

**Script:** `ENABLE_FRONTEND_DEBUG=true npm run local:start`

**Description:** Custom command

---

### `logs:start`

**Script:** `node scripts/log-aggregator.js`

**Description:** Runs Node.js script

**Parameters:**

- `a` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run logs:start
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `logs:view`

**Script:** `node scripts/log-viewer.js --follow`

**Description:** Runs Node.js script

**Parameters:**

- `follow` (optional): flag parameter
- `v` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run logs:view
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `logs:backend`

**Script:** `node scripts/log-viewer.js --follow backend`

**Description:** Runs Node.js script

**Parameters:**

- `follow` (optional): flag parameter
- `v` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run logs:backend
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `logs:frontend`

**Script:** `node scripts/log-viewer.js --follow frontend`

**Description:** Runs Node.js script

**Parameters:**

- `follow` (optional): flag parameter
- `v` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run logs:frontend
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `logs:errors`

**Script:** `node scripts/log-viewer.js --level ERROR --follow`

**Description:** Runs Node.js script

**Parameters:**

- `level` (optional): flag parameter
- `follow` (optional): flag parameter
- `v` (optional): short-flag parameter
- `l` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run logs:errors
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `monitor:localstack`

**Script:** `node scripts/localstack-monitor.js watch`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

---

### `monitor:health`

**Script:** `node scripts/localstack-monitor.js health`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:health
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

**Check system health:**
```bash
npm run monitor:health
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `monitor:report`

**Script:** `node scripts/localstack-monitor.js report`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:report
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `monitor:reset`

**Script:** `node scripts/localstack-monitor.js reset`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run monitor:reset
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `performance:monitor`

**Script:** `node scripts/performance-monitor.js`

**Description:** Runs Node.js script

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run performance:monitor
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `performance:monitor:continuous`

**Script:** `node scripts/performance-monitor.js --continuous`

**Description:** Runs Node.js script

**Parameters:**

- `continuous` (optional): flag parameter
- `m` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run performance:monitor:continuous
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `performance:monitor:startup`

**Script:** `node scripts/performance-monitor.js --startup`

**Description:** Runs Node.js script

**Parameters:**

- `startup` (optional): flag parameter
- `m` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run performance:monitor:startup
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `performance:resources`

**Script:** `node scripts/resource-usage-monitor.js --continuous`

**Description:** Runs Node.js script

**Parameters:**

- `continuous` (optional): flag parameter
- `u` (optional): short-flag parameter
- `m` (optional): short-flag parameter
- `c` (optional): short-flag parameter

---

### `performance:resources:once`

**Script:** `node scripts/resource-usage-monitor.js --once`

**Description:** Runs Node.js script

**Parameters:**

- `once` (optional): flag parameter
- `u` (optional): short-flag parameter
- `m` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `performance:benchmark`

**Script:** `node scripts/performance-benchmarks.js --full`

**Description:** Runs Node.js script

**Parameters:**

- `full` (optional): flag parameter
- `b` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `performance:benchmark:quick`

**Script:** `node scripts/performance-benchmarks.js --quick`

**Description:** Runs Node.js script

**Parameters:**

- `quick` (optional): flag parameter
- `b` (optional): short-flag parameter
- `q` (optional): short-flag parameter

---

### `optimize:startup`

**Script:** `node scripts/startup-optimizer.js --optimize`

**Description:** Runs Node.js script

**Parameters:**

- `optimize` (optional): flag parameter
- `o` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run optimize:startup
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `optimize:startup:benchmark`

**Script:** `node scripts/startup-optimizer.js --benchmark`

**Description:** Runs Node.js script

**Parameters:**

- `benchmark` (optional): flag parameter
- `o` (optional): short-flag parameter
- `b` (optional): short-flag parameter

**Usage Examples:**

**Start local environment:**
```bash
npm run optimize:startup:benchmark
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `optimize:cache`

**Script:** `node scripts/docker-cache-optimizer.js --optimize`

**Description:** Runs Node.js script

**Parameters:**

- `optimize` (optional): flag parameter
- `c` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `optimize:cache:analyze`

**Script:** `node scripts/docker-cache-optimizer.js --analyze`

**Description:** Runs Node.js script

**Parameters:**

- `analyze` (optional): flag parameter
- `c` (optional): short-flag parameter
- `o` (optional): short-flag parameter
- `a` (optional): short-flag parameter

---

### `performance:dashboard`

**Script:** `node scripts/performance-dashboard.js`

**Description:** Runs Node.js script

**Parameters:**

- `d` (optional): short-flag parameter

---

### `performance:export`

**Script:** `node scripts/performance-dashboard.js --export`

**Description:** Runs Node.js script

**Parameters:**

- `export` (optional): flag parameter
- `d` (optional): short-flag parameter
- `e` (optional): short-flag parameter

---

### `performance:demo`

**Script:** `node scripts/performance-demo.js`

**Description:** Runs Node.js script

**Parameters:**

- `d` (optional): short-flag parameter

---

### `performance:test`

**Script:** `node scripts/test-performance-monitoring.js`

**Description:** Runs Node.js script

**Parameters:**

- `p` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run performance:test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `monitor:comprehensive`

**Script:** `node scripts/start-monitoring.js start`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

---

### `monitor:validate`

**Script:** `node scripts/start-monitoring.js validate`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

---

### `monitor:status`

**Script:** `node scripts/start-monitoring.js status`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

---

### `monitor:config`

**Script:** `node scripts/start-monitoring.js config show`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

---

### `monitor:config:reset`

**Script:** `node scripts/start-monitoring.js config reset`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Reset data to clean state:**
```bash
npm run monitor:config:reset
```
Expected output: Data reset completed
Notes:
- This will remove all existing data

---

### `monitor:dashboard`

**Script:** `node scripts/comprehensive-monitoring-dashboard.js`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:dashboard
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `monitor:health-advanced`

**Script:** `node scripts/health-monitor.js check`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:health-advanced
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

**Check system health:**
```bash
npm run monitor:health-advanced
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `monitor:health-continuous`

**Script:** `node scripts/health-monitor.js monitor`

**Description:** Monitors system or performance

**Parameters:**

- `m` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:health-continuous
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

**Check system health:**
```bash
npm run monitor:health-continuous
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `monitor:environment`

**Script:** `node scripts/environment-health-validator.js validate`

**Description:** Monitors system or performance

**Parameters:**

- `h` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:environment
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `monitor:environment-continuous`

**Script:** `node scripts/environment-health-validator.js monitor`

**Description:** Monitors system or performance

**Parameters:**

- `h` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run monitor:environment-continuous
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `alerts:test`

**Script:** `node scripts/alert-system.js`

**Description:** Runs Node.js script

**Parameters:**

- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run alerts:test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:monitoring`

**Script:** `node scripts/test-monitoring-system.js`

**Description:** Runs tests

**Parameters:**

- `m` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:monitoring
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `dev:hot-reload`

**Script:** `node dev-tools/hot-reload-proxy.js`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `r` (optional): short-flag parameter
- `p` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:hot-reload
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:mock-data`

**Script:** `node dev-tools/mock-data-generator.js`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `g` (optional): short-flag parameter

---

### `dev:debug-logger`

**Script:** `node dev-tools/debug-logger.js`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `l` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:debug-logger
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:error-tester`

**Script:** `node dev-tools/error-scenario-tester.js`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:error-tester
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:mock-dataset`

**Script:** `node dev-tools/mock-data-generator.js dataset`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `g` (optional): short-flag parameter

---

### `dev:mock-artists`

**Script:** `node dev-tools/mock-data-generator.js artists --count 20`

**Description:** Starts development server

**Parameters:**

- `count` (optional): flag parameter
- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `g` (optional): short-flag parameter
- `c` (optional): short-flag parameter

---

### `dev:mock-search`

**Script:** `node dev-tools/mock-data-generator.js search --style traditional`

**Description:** Starts development server

**Parameters:**

- `style` (optional): flag parameter
- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `g` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `dev:mock-errors`

**Script:** `node dev-tools/mock-data-generator.js error --type validation`

**Description:** Starts development server

**Parameters:**

- `type` (optional): flag parameter
- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `g` (optional): short-flag parameter

---

### `dev:test-errors`

**Script:** `node dev-tools/error-scenario-tester.js test-suite`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:test-errors
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:list-scenarios`

**Script:** `node dev-tools/error-scenario-tester.js list`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:list-scenarios
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:activate-error`

**Script:** `node dev-tools/error-scenario-tester.js activate`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:activate-error
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:deactivate-errors`

**Script:** `node dev-tools/error-scenario-tester.js deactivate-all`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `a` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:deactivate-errors
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:debug-test`

**Script:** `node dev-tools/debug-logger.js test`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `l` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:debug-test
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:debug-export`

**Script:** `node dev-tools/debug-logger.js export`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `l` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:debug-export
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:advanced`

**Script:** `node dev-tools/advanced-dev-manager.js start`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:advanced
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:advanced:stop`

**Script:** `node dev-tools/advanced-dev-manager.js stop`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:advanced:stop
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:advanced:restart`

**Script:** `node dev-tools/advanced-dev-manager.js restart`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:advanced:restart
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

**Start local environment:**
```bash
npm run dev:advanced:restart
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `dev:advanced:status`

**Script:** `node dev-tools/advanced-dev-manager.js status`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:advanced:status
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:advanced:health`

**Script:** `node dev-tools/advanced-dev-manager.js health`

**Description:** Starts development server

**Parameters:**

- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:advanced:health
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `test:all`

**Script:** `npm run test:unit && npm run test:integration && npm run test:e2e`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:all
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive`

**Script:** `node scripts/comprehensive-test-runner.js`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:final-integration`

**Script:** `node scripts/final-integration-tester.js`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:final-integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:frontend-sync-errors`

**Script:** `node scripts/run-frontend-sync-error-tests.js`

**Description:** Runs tests

**Parameters:**

- `f` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:frontend-sync-errors
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:frontend-sync-errors:verbose`

**Script:** `node scripts/run-frontend-sync-error-tests.js --verbose`

**Description:** Runs tests

**Parameters:**

- `verbose` (optional): flag parameter
- `f` (optional): short-flag parameter
- `s` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:frontend-sync-errors:verbose
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `validate:cross-platform`

**Script:** `node scripts/cross-platform-validator.js`

**Description:** Validates data or configuration

**Parameters:**

- `p` (optional): short-flag parameter
- `v` (optional): short-flag parameter

---

### `validate:parity`

**Script:** `node scripts/comprehensive-parity-validator.js validate`

**Description:** Validates data or configuration

**Parameters:**

- `p` (optional): short-flag parameter
- `v` (optional): short-flag parameter

---

### `validate:production-parity`

**Script:** `node scripts/production-parity-validator.js validate`

**Description:** Validates data or configuration

**Parameters:**

- `p` (optional): short-flag parameter
- `v` (optional): short-flag parameter

---

### `validate:deployment`

**Script:** `node scripts/deployment-simulation-tester.js`

**Description:** Validates data or configuration

**Parameters:**

- `s` (optional): short-flag parameter
- `t` (optional): short-flag parameter

---

### `validate:readiness`

**Script:** `node scripts/production-readiness-checklist.js validate`

**Description:** Validates data or configuration

**Parameters:**

- `r` (optional): short-flag parameter
- `c` (optional): short-flag parameter

---

### `validate:all`

**Script:** `npm run test:final-integration && npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis:cross-platform && npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis:parity`

**Description:** Validates data or configuration

**Parameters:**

- `workspace` (optional): flag parameter
- `i` (optional): short-flag parameter
- `w` (optional): short-flag parameter
- `a` (optional): short-flag parameter
- `p` (optional): short-flag parameter

---

### `validate:complete`

**Script:** `npm run test:comprehensive`

**Description:** Validates data or configuration

---

### `ci:test`

**Script:** `npm run test:comprehensive`

**Description:** Custom command

**Usage Examples:**

**Run tests:**
```bash
npm run ci:test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `ci:validate`

**Script:** `npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis:complete`

**Description:** Custom command

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `a` (optional): short-flag parameter

---

### `security:validate`

**Script:** `node scripts/security/security-validator.js validate`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

---

### `security:validate-env`

**Script:** `node scripts/security/environment-validator.js validate`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

---

### `security:validate-network`

**Script:** `node scripts/security/docker-network-security.js validate`

**Description:** Runs Node.js script

**Parameters:**

- `n` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `security:validate-access`

**Script:** `node scripts/security/access-control-manager.js validate`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `m` (optional): short-flag parameter

---

### `security:scan-images`

**Script:** `node scripts/security/docker-image-scanner.js`

**Description:** Runs Node.js script

**Parameters:**

- `i` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `security:fix`

**Script:** `node scripts/security/security-validator.js fix`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:fix
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `security:configure`

**Script:** `node scripts/security/security-validator.js configure`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:configure
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `security:monitor`

**Script:** `node scripts/security/security-validator.js monitor`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Monitor system performance:**
```bash
npm run security:monitor
```
Expected output: Monitoring dashboard or metrics
Notes:
- Use Ctrl+C to stop monitoring

---

### `security:report`

**Script:** `node scripts/security/security-validator.js report`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:report
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `security:template`

**Script:** `node scripts/security/environment-validator.js template`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:template
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `security:sanitize`

**Script:** `node scripts/security/environment-validator.js sanitize`

**Description:** Runs Node.js script

**Parameters:**

- `v` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:sanitize
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `security:configure-network`

**Script:** `node scripts/security/docker-network-security.js configure`

**Description:** Runs Node.js script

**Parameters:**

- `n` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `security:configure-access`

**Script:** `node scripts/security/access-control-manager.js configure`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run security:configure-access
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `local:start:secure`

**Script:** `npm run security:validate && npm run local:start`

**Description:** Local development command

**Usage Examples:**

**Start local environment:**
```bash
npm run local:start:secure
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `local:emergency-stop`

**Script:** `docker-compose -f devtools/docker/docker-compose.local.yml down --remove-orphans && docker network prune -f`

**Description:** Local development command

**Parameters:**

- `remove` (optional): flag parameter
- `c` (optional): short-flag parameter
- `f` (optional): short-flag parameter
- `r` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `docs:consolidate`

**Script:** `node scripts/documentation-consolidation-pipeline.js`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter
- `p` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:consolidate
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:validate`

**Script:** `node scripts/documentation-consolidation-pipeline.js --validate-only`

**Description:** Runs Node.js script

**Parameters:**

- `validate` (optional): flag parameter
- `c` (optional): short-flag parameter
- `p` (optional): short-flag parameter
- `v` (optional): short-flag parameter
- `o` (optional): short-flag parameter

---

### `docs:generate`

**Script:** `npm run docs:consolidate`

**Description:** Custom command

**Usage Examples:**

**Run command:**
```bash
npm run docs:generate
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:test`

**Script:** `node scripts/test-documentation-system.js`

**Description:** Runs Node.js script

**Parameters:**

- `d` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run docs:test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `docs:test-e2e`

**Script:** `node scripts/test-documentation-system.js`

**Description:** Runs Node.js script

**Parameters:**

- `d` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run docs:test-e2e
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `docs:generate-foundation`

**Script:** `cd scripts/documentation-analysis && npm run generate-foundation`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `f` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:generate-foundation
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:validate-foundation`

**Script:** `cd scripts/documentation-analysis && npm run validate-foundation`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `f` (optional): short-flag parameter

---

### `docs:fix-consolidated-links`

**Script:** `cd scripts/documentation-analysis && npm run fix-consolidated-links`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `c` (optional): short-flag parameter
- `l` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:fix-consolidated-links
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:pipeline`

**Script:** `cd scripts/documentation-analysis && npm run pipeline`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:pipeline
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:pipeline:dry-run`

**Script:** `cd scripts/documentation-analysis && npm run pipeline:dry-run`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:pipeline:dry-run
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:gap-analysis`

**Script:** `cd scripts/documentation-analysis && npm run gap-analysis`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:gap-analysis
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:fix-outdated`

**Script:** `cd scripts/documentation-analysis && npm run fix-outdated-content`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `o` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:fix-outdated
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:consolidate-duplicates`

**Script:** `cd scripts/documentation-analysis && npm run consolidate-duplicates`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:consolidate-duplicates
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:create-missing`

**Script:** `cd scripts/documentation-analysis && npm run create-missing-docs`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `m` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:create-missing
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:file-mapping`

**Script:** `cd scripts/documentation-analysis && npm run file-mapping`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:file-mapping
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:delete-duplicates`

**Script:** `cd scripts/documentation-analysis && npm run delete-duplicates`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run docs:delete-duplicates
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `docs:health-summary`

**Script:** `cd scripts/documentation-analysis && npm run docs-health-summary`

**Description:** Custom command

**Parameters:**

- `a` (optional): short-flag parameter
- `h` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Check system health:**
```bash
npm run docs:health-summary
```
Expected output: Health check results
Notes:
- Shows status of all services

---

### `dev`

**Script:** `next dev`

**Description:** Starts development server

**Usage Examples:**

**Start development server:**
```bash
npm run dev
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `dev:docker`

**Script:** `next dev --hostname 0.0.0.0 --port 3000`

**Description:** Starts development server

**Parameters:**

- `hostname` (optional): flag parameter
- `port` (optional): flag parameter
- `h` (optional): short-flag parameter
- `p` (optional): short-flag parameter

**Usage Examples:**

**Start development server:**
```bash
npm run dev:docker
```
Expected output: Development server running on http://localhost:3000
Notes:
- Server will auto-reload on file changes

---

### `build`

**Script:** `next build`

**Description:** Builds the application for production

**Usage Examples:**

**Build for production:**
```bash
npm run build
```
Expected output: Build completed successfully
Notes:
- Output will be in the build/dist directory

---

### `build:analyze`

**Script:** `npm run build && npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis:build`

**Description:** Builds the application for production

**Parameters:**

- `workspace` (optional): flag parameter
- `w` (optional): short-flag parameter
- `a` (optional): short-flag parameter

**Usage Examples:**

**Build for production:**
```bash
npm run build:analyze
```
Expected output: Build completed successfully
Notes:
- Output will be in the build/dist directory

---

### `start`

**Script:** `next start`

**Description:** Starts the application

**Usage Examples:**

**Start local environment:**
```bash
npm run start
```
Expected output: All services started successfully
Notes:
- Includes frontend, backend, and LocalStack services

---

### `lint`

**Script:** `next lint`

**Description:** Lints code for style and errors

**Usage Examples:**

**Run command:**
```bash
npm run lint
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `test`

**Script:** `jest`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:watch`

**Script:** `jest --watch`

**Description:** Runs tests

**Parameters:**

- `watch` (optional): flag parameter
- `w` (optional): short-flag parameter

---

### `test:coverage`

**Script:** `jest --coverage`

**Description:** Runs tests

**Parameters:**

- `coverage` (optional): flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration`

**Script:** `node src/__tests__/runIntegrationTests.js`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:coverage`

**Script:** `node src/__tests__/runIntegrationTests.js --coverage`

**Description:** Runs tests

**Parameters:**

- `coverage` (optional): flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:integration:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:integration:watch`

**Script:** `node src/__tests__/runIntegrationTests.js --watch`

**Description:** Runs tests

**Parameters:**

- `watch` (optional): flag parameter
- `w` (optional): short-flag parameter

---

### `test:accessibility`

**Script:** `playwright test tests/e2e/accessibility`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:accessibility
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:visual`

**Script:** `playwright test tests/e2e/visual-regression`

**Description:** Runs tests

**Parameters:**

- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:visual
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:cross-page`

**Script:** `jest --testPathPattern=CrossPageConsistency.test.jsx`

**Description:** Runs tests

**Parameters:**

- `testPathPattern` (optional): flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:cross-page
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e`

**Script:** `playwright test`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:headed`

**Script:** `playwright test --headed`

**Description:** Runs tests

**Parameters:**

- `headed` (optional): flag parameter
- `h` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:headed
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:debug`

**Script:** `playwright test --debug`

**Description:** Runs tests

**Parameters:**

- `debug` (optional): flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:debug
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:ui`

**Script:** `playwright test --ui`

**Description:** Runs tests

**Parameters:**

- `ui` (optional): flag parameter
- `u` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:ui
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:visual`

**Script:** `playwright test tests/e2e/visual-regression`

**Description:** Runs tests

**Parameters:**

- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:visual
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:accessibility`

**Script:** `playwright test tests/e2e/accessibility`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:accessibility
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:theme`

**Script:** `playwright test tests/e2e/theme-testing`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:theme
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:responsive`

**Script:** `playwright test tests/e2e/responsive`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:responsive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:comprehensive`

**Script:** `playwright test tests/e2e/comprehensive-page-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `p` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:comprehensive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:portfolio`

**Script:** `playwright test tests/e2e/portfolio-gallery-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `g` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:portfolio
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:auth`

**Script:** `playwright test tests/e2e/authentication-flow-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `f` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:auth
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:search`

**Script:** `playwright test tests/e2e/search-interface-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:search
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:errors`

**Script:** `playwright test tests/e2e/error-pages-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `p` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:errors
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:runner`

**Script:** `playwright test tests/e2e/comprehensive-test-runner.test.ts`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:runner
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:all-coverage`

**Script:** `playwright test tests/e2e/comprehensive-page-coverage.test.ts tests/e2e/portfolio-gallery-coverage.test.ts tests/e2e/authentication-flow-coverage.test.ts tests/e2e/search-interface-coverage.test.ts tests/e2e/error-pages-coverage.test.ts`

**Description:** Runs tests

**Parameters:**

- `p` (optional): short-flag parameter
- `c` (optional): short-flag parameter
- `g` (optional): short-flag parameter
- `f` (optional): short-flag parameter
- `i` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:all-coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:execution`

**Script:** `playwright test tests/e2e/comprehensive-test-execution.test.ts`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter
- `e` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:execution
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:orchestrator`

**Script:** `playwright test tests/e2e/comprehensive-test-runner-orchestrator.test.ts`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter
- `r` (optional): short-flag parameter
- `o` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:orchestrator
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:full-suite`

**Script:** `playwright test tests/e2e/comprehensive-test-execution.test.ts tests/e2e/comprehensive-test-runner-orchestrator.test.ts`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter
- `e` (optional): short-flag parameter
- `r` (optional): short-flag parameter
- `o` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:full-suite
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive`

**Script:** `node scripts/run-comprehensive-tests.js`

**Description:** Runs tests

**Parameters:**

- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:core`

**Script:** `node scripts/run-comprehensive-tests.js --suite=core`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:core
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:search`

**Script:** `node scripts/run-comprehensive-tests.js --suite=search`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:search
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:portfolio`

**Script:** `node scripts/run-comprehensive-tests.js --suite=portfolio`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:portfolio
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:auth`

**Script:** `node scripts/run-comprehensive-tests.js --suite=auth`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:auth
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:errors`

**Script:** `node scripts/run-comprehensive-tests.js --suite=errors`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:errors
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:execution`

**Script:** `node scripts/run-comprehensive-tests.js --suite=execution`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:execution
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:orchestrator`

**Script:** `node scripts/run-comprehensive-tests.js --suite=orchestrator`

**Description:** Runs tests

**Parameters:**

- `suite` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `s` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:orchestrator
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:dark`

**Script:** `node scripts/run-comprehensive-tests.js --theme=dark`

**Description:** Runs tests

**Parameters:**

- `theme` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:dark
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:mobile`

**Script:** `node scripts/run-comprehensive-tests.js --viewport=mobile`

**Description:** Runs tests

**Parameters:**

- `viewport` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `v` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:mobile
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:headed`

**Script:** `node scripts/run-comprehensive-tests.js --headed`

**Description:** Runs tests

**Parameters:**

- `headed` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `h` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:headed
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:comprehensive:debug`

**Script:** `node scripts/run-comprehensive-tests.js --debug`

**Description:** Runs tests

**Parameters:**

- `debug` (optional): flag parameter
- `c` (optional): short-flag parameter
- `t` (optional): short-flag parameter
- `d` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:comprehensive:debug
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:e2e:report`

**Script:** `playwright show-report`

**Description:** Runs tests

**Parameters:**

- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:e2e:report
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:ui-audit`

**Script:** `node scripts/ci-integration.js run comprehensive`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:ui-audit
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:ui-audit:visual`

**Script:** `node scripts/ci-integration.js run visual-regression`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter
- `r` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:ui-audit:visual
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:ui-audit:accessibility`

**Script:** `node scripts/ci-integration.js run accessibility`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:ui-audit:accessibility
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:ui-audit:theme`

**Script:** `node scripts/ci-integration.js run theme-testing`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter
- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:ui-audit:theme
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:ui-audit:responsive`

**Script:** `node scripts/ci-integration.js run responsive`

**Description:** Runs tests

**Parameters:**

- `i` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:ui-audit:responsive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `ci:setup`

**Script:** `node scripts/setup-ci.js`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run ci:setup
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `ci:test-integration`

**Script:** `node scripts/ci-integration.js test-integration`

**Description:** Runs Node.js script

**Parameters:**

- `i` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run ci:test-integration
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `ci:test-config`

**Script:** `node scripts/test-ci-config.js`

**Description:** Runs Node.js script

**Parameters:**

- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run ci:test-config
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `ci:status`

**Script:** `node scripts/ci-status.js`

**Description:** Runs Node.js script

**Parameters:**

- `s` (optional): short-flag parameter

**Usage Examples:**

**Run command:**
```bash
npm run ci:status
```
Expected output: Command execution output
Notes:
- Check command documentation for specific usage

---

### `ci:local-workflow`

**Script:** `node scripts/ci-integration.js run`

**Description:** Runs Node.js script

**Parameters:**

- `i` (optional): short-flag parameter

---

### `baselines:update`

**Script:** `playwright test tests/e2e/visual-regression --update-snapshots`

**Description:** Runs Playwright tests

**Parameters:**

- `update` (optional): flag parameter
- `r` (optional): short-flag parameter
- `u` (optional): short-flag parameter
- `s` (optional): short-flag parameter

---

### `baselines:validate`

**Script:** `playwright test tests/e2e/visual-regression --reporter=list`

**Description:** Runs Playwright tests

**Parameters:**

- `reporter` (optional): flag parameter
- `r` (optional): short-flag parameter

---

### `fix:build`

**Script:** `node scripts/fix-build-issues.js`

**Description:** Runs Node.js script

**Parameters:**

- `b` (optional): short-flag parameter
- `i` (optional): short-flag parameter

**Usage Examples:**

**Build for production:**
```bash
npm run fix:build
```
Expected output: Build completed successfully
Notes:
- Output will be in the build/dist directory

---

### `validate:build`

**Script:** `node scripts/validate-build.js`

**Description:** Validates data or configuration

**Parameters:**

- `b` (optional): short-flag parameter

**Usage Examples:**

**Build for production:**
```bash
npm run validate:build
```
Expected output: Build completed successfully
Notes:
- Output will be in the build/dist directory

---

### `deploy:prep`

**Script:** `node scripts/deploy-production.js`

**Description:** Deploys the application

**Parameters:**

- `p` (optional): short-flag parameter

**Usage Examples:**

**Deploy to environment:**
```bash
npm run deploy:prep
```
Expected output: Deployment completed
Notes:
- Ensure proper AWS credentials are configured

---

### `test:theme`

**Script:** `playwright test tests/e2e/theme-testing`

**Description:** Runs tests

**Parameters:**

- `t` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:theme
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:responsive`

**Script:** `playwright test tests/e2e/responsive`

**Description:** Runs tests

**Usage Examples:**

**Run tests:**
```bash
npm run test:responsive
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test`

**Script:** `node --experimental-vm-modules node_modules/jest/bin/jest.js`

**Description:** Runs tests

**Parameters:**

- `experimental` (optional): flag parameter
- `e` (optional): short-flag parameter
- `v` (optional): short-flag parameter
- `m` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---

### `test:watch`

**Script:** `node --experimental-vm-modules node_modules/jest/bin/jest.js --watch`

**Description:** Runs tests

**Parameters:**

- `experimental` (optional): flag parameter
- `watch` (optional): flag parameter
- `e` (optional): short-flag parameter
- `v` (optional): short-flag parameter
- `m` (optional): short-flag parameter
- `w` (optional): short-flag parameter

---

### `test:coverage`

**Script:** `node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage`

**Description:** Runs tests

**Parameters:**

- `experimental` (optional): flag parameter
- `coverage` (optional): flag parameter
- `e` (optional): short-flag parameter
- `v` (optional): short-flag parameter
- `m` (optional): short-flag parameter
- `c` (optional): short-flag parameter

**Usage Examples:**

**Run tests:**
```bash
npm run test:coverage
```
Expected output: Test results with pass/fail status
Notes:
- Ensure test environment is properly set up

---
