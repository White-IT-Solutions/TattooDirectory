#!/usr/bin/env node

/**
 * Automated Documentation Content Fixer
 * Fixes outdated commands, broken references, and other content issues
 */

const fs = require("fs").promises;
const path = require("path");
const process = require("process");

// Set the correct project root
const projectRoot = path.resolve(__dirname, "../../..");

// Current valid npm scripts from package.json
const VALID_NPM_SCRIPTS = [
  "local:start",
  "local:stop",
  "local:restart",
  "local:start:windows",
  "local:start:unix",
  "local:stop:windows",
  "local:stop:unix",
  "local:logs",
  "local:logs:backend",
  "local:logs:frontend",
  "local:logs:localstack",
  "local:logs:swagger",
  "local:logs:viewer",
  "local:health",
  "local:clean",
  "local:reset",
  "local:status",
  "local:utils",
  "local:test-api",
  "local:cleanup",
  "local:report",
  "local:platform-info",
  "local:docker-info",
  "local:monitor",
  "local:monitor:live",
  "local:resources",
  "seed",
  "seed:clean",
  "seed:validate",
  "config",
  "config:validate",
  "config:test",
  "state",
  "state:reset",
  "setup-data",
  "setup-data:frontend-only",
  "setup-data:images-only",
  "setup-data:force",
  "reset-data",
  "reset-data:clean",
  "reset-data:fresh",
  "reset-data:minimal",
  "reset-data:search-ready",
  "reset-data:location-test",
  "reset-data:style-test",
  "reset-data:performance-test",
  "reset-data:frontend-ready",
  "seed-scenario",
  "seed-scenario:minimal",
  "seed-scenario:search-basic",
  "seed-scenario:london-artists",
  "seed-scenario:high-rated",
  "seed-scenario:new-artists",
  "seed-scenario:booking-available",
  "seed-scenario:portfolio-rich",
  "seed-scenario:multi-style",
  "seed-scenario:pricing-range",
  "seed-scenario:full-dataset",
  "validate-data",
  "validate-data:consistency",
  "validate-data:images",
  "validate-data:studios",
  "validate-data:scenarios",
  "validate-studios",
  "validate-studios:data",
  "validate-studios:relationships",
  "validate-studios:images",
  "validate-studios:addresses",
  "validate-studios:consistency",
  "seed-studios",
  "seed-studios:force",
  "seed-studios:validate",
  "reset-studios",
  "reset-studios:preserve",
  "studio-status",
  "process-studio-images",
  "process-studio-images:force",
  "process-studio-images:validate",
  "manage-studio-relationships",
  "manage-studio-relationships:validate",
  "manage-studio-relationships:rebuild",
  "manage-studio-relationships:repair",
  "manage-studio-relationships:report",
  "validate-studio-data-e2e",
  "validate-studio-data-e2e:verbose",
  "validate-studio-data-e2e:save-report",
  "validate-studio-data-e2e:full",
  "health-check",
  "studio-health",
  "studio-troubleshoot",
  "data-status",
  "scenarios",
  "reset-states",
  "help",
  "dev:frontend",
  "dev:backend",
  "test:integration",
  "test:integration:api",
  "test:integration:data",
  "test:integration:setup",
  "test:integration:cleanup",
  "test:integration:coverage",
  "test:e2e",
  "test:e2e:setup",
  "test:e2e:workflows",
  "test:e2e:integration",
  "test:e2e:visual",
  "test:e2e:headless",
  "test:e2e:debug",
  "test:e2e:clean",
  "docs:consolidate",
  "docs:validate",
  "docs:generate",
  "docs:test",
  "docs:test-e2e",
];

