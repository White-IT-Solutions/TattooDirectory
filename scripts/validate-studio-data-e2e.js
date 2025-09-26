#!/usr/bin/env node

/**
 * Studio End-to-End Data Validation CLI
 * 
 * Runs comprehensive validation of studio data across all services
 * to ensure consistency and data integrity.
 */

const StudioEndToEndValidator = require('./data-management/studio-end-to-end-validator');
const { ENHANCED_DATA_CONFIG } = require('./data-config');

async function main() {
  console.log('🔍 Studio End-to-End Data Validation');
  console.log('=====================================');
  
  try {
    // Initialize validator
    const validator = new StudioEndToEndValidator(ENHANCED_DATA_CONFIG);
    
    // Run comprehensive validation
    const report = await validator.validateStudioDataEndToEnd();
    
    // Display results
    console.log('\n📊 Validation Results Summary');
    console.log('==============================');
    console.log(`Total Checks: ${report.summary.totalChecks}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`Overall Status: ${report.summary.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Display detailed results
    if (report.details) {
      console.log('\n📋 Detailed Results');
      console.log('===================');
      
      if (report.details.dynamoOpenSearchConsistency) {
        const consistency = report.details.dynamoOpenSearchConsistency;
        console.log(`\n🔄 DynamoDB-OpenSearch Consistency:`);
        console.log(`   DynamoDB Studios: ${consistency.dynamoCount}`);
        console.log(`   OpenSearch Studios: ${consistency.opensearchCount}`);
        console.log(`   Consistent: ${consistency.consistent ? '✅' : '❌'}`);
      }
      
      if (report.details.imageAccessibility) {
        const images = report.details.imageAccessibility;
        console.log(`\n🖼️  Image Accessibility:`);
        console.log(`   Studios with Images: ${images.studiosWithImages}`);
        console.log(`   Total Images Checked: ${images.totalImagesChecked}`);
        console.log(`   Accessible Images: ${images.accessibleImages}`);
        console.log(`   Inaccessible Images: ${images.inaccessibleImages}`);
      }
      
      if (report.details.artistStudioRelationships) {
        const relationships = report.details.artistStudioRelationships;
        console.log(`\n🔗 Artist-Studio Relationships:`);
        console.log(`   Valid Relationships: ${relationships.validRelationships}`);
        console.log(`   Invalid Relationships: ${relationships.invalidRelationships}`);
        console.log(`   Studios with Artists: ${relationships.studiosWithArtists}/${relationships.totalStudios}`);
        console.log(`   Artists with Studios: ${relationships.artistsWithStudios}/${relationships.totalArtists}`);
      }
      
      if (report.details.frontendMockConsistency) {
        const frontend = report.details.frontendMockConsistency;
        console.log(`\n🎭 Frontend Mock Data Consistency:`);
        console.log(`   Backend Studios: ${frontend.backendStudios}`);
        console.log(`   Frontend Studios: ${frontend.frontendStudios}`);
        console.log(`   Consistent Studios: ${frontend.consistentStudios}`);
        console.log(`   Inconsistent Studios: ${frontend.inconsistentStudios}`);
      }
      
      if (report.details.addressValidation) {
        const addresses = report.details.addressValidation;
        console.log(`\n📍 Address Validation:`);
        console.log(`   Total Studios: ${addresses.totalStudios}`);
        console.log(`   Valid Addresses: ${addresses.validAddresses}`);
        console.log(`   Invalid Addresses: ${addresses.invalidAddresses}`);
      }
      
      if (report.details.specialtyAlignment) {
        const specialties = report.details.specialtyAlignment;
        console.log(`\n🎨 Specialty Alignment:`);
        console.log(`   Total Studios: ${specialties.totalStudios}`);
        console.log(`   Aligned Studios: ${specialties.alignedStudios}`);
        console.log(`   Misaligned Studios: ${specialties.misalignedStudios}`);
      }
    }
    
    // Display errors
    if (report.errors && report.errors.length > 0) {
      console.log('\n❌ Errors Found');
      console.log('===============');
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`);
      });
    }
    
    // Display warnings
    if (report.warnings && report.warnings.length > 0) {
      console.log('\n⚠️  Warnings');
      console.log('============');
      report.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.type}] ${warning.message}`);
      });
    }
    
    // Save detailed report
    const fs = require('fs').promises;
    const path = require('path');
    const reportPath = path.join(__dirname, 'validation-reports', `studio-e2e-validation-${Date.now()}.json`);
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (saveError) {
      console.warn(`⚠️  Could not save detailed report: ${saveError.message}`);
    }
    
    // Exit with appropriate code
    process.exit(report.summary.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Studio End-to-End Data Validation

Usage: node validate-studio-data-e2e.js [options]

Options:
  --help, -h     Show this help message
  
This script performs comprehensive validation of studio data across all services:
- DynamoDB studio records match OpenSearch indices
- Studio images are accessible via S3 URLs  
- Artist-studio relationships are bidirectional and consistent
- Frontend mock data matches backend seeded data structure
- Studio address data accuracy and postcode format
- Studio specialties match assigned artist styles

The validation report will be saved to the validation-reports directory.
`);
  process.exit(0);
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main };