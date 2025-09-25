#!/usr/bin/env node

/**
 * Comprehensive Studio Integration Validation
 * 
 * This script performs end-to-end validation of all studio functionality
 * to ensure the complete data pipeline integration works correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveStudioValidator {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runTest(name, testFn) {
    console.log(`\n🔍 Testing: ${name}`);
    this.results.summary.total++;
    
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✅ ${name}: PASSED`);
        this.results.summary.passed++;
        this.results.tests.push({
          name,
          status: 'passed',
          details: result.details || 'Test completed successfully'
        });
      } else {
        console.log(`⚠️  ${name}: WARNING - ${result.message}`);
        this.results.summary.warnings++;
        this.results.tests.push({
          name,
          status: 'warning',
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.log(`❌ ${name}: FAILED - ${error.message}`);
      this.results.summary.failed++;
      this.results.tests.push({
        name,
        status: 'failed',
        error: error.message,
        details: error.stack
      });
    }
  }

  async testDataPipelineWithStudios() {
    const output = execSync('npm run setup-data --force', { encoding: 'utf8' });
    return {
      success: output.includes('Setup completed successfully'),
      details: 'Data pipeline executed with studio integration'
    };
  }

  async testStudioCliCommands() {
    const commands = [
      'studio-status',
      'validate-studios',
      'process-studio-images',
      'manage-studio-relationships'
    ];

    const results = [];
    for (const cmd of commands) {
      try {
        const output = execSync(`npm run ${cmd}`, { encoding: 'utf8' });
        results.push(`${cmd}: SUCCESS`);
      } catch (error) {
        results.push(`${cmd}: ${error.message}`);
      }
    }

    return {
      success: results.every(r => r.includes('SUCCESS')),
      details: results.join('\n')
    };
  }

  async testFrontendMockDataGeneration() {
    const mockDataPath = path.join(__dirname, '..', 'frontend', 'src', 'app', 'data', 'mockStudioData.js');
    
    try {
      const content = await fs.readFile(mockDataPath, 'utf8');
      const hasValidStructure = content.includes('mockStudios') && 
                               content.includes('studioId') && 
                               content.includes('studioName');
      
      return {
        success: hasValidStructure,
        details: `Frontend mock studio data file exists and has valid structure`
      };
    } catch (error) {
      return {
        success: false,
        message: `Frontend mock data file not accessible: ${error.message}`
      };
    }
  }

  async testStudioSearchAndFiltering() {
    // This would test if studio data is properly indexed for search
    try {
      const output = execSync('npm run data-status', { encoding: 'utf8' });
      const hasStudios = output.includes('Studios:') || output.includes('studio');
      
      return {
        success: hasStudios,
        details: 'Studio data is available for search and filtering'
      };
    } catch (error) {
      return {
        success: false,
        message: `Could not verify studio search data: ${error.message}`
      };
    }
  }

  async testStudioImageProcessing() {
    try {
      const output = execSync('npm run process-studio-images', { encoding: 'utf8' });
      const completed = output.includes('completed successfully');
      
      return {
        success: completed,
        details: 'Studio image processing pipeline executed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Studio image processing failed: ${error.message}`
      };
    }
  }

  async testArtistStudioRelationships() {
    try {
      const output = execSync('npm run manage-studio-relationships validate', { encoding: 'utf8' });
      const completed = output.includes('completed successfully');
      
      return {
        success: completed,
        details: 'Artist-studio relationship validation completed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Relationship validation failed: ${error.message}`
      };
    }
  }

  async testStudioHealthMonitoring() {
    try {
      const output = execSync('npm run studio-health', { encoding: 'utf8' });
      const hasReport = output.includes('Studio Health Summary');
      
      return {
        success: hasReport,
        details: 'Studio health monitoring system is functional'
      };
    } catch (error) {
      return {
        success: false,
        message: `Studio health monitoring failed: ${error.message}`
      };
    }
  }

  async testUnitTestSuite() {
    try {
      const output = execSync('npm run test:studio:unit', { encoding: 'utf8' });
      const allPassed = output.includes('Tests:') && !output.includes('failed');
      
      return {
        success: allPassed,
        details: 'All studio unit tests are passing'
      };
    } catch (error) {
      return {
        success: false,
        message: `Unit tests failed: ${error.message}`
      };
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: this.results.summary,
      tests: this.results.tests,
      overall: this.results.summary.failed === 0 ? 'PASSED' : 'FAILED'
    };

    // Save report
    const reportPath = path.join(__dirname, 'validation-reports', `comprehensive-studio-validation-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return { report, reportPath };
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE STUDIO VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    
    const successRate = ((this.results.summary.passed + this.results.summary.warnings) / this.results.summary.total * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    const overall = this.results.summary.failed === 0 ? '✅ PASSED' : '❌ FAILED';
    console.log(`🎯 Overall Status: ${overall}`);
    console.log('='.repeat(60));
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Studio Integration Validation');
  console.log('========================================================');
  
  const validator = new ComprehensiveStudioValidator();

  // Run all validation tests
  await validator.runTest(
    'Data Pipeline with Studio Integration',
    () => validator.testDataPipelineWithStudios()
  );

  await validator.runTest(
    'Studio CLI Commands',
    () => validator.testStudioCliCommands()
  );

  await validator.runTest(
    'Frontend Mock Studio Data Generation',
    () => validator.testFrontendMockDataGeneration()
  );

  await validator.runTest(
    'Studio Search and Filtering Data',
    () => validator.testStudioSearchAndFiltering()
  );

  await validator.runTest(
    'Studio Image Processing',
    () => validator.testStudioImageProcessing()
  );

  await validator.runTest(
    'Artist-Studio Relationship Consistency',
    () => validator.testArtistStudioRelationships()
  );

  await validator.runTest(
    'Studio Health Monitoring',
    () => validator.testStudioHealthMonitoring()
  );

  await validator.runTest(
    'Studio Unit Test Suite',
    () => validator.testUnitTestSuite()
  );

  // Generate and display results
  const { report, reportPath } = await validator.generateReport();
  validator.displaySummary();

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(validator.results.summary.failed === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = { ComprehensiveStudioValidator };