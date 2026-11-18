// Prepare static public-copy translations. No visitor data is sent at runtime.
import fs from 'node:fs/promises';
import { content } from '../src/content.js';
import { modernContent } from '../src/modern-content.js';
import { premiumContent } from '../src/premium-content.js';
import { adminContent } from '../src/admin-content.js';
import { legalCopy } from '../src/legal-content.js';
import { cleanCopy } from '../src/clean-content.js';
import { extraContent } from '../src/extra-content.js';
import { products } from '../shared/catalog.js';
const targets = ['tr','pl','ro','sq','es','el','uk','bg','it'];
const source = { content:content.en, modern:modernContent.en, premium:premiumContent.en, admin:adminContent.en, legal:legalCopy.en, clean:cleanCopy.en, extra:extraContent.en, products:products.map(p=>({name:p.name.en,unit:p.unit.en})) };
const leaves = [];
function walk(v) { if(typeof v==='string') leaves.push(v); else if(v && typeof v==='object') Object.values(v).forEach(walk); }
walk(source);
const strings=[...new Set(leaves)];
async function translate(text,lang) {
 const url=new URL('https://clients5.google.com/translate_a/t');
 for(const [k,v] of Object.entries({client:'dict-chrome-ex',sl:'en',tl:lang,q:text})) url.searchParams.set(k,v);
 for(let attempt=0;attempt<3;attempt++){
  try {
   const r=await fetch(url,{signal:AbortSignal.timeout(45000)});
   if(!r.ok) throw Error(`Translation HTTP ${r.status}`);
   const data=await r.json();
   if(typeof data?.[0]!=='string') throw Error('Unexpected translation response');
   return data[0];
  } catch(error){if(attempt===2)throw error;await new Promise(r=>setTimeout(r,1500));}
 }
}if(process.argv.includes('--probe')) { console.log(await translate('Cleaning services\nContact us','tr')); process.exit(0); }
await fs.mkdir('src/locales',{recursive:true});
for(const lang of targets) {
 let cache={}; try {cache=JSON.parse(await fs.readFile(`src/locales/${lang}.json`,'utf8'));}catch{}
 const missing=strings.filter(s=>!cache[s]);
 const chunks=[]; let chunk=[],length=0;
 for(const s of missing){if(length+s.length>3000){chunks.push(chunk);chunk=[];length=0;}chunk.push(s);length+=s.length+1;} if(chunk.length)chunks.push(chunk);
 for(let i=0;i<chunks.length;i++) {
   const batch=chunks[i];
   const result=await translate(batch.join('\n'),lang);
   const lines=result.split(/\r?\n/);
   if(lines.length===batch.length) batch.forEach((s,j)=>cache[s]=lines[j].trim());
   else for(const s of batch) cache[s]=await translate(s,lang);
   await fs.writeFile(`src/locales/${lang}.json`,JSON.stringify(cache,null,2)+'\n');
   console.log(`${lang}: ${Object.keys(cache).length}/${strings.length}`);
 }
}
