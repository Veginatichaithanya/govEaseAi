const { chromium } = require('./Frontend/node_modules/playwright');

async function runCompleteSidebarSuite() {
  console.log('====================================================');
  console.log('STARTING GOVEASEAI SIDEBAR & AUTH PERSISTENCE SUITE');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
      process.exit(1);
    }
  }

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401') && !msg.text().includes('favicon')) {
      consoleErrors.push(msg.text());
    }
  });

  // --- Step 1: Verify Wrong Password Rejection Still Works (Prompt Sec 30) ---
  console.log('\n--- Step 1: Wrong Password Rejection Verification ---');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"], input[type="email"]', '9876543210');
  await page.fill('input[type="password"]', 'WrongPassword!999');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  assert(page.url().includes('/login'), 'Wrong password remained on /login');
  const tokenOnFail = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
  assert(!tokenOnFail, 'No token issued on wrong password');

  // --- Step 2: Valid Citizen Login ---
  console.log('\n--- Step 2: Valid Citizen Login ---');
  await page.fill('input[type="password"]', 'Citizen@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 6000 });

  assert(page.url().includes('/dashboard'), 'Redirected to /dashboard on valid login');
  const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
  assert(!!tokenAfterLogin, 'Token exists in localStorage (govease_auth_token)');

  const greeting = await page.locator('#citizen-greeting').textContent();
  console.log('  Dashboard greeting:', greeting.trim());
  assert(greeting.includes('Ravi Kumar'), 'Greeting displays full_name "Ravi Kumar"');
  assert(!greeting.includes('9876543210'), 'Greeting does not display phone number');

  // --- Step 3: Test Every Sidebar Item (Prompt Sec 23 & 41) ---
  console.log('\n--- Step 3: Sidebar Item Navigation ---');

  // 1. Dashboard
  await page.click('a[href="/dashboard"]');
  await page.waitForTimeout(400);
  assert(page.url().includes('/dashboard'), 'Test 1: Click Dashboard remains on /dashboard');

  // 2. Government Services
  await page.click('a[href="/services"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/services'), 'Test 2: Click Government Services navigated to /services');
  assert(!page.url().includes('/login'), 'Test 2: Did NOT redirect to /login');

  // 3. My Applications
  await page.click('a[href="/applications"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/applications'), 'Test 3: Click My Applications navigated to /applications');
  assert(!page.url().includes('/login'), 'Test 3: Did NOT redirect to /login');

  // 4. AI Assistant
  await page.click('a[href="/assistant"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/assistant'), 'Test 4: Click AI Assistant navigated to /assistant');
  assert(!page.url().includes('/login'), 'Test 4: Did NOT redirect to /login');

  // 5. Notifications
  await page.click('a[href="/notifications"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/notifications'), 'Test 5: Click Notifications navigated to /notifications');
  assert(!page.url().includes('/login'), 'Test 5: Did NOT redirect to /login');

  // 6. Profile
  await page.click('a[href="/profile"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/profile'), 'Test 6: Click Profile navigated to /profile');
  assert(!page.url().includes('/login'), 'Test 6: Did NOT redirect to /login');
  const profileName = await page.locator('text=Ravi Kumar').first().textContent();
  assert(profileName.includes('Ravi Kumar'), 'Profile displays authenticated user full_name');

  // 7. Settings
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/settings'), 'Test 7: Click Settings navigated to /settings');
  assert(!page.url().includes('/login'), 'Test 7: Did NOT redirect to /login');

  // 8. Return to Dashboard
  await page.click('a[href="/dashboard"]');
  await page.waitForTimeout(600);
  assert(page.url().includes('/dashboard'), 'Test 8: Return to Dashboard navigated to /dashboard');
  assert(!page.url().includes('/login'), 'Test 8: Did NOT redirect to /login');

  // --- Step 4: Browser Refresh Persistence (Prompt Sec 22) ---
  console.log('\n--- Step 4: Browser Refresh Persistence ---');

  // Refresh on /dashboard
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  assert(page.url().includes('/dashboard'), 'Refresh on /dashboard kept citizen logged in');

  // Navigate to /services and refresh
  await page.click('a[href="/services"]');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  assert(page.url().includes('/services'), 'Refresh on /services kept citizen logged in');

  // Navigate to /applications and refresh
  await page.click('a[href="/applications"]');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  assert(page.url().includes('/applications'), 'Refresh on /applications kept citizen logged in');

  // --- Step 5: Logout Action (Prompt Sec 27 & 41) ---
  console.log('\n--- Step 5: Explicit Logout Test ---');
  await page.click('.sidebar-logout-btn');
  await page.waitForURL('**/login', { timeout: 5000 });
  assert(page.url().includes('/login'), 'Clicking Logout redirected to /login');

  const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
  assert(!tokenAfterLogout, 'Auth token cleared from localStorage after logout');

  // --- Step 6: Direct Access to Protected Routes When Logged Out ---
  console.log('\n--- Step 6: Unauthenticated Route Protection ---');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(600);
  assert(page.url().includes('/login'), 'Direct visit to /dashboard unauthenticated redirected to /login');

  await page.goto('http://localhost:5173/services');
  await page.waitForTimeout(600);
  assert(page.url().includes('/login'), 'Direct visit to /services unauthenticated redirected to /login');

  await page.goto('http://localhost:5173/applications');
  await page.waitForTimeout(600);
  assert(page.url().includes('/login'), 'Direct visit to /applications unauthenticated redirected to /login');

  await page.goto('http://localhost:5173/profile');
  await page.waitForTimeout(600);
  assert(page.url().includes('/login'), 'Direct visit to /profile unauthenticated redirected to /login');

  // --- Step 7: Officer Portal Integrity (Prompt Sec 42) ---
  console.log('\n--- Step 7: Officer Authentication Separation ---');
  await page.goto('http://localhost:5173/officer/login');
  await page.fill('input[type="password"]', 'WrongOfficerPass!99');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  assert(page.url().includes('/officer/login'), 'Officer wrong password remained on /officer/login');

  await page.fill('input[type="password"]', 'License@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/officer/dashboard', { timeout: 6000 });
  assert(page.url().includes('/officer/dashboard'), 'Officer valid login navigated to /officer/dashboard');

  await browser.close();

  console.log('\n====================================================');
  console.log(`SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('Console Errors:', consoleErrors.length === 0 ? 'CLEAN (0)' : consoleErrors);
  console.log('====================================================');
}

runCompleteSidebarSuite().catch(err => {
  console.error('Test execution failure:', err);
  process.exit(1);
});
