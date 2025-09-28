# PowerShell script to recover all files affected by organize-docs-structure.bat
# This will restore files from the previous git commit

param(
    [string]$CommitHash = "HEAD~1",
    [switch]$WhatIf
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Recovering Affected Documentation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# All files that were affected by the batch script
$affectedFiles = @(
    # Backend Documentation
    "backend/README_BACKEND.md",
    "backend/src/containers/fargate-scraper/README_FARGATE_SCRAPER.md",
    "backend/src/handlers/api-handler/README_API_HANDLER.md",
    "backend/src/handlers/discover-studios/README_DISCOVER_STUDIOS.md",
    "backend/src/handlers/dynamodb-sync/README_DYNAMODB_SYNC.md",
    "backend/src/handlers/find-artists/README_FIND_ARTISTS.md",
    "backend/src/handlers/queue-scraping/README_QUEUE_SCRAPING.md",
    "backend/src/handlers/rotate-nat-gateway-eip/README_ROTATE_NAT_GATEWAY_EIP.md",
    "backend/src/handlers/secret-rotation/README_SECRETS_ROTATION.md",
    
    # Backups Documentation
    "backups/legacy-scripts-20250918/data-seeder/DATA-MANAGEMENT.md",
    "backups/legacy-scripts-20250918/data-seeder/README_DATA_SEEDER.md",
    
    # DevTools Documentation
    "devtools/README-DEVTOOLS.md",
    "devtools/localstack-config/README.md",
    "devtools/scripts/README-ENHANCED-LOCALSTACK.md",
    "devtools/scripts/README-CLOUDWATCH-LOGS.md",
    
    # LocalStack Documentation
    "localstack-init/README_LOCAL.md",
    
    # Data Management Documentation
    "docs/data_management/COMMAND_COMPARISON.md",
    "docs/data_management/DATA_MANAGEMENT_GUIDE.md",
    "docs/data_management/FINAL_SYSTEM_VALIDATION_REPORT.md",
    "docs/data_management/FRONTEND_SYNC_MIGRATION_GUIDE.md",
    "docs/data_management/MIGRATION_COMPLETION_REPORT.md",
    "docs/data_management/MIGRATION_GUIDE.md",
    "docs/data_management/PERFORMANCE_BENCHMARKS.md",
    "docs/data_management/STUDIO_ARTIST_RELATIONSHIPS.md",
    "docs/data_management/STUDIO_DATA_MIGRATION_GUIDE.md",
    "docs/data_management/STUDIO_DATA_SCHEMA.md",
    "docs/data_management/STUDIO_IMAGE_PROCESSING.md",
    
    # LocalStack Setup Documentation
    "docs/local_dev/SETUP_MASTER.md",
    "docs/local_dev/setup_full/CROSS_PLATFORM_SUMMARY.md",
    "docs/local_dev/setup_full/DOCUMENTATION_UPDATES.md",
    "docs/local_dev/setup_full/LINUX_SETUP_GUIDE.md",
    "docs/local_dev/setup_full/LOCAL-DEVELOPMENT-GUIDE.md",
    "docs/local_dev/setup_full/MACOS_SETUP_GUIDE.md",
    "docs/local_dev/setup_full/PLATFORM_SETUP.md",
    "docs/local_dev/setup_full/QUICK_START.md",
    "docs/local_dev/setup_full/README_Development_Workflow.md",
    "docs/local_dev/setup_full/README_Local_Development.md",
    "docs/local_dev/setup_full/SETUP_SUMMARY.md",
    "docs/local_dev/setup_full/WINDOWS_SETUP_GUIDE.md",
    
    # LocalStack Troubleshooting Documentation
    "docs/local_dev/TROUBLESHOOTING_MASTER.md",
    "docs/local_dev/troubleshooting_full/API_TESTING_GUIDE.md",
    "docs/local_dev/troubleshooting_full/BEST-PRACTICES.md",
    "docs/local_dev/troubleshooting_full/MONITORING_SYSTEM.md",
    "docs/local_dev/troubleshooting_full/PERFORMANCE_MONITORING.md",
    "docs/local_dev/troubleshooting_full/SECURITY-GUIDELINES.md",
    "docs/local_dev/troubleshooting_full/VIDEO-TUTORIALS-GUIDE.md",
    
    # Planning Documentation
    "docs/PRODUCTION_READY_REPORT.md",
    "docs/FRONTEND_SYNC_CONSOLIDATION.md",
    "docs/DYNAMODB_STREAMS_IMPLEMENTATION.md",
    "docs/ENHANCED_DATA_DISPLAY_INTEGRATION.md",
    "docs/STUDIO_CLI_COMMANDS.md",
    "docs/STUDIO_HEALTH_MONITORING.md",
    "docs/API_DOCUMENTATION.md",
    "docs/TROUBLESHOOTING.md",
    "docs/AI_Assisted_Documentation/terraform-deployment-guide.md",
    
    # Infrastructure Documentation
    "docs/terraform-modules/README.md",
    "docs/terraform-modules/01-foundation.md",
    "docs/terraform-modules/03-audit-foundation.md",
    "docs/terraform-modules/04-central-logging.md",
    "docs/terraform-modules/05-networking.md",
    "docs/terraform-modules/06-central-security.md",
    "docs/terraform-modules/07-app-security.md",
    "docs/terraform-modules/08-log-storage.md",
    "docs/terraform-modules/09-app-storage.md",
    "docs/terraform-modules/10-search.md",
    "docs/terraform-modules/11-iam.md",
    "docs/terraform-modules/12-compute.md",
    "docs/terraform-modules/13-api.md",
    "docs/terraform-modules/14-security-monitoring.md",
    "docs/terraform-modules/15-app-monitoring.md",
    "docs/terraform-modules/16-backup.md",
    "docs/terraform-modules/17-governance.md",
    "docs/terraform-modules/19-delivery.md",
    
    # Frontend Documentation
    "frontend/README_FRONTEND.md",
    "frontend/docs/ENVIRONMENT_CONFIGURATION.md",
    "frontend/docs/README_DOCKER.md",
    "frontend/docs/README_FRONTEND.md",
    "frontend/src/app/styles/README-Enhanced-Styles.md",
    "frontend/src/app/components/README-AdvancedSearch.md",
    "frontend/src/app/components/README-SearchResultsSystem.md",
    "frontend/src/lib/README-SearchController.md",
    "frontend/src/__tests__/performance/PERFORMANCE_SUMMARY.md",
    
    # Frontend Design System Documentation
    "frontend/src/design-system/README-STANDARDIZATION.md",
    "frontend/src/design-system/components/accessibility/README.md",
    "frontend/src/design-system/components/feedback/EmptyState/README.md",
    "frontend/src/design-system/components/feedback/ErrorBoundary/README.md",
    "frontend/src/design-system/components/feedback/README.md",
    "frontend/src/design-system/components/feedback/Toast/README.md",
    "frontend/src/design-system/components/ui/DataVisualization/README.md",
    "frontend/src/design-system/components/ui/Performance/README.md",
    "frontend/src/design-system/components/ui/StudioSearch/README-Enhanced.md",
    "frontend/src/design-system/components/ui/ThemeProvider/README.md",
    "frontend/src/design-system/components/ui/VisualEffects/README.md",
    "frontend/src/design-system/docs/component-api-reference.md",
    "frontend/src/design-system/docs/component-integration-guide.md",
    "frontend/src/design-system/docs/testing-guidelines.md",
    
    # Frontend Tests Documentation
    "frontend/src/__tests__/README.md",
    "frontend/src/__tests__/search-functionality/README.md",
    "frontend/src/__tests__/search-functionality/API_REFERENCE.md",
    "frontend/src/__tests__/search-functionality/DOCUMENTATION.md",
    "frontend/src/__tests__/search-functionality/TESTING_GUIDE.md",
    "frontend/src/__tests__/search-functionality/TROUBLESHOOTING.md",
    
    # Scripts Documentation
    "scripts/docs/README.md",
    "scripts/data-management/STUDIO_IMAGE_PROCESSOR_SUMMARY.md",
    "scripts/data-seeder/DATA-MANAGEMENT.md",
    "scripts/data-seeder/README_DATA_SEEDER.md",
    "scripts/docs/README-Configuration.md",
    "scripts/output/compatibility-matrix.md",
    "scripts/output/error-handling-fix-summary.md",
    "scripts/output/migration-validation-report.md",
    "scripts/output/npm-commands-fix-summary.md",
    "scripts/README_CONTENT_GENERATION.md",
    "scripts/Tattoo_Vertex_Docs.md",
    "scripts/test-data/studios/README.md",
    "scripts/test-results/npm-command-test-summary.md",
    "scripts/validation/PRODUCTION-PARITY-VALIDATION.md",
    "scripts/__tests__/TESTING_ISSUES.md",
    
    # Tests E2E Documentation
    "tests/e2e/README.md",
    "tests/e2e/IMPLEMENTATION_GUIDE.md",
    "tests/integration/README.md",
    "tests/Test_Data/StudioImages/README.md"
)

$recoveredCount = 0
$notFoundCount = 0
$errorCount = 0

Write-Host "Attempting to recover $($affectedFiles.Count) files from commit: $CommitHash" -ForegroundColor Blue
Write-Host ""

foreach ($file in $affectedFiles) {
    try {
        # Check if file exists in the specified commit
        $gitShowResult = git show "${CommitHash}:$file" 2>&1
        if ($LASTEXITCODE -eq 0) {
            if ($WhatIf) {
                Write-Host "WOULD RECOVER: $file" -ForegroundColor Gray
            } else {
                # Restore the file
                git checkout $CommitHash -- $file 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ RECOVERED: $file" -ForegroundColor Green
                    $recoveredCount++
                } else {
                    Write-Host "❌ FAILED TO RECOVER: $file" -ForegroundColor Red
                    $errorCount++
                }
            }
        } else {
            Write-Host "⚠️  NOT FOUND IN COMMIT: $file" -ForegroundColor Yellow
            $notFoundCount++
        }
    }
    catch {
        Write-Host "❌ ERROR RECOVERING: $file - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Recovery Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RECOVERY SUMMARY:" -ForegroundColor White
Write-Host "   ✅ Files recovered: $recoveredCount" -ForegroundColor Green
Write-Host "   ⚠️  Files not found: $notFoundCount" -ForegroundColor Yellow
Write-Host "   ❌ Recovery errors: $errorCount" -ForegroundColor Red
Write-Host ""

if ($WhatIf) {
    Write-Host "This was a preview run. Use without -WhatIf to actually recover files." -ForegroundColor Gray
} else {
    Write-Host "Files have been restored to their original locations." -ForegroundColor Green
    Write-Host "You can now run the improved organize-docs-structure.ps1 script." -ForegroundColor Blue
}

Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Gray
Write-Host "  .\recover-all-files.ps1 -WhatIf              # Preview recovery" -ForegroundColor Gray
Write-Host "  .\recover-all-files.ps1                      # Recover from HEAD~1" -ForegroundColor Gray
Write-Host "  .\recover-all-files.ps1 -CommitHash abc123   # Recover from specific commit" -ForegroundColor Gray

Write-Host ""
Write-Host "Next steps after recovery:" -ForegroundColor Blue
Write-Host "  1. Run .\create-missing-e2e-docs.ps1 to create missing E2E docs" -ForegroundColor Gray
Write-Host "  2. Run .\create-all-missing-docs.ps1 to create comprehensive docs" -ForegroundColor Gray
Write-Host "  3. Run .\create-remaining-e2e-docs.ps1 to complete E2E documentation" -ForegroundColor Gray
Write-Host "  4. Run .\organize-docs-structure.ps1 to organize all documentation" -ForegroundColor Gray
Write-Host "  5. Run .\cleanup-duplicates-auto.ps1 to clean up duplicates" -ForegroundColor Gray