# CloudWatch Logs Cleanup Script for LocalStack (PowerShell)
# This script manages local storage usage by cleaning up old logs
# and provides maintenance utilities for log management

param(
    [int]$Days = 7,
    [int]$SizeMB = 100,
    [string]$Group = "",
    [switch]$Force,
    [switch]$Report,
    [switch]$All,
    [switch]$Help
)

# Configuration
$LocalStackLogsDir = ".\devtools\localstack-logs"

# Function to display usage
function Show-Usage {
    Write-Host "CloudWatch Logs Cleanup Utility" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\cleanup-logs.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Days DAYS         Delete logs older than DAYS (default: 7)" -ForegroundColor White
    Write-Host "  -SizeMB SIZE_MB    Delete logs if total size exceeds SIZE_MB (default: 100)" -ForegroundColor White
    Write-Host "  -Group LOG_GROUP   Clean specific log group only" -ForegroundColor White
    Write-Host "  -Force             Force cleanup without confirmation" -ForegroundColor White
    Write-Host "  -Report            Show storage usage report only" -ForegroundColor White
    Write-Host "  -All               Clean all logs regardless of retention policy" -ForegroundColor White
    Write-Host "  -Help              Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\cleanup-logs.ps1 -Days 3" -ForegroundColor White
    Write-Host "  .\cleanup-logs.ps1 -SizeMB 50" -ForegroundColor White
    Write-Host "  .\cleanup-logs.ps1 -Group '/aws/lambda/api-handler'" -ForegroundColor White
    Write-Host "  .\cleanup-logs.ps1 -Report" -ForegroundColor White
    Write-Host "  .\cleanup-logs.ps1 -Force -All" -ForegroundColor White
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

# Function to get log storage usage
function Get-StorageUsage {
    Write-Info "Analyzing CloudWatch Logs storage usage..."
    
    try {
        $logGroupsJson = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups[].{Name:logGroupName,Size:storedBytes,Retention:retentionInDays,CreationTime:creationTime}' --output json 2>$null
        
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($logGroupsJson)) {
            Write-Warning "No log groups found"
            return $false
        }
        
        $logGroups = $logGroupsJson | ConvertFrom-Json
        
        # Calculate total storage
        $totalBytes = ($logGroups | ForEach-Object { $_.Size -as [long] } | Measure-Object -Sum).Sum
        $totalMB = [math]::Floor($totalBytes / 1024 / 1024)
        $logGroupCount = $logGroups.Count
        
        Write-Host ""
        Write-Host "📊 CloudWatch Logs Storage Report" -ForegroundColor Cyan
        Write-Host "==================================" -ForegroundColor Cyan
        Write-Host "Total log groups: $logGroupCount" -ForegroundColor White
        Write-Host "Total storage: ${totalMB}MB ($totalBytes bytes)" -ForegroundColor White
        Write-Host ""
        
        # Show top 10 largest log groups
        Write-Host "🔝 Top 10 Largest Log Groups:" -ForegroundColor Yellow
        $topGroups = $logGroups | Sort-Object Size -Descending | Select-Object -First 10
        foreach ($group in $topGroups) {
            $sizeMB = [math]::Floor(($group.Size -as [long]) / 1024 / 1024)
            $retention = if ($group.Retention) { "$($group.Retention) day" } else { "∞" }
            Write-Host "  $($group.Name): ${sizeMB}MB ($retention retention)" -ForegroundColor White
        }
        
        Write-Host ""
        return $true
        
    } catch {
        Write-Error "Failed to get storage usage: $($_.Exception.Message)"
        return $false
    }
}

