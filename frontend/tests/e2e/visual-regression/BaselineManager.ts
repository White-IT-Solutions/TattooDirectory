import { promises as fs } from 'fs';
import path from 'path';
import { Screenshot } from './ScreenshotCapture';
import { BaselineStorage } from './BaselineStorage';
import { BaselineVersionControl } from './BaselineVersionControl';
import { GitIntegration } from './GitIntegration';

export interface BaselineMetadata {
  id: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  imagePath: string;
  hash: string;
  browserInfo: {
    name: string;
    version: string;
  };
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  gitCommit?: string;
  gitBranch?: string;
}

export interface BaselineVersion {
  version: number;
  imagePath: string;
  metadata: BaselineMetadata;
  createdAt: Date;
}

export interface BaselineHistory {
  current: BaselineMetadata;
  versions: BaselineVersion[];
}

export interface BaselineManagerConfig {
  baselineDir?: string;
  maxVersions?: number;
  enableVersionControl?: boolean;
  enableGitIntegration?: boolean;
  autoCommit?: boolean;
  requireApproval?: boolean;
}

export class BaselineManager {
  private storage: BaselineStorage;
  private versionControl?: BaselineVersionControl;
  private git?: GitIntegration;
  private config: Required<BaselineManagerConfig>;

  constructor(config: BaselineManagerConfig = {}) {
    this.config = {
      baselineDir: 'test-results/baselines',
      maxVersions: 10,
      enableVersionControl: true,
      enableGitIntegration: true,
      autoCommit: false,
      requireApproval: true,
      ...config
    };

    // Initialize storage
    this.storage = new BaselineStorage({
      baselineDir: this.config.baselineDir,
      maxVersions: this.config.maxVersions,
      gitLFSEnabled: this.config.enableGitIntegration
    });

    // Initialize version control if enabled
    if (this.config.enableVersionControl) {
      this.versionControl = new BaselineVersionControl(this.storage, {
        autoCommit: this.config.autoCommit,
        requireApproval: this.config.requireApproval,
        gitLFSEnabled: this.config.enableGitIntegration
      });
    }

    // Initialize Git integration if enabled
    if (this.config.enableGitIntegration) {
      try {
        this.git = new GitIntegration();
      } catch (error) {
        console.warn('Git integration disabled: not in a Git repository');
      }
    }
  }

