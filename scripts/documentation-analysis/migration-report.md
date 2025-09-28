# Legacy Command Migration Report

Generated: 2025-09-28T13:12:20.649Z
Mode: LIVE

## Summary

- **Files Processed**: 66
- **Total Replacements**: 701
- **Commands Migrated**: 13

## Migration Context

**Why so many replacements?**
The high number of replacements (701) is expected because:

1. **Documentation Cross-References**: Command reference documentation lists each command multiple times
2. **Legacy Reports**: Previous analysis reports contain extensive command listings
3. **Script Dependencies**: Multiple scripts reference the same commands
4. **Configuration Files**: Package.json files and configs contain command definitions

**File Distribution:**
- High-impact files (10+ replacements): Documentation and reference files
- Medium-impact files (3-9 replacements): Scripts and configuration files  
- Low-impact files (1-2 replacements): Individual documentation pages

## Migrations Applied

### `npm run seed` → `npm run seed --workspace=scripts`

**Files affected**: 45
**Total replacements**: 178

- `README.md` (5 occurrences)
- `package.json` (5 occurrences)
- `scripts\package.json` (1 occurrences)
- `scripts\health-monitor.js` (2 occurrences)
- `scripts\data-cli.js` (6 occurrences)
- `scripts\backward-compatibility.js` (2 occurrences)
- `docs\QUICK_START.md` (2 occurrences)
- `scripts\documentation-analysis\migration-report.md` (3 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (3 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (4 occurrences)
- `scripts\data-seeder\selective-seeder.js` (2 occurrences)
- `docs\workflows\testing-strategies.md` (4 occurrences)
- `docs\workflows\deployment-process.md` (2 occurrences)
- `docs\setup\local-development.md` (5 occurrences)
- `docs\setup\docker-setup.md` (1 occurrences)
- `docs\scripts\README_DATA_SEEDER.md` (1 occurrences)
- `docs\scripts\README.md` (4 occurrences)
- `docs\scripts\npm-commands-fix-summary.md` (4 occurrences)
- `docs\scripts\npm-command-test-summary.md` (4 occurrences)
- `docs\scripts\migration-validation-report.md` (2 occurrences)
- `docs\scripts\compatibility-matrix.md` (1 occurrences)
- `docs\reference\command-reference.md` (17 occurrences)
- `docs\planning\TROUBLESHOOTING.md` (7 occurrences)
- `docs\planning\STUDIO_HEALTH_MONITORING.md` (2 occurrences)
- `docs\planning\STUDIO_CLI_COMMANDS.md` (10 occurrences)
- `docs\planning\PRODUCTION_READY_REPORT.md` (1 occurrences)
- `docs\planning\FRONTEND_SYNC_CONSOLIDATION.md` (2 occurrences)
- `scripts\documentation-analysis\__tests__\CommandDocumentationGenerator.test.js` (1 occurrences)
- `docs\localstack\troubleshooting\VIDEO-TUTORIALS-GUIDE.md` (1 occurrences)
- `docs\localstack\troubleshooting\BEST-PRACTICES.md` (1 occurrences)
- `docs\localstack\setup\SETUP_MASTER.md` (6 occurrences)
- `docs\localstack\setup\README_Development_Workflow.md` (7 occurrences)
- `docs\localstack\setup\LOCAL-DEVELOPMENT-GUIDE.md` (3 occurrences)
- `docs\localstack\setup\DOCUMENTATION_UPDATES.md` (7 occurrences)
- `docs\consolidated\troubleshooting\README.md` (7 occurrences)
- `docs\consolidated\reference\commands.md` (17 occurrences)
- `docs\consolidated\getting-started\README.md` (2 occurrences)
- `docs\consolidated\getting-started\docker-setup.md` (1 occurrences)
- `docs\consolidated\development\local-setup.md` (5 occurrences)
- `docs\consolidated\deployment\process.md` (2 occurrences)
- `docs\components\scripts\README.md` (6 occurrences)
- `docs\consolidated\troubleshooting\localstack\VIDEO-TUTORIALS-GUIDE.md` (1 occurrences)
- `docs\consolidated\troubleshooting\localstack\BEST-PRACTICES.md` (1 occurrences)
- `docs\consolidated\development\testing\strategies.md` (4 occurrences)
- `docs\consolidated\development\scripts\README.md` (4 occurrences)

### `npm run validate` → `npm run validate --workspace=scripts/documentation-analysis`

**Files affected**: 45
**Total replacements**: 203

- `README.md` (3 occurrences)
- `package.json` (4 occurrences)
- `scripts\package.json` (1 occurrences)
- `scripts\health-monitor.js` (4 occurrences)
- `scripts\error-handler.js` (1 occurrences)
- `scripts\data-cli.js` (4 occurrences)
- `scripts\backward-compatibility.js` (2 occurrences)
- `frontend\package.json` (1 occurrences)
- `docs\QUICK_START.md` (1 occurrences)
- `scripts\documentation-analysis\README.md` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (3 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (6 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (7 occurrences)
- `scripts\documentation-analysis\COMMAND_ANALYSIS_SUMMARY.md` (1 occurrences)
- `docs\workflows\testing-strategies.md` (3 occurrences)
- `docs\workflows\deployment-process.md` (3 occurrences)
- `docs\workflows\data-management.md` (11 occurrences)
- `docs\setup\local-development.md` (3 occurrences)
- `docs\setup\frontend-only.md` (1 occurrences)
- `docs\setup\dependencies.md` (1 occurrences)
- `docs\scripts\README_DATA_SEEDER.md` (1 occurrences)
- `docs\scripts\README.md` (1 occurrences)
- `docs\scripts\npm-command-test-summary.md` (4 occurrences)
- `docs\scripts\migration-validation-report.md` (1 occurrences)
- `docs\scripts\DATA-MANAGEMENT.md` (1 occurrences)
- `docs\scripts\compatibility-matrix.md` (1 occurrences)
- `docs\reference\command-reference.md` (18 occurrences)
- `docs\planning\TROUBLESHOOTING.md` (26 occurrences)
- `docs\planning\STUDIO_HEALTH_MONITORING.md` (5 occurrences)
- `docs\planning\STUDIO_CLI_COMMANDS.md` (13 occurrences)
- `docs\planning\FRONTEND_SYNC_CONSOLIDATION.md` (1 occurrences)
- `docs\localstack\troubleshooting\VIDEO-TUTORIALS-GUIDE.md` (1 occurrences)
- `docs\localstack\setup\SETUP_MASTER.md` (1 occurrences)
- `docs\localstack\setup\LOCAL-DEVELOPMENT-GUIDE.md` (1 occurrences)
- `docs\localstack\setup\DOCUMENTATION_UPDATES.md` (1 occurrences)
- `docs\consolidated\troubleshooting\README.md` (26 occurrences)
- `docs\consolidated\reference\commands.md` (17 occurrences)
- `docs\consolidated\getting-started\README.md` (1 occurrences)
- `docs\consolidated\getting-started\dependencies.md` (1 occurrences)
- `docs\consolidated\development\local-setup.md` (3 occurrences)
- `docs\consolidated\deployment\process.md` (3 occurrences)
- `docs\components\scripts\README.md` (10 occurrences)
- `docs\consolidated\troubleshooting\localstack\VIDEO-TUTORIALS-GUIDE.md` (1 occurrences)
- `docs\consolidated\development\testing\strategies.md` (3 occurrences)
- `docs\consolidated\development\scripts\README.md` (1 occurrences)

### `npm run reset` → `npm run reset-data --workspace=scripts`

**Files affected**: 29
**Total replacements**: 129

- `README.md` (3 occurrences)
- `package.json` (1 occurrences)
- `scripts\data-cli.js` (13 occurrences)
- `docs\QUICK_START.md` (2 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (3 occurrences)
- `docs\workflows\testing-strategies.md` (3 occurrences)
- `docs\workflows\deployment-process.md` (1 occurrences)
- `docs\setup\local-development.md` (2 occurrences)
- `docs\scripts\README.md` (5 occurrences)
- `docs\scripts\npm-commands-fix-summary.md` (7 occurrences)
- `docs\scripts\npm-command-test-summary.md` (9 occurrences)
- `docs\scripts\migration-validation-report.md` (2 occurrences)
- `docs\scripts\DATA-MANAGEMENT.md` (1 occurrences)
- `docs\scripts\compatibility-matrix.md` (2 occurrences)
- `docs\reference\command-reference.md` (12 occurrences)
- `docs\planning\TROUBLESHOOTING.md` (7 occurrences)
- `docs\planning\STUDIO_CLI_COMMANDS.md` (8 occurrences)
- `archive\legacy-scripts\data-management-legacy.sh` (1 occurrences)
- `archive\legacy-scripts\data-management-legacy.bat` (1 occurrences)
- `docs\consolidated\troubleshooting\README.md` (7 occurrences)
- `docs\consolidated\reference\commands.md` (12 occurrences)
- `docs\consolidated\getting-started\README.md` (2 occurrences)
- `docs\consolidated\development\local-setup.md` (2 occurrences)
- `docs\consolidated\deployment\process.md` (1 occurrences)
- `docs\components\scripts\README.md` (10 occurrences)
- `docs\consolidated\development\testing\strategies.md` (3 occurrences)
- `docs\consolidated\development\scripts\README.md` (5 occurrences)

### `npm run clean` → `npm run local:clean`

**Files affected**: 11
**Total replacements**: 17

- `package.json` (1 occurrences)
- `scripts\package.json` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)
- `docs\workflows\data-management.md` (2 occurrences)
- `docs\scripts\README_DATA_SEEDER.md` (1 occurrences)
- `docs\reference\command-reference.md` (5 occurrences)
- `docs\tests\e2e\README.md` (2 occurrences)
- `docs\localstack\setup\SETUP_MASTER.md` (1 occurrences)
- `docs\localstack\setup\DOCUMENTATION_UPDATES.md` (1 occurrences)

### `npm run manage` → `npm run manage-studio-relationships --workspace=scripts`

**Files affected**: 12
**Total replacements**: 44

- `scripts\comprehensive-studio-validation.js` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (3 occurrences)
- `docs\workflows\data-management.md` (2 occurrences)
- `docs\scripts\DATA-MANAGEMENT.md` (1 occurrences)
- `docs\reference\command-reference.md` (5 occurrences)
- `docs\planning\TROUBLESHOOTING.md` (6 occurrences)
- `docs\planning\STUDIO_CLI_COMMANDS.md` (10 occurrences)
- `docs\consolidated\troubleshooting\README.md` (6 occurrences)
- `docs\consolidated\reference\commands.md` (5 occurrences)
- `docs\components\scripts\README.md` (1 occurrences)

### `npm run final-validation` → `npm run validate:complete`

**Files affected**: 5
**Total replacements**: 5

- `scripts\validation\final-validation.sh` (1 occurrences)
- `scripts\validation\final-validation.bat` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)

### `npm run monitor` → `npm run monitor:comprehensive`

**Files affected**: 19
**Total replacements**: 103

- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (3 occurrences)
- `docs\workflows\testing-strategies.md` (2 occurrences)
- `docs\workflows\monitoring.md` (4 occurrences)
- `docs\workflows\data-management.md` (3 occurrences)
- `docs\setup\local-development.md` (1 occurrences)
- `docs\reference\command-reference.md` (14 occurrences)
- `docs\localstack\troubleshooting\VIDEO-TUTORIALS-GUIDE.md` (3 occurrences)
- `docs\localstack\troubleshooting\TROUBLESHOOTING_MASTER.md` (5 occurrences)
- `docs\localstack\troubleshooting\MONITORING_SYSTEM.md` (17 occurrences)
- `docs\consolidated\reference\commands.md` (14 occurrences)
- `docs\consolidated\development\local-setup.md` (1 occurrences)
- `docs\consolidated\deployment\monitoring.md` (4 occurrences)
- `docs\components\scripts\README.md` (1 occurrences)
- `docs\consolidated\troubleshooting\localstack\VIDEO-TUTORIALS-GUIDE.md` (3 occurrences)
- `docs\consolidated\troubleshooting\localstack\TROUBLESHOOTING_MASTER.md` (5 occurrences)
- `docs\consolidated\troubleshooting\localstack\MONITORING_SYSTEM.md` (17 occurrences)
- `docs\consolidated\development\testing\strategies.md` (2 occurrences)

### `npm run sync` → `npm run setup-data --workspace=scripts`

**Files affected**: 4
**Total replacements**: 5

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)
- `docs\workflows\data-management.md` (2 occurrences)

### `npm run selective` → `npm run seed-scenario --workspace=scripts`

**Files affected**: 3
**Total replacements**: 3

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)

### `npm run test-utilities` → `npm run test:studio --workspace=scripts`

**Files affected**: 3
**Total replacements**: 3

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)

### `npm run integration-test` → `npm run test:integration`

**Files affected**: 3
**Total replacements**: 3

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)

### `npm run migrate` → `npm run setup-data:force --workspace=scripts`

**Files affected**: 4
**Total replacements**: 5

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)
- `docs\reference\command-reference.md` (2 occurrences)

### `npm run enhanced-integration-test` → `npm run test:comprehensive`

**Files affected**: 3
**Total replacements**: 3

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `scripts\documentation-analysis\LEGACY_COMMAND_MIGRATION_GUIDE.md` (1 occurrences)


## Next Steps

1. Test the migrated commands to ensure they work correctly
2. Run validation: `npm run validate --workspace=scripts/documentation-analysis`
3. Run cross-reference check: `npm run cross-reference --workspace=scripts/documentation-analysis`

## Rollback Instructions

If issues occur, restore files from the backup directory created before migration.
