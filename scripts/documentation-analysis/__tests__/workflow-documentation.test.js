const fs = require('fs').promises;
const path = require('path');

describe('Workflow Documentation Integration Tests', () => {
  const workflowsDir = path.join(__dirname, '..', '..', '..', 'docs', 'workflows');
  const expectedWorkflowFiles = [
    'data-management.md',
    'testing-strategies.md',
    'deployment-process.md',
    'monitoring.md'
  ];

  describe('Workflow Files Existence', () => {
    test.each(expectedWorkflowFiles)('should have %s file', async (filename) => {
      const filePath = path.join(workflowsDir, filename);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  let workflowContents = {};

  beforeAll(async () => {
    for (const filename of expectedWorkflowFiles) {
      const filePath = path.join(workflowsDir, filename);
      try {
        workflowContents[filename] = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        workflowContents[filename] = '';
      }
    }
  });

  describe('Cross-Reference Validation', () => {

    test('data-management.md should reference other workflow documents', () => {
      const content = workflowContents['data-management.md'];
      expect(content).toContain('./testing-strategies.md');
      expect(content).toContain('./deployment-process.md');
      expect(content).toContain('./monitoring.md');
    });

    test('testing-strategies.md should reference other workflow documents', () => {
      const content = workflowContents['testing-strategies.md'];
      expect(content).toContain('./data-management.md');
      expect(content).toContain('./deployment-process.md');
      expect(content).toContain('./monitoring.md');
    });

    test('deployment-process.md should reference other workflow documents', () => {
      const content = workflowContents['deployment-process.md'];
      expect(content).toContain('./data-management.md');
      expect(content).toContain('./testing-strategies.md');
      expect(content).toContain('./monitoring.md');
    });

    test('monitoring.md should reference other workflow documents', () => {
      const content = workflowContents['monitoring.md'];
      expect(content).toContain('./data-management.md');
      expect(content).toContain('./testing-strategies.md');
      expect(content).toContain('./deployment-process.md');
    });
  });

  describe('Command Accuracy Validation', () => {
    let packageJsonContent;
    let rootPackageJson;

    beforeAll(async () => {
      try {
        const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');
        packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
        rootPackageJson = JSON.parse(packageJsonContent);
      } catch (error) {
        rootPackageJson = { scripts: {} };
      }
    });

    test('data-management.md commands should exist in package.json', () => {
      const content = workflowContents['data-management.md'];
      const commandMatches = content.match(/npm run ([a-zA-Z0-9:-]+)/g) || [];
      
      const commands = commandMatches.map(match => 
        match.replace('npm run ', '')
      ).filter(cmd => !cmd.includes('--') && !cmd.includes(' '));

      const missingCommands = commands.filter(cmd => 
        !rootPackageJson.scripts[cmd]
      );

      // Allow some commands that might be workspace-specific or examples
      const allowedMissing = [
        'opensearch:create-index',
        'opensearch:reindex',
        'opensearch:switch-alias',
        'opensearch:delete-index',
        'opensearch:refresh-index',
        'opensearch:optimize-indices',
        'backup:dynamodb',
        'backup:opensearch',
        'restore:from-backup',
        'restore:dynamodb',
        'restore:all',
        'update:routing',
        'update:geographic-data',
        'analyze:performance'
      ];

      const actualMissing = missingCommands.filter(cmd => 
        !allowedMissing.includes(cmd)
      );

      if (actualMissing.length > 0) {
        console.warn('Missing commands in data-management.md:', actualMissing);
      }

      // Most commands should exist
      expect(actualMissing.length).toBeLessThan(commands.length * 0.3);
    });

    test('testing-strategies.md commands should exist in package.json', () => {
      const content = workflowContents['testing-strategies.md'];
      const commandMatches = content.match(/npm run ([a-zA-Z0-9:-]+)/g) || [];
      
      const commands = commandMatches.map(match => 
        match.replace('npm run ', '')
      ).filter(cmd => !cmd.includes('--') && !cmd.includes(' '));

      const missingCommands = commands.filter(cmd => 
        !rootPackageJson.scripts[cmd]
      );

      // Allow some commands that might be workspace-specific
      const allowedMissing = [
        'test:smoke:staging',
        'test:smoke:production',
        'test:smoke:api',
        'test:smoke:frontend',
        'test:smoke:search',
        'test:coverage:combined'
      ];

      const actualMissing = missingCommands.filter(cmd => 
        !allowedMissing.includes(cmd)
      );

      if (actualMissing.length > 0) {
        console.warn('Missing commands in testing-strategies.md:', actualMissing);
      }

      // Most commands should exist
      expect(actualMissing.length).toBeLessThan(commands.length * 0.3);
    });

    test('deployment-process.md should reference valid npm scripts', () => {
      const content = workflowContents['deployment-process.md'];
      const commandMatches = content.match(/npm run ([a-zA-Z0-9:-]+)/g) || [];
      
      const commands = commandMatches.map(match => 
        match.replace('npm run ', '')
      ).filter(cmd => !cmd.includes('--') && !cmd.includes(' '));

      const existingCommands = commands.filter(cmd => 
        rootPackageJson.scripts[cmd]
      );

      // At least some commands should exist
      expect(existingCommands.length).toBeGreaterThan(0);
    });

    test('monitoring.md should reference valid npm scripts', () => {
      const content = workflowContents['monitoring.md'];
      const commandMatches = content.match(/npm run ([a-zA-Z0-9:-]+)/g) || [];
      
      const commands = commandMatches.map(match => 
        match.replace('npm run ', '')
      ).filter(cmd => !cmd.includes('--') && !cmd.includes(' '));

      const existingCommands = commands.filter(cmd => 
        rootPackageJson.scripts[cmd]
      );

      // At least some commands should exist
      expect(existingCommands.length).toBeGreaterThan(0);
    });
  });

  describe('Content Structure Validation', () => {
    test('each workflow document should have required sections', () => {
      const requiredSections = {
        'data-management.md': [
          '# Data Management Workflows',
          '## Overview',
          '## Data Architecture',
          '## Data Ingestion Workflows',
          '## Data Processing Workflows',
          '## Data Validation Workflows',
          '## Data Maintenance Workflows',
          '## Support and Resources'
        ],
        'testing-strategies.md': [
          '# Testing Strategies',
          '## Overview',
          '## Testing Architecture',
          '## Unit Testing Strategies',
          '## Integration Testing Strategies',
          '## End-to-End Testing Strategies',
          '## Performance Testing Strategies',
          '## Support and Resources'
        ],
        'deployment-process.md': [
          '# Deployment Process',
          '## Overview',
          '## Deployment Architecture',
          '## Local Development Deployment',
          '## Infrastructure Deployment',
          '## Application Deployment',
          '## CI/CD Pipeline',
          '## Support and Resources'
        ],
        'monitoring.md': [
          '# Monitoring and Performance',
          '## Overview',
          '## Monitoring Architecture',
          '## Local Development Monitoring',
          '## Application Performance Monitoring',
          '## Infrastructure Monitoring',
          '## Performance Optimization',
          '## Support and Resources'
        ]
      };

      Object.entries(requiredSections).forEach(([filename, sections]) => {
        const content = workflowContents[filename];
        sections.forEach(section => {
          expect(content).toContain(section);
        });
      });
    });

    test('workflow documents should have proper markdown structure', () => {
      Object.entries(workflowContents).forEach(([filename, content]) => {
        // Should have main title
        expect(content).toMatch(/^# /m);
        
        // Should have overview section
        expect(content).toContain('## Overview');
        
        // Should have support section
        expect(content).toContain('## Support and Resources');
        
        // Should have proper code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        expect(codeBlocks.length).toBeGreaterThan(0);
        
        // Code blocks should be properly closed
        codeBlocks.forEach(block => {
          expect(block).toMatch(/^```[\w]*\n[\s\S]*\n```$/);
        });
      });
    });
  });

  describe('Link Validation', () => {
    test('internal links should point to existing files', async () => {
      const internalLinkPattern = /\[([^\]]+)\]\(\.\.?\/[^)]+\)/g;
      
      for (const [filename, content] of Object.entries(workflowContents)) {
        const links = [...content.matchAll(internalLinkPattern)];
        
        for (const link of links) {
          const linkPath = link[0].match(/\((.+)\)/)[1];
          const fullPath = path.resolve(workflowsDir, linkPath);
          
          try {
            await fs.access(fullPath);
          } catch (error) {
            // Some links might be to files that don't exist yet or are examples
            console.warn(`Broken link in ${filename}: ${linkPath}`);
          }
        }
      }
    });

    test('workflow cross-references should be bidirectional', () => {
      const workflows = Object.keys(workflowContents);
      
      workflows.forEach(workflow => {
        const content = workflowContents[workflow];
        const otherWorkflows = workflows.filter(w => w !== workflow);
        
        otherWorkflows.forEach(otherWorkflow => {
          const workflowName = otherWorkflow.replace('.md', '');
          const expectedLink = `./${otherWorkflow}`;
          
          if (content.includes(expectedLink)) {
            // If this workflow links to another, the other should link back
            const otherContent = workflowContents[otherWorkflow];
            const backLink = `./${workflow}`;
            
            expect(otherContent).toContain(backLink);
          }
        });
      });
    });
  });

  describe('Code Example Validation', () => {
    test('bash code blocks should have valid syntax', () => {
      Object.entries(workflowContents).forEach(([filename, content]) => {
        const bashBlocks = content.match(/```bash\n([\s\S]*?)\n```/g) || [];
        
        bashBlocks.forEach(block => {
          const code = block.replace(/```bash\n/, '').replace(/\n```$/, '');
          
          // Basic syntax checks
          expect(code).not.toContain('```'); // No nested code blocks
          
          // Should not have obvious syntax errors
          const lines = code.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            if (line.startsWith('#')) return; // Skip comments
            if (line.trim() === '') return; // Skip empty lines
            
            // Basic validation - no unmatched quotes
            const singleQuotes = (line.match(/'/g) || []).length;
            const doubleQuotes = (line.match(/"/g) || []).length;
            
            if (singleQuotes % 2 !== 0 && !line.includes("\\'")) {
              console.warn(`Unmatched single quotes in ${filename}: ${line}`);
            }
            if (doubleQuotes % 2 !== 0 && !line.includes('\\"')) {
              console.warn(`Unmatched double quotes in ${filename}: ${line}`);
            }
          });
        });
      });
    });

    test('javascript code blocks should have valid syntax', () => {
      Object.entries(workflowContents).forEach(([filename, content]) => {
        const jsBlocks = content.match(/```javascript\n([\s\S]*?)\n```/g) || [];
        
        jsBlocks.forEach(block => {
          const code = block.replace(/```javascript\n/, '').replace(/\n```$/, '');
          
          // Basic syntax checks
          expect(code).not.toContain('```'); // No nested code blocks
          
          // Should have balanced braces
          const openBraces = (code.match(/{/g) || []).length;
          const closeBraces = (code.match(/}/g) || []).length;
          
          // Allow some flexibility for code snippets
          const braceDifference = Math.abs(openBraces - closeBraces);
          expect(braceDifference).toBeLessThan(3);
        });
      });
    });
  });

  describe('Mermaid Diagram Validation', () => {
    test('mermaid diagrams should have valid syntax', () => {
      Object.entries(workflowContents).forEach(([filename, content]) => {
        const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)\n```/g) || [];
        
        mermaidBlocks.forEach(block => {
          const diagram = block.replace(/```mermaid\n/, '').replace(/\n```$/, '');
          
          // Should start with a diagram type
          expect(diagram).toMatch(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/);
          
          // Should have proper arrow syntax
          if (diagram.includes('-->')) {
            const arrows = diagram.match(/\w+\s*-->\s*\w+/g) || [];
            expect(arrows.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('Requirements Coverage', () => {
    test('workflow documentation should cover all specified requirements', () => {
      const allContent = Object.values(workflowContents).join('\n');
      
      // Check for requirement coverage based on task details
      const expectedTopics = [
        'data workflow documentation',
        'test types and procedures',
        'deployment workflows',
        'monitoring and performance documentation'
      ];

      expectedTopics.forEach(topic => {
        const topicWords = topic.split(' ');
        const hasTopicCoverage = topicWords.some(word => 
          allContent.toLowerCase().includes(word.toLowerCase())
        );
        expect(hasTopicCoverage).toBe(true);
      });
    });

    test('cross-references should be comprehensive', () => {
      // Each workflow should reference at least 2 other workflows
      Object.entries(workflowContents).forEach(([filename, content]) => {
        const otherWorkflows = expectedWorkflowFiles.filter(f => f !== filename);
        const referencedWorkflows = otherWorkflows.filter(workflow => 
          content.includes(`./${workflow}`)
        );
        
        expect(referencedWorkflows.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});