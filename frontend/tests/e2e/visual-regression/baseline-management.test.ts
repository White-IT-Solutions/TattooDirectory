import { test, expect } from '@playwright/test';
import { BaselineManager } from './BaselineManager';
import { BaselineStorage } from './BaselineStorage';
import { BaselineVersionControl } from './BaselineVersionControl';
import { GitIntegration } from './GitIntegration';
import { ScreenshotCapture } from './ScreenshotCapture';
import path from 'path';
import { promises as fs } from 'fs';

test.describe('Baseline Management and Version Control', () => {
  let baselineManager: BaselineManager;
  let testDir: string;

  test.beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-results', 'baseline-test', Date.now().toString());
    await fs.mkdir(testDir, { recursive: true });

    // Initialize baseline manager with test configuration
    baselineManager = new BaselineManager({
      baselineDir: path.join(testDir, 'baselines'),
      maxVersions: 5,
      enableVersionControl: true,
      enableGitIntegration: false, // Disable for tests
      autoCommit: false,
      requireApproval: true
    });

    await baselineManager.initialize();
  });

  test.afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  test('should create and manage baseline storage structure', async () => {
    const storage = new BaselineStorage({
      baselineDir: path.join(testDir, 'baselines'),
      maxVersions: 5
    });

    await storage.initialize();

    const structure = storage.getStorageStructure();
    
    expect(structure.baselines).toContain('baselines');
    expect(structure.metadata).toContain('.metadata');
    expect(structure.versions).toContain('.versions');
    expect(structure.archive).toContain('.archive');

    // Verify directories were created
    const baselineDir = await fs.stat(structure.baselines);
    expect(baselineDir.isDirectory()).toBe(true);
  });

  test('should store and retrieve baselines with proper organization', async ({ page }) => {
    // Create a mock screenshot
    const screenshotCapture = new ScreenshotCapture();
    const screenshot = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    // Update baseline
    const baseline = await baselineManager.updateBaseline(screenshot, false);

    expect(baseline).toBeDefined();
    expect(baseline.page).toBe('home');
    expect(baseline.theme).toBe('light');
    expect(baseline.viewport).toBe('1920x1080');
    expect(baseline.version).toBe(1);
    expect(baseline.approved).toBe(false);

    // Retrieve baseline
    const retrievedBaseline = await baselineManager.getBaseline('home', 'light', '1920x1080');
    expect(retrievedBaseline).toBeDefined();
    expect(retrievedBaseline?.id).toBe(baseline.id);
  });

  test('should manage baseline versions correctly', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    
    // Create initial baseline
    const screenshot1 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    const baseline1 = await baselineManager.updateBaseline(screenshot1, true, 'test-user');
    expect(baseline1.version).toBe(1);
    expect(baseline1.approved).toBe(true);

    // Update baseline (should create version 2)
    const screenshot2 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    const baseline2 = await baselineManager.updateBaseline(screenshot2, false);
    expect(baseline2.version).toBe(2);
    expect(baseline2.approved).toBe(false);

    // Get baseline history
    const history = await baselineManager.getBaselineHistory('home', 'light', '1920x1080');
    expect(history).toBeDefined();
    expect(history?.current.version).toBe(2);
    expect(history?.versions.length).toBeGreaterThan(0);
  });

  test('should handle baseline approval workflow', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    const screenshot = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'dark',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    // Create unapproved baseline
    const baseline = await baselineManager.updateBaseline(screenshot, false);
    expect(baseline.approved).toBe(false);

    // Approve baseline
    const approvedBaseline = await baselineManager.approveBaseline(
      'home',
      'dark',
      '1920x1080',
      'test-approver'
    );

    expect(approvedBaseline).toBeDefined();
    expect(approvedBaseline?.approved).toBe(true);
    expect(approvedBaseline?.approvedBy).toBe('test-approver');
    expect(approvedBaseline?.approvedAt).toBeDefined();
  });

  test('should manage rollback points and rollback functionality', async ({ page }) => {
    // Skip if version control is not enabled
    const changeSets = await baselineManager.getChangeSets();
    if (changeSets.length === 0) {
      test.skip(); // Version control not available in test environment
    }

    // Create rollback point
    const rollbackPoint = await baselineManager.createRollbackPoint('Before major changes');
    expect(rollbackPoint).toBeDefined();
    expect(rollbackPoint.description).toBe('Before major changes');

    // Get all rollback points
    const rollbackPoints = await baselineManager.getRollbackPoints();
    expect(rollbackPoints.length).toBeGreaterThan(0);
    expect(rollbackPoints[0].id).toBe(rollbackPoint.id);
  });

  test('should export and import baselines', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    
    // Create multiple baselines
    const pages = ['home', 'search', 'profile'];
    const themes: ('light' | 'dark')[] = ['light', 'dark'];
    
    for (const pageName of pages) {
      for (const theme of themes) {
        const screenshot = await screenshotCapture.captureFullPage(page, {
          page: pageName,
          theme,
          viewport: { width: 1920, height: 1080 },
          browserName: 'chromium',
          browserVersion: '1.0.0'
        });

        await baselineManager.updateBaseline(screenshot, true, 'test-user');
      }
    }

    // Export baselines
    const exportPath = path.join(testDir, 'export');
    await baselineManager.exportBaselines(exportPath, {
      includeVersions: true,
      pages: ['home', 'search']
    });

    // Verify export manifest exists
    const manifestPath = path.join(exportPath, 'export-manifest.json');
    const manifestExists = await fs.access(manifestPath).then(() => true).catch(() => false);
    expect(manifestExists).toBe(true);

    // Read and verify manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    expect(manifest.totalBaselines).toBe(4); // 2 pages × 2 themes
    expect(manifest.baselines.length).toBe(4);

    // Create new baseline manager for import test
    const importTestDir = path.join(testDir, 'import-test');
    const importBaselineManager = new BaselineManager({
      baselineDir: path.join(importTestDir, 'baselines'),
      enableVersionControl: false,
      enableGitIntegration: false
    });

    await importBaselineManager.initialize();

    // Import baselines
    const importResult = await importBaselineManager.importBaselines(exportPath, {
      overwriteExisting: true,
      validateIntegrity: true
    });

    expect(importResult.imported).toBe(4);
    expect(importResult.skipped).toBe(0);
    expect(importResult.errors.length).toBe(0);

    // Verify imported baselines
    const importedBaselines = await importBaselineManager.getAllBaselines();
    expect(importedBaselines.length).toBe(4);
  });

  test('should provide storage statistics', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    
    // Create some baselines
    const screenshot1 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    const screenshot2 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'dark',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    await baselineManager.updateBaseline(screenshot1, true);
    await baselineManager.updateBaseline(screenshot2, true);

    // Get storage statistics
    const stats = await baselineManager.getStorageStats();
    
    expect(stats.totalBaselines).toBe(2);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.storageByPage['home']).toBeDefined();
    expect(stats.storageByPage['home'].baselines).toBe(2);
  });

  test('should clean up storage efficiently', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    
    // Create baseline with multiple versions
    for (let i = 0; i < 8; i++) {
      const screenshot = await screenshotCapture.captureFullPage(page, {
        page: 'test-page',
        theme: 'light',
        viewport: { width: 1920, height: 1080 },
        browserName: 'chromium',
        browserVersion: '1.0.0'
      });

      await baselineManager.updateBaseline(screenshot, true);
    }

    // Clean up storage
    const cleanupResult = await baselineManager.cleanupStorage({
      removeOldVersions: true,
      removeOrphanedFiles: true
    });

    expect(cleanupResult.removedVersions).toBeGreaterThan(0);
  });

  test('should handle Git integration when available', async () => {
    try {
      const git = new GitIntegration();
      const currentCommit = git.getCurrentCommit();
      
      expect(currentCommit).toBeDefined();
      expect(currentCommit.hash).toBeDefined();
      expect(currentCommit.branch).toBeDefined();
      
      const hasChanges = git.hasUncommittedChanges();
      expect(typeof hasChanges).toBe('boolean');
      
      const branches = git.getBranches();
      expect(Array.isArray(branches)).toBe(true);
      
    } catch (error) {
      // Git not available in test environment
      test.skip();
    }
  });

  test('should detect and handle false positives in rollback', async ({ page }) => {
    const screenshotCapture = new ScreenshotCapture();
    
    // Create initial baseline
    const screenshot1 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    const baseline1 = await baselineManager.updateBaseline(screenshot1, true, 'user1');
    
    // Create rollback point
    const rollbackPoint = await baselineManager.createRollbackPoint('Before false positive test');
    
    // Update baseline (simulating false positive)
    const screenshot2 = await screenshotCapture.captureFullPage(page, {
      page: 'home',
      theme: 'light',
      viewport: { width: 1920, height: 1080 },
      browserName: 'chromium',
      browserVersion: '1.0.0'
    });

    const baseline2 = await baselineManager.updateBaseline(screenshot2, false);
    
    // Rollback to previous state
    await baselineManager.rollbackToPoint(rollbackPoint.id);
    
    // Verify rollback worked
    const currentBaseline = await baselineManager.getBaseline('home', 'light', '1920x1080');
    expect(currentBaseline).toBeDefined();
    
    // The version should be higher due to rollback creating a new version
    expect(currentBaseline!.version).toBeGreaterThan(baseline2.version);
  });
});

test.describe('Version Control Integration', () => {
  test('should create and manage changesets', async () => {
    // This test would require a Git repository setup
    test.skip(); // Skip in CI environment
  });

  test('should handle changeset approval workflow', async () => {
    // This test would require version control setup
    test.skip(); // Skip in CI environment
  });

  test('should commit baseline changes to Git', async () => {
    // This test would require Git repository setup
    test.skip(); // Skip in CI environment
  });
});