@echo off
REM Tattoo Directory Local Environment Startup Script (Windows)
REM This script starts the complete local development environment

echo 🚀 Starting Tattoo Directory Local Environment...
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)
echo ✅ Docker is running

REM Check if docker-compose.local.yml exists
if not exist "dev-tools\docker\docker-compose.local.yml" (
    echo ❌ docker-compose.local.yml not found. Please ensure you're in the project root directory.
    exit /b 1
)

REM Clean up any existing containers
echo 📦 Cleaning up existing containers...
docker-compose -f dev-tools\docker\docker-compose.local.yml down --remove-orphans >nul 2>&1

REM Pull latest images
echo 📥 Pulling latest Docker images...
docker-compose -f dev-tools\docker\docker-compose.local.yml pull

REM Start services in detached mode
echo 🚀 Starting containers...
docker-compose -f dev-tools\docker\docker-compose.local.yml up -d

REM Wait for services to initialize
echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
node scripts/health-check.js

REM Seed test data if seeder is available
docker-compose -f dev-tools\docker\docker-compose.local.yml ps | findstr "data-seeder" >nul
if %errorlevel% equ 0 (
    echo 🌱 Seeding test data...
    docker-compose -f dev-tools\docker\docker-compose.local.yml run --rm data-seeder
    echo ✅ Test data seeded successfully
)

echo.
echo ✅ Local environment is ready!
echo ==================================================
echo 🌐 Frontend:     http://localhost:%FRONTEND_PORT%
echo 📚 API Docs:     http://localhost:%SWAGGER_PORT%
echo 🔧 Backend API:  http://localhost:%BACKEND_PORT%
echo ☁️  LocalStack:   http://localhost:%LOCALSTACK_PORT%
echo 📊 LocalStack UI: http://localhost:%LOCALSTACK_PORT%/_localstack/cockpit
echo.
echo 📝 Useful commands:
echo    npm run local:logs      - View all service logs
echo    npm run local:stop      - Stop all services
echo    npm run local:restart   - Restart environment
echo    npm run local:monitor   - Monitor resource usage
echo    npm run local:resources - Get optimization tips
echo.
echo 🔍 To monitor services: docker-compose -f dev-tools\docker\docker-compose.local.yml logs -f