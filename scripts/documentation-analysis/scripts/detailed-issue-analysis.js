#!/usr/bin/env node

/**
 * Detailed Issue Analysis Script
 * Identifies specific broken references and outdated commands in each file
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

// Current valid npm scripts (from package.json analysis)
const VALID_NPM_SCRIPTS = [
  'local:start', 'local:stop', 'local:restart', 'local:start:windows', 'local:start:unix',
  'local:stop:windows', 'local:stop:unix', 'local:logs', 'local:logs:backend', 'local:logs:frontend',
  'local:logs:localstack', 'local:logs:swagger', 'local:logs:viewer', 'local:health', 'local:clean',
  'local:reset', 'local:status', 'local:utils', 'local:test-api', 'local:cleanup', 'local:report',
  'local:platform-info', 'local:docker-info', 'local:monitor', 'local:monitor:live', 'local:resources',
  'seed', 'seed:clean', 'seed:validate', 'config', 'config:validate', 'config:test',
  'state', 'state:reset', 'setup-data', 'setup-data:frontend-only', 'setup-data:images-only',
  'setup-data:force', 'reset-data', 'reset-data:clean', 'reset-data:fresh', 'reset-data:minimal',
  'reset-data:search-ready', 'reset-data:location-test', 'reset-data:style-test', 'reset-data:performance-test',
  'reset-data:frontend-ready', 'seed-scenario', 'seed-scenario:minimal', 'seed-scenario:search-basic',
  'seed-scenario:london-artists', 'seed-scenario:high-rated', 'seed-scenario:new-artists',
  'seed-scenario:booking-available', 'seed-scenario:portfolio-rich', 'seed-scenario:multi-style',
  'seed-scenario:pricing-range', 'seed-scenario:full-dataset', 'validate-data', 'validate-data:consistency',
  'validate-data:images', 'validate-data:studios', 'validate-data:scenarios', 'validate-studios',
  'validate-studios:data', 'validate-studios:relationships', 'validate-studios:images',
  'validate-studios:addresses', 'validate-studios:consistency', 'seed-studios', 'seed-studios:force',
  'seed-studios:validate', 'reset-studios', 'reset-studios:preserve', 'studio-status',
  'process-studio-images', 'process-studio-images:force', 'process-studio-images:validate',
  'manage-studio-relationships', 'manage-studio-relationships:validate', 'manage-studio-relationships:rebuild',
  'manage-studio-relationships:repair', 'manage-studio-relationships:report', 'validate-studio-data-e2e',
  'validate-studio-data-e2e:verbose', 'validate-studio-data-e2e:save-report', 'validate-studio-data-e2e:full',
  'health-check', 'studio-health', 'studio-troubleshoot', 'data-status', 'scenarios', 'reset-states',
  'help', 'dev:frontend', 'dev:backend', 'test:integration', 'test:integration:api', 'test:integration:data',
  'test:integration:setup', 'test:integration:cleanup', 'test:integration:coverage', 'test:e2e',
  'test:e2e:setup', 'test:e2e:workflows', 'test:e2e:integration', 'test:e2e:visual', 'test:e2e:headless',
  'test:e2e:debug', 'test:e2e:clean', 'docs:consolidate', 'docs:validate', 'docs:generate', 'docs:test', 'docs:test-e2e'
];

/**
 * Main function to analyze specific issues in each file
 */
async function analyzeDetailedIssues() {
  console.log('🔍 Starting detailed issue analysis...\n');
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    // Get list of files from gap analysis report
    const filesToAnalyze = await getFilesFromGapReport();
    
    console.log(`📋 Analyzing ${filesToAnalyze.length} files for specific issues\n`);

    const detailedReport = [];

    for (const fileInfo of filesToAnalyze) {
      try {
        console.log(`🔍 Analyzing: ${fileInfo.path}`);
        
        const analysis = await analyzeFileIssues(fileInfo.path);
        
        if (analysis.brokenReferences.length > 0 || analysis.outdatedCommands.length > 0) {
          detailedReport.push({
            file: fileInfo.path,
            action: fileInfo.action,
            brokenReferences: analysis.brokenReferences,
            outdatedCommands: analysis.outdatedCommands,
            totalIssues: analysis.brokenReferences.length + analysis.outdatedCommands.length
          });
          
          console.log(`  📊 Found ${analysis.brokenReferences.length} broken references, ${analysis.outdatedCommands.length} outdated commands`);
        } else {
          console.log(`  ✅ No issues found`);
        }
      } catch (error) {
        console.error(`  ❌ Error analyzing ${fileInfo.path}:`, error.message);
      }
    }

    // Generate detailed report
    await generateDetailedReport(detailedReport);

    console.log('\n📊 Analysis Summary:');
    console.log(`   Files Analyzed: ${filesToAnalyze.length}`);
    console.log(`   Files with Issues: ${detailedReport.length}`);
    console.log(`   Total Broken References: ${detailedReport.reduce((sum, file) => sum + file.brokenReferences.length, 0)}`);
    console.log(`   Total Outdated Commands: ${detailedReport.reduce((sum, file) => sum + file.outdatedCommands.length, 0)}`);

    console.log('\n✅ Detailed issue analysis completed!');
    console.log('📄 Report saved to: scripts/documentation-analysis/reports/detailed-issues-report.md');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
  }
}

