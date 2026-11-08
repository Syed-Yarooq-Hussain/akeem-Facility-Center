import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticated, createSession, hashPassword, verifyPassword, sameOrigin, sessionCookie } from '../server/auth.js';
import { validateProduct, decodeImage } from '../server/product-validation.js';
import { makeAdminHandler } from '../server/admin.js';
import { loadCatalog } from '../server/catalog.js';
import { makeHandler } from '../server/handlers.js';
import { memoryDatabase } from './memory-db.js';

process.env.ADMIN_SESSION_SECRET='test-session-secret-never-used-in-production-123';
process.env.ADMIN_PASSWORD_HASH=hashPassword('test-only-password-123');
const headers={host:'localhost:5173',origin:'http://localhost:5173','content-type':'application/json'};
const req=(action,method='GET',body,cookie)=>({method,headers:{...headers,...(cookie?{cookie}:{})},query:{action},body});
function response(){return{headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
const sample={name:{de:'Testprodukt',en:'Test product',fr:'Produit test'},unit:{de:'5 Liter'},description:{de:'Beschreibung'},price:1595,category:2,active:true,imageUrl:''};

test('admin password hashes, signatures, expiry and secure cookie flags',()=>{
  assert.equal(verifyPassword('test-only-password-123',process.env.ADMIN_PASSWORD_HASH),true);
  assert.equal(verifyPassword('wrong',process.env.ADMIN_PASSWORD_HASH),false);
  const token=createSession(1000000); const request={headers:{cookie:'wfs_admin='+token}};
  assert.equal(authenticated(request,1000001),true);
  assert.equal(authenticated(request,1000000+8*3600000),false);
  assert.equal(authenticated({headers:{cookie:'wfs_admin='+token.slice(0,-2)+'xx'}},1000001),false);
  assert.match(sessionCookie(token),/HttpOnly; SameSite=Strict/);
  assert.equal(sameOrigin({headers:{host:'shop.example',origin:'https://evil.example'}}),false);
});
test('product validation rejects injection, unsafe image sources and invalid prices',()=>{
  for(const data of [{...sample,price:-1},{...sample,price:1.5},{...sample,category:9},{...sample,name:{de:{$gt:''}}},{...sample,imageUrl:'javascript:alert(1)'},{...sample,imageUrl:'data:image/svg+xml,<svg/>'},{...sample,imageUrl:'http://example.com/photo.jpg'}])assert.throws(()=>validateProduct(data));
  const product=validateProduct(sample);assert.equal(product.name.fr,'Produit test');assert.equal(product.unit.en,'5 Liter');assert.equal(product.description.fr,'Beschreibung');
});
test('photo uploads verify file magic bytes, supported types and size',()=>{
  assert.throws(()=>decodeImage('data:image/jpeg;base64,'+Buffer.from('this is not a photograph').toString('base64')));
  assert.throws(()=>decodeImage('data:image/svg+xml;base64,PHN2Zz4='));
  const jpeg=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(30)]);
  assert.equal(decodeImage('data:image/jpeg;base64,'+jpeg.toString('base64')).contentType,'image/jpeg');
  assert.throws(()=>decodeImage('data:image/jpeg;base64,'+Buffer.alloc(2*1024*1024+1).toString('base64')));
});
test('anonymous and cross-origin mutations are blocked before database access',async()=>{
  let calls=0;const handler=makeAdminHandler(async()=>{calls++;});
  let res=response();await handler(req('products','POST',sample),res);assert.equal(res.code,401);
  res=response();const cross=req('login','POST',{password:'test-only-password-123'});cross.headers.origin='https://evil.example';await handler(cross,res);assert.equal(res.code,403);
  assert.equal(calls,0);
});
test('admin login, product CRUD, live catalog and server-priced enquiries work together',async()=>{
  const db=memoryDatabase(),handler=makeAdminHandler(async()=>db);
  let res=response();await handler(req('login','POST',{password:'test-only-password-123'}),res);assert.equal(res.code,200);
  const cookie=res.headers['Set-Cookie'].split(';')[0];
  res=response();await handler(req('products','POST',sample,cookie),res);assert.equal(res.code,201);const id=res.body.product.id;
  let catalog=await loadCatalog(db);assert.equal(catalog.source,'live');assert.equal(catalog.products.length,1);
  const edit=req('products','PATCH',{...sample,price:2499},cookie);edit.query.id=id;res=response();await handler(edit,res);assert.equal(res.code,200);
  let quote=response();const orders=makeHandler('orders',async()=>db);await orders({method:'POST',headers,body:{name:'Test',email:'test@example.com',consent:true,items:[{id,qty:2,price:1}]}},quote);assert.equal(quote.code,201);
  assert.equal((await db.collection('orders').findOne({reference:quote.body.reference})).illustrativeTotalCents,4998);
  const archive=req('products','DELETE',{},cookie);archive.query.id=id;res=response();await handler(archive,res);assert.equal(res.code,200);
  catalog=await loadCatalog(db);assert.equal(catalog.source,'live');assert.equal(catalog.products.length,0);
  quote=response();await orders({method:'POST',headers,body:{name:'Test',email:'test@example.com',consent:true,items:[{id,qty:1}]}},quote);assert.equal(quote.code,400);
});
test('drafts stay private and sample import never overwrites existing edits',async()=>{
  const db=memoryDatabase(),handler=makeAdminHandler(async()=>db),cookie='wfs_admin='+createSession();
  let res=response();await handler(req('products','POST',{...sample,active:false},cookie),res);assert.equal((await loadCatalog(db)).products.length,0);
  res=response();await handler(req('seed','POST',{},cookie),res);assert.equal(res.code,200);
  const edit=req('products','PATCH',{...sample,price:1999},cookie);edit.query.id='hand-soap';await handler(edit,response());
  await handler(req('seed','POST',{},cookie),response());assert.equal((await db.collection('products').findOne({id:'hand-soap'})).price,1999);
});
test('login throttling is shared through the database and configuration fails closed',async()=>{
  const db=memoryDatabase(),handler=makeAdminHandler(async()=>db);let res;
  for(let i=0;i<11;i++){res=response();await handler(req('login','POST',{password:'wrong'}),res);}assert.equal(res.code,429);
  const secret=process.env.ADMIN_SESSION_SECRET;delete process.env.ADMIN_SESSION_SECRET;
  res=response();await handler(req('products','POST',sample),res);assert.equal(res.code,503);process.env.ADMIN_SESSION_SECRET=secret;
});
