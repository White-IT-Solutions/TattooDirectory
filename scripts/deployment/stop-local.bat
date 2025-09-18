@echo off
REM Tattoo Directory Local Environment Shutdown Script (Windows)
REM This script cleanly stops all local development services

echo 🛑 Stopping Tattoo Directory Local Environment...
echo =================================================

REM Parse command line arguments
set REMOVE_VOLUMES=false
set REMOVE_IMAGES=false
set FORCE_STOP=false

:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--volumes" set REMOVE_VOLUMES=true
if "%~1"=="-v" set REMOVE_VOLUMES=true
if "%~1"=="--images" set REMOVE_IMAGES=true
if "%~1"=="-i" set REMOVE_IMAGES=true
if "%~1"=="--force" set FORCE_STOP=true
if "%~1"=="-f" set FORCE_STOP=true
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
shift
goto parse_args

:show_help
echo Usage: %0 [options]
echo.
echo Options:
echo   --volumes, -v    Remove volumes (deletes all data)
echo   --images, -i     Remove images (forces rebuild next time)
echo   --force, -f      Force stop containers (kill instead of graceful stop)
echo   --help, -h       Show this help message
echo.
echo Examples:
echo   %0                # Graceful stop
echo   %0 --volumes      # Stop and remove data
echo   %0 --force        # Force stop all containers
exit /b 0

:end_parse

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not running. Nothing to stop.
    exit /b 0
)

REM Check if docker-compose.local.yml exists
if not exist "devtools\docker\docker-compose.local.yml" (
    echo ❌ docker-compose.local.yml not found. Please ensure you're in the project root directory.
    exit /b 1
)

REM Show current running containers
echo 📦 Current running containers:
docker-compose -f devtools\docker\docker-compose.local.yml ps

REM Stop containers
if "%FORCE_STOP%"=="true" (
    echo 🛑 Force stopping containers...
    docker-compose -f devtools\docker\docker-compose.local.yml kill
) else (
    echo 🛑 Gracefully stopping containers...
    docker-compose -f devtools\docker\docker-compose.local.yml stop
)

REM Remove containers and networks
echo 🧹 Removing containers and networks...
if "%REMOVE_VOLUMES%"=="true" (
    echo ⚠️  Removing volumes (this will delete all data)...
    docker-compose -f devtools\docker\docker-compose.local.yml down --volumes --remove-orphans
) else (
    docker-compose -f devtools\docker\docker-compose.local.yml down --remove-orphans
)

REM Remove images if requested
if "%REMOVE_IMAGES%"=="true" (
    echo 🗑️  Removing Docker images...
    docker-compose -f devtools\docker\docker-compose.local.yml down --rmi all
)

REM Clean up dangling resources
echo 🧹 Cleaning up dangling resources...
docker system prune -f >nul 2>&1

REM Show disk space freed (if any)
echo 📊 Checking Docker disk usage...
docker system df

echo ✅ Local environment stopped successfully!

if "%REMOVE_VOLUMES%"=="true" (
    echo ⚠️  All data has been removed. Next startup will create fresh data.
)

if "%REMOVE_IMAGES%"=="true" (
    echo ⚠️  Images have been removed. Next startup will rebuild containers.
)

echo.
echo 📝 To start the environment again:
echo    npm run local:start
echo    # or
echo    scripts\start-local.bat
