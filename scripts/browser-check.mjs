// Optional browser QA: npm install --no-save --package-lock=false playwright
// Start npm run dev, then: node scripts/browser-check.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('test-results', { recursive: true });
const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
try {
  await page.goto(base + '/de');
  await page.locator('.hero h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  for (const lang of ['de', 'en', 'fr']) {
    for (const route of ['', 'about', 'cleaning', 'laundry', 'facility', 'shop', 'careers', 'contact', 'impressum', 'privacy', 'terms', 'withdrawal']) {
      await page.goto(`${base}/${lang}/${route}`);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Desktop overflow: ${lang}/${route}`);
      assert.equal(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true, `Image broken: ${lang}/${route}`);
    }
  }
  await page.goto(base + '/en/shop');
  await page.getByPlaceholder('Search products …').fill('soap');
  assert.equal(await page.locator('.product-card').count(), 2);
  await page.getByPlaceholder('Search products …').fill('sensitive');
  assert.equal(await page.locator('.product-card').count(), 1);
  await page.getByRole('button', { name: 'Add to cart: Sensitive liquid hand soap', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Shopping cart (1)', exact: true }).click();
  assert.equal(await page.locator('.cart-summary strong').innerText(), '€12.90');
  await page.getByRole('button', { name: 'Quantity +: Sensitive liquid hand soap', exact: true }).click();
  assert.equal(await page.locator('.cart-summary strong').innerText(), '€25.80');
  await page.getByRole('link', { name: 'Request a cart quotation' }).click();
  assert.match(page.url(), /\/en\/checkout$/);
  await page.locator('input[name=name]').fill('Browser QA');
  await page.locator('input[name=email]').fill('qa@example.com');
  await page.locator('input[name=consent]').check();
  await page.getByRole('button', { name: 'Send non-binding product enquiry' }).click();
  await page.locator('.form-error').waitFor();
  assert.equal(await page.locator('.success-panel').count(), 0);
  await page.locator('.language-switch select').selectOption('fr');
  assert.match(page.url(), /\/fr\/checkout$/);
  await page.goto(base + '/de/contact?service=3');
  assert.equal(await page.locator('select[name=service]').inputValue(), '3');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const lang of ['de', 'en', 'fr']) {
    for (const route of ['', 'cleaning', 'laundry', 'shop', 'checkout', 'contact']) {
      await page.goto(`${base}/${lang}/${route}`);
      await page.locator('h1').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Mobile overflow: ${lang}/${route}`);
    }
  }
  await page.goto(base + '/de');
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await page.locator('.desktop-nav.mobile-open').waitFor();
  await page.getByRole('link', { name: 'Wäscheservice', exact: true }).first().click();
  assert.match(page.url(), /\/de\/laundry$/);
  await page.goto(base + '/de');
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.goto(base + '/en/shop');
  await page.screenshot({ path: 'test-results/shop-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: 36 desktop pages, 18 mobile pages, images, cart, search, language switching, mobile menu and honest API failure.');
} finally { await browser.close(); }
