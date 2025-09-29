/**
 * Documentation Validator Implementation
 * Validates documentation accuracy and completeness
 */

const IDocumentationValidator = require('./interfaces/IDocumentationValidator');
const FileUtils = require('./utils/FileUtils');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class DocumentationValidator extends IDocumentationValidator {
  constructor(config = {}) {
    super();
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      commandTimeout: config.commandTimeout || 30000,
      skipCommandValidation: config.skipCommandValidation || ['dev', 'start', 'serve', 'watch'],
      codeFileExtensions: config.codeFileExtensions || ['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml'],
      ...config
    };
  }

  /**
   * Validates markdown syntax across all documentation
   * @returns {Promise<Object>} Syntax validation results
   */
  async validateSyntax() {
    try {
      const docs = await this._getAllDocumentationFiles();
      const errors = [];
      const warnings = [];
      
      for (const doc of docs) {
        try {
          const content = await FileUtils.readFile(doc.path);
          // Basic markdown validation
          if (!content.trim()) {
            warnings.push({ file: doc.path, message: 'Empty file' });
          }
        } catch (error) {
          errors.push({ file: doc.path, error: error.message });
        }
      }
      
      return { errors, warnings };
    } catch (error) {
      return { errors: [{ error: error.message }], warnings: [] };
    }
  }

  /**
   * Validates links and references in documentation
   * @returns {Promise<Object>} Link validation results
   */
  async validateLinks() {
    try {
      const docs = await this._getAllDocumentationFiles();
      const references = await this._extractReferences(docs);
      const brokenRefs = await this._validateCrossReferences(references);
      
      return {
        errors: brokenRefs,
        warnings: [],
        total: references.length
      };
    } catch (error) {
      return { errors: [{ error: error.message }], warnings: [] };
    }
  }

  /**
   * Validates content structure
   * @returns {Promise<Object>} Structure validation results
   */
  async validateStructure() {
    try {
      const docs = await this._getAllDocumentationFiles();
      const errors = [];
      const warnings = [];
      
      for (const doc of docs) {
        // Basic structure validation
        if (doc.path.includes('README') && !doc.content?.includes('#')) {
          warnings.push({ file: doc.path, message: 'README missing main heading' });
        }
      }
      
      return { errors, warnings };
    } catch (error) {
      return { errors: [{ error: error.message }], warnings: [] };
    }
  }

  /**
   * Checks content freshness and outdated information
   * @returns {Promise<Object>} Freshness check results
   */
  async checkFreshness() {
    try {
      const docs = await this._getAllDocumentationFiles();
      const warnings = [];
      
      // Check for outdated content patterns
      for (const doc of docs) {
        if (doc.content?.includes('TODO') || doc.content?.includes('FIXME')) {
          warnings.push({ file: doc.path, message: 'Contains TODO/FIXME items' });
        }
      }
      
      return { warnings, errors: [] };
    } catch (error) {
      return { errors: [{ error: error.message }], warnings: [] };
    }
  }

  /**
   * Validates a single file
   * @param {string} filePath - Path to file to validate
   * @returns {Promise<Object>} Validation result for single file
   */
  async validateFile(filePath) {
    try {
      const content = await FileUtils.readFile(filePath);
      const errors = [];
      const warnings = [];
      
      if (!content.trim()) {
        warnings.push('File is empty');
      }
      
      return { success: errors.length === 0, errors, warnings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets all documentation files
   * @private
   * @returns {Promise<Object[]>} Array of documentation file objects
   */
  async _getAllDocumentationFiles() {
    const FileUtils = require('./utils/FileUtils');
    const files = await FileUtils.findFiles(process.cwd(), ['**/*.md'], ['**/node_modules/**']);
    
    const docs = [];
    for (const file of files) {
      try {
        const content = await FileUtils.readFile(file);
        docs.push({ path: file, content });
      } catch (error) {
        docs.push({ path: file, error: error.message });
      }
    }
    
    return docs;
  }

  /**
   * Validates a complete documentation set
   * @param {Object} docs - Documentation set to validate
   * @returns {Promise<ValidationReport>} Validation results
   */
  async validateDocumentationSet(docs) {
    try {
      // Perform individual validations, catching errors for each
      let pathValidation;
      try {
        pathValidation = await this.validatePaths(docs.paths || []);
      } catch (error) {
        pathValidation = { isValid: false, invalidPaths: docs.paths || [], suggestions: [] };
      }

      let commandValidation;
      try {
        commandValidation = await this.checkCommandAccuracy(docs.commands || []);
      } catch (error) {
        commandValidation = { isValid: false, failedCommands: [], suggestions: [] };
      }

      let contentValidation;
      try {
        contentValidation = await this.validateCodeExamples(docs.codeSnippets || []);
      } catch (error) {
        contentValidation = { isValid: false, issues: [], warnings: [] };
      }

      let crossReferenceValidation;
      try {
        crossReferenceValidation = await this._validateCrossReferences(docs.references || []);
      } catch (error) {
        crossReferenceValidation = { isValid: false, brokenReferences: [], suggestions: [] };
      }

      // Calculate overall score based on validation results
      const scores = [
        pathValidation.isValid ? 25 : 0,
        commandValidation.isValid ? 25 : 0,
        contentValidation.isValid ? 25 : 0,
        crossReferenceValidation.isValid ? 25 : 0
      ];
      const overallScore = scores.reduce((sum, score) => sum + score, 0);

      return {
        pathValidation,
        commandValidation,
        contentValidation,
        crossReferenceValidation,
        overallScore
      };
    } catch (error) {
      console.error('Error validating documentation set:', error);
      return {
        pathValidation: { isValid: false, invalidPaths: [], suggestions: [] },
        commandValidation: { isValid: false, failedCommands: [], suggestions: [] },
        contentValidation: { isValid: false, issues: [], warnings: [] },
        crossReferenceValidation: { isValid: false, brokenReferences: [], suggestions: [] },
        overallScore: 0
      };
    }
  }

  /**
   * Checks accuracy of file paths
   * @param {string[]} paths - Array of paths to validate
   * @returns {Promise<PathValidationResult>} Path validation results
   */
  async checkPathAccuracy(paths) {
    return this.validatePaths(paths);
  }

  /**
   * Validates command examples in documentation
   * @param {Command[]} commands - Commands to validate
   * @returns {Promise<CommandValidationResult>} Command validation results
   */
  async validateCommandExamples(commands) {
    return this.checkCommandAccuracy(commands);
  }

  /**
   * Generates compliance report
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport() {
    try {
      // Analyze project structure for compliance
      const projectFiles = await FileUtils.findFiles(this.config.projectRoot, ['**/*.md', '**/*.json'], ['**/node_modules/**']);
      const packageJsonFiles = projectFiles.filter(f => f.endsWith('package.json'));
      
      const commands = [];
      for (const pkgFile of packageJsonFiles) {
        const content = await FileUtils.readFile(pkgFile);
        if (content) {
          try {
            const pkg = JSON.parse(content);
            if (pkg.scripts) {
              Object.entries(pkg.scripts).forEach(([name, script]) => {
                commands.push({
                  name,
                  script,
                  source: pkgFile,
                  category: this._categorizeCommand(name)
                });
              });
            }
          } catch (e) {
            console.warn(`Could not parse package.json: ${pkgFile}`);
          }
        }
      }

      const documentationFiles = projectFiles.filter(f => f.endsWith('.md'));
      const extractedPaths = await this._extractPathsFromDocumentation(documentationFiles);
      const paths = [...projectFiles, ...extractedPaths];

      const validationReport = await this.validateDocumentationSet({
        paths,
        commands,
        codeSnippets: await this._extractCodeSnippets(documentationFiles),
        references: await this._extractReferences(documentationFiles)
      });

      return {
        timestamp: new Date().toISOString(),
        projectRoot: this.config.projectRoot,
        totalFiles: projectFiles.length,
        documentationFiles: documentationFiles.length,
        packageJsonFiles: packageJsonFiles.length,
        totalCommands: commands.length,
        validationReport,
        recommendations: this._generateRecommendations(validationReport)
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        validationReport: null
      };
    }
  }

  /**
   * Validates that all file paths and references are correct
   * @param {string[]} paths - Paths to validate
   * @returns {Promise<PathValidationResult>} Validation results
   */
  async validatePaths(paths) {
    const invalidPaths = [];
    const suggestions = [];

    for (const filePath of paths) {
      try {
        // Convert relative paths to absolute paths
        const absolutePath = path.isAbsolute(filePath) 
          ? filePath 
          : path.join(this.config.projectRoot, filePath);

        const exists = await FileUtils.fileExists(absolutePath);
        if (!exists) {
          invalidPaths.push(filePath);
          
          // Try to suggest similar paths
          const suggestion = await this._suggestSimilarPath(filePath);
          if (suggestion) {
            suggestions.push(`${filePath} -> ${suggestion}`);
          }
        }
      } catch (error) {
        invalidPaths.push(filePath);
        console.warn(`Error validating path ${filePath}: ${error.message}`);
      }
    }

    return {
      isValid: invalidPaths.length === 0,
      invalidPaths,
      suggestions
    };
  }

  /**
   * Checks that documented commands work correctly
   * @param {Command[]} commands - Commands to check
   * @returns {Promise<CommandValidationResult>} Validation results
   */
  async checkCommandAccuracy(commands) {
    const failedCommands = [];
    const suggestions = [];

    for (const command of commands) {
      // Skip commands that are known to be interactive or long-running
      if (this.config.skipCommandValidation.some(skip => command.name.includes(skip))) {
        continue;
      }

      try {
        // For npm scripts, validate they exist in package.json
        if (command.script && command.script.startsWith('npm run')) {
          const scriptName = command.script.replace('npm run ', '');
          const isValid = await this._validateNpmScript(scriptName, command.source);
          
          if (!isValid) {
            failedCommands.push({
              command: command.name,
              script: command.script,
              error: 'Script not found in package.json',
              source: command.source
            });
            suggestions.push(`Check if script '${scriptName}' exists in package.json`);
          }
        }
        
        // For simple commands, try basic validation without execution
        else if (command.script) {
          const isValid = await this._validateCommandSyntax(command.script);
          if (!isValid) {
            failedCommands.push({
              command: command.name,
              script: command.script,
              error: 'Invalid command syntax',
              source: command.source
            });
            suggestions.push(`Check syntax of command: ${command.script}`);
          }
        }
      } catch (error) {
        failedCommands.push({
          command: command.name,
          script: command.script,
          error: error.message,
          source: command.source
        });
      }
    }

    return {
      isValid: failedCommands.length === 0,
      failedCommands,
      suggestions
    };
  }

  /**
   * Validates that code snippets are syntactically correct
   * @param {string[]} codeSnippets - Code snippets to validate
   * @returns {Promise<ContentValidationResult>} Validation results
   */
  async validateCodeExamples(codeSnippets) {
    const issues = [];
    const warnings = [];

    for (let i = 0; i < codeSnippets.length; i++) {
      const snippet = codeSnippets[i];
      
      try {
        // Detect code language from snippet
        const language = this._detectCodeLanguage(snippet);
        
        if (language === 'javascript' || language === 'json') {
          const validationResult = await this._validateJavaScriptCode(snippet);
          if (!validationResult.isValid) {
            issues.push(`Snippet ${i + 1}: ${validationResult.error}`);
          }
          if (validationResult.warnings) {
            warnings.push(...validationResult.warnings.map(w => `Snippet ${i + 1}: ${w}`));
          }
        } else if (language === 'bash' || language === 'shell') {
          const validationResult = await this._validateShellCode(snippet);
          if (!validationResult.isValid) {
            issues.push(`Snippet ${i + 1}: ${validationResult.error}`);
          }
        } else {
          // For other languages, do basic checks
          if (snippet.trim().length === 0) {
            warnings.push(`Snippet ${i + 1}: Empty code snippet`);
          }
        }
      } catch (error) {
        issues.push(`Snippet ${i + 1}: Validation error - ${error.message}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Identifies missing documentation
   * @param {Object} projectStructure - Project structure to analyze
   * @returns {Promise<Object>} Completeness analysis
   */
  async checkCompleteness(projectStructure) {
    try {
      const missingDocs = [];
      const recommendations = [];

      // Check for essential documentation files
      const essentialFiles = [
        'README.md',
        'docs/README.md',
        'CONTRIBUTING.md',
        'CHANGELOG.md'
      ];

      for (const file of essentialFiles) {
        const filePath = path.join(this.config.projectRoot, file);
        const exists = await FileUtils.fileExists(filePath);
        if (!exists) {
          missingDocs.push({
            type: 'file',
            name: file,
            importance: 'high',
            description: `Essential documentation file missing: ${file}`
          });
        }
      }

      // Check for component documentation
      if (projectStructure.components) {
        for (const component of projectStructure.components) {
          if (!component.documentation) {
            missingDocs.push({
              type: 'component',
              name: component.name,
              importance: 'medium',
              description: `Component ${component.name} lacks documentation`
            });
          }
        }
      }

      // Check for API documentation
      if (projectStructure.apis) {
        for (const api of projectStructure.apis) {
          if (!api.documentation) {
            missingDocs.push({
              type: 'api',
              name: api.name,
              importance: 'high',
              description: `API ${api.name} lacks documentation`
            });
          }
        }
      }

      // Generate recommendations
      if (missingDocs.length > 0) {
        recommendations.push('Create missing essential documentation files');
        recommendations.push('Document all public APIs and components');
        recommendations.push('Establish documentation standards and templates');
      }

      return {
        missingDocumentation: missingDocs,
        completenessScore: this._calculateCompletenessScore(projectStructure, missingDocs),
        recommendations,
        analysis: {
          totalComponents: projectStructure.components?.length || 0,
          documentedComponents: projectStructure.components?.filter(c => c.documentation).length || 0,
          totalApis: projectStructure.apis?.length || 0,
          documentedApis: projectStructure.apis?.filter(a => a.documentation).length || 0
        }
      };
    } catch (error) {
      console.error('Error checking completeness:', error);
      return {
        missingDocumentation: [],
        completenessScore: 0,
        recommendations: ['Error occurred during completeness analysis'],
        analysis: {},
        error: error.message
      };
    }
  }

  // Private helper methods

  /**
   * Validates cross-references in documentation
   * @param {string[]} references - References to validate
   * @returns {Promise<CrossReferenceValidationResult>} Validation results
   * @private
   */
  async _validateCrossReferences(references) {
    const brokenReferences = [];
    const suggestions = [];

    for (const ref of references) {
      // Check if reference is a file path
      if (ref.startsWith('./') || ref.startsWith('../') || ref.includes('/')) {
        const exists = await FileUtils.fileExists(path.join(this.config.projectRoot, ref));
        if (!exists) {
          brokenReferences.push(ref);
          const suggestion = await this._suggestSimilarPath(ref);
          if (suggestion) {
            suggestions.push(`${ref} -> ${suggestion}`);
          }
        }
      }
      // Check if reference is a URL
      else if (ref.startsWith('http://') || ref.startsWith('https://')) {
        // For now, we'll assume URLs are valid (could add HTTP check in future)
        continue;
      }
    }

    return {
      isValid: brokenReferences.length === 0,
      brokenReferences,
      suggestions
    };
  }

  /**
   * Suggests similar paths for invalid paths
   * @param {string} invalidPath - Invalid path
   * @returns {Promise<string|null>} Suggested path or null
   * @private
   */
  async _suggestSimilarPath(invalidPath) {
    try {
      const dirname = path.dirname(invalidPath);
      const basename = path.basename(invalidPath);
      const searchDir = path.join(this.config.projectRoot, dirname);
      
      const exists = await FileUtils.fileExists(searchDir);
      if (!exists) return null;

      const files = await FileUtils.findFiles(searchDir, ['*'], []);
      const suggestions = files
        .map(f => path.basename(f))
        .filter(f => this._calculateSimilarity(f, basename) > 0.6)
        .sort((a, b) => this._calculateSimilarity(b, basename) - this._calculateSimilarity(a, basename));

      return suggestions.length > 0 ? path.join(dirname, suggestions[0]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Calculates similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   * @private
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Categorizes a command based on its name
   * @param {string} commandName - Command name
   * @returns {string} Command category
   * @private
   */
  _categorizeCommand(commandName) {
    const categories = {
      data: ['seed', 'data', 'database', 'migration', 'reset'],
      development: ['dev', 'start', 'serve', 'watch', 'hot'],
      testing: ['test', 'spec', 'coverage', 'e2e', 'integration'],
      deployment: ['build', 'deploy', 'publish', 'release', 'docker'],
      monitoring: ['monitor', 'health', 'performance', 'benchmark', 'validate']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => commandName.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Extracts file paths from documentation files
   * @param {string[]} documentationFiles - Documentation file paths
   * @returns {Promise<string[]>} Extracted paths
   * @private
   */
  async _extractPathsFromDocumentation(documentationFiles) {
    const paths = [];
    const pathRegex = /(?:\.\/|\.\.\/|\/)?[\w\-\.\/]+\.(md|js|ts|json|yaml|yml|txt|sh|bat|ps1)/g;

    for (const file of documentationFiles) {
      const content = await FileUtils.readFile(file);
      if (content) {
        const matches = content.match(pathRegex);
        if (matches) {
          paths.push(...matches);
        }
      }
    }

    return [...new Set(paths)];
  }

  /**
   * Extracts code snippets from documentation files
   * @param {string[]} documentationFiles - Documentation file paths
   * @returns {Promise<string[]>} Extracted code snippets
   * @private
   */
  async _extractCodeSnippets(documentationFiles) {
    const snippets = [];
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;

    for (const file of documentationFiles) {
      const content = await FileUtils.readFile(file);
      if (content) {
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
          snippets.push(match[1]);
        }
      }
    }

    return snippets;
  }

  /**
   * Extracts references from documentation files
   * @param {string[]} documentationFiles - Documentation file paths
   * @returns {Promise<string[]>} Extracted references
   * @private
   */
  async _extractReferences(documentationFiles) {
    const references = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    for (const file of documentationFiles) {
      const content = await FileUtils.readFile(file);
      if (content) {
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          references.push(match[2]);
        }
      }
    }

    return [...new Set(references)];
  }

  /**
   * Validates npm script exists in package.json
   * @param {string} scriptName - Script name
   * @param {string} packageJsonPath - Path to package.json
   * @returns {Promise<boolean>} True if script exists
   * @private
   */
  async _validateNpmScript(scriptName, packageJsonPath) {
    try {
      const content = await FileUtils.readFile(packageJsonPath);
      if (!content) return false;

      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts[scriptName] !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Validates command syntax
   * @param {string} command - Command to validate
   * @returns {Promise<boolean>} True if syntax is valid
   * @private
   */
  async _validateCommandSyntax(command) {
    // Basic syntax validation - check for common issues
    if (!command || command.trim().length === 0) return false;
    
    // Check for unmatched quotes
    const singleQuotes = (command.match(/'/g) || []).length;
    const doubleQuotes = (command.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) return false;
    
    // Check for unmatched parentheses
    const openParens = (command.match(/\(/g) || []).length;
    const closeParens = (command.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) return false;

    return true;
  }

  /**
   * Detects programming language from code snippet
   * @param {string} snippet - Code snippet
   * @returns {string} Detected language
   * @private
   */
  _detectCodeLanguage(snippet) {
    // Simple language detection based on common patterns
    if (snippet.includes('function') || snippet.includes('const ') || snippet.includes('let ')) {
      return 'javascript';
    }
    if (snippet.trim().startsWith('{') && snippet.trim().endsWith('}')) {
      return 'json';
    }
    if (snippet.includes('#!/bin/bash') || snippet.includes('echo ') || snippet.includes('cd ')) {
      return 'bash';
    }
    if (snippet.includes('npm ') || snippet.includes('node ') || snippet.includes('git ')) {
      return 'shell';
    }
    
    return 'unknown';
  }

  /**
   * Validates JavaScript code snippet
   * @param {string} code - JavaScript code
   * @returns {Promise<Object>} Validation result
   * @private
   */
  async _validateJavaScriptCode(code) {
    try {
      // Try to parse as JSON first
      if (code.trim().startsWith('{') || code.trim().startsWith('[')) {
        JSON.parse(code);
        return { isValid: true };
      }

      // For JavaScript, do basic syntax checking
      // This is a simplified check - in production, you might use a proper parser
      const issues = [];
      const warnings = [];

      // Check for common syntax issues
      if (code.includes('console.log') && !code.includes('// TODO: remove')) {
        warnings.push('Contains console.log statement');
      }

      // Check for unmatched braces
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push('Unmatched braces');
      }

      return {
        isValid: issues.length === 0,
        error: issues.join(', '),
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validates shell code snippet
   * @param {string} code - Shell code
   * @returns {Promise<Object>} Validation result
   * @private
   */
  async _validateShellCode(code) {
    const issues = [];

    // Check for common shell syntax issues
    if (code.includes('cd ') && !code.includes('&&')) {
      issues.push('cd command should be followed by && for proper error handling');
    }

    // Check for unquoted variables that might contain spaces
    const variableRegex = /\$\w+/g;
    const matches = code.match(variableRegex);
    if (matches) {
      for (const match of matches) {
        if (!code.includes(`"${match}"`) && !code.includes(`'${match}'`)) {
          issues.push(`Variable ${match} should be quoted`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      error: issues.join(', ')
    };
  }

  /**
   * Generates recommendations based on validation results
   * @param {ValidationReport} validationReport - Validation results
   * @returns {string[]} Array of recommendations
   * @private
   */
  _generateRecommendations(validationReport) {
    const recommendations = [];

    if (!validationReport.pathValidation.isValid) {
      recommendations.push('Fix invalid file paths and references');
      recommendations.push('Consider using relative paths for better portability');
    }

    if (!validationReport.commandValidation.isValid) {
      recommendations.push('Update or fix failing command examples');
      recommendations.push('Test all documented commands before publishing');
    }

    if (!validationReport.contentValidation.isValid) {
      recommendations.push('Fix syntax errors in code examples');
      recommendations.push('Use proper code formatting and syntax highlighting');
    }

    if (!validationReport.crossReferenceValidation.isValid) {
      recommendations.push('Fix broken cross-references and links');
      recommendations.push('Implement automated link checking in CI/CD');
    }

    if (validationReport.overallScore < 75) {
      recommendations.push('Overall documentation quality needs improvement');
      recommendations.push('Consider implementing documentation standards and review process');
    }

    return recommendations;
  }

  /**
   * Calculates completeness score
   * @param {Object} projectStructure - Project structure
   * @param {Array} missingDocs - Missing documentation items
   * @returns {number} Completeness score (0-100)
   * @private
   */
  _calculateCompletenessScore(projectStructure, missingDocs) {
    const totalItems = (projectStructure.components?.length || 0) + 
                      (projectStructure.apis?.length || 0) + 
                      4; // 4 essential files

    const missingItems = missingDocs.length;
    const completenessRatio = Math.max(0, (totalItems - missingItems) / totalItems);
    
    return Math.round(completenessRatio * 100);
  }
}

module.exports = DocumentationValidator;