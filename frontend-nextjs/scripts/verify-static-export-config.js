const fs = require('fs');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Verifying Next.js static export configuration...${colors.reset}`);

// Check next.config.js
try {
  const nextConfigPath = path.resolve(__dirname, '../next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = require(nextConfigPath);
    console.log(`${colors.blue}Checking next.config.js:${colors.reset}`);
    
    // Check output setting
    if (nextConfig.output === 'export') {
      console.log(`${colors.green}✓ output: 'export' is correctly set${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ output: 'export' is not set correctly${colors.reset}`);
    }
    
    // Check trailingSlash setting
    if (nextConfig.trailingSlash === true) {
      console.log(`${colors.green}✓ trailingSlash: true is correctly set${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ trailingSlash: true is not set correctly${colors.reset}`);
    }
    
    // Check images.unoptimized setting
    if (nextConfig.images && nextConfig.images.unoptimized === true) {
      console.log(`${colors.green}✓ images.unoptimized: true is correctly set${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ images.unoptimized: true is not set correctly${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ next.config.js not found${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}✗ Error checking next.config.js:${colors.reset}`, error.message);
}

// Check package.json for build script
try {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    console.log(`${colors.blue}Checking package.json build script:${colors.reset}`);
    
    if (packageJson.scripts && packageJson.scripts.build === 'next build') {
      console.log(`${colors.green}✓ build script is correctly set to 'next build'${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ build script is not set to 'next build'${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ package.json not found${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}✗ Error checking package.json:${colors.reset}`, error.message);
}

// Check for server-side only code
console.log(`${colors.blue}Checking for potential server-side only code:${colors.reset}`);

// List of directories to check
const dirsToCheck = ['app', 'components', 'lib', 'hooks'];
const serverSidePatterns = [
  'getServerSideProps',
  'getInitialProps',
  'headers()',
  'cookies()',
  'unstable_cache',
  'revalidatePath',
  'revalidateTag',
  'redirect(',
  'notFound('
];

let serverSideFound = false;

dirsToCheck.forEach(dir => {
  const dirPath = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`${colors.yellow}Checking ${dir} directory...${colors.reset}`);
    
    // Simple recursive function to check files
    function checkDirectory(directory) {
      const files = fs.readdirSync(directory);
      
      files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          checkDirectory(filePath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for server-side patterns
            for (const pattern of serverSidePatterns) {
              if (content.includes(pattern)) {
                console.log(`${colors.red}✗ Potential server-side code found in ${filePath}: ${pattern}${colors.reset}`);
                serverSideFound = true;
              }
            }
            
            // Check for 'use server' directive
            if (content.includes("'use server'") || content.includes('"use server"')) {
              console.log(`${colors.red}✗ 'use server' directive found in ${filePath}${colors.reset}`);
              serverSideFound = true;
            }
          } catch (error) {
            console.error(`${colors.red}✗ Error reading file ${filePath}:${colors.reset}`, error.message);
          }
        }
      });
    }
    
    try {
      checkDirectory(dirPath);
    } catch (error) {
      console.error(`${colors.red}✗ Error checking directory ${dirPath}:${colors.reset}`, error.message);
    }
  }
});

if (!serverSideFound) {
  console.log(`${colors.green}✓ No obvious server-side only code patterns found${colors.reset}`);
}

console.log(`${colors.blue}Static export configuration verification complete${colors.reset}`);
console.log(`${colors.yellow}Please use the STATIC-EXPORT-CHECKLIST.md file to manually verify the static export${colors.reset}`);