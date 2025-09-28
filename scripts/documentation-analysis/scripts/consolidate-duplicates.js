#!/usr/bin/env node

/**
 * Documentation Duplicate Consolidation Script
 * Consolidates duplicate documentation files by keeping the consolidated version
 * and removing or redirecting the original versions
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

// Duplicate file mappings (original -> consolidated)
const DUPLICATE_MAPPINGS = {
  // Workflow files
  'docs/workflows/testing-strategies.md': 'docs/consolidated/development/testing/strategies.md',
  'docs/workflows/monitoring.md': 'docs/consolidated/deployment/monitoring.md',
  'docs/workflows/deployment-process.md': 'docs/consolidated/deployment/process.md',
  'docs/workflows/data-management.md': 'docs/consolidated/development/data-management.md',
  
  // Setup files
  'docs/setup/local-development.md': 'docs/consolidated/development/local-setup.md',
  'docs/setup/docker-setup.md': 'docs/consolidated/getting-started/docker-setup.md',
  'docs/setup/dependencies.md': 'docs/consolidated/getting-started/dependencies.md',
  
  // Script documentation
  'docs/scripts/README_DATA_SEEDER.md': 'docs/consolidated/development/scripts/data-seeder.md',
  'docs/scripts/DATA-MANAGEMENT.md': 'docs/consolidated/development/data-management.md',
  'docs/scripts/error-handling-fix-summary.md': 'docs/consolidated/troubleshooting/error-handling.md',
  
  // Reference files
  'docs/reference/command-reference.md': 'docs/consolidated/reference/commands.md',
  
  // Planning files
  'docs/planning/TROUBLESHOOTING.md': 'docs/consolidated/troubleshooting/README.md',
  'docs/planning/terraform-deployment-guide.md': 'docs/consolidated/deployment/terraform.md',
  'docs/planning/CI-CD Implementation.md': 'docs/consolidated/deployment/ci-cd.md',
  'docs/planning/API_DOCUMENTATION.md': 'docs/consolidated/reference/api-documentation.md',
  
  // LocalStack files
  'docs/localstack/README_LOCAL.md': 'docs/consolidated/development/localstack-setup.md',
  
  // Component documentation
  'docs/frontend/README_FRONTEND.md': 'docs/consolidated/development/frontend/README.md',
  'docs/frontend/README_DOCKER.md': 'docs/consolidated/development/frontend/docker-setup.md',
  'docs/backend/README_BACKEND.md': 'docs/consolidated/development/backend/README.md',
  'docs/devtools/README-DEVTOOLS.md': 'docs/consolidated/development/scripts/devtools.md',
  
  // Architecture files
  'docs/architecture/system-overview.md': 'docs/consolidated/architecture/system-overview.md',
  'docs/architecture/data-models.md': 'docs/consolidated/architecture/data-models.md',
  'docs/architecture/api-design.md': 'docs/consolidated/architecture/api-design.md',
  
  // Backup files (should be removed)
  'docs/backups/README_DATA_SEEDER.md': null, // Remove - duplicate of scripts version
  'docs/backups/DATA-MANAGEMENT.md': null, // Remove - duplicate of scripts version
  
  // Diagram files
  'docs/diagrams_as_code/User Interaction Sequence Diagram (Search).md': 'docs/consolidated/architecture/diagrams/source/User Interaction Sequence Diagram (Search).md',
  'docs/diagrams_as_code/State Machine Diagram (AWS Step Functions).md': 'docs/consolidated/architecture/diagrams/source/State Machine Diagram (AWS Step Functions).md',
  'docs/diagrams_as_code/Observability & Alerting Flow Diagram.md': 'docs/consolidated/architecture/diagrams/source/Observability & Alerting Flow Diagram.md',
  'docs/diagrams_as_code/Network Architecture Diagram (VPC).md': 'docs/consolidated/architecture/diagrams/source/Network Architecture Diagram (VPC).md',
  'docs/diagrams_as_code/Multi-Account Architecture.md': 'docs/consolidated/architecture/diagrams/source/Multi-Account Architecture.md',
  'docs/diagrams_as_code/Logging Architecture.md': 'docs/consolidated/architecture/diagrams/source/Logging Architecture.md',
  'docs/diagrams_as_code/Image Ingestion and Display.md': 'docs/consolidated/architecture/diagrams/source/Image Ingestion and Display.md',
  'docs/diagrams_as_code/High Level Overview.md': 'docs/consolidated/architecture/diagrams/source/High Level Overview.md',
  'docs/diagrams_as_code/Feature Dependency Map.md': 'docs/consolidated/architecture/diagrams/source/Feature Dependency Map.md',
  'docs/diagrams_as_code/Data Model Diagram (DynamoDB Single-Table Design).md': 'docs/consolidated/architecture/diagrams/source/Data Model Diagram (DynamoDB Single-Table Design).md',
  'docs/diagrams_as_code/Data Governance & Takedown Process Diagram.md': 'docs/consolidated/architecture/diagrams/source/Data Governance & Takedown Process Diagram.md',
  'docs/diagrams_as_code/Data Aggregation Sequence Diagram.md': 'docs/consolidated/architecture/diagrams/source/Data Aggregation Sequence Diagram.md',
  'docs/diagrams_as_code/CICD Pipeline Diagram.md': 'docs/consolidated/architecture/diagrams/source/CICD Pipeline Diagram.md',
  'docs/diagrams_as_code/C4 Model Level 3 - Components.md': 'docs/consolidated/architecture/diagrams/source/C4 Model Level 3 - Components.md',
  'docs/diagrams_as_code/C4 Model Level 2 - Containers.md': 'docs/consolidated/architecture/diagrams/source/C4 Model Level 2 - Containers.md',
  'docs/diagrams_as_code/C4 Model Level 1 - System Context.md': 'docs/consolidated/architecture/diagrams/source/C4 Model Level 1 - System Context.md',
  'docs/diagrams_as_code/Backup and Disaster Recovery.md': 'docs/consolidated/architecture/diagrams/source/Backup and Disaster Recovery.md',
  'docs/diagrams_as_code/AWS Configured Access.md': 'docs/consolidated/architecture/diagrams/source/AWS Configured Access.md',
  'docs/diagrams_as_code/AWS Amplify Architecture.md': 'docs/consolidated/architecture/diagrams/source/AWS Amplify Architecture.md',
  
  // LocalStack troubleshooting files
  'docs/localstack/troubleshooting/VIDEO-TUTORIALS-GUIDE.md': 'docs/consolidated/troubleshooting/localstack/VIDEO-TUTORIALS-GUIDE.md',
  'docs/localstack/troubleshooting/TROUBLESHOOTING_MASTER.md': 'docs/consolidated/troubleshooting/localstack/TROUBLESHOOTING_MASTER.md',
  'docs/localstack/troubleshooting/SECURITY-GUIDELINES.md': 'docs/consolidated/troubleshooting/localstack/SECURITY-GUIDELINES.md',
  'docs/localstack/troubleshooting/PERFORMANCE_MONITORING.md': 'docs/consolidated/troubleshooting/localstack/PERFORMANCE_MONITORING.md',
  'docs/localstack/troubleshooting/MONITORING_SYSTEM.md': 'docs/consolidated/troubleshooting/localstack/MONITORING_SYSTEM.md',
  'docs/localstack/troubleshooting/BEST-PRACTICES.md': 'docs/consolidated/troubleshooting/localstack/BEST-PRACTICES.md',
  'docs/localstack/troubleshooting/API_TESTING_GUIDE.md': 'docs/consolidated/troubleshooting/localstack/API_TESTING_GUIDE.md'
};

/**
 * Main function to consolidate duplicates
 */
