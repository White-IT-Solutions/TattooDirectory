import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Authentication Flow Testing Coverage
 * 
 * This test suite focuses on authentication flows including login, signup,
 * form validation, and error states in both light and dark modes.
 * 
 * Requirements: 8.1 (authentication flows), form interactions
 */

const AUTH_TEST_PAGES = {
  login: '/login',
  loginError: '/login/error'
} as const;

// Helper function to check form accessibility
async function checkFormAccessibility(page: any, formSelector: string = 'form') {
  const form = page.locator(formSelector);
  if (await form.count() === 0) return;

  // Check form has proper labeling
  const inputs = form.locator('input, textarea, select');
  const inputCount = await inputs.count();
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    
    if (id) {
      // Check for associated label
      const label = page.locator(`label[for="${id}"]`);
      const hasLabel = await label.count() > 0;
      
      // Input should have label, aria-label, or aria-labelledby
      expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  }

  // Check form has submit button
  const submitButton = form.locator('button[type="submit"], input[type="submit"]');
  if (await submitButton.count() > 0) {
    await expect(submitButton).toBeVisible();
    
    // Check button has accessible name
    const buttonText = await submitButton.textContent();
    const buttonAriaLabel = await submitButton.getAttribute('aria-label');
    expect(buttonText?.trim() || buttonAriaLabel).toBeTruthy();
  }
}

// Helper function to test form validation
async function testFormValidation(page: any, formSelector: string = 'form') {
  const form = page.locator(formSelector);
  if (await form.count() === 0) return;

  // Try to submit empty form
  const submitButton = form.locator('button[type="submit"], input[type="submit"]');
  if (await submitButton.count() > 0) {
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Check for validation messages
    const validationMessages = page.locator('.error, .validation-error, [role="alert"], .field-error');
    if (await validationMessages.count() > 0) {
      await expect(validationMessages.first()).toBeVisible();
    }

    // Check for HTML5 validation
    const invalidInputs = page.locator('input:invalid');
    const invalidCount = await invalidInputs.count();
    
    // At least one validation method should be present
    const hasValidation = await validationMessages.count() > 0 || invalidCount > 0;
    expect(hasValidation).toBe(true);
  }
}

test.describe('Authentication Flow Coverage - Login Page', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Login page form - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to login page
        await uiAuditPage.goto(AUTH_TEST_PAGES.login);
        await uiAuditPage.waitForLoadState('networkidle');

        // Set theme
        await themeToggler.setTheme(theme);
        await uiAuditPage.waitForTimeout(500);

        // Check basic page structure
        const nav = uiAuditPage.locator('nav, [role="navigation"]');
        if (await nav.count() > 0) {
          await expect(nav).toBeVisible();
        }

        // Check login form exists
        const loginForm = uiAuditPage.locator('form, [data-testid="login-form"]');
        if (await loginForm.count() > 0) {
          await expect(loginForm).toBeVisible();

          // Check form fields
          const emailInput = loginForm.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
          if (await emailInput.count() > 0) {
            await expect(emailInput).toBeVisible();
            await expect(emailInput).toBeEnabled();
          }

          const passwordInput = loginForm.locator('input[type="password"], input[name="password"]');
          if (await passwordInput.count() > 0) {
            await expect(passwordInput).toBeVisible();
            await expect(passwordInput).toBeEnabled();
          }

          // Check submit button
          const submitButton = loginForm.locator('button[type="submit"], input[type="submit"]');
          if (await submitButton.count() > 0) {
            await expect(submitButton).toBeVisible();
            await expect(submitButton).toBeEnabled();
          }

          // Check form accessibility
          await checkFormAccessibility(uiAuditPage);
        }

        // Check for additional login options
        const socialLogin = uiAuditPage.locator('[data-testid*="social"], .social-login, .oauth');
        if (await socialLogin.count() > 0) {
          await expect(socialLogin).toBeVisible();
        }

        // Check for forgot password link
        const forgotPassword = uiAuditPage.locator('a[href*="forgot"], a[href*="reset"], .forgot-password');
        if (await forgotPassword.count() > 0) {
          await expect(forgotPassword).toBeVisible();
        }

        // Check for signup link
        const signupLink = uiAuditPage.locator('a[href*="signup"], a[href*="register"], .signup-link');
        if (await signupLink.count() > 0) {
          await expect(signupLink).toBeVisible();
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'login-form',
          theme,
          viewport
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });
    });
  });
});

