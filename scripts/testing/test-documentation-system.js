#!/usr/bin/env node

/**
 * Standalone Documentation System Tests
 * Tests the consolidated documentation structure without requiring running services
 */

const fs = require('fs');
const path = require('path');

class DocumentationSystemTester {
    constructor() {
        this.projectRoot = process.cwd();
        this.consolidatedDocsDir = path.join(this.projectRoot, 'docs', 'consolidated');
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Running Documentation System Tests...\n');
        
        try {
            await this.testDocumentationStructure();
            await this.testCrossReferences();
            await this.testContentQuality();
            await this.testNavigationSystem();
            await this.testGapAnalysis();
            
            this.printResults();
            
            const failedTests = this.testResults.filter(result => !result.passed);
            if (failedTests.length > 0) {
                console.log(`\n❌ ${failedTests.length} tests failed`);
                process.exit(1);
            } else {
                console.log('\n✅ All documentation tests passed!');
            }
            
        } catch (error) {
            console.error('\n❌ Test execution failed:', error.message);
            process.exit(1);
        }
    }

    async testDocumentationStructure() {
        console.log('📁 Testing documentation structure...');
        
        // Test main sections exist
        const expectedSections = [
            'getting-started',
            'architecture',
            'development', 
            'deployment',
            'reference',
            'troubleshooting'
        ];

        expectedSections.forEach(section => {
            const sectionPath = path.join(this.consolidatedDocsDir, section);
            this.addTest(
                `Section ${section} exists`,
                fs.existsSync(sectionPath) && fs.statSync(sectionPath).isDirectory()
            );
        });

        // Test main navigation files
        const navigationFiles = [
            'README.md',
            'TABLE_OF_CONTENTS.md',
            'GAP_ANALYSIS_REPORT.md'
        ];

        navigationFiles.forEach(file => {
            const filePath = path.join(this.consolidatedDocsDir, file);
            this.addTest(
                `Navigation file ${file} exists`,
                fs.existsSync(filePath)
            );
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                this.addTest(
                    `Navigation file ${file} has content`,
                    content.length > 100
                );
            }
        });

        // Test required files in each section
        const requiredFiles = {
            'getting-started': ['README.md', 'dependencies.md', 'docker-setup.md'],
            'architecture': ['system-overview.md', 'api-design.md', 'data-models.md'],
            'development': ['local-setup.md', 'localstack-setup.md'],
            'deployment': ['terraform.md', 'process.md'],
            'reference': ['api-documentation.md', 'commands.md'],
            'troubleshooting': ['README.md']
        };

