/**
 * Architecture Documentation Integration Tests
 * 
 * Tests to verify the completeness and accuracy of architecture documentation
 * against the actual system implementation and requirements.
 */

const fs = require('fs').promises;
const path = require('path');

describe('Architecture Documentation Tests', () => {
  let systemOverview, dataModels, apiDesign;
  let packageJson, frontendPackageJson, backendPackageJson;

  beforeAll(async () => {
    // Load architecture documentation - use absolute path from project root
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const docsPath = path.join(projectRoot, 'docs', 'architecture');
    
    systemOverview = await fs.readFile(
      path.join(docsPath, 'system-overview.md'), 
      'utf-8'
    );
    dataModels = await fs.readFile(
      path.join(docsPath, 'data-models.md'), 
      'utf-8'
    );
    apiDesign = await fs.readFile(
      path.join(docsPath, 'api-design.md'), 
      'utf-8'
    );

    // Load package.json files for technology verification
    packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
    );
    frontendPackageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'frontend', 'package.json'), 'utf-8')
    );
    backendPackageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'backend', 'package.json'), 'utf-8')
    );
  });

  describe('System Overview Documentation', () => {
    test('should contain all required sections', () => {
      const requiredSections = [
        'Introduction',
        'Architecture Philosophy',
        'High-Level Architecture',
        'System Components',
        'Data Flow Architecture',
        'Performance Architecture',
        'Security Architecture',
        'Monitoring & Observability',
        'Development Architecture',
        'Technology Stack Summary'
      ];

      requiredSections.forEach(section => {
        expect(systemOverview).toMatch(new RegExp(`#+ ${section}`, 'i'));
      });
    });

    test('should include Mermaid diagrams for architecture visualization', () => {
      expect(systemOverview).toContain('```mermaid');
      expect(systemOverview).toMatch(/graph TB|sequenceDiagram|stateDiagram/);
    });

    test('should document performance targets matching requirements', () => {
      expect(systemOverview).toContain('<300ms');
      expect(systemOverview).toContain('<500ms');
      expect(systemOverview).toContain('99.9%');
      expect(systemOverview).toContain('Lighthouse score: 90+');
    });

    test('should reference actual technology stack', () => {
      // Verify Next.js version
      expect(systemOverview).toContain('Next.js 14+');
      
      // Verify AWS services
      const awsServices = [
        'API Gateway',
        'Lambda',
        'DynamoDB',
        'OpenSearch',
        'CloudFront',
        'S3',
        'Step Functions',
        'Fargate'
      ];
      
      awsServices.forEach(service => {
        expect(systemOverview).toContain(service);
      });
    });

    test('should document serverless architecture principles', () => {
      expect(systemOverview).toContain('Serverless-First');
      expect(systemOverview).toContain('Event-Driven');
      expect(systemOverview).toContain('Single-Table Design');
      expect(systemOverview).toContain('Infrastructure as Code');
    });
  });

  describe('Data Models Documentation', () => {
    test('should contain all required data model sections', () => {
      const requiredSections = [
        'Data Architecture Overview',
        'DynamoDB Single-Table Design',
        'Core Data Models',
        'Supporting Data Types',
        'OpenSearch Index Mapping',
        'Data Validation Schemas',
        'Performance Considerations'
      ];

      requiredSections.forEach(section => {
        expect(dataModels).toMatch(new RegExp(`#+ ${section}`, 'i'));
      });
    });

    test('should include ER diagram for data relationships', () => {
      expect(dataModels).toContain('```mermaid');
      expect(dataModels).toContain('erDiagram');
      expect(dataModels).toContain('ARTIST');
      expect(dataModels).toContain('STUDIO');
      expect(dataModels).toContain('PORTFOLIO_IMAGE');
    });

    test('should document DynamoDB key patterns correctly', () => {
      expect(dataModels).toContain('PK: "ARTIST#{artistId}"');
      expect(dataModels).toContain('SK: "METADATA"');
      expect(dataModels).toContain('GSI1PK');
      expect(dataModels).toContain('GSI2PK');
      expect(dataModels).toContain('GSI3PK');
    });

    test('should include TypeScript interfaces for data models', () => {
      expect(dataModels).toContain('interface Artist');
      expect(dataModels).toContain('interface Studio');
      expect(dataModels).toContain('interface PortfolioImage');
      expect(dataModels).toContain('interface ContactInfo');
    });

    test('should document validation schemas with Zod', () => {
      expect(dataModels).toContain('import { z } from \'zod\'');
      expect(dataModels).toContain('ArtistSchema');
      expect(dataModels).toContain('z.object');
    });

    test('should include OpenSearch mapping configuration', () => {
      expect(dataModels).toContain('"mappings"');
      expect(dataModels).toContain('"properties"');
      expect(dataModels).toContain('"type": "keyword"');
      expect(dataModels).toContain('"type": "text"');
      expect(dataModels).toContain('"type": "geo_point"');
    });
  });

  describe('API Design Documentation', () => {
    test('should contain all required API design sections', () => {
      const requiredSections = [
        'API Architecture Overview',
        'API Design Principles',
        'Core API Endpoints',
        'Authentication & Authorization',
        'Error Handling',
        'Circuit Breaker Implementation',
        'Request/Response Validation',
        'Performance Optimization'
      ];

      requiredSections.forEach(section => {
        expect(apiDesign).toMatch(new RegExp(`#+ ${section}`, 'i'));
      });
    });

    test('should document RESTful API endpoints', () => {
      const endpoints = [
        'GET /v1/artists/search',
        'GET /v1/artists/{artistId}',
        'GET /v1/studios/{studioId}',
        'GET /v1/health'
      ];

      endpoints.forEach(endpoint => {
        expect(apiDesign).toContain(endpoint);
      });
    });

    test('should include comprehensive error handling with RFC 9457', () => {
      expect(apiDesign).toContain('RFC 9457');
      expect(apiDesign).toContain('Problem Details');
      expect(apiDesign).toContain('"type":');
      expect(apiDesign).toContain('"title":');
      expect(apiDesign).toContain('"status":');
      expect(apiDesign).toContain('"detail":');
    });

    test('should document circuit breaker pattern', () => {
      expect(apiDesign).toContain('Circuit Breaker');
      expect(apiDesign).toContain('```mermaid');
      expect(apiDesign).toContain('stateDiagram');
      expect(apiDesign).toContain('Closed');
      expect(apiDesign).toContain('Open');
      expect(apiDesign).toContain('HalfOpen');
    });

    test('should include request/response validation with Zod', () => {
      expect(apiDesign).toContain('import { z } from \'zod\'');
      expect(apiDesign).toContain('SearchQuerySchema');
      expect(apiDesign).toContain('ArtistResponseSchema');
    });

    test('should document performance targets', () => {
      expect(apiDesign).toContain('<300ms');
      expect(apiDesign).toContain('p95');
      expect(apiDesign).toContain('Rate Limiting');
      expect(apiDesign).toContain('Caching');
    });
  });

  describe('Cross-Reference Validation', () => {
    test('should have consistent technology references across documents', () => {
      const technologies = ['DynamoDB', 'OpenSearch'];
      
      technologies.forEach(tech => {
        expect(systemOverview).toContain(tech);
        expect(dataModels).toContain(tech);
        expect(apiDesign).toContain(tech);
      });

      // Check Next.js and Lambda are in system overview and API design
      expect(systemOverview).toContain('Next.js');
      expect(apiDesign).toContain('Lambda');
      expect(systemOverview).toContain('API Gateway');
    });

    test('should reference actual package.json dependencies', () => {
      // Check frontend dependencies
      const frontendDeps = Object.keys({
        ...frontendPackageJson.dependencies,
        ...frontendPackageJson.devDependencies
      });

      expect(frontendDeps).toContain('next');
      expect(frontendDeps).toContain('react');
      expect(frontendDeps).toContain('tailwindcss');

      // Verify documentation mentions these
      expect(systemOverview).toContain('Next.js');
      expect(systemOverview).toContain('React');
      expect(systemOverview).toContain('Tailwind');
    });

    test('should reference actual backend dependencies', () => {
      const backendDeps = Object.keys({
        ...backendPackageJson.dependencies,
        ...backendPackageJson.devDependencies
      });

      expect(backendDeps).toContain('@aws-sdk/client-dynamodb');
      expect(backendDeps).toContain('@opensearch-project/opensearch');

      // Verify documentation mentions these
      expect(systemOverview).toContain('DynamoDB');
      expect(systemOverview).toContain('OpenSearch');
    });

    test('should have consistent data model references', () => {
      const dataModelTerms = ['Artist', 'Studio'];
      
      dataModelTerms.forEach(term => {
        expect(dataModels).toContain(term);
        expect(apiDesign).toContain(term.toLowerCase());
      });

      // Check specific model references
      expect(dataModels).toContain('ContactInfo');
      expect(apiDesign).toContain('contactInfo');
      expect(dataModels).toContain('PortfolioImage');
      expect(apiDesign).toContain('portfolioImages');
    });
  });

  describe('Documentation Quality', () => {
    test('should have proper markdown structure', () => {
      const docs = [systemOverview, dataModels, apiDesign];
      
      docs.forEach(doc => {
        // Should have main title
        expect(doc).toMatch(/^# /m);
        
        // Should have proper heading hierarchy
        expect(doc).toMatch(/^## /m);
        expect(doc).toMatch(/^### /m);
        
        // Should have code blocks
        expect(doc).toContain('```');
      });
    });

    test('should include practical examples', () => {
      // API design should have request/response examples
      expect(apiDesign).toContain('Example Request:');
      expect(apiDesign).toContain('Response Format:');
      expect(apiDesign).toContain('```json');
      expect(apiDesign).toContain('```http');

      // Data models should have TypeScript examples
      expect(dataModels).toContain('```typescript');
      expect(dataModels).toContain('interface');
    });

    test('should have comprehensive table documentation', () => {
      const docs = [systemOverview, dataModels, apiDesign];
      
      docs.forEach(doc => {
        // Should contain tables with proper markdown format
        if (doc.includes('|')) {
          expect(doc).toMatch(/\|.*\|.*\|/);
          expect(doc).toMatch(/\|[-\s]*\|[-\s]*\|/);
        }
      });
    });
  });

  describe('Requirements Compliance', () => {
    test('should address requirement 3.2 (component-specific documentation)', () => {
      expect(systemOverview).toContain('Frontend Layer');
      expect(systemOverview).toContain('API Layer');
      expect(systemOverview).toContain('Data Storage Layer');
      expect(systemOverview).toContain('Processing Layer');
    });

    test('should address requirement 3.3 (system architecture)', () => {
      expect(systemOverview).toContain('High-Level Architecture');
      expect(systemOverview).toContain('System Components');
      expect(systemOverview).toContain('Data Flow Architecture');
      
      expect(dataModels).toContain('Data Architecture Overview');
      expect(apiDesign).toContain('API Architecture Overview');
    });

    test('should include diagrams for system architecture', () => {
      const mermaidCount = (systemOverview.match(/```mermaid/g) || []).length;
      expect(mermaidCount).toBeGreaterThanOrEqual(3);
      
      expect(dataModels).toContain('```mermaid');
      expect(apiDesign).toContain('```mermaid');
    });
  });

  describe('File Structure Validation', () => {
    test('should have all architecture documentation files', async () => {
      const projectRoot = path.resolve(__dirname, '..', '..', '..');
      const docsPath = path.join(projectRoot, 'docs', 'architecture');
      
      const files = await fs.readdir(docsPath);
      expect(files).toContain('system-overview.md');
      expect(files).toContain('data-models.md');
      expect(files).toContain('api-design.md');
    });

    test('should have proper file sizes (comprehensive documentation)', () => {
      // Each file should be substantial (>5KB for comprehensive documentation)
      expect(systemOverview.length).toBeGreaterThan(5000);
      expect(dataModels.length).toBeGreaterThan(5000);
      expect(apiDesign.length).toBeGreaterThan(5000);
    });
  });
});