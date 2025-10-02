#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Safe cleanup of empty folders with categorization
 */
class SafeFolderCleanup {
    constructor() {
        this.categories = {
            // Build artifacts and cache - safe to remove
            buildArtifacts: [
                'frontend/.next/cache/swc',
                'frontend/.swc',
                'frontend/playwright-report'
            ],
            
            // Test artifacts - safe to remove
            testArtifacts: [
                'frontend/tests/e2e/visual-regression/baselines',
                'frontend/tests/e2e/visual-regression/diffs',
                'scripts/documentation-analysis/config/__tests__',
                'scripts/documentation-analysis/src/utils/__tests__'
            ],
            
            // Generated content folders - review before removing (may contain active data)
            generatedContent: [
                'scripts/content-generation/generated_content'
            ],
            
            // Legacy/temporary folders - review before removing
            legacyFolders: [
                'scripts/temp-test-data',
                'scripts/test-backups',
                'scripts/__tests__/test-state',
                'scripts/performance/.kiro',
                'scripts/performance/scripts',
                'scripts/performance/tests',
                'scripts/scripts'
            ],
            
            // Documentation structure - may be needed
            docStructure: [
                'docs/consolidated/architecture/diagrams',
                'docs/consolidated/troubleshooting/localstack'
            ],
            
            // Infrastructure - may be needed
            infrastructure: [
                'infrastructure/environments/dev/tools'
            ],
            
            // App structure - review carefully
            appStructure: [
                'frontend/src/app/home'
            ]
        };
    }

    /**
     * Check if folder exists and is empty
     */
    isFolderEmptyAndExists(folderPath) {
        try {
            if (!fs.existsSync(folderPath)) {
                return false;
            }
            
            const items = fs.readdirSync(folderPath);
            return items.length === 0 || (items.length === 1 && items[0] === '.gitkeep');
        } catch (error) {
            return false;
        }
    }

