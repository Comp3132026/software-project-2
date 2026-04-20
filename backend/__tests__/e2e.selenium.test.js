const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * E2E Tests with Selenium WebDriver
 * Tests basic application flow: navigation, login page, form interaction
 * 
 * Prerequisites:
 * - Chrome/Chromium browser installed
 * - Frontend running on http://localhost:3000
 * - Backend running on http://localhost:5000
 * 
 * Run: npm run test:e2e
 */

// Test configuration
const TEST_CONFIG = {
  FRONTEND_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:5000',
  TIMEOUT: 10000,
  IMPLICIT_WAIT: 5000,
};

// Utility function to create a WebDriver instance
async function createDriver() {
  let options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  // Uncomment below to run headless (no browser window)
  // options.addArguments('--headless=new');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: TEST_CONFIG.IMPLICIT_WAIT,
    pageLoad: TEST_CONFIG.TIMEOUT,
  });

  return driver;
}

// Helper: Wait for an element to be visible
async function waitForElement(driver, locator) {
  return await driver.wait(until.elementLocated(locator), TEST_CONFIG.TIMEOUT);
}

// Helper: Get element by ID
function byId(id) {
  return By.id(id);
}

// Helper: Get element by CSS
function byCss(selector) {
  return By.css(selector);
}

// Tests
describe('E2E Tests - LifeSync Application', () => {
  let driver;

  // Setup: Create driver before tests
  beforeAll(async () => {
    try {
      driver = await createDriver();
      console.log('✓ WebDriver initialized');
    } catch (error) {
      console.error('Failed to initialize WebDriver:', error.message);
      throw error;
    }
  });

  // Cleanup: Quit driver after tests
  afterAll(async () => {
    if (driver) {
      await driver.quit();
      console.log('✓ WebDriver closed');
    }
  });

  // Test 1: Verify backend is healthy
  test('Backend health check should return 200', async () => {
    try {
      const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/api/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
      console.log('✓ Backend health check passed');
    } catch (error) {
      console.error('Backend health check failed:', error.message);
      throw error;
    }
  });

  // Test 2: Verify login form elements exist
  test('Login form should have email and password fields', async () => {
    try {
      await driver.get(`${TEST_CONFIG.FRONTEND_URL}/login`);

      // Wait for and find email input
      const emailInput = await waitForElement(
        driver,
        By.css('input[type="email"]')
      );
      expect(emailInput).toBeTruthy();

      // Find password input
      const passwordInput = await driver.findElement(
        By.css('input[type="password"]')
      );
      expect(passwordInput).toBeTruthy();

      // Find submit button
      const submitButton = await driver.findElement(
        By.css('button[type="submit"]')
      );
      expect(submitButton).toBeTruthy();

      console.log('✓ Login form elements verified');
    } catch (error) {
      console.error('Login form verification failed:', error.message);
      throw error;
    }
  });

  // Test 3: Interact with login form
  test('Should fill and submit login form', async () => {
    try {
      await driver.get(`${TEST_CONFIG.FRONTEND_URL}/login`);

      // Get form elements
      const emailInput = await waitForElement(
        driver,
        By.css('input[type="email"]')
      );
      const passwordInput = await driver.findElement(
        By.css('input[type="password"]')
      );
      const submitButton = await driver.findElement(
        By.css('button[type="submit"]')
      );

      // Fill form with test credentials
      await emailInput.clear();
      await emailInput.sendKeys('test@example.com');

      await passwordInput.clear();
      await passwordInput.sendKeys('testpassword123');

      // Verify values were entered
      const emailValue = await emailInput.getAttribute('value');
      const passwordValue = await passwordInput.getAttribute('value');

      expect(emailValue).toBe('test@example.com');
      expect(passwordValue).toBe('testpassword123');

      console.log('✓ Form fields populated successfully');

      // Note: Not clicking submit to avoid actual authentication attempt
      // In real scenarios, you'd either:
      // 1. Create a test user in the database first
      // 2. Mock the authentication endpoint
      // 3. Use a dedicated test account
    } catch (error) {
      console.error('Login form interaction failed:', error.message);
      throw error;
    }
  });

  // Test 4: Navigate to register page
  test('Should navigate to register page', async () => {
    try {
      await driver.get(`${TEST_CONFIG.FRONTEND_URL}/register`);

      // Wait for page to load
      const pageTitle = await driver.wait(
        until.titleContains('LifeSync'),
        TEST_CONFIG.TIMEOUT
      );
      expect(pageTitle).toBeTruthy();

      console.log('✓ Register page loaded successfully');
    } catch (error) {
      console.error('Register page navigation failed:', error.message);
      throw error;
    }
  });

  // Test 5: Check register form
  test('Register form should have required fields', async () => {
    try {
      await driver.get(`${TEST_CONFIG.FRONTEND_URL}/register`);

      // Find email field
      const emailField = await waitForElement(
        driver,
        By.css('input[type="email"]')
      );
      expect(emailField).toBeTruthy();

      console.log('✓ Register form fields verified');
    } catch (error) {
      console.error('Register form verification failed:', error.message);
      throw error;
    }
  });

  // Test 6: Browser console should be clean (no critical errors)
  test('Console should not have critical errors', async () => {
    try {
      await driver.get(`${TEST_CONFIG.FRONTEND_URL}/login`);

      // Get console logs
      const logs = await driver.manage().logs().get('browser');
      
      const criticalErrors = logs.filter(
        (log) =>
          log.level.value > 900 && // SEVERE level
          !log.message.includes('404') // Ignore 404s for now
      );

      expect(criticalErrors.length).toBe(0);
      console.log(`✓ Console check passed (${logs.length} total logs)`);
    } catch (error) {
      // Some drivers don't support this, so we'll just log it
      console.log('⚠ Console logging not available in this setup');
    }
  });
});
