/**
 * Cross-Browser Testing Script
 * 
 * This script helps with cross-browser testing by:
 * 1. Taking screenshots at different viewport sizes
 * 2. Testing theme switching functionality
 * 3. Validating CSS variables and animations
 * 
 * Requirements:
 * - Next.js app should be running on http://localhost:3000
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const RESULTS_DIR = path.join(__dirname, '../browser-testing-results');
const NEXTJS_URL = 'http://localhost:3000';
const PAGES_TO_TEST = [
  '/',                  // Landing page
  '/search',            // Search page
  '/artist/1',          // Artist profile page
  '/privacy',           // Static page
];
const VIEWPORT_SIZES = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 768, name: 'small-desktop' },
  { width: 1440, height: 900, name: 'large-desktop' }
];
const THEMES = ['light', 'dark'];

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Check if Puppeteer is installed, if not install it
try {
  require.resolve('puppeteer');
} catch (error) {
  console.log('Puppeteer is not installed. Installing now...');
  execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
}

// Import puppeteer
const puppeteer = require('puppeteer');

// Helper function to take screenshots
async function takeScreenshots(browser, url, pageName) {
  console.log(`Taking screenshots for ${pageName}...`);
  
  // Create directory for this page
  const pageDir = path.join(RESULTS_DIR, pageName);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  for (const theme of THEMES) {
    for (const viewport of VIEWPORT_SIZES) {
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({
        width: viewport.width,
        height: viewport.height
      });
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      // Set theme if needed
      if (theme === 'dark') {
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        });
        
        // Wait for theme to apply
        await page.waitForTimeout(500);
      }
      
      // Take screenshot
      const screenshotPath = path.join(pageDir, `${viewport.name}-${theme}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      console.log(`  Screenshot saved: ${screenshotPath}`);
      
      // Close the page
      await page.close();
    }
  }
}

// Helper function to test theme switching
async function testThemeSwitching(browser, url) {
  console.log(`Testing theme switching on ${url}...`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  
  // Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Find theme toggle button
  const themeToggleSelector = 'button[aria-label="Toggle theme"]';
  
  try {
    await page.waitForSelector(themeToggleSelector, { timeout: 5000 });
    
    // Take screenshot before toggle
    await page.screenshot({ path: path.join(RESULTS_DIR, 'theme-before.png') });
    
    // Click theme toggle
    await page.click(themeToggleSelector);
    
    // Wait for theme to change
    await page.waitForTimeout(500);
    
    // Take screenshot after toggle
    await page.screenshot({ path: path.join(RESULTS_DIR, 'theme-after.png') });
    
    // Check if theme was stored in localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    console.log(`  Theme set to: ${theme}`);
    
    // Navigate to another page to test persistence
    if (url !== `${NEXTJS_URL}/`) {
      await page.goto(`${NEXTJS_URL}/`, { waitUntil: 'networkidle0' });
    } else {
      await page.goto(`${NEXTJS_URL}/search`, { waitUntil: 'networkidle0' });
    }
    
    // Check if theme persisted
    const persistedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    console.log(`  Theme after navigation: ${persistedTheme}`);
    
    // Take screenshot after navigation
    await page.screenshot({ path: path.join(RESULTS_DIR, 'theme-persisted.png') });
    
    console.log('  Theme switching test completed');
  } catch (error) {
    console.error(`  Error testing theme switching: ${error.message}`);
  }
  
  // Close the page
  await page.close();
}

// Helper function to validate CSS variables
async function validateCssVariables(browser, url) {
  console.log(`Validating CSS variables on ${url}...`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  
  // Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Extract CSS variables from :root
  const cssVariables = await page.evaluate(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const variables = {};
    
    for (const prop of rootStyles) {
      if (prop.startsWith('--')) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
    
    return variables;
  });
  
  // Save CSS variables to file
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'css-variables-light.json'),
    JSON.stringify(cssVariables, null, 2)
  );
  
  console.log(`  Found ${Object.keys(cssVariables).length} CSS variables in light theme`);
  
  // Switch to dark theme
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  
  // Wait for theme to apply
  await page.waitForTimeout(500);
  
  // Extract CSS variables from :root in dark theme
  const darkCssVariables = await page.evaluate(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const variables = {};
    
    for (const prop of rootStyles) {
      if (prop.startsWith('--')) {
        variables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
    
    return variables;
  });
  
  // Save CSS variables to file
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'css-variables-dark.json'),
    JSON.stringify(darkCssVariables, null, 2)
  );
  
  console.log(`  Found ${Object.keys(darkCssVariables).length} CSS variables in dark theme`);
  
  // Compare variables between themes
  const changedVariables = {};
  for (const [key, value] of Object.entries(cssVariables)) {
    if (darkCssVariables[key] && darkCssVariables[key] !== value) {
      changedVariables[key] = {
        light: value,
        dark: darkCssVariables[key]
      };
    }
  }
  
  // Save changed variables to file
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'css-variables-changes.json'),
    JSON.stringify(changedVariables, null, 2)
  );
  
  console.log(`  Found ${Object.keys(changedVariables).length} CSS variables that change between themes`);
  
  // Close the page
  await page.close();
}

// Helper function to check animations
async function checkAnimations(browser, url) {
  console.log(`Checking animations on ${url}...`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  
  // Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Extract animation-related CSS properties
  const animations = await page.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const styles = getComputedStyle(element);
      const animation = styles.animation;
      const transition = styles.transition;
      
      if (animation && animation !== 'none') {
        results.push({
          element: element.tagName,
          class: element.className,
          animation
        });
      }
      
      if (transition && transition !== 'all 0s ease 0s') {
        results.push({
          element: element.tagName,
          class: element.className,
          transition
        });
      }
    }
    
    return results;
  });
  
  // Save animations to file
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'animations.json'),
    JSON.stringify(animations, null, 2)
  );
  
  console.log(`  Found ${animations.length} elements with animations or transitions`);
  
  // Close the page
  await page.close();
}

// Main function to run tests
async function runTests() {
  console.log('Starting cross-browser and responsive testing...');
  console.log(`Results will be saved to ${RESULTS_DIR}`);
  
  // Check if Next.js app is running
  try {
    execSync('curl -s http://localhost:3000 > nul');
  } catch (error) {
    console.error('Next.js app is not running on http://localhost:3000');
    console.error('Please start the app before running this script');
    process.exit(1);
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Create timestamp for this run
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'last-run.txt'),
    `Cross-browser testing run: ${timestamp}\n`
  );
  
  // Take screenshots for each page
  for (const page of PAGES_TO_TEST) {
    const pageName = page === '/' ? 'home' : page.replace(/\//g, '-').replace(/^-/, '');
    const url = `${NEXTJS_URL}${page}`;
    
    await takeScreenshots(browser, url, pageName);
  }
  
  // Test theme switching
  await testThemeSwitching(browser, `${NEXTJS_URL}/`);
  
  // Validate CSS variables
  await validateCssVariables(browser, `${NEXTJS_URL}/`);
  
  // Check animations
  await checkAnimations(browser, `${NEXTJS_URL}/`);
  
  // Close browser
  await browser.close();
  
  console.log('\nCross-browser and responsive testing completed');
  console.log(`All results saved to ${RESULTS_DIR}`);
  console.log('\nPlease review the screenshots and test results');
  console.log('For complete testing, manually verify the application in different browsers');
}

// Run the tests
(async () => {
  try {
    await runTests();
  } catch (error) {
    console.error('Error during cross-browser testing:', error);
    process.exit(1);
  }
})();