// Common outdated commands and their replacements
const COMMAND_REPLACEMENTS = {
  "npm run start": "npm run local:start",
  "npm run stop": "npm run local:stop",
  "npm run restart": "npm run local:restart",
  "npm run logs": "npm run local:logs",
  "npm run health": "npm run local:health",
  "npm run clean": "npm run local:clean",
  "npm run reset": "npm run local:reset",
  "npm run status": "npm run local:status",
  "npm run test-api": "npm run local:test-api",
  "npm run cleanup": "npm run local:cleanup",
  "npm run report": "npm run local:report",
  "npm run monitor": "npm run local:monitor",
  "npm run seed-data": "npm run setup-data",
  "npm run reset-data-clean": "npm run reset-data:clean",
  "npm run reset-data-fresh": "npm run reset-data:fresh",
  "npm run validate-data-consistency": "npm run validate-data:consistency",
  "npm run validate-data-images": "npm run validate-data:images",
  "npm run seed-studios-force": "npm run seed-studios:force",
  "npm run validate-studios-data": "npm run validate-studios:data",
  "npm run test-integration": "npm run test:integration",
  "npm run test-e2e": "npm run test:e2e",
  "npm run docs-consolidate": "npm run docs:consolidate",
  "npm run docs-validate": "npm run docs:validate",
};

// Common broken reference patterns and their fixes
const REFERENCE_FIXES = {
  // Fix relative paths that have moved
  "../README.md": "../../README.md",
  "./docs/": "../docs/",

  // Fix old consolidated structure references to actual structure
  "docs/consolidated/getting-started/README.md": "docs/QUICK_START.md",
  "docs/consolidated/getting-started/": "docs/setup/",
  "docs/consolidated/development/": "docs/workflows/",
  "docs/consolidated/deployment/": "docs/deployment/",
  "docs/consolidated/architecture/": "docs/architecture/",
  "docs/consolidated/reference/": "docs/reference/",
  "docs/consolidated/troubleshooting/": "docs/troubleshooting/",

  // Fix old directory structure references
  "docs/localstack/": "docs/setup/",
  "docs/planning/": "docs/deployment/",
  "docs/scripts/": "docs/components/scripts/",
  "docs/frontend/": "docs/components/frontend/",
  "docs/backend/": "docs/components/backend/",
  "docs/devtools/": "docs/components/scripts/",

  // Fix specific file relocations
  "docs/setup/SETUP_MASTER.md": "docs/setup/local-development.md",
  "docs/planning/TROUBLESHOOTING.md":
    "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
  "docs/localstack/README_LOCAL.md": "docs/setup/local-development.md",
  "docs/frontend/README_FRONTEND.md": "docs/components/frontend/README.md",
  "docs/backend/README_BACKEND.md": "docs/components/backend/README.md",
  "docs/scripts/README_DATA_SEEDER.md": "docs/components/scripts/README.md",
  "docs/devtools/README-DEVTOOLS.md": "docs/components/scripts/README.md",

  // Fix complex relative path patterns (from QUICK_START.md)
  "...../docs/setup/frontend-only.md": "setup/frontend-only.md",
  "...../docs/components/frontend/": "components/frontend/",
  "...../docs/components/backend/": "components/backend/",
  "...../docs/components/infrastructure/": "components/infrastructure/",
  "...../docs/components/scripts/": "components/scripts/",
  "...../docs/reference/configuration.md": "reference/configuration.md",
  "...../docs/reference/environment-variables.md": "reference/environment-variables.md",
  "...../docs/reference/npm-scripts.md": "reference/npm-scripts.md",
  "...../docs/architecture/system-overview.md": "architecture/system-overview.md",
  "...../docs/architecture/data-models.md": "architecture/data-models.md",
  "...../docs/architecture/api-design.md": "architecture/api-design.md",

  // Fix current directory references
  "./API_REFERENCE.md": "reference/api_reference.md",
  "./TROUBLESHOOTING.md": "troubleshooting/TROUBLESHOOTING_GUIDE.md",

  // Fix placeholder references that point to README-Docs.md
  "docs/README-Docs.md": "workflows/testing-strategies.md",

  // Fix relative path issues in README-Docs.md (missing docs/ prefix)
  "architecture/system-overview.md": "docs/architecture/system-overview.md",
  "architecture/api-design.md": "docs/architecture/api-design.md",
  "architecture/data-models.md": "docs/architecture/data-models.md",
  "architecture/infrastructure.md": "docs/architecture/infrastructure/infrastructure.md",
  "architecture/diagrams/": "docs/architecture/diagrams/",
  "development/local-setup.md": "docs/setup/local-development.md",
  "development/localstack-setup.md": "docs/setup/localstack-setup.md",
  "development/frontend/": "docs/components/frontend/",
  "development/backend/": "docs/components/backend/",
  "development/scripts/": "docs/components/scripts/",
  "development/testing/": "docs/testing/",
  "deployment/terraform.md": "docs/deployment/terraform.md",
  "deployment/process.md": "docs/workflows/deployment-process.md",
  "deployment/ci-cd.md": "docs/deployment/ci-cd.md",
  "reference/commands.md": "docs/reference/command-reference.md",
  "reference/performance.md": "docs/workflows/monitoring.md",
  "troubleshooting/README.md": "docs/troubleshooting/README.md",
  "troubleshooting/localstack/": "docs/troubleshooting/",
  "troubleshooting/error-handling.md": "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
};

