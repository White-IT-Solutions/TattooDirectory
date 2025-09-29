/**
 * Documentation Analyzer Implementation
 * Analyzes existing documentation structure and identifies consolidation opportunities
 */

const IDocumentationAnalyzer = require('./interfaces/IDocumentationAnalyzer');
const fs = require('fs').promises;
const path = require('path');
const { 
  getDocumentationPaths, 
  getProjectRoot, 
  getContentCategories,
  getValidationConfig,
  getProcessingConfig
} = require('../config/documentation-config');
const FileUtils = require('./utils/FileUtils');
const MarkdownUtils = require('./utils/MarkdownUtils');

class DocumentationAnalyzer extends IDocumentationAnalyzer {
  constructor() {
    super();
    this.projectRoot = getProjectRoot();
    this.documentationPaths = getDocumentationPaths();
    this.contentCategories = getContentCategories();
    this.validationConfig = getValidationConfig();
    this.processingConfig = getProcessingConfig();
  }

  /**
   * Discovers all documentation files in the project
   * @returns {Promise<string[]>} Array of documentation file paths
   */
  async discoverFiles() {
    return await this._scanDocumentationFiles();
  }

  /**
   * Finds gaps in documentation coverage
   * @returns {Promise<Object[]>} Array of documentation gaps
   */
  async findGaps() {
    try {
      const currentFiles = await this._scanDocumentationFiles();
      return await this._identifyMissingFiles(currentFiles);
    } catch (error) {
      console.warn('Error finding gaps:', error.message);
      return [];
    }
  }

  /**
   * Analyzes the current documentation structure
   * @returns {Promise<DocumentationMap>} Map of current documentation state
   */
  async analyzeStructure() {
    return await this.analyzeDocumentationStructure();
  }

  /**
   * Validates references in documentation files
   * @returns {Promise<ValidationReport>} Validation results
   */
  async validateReferences() {
    // Implementation will be added in task 5
    throw new Error('validateReferences implementation pending - will be implemented in task 5');
  }

