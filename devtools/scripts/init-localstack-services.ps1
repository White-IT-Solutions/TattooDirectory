# Enhanced LocalStack Service Initialization Script (PowerShell)
# Handles dependency ordering, health checks, and comprehensive reporting

param(
    [Parameter(Position=0)]
    [ValidateSet("init", "health", "status", "help")]
    [string]$Command = "init"
)

# Configuration
$LOCALSTACK_ENDPOINT = "http://localhost:4566"
$HEALTH_CHECK_TIMEOUT = 300  # 5 minutes
$HEALTH_CHECK_INTERVAL = 2   # 2 seconds
$MAX_RETRY_ATTEMPTS = 3

# Colors for output
$RED = "Red"
$GREEN = "Green"
$BLUE = "Cyan"
$YELLOW = "Yellow"

# Service initialization order (dependencies first)
$INIT_SCRIPTS = @(
    "01-create-dynamodb-table.sh",
    "02-create-opensearch-domain.sh", 
    "03-create-s3-buckets.sh",
    "04-create-lambda-functions.sh",
    "05-create-api-gateway.sh",
    "06-deploy-lambda.sh",
    "07-setup-dynamodb-stream-trigger.sh",
    "08-create-cloudwatch-logs.sh",
    "09-create-sns-topics.sh"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-LocalStackHealth {
    try {
        $response = Invoke-RestMethod -Uri "$LOCALSTACK_ENDPOINT/health" -Method Get -TimeoutSec 10
        return $response
    }
    catch {
        return $null
    }
}

function Wait-ForLocalStack {
    Write-ColorOutput "⏳ Waiting for LocalStack to be ready..." $BLUE
    
    $startTime = Get-Date
    $timeout = New-TimeSpan -Seconds $HEALTH_CHECK_TIMEOUT
    
    do {
        $health = Test-LocalStackHealth
        if ($health) {
            Write-ColorOutput "✅ LocalStack is ready!" $GREEN
            return $true
        }
        
        Write-ColorOutput "⏳ LocalStack not ready yet, waiting..." $YELLOW
        Start-Sleep -Seconds $HEALTH_CHECK_INTERVAL
        
    } while ((Get-Date) - $startTime -lt $timeout)
    
    Write-ColorOutput "❌ LocalStack health check timeout after $HEALTH_CHECK_TIMEOUT seconds" $RED
    return $false
}

function Invoke-InitScript {
    param([string]$ScriptName)
    
    $scriptPath = "../../localstack-init/$ScriptName"
    
    if (-not (Test-Path $scriptPath)) {
        Write-ColorOutput "❌ Script not found: $scriptPath" $RED
        return $false
    }
    
    Write-ColorOutput "🔄 Running: $ScriptName" $BLUE
    
    try {
        # Run bash script in WSL if available, otherwise use Git Bash
        if (Get-Command wsl -ErrorAction SilentlyContinue) {
            $result = wsl bash -c "cd /mnt/c/$(Get-Location | ForEach-Object {$_.Path.Replace('\', '/').Replace('C:', '')}) && bash $scriptPath"
        }
        elseif (Get-Command bash -ErrorAction SilentlyContinue) {
            $result = bash $scriptPath
        }
        else {
            Write-ColorOutput "❌ No bash environment found. Install WSL or Git Bash." $RED
            return $false
        }
        
        Write-ColorOutput "✅ Completed: $ScriptName" $GREEN
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed: $ScriptName - $($_.Exception.Message)" $RED
        return $false
    }
}

function Show-ServiceStatus {
    Write-ColorOutput "`n📊 LocalStack Service Status" $BLUE
    Write-ColorOutput "================================" $BLUE
    
    $health = Test-LocalStackHealth
    if (-not $health) {
        Write-ColorOutput "❌ LocalStack is not responding" $RED
        return
    }
    
    Write-ColorOutput "✅ LocalStack Core: Running" $GREEN
    
    # Check individual services
    $services = @("dynamodb", "opensearch", "s3", "lambda", "apigateway", "sns", "logs")
    
    foreach ($service in $services) {
        try {
            if ($health.services -and $health.services.$service -eq "available") {
                Write-ColorOutput "✅ $service`: Available" $GREEN
            }
            else {
                Write-ColorOutput "⚠️  $service`: Status unknown" $YELLOW
            }
        }
        catch {
            Write-ColorOutput "❌ $service`: Not available" $RED
        }
    }
}

function Initialize-Services {
    Write-ColorOutput "`n🚀 Initializing LocalStack Services" $BLUE
    Write-ColorOutput "====================================" $BLUE
    
    # Wait for LocalStack to be ready
    if (-not (Wait-ForLocalStack)) {
        Write-ColorOutput "❌ Cannot proceed - LocalStack is not ready" $RED
        exit 1
    }
    
    # Run initialization scripts in order
    $successCount = 0
    $totalScripts = $INIT_SCRIPTS.Count
    
    foreach ($script in $INIT_SCRIPTS) {
        if (Invoke-InitScript $script) {
            $successCount++
        }
        else {
            Write-ColorOutput "⚠️  Continuing with remaining scripts..." $YELLOW
        }
    }
    
    Write-ColorOutput "`n📈 Initialization Summary" $BLUE
    Write-ColorOutput "=========================" $BLUE
    Write-ColorOutput "✅ Successful: $successCount/$totalScripts scripts" $GREEN
    
    if ($successCount -eq $totalScripts) {
        Write-ColorOutput "🎉 All services initialized successfully!" $GREEN
    }
    elseif ($successCount -gt 0) {
        Write-ColorOutput "⚠️  Partial initialization completed" $YELLOW
    }
    else {
        Write-ColorOutput "❌ Initialization failed" $RED
        exit 1
    }
}

function Show-Help {
    Write-ColorOutput "`n🔧 LocalStack Service Initialization" $BLUE
    Write-ColorOutput "====================================" $BLUE
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\init-localstack-services.ps1 [command]" $BLUE
    Write-ColorOutput ""
    Write-ColorOutput "Commands:" $BLUE
    Write-ColorOutput "  init     Initialize all LocalStack services (default)" $GREEN
    Write-ColorOutput "  health   Check LocalStack health status" $GREEN
    Write-ColorOutput "  status   Show detailed service status" $GREEN
    Write-ColorOutput "  help     Show this help message" $GREEN
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $BLUE
    Write-ColorOutput "  .\init-localstack-services.ps1" $YELLOW
    Write-ColorOutput "  .\init-localstack-services.ps1 init" $YELLOW
    Write-ColorOutput "  .\init-localstack-services.ps1 status" $YELLOW
    Write-ColorOutput ""
}

# Main execution
switch ($Command) {
    "init" {
        Initialize-Services
    }
    "health" {
        $health = Test-LocalStackHealth
        if ($health) {
            Write-ColorOutput "✅ LocalStack is healthy" $GREEN
            Write-ColorOutput "Endpoint: $LOCALSTACK_ENDPOINT" $BLUE
        }
        else {
            Write-ColorOutput "❌ LocalStack is not responding" $RED
            exit 1
        }
    }
    "status" {
        Show-ServiceStatus
    }
    "help" {
        Show-Help
    }
    default {
        Write-ColorOutput "❌ Unknown command: $Command" $RED
        Show-Help
        exit 1
    }
}