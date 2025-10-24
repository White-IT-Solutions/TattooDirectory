@echo off
REM Cleanup script for testArtifacts empty folders
REM Generated automatically - review before running!

echo 🧹 Cleaning up testArtifacts empty folders...

echo Removing: frontend/tests/e2e/visual-regression/diffs
rmdir /s /q "frontend/tests/e2e/visual-regression/diffs" 2>nul || echo Folder not found or not empty

echo Removing: scripts/documentation-analysis/config/__tests__
rmdir /s /q "scripts/documentation-analysis/config/__tests__" 2>nul || echo Folder not found or not empty

echo Removing: scripts/documentation-analysis/src/utils/__tests__
rmdir /s /q "scripts/documentation-analysis/src/utils/__tests__" 2>nul || echo Folder not found or not empty

echo ✅ testArtifacts cleanup complete!