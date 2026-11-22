const { chromium } = require('./Frontend/node_modules/playwright');

async function runAuthUITests() {
  console.log('====================================================');
  console.log('STARTING GOVEASEAI AUTHENTICATION UI PLAYWRIGHT TEST');
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
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Phone + WRONG Password MUST NOT Log In
    // ----------------------------------------------------
    console.log('\n--- Test 1: Phone + WRONG Password Rejection ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    assert(page.url().includes('/login'), 'Loaded /login');

    await page.fill('#login-identifier', '9876543210');
    await page.fill('#login-password', 'WrongPassword@999');
    await page.click('#citizen-signin-btn');

    // Wait short time for network response and error render
    await page.waitForTimeout(1000);

    assert(page.url().includes('/login'), 'URL remained on /login after wrong password');

    const errorBanner = await page.$('div[role="alert"]');
    assert(errorBanner !== null, 'Error alert banner displayed on wrong password');
    if (errorBanner) {
      const errorText = await errorBanner.innerText();
      console.log(`  Reported error text: "${errorText.trim()}"`);
      assert(errorText.includes('Invalid phone number/email or password'), 'Error alert shows "Invalid phone number/email or password"');
    }

    const tokenInStorage = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
    assert(tokenInStorage === null, 'No auth token stored in localStorage on failed login');

    // ----------------------------------------------------
    // TEST 2: Phone + CORRECT Password Login & Greeting
    // ----------------------------------------------------
    console.log('\n--- Test 2: Phone + CORRECT Password Login & Identity Greeting ---');
    await page.fill('#login-identifier', '9876543210');
    await page.fill('#login-password', 'Citizen@123');
    await page.click('#citizen-signin-btn');

    await page.waitForURL('**/dashboard', { timeout: 6000 });
    assert(page.url().includes('/dashboard'), 'Redirected to /dashboard after correct login');

    // Wait for profile to load
    await page.waitForTimeout(1500);

    // Verify Greeting
    await page.waitForSelector('#citizen-greeting', { timeout: 6000 });
    const greetingEl = await page.$('#citizen-greeting');
    assert(greetingEl !== null, 'Greeting h1 element found');
    if (greetingEl) {
      const greetingText = (await greetingEl.innerText()).trim();
      console.log(`  Actual dashboard greeting: "${greetingText}"`);
      assert(greetingText.includes('Ravi Kumar'), 'Greeting displays full_name "Ravi Kumar"');
      assert(!greetingText.includes('9876543210'), 'Greeting does NOT display phone number "9876543210"');
    }

    // Verify Sidebar
    const sidebarText = await page.textContent('.desktop-citizen-sidebar');
    assert(sidebarText.includes('Ravi Kumar'), 'Sidebar displays citizen name "Ravi Kumar"');
    assert(sidebarText.includes('cit-ravi-01'), 'Sidebar displays Applicant ID "cit-ravi-01"');

    // Verify Header initial and name
    const headerProfile = await page.textContent('.header-profile-text');
    assert(headerProfile.includes('Ravi'), 'Header displays citizen first name "Ravi"');

    // ----------------------------------------------------
    // TEST 3: Logout & Protected Route Enforcement
    // ----------------------------------------------------
    console.log('\n--- Test 3: Logout & Route Protection ---');
    // Click logout button in sidebar
    const logoutBtn = await page.$('.desktop-citizen-sidebar .sidebar-logout-btn');
    assert(logoutBtn !== null, 'Found Logout button in sidebar');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 4000 });
      assert(page.url().includes('/login'), 'Redirected to /login after logout');
    }

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('govease_auth_token'));
    assert(tokenAfterLogout === null, 'Token cleared from localStorage after logout');

    // Attempt direct navigation to /dashboard without session
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    assert(page.url().includes('/login'), 'Direct visit to /dashboard unauthenticated redirected to /login');

    // ----------------------------------------------------
    // TEST 4: Citizen B Login & Greeting Personalization
    // ----------------------------------------------------
    console.log('\n--- Test 4: Citizen B Login & Personalization ---');
    // Log in with the newly created test citizen from audit
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#login-identifier', '9889788946');
    await page.fill('#login-password', 'TestCitizen@2026');
    await page.click('#citizen-signin-btn');

    await page.waitForURL('**/dashboard', { timeout: 6000 });
    assert(page.url().includes('/dashboard'), 'Citizen B redirected to /dashboard');

    await page.waitForSelector('#citizen-greeting', { timeout: 6000 });
    const greetingElB = await page.$('#citizen-greeting');
    if (greetingElB) {
      const greetingTextB = (await greetingElB.innerText()).trim();
      console.log(`  Citizen B greeting: "${greetingTextB}"`);
      assert(greetingTextB.includes('Chaitanya Verification User'), 'Citizen B greeting displays "Chaitanya Verification User"');
      assert(!greetingTextB.includes('9889788946'), 'Citizen B greeting does NOT display phone number');
      assert(!greetingTextB.includes('Ravi Kumar'), 'Citizen B does NOT see Citizen A name');
    }

    // Logout Citizen B
    const logoutBtnB = await page.$('.desktop-citizen-sidebar .sidebar-logout-btn');
    if (logoutBtnB) {
      await logoutBtnB.click();
      await page.waitForURL('**/login', { timeout: 4000 });
    }

    // ----------------------------------------------------
    // TEST 5: Officer Login & Wrong Password Rejection
    // ----------------------------------------------------
    console.log('\n--- Test 5: Officer Login & Password Verification ---');
    await page.goto('http://localhost:5173/officer/login', { waitUntil: 'domcontentloaded' });
    assert(page.url().includes('/officer/login'), 'Loaded /officer/login');

    // Select Municipal Licensing Division
    await page.selectOption('select#department-select', 'municipal-licensing');
    await page.fill('input[type="email"]', 'licensing@goveaseai.gov');
    await page.fill('input[type="password"]', 'WrongOfficerPassword@999');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    assert(page.url().includes('/officer/login'), 'Officer remained on /officer/login on wrong password');

    // Correct officer credentials
    await page.fill('input[type="password"]', 'License@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/officer/dashboard', { timeout: 6000 });
    assert(page.url().includes('/officer/dashboard'), 'Officer redirected to /officer/dashboard on correct credentials');

    await page.waitForTimeout(1500);
    const officerBody = await page.textContent('body');
    assert(officerBody.includes('S. Narayanan'), 'Officer dashboard displays officer name "S. Narayanan"');
    assert(officerBody.includes('Municipal Licensing Division'), 'Officer dashboard shows "Municipal Licensing Division"');

  } catch (err) {
    console.error('Error executing Playwright test:', err);
    failed++;
  } finally {
    await browser.close();
    console.log('\n====================================================');
    console.log(`PLAYWRIGHT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAuthUITests();
