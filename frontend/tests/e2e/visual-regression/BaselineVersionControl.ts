import { promises as fs } from 'fs';
import path from 'path';
import { GitIntegration, GitCommitInfo } from './GitIntegration';
import { BaselineStorage } from './BaselineStorage';
import { BaselineMetadata, BaselineVersion } from './BaselineManager';

export interface VersionControlConfig {
  autoCommit: boolean;
  branchPrefix: string;
  commitMessageTemplate: string;
  requireApproval: boolean;
  backupBeforeUpdate: boolean;
  gitLFSEnabled: boolean;
}

export interface BaselineChangeSet {
  id: string;
  timestamp: Date;
  branch: string;
  commit: GitCommitInfo;
  changes: BaselineChange[];
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface BaselineChange {
  type: 'added' | 'modified' | 'deleted';
  page: string;
  theme: 'light' | 'dark';
  viewport: string;
  oldVersion?: BaselineMetadata;
  newVersion?: BaselineMetadata;
  diffImagePath?: string;
}

export interface RollbackPoint {
  id: string;
  timestamp: Date;
  commit: GitCommitInfo;
  description: string;
  baselineCount: number;
  canRollback: boolean;
}

export class BaselineVersionControl {
  private git: GitIntegration;
  private storage: BaselineStorage;
  private config: VersionControlConfig;
  private changeLogPath: string;

  constructor(
    storage: BaselineStorage,
    config: Partial<VersionControlConfig> = {}
  ) {
    this.storage = storage;
    this.git = new GitIntegration();
    this.config = {
      autoCommit: false,
      branchPrefix: 'baseline-update',
      commitMessageTemplate: 'Update baselines: {changes}',
      requireApproval: true,
      backupBeforeUpdate: true,
      gitLFSEnabled: false,
      ...config
    };
    this.changeLogPath = path.join(
      this.storage.getStorageStructure().metadata,
      'change-log.json'
    );
  }

  /**
   * Initialize version control system
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
    await this.setupGitConfiguration();
    await this.initializeChangeLog();
    
    console.log('🔧 Baseline version control initialized');
  }

  /**
   * Create a new baseline changeset
   */
  async createChangeSet(
    changes: Omit<BaselineChange, 'diffImagePath'>[],
    description?: string
  ): Promise<BaselineChangeSet> {
    const timestamp = new Date();
    const branchName = `${this.config.branchPrefix}-${timestamp.getTime()}`;
    
    // Create branch for changes
    if (this.config.autoCommit) {
      this.git.createBranch(branchName, true);
    }

    // Generate diff images for modified baselines
    const enhancedChanges: BaselineChange[] = [];
    for (const change of changes) {
      const enhancedChange = { ...change };
      
      if (change.type === 'modified' && change.oldVersion && change.newVersion) {
        enhancedChange.diffImagePath = await this.generateDiffImage(
          change.oldVersion.imagePath,
          change.newVersion.imagePath,
          change.page,
          change.theme,
          change.viewport
        );
      }
      
      enhancedChanges.push(enhancedChange);
    }

    const changeSet: BaselineChangeSet = {
      id: this.generateChangeSetId(),
      timestamp,
      branch: branchName,
      commit: this.git.getCurrentCommit(),
      changes: enhancedChanges,
      approved: !this.config.requireApproval,
      approvedBy: this.config.requireApproval ? undefined : 'auto',
      approvedAt: this.config.requireApproval ? undefined : timestamp
    };

    // Log changeset
    await this.logChangeSet(changeSet);

    // Auto-commit if enabled
    if (this.config.autoCommit) {
      await this.commitChangeSet(changeSet, description);
    }

    console.log(`📝 Created changeset ${changeSet.id} with ${changes.length} changes`);
    
    return changeSet;
  }

  /**
   * Approve a baseline changeset
   */
  async approveChangeSet(
    changeSetId: string,
    approvedBy: string,
    autoCommit: boolean = false
  ): Promise<BaselineChangeSet | null> {
    const changeSet = await this.getChangeSet(changeSetId);
    if (!changeSet) {
      throw new Error(`Changeset ${changeSetId} not found`);
    }

    if (changeSet.approved) {
      console.log(`⚠️  Changeset ${changeSetId} is already approved`);
      return changeSet;
    }

    // Update approval status
    changeSet.approved = true;
    changeSet.approvedBy = approvedBy;
    changeSet.approvedAt = new Date();

    // Apply changes to baselines
    await this.applyChangeSet(changeSet);

    // Update change log
    await this.updateChangeSet(changeSet);

    // Commit if requested
    if (autoCommit) {
      await this.commitChangeSet(changeSet, `Approved baseline changes by ${approvedBy}`);
    }

    console.log(`✅ Approved changeset ${changeSetId} by ${approvedBy}`);
    
    return changeSet;
  }