# Function to clean logs by age
function Remove-LogsByAge {
    param(
        [int]$RetentionDays,
        [string]$SpecificGroup,
        [bool]$ForceCleanup
    )
    
    Write-Info "Cleaning logs older than $RetentionDays days..."
    
    # Calculate cutoff timestamp
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $cutoffMillis = [long]([DateTimeOffset]$cutoffDate).ToUnixTimeMilliseconds()
    
    # Get log groups
    $queryFilter = if ($SpecificGroup) { "--log-group-name-prefix `"$SpecificGroup`"" } else { "" }
    
    try {
        $logGroupsText = Invoke-Expression "docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 $queryFilter --query 'logGroups[].logGroupName' --output text 2>`$null"
        
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($logGroupsText)) {
            Write-Warning "No log groups found for cleanup"
            return
        }
        
        $logGroups = $logGroupsText -split "`t"
        $cleanedCount = 0
        $totalFreedBytes = 0
        
        foreach ($logGroup in $logGroups) {
            Write-Info "Processing log group: $logGroup"
            
            # Get log streams older than cutoff
            $oldStreamsText = docker exec tattoo-directory-localstack awslocal logs describe-log-streams --log-group-name "$logGroup" --region eu-west-2 --query "logStreams[?lastEventTime < ``$cutoffMillis``].logStreamName" --output text 2>$null
            
            if ($LASTEXITCODE -eq 0 -and ![string]::IsNullOrEmpty($oldStreamsText) -and $oldStreamsText -ne "None") {
                $oldStreams = $oldStreamsText -split "`t"
                $streamCount = $oldStreams.Count
                
                if (-not $ForceCleanup) {
                    Write-Warning "Found $streamCount old log streams in $logGroup"
                    $response = Read-Host "Delete these streams? (y/N)"
                    if ($response -notmatch '^[Yy]$') {
                        Write-Info "Skipping $logGroup"
                        continue
                    }
                }
                
                # Delete old log streams
                foreach ($stream in $oldStreams) {
                    $streamSize = docker exec tattoo-directory-localstack awslocal logs describe-log-streams --log-group-name "$logGroup" --log-stream-name-prefix "$stream" --region eu-west-2 --query 'logStreams[0].storedBytes' --output text 2>$null
                    if ($LASTEXITCODE -ne 0) { $streamSize = "0" }
                    
                    docker exec tattoo-directory-localstack awslocal logs delete-log-stream --log-group-name "$logGroup" --log-stream-name "$stream" --region eu-west-2 2>$null
                    
                    $totalFreedBytes += [long]$streamSize
                    $cleanedCount++
                }
                
                Write-Success "Cleaned $streamCount streams from $logGroup"
            } else {
                Write-Info "No old streams found in $logGroup"
            }
        }
        
        $freedMB = [math]::Floor($totalFreedBytes / 1024 / 1024)
        Write-Success "Cleanup completed: $cleanedCount streams deleted, ${freedMB}MB freed"
        
    } catch {
        Write-Error "Failed to clean logs by age: $($_.Exception.Message)"
    }
}

# Function to clean logs by size
function Remove-LogsBySize {
    param(
        [int]$MaxSizeMB,
        [bool]$ForceCleanup
    )
    
    Write-Info "Checking if logs exceed ${MaxSizeMB}MB limit..."
    
    try {
        # Get current total size
        $totalBytesText = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups[].storedBytes' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to get log group sizes"
            return
        }
        
        $totalBytes = ($totalBytesText -split "`t" | ForEach-Object { [long]$_ } | Measure-Object -Sum).Sum
        $currentMB = [math]::Floor($totalBytes / 1024 / 1024)
        
        if ($currentMB -le $MaxSizeMB) {
            Write-Success "Current usage (${currentMB}MB) is within limit (${MaxSizeMB}MB)"
            return
        }
        
        Write-Warning "Current usage (${currentMB}MB) exceeds limit (${MaxSizeMB}MB)"
        
        # Calculate how much to clean
        $excessMB = $currentMB - $MaxSizeMB
        $targetBytes = $excessMB * 1024 * 1024
        
        Write-Info "Need to free approximately ${excessMB}MB"
        
        # Get log groups sorted by size (largest first)
        $logGroupsJson = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups | sort_by(@, &storedBytes) | reverse(@)[].{Name:logGroupName,Size:storedBytes}' --output json 2>$null
        $logGroups = $logGroupsJson | ConvertFrom-Json
        
        $freedBytes = 0
        $cleanedGroups = 0
        
        foreach ($group in $logGroups) {
            if ($freedBytes -ge $targetBytes) { break }
            
            $groupMB = [math]::Floor(($group.Size -as [long]) / 1024 / 1024)
            
            if (-not $ForceCleanup) {
                Write-Warning "Clean log group $($group.Name) (${groupMB}MB)?"
                $response = Read-Host "Continue? (y/N)"
                if ($response -notmatch '^[Yy]$') {
                    continue
                }
            }
            
            # Delete oldest log streams from this group
            $streamsText = docker exec tattoo-directory-localstack awslocal logs describe-log-streams --log-group-name "$($group.Name)" --region eu-west-2 --order-by LastEventTime --query 'logStreams[].logStreamName' --output text 2>$null
            
            if ($LASTEXITCODE -eq 0 -and ![string]::IsNullOrEmpty($streamsText)) {
                $streams = $streamsText -split "`t"
                
                foreach ($stream in $streams) {
                    if ($freedBytes -ge $targetBytes) { break }
                    
                    docker exec tattoo-directory-localstack awslocal logs delete-log-stream --log-group-name "$($group.Name)" --log-stream-name "$stream" --region eu-west-2 2>$null
                    
                    $freedBytes += [long]($group.Size) / 10  # Rough estimate
                }
            }
            
            $cleanedGroups++
            Write-Success "Cleaned log group: $($group.Name)"
        }
        
        $freedMB = [math]::Floor($freedBytes / 1024 / 1024)
        Write-Success "Size-based cleanup completed: $cleanedGroups groups processed, ~${freedMB}MB freed"
        
    } catch {
        Write-Error "Failed to clean logs by size: $($_.Exception.Message)"
    }
}

