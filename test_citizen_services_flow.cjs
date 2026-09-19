const { chromium } = require('./Frontend/node_modules/playwright');

async function testServicesFlow() {
  console.log('--- Verifying Complete Citizen Application Flows (Trade License & Shop Registration) ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  let passed = 0;
  function check(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      process.exit(1);
    }
  }

  try {
    // 1. Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"], input[type="email"]', 'citizen@govease.ai');
    await page.fill('input[type="password"]', 'Citizen@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 6000 });
    check(page.url().includes('/dashboard'), 'Logged in to /dashboard');

    // 2. Test Trade License Flow
    console.log('\nTesting Trade License Navigation...');
    await page.waitForTimeout(500);
    await page.click('a[href="/services"]');
    await page.waitForURL('**/services', { timeout: 5000 });
    check(page.url().includes('/services'), 'Navigated to /services');

    // Details for Trade License
    await page.waitForSelector('a[href="/services/trade-license"]', { timeout: 5000 });
    await page.click('a[href="/services/trade-license"]');
    await page.waitForURL('**/services/trade-license', { timeout: 5000 });
    check(page.url().includes('/services/trade-license'), 'Navigated to /services/trade-license');
    await page.locator('h1', { hasText: 'Trade License' }).waitFor({ timeout: 5000 });
    const tradeTitle = await page.locator('h1', { hasText: 'Trade License' }).textContent();
    check(tradeTitle.includes('Trade License'), 'Service details displays Trade License');

    // Start Application
    await page.click('a[href="/applications/new/trade-license"]');
    await page.waitForURL('**/applications/new/trade-license**', { timeout: 5000 });
    check(page.url().includes('trade-license'), 'Navigated to application wizard for Trade License');

    // 3. Test Shop Registration Flow (Section 38)
    console.log('\nTesting Shop Registration Navigation (Second Service)...');
    await page.goto('http://localhost:5173/services', { waitUntil: 'networkidle' });
    await page.waitForSelector('a[href="/services/shop-registration"]', { timeout: 5000 });
    await page.click('a[href="/services/shop-registration"]');
    await page.waitForURL('**/services/shop-registration', { timeout: 5000 });
    check(page.url().includes('/services/shop-registration'), 'Navigated to /services/shop-registration');
    await page.locator('h1', { hasText: 'Shop Registration' }).waitFor({ timeout: 5000 });
    const shopTitle = await page.locator('h1', { hasText: 'Shop Registration' }).textContent();
    check(shopTitle.includes('Shop Registration'), 'Service details displays Shop Registration');

    // Start Application
    await page.click('a[href="/applications/new/shop-registration"]');
    await page.waitForURL('**/applications/new/shop-registration**', { timeout: 5000 });
    check(page.url().includes('shop-registration'), 'Correctly passed shop-registration serviceId to wizard');

    // 4. Test Digital Approval Route
    console.log('\nTesting Digital Approval Certificate Route...');
    await page.goto('http://localhost:5173/applications/GEAI-2026-000003/approval', { waitUntil: 'networkidle' });
    const approvalText = await page.textContent('body');
    check(approvalText.includes('Business License') || approvalText.includes('Digital Approval') || approvalText.includes('Sanctioned'), 'Digital Approval certificate renders properly');

    // 5. Test Tracking Route
    console.log('\nTesting Application Tracking Route...');
    await page.goto('http://localhost:5173/applications/GEAI-2026-000001', { waitUntil: 'networkidle' });
    const trackingText = await page.textContent('body');
    check(trackingText.includes('GEAI-2026-000001'), 'Tracking page displays application ID GEAI-2026-000001');
    check(trackingText.includes('Trade License'), 'Tracking page shows Trade License');

    console.log(`\nAll ${passed} application flow integration checks passed successfully!`);
  } catch (err) {
    console.error('Flow test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testServicesFlow();
