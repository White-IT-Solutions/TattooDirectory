#!/usr/bin/env node

/**
 * Documentation Health Summary
 * Simple script to provide an overview of documentation status
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationHealthChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.stats = {
      totalFiles: 0,
      readableFiles: 0,
      emptyFiles: 0,
      errors: [],
      directories: new Set(),
      fileTypes: {}
    };
  }

  async scanDirectory(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        // Skip node_modules and .git directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'coverage') {
          continue;
        }
        
        if (entry.isDirectory()) {
          this.stats.directories.add(relPath);
          await this.scanDirectory(fullPath, relPath);
        } else if (entry.isFile() && this.isDocumentationFile(entry.name)) {
          await this.checkFile(fullPath, relPath);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Error scanning directory ${relativePath}: ${error.message}`);
    }
  }

  isDocumentationFile(filename) {
    const docExtensions = ['.md', '.txt'];
    const docNames = ['README', 'CHANGELOG', 'LICENSE'];
    
    const ext = path.extname(filename).toLowerCase();
    const name = path.basename(filename, ext).toUpperCase();
    
    return docExtensions.includes(ext) || docNames.includes(name);
  }

  async checkFile(fullPath, relativePath) {
    this.stats.totalFiles++;
    
    const ext = path.extname(relativePath).toLowerCase();
    this.stats.fileTypes[ext] = (this.stats.fileTypes[ext] || 0) + 1;
    
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      this.stats.readableFiles++;
      
      if (!content.trim()) {
        this.stats.emptyFiles++;
      }
      
    } catch (error) {
      this.stats.errors.push(`Cannot read ${relativePath}: ${error.message}`);
    }
  }

  async generateSummary() {
    console.log('📊 Documentation Health Summary');
    console.log('================================\n');
    
    await this.scanDirectory(this.projectRoot);
    
    console.log('📈 Overall Statistics:');
    console.log(`  Total documentation files: ${this.stats.totalFiles}`);
    console.log(`  Readable files: ${this.stats.readableFiles}`);
    console.log(`  Empty files: ${this.stats.emptyFiles}`);
    console.log(`  Directories with docs: ${this.stats.directories.size}`);
    console.log(`  Errors encountered: ${this.stats.errors.length}\n`);
    
    console.log('📁 File Types:');
    Object.entries(this.stats.fileTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([ext, count]) => {
        console.log(`  ${ext || 'no extension'}: ${count} files`);
      });
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Issues Found:');
      this.stats.errors.slice(0, 10).forEach(error => {
        console.log(`  • ${error}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
    
    console.log('\n🎯 Health Score:');
    const healthScore = Math.round((this.stats.readableFiles / this.stats.totalFiles) * 100);
    console.log(`  ${healthScore}% of documentation files are readable`);
    
    if (healthScore >= 90) {
      console.log('  ✅ Excellent documentation health!');
    } else if (healthScore >= 75) {
      console.log('  ⚠️  Good documentation health, minor issues');
    } else if (healthScore >= 50) {
      console.log('  🔶 Fair documentation health, needs attention');
    } else {
      console.log('  ❌ Poor documentation health, requires immediate attention');
    }
    
    console.log('\n📋 Key Directories:');
    const sortedDirs = Array.from(this.stats.directories).sort();
    sortedDirs.slice(0, 15).forEach(dir => {
      console.log(`  📁 ${dir}`);
    });
    
    if (sortedDirs.length > 15) {
      console.log(`  ... and ${sortedDirs.length - 15} more directories`);
    }
  }
}

async function main() {
  const checker = new DocumentationHealthChecker();
  
  try {
    await checker.generateSummary();
  } catch (error) {
    console.error('❌ Failed to generate documentation health summary:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DocumentationHealthChecker;