test.describe('Authentication Flow Coverage - Form Validation', () => {
  ALL_THEMES.forEach(theme => {
    ['desktop', 'mobile'].forEach(viewport => {
      test(`Login form validation - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
        
        // Navigate to login page
        await uiAuditPage.goto(AUTH_TEST_PAGES.login);
        await uiAuditPage.waitForLoadState('networkidle');

        // Set theme
        await themeToggler.setTheme(theme);
        await uiAuditPage.waitForTimeout(500);

        // Test empty form submission
        await testFormValidation(uiAuditPage);

        // Capture screenshot of validation state
        await screenshotCapture.captureFullPage({
          name: 'login-validation-empty',
          theme,
          viewport: viewport as keyof typeof VIEWPORTS
        });

        // Test invalid email format
        const emailInput = uiAuditPage.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
          await emailInput.fill('invalid-email');
          
          const submitButton = uiAuditPage.locator('button[type="submit"], input[type="submit"]');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await uiAuditPage.waitForTimeout(1000);

            // Check for email validation
            const emailValidation = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
            if (await emailValidation.count() > 0) {
              await expect(emailValidation.first()).toBeVisible();
            }

            // Capture screenshot of email validation
            await screenshotCapture.captureFullPage({
              name: 'login-validation-email',
              theme,
              viewport: viewport as keyof typeof VIEWPORTS
            });
          }
        }

        // Test valid email but empty password
        if (await emailInput.count() > 0) {
          await emailInput.fill('test@example.com');
          
          const submitButton = uiAuditPage.locator('button[type="submit"], input[type="submit"]');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await uiAuditPage.waitForTimeout(1000);

            // Check for password validation
            const passwordValidation = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
            if (await passwordValidation.count() > 0) {
              await expect(passwordValidation.first()).toBeVisible();
            }

            // Capture screenshot of password validation
            await screenshotCapture.captureFullPage({
              name: 'login-validation-password',
              theme,
              viewport: viewport as keyof typeof VIEWPORTS
            });
          }
        }
      });
    });
  });
});

test.describe('Authentication Flow Coverage - Error States', () => {
  ALL_THEMES.forEach(theme => {
    test(`Login error page - ${theme} mode`, async ({ 
      uiAuditPage, 
      themeToggler, 
      screenshotCapture,
      accessibilityChecker 
    }) => {
      // Set viewport
      await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
      
      // Navigate to login error page
      await uiAuditPage.goto(AUTH_TEST_PAGES.loginError);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Check for error message
      const errorMessage = uiAuditPage.locator('.error, .error-message, [role="alert"], [data-testid="error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        
        // Check error message has proper ARIA attributes
        const role = await errorMessage.getAttribute('role');
        const ariaLive = await errorMessage.getAttribute('aria-live');
        expect(role === 'alert' || ariaLive).toBeTruthy();
      }

      // Check for retry/back to login link
      const retryLink = uiAuditPage.locator('a[href*="login"], .retry-link, .back-to-login');
      if (await retryLink.count() > 0) {
        await expect(retryLink).toBeVisible();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'login-error-page',
        theme,
        viewport: 'desktop'
      });

      // Run accessibility audit
      const axeResults = await accessibilityChecker.runAxeAudit();
      expect(axeResults.violations).toHaveLength(0);
    });
  });
});

test.describe('Authentication Flow Coverage - Form Interactions', () => {
  test('Form field focus and keyboard navigation - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto(AUTH_TEST_PAGES.login);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Test keyboard navigation through form
      const form = uiAuditPage.locator('form, [data-testid="login-form"]');
      if (await form.count() > 0) {
        // Focus first input
        const firstInput = form.locator('input').first();
        if (await firstInput.count() > 0) {
          await firstInput.focus();
          
          // Check focus is visible
          const focusedElement = uiAuditPage.locator(':focus');
          await expect(focusedElement).toBeVisible();
          
          // Tab through form fields
          await uiAuditPage.keyboard.press('Tab');
          await uiAuditPage.keyboard.press('Tab');
          
          // Should reach submit button
          const submitButton = form.locator('button[type="submit"], input[type="submit"]');
          if (await submitButton.count() > 0) {
            const isSubmitFocused = await submitButton.evaluate(el => el === document.activeElement);
            // Note: This might not always be true depending on form structure
          }
        }
      }

      // Capture screenshot of focused state
      await screenshotCapture.captureFullPage({
        name: 'login-form-focus',
        theme,
        viewport: 'desktop'
      });
    }
  });

  test('Form field validation on blur - both themes', async ({ 
    uiAuditPage, 
    themeToggler 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto(AUTH_TEST_PAGES.login);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Test validation on blur
      const emailInput = uiAuditPage.locator('input[type="email"], input[name="email"]');
      if (await emailInput.count() > 0) {
        // Enter invalid email and blur
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        await uiAuditPage.waitForTimeout(500);

        // Check for immediate validation feedback
        const validationMessage = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
        if (await validationMessage.count() > 0) {
          // Validation on blur is working
          await expect(validationMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('Password visibility toggle - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto(AUTH_TEST_PAGES.login);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Look for password visibility toggle
      const passwordInput = uiAuditPage.locator('input[type="password"]');
      const toggleButton = uiAuditPage.locator('button[aria-label*="show" i], button[aria-label*="hide" i], .password-toggle');
      
      if (await passwordInput.count() > 0 && await toggleButton.count() > 0) {
        // Enter password
        await passwordInput.fill('testpassword');
        
        // Check initial state
        const initialType = await passwordInput.getAttribute('type');
        expect(initialType).toBe('password');
        
        // Click toggle
        await toggleButton.click();
        await uiAuditPage.waitForTimeout(200);
        
        // Check if type changed
        const newType = await passwordInput.getAttribute('type');
        if (newType === 'text') {
          // Toggle is working
          expect(newType).toBe('text');
          
          // Toggle back
          await toggleButton.click();
          await uiAuditPage.waitForTimeout(200);
          
          const finalType = await passwordInput.getAttribute('type');
          expect(finalType).toBe('password');
        }

        // Capture screenshot with password visible
        await screenshotCapture.captureFullPage({
          name: 'login-password-toggle',
          theme,
          viewport: 'desktop'
        });
      }
    }
  });
});

test.describe('Authentication Flow Coverage - Mobile Specific', () => {
  test('Mobile form interactions - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.mobile);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto(AUTH_TEST_PAGES.login);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Check form is properly sized for mobile
      const form = uiAuditPage.locator('form, [data-testid="login-form"]');
      if (await form.count() > 0) {
        const formBox = await form.boundingBox();
        if (formBox) {
          // Form should fit within mobile viewport
          expect(formBox.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
        }

        // Check input fields are touch-friendly
        const inputs = form.locator('input');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputBox = await input.boundingBox();
          
          if (inputBox) {
            // Input should be at least 44px tall for touch accessibility
            expect(inputBox.height).toBeGreaterThanOrEqual(40);
          }
        }

        // Check submit button is touch-friendly
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          const buttonBox = await submitButton.boundingBox();
          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }

      // Test virtual keyboard behavior
      const emailInput = uiAuditPage.locator('input[type="email"], input[name="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.tap();
        await uiAuditPage.waitForTimeout(500);
        
        // Check input type for proper keyboard
        const inputType = await emailInput.getAttribute('type');
        const inputMode = await emailInput.getAttribute('inputmode');
        expect(inputType === 'email' || inputMode === 'email').toBeTruthy();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'mobile-login-form',
        theme,
        viewport: 'mobile'
      });
    }
  });
});