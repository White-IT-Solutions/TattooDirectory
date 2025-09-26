#!/usr/bin/env node

/**
 * Cross-Platform Utilities
 * 
 * Provides cross-platform utilities for path handling, command execution,
 * and environment detection to ensure compatibility across Windows, Linux, and macOS.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

/**
 * Platform detection utilities
 */
class PlatformDetector {
  static get platform() {
    return os.platform();
  }

  static get isWindows() {
    return os.platform() === 'win32';
  }

  static get isLinux() {
    return os.platform() === 'linux';
  }

  static get isMacOS() {
    return os.platform() === 'darwin';
  }

  static get isUnix() {
    return this.isLinux || this.isMacOS;
  }

  static get shell() {
    if (this.isWindows) {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  static get pathSeparator() {
    return path.sep;
  }

  static get envPathSeparator() {
    return this.isWindows ? ';' : ':';
  }
}

/**
 * Cross-platform path utilities
 */
class PathUtils {
  /**
   * Normalize path for current platform
   */
  static normalize(filePath) {
    return path.normalize(filePath);
  }

  /**
   * Join paths with proper separators
   */
  static join(...paths) {
    return path.join(...paths);
  }

  /**
   * Convert path to Unix-style (for scripts)
   */
  static toUnixPath(filePath) {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Convert path to Windows-style
   */
  static toWindowsPath(filePath) {
    return filePath.replace(/\//g, '\\');
  }

  /**
   * Get relative path from project root
   */
  static getRelativePath(filePath, fromPath = process.cwd()) {
    return path.relative(fromPath, filePath);
  }

  /**
   * Ensure directory exists
   */
  static ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  /**
   * Get executable extension for current platform
   */
  static getExecutableExtension() {
    return PlatformDetector.isWindows ? '.exe' : '';
  }

  /**
   * Get script extension for current platform
   */
  static getScriptExtension() {
    return PlatformDetector.isWindows ? '.bat' : '.sh';
  }
}

/**
 * Cross-platform command execution utilities
 */
class CommandUtils {
  /**
   * Execute command with proper shell for platform
   */
  static async executeCommand(command, options = {}) {
    const { cwd = process.cwd(), env = process.env, stdio = 'inherit' } = options;

    return new Promise((resolve, reject) => {
      let shell, shellArgs;

      if (PlatformDetector.isWindows) {
        shell = 'cmd.exe';
        shellArgs = ['/c', command];
      } else {
        shell = '/bin/bash';
        shellArgs = ['-c', command];
      }

      const child = spawn(shell, shellArgs, {
        cwd,
        env,
        stdio,
        windowsHide: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code, success: true });
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Execute command synchronously
   */
  static executeCommandSync(command, options = {}) {
    const { cwd = process.cwd(), env = process.env } = options;

    try {
      const result = execSync(command, {
        cwd,
        env,
        encoding: 'utf8',
        windowsHide: true
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { success: false, error: error.message, output: error.stdout || '' };
    }
  }

  /**
   * Check if command exists in PATH
   */
  static commandExists(command) {
    try {
      const checkCommand = PlatformDetector.isWindows 
        ? `where ${command}` 
        : `which ${command}`;
      
      execSync(checkCommand, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get npm command for current platform
   */
  static getNpmCommand() {
    return PlatformDetector.isWindows ? 'npm.cmd' : 'npm';
  }

  /**
   * Get docker command for current platform
   */
  static getDockerCommand() {
    return 'docker';
  }

  /**
   * Get docker-compose command for current platform
   */
  static getDockerComposeCommand() {
    // Try modern 'docker compose' first, fallback to 'docker-compose'
    if (this.commandExists('docker') && this.executeCommandSync('docker compose version').success) {
      return 'docker compose';
    } else if (this.commandExists('docker-compose')) {
      return 'docker-compose';
    }
    return null;
  }
}

/**
 * Environment variable utilities
 */
class EnvUtils {
  /**
   * Get environment variable with default value
   */
  static get(name, defaultValue = null) {
    return process.env[name] || defaultValue;
  }

  /**
   * Set environment variable
   */
  static set(name, value) {
    process.env[name] = value;
  }

  /**
   * Check if environment variable is set
   */
  static has(name) {
    return name in process.env;
  }

  /**
   * Get all environment variables matching pattern
   */
  static getMatching(pattern) {
    const regex = new RegExp(pattern);
    const matching = {};
    
    Object.keys(process.env).forEach(key => {
      if (regex.test(key)) {
        matching[key] = process.env[key];
      }
    });
    
    return matching;
  }

  /**
   * Load environment variables from file
   */
  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value;
          }
        }
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * File system utilities
 */
class FileUtils {
  /**
   * Check if file exists and is readable
   */
  static isReadable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if file exists and is writable
   */
  static isWritable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file stats safely
   */
  static getStats(filePath) {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Copy file with cross-platform compatibility
   */
  static copyFile(source, destination) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      PathUtils.ensureDir(destDir);
      
      fs.copyFileSync(source, destination);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Read JSON file safely
   */
  static readJSON(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Write JSON file safely
   */
  static writeJSON(filePath, data, indent = 2) {
    try {
      const content = JSON.stringify(data, null, indent);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find files matching pattern
   */
  static findFiles(directory, pattern) {
    const files = [];
    
    if (!fs.existsSync(directory)) {
      return files;
    }

    const regex = new RegExp(pattern);
    
    function searchDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          searchDirectory(fullPath);
        } else if (regex.test(item)) {
          files.push(fullPath);
        }
      });
    }
    
    searchDirectory(directory);
    return files;
  }
}

/**
 * Script generation utilities
 */
class ScriptGenerator {
  /**
   * Generate cross-platform script wrapper
   */
  static generateWrapper(scriptName, command, options = {}) {
    const { description = '', workingDir = '.', env = {} } = options;
    
    const scripts = {};

    // Generate Linux/macOS shell script
    scripts.sh = this.generateShellScript(scriptName, command, { description, workingDir, env });
    
    // Generate Windows batch script
    scripts.bat = this.generateBatchScript(scriptName, command, { description, workingDir, env });

    return scripts;
  }

  /**
   * Generate shell script (.sh)
   */
  static generateShellScript(scriptName, command, options = {}) {
    const { description = '', workingDir = '.', env = {} } = options;
    
    let script = '#!/bin/bash\n';
    script += 'set -e\n\n';
    
    if (description) {
      script += `# ${description}\n\n`;
    }

    // Add environment variables
    Object.entries(env).forEach(([key, value]) => {
      script += `export ${key}="${value}"\n`;
    });
    
    if (Object.keys(env).length > 0) {
      script += '\n';
    }

    // Add working directory change if needed
    if (workingDir !== '.') {
      script += `cd "${workingDir}"\n\n`;
    }

    // Add the main command
    script += `${command}\n`;

    return script;
  }

  /**
   * Generate batch script (.bat)
   */
  static generateBatchScript(scriptName, command, options = {}) {
    const { description = '', workingDir = '.', env = {} } = options;
    
    let script = '@echo off\n';
    script += 'setlocal enabledelayedexpansion\n\n';
    
    if (description) {
      script += `REM ${description}\n\n`;
    }

    // Add environment variables
    Object.entries(env).forEach(([key, value]) => {
      script += `set ${key}=${value}\n`;
    });
    
    if (Object.keys(env).length > 0) {
      script += '\n';
    }

    // Add working directory change if needed
    if (workingDir !== '.') {
      script += `cd /d "${workingDir}"\n`;
      script += 'if errorlevel 1 exit /b 1\n\n';
    }

    // Add the main command
    script += `${command}\n`;
    script += 'if errorlevel 1 exit /b 1\n';

    return script;
  }

  /**
   * Write script files to disk
   */
  static writeScripts(scriptName, scripts, outputDir) {
    const results = {};
    
    Object.entries(scripts).forEach(([extension, content]) => {
      const fileName = `${scriptName}.${extension}`;
      const filePath = path.join(outputDir, fileName);
      
      try {
        PathUtils.ensureDir(outputDir);
        fs.writeFileSync(filePath, content, 'utf8');
        
        // Make shell scripts executable on Unix systems
        if (extension === 'sh' && PlatformDetector.isUnix) {
          fs.chmodSync(filePath, '755');
        }
        
        results[extension] = { success: true, path: filePath };
      } catch (error) {
        results[extension] = { success: false, error: error.message };
      }
    });
    
    return results;
  }
}

// Export all utilities
module.exports = {
  PlatformDetector,
  PathUtils,
  CommandUtils,
  EnvUtils,
  FileUtils,
  ScriptGenerator
};

// CLI usage when run directly
if (require.main === module) {
  console.log('🔧 Platform Utilities Information');
  console.log('=================================\n');
  
  console.log('📋 Platform Detection:');
  console.log(`  Platform: ${PlatformDetector.platform}`);
  console.log(`  Windows: ${PlatformDetector.isWindows}`);
  console.log(`  Linux: ${PlatformDetector.isLinux}`);
  console.log(`  macOS: ${PlatformDetector.isMacOS}`);
  console.log(`  Unix: ${PlatformDetector.isUnix}`);
  console.log(`  Shell: ${PlatformDetector.shell}`);
  console.log(`  Path Separator: "${PlatformDetector.pathSeparator}"`);
  
  console.log('\n🛠️  Available Commands:');
  console.log(`  npm: ${CommandUtils.commandExists('npm') ? '✅' : '❌'}`);
  console.log(`  docker: ${CommandUtils.commandExists('docker') ? '✅' : '❌'}`);
  console.log(`  docker-compose: ${CommandUtils.getDockerComposeCommand() || '❌'}`);
  
  console.log('\n📁 Path Examples:');
  console.log(`  Current Directory: ${process.cwd()}`);
  console.log(`  Normalized Path: ${PathUtils.normalize('./scripts/../tests')}`);
  console.log(`  Unix Path: ${PathUtils.toUnixPath('scripts\\test\\data')}`);
  console.log(`  Windows Path: ${PathUtils.toWindowsPath('scripts/test/data')}`);
  
  console.log('\n🔧 Environment Variables:');
  const envVars = EnvUtils.getMatching('^(NODE_|npm_|PATH)');
  Object.keys(envVars).slice(0, 3).forEach(key => {
    const value = envVars[key];
    const displayValue = value.length > 50 ? `${value.substring(0, 50)}...` : value;
    console.log(`  ${key}: ${displayValue}`);
  });
}