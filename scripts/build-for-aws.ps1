# Build script for AWS deployment (PowerShell)
# This script builds the Next.js app for static export to S3

param(
    [string]$BuildEnv = "production"
)

Write-Host "🚀 Building Next.js app for AWS deployment ($BuildEnv)" -ForegroundColor Green

try {
    # Change to frontend directory
    $frontendDir = Join-Path $PSScriptRoot ".." "frontend"
    Set-Location $frontendDir
    
    # Set environment for static export
    $env:NEXT_PUBLIC_ENVIRONMENT = $BuildEnv
    
    # Build the application
    Write-Host "📦 Building Next.js application..." -ForegroundColor Yellow
    npm run build:aws
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build command failed"
    }
    
    # Check if 'out' directory was created (static export)
    $outDir = Join-Path $frontendDir "out"
    if (Test-Path $outDir) {
        Write-Host "✅ Static export created successfully in /out directory" -ForegroundColor Green
        Write-Host "📁 Ready for S3 upload" -ForegroundColor Green
        
        # List contents of out directory
        Write-Host "📋 Generated files:" -ForegroundColor Cyan
        Get-ChildItem $outDir | ForEach-Object { Write-Host "   - $($_.Name)" }
    } else {
        throw "Static export directory not found"
    }
    
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}