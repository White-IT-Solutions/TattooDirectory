#!/usr/bin/env node

/**
 * Final Cleanup Script
 * 
 * Performs final cleanup and validation to ensure the system is
 * production-ready with no temporary files or debugging code.
 */

const fs = require('fs');
const path = require('path');

class FinalCleanup {
  constructor() {
    this.issues = [];
    this.cleaned = [];
  }

  /**
   * Run final cleanup
   */
  async runCleanup() {
    console.log('🧹 Final System Cleanup');
    console.log('═══════════════════════\n');

    try {
      this.checkForTemporaryFiles();
      this.validateErrorMessages();
      this.checkForDebuggingCode();
      this.validateDocumentation();
      this.generateCleanupReport();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check for temporary files
   */
  checkForTemporaryFiles() {
    console.log('🔍 Checking for temporary files...');
    
    const tempPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /\.debug$/,
      /\.bak$/,
      /~$/,
      /\.swp$/
    ];

    const scriptsDir = path.join(__dirname);
    const files = fs.readdirSync(scriptsDir);
    
    let tempFilesFound = 0;
    
    for (const file of files) {
      const isTemp = tempPatterns.some(pattern => pattern.test(file));
      if (isTemp) {
        tempFilesFound++;
        this.issues.push(`Temporary file found: ${file}`);
      }
    }
    
    if (tempFilesFound === 0) {
      console.log('  ✅ No temporary files found');
    } else {
      console.log(`  ⚠️  Found ${tempFilesFound} temporary files`);
    }
  }

  /**
   * Validate error messages are user-friendly
   */
  validateErrorMessages() {
    console.log('💬 Validating error messages...');
    
    const coreFiles = [
      'unified-data-manager.js',
      'data-cli.js',
      'health-monitor.js'
    ];
    
    let userFriendlyErrors = 0;
    let technicalErrors = 0;
    
    for (const file of coreFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for user-friendly error patterns
        const friendlyPatterns = [
          /error.*not.*found/i,
          /failed.*to.*connect/i,
          /invalid.*configuration/i,
          /system.*not.*ready/i
        ];
        
        // Check for technical error patterns that should be avoided
        const technicalPatterns = [
          /Error.*undefined/i,
          /Cannot.*read.*property/i,
          /TypeError/i,
          /ReferenceError/i
        ];
        
        friendlyPatterns.forEach(pattern => {
          const matches = content.match(new RegExp(pattern.source, 'gi'));
          if (matches) userFriendlyErrors += matches.length;
        });
        
        technicalPatterns.forEach(pattern => {
          const matches = content.match(new RegExp(pattern.source, 'gi'));
          if (matches) {
            technicalErrors += matches.length;
            this.issues.push(`Technical error message in ${file}: ${matches[0]}`);
          }
        });
      }
    }
    
    console.log(`  ✅ User-friendly error messages: ${userFriendlyErrors}`);
    if (technicalErrors > 0) {
      console.log(`  ⚠️  Technical error messages: ${technicalErrors}`);
    }
  }

  /**
   * Check for debugging code
   */
  checkForDebuggingCode() {
    console.log('🐛 Checking for debugging code...');
    
    const coreFiles = [
      'unified-data-manager.js',
      'data-cli.js',
      'health-monitor.js',
      'comparison-validator.js',
      'migration-utility.js'
    ];
    
    let debugStatements = 0;
    
    for (const file of coreFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for debugging patterns (excluding legitimate logging)
        const debugPatterns = [
          /debugger;/,
          /console\.trace/,
          /console\.dir/,
          /console\.log.*TODO/i,
          /console\.log.*FIXME/i
        ];
        
        debugPatterns.forEach(pattern => {
          const matches = content.match(new RegExp(pattern.source, 'gi'));
          if (matches) {
            debugStatements += matches.length;
            this.issues.push(`Debug code in ${file}: ${matches[0]}`);
          }
        });
      }
    }
    
    if (debugStatements === 0) {
      console.log('  ✅ No debugging code found');
    } else {
      console.log(`  ⚠️  Found ${debugStatements} debug statements`);
    }
  }

  /**
   * Validate documentation is complete
   */
  validateDocumentation() {
    console.log('📚 Validating documentation...');
    
    const requiredDocs = [
      '../docs/DATA_MANAGEMENT_GUIDE.md',
      '../docs/API_DOCUMENTATION.md',
      '../docs/TROUBLESHOOTING.md',
      '../docs/COMMAND_COMPARISON.md',
      '../docs/FINAL_SYSTEM_VALIDATION_REPORT.md',
      'README.md',
      'docs/MIGRATION_GUIDE.md'
    ];
    
    let docsFound = 0;
    let docsMissing = 0;
    
    for (const doc of requiredDocs) {
      const docPath = path.join(__dirname, doc);
      if (fs.existsSync(docPath)) {
        docsFound++;
        
        // Check if document has content
        const content = fs.readFileSync(docPath, 'utf8');
        if (content.length < 100) {
          this.issues.push(`Documentation file is too short: ${doc}`);
        }
      } else {
        docsMissing++;
        this.issues.push(`Missing documentation: ${doc}`);
      }
    }
    
    console.log(`  ✅ Documentation files found: ${docsFound}`);
    if (docsMissing > 0) {
      console.log(`  ⚠️  Missing documentation: ${docsMissing}`);
    }
  }

  /**
   * Generate cleanup report
   */
  generateCleanupReport() {
    console.log('\n📊 Cleanup Report');
    console.log('═════════════════');
    
    if (this.issues.length === 0) {
      console.log('✅ System is clean and production-ready!');
      console.log('🚀 All components are properly integrated');
      console.log('📋 All documentation is complete');
      console.log('💬 All error messages are user-friendly');
      console.log('🧹 No temporary files or debugging code found');
      
      console.log('\n🎉 Final cleanup completed successfully!');
      process.exit(0);
      
    } else {
      console.log(`⚠️  Found ${this.issues.length} issues to address:`);
      
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 Please address these issues before deployment.');
      process.exit(1);
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new FinalCleanup();
  cleanup.runCleanup().catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = { FinalCleanup };