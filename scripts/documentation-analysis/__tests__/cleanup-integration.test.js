const fs = require('fs').promises;
const path = require('path');
const DocumentationCleanup = require('../cleanup-old-docs.js');

describe('Cleanup Integration Tests', () => {
  const testProjectRoot = path.resolve(__dirname, '../../..');
  
  describe('Reference Validation', () => {
    test('should not break valid documentation references after cleanup', async () => {
      // Run cleanup in dry run mode
      const cleanup = new DocumentationCleanup({
        projectRoot: testProjectRoot,
        dryRun: true,
        backupDir: path.join(__dirname, 'test-backups')
      });

      await cleanup.run();

      // Verify that important documentation files are not marked for removal
      const importantFiles = [
        'docs/README.md',
        'docs/QUICK_START.md',
        'docs/architecture/system-overview.md',
        'docs/architecture/api-design.md',
        'docs/architecture/data-models.md',
        'docs/workflows/deployment-process.md',
        'docs/workflows/testing-strategies.md',
        'docs/workflows/monitoring.md',
        'docs/workflows/data-management.md',
        'docs/setup/local-development.md',
        'docs/setup/docker-setup.md',
        'docs/setup/dependencies.md',
        'docs/setup/frontend-only.md',
        'docs/components/frontend/README.md',
        'docs/components/backend/README.md',
        'docs/components/infrastructure/README.md',
        'docs/components/scripts/README.md',
        'docs/reference/command-reference.md'
      ];

      const filesToRemove = cleanup.filesToRemove.map(f => 
        path.relative(testProjectRoot, f).replace(/\\/g, '/')
      );

      for (const importantFile of importantFiles) {
        expect(filesToRemove).not.toContain(importantFile);
      }
    });

    test('should identify correct number of moved files', async () => {
      const cleanup = new DocumentationCleanup({
        projectRoot: testProjectRoot,
        dryRun: true,
        backupDir: path.join(__dirname, 'test-backups')
      });

      await cleanup.run();

      // Should find moved files but not too many
      expect(cleanup.movedFiles.length).toBeGreaterThan(30);
      expect(cleanup.movedFiles.length).toBeLessThan(100);
      
      // Should find some duplicate files
      expect(cleanup.filesToRemove.length).toBeGreaterThan(cleanup.movedFiles.length);
    });

    test('should generate comprehensive report', async () => {
      const cleanup = new DocumentationCleanup({
        projectRoot: testProjectRoot,
        dryRun: true,
        backupDir: path.join(__dirname, 'test-backups')
      });

      await cleanup.run();
      const reportPath = await cleanup.generateReport();

      expect(reportPath).toBeTruthy();
      
      const reportContent = await fs.readFile(reportPath, 'utf8');
      expect(reportContent).toContain('# Documentation Cleanup Report');
      expect(reportContent).toContain('Files removed:');
      expect(reportContent).toContain('DRY RUN');
      
      // Clean up test report
      try {
        await fs.unlink(reportPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  describe('Safety Checks', () => {
    test('should not remove files without moved markers', async () => {
      const cleanup = new DocumentationCleanup({
        projectRoot: testProjectRoot,
        dryRun: true,
        backupDir: path.join(__dirname, 'test-backups')
      });

      await cleanup.findMovedFiles();

      // All files in filesToRemove should actually contain moved markers
      for (const file of cleanup.filesToRemove) {
        const content = await fs.readFile(file, 'utf8');
        const hasMovedMarker = content.includes('✅ MOVED:') || 
                              content.includes('<!-- MOVED:') || 
                              content.includes('# MOVED:') ||
                              content.includes('This file has been moved') ||
                              content.includes('Content moved to');
        
        expect(hasMovedMarker).toBe(true);
      }
    });

    test('should handle non-existent directories gracefully', async () => {
      const cleanup = new DocumentationCleanup({
        projectRoot: '/non/existent/path',
        dryRun: true,
        backupDir: path.join(__dirname, 'test-backups')
      });

      // Should not throw error
      await expect(cleanup.findMovedFiles()).resolves.not.toThrow();
      expect(cleanup.filesToRemove.length).toBe(0);
    });
  });

  describe('Backup Functionality', () => {
    test('should create backup directory structure', async () => {
      const backupDir = path.join(__dirname, 'test-backups-temp');
      const cleanup = new DocumentationCleanup({
        projectRoot: testProjectRoot,
        dryRun: false,
        backupDir: backupDir
      });

      // Add a test file to remove list
      const testFile = path.join(testProjectRoot, 'temp_test_file.md');
      await fs.writeFile(testFile, '# Test\n\n✅ MOVED: This is a test file');
      
      cleanup.filesToRemove.push(testFile);

      try {
        await cleanup.createBackup();

        // Check that backup directory was created
        const backupContents = await fs.readdir(backupDir);
        const backupFolders = backupContents.filter(item => item.startsWith('cleanup-'));
        expect(backupFolders.length).toBeGreaterThan(0);

        // Clean up
        await fs.unlink(testFile);
        await fs.rmdir(backupDir, { recursive: true });
      } catch (error) {
        // Clean up on error
        try {
          await fs.unlink(testFile);
          await fs.rmdir(backupDir, { recursive: true });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });
});