# Function to clean all logs
function Remove-AllLogs {
    param([bool]$ForceCleanup)
    
    Write-Warning "This will delete ALL CloudWatch logs!"
    
    if (-not $ForceCleanup) {
        $response = Read-Host "Are you sure you want to continue? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Info "Cleanup cancelled"
            return
        }
    }
    
    try {
        # Get all log groups
        $logGroupsText = docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups[].logGroupName' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($logGroupsText)) {
            Write-Warning "No log groups found"
            return
        }
        
        $logGroups = $logGroupsText -split "`t"
        $deletedCount = 0
        
        foreach ($logGroup in $logGroups) {
            docker exec tattoo-directory-localstack awslocal logs delete-log-group --log-group-name "$logGroup" --region eu-west-2 2>$null
            $deletedCount++
            Write-Success "Deleted log group: $logGroup"
        }
        
        Write-Success "All logs cleaned: $deletedCount log groups deleted"
        
    } catch {
        Write-Error "Failed to clean all logs: $($_.Exception.Message)"
    }
}

# Function to clean LocalStack container logs
function Remove-LocalStackContainerLogs {
    Write-Info "Cleaning LocalStack container logs..."
    
    if (Test-Path $LocalStackLogsDir) {
        $logFiles = Get-ChildItem -Path $LocalStackLogsDir -Filter "*.log" -File -ErrorAction SilentlyContinue
        
        if ($logFiles) {
            $fileCount = $logFiles.Count
            $totalSize = (Get-ChildItem -Path $LocalStackLogsDir -Recurse | Measure-Object -Property Length -Sum).Sum
            $totalSizeMB = [math]::Round($totalSize / 1024 / 1024, 2)
            
            Write-Info "Found $fileCount log files (${totalSizeMB}MB) in $LocalStackLogsDir"
            
            # Clean files older than retention period
            $cutoffDate = (Get-Date).AddDays(-$Days)
            $oldFiles = $logFiles | Where-Object { $_.LastWriteTime -lt $cutoffDate }
            
            if ($oldFiles) {
                $oldFiles | Remove-Item -Force -ErrorAction SilentlyContinue
                Write-Success "Removed $($oldFiles.Count) old log files"
            }
            
            # Truncate large files
            $largeFiles = $logFiles | Where-Object { $_.Length -gt 10MB }
            foreach ($file in $largeFiles) {
                try {
                    # Truncate to 1MB by keeping only the last 1MB of content
                    $content = Get-Content $file.FullName -Tail 1000 -ErrorAction SilentlyContinue
                    if ($content) {
                        $content | Set-Content $file.FullName -ErrorAction SilentlyContinue
                    }
                } catch {
                    # Ignore truncation errors
                }
            }
            
            Write-Success "LocalStack container logs cleaned"
        } else {
            Write-Info "No LocalStack container logs found"
        }
    } else {
        Write-Info "LocalStack logs directory not found: $LocalStackLogsDir"
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
if ($Report) {
    Get-StorageUsage | Out-Null
} elseif ($All) {
    Remove-AllLogs -ForceCleanup $Force
} else {
    # Show current usage
    Get-StorageUsage | Out-Null
    
    # Clean by age
    Remove-LogsByAge -RetentionDays $Days -SpecificGroup $Group -ForceCleanup $Force
    
    # Clean by size if needed
    Remove-LogsBySize -MaxSizeMB $SizeMB -ForceCleanup $Force
    
    # Clean LocalStack container logs
    Remove-LocalStackContainerLogs
}

Write-Success "Log cleanup completed!"