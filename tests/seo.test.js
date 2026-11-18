import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { languages } from '../shared/languages.js';
import { indexablePages, privatePages, draftPages, productionOrigin, siteOrigin } from '../shared/seo-config.js';
const read=p=>fs.readFileSync(new URL('../dist/'+p,import.meta.url),'utf8');
test('public pages have rendered content, canonical, multilingual links and schema without JavaScript',()=>{
 for(const lang of languages)for(const page of indexablePages){
  const route=`${lang}${page?'/'+page:''}`;const html=read(route+'.html');
  assert.ok(html.includes(`<html lang="${lang}">`),route);
  assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}/${route}">`),route);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,route);
  assert.equal((html.match(/hreflang=/g)||[]).length,13,route);
  assert.ok(html.includes('content="index, follow, max-image-preview:large"'),route);
  assert.match(html,/<h1[\s>]/,route);
  assert.ok(html.includes('C. Agbanyo') && html.includes('Borselstraße 20'),route);
  assert.ok(html.includes('property="og:title"') && html.includes('name="twitter:card"'),route);
  const schema=JSON.parse(html.match(/<script id="business-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const business=schema['@graph'].find(v=>v['@type']==='LocalBusiness');
  assert.equal(business.address.postalCode,'22765');assert.equal(business.email,'info@williamsfacility.com');
  assert.equal(business.telephone,undefined);assert.equal(business.aggregateRating,undefined);
 }
});
test('sitemap contains canonical public pages and excludes private/draft routes',()=>{
 const sitemap=read('sitemap.xml');
 assert.equal((sitemap.match(/<loc>/g)||[]).length,languages.length*indexablePages.length);
 assert.ok(!/admin|checkout|impressum|privacy|terms|withdrawal|\.vercel\.app/.test(sitemap));
 assert.ok(read('robots.txt').includes(`Sitemap: ${productionOrigin}/sitemap.xml`));
 assert.ok(!/Disallow:.*(?:admin|checkout)/.test(read('robots.txt')));
});
test('private, draft and error pages cannot be indexed',()=>{
 for(const lang of languages)for(const page of [...privatePages,...draftPages])assert.ok(read(`${lang}/${page}.html`).includes('content="noindex, follow"'));
 assert.ok(read('404.html').includes('content="noindex, follow"'));
 assert.ok(read('admin.html').includes('content="noindex, follow"'));
});
test('canonical origin rejects placeholder or non-HTTPS domains',()=>{
 assert.equal(siteOrigin(),productionOrigin);
 assert.throws(()=>siteOrigin('https://williams-facility.example'));
 assert.throws(()=>siteOrigin('http://www.williamsfacility.com'));
});
test('Vercel uses static routes and redirects the old host',()=>{
 const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.cleanUrls,true);assert.equal(config.rewrites,undefined);
 assert.ok(config.redirects.some(r=>r.source==='/' && r.destination==='/de'));
 assert.ok(config.redirects.some(r=>r.has?.[0]?.value==='akeem-facility-center.vercel.app' && r.destination.startsWith(productionOrigin)));
});
