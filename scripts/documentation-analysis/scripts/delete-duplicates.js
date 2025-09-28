#!/usr/bin/env node

/**
 * Documentation Duplicate Deletion Script
 * Safely deletes high-confidence duplicate files based on the file mapping report
 */

const fs = require('fs').promises;
const path = require('path');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

// High confidence duplicates to delete (from the file mapping report)
const highConfidenceDuplicates = [
  'docs/architecture/api-design.md',
  'docs/architecture/data-models.md',
  'docs/architecture/system-overview.md',
  'docs/diagrams_as_code/AWS Amplify Architecture.md',
  'docs/diagrams_as_code/AWS Configured Access.md',
  'docs/diagrams_as_code/Backup and Disaster Recovery.md',
  'docs/diagrams_as_code/C4 Model Level 1 - System Context.md',
  'docs/diagrams_as_code/C4 Model Level 2 - Containers.md',
  'docs/diagrams_as_code/C4 Model Level 3 - Components.md',
  'docs/diagrams_as_code/CICD Pipeline Diagram.md',
  'docs/diagrams_as_code/Data Aggregation Sequence Diagram.md',
  'docs/diagrams_as_code/Data Governance & Takedown Process Diagram.md',
  'docs/diagrams_as_code/Data Model Diagram (DynamoDB Single-Table Design).md',
  'docs/diagrams_as_code/Feature Dependency Map.md',
  'docs/diagrams_as_code/High Level Overview.md',
  'docs/diagrams_as_code/Image Ingestion and Display.md',
  'docs/diagrams_as_code/Logging Architecture.md',
  'docs/diagrams_as_code/Multi-Account Architecture.md',
  'docs/diagrams_as_code/Network Architecture Diagram (VPC).md',
  'docs/diagrams_as_code/Observability & Alerting Flow Diagram.md',
  'docs/diagrams_as_code/State Machine Diagram (AWS Step Functions).md',
  'docs/diagrams_as_code/User Interaction Sequence Diagram (Search).md',
  'docs/frontend/tests/API_REFERENCE.md',
  'docs/frontend/tests/e2e/TROUBLESHOOTING_GUIDE.md',
  'docs/localstack/troubleshooting/API_TESTING_GUIDE.md',
  'docs/localstack/troubleshooting/BEST-PRACTICES.md',
  'docs/localstack/troubleshooting/MONITORING_SYSTEM.md',
  'docs/localstack/troubleshooting/PERFORMANCE_MONITORING.md',
  'docs/localstack/troubleshooting/SECURITY-GUIDELINES.md',
  'docs/localstack/troubleshooting/TROUBLESHOOTING_MASTER.md',
  'docs/localstack/troubleshooting/VIDEO-TUTORIALS-GUIDE.md',
  'docs/scripts/DATA-MANAGEMENT.md',
  'docs/setup/dependencies.md',
  'docs/workflows/monitoring.md'
];

/**
 * Check if file exists and is safe to delete
 */
async function checkFileForDeletion(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const stats = await fs.stat(fullPath);
    
    // Check if it's a redirect file (very small size indicates redirect)
    if (stats.size < 500) {
      return { canDelete: true, reason: 'redirect file', size: stats.size };
    }
    
    // Read content to check if it's a redirect
    const content = await fs.readFile(fullPath, 'utf8');
    if (content.includes('This file has been moved to') || content.includes('→')) {
      return { canDelete: true, reason: 'redirect content', size: stats.size };
    }
    
    return { canDelete: true, reason: 'duplicate', size: stats.size };
    
  } catch (error) {
    return { canDelete: false, reason: 'file not found', error: error.message };
  }
}

/**
 * Delete a file safely
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    await fs.unlink(fullPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Clean up empty directories
 */
async function cleanupEmptyDirectories(dirPath) {
  try {
    const fullPath = path.join(projectRoot, dirPath);
    const entries = await fs.readdir(fullPath);
    
    if (entries.length === 0) {
      await fs.rmdir(fullPath);
      console.log(`   🗂️  Removed empty directory: ${dirPath}`);
      
      // Recursively check parent directory
      const parentDir = path.dirname(dirPath);
      if (parentDir !== 'docs' && parentDir !== '.') {
        await cleanupEmptyDirectories(parentDir);
      }
    }
  } catch (error) {
    // Directory not empty or doesn't exist, which is fine
  }
}

/**
 * Main deletion function
 */
async function deleteDuplicates(dryRun = false) {
  console.log('🗑️  Starting duplicate file deletion...\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be actually deleted\n');
  }
  
  let deletedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const deletedDirs = new Set();
  
  for (const filePath of highConfidenceDuplicates) {
    console.log(`🔍 Checking: ${filePath}`);
    
    const checkResult = await checkFileForDeletion(filePath);
    
    if (checkResult.canDelete) {
      if (!dryRun) {
        const deleteResult = await deleteFile(filePath);
        
        if (deleteResult.success) {
          console.log(`   ✅ Deleted (${checkResult.reason}, ${checkResult.size} bytes)`);
          deletedCount++;
          
          // Track directory for cleanup
          const dirPath = path.dirname(filePath);
          deletedDirs.add(dirPath);
        } else {
          console.log(`   ❌ Failed to delete: ${deleteResult.error}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Would delete (${checkResult.reason}, ${checkResult.size} bytes)`);
        deletedCount++;
      }
    } else {
      console.log(`   ⏭️  Skipped: ${checkResult.reason}`);
      skippedCount++;
    }
  }
  
  // Clean up empty directories
  if (!dryRun && deletedDirs.size > 0) {
    console.log('\n🗂️  Cleaning up empty directories...');
    for (const dirPath of deletedDirs) {
      await cleanupEmptyDirectories(dirPath);
    }
  }
  
  // Summary
  console.log('\n📊 Deletion Summary:');
  console.log(`   Files processed: ${highConfidenceDuplicates.length}`);
  console.log(`   Files ${dryRun ? 'would be ' : ''}deleted: ${deletedCount}`);
  console.log(`   Files skipped: ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`   Errors encountered: ${errorCount}`);
  }
  
  if (dryRun) {
    console.log('\n💡 To actually delete files, run: npm run docs:delete-duplicates --live');
  } else {
    console.log('\n✅ Duplicate deletion completed!');
    console.log('💡 Run gap analysis again to see improvements: npm run docs:gap-analysis');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Documentation Duplicate Deletion

Usage:
  npm run docs:delete-duplicates        # Dry run (preview only)
  npm run docs:delete-duplicates --live # Actually delete files

This script safely deletes high-confidence duplicate files that have
equivalents in /docs/consolidated/. It will:

1. Check each file to ensure it's safe to delete
2. Delete redirect files and confirmed duplicates
3. Clean up empty directories
4. Provide a summary of actions taken

Files are only deleted if they are:
- Small redirect files (< 500 bytes)
- Files containing redirect content
- Confirmed duplicates with consolidated equivalents
`);
  process.exit(0);
}

deleteDuplicates(dryRun).catch(error => {
  console.error('❌ Deletion failed:', error.message);
  process.exit(1);
});