@echo off
setlocal enabledelayedexpansion

echo ========================================
echo TATTOO DIRECTORY CONTENT GENERATION
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "generate_tattoos_expert.py" (
    echo ❌ Script not found in current directory
    echo Please run this from the scripts/ directory
    pause
    exit /b 1
)

REM Check for required dependencies
echo 🔍 Checking dependencies...
python -c "import vertexai" >nul 2>&1
if errorlevel 1 (
    echo ❌ Vertex AI library not found
    echo Installing required dependencies...
    pip install google-cloud-aiplatform
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check GCP authentication
echo 🔐 Checking GCP authentication...
gcloud auth application-default print-access-token >nul 2>&1
if errorlevel 1 (
    echo ⚠️  GCP authentication not found
    echo Please run: gcloud auth application-default login
    echo Or set up service account credentials
    set /p continue="Continue anyway? (y/N): "
    if /i not "!continue!"=="y" (
        exit /b 1
    )
)

echo.
echo 🚀 Starting content generation...
echo This will generate:
echo   - 1000 tattoo portfolio images (1:1 aspect ratio)
echo   - 600 studio images for 100 studios (16:9 aspect ratio)
echo   - Estimated time: 45-65 minutes
echo   - Estimated cost: ~$64 USD
echo.

set /p confirm="Proceed with generation? (y/N): "
if /i not "!confirm!"=="y" (
    echo Generation cancelled
    pause
    exit /b 0
)

echo.
echo ⏳ Generation in progress...
echo Check the console output for detailed progress
echo.

REM Run the generation script
python generate_tattoos_expert.py

if errorlevel 1 (
    echo.
    echo ❌ Generation failed with errors
    echo Check the output above for details
) else (
    echo.
    echo ✅ Content generation completed successfully!
    echo 📁 Check the 'generated_content' directory for results
)

echo.
pause