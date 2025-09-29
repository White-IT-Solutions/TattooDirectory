#!/usr/bin/env node

/**
 * Documentation File Mapping Generator
 * Generates a comprehensive mapping between /docs/ and /docs/consolidated/
 * to identify duplicates and files that can be safely deleted
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dirPath, basePath = '') {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const stats = await fs.stat(fullPath);
        files.push({
          path: fullPath,
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
  }
  
  return files;
}

/**
 * Calculate file hash for content comparison
 */
async function getFileHash(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    // Normalize content for comparison (remove whitespace differences)
    const normalizedContent = content.replace(/\s+/g, ' ').trim();
    return crypto.createHash('md5').update(normalizedContent).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Find potential duplicates based on name similarity and content
 */
function findPotentialDuplicates(docsFiles, consolidatedFiles) {
  const duplicates = [];
  
  // First, find duplicates between docs and consolidated
  for (const docsFile of docsFiles) {
    const potentialMatches = consolidatedFiles.filter(consFile => {
      // Check for exact name match
      if (docsFile.name === consFile.name) return true;
      
      // Check for similar names (removing prefixes like README_, etc.)
      const docsBaseName = docsFile.name.replace(/^(README_?|README-)/i, '').toLowerCase();
      const consBaseName = consFile.name.replace(/^(README_?|README-)/i, '').toLowerCase();
      if (docsBaseName === consBaseName) return true;
      
      // Check for content-based matches (same directory structure)
      const docsDir = path.dirname(docsFile.relativePath).toLowerCase();
      const consDir = path.dirname(consFile.relativePath).toLowerCase();
      if (docsDir.includes(consDir.split('/').pop()) || consDir.includes(docsDir.split('/').pop())) {
        return docsFile.name.toLowerCase() === consFile.name.toLowerCase();
      }
      
      return false;
    });
    
    if (potentialMatches.length > 0) {
      duplicates.push({
        original: docsFile,
        consolidated: potentialMatches,
        confidence: potentialMatches.length === 1 ? 'high' : 'medium',
        type: 'docs-to-consolidated'
      });
    }
  }
  
  // Second, find duplicates within docs directory (same filename in different locations)
  const filesByName = {};
  for (const docsFile of docsFiles) {
    if (!filesByName[docsFile.name]) {
      filesByName[docsFile.name] = [];
    }
    filesByName[docsFile.name].push(docsFile);
  }
  
  // Find files with same name in multiple locations
  for (const [fileName, files] of Object.entries(filesByName)) {
    if (files.length > 1) {
      // Sort by path length to prefer files in more specific directories
      files.sort((a, b) => b.relativePath.length - a.relativePath.length);
      
      for (let i = 1; i < files.length; i++) {
        duplicates.push({
          original: files[i], // The file to potentially remove
          consolidated: [files[0]], // The file to keep
          confidence: 'high',
          type: 'within-docs-duplicate'
        });
      }
    }
  }
  
  return duplicates;
}

/**
 * Categorize files for easier analysis
 */
function categorizeFiles(files, baseDir) {
  const categories = {
    architecture: [],
    backend: [],
    frontend: [],
    infrastructure: [],
    setup: [],
    workflows: [],
    planning: [],
    scripts: [],
    tests: [],
    reference: [],
    troubleshooting: [],
    localstack: [],
    diagrams: [],
    system_design: [],
    other: []
  };
  
  for (const file of files) {
    const pathParts = file.relativePath.split('/');
    const topDir = pathParts[0]?.toLowerCase();
    
    if (categories[topDir]) {
      categories[topDir].push(file);
    } else {
      categories.other.push(file);
    }
  }
  
  return categories;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(docsFiles, consolidatedFiles, duplicates, categories) {
  let report = `# Documentation File Mapping Report

Generated on: ${new Date().toLocaleString()}

## Summary

- **Files in /docs/**: ${docsFiles.length}
- **Files in /docs/consolidated/**: ${consolidatedFiles.length}
- **Potential Duplicates**: ${duplicates.length}

## File Distribution

### /docs/ Directory Structure
`;

  // Add category breakdown for docs
  for (const [category, files] of Object.entries(categories.docs)) {
    if (files.length > 0) {
      report += `- **${category}**: ${files.length} files\n`;
    }
  }

  report += `\n### /docs/consolidated/ Directory Structure
`;

  // Add category breakdown for consolidated
  for (const [category, files] of Object.entries(categories.consolidated)) {
    if (files.length > 0) {
      report += `- **${category}**: ${files.length} files\n`;
    }
  }

  report += `\n## Potential Duplicates

These files in /docs/ may have equivalents in /docs/consolidated/ or are duplicated within /docs/:

`;

  // Group duplicates by type and confidence level
  const docsToConsolidated = duplicates.filter(d => d.type === 'docs-to-consolidated');
  const withinDocsDuplicates = duplicates.filter(d => d.type === 'within-docs-duplicate');
  
  const highConfidence = duplicates.filter(d => d.confidence === 'high');
  const mediumConfidence = duplicates.filter(d => d.confidence === 'medium');

  if (withinDocsDuplicates.length > 0) {
    report += `### Duplicates Within /docs/ Directory (${withinDocsDuplicates.length})\n\n`;
    for (const duplicate of withinDocsDuplicates) {
      report += `- **${duplicate.original.relativePath}**\n`;
      report += `  - Duplicate of: ${duplicate.consolidated[0].relativePath}\n`;
      report += `  - Size: ${duplicate.original.size} bytes vs ${duplicate.consolidated[0].size} bytes\n`;
      report += `  - Recommendation: Remove duplicate, keep the one in more specific directory\n\n`;
    }
  }

  if (docsToConsolidated.filter(d => d.confidence === 'high').length > 0) {
    report += `### High Confidence Matches to Consolidated (${docsToConsolidated.filter(d => d.confidence === 'high').length})\n\n`;
    for (const duplicate of docsToConsolidated.filter(d => d.confidence === 'high')) {
      report += `- **${duplicate.original.relativePath}**\n`;
      report += `  - Consolidated: ${duplicate.consolidated[0].relativePath}\n`;
      report += `  - Size: ${duplicate.original.size} bytes vs ${duplicate.consolidated[0].size} bytes\n\n`;
    }
  }

  if (docsToConsolidated.filter(d => d.confidence === 'medium').length > 0) {
    report += `### Medium Confidence Matches to Consolidated (${docsToConsolidated.filter(d => d.confidence === 'medium').length})\n\n`;
    for (const duplicate of docsToConsolidated.filter(d => d.confidence === 'medium')) {
      report += `- **${duplicate.original.relativePath}**\n`;
      report += `  - Possible matches:\n`;
      for (const match of duplicate.consolidated) {
        report += `    - ${match.relativePath}\n`;
      }
      report += `\n`;
    }
  }

  // Files with no matches
  const filesWithoutMatches = docsFiles.filter(docsFile => 
    !duplicates.some(d => d.original.relativePath === docsFile.relativePath)
  );

  if (filesWithoutMatches.length > 0) {
    report += `## Files Without Matches (${filesWithoutMatches.length})

These files in /docs/ don't appear to have equivalents in /docs/consolidated/:

`;
    for (const file of filesWithoutMatches.slice(0, 60)) {
      report += `- ${file.relativePath}\n`;
    }
    if (filesWithoutMatches.length > 60) {
      report += `- ... and ${filesWithoutMatches.length - 60} more files\n`;
    }
  }

  report += `\n## Recommended Actions

### Safe to Delete (High Confidence)
These files can likely be safely deleted as they have clear equivalents in /docs/consolidated/:

\`\`\`bash
`;

  for (const duplicate of highConfidence) {
    report += `rm "docs/${duplicate.original.relativePath}"\n`;
  }

  report += `\`\`\`

### Review Required (Medium Confidence)
These files should be manually reviewed before deletion:

`;

  for (const duplicate of mediumConfidence) {
    report += `- ${duplicate.original.relativePath} (${duplicate.consolidated.length} possible matches)\n`;
  }

  report += `\n### Unique Files
Files that don't have matches should be reviewed to determine if they should be:
1. Moved to /docs/consolidated/
2. Kept in their current location
3. Deleted if obsolete

## Next Steps

1. Review high confidence matches and delete duplicates
2. Manually compare medium confidence matches
3. Decide what to do with unique files
4. Update any references to moved/deleted files
5. Run gap analysis again to verify improvements

---

*This report was generated automatically by the documentation file mapping tool.*
`;

  return report;
}

/**
 * Main function
 */
async function generateFileMapping() {
  console.log('📊 Generating documentation file mapping...\n');
  
  try {
    // Get all files from both directories
    console.log('📁 Scanning /docs/ directory...');
    const docsPath = path.join(projectRoot, 'docs');
    const allDocsFiles = await getAllFiles(docsPath);
    
    // Exclude consolidated directory from docs files
    const docsFiles = allDocsFiles.filter(file => 
      !file.relativePath.startsWith('consolidated/')
    );
    
    console.log('📁 Scanning /docs/consolidated/ directory...');
    const consolidatedPath = path.join(projectRoot, 'docs', 'consolidated');
    const consolidatedFiles = await getAllFiles(consolidatedPath);
    
    console.log(`✅ Found ${docsFiles.length} files in /docs/`);
    console.log(`✅ Found ${consolidatedFiles.length} files in /docs/consolidated/`);
    
    // Categorize files
    console.log('📋 Categorizing files...');
    const categories = {
      docs: categorizeFiles(docsFiles, 'docs'),
      consolidated: categorizeFiles(consolidatedFiles, 'docs/consolidated')
    };
    
    // Find potential duplicates
    console.log('🔍 Finding potential duplicates...');
    const duplicates = findPotentialDuplicates(docsFiles, consolidatedFiles);
    
    console.log(`✅ Found ${duplicates.length} potential duplicates`);
    
    // Generate report
    console.log('📄 Generating mapping report...');
    const report = generateMarkdownReport(docsFiles, consolidatedFiles, duplicates, categories);
    
    // Write report
    const reportPath = path.join(projectRoot, 'docs', 'consolidated', 'FILE_MAPPING_REPORT.md');
    await fs.writeFile(reportPath, report, 'utf8');
    
    console.log(`📄 File mapping report written to: ${reportPath}`);
    
    // Display summary
    console.log('\n📊 File Mapping Summary:');
    console.log(`   Files in /docs/: ${docsFiles.length}`);
    console.log(`   Files in /docs/consolidated/: ${consolidatedFiles.length}`);
    console.log(`   Potential duplicates: ${duplicates.length}`);
    
    const highConfidence = duplicates.filter(d => d.confidence === 'high');
    const mediumConfidence = duplicates.filter(d => d.confidence === 'medium');
    
    console.log(`   High confidence matches: ${highConfidence.length}`);
    console.log(`   Medium confidence matches: ${mediumConfidence.length}`);
    
    if (highConfidence.length > 0) {
      console.log('\n🗑️  Files that can likely be safely deleted:');
      for (const duplicate of highConfidence.slice(0, 10)) {
        console.log(`   - docs/${duplicate.original.relativePath}`);
      }
      if (highConfidence.length > 10) {
        console.log(`   ... and ${highConfidence.length - 10} more`);
      }
    }
    
    console.log('\n✅ File mapping analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ File mapping analysis failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Documentation File Mapping Generator

Usage:
  npm run docs:file-mapping

This script:
1. Scans all .md files in /docs/ and /docs/consolidated/
2. Identifies potential duplicates based on name and location
3. Categorizes files by type/directory
4. Generates a comprehensive mapping report
5. Provides recommendations for safe deletion

The report will be saved as docs/consolidated/FILE_MAPPING_REPORT.md
`);
  process.exit(0);
}

generateFileMapping();