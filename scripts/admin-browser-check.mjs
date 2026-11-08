import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const base='http://127.0.0.1:5180';const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
  await page.goto(base+'/de');await page.locator('.modern-hero h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
  await page.screenshot({path:'test-results/redesign-desktop.png',fullPage:true});
  for(const lang of ['de','en','fr'])for(const route of ['', 'about','cleaning','laundry','facility','shop','careers','contact','impressum','privacy','terms','withdrawal']){
    await page.goto(`${base}/${lang}/${route}`);await page.locator('h1').waitFor();
    await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Desktop overflow ${lang}/${route}`);
    assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true,`Broken image ${lang}/${route}`);
  }
  await page.goto(base+'/en/admin');await page.getByLabel('Admin password',{exact:true}).fill('browser-test-password-123');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.admin-main').waitFor();
  await page.getByRole('button',{name:'Add product',exact:true}).first().click();
  const editor=page.locator('.admin-editor');await editor.getByLabel('Product name (DE)',{exact:true}).fill('QA Reinigungsmittel');await editor.getByLabel('Unit / pack size (DE)',{exact:true}).fill('5 Liter');await editor.getByLabel('Description (DE)',{exact:true}).fill('Ein Testprodukt für die Browserprüfung.');
  await editor.getByLabel('Price in EUR, including VAT',{exact:true}).fill('17.95');
  const fixture=await readFile('public/images/team.svg','utf8');
  const photo=Buffer.from(fixture.split('base64,')[1].split('"')[0],'base64');
  await editor.locator('input[type=file]').setInputFiles({name:'test-photo.jpg',mimeType:'image/jpeg',buffer:photo});await page.waitForFunction(()=>document.querySelector('.admin-editor input[type=text]')?.value.startsWith('/api/media'));
  await editor.getByRole('button',{name:'EN',exact:true}).click();await editor.getByLabel('Product name (EN)',{exact:true}).fill('QA Professional Cleaner');await editor.getByLabel('Unit / pack size (EN)',{exact:true}).fill('5 litres');
  await editor.getByRole('button',{name:'Save product',exact:true}).click();await page.locator('.admin-success').waitFor();
  assert.equal(await page.locator('.admin-product-row').count(),1);
  await page.screenshot({path:'test-results/admin-desktop.png',fullPage:true});
  await page.goto(base+'/en/shop');await page.getByRole('button',{name:'Add to cart: QA Professional Cleaner',exact:true}).waitFor();
  assert.equal(await page.locator('.product-card').count(),1);
  assert.equal(await page.locator('.catalog-product-photo').evaluate(i=>i.complete&&i.naturalWidth>0),true);
  await page.getByRole('button',{name:'Add to cart: QA Professional Cleaner',exact:true}).click();
  await page.getByRole('button',{name:'Shopping cart (1)',exact:true}).click();assert.equal(await page.locator('.cart-summary strong').innerText(),'€17.95');
  await page.getByRole('button',{name:'Quantity +: QA Professional Cleaner',exact:true}).click();assert.equal(await page.locator('.cart-summary strong').innerText(),'€35.90');
  await page.getByRole('link',{name:'Request a cart quotation'}).click();await page.locator('input[name=name]').fill('QA Customer');await page.locator('input[name=email]').fill('qa@example.com');await page.locator('input[name=consent]').check();await page.getByRole('button',{name:'Send non-binding product enquiry'}).click();await page.locator('.success-panel').waitFor();
  await page.goto(base+'/en/admin');await page.getByRole('button',{name:'Enquiries',exact:true}).click();await page.getByText('QA Customer',{exact:true}).waitFor();
  await page.getByRole('button',{name:/^Products/}).click();await page.getByRole('button',{name:'Edit product: QA Professional Cleaner',exact:true}).click();
  await page.locator('.admin-editor').getByLabel('Price in EUR, including VAT',{exact:true}).fill('21.50');await page.locator('.admin-editor').getByLabel('Publish in the shop',{exact:true}).uncheck();await page.locator('.admin-editor').getByRole('button',{name:'Save product',exact:true}).click();await page.locator('.admin-success').waitFor();
  await page.goto(base+'/en/shop');await page.getByText('Our product range is being prepared.',{exact:true}).waitFor();assert.equal(await page.locator('.product-card').count(),0);
  await page.goto(base+'/en/admin');await page.getByRole('button',{name:'Edit product: QA Professional Cleaner',exact:true}).click();await page.locator('.admin-editor').getByLabel('Publish in the shop',{exact:true}).check();await page.locator('.admin-editor').getByRole('button',{name:'Save product',exact:true}).click();await page.locator('.admin-success').waitFor();
  await page.goto(base+'/en/shop');await page.getByRole('button',{name:'Add to cart: QA Professional Cleaner',exact:true}).waitFor();assert.equal(await page.locator('.product-price>strong').innerText(),'€21.50');
  await page.setViewportSize({width:390,height:844});
  for(const lang of ['de','en','fr'])for(const route of ['', 'about','cleaning','laundry','facility','shop','careers','contact','admin']){
    await page.goto(`${base}/${lang}/${route}`);await page.locator('h1').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Mobile overflow ${lang}/${route}`);
  }
  await page.goto(base+'/de');await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.waitForTimeout(900);await page.screenshot({path:'test-results/redesign-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Menü öffnen'}).click();await page.locator('.desktop-nav.mobile-open').waitFor();await page.getByRole('link',{name:'Wäscheservice',exact:true}).first().click();assert.match(page.url(),/\/de\/laundry$/);
  await page.goto(base+'/en/admin');await page.screenshot({path:'test-results/admin-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Archive: QA Professional Cleaner',exact:true}).click();await page.getByText('Your catalog starts here.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Admin password',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log('Passed: multilingual desktop/mobile pages, images, admin login, photo upload, product create/edit/publish/archive, real API cart pricing, saved product enquiry, enquiry inbox and logout (isolated test database).');
}finally{await browser.close();}
