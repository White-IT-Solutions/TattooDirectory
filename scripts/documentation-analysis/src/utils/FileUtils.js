/**
 * File Utilities for Documentation Processing
 * Common file system operations and utilities
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class FileUtils {
  /**
   * Recursively finds files matching patterns
   * @param {string} baseDir - Base directory to search
   * @param {string[]} includePatterns - Patterns to include
   * @param {string[]} excludePatterns - Patterns to exclude
   * @returns {Promise<string[]>} Array of matching file paths
   */
  static async findFiles(baseDir, includePatterns = ['**/*'], excludePatterns = []) {
    try {
      const allFiles = [];
      
      for (const pattern of includePatterns) {
        const files = await glob(pattern, {
          cwd: baseDir,
          ignore: excludePatterns,
          nodir: true
        });
        allFiles.push(...files.map(file => path.join(baseDir, file)));
      }
      
      // Remove duplicates
      return [...new Set(allFiles)];
    } catch (error) {
      console.warn(`Warning: Error finding files in ${baseDir}: ${error.message}`);
      return [];
    }
  }

  /**
   * Checks if a file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if file exists
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file statistics
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File stats or null if file doesn't exist
   */
  static async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Reads file content safely
   * @param {string} filePath - Path to file
   * @param {string} encoding - File encoding (default: utf8)
   * @returns {Promise<string|null>} File content or null if error
   */
  static async readFile(filePath, encoding = 'utf8') {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Writes file content safely, creating directories if needed
   * @param {string} filePath - Path to file
   * @param {string} content - Content to write
   * @param {string} encoding - File encoding (default: utf8)
   * @returns {Promise<boolean>} True if successful
   */
  static async writeFile(filePath, content, encoding = 'utf8') {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, encoding);
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Creates a backup of a file
   * @param {string} filePath - Path to file to backup
   * @param {string} backupDir - Directory to store backup
   * @returns {Promise<string|null>} Backup file path or null if failed
   */
  static async createBackup(filePath, backupDir) {
    try {
      const content = await this.readFile(filePath);
      if (content === null) return null;

      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${fileName}.${timestamp}.backup`;
      const backupPath = path.join(backupDir, backupFileName);

      const success = await this.writeFile(backupPath, content);
      return success ? backupPath : null;
    } catch (error) {
      console.error(`Error creating backup for ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets relative path from one file to another
   * @param {string} fromPath - Source path
   * @param {string} toPath - Target path
   * @returns {string} Relative path
   */
  static getRelativePath(fromPath, toPath) {
    return path.relative(path.dirname(fromPath), toPath);
  }

  /**
   * Normalizes file path for cross-platform compatibility
   * @param {string} filePath - Path to normalize
   * @returns {string} Normalized path
   */
  static normalizePath(filePath) {
    return path.normalize(filePath).replace(/\\/g, '/');
  }

  /**
   * Checks if a path is within a directory
   * @param {string} filePath - File path to check
   * @param {string} directory - Directory to check against
   * @returns {boolean} True if path is within directory
   */
  static isPathWithinDirectory(filePath, directory) {
    const relative = path.relative(directory, filePath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Gets file extension
   * @param {string} filePath - File path
   * @returns {string} File extension (including dot)
   */
  static getFileExtension(filePath) {
    return path.extname(filePath);
  }

  /**
   * Gets file name without extension
   * @param {string} filePath - File path
   * @returns {string} File name without extension
   */
  static getFileNameWithoutExtension(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    return fileName.slice(0, -ext.length);
  }

  /**
   * Ensures directory exists
   * @param {string} dirPath - Directory path
   * @returns {Promise<boolean>} True if successful
   */
  static async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Error creating directory ${dirPath}: ${error.message}`);
      return false;
    }
  }
}

module.exports = FileUtils;