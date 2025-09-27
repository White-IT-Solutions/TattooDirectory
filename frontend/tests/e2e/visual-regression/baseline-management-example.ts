/**
 * Comprehensive example of baseline management and version control features
 * 
 * This file demonstrates how to use the enhanced baseline management system
 * with version control, Git integration, and rollback capabilities.
 */

import { BaselineManager } from './BaselineManager';
import { BaselineStorage } from './BaselineStorage';
import { BaselineVersionControl } from './BaselineVersionControl';
import { GitIntegration } from './GitIntegration';
import { ScreenshotCapture } from './ScreenshotCapture';
import { Page } from '@playwright/test';

/**
 * Example 1: Basic Baseline Management Setup
 */
export async function setupBaselineManager(): Promise<BaselineManager> {
  const baselineManager = new BaselineManager({
    baselineDir: 'test-results/baselines',
    maxVersions: 10,
    enableVersionControl: true,
    enableGitIntegration: true,
    autoCommit: false,
    requireApproval: true
  });

  await baselineManager.initialize();
  
  console.log('✅ Baseline manager initialized with version control');
  return baselineManager;
}

/**
 * Example 2: Creating and Managing Baselines
 */
export async function createBaselinesExample(
  page: Page,
  baselineManager: BaselineManager
): Promise<void> {
  const screenshotCapture = new ScreenshotCapture();
  
  // Define test scenarios
  const scenarios = [
    { page: 'home', theme: 'light' as const, viewport: { width: 1920, height: 1080 } },
    { page: 'home', theme: 'dark' as const, viewport: { width: 1920, height: 1080 } },
    { page: 'search', theme: 'light' as const, viewport: { width: 1920, height: 1080 } },
    { page: 'search', theme: 'dark' as const, viewport: { width: 1920, height: 1080 } },
    { page: 'profile', theme: 'light' as const, viewport: { width: 768, height: 1024 } },
    { page: 'profile', theme: 'dark' as const, viewport: { width: 768, height: 1024 } }
  ];

  console.log('📸 Creating baselines for all scenarios...');

  for (const scenario of scenarios) {
    // Navigate to page and set theme
    await page.goto(`/${scenario.page}`);
    await page.evaluate((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    }, scenario.theme);

    // Set viewport
    await page.setViewportSize(scenario.viewport);

    // Capture screenshot
    const screenshot = await screenshotCapture.captureFullPage(page, {
      page: scenario.page,
      theme: scenario.theme,
      viewport: scenario.viewport,
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    // Create baseline (unapproved initially)
    const baseline = await baselineManager.updateBaseline(screenshot, false);
    
    console.log(`📝 Created baseline: ${baseline.page}/${baseline.theme}/${baseline.viewport} (v${baseline.version})`);
  }

  console.log('✅ All baselines created successfully');
}

/**
 * Example 3: Baseline Approval Workflow
 */
export async function baselineApprovalWorkflow(
  baselineManager: BaselineManager
): Promise<void> {
  console.log('🔍 Starting baseline approval workflow...');

  // Get all unapproved baselines
  const allBaselines = await baselineManager.getAllBaselines();
  const unapprovedBaselines = allBaselines.filter(b => !b.approved);

  console.log(`Found ${unapprovedBaselines.length} unapproved baselines`);

  // Get pending changesets
  const changeSets = await baselineManager.getChangeSets(10);
  const pendingChangeSets = changeSets.filter(cs => !cs.approved);

  console.log(`Found ${pendingChangeSets.length} pending changesets`);

  // Approve each changeset
  for (const changeSet of pendingChangeSets) {
    console.log(`📋 Reviewing changeset: ${changeSet.id}`);
    console.log(`   - ${changeSet.changes.length} changes`);
    console.log(`   - Branch: ${changeSet.branch}`);
    console.log(`   - Created: ${changeSet.timestamp}`);

    // In a real scenario, you would review the changes here
    // For this example, we'll auto-approve
    const approvedChangeSet = await baselineManager.approveChangeSet(
      changeSet.id,
      'automated-reviewer',
      true // Auto-commit
    );

    console.log(`✅ Approved changeset: ${approvedChangeSet?.id}`);
  }

  // Alternatively, approve individual baselines
  for (const baseline of unapprovedBaselines.slice(0, 2)) {
    const approved = await baselineManager.approveBaseline(
      baseline.page,
      baseline.theme,
      baseline.viewport,
      'manual-reviewer'
    );

    console.log(`✅ Approved baseline: ${approved?.page}/${approved?.theme}/${approved?.viewport}`);
  }

  console.log('✅ Approval workflow completed');
}

/**
 * Example 4: Version Control and Rollback
 */
export async function versionControlExample(
  baselineManager: BaselineManager
): Promise<void> {
  console.log('🔄 Demonstrating version control features...');

  // Create a rollback point before making changes
  const rollbackPoint = await baselineManager.createRollbackPoint(
    'Before UI redesign changes'
  );
  console.log(`🔖 Created rollback point: ${rollbackPoint.id}`);

  // Simulate making changes that need to be rolled back
  console.log('⚠️  Simulating problematic changes...');

  // Get current baselines
  const baselines = await baselineManager.getAllBaselines();
  console.log(`Current baselines: ${baselines.length}`);

  // Show rollback points
  const rollbackPoints = await baselineManager.getRollbackPoints();
  console.log(`Available rollback points: ${rollbackPoints.length}`);

  for (const rp of rollbackPoints.slice(0, 3)) {
    console.log(`   - ${rp.id}: ${rp.description} (${rp.timestamp})`);
  }

  // Demonstrate rollback (in a real scenario, you'd only do this when needed)
  if (rollbackPoints.length > 1) {
    const targetRollback = rollbackPoints[1]; // Use second-most recent
    console.log(`🔄 Rolling back to: ${targetRollback.description}`);
    
    try {
      await baselineManager.rollbackToPoint(targetRollback.id);
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.log(`⚠️  Rollback skipped (test environment): ${error}`);
    }
  }

  console.log('✅ Version control demonstration completed');
}

/**
 * Example 5: Storage Management and Cleanup
 */
export async function storageManagementExample(
  baselineManager: BaselineManager
): Promise<void> {
  console.log('🧹 Demonstrating storage management...');

  // Get storage statistics
  const stats = await baselineManager.getStorageStats();
  console.log('📊 Storage Statistics:');
  console.log(`   - Total baselines: ${stats.totalBaselines}`);
  console.log(`   - Total versions: ${stats.totalVersions}`);
  console.log(`   - Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - Date range: ${stats.oldestBaseline} to ${stats.newestBaseline}`);

  // Show per-page statistics
  console.log('📄 Per-page statistics:');
  for (const [page, pageStats] of Object.entries(stats.storageByPage)) {
    console.log(`   - ${page}: ${pageStats.baselines} baselines, ${pageStats.versions} versions, ${(pageStats.size / 1024).toFixed(2)} KB`);
  }

  // Clean up old versions
  console.log('🧹 Cleaning up storage...');
  const cleanupResult = await baselineManager.cleanupStorage({
    removeOldVersions: true,
    removeOrphanedFiles: true,
    compressOldVersions: true,
    maxAge: 30 // Remove baselines older than 30 days
  });

  console.log('🧹 Cleanup Results:');
  console.log(`   - Removed versions: ${cleanupResult.removedVersions}`);
  console.log(`   - Removed orphans: ${cleanupResult.removedOrphans}`);
  console.log(`   - Compressed files: ${cleanupResult.compressedFiles}`);
  console.log(`   - Freed space: ${(cleanupResult.freedSpace / 1024 / 1024).toFixed(2)} MB`);

  console.log('✅ Storage management completed');
}

/**
 * Example 6: Export and Import Baselines
 */
export async function exportImportExample(
  baselineManager: BaselineManager
): Promise<void> {
  console.log('📦 Demonstrating export/import functionality...');

  // Export all baselines
  const exportPath = 'test-results/baseline-export';
  await baselineManager.exportBaselines(exportPath, {
    includeVersions: true,
    compress: true,
    pages: ['home', 'search'], // Only export specific pages
    themes: ['light', 'dark']
  });

  console.log(`📦 Exported baselines to: ${exportPath}`);

  // In a real scenario, you might import to a different environment
  console.log('📥 Import would be used in different environment or for backup restoration');
  
  // Example import (commented out to avoid conflicts in demo)
  /*
  const importResult = await baselineManager.importBaselines(exportPath, {
    overwriteExisting: false,
    validateIntegrity: true
  });

  console.log('📥 Import Results:');
  console.log(`   - Imported: ${importResult.imported}`);
  console.log(`   - Skipped: ${importResult.skipped}`);
  console.log(`   - Errors: ${importResult.errors.length}`);
  */

  console.log('✅ Export/import demonstration completed');
}

/**
 * Example 7: Git Integration Features
 */
export async function gitIntegrationExample(): Promise<void> {
  console.log('🔧 Demonstrating Git integration...');

  try {
    const git = new GitIntegration();

    // Get current commit information
    const currentCommit = git.getCurrentCommit();
    console.log('📝 Current Commit:');
    console.log(`   - Hash: ${currentCommit.shortHash}`);
    console.log(`   - Author: ${currentCommit.author}`);
    console.log(`   - Branch: ${currentCommit.branch}`);
    console.log(`   - Message: ${currentCommit.message}`);
    console.log(`   - Date: ${currentCommit.date}`);

    // Check for uncommitted changes
    const hasChanges = git.hasUncommittedChanges();
    console.log(`🔍 Has uncommitted changes: ${hasChanges}`);

    if (hasChanges) {
      const changedFiles = git.getChangedFiles();
      console.log(`📄 Changed files: ${changedFiles.length}`);
      
      for (const file of changedFiles.slice(0, 5)) {
        console.log(`   - ${file.status}: ${file.path}`);
      }
    }

    // Get available branches
    const branches = git.getBranches();
    console.log(`🌿 Available branches: ${branches.length}`);
    for (const branch of branches.slice(0, 5)) {
      console.log(`   - ${branch}`);
    }

    // Check Git LFS availability
    const hasLFS = git.isLFSAvailable();
    console.log(`📦 Git LFS available: ${hasLFS}`);

    console.log('✅ Git integration demonstration completed');
  } catch (error) {
    console.log(`⚠️  Git integration not available: ${error}`);
  }
}

/**
 * Example 8: Change Detection and History
 */
export async function changeDetectionExample(
  baselineManager: BaselineManager
): Promise<void> {
  console.log('🔍 Demonstrating change detection...');

  // Detect current changes
  const changes = await baselineManager.detectChanges();
  console.log(`📄 Detected changes: ${changes.length}`);

  for (const change of changes.slice(0, 5)) {
    console.log(`   - ${change.type}: ${change.page}/${change.theme}/${change.viewport}`);
  }

  // Get change history for specific baseline
  const history = await baselineManager.getBaselineChangeHistory('home', 'light', '1920x1080');
  console.log(`📚 Change history for home/light/1920x1080: ${history.length} entries`);

  for (const entry of history.slice(0, 3)) {
    console.log(`   - ${entry.timestamp}: ${entry.changes.length} changes (${entry.approved ? 'approved' : 'pending'})`);
  }

  // Get all recent changesets
  const recentChangeSets = await baselineManager.getChangeSets(5);
  console.log(`📋 Recent changesets: ${recentChangeSets.length}`);

  for (const cs of recentChangeSets) {
    const status = cs.approved ? '✅ approved' : '⏳ pending';
    console.log(`   - ${cs.id}: ${cs.changes.length} changes ${status}`);
  }

  console.log('✅ Change detection demonstration completed');
}

/**
 * Complete demonstration workflow
 */
export async function runCompleteDemo(page: Page): Promise<void> {
  console.log('🚀 Starting complete baseline management demonstration...\n');

  try {
    // 1. Setup
    const baselineManager = await setupBaselineManager();
    console.log('');

    // 2. Create baselines
    await createBaselinesExample(page, baselineManager);
    console.log('');

    // 3. Approval workflow
    await baselineApprovalWorkflow(baselineManager);
    console.log('');

    // 4. Version control
    await versionControlExample(baselineManager);
    console.log('');

    // 5. Storage management
    await storageManagementExample(baselineManager);
    console.log('');

    // 6. Export/import
    await exportImportExample(baselineManager);
    console.log('');

    // 7. Git integration
    await gitIntegrationExample();
    console.log('');

    // 8. Change detection
    await changeDetectionExample(baselineManager);
    console.log('');

    console.log('🎉 Complete demonstration finished successfully!');
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    throw error;
  }
}

/**
 * Usage in a Playwright test:
 * 
 * ```typescript
 * import { test } from '@playwright/test';
 * import { runCompleteDemo } from './baseline-management-example';
 * 
 * test('baseline management demo', async ({ page }) => {
 *   await runCompleteDemo(page);
 * });
 * ```
 */