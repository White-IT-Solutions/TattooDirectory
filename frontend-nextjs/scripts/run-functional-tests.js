const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Starting functional tests for Next.js pages...${colors.reset}`);

try {
  // Run the tests
  console.log(`${colors.yellow}Running Jest tests for page components...${colors.reset}`);
  execSync('npm test -- --testPathPattern=__tests__/pages/functional-tests.test.tsx', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log(`${colors.green}✓ All functional tests completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Functional tests failed:${colors.reset}`, error.message);
  process.exit(1);
}