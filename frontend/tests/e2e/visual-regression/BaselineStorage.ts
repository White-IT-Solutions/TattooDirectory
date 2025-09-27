import { promises as fs } from 'fs';
import path from 'path';
import { BaselineMetadata, BaselineVersion } from './BaselineManager';

export interface StorageConfig {
  baselineDir: string;
  metadataDir: string;
  versionsDir: string;
  archiveDir: string;
  maxVersions: number;
  compressionEnabled: boolean;
  gitLFSEnabled: boolean;
}

export interface StorageStats {
  totalBaselines: number;
  totalVersions: number;
  totalSize: number;
  oldestBaseline: Date | null;
  newestBaseline: Date | null;
  storageByPage: Record<string, {
    baselines: number;
    versions: number;
    size: number;
  }>;
}

export interface BaselineIndex {
  pages: Record<string, {
    themes: Record<string, {
      viewports: Record<string, {
        current: BaselineMetadata;
        versions: number;
        lastUpdated: Date;
      }>;
    }>;
  }>;
  totalBaselines: number;
  lastUpdated: Date;
}

export class BaselineStorage {
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      baselineDir: 'test-results/baselines',
      metadataDir: 'test-results/baselines/.metadata',
      versionsDir: 'test-results/baselines/.versions',
      archiveDir: 'test-results/baselines/.archive',
      maxVersions: 10,
      compressionEnabled: true,
      gitLFSEnabled: false,
      ...config
    };
  }

  /**
   * Initialize storage directories and configuration
   */
  async initialize(): Promise<void> {
    await this.ensureDirectories();
    await this.setupGitLFS();
    await this.createStorageIndex();
  }

  /**
   * Get organized baseline storage structure
   */
  getStorageStructure(): {
    baselines: string;
    metadata: string;
    versions: string;
    archive: string;
  } {
    return {
      baselines: this.config.baselineDir,
      metadata: this.config.metadataDir,
      versions: this.config.versionsDir,
      archive: this.config.archiveDir
    };
  }

  /**
   * Get baseline path organized by page, theme, and viewport
   */
  getBaselinePath(page: string, theme: 'light' | 'dark', viewport: string): {
    imagePath: string;
    metadataPath: string;
    versionDir: string;
  } {
    const pageDir = path.join(this.config.baselineDir, this.sanitizePath(page));
    const themeDir = path.join(pageDir, theme);
    
    return {
      imagePath: path.join(themeDir, `${viewport}.png`),
      metadataPath: path.join(themeDir, `${viewport}.metadata.json`),
      versionDir: path.join(this.config.versionsDir, this.sanitizePath(page), theme, viewport)
    };
  }

  /**
   * Store baseline with proper organization
   */
  async storeBaseline(
    page: string,
    theme: 'light' | 'dark',
    viewport: string,
    imagePath: string,
    metadata: BaselineMetadata
  ): Promise<void> {
    const paths = this.getBaselinePath(page, theme, viewport);
    
    // Ensure directories exist
    await fs.mkdir(path.dirname(paths.imagePath), { recursive: true });
    await fs.mkdir(path.dirname(paths.metadataPath), { recursive: true });
    
    // Copy image to baseline location
    await fs.copyFile(imagePath, paths.imagePath);
    
    // Store metadata
    await fs.writeFile(paths.metadataPath, JSON.stringify(metadata, null, 2));
    
    // Update storage index
    await this.updateStorageIndex(page, theme, viewport, metadata);
    
    console.log(`📁 Baseline stored: ${page}/${theme}/${viewport}`);
  }

  /**
   * Archive baseline version
   */
  async archiveVersion(
    page: string,
    theme: 'light' | 'dark',
    viewport: string,
    version: number,
    imagePath: string,
    metadata: BaselineMetadata
  ): Promise<void> {
    const paths = this.getBaselinePath(page, theme, viewport);
    await fs.mkdir(paths.versionDir, { recursive: true });
    
    const versionImagePath = path.join(paths.versionDir, `v${version}.png`);
    const versionMetadataPath = path.join(paths.versionDir, `v${version}.metadata.json`);
    
    // Store version files
    await fs.copyFile(imagePath, versionImagePath);
    await fs.writeFile(versionMetadataPath, JSON.stringify(metadata, null, 2));
    
    // Compress if enabled
    if (this.config.compressionEnabled) {
      await this.compressVersion(versionImagePath);
    }
  }

  /**
   * Get all stored baselines
   */
  async getAllBaselines(): Promise<BaselineMetadata[]> {
    const baselines: BaselineMetadata[] = [];
    
    try {
      const pages = await this.getPageDirectories();
      
      for (const page of pages) {
        const themes = await this.getThemeDirectories(page);
        
        for (const theme of themes) {
          const viewports = await this.getViewportFiles(page, theme);
          
          for (const viewport of viewports) {
            const metadata = await this.loadBaselineMetadata(page, theme, viewport);
            if (metadata) {
              baselines.push(metadata);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load all baselines:', error);
    }
    
    return baselines;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const baselines = await this.getAllBaselines();
    const stats: StorageStats = {
      totalBaselines: baselines.length,
      totalVersions: 0,
      totalSize: 0,
      oldestBaseline: null,
      newestBaseline: null,
      storageByPage: {}
    };

    for (const baseline of baselines) {
      // Update date ranges
      const baselineDate = new Date(baseline.updatedAt);
      if (!stats.oldestBaseline || baselineDate < stats.oldestBaseline) {
        stats.oldestBaseline = baselineDate;
      }
      if (!stats.newestBaseline || baselineDate > stats.newestBaseline) {
        stats.newestBaseline = baselineDate;
      }

      // Calculate sizes
      try {
        const imageStats = await fs.stat(baseline.imagePath);
        stats.totalSize += imageStats.size;

        // Update per-page stats
        if (!stats.storageByPage[baseline.page]) {
          stats.storageByPage[baseline.page] = {
            baselines: 0,
            versions: 0,
            size: 0
          };
        }
        stats.storageByPage[baseline.page].baselines++;
        stats.storageByPage[baseline.page].size += imageStats.size;

        // Count versions
        const versions = await this.getVersionCount(baseline.page, baseline.theme, baseline.viewport);
        stats.totalVersions += versions;
        stats.storageByPage[baseline.page].versions += versions;
      } catch (error) {
        console.warn(`Failed to get stats for ${baseline.imagePath}:`, error);
      }
    }

    return stats;
  }

  /**
   * Clean up storage by removing old versions and orphaned files
   */
  async cleanupStorage(options: {
    removeOldVersions?: boolean;
    removeOrphanedFiles?: boolean;
    compressOldVersions?: boolean;
    maxAge?: number; // days
  } = {}): Promise<{
    removedVersions: number;
    removedOrphans: number;
    compressedFiles: number;
    freedSpace: number;
  }> {
    const result = {
      removedVersions: 0,
      removedOrphans: 0,
      compressedFiles: 0,
      freedSpace: 0
    };

    if (options.removeOldVersions) {
      result.removedVersions = await this.removeOldVersions();
    }

    if (options.removeOrphanedFiles) {
      result.removedOrphans = await this.removeOrphanedFiles();
    }

    if (options.compressOldVersions) {
      result.compressedFiles = await this.compressOldVersions();
    }

    if (options.maxAge) {
      const { removed, freedSpace } = await this.removeOldBaselines(options.maxAge);
      result.removedVersions += removed;
      result.freedSpace += freedSpace;
    }

    return result;
  }

  /**
   * Export baselines for backup or migration
   */
  async exportBaselines(exportPath: string, options: {
    includeVersions?: boolean;
    compress?: boolean;
    pages?: string[];
    themes?: ('light' | 'dark')[];
  } = {}): Promise<void> {
    await fs.mkdir(exportPath, { recursive: true });
    
    const baselines = await this.getAllBaselines();
    const filteredBaselines = baselines.filter(baseline => {
      if (options.pages && !options.pages.includes(baseline.page)) return false;
      if (options.themes && !options.themes.includes(baseline.theme)) return false;
      return true;
    });

    const exportManifest = {
      exportDate: new Date().toISOString(),
      totalBaselines: filteredBaselines.length,
      options,
      baselines: filteredBaselines.map(b => ({
        id: b.id,
        page: b.page,
        theme: b.theme,
        viewport: b.viewport,
        version: b.version
      }))
    };

    // Export baselines
    for (const baseline of filteredBaselines) {
      const exportDir = path.join(exportPath, baseline.page, baseline.theme);
      await fs.mkdir(exportDir, { recursive: true });

      // Copy baseline image and metadata
      const exportImagePath = path.join(exportDir, `${baseline.viewport}.png`);
      const exportMetadataPath = path.join(exportDir, `${baseline.viewport}.metadata.json`);
      
      await fs.copyFile(baseline.imagePath, exportImagePath);
      await fs.writeFile(exportMetadataPath, JSON.stringify(baseline, null, 2));

      // Export versions if requested
      if (options.includeVersions) {
        const versions = await this.getVersions(baseline.page, baseline.theme, baseline.viewport);
        if (versions.length > 0) {
          const versionsDir = path.join(exportDir, '.versions');
          await fs.mkdir(versionsDir, { recursive: true });

          for (const version of versions) {
            const versionImagePath = path.join(versionsDir, `v${version.version}.png`);
            const versionMetadataPath = path.join(versionsDir, `v${version.version}.metadata.json`);
            
            await fs.copyFile(version.imagePath, versionImagePath);
            await fs.writeFile(versionMetadataPath, JSON.stringify(version.metadata, null, 2));
          }
        }
      }
    }

    // Write export manifest
    await fs.writeFile(
      path.join(exportPath, 'export-manifest.json'),
      JSON.stringify(exportManifest, null, 2)
    );

    console.log(`📦 Exported ${filteredBaselines.length} baselines to ${exportPath}`);
  }

  /**
   * Import baselines from backup or migration
   */
  async importBaselines(importPath: string, options: {
    overwriteExisting?: boolean;
    validateIntegrity?: boolean;
  } = {}): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Read import manifest
      const manifestPath = path.join(importPath, 'export-manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      console.log(`📥 Importing ${manifest.totalBaselines} baselines from ${manifest.exportDate}`);

      // Import each baseline
      for (const baselineInfo of manifest.baselines) {
        try {
          const importDir = path.join(importPath, baselineInfo.page, baselineInfo.theme);
          const importImagePath = path.join(importDir, `${baselineInfo.viewport}.png`);
          const importMetadataPath = path.join(importDir, `${baselineInfo.viewport}.metadata.json`);

          // Check if files exist
          const imageExists = await this.fileExists(importImagePath);
          const metadataExists = await this.fileExists(importMetadataPath);

          if (!imageExists || !metadataExists) {
            result.errors.push(`Missing files for ${baselineInfo.id}`);
            continue;
          }

          // Load metadata
          const metadataContent = await fs.readFile(importMetadataPath, 'utf-8');
          const metadata: BaselineMetadata = JSON.parse(metadataContent);

          // Check if baseline already exists
          const existingBaseline = await this.loadBaselineMetadata(
            baselineInfo.page,
            baselineInfo.theme,
            baselineInfo.viewport
          );

          if (existingBaseline && !options.overwriteExisting) {
            result.skipped++;
            continue;
          }

          // Validate integrity if requested
          if (options.validateIntegrity) {
            const isValid = await this.validateBaselineIntegrity(importImagePath, metadata);
            if (!isValid) {
              result.errors.push(`Integrity check failed for ${baselineInfo.id}`);
              continue;
            }
          }

          // Import baseline
          await this.storeBaseline(
            baselineInfo.page,
            baselineInfo.theme,
            baselineInfo.viewport,
            importImagePath,
            metadata
          );

          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import ${baselineInfo.id}: ${error}`);
        }
      }

      console.log(`✅ Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
    } catch (error) {
      result.errors.push(`Failed to read import manifest: ${error}`);
    }

    return result;
  }

  /**
   * Private helper methods
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.config.baselineDir,
      this.config.metadataDir,
      this.config.versionsDir,
      this.config.archiveDir
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async setupGitLFS(): Promise<void> {
    if (!this.config.gitLFSEnabled) return;

    try {
      const { GitIntegration } = await import('./GitIntegration');
      const git = new GitIntegration();
      
      if (git.isLFSAvailable()) {
        git.trackLargeFiles(['*.png', '*.jpg', '*.jpeg']);
        console.log('🔧 Git LFS configured for baseline images');
      }
    } catch (error) {
      console.warn('Failed to setup Git LFS:', error);
    }
  }

  private async createStorageIndex(): Promise<void> {
    const indexPath = path.join(this.config.metadataDir, 'storage-index.json');
    
    if (await this.fileExists(indexPath)) {
      return; // Index already exists
    }

    const index: BaselineIndex = {
      pages: {},
      totalBaselines: 0,
      lastUpdated: new Date()
    };

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  private async updateStorageIndex(
    page: string,
    theme: 'light' | 'dark',
    viewport: string,
    metadata: BaselineMetadata
  ): Promise<void> {
    const indexPath = path.join(this.config.metadataDir, 'storage-index.json');
    
    let index: BaselineIndex;
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexContent);
    } catch {
      index = { pages: {}, totalBaselines: 0, lastUpdated: new Date() };
    }

    // Update index structure
    if (!index.pages[page]) {
      index.pages[page] = { themes: {} };
    }
    if (!index.pages[page].themes[theme]) {
      index.pages[page].themes[theme] = { viewports: {} };
    }

    const wasNew = !index.pages[page].themes[theme].viewports[viewport];
    
    index.pages[page].themes[theme].viewports[viewport] = {
      current: metadata,
      versions: await this.getVersionCount(page, theme, viewport),
      lastUpdated: new Date()
    };

    if (wasNew) {
      index.totalBaselines++;
    }
    index.lastUpdated = new Date();

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  private sanitizePath(path: string): string {
    return path.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  private async getPageDirectories(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.config.baselineDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  private async getThemeDirectories(page: string): Promise<('light' | 'dark')[]> {
    try {
      const pageDir = path.join(this.config.baselineDir, page);
      const entries = await fs.readdir(pageDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && (entry.name === 'light' || entry.name === 'dark'))
        .map(entry => entry.name as 'light' | 'dark');
    } catch {
      return [];
    }
  }

  private async getViewportFiles(page: string, theme: 'light' | 'dark'): Promise<string[]> {
    try {
      const themeDir = path.join(this.config.baselineDir, page, theme);
      const files = await fs.readdir(themeDir);
      return files
        .filter(file => file.endsWith('.png'))
        .map(file => file.replace('.png', ''));
    } catch {
      return [];
    }
  }

  private async loadBaselineMetadata(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineMetadata | null> {
    try {
      const paths = this.getBaselinePath(page, theme, viewport);
      const metadataContent = await fs.readFile(paths.metadataPath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch {
      return null;
    }
  }

  private async getVersions(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineVersion[]> {
    const versions: BaselineVersion[] = [];
    const paths = this.getBaselinePath(page, theme, viewport);

    try {
      const files = await fs.readdir(paths.versionDir);
      const metadataFiles = files.filter(f => f.endsWith('.metadata.json'));

      for (const file of metadataFiles) {
        try {
          const metadataPath = path.join(paths.versionDir, file);
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata: BaselineMetadata = JSON.parse(metadataContent);

          const versionNumber = parseInt(file.replace('v', '').replace('.metadata.json', ''));
          const imagePath = path.join(paths.versionDir, `v${versionNumber}.png`);

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
    } catch {
      // Version directory doesn't exist
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  private async getVersionCount(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<number> {
    const versions = await this.getVersions(page, theme, viewport);
    return versions.length;
  }

  private async removeOldVersions(): Promise<number> {
    let removedCount = 0;
    const baselines = await this.getAllBaselines();

    for (const baseline of baselines) {
      const versions = await this.getVersions(baseline.page, baseline.theme, baseline.viewport);
      
      if (versions.length > this.config.maxVersions) {
        const versionsToRemove = versions.slice(this.config.maxVersions);
        
        for (const version of versionsToRemove) {
          try {
            await fs.unlink(version.imagePath);
            const metadataPath = version.imagePath.replace('.png', '.metadata.json');
            await fs.unlink(metadataPath);
            removedCount++;
          } catch (error) {
            console.warn(`Failed to remove version ${version.version}:`, error);
          }
        }
      }
    }

    return removedCount;
  }

  private async removeOrphanedFiles(): Promise<number> {
    // Implementation for removing orphaned files
    return 0;
  }

  private async compressOldVersions(): Promise<number> {
    // Implementation for compressing old versions
    return 0;
  }

  private async removeOldBaselines(maxAgeDays: number): Promise<{ removed: number; freedSpace: number }> {
    // Implementation for removing old baselines
    return { removed: 0, freedSpace: 0 };
  }

  private async compressVersion(imagePath: string): Promise<void> {
    // Implementation for compressing version images
  }

  private async validateBaselineIntegrity(imagePath: string, metadata: BaselineMetadata): Promise<boolean> {
    try {
      const crypto = await import('crypto');
      const buffer = await fs.readFile(imagePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      return hash === metadata.hash;
    } catch {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}