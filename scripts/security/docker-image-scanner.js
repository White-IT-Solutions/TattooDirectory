#!/usr/bin/env node

/**
 * Docker Image Security Scanner
 * Scans Docker images for security vulnerabilities and compliance
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class DockerImageScanner {
  constructor() {
    this.results = {
      scanned: [],
      vulnerabilities: [],
      compliance: [],
      recommendations: [],
    };
  }

  async scanImages() {
    console.log("🔍 Starting Docker image security scan...\n");

    try {
      const images = this.getLocalImages();

      for (const image of images) {
        await this.scanImage(image);
      }

      this.generateReport();
    } catch (error) {
      console.error("❌ Scanner failed:", error.message);
      process.exit(1);
    }
  }

  getLocalImages() {
    try {
      const output = execSync(
        'docker images --format "{{.Repository}}:{{.Tag}}"',
        { encoding: "utf8" }
      );
      const images = output
        .trim()
        .split("\n")
        .filter(
          (img) =>
            img &&
            !img.includes("<none>") &&
            (img.includes("tattoo") || img.includes("local"))
        );

      console.log(`📋 Found ${images.length} relevant images to scan`);
      return images;
    } catch (error) {
      console.warn("⚠️  Could not list Docker images. Is Docker running?");
      return [];
    }
  }

  async scanImage(imageName) {
    console.log(`🔎 Scanning ${imageName}...`);

    const scanResult = {
      image: imageName,
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      compliance: [],
      size: null,
      layers: 0,
    };

    // Basic image inspection
    try {
      const inspectOutput = execSync(`docker inspect ${imageName}`, {
        encoding: "utf8",
      });
      const imageData = JSON.parse(inspectOutput)[0];

      scanResult.size = this.formatBytes(imageData.Size);
      scanResult.layers = imageData.RootFS?.Layers?.length || 0;
      scanResult.created = imageData.Created;
    } catch (error) {
      console.warn(`⚠️  Could not inspect ${imageName}`);
    }

    // Security checks
    this.checkBaseImage(imageName, scanResult);
    this.checkImageSize(scanResult);
    this.checkRunAsRoot(imageName, scanResult);
    this.checkExposedPorts(imageName, scanResult);

    this.results.scanned.push(scanResult);

    console.log(`✅ Completed scan for ${imageName}`);
  }

  checkBaseImage(imageName, scanResult) {
    // Check for secure base images
    const secureBaseImages = [
      "node:alpine",
      "node:slim",
      "distroless",
      "scratch",
    ];

    const isSecureBase = secureBaseImages.some((base) =>
      imageName.toLowerCase().includes(base)
    );

    if (!isSecureBase) {
      scanResult.vulnerabilities.push({
        severity: "MEDIUM",
        type: "BASE_IMAGE",
        description:
          "Consider using Alpine or distroless base images for smaller attack surface",
        recommendation: "Use node:alpine or distroless/nodejs base images",
      });
    }
  }

  checkImageSize(scanResult) {
    // Flag large images
    const sizeBytes = this.parseSize(scanResult.size);
    if (sizeBytes > 500 * 1024 * 1024) {
      // 500MB
      scanResult.compliance.push({
        severity: "LOW",
        type: "IMAGE_SIZE",
        description: `Large image size: ${scanResult.size}`,
        recommendation:
          "Optimize image size using multi-stage builds and .dockerignore",
      });
    }
  }

  checkRunAsRoot(imageName, scanResult) {
    try {
      const output = execSync(`docker run --rm ${imageName} whoami`, {
        encoding: "utf8",
        timeout: 5000,
      });

      if (output.trim() === "root") {
        scanResult.vulnerabilities.push({
          severity: "HIGH",
          type: "ROOT_USER",
          description: "Container runs as root user",
          recommendation: "Create and use a non-root user in Dockerfile",
        });
      }
    } catch (error) {
      // Container might not have whoami or might not start properly
      console.log(`ℹ️  Could not check user for ${imageName}`);
    }
  }

  checkExposedPorts(imageName, scanResult) {
    try {
      const inspectOutput = execSync(`docker inspect ${imageName}`, {
        encoding: "utf8",
      });
      const imageData = JSON.parse(inspectOutput)[0];
      const exposedPorts = imageData.Config?.ExposedPorts || {};

      Object.keys(exposedPorts).forEach((port) => {
        if (port.includes("22/tcp")) {
          scanResult.vulnerabilities.push({
            severity: "HIGH",
            type: "SSH_PORT",
            description: "SSH port (22) is exposed",
            recommendation: "Remove SSH from container images",
          });
        }
      });
    } catch (error) {
      console.log(`ℹ️  Could not check ports for ${imageName}`);
    }
  }

  generateReport() {
    console.log("\n📊 DOCKER SECURITY SCAN REPORT");
    console.log("================================\n");

    const totalVulns = this.results.scanned.reduce(
      (sum, scan) => sum + scan.vulnerabilities.length,
      0
    );

    const totalCompliance = this.results.scanned.reduce(
      (sum, scan) => sum + scan.compliance.length,
      0
    );

    console.log(`📈 Summary:`);
    console.log(`   Images Scanned: ${this.results.scanned.length}`);
    console.log(`   Vulnerabilities: ${totalVulns}`);
    console.log(`   Compliance Issues: ${totalCompliance}\n`);

    // Detailed results
    this.results.scanned.forEach((scan) => {
      console.log(`🐳 ${scan.image}`);
      console.log(`   Size: ${scan.size || "Unknown"}`);
      console.log(`   Layers: ${scan.layers}`);

      if (scan.vulnerabilities.length > 0) {
        console.log(`   🚨 Vulnerabilities (${scan.vulnerabilities.length}):`);
        scan.vulnerabilities.forEach((vuln) => {
          console.log(`      ${vuln.severity}: ${vuln.description}`);
          console.log(`      💡 ${vuln.recommendation}`);
        });
      }

      if (scan.compliance.length > 0) {
        console.log(`   ⚠️  Compliance Issues (${scan.compliance.length}):`);
        scan.compliance.forEach((issue) => {
          console.log(`      ${issue.severity}: ${issue.description}`);
          console.log(`      💡 ${issue.recommendation}`);
        });
      }

      if (scan.vulnerabilities.length === 0 && scan.compliance.length === 0) {
        console.log(`   ✅ No issues found`);
      }

      console.log("");
    });

    // Save report
    this.saveReport();

    // Exit with appropriate code
    if (totalVulns > 0) {
      console.log("❌ Security vulnerabilities found!");
      process.exit(1);
    } else {
      console.log("✅ No critical security issues found");
    }
  }

  saveReport() {
    const reportPath = path.join(
      __dirname,
      "../../.metrics/docker-security-scan.json"
    );
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        imagesScanned: this.results.scanned.length,
        totalVulnerabilities: this.results.scanned.reduce(
          (sum, scan) => sum + scan.vulnerabilities.length,
          0
        ),
        totalComplianceIssues: this.results.scanned.reduce(
          (sum, scan) => sum + scan.compliance.length,
          0
        ),
      },
      results: this.results.scanned,
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.warn("⚠️  Could not save report:", error.message);
    }
  }

  formatBytes(bytes) {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  parseSize(sizeStr) {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers = {
      BYTES: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  }
}

// CLI execution
if (require.main === module) {
  const scanner = new DockerImageScanner();
  scanner.scanImages().catch((error) => {
    console.error("❌ Scanner failed:", error);
    process.exit(1);
  });
}

module.exports = DockerImageScanner;
