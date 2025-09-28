/**
 * Documentation Validation Pipeline
 * Orchestrates comprehensive validation of all project documentation
 */

const DocumentationAnalyzer = require("./DocumentationAnalyzer");
const DocumentationValidator = require("./DocumentationValidator");
const CommandDocumentationGenerator = require("./CommandDocumentationGenerator");
const FileUtils = require("./utils/FileUtils");
const path = require("path");
const fs = require("fs").promises;

class ValidationPipeline {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      outputDir:
        config.outputDir ||
        path.join(
          process.cwd(),
          "scripts",
          "documentation-analysis",
          "validation-reports"
        ),
      skipPatterns: config.skipPatterns || [
        "**/node_modules/**",
        "**/.git/**",
        "**/coverage/**",
      ],
      includePatterns: config.includePatterns || ["**/*.md", "**/package.json"],
      validateExternal: config.validateExternal || false,
      generateReports: config.generateReports !== false,
      ...config,
    };

    this.analyzer = new DocumentationAnalyzer(this.config);
    this.validator = new DocumentationValidator(this.config);
    this.commandGenerator = new CommandDocumentationGenerator(this.config);
    this.fileUtils = new FileUtils();
  }

  /**
   * Run complete validation pipeline
   * @returns {Promise<ValidationResult>}
   */
  async run() {
    console.log("🚀 Starting Documentation Validation Pipeline...");

    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      success: true,
      errors: [],
      warnings: [],
      phases: {},
    };

    try {
      // Phase 1: Discovery and Analysis
      console.log("\n📊 Phase 1: Document Discovery and Analysis");
      results.phases.discovery = await this.runDiscoveryPhase();

      // Phase 2: Content Validation
      console.log("\n✅ Phase 2: Content Validation");
      results.phases.validation = await this.runValidationPhase();

      // Phase 3: Command Documentation
      console.log("\n📝 Phase 3: Command Documentation Generation");
      results.phases.commands = await this.runCommandPhase();

      // Phase 4: Report Generation
      if (this.config.generateReports) {
        console.log("\n📋 Phase 4: Report Generation");
        results.phases.reports = await this.runReportPhase(results);
      }

      const duration = Date.now() - startTime;
      console.log(`\n🎉 Pipeline completed successfully in ${duration}ms`);

      results.duration = duration;
      return results;
    } catch (error) {
      console.error("❌ Pipeline failed:", error.message);
      results.success = false;
      results.errors.push({
        phase: "pipeline",
        error: error.message,
        stack: error.stack,
      });
      return results;
    }
  }

  /**
   * Phase 1: Document discovery and analysis
   */
  async runDiscoveryPhase() {
    const phase = {
      name: "discovery",
      success: true,
      results: {},
      errors: [],
    };

    try {
      // Discover all documentation files
      console.log("  🔍 Discovering documentation files...");
      const files = await this.analyzer.discoverFiles();
      phase.results.filesFound = files.length;

      // Analyze documentation structure
      console.log("  📈 Analyzing documentation structure...");
      const analysis = await this.analyzer.analyzeStructure();
      phase.results.structure = analysis;

      // Check for missing critical documents
      console.log("  🔎 Checking for missing documents...");
      const gaps = await this.analyzer.findGaps();
      phase.results.gaps = gaps;

      console.log(
        `  ✅ Found ${files.length} files, identified ${gaps.length} gaps`
      );
    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error("  ❌ Discovery phase failed:", error.message);
    }

    return phase;
  }

  /**
   * Phase 2: Content validation
   */
  async runValidationPhase() {
    const phase = {
      name: "validation",
      success: true,
      results: {},
      errors: [],
    };

    try {
      // Validate markdown syntax
      console.log("  📝 Validating markdown syntax...");
      const syntaxResults = await this.validator.validateSyntax();
      phase.results.syntax = syntaxResults;

      // Validate links and references
      console.log("  🔗 Validating links and references...");
      const linkResults = await this.validator.validateLinks();
      phase.results.links = linkResults;

      // Validate content structure
      console.log("  🏗️  Validating content structure...");
      const structureResults = await this.validator.validateStructure();
      phase.results.structure = structureResults;

      // Check for outdated content
      console.log("  📅 Checking for outdated content...");
      const freshnessResults = await this.validator.checkFreshness();
      phase.results.freshness = freshnessResults;

      const totalIssues =
        syntaxResults.errors.length +
        linkResults.errors.length +
        structureResults.errors.length +
        freshnessResults.warnings.length;

      console.log(`  ✅ Validation complete, found ${totalIssues} issues`);
    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error("  ❌ Validation phase failed:", error.message);
    }

    return phase;
  }

  /**
   * Phase 3: Command documentation generation
   */
  async runCommandPhase() {
    const phase = {
      name: "commands",
      success: true,
      results: {},
      errors: [],
    };

    try {
      // Generate command reference
      console.log("  ⚡ Generating command reference...");
      const commandDocs = await this.commandGenerator.generateReference();
      phase.results.commands = commandDocs;

      // Update existing documentation
      console.log("  📝 Updating command documentation...");
      const updateResults = await this.commandGenerator.updateDocumentation();
      phase.results.updates = updateResults;

      console.log(`  ✅ Generated docs for ${commandDocs.length} commands`);
    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error("  ❌ Command phase failed:", error.message);
    }

    return phase;
  }

  /**
   * Phase 4: Report generation
   */
  async runReportPhase(results) {
    const phase = {
      name: "reports",
      success: true,
      results: {},
      errors: [],
    };

    try {
      // Ensure output directory exists
      await this.fileUtils.ensureDirectory(this.config.outputDir);

      // Generate summary report
      console.log("  📊 Generating summary report...");
      const summaryPath = await this.generateSummaryReport(results);
      phase.results.summaryReport = summaryPath;

      // Generate detailed validation report
      console.log("  📋 Generating detailed validation report...");
      const detailPath = await this.generateDetailedReport(results);
      phase.results.detailedReport = detailPath;

      // Generate gap analysis report
      console.log("  🔍 Generating gap analysis report...");
      const gapPath = await this.generateGapReport(results);
      phase.results.gapReport = gapPath;

      console.log(`  ✅ Reports generated in ${this.config.outputDir}`);
    } catch (error) {
      phase.success = false;
      phase.errors.push(error.message);
      console.error("  ❌ Report phase failed:", error.message);
    }

    return phase;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(results) {
    const reportPath = path.join(
      this.config.outputDir,
      "validation-summary.md"
    );

    const content = `# Documentation Validation Summary

Generated: ${results.timestamp}
Duration: ${results.duration}ms
Status: ${results.success ? "✅ Success" : "❌ Failed"}

## Phase Results

${Object.entries(results.phases)
  .map(
    ([name, phase]) => `
### ${name.charAt(0).toUpperCase() + name.slice(1)} Phase
- Status: ${phase.success ? "✅ Success" : "❌ Failed"}
- Errors: ${phase.errors.length}
${phase.results ? this.formatPhaseResults(phase.results) : ""}
`
  )
  .join("\n")}

## Overall Statistics

- Total Files Processed: ${results.phases.discovery?.results?.filesFound || 0}
- Validation Issues: ${this.countValidationIssues(results)}
- Commands Documented: ${
      results.phases.commands?.results?.commands?.length || 0
    }
- Reports Generated: ${
      Object.keys(results.phases.reports?.results || {}).length
    }

## Next Steps

${this.generateRecommendations(results)}
`;

    await fs.writeFile(reportPath, content, "utf8");
    return reportPath;
  }

  /**
   * Generate detailed validation report
   */
  async generateDetailedReport(results) {
    const reportPath = path.join(
      this.config.outputDir,
      "validation-details.json"
    );
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2), "utf8");
    return reportPath;
  }

  /**
   * Generate gap analysis report
   */
  async generateGapReport(results) {
    const reportPath = path.join(this.config.outputDir, "gap-analysis.md");
    const gaps = results.phases.discovery?.results?.gaps || [];

    const content = `# Documentation Gap Analysis

Generated: ${results.timestamp}

## Missing Documentation

${gaps
  .map(
    (gap) => `
### ${gap.type}: ${gap.path}
- Priority: ${gap.priority}
- Description: ${gap.description}
- Recommended Action: ${gap.action}
`
  )
  .join("\n")}

## Recommendations

${
  gaps.length === 0
    ? "✅ No critical documentation gaps identified."
    : `Found ${gaps.length} documentation gaps that should be addressed.`
}
`;

    await fs.writeFile(reportPath, content, "utf8");
    return reportPath;
  }

  /**
   * Format phase results for display
   */
  formatPhaseResults(results) {
    if (!results || typeof results !== "object") return "";

    return Object.entries(results)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `- ${key}: ${value.length} items`;
        } else if (typeof value === "object" && value !== null) {
          return `- ${key}: ${Object.keys(value).length} entries`;
        } else {
          return `- ${key}: ${value}`;
        }
      })
      .join("\n");
  }

  /**
   * Count total validation issues
   */
  countValidationIssues(results) {
    const validation = results.phases.validation?.results;
    if (!validation) return 0;

    return (
      (validation.syntax?.errors?.length || 0) +
      (validation.links?.errors?.length || 0) +
      (validation.structure?.errors?.length || 0) +
      (validation.freshness?.warnings?.length || 0)
    );
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (!results.success) {
      recommendations.push("- Fix pipeline errors before proceeding");
    }

    const gaps = results.phases.discovery?.results?.gaps || [];
    if (gaps.length > 0) {
      recommendations.push(`- Address ${gaps.length} documentation gaps`);
    }

    const issues = this.countValidationIssues(results);
    if (issues > 0) {
      recommendations.push(`- Fix ${issues} validation issues`);
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "- Documentation is in good shape! Consider regular validation runs."
      );
    }

    return recommendations.join("\n");
  }

  /**
   * Run validation for specific files
   */
  async validateFiles(filePaths) {
    console.log(`🔍 Validating ${filePaths.length} specific files...`);

    const results = [];
    for (const filePath of filePaths) {
      try {
        const result = await this.validator.validateFile(filePath);
        results.push({ file: filePath, ...result });
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Quick validation check
   */
  async quickCheck() {
    console.log("⚡ Running quick documentation check...");

    try {
      const files = await this.analyzer.discoverFiles();
      const criticalFiles = files.filter(
        (f) =>
          f.includes("README") ||
          f.includes("QUICK_START") ||
          f.includes("package.json")
      );

      const results = await this.validateFiles(criticalFiles);
      const issues = results.filter((r) => !r.success || r.errors?.length > 0);

      console.log(
        `✅ Quick check complete: ${issues.length} issues in ${criticalFiles.length} critical files`
      );
      return {
        success: issues.length === 0,
        issues,
        total: criticalFiles.length,
      };
    } catch (error) {
      console.error("❌ Quick check failed:", error.message);
      return { success: false, error: error.message };
    }
  }
}
m;
odule.exports = ValidationPipeline;