  /**
   * Initialize baseline manager and all subsystems
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
    
    if (this.versionControl) {
      await this.versionControl.initialize();
    }

    console.log('🔧 Baseline manager initialized');
  }

  /**
   * Get baseline image for comparison
   */
  async getBaseline(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineMetadata | null> {
    try {
      const paths = this.storage.getBaselinePath(page, theme, viewport);
      const metadataContent = await fs.readFile(paths.metadataPath, 'utf-8');
      const metadata: BaselineMetadata = JSON.parse(metadataContent);

      // Verify baseline image exists
      const imageExists = await this.fileExists(metadata.imagePath);
      if (!imageExists) {
        console.warn(`Baseline image not found: ${metadata.imagePath}`);
        return null;
      }

      return metadata;
    } catch (error) {
      // Baseline doesn't exist
      return null;
    }
  }

  /**
   * Update baseline with new screenshot
   */
  async updateBaseline(
    screenshot: Screenshot,
    approved: boolean = false,
    approvedBy?: string
  ): Promise<BaselineMetadata> {
    const { page, theme } = screenshot;
    const viewport = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
    
    // Get existing baseline for versioning
    const existingBaseline = await this.getBaseline(page, theme, viewport);
    
    // Archive existing baseline if it exists
    if (existingBaseline) {
      await this.storage.archiveVersion(
        page,
        theme,
        viewport,
        existingBaseline.version,
        existingBaseline.imagePath,
        existingBaseline
      );
    }
    
    // Generate image hash for integrity checking
    const imageHash = await this.generateImageHash(screenshot.imagePath);
    
    // Add Git information if available
    let gitCommit: string | undefined;
    let gitBranch: string | undefined;
    if (this.git) {
      try {
        const commitInfo = this.git.getCurrentCommit();
        gitCommit = commitInfo.hash;
        gitBranch = commitInfo.branch;
      } catch (error) {
        console.warn('Failed to get Git information:', error);
      }
    }
    
    // Create baseline metadata
    const metadata: BaselineMetadata = {
      id: this.generateBaselineId(page, theme, viewport),
      page,
      theme,
      viewport,
      createdAt: existingBaseline?.createdAt || new Date(),
      updatedAt: new Date(),
      version: (existingBaseline?.version || 0) + 1,
      imagePath: screenshot.imagePath, // Will be updated by storage
      hash: imageHash,
      browserInfo: {
        name: screenshot.metadata.browserName,
        version: screenshot.metadata.browserVersion
      },
      approved,
      approvedBy,
      approvedAt: approved ? new Date() : undefined,
      gitCommit,
      gitBranch
    };
    
    // Store baseline using storage system
    await this.storage.storeBaseline(page, theme, viewport, screenshot.imagePath, metadata);
    
    // Create version control changeset if enabled
    if (this.versionControl && !approved) {
      const changeType = existingBaseline ? 'modified' : 'added';
      await this.versionControl.createChangeSet([{
        type: changeType,
        page,
        theme,
        viewport,
        oldVersion: existingBaseline || undefined,
        newVersion: metadata
      }], `Update baseline: ${page}/${theme}/${viewport}`);
    }
    
    console.log(`📸 Baseline updated: ${page}/${theme}/${viewport} (v${metadata.version})`);
    
    return metadata;
  }

  /**
   * Approve a baseline (mark as approved)
   */
  async approveBaseline(
    page: string,
    theme: 'light' | 'dark',
    viewport: string,
    approvedBy: string
  ): Promise<BaselineMetadata | null> {
    const baseline = await this.getBaseline(page, theme, viewport);
    if (!baseline) {
      return null;
    }

    baseline.approved = true;
    baseline.approvedBy = approvedBy;
    baseline.approvedAt = new Date();

    const metadataPath = this.getMetadataPath(page, theme, viewport);
    await fs.writeFile(metadataPath, JSON.stringify(baseline, null, 2));

    console.log(`✅ Baseline approved: ${page}/${theme}/${viewport} by ${approvedBy}`);
    
    return baseline;
  }

  /**
   * Get baseline history with all versions
   */
  async getBaselineHistory(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineHistory | null> {
    const current = await this.getBaseline(page, theme, viewport);
    if (!current) {
      return null;
    }

    const versions = await this.getBaselineVersions(page, theme, viewport);

    return {
      current,
      versions
    };
  }

  /**
   * Rollback to a previous baseline version
   */
  async rollbackBaseline(
    page: string,
    theme: 'light' | 'dark',
    viewport: string,
    targetVersion: number
  ): Promise<BaselineMetadata | null> {
    const versions = await this.getBaselineVersions(page, theme, viewport);
    const targetVersionData = versions.find(v => v.version === targetVersion);
    
    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found for ${page}/${theme}/${viewport}`);
    }

    // Verify target version image exists
    const imageExists = await this.fileExists(targetVersionData.imagePath);
    if (!imageExists) {
      throw new Error(`Version ${targetVersion} image not found: ${targetVersionData.imagePath}`);
    }

    // Archive current baseline
    const currentBaseline = await this.getBaseline(page, theme, viewport);
    if (currentBaseline) {
      await this.archiveBaseline(currentBaseline);
    }

    // Restore target version as current baseline
    const baselineImagePath = this.getBaselineImagePath(page, theme, viewport);
    await fs.copyFile(targetVersionData.imagePath, baselineImagePath);

    // Update metadata
    const restoredMetadata: BaselineMetadata = {
      ...targetVersionData.metadata,
      updatedAt: new Date(),
      version: (currentBaseline?.version || 0) + 1,
      imagePath: baselineImagePath
    };

    const metadataPath = this.getMetadataPath(page, theme, viewport);
    await fs.writeFile(metadataPath, JSON.stringify(restoredMetadata, null, 2));

    console.log(`🔄 Baseline rolled back: ${page}/${theme}/${viewport} to version ${targetVersion}`);

    return restoredMetadata;
  }

  /**
   * Delete baseline and all its versions
   */
  async deleteBaseline(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<void> {
    const baseline = await this.getBaseline(page, theme, viewport);
    if (!baseline) {
      return;
    }

    // Delete current baseline image
    await this.safeDeleteFile(baseline.imagePath);

    // Delete metadata
    const metadataPath = this.getMetadataPath(page, theme, viewport);
    await this.safeDeleteFile(metadataPath);

    // Delete all versions
    const versions = await this.getBaselineVersions(page, theme, viewport);
    for (const version of versions) {
      await this.safeDeleteFile(version.imagePath);
    }

    // Delete version directory if empty
    const versionDir = this.getVersionsPath(page, theme, viewport);
    await this.safeDeleteDirectory(versionDir);

    console.log(`🗑️  Baseline deleted: ${page}/${theme}/${viewport}`);
  }

  /**
   * Clean up old baseline versions beyond maxVersions
   */
  async cleanupOldVersions(
    page?: string,
    theme?: 'light' | 'dark',
    viewport?: string
  ): Promise<void> {
    if (page && theme && viewport) {
      // Clean up specific baseline
      await this.cleanupBaselineVersions(page, theme, viewport);
    } else {
      // Clean up all baselines
      await this.cleanupAllBaselineVersions();
    }
  }

  /**
   * Get all baselines matching criteria
   */
  async getAllBaselines(
    page?: string,
    theme?: 'light' | 'dark'
  ): Promise<BaselineMetadata[]> {
    return this.storage.getAllBaselines();
  }

  /**
   * Get baseline storage statistics
   */
  async getStorageStats() {
    return this.storage.getStorageStats();
  }

  /**
   * Clean up old baseline versions and orphaned files
   */
  async cleanupStorage(options?: {
    removeOldVersions?: boolean;
    removeOrphanedFiles?: boolean;
    compressOldVersions?: boolean;
    maxAge?: number;
  }) {
    return this.storage.cleanupStorage(options);
  }

  /**
   * Export baselines for backup or migration
   */
  async exportBaselines(exportPath: string, options?: {
    includeVersions?: boolean;
    compress?: boolean;
    pages?: string[];
    themes?: ('light' | 'dark')[];
  }) {
    return this.storage.exportBaselines(exportPath, options);
  }

  /**
   * Import baselines from backup or migration
   */
  async importBaselines(importPath: string, options?: {
    overwriteExisting?: boolean;
    validateIntegrity?: boolean;
  }) {
    return this.storage.importBaselines(importPath, options);
  }

  /**
   * Create a rollback point for current baseline state
   */
  async createRollbackPoint(description: string) {
    if (!this.versionControl) {
      throw new Error('Version control is not enabled');
    }
    return this.versionControl.createRollbackPoint(description);
  }

  /**
   * Rollback baselines to a specific point
   */
  async rollbackToPoint(rollbackPointId: string) {
    if (!this.versionControl) {
      throw new Error('Version control is not enabled');
    }
    return this.versionControl.rollbackToPoint(rollbackPointId);
  }

  /**
   * Get all rollback points
   */
  async getRollbackPoints() {
    if (!this.versionControl) {
      return [];
    }
    return this.versionControl.getRollbackPoints();
  }

  /**
   * Approve a baseline changeset
   */
  async approveChangeSet(changeSetId: string, approvedBy: string, autoCommit: boolean = false) {
    if (!this.versionControl) {
      throw new Error('Version control is not enabled');
    }
    return this.versionControl.approveChangeSet(changeSetId, approvedBy, autoCommit);
  }

  /**
   * Reject a baseline changeset
   */
  async rejectChangeSet(changeSetId: string, rejectedBy: string, reason?: string) {
    if (!this.versionControl) {
      throw new Error('Version control is not enabled');
    }
    return this.versionControl.rejectChangeSet(changeSetId, rejectedBy, reason);
  }

  /**
   * Get all changesets
   */
  async getChangeSets(limit?: number) {
    if (!this.versionControl) {
      return [];
    }
    return this.versionControl.getChangeSets(limit);
  }

  /**
   * Get baseline change history
   */
  async getBaselineChangeHistory(page: string, theme: 'light' | 'dark', viewport: string) {
    if (!this.versionControl) {
      return [];
    }
    return this.versionControl.getBaselineHistory(page, theme, viewport);
  }

  /**
   * Detect baseline changes since last commit
   */
  async detectChanges() {
    if (!this.versionControl) {
      return [];
    }
    return this.versionControl.detectChanges();
  }

  /**
   * Commit baseline changes to Git
   */
  async commitChanges(message?: string, files?: string[]) {
    if (!this.versionControl) {
      throw new Error('Version control is not enabled');
    }
    return this.versionControl.commitChanges(message, files);
  }

  /**
   * Archive existing baseline to versions directory
   */
  private async archiveBaseline(baseline: BaselineMetadata): Promise<void> {
    const versionsDir = this.getVersionsPath(baseline.page, baseline.theme, baseline.viewport);
    await fs.mkdir(versionsDir, { recursive: true });

    const versionImagePath = path.join(versionsDir, `v${baseline.version}.png`);
    const versionMetadataPath = path.join(versionsDir, `v${baseline.version}.metadata.json`);

    // Copy image and metadata to versions directory
    await fs.copyFile(baseline.imagePath, versionImagePath);
    await fs.writeFile(versionMetadataPath, JSON.stringify(baseline, null, 2));
  }

  /**
   * Get all versions for a baseline
   */
  private async getBaselineVersions(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineVersion[]> {
    const versions: BaselineVersion[] = [];
    const versionsDir = this.getVersionsPath(page, theme, viewport);

    try {
      const files = await fs.readdir(versionsDir);
      const metadataFiles = files.filter(f => f.endsWith('.metadata.json'));

      for (const file of metadataFiles) {
        try {
          const metadataPath = path.join(versionsDir, file);
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata: BaselineMetadata = JSON.parse(metadataContent);

          const versionNumber = parseInt(file.replace('v', '').replace('.metadata.json', ''));
          const imagePath = path.join(versionsDir, `v${versionNumber}.png`);

          versions.push({
            version: versionNumber,
            imagePath,
            metadata,
            createdAt: new Date(metadata.updatedAt)
          });
        } catch (error) {
          console.warn(`Failed to read version metadata: ${file}`, error);
        }
      }
    } catch (error) {
      // Versions directory doesn't exist
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  /**
   * Clean up versions for a specific baseline
   */
  private async cleanupBaselineVersions(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<void> {
    const versions = await this.getBaselineVersions(page, theme, viewport);
    
    if (versions.length <= this.maxVersions) {
      return;
    }

    const versionsToDelete = versions.slice(this.maxVersions);
    
    for (const version of versionsToDelete) {
      await this.safeDeleteFile(version.imagePath);
      
      const metadataPath = version.imagePath.replace('.png', '.metadata.json');
      await this.safeDeleteFile(metadataPath);
    }

    console.log(`🧹 Cleaned up ${versionsToDelete.length} old versions for ${page}/${theme}/${viewport}`);
  }

  /**
   * Clean up all baseline versions
   */
  private async cleanupAllBaselineVersions(): Promise<void> {
    const baselines = await this.getAllBaselines();
    
    for (const baseline of baselines) {
      await this.cleanupBaselineVersions(baseline.page, baseline.theme, baseline.viewport);
    }
  }

  /**
   * Get baseline paths from storage system
   */
  private getBaselinePaths(page: string, theme: 'light' | 'dark', viewport: string) {
    return this.storage.getBaselinePath(page, theme, viewport);
  }

  /**
   * Generate unique baseline ID
   */
  private generateBaselineId(page: string, theme: string, viewport: string): string {
    return `${page}-${theme}-${viewport}`;
  }

  /**
   * Generate image hash for integrity checking
   */
  private async generateImageHash(imagePath: string): Promise<string> {
    const crypto = await import('crypto');
    const buffer = await fs.readFile(imagePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely delete file (no error if doesn't exist)
   */
  private async safeDeleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist or can't be deleted
    }
  }

  /**
   * Safely delete directory (no error if doesn't exist)
   */
  private async safeDeleteDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rmdir(dirPath);
      }
    } catch (error) {
      // Directory doesn't exist or not empty
    }
  }
}