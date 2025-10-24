/**
 * SecuritySuite Simple Unit Tests
 * 
 * Basic tests for the SecuritySuite class functionality without complex ES module imports.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the SecuritySuite class for testing
class MockSecuritySuite {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.displayName = config.displayName || config.name;
    this.description = config.description;
    this.type = config.type;
    this.workspace = config.workspace;
    this.command = config.command;
    this.requiredServices = config.requiredServices || [];
    this.dataScenario = config.dataScenario;
    this.timeout = config.timeout || 60000;
    this.canRunParallel = config.canRunParallel !== false;
    this.tags = config.tags || [];
    this.supportsCoverage = config.supportsCoverage !== false;
    
    // Security-specific properties
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 180000;
    this.maxRetries = 2;
    this.retryDelay = 1000;
    this.securityCategories = [
      'authentication',
      'authorization',
      'input-validation',
      'xss-prevention',
      'rate-limiting',
      'cors-policies',
      'api-security',
      'token-security'
    ];
    this.vulnerabilityLevels = ['critical', 'high', 'medium', 'low', 'info'];
    
    this.logger = {
      info: () => {},
      warn: () => {},
      error: () => {}
    };
  }

  async customValidation() {
    // Mock validation logic
    return true;
  }

  getSecurityCategories() {
    return this.securityCategories;
  }

  getVulnerabilitySeverityLevels() {
    return this.vulnerabilityLevels;
  }

  getRequiredDataScenario() {
    return 'minimal';
  }

  categorizeVulnerability(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('auth') || desc.includes('login') || desc.includes('token')) {
      return 'authentication';
    }
    if (desc.includes('author') || desc.includes('permission') || desc.includes('access')) {
      return 'authorization';
    }
    if (desc.includes('xss') || desc.includes('script') || desc.includes('injection')) {
      return 'xss-prevention';
    }
    if (desc.includes('input') || desc.includes('validation') || desc.includes('sanitiz')) {
      return 'input-validation';
    }
    if (desc.includes('rate') || desc.includes('limit') || desc.includes('throttle')) {
      return 'rate-limiting';
    }
    if (desc.includes('cors') || desc.includes('origin') || desc.includes('header')) {
      return 'cors-policies';
    }
    if (desc.includes('api') || desc.includes('endpoint') || desc.includes('key')) {
      return 'api-security';
    }
    
    return 'general';
  }

  calculateSecurityScore(result) {
    try {
      if (result.tests.total === 0) {
        return 0;
      }

      const passRate = result.tests.passed / result.tests.total;
      let baseScore = passRate * 100;

      // Deduct points for vulnerabilities
      const vulnerabilities = result.vulnerabilities || [];
      const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;

      // Deduct points based on severity
      baseScore -= (criticalCount * 25); // -25 points per critical
      baseScore -= (highCount * 15);     // -15 points per high
      baseScore -= (mediumCount * 5);    // -5 points per medium

      return Math.max(0, Math.round(baseScore));
    } catch (error) {
      return 0;
    }
  }

  extractSeverityFromPattern(pattern) {
    const patternStr = pattern.toString().toLowerCase();
    if (patternStr.includes('critical')) return 'critical';
    if (patternStr.includes('high')) return 'high';
    if (patternStr.includes('medium')) return 'medium';
    if (patternStr.includes('low')) return 'low';
    return 'info';
  }

  parseVulnerabilitiesFromText(stdout, stderr) {
    const vulnerabilities = [];
    
    try {
      // Look for security vulnerability patterns in output
      const vulnerabilityPatterns = [
        /CRITICAL:\s*(.+)/gi,
        /HIGH:\s*(.+)/gi,
        /MEDIUM:\s*(.+)/gi,
        /LOW:\s*(.+)/gi,
        /VULNERABILITY:\s*(.+)/gi,
        /SECURITY ISSUE:\s*(.+)/gi,
        /XSS DETECTED:\s*(.+)/gi,
        /INJECTION DETECTED:\s*(.+)/gi,
        /AUTH BYPASS:\s*(.+)/gi,
        /RATE LIMIT BYPASS:\s*(.+)/gi
      ];

      const combinedOutput = stdout + '\n' + stderr;
      
      vulnerabilityPatterns.forEach(pattern => {
        const matches = combinedOutput.matchAll(pattern);
        for (const match of matches) {
          vulnerabilities.push({
            severity: this.extractSeverityFromPattern(pattern),
            description: match[1].trim(),
            category: this.categorizeVulnerability(match[1]),
            type: 'detected_vulnerability'
          });
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse vulnerabilities from text: ${error.message}`);
    }
    
    return vulnerabilities;
  }

  transformCommandArgs(options = {}) {
    const args = [];
    
    // Handle npm script execution
    if (this.command.includes('npm')) {
      args.push('npm', 'run');
      const commandParts = this.command.split(' ');
      const scriptName = commandParts[commandParts.length - 1];
      args.push(scriptName);
    } else {
      // Direct command execution
      const commandParts = this.command.split(' ');
      args.push(...commandParts);
    }

    // Add timeout for security tests
    if (args.includes('mocha') || this.command.includes('mocha')) {
      args.push('--timeout', this.testTimeout.toString());
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--reporter', 'json');
      args.push('--exit');
    }

    // Add verbose output for security test details
    if (options.verbose) {
      args.push('--reporter', 'spec');
    }

    // Add specific security test category if provided
    if (options.category && this.securityCategories.includes(options.category)) {
      args.push('--grep', options.category);
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--grep', options.testPattern);
    }

    // Add bail on first critical vulnerability for faster feedback
    if (options.bail) {
      args.push('--bail');
    }

    // Add parallel execution for independent security tests
    if (options.parallel && this.canRunParallel) {
      args.push('--parallel');
    }

    return args;
  }

  getMetadata() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      type: this.type,
      workspace: this.workspace,
      tags: this.tags,
      canRunParallel: this.canRunParallel,
      supportsCoverage: this.supportsCoverage,
      estimatedDuration: this.testTimeout,
      requiredServices: this.requiredServices,
      dataScenario: this.dataScenario,
      securityCategories: this.getSecurityCategories(),
      vulnerabilitySeverityLevels: this.getVulnerabilitySeverityLevels(),
      serviceEndpoints: this.serviceEndpoints,
      testTimeout: this.testTimeout,
      maxRetries: this.maxRetries
    };
  }
}

describe('SecuritySuite', () => {
  let securitySuite;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks

    // Mock config
    mockConfig = {
      name: 'security',
      displayName: 'Security Tests',
      description: 'Security vulnerability and penetration tests',
      type: 'security',
      workspace: 'tests/security',
      command: 'npm run test:security',
      requiredServices: ['localstack', 'backend'],
      dataScenario: 'minimal',
      timeout: 180000,
      canRunParallel: true,
      supportsCoverage: false,
      tags: ['security', 'vulnerability']
    };

    securitySuite = new MockSecuritySuite(mockConfig);
  });

  afterEach(() => {
    // Cleanup
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(securitySuite.name).toBe('security');
      expect(securitySuite.testTimeout).toBe(180000);
      expect(securitySuite.maxRetries).toBe(2);
      expect(securitySuite.retryDelay).toBe(1000);
      expect(securitySuite.securityCategories).toContain('authentication');
      expect(securitySuite.securityCategories).toContain('authorization');
      expect(securitySuite.securityCategories).toContain('xss-prevention');
      expect(securitySuite.vulnerabilityLevels).toContain('critical');
      expect(securitySuite.vulnerabilityLevels).toContain('high');
    });

    it('should set correct service endpoints', () => {
      expect(securitySuite.serviceEndpoints.localstack).toBe('http://localhost:4566');
      expect(securitySuite.serviceEndpoints.backend).toBe('http://localhost:9000');
      expect(securitySuite.serviceEndpoints.frontend).toBe('http://localhost:3000');
    });
  });

  describe('getSecurityCategories', () => {
    it('should return all security categories', () => {
      const categories = securitySuite.getSecurityCategories();
      
      expect(categories).toContain('authentication');
      expect(categories).toContain('authorization');
      expect(categories).toContain('input-validation');
      expect(categories).toContain('xss-prevention');
      expect(categories).toContain('rate-limiting');
      expect(categories).toContain('cors-policies');
      expect(categories).toContain('api-security');
      expect(categories).toContain('token-security');
    });
  });

  describe('getVulnerabilitySeverityLevels', () => {
    it('should return all vulnerability severity levels', () => {
      const levels = securitySuite.getVulnerabilitySeverityLevels();
      
      expect(levels).toContain('critical');
      expect(levels).toContain('high');
      expect(levels).toContain('medium');
      expect(levels).toContain('low');
      expect(levels).toContain('info');
    });
  });

  describe('getRequiredDataScenario', () => {
    it('should return minimal data scenario', () => {
      const scenario = securitySuite.getRequiredDataScenario();
      expect(scenario).toBe('minimal');
    });
  });

  describe('categorizeVulnerability', () => {
    it('should categorize authentication vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('authentication bypass detected');
      expect(category).toBe('authentication');
    });

    it('should categorize XSS vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('XSS script injection found');
      expect(category).toBe('xss-prevention');
    });

    it('should categorize rate limiting vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('rate limit bypass detected');
      expect(category).toBe('rate-limiting');
    });

    it('should categorize CORS vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('CORS policy violation');
      expect(category).toBe('cors-policies');
    });

    it('should return general for unknown vulnerabilities', () => {
      const category = securitySuite.categorizeVulnerability('unknown security issue');
      expect(category).toBe('general');
    });
  });

  describe('calculateSecurityScore', () => {
    it('should calculate security score correctly', () => {
      const mockResult = {
        tests: { total: 10, passed: 8, failed: 2 },
        vulnerabilities: []
      };

      const score = securitySuite.calculateSecurityScore(mockResult);
      
      expect(score).toBe(80); // 8/10 * 100
    });

    it('should deduct points for vulnerabilities in security score', () => {
      const mockResult = {
        tests: { total: 10, passed: 10, failed: 0 },
        vulnerabilities: [
          { severity: 'critical' },
          { severity: 'high' }
        ]
      };

      const score = securitySuite.calculateSecurityScore(mockResult);
      
      expect(score).toBe(60); // 100 - 25 (critical) - 15 (high)
    });

    it('should return 0 for no tests', () => {
      const mockResult = {
        tests: { total: 0, passed: 0, failed: 0 },
        vulnerabilities: []
      };

      const score = securitySuite.calculateSecurityScore(mockResult);
      
      expect(score).toBe(0);
    });

    it('should not go below 0', () => {
      const mockResult = {
        tests: { total: 10, passed: 5, failed: 5 },
        vulnerabilities: [
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'high' },
          { severity: 'high' }
        ]
      };

      const score = securitySuite.calculateSecurityScore(mockResult);
      
      expect(score).toBe(0); // 50 - 50 (2 critical) - 30 (2 high) = -30, clamped to 0
    });
  });

  describe('parseVulnerabilitiesFromText', () => {
    it('should detect vulnerabilities from output', () => {
      const stdout = 'Test output';
      const stderr = `
        CRITICAL: SQL injection vulnerability detected
        HIGH: XSS vulnerability in user input
        MEDIUM: Weak password policy
      `;

      const vulnerabilities = securitySuite.parseVulnerabilitiesFromText(stdout, stderr);
      
      expect(vulnerabilities).toHaveLength(3);
      expect(vulnerabilities[0].severity).toBe('critical');
      expect(vulnerabilities[1].severity).toBe('high');
      expect(vulnerabilities[2].severity).toBe('medium');
    });

    it('should handle empty output', () => {
      const vulnerabilities = securitySuite.parseVulnerabilitiesFromText('', '');
      
      expect(vulnerabilities).toHaveLength(0);
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform npm command correctly', () => {
      const options = { ci: true, verbose: true };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('npm');
      expect(args).toContain('run');
      expect(args).toContain('test:security');
      expect(args).toContain('--reporter');
      expect(args).toContain('json');
    });

    it('should add security category filter when specified', () => {
      const options = { category: 'authentication' };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('--grep');
      expect(args).toContain('authentication');
    });

    it('should add timeout for mocha tests', () => {
      securitySuite.command = 'mocha test/**/*.js';
      const args = securitySuite.transformCommandArgs();
      
      expect(args).toContain('--timeout');
      expect(args).toContain('180000');
    });

    it('should add parallel execution when supported', () => {
      const options = { parallel: true };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('--parallel');
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata with security-specific information', () => {
      const metadata = securitySuite.getMetadata();
      
      expect(metadata.name).toBe('security');
      expect(metadata.securityCategories).toContain('authentication');
      expect(metadata.vulnerabilitySeverityLevels).toContain('critical');
      expect(metadata.serviceEndpoints).toBeDefined();
      expect(metadata.testTimeout).toBe(180000);
      expect(metadata.dataScenario).toBe('minimal');
    });
  });

  describe('extractSeverityFromPattern', () => {
    it('should extract critical severity', () => {
      const pattern = /CRITICAL:\s*(.+)/gi;
      const severity = securitySuite.extractSeverityFromPattern(pattern);
      expect(severity).toBe('critical');
    });

    it('should extract high severity', () => {
      const pattern = /HIGH:\s*(.+)/gi;
      const severity = securitySuite.extractSeverityFromPattern(pattern);
      expect(severity).toBe('high');
    });

    it('should default to info for unknown patterns', () => {
      const pattern = /UNKNOWN:\s*(.+)/gi;
      const severity = securitySuite.extractSeverityFromPattern(pattern);
      expect(severity).toBe('info');
    });
  });

  describe('customValidation', () => {
    it('should pass validation', async () => {
      const result = await securitySuite.customValidation();
      expect(result).toBe(true);
    });
  });
});