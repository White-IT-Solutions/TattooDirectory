import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface GitCommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  branch: string;
}

export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
}

export class GitIntegration {
  private repoRoot: string;

  constructor(repoRoot?: string) {
    this.repoRoot = repoRoot || this.findGitRoot();
  }

  /**
   * Get current commit information
   */
  getCurrentCommit(): GitCommitInfo {
    try {
      const hash = this.execGit('rev-parse HEAD').trim();
      const shortHash = this.execGit('rev-parse --short HEAD').trim();
      const author = this.execGit('log -1 --format=%an').trim();
      const email = this.execGit('log -1 --format=%ae').trim();
      const dateStr = this.execGit('log -1 --format=%ci').trim();
      const message = this.execGit('log -1 --format=%s').trim();
      const branch = this.getCurrentBranch();

      return {
        hash,
        shortHash,
        author,
        email,
        date: new Date(dateStr),
        message,
        branch
      };
    } catch (error) {
      throw new Error(`Failed to get Git commit info: ${error}`);
    }
  }

  /**
   * Get current branch name
   */
  getCurrentBranch(): string {
    try {
      return this.execGit('rev-parse --abbrev-ref HEAD').trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if repository has uncommitted changes
   */
  hasUncommittedChanges(): boolean {
    try {
      const status = this.execGit('status --porcelain').trim();
      return status.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of changed files
   */
  getChangedFiles(since?: string): GitFileStatus[] {
    try {
      const command = since 
        ? `diff --name-status ${since}..HEAD`
        : 'status --porcelain';
      
      const output = this.execGit(command).trim();
      if (!output) return [];

      return output.split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        const statusCode = parts[0];
        const filePath = parts.slice(1).join(' ');

        let status: GitFileStatus['status'];
        switch (statusCode[0]) {
          case 'A': status = 'added'; break;
          case 'M': status = 'modified'; break;
          case 'D': status = 'deleted'; break;
          case 'R': status = 'renamed'; break;
          case '?': status = 'untracked'; break;
          default: status = 'modified';
        }

        return { path: filePath, status };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Add files to Git staging area
   */
  addFiles(files: string[]): void {
    try {
      const filesArg = files.map(f => `"${f}"`).join(' ');
      this.execGit(`add ${filesArg}`);
    } catch (error) {
      throw new Error(`Failed to add files to Git: ${error}`);
    }
  }

  /**
   * Commit changes with message
   */
  commit(message: string, files?: string[]): string {
    try {
      if (files && files.length > 0) {
        this.addFiles(files);
      }

      const hash = this.execGit(`commit -m "${message}"`);
      return this.execGit('rev-parse HEAD').trim();
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error}`);
    }
  }

  /**
   * Create and switch to a new branch
   */
  createBranch(branchName: string, switchTo: boolean = true): void {
    try {
      if (switchTo) {
        this.execGit(`checkout -b ${branchName}`);
      } else {
        this.execGit(`branch ${branchName}`);
      }
    } catch (error) {
      throw new Error(`Failed to create branch ${branchName}: ${error}`);
    }
  }

  /**
   * Switch to existing branch
   */
  switchBranch(branchName: string): void {
    try {
      this.execGit(`checkout ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to switch to branch ${branchName}: ${error}`);
    }
  }

  /**
   * Get list of all branches
   */
  getBranches(): string[] {
    try {
      const output = this.execGit('branch -a').trim();
      return output.split('\n')
        .map(line => line.replace(/^\*?\s+/, '').replace(/^remotes\/origin\//, ''))
        .filter(branch => branch && !branch.includes('HEAD ->'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if file is tracked by Git
   */
  isFileTracked(filePath: string): boolean {
    try {
      this.execGit(`ls-files --error-unmatch "${filePath}"`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file content from specific commit
   */
  getFileAtCommit(filePath: string, commitHash: string): string | null {
    try {
      return this.execGit(`show ${commitHash}:${filePath}`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get commit history for a file
   */
  getFileHistory(filePath: string, maxCount: number = 10): GitCommitInfo[] {
    try {
      const format = '%H|%h|%an|%ae|%ci|%s';
      const output = this.execGit(`log --max-count=${maxCount} --format="${format}" -- "${filePath}"`);
      
      if (!output.trim()) return [];

      return output.trim().split('\n').map(line => {
        const [hash, shortHash, author, email, dateStr, message] = line.split('|');
        return {
          hash,
          shortHash,
          author,
          email,
          date: new Date(dateStr),
          message,
          branch: this.getCurrentBranch()
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Create Git LFS track pattern for large files
   */
  trackLargeFiles(patterns: string[]): void {
    try {
      for (const pattern of patterns) {
        this.execGit(`lfs track "${pattern}"`);
      }
      
      // Add .gitattributes if it was created/modified
      const gitattributesPath = path.join(this.repoRoot, '.gitattributes');
      if (this.fileExists(gitattributesPath)) {
        this.addFiles(['.gitattributes']);
      }
    } catch (error) {
      console.warn(`Failed to set up Git LFS tracking: ${error}`);
    }
  }

  /**
   * Check if Git LFS is available
   */
  isLFSAvailable(): boolean {
    try {
      this.execGit('lfs version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute Git command
   */
  private execGit(command: string): string {
    try {
      return execSync(`git ${command}`, {
        cwd: this.repoRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error: any) {
      throw new Error(`Git command failed: git ${command}\n${error.message}`);
    }
  }

  /**
   * Find Git repository root
   */
  private findGitRoot(): string {
    try {
      return execSync('git rev-parse --show-toplevel', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch (error) {
      throw new Error('Not in a Git repository');
    }
  }

  /**
   * Check if file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      require('fs').accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}