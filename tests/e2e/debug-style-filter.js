const TestSetup = require('./setup/test-setup');
const config = require('./config/test-config');

async function debugStyleFilter() {
  const testSetup = new TestSetup();
  
  try {
    await testSetup.waitForServices();
    const { page } = await testSetup.initBrowser();
    
    await testSetup.navigateToPage(config.urls.frontend);
    
    console.log('Current URL:', page.url());
    
    // Check if style filter exists
    const styleFilterExists = await testSetup.elementExists(config.selectors.styleFilter);
    console.log('Style filter exists:', styleFilterExists);
    
    if (styleFilterExists) {
      // Look for style buttons within the filter
      const styleButtons = await page.$$('[data-testid="style-filter"] button');
      console.log('Found style buttons:', styleButtons.length);
      
      if (styleButtons.length > 0) {
        // Click the first style button
        await styleButtons[0].click();
        console.log('Clicked first style button');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        console.log('New URL:', page.url());
        
        // Check if we're on the artists page
        const isArtistsPage = page.url().includes('/artists');
        console.log('Is on artists page:', isArtistsPage);
        
        // Check for search results
        const searchResults = await testSetup.elementExists(config.selectors.searchResults);
        console.log('Search results found:', searchResults);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-style-filter.png', fullPage: true });
    console.log('Screenshot saved as debug-style-filter.png');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await testSetup.cleanup();
  }
}

debugStyleFilter();