        Object.entries(requiredFiles).forEach(([section, files]) => {
            files.forEach(file => {
                const filePath = path.join(this.consolidatedDocsDir, section, file);
                this.addTest(
                    `Required file ${section}/${file} exists`,
                    fs.existsSync(filePath)
                );
            });
        });
    }

    async testCrossReferences() {
        console.log('🔗 Testing cross-references and links...');
        
        const allMarkdownFiles = this.getAllMarkdownFiles(this.consolidatedDocsDir);
        let totalBrokenLinks = 0;

        allMarkdownFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const links = this.extractInternalLinks(content);
            let fileBrokenLinks = 0;

            links.forEach(link => {
                const targetPath = path.resolve(path.dirname(file), link);
                if (!fs.existsSync(targetPath)) {
                    fileBrokenLinks++;
                    totalBrokenLinks++;
                }
            });

            this.addTest(
                `No broken links in ${path.relative(this.consolidatedDocsDir, file)}`,
                fileBrokenLinks === 0
            );
        });

        this.addTest(
            'Overall link integrity',
            totalBrokenLinks === 0,
            totalBrokenLinks > 0 ? `Found ${totalBrokenLinks} broken links` : null
        );
    }

    async testContentQuality() {
        console.log('📝 Testing content quality...');
        
        const allMarkdownFiles = this.getAllMarkdownFiles(this.consolidatedDocsDir);
        let emptyFiles = 0;
        let syntaxErrors = 0;

        allMarkdownFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8').trim();
            
            // Test for empty files
            if (content.length < 50) {
                emptyFiles++;
            }

            // Test for basic markdown syntax
            const malformedLinks = content.match(/\]\([^)]*$/gm);
            const codeBlocks = content.match(/```/g);
            
            if (malformedLinks) {
                syntaxErrors++;
            }
            
            if (codeBlocks && codeBlocks.length % 2 !== 0) {
                syntaxErrors++;
            }
        });

        this.addTest(
            'No empty documentation files',
            emptyFiles === 0,
            emptyFiles > 0 ? `Found ${emptyFiles} empty files` : null
        );

        this.addTest(
            'No markdown syntax errors',
            syntaxErrors === 0,
            syntaxErrors > 0 ? `Found ${syntaxErrors} files with syntax errors` : null
        );
    }

    async testNavigationSystem() {
        console.log('🧭 Testing navigation system...');
        
        // Test table of contents
        const tocPath = path.join(this.consolidatedDocsDir, 'TABLE_OF_CONTENTS.md');
        if (fs.existsSync(tocPath)) {
            const tocContent = fs.readFileSync(tocPath, 'utf8');
            const links = this.extractInternalLinks(tocContent);
            let brokenTocLinks = 0;

            links.forEach(link => {
                const targetPath = path.resolve(this.consolidatedDocsDir, link);
                if (!fs.existsSync(targetPath)) {
                    brokenTocLinks++;
                }
            });

            this.addTest(
                'Table of contents has working links',
                brokenTocLinks === 0,
                brokenTocLinks > 0 ? `Found ${brokenTocLinks} broken TOC links` : null
            );
        }

        // Test main README navigation
        const readmePath = path.join(this.consolidatedDocsDir, 'README.md');
        if (fs.existsSync(readmePath)) {
            const readmeContent = fs.readFileSync(readmePath, 'utf8');
            
            const hasNavigation = readmeContent.includes('Quick Navigation');
            const hasSections = [
                'Getting Started',
                'Architecture', 
                'Development',
                'Deployment',
                'Reference',
                'Troubleshooting'
            ].every(section => readmeContent.includes(section));

            this.addTest('Main README has navigation section', hasNavigation);
            this.addTest('Main README includes all sections', hasSections);
        }
    }  
  async testGapAnalysis() {
        console.log('📊 Testing gap analysis...');
        
        const gapReportPath = path.join(this.consolidatedDocsDir, 'GAP_ANALYSIS_REPORT.md');
        
        this.addTest(
            'Gap analysis report exists',
            fs.existsSync(gapReportPath)
        );

        if (fs.existsSync(gapReportPath)) {
            const reportContent = fs.readFileSync(gapReportPath, 'utf8');
            
            const hasTitle = reportContent.includes('# Documentation Gap Analysis Report');
            const hasSummary = reportContent.includes('## Summary');
            const hasRecommendations = reportContent.includes('## Recommendations');
            const hasTimestamp = /Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(reportContent);

            this.addTest('Gap report has proper title', hasTitle);
            this.addTest('Gap report has summary section', hasSummary);
            this.addTest('Gap report has recommendations', hasRecommendations);
            this.addTest('Gap report has timestamp', hasTimestamp);
        }
    }

    // Helper methods
    getAllMarkdownFiles(dir) {
        const files = [];
        
        if (!fs.existsSync(dir)) {
            return files;
        }
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.getAllMarkdownFiles(fullPath));
            } else if (item.endsWith('.md')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    extractInternalLinks(content) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [];
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            const link = match[2];
            // Only internal links (relative paths)
            if (!link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('#')) {
                links.push(link);
            }
        }
        
        return links;
    }

    addTest(name, passed, message = null) {
        this.testResults.push({
            name,
            passed,
            message
        });
        
        const status = passed ? '✅' : '❌';
        const msg = message ? ` (${message})` : '';
        console.log(`   ${status} ${name}${msg}`);
    }

    printResults() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;

        console.log('\n📋 Test Results Summary:');
        console.log(`   Total tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    const msg = result.message ? ` - ${result.message}` : '';
                    console.log(`   • ${result.name}${msg}`);
                });
        }
    }
}

// CLI execution
if (require.main === module) {
    const tester = new DocumentationSystemTester();
    tester.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = DocumentationSystemTester;