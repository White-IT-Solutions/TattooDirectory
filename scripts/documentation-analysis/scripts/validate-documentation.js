#!/usr/bin/env node

/**
 * Documentation Validation Script
 * Uses DocumentationValidator to validate project documentation
 */

const DocumentationValidator = require('../src/DocumentationValidator');
const path = require('path');
const fs = require('fs').promises;

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Main validation function
 */
async function validateDocumentation() {
  console.log('🔍 Starting comprehensive documentation validation...\n');
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    // Initialize validator with project-specific config
    const validator = new DocumentationValidator({
      projectRoot: projectRoot,
      commandTimeout: 30000,
      skipCommandValidation: ['dev', 'start', 'serve', 'watch', 'local:start', 'local:stop'],
      codeFileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md']
    });

    // Generate comprehensive compliance report
    console.log('📊 Generating compliance report...');
    const complianceReport = await validator.generateComplianceReport();

    // Display summary
    console.log('\n📋 Validation Summary:');
    console.log(`   Project Root: ${complianceReport.projectRoot}`);
    console.log(`   Total Files: ${complianceReport.totalFiles}`);
    console.log(`   Documentation Files: ${complianceReport.documentationFiles}`);
    console.log(`   Package.json Files: ${complianceReport.packageJsonFiles}`);
    console.log(`   Total Commands: ${complianceReport.totalCommands}`);

    if (complianceReport.validationReport) {
      const report = complianceReport.validationReport;
      console.log(`   Overall Score: ${report.overallScore}/100`);
      
      // Path validation results
      if (report.pathValidation) {
        const pathStatus = report.pathValidation.isValid ? '✅' : '❌';
        console.log(`   Path Validation: ${pathStatus} (${report.pathValidation.invalidPaths?.length || 0} invalid paths)`);
        
        if (report.pathValidation.invalidPaths?.length > 0) {
          console.log('\n🔗 Invalid Paths Found:');
          report.pathValidation.invalidPaths.slice(0, 10).forEach(path => {
            console.log(`     ❌ ${path}`);
          });
          if (report.pathValidation.invalidPaths.length > 10) {
            console.log(`     ... and ${report.pathValidation.invalidPaths.length - 10} more`);
          }
        }

        if (report.pathValidation.suggestions?.length > 0) {
          console.log('\n💡 Path Suggestions:');
          report.pathValidation.suggestions.slice(0, 5).forEach(suggestion => {
            console.log(`     💡 ${suggestion}`);
          });
        }
      }

      // Command validation results
      if (report.commandValidation) {
        const cmdStatus = report.commandValidation.isValid ? '✅' : '❌';
        console.log(`   Command Validation: ${cmdStatus} (${report.commandValidation.failedCommands?.length || 0} failed commands)`);
        
        if (report.commandValidation.failedCommands?.length > 0) {
          console.log('\n⚡ Failed Commands:');
          report.commandValidation.failedCommands.slice(0, 5).forEach(cmd => {
            console.log(`     ❌ ${cmd.command}: ${cmd.error}`);
          });
          if (report.commandValidation.failedCommands.length > 5) {
            console.log(`     ... and ${report.commandValidation.failedCommands.length - 5} more`);
          }
        }
      }

      // Content validation results
      if (report.contentValidation) {
        const contentStatus = report.contentValidation.isValid ? '✅' : '❌';
        console.log(`   Content Validation: ${contentStatus} (${report.contentValidation.issues?.length || 0} issues)`);
        
        if (report.contentValidation.issues?.length > 0) {
          console.log('\n📝 Content Issues:');
          report.contentValidation.issues.slice(0, 5).forEach(issue => {
            console.log(`     ❌ ${issue}`);
          });
          if (report.contentValidation.issues.length > 5) {
            console.log(`     ... and ${report.contentValidation.issues.length - 5} more`);
          }
        }

        if (report.contentValidation.warnings?.length > 0) {
          console.log('\n⚠️  Content Warnings:');
          report.contentValidation.warnings.slice(0, 5).forEach(warning => {
            console.log(`     ⚠️  ${warning}`);
          });
        }
      }

      // Cross-reference validation results
      if (report.crossReferenceValidation) {
        const refStatus = report.crossReferenceValidation.isValid ? '✅' : '❌';
        console.log(`   Cross-Reference Validation: ${refStatus} (${report.crossReferenceValidation.brokenReferences?.length || 0} broken references)`);
        
        if (report.crossReferenceValidation.brokenReferences?.length > 0) {
          console.log('\n🔗 Broken References:');
          report.crossReferenceValidation.brokenReferences.slice(0, 10).forEach(ref => {
            console.log(`     ❌ ${ref}`);
          });
          if (report.crossReferenceValidation.brokenReferences.length > 10) {
            console.log(`     ... and ${report.crossReferenceValidation.brokenReferences.length - 10} more`);
          }
        }
      }
    }

    // Display recommendations
    if (complianceReport.recommendations?.length > 0) {
      console.log('\n💡 Recommendations:');
      complianceReport.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(projectRoot, 'scripts/documentation-analysis/reports/validation-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(complianceReport, null, 2), 'utf8');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Determine success/failure
    const overallScore = complianceReport.validationReport?.overallScore || 0;
    const success = overallScore >= 75;

    if (success) {
      console.log('\n✅ Documentation validation completed successfully!');
      console.log(`🎯 Overall Score: ${overallScore}/100`);
    } else {
      console.log('\n⚠️  Documentation validation found issues');
      console.log(`🎯 Overall Score: ${overallScore}/100 (target: 75+)`);
      console.log('💡 Review the recommendations above to improve documentation quality');
    }

    console.log('\n📚 Next Steps:');
    console.log('   • Review and fix invalid paths and broken references');
    console.log('   • Update failing command examples');
    console.log('   • Fix syntax errors in code snippets');
    console.log('   • Consider running: npm run docs:gap-analysis');

    return success;

  } catch (error) {
    console.error('❌ Documentation validation failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    return false;
  } finally {
    process.chdir(originalCwd);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Documentation Validation

Usage:
  npm run validate

This script performs comprehensive documentation validation:
- Validates file paths and references
- Checks command accuracy and syntax
- Validates code snippets and examples
- Checks cross-references and links
- Generates compliance report with recommendations

Options:
  --help, -h    Show this help message

Environment Variables:
  DEBUG=1       Show detailed error information

Exit Codes:
  0 - Validation passed (score >= 75)
  1 - Validation failed or errors occurred

The detailed validation report is saved to:
  scripts/documentation-analysis/reports/validation-report.json
`);
  process.exit(0);
}

// Run validation
validateDocumentation().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Validation script failed:', error.message);
  process.exit(1);
});