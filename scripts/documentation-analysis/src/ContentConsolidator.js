/**
 * Content Consolidator Implementation
 * Consolidates and organizes documentation content into unified structure
 */

const IContentConsolidator = require('./interfaces/IContentConsolidator');
const MarkdownUtils = require('./utils/MarkdownUtils');
const FileUtils = require('./utils/FileUtils');
const path = require('path');

class ContentConsolidator extends IContentConsolidator {
  constructor() {
    super();
  }

  /**
   * Consolidates content from a documentation section
   * @param {DocumentationSection} section - Section to consolidate
   * @returns {Promise<string>} Consolidated content
   */
  async consolidateSection(section) {
    if (!section || !section.content || !Array.isArray(section.content)) {
      throw new Error('Invalid section: must have content array');
    }

    const consolidatedParts = [];
    
    // Add section title if provided
    if (section.title) {
      consolidatedParts.push(`# ${section.title}\n`);
    }

    // Process each content block
    for (const block of section.content) {
      if (!block || typeof block.content !== 'string') {
        continue;
      }

      let blockContent = block.content;

      // Add metadata comment if available
      if (block.metadata && block.metadata.source) {
        consolidatedParts.push(`<!-- Source: ${block.metadata.source} -->\n`);
      }

      // Format content based on block type
      switch (block.type) {
        case 'text':
          blockContent = await this.standardizeFormatting(blockContent);
          break;
        case 'code':
          // Ensure code blocks are properly formatted
          if (!blockContent.startsWith('```')) {
            blockContent = `\`\`\`\n${blockContent}\n\`\`\``;
          }
          break;
        case 'command':
          // Format as code block with shell syntax
          if (!blockContent.startsWith('```')) {
            blockContent = `\`\`\`bash\n${blockContent}\n\`\`\``;
          }
          break;
        case 'diagram':
          // Ensure diagrams are in code blocks (likely mermaid)
          if (!blockContent.startsWith('```')) {
            blockContent = `\`\`\`mermaid\n${blockContent}\n\`\`\``;
          }
          break;
        case 'table':
          // Tables should be formatted as markdown tables
          blockContent = this._formatTable(blockContent);
          break;
        default:
          blockContent = await this.standardizeFormatting(blockContent);
      }

      consolidatedParts.push(blockContent);
      consolidatedParts.push(''); // Add spacing between blocks
    }

    return consolidatedParts.join('\n').trim() + '\n';
  }

  /**
   * Updates cross-references in content
   * @param {string} content - Content to update
   * @returns {Promise<string>} Updated content with corrected references
   */
  async updateCrossReferences(content) {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

    let updatedContent = content;

    // Extract all links from the content
    const links = MarkdownUtils.extractLinks(content);
    
    // Build reference map for common documentation moves
    const referenceMap = this._buildCommonReferenceMap();

    // Update each link if it matches a known reference
    for (const link of links) {
      if (link.url && referenceMap[link.url]) {
        const oldPattern = `[${link.text}](${link.url})`;
        const newPattern = `[${link.text}](${referenceMap[link.url]})`;
        updatedContent = updatedContent.replace(oldPattern, newPattern);
      }
    }

    return updatedContent;
  }

  /**
   * Generates navigation structure for documentation
   * @param {DocumentationSection[]} structure - Documentation structure
   * @returns {Promise<Object>} Navigation mapping
   */
  async generateNavigation(structure) {
    if (!Array.isArray(structure)) {
      return { sections: [], hierarchy: {}, byCategory: {} };
    }

    const navigation = {
      sections: [],
      hierarchy: {},
      byCategory: {}
    };

    // Group sections by category
    const categorizedSections = structure.reduce((acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = [];
      }
      acc[section.category].push(section);
      return acc;
    }, {});

    // Build navigation structure
    Object.entries(categorizedSections).forEach(([category, sections]) => {
      navigation.byCategory[category] = sections.map(section => ({
        id: section.id,
        title: section.title,
        targetFile: section.targetFile,
        priority: section.priority
      }));

      // Sort by priority (high -> medium -> low)
      navigation.byCategory[category].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });

    // Create flat sections list
    navigation.sections = structure.map(section => ({
      id: section.id,
      title: section.title,
      category: section.category,
      targetFile: section.targetFile,
      priority: section.priority
    }));

