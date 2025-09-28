#!/usr/bin/env node

/**
 * Cross-Reference Command Checker
 * Verifies that all npm scripts are documented in command-reference.md
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("glob");

class CommandCrossReferenceChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "../..");
    this.commandRefPath = path.join(
      this.projectRoot,
      "docs/reference/command-reference.md"
    );
    this.allCommands = new Set();
    this.documentedCommands = new Set();
    this.missingCommands = new Set();
    this.extraCommands = new Set();
    this.legacyCommands = new Set();
    this.commandSources = new Map(); // Track where commands come from
    this.commandUsage = new Map(); // Track command usage in files
  }

  /**
   * Run the cross-reference check
   */
  async run() {
    console.log("🔍 Cross-referencing npm commands with documentation...\n");
    console.log("ℹ️  Understanding Command Counts:");
    console.log("   • Total commands include workspace variations");
    console.log("   • Base commands: ~300 unique commands");
    console.log("   • Workspace variations: ~200+ additional variations");
    console.log("   • Example: 'npm run test' + 'npm run test --workspace=frontend'");
    console.log("   • Fuzzy matching connects variations to base commands\n");

    try {
      // Step 1: Find all package.json files
      await this.findAllCommands();

      // Step 2: Parse documented commands
      await this.parseDocumentedCommands();

      // Step 3: Identify legacy commands and usage
      await this.identifyLegacyCommands();
      await this.analyzeCommandUsage();

      // Step 4: Compare and report
      await this.generateReport();
    } catch (error) {
      console.error("❌ Cross-reference check failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Find all npm scripts in package.json files
   */
  async findAllCommands() {
    console.log("📦 Finding all npm scripts...");

    const packageJsonFiles = await glob("**/package.json", {
      cwd: this.projectRoot,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    });

    for (const packageFile of packageJsonFiles) {
      const fullPath = path.join(this.projectRoot, packageFile);

      try {
        const content = await fs.readFile(fullPath, "utf8");
        const packageData = JSON.parse(content);

        if (packageData.scripts) {
          const workspaceName = this.getWorkspaceName(packageFile);

          for (const [scriptName, scriptCommand] of Object.entries(
            packageData.scripts
          )) {
            // Create command variations
            const baseCommand = `npm run ${scriptName}`;
            const workspaceCommand = workspaceName
              ? `npm run ${scriptName} --workspace=${workspaceName}`
              : null;

            this.allCommands.add(baseCommand);
            this.commandSources.set(baseCommand, {
              file: packageFile,
              workspace: workspaceName,
              script: scriptCommand,
              isLegacy: this.isLegacyPath(packageFile),
            });

            if (workspaceCommand) {
              this.allCommands.add(workspaceCommand);
              this.commandSources.set(workspaceCommand, {
                file: packageFile,
                workspace: workspaceName,
                script: scriptCommand,
                isLegacy: this.isLegacyPath(packageFile),
              });
            }

            // Also add direct script calls for documentation-analysis
            if (workspaceName === "scripts/documentation-analysis") {
              this.allCommands.add(`node ${scriptName}.js`);
              this.commandSources.set(`node ${scriptName}.js`, {
                file: packageFile,
                workspace: workspaceName,
                script: scriptCommand,
                isLegacy: false,
              });
            }
          }
        }
      } catch (error) {
        console.warn(
          `Warning: Could not parse ${packageFile}: ${error.message}`
        );
      }
    }

    console.log(`Found ${this.allCommands.size} total commands\n`);
  }

  /**
   * Get workspace name from package.json path
   */
  getWorkspaceName(packagePath) {
    if (packagePath === "package.json") return null;

    const dir = path.dirname(packagePath);

    // Handle nested workspaces
    if (dir.includes("scripts/documentation-analysis")) {
      return "scripts/documentation-analysis";
    }

    return dir;
  }

  /**
   * Check if a path is legacy (backup or deprecated)
   */
  isLegacyPath(packagePath) {
    const normalizedPath = packagePath.replace(/\\/g, '/'); // Normalize Windows paths
    return (
      normalizedPath.includes("backups/") ||
      normalizedPath.includes("migration-backups/") ||
      normalizedPath.includes("legacy-") ||
      normalizedPath.includes("deprecated/") ||
      normalizedPath.includes("old/") ||
      normalizedPath.includes("archive/")
    );
  }

  /**
   * Identify legacy commands
   */
  async identifyLegacyCommands() {
    console.log("🗂️  Identifying legacy commands...");

    for (const [command, source] of this.commandSources) {
      if (source.isLegacy) {
        this.legacyCommands.add(command);
      }
    }

    console.log(`Found ${this.legacyCommands.size} legacy commands\n`);
  }

  /**
   * Analyze command usage across the codebase
   */
  async analyzeCommandUsage() {
    console.log("🔍 Analyzing command usage...");

    // Find all files that might contain command references
    const filesToCheck = await glob("**/*.{md,js,json,yml,yaml,sh,bat}", {
      cwd: this.projectRoot,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "**/.git/**",
        "**/backups/**",
      ],
    });

    for (const file of filesToCheck) {
      const fullPath = path.join(this.projectRoot, file);

      try {
        const content = await fs.readFile(fullPath, "utf8");

        // Check for command references
        for (const command of this.allCommands) {
          if (content.includes(command)) {
            if (!this.commandUsage.has(command)) {
              this.commandUsage.set(command, []);
            }
            this.commandUsage.get(command).push(file);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    console.log(`Analyzed ${filesToCheck.length} files for command usage\n`);
  }

  /**
   * Parse commands documented in command-reference.md
   */
  async parseDocumentedCommands() {
    console.log("📖 Parsing documented commands...");

    try {
      const content = await fs.readFile(this.commandRefPath, "utf8");

      // Extract commands from code blocks
      const codeBlockRegex = /```bash([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        const codeBlock = match[1];
        const lines = codeBlock.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip comments and empty lines
          if (trimmed.startsWith("#") || !trimmed) continue;

          // Extract npm commands
          if (trimmed.startsWith("npm run ") || trimmed.startsWith("node ")) {
            // Remove inline comments
            const command = trimmed.split("#")[0].trim();
            this.documentedCommands.add(command);
          }
        }
      }

      console.log(
        `Found ${this.documentedCommands.size} documented commands\n`
      );
    } catch (error) {
      throw new Error(`Could not read command reference: ${error.message}`);
    }
  }

  /**
   * Generate cross-reference report
   */
  async generateReport() {
    console.log("📊 Generating cross-reference report...\n");

    // Find missing commands (in package.json but not documented)
    for (const command of this.allCommands) {
      if (!this.isCommandDocumented(command)) {
        this.missingCommands.add(command);
      }
    }

    // Find extra commands (documented but not in package.json)
    for (const command of this.documentedCommands) {
      if (!this.isCommandInPackageJson(command)) {
        this.extraCommands.add(command);
      }
    }

    // Generate report
    const report = this.createReport();

    // Save report
    const reportPath = path.join(
      __dirname,
      "command-cross-reference-report.md"
    );
    await fs.writeFile(reportPath, report, "utf8");

    // Generate legacy cleanup recommendations
    const cleanupReport = this.createLegacyCleanupReport();
    const cleanupReportPath = path.join(
      __dirname,
      "legacy-commands-cleanup-report.md"
    );
    await fs.writeFile(cleanupReportPath, cleanupReport, "utf8");

    // Display summary
    this.displaySummary();

    console.log(`\n📋 Full report saved to: ${reportPath}`);
    console.log(`🗂️  Legacy cleanup report saved to: ${cleanupReportPath}`);

    // Exit with error code if there are issues (but not for legacy commands)
    const nonLegacyMissing = Array.from(this.missingCommands).filter(
      (cmd) => !this.legacyCommands.has(cmd)
    );

    if (nonLegacyMissing.length > 0) {
      process.exit(1);
    }
  }

  /**
   * Check if a command is documented (with fuzzy matching)
   */
  isCommandDocumented(command) {
    // Direct match
    if (this.documentedCommands.has(command)) return true;

    // Fuzzy matching for workspace commands
    for (const docCommand of this.documentedCommands) {
      if (this.commandsMatch(command, docCommand)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a documented command exists in package.json
   */
  isCommandInPackageJson(docCommand) {
    // Direct match
    if (this.allCommands.has(docCommand)) return true;

    // Fuzzy matching
    for (const command of this.allCommands) {
      if (this.commandsMatch(command, docCommand)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two commands match (with variations)
   */
  commandsMatch(cmd1, cmd2) {
    // Direct match first
    if (cmd1 === cmd2) return true;

    // Normalize commands by removing workspace variations
    const normalize = (cmd) =>
      cmd
        .replace(/--workspace=[^\s]+/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const norm1 = normalize(cmd1);
    const norm2 = normalize(cmd2);

    // Only match if the normalized versions are identical
    // This prevents over-matching
    return norm1 === norm2 && norm1.length > 0;
  }

  /**
   * Create detailed report
   */
  createReport() {
    const timestamp = new Date().toISOString();
    const nonLegacyMissing = Array.from(this.missingCommands).filter(
      (cmd) => !this.legacyCommands.has(cmd)
    );
    const legacyMissing = Array.from(this.missingCommands).filter((cmd) =>
      this.legacyCommands.has(cmd)
    );

    return `# Command Cross-Reference Report

Generated: ${timestamp}

## Summary

- **Total Commands Found**: ${this.allCommands.size}
- **Total Commands Documented**: ${this.documentedCommands.size}
- **Missing from Documentation**: ${this.missingCommands.size}
- **Extra in Documentation**: ${this.extraCommands.size}
- **Legacy Commands**: ${this.legacyCommands.size}

## Missing Commands (Non-Legacy)

These commands exist in package.json files but are not documented:

${nonLegacyMissing
  .sort()
  .map((cmd) => `- \`${cmd}\``)
  .join("\n")}

## Missing Commands (Legacy)

These legacy commands exist but are not documented (may be safe to ignore):

${legacyMissing
  .sort()
  .map(
    (cmd) => `- \`${cmd}\` (${this.commandSources.get(cmd)?.file || "unknown"})`
  )
  .join("\n")}

## Extra Commands

These commands are documented but don't exist in package.json files:

${Array.from(this.extraCommands)
  .sort()
  .map((cmd) => `- \`${cmd}\``)
  .join("\n")}

## Legacy Commands Analysis

${
  this.legacyCommands.size > 0
    ? `Found ${this.legacyCommands.size} legacy commands from backup/deprecated directories.\nSee legacy-commands-cleanup-report.md for detailed cleanup recommendations.`
    : "No legacy commands found."
}

## All Commands Found

${Array.from(this.allCommands)
  .sort()
  .map((cmd) => {
    const source = this.commandSources.get(cmd);
    const isLegacy = this.legacyCommands.has(cmd) ? " (LEGACY)" : "";
    return `- \`${cmd}\`${isLegacy}`;
  })
  .join("\n")}

## All Documented Commands

${Array.from(this.documentedCommands)
  .sort()
  .map((cmd) => `- \`${cmd}\``)
  .join("\n")}

## Recommendations

${
  nonLegacyMissing.length > 0
    ? "1. Add missing non-legacy commands to docs/reference/command-reference.md\n"
    : "✅ All non-legacy commands are properly documented\n"
}
${
  this.extraCommands.size > 0
    ? "2. Remove or update extra documented commands\n"
    : "✅ No extra commands found\n"
}
${
  this.legacyCommands.size > 0
    ? "3. Review legacy commands for potential cleanup (see legacy-commands-cleanup-report.md)\n"
    : "✅ No legacy commands found\n"
}
`;
  }

  /**
   * Create legacy cleanup report
   */
  createLegacyCleanupReport() {
    const timestamp = new Date().toISOString();

    // Group legacy commands by source
    const legacyBySource = new Map();
    for (const command of this.legacyCommands) {
      const source = this.commandSources.get(command);
      if (!legacyBySource.has(source.file)) {
        legacyBySource.set(source.file, []);
      }
      legacyBySource.get(source.file).push({
        command,
        usage: this.commandUsage.get(command) || [],
      });
    }

    let report = `# Legacy Commands Cleanup Report

Generated: ${timestamp}

## Summary

- **Total Legacy Commands**: ${this.legacyCommands.size}
- **Legacy Sources**: ${legacyBySource.size}
- **Commands with Usage**: ${
      Array.from(this.legacyCommands).filter(
        (cmd) =>
          this.commandUsage.has(cmd) && this.commandUsage.get(cmd).length > 0
      ).length
    }

## Legacy Commands by Source

`;

    for (const [sourceFile, commands] of legacyBySource) {
      report += `### ${sourceFile}\n\n`;
      report += `**Commands**: ${commands.length}\n\n`;

      for (const { command, usage } of commands) {
        report += `#### \`${command}\`\n\n`;

        if (usage.length > 0) {
          report += `**⚠️ USED IN**: ${usage.length} files\n`;
          usage.forEach((file) => {
            report += `- ${file}\n`;
          });
          report += "\n**❌ DO NOT REMOVE** - Command is still referenced\n\n";
        } else {
          report += `**✅ SAFE TO REMOVE** - No usage found\n\n`;
        }
      }
    }

    // Cleanup recommendations
    const safeToRemove = Array.from(this.legacyCommands).filter(
      (cmd) =>
        !this.commandUsage.has(cmd) || this.commandUsage.get(cmd).length === 0
    );

    const stillUsed = Array.from(this.legacyCommands).filter(
      (cmd) =>
        this.commandUsage.has(cmd) && this.commandUsage.get(cmd).length > 0
    );

    report += `## Cleanup Recommendations

### Safe to Remove (${safeToRemove.length} commands)

These legacy commands have no detected usage and can likely be removed:

${safeToRemove
  .map((cmd) => {
    const source = this.commandSources.get(cmd);
    return `- \`${cmd}\` from \`${source.file}\``;
  })
  .join("\n")}

### Requires Investigation (${stillUsed.length} commands)

These legacy commands are still referenced and need investigation:

${stillUsed
  .map((cmd) => {
    const source = this.commandSources.get(cmd);
    const usage = this.commandUsage.get(cmd) || [];
    return `- \`${cmd}\` from \`${source.file}\` (used in ${usage.length} files)`;
  })
  .join("\n")}

## Action Plan

1. **Immediate Cleanup**: Remove the ${
      safeToRemove.length
    } unused legacy commands
2. **Investigation**: Review the ${
      stillUsed.length
    } commands that are still referenced
3. **Migration**: Update references to point to non-legacy equivalents where possible
4. **Documentation**: Update command reference to remove legacy command documentation

## Legacy Directories Found

${Array.from(
  new Set(Array.from(legacyBySource.keys()).map((f) => path.dirname(f)))
)
  .map((dir) => `- ${dir}`)
  .join("\n")}

These directories may be candidates for complete removal after command cleanup.
`;

    return report;
  }

  /**
   * Display summary to console
   */
  displaySummary() {
    const nonLegacyMissing = Array.from(this.missingCommands).filter(
      (cmd) => !this.legacyCommands.has(cmd)
    );
    const legacyMissing = Array.from(this.missingCommands).filter((cmd) =>
      this.legacyCommands.has(cmd)
    );

    // Calculate documented legacy vs non-legacy
    const documentedLegacy = Array.from(this.documentedCommands).filter((cmd) =>
      this.legacyCommands.has(cmd)
    );
    const documentedNonLegacy = Array.from(this.documentedCommands).filter(
      (cmd) => !this.legacyCommands.has(cmd)
    );

    console.log("📊 Cross-Reference Summary:");
    console.log(`   Total Commands: ${this.allCommands.size}`);
    console.log(`   - Legacy Commands: ${this.legacyCommands.size}`);
    console.log(
      `   - Non-Legacy Commands: ${
        this.allCommands.size - this.legacyCommands.size
      }`
    );
    console.log("");
    console.log(`   Documented: ${this.documentedCommands.size}`);
    console.log(`   - Documented Legacy: ${documentedLegacy.length}`);
    console.log(`   - Documented Non-Legacy: ${documentedNonLegacy.length}`);
    console.log("");
    console.log(`   Missing: ${this.missingCommands.size}`);
    console.log(`   - Missing Non-Legacy: ${nonLegacyMissing.length}`);
    console.log(`   - Missing Legacy: ${legacyMissing.length}`);
    console.log("");
    console.log(`   Extra: ${this.extraCommands.size}`);

    // Coverage analysis
    const coveredCommands = this.allCommands.size - this.missingCommands.size;
    const coverageRate = Math.round((coveredCommands / this.allCommands.size) * 100);
    
    console.log("");
    console.log("📊 Coverage Analysis:");
    console.log(`   Explicitly Documented: ${this.documentedCommands.size} base commands`);
    console.log(`   Coverage via Fuzzy Matching: ${coveredCommands} total commands`);
    console.log(`   Truly Missing: ${this.missingCommands.size} commands`);
    console.log(`   Coverage Rate: ${coverageRate}%`);
    console.log("");
    console.log("📊 Math Verification:");
    console.log(`   Covered + Missing = ${coveredCommands} + ${this.missingCommands.size} = ${this.allCommands.size} ✅`);
    console.log("");
    console.log("ℹ️  Note: High coverage rate achieved through fuzzy matching");
    console.log("   Base commands cover their workspace variations automatically");

    if (nonLegacyMissing.length > 0) {
      console.log("\n❌ Missing Non-Legacy Commands:");
      nonLegacyMissing.sort().forEach((cmd) => {
        console.log(`   - ${cmd}`);
      });
    }

    if (legacyMissing.length > 0) {
      console.log("\n🗂️  Missing Legacy Commands (may be safe to ignore):");
      legacyMissing
        .sort()
        .slice(0, 10)
        .forEach((cmd) => {
          console.log(`   - ${cmd}`);
        });
      if (legacyMissing.length > 10) {
        console.log(
          `   ... and ${legacyMissing.length - 10} more (see report)`
        );
      }
    }

    if (this.extraCommands.size > 0) {
      console.log("\n⚠️  Extra Commands:");
      Array.from(this.extraCommands)
        .sort()
        .forEach((cmd) => {
          console.log(`   - ${cmd}`);
        });
    }

    // Legacy cleanup summary
    if (this.legacyCommands.size > 0) {
      const safeToRemove = Array.from(this.legacyCommands).filter(
        (cmd) =>
          !this.commandUsage.has(cmd) || this.commandUsage.get(cmd).length === 0
      );
      const stillUsed = Array.from(this.legacyCommands).filter(
        (cmd) =>
          this.commandUsage.has(cmd) && this.commandUsage.get(cmd).length > 0
      );

      console.log("\n🗂️  Legacy Commands Analysis:");
      console.log(`   Safe to Remove: ${safeToRemove.length}`);
      console.log(`   Still Used: ${stillUsed.length}`);
      console.log(`   Requires Investigation: ${stillUsed.length}`);
    }

    if (nonLegacyMissing.length === 0 && this.extraCommands.size === 0) {
      console.log(
        "\n✅ All non-legacy commands are properly cross-referenced!"
      );
    }
  }
}

async function main() {
  const checker = new CommandCrossReferenceChecker();
  await checker.run();
}

// Show usage if help requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Command Cross-Reference Checker

Usage:
  node cross-reference-commands.js

This script:
1. Finds all npm scripts in package.json files
2. Parses documented commands from docs/reference/command-reference.md
3. Identifies missing or extra commands
4. Generates a detailed report

Examples:
  node cross-reference-commands.js    # Run cross-reference check
`);
  process.exit(0);
}

main();
