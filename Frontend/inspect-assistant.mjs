import { chromium } from 'playwright';
import path from 'path';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem('govease_auth_token', 'demo_jwt_token_12345');
    localStorage.setItem('govease_auth_user', JSON.stringify({
      id: 'cit_user_001',
      name: 'Ravi Kumar',
      fullName: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      mobile: '+91 9876543210',
      role: 'citizen',
      applicantId: 'APP-2026-0042',
      profileCompletion: 85
    }));
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/services/trade-license/assistant');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.resolve('test-screenshots', 'current-assistant-desktop.png') });
  console.log('Saved screenshot to test-screenshots/current-assistant-desktop.png');

  await browser.close();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
