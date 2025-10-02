@echo off
REM Cleanup script for appStructure empty folders
REM Generated automatically - review before running!

echo 🧹 Cleaning up appStructure empty folders...

echo Removing: frontend/src/app/home
rmdir /s /q "frontend/src/app/home" 2>nul || echo Folder not found or not empty

echo ✅ appStructure cleanup complete!