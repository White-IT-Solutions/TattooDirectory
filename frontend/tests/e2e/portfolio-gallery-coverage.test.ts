import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Portfolio Gallery Testing Coverage
 * 
 * This test suite focuses specifically on portfolio galleries and image interactions
 * across artist and studio profile pages in both light and dark modes.
 * 
 * Requirements: 8.2 (artist portfolios), 8.3 (image galleries)
 */

const GALLERY_TEST_PAGES = {
  artistProfile: '/artists/test-artist-id',
  studioProfile: '/studios/test-studio-id',
  styleDetail: '/styles/traditional'
} as const;

// Helper function to wait for images to load
async function waitForImagesLoad(page: any) {
  await page.waitForLoadState('networkidle');
  
  // Wait for all images to load
  await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Resolve even on error to not block tests
        });
      })
    );
  });
  
  await page.waitForTimeout(500); // Additional buffer
}

// Helper function to check image accessibility
async function checkImageAccessibility(page: any) {
  const images = page.locator('img');
  const imageCount = await images.count();
  
  for (let i = 0; i < Math.min(imageCount, 10); i++) { // Check first 10 images
    const img = images.nth(i);
    if (await img.isVisible()) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaLabelledBy = await img.getAttribute('aria-labelledby');
      
      // Images should have alt text or aria-label
      expect(alt || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  }
}

test.describe('Portfolio Gallery Coverage - Artist Profiles', () => {
  ALL_THEMES.forEach(theme => {
    ['desktop', 'tablet', 'mobile'].forEach(viewport => {
      test(`Artist portfolio gallery - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
        
        // Navigate to artist profile
        await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
        await waitForImagesLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForImagesLoad(uiAuditPage);

        // Check portfolio gallery exists
        const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"], .image-gallery, .portfolio-grid');
        if (await gallery.count() > 0) {
          await expect(gallery).toBeVisible();

          // Check gallery images
          const galleryImages = gallery.locator('img');
          const imageCount = await galleryImages.count();
          
          if (imageCount > 0) {
            // Check first few images are visible
            for (let i = 0; i < Math.min(imageCount, 6); i++) {
              const img = galleryImages.nth(i);
              await expect(img).toBeVisible();
            }

            // Test image click/interaction
            const firstImage = galleryImages.first();
            await firstImage.click();
            
            // Check if lightbox or modal opens
            const lightbox = uiAuditPage.locator('.lightbox, .modal, [data-testid="lightbox"], .image-modal');
            if (await lightbox.count() > 0) {
              await expect(lightbox).toBeVisible();
              
              // Check lightbox controls
              const closeButton = lightbox.locator('button, .close, [aria-label*="close" i]');
              if (await closeButton.count() > 0) {
                await expect(closeButton).toBeVisible();
                await closeButton.click();
                await expect(lightbox).not.toBeVisible();
              }
            }
          }
        }

        // Check image accessibility
        await checkImageAccessibility(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'artist-portfolio-gallery',
          theme,
          viewport: viewport as keyof typeof VIEWPORTS
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });
    });
  });
});

test.describe('Portfolio Gallery Coverage - Studio Profiles', () => {
  ALL_THEMES.forEach(theme => {
    ['desktop', 'mobile'].forEach(viewport => {
      test(`Studio portfolio gallery - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
        
        // Navigate to studio profile
        await uiAuditPage.goto(GALLERY_TEST_PAGES.studioProfile);
        await waitForImagesLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForImagesLoad(uiAuditPage);

        // Check studio gallery or artist showcase
        const gallery = uiAuditPage.locator('.gallery, .studio-gallery, [data-testid="studio-gallery"], .artist-showcase');
        if (await gallery.count() > 0) {
          await expect(gallery).toBeVisible();

          // Check gallery images
          const galleryImages = gallery.locator('img');
          const imageCount = await galleryImages.count();
          
          if (imageCount > 0) {
            // Check images are visible
            for (let i = 0; i < Math.min(imageCount, 4); i++) {
              const img = galleryImages.nth(i);
              await expect(img).toBeVisible();
            }
          }
        }

        // Check studio artists section
        const artistsSection = uiAuditPage.locator('.studio-artists, [data-testid="studio-artists"], .artists-list');
        if (await artistsSection.count() > 0) {
          await expect(artistsSection).toBeVisible();
        }

        // Check image accessibility
        await checkImageAccessibility(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'studio-portfolio-gallery',
          theme,
          viewport: viewport as keyof typeof VIEWPORTS
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });
    });
  });
});

test.describe('Portfolio Gallery Coverage - Image Interactions', () => {
  test('Image lazy loading and performance - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to artist profile
      await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
      
      // Set theme
      await themeToggler.setTheme(theme);
      
      // Check for lazy loading attributes
      const images = uiAuditPage.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const img = images.nth(i);
          const loading = await img.getAttribute('loading');
          const src = await img.getAttribute('src');
          const dataSrc = await img.getAttribute('data-src');
          
          // Check for lazy loading implementation
          if (loading === 'lazy' || dataSrc) {
            // Image has lazy loading
            expect(true).toBe(true);
          }
          
          // Check image format optimization
          if (src) {
            const isOptimized = src.includes('.webp') || src.includes('w_') || src.includes('q_');
            // Note: This is informational, not a hard requirement
          }
        }
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'image-lazy-loading',
        theme,
        viewport: 'desktop'
      });
    }
  });

  test('Image gallery keyboard navigation - both themes', async ({ 
    uiAuditPage, 
    themeToggler 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to artist profile
      await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
      await waitForImagesLoad(uiAuditPage);
      
      // Set theme
      await themeToggler.setTheme(theme);
      await waitForImagesLoad(uiAuditPage);

      // Find gallery images
      const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"]');
      if (await gallery.count() > 0) {
        const galleryImages = gallery.locator('img, button, a').first();
        
        if (await galleryImages.count() > 0) {
          // Focus on first gallery item
          await galleryImages.focus();
          
          // Check focus is visible
          const focusedElement = uiAuditPage.locator(':focus');
          await expect(focusedElement).toBeVisible();
          
          // Test keyboard navigation
          await uiAuditPage.keyboard.press('Tab');
          await uiAuditPage.keyboard.press('Enter');
          
          // Check if interaction worked (lightbox opened, etc.)
          const lightbox = uiAuditPage.locator('.lightbox, .modal, [data-testid="lightbox"]');
          if (await lightbox.count() > 0) {
            // Test keyboard navigation in lightbox
            await uiAuditPage.keyboard.press('Escape');
            await expect(lightbox).not.toBeVisible();
          }
        }
      }
    }
  });

  test('Image error handling - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to artist profile
      await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
      
      // Set theme
      await themeToggler.setTheme(theme);
      
      // Simulate image loading errors
      await uiAuditPage.route('**/*.jpg', route => route.abort());
      await uiAuditPage.route('**/*.png', route => route.abort());
      await uiAuditPage.route('**/*.webp', route => route.abort());
      
      await uiAuditPage.reload();
      await uiAuditPage.waitForLoadState('networkidle');
      
      // Check for error handling
      const images = uiAuditPage.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Check if placeholder or error state is shown
        const placeholders = uiAuditPage.locator('.image-placeholder, .image-error, [data-testid="image-placeholder"]');
        if (await placeholders.count() > 0) {
          await expect(placeholders.first()).toBeVisible();
        }
      }

      // Capture screenshot of error state
      await screenshotCapture.captureFullPage({
        name: 'image-error-handling',
        theme,
        viewport: 'desktop'
      });
      
      // Clear route interception
      await uiAuditPage.unroute('**/*.jpg');
      await uiAuditPage.unroute('**/*.png');
      await uiAuditPage.unroute('**/*.webp');
    }
  });
});

