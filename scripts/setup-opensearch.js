#!/usr/bin/env node

/**
 * Setup OpenSearch domain in LocalStack
 * This script creates the OpenSearch domain required for the application
 */

import { execSync } from 'child_process';

const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const AWS_REGION = process.env.AWS_DEFAULT_REGION || 'eu-west-2';

console.log('🔍 Setting up OpenSearch domain in LocalStack...');

try {
    // Create OpenSearch domain using AWS CLI
    const createDomainCommand = `
        aws opensearch create-domain \\
            --domain-name tattoo-directory \\
            --elasticsearch-version 7.10 \\
            --elasticsearch-cluster-config InstanceType=t3.small.elasticsearch,InstanceCount=1 \\
            --ebs-options EBSEnabled=true,VolumeType=gp2,VolumeSize=10 \\
            --access-policies '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"es:*","Resource":"arn:aws:es:*:*:domain/tattoo-directory/*"}]}' \\
            --endpoint-url ${LOCALSTACK_ENDPOINT} \\
            --region ${AWS_REGION}
    `.replace(/\s+/g, ' ').trim();

    console.log('📋 Creating OpenSearch domain...');
    execSync(createDomainCommand, { stdio: 'inherit' });

    console.log('⏳ Waiting for domain to be ready...');
    // Wait for domain to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check domain status
    const describeDomainCommand = `
        aws opensearch describe-domain \\
            --domain-name tattoo-directory \\
            --endpoint-url ${LOCALSTACK_ENDPOINT} \\
            --region ${AWS_REGION}
    `.replace(/\s+/g, ' ').trim();

    console.log('🔍 Checking domain status...');
    execSync(describeDomainCommand, { stdio: 'inherit' });

    console.log('✅ OpenSearch domain setup completed!');

} catch (error) {
    console.error('❌ Failed to setup OpenSearch domain:', error.message);
    
    // Try alternative approach - direct HTTP calls
    console.log('🔄 Trying alternative setup method...');
    
    try {
        // Just try to create a simple index directly
        const { execSync } = await import('child_process');
        
        const curlCommand = `curl -X PUT "${LOCALSTACK_ENDPOINT}/artists-local" -H "Content-Type: application/json" -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'`;
        
        console.log('📋 Creating index directly...');
        execSync(curlCommand, { stdio: 'inherit' });
        
        console.log('✅ Direct index creation completed!');
        
    } catch (altError) {
        console.error('❌ Alternative setup also failed:', altError.message);
        console.log('💡 OpenSearch may not be properly configured in LocalStack');
        console.log('💡 Try restarting LocalStack or check the logs');
        process.exit(1);
    }
}