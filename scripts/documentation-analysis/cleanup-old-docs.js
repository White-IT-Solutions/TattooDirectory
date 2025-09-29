#!/usr/bin/env node

/**
 * Documentation Cleanup Script
 * Removes outdated and duplicate documentation files
 */

const fs = require('fs').promises;
const path = require('path');
const FileUtils = require('./src/utils/FileUtils');

class DocumentationCleanup {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      dryRun: config.dryRun !== false,
      backupDir: config.backupDir || path.join(__dirname, 'backups'),
      ...config
    };
    
    this.filesToRemove = [];
    this.dirsToRemove = [];
    this.movedFiles = [];
  }

  /**
   * Run cleanup process
   */
  async run() {
    console.log('🧹 Starting documentation cleanup...');
    console.log(`Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    try {
      // Phase 1: Identify files to clean up
      await this.identifyFilesToCleanup();
      
      // Phase 2: Create backup if not dry run
      if (!this.config.dryRun) {
        await this.createBackup();
      }
      
      // Phase 3: Remove files
      await this.removeFiles();
      
      // Phase 4: Clean up empty directories
      await this.removeEmptyDirectories();
      
      // Phase 5: Update references
      await this.updateReferences();
      
      console.log('✅ Cleanup completed successfully');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Identify files marked for removal
   */
  async identifyFilesToCleanup() {
    console.log('\n🔍 Identifying files to cleanup...');
    
    // Find files with "moved" markers
    await this.findMovedFiles();
    
    // Find duplicate files
    await this.findDuplicateFiles();
    
    // Find outdated files
    await this.findOutdatedFiles();
    
    console.log(`Found ${this.filesToRemove.length} files to remove`);
    
    if (this.filesToRemove.length > 0) {
      console.log('\nFiles to be removed:');
      this.filesToRemove.forEach(file => console.log(`  - ${file}`));
    }
  }

  /**
   * Find files marked as moved
   */
  async findMovedFiles() {
    // Target specific files that are causing validation issues
    const problematicFiles = [
      // Root level old files
      'docs/README-DEVTOOLS.md',
      'docs/BEST-PRACTICES.md', 
      'docs/CI-CD Implementation.md',
      'docs/LOCAL-DEVELOPMENT-GUIDE.md',
      'docs/SECURITY-GUIDELINES.md',
      'docs/VIDEO-TUTORIALS-GUIDE.md',
      
      // Planning files that exist in consolidated
      'docs/planning/API_DOCUMENTATION.md',
      'docs/planning/TROUBLESHOOTING.md',
      'docs/planning/terraform-deployment-guide.md',
      'docs/planning/CI-CD Implementation.md',
      
      // Backend/Frontend files that have been consolidated
      'docs/backend/README_BACKEND.md',
      'docs/frontend/README_FRONTEND.md',
      'docs/frontend/README_DOCKER.md',
      'docs/frontend/CI_CD_INTEGRATION.md',
      'docs/frontend/CI_CD_INTEGRATION_COMPLETE.md',
      'docs/frontend/ENVIRONMENT_CONFIGURATION.md',
      'docs/frontend/frontend_docs_README_FRONTEND.md',
      'docs/frontend/PERFORMANCE_SUMMARY.md',
      
      // LocalStack files that have been consolidated
      'docs/localstack/README.md',
      'docs/localstack/README-CLOUDWATCH-LOGS.md', 
      'docs/localstack/README-ENHANCED-LOCALSTACK.md',
      'docs/localstack/README_LOCAL.md',
      
      // Scripts files that have been consolidated
      'docs/scripts/README.md',
      'docs/scripts/DATA-MANAGEMENT.md',
      'docs/scripts/error-handling-fix-summary.md',
      'docs/scripts/README_DATA_SEEDER.md',
      'docs/scripts/compatibility-matrix.md',
      'docs/scripts/migration-validation-report.md',
      'docs/scripts/npm-command-test-summary.md',
      'docs/scripts/npm-commands-fix-summary.md',
      'docs/scripts/PRODUCTION-PARITY-VALIDATION.md',
      'docs/scripts/README_CONTENT_GENERATION.md',
      'docs/scripts/README-Configuration.md',
      'docs/scripts/STUDIO_IMAGE_PROCESSOR_SUMMARY.md',
      'docs/scripts/Tattoo_Vertex_Docs.md',
      'docs/scripts/test_data_studios_README.md',
      'docs/scripts/TESTING_ISSUES.md',
      
      // Infrastructure files
      'docs/infrastructure/README.md',
      
      // Backup files that are duplicates
      'docs/backups/DATA-MANAGEMENT.md',
      'docs/backups/README_DATA_SEEDER.md'
    ];

    for (const file of problematicFiles) {
      const fullPath = path.join(this.config.projectRoot, file);
      try {
        await fs.access(fullPath);
        this.filesToRemove.push(fullPath);
        this.movedFiles.push(fullPath);
      } catch (error) {
        // File doesn't exist, skip
      }
    }
    
    // Also check for files with moved markers
    const allFiles = await FileUtils.findFiles(this.config.projectRoot, ['**/*.md']);
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for moved markers
        if (content.includes('✅ MOVED:') || 
            content.includes('<!-- MOVED:') || 
            content.includes('# MOVED:') ||
            content.includes('This file has been moved') ||
            content.includes('Content moved to')) {
          
          if (!this.filesToRemove.includes(file)) {
            this.filesToRemove.push(file);
            this.movedFiles.push(file);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Find duplicate files
   */
  async findDuplicateFiles() {
    const duplicates = [
      // Root level old files causing validation issues
      'docs/README-DEVTOOLS.md',
      'docs/BEST-PRACTICES.md',
      'docs/CI-CD Implementation.md',
      'docs/LOCAL-DEVELOPMENT-GUIDE.md',
      'docs/SECURITY-GUIDELINES.md',
      'docs/VIDEO-TUTORIALS-GUIDE.md',
      
      // Planning files that have been moved to consolidated
      'docs/planning/API_DOCUMENTATION.md',
      'docs/planning/DYNAMODB_STREAMS_IMPLEMENTATION.md',
      'docs/planning/TROUBLESHOOTING.md',
      'docs/planning/STUDIO_CLI_COMMANDS.md',
      'docs/planning/STUDIO_HEALTH_MONITORING.md',
      
      // Data management files that have been consolidated
      'docs/data_management/DATA_MANAGEMENT_GUIDE.md',
      'docs/data_management/MIGRATION_GUIDE.md',
      'docs/data_management/COMMAND_COMPARISON.md',
      'docs/data_management/FINAL_SYSTEM_VALIDATION_REPORT.md',
      'docs/data_management/FRONTEND_SYNC_MIGRATION_GUIDE.md',
      'docs/data_management/MIGRATION_COMPLETION_REPORT.md',
      'docs/data_management/PERFORMANCE_BENCHMARKS.md',
      'docs/data_management/STUDIO_ARTIST_RELATIONSHIPS.md',
      'docs/data_management/STUDIO_DATA_MIGRATION_GUIDE.md',
      'docs/data_management/STUDIO_DATA_SCHEMA.md',
      'docs/data_management/STUDIO_IMAGE_PROCESSING.md',
      
      // Backend files that have been moved
      'docs/backend/README_BACKEND.md',
      
      // Frontend files that have been moved
      'docs/frontend/CI_CD_INTEGRATION_COMPLETE.md',
      'docs/frontend/CI_CD_INTEGRATION.md',
      'docs/frontend/ENVIRONMENT_CONFIGURATION.md',
      'docs/frontend/frontend_docs_README_FRONTEND.md',
      'docs/frontend/PERFORMANCE_SUMMARY.md',
      'docs/frontend/README_DOCKER.md',
      'docs/frontend/README_FRONTEND.md',
      'docs/frontend/README-AdvancedSearch.md',
      'docs/frontend/README-Enhanced-Styles.md',
      'docs/frontend/README-SearchController.md',
      'docs/frontend/README-SearchResultsSystem.md',
      
      // LocalStack files that have been moved
      'docs/localstack/README.md',
      'docs/localstack/README-CLOUDWATCH-LOGS.md',
      'docs/localstack/README-ENHANCED-LOCALSTACK.md',
      'docs/localstack/README_LOCAL.md',
      
      // Scripts files that have been moved
      'docs/scripts/compatibility-matrix.md',
      'docs/scripts/DATA-MANAGEMENT.md',
      'docs/scripts/error-handling-fix-summary.md',
      'docs/scripts/migration-validation-report.md',
      'docs/scripts/npm-command-test-summary.md',
      'docs/scripts/npm-commands-fix-summary.md',
      'docs/scripts/PRODUCTION-PARITY-VALIDATION.md',
      'docs/scripts/README.md',
      'docs/scripts/README_CONTENT_GENERATION.md',
      'docs/scripts/README_DATA_SEEDER.md',
      'docs/scripts/README-Configuration.md',
      'docs/scripts/STUDIO_IMAGE_PROCESSOR_SUMMARY.md',
      'docs/scripts/Tattoo_Vertex_Docs.md',
      'docs/scripts/test_data_studios_README.md',
      'docs/scripts/TESTING_ISSUES.md',
      
      // Infrastructure files that have been moved
      'docs/infrastructure/README.md',
      
      // Backup files that are duplicates
      'docs/backups/DATA-MANAGEMENT.md',
      'docs/backups/README_DATA_SEEDER.md',
      
      // Test files that have been moved
      'docs/tests/e2e/IMPLEMENTATION_GUIDE.md',
      'docs/tests/e2e/integration_tests_README.md',
      'docs/tests/e2e/README.md',
      'docs/tests/e2e/studio_images_README.md'
    ];

    for (const duplicate of duplicates) {
      const fullPath = path.join(this.config.projectRoot, duplicate);
      try {
        await fs.access(fullPath);
        this.filesToRemove.push(fullPath);
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  /**
   * Find outdated files
   */
  async findOutdatedFiles() {
    const outdatedPatterns = [
      '**/OLD_*',
      '**/DEPRECATED_*',
      '**/*.old',
      '**/*.bak',
      '**/temp_*',
      '**/tmp_*'
    ];

    const files = await FileUtils.findFiles(this.config.projectRoot, outdatedPatterns);
    this.filesToRemove.push(...files);
  }

  /**
   * Create backup of files to be removed
   */
  async createBackup() {
    if (this.filesToRemove.length === 0) return;
    
    console.log('\n💾 Creating backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupDir, `cleanup-${timestamp}`);
    
    await FileUtils.ensureDirectory(backupPath);
    
    for (const file of this.filesToRemove) {
      const relativePath = path.relative(this.config.projectRoot, file);
      const backupFile = path.join(backupPath, relativePath);
      
      await FileUtils.ensureDirectory(path.dirname(backupFile));
      await fs.copyFile(file, backupFile);
    }
    
    console.log(`Backup created at: ${backupPath}`);
  }

  /**
   * Remove identified files
   */
  async removeFiles() {
    if (this.filesToRemove.length === 0) {
      console.log('\n✅ No files to remove');
      return;
    }
    
    console.log(`\n🗑️  ${this.config.dryRun ? 'Would remove' : 'Removing'} ${this.filesToRemove.length} files...`);
    
    for (const file of this.filesToRemove) {
      try {
        if (!this.config.dryRun) {
          await fs.unlink(file);
        }
        console.log(`  ${this.config.dryRun ? 'Would remove' : 'Removed'}: ${path.relative(this.config.projectRoot, file)}`);
      } catch (error) {
        console.warn(`  Warning: Could not remove ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Remove empty directories
   */
  async removeEmptyDirectories() {
    console.log(`\n📁 ${this.config.dryRun ? 'Checking for' : 'Removing'} empty directories...`);
    
    const dirsToCheck = [
      'docs/backups',
      'docs/data_management',
      'docs/tests/e2e',
      'docs/tests',
      'docs/localstack/setup',
      'docs/localstack/troubleshooting',
      'docs/frontend/design_system',
      'docs/frontend/tests/e2e',
      'docs/frontend/tests',
      'docs/old',
      'docs/deprecated'
    ];

    for (const dir of dirsToCheck) {
      const fullPath = path.join(this.config.projectRoot, dir);
      
      try {
        const files = await fs.readdir(fullPath);
        if (files.length === 0) {
          if (!this.config.dryRun) {
            await fs.rmdir(fullPath);
          }
          console.log(`  ${this.config.dryRun ? 'Would remove' : 'Removed'} empty directory: ${dir}`);
          this.dirsToRemove.push(fullPath);
        }
      } catch (error) {
        // Directory doesn't exist or can't be accessed
      }
    }
  }

  /**
   * Update references to removed files
   */
  async updateReferences() {
    console.log(`\n🔗 ${this.config.dryRun ? 'Checking' : 'Updating'} file references...`);
    
    const allMdFiles = await FileUtils.findFiles(this.config.projectRoot, ['**/*.md']);
    const removedRelativePaths = this.filesToRemove.map(f => 
      path.relative(this.config.projectRoot, f)
    );

    let updatedFiles = 0;
    
    for (const file of allMdFiles) {
      if (this.filesToRemove.includes(file)) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        let updatedContent = content;
        let hasChanges = false;

        // Check for references to removed files
        for (const removedPath of removedRelativePaths) {
          const patterns = [
            new RegExp(`\\[.*?\\]\\(${removedPath.replace(/\\/g, '/')}\\)`, 'g'),
            new RegExp(`\\[.*?\\]\\(${removedPath.replace(/\//g, '\\\\')}\\)`, 'g'),
            new RegExp(`\\]\\(\\.\\/${removedPath.replace(/\\/g, '/')}\\)`, 'g'),
            new RegExp(`\\]\\(\\.\\/${removedPath.replace(/\//g, '\\\\')}\\)`, 'g')
          ];

          for (const pattern of patterns) {
            if (pattern.test(updatedContent)) {
              // Comment out broken links instead of removing them
              updatedContent = updatedContent.replace(pattern, (match) => {
                hasChanges = true;
                return `<!-- BROKEN LINK (file removed): ${match} -->`;
              });
            }
          }
        }

        if (hasChanges) {
          if (!this.config.dryRun) {
            await fs.writeFile(file, updatedContent, 'utf8');
          }
          console.log(`  ${this.config.dryRun ? 'Would update' : 'Updated'}: ${path.relative(this.config.projectRoot, file)}`);
          updatedFiles++;
        }
      } catch (error) {
        console.warn(`  Warning: Could not process ${file}: ${error.message}`);
      }
    }

    console.log(`${this.config.dryRun ? 'Would update' : 'Updated'} ${updatedFiles} files with reference changes`);
  }

  /**
   * Generate cleanup report
   */
  async generateReport() {
    const reportPath = path.join(this.config.backupDir, 'cleanup-report.md');
    
    const content = `# Documentation Cleanup Report

Generated: ${new Date().toISOString()}
Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}

## Summary

- Files removed: ${this.filesToRemove.length}
- Directories removed: ${this.dirsToRemove.length}
- Files with moved markers: ${this.movedFiles.length}

## Removed Files

${this.filesToRemove.map(f => `- ${path.relative(this.config.projectRoot, f)}`).join('\n')}

## Removed Directories

${this.dirsToRemove.map(d => `- ${path.relative(this.config.projectRoot, d)}`).join('\n')}

## Next Steps

${this.config.dryRun ? 
  '- Review this report and run cleanup with --live flag if satisfied' :
  '- Verify all documentation links are working\n- Run validation pipeline to check for issues'
}
`;

    await FileUtils.ensureDirectory(this.config.backupDir);
    await fs.writeFile(reportPath, content, 'utf8');
    
    console.log(`\n📋 Cleanup report generated: ${reportPath}`);
    return reportPath;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const config = {
    projectRoot: path.resolve(__dirname, '../..'),
    dryRun: !args.includes('--live'),
    backupDir: path.join(__dirname, 'backups')
  };

  const cleanup = new DocumentationCleanup(config);

  try {
    await cleanup.run();
    await cleanup.generateReport();
    
    if (config.dryRun) {
      console.log('\n💡 This was a dry run. Use --live flag to actually remove files.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Export the class for testing
module.exports = DocumentationCleanup;

// Only run main if this file is executed directly
if (require.main === module) {
  // Show usage if help requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Documentation Cleanup Script

Usage:
  node cleanup-old-docs.js [options]

Options:
  --live        Actually remove files (default is dry run)
  --help, -h    Show this help message

Examples:
  node cleanup-old-docs.js           # Dry run (preview only)
  node cleanup-old-docs.js --live    # Actually remove files
`);
    process.exit(0);
  }

  main();
}