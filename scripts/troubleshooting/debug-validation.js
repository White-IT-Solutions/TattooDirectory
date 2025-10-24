#!/usr/bin/env node

/**
 * Debug script to show detailed validation errors
 */

const { HealthMonitor } = require('../utilities/health-monitor');
const { DATA_CONFIG } = require('../data-config');

async function debugValidation() {
  console.log('🔍 Running detailed validation check...\n');
  
  const healthMonitor = new HealthMonitor(DATA_CONFIG);
  
  try {
    const healthResult = await healthMonitor.performHealthCheck();
    
    if (healthResult.data && healthResult.data.studioValidation) {
      const validation = healthResult.data.studioValidation;
      
      console.log('📊 Studio Validation Summary:');
      console.log(`   Total Studios: ${validation.totalStudios}`);
      console.log(`   Valid Studios: ${validation.validStudios}`);
      console.log(`   Validation Rate: ${validation.validationRate}\n`);
      
      if (validation.validationErrors && validation.validationErrors.length > 0) {
        console.log('❌ Validation Errors:');
        validation.validationErrors.slice(0, 10).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.type || 'Unknown'}: ${error.field || 'N/A'} - ${error.message || 'No message'}`);
        });
        if (validation.validationErrors.length > 10) {
          console.log(`   ... and ${validation.validationErrors.length - 10} more errors\n`);
        } else {
          console.log('');
        }
      }
      
      if (validation.relationshipErrors && validation.relationshipErrors.length > 0) {
        console.log('🔗 Relationship Errors:');
        validation.relationshipErrors.slice(0, 10).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.type || 'Unknown'}: ${error.artistId || error.studioId || 'N/A'} - ${error.message || 'No message'}`);
        });
        if (validation.relationshipErrors.length > 10) {
          console.log(`   ... and ${validation.relationshipErrors.length - 10} more errors\n`);
        } else {
          console.log('');
        }
      }
      
      if (validation.addressErrors && validation.addressErrors.length > 0) {
        console.log('📍 Address Errors:');
        validation.addressErrors.slice(0, 5).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.field || 'Unknown'}: ${error.studioId || 'N/A'} - ${error.message || 'No message'}`);
        });
        if (validation.addressErrors.length > 5) {
          console.log(`   ... and ${validation.addressErrors.length - 5} more errors\n`);
        } else {
          console.log('');
        }
      }
      
      if (validation.imageErrors && validation.imageErrors.length > 0) {
        console.log('🖼️  Image Errors:');
        validation.imageErrors.slice(0, 5).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.type || 'Unknown'}: ${error.studioId || 'N/A'} - ${error.imageUrl || 'No URL'}`);
        });
        if (validation.imageErrors.length > 5) {
          console.log(`   ... and ${validation.imageErrors.length - 5} more errors\n`);
        } else {
          console.log('');
        }
      }
      
    } else {
      console.log('❌ No validation data available');
    }
    
  } catch (error) {
    console.error('❌ Debug validation failed:', error.message);
  }
}

debugValidation();