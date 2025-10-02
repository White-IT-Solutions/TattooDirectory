@echo off
REM Cleanup script for infrastructure empty folders
REM Generated automatically - review before running!

echo 🧹 Cleaning up infrastructure empty folders...

echo Removing: infrastructure/environments/dev/tools
rmdir /s /q "infrastructure/environments/dev/tools" 2>nul || echo Folder not found or not empty

echo ✅ infrastructure cleanup complete!