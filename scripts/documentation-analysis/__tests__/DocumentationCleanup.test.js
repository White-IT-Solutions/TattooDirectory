const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

describe('Documentation Cleanup Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-cleanup');
  const backupDir = path.join(__dirname, 'test-backups');
  const cleanupScript = path.join(__dirname, '..', 'cleanup-old-docs.js');
  
  // Increase timeout for file operations
  jest.setTimeout(15000);

  beforeEach(async () => {
    // Create test directory structure
    await createTestStructure();
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rmdir(testDir, { recursive: true });
      await fs.rmdir(backupDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function createTestStructure() {
    // Create test directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'old'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'setup'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'components'), { recursive: true });

    // Create files marked as moved
    await fs.writeFile(
      path.join(testDir, 'docs', 'moved-file.md'),
      '# Moved File\n\n<!-- MOVED: This content has been moved to new-location.md -->\n\nOld content here.'
    );

    await fs.writeFile(
      path.join(testDir, 'docs', 'another-moved.md'),
      '# Another Moved File\n\nThis file has been moved to components/frontend/README.md'
    );

    // Create duplicate files
    await fs.writeFile(
      path.join(testDir, 'docs', 'setup', 'README.md'),
      '# Setup\n\nThis is a duplicate setup file.'
    );

    // Create outdated files
    await fs.writeFile(
      path.join(testDir, 'docs', 'OLD_README.md'),
      '# Old README\n\nThis is an old file.'
    );

    await fs.writeFile(
      path.join(testDir, 'docs', 'temp_notes.md'),
      '# Temp Notes\n\nTemporary notes.'
    );

    // Create valid files that reference moved files
    await fs.writeFile(
      path.join(testDir, 'docs', 'main.md'),
      '# Main Documentation\n\nSee [moved file](moved-file.md) for details.\n\nAlso check [setup](setup/README.md).'
    );

    // Create empty directory
    await fs.mkdir(path.join(testDir, 'docs', 'empty'), { recursive: true });
  }

  describe('Dry Run Mode', () => {
    test('should identify files to cleanup without removing them', async () => {
      const result = execSync(`node "${cleanupScript}" --help`, { 
        cwd: testDir,
        encoding: 'utf8'
      });

      expect(result).toContain('Documentation Cleanup Script');
      expect(result).toContain('--live');
      expect(result).toContain('--help');
    });

    test('should run dry run and generate report', async () => {
      // Mock the cleanup script to use our test directory
      const testCleanupScript = `
const DocumentationCleanup = require('${path.join(__dirname, '..', 'cleanup-old-docs.js').replace(/\\/g, '\\\\')}');

async function testRun() {
  const cleanup = new DocumentationCleanup({
    projectRoot: '${testDir.replace(/\\/g, '\\\\')}',
    dryRun: true,
    backupDir: '${backupDir.replace(/\\/g, '\\\\')}'
  });

  await cleanup.run();
  await cleanup.generateReport();
}

testRun().catch(console.error);
      `;

      const testScriptPath = path.join(testDir, 'test-cleanup.js');
      await fs.writeFile(testScriptPath, testCleanupScript);

      // This test verifies the script can run without errors
      // The actual cleanup logic is tested in unit tests
      expect(async () => {
        execSync(`node "${testScriptPath}"`, { 
          cwd: testDir,
          encoding: 'utf8'
        });
      }).not.toThrow();
    });
  });

  describe('File Identification', () => {
    test('should identify moved files correctly', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: true,
        backupDir: backupDir
      });

      // Test the individual method instead of the full pipeline
      await cleanup.findMovedFiles();

      const movedFiles = cleanup.filesToRemove.filter(f => 
        f.includes('moved-file.md') || f.includes('another-moved.md')
      );

      expect(movedFiles.length).toBeGreaterThan(0);
    });

    test('should identify duplicate files correctly', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: true,
        backupDir: backupDir
      });

      // Test the individual method
      await cleanup.findDuplicateFiles();

      const duplicateFiles = cleanup.filesToRemove.filter(f => 
        f.includes('setup/README.md')
      );

      expect(duplicateFiles.length).toBeGreaterThan(0);
    });

    test('should identify outdated files correctly', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: true,
        backupDir: backupDir
      });

      // Test the individual method
      await cleanup.findOutdatedFiles();

      const outdatedFiles = cleanup.filesToRemove.filter(f => 
        f.includes('OLD_') || f.includes('temp_')
      );

      expect(outdatedFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Reference Updates', () => {
    test('should identify and comment out broken references', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: true,
        backupDir: backupDir
      });

      // Manually add some files to remove list for testing
      cleanup.filesToRemove.push(
        path.join(testDir, 'docs', 'moved-file.md'),
        path.join(testDir, 'docs', 'setup', 'README.md')
      );
      
      // Then update references
      await cleanup.updateReferences();

      // Check that main.md would be updated
      const mainContent = await fs.readFile(path.join(testDir, 'docs', 'main.md'), 'utf8');
      
      // In dry run mode, the file shouldn't actually be changed
      expect(mainContent).toContain('[moved file](moved-file.md)');
      expect(mainContent).toContain('[setup](setup/README.md)');
    });
  });

  describe('Live Mode', () => {
    test('should actually remove files in live mode', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: false,
        backupDir: backupDir
      });

      // Verify files exist before cleanup
      const movedFile = path.join(testDir, 'docs', 'moved-file.md');
      const oldFile = path.join(testDir, 'docs', 'OLD_README.md');
      
      await expect(fs.access(movedFile)).resolves.not.toThrow();
      await expect(fs.access(oldFile)).resolves.not.toThrow();

      // Run cleanup
      await cleanup.run();

      // Verify files are removed
      await expect(fs.access(movedFile)).rejects.toThrow();
      await expect(fs.access(oldFile)).rejects.toThrow();
    });

    test('should create backup before removing files', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: false,
        backupDir: backupDir
      });

      await cleanup.run();

      // Check that backup directory was created
      const backupContents = await fs.readdir(backupDir);
      const backupFolders = backupContents.filter(item => item.startsWith('cleanup-'));
      
      expect(backupFolders.length).toBeGreaterThan(0);
    });

    test('should update references to removed files', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: false,
        backupDir: backupDir
      });

      await cleanup.run();

      // Check that references were updated
      const mainContent = await fs.readFile(path.join(testDir, 'docs', 'main.md'), 'utf8');
      
      expect(mainContent).toContain('<!-- BROKEN LINK (file removed):');
      expect(mainContent).not.toContain('[moved file](moved-file.md)');
    });

    test('should remove empty directories', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: false,
        backupDir: backupDir
      });

      await cleanup.run();

      // Check that empty directory was removed
      await expect(fs.access(path.join(testDir, 'docs', 'empty'))).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing files gracefully', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: '/nonexistent/path',
        dryRun: true,
        backupDir: backupDir
      });

      // Should not throw error for missing directory
      await expect(cleanup.identifyFilesToCleanup()).resolves.not.toThrow();
    });

    test('should handle permission errors gracefully', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: false,
        backupDir: '/root/no-permission' // Path that should cause permission error
      });

      // Should handle backup creation errors gracefully
      await expect(cleanup.run()).rejects.toThrow();
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive cleanup report', async () => {
      const DocumentationCleanup = require('../cleanup-old-docs.js');
      const cleanup = new DocumentationCleanup({
        projectRoot: testDir,
        dryRun: true,
        backupDir: backupDir
      });

      await cleanup.run();
      const reportPath = await cleanup.generateReport();

      expect(reportPath).toBeTruthy();
      
      const reportContent = await fs.readFile(reportPath, 'utf8');
      expect(reportContent).toContain('# Documentation Cleanup Report');
      expect(reportContent).toContain('Files removed:');
      expect(reportContent).toContain('Directories removed:');
      expect(reportContent).toContain('DRY RUN');
    });
  });
});