    /**
     * Remove folder safely
     */
    removeFolder(folderPath) {
        try {
            if (this.isFolderEmptyAndExists(folderPath)) {
                fs.rmSync(folderPath, { recursive: true, force: true });
                console.log(`✅ Removed: ${folderPath}`);
                return true;
            } else {
                console.log(`⚠️  Skipped (not empty or doesn't exist): ${folderPath}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error removing ${folderPath}: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up a specific category
     */
    cleanupCategory(categoryName, interactive = true) {
        const folders = this.categories[categoryName];
        if (!folders) {
            console.error(`❌ Unknown category: ${categoryName}`);
            return;
        }

        console.log(`\n🧹 Cleaning up category: ${categoryName}`);
        console.log('=' .repeat(50));

        let removed = 0;
        let skipped = 0;

        for (const folder of folders) {
            if (this.isFolderEmptyAndExists(folder)) {
                if (interactive) {
                    console.log(`\n📁 Found empty folder: ${folder}`);
                    // In a real interactive scenario, you'd prompt the user
                    // For now, we'll just show what would be removed
                    console.log(`   Would remove: ${folder}`);
                    skipped++;
                } else {
                    if (this.removeFolder(folder)) {
                        removed++;
                    } else {
                        skipped++;
                    }
                }
            } else {
                console.log(`⏭️  Skipped (not empty or doesn't exist): ${folder}`);
                skipped++;
            }
        }

        console.log(`\n📊 Category ${categoryName} summary:`);
        console.log(`   Removed: ${removed}`);
        console.log(`   Skipped: ${skipped}`);
    }

    /**
     * Show analysis of all categories
     */
    analyze() {
        console.log('🔍 Empty Folder Cleanup Analysis');
        console.log('================================\n');

        for (const [categoryName, folders] of Object.entries(this.categories)) {
            console.log(`📂 ${categoryName.toUpperCase()}:`);
            
            let emptyCount = 0;
            let totalSize = 0;
            
            for (const folder of folders) {
                if (this.isFolderEmptyAndExists(folder)) {
                    console.log(`   ✅ Empty: ${folder}`);
                    emptyCount++;
                } else if (fs.existsSync(folder)) {
                    console.log(`   📁 Has content: ${folder}`);
                } else {
                    console.log(`   ❌ Doesn't exist: ${folder}`);
                }
            }
            
            console.log(`   Summary: ${emptyCount}/${folders.length} folders are empty\n`);
        }
    }

    /**
     * Generate category-specific cleanup scripts
     */
    generateCleanupScripts() {
        const scriptsDir = path.join(process.cwd(), 'scripts/utilities');
        
        for (const [categoryName, folders] of Object.entries(this.categories)) {
            const emptyFolders = folders.filter(folder => this.isFolderEmptyAndExists(folder));
            
            if (emptyFolders.length === 0) {
                continue;
            }

            // Generate bash script
            const bashScript = [
                '#!/bin/bash',
                `# Cleanup script for ${categoryName} empty folders`,
                '# Generated automatically - review before running!',
                '',
                'set -e',
                '',
                `echo "🧹 Cleaning up ${categoryName} empty folders..."`,
                ''
            ];

            emptyFolders.forEach(folder => {
                bashScript.push(`echo "Removing: ${folder}"`);
                bashScript.push(`rm -rf "${folder}"`);
                bashScript.push('');
            });

            bashScript.push(`echo "✅ ${categoryName} cleanup complete!"`);

            const scriptPath = path.join(scriptsDir, `cleanup-${categoryName}.sh`);
            fs.writeFileSync(scriptPath, bashScript.join('\n'));
            fs.chmodSync(scriptPath, '755');

            // Generate Windows batch script
            const batScript = [
                '@echo off',
                `REM Cleanup script for ${categoryName} empty folders`,
                'REM Generated automatically - review before running!',
                '',
                `echo 🧹 Cleaning up ${categoryName} empty folders...`,
                ''
            ];

            emptyFolders.forEach(folder => {
                batScript.push(`echo Removing: ${folder}`);
                batScript.push(`rmdir /s /q "${folder}" 2>nul || echo Folder not found or not empty`);
                batScript.push('');
            });

            batScript.push(`echo ✅ ${categoryName} cleanup complete!`);

            const batPath = path.join(scriptsDir, `cleanup-${categoryName}.bat`);
            fs.writeFileSync(batPath, batScript.join('\r\n'));

            console.log(`📝 Generated cleanup scripts for ${categoryName}:`);
            console.log(`   - ${path.relative(process.cwd(), scriptPath)}`);
            console.log(`   - ${path.relative(process.cwd(), batPath)}`);
        }
    }

    /**
     * Clean up safe categories automatically
     */
    cleanupSafeCategories() {
        const safeCategories = ['buildArtifacts', 'testArtifacts', 'generatedContent'];
        
        console.log('🧹 Cleaning up safe categories automatically...\n');
        
        for (const category of safeCategories) {
            this.cleanupCategory(category, false);
        }
        
        console.log('\n✅ Safe cleanup complete!');
        console.log('\n⚠️  Review other categories manually:');
        console.log('   - legacyFolders: May contain important data');
        console.log('   - docStructure: May be needed for documentation');
        console.log('   - infrastructure: May be needed for deployment');
        console.log('   - appStructure: May be needed for app functionality');
    }
}

// CLI interface
if (require.main === module) {
    const cleanup = new SafeFolderCleanup();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        cleanup.analyze();
        cleanup.generateCleanupScripts();
    } else if (args[0] === 'clean-safe') {
        cleanup.cleanupSafeCategories();
    } else if (args[0] === 'clean') {
        const category = args[1];
        if (category) {
            cleanup.cleanupCategory(category, false);
        } else {
            console.error('Usage: node safe-cleanup-empty-folders.js clean <category>');
        }
    } else if (args[0] === 'analyze') {
        cleanup.analyze();
    } else {
        console.log('Usage:');
        console.log('  node safe-cleanup-empty-folders.js                 # Analyze and generate scripts');
        console.log('  node safe-cleanup-empty-folders.js analyze         # Show analysis only');
        console.log('  node safe-cleanup-empty-folders.js clean-safe      # Clean safe categories');
        console.log('  node safe-cleanup-empty-folders.js clean <category> # Clean specific category');
    }
}

module.exports = SafeFolderCleanup;