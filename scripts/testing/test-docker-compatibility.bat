@echo off
setlocal enabledelayedexpansion

REM Docker and Cross-Platform Compatibility Test Script for Windows
REM Tests enhanced frontend-sync-processor in Docker environments

echo 🐳 Docker and Cross-Platform Compatibility Tests
echo ================================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not available. Please install Docker Desktop.
    echo    Download from: https://www.docker.com/products/docker-desktop
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose is not available.
        exit /b 1
    ) else (
        set DOCKER_COMPOSE_CMD=docker-compose
    )
) else (
    set DOCKER_COMPOSE_CMD=docker compose
)

echo ✅ Docker available: 
docker --version
echo ✅ Docker Compose available: %DOCKER_COMPOSE_CMD%
echo.

REM Set environment variables for Windows
set LOCALSTACK_PORT=4566
set BACKEND_PORT=9000
set FRONTEND_PORT=3000
set ENABLE_BACKEND_DEBUG=false
set ENABLE_FRONTEND_DEBUG=false

REM Run the comprehensive test suite
echo 🧪 Running Docker and Cross-Platform Compatibility Tests...
echo.

node scripts/test-docker-cross-platform-compatibility.js
set TEST_EXIT_CODE=%errorlevel%

echo.
if %TEST_EXIT_CODE% equ 0 (
    echo ✅ All Docker and cross-platform compatibility tests passed!
    echo.
    echo 📋 Task 1.12 Status: COMPLETED
    echo    ✅ Enhanced frontend-sync-processor tested in Docker container environment
    echo    ✅ Cross-platform path handling validated with new data export features  
    echo    ✅ Windows/Linux/macOS compatibility tested with enhanced CLI options
    echo    ✅ Docker networking validated with enhanced service integrations
    echo    ✅ CI/CD environment compatibility tested with enhanced processor
) else (
    echo ❌ Some Docker and cross-platform compatibility tests failed.
    echo    Check the test report for details.
)

echo.
echo 📄 Test reports available in: scripts/test-results/
echo    - docker-cross-platform-test-report.json
echo    - task-1-12-docker-compatibility-summary.md

exit /b %TEST_EXIT_CODE%