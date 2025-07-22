const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const handler = require('serve-handler');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Create a static export testing checklist
const checklistContent = `# Static Export Testing Checklist

## Build Process
- [ ] \`next build\` completes successfully
- [ ] Static files are generated in the \`out\` directory
- [ ] No server-side code remains in the build

## Routes Verification
- [ ] Landing page works in static mode
- [ ] Search page works in static mode
- [ ] Artist profile pages work with pre-rendered routes
- [ ] All static pages (Privacy, Terms, FAQ, Status) work
- [ ] 404 page works for invalid routes

## Asset Verification
- [ ] All images load correctly
- [ ] CSS styles are applied correctly
- [ ] Fonts load properly
- [ ] Icons and SVGs display correctly
- [ ] No missing assets or 404 errors in browser console

## Functionality Testing
- [ ] Client-side navigation works between pages
- [ ] Search functionality works in static mode
- [ ] Filtering and sorting work correctly
- [ ] Dynamic content loads properly via API calls
- [ ] Forms submit correctly

## Deployment Readiness
- [ ] All file paths use relative URLs
- [ ] No hardcoded absolute paths
- [ ] Asset paths work correctly in subdirectory deployment
- [ ] No environment-specific code that would break in production

## Notes
- Document any issues found during testing here
- Include screenshots of issues when possible
- Note browser/device information for any environment-specific issues
`;

// Write the checklist to a file
fs.writeFileSync(
  path.resolve(__dirname, '../STATIC-EXPORT-CHECKLIST.md'),
  checklistContent
);

console.log(`${colors.blue}Testing Next.js static export build process...${colors.reset}`);
console.log(`${colors.yellow}A STATIC-EXPORT-CHECKLIST.md file has been created to guide testing${colors.reset}`);

try {
  // Step 1: Run the build process
  console.log(`${colors.yellow}Running Next.js build with static export...${colors.reset}`);
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log(`${colors.green}✓ Build completed successfully!${colors.reset}`);
  
  // Step 2: Verify the output directory exists
  const outDir = path.resolve(__dirname, '../out');
  if (fs.existsSync(outDir)) {
    console.log(`${colors.green}✓ Static export directory 'out' exists${colors.reset}`);
    
    // List the files in the out directory
    const files = fs.readdirSync(outDir);
    console.log(`${colors.blue}Files in the 'out' directory:${colors.reset}`);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // Check for index.html
    if (files.includes('index.html')) {
      console.log(`${colors.green}✓ Landing page (index.html) exists${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Landing page (index.html) not found${colors.reset}`);
    }
    
    // Check for key directories
    ['search', 'artist', 'privacy', 'terms', 'faq', 'status'].forEach(dir => {
      if (files.includes(dir)) {
        console.log(`${colors.green}✓ '${dir}' directory exists${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ '${dir}' directory not found${colors.reset}`);
      }
    });
    
    // Step 3: Start a local server to test the static files
    console.log(`${colors.yellow}Starting local server to test static files...${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to stop the server when testing is complete${colors.reset}`);
    
    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: outDir,
        rewrites: [
          { source: '**', destination: '/index.html' }
        ]
      });
    });
    
    server.listen(3000, () => {
      console.log(`${colors.green}Server running at http://localhost:3000${colors.reset}`);
      console.log(`${colors.yellow}Please use the STATIC-EXPORT-CHECKLIST.md file to verify the static export${colors.reset}`);
    });
  } else {
    console.log(`${colors.red}✗ Static export directory 'out' not found${colors.reset}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`${colors.red}✗ Static export build failed:${colors.reset}`, error.message);
  process.exit(1);
}