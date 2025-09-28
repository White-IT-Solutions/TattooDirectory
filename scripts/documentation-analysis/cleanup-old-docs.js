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
    const files = await FileUtils.findFiles(this.config.projectRoot, ['**/*.md']);
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for moved markers
        if (content.includes('✅ MOVED:') || 
            content.includes('<!-- MOVED:') || 
            content.includes('# MOVED:') ||
            content.includes('This file has been moved') ||
            content.includes('Content moved to')) {
          
          this.filesToRemove.push(file);
          this.movedFiles.push(file);
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
      // Known duplicates from consolidation
      'docs/setup/README.md', // Consolidated into other setup docs
      'docs/backend/README.md', // Moved to components
      'docs/frontend/README.md', // Moved to components
      'docs/infrastructure/README.md', // Moved to components
      'docs/scripts/README.md', // Moved to components
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
      'docs/setup',
      'docs/backend', 
      'docs/frontend',
      'docs/infrastructure',
      'docs/scripts',
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