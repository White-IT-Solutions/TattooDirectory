/**
 * Markdown Utilities for Documentation Processing
 * Utilities for parsing and manipulating markdown content
 */

class MarkdownUtils {
  /**
   * Extracts headings from markdown content
   * @param {string} content - Markdown content
   * @returns {Array} Array of heading objects with level, text, and line number
   */
  static extractHeadings(content) {
    const headings = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index + 1,
          anchor: this.createAnchor(match[2].trim())
        });
      }
    });
    
    return headings;
  }

  /**
   * Creates URL-friendly anchor from heading text
   * @param {string} text - Heading text
   * @returns {string} URL-friendly anchor
   */
  static createAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Extracts links from markdown content
   * @param {string} content - Markdown content
   * @returns {Array} Array of link objects with text, url, and line number
   */
  static extractLinks(content) {
    const links = [];
    const lines = content.split('\n');
    
    // Match both inline links [text](url) and reference links [text][ref]
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]\[([^\]]+)\]/g;
    
    lines.forEach((line, index) => {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        if (match[2]) {
          // Inline link
          links.push({
            text: match[1],
            url: match[2],
            line: index + 1,
            type: 'inline'
          });
        } else if (match[4]) {
          // Reference link
          links.push({
            text: match[3],
            reference: match[4],
            line: index + 1,
            type: 'reference'
          });
        }
      }
    });
    
    return links;
  }

  /**
   * Extracts code blocks from markdown content
   * @param {string} content - Markdown content
   * @returns {Array} Array of code block objects
   */
  static extractCodeBlocks(content) {
    const codeBlocks = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let currentBlock = null;
    
    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          const language = line.slice(3).trim();
          currentBlock = {
            language: language || 'text',
            startLine: index + 1,
            content: []
          };
          inCodeBlock = true;
        } else {
          // End of code block
          currentBlock.endLine = index + 1;
          currentBlock.content = currentBlock.content.join('\n');
          codeBlocks.push(currentBlock);
          inCodeBlock = false;
          currentBlock = null;
        }
      } else if (inCodeBlock && currentBlock) {
        currentBlock.content.push(line);
      }
    });
    
    return codeBlocks;
  }

  /**
   * Extracts front matter from markdown content
   * @param {string} content - Markdown content
   * @returns {Object} Object with frontMatter and content
   */
  static extractFrontMatter(content) {
    const lines = content.split('\n');
    
    if (lines[0] !== '---') {
      return { frontMatter: null, content };
    }
    
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex === -1) {
      return { frontMatter: null, content };
    }
    
    const frontMatterLines = lines.slice(1, endIndex);
    const remainingContent = lines.slice(endIndex + 1).join('\n');
    
    // Parse YAML-like front matter
    const frontMatter = {};
    frontMatterLines.forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        frontMatter[match[1]] = match[2].trim();
      }
    });
    
    return { frontMatter, content: remainingContent };
  }

  /**
   * Generates table of contents from headings
   * @param {Array} headings - Array of heading objects
   * @param {number} maxLevel - Maximum heading level to include
   * @returns {string} Markdown table of contents
   */
  static generateTableOfContents(headings, maxLevel = 3) {
    const filteredHeadings = headings.filter(h => h.level <= maxLevel);
    
    if (filteredHeadings.length === 0) {
      return '';
    }
    
    const tocLines = ['## Table of Contents', ''];
    
    filteredHeadings.forEach(heading => {
      const indent = '  '.repeat(heading.level - 1);
      const link = `[${heading.text}](#${heading.anchor})`;
      tocLines.push(`${indent}- ${link}`);
    });
    
    return tocLines.join('\n') + '\n';
  }

  /**
   * Standardizes markdown formatting
   * @param {string} content - Markdown content to format
   * @returns {string} Formatted markdown content
   */
  static standardizeFormatting(content) {
    let formatted = content;
    
    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Ensure single blank line after headings
    formatted = formatted.replace(/^(#{1,6}\s+.+)$/gm, '$1\n');
    
    // Ensure blank lines around code blocks
    formatted = formatted.replace(/^```/gm, '\n```');
    formatted = formatted.replace(/^```.*$/gm, '$&\n');
    
    // Remove trailing whitespace
    formatted = formatted.replace(/[ \t]+$/gm, '');
    
    // Ensure file ends with single newline
    formatted = formatted.replace(/\n*$/, '\n');
    
    // Remove excessive blank lines (more than 2 consecutive)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
  }

  /**
   * Updates links in markdown content
   * @param {string} content - Markdown content
   * @param {Object} linkMap - Map of old URLs to new URLs
   * @returns {string} Updated markdown content
   */
  static updateLinks(content, linkMap) {
    let updated = content;
    
    Object.entries(linkMap).forEach(([oldUrl, newUrl]) => {
      // Update inline links
      const inlineLinkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${this.escapeRegex(oldUrl)}\\)`, 'g');
      updated = updated.replace(inlineLinkRegex, `[$1](${newUrl})`);
      
      // Update reference link definitions
      const refLinkRegex = new RegExp(`^\\[([^\\]]+)\\]:\\s*${this.escapeRegex(oldUrl)}`, 'gm');
      updated = updated.replace(refLinkRegex, `[$1]: ${newUrl}`);
    });
    
    return updated;
  }

  /**
   * Escapes special regex characters
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validates markdown syntax
   * @param {string} content - Markdown content to validate
   * @returns {Array} Array of validation issues
   */
  static validateSyntax(content) {
    const issues = [];
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let codeBlockStart = -1;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for unclosed code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockStart = lineNum;
        } else {
          inCodeBlock = false;
          codeBlockStart = -1;
        }
      }
      
      // Check for malformed links
      const malformedLinks = line.match(/\[[^\]]*\]\([^)]*$/g);
      if (malformedLinks) {
        issues.push({
          line: lineNum,
          type: 'malformed_link',
          message: 'Unclosed link found'
        });
      }
      
      // Check for empty links
      const emptyLinks = line.match(/\[\]\([^)]*\)|\[[^\]]+\]\(\)/g);
      if (emptyLinks) {
        issues.push({
          line: lineNum,
          type: 'empty_link',
          message: 'Empty link text or URL found'
        });
      }
    });
    
    // Check for unclosed code block at end of file
    if (inCodeBlock) {
      issues.push({
        line: codeBlockStart,
        type: 'unclosed_code_block',
        message: 'Code block started but never closed'
      });
    }
    
    return issues;
  }
}

module.exports = MarkdownUtils;