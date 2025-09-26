@echo off
setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "DEVTOOLS_DIR=%SCRIPT_DIR%.."
set "PROJECT_ROOT=%DEVTOOLS_DIR%\.."
set "DOCKER_COMPOSE_FILE=%DEVTOOLS_DIR%\docker\docker-compose.local.yml"
set "ENV_FILE=%DEVTOOLS_DIR%\.env.local"

REM Function to display usage
if "%1"=="help" goto :usage
if "%1"=="-h" goto :usage
if "%1"=="--help" goto :usage

if "%1"=="start" goto :start_localstack
if "%1"=="stop" goto :stop_localstack
if "%1"=="restart" goto :restart_localstack
if "%1"=="status" goto :show_status
if "%1"=="logs" goto :show_logs
if "%1"=="" goto :start_localstack

echo ❌ Invalid command: %1
echo.
goto :usage

:usage
echo Usage: %~nx0 [start^|stop^|restart^|status^|logs]
echo.
echo Commands:
echo   start   - Start LocalStack (default)
echo   stop    - Stop LocalStack
echo   restart - Restart LocalStack
echo   status  - Show LocalStack status
echo   logs    - Show LocalStack logs
echo.
echo Examples:
echo   %~nx0 start    # Start LocalStack
echo   %~nx0 status   # Show status
echo   %~nx0 logs     # Show logs
goto :end

:check_prerequisites
echo ℹ️  Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is required but not installed
    echo ℹ️  Install Docker Desktop: https://docs.docker.com/desktop/windows/
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is required but not installed
    echo ℹ️  Docker Compose should be included with Docker Desktop
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Desktop is not running
    echo ℹ️  Start Docker Desktop and try again
    exit /b 1
)

echo ✅ Prerequisites check passed
goto :eof

:get_current_phase
set "CURRENT_PHASE=phase1"
if exist "%ENV_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr "^LOCALSTACK_PHASE=" "%ENV_FILE%" 2^>nul') do set "CURRENT_PHASE=%%a"
)
goto :eof

:setup_directories
echo ℹ️  Setting up LocalStack directories...

REM Run the directory setup script
if exist "%SCRIPT_DIR%\setup-localstack-dirs.bat" (
    call "%SCRIPT_DIR%\setup-localstack-dirs.bat"
) else (
    REM Fallback: create directories manually
    if not exist "%DEVTOOLS_DIR%\localstack-data" mkdir "%DEVTOOLS_DIR%\localstack-data"
    if not exist "%DEVTOOLS_DIR%\localstack-logs" mkdir "%DEVTOOLS_DIR%\localstack-logs"
    echo ✅ Created LocalStack directories
)
goto :eof

:start_localstack
call :check_prerequisites
if errorlevel 1 exit /b 1

call :setup_directories
call :get_current_phase

echo ℹ️  Starting LocalStack in !CURRENT_PHASE! mode...

REM Change to project root for docker-compose
cd /d "%PROJECT_ROOT%"

if "!CURRENT_PHASE!"=="phase2" (
    echo ℹ️  Starting Phase 2 LocalStack (includes SQS, EventBridge, CloudWatch Metrics)...
    docker-compose -f "%DOCKER_COMPOSE_FILE%" --profile phase2 up -d localstack-phase2
    set "CONTAINER_NAME=tattoo-directory-localstack-phase2"
) else (
    echo ℹ️  Starting Phase 1 LocalStack (DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS)...
    docker-compose -f "%DOCKER_COMPOSE_FILE%" up -d localstack
    set "CONTAINER_NAME=tattoo-directory-localstack"
)

echo ✅ LocalStack container started

REM Wait for LocalStack to be healthy
echo ℹ️  Waiting for LocalStack to be ready...
set /a max_attempts=30
set /a attempt=1

:wait_loop
docker exec !CONTAINER_NAME! curl -f http://localhost:4566/_localstack/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ LocalStack is ready!
    goto :wait_done
)

if !attempt! geq !max_attempts! (
    echo ❌ LocalStack failed to start within expected time
    echo ℹ️  Check logs with: docker logs !CONTAINER_NAME!
    exit /b 1
)

echo|set /p="."
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto :wait_loop

:wait_done
echo.
call :show_status
goto :end

:stop_localstack
echo ℹ️  Stopping LocalStack...
cd /d "%PROJECT_ROOT%"
docker-compose -f "%DOCKER_COMPOSE_FILE%" down
docker-compose -f "%DOCKER_COMPOSE_FILE%" --profile phase2 down
echo ✅ LocalStack stopped
goto :end

:restart_localstack
echo ℹ️  Restarting LocalStack...
cd /d "%PROJECT_ROOT%"
docker-compose -f "%DOCKER_COMPOSE_FILE%" down
docker-compose -f "%DOCKER_COMPOSE_FILE%" --profile phase2 down
timeout /t 2 /nobreak >nul
call :start_localstack
goto :end

:show_status
call :get_current_phase

echo ℹ️  LocalStack Status:
echo   Phase: !CURRENT_PHASE!
echo   Endpoint: http://localhost:4566
echo   Web UI: http://localhost:4566/_localstack/cockpit

REM Show running services
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "tattoo-directory-localstack" >nul 2>&1
if not errorlevel 1 (
    echo ✅ LocalStack is running
    
    REM Show service health
    echo ℹ️  Service Health:
    curl -s http://localhost:4566/_localstack/health 2>nul | findstr "running\|available" >nul 2>&1
    if not errorlevel 1 (
        echo   Services are healthy
    ) else (
        echo   ⚠️  Could not retrieve service health status
    )
) else (
    echo ⚠️  LocalStack is not running
)
goto :end

:show_logs
call :get_current_phase
if "!CURRENT_PHASE!"=="phase2" (
    docker logs -f tattoo-directory-localstack-phase2
) else (
    docker logs -f tattoo-directory-localstack
)
goto :end

:end