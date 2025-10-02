@echo off
REM Cleanup script for docStructure empty folders
REM Generated automatically - review before running!

echo 🧹 Cleaning up docStructure empty folders...

echo Removing: docs/consolidated/architecture/diagrams
rmdir /s /q "docs/consolidated/architecture/diagrams" 2>nul || echo Folder not found or not empty

echo Removing: docs/consolidated/troubleshooting/localstack
rmdir /s /q "docs/consolidated/troubleshooting/localstack" 2>nul || echo Folder not found or not empty

echo ✅ docStructure cleanup complete!