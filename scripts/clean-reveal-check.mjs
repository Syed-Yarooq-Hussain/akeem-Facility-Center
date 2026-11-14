import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
page.on('pageerror', e => errors.push(e.message));
await mkdir('test-results', { recursive: true });
try {
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    for (const lang of ['de', 'en', 'fr']) {
      await page.goto(`${base}/${lang}`);
      await page.locator('.clean-stage').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const bounds = await page.locator('.clean-stage').evaluate(el => ({ top: el.getBoundingClientRect().top + scrollY, header: document.querySelector('.header').offsetHeight }));
      const progress = async fraction => {
        await page.evaluate(({ bounds, fraction }) => scrollTo(0, bounds.top - innerHeight * .85 + (innerHeight * .85 - bounds.header - 20) * fraction), { bounds, fraction });
        await page.waitForTimeout(180);
        return page.locator('.clean-stage').evaluate(el => parseFloat(el.style.getPropertyValue('--clean')));
      };
      assert.ok(await progress(0) < 2);
      const beforeTop = await page.locator('.clean-stage').evaluate(el => el.getBoundingClientRect().top);
      assert.ok(Math.abs(await progress(.5) - 50) < 2);
      assert.ok(await page.locator('.clean-stage').evaluate(el => el.getBoundingClientRect().top) < beforeTop - 100, 'Page moves while the image cleans');
      await page.screenshot({ path: `test-results/clean-${lang}-${width}.png` });
      assert.ok(await progress(1) > 98);
      assert.ok(await progress(0) < 2, 'Reverse scroll resets reveal');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      const slider = page.locator('.clean-footer input');
      await slider.focus();
      await slider.press('End');
      assert.equal(await slider.inputValue(), '100');
      await page.locator('.faq-grid summary').first().click();
      assert.equal(await page.locator('.faq-grid details').first().getAttribute('open'), '');
      await page.locator('.faq-grid summary').first().click();
      assert.equal(await page.locator('.header-quote').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(36, 75, 219)');
      if (lang === 'en') {
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); }));
          document.activeElement?.blur();
          scrollTo(0, 0);
        });
        await page.waitForTimeout(200);
        await page.screenshot({ path: `test-results/fresh-${lang}-${width}.png`, fullPage: true });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}/en`);
  await page.locator('.clean-stage').waitFor();
  assert.equal(await page.locator('.clean-stage').evaluate(el => parseFloat(el.style.getPropertyValue('--clean'))), 50);
  assert.equal(await page.locator('.clean-flow').evaluate(el => getComputedStyle(el).position), 'static');
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile, three languages, forward/reverse scroll, keyboard slider, reduced motion, no overflow or runtime errors.');
} finally { await browser.close(); }
