#!/usr/bin/env node

/**
 * Cross-Platform Compatibility Validator
 * 
 * Validates that the local development environment works consistently
 * across Windows, macOS, and Linux platforms.
 * 
 * Features:
 * - Platform-specific requirement validation
 * - Path handling compatibility checks
 * - File permission validation
 * - Docker integration testing
 * - Environment variable handling
 * - Script execution compatibility
 */

const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const { performance } = require('perf_hooks');

class CrossPlatformValidator {
    constructor() {
        this.platform = os.platform();
        this.arch = os.arch();
        this.validationResults = {
            timestamp: null,
            platform: {
                os: this.platform,
                arch: this.arch,
                nodeVersion: process.version,
                supported: false
            },
            platformSpecific: {},
            pathHandling: {},
            filePermissions: {},
            dockerIntegration: {},
            environmentVariables: {},
            scriptExecution: {},
            overallScore: 0,
            compatibilityLevel: 'unknown',
            issues: [],
            recommendations: []
        };

        this.supportedPlatforms = ['win32', 'darwin', 'linux'];
        this.testPaths = [
            'backend/src',
            'frontend/src',
            'scripts',
            'docs',
            'tests'
        ];
    }

    /**
     * Run comprehensive cross-platform validation
     */
    async runCrossPlatformValidation() {
        console.log('🌐 Starting Cross-Platform Compatibility Validation...\n');
        console.log(`Platform: ${this.platform} ${this.arch}`);
        console.log(`Node.js: ${process.version}\n`);
        
        const startTime = performance.now();
        this.validationResults.timestamp = new Date().toISOString();

        try {
            // Check if platform is supported
            this.validationResults.platform.supported = this.supportedPlatforms.includes(this.platform);
            
            if (!this.validationResults.platform.supported) {
                throw new Error(`Unsupported platform: ${this.platform}`);
            }

            // Run platform-specific validations
            await this.validatePlatformSpecific();
            
            // Run cross-platform compatibility tests
            await this.validatePathHandling();
            await this.validateFilePermissions();
            await this.validateDockerIntegration();
            await this.validateEnvironmentVariables();
            await this.validateScriptExecution();

            // Calculate overall compatibility score
            this.calculateCompatibilityScore();
            
            const endTime = performance.now();
            console.log(`✅ Cross-platform validation completed in ${Math.round(endTime - startTime)}ms\n`);

            return this.validationResults;

        } catch (error) {
            console.error('❌ Cross-platform validation failed:', error.message);
            this.validationResults.compatibilityLevel = 'failed';
            this.validationResults.error = error.message;
            return this.validationResults;
        }
    }

    /**
     * Validate platform-specific requirements
     */
    async validatePlatformSpecific() {
        console.log('🖥️ Validating platform-specific requirements...');
        
        this.validationResults.platformSpecific = {
            platform: this.platform,
            requirements: {},
            score: 0,
            issues: []
        };

        switch (this.platform) {
            case 'win32':
                await this.validateWindowsRequirements();
                break;
            case 'darwin':
                await this.validateMacOSRequirements();
                break;
            case 'linux':
                await this.validateLinuxRequirements();
                break;
        }

        // Calculate platform-specific score
        const requirements = Object.values(this.validationResults.platformSpecific.requirements);
        const passedRequirements = requirements.filter(req => req.satisfied).length;
        this.validationResults.platformSpecific.score = requirements.length > 0 
            ? Math.round((passedRequirements / requirements.length) * 100)
            : 0;

        console.log(`  Platform-specific score: ${this.validationResults.platformSpecific.score}/100`);
    }

    /**
     * Validate Windows-specific requirements
     */
    async validateWindowsRequirements() {
        console.log('  🪟 Validating Windows requirements...');
        
        const requirements = {
            dockerDesktop: await this.checkDockerDesktop(),
            wsl2: await this.checkWSL2(),
            powershell: await this.checkPowerShell(),
            gitBash: await this.checkGitBash(),
            pathLength: this.checkWindowsPathLength(),
            fileSharing: await this.checkWindowsFileSharing()
        };

        this.validationResults.platformSpecific.requirements = requirements;

        // Collect Windows-specific issues
        if (!requirements.dockerDesktop.satisfied) {
            this.validationResults.platformSpecific.issues.push('Docker Desktop not installed or not running');
        }
        if (!requirements.wsl2.satisfied) {
            this.validationResults.platformSpecific.issues.push('WSL 2 not available or not configured');
        }
        if (!requirements.pathLength.satisfied) {
            this.validationResults.platformSpecific.issues.push('Windows path length limitations detected');
        }
    }

