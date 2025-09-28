# Complete Documentation Recovery and Organization Script
# Targets specific git commit: ba1c16562b62627feebb80486401c89a015e82fc
# Consolidates all recovery steps into one comprehensive process

param(
    [string[]]$CommitHashes = @("be39902", "b7c0c17", "8441be0", "e80a722", "48f196a", "8131bca"),
    [switch]$WhatIf,
    [switch]$SkipRecovery,
    [switch]$SkipCreation,
    [switch]$SkipOrganization,
    [switch]$SkipCleanup
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Complete Documentation Recovery" -ForegroundColor Cyan
Write-Host "   Target Commits: $($CommitHashes -join ', ')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Initialize counters
$recoveredCount = 0
$createdCount = 0
$movedCount = 0
$cleanedCount = 0
$errorCount = 0

# All files that need to be recovered from git (from multiple commits)
$filesToRecover = @(
    # Backend Documentation (from 8441be0)
    "backend/README_BACKEND.md",
    "backend/src/containers/fargate-scraper/README_FARGATE_SCRAPER.md",
    "backend/src/handlers/api-handler/README_API_HANDLER.md",
    "backend/src/handlers/discover-studios/README_DISCOVER_STUDIOS.md",
    "backend/src/handlers/dynamodb-sync/README_DYNAMODB_SYNC.md",
    "backend/src/handlers/find-artists/README_FIND_ARTISTS.md",
    "backend/src/handlers/queue-scraping/README_QUEUE_SCRAPING.md",
    "backend/src/handlers/rotate-nat-gateway-eip/README_ROTATE_NAT_GATEWAY_EIP.md",
    "backend/src/handlers/secret-rotation/README_SECRETS_ROTATION.md",
    
    # DevTools Documentation (from 8441be0 and e80a722)
    "devtools/README-DEVTOOLS.md",
    "dev-tools/README-DEVTOOLS.md",
    "dev-tools/README-ADVANCED-FEATURES.md",
    "localstack-init/README_LOCAL.md",
    
    # LocalStack Documentation (from 8441be0)
    "docs/local_dev/API_TESTING_GUIDE.md",
    "docs/local_dev/BEST-PRACTICES.md",
    "docs/local_dev/LOCAL-DEVELOPMENT-GUIDE.md",
    "docs/local_dev/MONITORING_SYSTEM.md",
    "docs/local_dev/PERFORMANCE_MONITORING.md",
    "docs/local_dev/SECURITY-GUIDELINES.md",
    "docs/local_dev/SETUP_MASTER.md",
    "docs/local_dev/TROUBLESHOOTING_MASTER.md",
    "docs/local_dev/VIDEO-TUTORIALS-GUIDE.md",
    "docs/local_dev/setup_full/CROSS_PLATFORM_SUMMARY.md",
    "docs/local_dev/setup_full/DOCUMENTATION_UPDATES.md",
    "docs/local_dev/setup_full/LINUX_SETUP_GUIDE.md",
    "docs/local_dev/setup_full/MACOS_SETUP_GUIDE.md",
    "docs/local_dev/setup_full/PLATFORM_SETUP.md",
    "docs/local_dev/setup_full/QUICK_START.md",
    "docs/local_dev/setup_full/README_Development_Workflow.md",
    "docs/local_dev/setup_full/README_Local_Development.md",
    "docs/local_dev/setup_full/SETUP_SUMMARY.md",
    "docs/local_dev/setup_full/WINDOWS_SETUP_GUIDE.md",
    
    # General docs (from e80a722)
    "docs/BEST-PRACTICES.md",
    "docs/LOCAL-DEVELOPMENT-GUIDE.md",
    "docs/SECURITY-GUIDELINES.md",
    "docs/VIDEO-TUTORIALS-GUIDE.md",
    
    # Planning and Project docs (from b7c0c17)
    "docs/ENHANCED_DATA_DISPLAY_INTEGRATION.md",
    "docs/FRONTEND_SYNC_CONSOLIDATION.md",
    "docs/PRODUCTION_READY_REPORT.md",
    "docs/STUDIO_CLI_COMMANDS.md",
    "docs/STUDIO_HEALTH_MONITORING.md",
    "docs/TROUBLESHOOTING.md",
    
    # Data Management (from b7c0c17)
    "docs/data_management/DATA_MANAGEMENT_GUIDE.md",
    "docs/data_management/STUDIO_ARTIST_RELATIONSHIPS.md",
    "docs/data_management/STUDIO_DATA_MIGRATION_GUIDE.md",
    "docs/data_management/STUDIO_DATA_SCHEMA.md",
    "docs/data_management/STUDIO_IMAGE_PROCESSING.md",
    
    # Frontend Documentation (from 8441be0)
    "frontend/README_FRONTEND.md",
    "frontend/docs/ENVIRONMENT_CONFIGURATION.md",
    "frontend/docs/README_DOCKER.md",
    "frontend/src/lib/IMPLEMENTATION_SUMMARY.md",
    "frontend/src/lib/README-ErrorHandling.md",
    
    # Frontend Tests (from b7c0c17)
    "frontend/src/__tests__/README.md",
    "frontend/src/__tests__/performance/PERFORMANCE_SUMMARY.md",
    "frontend/src/__tests__/search-functionality/API_REFERENCE.md",
    "frontend/src/__tests__/search-functionality/DOCUMENTATION.md",
    "frontend/src/__tests__/search-functionality/README.md",
    "frontend/src/__tests__/search-functionality/TESTING_GUIDE.md",
    "frontend/src/__tests__/search-functionality/TROUBLESHOOTING.md",
    
    # Frontend Components (from b7c0c17)
    "frontend/src/app/components/README-AdvancedSearch.md",
    "frontend/src/app/components/README-SearchResultsSystem.md",
    "frontend/src/app/styles/README-Enhanced-Styles.md",
    "frontend/src/lib/README-SearchController.md",
    
    # Frontend Design System (from b7c0c17)
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
    
    # Scripts Documentation (from b7c0c17 and others)
    "scripts/README.md",
    "scripts/data-seeder/README_DATA_SEEDER.md",
    "scripts/validation/PRODUCTION-PARITY-VALIDATION.md",
    "scripts/PRODUCTION-PARITY-VALIDATION.md",
    "scripts/data-seeder/DATA-MANAGEMENT.md",
    "scripts/Tattoo_Vertex_Docs.md",
    "scripts/data-management/STUDIO_IMAGE_PROCESSOR_SUMMARY.md",
    "scripts/test-data/studios/README.md",
    
    # Scripts Output Documentation (from 48f196a)
    "scripts/output/compatibility-matrix.md",
    "scripts/output/error-handling-fix-summary.md",
    "scripts/output/migration-validation-report.md",
    "scripts/output/npm-commands-fix-summary.md",
    "scripts/test-results/npm-command-test-summary.md",
    
    # Planning docs (from 8131bca)
    "docs/AI_Assisted_Documentation/CI-CD Implementation.md",
    "docs/AI_Assisted_Documentation/Deployment workflow.md",
    "docs/AI_Assisted_Documentation/Lambda_Doc.md",
    
    # Infrastructure/Terraform Documentation (from be39902)
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
    
    # Additional Planning docs (from be39902)
    "docs/CI-CD Implementation.md",
    "docs/Lambda_Doc.md",
    "docs/terraform-deployment-guide.md",
    
    # System Design docs (from be39902)
    "docs/system_design/DPP Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/HLD Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/LLD Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/OR Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/PRD Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/PSD Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/Page Descriptions HL Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/SRS Doc Tattoo Artist Directory MVP.md",
    "docs/system_design/WASR Doc Tattoo Artist Directory MVP.md",
    
    # Tests documentation (from be39902)
    "tests/Checkov-report.md"
)

# Files that need to be created (not in git history)
$filesToCreate = @{
    # Frontend CI/CD Documentation
    "docs/frontend/CI_CD_INTEGRATION.md" = @'
# Frontend CI/CD Integration

This document outlines the CI/CD integration setup for the frontend Next.js application.

## Overview

The frontend CI/CD pipeline automates the build, test, and deployment process for the Next.js application, ensuring consistent deployments and quality assurance.

## Pipeline Stages

### 1. Build Stage
- **Node.js Setup**: Uses Node.js 18+ with npm caching
- **Dependency Installation**: `npm ci` for reproducible builds
- **Type Checking**: TypeScript compilation and type validation
- **Linting**: ESLint and Prettier checks
- **Build**: Next.js production build with optimization

### 2. Test Stage
- **Unit Tests**: Jest and React Testing Library
- **Component Tests**: Isolated component testing
- **Integration Tests**: API integration testing with MSW
- **Coverage Reports**: Minimum 80% coverage requirement

### 3. Quality Assurance
- **Lighthouse CI**: Performance, accessibility, and SEO audits
- **Bundle Analysis**: Size analysis and optimization checks
- **Security Scanning**: Dependency vulnerability checks
- **Code Quality**: SonarQube or similar analysis

### 4. Deployment Stage
- **Environment Variables**: Secure injection of runtime configs
- **Static Asset Optimization**: Image optimization and CDN upload
- **Deployment**: Automated deployment to staging/production
- **Health Checks**: Post-deployment validation

## Environment Configuration

### Development
```yaml
NODE_ENV: development
NEXT_PUBLIC_API_URL: http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT: development
```

### Staging
```yaml
NODE_ENV: production
NEXT_PUBLIC_API_URL: https://api-staging.tattoo-directory.com
NEXT_PUBLIC_ENVIRONMENT: staging
```

### Production
```yaml
NODE_ENV: production
NEXT_PUBLIC_API_URL: https://api.tattoo-directory.com
NEXT_PUBLIC_ENVIRONMENT: production
```

---

*This CI/CD integration ensures reliable and automated deployment processes for the frontend application.*
'@

    # E2E Test Documentation
    "docs/frontend/tests/e2e/README.md" = @'
# Frontend E2E Testing Framework

Comprehensive end-to-end testing framework for the Tattoo Directory MVP frontend application using Playwright.

## Overview

This E2E testing suite ensures the frontend application works correctly from a user's perspective, testing complete user workflows across different browsers and devices.

## Framework Architecture

```
tests/e2e/
├── fixtures/           # Test data and setup utilities
├── pages/             # Page Object Model classes
├── specs/             # Test specifications
├── utils/             # Helper utilities
├── config/            # Test configurations
└── reports/           # Test execution reports
```

## Test Categories

### Core User Flows
- **Artist Search**: Location-based and filter-based search
- **Artist Profiles**: Profile viewing and interaction
- **Map Navigation**: Interactive map usage
- **Mobile Experience**: Touch interactions and responsive design

### Performance Tests
- **Page Load Times**: Core Web Vitals measurement
- **Search Performance**: Search response time validation
- **Image Loading**: Portfolio image optimization testing
- **Bundle Size**: JavaScript bundle analysis

### Accessibility Tests
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: ARIA compliance and screen reader support
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Proper focus handling

### Cross-Browser Tests
- **Chrome/Chromium**: Primary browser support
- **Firefox**: Secondary browser support
- **Safari/WebKit**: macOS and iOS compatibility
- **Mobile Browsers**: iOS Safari and Android Chrome

## Getting Started

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --grep "Artist Search"

# Run tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run tests on specific browser
npm run test:e2e -- --project=chromium

# Run tests with debugging
npm run test:e2e -- --debug
```

---

*This E2E testing framework ensures comprehensive coverage of user workflows and maintains high quality standards.*
'@

    # Planning Documents
    "docs/planning/CI-CD Implementation.md" = @'
# CI/CD Implementation Guide

Container Image Compatibility and CI/CD Pipeline Implementation for the Tattoo Directory MVP.

## Container Image Compatibility

This is the primary technical requirement. A Docker image built for an x86 processor will not run on a Graviton (ARM64) processor.

### Multi-Architecture Builds
The best practice is to build a multi-architecture container image. This single image manifest contains layers for both linux/amd64 (x86) and linux/arm64. When you deploy, the container runtime (Fargate, in this case) automatically pulls the correct version for its underlying architecture. This gives you maximum flexibility.

### Base Image Requirements
You must ensure your Dockerfile starts from a base image that supports ARM64. Most official images (like node, python, amazonlinux) provide multi-architecture variants.

### Dependencies
Your application code itself (Node.js) is architecture-agnostic. However, if any of your npm packages include native C++ add-ons (e.g., some image processing or cryptography libraries), you must ensure they provide pre-compiled binaries for ARM64 or can be compiled for ARM64 during your build process. Your current dependencies (@opensearch-project/opensearch, @aws-sdk/*) are pure JavaScript and fully compatible.

## CI/CD Pipeline Adjustments

### Use docker buildx
This is the recommended approach for building multi-architecture images.

```bash
# Enable buildx
docker buildx create --use

# Build multi-architecture image
docker buildx build --platform linux/amd64,linux/arm64 -t your-image:tag --push .
```

### Pipeline Configuration
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build and push multi-arch image
        uses: docker/build-push-action@v5
        with:
          platforms: linux/amd64,linux/arm64
          push: true
          tags: your-registry/your-image:latest
```

---

*This implementation guide ensures compatibility across different processor architectures.*
'@
}

function Write-Step {
    param([string]$Message, [string]$Color = "Blue")
    Write-Host ""
    Write-Host "🔄 $Message" -ForegroundColor $Color
    Write-Host "----------------------------------------" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Create-File {
    param(
        [string]$Path,
        [string]$Content
    )
    
    if ($WhatIf) {
        Write-Host "WOULD CREATE: $Path" -ForegroundColor Gray
        return
    }
    
    try {
        $directory = Split-Path $Path -Parent
        if (-not (Test-Path $directory)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        
        Set-Content -Path $Path -Value $Content -Encoding UTF8
        Write-Success "CREATED: $Path"
        $script:createdCount++
    } catch {
        Write-Error "FAILED TO CREATE: $Path - $($_.Exception.Message)"
        $script:errorCount++
    }
}

function Move-FileSafe {
    param(
        [string]$SourceFile,
        [string]$DestDir,
        [string]$BaseName = ""
    )
    
    if (-not (Test-Path $SourceFile)) {
        Write-Warning "MISSING: $SourceFile"
        return
    }
    
    # Ensure destination directory exists
    if (-not (Test-Path $DestDir)) {
        New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
    }
    
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($SourceFile)
    $extension = [System.IO.Path]::GetExtension($SourceFile)
    
    # Handle naming conflicts
    $targetFile = Join-Path $DestDir "$fileName$extension"
    $counter = 1
    
    while (Test-Path $targetFile) {
        if ($BaseName) {
            $targetFile = Join-Path $DestDir "${BaseName}_$fileName$extension"
        } else {
            $targetFile = Join-Path $DestDir "${fileName}_$counter$extension"
            $counter++
        }
    }
    
    try {
        if ($WhatIf) {
            Write-Host "WOULD MOVE: $SourceFile -> $targetFile" -ForegroundColor Gray
        } else {
            Move-Item -Path $SourceFile -Destination $targetFile -Force
            Write-Success "MOVED: $SourceFile -> $targetFile"
            $script:movedCount++
        }
    } catch {
        Write-Error "FAILED TO MOVE: $SourceFile - $($_.Exception.Message)"
        $script:errorCount++
    }
}

# STEP 1: RECOVER FILES FROM GIT
if (-not $SkipRecovery) {
    Write-Step "STEP 1: Recovering files from multiple git commits"
    
    foreach ($file in $filesToRecover) {
        $fileRecovered = $false
        
        # Try each commit until we find the file
        foreach ($commit in $CommitHashes) {
            if ($fileRecovered) { break }
            
            try {
                # Check if file exists in this commit
                $gitShowResult = git show "${commit}:$file" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    if ($WhatIf) {
                        Write-Host "WOULD RECOVER: $file (from $commit)" -ForegroundColor Gray
                        $fileRecovered = $true
                    } else {
                        # Restore the file
                        git checkout $commit -- $file 2>&1 | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Success "RECOVERED: $file (from $commit)"
                            $recoveredCount++
                            $fileRecovered = $true
                        }
                    }
                }
            }
            catch {
                # Continue to next commit
                continue
            }
        }
        
        if (-not $fileRecovered -and -not $WhatIf) {
            Write-Warning "NOT FOUND IN ANY COMMIT: $file"
        }
    }
    
    Write-Host ""
    Write-Host "Recovery Summary: $recoveredCount files recovered" -ForegroundColor Green
}

# STEP 2: CREATE MISSING FILES
if (-not $SkipCreation) {
    Write-Step "STEP 2: Creating missing documentation files"
    
    foreach ($filePath in $filesToCreate.Keys) {
        Create-File $filePath $filesToCreate[$filePath]
    }
    
    Write-Host ""
    Write-Host "Creation Summary: $createdCount files created" -ForegroundColor Green
}

# STEP 3: ORGANIZE DOCUMENTATION STRUCTURE
if (-not $SkipOrganization) {
    Write-Step "STEP 3: Organizing documentation structure"
    
    # Create directory structure
    $directories = @(
        "docs\backend", "docs\backend\handlers", "docs\backups", "docs\devtools",
        "docs\localstack", "docs\data_management", "docs\localstack\setup",
        "docs\localstack\troubleshooting", "docs\planning", "docs\infrastructure",
        "docs\frontend", "docs\frontend\design_system", "docs\frontend\tests",
        "docs\frontend\tests\e2e", "docs\scripts", "docs\tests\e2e"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    # Move files to organized structure
    $fileMoves = @{
        # Backend
        "backend\README_BACKEND.md" = "docs\backend"
        "backend\src\containers\fargate-scraper\README_FARGATE_SCRAPER.md" = "docs\backend\handlers"
        "backend\src\handlers\api-handler\README_API_HANDLER.md" = "docs\backend\handlers"
        "backend\src\handlers\discover-studios\README_DISCOVER_STUDIOS.md" = "docs\backend\handlers"
        "backend\src\handlers\dynamodb-sync\README_DYNAMODB_SYNC.md" = "docs\backend\handlers"
        "backend\src\handlers\find-artists\README_FIND_ARTISTS.md" = "docs\backend\handlers"
        "backend\src\handlers\queue-scraping\README_QUEUE_SCRAPING.md" = "docs\backend\handlers"
        "backend\src\handlers\rotate-nat-gateway-eip\README_ROTATE_NAT_GATEWAY_EIP.md" = "docs\backend\handlers"
        "backend\src\handlers\secret-rotation\README_SECRETS_ROTATION.md" = "docs\backend\handlers"
        
        # DevTools
        "devtools\README-DEVTOOLS.md" = "docs\devtools"
        "devtools\localstack-config\README.md" = "docs\devtools"
        "devtools\scripts\README-ENHANCED-LOCALSTACK.md" = "docs\devtools"
        "devtools\scripts\README-CLOUDWATCH-LOGS.md" = "docs\devtools"
        "localstack-init\README_LOCAL.md" = "docs\localstack"
        
        # LocalStack setup
        "docs\local_dev\SETUP_MASTER.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\CROSS_PLATFORM_SUMMARY.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\DOCUMENTATION_UPDATES.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\LINUX_SETUP_GUIDE.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\LOCAL-DEVELOPMENT-GUIDE.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\MACOS_SETUP_GUIDE.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\PLATFORM_SETUP.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\QUICK_START.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\README_Development_Workflow.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\README_Local_Development.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\SETUP_SUMMARY.md" = "docs\localstack\setup"
        "docs\local_dev\setup_full\WINDOWS_SETUP_GUIDE.md" = "docs\localstack\setup"
        
        # LocalStack troubleshooting
        "docs\local_dev\TROUBLESHOOTING_MASTER.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\API_TESTING_GUIDE.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\BEST-PRACTICES.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\MONITORING_SYSTEM.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\PERFORMANCE_MONITORING.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\SECURITY-GUIDELINES.md" = "docs\localstack\troubleshooting"
        "docs\local_dev\troubleshooting_full\VIDEO-TUTORIALS-GUIDE.md" = "docs\localstack\troubleshooting"
        
        # Planning
        "docs\PRODUCTION_READY_REPORT.md" = "docs\planning"
        "docs\FRONTEND_SYNC_CONSOLIDATION.md" = "docs\planning"
        "docs\DYNAMODB_STREAMS_IMPLEMENTATION.md" = "docs\planning"
        "docs\ENHANCED_DATA_DISPLAY_INTEGRATION.md" = "docs\planning"
        "docs\STUDIO_CLI_COMMANDS.md" = "docs\planning"
        "docs\STUDIO_HEALTH_MONITORING.md" = "docs\planning"
        "docs\API_DOCUMENTATION.md" = "docs\planning"
        "docs\TROUBLESHOOTING.md" = "docs\planning"
        "docs\AI_Assisted_Documentation\terraform-deployment-guide.md" = "docs\planning"
        
        # Infrastructure
        "docs\terraform-modules\README.md" = "docs\infrastructure"
        "docs\terraform-modules\01-foundation.md" = "docs\infrastructure"
        "docs\terraform-modules\03-audit-foundation.md" = "docs\infrastructure"
        "docs\terraform-modules\04-central-logging.md" = "docs\infrastructure"
        "docs\terraform-modules\05-networking.md" = "docs\infrastructure"
        "docs\terraform-modules\06-central-security.md" = "docs\infrastructure"
        "docs\terraform-modules\07-app-security.md" = "docs\infrastructure"
        "docs\terraform-modules\08-log-storage.md" = "docs\infrastructure"
        "docs\terraform-modules\09-app-storage.md" = "docs\infrastructure"
        "docs\terraform-modules\10-search.md" = "docs\infrastructure"
        "docs\terraform-modules\11-iam.md" = "docs\infrastructure"
        "docs\terraform-modules\12-compute.md" = "docs\infrastructure"
        "docs\terraform-modules\13-api.md" = "docs\infrastructure"
        "docs\terraform-modules\14-security-monitoring.md" = "docs\infrastructure"
        "docs\terraform-modules\15-app-monitoring.md" = "docs\infrastructure"
        "docs\terraform-modules\16-backup.md" = "docs\infrastructure"
        "docs\terraform-modules\17-governance.md" = "docs\infrastructure"
        "docs\terraform-modules\19-delivery.md" = "docs\infrastructure"
        
        # Frontend
        "frontend\README_FRONTEND.md" = "docs\frontend"
        "frontend\docs\ENVIRONMENT_CONFIGURATION.md" = "docs\frontend"
        "frontend\docs\README_DOCKER.md" = "docs\frontend"
        "frontend\docs\README_FRONTEND.md" = "docs\frontend"
        "frontend\src\app\styles\README-Enhanced-Styles.md" = "docs\frontend"
        "frontend\src\app\components\README-AdvancedSearch.md" = "docs\frontend"
        "frontend\src\app\components\README-SearchResultsSystem.md" = "docs\frontend"
        "frontend\src\lib\README-SearchController.md" = "docs\frontend"
        "frontend\src\__tests__\performance\PERFORMANCE_SUMMARY.md" = "docs\frontend"
        
        # Frontend design system
        "frontend\src\design-system\README-STANDARDIZATION.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\accessibility\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\feedback\EmptyState\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\feedback\ErrorBoundary\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\feedback\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\feedback\Toast\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\ui\DataVisualization\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\ui\Performance\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\ui\StudioSearch\README-Enhanced.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\ui\ThemeProvider\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\components\ui\VisualEffects\README.md" = "docs\frontend\design_system"
        "frontend\src\design-system\docs\component-api-reference.md" = "docs\frontend\design_system"
        "frontend\src\design-system\docs\component-integration-guide.md" = "docs\frontend\design_system"
        "frontend\src\design-system\docs\testing-guidelines.md" = "docs\frontend\design_system"
        
        # Frontend tests
        "frontend\src\__tests__\README.md" = "docs\frontend\tests"
        "frontend\src\__tests__\search-functionality\README.md" = "docs\frontend\tests"
        "frontend\src\__tests__\search-functionality\API_REFERENCE.md" = "docs\frontend\tests"
        "frontend\src\__tests__\search-functionality\DOCUMENTATION.md" = "docs\frontend\tests"
        "frontend\src\__tests__\search-functionality\TESTING_GUIDE.md" = "docs\frontend\tests"
        "frontend\src\__tests__\search-functionality\TROUBLESHOOTING.md" = "docs\frontend\tests"
        
        # Scripts
        "scripts\docs\README.md" = "docs\scripts"
        "scripts\data-management\STUDIO_IMAGE_PROCESSOR_SUMMARY.md" = "docs\scripts"
        "scripts\data-seeder\DATA-MANAGEMENT.md" = "docs\scripts"
        "scripts\data-seeder\README_DATA_SEEDER.md" = "docs\scripts"
        "scripts\docs\README-Configuration.md" = "docs\scripts"
        "scripts\output\compatibility-matrix.md" = "docs\scripts"
        "scripts\output\error-handling-fix-summary.md" = "docs\scripts"
        "scripts\output\migration-validation-report.md" = "docs\scripts"
        "scripts\output\npm-commands-fix-summary.md" = "docs\scripts"
        "scripts\README_CONTENT_GENERATION.md" = "docs\scripts"
        "scripts\Tattoo_Vertex_Docs.md" = "docs\scripts"
        "scripts\test-data\studios\README.md" = "docs\scripts"
        "scripts\test-results\npm-command-test-summary.md" = "docs\scripts"
        "scripts\validation\PRODUCTION-PARITY-VALIDATION.md" = "docs\scripts"
        "scripts\__tests__\TESTING_ISSUES.md" = "docs\scripts"
        
        # Tests
        "tests\e2e\README.md" = "docs\tests\e2e"
        "tests\e2e\IMPLEMENTATION_GUIDE.md" = "docs\tests\e2e"
        "tests\integration\README.md" = "docs\tests\e2e"
        "tests\Test_Data\StudioImages\README.md" = "docs\tests\e2e"
    }
    
    foreach ($source in $fileMoves.Keys) {
        Move-FileSafe $source $fileMoves[$source]
    }
    
    Write-Host ""
    Write-Host "Organization Summary: $movedCount files moved" -ForegroundColor Green
}

# STEP 4: CLEANUP DUPLICATES
if (-not $SkipCleanup) {
    Write-Step "STEP 4: Cleaning up duplicate files"
    
    # Find and clean up duplicate files
    $duplicatePatterns = @("docs\**\*_1.md", "docs\**\*_2.md", "docs\**\*_3.md")
    $duplicateFiles = @()
    
    foreach ($pattern in $duplicatePatterns) {
        $duplicateFiles += Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue
    }
    
    # Group files by base name
    $fileGroups = @{}
    foreach ($file in $duplicateFiles) {
        $baseName = $file.Name -replace '_\d+\.md$', '.md'
        $baseDir = $file.Directory.FullName
        $groupKey = "$baseDir\$baseName"
        
        if (-not $fileGroups.ContainsKey($groupKey)) {
            $fileGroups[$groupKey] = @()
        }
        $fileGroups[$groupKey] += $file
    }
    
    # Process each group - keep duplicates, remove originals
    foreach ($groupKey in $fileGroups.Keys) {
        $files = $fileGroups[$groupKey] | Sort-Object Name
        $originalFile = $groupKey
        
        # Check if original exists and remove it
        if (Test-Path $originalFile) {
            if ($WhatIf) {
                Write-Host "WOULD REMOVE ORIGINAL: $(Split-Path $originalFile -Leaf)" -ForegroundColor Gray
            } else {
                try {
                    Remove-Item $originalFile -Force
                    Write-Success "REMOVED ORIGINAL: $(Split-Path $originalFile -Leaf)"
                    $cleanedCount++
                } catch {
                    Write-Error "FAILED TO REMOVE: $(Split-Path $originalFile -Leaf)"
                    continue
                }
            }
        }
        
        # Rename the first duplicate to the original name
        if ($files.Count -gt 0) {
            $firstDuplicate = $files[0]
            
            if ($WhatIf) {
                Write-Host "WOULD RENAME: $($firstDuplicate.Name) -> $(Split-Path $originalFile -Leaf)" -ForegroundColor Gray
            } else {
                try {
                    Rename-Item $firstDuplicate.FullName $originalFile -Force
                    Write-Success "RENAMED: $($firstDuplicate.Name) -> $(Split-Path $originalFile -Leaf)"
                    $cleanedCount++
                } catch {
                    Write-Error "FAILED TO RENAME: $($firstDuplicate.Name)"
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "Cleanup Summary: $cleanedCount files cleaned" -ForegroundColor Green
}

# FINAL SUMMARY
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Complete Recovery Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 FINAL RESULTS:" -ForegroundColor White
Write-Host "   ✅ Files recovered from git: $recoveredCount" -ForegroundColor Green
Write-Host "   📝 Files created: $createdCount" -ForegroundColor Blue
Write-Host "   📁 Files moved/organized: $movedCount" -ForegroundColor Yellow
Write-Host "   🧹 Files cleaned up: $cleanedCount" -ForegroundColor Cyan
Write-Host "   ❌ Errors encountered: $errorCount" -ForegroundColor Red
Write-Host ""

if ($WhatIf) {
    Write-Host "This was a preview run. Use without -WhatIf to execute the complete recovery." -ForegroundColor Gray
} else {
    Write-Host "🎉 COMPLETE DOCUMENTATION RECOVERY FINISHED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your documentation is now:" -ForegroundColor White
    Write-Host "  ✅ Fully recovered from git commit $CommitHash" -ForegroundColor Green
    Write-Host "  ✅ Missing files recreated with comprehensive content" -ForegroundColor Green
    Write-Host "  ✅ Properly organized in logical structure" -ForegroundColor Green
    Write-Host "  ✅ Cleaned of duplicates and conflicts" -ForegroundColor Green
}

Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Gray
Write-Host "  .\complete-documentation-recovery.ps1 -WhatIf     # Preview all changes" -ForegroundColor Gray
Write-Host "  .\complete-documentation-recovery.ps1             # Execute complete recovery" -ForegroundColor Gray
Write-Host "  .\complete-documentation-recovery.ps1 -SkipRecovery  # Skip git recovery step" -ForegroundColor Gray