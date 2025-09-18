#!/usr/bin/env node

/**
 * Cross-Platform Launcher for Tattoo Directory Local Environment
 *
 * This script automatically detects the platform and runs the appropriate
 * startup/shutdown scripts with platform-specific Docker Compose overrides.
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Load environment variables from .env.local
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envContent = fs.readFileSync(filePath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return envVars;
}

// Load environment variables at startup
const envVars = loadEnvFile("devtools/.env.local");
Object.keys(envVars).forEach((key) => {
  if (!process.env[key]) {
    process.env[key] = envVars[key];
  }
});

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Platform detection
const platform = os.platform();
const isWindows = platform === "win32";
const isMacOS = platform === "darwin";
const isLinux = platform === "linux";

// Port configuration to avoid conflicts
const DEFAULT_PORTS = {
  frontend: 3000,
  backend: 9000,
  swagger: 8080,
  localstack: 4566,
};

// Common conflicting ports to check
const COMMON_PORTS = [3000, 8080, 9000, 4566, 5432, 3306, 6379, 27017];

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`[INFO] ${message}`, "blue");
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, "green");
}

function logWarning(message) {
  log(`[WARNING] ${message}`, "yellow");
}

function logError(message) {
  log(`[ERROR] ${message}`, "red");
}

function getPlatformInfo() {
  return {
    platform: platform,
    arch: os.arch(),
    release: os.release(),
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + "GB",
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + "GB",
    cpus: os.cpus().length,
    nodeVersion: process.version,
    isWindows,
    isMacOS,
    isLinux,
  };
}

function checkDockerInstallation() {
  try {
    execSync("docker --version", { stdio: "pipe" });
    execSync("docker-compose --version", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

function checkDockerRunning() {
  try {
    execSync("docker info", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

function checkPortAvailability(port) {
  const net = require("net");
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once("close", () => resolve(true));
      server.close();
    });
    server.on("error", () => resolve(false));
  });
}

async function checkPortConflicts() {
  const conflicts = [];

  for (const port of COMMON_PORTS) {
    const available = await checkPortAvailability(port);
    if (!available) {
      conflicts.push(port);
    }
  }

  return conflicts;
}

function getDockerComposeFiles() {
  const baseFile = "devtools/docker/docker-compose.local.yml";
  const files = [baseFile];

  // Add platform-specific override files
  if (isWindows) {
    files.push("devtools/docker/docker-compose.windows.yml");
  } else if (isMacOS) {
    files.push("devtools/docker/docker-compose.macos.yml");
  } else if (isLinux) {
    files.push("devtools/docker/docker-compose.linux.yml");
  }

  // Only include files that exist
  return files.filter(file => fs.existsSync(file));
}

function buildDockerComposeCommand(action, additionalArgs = []) {
  const files = getDockerComposeFiles();
  const fileArgs = files.flatMap((file) => ["-f", file]);

  return ["docker-compose", ...fileArgs, action, ...additionalArgs];
}

function executeCommand(command, args = [], options = {}) {
  const fullCommand = `${command} ${args.join(" ")}`;
  logInfo(`Executing: ${fullCommand}`);

  try {
    const result = execSync(fullCommand, {
      stdio: "inherit",
      encoding: "utf8",
      env: { ...process.env, ...envVars },
      ...options,
    });
    return { success: true, result };
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    return { success: false, error };
  }
}

async function startEnvironment() {
  log("🚀 Starting Tattoo Directory Local Environment...", "bright");
  log("==================================================", "bright");

  // Platform info
  const platformInfo = getPlatformInfo();
  logInfo(`Platform: ${platformInfo.platform} (${platformInfo.arch})`);
  logInfo(
    `Memory: ${platformInfo.freeMemory} free of ${platformInfo.totalMemory}`
  );
  logInfo(`CPUs: ${platformInfo.cpus}`);

  // Check Docker
  if (!checkDockerInstallation()) {
    logError("Docker or Docker Compose is not installed");
    process.exit(1);
  }

  if (!checkDockerRunning()) {
    logError(
      "Docker is not running. Please start Docker Desktop and try again."
    );
    process.exit(1);
  }

  logSuccess("Docker is running");

  // Check port conflicts
  logInfo("Checking for port conflicts...");
  const conflicts = await checkPortConflicts();
  if (conflicts.length > 0) {
    logWarning(`Ports in use: ${conflicts.join(", ")}`);
    logWarning("Some services may fail to start due to port conflicts");
  }

  // Check required files
  const requiredFiles = getDockerComposeFiles();
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      logError(`Required file not found: ${file}`);
      process.exit(1);
    }
  }

  // Clean up existing containers
  logInfo("Cleaning up existing containers...");
  const cleanupCmd = buildDockerComposeCommand("down", ["--remove-orphans"]);
  executeCommand(cleanupCmd[0], cleanupCmd.slice(1));

  // Pull latest images
  logInfo("Pulling latest Docker images...");
  const pullCmd = buildDockerComposeCommand("pull");
  executeCommand(pullCmd[0], pullCmd.slice(1));

  // Start services
  logInfo("Starting containers...");
  const startCmd = buildDockerComposeCommand("up", ["-d"]);
  const startResult = executeCommand(startCmd[0], startCmd.slice(1));

  if (!startResult.success) {
    logError("Failed to start containers");
    process.exit(1);
  }

  // Wait for services
  logInfo("Waiting for services to initialize...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Health check
  logInfo("Checking service health...");
  executeCommand("node", ["scripts/health-check.js"]);

  // Success message
  log("", "reset");
  logSuccess("Local environment is ready!");
  log("==================================================", "bright");
  log("🌐 Frontend:     http://localhost:3000", "cyan");
  log("📚 API Docs:     http://localhost:8080", "cyan");
  log("🔧 Backend API:  http://localhost:9000", "cyan");
  log("☁️  LocalStack:   http://localhost:4566", "cyan");
  log("📊 LocalStack UI: http://localhost:4566/_localstack/cockpit", "cyan");
  log("", "reset");
  log("📝 Useful commands:", "bright");
  log("   npm run local:logs    - View all service logs");
  log("   npm run local:stop    - Stop all services");
  log("   npm run local:restart - Restart environment");
  log("   npm run local:status  - Check service status");
}

async function stopEnvironment(options = {}) {
  log("🛑 Stopping Tattoo Directory Local Environment...", "bright");
  log("=================================================", "bright");

  if (!checkDockerRunning()) {
    logWarning("Docker is not running. Nothing to stop.");
    return;
  }

  // Show current containers
  logInfo("Current running containers:");
  const statusCmd = buildDockerComposeCommand("ps");
  executeCommand(statusCmd[0], statusCmd.slice(1));

  // Stop containers
  const stopArgs = [];
  if (options.force) {
    logInfo("Force stopping containers...");
    const killCmd = buildDockerComposeCommand("kill");
    executeCommand(killCmd[0], killCmd.slice(1));
  } else {
    logInfo("Gracefully stopping containers...");
    const stopCmd = buildDockerComposeCommand("stop");
    executeCommand(stopCmd[0], stopCmd.slice(1));
  }

  // Remove containers
  const downArgs = ["--remove-orphans"];
  if (options.volumes) {
    logWarning("Removing volumes (this will delete all data)...");
    downArgs.push("--volumes");
  }
  if (options.images) {
    logInfo("Removing Docker images...");
    downArgs.push("--rmi", "all");
  }

  const downCmd = buildDockerComposeCommand("down", downArgs);
  executeCommand(downCmd[0], downCmd.slice(1));

  // Clean up
  logInfo("Cleaning up dangling resources...");
  executeCommand("docker", ["system", "prune", "-f"]);

  logSuccess("Local environment stopped successfully!");

  if (options.volumes) {
    logWarning(
      "All data has been removed. Next startup will create fresh data."
    );
  }
  if (options.images) {
    logWarning(
      "Images have been removed. Next startup will rebuild containers."
    );
  }
}

function showPlatformInfo() {
  const info = getPlatformInfo();

  log("🖥️  Platform Information", "bright");
  log("========================", "bright");
  log(`Platform: ${info.platform}`, "cyan");
  log(`Architecture: ${info.arch}`, "cyan");
  log(`OS Release: ${info.release}`, "cyan");
  log(`Total Memory: ${info.totalMemory}`, "cyan");
  log(`Free Memory: ${info.freeMemory}`, "cyan");
  log(`CPU Cores: ${info.cpus}`, "cyan");
  log(`Node.js Version: ${info.nodeVersion}`, "cyan");
  log("", "reset");

  // Docker Compose files that would be used
  const files = getDockerComposeFiles();
  log("📁 Docker Compose Files:", "bright");
  files.forEach((file) => {
    const exists = fs.existsSync(file);
    const status = exists ? "✅" : "❌";
    log(`   ${status} ${file}`, exists ? "green" : "red");
  });
}

async function showDockerInfo() {
  log("🐳 Docker Information", "bright");
  log("=====================", "bright");

  if (!checkDockerInstallation()) {
    logError("Docker is not installed");
    return;
  }

  try {
    // Docker version
    const dockerVersion = execSync("docker --version", {
      encoding: "utf8",
    }).trim();
    log(`Docker: ${dockerVersion}`, "cyan");

    const composeVersion = execSync("docker-compose --version", {
      encoding: "utf8",
    }).trim();
    log(`Docker Compose: ${composeVersion}`, "cyan");

    if (checkDockerRunning()) {
      // Docker system info
      const systemInfo = execSync("docker system df", { encoding: "utf8" });
      log("", "reset");
      log("📊 Docker System Usage:", "bright");
      log(systemInfo);

      // Running containers
      const containers = execSync(
        'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        { encoding: "utf8" }
      );
      log("🏃 Running Containers:", "bright");
      log(containers);
    } else {
      logWarning("Docker is not running");
    }
  } catch (error) {
    logError(`Failed to get Docker info: ${error.message}`);
  }
}

// Main command handler
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "start":
      await startEnvironment();
      break;

    case "stop":
      const stopOptions = {
        force: args.includes("--force") || args.includes("-f"),
        volumes: args.includes("--volumes") || args.includes("-v"),
        images: args.includes("--images") || args.includes("-i"),
      };
      await stopEnvironment(stopOptions);
      break;

    case "clean":
      await stopEnvironment({ volumes: true });
      break;

    case "info":
      showPlatformInfo();
      break;

    case "docker-info":
      await showDockerInfo();
      break;

    default:
      log("🎯 Tattoo Directory Platform Launcher", "bright");
      log("=====================================", "bright");
      log("");
      log("Usage: node platform-launcher.js <command> [options]");
      log("");
      log("Commands:", "bright");
      log("  start              Start the local environment");
      log("  stop [options]     Stop the local environment");
      log("  clean              Stop and remove all data");
      log("  info               Show platform information");
      log("  docker-info        Show Docker information");
      log("");
      log("Stop Options:", "bright");
      log("  --force, -f        Force stop containers");
      log("  --volumes, -v      Remove volumes (deletes data)");
      log("  --images, -i       Remove images (forces rebuild)");
      log("");
      log("Examples:", "bright");
      log("  npm run local:start");
      log("  npm run local:stop");
      log("  node scripts/platform-launcher.js stop --volumes");
      break;
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  getPlatformInfo,
  checkDockerInstallation,
  checkDockerRunning,
  getDockerComposeFiles,
  startEnvironment,
  stopEnvironment,
};
