import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {languages} from '../shared/languages.js';
import {products} from '../shared/catalog.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_BASE_URL||'http://localhost:4173';
await page.route('**/api/products',r=>r.fulfill({json:{source:'demo',products}}));
await page.route('**/api/admin?*',r=>r.fulfill({status:401,json:{error:'Unauthorized'}}));
try{
 for(const lang of languages){
  for(const route of ['','cleaning','laundry','facility','about','careers','contact','shop','checkout','impressum','privacy','terms','withdrawal']){
   await page.goto(`${base}/${lang}/${route}`);await page.locator('h1').waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('.language-switch option').count(),12);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang}/${route} overflows`);
   assert.ok(!(await page.locator('main').innerText()).includes('undefined'),`${lang}/${route}: missing text`);
   if(route==='contact'){
    assert.ok((await page.locator('aside').innerText()).includes('C. Agbanyo'));
    assert.ok((await page.locator('aside').innerText()).includes('I. Bericha'));
    assert.ok((await page.locator('aside').innerText()).includes('Borselstraße 20'));
   }
   if(route==='shop')assert.equal(await page.locator('.product-card').count(),products.length);
  }
  await page.goto(`${base}/${lang}/contact?service=2`);
  const next=languages[(languages.indexOf(lang)+1)%languages.length];
  await page.locator('.language-switch select').selectOption(next);
  await page.waitForURL(`**/${next}/contact?service=2`);
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),next);
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/${lang}/contact`);await page.locator('h1').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang}: mobile overflow`);
  await page.screenshot({path:`test-results/contact-${lang}.png`});
  await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS ${lang}: 13 routes, contacts, shop, mobile, language switching`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
