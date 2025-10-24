# Tattoo Directory Content Generation Script
# PowerShell version for Windows users

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [string]$Location = "europe-west2",
    [string]$OutputDir = "generated_content",
    [string]$ServiceAccountKey,
    [switch]$Test,
    [switch]$SkipChecks,
    [switch]$Force,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Usage: .\run_content_generation.ps1 -ProjectId PROJECT_ID [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Required:" -ForegroundColor White
    Write-Host "  -ProjectId ID       Google Cloud Project ID (required)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Location REGION         GCP region (default: europe-west2)" -ForegroundColor Gray
    Write-Host "  -OutputDir DIR           Output directory (default: generated_content)" -ForegroundColor Gray
    Write-Host "  -ServiceAccountKey PATH  Path to service account JSON key file" -ForegroundColor Gray
    Write-Host "  -Test                    Run in test mode (8 images total)" -ForegroundColor Gray
    Write-Host "  -SkipChecks              Skip dependency and authentication checks" -ForegroundColor Gray
    Write-Host "  -Force                   Skip confirmation prompts" -ForegroundColor Gray
    Write-Host "  -Help                    Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\run_content_generation.ps1 -ProjectId my-gcp-project" -ForegroundColor Gray
    Write-Host "  .\run_content_generation.ps1 -ProjectId my-gcp-project -Test" -ForegroundColor Gray
    Write-Host "  .\run_content_generation.ps1 -ProjectId my-gcp-project -Location europe-west2" -ForegroundColor Gray
    exit 0
}

# Validate project ID
if ([string]::IsNullOrWhiteSpace($ProjectId) -or $ProjectId -eq "your-gcp-project-id") {
    Write-Host "Error: Please provide a valid Google Cloud Project ID" -ForegroundColor Red
    Write-Host "Usage: .\run_content_generation.ps1 -ProjectId YOUR_PROJECT_ID" -ForegroundColor Gray
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TATTOO DIRECTORY CONTENT GENERATION" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Project ID: $ProjectId" -ForegroundColor Gray
Write-Host "  Location: $Location" -ForegroundColor Gray
Write-Host "  Output Dir: $OutputDir" -ForegroundColor Gray
if ($ServiceAccountKey) {
    Write-Host "  Service Account: $ServiceAccountKey" -ForegroundColor Gray
} else {
    Write-Host "  Authentication: Application Default Credentials" -ForegroundColor Gray
}
if ($Test) {
    Write-Host "  Mode: TEST MODE (8 images)" -ForegroundColor Yellow
} else {
    Write-Host "  Mode: FULL PRODUCTION (960 images)" -ForegroundColor White
}
Write-Host ""

function Write-Info {
    param([string]$message)
    Write-Host "Info: $message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$message)
    Write-Host "Success: $message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$message)
    Write-Host "Warning: $message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$message)
    Write-Host "Error: $message" -ForegroundColor Red
}

# Check if Python is available
if (-not $SkipChecks) {
    Write-Info "Checking Python installation..."
    try {
        $pythonVersion = python --version 2>&1
        Write-Success "Python found: $pythonVersion"
    }
    catch {
        Write-ErrorMsg "Python is not installed or not in PATH"
        Write-Host "Please install Python 3.8+ and try again"
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check if we're in the right directory
    if (-not (Test-Path "generate_tattoos_expert.py")) {
        Write-ErrorMsg "Script not found in current directory"
        Write-Host "Please run this from the scripts/content-generation/ directory"
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
            Write-ErrorMsg "Failed to install dependencies"
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

if ($Test) {
    Write-Host "[TEST MODE] This will generate:" -ForegroundColor Yellow
    Write-Host "  - 5 tattoo portfolio images" -ForegroundColor Gray
    Write-Host "  - 3 studio images for 1 studio" -ForegroundColor Gray
    Write-Host "  - Estimated time: 2-3 minutes" -ForegroundColor Gray
    Write-Host "  - Estimated cost: ~`$0.50 USD" -ForegroundColor Gray
} else {
    Write-Host "[FULL MODE] This will generate:" -ForegroundColor White
    Write-Host "  - 660 tattoo portfolio images" -ForegroundColor Gray
    Write-Host "  - 300 studio images for 100 studios" -ForegroundColor Gray
    Write-Host "  - Estimated time: 45-65 minutes" -ForegroundColor Gray
    Write-Host "  - Estimated cost: ~`$64 USD" -ForegroundColor Gray
}
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
    # Prepare Python script arguments
    $pythonArgs = @("--project-id", $ProjectId, "--location", $Location, "--output-dir", $OutputDir)
    if ($ServiceAccountKey) {
        $pythonArgs += @("--service-account-key", $ServiceAccountKey)
    }
    if ($Test) {
        $pythonArgs += "--test-mode"
    }
    
    python generate_tattoos_expert.py @pythonArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Content generation completed successfully!"
        Write-Host "Check the '$OutputDir' directory for results" -ForegroundColor Cyan
        if ($Test) {
            Write-Host "Test mode completed - review results before running full generation" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-ErrorMsg "Generation failed with errors"
        Write-Host "Check the output above for details" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-ErrorMsg "An error occurred during generation: $_"
}

Write-Host ""
if (-not $Force) {
    Read-Host "Press Enter to exit"
}