# Interactive Documentation Pipeline

The documentation pipeline has been enhanced with interactive stage selection, allowing you to run only the stages you need.

## Quick Start

### Interactive Mode (Recommended)
```bash
# From project root
npm run docs:pipeline

# Or from scripts/documentation-analysis
npm run pipeline
```

### Run All Stages
```bash
# From project root
npm run docs:pipeline -- --all

# Or from scripts/documentation-analysis
npm run pipeline:all
```

### Run Specific Stages
```bash
# Run stages 1, 3, and 5 only
npm run docs:pipeline -- --stages=1,3,5

# Or use convenient shortcuts
npm run pipeline:foundation  # Stage 1 only
npm run pipeline:consolidate # Stage 3 only  
npm run pipeline:validate    # Stage 5 only
npm run pipeline:quick       # Stages 1,3,5 (common workflow)
```

### Preview Mode (Dry Run)
```bash
# Interactive preview
npm run docs:pipeline -- --dry-run

# Preview all stages
npm run docs:pipeline -- --all --dry-run

# Preview specific stages
npm run docs:pipeline -- --stages=2,4 --dry-run
```

## Available Stages

### 1. Foundation Setup
**What it does:** Creates foundation files and runs initial analysis
- Generates foundation documentation files from templates
- Runs initial gap analysis to identify missing content

**When to use:** Starting fresh or after major changes to project structure

### 2. Legacy Migration & Cleanup
**What it does:** Migrates legacy content and fixes outdated references
- Migrates legacy commands and documentation
- Cross-references commands for consistency
- Fixes outdated content references
- Cleans up old documentation files

**When to use:** After restructuring or when dealing with legacy content

### 3. Main Consolidation
**What it does:** Runs the core consolidation engine to merge documentation
- Merges duplicate documentation files
- Resolves content conflicts
- Creates consolidated documentation structure

**When to use:** Core consolidation process - usually needed

### 4. Post-Consolidation Enhancement
**What it does:** Creates missing docs, maps files, and handles duplicates
- Creates missing documentation files
- Generates file mapping analysis
- Consolidates remaining duplicate files
- Deletes confirmed duplicates

**When to use:** After main consolidation to clean up and enhance

### 5. Final Validation
**What it does:** Validates all documentation and generates health reports
- Validates all consolidated documentation
- Runs comprehensive validation checks
- Generates final health summary report

**When to use:** Always run at the end to ensure quality

## Platform-Specific Scripts

### Windows Users

#### Command Prompt
```cmd
scripts\documentation-analysis\scripts\run-complete-pipeline.bat
```

#### PowerShell
```powershell
.\scripts\documentation-analysis\scripts\run-complete-pipeline.ps1
.\scripts\documentation-analysis\scripts\run-complete-pipeline.ps1 -All
.\scripts\documentation-analysis\scripts\run-complete-pipeline.ps1 -DryRun
```

### Linux/macOS Users
```bash
./scripts/documentation-analysis/scripts/run-complete-pipeline.js
```

## Common Usage Patterns

### First Time Setup
Run all stages in order:
```bash
npm run docs:pipeline -- --all
```

### Fixing Specific Issues
Multiple ways to run only relevant stages:

**Interactive Mode:**
1. Start interactive mode: `npm run docs:pipeline`
2. Select only the stages you need with y/n prompts
3. Review results and re-run if needed

**Command Line Selection:**
```bash
# Run only foundation and validation
npm run docs:pipeline -- --stages=1,5

# Use shortcuts for common patterns
npm run pipeline:foundation  # Just setup
npm run pipeline:consolidate # Just consolidation
npm run pipeline:quick       # Foundation + Consolidation + Validation
```

### Regular Maintenance
Typical maintenance run:
1. Foundation Setup (if structure changed)
2. Main Consolidation
3. Final Validation

### Preview Changes
Always preview first with dry-run:
```bash
npm run docs:pipeline -- --dry-run
```

## Troubleshooting

### Stage Failures
- Pipeline continues even if individual steps fail
- Check error messages for specific issues
- Re-run individual stages as needed

### Interactive Mode Issues
- Ensure terminal supports interactive input (TTY)
- Use `--all` flag if interactive mode doesn't work
- Use `--stages=1,2,3` for non-interactive stage selection
- Piped input automatically falls back to all stages
- Check Node.js version compatibility

### Windows-Specific Issues
- Use PowerShell for better Unicode support
- Ensure execution policy allows script execution
- Use batch file for simple command prompt usage

## Output and Reports

After running the pipeline, check these locations:
- `docs/consolidated/` - Consolidated documentation
- `scripts/documentation-analysis/reports/` - Analysis reports
- Console output - Execution summary and next steps

## Integration with npm Scripts

The pipeline integrates with the existing npm script ecosystem:

```json
{
  "scripts": {
    "docs:pipeline": "cd scripts/documentation-analysis && npm run pipeline",
    "docs:pipeline:all": "cd scripts/documentation-analysis && npm run pipeline:all",
    "docs:pipeline:dry": "cd scripts/documentation-analysis && npm run pipeline:dry-run"
  }
}
```

This allows running from the project root while maintaining the modular structure.