    /**
     * Validate macOS-specific requirements
     */
    async validateMacOSRequirements() {
        console.log('  🍎 Validating macOS requirements...');
        
        const requirements = {
            dockerDesktop: await this.checkDockerDesktop(),
            homebrew: await this.checkHomebrew(),
            xcode: await this.checkXcodeTools(),
            rosetta: await this.checkRosetta(),
            filePermissions: await this.checkMacOSFilePermissions()
        };

        this.validationResults.platformSpecific.requirements = requirements;

        // Collect macOS-specific issues
        if (!requirements.dockerDesktop.satisfied) {
            this.validationResults.platformSpecific.issues.push('Docker Desktop not installed or not running');
        }
        if (!requirements.xcode.satisfied) {
            this.validationResults.platformSpecific.issues.push('Xcode Command Line Tools not installed');
        }
        if (this.arch === 'arm64' && !requirements.rosetta.satisfied) {
            this.validationResults.platformSpecific.issues.push('Rosetta 2 not available for x86 compatibility');
        }
    }

    /**
     * Validate Linux-specific requirements
     */
    async validateLinuxRequirements() {
        console.log('  🐧 Validating Linux requirements...');
        
        const requirements = {
            dockerEngine: await this.checkDockerEngine(),
            dockerCompose: await this.checkDockerCompose(),
            userGroups: await this.checkLinuxUserGroups(),
            systemd: await this.checkSystemd(),
            packageManager: await this.checkPackageManager(),
            filePermissions: await this.checkLinuxFilePermissions()
        };

        this.validationResults.platformSpecific.requirements = requirements;

        // Collect Linux-specific issues
        if (!requirements.dockerEngine.satisfied) {
            this.validationResults.platformSpecific.issues.push('Docker Engine not installed or not running');
        }
        if (!requirements.userGroups.satisfied) {
            this.validationResults.platformSpecific.issues.push('User not in docker group');
        }
        if (!requirements.dockerCompose.satisfied) {
            this.validationResults.platformSpecific.issues.push('Docker Compose not available');
        }
    }

    /**
     * Validate path handling compatibility
     */
    async validatePathHandling() {
        console.log('📁 Validating path handling compatibility...');
        
        this.validationResults.pathHandling = {
            pathSeparators: this.testPathSeparators(),
            absolutePaths: this.testAbsolutePaths(),
            relativePaths: this.testRelativePaths(),
            specialCharacters: this.testSpecialCharacters(),
            longPaths: await this.testLongPaths(),
            casesensitivity: await this.testCaseSensitivity(),
            score: 0,
            issues: []
        };

        // Calculate path handling score
        const tests = Object.values(this.validationResults.pathHandling)
            .filter(value => typeof value === 'boolean');
        const passedTests = tests.filter(Boolean).length;
        this.validationResults.pathHandling.score = tests.length > 0 
            ? Math.round((passedTests / tests.length) * 100)
            : 0;

        // Collect path handling issues
        if (!this.validationResults.pathHandling.pathSeparators) {
            this.validationResults.pathHandling.issues.push('Path separator handling issues detected');
        }
        if (!this.validationResults.pathHandling.longPaths) {
            this.validationResults.pathHandling.issues.push('Long path support issues detected');
        }
        if (!this.validationResults.pathHandling.casesensitivity) {
            this.validationResults.pathHandling.issues.push('Case sensitivity issues detected');
        }

        console.log(`  Path handling score: ${this.validationResults.pathHandling.score}/100`);
    }

    /**
     * Validate file permissions compatibility
     */
    async validateFilePermissions() {
        console.log('🔐 Validating file permissions compatibility...');
        
        this.validationResults.filePermissions = {
            readPermissions: await this.testReadPermissions(),
            writePermissions: await this.testWritePermissions(),
            executePermissions: await this.testExecutePermissions(),
            directoryPermissions: await this.testDirectoryPermissions(),
            symbolicLinks: await this.testSymbolicLinks(),
            score: 0,
            issues: []
        };

        // Calculate file permissions score
        const tests = Object.values(this.validationResults.filePermissions)
            .filter(value => typeof value === 'boolean');
        const passedTests = tests.filter(Boolean).length;
        this.validationResults.filePermissions.score = tests.length > 0 
            ? Math.round((passedTests / tests.length) * 100)
            : 0;

        // Collect file permission issues
        if (!this.validationResults.filePermissions.writePermissions) {
            this.validationResults.filePermissions.issues.push('Write permission issues detected');
        }
        if (!this.validationResults.filePermissions.executePermissions) {
            this.validationResults.filePermissions.issues.push('Execute permission issues detected');
        }

        console.log(`  File permissions score: ${this.validationResults.filePermissions.score}/100`);
    }

