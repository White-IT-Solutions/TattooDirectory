# Restart LocalStack with CloudWatch Logs support (PowerShell)
# This script stops and restarts LocalStack with the correct services configuration

param(
    [switch]$Force,
    [switch]$Help
)

# Function to print colored messages
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

function Show-Usage {
    Write-Host "Restart LocalStack with CloudWatch Logs Support" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\restart-localstack-with-logs.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Force    Force restart without confirmation" -ForegroundColor White
    Write-Host "  -Help     Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "  1. Stop the current LocalStack container" -ForegroundColor White
    Write-Host "  2. Remove the container to ensure clean restart" -ForegroundColor White
    Write-Host "  3. Start LocalStack with Phase 1 services (includes CloudWatch Logs)" -ForegroundColor White
    Write-Host "  4. Initialize CloudWatch Logs configuration" -ForegroundColor White
    Write-Host "  5. Run integration tests to verify functionality" -ForegroundColor White
    Write-Host ""
}

if ($Help) {
    Show-Usage
    exit 0
}

Write-Info "Restarting LocalStack with CloudWatch Logs support..."

# Check if LocalStack is running
$localstackRunning = docker ps --filter "name=tattoo-directory-localstack" --format "{{.Names}}" | Select-String "tattoo-directory-localstack"

if ($localstackRunning) {
    if (-not $Force) {
        $response = Read-Host "LocalStack is currently running. Do you want to restart it? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Info "Operation cancelled"
            exit 0
        }
    }
    
    Write-Info "Stopping current LocalStack container..."
    docker-compose -f devtools/docker/docker-compose.local.yml stop localstack
    
    Write-Info "Removing LocalStack container..."
    docker-compose -f devtools/docker/docker-compose.local.yml rm -f localstack
} else {
    Write-Info "LocalStack container is not running"
}

# Verify the services configuration in .env.local
Write-Info "Checking services configuration..."
$envFile = "devtools/.env.local"

if (-not (Test-Path $envFile)) {
    Write-Error "Environment file not found: $envFile"
    exit 1
}

$phase1Services = Get-Content $envFile | Select-String "LOCALSTACK_PHASE1_SERVICES" | ForEach-Object { $_.ToString() }

if (-not $phase1Services) {
    Write-Error "LOCALSTACK_PHASE1_SERVICES not found in $envFile"
    exit 1
}

Write-Success "Found services configuration: $phase1Services"

# Check if logs service is included
if ($phase1Services -notmatch "logs") {
    Write-Error "CloudWatch Logs service is not included in LOCALSTACK_PHASE1_SERVICES"
    Write-Info "Please ensure 'logs' is included in the services list"
    exit 1
}

# Start LocalStack with Phase 1 profile (includes logs service)
Write-Info "Starting LocalStack with Phase 1 services (includes CloudWatch Logs)..."
docker-compose -f devtools/docker/docker-compose.local.yml --profile phase1 up -d localstack

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start LocalStack"
    exit 1
}

# Wait for LocalStack to be ready
Write-Info "Waiting for LocalStack to start..."
Start-Sleep -Seconds 10

# Check if LocalStack is healthy
Write-Info "Checking LocalStack health..."
$maxRetries = 12
$retryCount = 0

do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            break
        }
    } catch {
        # Continue waiting
    }
    
    $retryCount++
    if ($retryCount -ge $maxRetries) {
        Write-Error "LocalStack failed to start within expected time"
        exit 1
    }
    
    Write-Info "Waiting for LocalStack to be ready... (attempt $retryCount/$maxRetries)"
    Start-Sleep -Seconds 5
} while ($retryCount -lt $maxRetries)

Write-Success "LocalStack is running"

# Verify CloudWatch Logs service is now available
Write-Info "Verifying CloudWatch Logs service..."
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -UseBasicParsing -ErrorAction Stop
    $healthData = $healthResponse.Content | ConvertFrom-Json
    
    $logsStatus = $healthData.services.logs
    
    Write-Info "CloudWatch Logs service status: $logsStatus"
    
    if ($logsStatus -eq "disabled") {
        Write-Error "CloudWatch Logs service is still disabled"
        
        # Show current services for debugging
        Write-Info "Current services configuration:"
        docker exec tattoo-directory-localstack env | Select-String "SERVICES"
        exit 1
    }
    
    Write-Success "CloudWatch Logs service is now available"
    
} catch {
    Write-Error "Failed to check CloudWatch Logs service status: $($_.Exception.Message)"
    exit 1
}

# Initialize CloudWatch Logs
Write-Info "Initializing CloudWatch Logs..."
try {
    & ".\devtools\scripts\create-cloudwatch-logs.bat"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "CloudWatch Logs initialization had some issues, but continuing..."
    }
} catch {
    Write-Warning "Failed to run CloudWatch Logs initialization script: $($_.Exception.Message)"
}

# Run the test to verify everything is working
Write-Info "Running CloudWatch Logs integration test..."
try {
    & ".\devtools\scripts\test-cloudwatch-logs.bat"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "CloudWatch Logs integration test passed"
    } else {
        Write-Warning "CloudWatch Logs integration test had some issues"
    }
} catch {
    Write-Warning "Failed to run CloudWatch Logs integration test: $($_.Exception.Message)"
}

Write-Host ""
Write-Success "LocalStack restart completed!"
Write-Info "CloudWatch Logs integration is now ready for use."
Write-Host ""
Write-Info "You can now use the following commands:"
Write-Host "  List log groups:    .\devtools\scripts\stream-logs.ps1 -List" -ForegroundColor White
Write-Host "  Stream logs:        .\devtools\scripts\stream-logs.ps1 -LogGroup '/aws/lambda/api-handler'" -ForegroundColor White
Write-Host "  Cleanup logs:       .\devtools\scripts\cleanup-logs.ps1 -Report" -ForegroundColor White
Write-Host ""