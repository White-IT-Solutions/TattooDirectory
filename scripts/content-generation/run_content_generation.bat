@echo off
setlocal enabledelayedexpansion

REM Parse command line arguments
set "TEST_MODE=false"
set "SKIP_CHECKS=false"
set "FORCE=false"
set "PROJECT_ID="
set "LOCATION=global"
set "OUTPUT_DIR=generated_content"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--project-id" (
    set "PROJECT_ID=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--location" (
    set "LOCATION=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--output-dir" (
    set "OUTPUT_DIR=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--test" (
    set "TEST_MODE=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-checks" (
    set "SKIP_CHECKS=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--force" (
    set "FORCE=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    echo Usage: %~nx0 --project-id PROJECT_ID [OPTIONS]
    echo.
    echo Required:
    echo   --project-id ID      Google Cloud Project ID (required)
    echo.
    echo Options:
    echo   --location REGION    GCP region (default: global)
    echo   --output-dir DIR     Output directory (default: generated_content)
    echo   --test               Run in test mode (8 images total)
    echo   --skip-checks        Skip dependency and authentication checks
    echo   --force              Skip confirmation prompts
    echo   --help               Show this help message
    echo.
    echo Examples:
    echo   %~nx0 --project-id my-gcp-project
    echo   %~nx0 --project-id my-gcp-project --test
    echo   %~nx0 --project-id my-gcp-project --location global
    exit /b 0
)
echo ❌ Unknown option: %~1
echo Use --help for usage information
exit /b 1
shift
goto :parse_args

:args_done

REM Validate required arguments
if "%PROJECT_ID%"=="" (
    echo ❌ Error: Project ID is required
    echo Usage: %~nx0 --project-id YOUR_PROJECT_ID
    echo Use --help for more information
    exit /b 1
)

echo ========================================
echo TATTOO DIRECTORY CONTENT GENERATION
echo ========================================
echo Configuration:
echo   Project ID: %PROJECT_ID%
echo   Location: %LOCATION%
echo   Output Dir: %OUTPUT_DIR%
if "%TEST_MODE%"=="true" (
    echo   Mode: TEST MODE (8 images)
) else (
    echo   Mode: FULL PRODUCTION (960 images)
)
echo.

REM Check if Python is available
if "%SKIP_CHECKS%"=="false" (
    echo 🔍 Checking Python installation...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python is not installed or not in PATH
        echo Please install Python 3.8+ and try again
        pause
        exit /b 1
    )
    echo ✅ Python found

    REM Check if we're in the right directory
    if not exist "generate_tattoos_expert.py" (
        echo ❌ Script not found in current directory
        echo Please run this from the scripts/content-generation/ directory
        pause
        exit /b 1
    )

    REM Check for required dependencies
    echo 🔍 Checking dependencies...
    python -c "import vertexai" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Vertex AI library not found
        echo Installing required dependencies...
        pip install google-cloud-aiplatform
        if errorlevel 1 (
            echo ❌ Failed to install dependencies
            pause
            exit /b 1
        )
        echo ✅ Dependencies installed successfully
    ) else (
        echo ✅ Vertex AI library found
    )

    REM Check GCP authentication
    echo 🔐 Checking GCP authentication...
    gcloud auth application-default print-access-token >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  GCP authentication not found
        echo Please run: gcloud auth application-default login
        echo Or set up service account credentials
        if "%FORCE%"=="false" (
            set /p continue="Continue anyway? (y/N): "
            if /i not "!continue!"=="y" (
                exit /b 1
            )
        )
    ) else (
        echo ✅ GCP authentication found
    )
)

echo.
echo 🚀 Starting content generation...

if "%TEST_MODE%"=="true" (
    echo [TEST MODE] This will generate:
    echo   - 5 tattoo portfolio images (1 per style)
    echo   - 3 studio images for 1 studio
    echo   - Estimated time: 2-3 minutes
    echo   - Estimated cost: ~$0.50 USD
) else (
    echo [FULL MODE] This will generate:
    echo   - 660 tattoo portfolio images (30 per style, 22 styles)
    echo   - 300 studio images for 100 studios
    echo   - Estimated time: 45-65 minutes
    echo   - Estimated cost: ~$64 USD
)
echo.

if "%FORCE%"=="false" (
    set /p confirm="Proceed with generation? (y/N): "
    if /i not "!confirm!"=="y" (
        echo Generation cancelled
        pause
        exit /b 0
    )
)

echo.
echo ⏳ Generation in progress...
echo Check the console output for detailed progress
echo.

REM Prepare Python script arguments
set "PYTHON_ARGS=--project-id %PROJECT_ID% --location %LOCATION% --output-dir %OUTPUT_DIR%"
if "%TEST_MODE%"=="true" (
    set "PYTHON_ARGS=%PYTHON_ARGS% --test-mode"
)

REM Run the generation script
python generate_tattoos_expert.py %PYTHON_ARGS%

if errorlevel 1 (
    echo.
    echo ❌ Generation failed with errors
    echo Check the output above for details
) else (
    echo.
    echo ✅ Content generation completed successfully!
    echo 📁 Check the 'generated_content' directory for results
    if "%TEST_MODE%"=="true" (
        echo 🧪 Test mode completed - review results before running full generation
    )
)

echo.
if "%FORCE%"=="false" (
    pause
)