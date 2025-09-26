const TestSetup = require('./setup/test-setup');
const config = require('./config/test-config');

async function debugPage() {
  const testSetup = new TestSetup();
  
  try {
    await testSetup.waitForServices();
    const { page } = await testSetup.initBrowser();
    
    await testSetup.navigateToPage(config.urls.frontend);
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Get page content
    const content = await page.content();
    console.log('Page HTML length:', content.length);
    
    // Check for search input
    const searchInputs = await page.$$('input[type="text"]');
    console.log('Found text inputs:', searchInputs.length);
    
    // Check for data-testid attributes
    const testIds = await page.$$('[data-testid]');
    console.log('Found elements with data-testid:', testIds.length);
    
    for (let i = 0; i < testIds.length; i++) {
      const testId = await page.evaluate(el => el.getAttribute('data-testid'), testIds[i]);
      console.log(`- data-testid="${testId}"`);
    }
    
    // Check if MapWithSearch component is rendered
    const mapContainer = await page.$('.w-full.max-w-3xl.mx-auto.flex.flex-col.items-center');
    console.log('MapWithSearch container found:', !!mapContainer);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
    console.log('Screenshot saved as debug-homepage.png');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await testSetup.cleanup();
  }
}

debugPage();