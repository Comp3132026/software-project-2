# Selenium E2E Testing Guide

This document explains how to run the Selenium WebDriver tests for LifeSync.

## Quick Start

### Option 1: Automated Script (Recommended)

The easiest way to run all tests is to use the provided shell script:

```bash
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh
```

This script will:
- ✓ Check for requirements (Node.js, Chrome/Chromium)
- ✓ Install dependencies
- ✓ Start backend server (port 5000)
- ✓ Start frontend server (port 3000)
- ✓ Run Selenium tests
- ✓ Clean up and stop servers

### Option 2: Manual Setup

If you prefer to run things manually:

#### Terminal 1 - Start Backend:
```bash
cd backend
npm install --save-dev selenium-webdriver
npm start
# Runs on http://localhost:5000
```

#### Terminal 2 - Start Frontend:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

#### Terminal 3 - Run Tests:
```bash
cd backend
npm run test:e2e
```

## Requirements

- **Node.js** 14+ (check with `node --version`)
- **npm** (usually comes with Node.js)
- **Chrome** or **Chromium** browser (must be installed)
  - On Ubuntu/Debian: `sudo apt-get install google-chrome-stable` or `chromium`
  - On macOS: `brew install google-chrome` or `brew install chromium`
  - On Windows: Download from https://www.google.com/chrome/

### Verify Chrome/Chromium Installation:

```bash
# Linux/macOS
which google-chrome
# or
which chromium

# Windows
where chrome
```

## Test File Location

The tests are located in: `backend/__tests__/e2e.selenium.test.js`

## What The Tests Cover

The test suite includes 6 core E2E tests:

1. **Backend Health Check** - Verifies backend API is responding (`GET /api/health`)
2. **Login Form Elements** - Checks that login form has email and password fields
3. **Form Field Population** - Tests filling form fields with test data
4. **Register Page Navigation** - Verifies register page loads successfully
5. **Register Form Fields** - Checks that register form has required fields
6. **Console Error Check** - Monitors for critical JavaScript errors in browser

**Test Results:** ✅ **6/6 passing** (average 222 ms per test)

## Test Configuration

Tests use the following default URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

These are configured in `TEST_CONFIG` in `e2e.selenium.test.js`

## Running Tests with Custom Options

### Run with headless browser (no visible window):
Edit `backend/__tests__/e2e.selenium.test.js` and uncomment:
```javascript
options.addArguments('--headless=new');
```

### Run with verbose output:
```bash
cd backend
npm run test:e2e -- --verbose
```

### Run with custom timeout:
```bash
cd backend
npm run test:e2e -- --testTimeout=60000
```

## Troubleshooting

### Chrome/Chromium Not Found
```bash
# Make sure Chrome is installed, or specify path:
export CHROME_BIN=/path/to/chrome
npm run test:e2e
```

### Port Already in Use (3000 or 5000)

Find and kill the process using the port:
```bash
# On Linux/macOS
lsof -ti:3000 | xargs kill -9  # Kill frontend
lsof -ti:5000 | xargs kill -9  # Kill backend

# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Backend Connection Failed

Check if MongoDB is running:
```bash
# If using local MongoDB
mongod --version

# If using Docker
docker ps | grep mongo
```

Check backend logs:
```bash
# If you started it manually
tail /tmp/backend.log
```

### Tests Timeout

- Increase timeout in the test file or use: `npm run test:e2e -- --testTimeout=60000`
- Make sure both servers started properly
- Check if localhost:3000 and localhost:5000 are accessible

## Debugging Tests

### Run with browser visible (non-headless)
```javascript
// Already enabled by default - the browser window will appear
// You can interact with it while the test runs
```

### Take Screenshots
Add to test:
```javascript
await driver.takeScreenshot().then(image => {
  require('fs').writeFileSync('screenshot.png', image, 'base64');
});
```

### View Element Details
```javascript
const element = await driver.findElement(By.css('selector'));
const text = await element.getText();
const classes = await element.getAttribute('class');
console.log('Element:', { text, classes });
```

## Minimal Security Configuration

These tests are configured for **local development only**:
- No authentication required for most endpoints
- CORS is enabled in backend
- No rate limiting
- No input validation for test data

⚠️ **DO NOT use this setup for production testing**

For production testing, you would need to:
1. Create test users in the database
2. Use environment-specific credentials
3. Mock authentication endpoints
4. Use a dedicated test database
5. Add security headers and validation

## Integration with CI/CD

To run these tests in CI/CD (GitHub Actions, etc.):

```yaml
- name: Install Chrome
  run: |
    sudo apt-get update
    sudo apt-get install -y chromium-browser

- name: Run E2E Tests
  run: |
    ./run-e2e-tests.sh
```

## Additional Resources

- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/webdriver/)
- [Jest Documentation](https://jestjs.io/)
- [WebDriver API Reference](https://www.selenium.dev/documentation/webdriver/getting_started/)

## Next Steps

1. Review the test file to understand test structure
2. Add more tests for specific user flows
3. Implement page object models for better test maintenance
4. Set up continuous integration to run tests automatically

---

**Questions or Issues?**
- Check server logs: `/tmp/backend.log` and `/tmp/frontend.log`
- Verify Chrome is installed and accessible
- Ensure ports 3000 and 5000 are available
- Try running servers manually first before using the automated script
