# Legacy Command Migration Guide

This guide helps migrate from legacy commands in `backups/legacy-scripts-20250918/data-seeder/` to their current equivalents.

## Understanding Command Counts

**Important Note**: The project has 514 total "commands" but many are workspace variations of the same base command:

- **Base Commands**: ~300 unique commands
- **Workspace Variations**: ~214 additional variations (e.g., `npm run test --workspace=frontend`)
- **Legacy Commands**: 29 commands from backup directories
- **Command References in Files**: 679 references across 64 files need migration

The high number of references (679) occurs because:

1. Many files reference the same commands multiple times
2. Documentation files cross-reference commands extensively
3. Legacy commands are referenced in multiple contexts (docs, scripts, configs)

## Migration Map

### High-Priority Migrations (Most Used)

| Legacy Command     | Current Equivalent                                           | Usage Count | Status       |
| ------------------ | ------------------------------------------------------------ | ----------- | ------------ |
| `npm run seed --workspace=scripts`     | `npm run seed --workspace=scripts --workspace=scripts`                           | 43 files    | ✅ Available |
| `npm run validate --workspace=scripts/documentation-analysis` | `npm run validate --workspace=scripts/documentation-analysis` (from scripts/documentation-analysis dir) | 42 files    | ✅ Available |
| `npm run reset-data --workspace=scripts`    | `npm run reset-data --workspace=scripts-data --workspace=scripts`                     | 27 files    | ✅ Available |
| `npm run monitor:comprehensive`  | `npm run monitor:comprehensive:comprehensive`                              | 17 files    | ✅ Available |
| `npm run manage-studio-relationships --workspace=scripts`   | `npm run manage-studio-relationships --workspace=scripts-studio-relationships --workspace=scripts`    | 10 files    | ✅ Available |
| `npm run local:clean`    | `npm run local:clean`                                        | 9 files     | ✅ Available |

### Medium-Priority Migrations

| Legacy Command              | Current Equivalent                         | Usage Count | Status       |
| --------------------------- | ------------------------------------------ | ----------- | ------------ |
| `npm run validate:complete`  | `npm run validate --workspace=scripts/documentation-analysis:complete`                | 3 files     | ✅ Available |
| `npm run validate --workspace=scripts/documentation-analysis-enhanced` | `npm run validate --workspace=scripts/documentation-analysis:all --workspace=scripts` | 2 files     | ✅ Available |
| `npm run setup-data --workspace=scripts`              | `npm run setup-data --workspace=scripts`   | 2 files     | ✅ Available |

### Low-Priority Migrations (Single Usage)

| Legacy Command                      | Current Equivalent                             | Usage Count | Status       |
| ----------------------------------- | ---------------------------------------------- | ----------- | ------------ |
| `npm run seed-scenario --workspace=scripts`                 | `npm run seed --workspace=scripts-scenario --workspace=scripts`    | 1 file      | ✅ Available |
| `npm run test:studio --workspace=scripts`            | `npm run test:studio --workspace=scripts`      | 1 file      | ✅ Available |
| `npm run test:integration`          | `npm run test:integration`                     | 1 file      | ✅ Available |
| `npm run setup-data:force --workspace=scripts`                   | `npm run setup-data:force --workspace=scripts` | 1 file      | ✅ Available |
| `npm run test:comprehensive` | `npm run test:comprehensive`                   | 1 file      | ✅ Available |

## Migration Steps

### 1. Automated Migration Script

Run the migration script to automatically update references:

```bash
# Create and run migration script
node migrate-legacy-commands.js
```

### 2. Manual Verification

After running the migration script, manually verify these critical files:

- `README.md` - Main project documentation
- `docs/QUICK_START.md` - Quick start guide
- `docs/reference/command-reference.md` - Command reference
- `package.json` - Root package scripts

### 3. Test Migration

Test that the new commands work correctly:

```bash
# Test data operations
npm run seed --workspace=scripts --workspace=scripts
cd scripts/documentation-analysis && npm run validate --workspace=scripts/documentation-analysis
npm run reset-data --workspace=scripts-data --workspace=scripts

# Test monitoring
npm run monitor:comprehensive:comprehensive

# Test studio management
npm run manage-studio-relationships --workspace=scripts-studio-relationships --workspace=scripts
```

### 4. Remove Legacy References

After successful migration and testing:

1. Remove the legacy backup directory: `backups/legacy-scripts-20250918/`
2. Update any remaining documentation references
3. Run the cross-reference check to verify cleanup

## Files Requiring Updates

### High-Impact Files (Multiple Legacy Commands)

1. **README.md** - 4 legacy commands
2. **docs/QUICK_START.md** - 3 legacy commands
3. **docs/reference/command-reference.md** - Multiple legacy commands
4. **scripts/data-cli.js** - 3 legacy commands
5. **docs/workflows/testing-strategies.md** - 4 legacy commands

### Documentation Files

- `docs/workflows/deployment-process.md`
- `docs/workflows/data-management.md`
- `docs/setup/local-development.md`
- `docs/scripts/README.md`
- `docs/planning/TROUBLESHOOTING.md`

### Configuration Files

- `package.json` (root)
- `scripts/package.json`

## Validation Commands

After migration, use these commands to validate the changes:

```bash
# Check for remaining legacy references
cd scripts/documentation-analysis && npm run cross-reference

# Validate all documentation
cd scripts/documentation-analysis && npm run validate --workspace=scripts/documentation-analysis

# Test data operations
npm run test:integration

# Run comprehensive tests
npm run test:comprehensive
```

## Rollback Plan

If issues occur during migration:

1. **Immediate Rollback**: The legacy commands are still available in the backup directory
2. **Partial Rollback**: Revert specific files using git
3. **Full Rollback**: Restore from the backup created before migration

## Migration Impact Analysis

### Files Requiring Updates: 64 files

### Total References to Update: 679 references

**Why so many references?**

- **Documentation Cross-References**: Command reference docs list commands multiple times
- **Script Dependencies**: Scripts reference commands in multiple contexts
- **Configuration Files**: Package.json files contain command definitions
- **Legacy Reports**: Previous analysis reports contain command listings

### High-Impact Files (10+ references each):

1. **docs/reference/command-reference.md** - 71 references
2. **docs/planning/TROUBLESHOOTING.md** - 46 references
3. **docs/planning/STUDIO_CLI_COMMANDS.md** - 41 references
4. **scripts/data-cli.js** - 23 references
5. **docs/workflows/data-management.md** - 20 references

## Migration Timeline

### Phase 1: Preparation (Day 1)

- [ ] Review this migration guide and understand impact scope
- [ ] Create backup of current state
- [ ] Test current legacy commands still work
- [ ] Run migration in dry-run mode to preview changes

### Phase 2: High-Priority Migration (Day 2)

- [ ] Migrate the 6 most-used commands (affects 43+ files each)
- [ ] Test critical workflows after migration
- [ ] Update main documentation files
- [ ] Verify command reference documentation

### Phase 3: Complete Migration (Day 3)

- [ ] Migrate remaining commands (affects 1-3 files each)
- [ ] Update all remaining documentation
- [ ] Run comprehensive tests
- [ ] Validate all command references work

### Phase 4: Cleanup (Day 4)

- [ ] Remove legacy directory after confirming migration success
- [ ] Final validation with cross-reference tool
- [ ] Update command reference to remove legacy notices
- [ ] Generate final migration report

## Support

If you encounter issues during migration:

1. Check the legacy cleanup report: `legacy-commands-cleanup-report.md`
2. Run the cross-reference tool: `cd scripts/documentation-analysis && npm run cross-reference`
3. Refer to the current command reference: `docs/reference/command-reference.md`

## Post-Migration Benefits

After completing the migration:

- ✅ Simplified command structure
- ✅ Consistent workspace usage
- ✅ Reduced maintenance overhead
- ✅ Cleaner documentation
- ✅ Better command discoverability
- ✅ Eliminated legacy dependencies
