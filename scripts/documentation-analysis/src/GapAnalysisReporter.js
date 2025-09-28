/**
 * Gap Analysis Reporter Implementation
 * Identifies and reports documentation gaps
 */

const IGapAnalysisReporter = require("./interfaces/IGapAnalysisReporter");
const FileUtils = require("./utils/FileUtils");
const {
  getGapAnalysisConfig,
  getContentCategories,
  getCommandCategories,
  getProjectRoot,
} = require("../config/documentation-config");
const path = require("path");

class GapAnalysisReporter extends IGapAnalysisReporter {
  constructor() {
    super();
    this.config = getGapAnalysisConfig();
    this.contentCategories = getContentCategories();
    this.commandCategories = getCommandCategories();
    this.projectRoot = getProjectRoot();
  }

  /**
   * Analyzes missing documentation
   * @param {Object} projectStructure - Project structure to analyze
   * @returns {Promise<MissingDocInfo[]>} Missing documentation information
   */
  async analyzeMissingDocumentation(projectStructure) {
    const missingDocs = [];

    try {
      // Check for missing main documentation files (skip README.md as it exists)
      const mainFiles = [
        {
          file: "QUICK_START.md",
          path: path.join(this.projectRoot, "docs", "QUICK_START.md"),
        },
        {
          file: "DEVELOPMENT_GUIDE.md",
          path: path.join(
            this.projectRoot,
            "docs",
            "consolidated",
            "development",
            "DEVELOPMENT_GUIDE.md"
          ),
        },
        {
          file: "API_REFERENCE.md",
          path: path.join(
            this.projectRoot,
            "docs",
            "consolidated",
            "reference",
            "API_REFERENCE.md"
          ),
        },
        {
          file: "TROUBLESHOOTING.md",
          path: path.join(
            this.projectRoot,
            "docs",
            "consolidated",
            "troubleshooting",
            "TROUBLESHOOTING_GUIDE.md"
          ),
        },
      ];

      for (const { file, path: filePath } of mainFiles) {
        if (!(await FileUtils.fileExists(filePath))) {
          missingDocs.push({
            feature: file.replace(".md", "").replace("_", " "),
            component: "main-documentation",
            importance: this._getImportanceLevel(file),
            estimatedEffort: this._getEffortLevel(file),
            dependencies: [],
          });
        }
      }

      // Check for missing component documentation
      const components = ["frontend", "backend", "infrastructure", "scripts"];
      for (const component of components) {
        const componentPath = path.join(this.projectRoot, component);
        if (await FileUtils.fileExists(componentPath)) {
          const docPath = path.join(
            this.projectRoot,
            "docs",
            "components",
            component,
            "README.md"
          );
          if (!(await FileUtils.fileExists(docPath))) {
            missingDocs.push({
              feature: `${component} component documentation`,
              component: component,
              importance: "high",
              estimatedEffort: "medium",
              dependencies: [],
            });
          }
        }
      }

      // Check for missing setup documentation
      const setupDocs = [
        "local-development.md",
        "frontend-only.md",
        "docker-setup.md",
        "dependencies.md",
      ];
      for (const doc of setupDocs) {
        const docPath = path.join(this.projectRoot, "docs", "setup", doc);
        if (!(await FileUtils.fileExists(docPath))) {
          missingDocs.push({
            feature: doc.replace(".md", "").replace("-", " "),
            component: "setup",
            importance: "critical",
            estimatedEffort: "small",
            dependencies: [],
          });
        }
      }

      // Check for missing workflow documentation
      const workflowDocs = [
        "data-management.md",
        "testing-strategies.md",
        "deployment-process.md",
        "monitoring.md",
      ];
      for (const doc of workflowDocs) {
        const docPath = path.join(this.projectRoot, "docs", "workflows", doc);
        if (!(await FileUtils.fileExists(docPath))) {
          missingDocs.push({
            feature: doc.replace(".md", "").replace("-", " "),
            component: "workflows",
            importance: "medium",
            estimatedEffort: "medium",
            dependencies: [],
          });
        }
      }

      // Check for missing reference documentation
      const referenceDocs = [
        "command-reference.md",
        "configuration.md",
        "environment-variables.md",
        "npm-scripts.md",
      ];
      for (const doc of referenceDocs) {
        const docPath = path.join(this.projectRoot, "docs", "reference", doc);
        if (!(await FileUtils.fileExists(docPath))) {
          missingDocs.push({
            feature: doc.replace(".md", "").replace("-", " "),
            component: "reference",
            importance: "low",
            estimatedEffort: "small",
            dependencies: [],
          });
        }
      }

      // Check for undocumented npm scripts (exclude backup directories)
      const packageJsonPaths = [
        path.join(this.projectRoot, "package.json"),
        path.join(this.projectRoot, "frontend", "package.json"),
        path.join(this.projectRoot, "backend", "package.json"),
        path.join(this.projectRoot, "scripts", "package.json"),
      ];

      const allUndocumentedScripts = new Set(); // Use Set to avoid duplicates

      for (const packagePath of packageJsonPaths) {
        // Skip legacy/backup directories
        if (this._isLegacyPath(packagePath)) {
          continue;
        }

        if (await FileUtils.fileExists(packagePath)) {
          const packageContent = await FileUtils.readFile(packagePath);
          if (packageContent) {
            try {
              const packageJson = JSON.parse(packageContent);
              if (packageJson.scripts) {
                const undocumentedScripts = await this._findUndocumentedScripts(
                  packageJson.scripts
                );
                for (const script of undocumentedScripts) {
                  allUndocumentedScripts.add(script);
                }
              }
            } catch (error) {
              console.warn(
                `Warning: Could not parse package.json at ${packagePath}: ${error.message}`
              );
            }
          }
        }
      }

      // Add unique undocumented scripts to missing docs
      for (const script of allUndocumentedScripts) {
        missingDocs.push({
          feature: `${script} command documentation`,
          component: "commands",
          importance: "low", // Changed from medium to low for command docs
          estimatedEffort: "small",
          dependencies: [],
        });
      }
    } catch (error) {
      console.error("Error analyzing missing documentation:", error);
    }

    return missingDocs;
  }

