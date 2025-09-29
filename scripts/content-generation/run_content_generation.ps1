# Tattoo Directory Content Generation Script
# PowerShell version for Windows users

param(
    [switch]$SkipChecks,
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TATTOO DIRECTORY CONTENT GENERATION" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Check if Python is available
if (-not $SkipChecks) {
    Write-Info "Checking Python installation..."
    try {
        $pythonVersion = python --version 2>&1
        Write-Success "Python found: $pythonVersion"
    }
    catch {
        Write-Error "Python is not installed or not in PATH"
        Write-Host "Please install Python 3.8+ and try again"
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check if we're in the right directory
    if (-not (Test-Path "generate_tattoos_expert.py")) {
        Write-Error "Script not found in current directory"
        Write-Host "Please run this from the scripts/ directory"
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check for required dependencies
    Write-Info "Checking dependencies..."
    try {
        python -c "import vertexai" 2>$null
        Write-Success "Vertex AI library found"
    }
    catch {
        Write-Warning "Vertex AI library not found"
        Write-Info "Installing required dependencies..."
        pip install google-cloud-aiplatform
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies"
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Success "Dependencies installed successfully"
    }

    # Check GCP authentication
    Write-Info "Checking GCP authentication..."
    try {
        gcloud auth application-default print-access-token 2>$null | Out-Null
        Write-Success "GCP authentication found"
    }
    catch {
        Write-Warning "GCP authentication not found"
        Write-Host "Please run: gcloud auth application-default login"
        Write-Host "Or set up service account credentials"
        if (-not $Force) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                exit 1
            }
        }
    }
}

Write-Host ""
Write-Info "Starting content generation..."
Write-Host "This will generate:" -ForegroundColor White
Write-Host "  - 1000 tattoo portfolio images (1:1 aspect ratio)" -ForegroundColor Gray
Write-Host "  - 600 studio images for 100 studios (16:9 aspect ratio)" -ForegroundColor Gray
Write-Host "  - Estimated time: 45-65 minutes" -ForegroundColor Gray
Write-Host "  - Estimated cost: ~`$64 USD" -ForegroundColor Gray
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Proceed with generation? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Generation cancelled" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    }
}

Write-Host ""
Write-Info "Generation in progress..."
Write-Host "Check the console output for detailed progress" -ForegroundColor Gray
Write-Host ""

# Run the generation script
try {
    python generate_tattoos_expert.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Content generation completed successfully!"
        Write-Host "📁 Check the 'generated_content' directory for results" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Error "Generation failed with errors"
        Write-Host "Check the output above for details" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Error "An error occurred during generation: $_"
}

Write-Host ""
if (-not $Force) {
    Read-Host "Press Enter to exit"
}