/**
 * Main function to fix outdated content
 */
async function fixOutdatedContent() {
  console.log("🔧 Starting automated documentation content fixes...\n");

  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    const stats = {
      filesProcessed: 0,
      commandsFixed: 0,
      referencesFixed: 0,
      errorsEncountered: 0,
    };

    // Get list of files to fix from the gap analysis
    const filesToFix = await getFilesToFix();

    console.log(`📋 Found ${filesToFix.length} files to process\n`);

    for (const fileInfo of filesToFix) {
      try {
        const filePath =
          typeof fileInfo === "string" ? fileInfo : fileInfo.path;
        const action =
          typeof fileInfo === "object" ? fileInfo.action : "general-fix";
        const issues = typeof fileInfo === "object" ? fileInfo.issues : [];

        console.log(`🔍 Processing: ${filePath}`);
        if (action !== "general-fix") {
          console.log(`  📋 Action: ${action}`);
        }
        if (issues.length > 0) {
          console.log(`  🔧 Issues: ${issues.join(", ")}`);
        }

        const result = await fixFileContent(filePath, action, issues);

        stats.filesProcessed++;
        stats.commandsFixed += result.commandsFixed;
        stats.referencesFixed += result.referencesFixed;

        if (result.commandsFixed > 0 || result.referencesFixed > 0) {
          console.log(
            `  ✅ Fixed ${result.commandsFixed} commands, ${result.referencesFixed} references`
          );
        } else if (result.actionTaken) {
          console.log(`  ✅ Applied action: ${result.actionTaken}`);
        } else {
          console.log(`  ℹ️  No fixes needed`);
        }
      } catch (error) {
        console.error(
          `  ❌ Error processing ${
            typeof fileInfo === "string" ? fileInfo : fileInfo.path
          }:`,
          error.message
        );
        stats.errorsEncountered++;
      }
    }

    // Summary
    console.log("\n📊 Fix Summary:");
    console.log(`   Files Processed: ${stats.filesProcessed}`);
    console.log(`   Commands Fixed: ${stats.commandsFixed}`);
    console.log(`   References Fixed: ${stats.referencesFixed}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    if (stats.commandsFixed > 0 || stats.referencesFixed > 0) {
      console.log("\n✅ Documentation content fixes completed successfully!");
      console.log(
        "💡 Run the gap analysis again to verify fixes: npm run gap-analysis"
      );
    } else {
      console.log("\n✅ All documentation content is up to date!");
    }
  } catch (error) {
    console.error("❌ Fix process failed:", error.message);
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
 * Get list of files that need fixing from the gap analysis report
 */
async function getFilesToFix() {
  const filesToFix = [];

  // Try to read the gap analysis report first
  const gapReportPath = path.join(
    projectRoot,
    "docs/consolidated/GAP_ANALYSIS_REPORT.md"
  );
  try {
    const gapReportContent = await fs.readFile(gapReportPath, "utf8");

    // Parse the gap analysis report to extract files that need fixing
    const outdatedFiles = await parseGapAnalysisReport(gapReportContent);
    console.log(
      `📊 Found ${outdatedFiles.length} files from gap analysis report`
    );

    // Verify files exist and add to fix list
    for (const fileInfo of outdatedFiles) {
      const fullPath = path.join(projectRoot, fileInfo.path);
      try {
        await fs.access(fullPath);
        filesToFix.push(fileInfo);
      } catch (error) {
        console.log(`⚠️  File not found: ${fileInfo.path}`);
      }
    }

    if (filesToFix.length > 0) {
      return filesToFix;
    }
  } catch (error) {
    console.log("⚠️  Gap analysis report not found, using common files list");
  }

  // Fallback to common files if gap analysis report is not available (updated for actual structure)
  const commonFiles = [
    "README.md",
    "docs/README-Docs.md",
    "docs/QUICK_START.md",

    // Workflows
    "docs/workflows/DEVELOPMENT_GUIDE.md",
    "docs/workflows/testing-strategies.md",
    "docs/workflows/monitoring.md",
    "docs/workflows/deployment-process.md",
    "docs/workflows/data-management.md",

    // Setup
    "docs/setup/local-development.md",
    "docs/setup/frontend-only.md",
    "docs/setup/docker-setup.md",
    "docs/setup/dependencies.md",
    "docs/setup/SETUP_MASTER.md",
    "docs/setup/localstack-setup.md",

    // Components
    "docs/components/frontend/README.md",
    "docs/components/backend/README.md",
    "docs/components/infrastructure/README.md",
    "docs/components/scripts/README.md",

    // Reference
    "docs/reference/command-reference.md",
    "docs/reference/api_reference.md",
    "docs/reference/configuration.md",
    "docs/reference/environment-variables.md",
    "docs/reference/npm-scripts.md",

    // Testing
    "docs/testing/API_TESTING_GUIDE.md",
    "docs/testing/component_testing.md",
    "docs/testing/CONSOLIDATED_TEST_DOCUMENTATION.md",

    // Troubleshooting
    "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
    "docs/troubleshooting/TROUBLESHOOTING_MASTER.md",

    // Deployment
    "docs/deployment/terraform.md",
    "docs/deployment/ci-cd.md",

    // Architecture
    "docs/architecture/infrastructure/infrastructure.md",
  ];

  for (const filePath of commonFiles) {
    const fullPath = path.join(projectRoot, filePath);
    try {
      await fs.access(fullPath);
      filesToFix.push({ path: filePath, action: "general-fix", issues: [] });
    } catch (error) {
      // File doesn't exist, skip it
    }
  }

  return filesToFix;
}

/**
 * Parse the gap analysis report to extract files that need fixing
 */
async function parseGapAnalysisReport(content) {
  const filesToFix = [];
  const lines = content.split("\n");

  let currentSection = "";
  let currentFile = null;

  for (const line of lines) {
    // Detect section headers
    if (line.startsWith("## ")) {
      currentSection = line.substring(3).trim();
      continue;
    }

    // Skip non-outdated content sections
    if (currentSection !== "Outdated Content") {
      continue;
    }

    // Detect file entries (lines starting with - **)
    const fileMatch = line.match(/^- \*\*(.+?)\*\*/);
    if (fileMatch) {
      if (currentFile) {
        // Resolve the full path for the previous file
        const fullPath = await findFileInProject(currentFile.path);
        if (fullPath) {
          currentFile.path = fullPath;
          filesToFix.push(currentFile);
        }
      }
      currentFile = {
        path: fileMatch[1],
        action: "general-fix",
        issues: [],
      };
      continue;
    }

    // Detect action lines
    const actionMatch = line.match(/^\s+- Action: (.+)/);
    if (actionMatch && currentFile) {
      currentFile.action = actionMatch[1];
      continue;
    }

    // Detect issues lines
    const issuesMatch = line.match(/^\s+- Issues: (.+)/);
    if (issuesMatch && currentFile) {
      currentFile.issues.push(issuesMatch[1]);
      continue;
    }
  }

  // Don't forget the last file
  if (currentFile) {
    const fullPath = await findFileInProject(currentFile.path);
    if (fullPath) {
      currentFile.path = fullPath;
      filesToFix.push(currentFile);
    }
  }

  return filesToFix;
}

/**
 * Find a file in the project by searching common locations
 */
async function findFileInProject(filename) {
  // Common locations to search for documentation files (updated for actual structure)
  const searchPaths = [
    filename, // Root level
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
    `docs/consolidated/${filename}`, // Keep for any remaining consolidated files

    // Legacy paths for backward compatibility
    `docs/planning/${filename}`,
    `docs/localstack/${filename}`,
    `docs/frontend/${filename}`,
    `docs/backend/${filename}`,
    `docs/devtools/${filename}`,
    `docs/scripts/${filename}`,
  ];

  for (const searchPath of searchPaths) {
    const fullPath = path.join(projectRoot, searchPath);
    try {
      await fs.access(fullPath);
      return searchPath; // Return relative path from project root
    } catch (error) {
      // File doesn't exist at this location, continue searching
    }
  }

  return null; // File not found
}

/**
 * Fix content in a single file based on specific action and issues
 */
async function fixFileContent(filePath, action = "general-fix", issues = []) {
  const fullPath = path.join(projectRoot, filePath);
  let content = await fs.readFile(fullPath, "utf8");
  const originalContent = content;

  let commandsFixed = 0;
  let referencesFixed = 0;
  let actionTaken = null;

  // Handle specific actions based on gap analysis
  switch (action) {
    case "consolidate":
      actionTaken = await handleConsolidateAction(filePath, content, issues);
      break;

    case "fix-references":
      const refResult = await handleFixReferencesAction(content, issues);
      content = refResult.content;
      referencesFixed += refResult.referencesFixed;
      break;

    case "update-commands":
      const cmdResult = await handleUpdateCommandsAction(content, issues);
      content = cmdResult.content;
      commandsFixed += cmdResult.commandsFixed;
      break;

    default:
      // General fix - apply all standard fixes
      break;
  }

  // Always apply general fixes regardless of specific action

  // Fix outdated npm commands
  for (const [oldCommand, newCommand] of Object.entries(COMMAND_REPLACEMENTS)) {
    const regex = new RegExp(escapeRegExp(oldCommand), "g");
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newCommand);
      commandsFixed += matches.length;
    }
  }

  // Fix invalid npm run commands (commands that don't exist)
  const npmRunRegex = /npm run ([a-zA-Z0-9-_:]+)/g;
  let match;
  const processedContent = content;
  content = "";
  let lastIndex = 0;

  while ((match = npmRunRegex.exec(processedContent)) !== null) {
    const command = match[1];
    if (!VALID_NPM_SCRIPTS.includes(command)) {
      // Try to find a similar valid command
      const suggestion = findSimilarCommand(command);
      if (suggestion) {
        content += processedContent.slice(lastIndex, match.index);
        content += `npm run ${suggestion}`;
        lastIndex = match.index + match[0].length;
        commandsFixed++;
      }
    }
  }
  content += processedContent.slice(lastIndex);

  // Fix broken references
  for (const [oldRef, newRef] of Object.entries(REFERENCE_FIXES)) {
    const regex = new RegExp(escapeRegExp(oldRef), "g");
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newRef);
      referencesFixed += matches.length;
    }
  }

  // Fix markdown link references
  const linkResult = await fixMarkdownLinks(content, filePath);
  content = linkResult.content;
  referencesFixed += linkResult.referencesFixed;

  // Write back if changes were made
  if (content !== originalContent) {
    await fs.writeFile(fullPath, content, "utf8");
  }

  return { commandsFixed, referencesFixed, actionTaken };
}

/**
 * Handle consolidate action - add deprecation notice
 */
async function handleConsolidateAction(filePath, content, issues) {
  const fullPath = path.join(projectRoot, filePath);

  // Check if file already has deprecation notice
  if (
    content.includes("⚠️ **DEPRECATED**") ||
    content.includes("**This file has been moved**")
  ) {
    return "already-deprecated";
  }

  // Add deprecation notice at the top
  const deprecationNotice = `> ⚠️ **DEPRECATED**: This file has been moved to the consolidated documentation structure.
> Please refer to the files in \`docs/consolidated/\` for the latest information.
> This file will be removed in a future version.

---

`;

  const newContent = deprecationNotice + content;
  await fs.writeFile(fullPath, newContent, "utf8");

  return "added-deprecation-notice";
}

/**
 * Handle fix-references action
 */
async function handleFixReferencesAction(content, issues) {
  let referencesFixed = 0;

  // Extract broken reference count from issues
  for (const issue of issues) {
    const brokenRefMatch = issue.match(/Contains (\d+) broken references/);
    if (brokenRefMatch) {
      const expectedFixes = parseInt(brokenRefMatch[1]);

      // Apply reference fixes more aggressively
      for (const [oldRef, newRef] of Object.entries(REFERENCE_FIXES)) {
        const regex = new RegExp(escapeRegExp(oldRef), "g");
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newRef);
          referencesFixed += matches.length;
        }
      }

      // Fix additional common broken patterns (updated for actual structure)
      const additionalFixes = {
        "docs/consolidated/development/local-setup.md":
          "docs/setup/local-development.md",
        "docs/consolidated/getting-started/docker-setup.md":
          "docs/setup/docker-setup.md",
        "docs/consolidated/troubleshooting/README.md":
          "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
        "docs/consolidated/development/scripts/data-seeder.md":
          "docs/components/scripts/README.md",
        "docs/consolidated/development/localstack.md":
          "docs/setup/localstack-setup.md",
        "docs/consolidated/development/frontend/README.md":
          "docs/components/frontend/README.md",
        "docs/consolidated/development/backend/README.md":
          "docs/components/backend/README.md",
        "docs/planning/TROUBLESHOOTING.md":
          "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
        "docs/scripts/README_DATA_SEEDER.md":
          "docs/components/scripts/README.md",
        "docs/localstack/README_LOCAL.md": "docs/setup/local-development.md",
        "docs/frontend/README_FRONTEND.md":
          "docs/components/frontend/README.md",
        "docs/backend/README_BACKEND.md": "docs/components/backend/README.md",
        "docs/devtools/README-DEVTOOLS.md": "docs/components/scripts/README.md",
      };

      for (const [oldRef, newRef] of Object.entries(additionalFixes)) {
        const regex = new RegExp(escapeRegExp(oldRef), "g");
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newRef);
          referencesFixed += matches.length;
        }
      }
    }
  }

  return { content, referencesFixed };
}

