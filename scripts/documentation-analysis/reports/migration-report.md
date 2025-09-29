# Legacy Command Migration Report

Generated: 2025-09-29T14:38:12.844Z
Mode: LIVE

## Summary

- **Files Processed**: 41
- **Total Replacements**: 217
- **Commands Migrated**: 13

## Migration Context

**Why so many replacements?**
The high number of replacements (217) is expected because:

1. **Documentation Cross-References**: Command reference documentation lists each command multiple times
2. **Legacy Reports**: Previous analysis reports contain extensive command listings
3. **Script Dependencies**: Multiple scripts reference the same commands
4. **Configuration Files**: Package.json files and configs contain command definitions

**File Distribution:**
- High-impact files (10+ replacements): Documentation and reference files
- Medium-impact files (3-9 replacements): Scripts and configuration files  
- Low-impact files (1-2 replacements): Individual documentation pages

## Migrations Applied

### `npm run seed --workspace=scripts` → `npm run seed --workspace=scripts --workspace=scripts`

**Files affected**: 10
**Total replacements**: 26

- `package.json` (5 occurrences)
- `scripts\package.json` (1 occurrences)
- `scripts\health-monitor.js` (2 occurrences)
- `scripts\data-cli.js` (6 occurrences)
- `scripts\backward-compatibility.js` (2 occurrences)
- `scripts\documentation-analysis\migration-report.md` (3 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (3 occurrences)
- `scripts\data-seeder\selective-seeder.js` (2 occurrences)
- `scripts\documentation-analysis\__tests__\CommandDocumentationGenerator.test.js` (1 occurrences)
- `scripts\documentation-analysis\reports\validation-report.json` (1 occurrences)

### `npm run validate --workspace=scripts/documentation-analysis` → `npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis`

**Files affected**: 12
**Total replacements**: 35

- `package.json` (4 occurrences)
- `scripts\package.json` (1 occurrences)
- `scripts\health-monitor.js` (4 occurrences)
- `scripts\error-handler.js` (1 occurrences)
- `scripts\data-cli.js` (4 occurrences)
- `scripts\backward-compatibility.js` (2 occurrences)
- `frontend\package.json` (1 occurrences)
- `Doc_Review\README_Doc_Analysis.md` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (3 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (6 occurrences)
- `docs\reference\command-reference.md` (1 occurrences)
- `scripts\documentation-analysis\reports\validation-report.json` (7 occurrences)

### `npm run reset-data --workspace=scripts` → `npm run reset-data --workspace=scripts-data --workspace=scripts`

**Files affected**: 6
**Total replacements**: 20

- `package.json` (1 occurrences)
- `scripts\data-cli.js` (13 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `archive\legacy-scripts\data-management-legacy.sh` (1 occurrences)
- `archive\legacy-scripts\data-management-legacy.bat` (1 occurrences)

### `npm run local:clean` → `npm run local:clean`

**Files affected**: 13
**Total replacements**: 22

- `package.json` (2 occurrences)
- `scripts\package.json` (1 occurrences)
- `docs\QUICK_START.md` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `docs\troubleshooting\TROUBLESHOOTING_GUIDE.md` (1 occurrences)
- `docs\testing\data-seeder.md` (1 occurrences)
- `docs\setup\SETUP_MASTER.md` (3 occurrences)
- `docs\reference\command-reference.md` (2 occurrences)
- `scripts\documentation-analysis\scripts\generate-foundation-docs.js` (1 occurrences)
- `scripts\documentation-analysis\scripts\fix-outdated-content.js` (2 occurrences)
- `scripts\documentation-analysis\scripts\create-missing-docs.js` (2 occurrences)
- `scripts\documentation-analysis\reports\validation-report.json` (2 occurrences)

### `npm run test:integration` → `npm run test:integration`

**Files affected**: 22
**Total replacements**: 61

- `package.json` (1 occurrences)
- `docs\QUICK_START.md` (2 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `docs\workflows\testing-strategies.md` (1 occurrences)
- `docs\workflows\monitoring.md` (1 occurrences)
- `docs\workflows\DEVELOPMENT_GUIDE.md` (2 occurrences)
- `docs\workflows\data-management.md` (1 occurrences)
- `docs\testing\CONSOLIDATED_TEST_DOCUMENTATION.md` (8 occurrences)
- `docs\testing\component_testing.md` (1 occurrences)
- `docs\testing\API_TESTING_GUIDE.md` (3 occurrences)
- `docs\setup\SETUP_MASTER.md` (2 occurrences)
- `docs\setup\local-development.md` (1 occurrences)
- `docs\reference\npm-scripts.md` (1 occurrences)
- `docs\reference\command-reference.md` (7 occurrences)
- `archive\archive_docs\VIDEO-TUTORIALS-GUIDE.md` (4 occurrences)
- `archive\archive_docs\LOCAL-DEVELOPMENT-GUIDE.md` (4 occurrences)
- `scripts\documentation-analysis\scripts\generate-foundation-docs.js` (3 occurrences)
- `scripts\documentation-analysis\scripts\fix-outdated-content.js` (1 occurrences)
- `scripts\documentation-analysis\scripts\fix-consolidated-links.js` (2 occurrences)
- `scripts\documentation-analysis\scripts\create-missing-docs.js` (2 occurrences)
- `frontend\src\__tests__\runIntegrationTests.js` (10 occurrences)

### `npm run test:comprehensive` → `npm run test:comprehensive`

**Files affected**: 6
**Total replacements**: 19

- `package.json` (2 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `frontend\scripts\run-comprehensive-tests.js` (1 occurrences)
- `docs\reference\command-reference.md` (11 occurrences)
- `archive\archive_docs\BEST-PRACTICES.md` (1 occurrences)

### `npm run manage-studio-relationships --workspace=scripts` → `npm run manage-studio-relationships --workspace=scripts-studio-relationships --workspace=scripts`

**Files affected**: 3
**Total replacements**: 5

- `scripts\comprehensive-studio-validation.js` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)

### `npm run validate:complete` → `npm run validate --workspace=scripts/documentation-analysis:complete`

**Files affected**: 5
**Total replacements**: 5

- `scripts\validation\final-validation.sh` (1 occurrences)
- `scripts\validation\final-validation.bat` (1 occurrences)
- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)
- `docs\reference\command-reference.md` (1 occurrences)

### `npm run monitor:comprehensive` → `npm run monitor:comprehensive:comprehensive`

**Files affected**: 4
**Total replacements**: 10

- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)
- `docs\workflows\monitoring.md` (5 occurrences)
- `docs\reference\command-reference.md` (1 occurrences)

### `npm run setup-data --workspace=scripts` → `npm run setup-data --workspace=scripts`

**Files affected**: 2
**Total replacements**: 4

- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)

### `npm run seed-scenario --workspace=scripts` → `npm run seed --workspace=scripts-scenario --workspace=scripts`

**Files affected**: 2
**Total replacements**: 2

- `scripts\documentation-analysis\migration-report.md` (1 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (1 occurrences)

### `npm run test:studio --workspace=scripts` → `npm run test:studio --workspace=scripts`

**Files affected**: 2
**Total replacements**: 4

- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)

### `npm run setup-data:force --workspace=scripts` → `npm run setup-data:force --workspace=scripts`

**Files affected**: 2
**Total replacements**: 4

- `scripts\documentation-analysis\migration-report.md` (2 occurrences)
- `scripts\documentation-analysis\migrate-legacy-commands.js` (2 occurrences)


## Next Steps

1. Test the migrated commands to ensure they work correctly
2. Run validation: `npm run validate --workspace=scripts/documentation-analysis --workspace=scripts/documentation-analysis`
3. Run cross-reference check: `npm run cross-reference --workspace=scripts/documentation-analysis`

## Rollback Instructions

If issues occur, restore files from the backup directory created before migration.
