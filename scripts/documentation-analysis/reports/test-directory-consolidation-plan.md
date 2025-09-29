# Test Directory Consolidation Plan

## Summary

After analyzing all test directories and their references, here's the consolidation plan:

## Directories to Keep (Active Usage)

### Core Test Data

- **`scripts/test-data/`** - Primary test data (JSON files)
- **`scripts/test-results/`** - Test outputs and reports
- **`tests/Test_Data/ImageSet/`** - Tattoo style test images
- **`tests/Test_Data/StudioImages/`** - Studio test images

### Test Suites

- **`tests/e2e/`** - End-to-end tests (Playwright)
- **`tests/integration/`** - Integration tests (API/data)
- **`scripts/testing/`** - Test utilities and monitoring

## Directories to Remove (Empty/Unused)

### Empty Directories

- **`scripts/temp-test-data/`** - Empty, minimal usage ✅ REMOVED
- **`scripts/test-backups/`** - Empty, only test references ✅ REMOVED
- **`scripts/tests/Test_Data/StudioImages/`** - Empty duplicate
- **`scripts/scripts/test-data/`** - Empty nested structure
- **`scripts/scripts/backups/`** - Empty
- **`scripts/scripts/logs/`** - Empty
- **`scripts/scripts/output/`** - Empty

### Duplicate Files

- **`scripts/frontend/src/app/data/mockArtistData.js`** - Duplicate of `frontend/src/app/data/mockArtistData.js`
- **`node_modules/tattoo-directory-scripts/frontend/src/app/data/mockArtistData.js`** - Package artifact (ignore)

## Implementation Steps

### 1. Update Script References

Update `scripts/test-incremental-processing.js` to remove temp-test-data reference:

```javascript
// Remove this line:
this.tempTestDir = path.join(__dirname, "temp-test-data");
```

### 2. Remove Empty Directories and Duplicates

```bash
# Remove empty test directories (already done)
# rmdir scripts/temp-test-data ✅ DONE
# rmdir scripts/test-backups ✅ DONE

# Remove remaining empty directories
rmdir /s scripts/tests
rmdir /s scripts/scripts/test-data
rmdir scripts/scripts/backups
rmdir scripts/scripts/logs
rmdir scripts/scripts/output

# Remove duplicate frontend structure
rmdir /s scripts/frontend
```

### 3. Verify No Broken References

Run tests to ensure no scripts break after cleanup.

## Final Structure

```
tests/
├── e2e/                    # End-to-end tests
├── integration/            # Integration tests
└── Test_Data/
    ├── ImageSet/          # Tattoo style images
    └── StudioImages/      # Studio test images

scripts/
├── test-data/             # Core test data (JSON)
├── test-results/          # Test outputs/reports
├── testing/               # Test utilities
└── __tests__/             # Unit tests
```

## Benefits

- Cleaner directory structure
- No duplicate/empty directories
- Clear separation of concerns
- Easier navigation and maintenance
