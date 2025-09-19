#!/usr/bin/env node

/**
 * State Manager with File Checksum Tracking
 * 
 * Advanced state management system that tracks file changes using checksums,
 * implements incremental processing logic, and provides comprehensive change detection
 * for images, data files, and configuration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_CONFIG } = require('./data-config');

/**
 * StateManager class with file checksum calculation and change detection
 */
class StateManager {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateDir = config.paths.stateTrackingDir;
    this.stateFile = path.join(this.stateDir, 'state.json');
    this.checksumFile = path.join(this.stateDir, 'checksums.json');
    this.historyFile = path.join(this.stateDir, 'history.json');
    this.lockFile = path.join(this.stateDir, 'operation.lock');
    
    this.ensureStateDirectory();
  }

  /**
   * Ensure state directory exists
   */
  ensureStateDirectory() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  /**
   * Calculate file checksum using SHA-256
   */
  calculateFileChecksum(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      console.warn(`⚠️  Could not calculate checksum for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate directory checksum (recursive)
   */
  calculateDirectoryChecksum(dirPath, extensions = null) {
    try {
      if (!fs.existsSync(dirPath)) {
        return null;
      }

      const files = this.getFilesRecursively(dirPath, extensions);
      const checksums = [];

      for (const file of files) {
        const relativePath = path.relative(dirPath, file);
        const checksum = this.calculateFileChecksum(file);
        if (checksum) {
          checksums.push(`${relativePath}:${checksum}`);
        }
      }

      // Sort to ensure consistent ordering
      checksums.sort();
      
      // Create combined checksum
      const combinedHash = crypto.createHash('sha256');
      combinedHash.update(checksums.join('\n'));
      return combinedHash.digest('hex');
    } catch (error) {
      console.warn(`⚠️  Could not calculate directory checksum for ${dirPath}:`, error.message);
      return null;
    }
  }

  /**
   * Get files recursively from directory
   */
  getFilesRecursively(dirPath, extensions = null) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getFilesRecursively(fullPath, extensions));
        } else if (stat.isFile()) {
          if (!extensions || extensions.includes(path.extname(item).toLowerCase())) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${dirPath}:`, error.message);
    }
    
    return files;
  }

  /**
   * Calculate checksums for all tracked files and directories
   */
  calculateAllChecksums() {
    const checksums = {
      timestamp: new Date().toISOString(),
      files: {},
      directories: {}
    };

    // Individual configuration files
    const configFiles = [
      { key: 'dataConfig', path: path.join(this.config.paths.scriptsDir, 'data-config.js') },
      { key: 'packageJson', path: path.join(this.config.paths.projectRoot, 'package.json') },
      { key: 'dockerCompose', path: this.config.paths.dockerComposeFile },
      { key: 'envFile', path: this.config.paths.envFile }
    ];

    configFiles.forEach(({ key, path: filePath }) => {
      checksums.files[key] = {
        path: filePath,
        checksum: this.calculateFileChecksum(filePath),
        lastModified: this.getFileLastModified(filePath)
      };
    });

    // Directory checksums
    const directories = [
      { key: 'images', path: this.config.paths.imageSourceDir, extensions: ['.jpg', '.jpeg', '.png', '.webp'] },
      { key: 'testData', path: this.config.paths.testDataDir, extensions: ['.json', '.js'] },
      { key: 'scripts', path: this.config.paths.scriptsDir, extensions: ['.js', '.json'] }
    ];

    directories.forEach(({ key, path: dirPath, extensions }) => {
      checksums.directories[key] = {
        path: dirPath,
        checksum: this.calculateDirectoryChecksum(dirPath, extensions),
        fileCount: this.countFiles(dirPath, extensions),
        lastModified: this.getDirectoryLastModified(dirPath)
      };
    });

    return checksums;
  }

  /**
   * Get file last modified timestamp
   */
  getFileLastModified(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const stat = fs.statSync(filePath);
      return stat.mtime.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get directory last modified timestamp (most recent file)
   */
  getDirectoryLastModified(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        return null;
      }

      const files = this.getFilesRecursively(dirPath);
      let latestTime = 0;

      for (const file of files) {
        const stat = fs.statSync(file);
        if (stat.mtime.getTime() > latestTime) {
          latestTime = stat.mtime.getTime();
        }
      }

      return latestTime > 0 ? new Date(latestTime).toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Count files in directory
   */
  countFiles(dirPath, extensions = null) {
    try {
      if (!fs.existsSync(dirPath)) {
        return 0;
      }
      return this.getFilesRecursively(dirPath, extensions).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Save checksums to file
   */
  saveChecksums(checksums) {
    try {
      const content = JSON.stringify(checksums, null, 2);
      fs.writeFileSync(this.checksumFile, content, 'utf8');
      return true;
    } catch (error) {
      console.error('❌ Could not save checksums:', error.message);
      return false;
    }
  }

  /**
   * Load checksums from file
   */
  loadChecksums() {
    try {
      if (!fs.existsSync(this.checksumFile)) {
        return null;
      }

      const content = fs.readFileSync(this.checksumFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Could not load checksums:', error.message);
      return null;
    }
  }

  /**
   * Detect changes by comparing current checksums with saved ones
   */
  detectChanges() {
    const currentChecksums = this.calculateAllChecksums();
    const previousChecksums = this.loadChecksums();

    if (!previousChecksums) {
      // No previous checksums, everything is considered changed
      return {
        hasChanges: true,
        imagesChanged: true,
        dataChanged: true,
        configChanged: true,
        scriptsChanged: true,
        details: {
          reason: 'No previous checksums found - first run or checksums were cleared',
          changedFiles: [],
          changedDirectories: ['images', 'testData', 'scripts']
        }
      };
    }

    const changes = {
      hasChanges: false,
      imagesChanged: false,
      dataChanged: false,
      configChanged: false,
      scriptsChanged: false,
      details: {
        changedFiles: [],
        changedDirectories: [],
        newFiles: [],
        deletedFiles: []
      }
    };

    // Check file changes
    Object.keys(currentChecksums.files).forEach(key => {
      const current = currentChecksums.files[key];
      const previous = previousChecksums.files?.[key];

      if (!previous) {
        changes.details.newFiles.push(key);
        changes.hasChanges = true;
      } else if (current.checksum !== previous.checksum) {
        changes.details.changedFiles.push(key);
        changes.hasChanges = true;
        
        // Categorize the change
        if (key === 'dataConfig' || key === 'packageJson' || key === 'dockerCompose' || key === 'envFile') {
          changes.configChanged = true;
        }
      }
    });

    // Check for deleted files
    if (previousChecksums.files) {
      Object.keys(previousChecksums.files).forEach(key => {
        if (!currentChecksums.files[key]) {
          changes.details.deletedFiles.push(key);
          changes.hasChanges = true;
          changes.configChanged = true;
        }
      });
    }

    // Check directory changes
    Object.keys(currentChecksums.directories).forEach(key => {
      const current = currentChecksums.directories[key];
      const previous = previousChecksums.directories?.[key];

      if (!previous) {
        changes.details.changedDirectories.push(key);
        changes.hasChanges = true;
        
        // Categorize the change
        switch (key) {
          case 'images':
            changes.imagesChanged = true;
            break;
          case 'testData':
            changes.dataChanged = true;
            break;
          case 'scripts':
            changes.scriptsChanged = true;
            break;
        }
      } else if (current.checksum && previous.checksum && current.checksum !== previous.checksum) {
        changes.details.changedDirectories.push(key);
        changes.hasChanges = true;

        // Categorize the change
        switch (key) {
          case 'images':
            changes.imagesChanged = true;
            break;
          case 'testData':
            changes.dataChanged = true;
            break;
          case 'scripts':
            changes.scriptsChanged = true;
            break;
        }
      }
    });

    return changes;
  }

  /**
   * Get current state
   */
  getState() {
    if (!fs.existsSync(this.stateFile)) {
      return this.getDefaultState();
    }

    try {
      const content = fs.readFileSync(this.stateFile, 'utf8');
      const state = JSON.parse(content);
      
      // Ensure all required fields exist
      return { ...this.getDefaultState(), ...state };
    } catch (error) {
      console.warn('⚠️  Could not read state file, using defaults:', error.message);
      return this.getDefaultState();
    }
  }

  /**
   * Get default state structure
   */
  getDefaultState() {
    return {
      version: '2.0.0',
      lastUpdated: null,
      lastOperation: null,
      currentScenario: null,
      currentResetState: null,
      checksums: {
        lastCalculated: null,
        lastSaved: null
      },
      operations: {
        setup: { status: 'not_started', lastRun: null, duration: null },
        reset: { status: 'not_started', lastRun: null, duration: null },
        seed: { status: 'not_started', lastRun: null, duration: null },
        validation: { status: 'not_started', lastRun: null, duration: null }
      },
      results: {
        images: { processed: 0, uploaded: 0, failed: 0 },
        database: { artists: 0, studios: 0, styles: 0 },
        opensearch: { documents: 0, indexed: 0 },
        frontend: { updated: false, artistCount: 0 }
      },
      services: {
        localstack: { status: 'unknown', lastChecked: null },
        dynamodb: { status: 'unknown', lastChecked: null, tableName: null },
        opensearch: { status: 'unknown', lastChecked: null, indexName: null },
        s3: { status: 'unknown', lastChecked: null, bucketName: null }
      },
      configuration: {
        platform: this.config.environment.platform,
        nodeVersion: this.config.environment.nodeVersion,
        configHash: this.generateConfigHash()
      }
    };
  }

  /**
   * Save state to file
   */
  saveState(state) {
    try {
      state.lastUpdated = new Date().toISOString();
      state.configuration.configHash = this.generateConfigHash();
      
      const content = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.stateFile, content, 'utf8');
      
      return true;
    } catch (error) {
      console.error('❌ Could not save state:', error.message);
      return false;
    }
  }

  /**
   * Update state after operation
   */
  updateState(operation, results = {}) {
    const state = this.getState();
    const timestamp = new Date().toISOString();

    // Update operation status
    if (state.operations[operation.type]) {
      state.operations[operation.type] = {
        status: 'completed',
        lastRun: timestamp,
        duration: operation.duration || null
      };
    }

    // Update results
    if (results.images) {
      state.results.images = { ...state.results.images, ...results.images };
    }
    if (results.database) {
      state.results.database = { ...state.results.database, ...results.database };
    }
    if (results.opensearch) {
      state.results.opensearch = { ...state.results.opensearch, ...results.opensearch };
    }
    if (results.frontend) {
      state.results.frontend = { ...state.results.frontend, ...results.frontend };
    }

    // Update scenario/reset state
    if (operation.scenario) {
      state.currentScenario = operation.scenario;
    }
    if (operation.resetState) {
      state.currentResetState = operation.resetState;
    }

    // Update last operation
    state.lastOperation = {
      type: operation.type,
      timestamp,
      success: true
    };

    // Save updated checksums
    const currentChecksums = this.calculateAllChecksums();
    this.saveChecksums(currentChecksums);
    
    state.checksums.lastCalculated = currentChecksums.timestamp;
    state.checksums.lastSaved = timestamp;

    return this.saveState(state);
  }

  /**
   * Get last state for change detection
   */
  getLastState() {
    return {
      state: this.getState(),
      checksums: this.loadChecksums()
    };
  }

  /**
   * Generate configuration hash for change detection
   */
  generateConfigHash() {
    const configData = {
      services: this.config.services,
      scenarios: Object.keys(this.config.scenarios),
      resetStates: Object.keys(this.config.resetStates),
      paths: this.config.paths
    };
    
    return this.simpleHash(JSON.stringify(configData));
  }

  /**
   * Generate simple hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Check if operation is in progress
   */
  isOperationInProgress() {
    return fs.existsSync(this.lockFile);
  }

  /**
   * Start operation tracking with lock
   */
  startOperation(operationType, details = {}) {
    if (this.isOperationInProgress()) {
      const lock = this.getOperationLock();
      throw new Error(`Another operation is already in progress: ${lock?.type || 'unknown'}`);
    }

    const lockData = {
      type: operationType,
      startTime: new Date().toISOString(),
      pid: process.pid,
      details
    };

    try {
      fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
      
      // Update state
      const state = this.getState();
      if (state.operations[operationType]) {
        state.operations[operationType].status = 'in_progress';
      }
      this.saveState(state);

      return lockData;
    } catch (error) {
      throw new Error(`Could not create operation lock: ${error.message}`);
    }
  }

  /**
   * End operation tracking
   */
  endOperation(success = true, results = {}) {
    if (!this.isOperationInProgress()) {
      console.warn('⚠️  No operation in progress to end');
      return false;
    }

    try {
      const lockData = this.getOperationLock();
      const endTime = new Date().toISOString();
      const duration = Date.now() - new Date(lockData.startTime).getTime();
      
      // Update state with results
      this.updateState({
        type: lockData.type,
        duration,
        scenario: lockData.details.scenario,
        resetState: lockData.details.resetState
      }, results);

      // Add to history
      this.addToHistory({
        type: lockData.type,
        startTime: lockData.startTime,
        endTime,
        duration,
        success,
        results,
        details: lockData.details
      });

      // Remove lock file
      fs.unlinkSync(this.lockFile);
      
      return true;
    } catch (error) {
      console.error('❌ Could not end operation:', error.message);
      return false;
    }
  }

  /**
   * Get current operation lock data
   */
  getOperationLock() {
    if (!fs.existsSync(this.lockFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.lockFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Force unlock (use with caution)
   */
  forceUnlock() {
    if (fs.existsSync(this.lockFile)) {
      fs.unlinkSync(this.lockFile);
      
      // Update state to failed if it was in progress
      const state = this.getState();
      Object.keys(state.operations).forEach(op => {
        if (state.operations[op].status === 'in_progress') {
          state.operations[op].status = 'failed';
        }
      });
      this.saveState(state);
      
      return true;
    }
    return false;
  }

  /**
   * Add entry to operation history
   */
  addToHistory(entry) {
    let history = [];
    
    if (fs.existsSync(this.historyFile)) {
      try {
        const content = fs.readFileSync(this.historyFile, 'utf8');
        history = JSON.parse(content);
      } catch (error) {
        console.warn('⚠️  Could not read history file:', error.message);
      }
    }

    history.unshift({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...entry
    });

    // Keep only last 100 entries
    history = history.slice(0, 100);

    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('❌ Could not save history:', error.message);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Get comprehensive status summary
   */
  getStatusSummary() {
    const state = this.getState();
    const lock = this.getOperationLock();
    const changes = this.detectChanges();
    
    return {
      currentOperation: lock ? {
        type: lock.type,
        startTime: lock.startTime,
        duration: Date.now() - new Date(lock.startTime).getTime()
      } : null,
      operations: state.operations,
      results: state.results,
      services: state.services,
      changes: {
        hasChanges: changes.hasChanges,
        imagesChanged: changes.imagesChanged,
        dataChanged: changes.dataChanged,
        configChanged: changes.configChanged,
        details: changes.details
      },
      checksums: {
        lastCalculated: state.checksums.lastCalculated,
        lastSaved: state.checksums.lastSaved
      },
      lastOperation: state.lastOperation
    };
  }

  /**
   * Reset state and checksums
   */
  resetState() {
    const defaultState = this.getDefaultState();
    this.saveState(defaultState);
    
    // Clear checksums to force full processing on next run
    if (fs.existsSync(this.checksumFile)) {
      fs.unlinkSync(this.checksumFile);
    }
    
    return true;
  }

  /**
   * Clear all state files
   */
  clearAllState() {
    const files = [this.stateFile, this.checksumFile, this.historyFile, this.lockFile];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
    return true;
  }
}

// Create and export default instance
const STATE_MANAGER = new StateManager();

module.exports = {
  STATE_MANAGER,
  StateManager
};

// CLI usage when run directly
if (require.main === module) {
  const manager = new StateManager();
  
  console.log('📊 State Manager - File Checksum Tracking');
  console.log('==========================================\n');
  
  // Calculate and display current checksums
  console.log('🔍 Calculating current checksums...');
  const checksums = manager.calculateAllChecksums();
  
  console.log('\n📁 File Checksums:');
  Object.entries(checksums.files).forEach(([key, data]) => {
    const status = data.checksum ? '✅' : '❌';
    console.log(`  ${key}: ${status} ${data.checksum || 'Not found'}`);
  });
  
  console.log('\n📂 Directory Checksums:');
  Object.entries(checksums.directories).forEach(([key, data]) => {
    const status = data.checksum ? '✅' : '❌';
    console.log(`  ${key}: ${status} ${data.checksum || 'Not found'} (${data.fileCount} files)`);
  });
  
  // Detect changes
  console.log('\n🔄 Change Detection:');
  const changes = manager.detectChanges();
  
  if (changes.hasChanges) {
    console.log('  Status: Changes detected ⚠️');
    console.log(`  Images: ${changes.imagesChanged ? 'Changed' : 'Unchanged'}`);
    console.log(`  Data: ${changes.dataChanged ? 'Changed' : 'Unchanged'}`);
    console.log(`  Config: ${changes.configChanged ? 'Changed' : 'Unchanged'}`);
    
    if (changes.details.changedFiles.length > 0) {
      console.log(`  Changed files: ${changes.details.changedFiles.join(', ')}`);
    }
    if (changes.details.changedDirectories.length > 0) {
      console.log(`  Changed directories: ${changes.details.changedDirectories.join(', ')}`);
    }
  } else {
    console.log('  Status: No changes detected ✅');
  }
  
  // Save checksums
  console.log('\n💾 Saving checksums...');
  const saved = manager.saveChecksums(checksums);
  console.log(`  Result: ${saved ? 'Success ✅' : 'Failed ❌'}`);
  
  // Display status summary
  console.log('\n📋 Status Summary:');
  const summary = manager.getStatusSummary();
  
  if (summary.currentOperation) {
    console.log(`  Current operation: ${summary.currentOperation.type} (${Math.round(summary.currentOperation.duration / 1000)}s)`);
  } else {
    console.log('  Current operation: None');
  }
  
  console.log(`  Last operation: ${summary.lastOperation?.type || 'None'}`);
  console.log(`  Images processed: ${summary.results.images.processed}`);
  console.log(`  Database artists: ${summary.results.database.artists}`);
}