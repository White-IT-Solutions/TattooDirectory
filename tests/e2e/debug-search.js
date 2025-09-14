const TestSetup = require('./setup/test-setup');
const config = require('./config/test-config');

async function debugSearch() {
  const testSetup = new TestSetup();
  
  try {
    await testSetup.waitForServices();
    const { page } = await testSetup.initBrowser();
    
    await testSetup.navigateToPage(config.urls.frontend);
    
    console.log('Current URL:', page.url());
    
    // Type in search input
    await testSetup.typeText(config.selectors.searchInput, 'traditional');
    console.log('Typed "traditional" in search input');
    
    // Click search button
    await testSetup.clickElement(config.selectors.searchButton);
    console.log('Clicked search button');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    console.log('New URL:', page.url());
    
    // Check if we're on the artists page
    const isArtistsPage = page.url().includes('/artists');
    console.log('Is on artists page:', isArtistsPage);
    
    // Check for search results
    const searchResults = await testSetup.elementExists(config.selectors.searchResults);
    console.log('Search results found:', searchResults);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-search-results.png', fullPage: true });
    console.log('Screenshot saved as debug-search-results.png');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await testSetup.cleanup();
  }
}

debugSearch();