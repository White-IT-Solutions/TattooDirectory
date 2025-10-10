@echo off
setlocal enabledelayedexpansion

echo 🚀 Building Next.js app for AWS deployment

REM Change to frontend directory
cd /d "%~dp0..\frontend"

REM Set environment for static export
set NEXT_PUBLIC_ENVIRONMENT=production

REM Build the application
echo 📦 Building Next.js application...
call npm run build:aws
if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

REM Check if 'out' directory was created
if exist "out" (
    echo ✅ Static export created successfully in /out directory
    echo 📁 Ready for S3 upload
    echo 📋 Generated files:
    dir /b out
) else (
    echo ❌ Static export directory not found
    exit /b 1
)

echo ✅ Build completed successfully
exit /b 0