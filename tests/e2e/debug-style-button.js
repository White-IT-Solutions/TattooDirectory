const TestSetup = require("./setup/test-setup");
const config = require("./config/test-config");

async function debugStyleButton() {
  const testSetup = new TestSetup();

  try {
    await testSetup.waitForServices();
    const { page } = await testSetup.initBrowser();

    await testSetup.navigateToPage(config.urls.frontend);

    console.log("Current URL:", page.url());

    // Look for the first style button
    const styleButton = await page.$('[data-testid^="style-button-"]');

    if (styleButton) {
      const buttonText = await page.evaluate(
        (el) => el.textContent,
        styleButton
      );
      console.log("Found style button with text:", buttonText);

      // Click the style button
      await styleButton.click();
      console.log("Clicked style button");

      // Wait for navigation
      await page.waitForTimeout(3000);

      console.log("New URL:", page.url());

      // Check if we're on the artists page
      const isArtistsPage = page.url().includes("/artists");
      console.log("Is on artists page:", isArtistsPage);

      // Check for search results
      const searchResults = await testSetup.elementExists(
        config.selectors.searchResults
      );
      console.log("Search results found:", searchResults);

      if (searchResults) {
        const artistCards = await page.$$(config.selectors.artistCard);
        console.log("Number of artist cards found:", artistCards.length);
      }
    } else {
      console.log("No style button found");
    }
  } catch (error) {
    console.error("Debug error:", error);
  } finally {
    await testSetup.cleanup();
  }
}

debugStyleButton();
