#!/usr/bin/env node

/**
 * CI/CD Integration Validation Script
 * Validates CI/CD pipeline configuration and dependencies
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}: ${filePath}`, "green");
  } else {
    log(`❌ Missing ${description}: ${filePath}`, "red");
  }
  return exists;
}

function validatePackageJson() {
  log("\n📦 Validating package.json configuration...", "blue");

  const packagePath = path.join(process.cwd(), "package.json");
  if (!checkFileExists(packagePath, "package.json")) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    // Check required scripts
    const requiredScripts = [
      "build",
      "test",
      "test:e2e",
      "test:visual",
      "lint",
    ];

    let allScriptsPresent = true;
    requiredScripts.forEach((script) => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`✅ Script found: ${script}`, "green");
      } else {
        log(`❌ Missing script: ${script}`, "red");
        allScriptsPresent = false;
      }
    });

    // Check required dependencies
    const requiredDeps = ["@playwright/test", "next", "react", "typescript"];

    requiredDeps.forEach((dep) => {
      const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const inDevDeps =
        packageJson.devDependencies && packageJson.devDependencies[dep];

      if (inDeps || inDevDeps) {
        log(`✅ Dependency found: ${dep}`, "green");
      } else {
        log(`❌ Missing dependency: ${dep}`, "red");
        allScriptsPresent = false;
      }
    });

    return allScriptsPresent;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, "red");
    return false;
  }
}

function validateWorkflowFiles() {
  log("\n🔄 Validating GitHub workflow files...", "blue");

  const workflowDir = path.join(process.cwd(), "..", ".github", "workflows");
  const requiredWorkflows = [
    "ui-ux-audit.yml",
    "baseline-management.yml",
    "artifact-management.yml",
  ];

  let allWorkflowsPresent = true;
  requiredWorkflows.forEach((workflow) => {
    const workflowPath = path.join(workflowDir, workflow);
    if (!checkFileExists(workflowPath, `GitHub workflow: ${workflow}`)) {
      allWorkflowsPresent = false;
    }
  });

  return allWorkflowsPresent;
}

function validateTestConfiguration() {
  log("\n🧪 Validating test configuration...", "blue");

  const configFiles = [
    { path: "playwright.config.ts", description: "Playwright configuration" },
    { path: "tests/e2e", description: "E2E test directory" },
    { path: "config/ci-config.json", description: "CI configuration" },
  ];

  let allConfigsPresent = true;
  configFiles.forEach(({ path: filePath, description }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (!checkFileExists(fullPath, description)) {
      allConfigsPresent = false;
    }
  });

  return allConfigsPresent;
}

function validateEnvironmentVariables() {
  log("\n🌍 Validating environment configuration...", "blue");

  const requiredEnvVars = ["NODE_ENV", "CI"];

  let allEnvVarsSet = true;
  requiredEnvVars.forEach((envVar) => {
    if (process.env[envVar]) {
      log(`✅ Environment variable set: ${envVar}`, "green");
    } else {
      log(`⚠️  Environment variable not set: ${envVar}`, "yellow");
    }
  });

  return allEnvVarsSet;
}

function validateDependencies() {
  log("\n📚 Validating installed dependencies...", "blue");

  try {
    // Check if node_modules exists
    const nodeModulesPath = path.join(process.cwd(), "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
      log("❌ node_modules directory not found. Run npm install first.", "red");
      return false;
    }

    // Try to run basic commands
    try {
      execSync("npm list --depth=0", { stdio: "pipe" });
      log("✅ npm dependencies validated", "green");
    } catch (error) {
      log("⚠️  Some npm dependencies may be missing", "yellow");
    }

    return true;
  } catch (error) {
    log(`❌ Error validating dependencies: ${error.message}`, "red");
    return false;
  }
}

function generateReport(results) {
  log("\n📊 CI/CD Integration Validation Report", "blue");
  log("=".repeat(50), "blue");

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedChecks / totalChecks) * 100);

  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? "✅ PASS" : "❌ FAIL";
    const color = passed ? "green" : "red";
    log(`${status} ${check}`, color);
  });

  log(
    `\nOverall Success Rate: ${successRate}% (${passedChecks}/${totalChecks})`,
    successRate >= 80 ? "green" : "red"
  );

  if (successRate < 100) {
    log("\n🔧 Recommendations:", "yellow");
    if (!results["Package Configuration"]) {
      log("- Run npm install to install missing dependencies", "yellow");
      log("- Add missing scripts to package.json", "yellow");
    }
    if (!results["Workflow Files"]) {
      log(
        "- Ensure GitHub workflow files are present in .github/workflows/",
        "yellow"
      );
    }
    if (!results["Test Configuration"]) {
      log("- Set up Playwright configuration and test directories", "yellow");
    }
  }

  return successRate >= 80;
}

function main() {
  log("🚀 Starting CI/CD Integration Validation...", "blue");

  const results = {
    "Package Configuration": validatePackageJson(),
    "Workflow Files": validateWorkflowFiles(),
    "Test Configuration": validateTestConfiguration(),
    "Environment Variables": validateEnvironmentVariables(),
    Dependencies: validateDependencies(),
  };

  const success = generateReport(results);

  if (success) {
    log("\n🎉 CI/CD integration validation completed successfully!", "green");
    process.exit(0);
  } else {
    log(
      "\n💥 CI/CD integration validation failed. Please address the issues above.",
      "red"
    );
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validateWorkflowFiles,
  validateTestConfiguration,
  validateEnvironmentVariables,
  validateDependencies,
  generateReport,
};