/**
 * Handle update-commands action
 */
async function handleUpdateCommandsAction(content, issues) {
  let commandsFixed = 0;

  // Extract command count from issues
  for (const issue of issues) {
    const commandMatch = issue.match(
      /Contains (\d+) outdated command references/
    );
    if (commandMatch) {
      // Apply command fixes more aggressively
      for (const [oldCommand, newCommand] of Object.entries(
        COMMAND_REPLACEMENTS
      )) {
        const regex = new RegExp(escapeRegExp(oldCommand), "g");
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newCommand);
          commandsFixed += matches.length;
        }
      }

      // Fix additional command patterns
      const additionalCommandFixes = {
        "npm run dev": "npm run local:start",
        "npm run build": "npm run local:start",
        "npm run serve": "npm run local:start",
        "npm run docker-up": "npm run local:start",
        "npm run docker-down": "npm run local:stop",
        "npm run docker-logs": "npm run local:logs",
        "npm run test-data": "npm run setup-data",
        "npm run seed-test": "npm run setup-data",
        "npm run validate": "npm run validate-data",
      };

      for (const [oldCommand, newCommand] of Object.entries(
        additionalCommandFixes
      )) {
        const regex = new RegExp(escapeRegExp(oldCommand), "g");
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newCommand);
          commandsFixed += matches.length;
        }
      }
    }
  }

  return { content, commandsFixed };
}