    // Build hierarchy for nested navigation
    navigation.hierarchy = this._buildNavigationHierarchy(structure);

    return navigation;
  }

  /**
   * Validates links in content
   * @param {string} content - Content to validate
   * @returns {Promise<Object>} Link validation results
   */
  async validateLinks(content) {
    if (!content || typeof content !== 'string') {
      return {
        isValid: true,
        totalLinks: 0,
        validLinks: 0,
        invalidLinks: [],
        warnings: []
      };
    }

    const links = MarkdownUtils.extractLinks(content);
    const validationResults = {
      isValid: true,
      totalLinks: links.length,
      validLinks: 0,
      invalidLinks: [],
      warnings: []
    };

    for (const link of links) {
      const validation = await this._validateSingleLink(link);
      
      if (validation.isValid) {
        validationResults.validLinks++;
      } else {
        validationResults.invalidLinks.push({
          text: link.text,
          url: link.url,
          line: link.line,
          reason: validation.reason
        });
        validationResults.isValid = false;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        validationResults.warnings.push(...validation.warnings);
      }
    }

    return validationResults;
  }

  /**
   * Consolidates related documentation into unified files
   * @param {DocumentationSection[]} sections - Sections to consolidate
   * @returns {Promise<Object>} Consolidation results
   */
  async consolidateContent(sections) {
    if (!Array.isArray(sections)) {
      throw new Error('Sections must be an array');
    }

    const results = {
      success: true,
      processedSections: 0,
      generatedFiles: [],
      errors: [],
      warnings: []
    };

    // Group sections by target file
    const sectionsByTarget = sections.reduce((acc, section) => {
      if (!acc[section.targetFile]) {
        acc[section.targetFile] = [];
      }
      acc[section.targetFile].push(section);
      return acc;
    }, {});

    // Process each target file
    for (const [targetFile, fileSections] of Object.entries(sectionsByTarget)) {
      try {
        // Sort sections by priority
        fileSections.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Consolidate all sections for this file
        const consolidatedParts = [];
        
        for (const section of fileSections) {
          const sectionContent = await this.consolidateSection(section);
          consolidatedParts.push(sectionContent);
          results.processedSections++;
        }

        // Combine all parts
        let finalContent = consolidatedParts.join('\n\n');
        
        // Apply final formatting and reference updates
        finalContent = await this.standardizeFormatting(finalContent);
        finalContent = await this.updateCrossReferences(finalContent);

        // Generate table of contents if multiple sections
        if (fileSections.length > 1) {
          const toc = await this.generateTableOfContents(fileSections);
          finalContent = toc + '\n\n' + finalContent;
        }

        results.generatedFiles.push({
          path: targetFile,
          content: finalContent,
          sections: fileSections.length,
          size: finalContent.length
        });

      } catch (error) {
        results.errors.push({
          targetFile,
          error: error.message,
          sections: fileSections.length
        });
        results.success = false;
      }
    }

    return results;
  }

  /**
   * Applies consistent markdown formatting
   * @param {string} content - Content to format
   * @returns {Promise<string>} Formatted content
   */
  async standardizeFormatting(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return MarkdownUtils.standardizeFormatting(content);
  }

  /**
   * Updates internal links and file references
   * @param {string} content - Content to update
   * @param {Object} referenceMap - Mapping of old to new references
   * @returns {Promise<string>} Updated content
   */
  async updateReferences(content, referenceMap = {}) {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

    // Merge with common reference map
    const fullReferenceMap = {
      ...this._buildCommonReferenceMap(),
      ...referenceMap
    };

    return MarkdownUtils.updateLinks(content, fullReferenceMap);
  }

  /**
   * Generates table of contents for navigation
   * @param {DocumentationSection[]} sections - Sections to include
   * @returns {Promise<string>} Generated table of contents
   */
  async generateTableOfContents(sections) {
    if (!Array.isArray(sections) || sections.length === 0) {
      return '';
    }

    const tocLines = ['## Table of Contents', ''];

    // Group sections by category for better organization
    const categorizedSections = sections.reduce((acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = [];
      }
      acc[section.category].push(section);
      return acc;
    }, {});

    // Generate TOC entries
    Object.entries(categorizedSections).forEach(([category, categorySections]) => {
      if (Object.keys(categorizedSections).length > 1) {
        // Add category header if multiple categories
        tocLines.push(`### ${this._formatCategoryTitle(category)}`);
        tocLines.push('');
      }

      categorySections.forEach(section => {
        const anchor = MarkdownUtils.createAnchor(section.title);
        tocLines.push(`- [${section.title}](#${anchor})`);
      });

      tocLines.push('');
    });

    return tocLines.join('\n').trim() + '\n';
  }

  /**
   * Formats a table from raw content
   * @private
   * @param {string} content - Raw table content
   * @returns {string} Formatted markdown table
   */
  _formatTable(content) {
    // If already a markdown table, return as-is
    if (content.includes('|') && content.includes('---')) {
      return content;
    }

    // Simple table formatting for basic cases
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return content;
    }

    // Assume first line is header, rest are data
    const header = lines[0];
    const data = lines.slice(1);

    const formattedLines = [
      `| ${header} |`,
      '| --- |',
      ...data.map(line => `| ${line} |`)
    ];

    return formattedLines.join('\n');
  }

  /**
   * Builds common reference map for documentation moves
   * @private
   * @returns {Object} Reference mapping
   */
  _buildCommonReferenceMap() {
    return {
      // Common documentation moves
      'docs/README-Local.md': 'docs/setup/local-development.md',
      'docs/README-DEVTOOLS.md': 'docs/setup/devtools.md',
      'docs/README-ADVANCED-FEATURES.md': 'docs/workflows/advanced-features.md',
      'docs/README-ErrorHandling.md': 'docs/reference/error-handling.md',
      'localstack-init/README-Local.md': 'docs/setup/localstack.md',
      'devtools/README-DEVTOOLS.md': 'docs/setup/devtools.md',
      
      // Relative path corrections
      '../README.md': './README.md',
      './docs/': './',
      '../docs/': './',
      
      // Common file extensions
      '.txt': '.md',
      '.TXT': '.md'
    };
  }

  /**
   * Validates a single link
   * @private
   * @param {Object} link - Link object from MarkdownUtils
   * @returns {Promise<Object>} Validation result
   */
  async _validateSingleLink(link) {
    const result = {
      isValid: true,
      warnings: []
    };

    if (!link.url) {
      result.isValid = false;
      result.reason = 'Empty URL';
      return result;
    }

    // Check for external links (http/https)
    if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
      // For external links, we assume they're valid (would need network check)
      result.warnings.push(`External link not verified: ${link.url}`);
      return result;
    }

    // Check for anchor links
    if (link.url.startsWith('#')) {
      // Anchor links are assumed valid (would need content analysis)
      return result;
    }

    // Check for relative file paths
    if (!link.url.startsWith('/')) {
      // For relative paths, check if they follow common patterns
      if (link.url.includes('..')) {
        result.warnings.push(`Relative path with parent directory: ${link.url}`);
      }
      
      // Check for common file extensions
      const validExtensions = ['.md', '.txt', '.html', '.pdf', '.png', '.jpg', '.gif'];
      const hasValidExtension = validExtensions.some(ext => link.url.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension && !link.url.includes('#')) {
        result.warnings.push(`Link without file extension: ${link.url}`);
      }
    }

    return result;
  }

  /**
   * Builds navigation hierarchy from sections
   * @private
   * @param {DocumentationSection[]} sections - Sections to organize
   * @returns {Object} Hierarchical navigation structure
   */
  _buildNavigationHierarchy(sections) {
    const hierarchy = {};

    sections.forEach(section => {
      if (!hierarchy[section.category]) {
        hierarchy[section.category] = {
          title: this._formatCategoryTitle(section.category),
          sections: []
        };
      }

      hierarchy[section.category].sections.push({
        id: section.id,
        title: section.title,
        targetFile: section.targetFile,
        priority: section.priority
      });
    });

    // Sort sections within each category by priority
    Object.values(hierarchy).forEach(category => {
      category.sections.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });

    return hierarchy;
  }

  /**
   * Formats category title for display
   * @private
   * @param {string} category - Category name
   * @returns {string} Formatted title
   */
  _formatCategoryTitle(category) {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
  }
}

module.exports = ContentConsolidator;