#!/usr/bin/env node

/**
 * Test script to verify environment configuration
 * Run with: node scripts/test-config.js
 */

// Mock environment variables for testing
const testEnvironments = [
  {
    name: 'Local Development',
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_ENVIRONMENT: 'local'
    }
  },
  {
    name: 'Development Environment',
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
      NEXT_PUBLIC_API_URL_DEV: 'https://dev-api.example.com'
    }
  },
  {
    name: 'Production Environment',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_ENVIRONMENT: 'production',
      NEXT_PUBLIC_API_URL_PROD: 'https://prod-api.example.com'
    }
  },
  {
    name: 'Fallback Configuration',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://fallback-api.example.com'
    }
  }
];

console.log('🧪 Testing Frontend Environment Configuration\n');

testEnvironments.forEach((test, index) => {
  console.log(`${index + 1}. Testing: ${test.name}`);
  
  // Set environment variables
  Object.keys(test.env).forEach(key => {
    process.env[key] = test.env[key];
  });
  
  try {
    // Clear require cache to get fresh config
    delete require.cache[require.resolve('../src/lib/config.js')];
    const config = require('../src/lib/config.js');
    
    console.log(`   Environment: ${config.getEnvironment()}`);
    console.log(`   API URL: ${config.getApiUrl()}`);
    console.log(`   Is Development: ${config.isDevelopment()}`);
    console.log(`   Is Production: ${config.isProduction()}`);
    console.log('   ✅ Configuration loaded successfully\n');
  } catch (error) {
    console.log(`   ❌ Error loading configuration: ${error.message}\n`);
  }
  
  // Clean up environment variables
  Object.keys(test.env).forEach(key => {
    delete process.env[key];
  });
});

console.log('🎉 Configuration testing complete!');
console.log('\nTo test in browser environment:');
console.log('1. Start the development server: npm run dev');
console.log('2. Open browser console and check for "API Config:" messages');
console.log('3. Verify the correct API URL is being used for your environment');