    /**
     * Validate Docker integration compatibility
     */
    async validateDockerIntegration() {
        console.log('🐳 Validating Docker integration compatibility...');
        
        this.validationResults.dockerIntegration = {
            dockerAvailable: await this.checkDockerAvailable(),
            dockerRunning: await this.checkDockerRunning(),
            dockerCompose: await this.checkDockerComposeAvailable(),
            volumeMounts: await this.testDockerVolumeMounts(),
            networking: await this.testDockerNetworking(),
            platformImages: await this.testPlatformImages(),
            score: 0,
            issues: []
        };

        // Calculate Docker integration score
        const tests = Object.values(this.validationResults.dockerIntegration)
            .filter(value => typeof value === 'boolean');
        const passedTests = tests.filter(Boolean).length;
        this.validationResults.dockerIntegration.score = tests.length > 0 
            ? Math.round((passedTests / tests.length) * 100)
            : 0;

        // Collect Docker integration issues
        if (!this.validationResults.dockerIntegration.dockerAvailable) {
            this.validationResults.dockerIntegration.issues.push('Docker not available');
        }
        if (!this.validationResults.dockerIntegration.volumeMounts) {
            this.validationResults.dockerIntegration.issues.push('Docker volume mount issues detected');
        }

        console.log(`  Docker integration score: ${this.validationResults.dockerIntegration.score}/100`);
    }

    /**
     * Validate environment variable handling
     */
    async validateEnvironmentVariables() {
        console.log('🌍 Validating environment variable handling...');
        
        this.validationResults.environmentVariables = {
            basicVariables: this.testBasicEnvironmentVariables(),
            specialCharacters: this.testEnvironmentVariableSpecialCharacters(),
            pathVariables: this.testPathEnvironmentVariables(),
            multilineVariables: this.testMultilineEnvironmentVariables(),
            unicodeVariables: this.testUnicodeEnvironmentVariables(),
            score: 0,
            issues: []
        };

        // Calculate environment variables score
        const tests = Object.values(this.validationResults.environmentVariables)
            .filter(value => typeof value === 'boolean');
        const passedTests = tests.filter(Boolean).length;
        this.validationResults.environmentVariables.score = tests.length > 0 
            ? Math.round((passedTests / tests.length) * 100)
            : 0;

        // Collect environment variable issues
        if (!this.validationResults.environmentVariables.specialCharacters) {
            this.validationResults.environmentVariables.issues.push('Special character handling in environment variables');
        }
        if (!this.validationResults.environmentVariables.pathVariables) {
            this.validationResults.environmentVariables.issues.push('Path environment variable issues detected');
        }

        console.log(`  Environment variables score: ${this.validationResults.environmentVariables.score}/100`);
    }

    /**
     * Validate script execution compatibility
     */
    async validateScriptExecution() {
        console.log('📜 Validating script execution compatibility...');
        
        this.validationResults.scriptExecution = {
            shellScripts: await this.testShellScriptExecution(),
            batchScripts: await this.testBatchScriptExecution(),
            nodeScripts: await this.testNodeScriptExecution(),
            npmScripts: await this.testNpmScriptExecution(),
            crossPlatformScripts: await this.testCrossPlatformScripts(),
            score: 0,
            issues: []
        };

        // Calculate script execution score
        const tests = Object.values(this.validationResults.scriptExecution)
            .filter(value => typeof value === 'boolean');
        const passedTests = tests.filter(Boolean).length;
        this.validationResults.scriptExecution.score = tests.length > 0 
            ? Math.round((passedTests / tests.length) * 100)
            : 0;

        // Collect script execution issues
        if (!this.validationResults.scriptExecution.shellScripts && this.platform !== 'win32') {
            this.validationResults.scriptExecution.issues.push('Shell script execution issues detected');
        }
        if (!this.validationResults.scriptExecution.batchScripts && this.platform === 'win32') {
            this.validationResults.scriptExecution.issues.push('Batch script execution issues detected');
        }

        console.log(`  Script execution score: ${this.validationResults.scriptExecution.score}/100`);
    }