  /**
   * Identifies outdated content
   * @param {DocumentationMap} documentationMap - Current documentation mapping
   * @returns {Promise<OutdatedContentInfo[]>} Outdated content information
   */
  async identifyOutdatedContent(documentationMap) {
    const outdatedContent = [];

    try {
      const currentTime = new Date();
      const sixMonthsAgo = new Date(
        currentTime.getTime() - 6 * 30 * 24 * 60 * 60 * 1000
      );

      for (const fileInfo of documentationMap.currentFiles) {
        const issues = [];
        let recommendedAction = "review";

        // Check if file is old
        if (fileInfo.lastModified < sixMonthsAgo) {
          issues.push("File has not been updated in over 6 months");
          recommendedAction = "update";
        }

        // Check if file is marked as moved but still exists
        if (fileInfo.status === "moved") {
          issues.push(
            "File is marked as moved but still exists in original location"
          );
          recommendedAction = "consolidate";
        }

        // Check if file references non-existent paths
        const content = await FileUtils.readFile(fileInfo.path);
        if (content) {
          const brokenReferences = await this._findBrokenReferences(
            content,
            fileInfo.path
          );
          if (brokenReferences.length > 0) {
            issues.push(
              `Contains ${brokenReferences.length} broken references`
            );
            recommendedAction = "fix-references";
          }

          // Check for outdated command references
          const outdatedCommands = await this._findOutdatedCommands(content);
          if (outdatedCommands.length > 0) {
            issues.push(
              `Contains ${outdatedCommands.length} outdated command references`
            );
            recommendedAction = "update-commands";
          }
        }

        if (issues.length > 0) {
          outdatedContent.push({
            filePath: fileInfo.path,
            lastUpdated: fileInfo.lastModified,
            issues: issues,
            recommendedAction: recommendedAction,
          });
        }
      }

      // Check for files marked as moved
      for (const movedFile of documentationMap.movedFiles) {
        if (!movedFile.contentMigrated) {
          outdatedContent.push({
            filePath: movedFile.originalPath,
            lastUpdated: new Date(0), // Very old date to indicate high priority
            issues: ["File marked as moved but content not migrated"],
            recommendedAction: "migrate-content",
          });
        }
      }
    } catch (error) {
      console.error("Error identifying outdated content:", error);
    }

    return outdatedContent;
  }

