@echo off
REM Cleanup script for legacyFolders empty folders
REM Generated automatically - review before running!

echo 🧹 Cleaning up legacyFolders empty folders...

echo Removing: scripts/temp-test-data
rmdir /s /q "scripts/temp-test-data" 2>nul || echo Folder not found or not empty

echo Removing: scripts/test-backups
rmdir /s /q "scripts/test-backups" 2>nul || echo Folder not found or not empty

echo Removing: scripts/__tests__/test-state
rmdir /s /q "scripts/__tests__/test-state" 2>nul || echo Folder not found or not empty

echo ✅ legacyFolders cleanup complete!