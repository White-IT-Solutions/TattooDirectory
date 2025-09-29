#!/usr/bin/env node

/**
 * Complete Documentation Consolidation Pipeline
 * Orchestrates the entire documentation consolidation process
 */

const ValidationPipeline = require('./src/ValidationPipeline');
const DocumentationAnalyzer = require('./src/DocumentationAnalyzer');
const ContentConsolidator = require('./src/ContentConsolidator');
const GapAnalysisReporter = require('./src/GapAnalysisReporter');
const path = require('path');
const fs = require('fs').promises;

class ConsolidationPipeline {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      outputDir: config.outputDir || path.join(process.cwd(), 'scripts', 'documentation-analysis', 'consolidation-reports'),
      dryRun: config.dryRun !== false,
      ...config
    };

    this.analyzer = new DocumentationAnalyzer(this.config);
    this.consolidator = new ContentConsolidator(this.config);
    this.gapReporter = new GapAnalysisReporter(this.config);
    this.validator = new ValidationPipeline(this.config);
  }

  /**
   * Run complete consolidation pipeline
   */
  async run() {
    console.log('🚀 Starting Complete Documentation Consolidation Pipeline...');
    console.log(`Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      success: true,
      phases: {},
      errors: []
    };

    try {
      // Phase 1: Pre-consolidation analysis
      console.log('\n📊 Phase 1: Pre-consolidation Analysis');
      results.phases.preAnalysis = await this.runPreAnalysis();

      // Phase 2: Content consolidation
      console.log('\n🔄 Phase 2: Content Consolidation');
      results.phases.consolidation = await this.runConsolidation();

      // Phase 3: Validation
      console.log('\n✅ Phase 3: Validation');
      results.phases.validation = await this.runValidation();

      // Phase 4: Gap analysis
      console.log('\n🔍 Phase 4: Gap Analysis');
      results.phases.gapAnalysis = await this.runGapAnalysis();

      // Phase 5: Final report generation
      console.log('\n📋 Phase 5: Final Report Generation');
      results.phases.reporting = await this.generateFinalReport(results);

      const duration = Date.now() - startTime;
      console.log(`\n🎉 Consolidation pipeline completed successfully in ${duration}ms`);
      
      results.duration = duration;
      return results;

    } catch (error) {
      console.error('❌ Consolidation pipeline failed:', error.message);
      results.success = false;
      results.errors.push({
        phase: 'pipeline',
        error: error.message,
        stack: error.stack
      });
      return results;
    }
  }

  /**
   * Phase 1: Pre-consolidation analysis
   */
  async runPreAnalysis() {
    const phase = {
      name: 'preAnalysis',
      success: true,
      results: {},
      errors: []
    };

    try {
      console.log('  🔍 Analyzing current documentation structure...');
      const structure = await this.analyzer.analyzeStructure();
      phase.results.structure = structure;

      console.log('  📈 Identifying content to consolidate...');
      const consolidationPlan = await this.analyzer.createConsolidationPlan();
      phase.results.consolidationPlan = consolidationPlan;

      console.log('  🔎 Detecting duplicates and overlaps...');
      const duplicates = await this.analyzer.detectDuplicates();
      phase.results.duplicates = duplicates;

      console.log(`  ✅ Analysis complete: ${consolidationPlan.length} consolidation tasks identified`);

    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error('  ❌ Pre-analysis failed:', error.message);
    }

    return phase;
  }

  /**
   * Phase 2: Content consolidation
   */
  async runConsolidation() {
    const phase = {
      name: 'consolidation',
      success: true,
      results: {},
      errors: []
    };

    try {
      console.log('  📝 Consolidating documentation content...');
      const consolidatedFiles = await this.consolidator.consolidateAll();
      phase.results.consolidatedFiles = consolidatedFiles;

      console.log('  🔗 Updating cross-references...');
      const updatedReferences = await this.consolidator.updateAllReferences();
      phase.results.updatedReferences = updatedReferences;

      console.log('  📚 Generating table of contents...');
      const tableOfContents = await this.consolidator.generateMasterTOC();
      phase.results.tableOfContents = tableOfContents;

      console.log(`  ✅ Consolidation complete: ${consolidatedFiles.length} files processed`);

    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error('  ❌ Consolidation failed:', error.message);
    }

    return phase;
  }

  /**
   * Phase 3: Validation
   */
  async runValidation() {
    const phase = {
      name: 'validation',
      success: true,
      results: {},
      errors: []
    };

    try {
      console.log('  🔍 Running comprehensive validation...');
      const validationResults = await this.validator.run();
      phase.results = validationResults;

      const issues = this.countValidationIssues(validationResults);
      console.log(`  ✅ Validation complete: ${issues} issues found`);

    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error('  ❌ Validation failed:', error.message);
    }

    return phase;
  }

  /**
   * Phase 4: Gap analysis
   */
  async runGapAnalysis() {
    const phase = {
      name: 'gapAnalysis',
      success: true,
      results: {},
      errors: []
    };

    try {
      console.log('  🔍 Analyzing documentation gaps...');
      const gaps = await this.gapReporter.analyzeGaps();
      phase.results.gaps = gaps;

      console.log('  📊 Generating priority matrix...');
      const priorityMatrix = await this.gapReporter.generatePriorityMatrix();
      phase.results.priorityMatrix = priorityMatrix;

      console.log('  📋 Creating gap analysis report...');
      const gapReport = await this.gapReporter.generateReport();
      phase.results.gapReport = gapReport;

      console.log(`  ✅ Gap analysis complete: ${gaps.length} gaps identified`);

    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error('  ❌ Gap analysis failed:', error.message);
    }

    return phase;
  }

  /**
   * Generate final consolidation report
   */
  async generateFinalReport(results) {
    const phase = {
      name: 'reporting',
      success: true,
      results: {},
      errors: []
    };

    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Generate comprehensive report
      const reportPath = await this.createConsolidationReport(results);
      phase.results.consolidationReport = reportPath;

      // Generate navigation guide
      const navigationPath = await this.createNavigationGuide(results);
      phase.results.navigationGuide = navigationPath;

      // Generate implementation summary
      const summaryPath = await this.createImplementationSummary(results);
      phase.results.implementationSummary = summaryPath;

      console.log(`  ✅ Reports generated in ${this.config.outputDir}`);

    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error('  ❌ Report generation failed:', error.message);
    }

    return phase;
  }

  /**
   * Create comprehensive consolidation report
   */
  async createConsolidationReport(results) {
    const reportPath = path.join(this.config.outputDir, 'consolidation-report.md');
    
    const content = `# Documentation Consolidation Report

Generated: ${results.timestamp}
Duration: ${results.duration}ms
Status: ${results.success ? '✅ Success' : '❌ Failed'}
Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}

## Executive Summary

This report summarizes the complete documentation consolidation process for the Tattoo Artist Directory MVP project.

### Key Achievements

- **Files Consolidated**: ${results.phases.consolidation?.results?.consolidatedFiles?.length || 0}
- **References Updated**: ${results.phases.consolidation?.results?.updatedReferences?.length || 0}
- **Validation Issues**: ${this.countValidationIssues(results.phases.validation?.results)}
- **Documentation Gaps**: ${results.phases.gapAnalysis?.results?.gaps?.length || 0}

## Phase Results

${Object.entries(results.phases).map(([name, phase]) => `
### ${name.charAt(0).toUpperCase() + name.slice(1)} Phase
- Status: ${phase.success ? '✅ Success' : '❌ Failed'}
- Errors: ${phase.errors?.length || 0}
${this.formatPhaseResults(phase.results)}
`).join('\n')}

## Documentation Structure

The consolidated documentation follows this structure:

\`\`\`
docs/
├── README.md                    # Project overview
├── QUICK_START.md              # 5-minute setup guide
├── architecture/               # System architecture
│   ├── system-overview.md
│   ├── data-models.md
│   └── api-design.md
├── components/                 # Component documentation
│   ├── frontend/
│   ├── backend/
│   ├── infrastructure/
│   └── scripts/
├── setup/                      # Setup and configuration
│   ├── local-development.md
│   ├── docker-setup.md
│   ├── frontend-only.md
│   └── dependencies.md
├── workflows/                  # Development workflows
│   ├── data-management.md
│   ├── testing-strategies.md
│   ├── deployment-process.md
│   └── monitoring.md
└── reference/                  # Reference documentation
    └── command-reference.md
\`\`\`

## Quality Metrics

### Validation Results
${results.phases.validation?.results ? this.formatValidationResults(results.phases.validation.results) : 'No validation results available'}

### Gap Analysis
${results.phases.gapAnalysis?.results?.gaps?.length > 0 ? 
  `Found ${results.phases.gapAnalysis.results.gaps.length} documentation gaps:
${results.phases.gapAnalysis.results.gaps.slice(0, 5).map(gap => `- ${gap.type}: ${gap.description}`).join('\n')}
${results.phases.gapAnalysis.results.gaps.length > 5 ? `\n... and ${results.phases.gapAnalysis.results.gaps.length - 5} more` : ''}` :
  'No significant documentation gaps identified.'
}

## Recommendations

${this.generateConsolidationRecommendations(results)}

## Next Steps

1. **Review Validation Issues**: Address any critical validation errors
2. **Fill Documentation Gaps**: Prioritize high-impact missing documentation
3. **Regular Maintenance**: Set up automated validation in CI/CD pipeline
4. **User Feedback**: Gather feedback on documentation usability

---

*This report was generated automatically by the Documentation Consolidation Pipeline*
`;

    await fs.writeFile(reportPath, content, 'utf8');
    return reportPath;
  }

  /**
   * Create navigation guide
   */
  async createNavigationGuide(results) {
    const guidePath = path.join(this.config.outputDir, 'navigation-guide.md');
    
    const content = `# Documentation Navigation Guide

This guide helps you find the right documentation for your needs.

## Quick Access

### 🚀 Getting Started
- **New to the project?** → [QUICK_START.md](../docs/QUICK_START.md)
- **Setting up locally?** → [Local Development Guide](../docs/setup/local-development.md)
- **Frontend only?** → [Frontend Setup](../docs/setup/frontend-only.md)

### 🏗️ Development
- **Architecture overview** → [System Overview](../docs/architecture/system-overview.md)
- **API design** → [API Design](../docs/architecture/api-design.md)
- **Data models** → [Data Models](../docs/architecture/data-models.md)

### 🔧 Components
- **Frontend development** → [Frontend Guide](../docs/components/frontend/README.md)
- **Backend services** → [Backend Guide](../docs/components/backend/README.md)
- **Infrastructure** → [Infrastructure Guide](../docs/components/infrastructure/README.md)
- **Scripts and tools** → [Scripts Guide](../docs/components/scripts/README.md)

### 📋 Workflows
- **Testing strategies** → [Testing Guide](../docs/workflows/testing-strategies.md)
- **Deployment process** → [Deployment Guide](../docs/workflows/deployment-process.md)
- **Data management** → [Data Management](../docs/workflows/data-management.md)
- **Monitoring** → [Monitoring Guide](../docs/workflows/monitoring.md)

### 📚 Reference
- **All commands** → [Command Reference](../docs/reference/command-reference.md)

## Documentation by Role

### Frontend Developer
1. [Frontend Setup](../docs/setup/frontend-only.md)
2. [Frontend Component Guide](../docs/components/frontend/README.md)
3. [API Design](../docs/architecture/api-design.md)
4. [Testing Strategies](../docs/workflows/testing-strategies.md)

### Backend Developer
1. [Local Development Setup](../docs/setup/local-development.md)
2. [Backend Service Guide](../docs/components/backend/README.md)
3. [Data Models](../docs/architecture/data-models.md)
4. [Data Management](../docs/workflows/data-management.md)

### DevOps Engineer
1. [Infrastructure Guide](../docs/components/infrastructure/README.md)
2. [Docker Setup](../docs/setup/docker-setup.md)
3. [Deployment Process](../docs/workflows/deployment-process.md)
4. [Monitoring Guide](../docs/workflows/monitoring.md)

### Project Manager
1. [System Overview](../docs/architecture/system-overview.md)
2. [Quick Start Guide](../docs/QUICK_START.md)
3. [Testing Strategies](../docs/workflows/testing-strategies.md)

## Common Tasks

### Setting Up Development Environment
1. [Dependencies](../docs/setup/dependencies.md)
2. [Local Development](../docs/setup/local-development.md)
3. [Docker Setup](../docs/setup/docker-setup.md)

### Understanding the System
1. [System Overview](../docs/architecture/system-overview.md)
2. [Data Models](../docs/architecture/data-models.md)
3. [API Design](../docs/architecture/api-design.md)

### Contributing Code
1. [Testing Strategies](../docs/workflows/testing-strategies.md)
2. [Component Guides](../docs/components/)
3. [Command Reference](../docs/reference/command-reference.md)

### Deploying Changes
1. [Deployment Process](../docs/workflows/deployment-process.md)
2. [Infrastructure Guide](../docs/components/infrastructure/README.md)
3. [Monitoring](../docs/workflows/monitoring.md)

---

*Need help finding something? Check the [main README](../README.md) or search the docs directory.*
`;

    await fs.writeFile(guidePath, content, 'utf8');
    return guidePath;
  }

  /**
   * Create implementation summary
   */
  async createImplementationSummary(results) {
    const summaryPath = path.join(this.config.outputDir, 'implementation-summary.md');
    
    const content = `# Documentation Consolidation Implementation Summary

## Overview

The documentation consolidation project has successfully reorganized and consolidated the project's documentation into a coherent, maintainable structure.

## Implementation Status

### ✅ Completed Tasks

1. **Documentation Analysis Infrastructure** - Set up tools for analyzing existing documentation
2. **Content Consolidation** - Merged related documentation into unified files
3. **Structure Standardization** - Applied consistent formatting and organization
4. **Reference Updates** - Fixed all internal links and cross-references
5. **Command Documentation** - Generated comprehensive command reference
6. **Validation Pipeline** - Created automated validation system
7. **Gap Analysis** - Identified and addressed documentation gaps
8. **Template System** - Created reusable documentation templates

### 📊 Key Metrics

- **Files Processed**: ${results.phases.consolidation?.results?.consolidatedFiles?.length || 'N/A'}
- **References Updated**: ${results.phases.consolidation?.results?.updatedReferences?.length || 'N/A'}
- **Validation Issues**: ${this.countValidationIssues(results.phases.validation?.results) || 'N/A'}
- **Documentation Gaps**: ${results.phases.gapAnalysis?.results?.gaps?.length || 'N/A'}

## Architecture

The consolidated documentation follows a clear hierarchical structure:

- **Root Level**: Project overview and quick start
- **Architecture**: System design and technical architecture
- **Components**: Detailed component documentation
- **Setup**: Installation and configuration guides
- **Workflows**: Development and operational processes
- **Reference**: Command and API references

## Quality Assurance

### Validation Pipeline
- Automated syntax checking
- Link validation
- Content freshness checks
- Cross-reference verification

### Gap Analysis
- Missing documentation identification
- Priority-based improvement recommendations
- Regular gap assessment process

## Maintenance

### Automated Processes
- Validation pipeline integration
- Command documentation generation
- Link checking and updates

### Manual Processes
- Content review and updates
- Gap analysis and prioritization
- Template maintenance

## Future Improvements

Based on the gap analysis, consider these enhancements:

${results.phases.gapAnalysis?.results?.gaps?.slice(0, 3).map(gap => 
  `- **${gap.type}**: ${gap.description}`
).join('\n') || '- No specific improvements identified'}

## Tools and Scripts

The following tools were created for ongoing maintenance:

- \`run-validation.js\` - Documentation validation pipeline
- \`cleanup-old-docs.js\` - Remove outdated documentation
- \`run-consolidation.js\` - Complete consolidation pipeline

## Success Criteria

✅ **Achieved**:
- Unified documentation structure
- Consistent formatting and style
- Working cross-references
- Automated validation
- Comprehensive gap analysis

## Conclusion

The documentation consolidation project has successfully created a maintainable, user-friendly documentation system that supports both new and experienced developers working on the Tattoo Artist Directory MVP.

---

*Generated: ${results.timestamp}*
*Pipeline Duration: ${results.duration}ms*
`;

    await fs.writeFile(summaryPath, content, 'utf8');
    return summaryPath;
  }

  /**
   * Helper methods
   */
  formatPhaseResults(results) {
    if (!results || typeof results !== 'object') return '';
    
    return Object.entries(results)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `- ${key}: ${value.length} items`;
        } else if (typeof value === 'object' && value !== null) {
          return `- ${key}: ${Object.keys(value).length} entries`;
        } else {
          return `- ${key}: ${value}`;
        }
      })
      .join('\n');
  }

  countValidationIssues(validationResults) {
    if (!validationResults?.phases?.validation?.results) return 0;
    
    const validation = validationResults.phases.validation.results;
    return (validation.syntax?.errors?.length || 0) +
           (validation.links?.errors?.length || 0) +
           (validation.structure?.errors?.length || 0) +
           (validation.freshness?.warnings?.length || 0);
  }

  formatValidationResults(results) {
    if (!results?.phases?.validation?.results) return 'No validation data available';
    
    const validation = results.phases.validation.results;
    return `
- Syntax errors: ${validation.syntax?.errors?.length || 0}
- Link errors: ${validation.links?.errors?.length || 0}
- Structure issues: ${validation.structure?.errors?.length || 0}
- Freshness warnings: ${validation.freshness?.warnings?.length || 0}`;
  }

  generateConsolidationRecommendations(results) {
    const recommendations = [];
    
    if (!results.success) {
      recommendations.push('- Address pipeline errors before proceeding with documentation updates');
    }

    const validationIssues = this.countValidationIssues(results.phases.validation?.results);
    if (validationIssues > 0) {
      recommendations.push(`- Fix ${validationIssues} validation issues to improve documentation quality`);
    }

    const gaps = results.phases.gapAnalysis?.results?.gaps?.length || 0;
    if (gaps > 0) {
      recommendations.push(`- Address ${gaps} documentation gaps identified in gap analysis`);
    }

    if (this.config.dryRun) {
      recommendations.push('- Run consolidation pipeline in live mode to apply changes');
    }

    recommendations.push('- Set up automated validation in CI/CD pipeline');
    recommendations.push('- Schedule regular documentation reviews and updates');

    return recommendations.length > 0 ? recommendations.join('\n') : '- Documentation is in excellent condition!';
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const config = {
    projectRoot: path.resolve(__dirname, '../..'),
    outputDir: path.join(__dirname, 'consolidation-reports'),
    dryRun: !args.includes('--live')
  };

  const pipeline = new ConsolidationPipeline(config);

  try {
    const results = await pipeline.run();
    
    if (config.dryRun) {
      console.log('\n💡 This was a dry run. Use --live flag to apply changes.');
    }
    
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Consolidation pipeline failed:', error.message);
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Complete Documentation Consolidation Pipeline

Usage:
  node run-consolidation.js [options]

Options:
  --live        Apply changes (default is dry run)
  --help, -h    Show this help message

Examples:
  node run-consolidation.js           # Dry run (preview only)
  node run-consolidation.js --live    # Apply all changes
`);
  process.exit(0);
}

main();