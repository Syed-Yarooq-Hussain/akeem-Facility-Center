import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL || 'http://localhost:4173';
const origin='https://www.williamsfacility.com';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const plain=await browser.newContext({javaScriptEnabled:false});const crawler=await plain.newPage();
 for(const route of ['/de','/en/cleaning','/tr/contact','/uk/about']){
  await crawler.goto(base+route);
  assert.ok((await crawler.locator('h1').innerText()).trim());
  assert.equal(await crawler.locator('link[rel=canonical]').getAttribute('href'),origin+route);
  assert.equal(await crawler.locator('link[hreflang]').count(),13);
  assert.ok((await crawler.locator('body').innerText()).includes('Borselstraße 20'));
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/de');await page.locator('.clean-stage').waitFor();
 await page.locator('.footer a[href="/de/privacy"]').click();
 await page.waitForURL('**/de/privacy');
 assert.ok((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
 await page.locator('.header .logo').click();await page.waitForURL('**/de');
 await page.waitForFunction(()=>document.querySelector('meta[name=robots]')?.content==='index, follow, max-image-preview:large');
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index, follow, max-image-preview:large');
 await page.locator('.language-switch select').selectOption('pl');await page.waitForURL('**/pl');
 await page.waitForFunction(()=>document.querySelector('link[rel=canonical]')?.href.endsWith('/pl'));
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+'/pl');
 assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),origin+'/pl');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: readable without JavaScript, canonical/hreflang, client navigation, noindex reset, social metadata and mobile layout.');
}finally{await browser.close();}