  /**
   * Reject a baseline changeset
   */
  async rejectChangeSet(
    changeSetId: string,
    rejectedBy: string,
    reason?: string
  ): Promise<void> {
    const changeSet = await this.getChangeSet(changeSetId);
    if (!changeSet) {
      throw new Error(`Changeset ${changeSetId} not found`);
    }

    // Mark as rejected in change log
    const rejectedChangeSet = {
      ...changeSet,
      approved: false,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason
    };

    await this.updateChangeSet(rejectedChangeSet);

    // Clean up branch if it was created
    try {
      if (changeSet.branch.startsWith(this.config.branchPrefix)) {
        this.git.switchBranch('main'); // Switch away from branch
        // Note: Not deleting branch to preserve history
      }
    } catch (error) {
      console.warn('Failed to clean up branch:', error);
    }

    console.log(`❌ Rejected changeset ${changeSetId} by ${rejectedBy}`);
  }

  /**
   * Create rollback point for current baseline state
   */
  async createRollbackPoint(description: string): Promise<RollbackPoint> {
    const commit = this.git.getCurrentCommit();
    const baselines = await this.storage.getAllBaselines();
    
    const rollbackPoint: RollbackPoint = {
      id: `rollback-${Date.now()}`,
      timestamp: new Date(),
      commit,
      description,
      baselineCount: baselines.length,
      canRollback: true
    };

    // Store rollback point metadata
    const rollbacksPath = path.join(
      this.storage.getStorageStructure().metadata,
      'rollback-points.json'
    );

    let rollbackPoints: RollbackPoint[] = [];
    try {
      const content = await fs.readFile(rollbacksPath, 'utf-8');
      rollbackPoints = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    rollbackPoints.unshift(rollbackPoint);
    
    // Keep only last 20 rollback points
    rollbackPoints = rollbackPoints.slice(0, 20);
    
    await fs.writeFile(rollbacksPath, JSON.stringify(rollbackPoints, null, 2));

    console.log(`🔖 Created rollback point: ${description}`);
    
    return rollbackPoint;
  }

  /**
   * Rollback baselines to a specific point
   */
  async rollbackToPoint(rollbackPointId: string): Promise<void> {
    const rollbackPoint = await this.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackPointId} not found`);
    }

    if (!rollbackPoint.canRollback) {
      throw new Error(`Rollback point ${rollbackPointId} is not available for rollback`);
    }

    // Create backup of current state
    await this.createRollbackPoint(`Backup before rollback to ${rollbackPoint.description}`);

    // Get baseline files at the rollback commit
    const baselineFiles = await this.getBaselineFilesAtCommit(rollbackPoint.commit.hash);
    
    let restoredCount = 0;
    for (const file of baselineFiles) {
      try {
        const content = this.git.getFileAtCommit(file, rollbackPoint.commit.hash);
        if (content) {
          const fullPath = path.join(this.git['repoRoot'], file);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, content);
          restoredCount++;
        }
      } catch (error) {
        console.warn(`Failed to restore ${file}:`, error);
      }
    }

    // Create changeset for rollback
    const rollbackChangeSet = await this.createChangeSet(
      [], // Changes will be detected automatically
      `Rollback to: ${rollbackPoint.description}`
    );

    console.log(`🔄 Rolled back ${restoredCount} baseline files to ${rollbackPoint.description}`);
  }

  /**
   * Get all rollback points
   */
  async getRollbackPoints(): Promise<RollbackPoint[]> {
    try {
      const rollbacksPath = path.join(
        this.storage.getStorageStructure().metadata,
        'rollback-points.json'
      );
      const content = await fs.readFile(rollbacksPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Get specific rollback point
   */
  async getRollbackPoint(rollbackPointId: string): Promise<RollbackPoint | null> {
    const rollbackPoints = await this.getRollbackPoints();
    return rollbackPoints.find(rp => rp.id === rollbackPointId) || null;
  }

  /**
   * Get all changesets
   */
  async getChangeSets(limit?: number): Promise<BaselineChangeSet[]> {
    try {
      const content = await fs.readFile(this.changeLogPath, 'utf-8');
      const changeSets: BaselineChangeSet[] = JSON.parse(content);
      return limit ? changeSets.slice(0, limit) : changeSets;
    } catch {
      return [];
    }
  }

  /**
   * Get specific changeset
   */
  async getChangeSet(changeSetId: string): Promise<BaselineChangeSet | null> {
    const changeSets = await this.getChangeSets();
    return changeSets.find(cs => cs.id === changeSetId) || null;
  }

  /**
   * Get baseline change history
   */
  async getBaselineHistory(
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<BaselineChangeSet[]> {
    const changeSets = await this.getChangeSets();
    return changeSets.filter(cs =>
      cs.changes.some(change =>
        change.page === page &&
        change.theme === theme &&
        change.viewport === viewport
      )
    );
  }

  /**
   * Detect baseline changes since last commit
   */
  async detectChanges(): Promise<BaselineChange[]> {
    const changes: BaselineChange[] = [];
    const changedFiles = this.git.getChangedFiles();
    
    for (const file of changedFiles) {
      if (this.isBaselineFile(file.path)) {
        const change = await this.analyzeFileChange(file);
        if (change) {
          changes.push(change);
        }
      }
    }

    return changes;
  }

  /**
   * Commit baseline changes
   */
  async commitChanges(
    message?: string,
    files?: string[]
  ): Promise<string> {
    const changes = await this.detectChanges();
    const commitMessage = message || this.generateCommitMessage(changes);
    
    const baselineFiles = files || this.getBaselineFilePaths();
    return this.git.commit(commitMessage, baselineFiles);
  }

  /**
   * Private helper methods
   */
  private async setupGitConfiguration(): Promise<void> {
    if (this.config.gitLFSEnabled && this.git.isLFSAvailable()) {
      this.git.trackLargeFiles(['test-results/baselines/**/*.png']);
    }
  }

  private async initializeChangeLog(): Promise<void> {
    if (!(await this.fileExists(this.changeLogPath))) {
      await fs.writeFile(this.changeLogPath, JSON.stringify([], null, 2));
    }
  }

  private async logChangeSet(changeSet: BaselineChangeSet): Promise<void> {
    const changeSets = await this.getChangeSets();
    changeSets.unshift(changeSet);
    
    // Keep only last 100 changesets
    const limitedChangeSets = changeSets.slice(0, 100);
    
    await fs.writeFile(this.changeLogPath, JSON.stringify(limitedChangeSets, null, 2));
  }

  private async updateChangeSet(changeSet: BaselineChangeSet): Promise<void> {
    const changeSets = await this.getChangeSets();
    const index = changeSets.findIndex(cs => cs.id === changeSet.id);
    
    if (index >= 0) {
      changeSets[index] = changeSet;
      await fs.writeFile(this.changeLogPath, JSON.stringify(changeSets, null, 2));
    }
  }

  private async applyChangeSet(changeSet: BaselineChangeSet): Promise<void> {
    for (const change of changeSet.changes) {
      try {
        switch (change.type) {
          case 'added':
          case 'modified':
            if (change.newVersion) {
              await this.storage.storeBaseline(
                change.page,
                change.theme,
                change.viewport,
                change.newVersion.imagePath,
                change.newVersion
              );
            }
            break;
          case 'deleted':
            // Handle baseline deletion
            break;
        }
      } catch (error) {
        console.error(`Failed to apply change for ${change.page}/${change.theme}/${change.viewport}:`, error);
      }
    }
  }

  private async commitChangeSet(changeSet: BaselineChangeSet, description?: string): Promise<void> {
    const message = description || this.generateCommitMessage(changeSet.changes);
    const baselineFiles = this.getBaselineFilePaths();
    
    try {
      this.git.commit(message, baselineFiles);
      console.log(`📝 Committed changeset ${changeSet.id}: ${message}`);
    } catch (error) {
      console.error(`Failed to commit changeset ${changeSet.id}:`, error);
    }
  }

  private async generateDiffImage(
    oldImagePath: string,
    newImagePath: string,
    page: string,
    theme: 'light' | 'dark',
    viewport: string
  ): Promise<string> {
    // This would integrate with ImageComparison to generate diff images
    const diffDir = path.join(
      this.storage.getStorageStructure().metadata,
      'diffs',
      page,
      theme
    );
    await fs.mkdir(diffDir, { recursive: true });
    
    const diffPath = path.join(diffDir, `${viewport}-diff.png`);
    
    // Placeholder - would use actual image comparison library
    try {
      await fs.copyFile(newImagePath, diffPath);
    } catch (error) {
      console.warn('Failed to generate diff image:', error);
    }
    
    return diffPath;
  }

  private generateChangeSetId(): string {
    return `cs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommitMessage(changes: BaselineChange[]): string {
    const summary = changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = Object.entries(summary).map(([type, count]) => `${count} ${type}`);
    return this.config.commitMessageTemplate.replace('{changes}', parts.join(', '));
  }

  private isBaselineFile(filePath: string): boolean {
    return filePath.includes('test-results/baselines') && 
           (filePath.endsWith('.png') || filePath.endsWith('.metadata.json'));
  }

  private async analyzeFileChange(file: { path: string; status: string }): Promise<BaselineChange | null> {
    // Analyze file change and create BaselineChange object
    // This is a simplified implementation
    const pathParts = file.path.split('/');
    if (pathParts.length < 4) return null;

    const page = pathParts[pathParts.length - 3];
    const theme = pathParts[pathParts.length - 2] as 'light' | 'dark';
    const filename = pathParts[pathParts.length - 1];
    const viewport = filename.replace('.png', '').replace('.metadata.json', '');

    return {
      type: file.status === 'added' ? 'added' : 'modified',
      page,
      theme,
      viewport
    };
  }

  private getBaselineFilePaths(): string[] {
    // Return all baseline-related file paths
    return [
      'test-results/baselines/**/*.png',
      'test-results/baselines/**/*.metadata.json'
    ];
  }

  private async getBaselineFilesAtCommit(commitHash: string): Promise<string[]> {
    try {
      const output = this.git['execGit'](`ls-tree -r --name-only ${commitHash} test-results/baselines/`);
      return output.trim().split('\n').filter(line => line.trim());
    } catch {
      return [];
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