/**
 * Fix markdown links in content
 */
async function fixMarkdownLinks(content, filePath) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  const fixes = [];
  let referencesFixed = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];

    // Skip external links
    if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) {
      continue;
    }

    // Check if the referenced file exists
    const absolutePath = path.resolve(
      path.dirname(path.join(projectRoot, filePath)),
      linkPath
    );
    try {
      await fs.access(absolutePath);
    } catch (error) {
      // File doesn't exist, try to find a replacement
      const newPath = await findReplacementPath(linkPath);
      if (newPath) {
        fixes.push({ old: match[0], new: `[${linkText}](${newPath})` });
        referencesFixed++;
      }
    }
  }

  // Apply fixes
  for (const fix of fixes) {
    content = content.replace(fix.old, fix.new);
  }

  return { content, referencesFixed };
}

/**
 * Find a similar valid npm command
 */
function findSimilarCommand(command) {
  // Direct mappings for common patterns
  const directMappings = {
    start: "local:start",
    stop: "local:stop",
    restart: "local:restart",
    logs: "local:logs",
    health: "local:health",
    clean: "local:clean",
    reset: "local:reset",
    status: "local:status",
    monitor: "local:monitor",
    "seed-data": "setup-data",
    "test-integration": "test:integration",
    "test-e2e": "test:e2e",
  };

  if (directMappings[command]) {
    return directMappings[command];
  }

  // Find commands that start with the same prefix
  const prefix = command.split("-")[0];
  const candidates = VALID_NPM_SCRIPTS.filter((cmd) => cmd.startsWith(prefix));

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
 * Find replacement path for broken reference
 */
async function findReplacementPath(brokenPath) {
  const fileName = path.basename(brokenPath);

  // Common file relocations (updated for actual structure)
  const relocations = {
    "README.md": "docs/README-Docs.md",
    "QUICK_START.md": "docs/QUICK_START.md",
    "local-development.md": "docs/setup/local-development.md",
    "docker-setup.md": "docs/setup/docker-setup.md",
    "dependencies.md": "docs/setup/dependencies.md",
    "command-reference.md": "docs/reference/command-reference.md",
    "api-documentation.md": "docs/reference/api_reference.md",
    "api_reference.md": "docs/reference/api_reference.md",
    "DEVELOPMENT_GUIDE.md": "docs/workflows/DEVELOPMENT_GUIDE.md",
    "TROUBLESHOOTING_GUIDE.md": "docs/troubleshooting/TROUBLESHOOTING_GUIDE.md",
    "testing-strategies.md": "docs/workflows/testing-strategies.md",
    "deployment-process.md": "docs/workflows/deployment-process.md",
    "monitoring.md": "docs/workflows/monitoring.md",
    "data-management.md": "docs/workflows/data-management.md",
    "terraform.md": "docs/deployment/terraform.md",
    "ci-cd.md": "docs/deployment/ci-cd.md",
  };

  if (relocations[fileName]) {
    const newPath = relocations[fileName];
    try {
      await fs.access(path.join(projectRoot, newPath));
      return newPath;
    } catch (error) {
      // New path doesn't exist either
    }
  }

  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Show usage if help requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Automated Documentation Content Fixer

Usage:
  npm run fix-outdated-content

This script:
1. Fixes outdated npm run commands
2. Updates broken file references
3. Corrects common documentation issues
4. Provides a summary of changes made

Environment Variables:
  DEBUG=1    Show detailed error information
`);
  process.exit(0);
}

fixOutdatedContent();
