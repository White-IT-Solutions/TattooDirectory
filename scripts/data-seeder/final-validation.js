#!/usr/bin/env node

/**
 * Final Validation Script for Data Seeder System
 * 
 * This script performs comprehensive validation of all data seeder components:
 * - Data management operations (seed, reset, validate)
 * - API endpoint functionality
 * - Data integrity and consistency
 * - Performance benchmarks
 * - Error handling scenarios
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import our utilities
const DataManager = require('./data-manager');
const DataValidator = require('./data-validator');
const { TestUtilities } = require('./test-utilities');

class FinalValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            errors: [],
            performance: {}
        };
        this.dataManager = new DataManager();
        this.validator = new DataValidator();
        this.testUtils = new TestUtilities();
    }

    async runValidation() {
        console.log('🚀 Starting Final Validation of Data Seeder System\n');
        
        try {
            await this.validateEnvironment();
            await this.validateDataOperations();
            await this.validateAPIEndpoints();
            await this.validateDataIntegrity();
            await this.validatePerformance();
            await this.validateErrorHandling();
            
            this.printResults();
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('📋 Validating Environment Setup...');
        
        // Check required files exist
        const requiredFiles = [
            'data-manager.js',
            'data-validator.js',
            'selective-seeder.js',
            'data-reset.js',
            'test-utilities.js',
            'package.json'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(__dirname, file))) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check backend is accessible
        try {
            const response = await this.testUtils.makeRequest('GET', '/health');
            if (response.status !== 200) {
                throw new Error('Backend health check failed');
            }
            this.pass('Environment setup');
        } catch (error) {
            this.fail('Environment setup', error.message);
        }
    }

    async validateDataOperations() {
        console.log('\n📊 Validating Data Operations...');
        
        try {
            // Test data reset
            console.log('  Testing data reset...');
            await this.dataManager.resetAllData();
            this.pass('Data reset operation');

            // Test selective seeding
            console.log('  Testing selective seeding...');
            const seedResult = await this.dataManager.seedData({
                artists: 5,
                studios: 3,
                styles: 10
            });
            
            if (seedResult.success && seedResult.counts.artists === 5) {
                this.pass('Selective seeding');
            } else {
                this.fail('Selective seeding', 'Incorrect seed counts');
            }

            // Test data validation
            console.log('  Testing data validation...');
            const validationResult = await this.validator.validateAllData();
            if (validationResult.isValid) {
                this.pass('Data validation');
            } else {
                this.fail('Data validation', `${validationResult.errors.length} validation errors`);
            }

        } catch (error) {
            this.fail('Data operations', error.message);
        }
    }

    async validateAPIEndpoints() {
        console.log('\n🌐 Validating API Endpoints...');
        
        const endpoints = [
            { method: 'GET', path: '/artists', description: 'List artists' },
            { method: 'GET', path: '/studios', description: 'List studios' },
            { method: 'GET', path: '/styles', description: 'List styles' },
            { method: 'GET', path: '/search', description: 'Search functionality' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.testUtils.makeRequest(endpoint.method, endpoint.path);
                if (response.status === 200) {
                    this.pass(`API ${endpoint.method} ${endpoint.path}`);
                } else {
                    this.fail(`API ${endpoint.method} ${endpoint.path}`, `Status: ${response.status}`);
                }
            } catch (error) {
                this.fail(`API ${endpoint.method} ${endpoint.path}`, error.message);
            }
        }
    }

    async validateDataIntegrity() {
        console.log('\n🔍 Validating Data Integrity...');
        
        try {
            // Check artist-studio relationships
            const artists = await this.testUtils.makeRequest('GET', '/artists');
            const studios = await this.testUtils.makeRequest('GET', '/studios');
            
            if (artists.data && studios.data) {
                const artistStudioIds = artists.data.map(a => a.studioId).filter(Boolean);
                const studioIds = studios.data.map(s => s.id);
                
                const orphanedArtists = artistStudioIds.filter(id => !studioIds.includes(id));
                if (orphanedArtists.length === 0) {
                    this.pass('Artist-Studio relationships');
                } else {
                    this.fail('Artist-Studio relationships', `${orphanedArtists.length} orphaned references`);
                }
            }

            // Check data consistency
            const validationResult = await this.validator.validateDataConsistency();
            if (validationResult.consistent) {
                this.pass('Data consistency');
            } else {
                this.fail('Data consistency', validationResult.issues.join(', '));
            }

        } catch (error) {
            this.fail('Data integrity', error.message);
        }
    }

    async validatePerformance() {
        console.log('\n⚡ Validating Performance...');
        
        try {
            // Test API response times
            const startTime = Date.now();
            await this.testUtils.makeRequest('GET', '/artists');
            const responseTime = Date.now() - startTime;
            
            this.results.performance.apiResponseTime = responseTime;
            
            if (responseTime < 500) {
                this.pass(`API response time (${responseTime}ms)`);
            } else {
                this.fail(`API response time (${responseTime}ms)`, 'Exceeds 500ms target');
            }

            // Test data seeding performance
            const seedStart = Date.now();
            await this.dataManager.seedData({ artists: 10 });
            const seedTime = Date.now() - seedStart;
            
            this.results.performance.seedTime = seedTime;
            
            if (seedTime < 5000) {
                this.pass(`Data seeding performance (${seedTime}ms)`);
            } else {
                this.fail(`Data seeding performance (${seedTime}ms)`, 'Exceeds 5s target');
            }

        } catch (error) {
            this.fail('Performance validation', error.message);
        }
    }

    async validateErrorHandling() {
        console.log('\n🛡️ Validating Error Handling...');
        
        try {
            // Test invalid API requests
            const invalidResponse = await this.testUtils.makeRequest('GET', '/invalid-endpoint');
            if (invalidResponse.status === 404) {
                this.pass('404 error handling');
            } else {
                this.fail('404 error handling', `Expected 404, got ${invalidResponse.status}`);
            }

            // Test malformed data handling
            try {
                await this.dataManager.seedData({ artists: 'invalid' });
                this.fail('Invalid input handling', 'Should have thrown error');
            } catch (error) {
                this.pass('Invalid input handling');
            }

        } catch (error) {
            this.fail('Error handling validation', error.message);
        }
    }

    pass(testName) {
        console.log(`  ✅ ${testName}`);
        this.results.passed++;
    }

    fail(testName, reason) {
        console.log(`  ❌ ${testName}: ${reason}`);
        this.results.failed++;
        this.results.errors.push({ test: testName, reason });
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL VALIDATION RESULTS');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
        
        if (Object.keys(this.results.performance).length > 0) {
            console.log('\n⚡ Performance Metrics:');
            Object.entries(this.results.performance).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}ms`);
            });
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(error => {
                console.log(`  • ${error.test}: ${error.reason}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (this.results.failed === 0) {
            console.log('🎉 ALL VALIDATIONS PASSED! Data seeder system is ready for use.');
            process.exit(0);
        } else {
            console.log('⚠️  Some validations failed. Please review and fix issues before proceeding.');
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new FinalValidator();
    validator.runValidation().catch(error => {
        console.error('Validation script failed:', error);
        process.exit(1);
    });
}

module.exports = FinalValidator;