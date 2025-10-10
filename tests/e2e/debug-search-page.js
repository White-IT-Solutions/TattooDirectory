#!/usr/bin/env node

/**
 * Debug script to check search page functionality
 */

const puppeteer = require('puppeteer');

async function debugSearchPage() {
  console.log('🔍 Debugging search page...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 100 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to search page
    console.log('📍 Navigating to search page...');
    await page.goto('http://localhost:3000/search?q=traditional', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Check if search input exists
    console.log('🔍 Checking for search input...');
    const searchInput = await page.$('[data-testid="search-input"]');
    console.log('Search input found:', !!searchInput);
    
    // Check if search button exists
    console.log('🔍 Checking for search button...');
    const searchButton = await page.$('[data-testid="search-button"]');
    console.log('Search button found:', !!searchButton);
    
    // Check if search results container exists
    console.log('🔍 Checking for search results...');
    const searchResults = await page.$('[data-testid="search-results"]');
    console.log('Search results found:', !!searchResults);
    
    // Check all elements with data-testid
    console.log('🔍 All elements with data-testid:');
    const testIds = await page.$$eval('[data-testid]', elements => 
      elements.map(el => el.getAttribute('data-testid'))
    );
    console.log('Found test IDs:', testIds);
    
    // Check page content
    console.log('🔍 Page title:', await page.title());
    
    // Check for any JavaScript errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Wait a bit more
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:');
      errors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-search-page.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-search-page.png');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  debugSearchPage().catch(console.error);
}

module.exports = { debugSearchPage };