#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Interactive Documentation Pipeline Runner (PowerShell)

.DESCRIPTION
    Wrapper for the Node.js documentation pipeline script with PowerShell-friendly interface
    and enhanced error handling.

.PARAMETER All
    Run all stages without interactive selection

.PARAMETER DryRun
    Show commands that would be executed without running them

.PARAMETER Help
    Show help information

.EXAMPLE
    .\run-complete-pipeline.ps1
    Run in interactive mode

.EXAMPLE
    .\run-complete-pipeline.ps1 -All
    Run all stages without prompts

.EXAMPLE
    .\run-complete-pipeline.ps1 -DryRun
    Preview commands without executing them
#>

param(
    [switch]$All,
    [switch]$DryRun,
    [switch]$Help
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if Node.js is available
function Test-NodeJs {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" "Green"
            return $true
        }
    }
    catch {
        # Node.js not found
    }
    
    Write-ColorOutput "❌ Node.js is required but not found in PATH" "Red"
    Write-ColorOutput "   Please install Node.js and try again" "Yellow"
    return $false
}

# Show help information
if ($Help) {
    Write-Host @"

Interactive Documentation Pipeline Runner (PowerShell)

Usage:
  .\run-complete-pipeline.ps1 [options]

This PowerShell script runs the documentation consolidation pipeline
with interactive stage selection.

Parameters:
  -All      Run all stages without interactive selection
  -DryRun   Show commands that would be executed without running them
  -Help     Show this help message

Examples:
  .\run-complete-pipeline.ps1              # Interactive mode
  .\run-complete-pipeline.ps1 -All         # Run all stages
  .\run-complete-pipeline.ps1 -DryRun      # Preview commands only
  .\run-complete-pipeline.ps1 -All -DryRun # Preview all commands

The script will guide you through selecting which stages to run.

"@
    exit 0
}

# Main execution
try {
    Write-ColorOutput "`n🚀 Documentation Pipeline Runner (PowerShell)" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    Write-Host ""

    # Check Node.js availability
    if (-not (Test-NodeJs)) {
        exit 1
    }

    # Build arguments for Node.js script
    $nodeArgs = @()
    if ($All) { $nodeArgs += "--all" }
    if ($DryRun) { $nodeArgs += "--dry-run" }

    # Get script directory
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $nodeScript = Join-Path $scriptDir "run-complete-pipeline.js"

    # Check if Node.js script exists
    if (-not (Test-Path $nodeScript)) {
        Write-ColorOutput "❌ Node.js script not found: $nodeScript" "Red"
        exit 1
    }

    Write-ColorOutput "🔄 Starting Node.js pipeline script..." "Yellow"
    Write-Host ""

    # Execute Node.js script
    $process = Start-Process -FilePath "node" -ArgumentList @($nodeScript) + $nodeArgs -Wait -PassThru -NoNewWindow

    # Check exit code
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-ColorOutput "✅ Pipeline execution completed successfully" "Green"
    } else {
        Write-Host ""
        Write-ColorOutput "❌ Pipeline execution failed with exit code: $($process.ExitCode)" "Red"
        exit $process.ExitCode
    }
}
catch {
    Write-ColorOutput "❌ An error occurred: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "DarkRed"
    exit 1
}

Write-Host ""
Write-ColorOutput "Press any key to continue..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")