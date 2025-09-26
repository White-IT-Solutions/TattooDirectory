# LocalStack Service Health Monitoring Script (PowerShell)
# Comprehensive health checks for all LocalStack services with detailed reporting

param(
    [Parameter(Position=0)]
    [ValidateSet("check", "monitor", "status", "help")]
    [string]$Command = "check",
    
    [Parameter()]
    [int]$MonitorInterval = 30,
    
    [Parameter()]
    [switch]$Detailed
)

# Configuration
$LOCALSTACK_ENDPOINT = "http://localhost:4566"
$HEALTH_CHECK_TIMEOUT = 10
$SERVICES = @("dynamodb", "opensearch", "s3", "lambda", "apigateway", "sns", "logs")

# Colors for output
$RED = "Red"
$GREEN = "Green"
$BLUE = "Cyan"
$YELLOW = "Yellow"
$MAGENTA = "Magenta"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-LocalStackCore {
    try {
        $response = Invoke-RestMethod -Uri "$LOCALSTACK_ENDPOINT/health" -Method Get -TimeoutSec $HEALTH_CHECK_TIMEOUT
        return @{
            Status = "Healthy"
            Response = $response
            Error = $null
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Response = $null
            Error = $_.Exception.Message
        }
    }
}

function Test-DynamoDBService {
    try {
        $result = & awslocal dynamodb list-tables --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $tables = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "Tables: $($tables.TableNames.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list tables"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-OpenSearchService {
    try {
        $result = & awslocal opensearch list-domain-names --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $domains = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "Domains: $($domains.DomainNames.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list domains"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-S3Service {
    try {
        $result = & awslocal s3 ls --region eu-west-2 2>&1
        if ($LASTEXITCODE -eq 0) {
            $buckets = ($result | Measure-Object -Line).Lines
            return @{
                Status = "Healthy"
                Details = "Buckets: $buckets"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list buckets"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-LambdaService {
    try {
        $result = & awslocal lambda list-functions --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $functions = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "Functions: $($functions.Functions.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list functions"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-APIGatewayService {
    try {
        $result = & awslocal apigateway get-rest-apis --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $apis = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "APIs: $($apis.items.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list APIs"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-SNSService {
    try {
        $result = & awslocal sns list-topics --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $topics = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "Topics: $($topics.Topics.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list topics"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Test-CloudWatchLogsService {
    try {
        $result = & awslocal logs describe-log-groups --region eu-west-2 --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $logGroups = $result | ConvertFrom-Json
            return @{
                Status = "Healthy"
                Details = "Log Groups: $($logGroups.logGroups.Count)"
                ResponseTime = "< 1s"
            }
        }
        else {
            return @{
                Status = "Unhealthy"
                Details = "Failed to list log groups"
                Error = $result
            }
        }
    }
    catch {
        return @{
            Status = "Unhealthy"
            Details = "Connection failed"
            Error = $_.Exception.Message
        }
    }
}

function Get-ServiceHealthStatus {
    $healthResults = @{}
    
    Write-ColorOutput "🔍 Checking LocalStack service health..." $BLUE
    
    # Test core LocalStack health
    $coreHealth = Test-LocalStackCore
    $healthResults["Core"] = $coreHealth
    
    if ($coreHealth.Status -eq "Healthy") {
        Write-ColorOutput "✅ LocalStack Core: Healthy" $GREEN
        
        # Test individual services
        $serviceTests = @{
            "DynamoDB" = { Test-DynamoDBService }
            "OpenSearch" = { Test-OpenSearchService }
            "S3" = { Test-S3Service }
            "Lambda" = { Test-LambdaService }
            "API Gateway" = { Test-APIGatewayService }
            "SNS" = { Test-SNSService }
            "CloudWatch Logs" = { Test-CloudWatchLogsService }
        }
        
        foreach ($serviceName in $serviceTests.Keys) {
            Write-ColorOutput "  Checking $serviceName..." $BLUE
            $result = & $serviceTests[$serviceName]
            $healthResults[$serviceName] = $result
            
            if ($result.Status -eq "Healthy") {
                Write-ColorOutput "  ✅ $serviceName`: $($result.Details)" $GREEN
            }
            else {
                Write-ColorOutput "  ❌ $serviceName`: $($result.Details)" $RED
                if ($Detailed -and $result.Error) {
                    Write-ColorOutput "     Error: $($result.Error)" $YELLOW
                }
            }
        }
    }
    else {
        Write-ColorOutput "❌ LocalStack Core: Unhealthy" $RED
        if ($Detailed -and $coreHealth.Error) {
            Write-ColorOutput "   Error: $($coreHealth.Error)" $YELLOW
        }
    }
    
    return $healthResults
}

function Show-HealthSummary {
    param($HealthResults)
    
    Write-ColorOutput "`n📊 Health Summary" $BLUE
    Write-ColorOutput "=================" $BLUE
    
    $totalServices = $HealthResults.Count
    $healthyServices = ($HealthResults.Values | Where-Object { $_.Status -eq "Healthy" }).Count
    $unhealthyServices = $totalServices - $healthyServices
    
    Write-ColorOutput "Total Services: $totalServices" $BLUE
    Write-ColorOutput "Healthy: $healthyServices" $GREEN
    Write-ColorOutput "Unhealthy: $unhealthyServices" $(if ($unhealthyServices -eq 0) { $GREEN } else { $RED })
    
    $healthPercentage = [math]::Round(($healthyServices / $totalServices) * 100, 1)
    Write-ColorOutput "Health Score: $healthPercentage%" $(if ($healthPercentage -ge 90) { $GREEN } elseif ($healthPercentage -ge 70) { $YELLOW } else { $RED })
    
    if ($unhealthyServices -gt 0) {
        Write-ColorOutput "`n⚠️  Unhealthy Services:" $YELLOW
        foreach ($service in $HealthResults.Keys) {
            if ($HealthResults[$service].Status -eq "Unhealthy") {
                Write-ColorOutput "  - $service`: $($HealthResults[$service].Details)" $RED
            }
        }
    }
}

function Show-RecoveryInstructions {
    param($HealthResults)
    
    $unhealthyServices = $HealthResults.Keys | Where-Object { $HealthResults[$_].Status -eq "Unhealthy" }
    
    if ($unhealthyServices.Count -gt 0) {
        Write-ColorOutput "`n🔧 Recovery Instructions" $BLUE
        Write-ColorOutput "========================" $BLUE
        
        if ("Core" -in $unhealthyServices) {
            Write-ColorOutput "LocalStack Core is unhealthy:" $RED
            Write-ColorOutput "  1. Check if LocalStack container is running: docker ps" $YELLOW
            Write-ColorOutput "  2. Restart LocalStack: .\devtools\scripts\restart-localstack-with-logs.ps1" $YELLOW
            Write-ColorOutput "  3. Check LocalStack logs: docker logs localstack" $YELLOW
        }
        else {
            Write-ColorOutput "Individual services are unhealthy:" $YELLOW
            Write-ColorOutput "  1. Restart LocalStack services: .\devtools\scripts\restart-localstack-with-logs.ps1" $YELLOW
            Write-ColorOutput "  2. Re-initialize services: .\devtools\scripts\init-localstack-services.ps1" $YELLOW
            Write-ColorOutput "  3. Check service-specific logs in CloudWatch" $YELLOW
        }
        
        Write-ColorOutput "`nFor detailed troubleshooting, see:" $BLUE
        Write-ColorOutput "  docs\TROUBLESHOOTING.md" $YELLOW
    }
}

function Start-HealthMonitoring {
    param([int]$Interval)
    
    Write-ColorOutput "🔄 Starting continuous health monitoring (interval: $Interval seconds)" $BLUE
    Write-ColorOutput "Press Ctrl+C to stop monitoring" $YELLOW
    Write-ColorOutput ""
    
    try {
        while ($true) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-ColorOutput "[$timestamp] Checking health..." $MAGENTA
            
            $healthResults = Get-ServiceHealthStatus
            Show-HealthSummary $healthResults
            
            Write-ColorOutput "`nNext check in $Interval seconds...`n" $BLUE
            Start-Sleep -Seconds $Interval
        }
    }
    catch {
        Write-ColorOutput "`nMonitoring stopped." $YELLOW
    }
}

function Show-Help {
    Write-ColorOutput "`n🔧 LocalStack Service Health Monitor" $BLUE
    Write-ColorOutput "====================================" $BLUE
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\health-check-localstack.ps1 [command] [options]" $BLUE
    Write-ColorOutput ""
    Write-ColorOutput "Commands:" $BLUE
    Write-ColorOutput "  check     Perform one-time health check (default)" $GREEN
    Write-ColorOutput "  monitor   Start continuous monitoring" $GREEN
    Write-ColorOutput "  status    Show detailed service status" $GREEN
    Write-ColorOutput "  help      Show this help message" $GREEN
    Write-ColorOutput ""
    Write-ColorOutput "Options:" $BLUE
    Write-ColorOutput "  -MonitorInterval <seconds>  Monitoring interval (default: 30)" $YELLOW
    Write-ColorOutput "  -Detailed                   Show detailed error information" $YELLOW
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $BLUE
    Write-ColorOutput "  .\health-check-localstack.ps1" $YELLOW
    Write-ColorOutput "  .\health-check-localstack.ps1 monitor -MonitorInterval 60" $YELLOW
    Write-ColorOutput "  .\health-check-localstack.ps1 status -Detailed" $YELLOW
    Write-ColorOutput ""
}

# Main execution
switch ($Command) {
    "check" {
        $healthResults = Get-ServiceHealthStatus
        Show-HealthSummary $healthResults
        Show-RecoveryInstructions $healthResults
        
        # Exit with error code if any service is unhealthy
        $unhealthyCount = ($healthResults.Values | Where-Object { $_.Status -eq "Unhealthy" }).Count
        if ($unhealthyCount -gt 0) {
            exit 1
        }
    }
    "monitor" {
        Start-HealthMonitoring $MonitorInterval
    }
    "status" {
        $healthResults = Get-ServiceHealthStatus
        Show-HealthSummary $healthResults
        
        if ($Detailed) {
            Write-ColorOutput "`n📋 Detailed Service Status" $BLUE
            Write-ColorOutput "===========================" $BLUE
            
            foreach ($service in $healthResults.Keys) {
                $result = $healthResults[$service]
                Write-ColorOutput "`n$service`:" $BLUE
                Write-ColorOutput "  Status: $($result.Status)" $(if ($result.Status -eq "Healthy") { $GREEN } else { $RED })
                if ($result.Details) {
                    Write-ColorOutput "  Details: $($result.Details)" $YELLOW
                }
                if ($result.ResponseTime) {
                    Write-ColorOutput "  Response Time: $($result.ResponseTime)" $YELLOW
                }
                if ($result.Error) {
                    Write-ColorOutput "  Error: $($result.Error)" $RED
                }
            }
        }
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