  /**
   * Extracts content from a specific file
   * @param {string} filePath - Path to the file to extract content from
   * @returns {Promise<ContentInfo>} Extracted content information
   */
  async extractContent(filePath) {
    try {
      const content = await FileUtils.readFile(filePath);
      if (!content) return null;
      
      return await this._analyzeFileContent(filePath, content);
    } catch (error) {
      console.error(`❌ Error extracting content from ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Generates a gap analysis report
   * @returns {Promise<GapAnalysisReport>} Gap analysis results
   */
  async generateGapReport() {
    // Implementation will be added in task 6
    throw new Error('generateGapReport implementation pending - will be implemented in task 6');
  }

  /**
   * Maps current documentation files and their status
   * @returns {Promise<DocumentationMap>} Documentation mapping
   */
  async analyzeDocumentationStructure() {
    try {
      console.log('🔍 Analyzing documentation structure...');
      
      const currentFiles = await this._scanDocumentationFiles();
      const movedFiles = await this.identifyMovedFiles();
      const validContent = await this.extractValidContent(currentFiles.map(f => f.path));
      const duplicateContent = await this.detectDuplicates();
      const missingFiles = await this._identifyMissingFiles(currentFiles);

      const documentationMap = {
        currentFiles,
        movedFiles,
        missingFiles,
        duplicateContent,
        validContent
      };

      console.log(`✅ Analysis complete: ${currentFiles.length} files, ${movedFiles.length} moved, ${duplicateContent.length} duplicates`);
      return documentationMap;
    } catch (error) {
      console.error('❌ Error analyzing documentation structure:', error.message);
      throw error;
    }
  }

  /**
   * Identifies files marked as moved and validates their locations
   * @returns {Promise<MovedFileInfo[]>} Information about moved files
   */
  async identifyMovedFiles() {
    try {
      console.log('🔍 Identifying moved files...');
      const movedFiles = [];
      
      // Scan all documentation directories for files
      for (const docPath of this.documentationPaths) {
        if (!(await FileUtils.fileExists(docPath))) continue;
        
        const files = await FileUtils.findFiles(docPath, ['**/*.md', '**/*.txt'], ['**/node_modules/**']);
        
        for (const filePath of files) {
          const content = await FileUtils.readFile(filePath);
          if (!content) continue;
          
          // Check for "moved" indicators in content
          const movedIndicators = [
            /moved to/i,
            /relocated to/i,
            /see.*instead/i,
            /this.*has been moved/i,
            /content.*moved/i,
            /deprecated.*use/i
          ];
          
          const hasMovedIndicator = movedIndicators.some(regex => regex.test(content));
          
          if (hasMovedIndicator) {
            // Try to extract new location from content
            const newPath = this._extractNewLocation(content, filePath);
            const contentMigrated = newPath ? await FileUtils.fileExists(newPath) : false;
            
            movedFiles.push({
              originalPath: path.relative(this.projectRoot, filePath),
              newPath: newPath ? path.relative(this.projectRoot, newPath) : null,
              contentMigrated,
              reason: this._extractMoveReason(content)
            });
          }
        }
      }
      
      console.log(`✅ Found ${movedFiles.length} moved files`);
      return movedFiles;
    } catch (error) {
      console.error('❌ Error identifying moved files:', error.message);
      throw error;
    }
  }

  /**
   * Extracts valid content from existing documentation files
   * @param {string[]} filePaths - Array of file paths to process
   * @returns {Promise<ContentInfo[]>} Valid content information
   */
  async extractValidContent(filePaths) {
    try {
      console.log(`🔍 Extracting valid content from ${filePaths.length} files...`);
      const validContent = [];
      
      for (const filePath of filePaths) {
        const content = await FileUtils.readFile(filePath);
        if (!content) continue;
        
        // Skip files that are too short or marked as moved
        if (content.length < this.validationConfig.minContentLength) continue;
        if (this._isMovedFile(content)) continue;
        
        const contentInfo = await this._analyzeFileContent(filePath, content);
        if (contentInfo) {
          validContent.push(contentInfo);
        }
      }
      
      console.log(`✅ Extracted ${validContent.length} valid content items`);
      return validContent;
    } catch (error) {
      console.error('❌ Error extracting valid content:', error.message);
      throw error;
    }
  }

  /**
   * Detects duplicate or overlapping documentation
   * @returns {Promise<DuplicateInfo[]>} Information about duplicate content
   */
  async detectDuplicates() {
    try {
      console.log('🔍 Detecting duplicate content...');
      const duplicates = [];
      const contentMap = new Map();
      
      // Scan all documentation files and build content signatures
      for (const docPath of this.documentationPaths) {
        if (!(await FileUtils.fileExists(docPath))) continue;
        
        const files = await FileUtils.findFiles(docPath, ['**/*.md', '**/*.txt'], ['**/node_modules/**']);
        
        for (const filePath of files) {
          const content = await FileUtils.readFile(filePath);
          if (!content || content.length < this.validationConfig.minContentLength) continue;
          
          const signature = this._generateContentSignature(content);
          const relativePath = path.relative(this.projectRoot, filePath);
          
          if (contentMap.has(signature)) {
            const existingFiles = contentMap.get(signature);
            existingFiles.push(relativePath);
            contentMap.set(signature, existingFiles);
          } else {
            contentMap.set(signature, [relativePath]);
          }
        }
      }
      
      // Identify duplicates and calculate similarity scores
      for (const [signature, filePaths] of contentMap.entries()) {
        if (filePaths.length > 1) {
          const similarityScore = await this._calculateSimilarityScore(filePaths);
          
          duplicates.push({
            filePaths,
            similarityScore,
            recommendedAction: this._getRecommendedAction(filePaths, similarityScore)
          });
        }
      }
      
      console.log(`✅ Found ${duplicates.length} duplicate content groups`);
      return duplicates;
    } catch (error) {
      console.error('❌ Error detecting duplicates:', error.message);
      throw error;
    }
  }
  // Helper methods

  /**
   * Scans all documentation directories for files
   * @returns {Promise<FileInfo[]>} Array of file information
   * @private
   */
  async _scanDocumentationFiles() {
    const allFiles = [];
    
    for (const docPath of this.documentationPaths) {
      if (!(await FileUtils.fileExists(docPath))) continue;
      
      const files = await FileUtils.findFiles(
        docPath, 
        ['**/*.md', '**/*.txt', '**/README*', '**/CHANGELOG*'], 
        ['**/node_modules/**', '**/.git/**', '**/coverage/**']
      );
      
      for (const filePath of files) {
        const stats = await FileUtils.getFileStats(filePath);
        if (!stats) continue;
        
        const content = await FileUtils.readFile(filePath);
        const status = this._determineFileStatus(content, filePath);
        const contentType = this._categorizeContent(content, filePath);
        const dependencies = this._extractDependencies(content);
        
        allFiles.push({
          path: path.relative(this.projectRoot, filePath),
          status,
          lastModified: stats.mtime,
          contentType,
          dependencies
        });
      }
    }
    
    return allFiles;
  }

  /**
   * Determines the status of a file based on its content
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {string} File status
   * @private
   */
  _determineFileStatus(content, filePath) {
    if (!content || content.length < this.validationConfig.minContentLength) {
      return 'outdated';
    }
    
    if (this._isMovedFile(content)) {
      return 'moved';
    }
    
    // Check if file is a duplicate based on path patterns
    const fileName = path.basename(filePath).toLowerCase();
    if (fileName.includes('copy') || fileName.includes('backup') || fileName.includes('old')) {
      return 'duplicate';
    }
    
    return 'active';
  }

  /**
   * Categorizes content based on keywords and file path
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {string} Content category
   * @private
   */
  _categorizeContent(content, filePath) {
    const lowerContent = content.toLowerCase();
    const lowerPath = filePath.toLowerCase();
    
    for (const [category, config] of Object.entries(this.contentCategories)) {
      const hasKeywords = config.keywords.some(keyword => 
        lowerContent.includes(keyword) || lowerPath.includes(keyword)
      );
      
      if (hasKeywords) {
        return category;
      }
    }
    
    return 'reference';
  }

  /**
   * Extracts file dependencies from content
   * @param {string} content - File content
   * @returns {string[]} Array of dependency paths
   * @private
   */
  _extractDependencies(content) {
    const dependencies = [];
    const links = MarkdownUtils.extractLinks(content);
    
    for (const link of links) {
      if (link.url && !link.url.startsWith('http') && !link.url.startsWith('#')) {
        dependencies.push(link.url);
      }
    }
    
    return dependencies;
  }

  /**
   * Checks if a file is marked as moved
   * @param {string} content - File content
   * @returns {boolean} True if file is marked as moved
   * @private
   */
  _isMovedFile(content) {
    const movedIndicators = [
      /moved to/i,
      /relocated to/i,
      /see.*instead/i,
      /this.*has been moved/i,
      /content.*moved/i,
      /deprecated.*use/i
    ];
    
    return movedIndicators.some(regex => regex.test(content));
  }

  /**
   * Extracts new location from moved file content
   * @param {string} content - File content
   * @param {string} originalPath - Original file path
   * @returns {string|null} New file path or null if not found
   * @private
   */
  _extractNewLocation(content, originalPath) {
    // Look for common patterns indicating new location
    const patterns = [
      /moved to\s+([^\s\n]+)/i,
      /relocated to\s+([^\s\n]+)/i,
      /see\s+([^\s\n]+)\s+instead/i,
      /now at\s+([^\s\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        let newPath = match[1].trim();
        
        // Clean up the path
        newPath = newPath.replace(/[()[\]]/g, '');
        
        // Convert relative path to absolute
        if (!path.isAbsolute(newPath)) {
          newPath = path.resolve(path.dirname(originalPath), newPath);
        }
        
        return newPath;
      }
    }
    
    return null;
  }

  /**
   * Extracts reason for file move from content
   * @param {string} content - File content
   * @returns {string} Move reason
   * @private
   */
  _extractMoveReason(content) {
    if (content.includes('consolidat')) return 'Consolidation';
    if (content.includes('reorganiz')) return 'Reorganization';
    if (content.includes('deprecat')) return 'Deprecation';
    if (content.includes('restructur')) return 'Restructuring';
    return 'Unknown';
  }

  /**
   * Analyzes file content and extracts metadata
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {Promise<ContentInfo>} Content information
   * @private
   */
  async _analyzeFileContent(filePath, content) {
    try {
      const headings = MarkdownUtils.extractHeadings(content);
      const links = MarkdownUtils.extractLinks(content);
      const { frontMatter } = MarkdownUtils.extractFrontMatter(content);
      
      // Extract title from first heading or filename
      let title = path.basename(filePath, path.extname(filePath));
      if (headings.length > 0) {
        title = headings[0].text;
      } else if (frontMatter && frontMatter.title) {
        title = frontMatter.title;
      }
      
      // Generate summary from first paragraph
      const summary = this._generateSummary(content);
      
      // Extract section headings
      const sections = headings.map(h => h.text);
      
      // Extract references
      const references = links
        .filter(link => link.url && !link.url.startsWith('http'))
        .map(link => link.url);
      
      return {
        filePath: path.relative(this.projectRoot, filePath),
        title,
        summary,
        sections,
        references
      };
    } catch (error) {
      console.warn(`Warning: Could not analyze content for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Generates a summary from content
   * @param {string} content - File content
   * @returns {string} Content summary
   * @private
   */
  _generateSummary(content) {
    // Remove front matter and headings
    const { content: cleanContent } = MarkdownUtils.extractFrontMatter(content);
    const lines = cleanContent.split('\n');
    
    // Find first substantial paragraph
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 50 && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
        return trimmed.substring(0, 200) + (trimmed.length > 200 ? '...' : '');
      }
    }
    
    return 'No summary available';
  }

  /**
   * Identifies missing files referenced in documentation
   * @param {FileInfo[]} currentFiles - Current file list
   * @returns {Promise<string[]>} Array of missing file paths
   * @private
   */
  async _identifyMissingFiles(currentFiles) {
    const missingFiles = [];
    const existingPaths = new Set(currentFiles.map(f => f.path));
    
    for (const file of currentFiles) {
      for (const dependency of file.dependencies) {
        if (!dependency || typeof dependency !== 'string') continue;
        
        try {
          // Normalize the dependency path
          const normalizedDep = FileUtils.normalizePath(dependency);
          if (!normalizedDep) continue;
          
          if (!existingPaths.has(normalizedDep)) {
            // Check if file actually exists on filesystem
            const fullPath = path.resolve(this.projectRoot, normalizedDep);
            if (!(await FileUtils.fileExists(fullPath))) {
              missingFiles.push(normalizedDep);
            }
          }
        } catch (error) {
          // Skip invalid paths
          console.warn(`Warning: Invalid dependency path: ${dependency}`);
        }
      }
    }
    
    return [...new Set(missingFiles)];
  }

  /**
   * Generates content signature for duplicate detection
   * @param {string} content - File content
   * @returns {string} Content signature
   * @private
   */
  _generateContentSignature(content) {
    // Remove whitespace and normalize content for comparison
    const normalized = content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // Create a hash-like signature from first 500 characters
    return normalized.substring(0, 500);
  }

  /**
   * Calculates similarity score between files
   * @param {string[]} filePaths - Array of file paths to compare
   * @returns {Promise<number>} Similarity score (0-1)
   * @private
   */
  async _calculateSimilarityScore(filePaths) {
    if (filePaths.length < 2) return 0;
    
    try {
      const contents = [];
      for (const filePath of filePaths) {
        const fullPath = path.resolve(this.projectRoot, filePath);
        const content = await FileUtils.readFile(fullPath);
        if (content) {
          contents.push(content.toLowerCase().replace(/\s+/g, ' '));
        }
      }
      
      if (contents.length < 2) return 0;
      
      // Simple similarity calculation based on common words
      const words1 = new Set(contents[0].split(' '));
      const words2 = new Set(contents[1].split(' '));
      
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      
      return intersection.size / union.size;
    } catch (error) {
      console.warn('Warning: Could not calculate similarity score:', error.message);
      return 0;
    }
  }

  /**
   * Gets recommended action for duplicate files
   * @param {string[]} filePaths - Array of duplicate file paths
   * @param {number} similarityScore - Similarity score
   * @returns {string} Recommended action
   * @private
   */
  _getRecommendedAction(filePaths, similarityScore) {
    if (similarityScore > 0.9) {
      return 'Merge identical files - content is nearly identical';
    } else if (similarityScore > 0.7) {
      return 'Consolidate similar files - significant overlap detected';
    } else if (similarityScore > 0.5) {
      return 'Review for potential consolidation - moderate overlap';
    } else {
      return 'Keep separate - files have different purposes';
    }
  }
}

module.exports = DocumentationAnalyzer;