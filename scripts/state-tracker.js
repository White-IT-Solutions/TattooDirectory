#!/usr/bin/env node

/**
 * State Tracking System
 * 
 * Tracks the state of data management operations, including seeding status,
 * configuration changes, and operation history for better debugging and recovery.
 */

const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('./data-config');

/**
 * State tracking utilities
 */
class StateTracker {
  constructor() {
    this.stateDir = DATA_CONFIG.paths.stateTrackingDir;
    this.stateFile = path.join(this.stateDir, 'state.json');
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
      version: '1.0.0',
      lastUpdated: null,
      currentScenario: null,
      currentResetState: null,
      seeding: {
        status: 'not_started', // not_started, in_progress, completed, failed
        scenario: null,
        startTime: null,
        endTime: null,
        artistCount: 0,
        imagesUploaded: 0,
        errors: []
      },
      services: {
        localstack: { status: 'unknown', lastChecked: null },
        dynamodb: { status: 'unknown', lastChecked: null, tableName: null },
        opensearch: { status: 'unknown', lastChecked: null, indexName: null },
        s3: { status: 'unknown', lastChecked: null, bucketName: null }
      },
      operations: {
        lastReset: null,
        lastSeed: null,
        lastValidation: null,
        lastBackup: null
      },
      configuration: {
        platform: DATA_CONFIG.environment.platform,
        nodeVersion: DATA_CONFIG.environment.nodeVersion,
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
   * Update specific state section
   */
  updateState(section, updates) {
    const state = this.getState();
    
    if (typeof section === 'string') {
      state[section] = { ...state[section], ...updates };
    } else {
      // Direct state update
      Object.assign(state, section);
    }
    
    return this.saveState(state);
  }

  /**
   * Start operation tracking
   */
  startOperation(operationType, details = {}) {
    if (this.isOperationInProgress()) {
      throw new Error('Another operation is already in progress');
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
      this.updateState('seeding', {
        status: 'in_progress',
        startTime: lockData.startTime,
        endTime: null,
        errors: []
      });

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
      
      // Update state
      this.updateState('seeding', {
        status: success ? 'completed' : 'failed',
        endTime,
        ...results
      });

      // Add to history
      this.addToHistory({
        type: lockData.type,
        startTime: lockData.startTime,
        endTime,
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
   * Check if operation is in progress
   */
  isOperationInProgress() {
    return fs.existsSync(this.lockFile);
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
      if (state.seeding.status === 'in_progress') {
        this.updateState('seeding', {
          status: 'failed',
          endTime: new Date().toISOString(),
          errors: ['Operation was force-unlocked']
        });
      }
      
      return true;
    }
    return false;
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName, status, details = {}) {
    const services = this.getState().services;
    services[serviceName] = {
      status,
      lastChecked: new Date().toISOString(),
      ...details
    };
    
    return this.updateState('services', services);
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName) {
    const state = this.getState();
    return state.services[serviceName] || { status: 'unknown', lastChecked: null };
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
   * Get operation history
   */
  getHistory(limit = 10) {
    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.historyFile, 'utf8');
      const history = JSON.parse(content);
      return history.slice(0, limit);
    } catch (error) {
      console.error('❌ Could not read history:', error.message);
      return [];
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    if (fs.existsSync(this.historyFile)) {
      fs.unlinkSync(this.historyFile);
    }
  }

  /**
   * Generate configuration hash for change detection
   */
  generateConfigHash() {
    const configData = {
      services: DATA_CONFIG.services,
      scenarios: Object.keys(DATA_CONFIG.scenarios),
      resetStates: Object.keys(DATA_CONFIG.resetStates)
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
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get status summary
   */
  getStatusSummary() {
    const state = this.getState();
    const lock = this.getOperationLock();
    
    return {
      currentOperation: lock ? {
        type: lock.type,
        startTime: lock.startTime,
        duration: Date.now() - new Date(lock.startTime).getTime()
      } : null,
      lastSeeding: {
        status: state.seeding.status,
        scenario: state.seeding.scenario,
        artistCount: state.seeding.artistCount,
        endTime: state.seeding.endTime
      },
      services: state.services,
      lastOperations: {
        reset: state.operations.lastReset,
        seed: state.operations.lastSeed,
        validation: state.operations.lastValidation,
        backup: state.operations.lastBackup
      }
    };
  }

  /**
   * Reset state (keep history)
   */
  resetState() {
    const defaultState = this.getDefaultState();
    return this.saveState(defaultState);
  }

  /**
   * Export state and history
   */
  exportData() {
    return {
      state: this.getState(),
      history: this.getHistory(50),
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export default instance
const STATE_TRACKER = new StateTracker();

module.exports = {
  STATE_TRACKER,
  StateTracker
};

// CLI usage when run directly
if (require.main === module) {
  const tracker = new StateTracker();
  const summary = tracker.getStatusSummary();
  
  console.log('📊 Data Management State Summary');
  console.log('================================\n');
  
  if (summary.currentOperation) {
    console.log('🔄 Current Operation:');
    console.log(`  Type: ${summary.currentOperation.type}`);
    console.log(`  Started: ${new Date(summary.currentOperation.startTime).toLocaleString()}`);
    console.log(`  Duration: ${Math.round(summary.currentOperation.duration / 1000)}s`);
  } else {
    console.log('✅ No operation in progress');
  }
  
  console.log('\n🌱 Last Seeding:');
  console.log(`  Status: ${summary.lastSeeding.status}`);
  console.log(`  Scenario: ${summary.lastSeeding.scenario || 'None'}`);
  console.log(`  Artists: ${summary.lastSeeding.artistCount}`);
  console.log(`  Completed: ${summary.lastSeeding.endTime ? new Date(summary.lastSeeding.endTime).toLocaleString() : 'Never'}`);
  
  console.log('\n🌐 Services:');
  Object.entries(summary.services).forEach(([name, service]) => {
    const statusIcon = service.status === 'running' ? '✅' : 
                      service.status === 'stopped' ? '❌' : '❓';
    console.log(`  ${name}: ${statusIcon} ${service.status}`);
  });
  
  console.log('\n📋 Recent History:');
  const history = tracker.getHistory(5);
  if (history.length === 0) {
    console.log('  No operations recorded');
  } else {
    history.forEach(entry => {
      const icon = entry.success ? '✅' : '❌';
      const time = new Date(entry.timestamp).toLocaleString();
      console.log(`  ${icon} ${entry.type} - ${time}`);
    });
  }
}