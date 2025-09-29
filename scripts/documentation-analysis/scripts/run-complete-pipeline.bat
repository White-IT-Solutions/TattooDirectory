@echo off
setlocal enabledelayedexpansion

REM Interactive Documentation Pipeline Runner (Windows)
REM Wrapper for the Node.js script with Windows-friendly interface

echo.
echo 🚀 Documentation Pipeline Runner (Windows)
echo ============================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not found in PATH
    echo    Please install Node.js and try again
    pause
    exit /b 1
)

REM Check for help flag
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="/?" goto :help

REM Run the Node.js script with all arguments
echo 🔄 Starting Node.js pipeline script...
echo.
node "%~dp0run-complete-pipeline.js" %*

REM Check exit code
if errorlevel 1 (
    echo.
    echo ❌ Pipeline execution failed
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Pipeline execution completed
    pause
    exit /b 0
)

:help
echo.
echo Interactive Documentation Pipeline Runner
echo.
echo Usage:
echo   run-complete-pipeline.bat [options]
echo.
echo This Windows batch file runs the documentation consolidation pipeline
echo with interactive stage selection.
echo.
echo Options:
echo   --all, -a     Run all stages without interactive selection
echo   --dry-run, -n Show commands that would be executed without running them
echo   --help, -h    Show this help message
echo.
echo Examples:
echo   run-complete-pipeline.bat              # Interactive mode
echo   run-complete-pipeline.bat --all        # Run all stages
echo   run-complete-pipeline.bat --dry-run    # Preview commands only
echo   run-complete-pipeline.bat --all -n     # Preview all commands
echo.
echo The script will guide you through selecting which stages to run.
echo.
pause
exit /b 0