  /**
   * Creates priority matrix for documentation improvements
   * @param {MissingDocInfo[]} missingDocs - Missing documentation items
   * @param {OutdatedContentInfo[]} outdatedContent - Outdated content items
   * @returns {Promise<PriorityMatrix>} Priority matrix
   */
  async generatePriorityMatrix(missingDocs, outdatedContent) {
    const priorityMatrix = {
      high: {
        critical: [],
        important: [],
        total: 0,
      },
      medium: {
        helpful: [],
        maintenance: [],
        total: 0,
      },
      low: {
        nice_to_have: [],
        cleanup: [],
        total: 0,
      },
    };

    try {
      // Ensure inputs are arrays
      const safeMissingDocs = Array.isArray(missingDocs) ? missingDocs : [];
      const safeOutdatedContent = Array.isArray(outdatedContent)
        ? outdatedContent
        : [];

      // Categorize missing documentation
      for (const doc of safeMissingDocs) {
        const priority = this._calculatePriority(
          doc.importance,
          doc.estimatedEffort
        );
        const item = {
          type: "missing",
          title: doc.feature,
          component: doc.component,
          importance: doc.importance,
          effort: doc.estimatedEffort,
          score: this._calculateScore(doc.importance, doc.estimatedEffort),
        };

        if (priority === "high") {
          if (doc.importance === "critical") {
            priorityMatrix.high.critical.push(item);
          } else {
            priorityMatrix.high.important.push(item);
          }
          priorityMatrix.high.total++;
        } else if (priority === "medium") {
          priorityMatrix.medium.helpful.push(item);
          priorityMatrix.medium.total++;
        } else {
          priorityMatrix.low.nice_to_have.push(item);
          priorityMatrix.low.total++;
        }
      }

      // Categorize outdated content
      for (const content of safeOutdatedContent) {
        const priority = this._calculateOutdatedPriority(content);
        const item = {
          type: "outdated",
          title: path.basename(content.filePath),
          filePath: content.filePath,
          issues: content.issues,
          action: content.recommendedAction,
          score: this._calculateOutdatedScore(content),
        };

        if (priority === "high") {
          priorityMatrix.high.important.push(item);
          priorityMatrix.high.total++;
        } else if (priority === "medium") {
          priorityMatrix.medium.maintenance.push(item);
          priorityMatrix.medium.total++;
        } else {
          priorityMatrix.low.cleanup.push(item);
          priorityMatrix.low.total++;
        }
      }

      // Sort items within each category by score
      this._sortPriorityItems(priorityMatrix);
    } catch (error) {
      console.error("Error generating priority matrix:", error);
    }

    return priorityMatrix;
  }

