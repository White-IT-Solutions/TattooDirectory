@echo off
echo ========================================
echo Final Validation - Data Seeder System
echo ========================================
echo.

cd /d "%~dp0data-seeder"

echo Starting comprehensive validation...
echo.

npm run validate:complete

echo.
echo Validation complete!
pause