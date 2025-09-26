/**
 * Environment Verification Script
 * 
 * Verifies that all required services are running and accessible
 */

import { testLocalStackConnection, testAPIConnection } from './test-clients.js';
import TestDataManager from './test-data-manager.js';
import { testConfig } from '../config/test-config.js';

async function verifyEnvironment() {
    console.log('🔍 Verifying test environment...\n');

    const checks = [
        {
            name: 'LocalStack Connection',
            test: testLocalStackConnection,
            required: true
        },
        {
            name: 'API Connection',
            test: testAPIConnection,
            required: true
        },
        {
            name: 'AWS Services',
            test: async () => {
                const dataManager = new TestDataManager();
                await dataManager.waitForServices(5, 1000);
                return true;
            },
            required: true
        },
        {
            name: 'OpenSearch Index',
            test: async () => {
                const dataManager = new TestDataManager();
                await dataManager.ensureOpenSearchIndex();
                return true;
            },
            required: true
        }
    ];

    let allPassed = true;

    for (const check of checks) {
        process.stdout.write(`Checking ${check.name}... `);
        
        try {
            const result = await check.test();
            if (result) {
                console.log('✅ PASS');
            } else {
                console.log('❌ FAIL');
                if (check.required) {
                    allPassed = false;
                }
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            if (check.required) {
                allPassed = false;
            }
        }
    }

    console.log('\n📋 Configuration:');
    console.log(`  API URL: ${testConfig.api.baseUrl}`);
    console.log(`  LocalStack: ${testConfig.localstack.endpoint}`);
    console.log(`  DynamoDB Table: ${testConfig.dynamodb.tableName}`);
    console.log(`  OpenSearch Index: ${testConfig.opensearch.indexName}`);

    if (allPassed) {
        console.log('\n✅ Environment verification passed! Ready to run tests.');
        process.exit(0);
    } else {
        console.log('\n❌ Environment verification failed! Please check your setup.');
        console.log('\nTroubleshooting:');
        console.log('1. Ensure Docker is running');
        console.log('2. Start local environment: npm run local:start');
        console.log('3. Wait for all services to be ready');
        console.log('4. Check service logs: npm run local:logs');
        process.exit(1);
    }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyEnvironment().catch(error => {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    });
}