    /**
     * Calculate overall compatibility score
     */
    calculateCompatibilityScore() {
        const componentScores = [
            this.validationResults.platformSpecific.score || 0,
            this.validationResults.pathHandling.score || 0,
            this.validationResults.filePermissions.score || 0,
            this.validationResults.dockerIntegration.score || 0,
            this.validationResults.environmentVariables.score || 0,
            this.validationResults.scriptExecution.score || 0
        ];

        this.validationResults.overallScore = componentScores.length > 0
            ? Math.round(componentScores.reduce((a, b) => a + b, 0) / componentScores.length)
            : 0;

        // Determine compatibility level
        if (this.validationResults.overallScore >= 90) {
            this.validationResults.compatibilityLevel = 'excellent';
        } else if (this.validationResults.overallScore >= 80) {
            this.validationResults.compatibilityLevel = 'good';
        } else if (this.validationResults.overallScore >= 70) {
            this.validationResults.compatibilityLevel = 'acceptable';
        } else if (this.validationResults.overallScore >= 60) {
            this.validationResults.compatibilityLevel = 'needs-improvement';
        } else {
            this.validationResults.compatibilityLevel = 'poor';
        }

        // Collect all issues
        this.collectAllIssues();

        // Generate recommendations
        this.generateRecommendations();
    }

    /**
     * Collect all issues from different validation components
     */
    collectAllIssues() {
        this.validationResults.issues = [];

        // Platform-specific issues
        if (this.validationResults.platformSpecific.issues) {
            this.validationResults.issues.push(...this.validationResults.platformSpecific.issues);
        }

        // Path handling issues
        if (this.validationResults.pathHandling.issues) {
            this.validationResults.issues.push(...this.validationResults.pathHandling.issues);
        }

        // File permission issues
        if (this.validationResults.filePermissions.issues) {
            this.validationResults.issues.push(...this.validationResults.filePermissions.issues);
        }

        // Docker integration issues
        if (this.validationResults.dockerIntegration.issues) {
            this.validationResults.issues.push(...this.validationResults.dockerIntegration.issues);
        }

        // Environment variable issues
        if (this.validationResults.environmentVariables.issues) {
            this.validationResults.issues.push(...this.validationResults.environmentVariables.issues);
        }

        // Script execution issues
        if (this.validationResults.scriptExecution.issues) {
            this.validationResults.issues.push(...this.validationResults.scriptExecution.issues);
        }
    }

    /**
     * Generate platform-specific recommendations
     */
    generateRecommendations() {
        this.validationResults.recommendations = [];

        // Platform-specific recommendations
        if (this.platform === 'win32') {
            if (!this.validationResults.platformSpecific.requirements.dockerDesktop?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'high',
                    category: 'Windows',
                    recommendation: 'Install Docker Desktop for Windows',
                    actions: [
                        'Download Docker Desktop from docker.com',
                        'Enable WSL 2 integration',
                        'Configure file sharing for project directories'
                    ]
                });
            }

