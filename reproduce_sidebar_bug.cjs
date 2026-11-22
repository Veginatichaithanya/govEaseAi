const { chromium } = require('./Frontend/node_modules/playwright');

async function reproduceSidebarBug() {
  console.log('=== STEP 1: REPRODUCING SIDEBAR BUG ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.error('[BROWSER UNCAUGHT ERROR]:', err.message));
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`[REQ] ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`[RES] ${res.status()} ${res.url()}`);
    }
  });

  // 1. Go to login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"], input[type="email"]', '9876543210');
  await page.fill('input[type="password"]', 'Citizen@123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 6000 });
  console.log('Current URL after login:', page.url());

  const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('goveaseai_token'));
  const userAfterLogin = await page.evaluate(() => localStorage.getItem('govease_auth_user'));
  console.log('Token in localStorage:', tokenAfterLogin ? 'EXISTS' : 'NONE');
  console.log('User in localStorage:', userAfterLogin ? 'EXISTS' : 'NONE');

  // Test sidebar links
  const linksToTest = [
    { name: 'Government Services', selector: 'a[href="/services"]', expectedUrl: '/services' },
    { name: 'My Applications', selector: 'a[href="/applications"]', expectedUrl: '/applications' },
    { name: 'AI Assistant', selector: 'a[href="/assistant"]', expectedUrl: '/assistant' },
    { name: 'Notifications', selector: 'a[href="/notifications"]', expectedUrl: '/notifications' },
    { name: 'Profile', selector: 'a[href="/profile"]', expectedUrl: '/profile' },
    { name: 'Settings', selector: 'a[href="/settings"]', expectedUrl: '/settings' },
    { name: 'Dashboard', selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard' },
  ];

  for (const item of linksToTest) {
    console.log(`\n--- Clicking "${item.name}" (${item.selector}) ---`);
    console.log('URL before click:', page.url());

    // Click the sidebar item
    await page.click(item.selector);
    await page.waitForTimeout(1000);

    const destUrl = page.url();
    console.log('URL after click:', destUrl);

    const tokenNow = await page.evaluate(() => localStorage.getItem('goveaseai_token'));
    const userNow = await page.evaluate(() => localStorage.getItem('govease_auth_user'));
    console.log('Token now:', tokenNow ? 'EXISTS' : 'CLEARED');
    console.log('User now:', userNow ? 'EXISTS' : 'CLEARED');

    if (destUrl.includes('/login')) {
      console.log(`>>> BUG REPRODUCED: Redirected to /login on clicking "${item.name}"! <<<`);
      // If redirected to login, re-login to test next items or break
      break;
    }
  }

  await browser.close();
}

reproduceSidebarBug().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
