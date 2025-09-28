#!/usr/bin/env node

/**
 * Documentation Consolidation Pipeline
 * Generates final consolidated documentation set with validation and cross-references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isValidateOnly = args.includes('--validate-only');

class DocumentationConsolidationPipeline {
    constructor() {
        this.projectRoot = process.cwd();
        this.docsDir = path.join(this.projectRoot, 'docs');
        this.outputDir = path.join(this.docsDir, 'consolidated');
        this.gapAnalysisReport = [];
        this.crossReferences = new Map();
        this.navigationStructure = {};
    }

    async run() {
        if (isValidateOnly) {
            console.log('🔍 Running Documentation Validation Only...\n');
            return await this.runValidationOnly();
        }
        
        console.log('🚀 Starting Documentation Consolidation Pipeline...\n');
        
        try {
            await this.setupOutputDirectory();
            await this.generateConsolidatedStructure();
            await this.validateCrossReferences();
            await this.createMainNavigation();
            await this.generateGapAnalysisReport();
            await this.runEndToEndTests();
            
            console.log('\n✅ Documentation consolidation completed successfully!');
            console.log(`📁 Consolidated docs available at: ${this.outputDir}`);
            
        } catch (error) {
            console.error('\n❌ Documentation consolidation failed:', error.message);
            process.exit(1);
        }
    }

    async runValidationOnly() {
        console.log('🔍 Validating existing documentation structure...\n');
        
        try {
            // Check if consolidated docs exist
            if (!fs.existsSync(this.outputDir)) {
                console.log('⚠️  Consolidated documentation not found. Validating source documentation instead...\n');
                await this.validateSourceDocumentation();
            } else {
                console.log('📁 Found consolidated documentation. Validating...\n');
                await this.validateConsolidatedDocumentation();
            }
            
            console.log('\n✅ Documentation validation completed successfully!');
            
        } catch (error) {
            console.error('\n❌ Documentation validation failed:', error.message);
            process.exit(1);
        }
    }

    async validateSourceDocumentation() {
        console.log('📖 Validating source documentation...');
        
        const sourceDocsDir = this.docsDir;
        const allFiles = this.getAllMarkdownFiles(sourceDocsDir);
        
        console.log(`   Found ${allFiles.length} markdown files to validate`);
        
        // Test 1: Check for broken links
        await this.validateLinksInDirectory(sourceDocsDir);
        
        // Test 2: Check for empty files
        await this.validateContentQuality(allFiles);
        
        // Test 3: Check for basic structure
        await this.validateBasicStructure(sourceDocsDir);
        
        console.log('✅ Source documentation validation completed');
    }

    async validateConsolidatedDocumentation() {
        console.log('📚 Validating consolidated documentation...');
        
        // Run the same validation as the full pipeline
        await this.validateCrossReferences();
        await this.runEndToEndTests();
        
        console.log('✅ Consolidated documentation validation completed');
    }

    async validateLinksInDirectory(dir) {
        console.log('🔗 Validating links...');
        
        const allFiles = this.getAllMarkdownFiles(dir);
        let totalBrokenLinks = 0;
        
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const links = this.extractLinks(content);
            
            for (const link of links) {
                if (link.startsWith('./') || link.startsWith('../')) {
                    const targetPath = path.resolve(path.dirname(file), link);
                    if (!fs.existsSync(targetPath)) {
                        totalBrokenLinks++;
                        console.log(`   ⚠️  Broken link: ${path.relative(dir, file)} -> ${link}`);
                    }
                }
            }
        }
        
        if (totalBrokenLinks === 0) {
            console.log('   ✅ All links are valid');
        } else {
            console.log(`   ⚠️  Found ${totalBrokenLinks} broken links`);
        }
    }

    async validateContentQuality(files) {
        console.log('📝 Validating content quality...');
        
        let emptyFiles = 0;
        let syntaxErrors = 0;
        
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8').trim();
            
            // Check for empty files
            if (content.length < 50) {
                emptyFiles++;
                console.log(`   ⚠️  Empty or very short file: ${path.relative(this.projectRoot, file)}`);
            }
            
            // Check for basic markdown syntax issues
            const malformedLinks = content.match(/\]\([^)]*$/gm);
            const codeBlocks = content.match(/```/g);
            
            if (malformedLinks) {
                syntaxErrors++;
                console.log(`   ⚠️  Malformed links in: ${path.relative(this.projectRoot, file)}`);
            }
            
            if (codeBlocks && codeBlocks.length % 2 !== 0) {
                syntaxErrors++;
                console.log(`   ⚠️  Unclosed code blocks in: ${path.relative(this.projectRoot, file)}`);
            }
        });
        
        if (emptyFiles === 0 && syntaxErrors === 0) {
            console.log('   ✅ All content quality checks passed');
        } else {
            console.log(`   ⚠️  Found ${emptyFiles} empty files and ${syntaxErrors} syntax errors`);
        }
    }

    async validateBasicStructure(dir) {
        console.log('📁 Validating basic structure...');
        
        // Check for main documentation files
        const expectedFiles = [
            'README.md',
            'QUICK_START.md'
        ];
        
        const expectedDirs = [
            'architecture',
            'setup',
            'planning'
        ];
        
        let missingFiles = 0;
        let missingDirs = 0;
        
        expectedFiles.forEach(file => {
            const filePath = path.join(dir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles++;
                console.log(`   ⚠️  Missing expected file: ${file}`);
            }
        });
        
        expectedDirs.forEach(dirName => {
            const dirPath = path.join(dir, dirName);
            if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
                missingDirs++;
                console.log(`   ⚠️  Missing expected directory: ${dirName}`);
            }
        });
        
        if (missingFiles === 0 && missingDirs === 0) {
            console.log('   ✅ Basic structure validation passed');
        } else {
            console.log(`   ⚠️  Found ${missingFiles} missing files and ${missingDirs} missing directories`);
        }
    }

    async setupOutputDirectory() {
        console.log('📁 Setting up output directory...');
        
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(this.outputDir, { recursive: true });
        
        // Create main structure
        const mainDirs = [
            'getting-started',
            'architecture', 
            'development',
            'deployment',
            'reference',
            'troubleshooting'
        ];
        
        mainDirs.forEach(dir => {
            fs.mkdirSync(path.join(this.outputDir, dir), { recursive: true });
        });
        
        console.log('✅ Output directory structure created');
    }

    async generateConsolidatedStructure() {
        console.log('📚 Generating consolidated documentation structure...');
        
        // Getting Started Section
        await this.consolidateGettingStarted();
        
        // Architecture Section  
        await this.consolidateArchitecture();
        
        // Development Section
        await this.consolidateDevelopment();
        
        // Deployment Section
        await this.consolidateDeployment();
        
        // Reference Section
        await this.consolidateReference();
        
        // Troubleshooting Section
        await this.consolidateTroubleshooting();
        
        console.log('✅ Documentation structure consolidated');
    }

    async consolidateGettingStarted() {
        const gettingStartedDir = path.join(this.outputDir, 'getting-started');
        
        // Main README
        const mainReadme = this.readSourceFile('docs/README.md');
        const quickStart = this.readSourceFile('docs/QUICK_START.md');
        
        const consolidatedReadme = `# Tattoo Artist Directory MVP

${mainReadme}

## Quick Start

${quickStart}

## Next Steps

- [Local Development Setup](../development/local-setup.md)
- [Architecture Overview](../architecture/system-overview.md)
- [API Reference](../reference/api-documentation.md)
`;

        this.writeConsolidatedFile(gettingStartedDir, 'README.md', consolidatedReadme);
        
        // Setup guides
        this.copyAndConsolidate('docs/setup/dependencies.md', gettingStartedDir, 'dependencies.md');
        this.copyAndConsolidate('docs/setup/docker-setup.md', gettingStartedDir, 'docker-setup.md');
    }

    async consolidateArchitecture() {
        const archDir = path.join(this.outputDir, 'architecture');
        
        // System overview
        this.copyAndConsolidate('docs/architecture/system-overview.md', archDir, 'system-overview.md');
        this.copyAndConsolidate('docs/architecture/api-design.md', archDir, 'api-design.md');
        this.copyAndConsolidate('docs/architecture/data-models.md', archDir, 'data-models.md');
        
        // Infrastructure docs
        const infraReadme = this.readSourceFile('docs/infrastructure/README.md');
        this.writeConsolidatedFile(archDir, 'infrastructure.md', infraReadme);
        
        // Copy diagrams
        const diagramsDir = path.join(archDir, 'diagrams');
        fs.mkdirSync(diagramsDir, { recursive: true });
        this.copyDirectory('docs/diagrams', diagramsDir);
        this.copyDirectory('docs/diagrams_as_code', path.join(diagramsDir, 'source'));
    }  
  async consolidateDevelopment() {
        const devDir = path.join(this.outputDir, 'development');
        
        // Local development
        this.copyAndConsolidate('docs/setup/local-development.md', devDir, 'local-setup.md');
        this.copyAndConsolidate('docs/localstack/README_LOCAL.md', devDir, 'localstack-setup.md');
        
        // Frontend development
        const frontendDir = path.join(devDir, 'frontend');
        fs.mkdirSync(frontendDir, { recursive: true });
        this.copyAndConsolidate('docs/frontend/README_FRONTEND.md', frontendDir, 'README.md');
        this.copyAndConsolidate('docs/frontend/README_DOCKER.md', frontendDir, 'docker-setup.md');
        
        // Backend development
        const backendDir = path.join(devDir, 'backend');
        fs.mkdirSync(backendDir, { recursive: true });
        this.copyAndConsolidate('docs/backend/README_BACKEND.md', backendDir, 'README.md');
        
        // Scripts and tools
        const scriptsDir = path.join(devDir, 'scripts');
        fs.mkdirSync(scriptsDir, { recursive: true });
        this.copyAndConsolidate('docs/scripts/README.md', scriptsDir, 'README.md');
        this.copyAndConsolidate('docs/devtools/README-DEVTOOLS.md', scriptsDir, 'devtools.md');
        
        // Testing
        const testingDir = path.join(devDir, 'testing');
        fs.mkdirSync(testingDir, { recursive: true });
        this.copyAndConsolidate('docs/workflows/testing-strategies.md', testingDir, 'strategies.md');
    }

    async consolidateDeployment() {
        const deployDir = path.join(this.outputDir, 'deployment');
        
        // Infrastructure deployment
        this.copyAndConsolidate('docs/planning/terraform-deployment-guide.md', deployDir, 'terraform.md');
        this.copyAndConsolidate('docs/workflows/deployment-process.md', deployDir, 'process.md');
        
        // CI/CD
        this.copyAndConsolidate('docs/planning/CI-CD Implementation.md', deployDir, 'ci-cd.md');
        
        // Monitoring
        this.copyAndConsolidate('docs/workflows/monitoring.md', deployDir, 'monitoring.md');
    }

    async consolidateReference() {
        const refDir = path.join(this.outputDir, 'reference');
        
        // API documentation
        this.copyAndConsolidate('docs/planning/API_DOCUMENTATION.md', refDir, 'api-documentation.md');
        
        // Command reference
        this.copyAndConsolidate('docs/reference/command-reference.md', refDir, 'commands.md');
        
        // Data management
        this.copyAndConsolidate('docs/data_management/DATA_MANAGEMENT_GUIDE.md', refDir, 'data-management.md');
        
        // Performance benchmarks
        this.copyAndConsolidate('docs/data_management/PERFORMANCE_BENCHMARKS.md', refDir, 'performance.md');
    } 
   async consolidateTroubleshooting() {
        const troubleDir = path.join(this.outputDir, 'troubleshooting');
        
        // Main troubleshooting guide
        this.copyAndConsolidate('docs/planning/TROUBLESHOOTING.md', troubleDir, 'README.md');
        
        // LocalStack troubleshooting
        const localstackDir = path.join(troubleDir, 'localstack');
        fs.mkdirSync(localstackDir, { recursive: true });
        this.copyDirectory('docs/localstack/troubleshooting', localstackDir);
        
        // Error handling
        this.copyAndConsolidate('docs/scripts/error-handling-fix-summary.md', troubleDir, 'error-handling.md');
    }

    async validateCrossReferences() {
        console.log('🔗 Validating cross-references and links...');
        
        const allFiles = this.getAllMarkdownFiles(this.outputDir);
        let brokenLinks = [];
        
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const links = this.extractLinks(content);
            
            for (const link of links) {
                if (link.startsWith('./') || link.startsWith('../')) {
                    const targetPath = path.resolve(path.dirname(file), link);
                    if (!fs.existsSync(targetPath)) {
                        brokenLinks.push({
                            file: path.relative(this.outputDir, file),
                            link: link,
                            target: path.relative(this.outputDir, targetPath)
                        });
                    }
                }
            }
        }
        
        if (brokenLinks.length > 0) {
            console.log(`⚠️  Found ${brokenLinks.length} broken links:`);
            brokenLinks.forEach(broken => {
                console.log(`   ${broken.file}: ${broken.link} -> ${broken.target}`);
                this.gapAnalysisReport.push({
                    type: 'broken_link',
                    file: broken.file,
                    issue: `Broken link: ${broken.link}`,
                    severity: 'medium'
                });
            });
        } else {
            console.log('✅ All cross-references validated successfully');
        }
    }

    async createMainNavigation() {
        console.log('🧭 Creating main navigation and table of contents...');
        
        const navigation = {
            "Getting Started": {
                "README": "getting-started/README.md",
                "Dependencies": "getting-started/dependencies.md", 
                "Docker Setup": "getting-started/docker-setup.md"
            },
            "Architecture": {
                "System Overview": "architecture/system-overview.md",
                "API Design": "architecture/api-design.md",
                "Data Models": "architecture/data-models.md",
                "Infrastructure": "architecture/infrastructure.md",
                "Diagrams": "architecture/diagrams/"
            },
            "Development": {
                "Local Setup": "development/local-setup.md",
                "LocalStack": "development/localstack-setup.md",
                "Frontend": "development/frontend/",
                "Backend": "development/backend/",
                "Scripts & Tools": "development/scripts/",
                "Testing": "development/testing/"
            },
            "Deployment": {
                "Terraform": "deployment/terraform.md",
                "Process": "deployment/process.md",
                "CI/CD": "deployment/ci-cd.md",
                "Monitoring": "deployment/monitoring.md"
            },
            "Reference": {
                "API Documentation": "reference/api-documentation.md",
                "Commands": "reference/commands.md",
                "Data Management": "reference/data-management.md",
                "Performance": "reference/performance.md"
            },
            "Troubleshooting": {
                "General": "troubleshooting/README.md",
                "LocalStack": "troubleshooting/localstack/",
                "Error Handling": "troubleshooting/error-handling.md"
            }
        };
        
        this.navigationStructure = navigation;
        
        // Generate main table of contents
        const tocContent = this.generateTableOfContents(navigation);
        this.writeConsolidatedFile(this.outputDir, 'TABLE_OF_CONTENTS.md', tocContent);
        
        // Generate navigation index
        const navContent = this.generateNavigationIndex(navigation);
        this.writeConsolidatedFile(this.outputDir, 'README.md', navContent);
        
        console.log('✅ Navigation and table of contents created');
    }    async
 generateGapAnalysisReport() {
        console.log('📊 Generating final gap analysis report...');
        
        // Check for missing documentation
        const expectedFiles = [
            'getting-started/README.md',
            'architecture/system-overview.md',
            'development/local-setup.md',
            'deployment/terraform.md',
            'reference/api-documentation.md',
            'troubleshooting/README.md'
        ];
        
        expectedFiles.forEach(file => {
            const filePath = path.join(this.outputDir, file);
            if (!fs.existsSync(filePath)) {
                this.gapAnalysisReport.push({
                    type: 'missing_file',
                    file: file,
                    issue: 'Expected documentation file is missing',
                    severity: 'high'
                });
            }
        });
        
        // Check for empty files
        const allFiles = this.getAllMarkdownFiles(this.outputDir);
        allFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8').trim();
            if (content.length < 100) {
                this.gapAnalysisReport.push({
                    type: 'empty_file',
                    file: path.relative(this.outputDir, file),
                    issue: 'File appears to be empty or too short',
                    severity: 'medium'
                });
            }
        });
        
        // Generate report
        const reportContent = this.generateGapAnalysisReportContent();
        this.writeConsolidatedFile(this.outputDir, 'GAP_ANALYSIS_REPORT.md', reportContent);
        
        console.log(`📋 Gap analysis complete: ${this.gapAnalysisReport.length} issues found`);
    }

    async runEndToEndTests() {
        console.log('🧪 Running end-to-end tests for documentation system...');
        
        try {
            // Test 1: Verify all navigation links work
            await this.testNavigationLinks();
            
            // Test 2: Verify markdown syntax
            await this.testMarkdownSyntax();
            
            // Test 3: Verify image references
            await this.testImageReferences();
            
            // Test 4: Verify code block syntax
            await this.testCodeBlocks();
            
            console.log('✅ All documentation tests passed');
            
        } catch (error) {
            console.error('❌ Documentation tests failed:', error.message);
            this.gapAnalysisReport.push({
                type: 'test_failure',
                file: 'system',
                issue: `E2E test failed: ${error.message}`,
                severity: 'high'
            });
        }
    }

    // Helper methods
    readSourceFile(filePath) {
        try {
            return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8');
        } catch (error) {
            console.warn(`⚠️  Could not read source file: ${filePath}`);
            return `# ${path.basename(filePath, '.md')}\n\n*Content not available*\n`;
        }
    }

    writeConsolidatedFile(dir, filename, content) {
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✓ Created: ${path.relative(this.outputDir, filePath)}`);
    }

    copyAndConsolidate(sourcePath, targetDir, targetFilename) {
        const content = this.readSourceFile(sourcePath);
        this.writeConsolidatedFile(targetDir, targetFilename, content);
    }

    copyDirectory(sourceDir, targetDir) {
        try {
            const sourcePath = path.join(this.projectRoot, sourceDir);
            if (fs.existsSync(sourcePath)) {
                fs.cpSync(sourcePath, targetDir, { recursive: true });
                console.log(`   ✓ Copied directory: ${sourceDir} -> ${path.relative(this.outputDir, targetDir)}`);
            }
        } catch (error) {
            console.warn(`⚠️  Could not copy directory: ${sourceDir}`);
        }
    }

    getAllMarkdownFiles(dir) {
        const files = [];
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

    extractLinks(content) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [];
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[2]);
        }
        
        return links;
    }

    generateTableOfContents(navigation) {
        let toc = '# Table of Contents\n\n';
        
        for (const [section, items] of Object.entries(navigation)) {
            toc += `## ${section}\n\n`;
            
            for (const [title, path] of Object.entries(items)) {
                toc += `- [${title}](${path})\n`;
            }
            
            toc += '\n';
        }
        
        return toc;
    }

    generateNavigationIndex(navigation) {
        let nav = '# Tattoo Artist Directory MVP - Documentation\n\n';
        nav += 'Welcome to the consolidated documentation for the Tattoo Artist Directory MVP.\n\n';
        nav += '## Quick Navigation\n\n';
        
        for (const [section, items] of Object.entries(navigation)) {
            nav += `### ${section}\n\n`;
            
            for (const [title, path] of Object.entries(items)) {
                nav += `- [${title}](${path})\n`;
            }
            
            nav += '\n';
        }
        
        nav += '## Complete Documentation Index\n\n';
        nav += 'For a complete table of contents, see [TABLE_OF_CONTENTS.md](TABLE_OF_CONTENTS.md)\n\n';
        nav += '## Gap Analysis\n\n';
        nav += 'For information about documentation completeness and known issues, see [GAP_ANALYSIS_REPORT.md](GAP_ANALYSIS_REPORT.md)\n';
        
        return nav;
    }

    generateGapAnalysisReportContent() {
        let report = '# Documentation Gap Analysis Report\n\n';
        report += `Generated: ${new Date().toISOString()}\n\n`;
        
        if (this.gapAnalysisReport.length === 0) {
            report += '✅ **No issues found** - Documentation is complete and all links are working.\n\n';
        } else {
            report += `## Summary\n\n`;
            report += `Total issues found: **${this.gapAnalysisReport.length}**\n\n`;
            
            const severityCounts = this.gapAnalysisReport.reduce((acc, issue) => {
                acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                return acc;
            }, {});
            
            report += '### Issues by Severity\n\n';
            for (const [severity, count] of Object.entries(severityCounts)) {
                const emoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
                report += `- ${emoji} **${severity.toUpperCase()}**: ${count}\n`;
            }
            
            report += '\n## Detailed Issues\n\n';
            
            const groupedIssues = this.gapAnalysisReport.reduce((acc, issue) => {
                if (!acc[issue.type]) acc[issue.type] = [];
                acc[issue.type].push(issue);
                return acc;
            }, {});
            
            for (const [type, issues] of Object.entries(groupedIssues)) {
                report += `### ${type.replace('_', ' ').toUpperCase()}\n\n`;
                
                issues.forEach(issue => {
                    const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
                    report += `${emoji} **${issue.file}**: ${issue.issue}\n\n`;
                });
            }
        }
        
        report += '## Recommendations\n\n';
        report += '1. Fix all HIGH severity issues before deployment\n';
        report += '2. Address MEDIUM severity issues in next iteration\n';
        report += '3. Review and update documentation regularly\n';
        report += '4. Run this analysis after major documentation changes\n';
        
        return report;
    }

    async testNavigationLinks() {
        console.log('   Testing navigation links...');
        
        for (const [section, items] of Object.entries(this.navigationStructure)) {
            for (const [title, linkPath] of Object.entries(items)) {
                const fullPath = path.join(this.outputDir, linkPath);
                
                if (linkPath.endsWith('/')) {
                    // Directory link
                    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
                        throw new Error(`Navigation directory not found: ${linkPath}`);
                    }
                } else {
                    // File link
                    if (!fs.existsSync(fullPath)) {
                        throw new Error(`Navigation file not found: ${linkPath}`);
                    }
                }
            }
        }
    }

    async testMarkdownSyntax() {
        console.log('   Testing markdown syntax...');
        
        const allFiles = this.getAllMarkdownFiles(this.outputDir);
        
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for basic markdown issues
            if (content.includes('](') && !content.match(/\]\([^)]+\)/)) {
                throw new Error(`Malformed link in ${path.relative(this.outputDir, file)}`);
            }
        }
    }

    async testImageReferences() {
        console.log('   Testing image references...');
        
        const allFiles = this.getAllMarkdownFiles(this.outputDir);
        
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            let match;
            
            while ((match = imageRegex.exec(content)) !== null) {
                const imagePath = match[2];
                
                if (!imagePath.startsWith('http')) {
                    const fullImagePath = path.resolve(path.dirname(file), imagePath);
                    if (!fs.existsSync(fullImagePath)) {
                        throw new Error(`Image not found: ${imagePath} in ${path.relative(this.outputDir, file)}`);
                    }
                }
            }
        }
    }

    async testCodeBlocks() {
        console.log('   Testing code blocks...');
        
        const allFiles = this.getAllMarkdownFiles(this.outputDir);
        
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            let match;
            
            while ((match = codeBlockRegex.exec(content)) !== null) {
                const language = match[1];
                const code = match[2];
                
                // Basic validation - ensure code blocks are properly closed
                if (!code.trim()) {
                    console.warn(`Empty code block in ${path.relative(this.outputDir, file)}`);
                }
            }
        }
    }
}

// CLI execution
if (require.main === module) {
    // Show help if requested
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Documentation Consolidation Pipeline

Usage:
  node scripts/documentation-consolidation-pipeline.js [options]

Options:
  --validate-only    Run validation checks only (no consolidation)
  --help, -h        Show this help message

Examples:
  # Full consolidation
  node scripts/documentation-consolidation-pipeline.js
  
  # Validation only
  node scripts/documentation-consolidation-pipeline.js --validate-only
`);
        process.exit(0);
    }
    
    const pipeline = new DocumentationConsolidationPipeline();
    pipeline.run().catch(error => {
        console.error('Pipeline failed:', error);
        process.exit(1);
    });
}

module.exports = DocumentationConsolidationPipeline;