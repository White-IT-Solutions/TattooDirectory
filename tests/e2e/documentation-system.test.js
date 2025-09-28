/**
 * End-to-End Tests for Complete Documentation System
 * Tests the consolidated documentation structure and functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Documentation System E2E Tests', () => {
    const projectRoot = process.cwd();
    const consolidatedDocsDir = path.join(projectRoot, 'docs', 'consolidated');
    
    beforeAll(async () => {
        // Ensure consolidated docs exist
        if (!fs.existsSync(consolidatedDocsDir)) {
            console.log('Running documentation consolidation...');
            execSync('npm run docs:consolidate', { stdio: 'inherit' });
        }
    });

    describe('Documentation Structure', () => {
        test('should have all required main sections', () => {
            const expectedSections = [
                'getting-started',
                'architecture',
                'development', 
                'deployment',
                'reference',
                'troubleshooting'
            ];

            expectedSections.forEach(section => {
                const sectionPath = path.join(consolidatedDocsDir, section);
                expect(fs.existsSync(sectionPath)).toBe(true);
                expect(fs.statSync(sectionPath).isDirectory()).toBe(true);
            });
        });

        test('should have main navigation files', () => {
            const navigationFiles = [
                'README.md',
                'TABLE_OF_CONTENTS.md',
                'GAP_ANALYSIS_REPORT.md'
            ];

            navigationFiles.forEach(file => {
                const filePath = path.join(consolidatedDocsDir, file);
                expect(fs.existsSync(filePath)).toBe(true);
                
                const content = fs.readFileSync(filePath, 'utf8');
                expect(content.length).toBeGreaterThan(100);
            });
        });

        test('should have required documentation files in each section', () => {
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
                    const filePath = path.join(consolidatedDocsDir, section, file);
                    expect(fs.existsSync(filePath)).toBe(true);
                });
            });
        });
    });

    describe('Cross-References and Links', () => {
        test('should have working internal links', () => {
            const allMarkdownFiles = getAllMarkdownFiles(consolidatedDocsDir);
            const brokenLinks = [];

            allMarkdownFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                const links = extractInternalLinks(content);

                links.forEach(link => {
                    const targetPath = path.resolve(path.dirname(file), link);
                    if (!fs.existsSync(targetPath)) {
                        brokenLinks.push({
                            file: path.relative(consolidatedDocsDir, file),
                            link: link
                        });
                    }
                });
            });

            if (brokenLinks.length > 0) {
                console.log('Broken links found:', brokenLinks);
            }
            expect(brokenLinks.length).toBe(0);
        });

        test('should have valid image references', () => {
            const allMarkdownFiles = getAllMarkdownFiles(consolidatedDocsDir);
            const brokenImages = [];

            allMarkdownFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                const images = extractImageReferences(content);

                images.forEach(image => {
                    if (!image.startsWith('http')) {
                        const imagePath = path.resolve(path.dirname(file), image);
                        if (!fs.existsSync(imagePath)) {
                            brokenImages.push({
                                file: path.relative(consolidatedDocsDir, file),
                                image: image
                            });
                        }
                    }
                });
            });

            expect(brokenImages.length).toBe(0);
        });
    }); 
   describe('Content Quality', () => {
        test('should have non-empty documentation files', () => {
            const allMarkdownFiles = getAllMarkdownFiles(consolidatedDocsDir);
            const emptyFiles = [];

            allMarkdownFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8').trim();
                if (content.length < 50) {
                    emptyFiles.push(path.relative(consolidatedDocsDir, file));
                }
            });

            expect(emptyFiles.length).toBe(0);
        });

        test('should have proper markdown syntax', () => {
            const allMarkdownFiles = getAllMarkdownFiles(consolidatedDocsDir);
            const syntaxErrors = [];

            allMarkdownFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for malformed links
                const malformedLinks = content.match(/\]\([^)]*$/gm);
                if (malformedLinks) {
                    syntaxErrors.push({
                        file: path.relative(consolidatedDocsDir, file),
                        error: 'Malformed links found'
                    });
                }

                // Check for unclosed code blocks
                const codeBlocks = content.match(/```/g);
                if (codeBlocks && codeBlocks.length % 2 !== 0) {
                    syntaxErrors.push({
                        file: path.relative(consolidatedDocsDir, file),
                        error: 'Unclosed code blocks'
                    });
                }
            });

            expect(syntaxErrors.length).toBe(0);
        });

        test('should have consistent heading structure', () => {
            const allMarkdownFiles = getAllMarkdownFiles(consolidatedDocsDir);
            const headingIssues = [];

            allMarkdownFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n');
                
                let hasH1 = false;
                let previousLevel = 0;

                lines.forEach((line, index) => {
                    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
                    if (headingMatch) {
                        const level = headingMatch[1].length;
                        
                        if (level === 1) {
                            hasH1 = true;
                        }

                        // Check for heading level jumps
                        if (previousLevel > 0 && level > previousLevel + 1) {
                            headingIssues.push({
                                file: path.relative(consolidatedDocsDir, file),
                                line: index + 1,
                                error: `Heading level jump from H${previousLevel} to H${level}`
                            });
                        }

                        previousLevel = level;
                    }
                });

                // Every markdown file should have at least one H1
                if (!hasH1 && content.trim().length > 0) {
                    headingIssues.push({
                        file: path.relative(consolidatedDocsDir, file),
                        error: 'Missing H1 heading'
                    });
                }
            });

            if (headingIssues.length > 0) {
                console.log('Heading structure issues:', headingIssues);
            }
            expect(headingIssues.length).toBe(0);
        });
    });

    describe('Navigation System', () => {
        test('should have working table of contents', () => {
            const tocPath = path.join(consolidatedDocsDir, 'TABLE_OF_CONTENTS.md');
            const tocContent = fs.readFileSync(tocPath, 'utf8');
            
            // Extract all links from TOC
            const links = extractInternalLinks(tocContent);
            const brokenTocLinks = [];

            links.forEach(link => {
                const targetPath = path.resolve(consolidatedDocsDir, link);
                if (!fs.existsSync(targetPath)) {
                    brokenTocLinks.push(link);
                }
            });

            expect(brokenTocLinks.length).toBe(0);
        });

        test('should have comprehensive main README', () => {
            const readmePath = path.join(consolidatedDocsDir, 'README.md');
            const readmeContent = fs.readFileSync(readmePath, 'utf8');

            // Should contain navigation sections
            expect(readmeContent).toMatch(/Quick Navigation/i);
            expect(readmeContent).toMatch(/Getting Started/i);
            expect(readmeContent).toMatch(/Architecture/i);
            expect(readmeContent).toMatch(/Development/i);
            expect(readmeContent).toMatch(/Deployment/i);
            expect(readmeContent).toMatch(/Reference/i);
            expect(readmeContent).toMatch(/Troubleshooting/i);
        });
    });    descr
ibe('Gap Analysis', () => {
        test('should generate comprehensive gap analysis report', () => {
            const gapReportPath = path.join(consolidatedDocsDir, 'GAP_ANALYSIS_REPORT.md');
            expect(fs.existsSync(gapReportPath)).toBe(true);

            const reportContent = fs.readFileSync(gapReportPath, 'utf8');
            
            // Should contain required sections
            expect(reportContent).toMatch(/# Documentation Gap Analysis Report/);
            expect(reportContent).toMatch(/## Summary/);
            expect(reportContent).toMatch(/## Recommendations/);
            
            // Should have timestamp
            expect(reportContent).toMatch(/Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        test('should identify and report documentation gaps', () => {
            const gapReportPath = path.join(consolidatedDocsDir, 'GAP_ANALYSIS_REPORT.md');
            const reportContent = fs.readFileSync(gapReportPath, 'utf8');

            // If there are issues, they should be properly categorized
            if (reportContent.includes('Total issues found:')) {
                expect(reportContent).toMatch(/Issues by Severity/);
                expect(reportContent).toMatch(/Detailed Issues/);
            }
        });
    });

    describe('Integration with Build System', () => {
        test('should be runnable via npm scripts', () => {
            // Test that the consolidation pipeline can be run
            expect(() => {
                execSync('npm run docs:consolidate --dry-run', { stdio: 'pipe' });
            }).not.toThrow();
        });

        test('should validate documentation structure', () => {
            // Run validation and check exit code
            const result = execSync('node scripts/documentation-consolidation-pipeline.js --validate-only', { 
                stdio: 'pipe',
                encoding: 'utf8'
            });
            
            expect(result).toMatch(/Documentation consolidation completed successfully/);
        });
    });
});

// Helper functions
function getAllMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...getAllMarkdownFiles(fullPath));
        } else if (item.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function extractInternalLinks(content) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
        const link = match[2];
        // Only internal links (relative paths)
        if (!link.startsWith('http') && !link.startsWith('mailto:')) {
            links.push(link);
        }
    }
    
    return links;
}

function extractImageReferences(content) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
        images.push(match[2]);
    }
    
    return images;
}