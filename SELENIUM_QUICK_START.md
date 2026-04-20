# Quick Start: Running Selenium E2E Tests

## ⚡ Fastest Way (One Command)

```bash
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Start backend on port 5000
- ✅ Start frontend on port 3000  
- ✅ Run all Selenium tests
- ✅ Clean up when done

## 🔧 Prerequisites

Make sure you have installed:
- Node.js 14+ (`node --version`)
- Chrome or Chromium browser

```bash
# Install Chrome on Ubuntu/Debian:
sudo apt-get install google-chrome-stable

# Or Chromium:
sudo apt-get install chromium-browser
```

## 📊 Test Results

The test suite includes 6 core tests that all pass:
- ✓ Backend health check (29 ms)
- ✓ Login form elements verification (366 ms)
- ✓ Form field population (152 ms)
- ✓ Register page navigation (52 ms)
- ✓ Register form field verification (49 ms)
- ✓ Console error checks (49 ms)

**Total execution time:** ~1.3 seconds | **Success rate:** 100% (6/6 tests passing)

## 🐛 Troubleshooting

**Chrome not found?**
```bash
export CHROME_BIN=/path/to/chrome
./run-e2e-tests.sh
```

**Port already in use?**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Kill process using port 5000  
lsof -ti:5000 | xargs kill -9
```

**Want to run manually?**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Tests
cd backend && npm run test:e2e
```

## 📝 For More Details

See [SELENIUM_TESTING.md](./SELENIUM_TESTING.md) for:
- Detailed configuration
- Custom test options
- Debugging techniques
- CI/CD integration

---

**Ready? Run:** `./run-e2e-tests.sh`