  /**
   * Generates comprehensive gap analysis report
   * @param {Object} analysisData - Analysis data to include in report
   * @returns {Promise<GapAnalysisReport>} Complete gap analysis report
   */
  async generateGapReport(analysisData) {
    try {
      const {
        projectStructure,
        documentationMap,
        missingDocs,
        outdatedContent,
        priorityMatrix,
      } = analysisData;

      // Generate inconsistencies
      const inconsistencies = await this._findInconsistencies(documentationMap);

      // Generate recommendations
      const recommendations = await this._generateRecommendations(
        missingDocs,
        outdatedContent,
        inconsistencies
      );

      // Calculate accurate priority counts
      const missingDocsHigh = (missingDocs || []).filter(
        (d) =>
          this._calculatePriority(d.importance, d.estimatedEffort) === "high"
      ).length;
      const missingDocsMedium = (missingDocs || []).filter(
        (d) =>
          this._calculatePriority(d.importance, d.estimatedEffort) === "medium"
      ).length;
      const missingDocsLow = (missingDocs || []).filter(
        (d) =>
          this._calculatePriority(d.importance, d.estimatedEffort) === "low"
      ).length;

      const outdatedHigh = (outdatedContent || []).filter(
        (c) => this._calculateOutdatedPriority(c) === "high"
      ).length;
      const outdatedMedium = (outdatedContent || []).filter(
        (c) => this._calculateOutdatedPriority(c) === "medium"
      ).length;
      const outdatedLow = (outdatedContent || []).filter(
        (c) => this._calculateOutdatedPriority(c) === "low"
      ).length;

      const report = {
        missingDocumentation: missingDocs || [],
        outdatedContent: outdatedContent || [],
        inconsistencies: inconsistencies,
        recommendations: recommendations,
        priorityMatrix: priorityMatrix || {
          high: { total: 0 },
          medium: { total: 0 },
          low: { total: 0 },
        },
        summary: {
          totalIssues:
            (missingDocs?.length || 0) +
            (outdatedContent?.length || 0) +
            inconsistencies.length,
          criticalIssues:
            missingDocs?.filter((d) => d.importance === "critical").length || 0,
          highPriorityItems: missingDocsHigh + outdatedHigh,
          mediumPriorityItems: missingDocsMedium + outdatedMedium,
          lowPriorityItems: missingDocsLow + outdatedLow,
          generatedAt: new Date().toISOString(),
        },
      };

      return report;
    } catch (error) {
      console.error("Error generating gap report:", error);
      throw error;
    }
  }

  /**
   * Helper method to get importance level for a file
   * @private
   */
  _getImportanceLevel(fileName) {
    if (fileName.includes("README") || fileName.includes("QUICK_START")) {
      return "critical";
    }
    if (fileName.includes("DEVELOPMENT") || fileName.includes("API")) {
      return "high";
    }
    return "medium";
  }

  /**
   * Helper method to get effort level for a file
   * @private
   */
  _getEffortLevel(fileName) {
    if (
      fileName.includes("API_REFERENCE") ||
      fileName.includes("DEVELOPMENT_GUIDE")
    ) {
      return "large";
    }
    if (fileName.includes("README") || fileName.includes("TROUBLESHOOTING")) {
      return "medium";
    }
    return "small";
  }

  /**
   * Helper method to find undocumented scripts
   * @private
   */
  async _findUndocumentedScripts(scripts) {
    const undocumented = [];
    const commandRefPaths = [
      path.join(
        this.projectRoot,
        "docs",
        "consolidated",
        "reference",
        "COMMAND_REFERENCE.md"
      ),
      path.join(this.projectRoot, "docs", "reference", "command-reference.md"),
    ];

    let commandRefContent = "";
    for (const commandRefPath of commandRefPaths) {
      if (await FileUtils.fileExists(commandRefPath)) {
        commandRefContent = (await FileUtils.readFile(commandRefPath)) || "";
        break;
      }
    }

    for (const scriptName of Object.keys(scripts)) {
      if (!commandRefContent.includes(scriptName)) {
        undocumented.push(scriptName);
      }
    }

    return undocumented;
  }

  /**
   * Helper method to check if a path is legacy (backup or deprecated)
   * @private
   */
  _isLegacyPath(packagePath) {
    const normalizedPath = packagePath.replace(/\\/g, "/"); // Normalize Windows paths
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
   * Helper method to find broken references in content
   * @private
   */
  async _findBrokenReferences(content, filePath) {
    const brokenRefs = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];

      // Skip external links
      if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) {
        continue;
      }

