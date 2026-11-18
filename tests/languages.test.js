import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {languages} from '../shared/languages.js';
import {validateContact} from '../server/validation.js';
import {validateProduct} from '../server/product-validation.js';
import {content} from '../src/content.js';
import {modernContent} from '../src/modern-content.js';
import {premiumContent} from '../src/premium-content.js';
import {adminContent} from '../src/admin-content.js';
import {legalCopy} from '../src/legal-content.js';
import {cleanCopy} from '../src/clean-content.js';
import {extraContent} from '../src/extra-content.js';
function strings(v){return typeof v==='string'?[v]:v&&typeof v==='object'?Object.values(v).flatMap(strings):[];}
test('all nine new locales cover every static content string',()=>{
 const required=new Set([content,modernContent,premiumContent,adminContent,legalCopy,cleanCopy,extraContent].flatMap(c=>strings(c.en)));
 for(const lang of languages.filter(l=>!['de','en','fr'].includes(l))){
  const dictionary=JSON.parse(fs.readFileSync(new URL(`../src/locales/${lang}.json`,import.meta.url),'utf8'));
  for(const text of required)assert.ok(typeof dictionary[text]==='string' && dictionary[text].trim(),`${lang}: missing ${text}`);
 }
});
test('form validation retains all supported language codes',()=>{
 for(const language of languages)assert.equal(validateContact({name:'Locale test',email:'test@example.com',service:'0',message:'Test',consent:true,language}).language,language);
});
test('product editing preserves translations in every supported language',()=>{
 const name=Object.fromEntries(languages.map(l=>[l,`Product ${l}`]));
 const product=validateProduct({name,unit:name,description:name,price:100,category:1,active:true});
 for(const lang of languages)assert.equal(product.name[lang],name[lang]);
});
