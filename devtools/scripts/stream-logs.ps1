# CloudWatch Logs Streaming Utility for LocalStack (PowerShell)
# This script provides real-time log viewing capabilities for development

param(
    [string]$LogGroup = "",
    [switch]$List,
    [switch]$Follow = $true,
    [string]$Since = "",
    [int]$Lines = 100,
    [string]$Grep = "",
    [switch]$All,
    [switch]$Help
)

# Function to display usage
function Show-Usage {
    Write-Host "CloudWatch Logs Streaming Utility" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\stream-logs.ps1 [OPTIONS] [-LogGroup LOG_GROUP_NAME]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -List              List all available log groups" -ForegroundColor White
    Write-Host "  -Follow            Follow log stream in real-time (default)" -ForegroundColor White
    Write-Host "  -Since DURATION    Show logs since duration (e.g., 1h, 30m, 10s)" -ForegroundColor White
    Write-Host "  -Lines NUMBER      Number of lines to show (default: 100)" -ForegroundColor White
    Write-Host "  -Grep PATTERN      Filter logs by pattern" -ForegroundColor White
    Write-Host "  -All               Stream all Lambda function logs simultaneously" -ForegroundColor White
    Write-Host "  -Help              Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\stream-logs.ps1 -LogGroup '/aws/lambda/api-handler'" -ForegroundColor White
    Write-Host "  .\stream-logs.ps1 -Since '1h' -LogGroup '/aws/lambda/dynamodb-sync'" -ForegroundColor White
    Write-Host "  .\stream-logs.ps1 -Grep 'ERROR' -LogGroup '/aws/lambda/api-handler'" -ForegroundColor White
    Write-Host "  .\stream-logs.ps1 -All" -ForegroundColor White
    Write-Host "  .\stream-logs.ps1 -List" -ForegroundColor White
    Write-Host ""
}

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

# Function to list all log groups
function Get-LogGroups {
    Write-Info "Available CloudWatch Log Groups:"
    
    try {
        $result = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups[].{Name:logGroupName,Retention:retentionInDays,Size:storedBytes}' --output table 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Output $result
        } else {
            Write-Error "Failed to retrieve log groups. Is LocalStack running?"
            exit 1
        }
    } catch {
        Write-Error "Failed to retrieve log groups. Is LocalStack running?"
        exit 1
    }
}

# Function to stream logs from a specific log group
function Start-LogStream {
    param(
        [string]$LogGroupName,
        [string]$SinceOption,
        [int]$LinesOption,
        [string]$GrepPattern
    )
    
    Write-Info "Streaming logs from: $LogGroupName"
    
    # Build docker exec awslocal command
    $cmd = "docker exec -it tattoo-directory-localstack awslocal logs tail '$LogGroupName' --region eu-west-2"
    
    if ($SinceOption) {
        $cmd += " --since $SinceOption"
    }
    
    if ($LinesOption -gt 0) {
        $cmd += " --lines $LinesOption"
    }
    
    # Always follow by default
    $cmd += " --follow"
    
    Write-Success "Starting log stream (Press Ctrl+C to stop)..."
    Write-Host "Command: $cmd" -ForegroundColor Cyan
    Write-Host ""
    
    # Execute the command
    if ($GrepPattern) {
        Invoke-Expression $cmd | Select-String $GrepPattern
    } else {
        Invoke-Expression $cmd
    }
}

# Function to stream all Lambda logs simultaneously
function Start-AllLambdaLogs {
    param(
        [string]$SinceOption,
        [string]$GrepPattern
    )
    
    Write-Info "Starting multi-log streaming for all Lambda functions..."
    
    # Get all Lambda log groups
    try {
        $lambdaLogGroups = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --log-group-name-prefix "/aws/lambda/" --query 'logGroups[].logGroupName' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($lambdaLogGroups)) {
            Write-Error "No Lambda log groups found"
            exit 1
        }
        
        $logGroupArray = $lambdaLogGroups -split "`t"
        
        Write-Success "Found Lambda log groups:"
        foreach ($group in $logGroupArray) {
            Write-Host "  - $group" -ForegroundColor White
        }
        Write-Host ""
        
        # Create temporary directory for log files
        $tempDir = Join-Path $env:TEMP "cloudwatch-logs-$(Get-Random)"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        Write-Info "Streaming logs to temporary files in: $tempDir"
        
        # Start background jobs for each log group
        $jobs = @()
        foreach ($logGroup in $logGroupArray) {
            $logFile = Join-Path $tempDir "$($logGroup -replace '/', '_').log"
            $cmd = "docker exec -it tattoo-directory-localstack awslocal logs tail '$logGroup' --region eu-west-2 --follow"
            
            if ($SinceOption) {
                $cmd += " --since $SinceOption"
            }
            
            # Start background job
            $job = Start-Job -ScriptBlock {
                param($command, $outputFile)
                Invoke-Expression $command | Out-File -FilePath $outputFile -Append
            } -ArgumentList $cmd, $logFile
            
            $jobs += $job
            Write-Success "Started streaming $logGroup (Job ID: $($job.Id))"
        }
        
        Write-Success "All log streams started."
        Write-Info "Press Ctrl+C to stop all streams."
        
        # Monitor the log files
        try {
            while ($true) {
                foreach ($logGroup in $logGroupArray) {
                    $logFile = Join-Path $tempDir "$($logGroup -replace '/', '_').log"
                    if (Test-Path $logFile) {
                        $content = Get-Content $logFile -Tail 10 -Wait
                        if ($content) {
                            if ($GrepPattern) {
                                $content | Select-String $GrepPattern | ForEach-Object {
                                    Write-Host "[$logGroup] $_" -ForegroundColor White
                                }
                            } else {
                                $content | ForEach-Object {
                                    Write-Host "[$logGroup] $_" -ForegroundColor White
                                }
                            }
                        }
                    }
                }
                Start-Sleep -Milliseconds 500
            }
        } finally {
            # Cleanup
            Write-Warning "Stopping all log streams..."
            $jobs | Stop-Job
            $jobs | Remove-Job
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-Error "Failed to start multi-log streaming: $($_.Exception.Message)"
        exit 1
    }
}

# Check if help is requested
if ($Help) {
    Show-Usage
    exit 0
}

# Check if LocalStack is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -ne 200) {
        throw "LocalStack health check failed"
    }
} catch {
    Write-Error "LocalStack is not running or not accessible at http://localhost:4566"
    Write-Info "Please start LocalStack first using: docker-compose up -d localstack"
    exit 1
}

# Execute based on options
if ($List) {
    Get-LogGroups
} elseif ($All) {
    Start-AllLambdaLogs -SinceOption $Since -GrepPattern $Grep
} elseif ($LogGroup) {
    Start-LogStream -LogGroupName $LogGroup -SinceOption $Since -LinesOption $Lines -GrepPattern $Grep
} else {
    Write-Error "No log group specified"
    Write-Host ""
    Show-Usage
    exit 1
}