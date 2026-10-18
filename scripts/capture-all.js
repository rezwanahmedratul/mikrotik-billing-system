const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject authentication state in localStorage before navigation
  await context.addInitScript(() => {
    localStorage.setItem('token', 'mock-valid-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-admin-fastnet',
        email: 'admin@fastnet.com',
        fullName: 'Ahsan Rahman',
        role: 'ISP_ADMIN',
        tenantId: 't-fastnet',
      })
    );
    localStorage.setItem(
      'tenant',
      JSON.stringify({
        id: 't-fastnet',
        name: 'FastNet Broadband Ltd',
        code: 'FASTNET',
      })
    );
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        name: 'Ahsan Rahman',
        role: 'ISP_ADMIN',
        tenantName: 'FastNet Broadband Ltd',
      })
    );
  });

  const page = await context.newPage();

  async function setTheme(theme) {
    await page.evaluate((t) => {
      localStorage.setItem('theme', t);
      localStorage.setItem('theme-mode', t);
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);
    await page.waitForTimeout(200);
  }

  const pagesToCapture = [
    { name: 'landing', url: 'http://localhost:3000/' },
    { name: 'login', url: 'http://localhost:3000/login' },
    { name: 'onboarding', url: 'http://localhost:3000/onboarding' },
    { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'subscribers', url: 'http://localhost:3000/dashboard/subscribers' },
    { name: 'subscriber-detail', url: 'http://localhost:3000/dashboard/subscribers/sub-1' },
    { name: 'sessions', url: 'http://localhost:3000/dashboard/sessions' },
    { name: 'routers', url: 'http://localhost:3000/dashboard/routers' },
    { name: 'router-pppoe-wizard', url: 'http://localhost:3000/dashboard/routers/r-core-1/pppoe-setup' },
    { name: 'packages', url: 'http://localhost:3000/dashboard/packages' },
    { name: 'invoices', url: 'http://localhost:3000/dashboard/invoices' },
    { name: 'payments', url: 'http://localhost:3000/dashboard/payments' },
    { name: 'billing-runs', url: 'http://localhost:3000/dashboard/billing-runs' },
    { name: 'lifecycle', url: 'http://localhost:3000/dashboard/lifecycle' },
    { name: 'notifications', url: 'http://localhost:3000/dashboard/notifications' },
    { name: 'reports-collections', url: 'http://localhost:3000/dashboard/reports' },
    { name: 'staff', url: 'http://localhost:3000/dashboard/staff' },
    { name: 'settings', url: 'http://localhost:3000/dashboard/settings' },
  ];

  for (const item of pagesToCapture) {
    console.log(`Capturing ${item.name} in light & dark mode...`);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(600);

      // Light mode
      await setTheme('light');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${item.name}-light.png`),
        fullPage: true,
      });

      // Dark mode
      await setTheme('dark');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${item.name}-dark.png`),
        fullPage: true,
      });
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message);
    }
  }

  // Modals capture in dark mode & light mode
  console.log('Capturing interactive modals...');
  try {
    // 1. Add Subscriber Modal
    await page.goto('http://localhost:3000/dashboard/subscribers', { waitUntil: 'networkidle' });
    const addSubBtn = page.locator('button:has-text("Register Subscriber")');
    if (await addSubBtn.isVisible()) {
      await setTheme('dark');
      await addSubBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-add-subscriber-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-add-subscriber-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 2. Add Package Modal
    await page.goto('http://localhost:3000/dashboard/packages', { waitUntil: 'networkidle' });
    const addPkgBtn = page.locator('button:has-text("Create Package")');
    if (await addPkgBtn.isVisible()) {
      await setTheme('dark');
      await addPkgBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-add-package-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-add-package-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 3. Register Router Modal
    await page.goto('http://localhost:3000/dashboard/routers', { waitUntil: 'networkidle' });
    const addRouterBtn = page.locator('button:has-text("Add Router Gateway")');
    if (await addRouterBtn.isVisible()) {
      await setTheme('dark');
      await addRouterBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-register-router-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-register-router-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 4. Test Router Result Modal
    await page.goto('http://localhost:3000/dashboard/routers', { waitUntil: 'networkidle' });
    const testRouterBtn = page.locator('button:has-text("Test")').first();
    if (await testRouterBtn.isVisible()) {
      await setTheme('dark');
      await testRouterBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-router-test-result-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-router-test-result-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 5. Add Staff Modal
    await page.goto('http://localhost:3000/dashboard/staff', { waitUntil: 'networkidle' });
    const inviteStaffBtn = page.locator('button:has-text("Add Team Member")');
    if (await inviteStaffBtn.isVisible()) {
      await setTheme('dark');
      await inviteStaffBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-invite-staff-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-invite-staff-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 6. Record Payment Modal
    await page.goto('http://localhost:3000/dashboard/invoices', { waitUntil: 'networkidle' });
    const recPayBtn = page.locator('button:has-text("Pay")').first();
    if (await recPayBtn.isVisible()) {
      await setTheme('dark');
      await recPayBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-record-payment-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-record-payment-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 7. Invoice Receipt Modal
    await page.goto('http://localhost:3000/dashboard/invoices', { waitUntil: 'networkidle' });
    const receiptBtn = page.locator('button:has-text("Receipt")').first();
    if (await receiptBtn.isVisible()) {
      await setTheme('dark');
      await receiptBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-invoice-receipt-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-invoice-receipt-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 8. Service Status Suspend Dialog
    await page.goto('http://localhost:3000/dashboard/subscribers/sub-1', { waitUntil: 'networkidle' });
    const suspendBtn = page.locator('button:has-text("Suspend Service")');
    if (await suspendBtn.isVisible()) {
      await setTheme('dark');
      await suspendBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-service-status-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-service-status-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 9. Disconnect Session Dialog
    await page.goto('http://localhost:3000/dashboard/sessions', { waitUntil: 'networkidle' });
    const discBtn = page.locator('button:has-text("Disconnect")').first();
    if (await discBtn.isVisible()) {
      await setTheme('dark');
      await discBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-disconnect-session-dark.png') });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal-disconnect-session-light.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 10. Reports Aging & Growth tabs
    await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle' });
    const agingTabBtn = page.locator('button:has-text("Aging Schedule")');
    if (await agingTabBtn.isVisible()) {
      await setTheme('dark');
      await agingTabBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-aging-dark.png'), fullPage: true });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-aging-light.png'), fullPage: true });
    }
    const growthTabBtn = page.locator('button:has-text("Subscriber Growth")');
    if (await growthTabBtn.isVisible()) {
      await setTheme('dark');
      await growthTabBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-growth-dark.png'), fullPage: true });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-growth-light.png'), fullPage: true });
    }
    const auditTabBtn = page.locator('button:has-text("Audit Trail Log")');
    if (await auditTabBtn.isVisible()) {
      await setTheme('dark');
      await auditTabBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-audit-dark.png'), fullPage: true });
      await setTheme('light');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'reports-audit-light.png'), fullPage: true });
    }
  } catch (err) {
    console.error('Error capturing modals:', err.message);
  }

  await browser.close();
  console.log('All screenshots captured successfully in', SCREENSHOT_DIR);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