/**
 * Get files from gap analysis report
 */
async function getFilesFromGapReport() {
  const gapReportPath = path.join(projectRoot, 'docs/consolidated/GAP_ANALYSIS_REPORT.md');
  const gapReportContent = await fs.readFile(gapReportPath, 'utf8');
  
  const filesToAnalyze = [];
  const lines = gapReportContent.split('\n');
  
  let currentSection = '';
  let currentFile = null;
  
  for (const line of lines) {
    // Detect section headers
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim();
      continue;
    }
    
    // Skip non-outdated content sections
    if (currentSection !== 'Outdated Content') {
      continue;
    }
    
    // Detect file entries (lines starting with - **)
    const fileMatch = line.match(/^- \*\*(.+?)\*\*/);
    if (fileMatch) {
      if (currentFile) {
        const fullPath = await findFileInProject(currentFile.path);
        if (fullPath) {
          currentFile.path = fullPath;
          filesToAnalyze.push(currentFile);
        }
      }
      currentFile = {
        path: fileMatch[1],
        action: 'general-fix',
        issues: []
      };
      continue;
    }
    
    // Detect action lines
    const actionMatch = line.match(/^\s+- Action: (.+)/);
    if (actionMatch && currentFile) {
      currentFile.action = actionMatch[1];
      continue;
    }
  }
  
  // Don't forget the last file
  if (currentFile) {
    const fullPath = await findFileInProject(currentFile.path);
    if (fullPath) {
      currentFile.path = fullPath;
      filesToAnalyze.push(currentFile);
    }
  }
  
  return filesToAnalyze;
}

/**
 * Find a file in the project by searching common locations
 */
async function findFileInProject(filename) {
  const searchPaths = [
    filename,
    `docs/${filename}`,
    `docs/workflows/${filename}`,
    `docs/setup/${filename}`,
    `docs/architecture/${filename}`,
    `docs/components/${filename}`,
    `docs/components/frontend/${filename}`,
    `docs/components/backend/${filename}`,
    `docs/components/infrastructure/${filename}`,
    `docs/components/scripts/${filename}`,
    `docs/deployment/${filename}`,
    `docs/reference/${filename}`,
    `docs/testing/${filename}`,
    `docs/troubleshooting/${filename}`,
    `docs/consolidated/${filename}`
  ];
  
  for (const searchPath of searchPaths) {
    const fullPath = path.join(projectRoot, searchPath);
    try {
      await fs.access(fullPath);
      return searchPath;
    } catch (error) {
      // File doesn't exist at this location, continue searching
    }
  }
  
  return null;
}

/**
 * Analyze specific issues in a single file
 */
async function analyzeFileIssues(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  const content = await fs.readFile(fullPath, 'utf8');
  
  const brokenReferences = await findBrokenReferences(content, filePath);
  const outdatedCommands = await findOutdatedCommands(content);
  
  return {
    brokenReferences,
    outdatedCommands
  };
}

/**
 * Find broken references in content
 */
async function findBrokenReferences(content, filePath) {
  const brokenRefs = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    const fullMatch = match[0];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Skip external links
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
      continue;
    }

    // Skip anchor links
    if (linkPath.startsWith('#')) {
      continue;
    }

    // Check if the referenced file exists
    let targetPath;
    if (path.isAbsolute(linkPath)) {
      targetPath = path.join(projectRoot, linkPath);
    } else {
      targetPath = path.resolve(path.dirname(path.join(projectRoot, filePath)), linkPath);
    }

    try {
      await fs.access(targetPath);
    } catch (error) {
      brokenRefs.push({
        line: lineNumber,
        text: linkText,
        path: linkPath,
        fullMatch: fullMatch,
        reason: 'File does not exist'
      });
    }
  }

  return brokenRefs;
}

/**
 * Find outdated commands in content
 */
async function findOutdatedCommands(content) {
  const outdatedCommands = [];
  const commandRegex = /npm run ([a-zA-Z0-9-_:]+)/g;
  let match;

  while ((match = commandRegex.exec(content)) !== null) {
    const commandName = match[1];
    const fullMatch = match[0];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    if (!VALID_NPM_SCRIPTS.includes(commandName)) {
      // Try to find a similar valid command
      const suggestion = findSimilarCommand(commandName);
      
      outdatedCommands.push({
        line: lineNumber,
        command: commandName,
        fullMatch: fullMatch,
        suggestion: suggestion,
        reason: suggestion ? 'Command deprecated, use suggestion' : 'Command does not exist'
      });
    }
  }

  return outdatedCommands;
}

