#!/usr/bin/env node

/**
 * Gap Analysis Script
 * Runs documentation gap analysis and generates reports
 */

const path = require('path');
const process = require('process');
const fs = require('fs').promises;
const GapAnalysisReporter = require('../src/GapAnalysisReporter');
const DocumentationAnalyzer = require('../src/DocumentationAnalyzer');

// Set the correct project root (go up two levels from scripts/documentation-analysis)
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Writes the gap analysis report to a markdown file
 * @param {Object} gapReport - The gap analysis report object
 */
async function writeGapAnalysisReport(gapReport) {
  const reportPath = path.join(projectRoot, 'docs', 'consolidated', 'GAP_ANALYSIS_REPORT.md');
  
  let markdown = `# Documentation Gap Analysis Report

Generated on: ${new Date(gapReport.summary.generatedAt).toLocaleString()}

## Executive Summary

- **Total Issues**: ${gapReport.summary.totalIssues}
- **Critical Issues**: ${gapReport.summary.criticalIssues}
- **High Priority Items**: ${gapReport.summary.highPriorityItems}
- **Medium Priority Items**: ${gapReport.summary.mediumPriorityItems}
- **Low Priority Items**: ${gapReport.summary.lowPriorityItems}

## Missing Documentation

### High Priority
`;

  // Add missing documentation by calculated priority (not just importance)
  const highPriorityMissing = gapReport.missingDocumentation.filter(doc => {
    const priority = calculateDocPriority(doc.importance, doc.estimatedEffort);
    return priority === 'high';
  });
  const mediumPriorityMissing = gapReport.missingDocumentation.filter(doc => {
    const priority = calculateDocPriority(doc.importance, doc.estimatedEffort);
    return priority === 'medium';
  });
  const lowPriorityMissing = gapReport.missingDocumentation.filter(doc => {
    const priority = calculateDocPriority(doc.importance, doc.estimatedEffort);
    return priority === 'low';
  });

  // Helper function to calculate priority (matches GapAnalysisReporter logic)
  function calculateDocPriority(importance, effort) {
    const importanceScore = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }[importance] || 1;
    const effortScore = { 'small': 1, 'medium': 2, 'large': 4 }[effort] || 2;
    
    // High importance, low effort = high priority
    // High importance, high effort = medium priority
    // Low importance = low priority
    if (importanceScore >= 3) {
      return effortScore <= 4 ? 'high' : 'medium';
    } else if (importanceScore >= 2) {
      return 'medium';
    }
    return 'low';
  }

  if (highPriorityMissing.length > 0) {
    highPriorityMissing.forEach(doc => {
      markdown += `- **${doc.feature}** (${doc.importance} importance, ${doc.estimatedEffort || 'undefined'} effort)\n`;
      if (doc.description) {
        markdown += `  - ${doc.description}\n`;
      }
    });
  } else {
    markdown += 'No high priority missing documentation found.\n';
  }

  markdown += `\n### Medium Priority\n`;
  if (mediumPriorityMissing.length > 0) {
    mediumPriorityMissing.slice(0, 10).forEach(doc => {
      markdown += `- **${doc.feature}** (${doc.importance} importance, ${doc.estimatedEffort || 'undefined'} effort)\n`;
    });
    if (mediumPriorityMissing.length > 10) {
      markdown += `- ... and ${mediumPriorityMissing.length - 10} more medium priority items\n`;
    }
  } else {
    markdown += 'No medium priority missing documentation found.\n';
  }

  markdown += `\n### Low Priority\n`;
  if (lowPriorityMissing.length > 0) {
    lowPriorityMissing.slice(0, 5).forEach(doc => {
      markdown += `- **${doc.feature}** (${doc.importance} importance, ${doc.estimatedEffort || 'undefined'} effort)\n`;
    });
    if (lowPriorityMissing.length > 5) {
      markdown += `- ... and ${lowPriorityMissing.length - 5} more low priority items\n`;
    }
  } else {
    markdown += 'No low priority missing documentation found.\n';
  }

  // Add outdated content section
  markdown += `\n## Outdated Content\n\n`;
  if (gapReport.outdatedContent && gapReport.outdatedContent.length > 0) {
    gapReport.outdatedContent.slice(0, 15).forEach(content => {
      markdown += `- **${path.basename(content.filePath)}**\n`;
      markdown += `  - Action: ${content.recommendedAction}\n`;
      if (content.issues && content.issues.length > 0) {
        markdown += `  - Issues: ${content.issues.join(', ')}\n`;
      }
    });
    if (gapReport.outdatedContent.length > 15) {
      markdown += `- ... and ${gapReport.outdatedContent.length - 15} more outdated files\n`;
    }
  } else {
    markdown += 'No outdated content found.\n';
  }

  // Add recommendations section
  markdown += `\n## Recommendations\n\n`;
  if (gapReport.recommendations && gapReport.recommendations.length > 0) {
    gapReport.recommendations.forEach(rec => {
      markdown += `### ${rec.title} (${rec.priority} priority)\n\n`;
      markdown += `${rec.description}\n\n`;
      if (rec.actionItems && rec.actionItems.length > 0) {
        markdown += `**Action Items:**\n`;
        rec.actionItems.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += `\n`;
      }
    });
  } else {
    markdown += 'No specific recommendations generated.\n';
  }

  // Add inconsistencies section if available
  if (gapReport.inconsistencies && gapReport.inconsistencies.length > 0) {
    markdown += `\n## Documentation Inconsistencies\n\n`;
    gapReport.inconsistencies.forEach(inconsistency => {
      markdown += `### ${inconsistency.type}\n\n`;
      markdown += `${inconsistency.description}\n\n`;
      markdown += `**Suggested Fix:** ${inconsistency.suggestedFix}\n\n`;
      if (inconsistency.affectedFiles && inconsistency.affectedFiles.length > 0) {
        markdown += `**Affected Files:**\n`;
        inconsistency.affectedFiles.slice(0, 5).forEach(file => {
          markdown += `- ${file}\n`;
        });
        if (inconsistency.affectedFiles.length > 5) {
          markdown += `- ... and ${inconsistency.affectedFiles.length - 5} more files\n`;
        }
        markdown += `\n`;
      }
    });
  }

  // Add footer
  markdown += `\n---\n\n*This report was generated automatically by the documentation gap analysis tool.*\n`;

  // Ensure the directory exists
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  
  // Write the report
  await fs.writeFile(reportPath, markdown, 'utf8');
  console.log(`📄 Gap analysis report written to: ${reportPath}`);
}

