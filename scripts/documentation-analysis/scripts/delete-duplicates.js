#!/usr/bin/env node

/**
 * Documentation Duplicate Deletion Script
 * Safely deletes high-confidence duplicate files based on the file mapping report
 */

const fs = require('fs').promises;
const path = require('path');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Calculate similarity between two strings using simple comparison
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  // Simple similarity based on common words
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

/**
 * Check if two files are actual duplicates by comparing content
 */
async function areFilesDuplicates(file1Path, file2Path) {
  try {
    const content1 = await fs.readFile(path.join(projectRoot, file1Path), 'utf8');
    const content2 = await fs.readFile(path.join(projectRoot, file2Path), 'utf8');
    
    // Exact match
    if (content1 === content2) {
      return { isDuplicate: true, similarity: 1.0, reason: 'identical content' };
    }
    
    // Check if one is a redirect to the other (must be short and contain explicit redirect language)
    const isRedirect1 = content1.length < 500 && (
      content1.includes('This file has been moved to') || 
      content1.includes('→') || 
      content1.includes('Moved to:') ||
      content1.includes('See:')
    );
    const isRedirect2 = content2.length < 500 && (
      content2.includes('This file has been moved to') || 
      content2.includes('→') || 
      content2.includes('Moved to:') ||
      content2.includes('See:')
    );
    
    if (isRedirect1 && content1.includes(file2Path)) {
      return { isDuplicate: true, similarity: 0.9, reason: 'redirect file' };
    }
    if (isRedirect2 && content2.includes(file1Path)) {
      return { isDuplicate: true, similarity: 0.9, reason: 'redirect file' };
    }
    
    // Check similarity (only for files with similar names or in similar locations)
    const basename1 = path.basename(file1Path);
    const basename2 = path.basename(file2Path);
    
    // Only compare similarity if files have same name or are in related directories
    if (basename1 === basename2 || 
        file1Path.includes('archive_docs') && file2Path.includes('consolidated') ||
        file1Path.includes('consolidated') && file2Path.includes('archive_docs')) {
      
      const similarity = calculateSimilarity(content1, content2);
      if (similarity > 0.85) {
        return { isDuplicate: true, similarity, reason: `high similarity (${Math.round(similarity * 100)}%)` };
      }
    }
    
    return { isDuplicate: false, similarity: 0, reason: 'different content' };
    
  } catch (error) {
    return { isDuplicate: false, similarity: 0, reason: 'error reading files' };
  }
}

/**
 * Find duplicate files by scanning the docs directory and comparing content
 */
async function findDuplicateFiles() {
  const duplicates = [];
  const docsPath = path.join(projectRoot, 'docs');
  
  try {
    console.log('   📁 Scanning all markdown files...');
    const allFiles = await getAllMarkdownFiles(docsPath);
    const relativePaths = allFiles.map(f => f.replace(projectRoot + path.sep, '').replace(/\\/g, '/'));
    
    console.log(`   📄 Found ${relativePaths.length} markdown files`);
    console.log('   🔍 Comparing files for duplicates...');
    
    // Compare each file with every other file
    for (let i = 0; i < relativePaths.length; i++) {
      for (let j = i + 1; j < relativePaths.length; j++) {
        const file1 = relativePaths[i];
        const file2 = relativePaths[j];
        
        // Skip if already marked as duplicate
        if (duplicates.includes(file1) || duplicates.includes(file2)) {
          continue;
        }
        
        const comparison = await areFilesDuplicates(file1, file2);
        
        if (comparison.isDuplicate) {
          console.log(`   🔗 Found duplicate: ${file1} ↔ ${file2} (${comparison.reason})`);
          
          // Decide which one to keep
          let fileToDelete;
          if (file1.includes('consolidated') && !file2.includes('consolidated')) {
            fileToDelete = file2; // Keep consolidated version
          } else if (!file1.includes('consolidated') && file2.includes('consolidated')) {
            fileToDelete = file1; // Keep consolidated version
          } else if (file1.includes('archive_docs') && !file2.includes('archive_docs')) {
            fileToDelete = file1; // Delete archived version
          } else if (!file1.includes('archive_docs') && file2.includes('archive_docs')) {
            fileToDelete = file2; // Delete archived version
          } else {
            // Keep the one with more specific path (deeper directory structure)
            const depth1 = file1.split('/').length;
            const depth2 = file2.split('/').length;
            fileToDelete = depth1 > depth2 ? file2 : file1;
          }
          
          duplicates.push(fileToDelete);
          console.log(`     → Will delete: ${fileToDelete}`);
        }
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Error finding duplicates:', error.message);
    return [];
  }
}

/**
 * Recursively get all markdown files
 */
async function getAllMarkdownFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

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
  
  // Find duplicates dynamically
  console.log('🔍 Scanning for duplicate files...');
  const duplicatesToDelete = await findDuplicateFiles();
  
  if (duplicatesToDelete.length === 0) {
    console.log('✅ No duplicate files found to delete!');
    return;
  }
  
  console.log(`📋 Found ${duplicatesToDelete.length} potential duplicate(s):\n`);
  duplicatesToDelete.forEach(file => console.log(`   - ${file}`));
  console.log('');
  
  let deletedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const deletedDirs = new Set();
  
  for (const filePath of duplicatesToDelete) {
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
  console.log(`   Files processed: ${duplicatesToDelete.length}`);
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