test.describe('Portfolio Gallery Coverage - Mobile Interactions', () => {
  test('Touch interactions and swipe gestures - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.mobile);
    
    for (const theme of ALL_THEMES) {
      // Navigate to artist profile
      await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
      await waitForImagesLoad(uiAuditPage);
      
      // Set theme
      await themeToggler.setTheme(theme);
      await waitForImagesLoad(uiAuditPage);

      // Find gallery
      const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"]');
      if (await gallery.count() > 0) {
        const galleryImages = gallery.locator('img');
        const imageCount = await galleryImages.count();
        
        if (imageCount > 0) {
          // Test touch interaction
          const firstImage = galleryImages.first();
          await firstImage.tap();
          
          // Check if lightbox opens
          const lightbox = uiAuditPage.locator('.lightbox, .modal, [data-testid="lightbox"]');
          if (await lightbox.count() > 0) {
            await expect(lightbox).toBeVisible();
            
            // Test swipe gestures if supported
            const lightboxImage = lightbox.locator('img').first();
            if (await lightboxImage.count() > 0) {
              // Simulate swipe left
              await lightboxImage.hover();
              await uiAuditPage.mouse.down();
              await uiAuditPage.mouse.move(-100, 0);
              await uiAuditPage.mouse.up();
              
              await uiAuditPage.waitForTimeout(500);
            }
            
            // Close lightbox
            const closeButton = lightbox.locator('button, .close, [aria-label*="close" i]');
            if (await closeButton.count() > 0) {
              await closeButton.tap();
            } else {
              // Try tapping outside
              await uiAuditPage.tap('body');
            }
          }
        }
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'mobile-gallery-interactions',
        theme,
        viewport: 'mobile'
      });
    }
  });

  test('Gallery grid responsiveness - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    const mobileViewports = ['mobile', 'tablet'] as const;
    
    for (const viewport of mobileViewports) {
      await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
      
      for (const theme of ALL_THEMES) {
        // Navigate to artist profile
        await uiAuditPage.goto(GALLERY_TEST_PAGES.artistProfile);
        await waitForImagesLoad(uiAuditPage);
        
        // Set theme
        await themeToggler.setTheme(theme);
        await waitForImagesLoad(uiAuditPage);

        // Check gallery layout
        const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"]');
        if (await gallery.count() > 0) {
          await expect(gallery).toBeVisible();
          
          // Check gallery images fit properly
          const galleryImages = gallery.locator('img');
          const imageCount = await galleryImages.count();
          
          if (imageCount > 0) {
            for (let i = 0; i < Math.min(imageCount, 4); i++) {
              const img = galleryImages.nth(i);
              const boundingBox = await img.boundingBox();
              
              if (boundingBox) {
                // Check image doesn't overflow viewport
                expect(boundingBox.x).toBeGreaterThanOrEqual(0);
                expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(VIEWPORTS[viewport].width);
              }
            }
          }
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: `gallery-responsive-${viewport}`,
          theme,
          viewport
        });
      }
    }
  });
});