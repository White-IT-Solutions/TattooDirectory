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

// Create a navigation testing checklist
const checklistContent = `# Navigation and Routing Testing Checklist

## Internal Navigation Links
- [ ] Home link navigates to landing page
- [ ] Search link navigates to search page
- [ ] Artist profile links navigate to correct artist pages
- [ ] All footer links work correctly
- [ ] Logo links to home page
- [ ] Navigation menu works on mobile devices

## Browser Navigation
- [ ] Browser back button works correctly after navigation
- [ ] Browser forward button works correctly
- [ ] Page refreshes maintain correct state
- [ ] Browser history is properly maintained

## Direct URL Access
- [ ] Landing page loads correctly with direct URL
- [ ] Search page loads correctly with direct URL
- [ ] Artist profile pages load correctly with direct URL (test multiple IDs)
- [ ] Static pages (Privacy, Terms, FAQ, Status) load correctly with direct URLs
- [ ] URL parameters are properly handled (e.g., search filters)

## 404 Handling
- [ ] Invalid routes show the 404 page
- [ ] Invalid artist IDs show appropriate error state
- [ ] 404 page has working navigation back to valid pages

## Notes
- Document any issues found during testing here
- Include screenshots of issues when possible
- Note browser/device information for any environment-specific issues
`;

// Write the checklist to a file
fs.writeFileSync(
  path.resolve(__dirname, '../NAVIGATION-TESTING-CHECKLIST.md'),
  checklistContent
);

console.log(`${colors.blue}Starting navigation and routing tests...${colors.reset}`);
console.log(`${colors.yellow}A NAVIGATION-TESTING-CHECKLIST.md file has been created to guide manual testing${colors.reset}`);
console.log(`${colors.yellow}Please follow the checklist to verify all navigation functionality${colors.reset}`);

try {
  // Start the development server for manual testing
  console.log(`${colors.green}Starting development server for manual testing...${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to stop the server when testing is complete${colors.reset}`);
  
  execSync('npm run dev', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
} catch (error) {
  console.error(`${colors.red}✗ Development server failed to start:${colors.reset}`, error.message);
  process.exit(1);
}