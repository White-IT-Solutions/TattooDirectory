@echo off
setlocal enabledelayedexpansion

REM Data Management Utilities for Tattoo Directory Local Testing
REM This script provides easy access to all data management utilities

set SCRIPT_DIR=%~dp0
set DATA_SEEDER_DIR=%SCRIPT_DIR%data-seeder

REM Function to check if LocalStack is running
:check_localstack
echo [INFO] Checking LocalStack connectivity...
curl -s http://localhost:4566/_localstack/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] LocalStack is running
    exit /b 0
) else (
    echo [ERROR] LocalStack is not running or not accessible
    echo [INFO] Please start LocalStack with: docker-compose -f docker-compose.local.yml up -d localstack
    exit /b 1
)

REM Function to run data management command
:run_command
set utility=%1
shift
set args=%*

echo [INFO] Running: %utility% %args%

cd /d "%DATA_SEEDER_DIR%"

if "%utility%"=="data-manager" (
    node data-manager.js %args%
) else if "%utility%"=="selective-seeder" (
    node selective-seeder.js %args%
) else if "%utility%"=="data-validator" (
    node data-validator.js %args%
) else if "%utility%"=="data-reset" (
    node data-reset.js %args%
) else if "%utility%"=="data-migration-utility" (
    node data-migration-utility.js %args%
) else if "%utility%"=="data-monitoring-utility" (
    node data-monitoring-utility.js %args%
) else if "%utility%"=="data-sync-utility" (
    node data-sync-utility.js %args%
) else (
    echo [ERROR] Unknown utility: %utility%
    exit /b 1
)
exit /b 0

REM Function to show usage
:show_usage
echo 🔧 Data Management Utilities
echo.
echo Usage: %~nx0 ^<command^> [options]
echo.
echo Commands:
echo   reset ^<state^>              - Reset environment to specific state
echo   seed ^<scenario^>            - Seed data for specific test scenario
echo   validate [type]            - Validate data (files/database/opensearch/consistency/all)
echo   export [path]              - Export current data
echo   import ^<path^>              - Import data from export
echo   backup [name]              - Create backup
echo   restore ^<backup-key^>       - Restore from backup
echo   snapshot ^<name^>            - Create data snapshot
echo   list-scenarios             - List available test scenarios
echo   list-states                - List available reset states
echo   list-backups               - List available backups
echo   status                     - Show current environment status
echo   help                       - Show this help message
echo.
echo Examples:
echo   %~nx0 reset fresh             # Reset to fresh state with full data
echo   %~nx0 seed search-basic       # Seed basic search test data
echo   %~nx0 validate all            # Run all validations
echo   %~nx0 backup daily-backup     # Create named backup
echo   %~nx0 status                  # Check current state
exit /b 0

REM Function to show environment status
:show_status
echo [INFO] Checking environment status...

call :check_localstack
if %errorlevel% neq 0 exit /b 1

echo [INFO] Validating current data state...
call :run_command "data-reset" "validate"

echo [INFO] Running consistency check...
call :run_command "data-validator" "consistency"
exit /b 0

REM Main script logic
if "%1"=="" (
    call :show_usage
    exit /b 1
)

set command=%1
shift

if "%command%"=="reset" (
    if "%1"=="" (
        echo [ERROR] Reset state is required
        echo [INFO] Available states: clean, fresh, minimal, search-ready, location-test, style-test, performance-test, backup-restore
        exit /b 1
    )
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-reset" "reset" %*
) else if "%command%"=="seed" (
    if "%1"=="" (
        echo [ERROR] Scenario name is required
        echo [INFO] Use '%~nx0 list-scenarios' to see available scenarios
        exit /b 1
    )
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "selective-seeder" "seed" %*
) else if "%command%"=="validate" (
    set type=%1
    if "!type!"=="" set type=all
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-validator" "!type!"
) else if "%command%"=="export" (
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-manager" "export" %*
) else if "%command%"=="import" (
    if "%1"=="" (
        echo [ERROR] Import path is required
        exit /b 1
    )
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-manager" "import" %*
) else if "%command%"=="backup" (
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-manager" "backup" %*
) else if "%command%"=="restore" (
    if "%1"=="" (
        echo [ERROR] Backup key is required
        echo [INFO] Use '%~nx0 list-backups' to see available backups
        exit /b 1
    )
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-manager" "restore" %*
) else if "%command%"=="snapshot" (
    if "%1"=="" (
        echo [ERROR] Snapshot name is required
        exit /b 1
    )
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-reset" "snapshot" %*
) else if "%command%"=="list-scenarios" (
    call :run_command "selective-seeder" "list"
) else if "%command%"=="list-states" (
    call :run_command "data-reset" "list"
) else if "%command%"=="list-backups" (
    call :check_localstack
    if !errorlevel! neq 0 exit /b 1
    call :run_command "data-manager" "list-backups"
) else if "%command%"=="status" (
    call :show_status
) else if "%command%"=="help" (
    call :show_usage
) else if "%command%"=="-h" (
    call :show_usage
) else if "%command%"=="--help" (
    call :show_usage
) else (
    echo [ERROR] Unknown command: %command%
    call :show_usage
    exit /b 1
)