async function consolidateDuplicates() {
  console.log('🔄 Starting documentation duplicate consolidation...\n');
  
  // Check for dry-run mode
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    const stats = {
      filesProcessed: 0,
      filesRemoved: 0,
      redirectsCreated: 0,
      errorsEncountered: 0
    };

    // Get duplicates from gap analysis report first
    const duplicatesFromReport = await getDuplicatesFromGapAnalysis();
    const allDuplicates = { ...DUPLICATE_MAPPINGS, ...duplicatesFromReport };

    console.log(`📋 Found ${Object.keys(allDuplicates).length} duplicate mappings to process\n`);

    for (const [originalPath, consolidatedPath] of Object.entries(allDuplicates)) {
      try {
        console.log(`🔍 Processing: ${originalPath}`);
        
        const originalFullPath = path.join(projectRoot, originalPath);
        
        // Check if original file exists
        try {
          await fs.access(originalFullPath);
        } catch (error) {
          console.log(`  ℹ️  Original file doesn't exist, skipping`);
          continue;
        }

        if (consolidatedPath === null) {
          // Remove the file (it's a backup/duplicate that should be deleted)
          if (isDryRun) {
            console.log(`  🗑️  Would remove duplicate file`);
          } else {
            await fs.unlink(originalFullPath);
            console.log(`  🗑️  Removed duplicate file`);
          }
          stats.filesRemoved++;
        } else {
          // Check if consolidated file exists
          const consolidatedFullPath = path.join(projectRoot, consolidatedPath);
          try {
            await fs.access(consolidatedFullPath);
            
            // Both files exist, create a redirect and remove original
            if (isDryRun) {
              console.log(`  ↪️  Would create redirect to ${consolidatedPath}`);
            } else {
              await createRedirectFile(originalFullPath, consolidatedPath);
              console.log(`  ↪️  Created redirect to ${consolidatedPath}`);
            }
            stats.redirectsCreated++;
          } catch (error) {
            // Consolidated file doesn't exist, move original to consolidated location
            if (isDryRun) {
              console.log(`  📦 Would move to consolidated location: ${consolidatedPath}`);
            } else {
              await fs.mkdir(path.dirname(consolidatedFullPath), { recursive: true });
              await fs.rename(originalFullPath, consolidatedFullPath);
              console.log(`  📦 Moved to consolidated location: ${consolidatedPath}`);
            }
          }
        }
        
        stats.filesProcessed++;
        
      } catch (error) {
        console.error(`  ❌ Error processing ${originalPath}:`, error.message);
        stats.errorsEncountered++;
      }
    }

    // Update table of contents and navigation files
    if (!isDryRun) {
      await updateNavigationFiles();
    } else {
      console.log('\n📝 Would update navigation files...');
    }

    // Summary
    console.log('\n📊 Consolidation Summary:');
    console.log(`   Files Processed: ${stats.filesProcessed}`);
    console.log(`   Files Removed: ${stats.filesRemoved}`);
    console.log(`   Redirects Created: ${stats.redirectsCreated}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    if (stats.filesProcessed > 0) {
      console.log('\n✅ Documentation duplicate consolidation completed successfully!');
      console.log('💡 Run the gap analysis again to verify improvements: npm run gap-analysis');
    } else {
      console.log('\n✅ No duplicate files found to consolidate!');
    }

  } catch (error) {
    console.error('❌ Consolidation process failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
  }
}

/**
 * Get duplicates from the gap analysis report
 */
async function getDuplicatesFromGapAnalysis() {
  const duplicatesFromReport = {};
  
  try {
    const gapReportPath = path.join(projectRoot, 'docs/consolidated/GAP_ANALYSIS_REPORT.md');
    const gapReportContent = await fs.readFile(gapReportPath, 'utf8');
    
    // Parse the inconsistencies section for duplicate content
    const lines = gapReportContent.split('\n');
    let inInconsistenciesSection = false;
    let inDuplicateContentSection = false;
    let affectedFiles = [];
    
    for (const line of lines) {
      if (line.startsWith('## Documentation Inconsistencies')) {
        inInconsistenciesSection = true;
        continue;
      }
      
      if (inInconsistenciesSection && line.startsWith('### duplicate-content')) {
        inDuplicateContentSection = true;
        continue;
      }
      
      if (inDuplicateContentSection && line.startsWith('**Affected Files:**')) {
        // Next lines will contain the affected files
        continue;
      }
      
      if (inDuplicateContentSection && line.startsWith('- ')) {
        const filePath = line.substring(2).trim();
        if (filePath && !filePath.startsWith('...')) {
          affectedFiles.push(filePath);
        }
      }
      
      if (inDuplicateContentSection && (line.startsWith('### ') || line.startsWith('## '))) {
        // End of duplicate content section
        break;
      }
    }
    
    // Process affected files - assume first is consolidated, others are duplicates
    if (affectedFiles.length >= 2) {
      const consolidatedFile = affectedFiles.find(f => f.includes('docs\\consolidated\\') || f.includes('docs/consolidated/'));
      const duplicateFiles = affectedFiles.filter(f => f !== consolidatedFile);
      
      for (const duplicateFile of duplicateFiles) {
        if (consolidatedFile) {
          // Convert Windows paths to Unix paths for consistency
          const normalizedDuplicate = duplicateFile.replace(/\\/g, '/');
          const normalizedConsolidated = consolidatedFile.replace(/\\/g, '/');
          duplicatesFromReport[normalizedDuplicate] = normalizedConsolidated;
        }
      }
    }
    
    console.log(`📊 Found ${Object.keys(duplicatesFromReport).length} duplicates from gap analysis report`);
    
  } catch (error) {
    console.log('⚠️  Could not read gap analysis report, using hardcoded mappings only');
  }
  
  return duplicatesFromReport;
}

/**
 * Create a redirect file that points to the consolidated location
 */
async function createRedirectFile(originalPath, consolidatedPath) {
  const redirectContent = `# Documentation Moved

This documentation has been consolidated and moved to: [${path.basename(consolidatedPath)}](${getRelativePath(originalPath, consolidatedPath)})

Please update your bookmarks and references to use the new location.

---

*This file was automatically generated during documentation consolidation.*
`;

  await fs.writeFile(originalPath, redirectContent, 'utf8');
}

/**
 * Get relative path from one file to another
 */
function getRelativePath(fromPath, toPath) {
  const fromDir = path.dirname(fromPath);
  const relativePath = path.relative(fromDir, toPath);
  return relativePath.replace(/\\/g, '/'); // Normalize to forward slashes for markdown
}

/**
 * Update navigation files to reflect the new structure
 */
async function updateNavigationFiles() {
  console.log('\n📝 Updating navigation files...');
  
  // Update the main table of contents
  const tocPath = path.join(projectRoot, 'docs/consolidated/TABLE_OF_CONTENTS.md');
  try {
    await fs.access(tocPath);
    console.log('  ✅ Table of contents exists and will be updated by next gap analysis');
  } catch (error) {
    console.log('  ℹ️  Table of contents will be created by next gap analysis');
  }

  // Update main README to point to consolidated docs
  const mainReadmePath = path.join(projectRoot, 'README.md');
  try {
    let readmeContent = await fs.readFile(mainReadmePath, 'utf8');
    
    // Update documentation links to point to consolidated versions
    const docLinkUpdates = {
      'docs/README.md': 'docs/consolidated/README.md',
      'docs/QUICK_START.md': 'docs/consolidated/getting-started/README.md',
      'docs/setup/': 'docs/consolidated/getting-started/',
      'docs/architecture/': 'docs/consolidated/architecture/',
      'docs/reference/': 'docs/consolidated/reference/'
    };

    let updated = false;
    for (const [oldLink, newLink] of Object.entries(docLinkUpdates)) {
      if (readmeContent.includes(oldLink)) {
        readmeContent = readmeContent.replace(new RegExp(escapeRegExp(oldLink), 'g'), newLink);
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(mainReadmePath, readmeContent, 'utf8');
      console.log('  ✅ Updated main README.md with consolidated links');
    }
  } catch (error) {
    console.log('  ⚠️  Could not update main README.md:', error.message);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Documentation Duplicate Consolidation

Usage:
  npm run consolidate-duplicates

This script:
1. Identifies duplicate documentation files
2. Keeps the consolidated version in docs/consolidated/
3. Creates redirects or removes original files
4. Updates navigation and reference files
5. Provides a summary of changes made

Options:
  --dry-run    Show what would be done without making changes

Environment Variables:
  DEBUG=1    Show detailed error information
`);
  process.exit(0);
}

consolidateDuplicates();