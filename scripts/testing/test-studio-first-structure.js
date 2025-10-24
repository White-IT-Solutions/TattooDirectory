#!/usr/bin/env node

/**
 * Test Studio-First Structure
 * Validates the new studio-first organization and data pipeline
 */

const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('../data-config');

class StudioFirstStructureTest {
  constructor() {
    this.config = DATA_CONFIG;
    this.studioImagesDir = this.config.paths.studioImageSourceDir;
    this.results = {
      totalStudios: 0,
      studiosWithMetadata: 0,
      studiosWithImages: 0,
      totalImages: 0,
      imagesByType: {
        external: 0,
        internal: 0,
        working: 0
      },
      errors: []
    };
  }

  /**
   * Run comprehensive test of studio-first structure
   */
  async runTests() {
    console.log('🧪 Testing Studio-First Structure');
    console.log('================================\n');

    try {
      await this.testDirectoryStructure();
      await this.testStudioMetadata();
      await this.testImageCategorization();
      await this.testManifestFile();
      await this.generateReport();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Test basic directory structure
   */
  async testDirectoryStructure() {
    console.log('📁 Testing directory structure...');
    
    if (!fs.existsSync(this.studioImagesDir)) {
      throw new Error(`Studio images directory not found: ${this.studioImagesDir}`);
    }

    const entries = fs.readdirSync(this.studioImagesDir, { withFileTypes: true });
    const studioDirectories = entries.filter(entry => entry.isDirectory());
    const files = entries.filter(entry => entry.isFile());
    
    this.results.totalStudios = studioDirectories.length;
    
    console.log(`   Found ${studioDirectories.length} studio directories`);
    console.log(`   Found ${files.length} files in root`);
    
    // Check for expected files
    const expectedFiles = ['studio-test-manifest.json', 'all_studios_metadata.json'];
    for (const expectedFile of expectedFiles) {
      const filePath = path.join(this.studioImagesDir, expectedFile);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ Found ${expectedFile}`);
      } else {
        console.log(`   ⚠️  Missing ${expectedFile}`);
      }
    }
    
    console.log('   ✅ Directory structure test passed\n');
  }

  /**
   * Test studio metadata
   */
  async testStudioMetadata() {
    console.log('📋 Testing studio metadata...');
    
    const studioDirectories = fs.readdirSync(this.studioImagesDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    for (const studioDir of studioDirectories.slice(0, 10)) { // Test first 10 studios
      const studioPath = path.join(this.studioImagesDir, studioDir);
      const metadataPath = path.join(studioPath, 'studio_info.json');
      
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          // Validate required fields
          const requiredFields = ['name', 'location', 'type'];
          const missingFields = requiredFields.filter(field => !metadata[field]);
          
          if (missingFields.length === 0) {
            this.results.studiosWithMetadata++;
          } else {
            this.results.errors.push(`${studioDir}: Missing fields - ${missingFields.join(', ')}`);
          }
          
        } catch (error) {
          this.results.errors.push(`${studioDir}: Invalid JSON - ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ ${this.results.studiosWithMetadata} studios have valid metadata`);
    console.log('   ✅ Metadata test passed\n');
  }

  /**
   * Test image categorization
   */
  async testImageCategorization() {
    console.log('🖼️  Testing image categorization...');
    
    const studioDirectories = fs.readdirSync(this.studioImagesDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    for (const studioDir of studioDirectories.slice(0, 10)) { // Test first 10 studios
      const studioPath = path.join(this.studioImagesDir, studioDir);
      
      const imageFiles = fs.readdirSync(studioPath)
        .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));
      
      if (imageFiles.length > 0) {
        this.results.studiosWithImages++;
        this.results.totalImages += imageFiles.length;
        
        // Categorize images
        const external = imageFiles.filter(f => f.includes('external'));
        const internal = imageFiles.filter(f => f.includes('internal'));
        const working = imageFiles.filter(f => f.includes('working'));
        
        this.results.imagesByType.external += external.length;
        this.results.imagesByType.internal += internal.length;
        this.results.imagesByType.working += working.length;
        
        console.log(`   ${studioDir}: ${imageFiles.length} images (${external.length}ext, ${internal.length}int, ${working.length}work)`);
      }
    }
    
    console.log(`   ✅ ${this.results.studiosWithImages} studios have images`);
    console.log(`   ✅ Total images: ${this.results.totalImages}`);
    console.log('   ✅ Image categorization test passed\n');
  }

  /**
   * Test manifest file
   */
  async testManifestFile() {
    console.log('📄 Testing manifest file...');
    
    const manifestPath = path.join(this.studioImagesDir, 'studio-test-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Studio test manifest not found');
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Validate manifest structure
      const requiredSections = ['studioTestManifest'];
      const manifestData = manifest.studioTestManifest;
      
      if (!manifestData) {
        throw new Error('Invalid manifest structure');
      }
      
      const requiredFields = ['version', 'description', 'structure', 'totalStudios', 'studios'];
      const missingFields = requiredFields.filter(field => !manifestData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Manifest missing fields: ${missingFields.join(', ')}`);
      }
      
      console.log(`   ✅ Manifest version: ${manifestData.version}`);
      console.log(`   ✅ Structure type: ${manifestData.structure}`);
      console.log(`   ✅ Studios in manifest: ${manifestData.totalStudios}`);
      console.log('   ✅ Manifest test passed\n');
      
    } catch (error) {
      throw new Error(`Manifest validation failed: ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  async generateReport() {
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Studios: ${this.results.totalStudios}`);
    console.log(`Studios with Metadata: ${this.results.studiosWithMetadata}`);
    console.log(`Studios with Images: ${this.results.studiosWithImages}`);
    console.log(`Total Images: ${this.results.totalImages}`);
    console.log('\nImages by Type:');
    console.log(`  External: ${this.results.imagesByType.external}`);
    console.log(`  Internal: ${this.results.imagesByType.internal}`);
    console.log(`  Working: ${this.results.imagesByType.working}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n⚠️  Errors Found:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Save detailed report
    const reportPath = path.join(this.studioImagesDir, 'structure-test-report.json');
    const report = {
      testDate: new Date().toISOString(),
      structure: 'studio-first',
      results: this.results,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved: ${reportPath}`);
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.studiosWithMetadata < this.results.totalStudios) {
      recommendations.push('Some studios are missing metadata files (studio_info.json)');
    }
    
    if (this.results.studiosWithImages < this.results.totalStudios) {
      recommendations.push('Some studios have no images - consider adding test images');
    }
    
    const avgImagesPerStudio = this.results.totalImages / this.results.studiosWithImages;
    if (avgImagesPerStudio < 2) {
      recommendations.push('Consider adding more images per studio for better test coverage');
    }
    
    if (this.results.errors.length > 0) {
      recommendations.push('Fix metadata validation errors listed above');
    }
    
    return recommendations;
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new StudioFirstStructureTest();
  tester.runTests().catch(console.error);
}

module.exports = StudioFirstStructureTest;