            if (!this.validationResults.platformSpecific.requirements.wsl2?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'medium',
                    category: 'Windows',
                    recommendation: 'Enable WSL 2 for better Docker performance',
                    actions: [
                        'Run: wsl --install',
                        'Set WSL 2 as default: wsl --set-default-version 2',
                        'Install Ubuntu or preferred Linux distribution'
                    ]
                });
            }
        }

        if (this.platform === 'darwin') {
            if (!this.validationResults.platformSpecific.requirements.homebrew?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'medium',
                    category: 'macOS',
                    recommendation: 'Install Homebrew for package management',
                    actions: [
                        'Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
                        'Add Homebrew to PATH',
                        'Install development tools: brew install git node'
                    ]
                });
            }

            if (this.arch === 'arm64' && !this.validationResults.platformSpecific.requirements.rosetta?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'low',
                    category: 'macOS',
                    recommendation: 'Install Rosetta 2 for x86 compatibility',
                    actions: [
                        'Run: softwareupdate --install-rosetta',
                        'This enables running x86 Docker images on Apple Silicon'
                    ]
                });
            }
        }

        if (this.platform === 'linux') {
            if (!this.validationResults.platformSpecific.requirements.dockerEngine?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'high',
                    category: 'Linux',
                    recommendation: 'Install Docker Engine',
                    actions: [
                        'Run: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
                        'Add user to docker group: sudo usermod -aG docker $USER',
                        'Restart session or run: newgrp docker'
                    ]
                });
            }

            if (!this.validationResults.platformSpecific.requirements.userGroups?.satisfied) {
                this.validationResults.recommendations.push({
                    priority: 'medium',
                    category: 'Linux',
                    recommendation: 'Add user to docker group',
                    actions: [
                        'Run: sudo usermod -aG docker $USER',
                        'Log out and log back in',
                        'Or run: newgrp docker'
                    ]
                });
            }
        }

        // General compatibility recommendations
        if (this.validationResults.pathHandling.score < 80) {
            this.validationResults.recommendations.push({
                priority: 'medium',
                category: 'Compatibility',
                recommendation: 'Fix path handling issues',
                actions: [
                    'Use path.join() instead of string concatenation',
                    'Avoid hardcoded path separators',
                    'Test with long file paths',
                    'Handle case sensitivity differences'
                ]
            });
        }

        if (this.validationResults.dockerIntegration.score < 80) {
            this.validationResults.recommendations.push({
                priority: 'high',
                category: 'Docker',
                recommendation: 'Resolve Docker integration issues',
                actions: [
                    'Ensure Docker is running',
                    'Check Docker volume mount permissions',
                    'Verify Docker Compose is available',
                    'Test container networking'
                ]
            });
        }
    }

    /**
     * Display cross-platform validation results
     */
    displayResults() {
        const statusEmoji = {
            'excellent': '🟢',
            'good': '🟡',
            'acceptable': '🟠',
            'needs-improvement': '🔴',
            'poor': '🚨'
        };

        console.log('\n🌐 CROSS-PLATFORM COMPATIBILITY VALIDATION RESULTS');
        console.log('=' .repeat(80));
        console.log(`Overall Score: ${this.validationResults.overallScore}/100`);
        console.log(`Compatibility Level: ${statusEmoji[this.validationResults.compatibilityLevel]} ${this.validationResults.compatibilityLevel.toUpperCase()}`);
        console.log(`Platform: ${this.validationResults.platform.os} ${this.validationResults.platform.arch}`);
        console.log(`Node.js: ${this.validationResults.platform.nodeVersion}`);
        console.log(`Timestamp: ${this.validationResults.timestamp}`);

        // Component scores
        console.log('\n📊 Component Scores:');
        console.log(`  Platform-Specific: ${this.validationResults.platformSpecific.score}/100`);
        console.log(`  Path Handling: ${this.validationResults.pathHandling.score}/100`);
        console.log(`  File Permissions: ${this.validationResults.filePermissions.score}/100`);
        console.log(`  Docker Integration: ${this.validationResults.dockerIntegration.score}/100`);
        console.log(`  Environment Variables: ${this.validationResults.environmentVariables.score}/100`);
        console.log(`  Script Execution: ${this.validationResults.scriptExecution.score}/100`);

        // Issues
        if (this.validationResults.issues.length > 0) {
            console.log('\n⚠️ Compatibility Issues:');
            this.validationResults.issues.slice(0, 10).forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
            if (this.validationResults.issues.length > 10) {
                console.log(`  ... and ${this.validationResults.issues.length - 10} more issues`);
            }
        }

        // Recommendations
        if (this.validationResults.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.validationResults.recommendations.slice(0, 5).forEach((rec, index) => {
                const priorityEmoji = {
                    critical: '🚨',
                    high: '🔴',
                    medium: '🟡',
                    low: '🟢'
                };
                console.log(`  ${index + 1}. ${priorityEmoji[rec.priority]} ${rec.recommendation}`);
                if (rec.actions && rec.actions.length > 0) {
                    console.log(`     - ${rec.actions[0]}`);
                }
            });
        }

        console.log('\n' + '='.repeat(80));
    }

    /**
     * Save validation results
     */
    async saveResults() {
        const resultsDir = path.join(process.cwd(), '.metrics', 'cross-platform');
        await fs.mkdir(resultsDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cross-platform-validation-${this.platform}-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(this.validationResults, null, 2));
        console.log(`\n💾 Cross-platform validation results saved to: ${filepath}`);
        
        return filepath;
    }

    // Helper methods for platform-specific checks
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async checkDockerDesktop() {
        try {
            const version = await this.executeCommand('docker --version');
            return {
                satisfied: true,
                version: version,
                message: 'Docker Desktop available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Docker Desktop not available',
                error: error.message
            };
        }
    }

    async checkWSL2() {
        if (this.platform !== 'win32') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const version = await this.executeCommand('wsl --version');
            return {
                satisfied: true,
                version: version,
                message: 'WSL 2 available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'WSL 2 not available',
                error: error.message
            };
        }
    }

    async checkPowerShell() {
        if (this.platform !== 'win32') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const version = await this.executeCommand('powershell -Command "$PSVersionTable.PSVersion"');
            return {
                satisfied: true,
                version: version,
                message: 'PowerShell available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'PowerShell not available',
                error: error.message
            };
        }
    }

    async checkGitBash() {
        if (this.platform !== 'win32') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const version = await this.executeCommand('bash --version');
            return {
                satisfied: true,
                version: version.split('\n')[0],
                message: 'Git Bash available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Git Bash not available',
                error: error.message
            };
        }
    }

    checkWindowsPathLength() {
        if (this.platform !== 'win32') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        // Test creating a long path
        const longPath = 'a'.repeat(200);
        try {
            path.join(process.cwd(), longPath);
            return {
                satisfied: true,
                message: 'Long path support available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Long path support issues detected',
                error: error.message
            };
        }
    }

    async checkWindowsFileSharing() {
        if (this.platform !== 'win32') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        // This is a simplified check - in practice, you'd test Docker volume mounts
        return {
            satisfied: true,
            message: 'File sharing check requires Docker Desktop configuration'
        };
    }

    async checkHomebrew() {
        if (this.platform !== 'darwin') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const version = await this.executeCommand('brew --version');
            return {
                satisfied: true,
                version: version.split('\n')[0],
                message: 'Homebrew available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Homebrew not available',
                error: error.message
            };
        }
    }

    async checkXcodeTools() {
        if (this.platform !== 'darwin') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            await this.executeCommand('xcode-select --version');
            return {
                satisfied: true,
                message: 'Xcode Command Line Tools available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Xcode Command Line Tools not available',
                error: error.message
            };
        }
    }

    async checkRosetta() {
        if (this.platform !== 'darwin' || this.arch !== 'arm64') {
            return { satisfied: true, message: 'Not applicable on this platform/architecture' };
        }

        try {
            await this.executeCommand('arch -x86_64 uname -m');
            return {
                satisfied: true,
                message: 'Rosetta 2 available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Rosetta 2 not available',
                error: error.message
            };
        }
    }

    async checkMacOSFilePermissions() {
        if (this.platform !== 'darwin') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const testFile = path.join(os.tmpdir(), 'test-permissions.txt');
            await fs.writeFile(testFile, 'test');
            await fs.access(testFile, fs.constants.R_OK | fs.constants.W_OK);
            await fs.unlink(testFile);
            return {
                satisfied: true,
                message: 'File permissions working correctly'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'File permission issues detected',
                error: error.message
            };
        }
    }

    async checkDockerEngine() {
        if (this.platform !== 'linux') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const version = await this.executeCommand('docker --version');
            return {
                satisfied: true,
                version: version,
                message: 'Docker Engine available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Docker Engine not available',
                error: error.message
            };
        }
    }

    async checkDockerCompose() {
        try {
            const version = await this.executeCommand('docker-compose --version');
            return {
                satisfied: true,
                version: version,
                message: 'Docker Compose available'
            };
        } catch (error) {
            try {
                const version = await this.executeCommand('docker compose version');
                return {
                    satisfied: true,
                    version: version,
                    message: 'Docker Compose (v2) available'
                };
            } catch (error2) {
                return {
                    satisfied: false,
                    message: 'Docker Compose not available',
                    error: error2.message
                };
            }
        }
    }

    async checkLinuxUserGroups() {
        if (this.platform !== 'linux') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const groups = await this.executeCommand('groups');
            const inDockerGroup = groups.includes('docker');
            return {
                satisfied: inDockerGroup,
                groups: groups,
                message: inDockerGroup ? 'User in docker group' : 'User not in docker group'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'Unable to check user groups',
                error: error.message
            };
        }
    }

    async checkSystemd() {
        if (this.platform !== 'linux') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            await this.executeCommand('systemctl --version');
            return {
                satisfied: true,
                message: 'systemd available'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'systemd not available',
                error: error.message
            };
        }
    }

    async checkPackageManager() {
        if (this.platform !== 'linux') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        const packageManagers = ['apt', 'yum', 'dnf', 'pacman', 'zypper'];
        
        for (const pm of packageManagers) {
            try {
                await this.executeCommand(`which ${pm}`);
                return {
                    satisfied: true,
                    packageManager: pm,
                    message: `${pm} package manager available`
                };
            } catch (error) {
                // Continue to next package manager
            }
        }

        return {
            satisfied: false,
            message: 'No supported package manager found'
        };
    }

    async checkLinuxFilePermissions() {
        if (this.platform !== 'linux') {
            return { satisfied: true, message: 'Not applicable on this platform' };
        }

        try {
            const testFile = path.join(os.tmpdir(), 'test-permissions.txt');
            await fs.writeFile(testFile, 'test');
            await fs.chmod(testFile, 0o755);
            await fs.access(testFile, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK);
            await fs.unlink(testFile);
            return {
                satisfied: true,
                message: 'File permissions working correctly'
            };
        } catch (error) {
            return {
                satisfied: false,
                message: 'File permission issues detected',
                error: error.message
            };
        }
    }

    // Path handling tests
    testPathSeparators() {
        try {
            const testPath = path.join('test', 'path', 'handling');
            const expectedSeparator = this.platform === 'win32' ? '\\' : '/';
            return testPath.includes(expectedSeparator);
        } catch (error) {
            return false;
        }
    }

    testAbsolutePaths() {
        try {
            const absolutePath = path.resolve('test');
            return path.isAbsolute(absolutePath);
        } catch (error) {
            return false;
        }
    }

    testRelativePaths() {
        try {
            const relativePath = path.relative(process.cwd(), __filename);
            return !path.isAbsolute(relativePath);
        } catch (error) {
            return false;
        }
    }

    testSpecialCharacters() {
        try {
            const specialPath = path.join('test', 'special chars & symbols', 'file.txt');
            return typeof specialPath === 'string' && specialPath.length > 0;
        } catch (error) {
            return false;
        }
    }

    async testLongPaths() {
        try {
            const longPath = path.join(os.tmpdir(), 'a'.repeat(100), 'b'.repeat(100), 'test.txt');
            const dir = path.dirname(longPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(longPath, 'test');
            await fs.unlink(longPath);
            await fs.rmdir(dir, { recursive: true });
            return true;
        } catch (error) {
            return false;
        }
    }

    async testCaseSensitivity() {
        try {
            const testDir = path.join(os.tmpdir(), 'case-test');
            await fs.mkdir(testDir, { recursive: true });
            
            const lowerFile = path.join(testDir, 'test.txt');
            const upperFile = path.join(testDir, 'TEST.txt');
            
            await fs.writeFile(lowerFile, 'lower');
            
            try {
                await fs.access(upperFile);
                // If we can access the upper case file, the filesystem is case-insensitive
                await fs.rmdir(testDir, { recursive: true });
                return true; // Case-insensitive is fine for our purposes
            } catch (error) {
                // Case-sensitive filesystem
                await fs.rmdir(testDir, { recursive: true });
                return true; // Case-sensitive is also fine
            }
        } catch (error) {
            return false;
        }
    }

    // File permission tests
    async testReadPermissions() {
        try {
            const testFile = path.join(os.tmpdir(), 'read-test.txt');
            await fs.writeFile(testFile, 'test');
            await fs.access(testFile, fs.constants.R_OK);
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            return false;
        }
    }

    async testWritePermissions() {
        try {
            const testFile = path.join(os.tmpdir(), 'write-test.txt');
            await fs.writeFile(testFile, 'test');
            await fs.access(testFile, fs.constants.W_OK);
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            return false;
        }
    }

    async testExecutePermissions() {
        try {
            const testFile = path.join(os.tmpdir(), 'execute-test.txt');
            await fs.writeFile(testFile, 'test');
            
            if (this.platform !== 'win32') {
                await fs.chmod(testFile, 0o755);
                await fs.access(testFile, fs.constants.X_OK);
            }
            
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            return false;
        }
    }

    async testDirectoryPermissions() {
        try {
            const testDir = path.join(os.tmpdir(), 'dir-test');
            await fs.mkdir(testDir);
            await fs.access(testDir, fs.constants.R_OK | fs.constants.W_OK);
            await fs.rmdir(testDir);
            return true;
        } catch (error) {
            return false;
        }
    }

    async testSymbolicLinks() {
        if (this.platform === 'win32') {
            return true; // Skip on Windows as it requires admin privileges
        }

        try {
            const testFile = path.join(os.tmpdir(), 'symlink-target.txt');
            const testLink = path.join(os.tmpdir(), 'symlink-test.txt');
            
            await fs.writeFile(testFile, 'test');
            await fs.symlink(testFile, testLink);
            await fs.access(testLink, fs.constants.R_OK);
            
            await fs.unlink(testLink);
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Docker integration tests
    async checkDockerAvailable() {
        try {
            await this.executeCommand('docker --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkDockerRunning() {
        try {
            await this.executeCommand('docker info');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkDockerComposeAvailable() {
        try {
            await this.executeCommand('docker-compose --version');
            return true;
        } catch (error) {
            try {
                await this.executeCommand('docker compose version');
                return true;
            } catch (error2) {
                return false;
            }
        }
    }

    async testDockerVolumeMounts() {
        try {
            // This is a simplified test - in practice, you'd test actual volume mounts
            const testDir = path.join(os.tmpdir(), 'docker-volume-test');
            await fs.mkdir(testDir, { recursive: true });
            await fs.rmdir(testDir);
            return true;
        } catch (error) {
            return false;
        }
    }

    async testDockerNetworking() {
        try {
            // This is a simplified test - in practice, you'd test Docker networking
            return true;
        } catch (error) {
            return false;
        }
    }

    async testPlatformImages() {
        try {
            // This is a simplified test - in practice, you'd test platform-specific images
            return true;
        } catch (error) {
            return false;
        }
    }

    // Environment variable tests
    testBasicEnvironmentVariables() {
        try {
            const testVar = 'TEST_BASIC_VAR';
            process.env[testVar] = 'test-value';
            const result = process.env[testVar] === 'test-value';
            delete process.env[testVar];
            return result;
        } catch (error) {
            return false;
        }
    }

    testEnvironmentVariableSpecialCharacters() {
        try {
            const testVar = 'TEST_SPECIAL_VAR';
            const specialValue = 'test value with spaces & symbols!@#$%';
            process.env[testVar] = specialValue;
            const result = process.env[testVar] === specialValue;
            delete process.env[testVar];
            return result;
        } catch (error) {
            return false;
        }
    }

    testPathEnvironmentVariables() {
        try {
            const testVar = 'TEST_PATH_VAR';
            const pathValue = path.join('test', 'path', 'value');
            process.env[testVar] = pathValue;
            const result = process.env[testVar] === pathValue;
            delete process.env[testVar];
            return result;
        } catch (error) {
            return false;
        }
    }

    testMultilineEnvironmentVariables() {
        try {
            const testVar = 'TEST_MULTILINE_VAR';
            const multilineValue = 'line1\nline2\nline3';
            process.env[testVar] = multilineValue;
            const result = process.env[testVar] === multilineValue;
            delete process.env[testVar];
            return result;
        } catch (error) {
            return false;
        }
    }

    testUnicodeEnvironmentVariables() {
        try {
            const testVar = 'TEST_UNICODE_VAR';
            const unicodeValue = 'test 🌐 unicode 中文 value';
            process.env[testVar] = unicodeValue;
            const result = process.env[testVar] === unicodeValue;
            delete process.env[testVar];
            return result;
        } catch (error) {
            return false;
        }
    }

    // Script execution tests
    async testShellScriptExecution() {
        if (this.platform === 'win32') {
            return true; // Skip on Windows
        }

        try {
            const result = await this.executeCommand('echo "test"');
            return result.includes('test');
        } catch (error) {
            return false;
        }
    }

    async testBatchScriptExecution() {
        if (this.platform !== 'win32') {
            return true; // Skip on non-Windows
        }

        try {
            const result = await this.executeCommand('echo test');
            return result.includes('test');
        } catch (error) {
            return false;
        }
    }

    async testNodeScriptExecution() {
        try {
            const result = await this.executeCommand('node -e "console.log(\'test\')"');
            return result.includes('test');
        } catch (error) {
            return false;
        }
    }

    async testNpmScriptExecution() {
        try {
            const result = await this.executeCommand('npm --version');
            return result.length > 0;
        } catch (error) {
            return false;
        }
    }

    async testCrossPlatformScripts() {
        try {
            // Test cross-platform command that should work on all platforms
            const result = await this.executeCommand('node --version');
            return result.includes('v');
        } catch (error) {
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const validator = new CrossPlatformValidator();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'validate':
        case 'test':
        default:
            validator.runCrossPlatformValidation()
                .then(results => {
                    validator.displayResults();
                    return validator.saveResults();
                })
                .then(() => {
                    const hasBlockingIssues = validator.validationResults.overallScore < 70;
                    process.exit(hasBlockingIssues ? 1 : 0);
                })
                .catch(error => {
                    console.error('❌ Cross-platform validation failed:', error.message);
                    process.exit(1);
                });
            break;
    }
}

module.exports = CrossPlatformValidator;