      // Check relative file references
      const absolutePath = path.resolve(path.dirname(filePath), linkPath);
      if (!(await FileUtils.fileExists(absolutePath))) {
        brokenRefs.push(linkPath);
      }
    }

    return brokenRefs;
  }

  /**
   * Helper method to find outdated commands in content
   * @private
   */
  async _findOutdatedCommands(content) {
    const outdatedCommands = [];
    const commandRegex = /npm run ([a-zA-Z0-9-_:]+)/g;
    let match;

    // Only check main package.json files, exclude backup directories
    const allPackageJsons = [
      path.join(this.projectRoot, "package.json"),
      path.join(this.projectRoot, "frontend", "package.json"),
      path.join(this.projectRoot, "backend", "package.json"),
      path.join(this.projectRoot, "scripts", "package.json"),
    ];

    const allScripts = new Set();
    for (const packagePath of allPackageJsons) {
      // Skip legacy/backup directories
      if (this._isLegacyPath(packagePath)) {
        continue;
      }

      if (await FileUtils.fileExists(packagePath)) {
        const packageContent = await FileUtils.readFile(packagePath);
        if (packageContent) {
          try {
            const packageJson = JSON.parse(packageContent);
            if (packageJson.scripts) {
              Object.keys(packageJson.scripts).forEach((script) =>
                allScripts.add(script)
              );
            }
          } catch (error) {
            // Skip invalid JSON files
            console.warn(
              `Warning: Could not parse package.json at ${packagePath}`
            );
          }
        }
      }
    }

    while ((match = commandRegex.exec(content)) !== null) {
      const commandName = match[1];
      if (!allScripts.has(commandName)) {
        outdatedCommands.push(commandName);
      }
    }

    return outdatedCommands;
  }

  /**
   * Helper method to calculate priority
   * @private
   */
  _calculatePriority(importance, effort) {
    const importanceScore =
      this.config.importanceLevels[importance]?.score || 1;
    const effortScore = this.config.effortLevels[effort]?.hours || 2;

    // High importance, low effort = high priority
    // High importance, high effort = medium priority
    // Low importance = low priority
    if (importanceScore >= 3) {
      return effortScore <= 4 ? "high" : "medium";
    } else if (importanceScore >= 2) {
      return "medium";
    }
    return "low";
  }

  /**
   * Helper method to calculate score
   * @private
   */
  _calculateScore(importance, effort) {
    const importanceScore =
      this.config.importanceLevels[importance]?.score || 1;
    const effortScore = this.config.effortLevels[effort]?.hours || 2;

    // Higher importance and lower effort = higher score
    return importanceScore * 10 - effortScore;
  }

  /**
   * Helper method to calculate outdated priority
   * @private
   */
  _calculateOutdatedPriority(content) {
    if (!content) return "low";

    if (
      content.recommendedAction === "migrate-content" ||
      (content.issues &&
        content.issues.some((issue) => issue.includes("broken references")))
    ) {
      return "high";
    }
    if (
      content.recommendedAction === "update-commands" ||
      (content.issues &&
        content.issues.some((issue) => issue.includes("6 months")))
    ) {
      return "medium";
    }
    return "low";
  }

  /**
   * Helper method to calculate outdated score
   * @private
   */
  _calculateOutdatedScore(content) {
    if (!content) return 0;

    let score = 0;

    if (content.recommendedAction === "migrate-content") score += 50;
    if (
      content.issues &&
      content.issues.some((issue) => issue.includes("broken references"))
    )
      score += 30;
    if (
      content.issues &&
      content.issues.some((issue) => issue.includes("outdated command"))
    )
      score += 20;
    if (
      content.issues &&
      content.issues.some((issue) => issue.includes("6 months"))
    )
      score += 10;

    return score;
  }

  /**
   * Helper method to sort priority items
   * @private
   */
  _sortPriorityItems(priorityMatrix) {
    for (const priority of Object.keys(priorityMatrix)) {
      for (const category of Object.keys(priorityMatrix[priority])) {
        if (Array.isArray(priorityMatrix[priority][category])) {
          priorityMatrix[priority][category].sort((a, b) => b.score - a.score);
        }
      }
    }
  }

  /**
   * Helper method to find inconsistencies
   * @private
   */
  async _findInconsistencies(documentationMap) {
    const inconsistencies = [];

    try {
      // Ensure documentationMap exists and has required properties
      if (!documentationMap) {
        return inconsistencies;
      }

      const duplicateContent = documentationMap.duplicateContent || [];
      const currentFiles = documentationMap.currentFiles || [];

      // Check for duplicate content
      for (const duplicate of duplicateContent) {
        inconsistencies.push({
          type: "duplicate-content",
          affectedFiles: duplicate.filePaths,
          description: `Duplicate content found with ${duplicate.similarityScore}% similarity`,
          suggestedFix: duplicate.recommendedAction,
        });
      }

      // Check for inconsistent formatting
      const markdownFiles = currentFiles.filter(
        (f) => f.path && f.path.endsWith(".md")
      );
      const formatIssues = await this._checkFormattingConsistency(
        markdownFiles
      );
      if (formatIssues.length > 0) {
        inconsistencies.push({
          type: "formatting-inconsistency",
          affectedFiles: formatIssues,
          description: "Inconsistent markdown formatting across files",
          suggestedFix: "Apply consistent formatting standards",
        });
      }
    } catch (error) {
      console.error("Error finding inconsistencies:", error);
    }

    return inconsistencies;
  }

  /**
   * Helper method to check formatting consistency
   * @private
   */
  async _checkFormattingConsistency(markdownFiles) {
    const formatIssues = [];

    for (const file of markdownFiles.slice(0, 10)) {
      // Limit to first 10 files for performance
      const content = await FileUtils.readFile(file.path);
      if (content) {
        // Check for inconsistent heading styles
        const hasAtxHeadings = /^#{1,6}\s/.test(content);
        const hasSetextHeadings = /^[=-]{3,}$/m.test(content);

        if (hasAtxHeadings && hasSetextHeadings) {
          formatIssues.push(file.path);
        }
      }
    }

    return formatIssues;
  }

  /**
   * Helper method to generate recommendations
   * @private
   */
  async _generateRecommendations(
    missingDocs,
    outdatedContent,
    inconsistencies
  ) {
    const recommendations = [];

    // Ensure inputs are arrays
    const safeMissingDocs = Array.isArray(missingDocs) ? missingDocs : [];
    const safeOutdatedContent = Array.isArray(outdatedContent)
      ? outdatedContent
      : [];
    const safeInconsistencies = Array.isArray(inconsistencies)
      ? inconsistencies
      : [];

    // Recommendation for missing critical documentation
    const criticalMissing = safeMissingDocs.filter(
      (d) => d.importance === "critical"
    );
    if (criticalMissing.length > 0) {
      recommendations.push({
        category: "critical-documentation",
        title: "Create Critical Documentation",
        description: `${criticalMissing.length} critical documentation files are missing`,
        priority: "high",
        actionItems: criticalMissing.map(
          (d) => `Create ${d.feature} documentation`
        ),
      });
    }

    // Recommendation for outdated content
    if (safeOutdatedContent.length > 0) {
      recommendations.push({
        category: "content-maintenance",
        title: "Update Outdated Content",
        description: `${safeOutdatedContent.length} files need updates or maintenance`,
        priority: "medium",
        actionItems: [
          "Review and update outdated files",
          "Fix broken references",
          "Update command documentation",
        ],
      });
    }

    // Recommendation for inconsistencies
    if (safeInconsistencies.length > 0) {
      recommendations.push({
        category: "consistency",
        title: "Resolve Documentation Inconsistencies",
        description: `${safeInconsistencies.length} inconsistencies found in documentation`,
        priority: "low",
        actionItems: [
          "Standardize formatting",
          "Consolidate duplicate content",
          "Apply consistent style guide",
        ],
      });
    }

    // General recommendations
    recommendations.push({
      category: "automation",
      title: "Implement Documentation Automation",
      description: "Set up automated documentation validation and generation",
      priority: "medium",
      actionItems: [
        "Add documentation validation to CI/CD pipeline",
        "Implement automated command documentation generation",
        "Set up regular documentation health checks",
      ],
    });

    return recommendations;
  }
}

module.exports = GapAnalysisReporter;
