#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Find empty folders in the project
 */
class EmptyFolderFinder {
    constructor() {
        this.emptyFolders = [];
        this.gitkeepFolders = [];
        this.potentiallyLegacyFolders = [];
        
        // Folders that should be kept even if empty (for functionality)
        this.keepFolders = new Set([
            '.git',
            'node_modules',
            '.next',
            'dist',
            'build',
            'coverage',
            'logs',
            'temp',
            'tmp',
            'cache',
            '.cache',
            'backups',
            'output',
            'screenshots',
            'test-results',
            'validation-reports'
        ]);
        
        // Patterns that suggest legacy/unused folders
        this.legacyPatterns = [
            /backup/i,
            /old/i,
            /legacy/i,
            /archive/i,
            /temp/i,
            /tmp/i,
            /test-/i,
            /unused/i,
            /deprecated/i
        ];
    }

    /**
     * Check if a directory is empty (no files, only empty subdirectories)
     */
    isDirectoryEmpty(dirPath) {
        try {
            const items = fs.readdirSync(dirPath);
            
            if (items.length === 0) {
                return true;
            }
            
            // Check if it only contains .gitkeep
            if (items.length === 1 && items[0] === '.gitkeep') {
                return 'gitkeep';
            }
            
            // Check if all items are empty directories
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isFile()) {
                    return false;
                }
                
                if (stat.isDirectory()) {
                    const subDirEmpty = this.isDirectoryEmpty(itemPath);
                    if (subDirEmpty !== true) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.warn(`Warning: Cannot read directory ${dirPath}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if folder name suggests it might be legacy
     */
    isLikelyLegacy(folderName) {
        return this.legacyPatterns.some(pattern => pattern.test(folderName));
    }

    /**
     * Should we keep this folder even if empty?
     */
    shouldKeepFolder(folderPath) {
        const folderName = path.basename(folderPath);
        
        // Keep certain system/build folders
        if (this.keepFolders.has(folderName)) {
            return true;
        }
        
        // Keep folders that are part of the expected project structure
        const relativePath = path.relative(process.cwd(), folderPath);
        const expectedFolders = [
            'frontend/src',
            'backend/src',
            'infrastructure/modules',
            'scripts/logs',
            '.metrics/generated',       // Active output directory for generated files

            'tests/e2e/screenshots',
            'devtools/localstack-data',
            'devtools/localstack-logs',
            'devtools/localstack-tmp'
        ];
        
        return expectedFolders.some(expected => relativePath.includes(expected));
    }

    /**
     * Recursively find empty folders
     */
    findEmptyFolders(dirPath, maxDepth = 10, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return;
        }

        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Skip node_modules and .git for performance
                    if (item === 'node_modules' || item === '.git') {
                        continue;
                    }
                    
                    const emptyStatus = this.isDirectoryEmpty(itemPath);
                    
                    if (emptyStatus === true) {
                        const relativePath = path.relative(process.cwd(), itemPath);
                        
                        if (this.shouldKeepFolder(itemPath)) {
                            // Keep but note it's empty
                            console.log(`📁 Empty but keeping: ${relativePath}`);
                        } else if (this.isLikelyLegacy(item)) {
                            this.potentiallyLegacyFolders.push(relativePath);
                        } else {
                            this.emptyFolders.push(relativePath);
                        }
                    } else if (emptyStatus === 'gitkeep') {
                        const relativePath = path.relative(process.cwd(), itemPath);
                        this.gitkeepFolders.push(relativePath);
                    }
                    
                    // Recurse into subdirectories
                    this.findEmptyFolders(itemPath, maxDepth, currentDepth + 1);
                }
            }
        } catch (error) {
            console.warn(`Warning: Cannot process directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Generate deletion script
     */
    generateDeletionScript() {
        const foldersToDelete = [...this.emptyFolders, ...this.potentiallyLegacyFolders];
        
        if (foldersToDelete.length === 0) {
            return null;
        }

        const scriptLines = [
            '#!/bin/bash',
            '# Auto-generated script to remove empty/legacy folders',
            '# Review carefully before running!',
            '',
            'set -e',
            '',
            'echo "🧹 Cleaning up empty and legacy folders..."',
            ''
        ];

        foldersToDelete.forEach(folder => {
            scriptLines.push(`echo "Removing: ${folder}"`);
            scriptLines.push(`rm -rf "${folder}"`);
            scriptLines.push('');
        });

        scriptLines.push('echo "✅ Cleanup complete!"');

        return scriptLines.join('\n');
    }

    /**
     * Run the analysis
     */
    analyze() {
        console.log('🔍 Analyzing project for empty folders...\n');
        
        this.findEmptyFolders(process.cwd());
        
        console.log('\n📊 Analysis Results:');
        console.log('==================');
        
        if (this.emptyFolders.length > 0) {
            console.log('\n🗂️  Empty folders that could be removed:');
            this.emptyFolders.forEach(folder => {
                console.log(`   - ${folder}`);
            });
        }
        
        if (this.potentiallyLegacyFolders.length > 0) {
            console.log('\n🏚️  Potentially legacy folders:');
            this.potentiallyLegacyFolders.forEach(folder => {
                console.log(`   - ${folder}`);
            });
        }
        
        if (this.gitkeepFolders.length > 0) {
            console.log('\n📌 Folders with .gitkeep (intentionally empty):');
            this.gitkeepFolders.forEach(folder => {
                console.log(`   - ${folder}`);
            });
        }
        
        const totalEmpty = this.emptyFolders.length + this.potentiallyLegacyFolders.length;
        
        if (totalEmpty === 0) {
            console.log('\n✅ No empty folders found that need cleanup!');
            return;
        }
        
        console.log(`\n📈 Summary: Found ${totalEmpty} folders that could be cleaned up`);
        
        // Generate cleanup script
        const script = this.generateDeletionScript();
        if (script) {
            const scriptPath = path.join(process.cwd(), 'scripts/utilities/cleanup-empty-folders.sh');
            fs.writeFileSync(scriptPath, script);
            fs.chmodSync(scriptPath, '755');
            console.log(`\n📝 Generated cleanup script: ${path.relative(process.cwd(), scriptPath)}`);
            console.log('   Review the script before running it!');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const finder = new EmptyFolderFinder();
    finder.analyze();
}

module.exports = EmptyFolderFinder;