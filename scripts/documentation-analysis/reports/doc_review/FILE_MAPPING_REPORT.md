# Documentation File Mapping Report

Generated on: 29/09/2025, 12:58:31

## Summary

- **Files in /docs/**: 52
- **Files in /docs/consolidated/**: 95
- **Potential Duplicates**: 5

## File Distribution

### /docs/ Directory Structure
- **other**: 52 files

### /docs/consolidated/ Directory Structure
- **architecture**: 40 files
- **reference**: 7 files
- **troubleshooting**: 4 files
- **system_design**: 11 files
- **other**: 33 files

## Potential Duplicates

These files in /docs/ may have equivalents in /docs/consolidated/ or are duplicated within /docs/:

### Duplicates Within /docs/ Directory (2)

- **archive_docs/frontend/tests/README.md**
  - Duplicate of: archive_docs/frontend/tests/e2e/README.md
  - Size: 12118 bytes vs 2333 bytes
  - Recommendation: Remove duplicate, keep the one in more specific directory

- **README.md**
  - Duplicate of: archive_docs/frontend/tests/e2e/README.md
  - Size: 5280 bytes vs 2333 bytes
  - Recommendation: Remove duplicate, keep the one in more specific directory

### Medium Confidence Matches to Consolidated (3)

- **archive_docs/frontend/tests/e2e/README.md**
  - Possible matches:
    - development/backend/README.md
    - development/frontend/README.md
    - development/scripts/README.md
    - getting-started/README.md
    - README.md
    - troubleshooting/README.md

- **archive_docs/frontend/tests/README.md**
  - Possible matches:
    - development/backend/README.md
    - development/frontend/README.md
    - development/scripts/README.md
    - getting-started/README.md
    - README.md
    - troubleshooting/README.md

- **README.md**
  - Possible matches:
    - development/backend/README.md
    - development/frontend/README.md
    - development/scripts/README.md
    - getting-started/README.md
    - README.md
    - troubleshooting/README.md

## Files Without Matches (49)

These files in /docs/ don't appear to have equivalents in /docs/consolidated/:

- archive_docs/data_management/COMMAND_COMPARISON.md
- archive_docs/data_management/DATA_MANAGEMENT_GUIDE.md
- archive_docs/data_management/FINAL_SYSTEM_VALIDATION_REPORT.md
- archive_docs/data_management/FRONTEND_SYNC_MIGRATION_GUIDE.md
- archive_docs/data_management/MIGRATION_COMPLETION_REPORT.md
- archive_docs/data_management/MIGRATION_GUIDE.md
- archive_docs/data_management/PERFORMANCE_BENCHMARKS.md
- archive_docs/data_management/STUDIO_ARTIST_RELATIONSHIPS.md
- archive_docs/data_management/STUDIO_DATA_MIGRATION_GUIDE.md
- archive_docs/data_management/STUDIO_DATA_SCHEMA.md
- archive_docs/data_management/STUDIO_IMAGE_PROCESSING.md
- archive_docs/frontend/CI_CD_INTEGRATION.md
- archive_docs/frontend/design_system/component-api-reference.md
- archive_docs/frontend/design_system/component-integration-guide.md
- archive_docs/frontend/design_system/components-README.md
- archive_docs/frontend/design_system/testing-guidelines.md
- archive_docs/frontend/ENVIRONMENT_CONFIGURATION.md
- archive_docs/frontend/tests/DOCUMENTATION.md
- archive_docs/frontend/tests/README_2.md
- archive_docs/frontend/tests/TESTING_GUIDE.md
- archive_docs/frontend/tests/TROUBLESHOOTING.md
- archive_docs/local_dev/API_TESTING_GUIDE.md
- archive_docs/local_dev/BEST-PRACTICES.md
- archive_docs/local_dev/LOCAL-DEVELOPMENT-GUIDE.md
- archive_docs/local_dev/MONITORING_SYSTEM.md
- archive_docs/local_dev/PERFORMANCE_MONITORING.md
- archive_docs/local_dev/SECURITY-GUIDELINES.md
- archive_docs/local_dev/VIDEO-TUTORIALS-GUIDE.md
- archive_docs/local_dev/VIDEO-TUTORIALS-GUIDE_1.md
- archive_docs/planning/Deployment workflow.md
- archive_docs/planning/ENHANCED_DATA_DISPLAY_INTEGRATION.md
- archive_docs/planning/FRONTEND_SYNC_CONSOLIDATION.md
- archive_docs/planning/Lambda_Doc.md
- archive_docs/planning/PRODUCTION_READY_REPORT.md
- archive_docs/planning/STUDIO_CLI_COMMANDS.md
- archive_docs/planning/STUDIO_HEALTH_MONITORING.md
- archive_docs/setup/CROSS_PLATFORM_SUMMARY.md
- archive_docs/setup/DOCUMENTATION_UPDATES.md
- archive_docs/setup/LINUX_SETUP_GUIDE.md
- archive_docs/setup/MACOS_SETUP_GUIDE.md
- archive_docs/setup/PLATFORM_SETUP.md
- archive_docs/setup/README_Development_Workflow.md
- archive_docs/setup/README_Local_Development.md
- archive_docs/setup/SETUP_MASTER.md
- archive_docs/setup/SETUP_SUMMARY.md
- archive_docs/setup/WINDOWS_SETUP_GUIDE.md
- command-reference.md
- README_Doc_Analysis.md
- SCRIPTS_README.md

## Recommended Actions

### Safe to Delete (High Confidence)
These files can likely be safely deleted as they have clear equivalents in /docs/consolidated/:

```bash
rm "docs/archive_docs/frontend/tests/README.md"
rm "docs/README.md"
```

### Review Required (Medium Confidence)
These files should be manually reviewed before deletion:

- archive_docs/frontend/tests/e2e/README.md (6 possible matches)
- archive_docs/frontend/tests/README.md (6 possible matches)
- README.md (6 possible matches)

### Unique Files
Files that don't have matches should be reviewed to determine if they should be:
1. Moved to /docs/consolidated/
2. Kept in their current location
3. Deleted if obsolete

## Next Steps

1. Review high confidence matches and delete duplicates
2. Manually compare medium confidence matches
3. Decide what to do with unique files
4. Update any references to moved/deleted files
5. Run gap analysis again to verify improvements

---

*This report was generated automatically by the documentation file mapping tool.*
