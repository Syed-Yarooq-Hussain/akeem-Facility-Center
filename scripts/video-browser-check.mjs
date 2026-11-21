import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('test-results', { recursive: true });
try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:5173/de');
    const hero = page.locator('.cleaning-video-hero video');
    await page.waitForFunction(() => { const v = document.querySelector('.cleaning-video-hero video'); return v && v.readyState >= 2 && !v.paused; });
    await page.locator('.cleaning-video-hero button').click();
    assert.ok(await hero.evaluate(v => v.paused), 'Pause control works');
    await page.locator('.cleaning-video-hero button').click();
    await page.screenshot({ path: `test-results/video-hero-${width}.png` });
    assert.equal(await page.locator('video').count(), 1, 'Only the hero video remains');
    assert.equal(await page.locator('.header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(16, 43, 78)');
    await page.locator('.premium-about').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.premium-about img').count(), 2);
    const overflow = await page.evaluate(() => ({ width: innerWidth, actual: document.documentElement.scrollWidth, nodes: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,12).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }));
    assert.ok(overflow.actual <= width, JSON.stringify(overflow));
    await page.screenshot({ path: `test-results/video-feature-${width}.png` });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:5173/en');
  await page.waitForTimeout(500);
  assert.ok(await page.locator('.cleaning-video-hero video').evaluate(v => v.paused), 'Reduced motion disables autoplay');
  assert.deepEqual(errors, []);
  console.log('PASS: video playback, pause/resume, responsive layout and reduced motion.');
} finally { await browser.close(); }

