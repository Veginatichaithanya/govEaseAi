const { chromium } = require('./Frontend/node_modules/playwright');

async function testAllSidebarItems() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.error('[UNCAUGHT ERROR]:', err.message));

  async function ensureLoggedIn() {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"], input[type="email"]', '9876543210');
    await page.fill('input[type="password"]', 'Citizen@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 6000 });
  }

  await ensureLoggedIn();
  console.log('Successfully logged in.');

  const links = [
    { name: 'Government Services', selector: 'a[href="/services"]', expectedUrl: '/services' },
    { name: 'My Applications', selector: 'a[href="/applications"]', expectedUrl: '/applications' },
    { name: 'AI Assistant', selector: 'a[href="/assistant"]', expectedUrl: '/assistant' },
    { name: 'Notifications', selector: 'a[href="/notifications"]', expectedUrl: '/notifications' },
    { name: 'Profile', selector: 'a[href="/profile"]', expectedUrl: '/profile' },
    { name: 'Settings', selector: 'a[href="/settings"]', expectedUrl: '/settings' },
    { name: 'Dashboard', selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard' },
  ];

  for (const item of links) {
    console.log(`\nTesting link: ${item.name}`);
    if (page.url().includes('/login')) {
      await ensureLoggedIn();
    }
    await page.waitForTimeout(300);
    await page.click(item.selector);
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const token = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
    const user = await page.evaluate(() => localStorage.getItem('govease_auth_user'));

    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Token: ${token ? 'VALID' : 'MISSING'}`);
    console.log(`  User: ${user ? 'VALID' : 'MISSING'}`);
    if (currentUrl.includes('/login')) {
      console.log(`  [FAIL] Redirected to /login on clicking ${item.name}!`);
    } else if (currentUrl.includes(item.expectedUrl)) {
      console.log(`  [PASS] Successfully stayed on ${item.expectedUrl}`);
    } else {
      console.log(`  [WARN] Unexpected URL: ${currentUrl}`);
    }
  }

  await browser.close();
}

testAllSidebarItems().catch(err => {
  console.error(err);
  process.exit(1);
});