/**
 * Find a similar valid npm command
 */
function findSimilarCommand(command) {
  // Direct mappings for common patterns
  const directMappings = {
    'start': 'local:start',
    'stop': 'local:stop',
    'restart': 'local:restart',
    'logs': 'local:logs',
    'health': 'local:health',
    'clean': 'local:clean',
    'reset': 'local:reset',
    'status': 'local:status',
    'monitor': 'local:monitor',
    'seed-data': 'setup-data',
    'test-integration': 'test:integration',
    'test-e2e': 'test:e2e'
  };

  if (directMappings[command]) {
    return directMappings[command];
  }

  // Find commands that start with the same prefix
  const prefix = command.split('-')[0];
  const candidates = VALID_NPM_SCRIPTS.filter(cmd => cmd.startsWith(prefix));
  
  if (candidates.length === 1) {
    return candidates[0];
  }

  // Find the most similar command using simple string similarity
  let bestMatch = null;
  let bestScore = 0;

  for (const validCommand of VALID_NPM_SCRIPTS) {
    const score = calculateSimilarity(command, validCommand);
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = validCommand;
    }
  }

  return bestMatch;
}

/**
 * Calculate string similarity (simple implementation)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
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
 * Generate detailed report
 */
async function generateDetailedReport(detailedReport) {
  const reportPath = path.join(projectRoot, 'scripts/documentation-analysis/reports/detailed-issues-report.md');
  
  let markdown = `# Detailed Documentation Issues Report

Generated on: ${new Date().toLocaleString()}

This report provides specific details about broken references and outdated commands in each file.

## Summary

- **Files Analyzed**: ${detailedReport.length}
- **Total Broken References**: ${detailedReport.reduce((sum, file) => sum + file.brokenReferences.length, 0)}
- **Total Outdated Commands**: ${detailedReport.reduce((sum, file) => sum + file.outdatedCommands.length, 0)}

## Detailed Issues by File

`;

  for (const fileReport of detailedReport.sort((a, b) => b.totalIssues - a.totalIssues)) {
    markdown += `### ${fileReport.file}\n\n`;
    markdown += `**Action Required**: ${fileReport.action}\n`;
    markdown += `**Total Issues**: ${fileReport.totalIssues} (${fileReport.brokenReferences.length} broken references, ${fileReport.outdatedCommands.length} outdated commands)\n\n`;

    if (fileReport.brokenReferences.length > 0) {
      markdown += `#### Broken References (${fileReport.brokenReferences.length})\n\n`;
      for (const ref of fileReport.brokenReferences) {
        markdown += `- **Line ${ref.line}**: \`${ref.fullMatch}\`\n`;
        markdown += `  - **Link Text**: "${ref.text}"\n`;
        markdown += `  - **Target Path**: \`${ref.path}\`\n`;
        markdown += `  - **Issue**: ${ref.reason}\n\n`;
      }
    }

    if (fileReport.outdatedCommands.length > 0) {
      markdown += `#### Outdated Commands (${fileReport.outdatedCommands.length})\n\n`;
      for (const cmd of fileReport.outdatedCommands) {
        markdown += `- **Line ${cmd.line}**: \`${cmd.fullMatch}\`\n`;
        markdown += `  - **Command**: \`${cmd.command}\`\n`;
        if (cmd.suggestion) {
          markdown += `  - **Suggested Fix**: \`npm run ${cmd.suggestion}\`\n`;
        }
        markdown += `  - **Issue**: ${cmd.reason}\n\n`;
      }
    }

    markdown += `---\n\n`;
  }

  markdown += `## Quick Fix Commands

To fix these issues, you can:

1. **Run the automated fix script**:
   \`\`\`bash
   cd scripts/documentation-analysis
   node scripts/fix-outdated-content.js
   \`\`\`

2. **Manual fixes** for remaining issues:
   - Review each broken reference and update the path
   - Replace outdated commands with suggested alternatives
   - Create missing files if they should exist

## File-by-File Fix Priority

`;

  // Add priority list
  const priorityList = detailedReport
    .sort((a, b) => b.totalIssues - a.totalIssues)
    .slice(0, 10);

  for (let i = 0; i < priorityList.length; i++) {
    const file = priorityList[i];
    markdown += `${i + 1}. **${file.file}** - ${file.totalIssues} issues\n`;
  }

  markdown += `\n---\n\n*This report was generated automatically by the detailed issue analysis tool.*\n`;

  // Ensure the reports directory exists
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  
  // Write the report
  await fs.writeFile(reportPath, markdown, 'utf8');
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Detailed Documentation Issue Analysis

Usage:
  node scripts/detailed-issue-analysis.js

This script:
1. Analyzes files from the gap analysis report
2. Identifies specific broken references with line numbers
3. Finds outdated commands with suggestions
4. Generates a detailed report with actionable fixes

Environment Variables:
  DEBUG=1    Show detailed error information
`);
  process.exit(0);
}

analyzeDetailedIssues();