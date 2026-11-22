const { chromium } = require('./Frontend/node_modules/playwright');

async function runTests() {
  console.log('--- Starting GovEaseAI Citizen Dashboard Comprehensive Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedTests++;
    }
  }

  try {
    // 1. Citizen Login Flow
    console.log('\n1. Testing Citizen Login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    assert(page.url().includes('/login'), 'Loaded login page');

    await page.fill('input[type="text"], input[type="email"]', 'citizen@govease.ai');
    await page.fill('input[type="password"]', 'Citizen@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 6000 });
    assert(page.url().includes('/dashboard'), 'Redirected to /dashboard after login');

    // 2. Header Verification
    console.log('\n2. Testing Header Components (Section A & 2)...');
    const headerTitle = await page.textContent('.dashboard-top-header');
    assert(headerTitle.includes('GovEaseAI'), 'Header shows GovEaseAI branding');
    assert(headerTitle.includes('Citizen'), 'Header shows Citizen role badge');

    const searchInput = await page.$('.dashboard-top-header input[placeholder="Search government services..."]');
    assert(searchInput !== null, 'Header contains "Search government services..." input');

    // Test header search navigation
    await page.fill('.dashboard-top-header input[placeholder="Search government services..."]', 'Trade License');
    await page.press('.dashboard-top-header input[placeholder="Search government services..."]', 'Enter');
    await page.waitForURL('**/services?search=Trade%20License', { timeout: 4000 });
    assert(page.url().includes('/services?search=Trade%20License'), 'Header search navigates to /services?search=Trade%20License');

    // Return to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });

    // Test notification bell in header
    const bellBtn = await page.$('.dashboard-top-header button[aria-label="Notifications"]');
    assert(bellBtn !== null, 'Notification icon present in header');
    await bellBtn.click();
    await page.waitForTimeout(300);
    const notifDropdown = await page.$('.glass-panel');
    assert(notifDropdown !== null, 'Notification dropdown opens on bell click');
    // Close dropdown
    await page.keyboard.press('Escape');

    // 3. Welcome Section Verification (Section B & 4)
    console.log('\n3. Testing Welcome Section...');
    const bodyText = await page.textContent('body');
    assert(bodyText.includes('Ravi Kumar'), 'Welcome section includes logged-in citizen name (Ravi Kumar)');
    assert(bodyText.includes('Manage your government applications, services and documents from one place'), 'Welcome subtitle is correct');

    // 4. Application Statistics (Section C & 5)
    console.log('\n4. Testing Application Statistics Cards...');
    assert(bodyText.includes('Total Applications'), 'Total Applications stat card present');
    assert(bodyText.includes('Pending Review'), 'Pending Review stat card present');
    assert(bodyText.includes('Correction Required'), 'Correction Required stat card present');
    assert(bodyText.includes('Approved'), 'Approved stat card present');

    // Test clickable links
    const totalAppsLink = await page.$('a[href="/applications"]');
    assert(totalAppsLink !== null, 'Total Applications card links to /applications');

    const pendingLink = await page.$('a[href="/applications?status=OFFICER_REVIEW"]');
    assert(pendingLink !== null, 'Pending Review card links to /applications?status=OFFICER_REVIEW');

    const correctionLink = await page.$('a[href="/applications?status=CORRECTION_REQUIRED"]');
    assert(correctionLink !== null, 'Correction Required card links to /applications?status=CORRECTION_REQUIRED');

    const approvedLink = await page.$('a[href="/applications?status=APPROVED"]');
    assert(approvedLink !== null, 'Approved card links to /applications?status=APPROVED');

    // Click Pending Review card to test filtering in My Applications
    console.log('\n5. Testing /applications?status=OFFICER_REVIEW link...');
    await pendingLink.click();
    await page.waitForURL('**/applications?status=OFFICER_REVIEW', { timeout: 4000 });
    assert(page.url().includes('status=OFFICER_REVIEW'), 'Navigated to /applications?status=OFFICER_REVIEW');

    // Return to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });

    // 6. Recent Applications (Section D & 6)
    console.log('\n6. Testing Recent Applications Table...');
    assert(bodyText.includes('Recent Applications'), 'Recent Applications section present');
    assert(bodyText.includes('Application ID'), 'Application ID column present');
    assert(bodyText.includes('GEAI-2026-'), 'Displays realistic application ID tokens');

    // 7. Quick Actions (Section F & 9)
    console.log('\n7. Testing Quick Actions...');
    assert(bodyText.includes('Quick Actions'), 'Quick Actions heading present');
    assert(bodyText.includes('Browse Government Services'), 'Browse Government Services action present');
    assert(bodyText.includes('Track Application'), 'Track Application action present');

    // 8. Popular Government Services (Section G & 10)
    console.log('\n8. Testing All 6 Popular Government Services...');
    const servicesRequired = [
      'Trade License',
      'Shop Registration',
      'Business License',
      'Building Permission',
      'Factory Registration',
      'Pollution Certificate'
    ];

    for (const srv of servicesRequired) {
      assert(bodyText.includes(srv), `Service "${srv}" is displayed`);
    }

    // 9. Interactive Service Search Filter (Section 11)
    console.log('\n9. Testing Service Search & Category Filter...');
    const serviceSearchInput = await page.$('input[placeholder*="Search services"]');
    assert(serviceSearchInput !== null, 'Service search filter input is present');

    await serviceSearchInput.fill('pollution');
    await page.waitForTimeout(200);
    let filteredBody = await page.textContent('body');
    assert(filteredBody.includes('Pollution Certificate'), 'Filter displays Pollution Certificate');
    assert(!filteredBody.includes('Kumar Provision Store'), 'Filters out unrelated content');

    // Clear search
    await serviceSearchInput.fill('');
    await page.waitForTimeout(200);

    // 10. AI Guidance & Suggested Questions (Section I & 12, 13)
    console.log('\n10. Testing AI Guidance Card & Suggested Questions...');
    assert(bodyText.includes('Need help with a government service?'), 'AI Guidance card heading present');
    assert(bodyText.includes('What documents do I need?'), 'Suggested question 1 present');
    assert(bodyText.includes('How does the application process work?'), 'Suggested question 2 present');
    assert(bodyText.includes('Can I apply online?'), 'Suggested question 3 present');
    assert(bodyText.includes('What is my application status?'), 'Suggested question 4 present');

    // Click suggested question "Can I apply online?"
    const onlineQBtn = await page.getByRole('button', { name: '"Can I apply online?"' });
    assert(await onlineQBtn.count() > 0, 'Clickable question button found');
    await onlineQBtn.click();
    await page.waitForURL('**/assistant?q=Can%20I%20apply%20online%3F', { timeout: 4000 });
    assert(page.url().includes('/assistant'), 'Navigated to AI Assistant with query');

    // Wait for AI response in chat
    await page.waitForTimeout(1000);
    const chatText = await page.textContent('body');
    assert(chatText.includes('Can I apply online?'), 'Chat shows user message');
    assert(chatText.includes('online via GovEaseAI') || chatText.includes('entire application process online'), 'Chat received automated AI guidance');

    // Return to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });

    // 11. Notifications Summary & Profile Widget (Section H & J)
    console.log('\n11. Testing Notifications & Citizen Profile Summary...');
    const dashText = await page.textContent('body');
    assert(dashText.includes('Citizen Profile'), 'Citizen Profile summary widget present');
    assert(dashText.includes('demo-citizen-001'), 'Citizen ID demo-citizen-001 present');
    assert(dashText.includes('citizen@govease.ai'), 'Citizen email present');
    assert(dashText.includes('+91 98765 43210'), 'Citizen mobile number present');
    assert(dashText.includes('Madhapur, Hyderabad'), 'Citizen address present');

    // 12. Floating AI Assistant Widget (Section 24)
    console.log('\n12. Testing Floating AI Assistant...');
    const floatingBtn = await page.$('.floating-ai-trigger');
    assert(floatingBtn !== null, 'Floating AI button exists in bottom right');
    await floatingBtn.click();
    await page.waitForTimeout(300);
    const floatingChat = await page.$('.floating-chat-window');
    assert(floatingChat !== null, 'Floating AI Assistant panel opens smoothly');

    // Close floating chat
    const closeChatBtn = await page.$('button[aria-label="Close AI Assistant"]');
    if (closeChatBtn) {
      await closeChatBtn.click();
      await page.waitForTimeout(200);
    }

    // 13. Theme Toggle (Section 21 & 22)
    console.log('\n13. Testing Light and Dark Mode Theme Toggle...');
    const themeBtn = await page.$('.theme-toggle-btn');
    assert(themeBtn !== null, 'Theme toggle button present');
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await themeBtn.click();
    await page.waitForTimeout(200);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    assert(initialTheme !== newTheme, `Theme successfully toggled from ${initialTheme} to ${newTheme}`);
    // Toggle back
    await themeBtn.click();

    // 14. Responsive Mobile Layout (Section 25)
    console.log('\n14. Testing Mobile Viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileMenuBtn = await page.$('.dashboard-mobile-menu-btn');
    const isVisible = await mobileMenuBtn.isVisible();
    assert(isVisible, 'Mobile menu toggle button is visible on 375px width');

    // Check header overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert(scrollWidth <= clientWidth + 2, `No horizontal page overflow on mobile (${scrollWidth} <= ${clientWidth})`);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failedTests++;
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('========================================');
  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
