@echo off
echo 🧪 Testing Artist API Performance...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not available
    pause
    exit /b 1
)

REM Run the performance test
node test-artist-performance.js

echo.
echo 📊 Performance test completed!
pause