async function runGapAnalysis() {
  console.log('🔍 Running documentation gap analysis...\n');
  console.log(`📁 Project root: ${projectRoot}`);
  console.log(`📁 Current working directory: ${process.cwd()}\n`);

  // Change to project root directory to ensure relative paths work correctly
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    // Initialize components with correct project root
    const analyzer = new DocumentationAnalyzer();
    const gapReporter = new GapAnalysisReporter();
    
    // Override the project root to point to the actual project root
    analyzer.projectRoot = projectRoot;
    gapReporter.projectRoot = projectRoot;

    // Analyze documentation structure
    console.log('📁 Analyzing documentation structure...');
    const documentationMap = await analyzer.analyzeDocumentationStructure();

    // For project structure, we'll use a simple object since the method doesn't exist
    const projectStructure = {
      components: ['frontend', 'backend', 'scripts', 'infrastructure'],
      documentationPaths: ['docs', 'README.md']
    };

    // Analyze missing documentation
    console.log('📋 Analyzing missing documentation...');
    const missingDocs = await gapReporter.analyzeMissingDocumentation(projectStructure);

    // Identify outdated content
    console.log('⏰ Identifying outdated content...');
    const outdatedContent = await gapReporter.identifyOutdatedContent(documentationMap);

    // Generate priority matrix
    console.log('📊 Generating priority matrix...');
    const priorityMatrix = await gapReporter.generatePriorityMatrix(missingDocs, outdatedContent);

    // Generate comprehensive report
    console.log('📄 Generating gap analysis report...');
    const gapReport = await gapReporter.generateGapReport({
      projectStructure,
      documentationMap,
      missingDocs,
      outdatedContent,
      priorityMatrix
    });

    // Write report to file
    console.log('� Writing agap analysis report to file...');
    await writeGapAnalysisReport(gapReport);

    // Display summary
    console.log('\n📊 Gap Analysis Summary:');
    console.log(`   Total Issues: ${gapReport.summary.totalIssues}`);
    console.log(`   Critical Issues: ${gapReport.summary.criticalIssues}`);
    console.log(`   High Priority: ${gapReport.summary.highPriorityItems}`);
    console.log(`   Medium Priority: ${gapReport.summary.mediumPriorityItems}`);
    console.log(`   Low Priority: ${gapReport.summary.lowPriorityItems}`);

    // Show missing documentation
    if (gapReport.missingDocumentation.length > 0) {
      console.log('\n📋 Missing Documentation:');
      gapReport.missingDocumentation.slice(0, 10).forEach(doc => {
        console.log(`   - ${doc.feature} (${doc.importance})`);
      });
      if (gapReport.missingDocumentation.length > 10) {
        console.log(`   ... and ${gapReport.missingDocumentation.length - 10} more`);
      }
    }

    // Show outdated content
    if (gapReport.outdatedContent.length > 0) {
      console.log('\n⏰ Outdated Content:');
      gapReport.outdatedContent.slice(0, 5).forEach(content => {
        console.log(`   - ${path.basename(content.filePath)} (${content.recommendedAction})`);
      });
      if (gapReport.outdatedContent.length > 5) {
        console.log(`   ... and ${gapReport.outdatedContent.length - 5} more`);
      }
    }

    // Show recommendations
    if (gapReport.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      gapReport.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - ${rec.title} (${rec.priority})`);
      });
    }

    console.log('\n✅ Gap analysis completed successfully!');

  } catch (error) {
    console.error('❌ Gap analysis failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Documentation Gap Analysis

Usage:
  npm run gap-analysis

This script:
1. Analyzes project structure and documentation
2. Identifies missing documentation
3. Finds outdated content
4. Generates priority matrix
5. Provides actionable recommendations

Environment Variables:
  DEBUG=1    Show detailed error information
`);
  process.exit(0);
}

runGapAnalysis();