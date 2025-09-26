#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * Executes all testing and validation tools in the correct order
 * and provides a unified report of the complete system readiness.
 * 
 * Features:
 * - Sequential execution of all test suites
 * - Comprehensive reporting
 * - CI/CD integration support
 * - Cross-platform compatibility validation
 * - Performance benchmarking
 * - Production readiness assessment
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Import validation tools
const FinalIntegrationTester = require('./final-integration-tester');
const CrossPlatformValidator = require('./cross-platform-validator');
const ComprehensiveParityValidator = require('./comprehensive-parity-validator');

class ComprehensiveTestRunner {
    constructor() {
        this.testResults = {
            timestamp: null,
            executionTime: 0,
            overallScore: 0,
            readinessLevel: 'unknown',
            testSuites: {
                unitTests: null,
                integrationTests: null,
                e2eTests: null,
                finalIntegrationTest: null,
                crossPlatformValidation: null,
                comprehensiveParityValidation: null
            },
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                successRate: 0
            },
            issues: [],
            recommendations: [],
            cicdReady: false
        };

        this.testSuiteConfigs = [
            {
                name: 'unitTests',
                displayName: 'Unit Tests',
                command: 'npm',
                args: ['run', 'test:unit'],
                required: true,
                timeout: 300000, // 5 minutes
                weight: 0.2
            },
            {
                name: 'integrationTests',
                displayName: 'Integration Tests',
                command: 'npm',
                args: ['run', 'test:integration'],
                required: true,
                timeout: 600000, // 10 minutes
                weight: 0.2
            },
            {
                name: 'e2eTests',
                displayName: 'End-to-End Tests',
                command: 'npm',
                args: ['run', 'test:e2e'],
                required: false,
                timeout: 900000, // 15 minutes
                weight: 0.15
            },
            {
                name: 'finalIntegrationTest',
                displayName: 'Final Integration Test',
                validator: FinalIntegrationTester,
                required: true,
                weight: 0.2
            },
            {
                name: 'crossPlatformValidation',
                displayName: 'Cross-Platform Validation',
                validator: CrossPlatformValidator,
                required: true,
                weight: 0.1
            },
            {
                name: 'comprehensiveParityValidation',
                displayName: 'Comprehensive Parity Validation',
                validator: ComprehensiveParityValidator,
                required: true,
                weight: 0.15
            }
        ];
    }

    /**
     * Run comprehensive test suite
     */
    async runComprehensiveTests() {
        console.log('🧪 Starting Comprehensive Test Runner...\n');
        console.log('This will execute all test suites and validation tools:');
        this.testSuiteConfigs.forEach(config => {
            const status = config.required ? '(Required)' : '(Optional)';
            console.log(`  • ${config.displayName} ${status}`);
        });
        console.log('');

        const startTime = performance.now();
        this.testResults.timestamp = new Date().toISOString();

        try {
            // Execute test suites sequentially
            for (const config of this.testSuiteConfigs) {
                console.log(`🔄 Running ${config.displayName}...`);
                
                const suiteStartTime = performance.now();
                let suiteResult;

                try {
                    if (config.command) {
                        suiteResult = await this.runCommandTest(config);
                    } else if (config.validator) {
                        suiteResult = await this.runValidatorTest(config);
                    } else {
                        throw new Error(`Invalid test configuration for ${config.name}`);
                    }

                    suiteResult.executionTime = Math.round(performance.now() - suiteStartTime);
                    this.testResults.testSuites[config.name] = suiteResult;

                    const status = suiteResult.success ? '✅' : '❌';
                    console.log(`${status} ${config.displayName} completed in ${suiteResult.executionTime}ms`);
                    
                    if (suiteResult.summary) {
                        console.log(`   Score: ${suiteResult.score || 0}/100`);
                    }

                } catch (error) {
                    const suiteResult = {
                        success: false,
                        score: 0,
                        error: error.message,
                        executionTime: Math.round(performance.now() - suiteStartTime)
                    };

                    this.testResults.testSuites[config.name] = suiteResult;
                    console.log(`❌ ${config.displayName} failed: ${error.message}`);

                    // Stop execution if required test fails
                    if (config.required) {
                        console.log(`\n🚨 Required test suite failed. Stopping execution.`);
                        break;
                    }
                }

                console.log(''); // Add spacing between test suites
            }

            // Calculate overall results
            this.calculateOverallResults();

            const endTime = performance.now();
            this.testResults.executionTime = Math.round(endTime - startTime);

            console.log(`✅ Comprehensive testing completed in ${this.testResults.executionTime}ms\n`);

            return this.testResults;

        } catch (error) {
            console.error('❌ Comprehensive testing failed:', error.message);
            this.testResults.readinessLevel = 'failed';
            this.testResults.error = error.message;
            return this.testResults;
        }
    }

    /**
     * Run command-based test
     */
    async runCommandTest(config) {
        return new Promise((resolve, reject) => {
            const process = spawn(config.command, config.args, {
                stdio: 'pipe',
                shell: true
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error(`Test suite timed out after ${config.timeout}ms`));
            }, config.timeout);

            process.on('close', (code) => {
                clearTimeout(timeout);

                const result = {
                    success: code === 0,
                    exitCode: code,
                    stdout: stdout,
                    stderr: stderr,
                    score: code === 0 ? 100 : 0
                };

                // Parse test results from stdout if available
                const testSummary = this.parseTestOutput(stdout, config.name);
                if (testSummary) {
                    result.summary = testSummary;
                    result.score = testSummary.successRate;
                }

                resolve(result);
            });

            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Run validator-based test
     */
    async runValidatorTest(config) {
        try {
            const validator = new config.validator();
            let result;

            // Call the appropriate method based on validator type
            if (validator.runFinalIntegrationTest) {
                result = await validator.runFinalIntegrationTest();
            } else if (validator.runCrossPlatformValidation) {
                result = await validator.runCrossPlatformValidation();
            } else if (validator.runComprehensiveValidation) {
                result = await validator.runComprehensiveValidation();
            } else {
                throw new Error(`Unknown validator method for ${config.name}`);
            }

            return {
                success: result.overallScore >= 70, // 70% threshold for success
                score: result.overallScore || 0,
                result: result,
                issues: result.issues || [],
                recommendations: result.recommendations || []
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Parse test output to extract test summary
     */
    parseTestOutput(output, testType) {
        try {
            // Jest output parsing
            if (testType === 'unitTests' || testType === 'integrationTests') {
                const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
                if (testMatch) {
                    const [, failed, passed, total] = testMatch.map(Number);
                    return {
                        total: total,
                        passed: passed,
                        failed: failed,
                        skipped: 0,
                        successRate: Math.round((passed / total) * 100)
                    };
                }

                // Alternative Jest format
                const altMatch = output.match(/(\d+)\s+passing/);
                if (altMatch) {
                    const passed = Number(altMatch[1]);
                    return {
                        total: passed,
                        passed: passed,
                        failed: 0,
                        skipped: 0,
                        successRate: 100
                    };
                }
            }

            // Playwright output parsing
            if (testType === 'e2eTests') {
                const playwrightMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed/);
                if (playwrightMatch) {
                    const [, passed, failed] = playwrightMatch.map(Number);
                    const total = passed + failed;
                    return {
                        total: total,
                        passed: passed,
                        failed: failed,
                        skipped: 0,
                        successRate: Math.round((passed / total) * 100)
                    };
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Calculate overall test results
     */
    calculateOverallResults() {
        let totalScore = 0;
        let totalWeight = 0;
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;

        // Calculate weighted score
        for (const config of this.testSuiteConfigs) {
            const result = this.testResults.testSuites[config.name];
            
            if (result && result.score !== undefined) {
                totalScore += result.score * config.weight;
                totalWeight += config.weight;
            }

            // Aggregate test counts
            if (result && result.summary) {
                totalTests += result.summary.total || 0;
                passedTests += result.summary.passed || 0;
                failedTests += result.summary.failed || 0;
                skippedTests += result.summary.skipped || 0;
            }
        }

        this.testResults.overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

        // Determine readiness level
        if (this.testResults.overallScore >= 90) {
            this.testResults.readinessLevel = 'excellent';
        } else if (this.testResults.overallScore >= 80) {
            this.testResults.readinessLevel = 'good';
        } else if (this.testResults.overallScore >= 70) {
            this.testResults.readinessLevel = 'acceptable';
        } else if (this.testResults.overallScore >= 60) {
            this.testResults.readinessLevel = 'needs-improvement';
        } else {
            this.testResults.readinessLevel = 'poor';
        }

        // Set summary
        this.testResults.summary = {
            totalTests: totalTests,
            passedTests: passedTests,
            failedTests: failedTests,
            skippedTests: skippedTests,
            successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
        };

        // Collect issues and recommendations
        this.collectIssuesAndRecommendations();

        // Determine CI/CD readiness
        this.testResults.cicdReady = this.testResults.overallScore >= 80 && 
                                    this.testResults.summary.failedTests === 0;
    }

    /**
     * Collect issues and recommendations from all test suites
     */
    collectIssuesAndRecommendations() {
        this.testResults.issues = [];
        this.testResults.recommendations = [];

        for (const [suiteName, result] of Object.entries(this.testResults.testSuites)) {
            if (result && result.issues) {
                this.testResults.issues.push(...result.issues.map(issue => ({
                    source: suiteName,
                    issue: issue
                })));
            }

            if (result && result.recommendations) {
                this.testResults.recommendations.push(...result.recommendations.map(rec => ({
                    source: suiteName,
                    ...rec
                })));
            }

            if (result && !result.success) {
                this.testResults.issues.push({
                    source: suiteName,
                    issue: result.error || 'Test suite failed'
                });
            }
        }

        // Deduplicate recommendations
        const uniqueRecommendations = new Map();
        for (const rec of this.testResults.recommendations) {
            const key = `${rec.category}-${rec.recommendation}`;
            if (!uniqueRecommendations.has(key)) {
                uniqueRecommendations.set(key, rec);
            }
        }
        this.testResults.recommendations = Array.from(uniqueRecommendations.values());
    }

    /**
     * Display comprehensive test results
     */
    displayResults() {
        const statusEmoji = {
            'excellent': '🟢',
            'good': '🟡',
            'acceptable': '🟠',
            'needs-improvement': '🔴',
            'poor': '🚨'
        };

        console.log('\n📊 COMPREHENSIVE TEST RESULTS');
        console.log('=' .repeat(80));
        console.log(`Overall Score: ${this.testResults.overallScore}/100`);
        console.log(`Readiness Level: ${statusEmoji[this.testResults.readinessLevel]} ${this.testResults.readinessLevel.toUpperCase()}`);
        console.log(`Total Execution Time: ${this.testResults.executionTime}ms`);
        console.log(`CI/CD Ready: ${this.testResults.cicdReady ? '✅ Yes' : '❌ No'}`);
        console.log(`Timestamp: ${this.testResults.timestamp}`);

        // Test suite breakdown
        console.log('\n📋 Test Suite Results:');
        for (const config of this.testSuiteConfigs) {
            const result = this.testResults.testSuites[config.name];
            if (result) {
                const status = result.success ? '✅' : '❌';
                const score = result.score !== undefined ? `${result.score}/100` : 'N/A';
                const time = result.executionTime ? `${result.executionTime}ms` : 'N/A';
                console.log(`  ${status} ${config.displayName}: ${score} (${time})`);
            } else {
                console.log(`  ⏭️ ${config.displayName}: Skipped`);
            }
        }

        // Test summary
        console.log('\n📈 Test Summary:');
        console.log(`  Total Tests: ${this.testResults.summary.totalTests}`);
        console.log(`  Passed: ${this.testResults.summary.passedTests}`);
        console.log(`  Failed: ${this.testResults.summary.failedTests}`);
        console.log(`  Skipped: ${this.testResults.summary.skippedTests}`);
        console.log(`  Success Rate: ${this.testResults.summary.successRate}%`);

        // Issues
        if (this.testResults.issues.length > 0) {
            console.log('\n⚠️ Issues Found:');
            this.testResults.issues.slice(0, 10).forEach((item, index) => {
                console.log(`  ${index + 1}. [${item.source}] ${item.issue}`);
            });
            if (this.testResults.issues.length > 10) {
                console.log(`  ... and ${this.testResults.issues.length - 10} more issues`);
            }
        }

        // Top recommendations
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            this.testResults.recommendations.slice(0, 5).forEach((rec, index) => {
                const priorityEmoji = {
                    critical: '🚨',
                    high: '🔴',
                    medium: '🟡',
                    low: '🟢'
                };
                console.log(`  ${index + 1}. ${priorityEmoji[rec.priority] || '📝'} ${rec.recommendation}`);
            });
        }

        // CI/CD readiness assessment
        console.log('\n🚀 CI/CD Readiness Assessment:');
        if (this.testResults.cicdReady) {
            console.log('  ✅ System is ready for CI/CD deployment');
            console.log('  ✅ All critical tests passing');
            console.log('  ✅ Quality gates satisfied');
        } else {
            console.log('  ❌ System not ready for CI/CD deployment');
            if (this.testResults.summary.failedTests > 0) {
                console.log(`  ❌ ${this.testResults.summary.failedTests} test(s) failing`);
            }
            if (this.testResults.overallScore < 80) {
                console.log(`  ❌ Overall score ${this.testResults.overallScore}/100 below threshold`);
            }
        }

        console.log('\n' + '='.repeat(80));
    }

    /**
     * Save comprehensive test results
     */
    async saveResults() {
        const resultsDir = path.join(process.cwd(), '.metrics', 'comprehensive-tests');
        await fs.mkdir(resultsDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `comprehensive-test-results-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(this.testResults, null, 2));
        console.log(`\n💾 Comprehensive test results saved to: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate CI/CD report
     */
    async generateCICDReport() {
        const report = {
            metadata: {
                reportType: 'comprehensive-test-results',
                version: '1.0.0',
                timestamp: this.testResults.timestamp,
                executionTime: this.testResults.executionTime
            },
            summary: {
                overallScore: this.testResults.overallScore,
                readinessLevel: this.testResults.readinessLevel,
                cicdReady: this.testResults.cicdReady,
                testSummary: this.testResults.summary
            },
            testSuites: Object.entries(this.testResults.testSuites).map(([name, result]) => ({
                name: name,
                success: result?.success || false,
                score: result?.score || 0,
                executionTime: result?.executionTime || 0,
                hasIssues: (result?.issues?.length || 0) > 0
            })),
            qualityGates: {
                overallScoreThreshold: this.testResults.overallScore >= 80,
                noFailedTests: this.testResults.summary.failedTests === 0,
                allRequiredTestsPassed: this.checkRequiredTestsPassed(),
                noCriticalIssues: this.checkNoCriticalIssues()
            },
            issues: this.testResults.issues,
            recommendations: this.testResults.recommendations.slice(0, 10),
            nextSteps: this.generateNextSteps()
        };

        return report;
    }

    /**
     * Check if all required tests passed
     */
    checkRequiredTestsPassed() {
        const requiredConfigs = this.testSuiteConfigs.filter(config => config.required);
        return requiredConfigs.every(config => {
            const result = this.testResults.testSuites[config.name];
            return result && result.success;
        });
    }

    /**
     * Check for critical issues
     */
    checkNoCriticalIssues() {
        return !this.testResults.recommendations.some(rec => rec.priority === 'critical');
    }

    /**
     * Generate next steps based on results
     */
    generateNextSteps() {
        const nextSteps = [];

        if (this.testResults.cicdReady) {
            nextSteps.push('✅ System is ready for deployment');
            nextSteps.push('🚀 Proceed with CI/CD pipeline');
            nextSteps.push('📊 Monitor deployment metrics');
        } else {
            if (this.testResults.summary.failedTests > 0) {
                nextSteps.push('🔧 Fix failing tests before deployment');
            }
            
            if (this.testResults.overallScore < 80) {
                nextSteps.push('📈 Improve overall test score to 80+');
            }

            if (this.testResults.issues.length > 0) {
                nextSteps.push('⚠️ Address identified issues');
            }

            nextSteps.push('🔄 Re-run comprehensive tests after fixes');
        }

        return nextSteps;
    }

    /**
     * Generate JUnit XML report for CI/CD integration
     */
    async generateJUnitReport() {
        const testSuites = Object.entries(this.testResults.testSuites).map(([name, result]) => {
            const config = this.testSuiteConfigs.find(c => c.name === name);
            const displayName = config?.displayName || name;
            
            return `
    <testsuite name="${displayName}" tests="1" failures="${result?.success ? 0 : 1}" time="${(result?.executionTime || 0) / 1000}">
        <testcase name="${displayName}" time="${(result?.executionTime || 0) / 1000}">
            ${result?.success ? '' : `<failure message="${result?.error || 'Test suite failed'}">${result?.stderr || result?.error || 'Unknown error'}</failure>`}
        </testcase>
    </testsuite>`;
        }).join('');

        const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Comprehensive Test Suite" tests="${Object.keys(this.testResults.testSuites).length}" failures="${Object.values(this.testResults.testSuites).filter(r => !r?.success).length}" time="${this.testResults.executionTime / 1000}">
${testSuites}
</testsuites>`;

        const junitPath = path.join(process.cwd(), '.metrics', 'junit-report.xml');
        await fs.writeFile(junitPath, junitXml);
        console.log(`📄 JUnit report saved to: ${junitPath}`);
        
        return junitPath;
    }
}

// CLI interface
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'run':
        case 'test':
        default:
            runner.runComprehensiveTests()
                .then(results => {
                    runner.displayResults();
                    return Promise.all([
                        runner.saveResults(),
                        runner.generateJUnitReport()
                    ]);
                })
                .then(() => {
                    const exitCode = runner.testResults.cicdReady ? 0 : 1;
                    process.exit(exitCode);
                })
                .catch(error => {
                    console.error('❌ Comprehensive test runner failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'report':
            runner.runComprehensiveTests()
                .then(() => runner.generateCICDReport())
                .then(report => {
                    console.log(JSON.stringify(report, null, 2));
                })
                .catch(error => {
                    console.error('❌ Report generation failed:', error.message);
                    process.exit(1);
                });
            break;
    }
}

module.exports = ComprehensiveTestRunner;