@echo off
echo Setting up Tattoo Directory test data...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Run the setup script
echo Running test data setup...
node setup-test-data.js

if errorlevel 1 (
    echo Error: Setup failed
    pause
    exit /b 1
) else (
    echo.
    echo Setup completed successfully!
    echo Test data is ready for use with the data seeder.
)

pause