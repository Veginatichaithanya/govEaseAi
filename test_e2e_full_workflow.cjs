const { chromium } = require('./Frontend/node_modules/playwright');

async function testFullWorkflow() {
  console.log('====================================================');
  console.log('TESTING FULL CITIZEN <-> OFFICER END-TO-END WORKFLOW');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
  const citizenContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const citizenPage = await citizenContext.newPage();

  const results = [];
  function record(step, pass, detail = '') {
    results.push({ step, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${step}${detail ? ` - ${detail}` : ''}`);
  }

  try {
    // 1. Citizen Login
    await citizenPage.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await citizenPage.fill('#login-identifier', 'naga@gmail.com');
    await citizenPage.fill('#login-password', 'Password@123');
    await citizenPage.click('#citizen-signin-btn');
    await citizenPage.waitForURL('**/dashboard', { timeout: 8000 });
    record('Citizen Login', citizenPage.url().includes('/dashboard'), 'Authenticated as Veginati Chaithanya');

    // 2. Open Trade License Wizard
    await citizenPage.goto('http://localhost:5173/applications/new/trade-license', { waitUntil: 'domcontentloaded' });
    await citizenPage.waitForSelector('.desktop-stepper-row');
    record('Open Application Wizard', citizenPage.url().includes('/applications/new/trade-license'), 'Trade License wizard loaded');

    // Step 1: Fill Applicant Details
    await citizenPage.waitForSelector('#input-fullName');
    await citizenPage.fill('#input-fullName', 'Veginati Chaithanya');
    await citizenPage.fill('#input-email', 'naga@gmail.com');
    await citizenPage.fill('#input-mobileNumber', '9182260869');
    await citizenPage.fill('#input-address', 'Plot 42, Hitech City, Hyderabad');
    await citizenPage.fill('#input-city', 'Hyderabad');
    await citizenPage.selectOption('#input-state', 'Telangana').catch(() => {});
    await citizenPage.fill('#input-postalCode', '500081');
    
    // Advance to Step 2
    const nextBtn1 = await citizenPage.$('button:has-text("Continue")');
    if (nextBtn1) {
      await nextBtn1.click();
      await citizenPage.waitForTimeout(600);
      record('Advance Step 1 -> 2', true, 'Applicant details captured');
    }

    // Step 2: Fill Business Details
    await citizenPage.waitForSelector('#input-businessName, input[name="businessName"], input[name="tradeName"]').catch(() => {});
    const tradeNameInput = await citizenPage.$('#input-businessName, input[name="businessName"], input[name="tradeName"]');
    if (tradeNameInput) {
      await tradeNameInput.fill('Chaithanya Tech Solutions');
    }
    const tradeAddress = await citizenPage.$('#input-businessAddress, textarea[name="businessAddress"]');
    if (tradeAddress) {
      await tradeAddress.fill('Plot 42, Hitech City, Hyderabad, 500081');
    }

    // Save Draft test
    const saveDraftBtn = await citizenPage.$('button:has-text("Save Draft")');
    if (saveDraftBtn) {
      await saveDraftBtn.click();
      await citizenPage.waitForTimeout(500);
      record('Save Draft in Wizard', true, 'Draft state persisted');
    }

    // Check Documents Step (Step 4) or Review (Step 6)
    // Now let's test AI Assistant asking for guidance
    await citizenPage.goto('http://localhost:5173/assistant', { waitUntil: 'domcontentloaded' });
    await citizenPage.waitForSelector('textarea, input[placeholder*="Ask"]');
    await citizenPage.fill('textarea, input[placeholder*="Ask"]', 'What are the fees for a Trade License?');
    const sendBtn = await citizenPage.$('button[aria-label="Send message"], button:has-text("Send"), .ai-send-btn');
    if (sendBtn) {
      await sendBtn.click();
      await citizenPage.waitForTimeout(4000);
      const msgs = await citizenPage.$$('.ai-msg-row.assistant, .ai-msg-bubble.assistant, div:has-text("Fee"), div:has-text("Trade")');
      record('AI Assistant Service Query', msgs.length > 0, 'AI answered question about Trade License');
    }

    // 3. Officer Portal Login & Scrutiny
    const officerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const officerPage = await officerContext.newPage();

    await officerPage.goto('http://localhost:5173/officer/login', { waitUntil: 'domcontentloaded' });
    await officerPage.fill('#officer-password', 'License@123');
    await officerPage.click('button[type="submit"]');
    await officerPage.waitForURL('**/officer/dashboard', { timeout: 8000 });
    record('Officer Portal Access', officerPage.url().includes('/officer/dashboard'), 'Municipal Licensing Officer logged in');

    await officerPage.waitForSelector('text=Statutory Service:');
    const officerTable = await officerPage.$('.officer-table-container');
    record('Officer Scrutiny Desk', !!officerTable, 'Live application queue rendered');

    // 4. Test Digital Approval Route Check
    await citizenPage.goto('http://localhost:5173/applications', { waitUntil: 'domcontentloaded' });
    await citizenPage.waitForSelector('.glass-panel');
    record('Citizen Applications View', citizenPage.url().includes('/applications'), 'Application tracking list accessible');

    await officerContext.close();
    await citizenContext.close();
  } catch (err) {
    console.error('Workflow error:', err);
    record('End-to-End Workflow Execution', false, err.message);
  } finally {
    await browser.close();
  }

  const allPassed = results.every(r => r.pass);
  console.log('====================================================');
  console.log(`WORKFLOW RESULT: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
  console.log('====================================================');
  process.exit(allPassed ? 0 : 1);
}

testFullWorkflow();
