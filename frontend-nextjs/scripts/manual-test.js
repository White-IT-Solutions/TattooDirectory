const { execSync } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Starting Next.js development server for manual testing...${colors.reset}`);
console.log(`${colors.yellow}Please use the TESTING-CHECKLIST.md file to manually verify all pages${colors.reset}`);
console.log(`${colors.yellow}Press Ctrl+C to stop the server when testing is complete${colors.reset}`);

try {
  // Run the development server
  execSync('npm run dev', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
} catch (error) {
  console.error(`${colors.red}✗ Development server failed to start:${colors.reset}`, error.message);
  process.exit(1);
}