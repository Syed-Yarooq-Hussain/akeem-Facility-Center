import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, validateItems } from '../server/validation.js';
import { makeHandler } from '../server/handlers.js';

const contact = { name: 'Test User', email: 'test@example.com', service: '3', message: 'Weekly hotel laundry collection', consent: true, language: 'en' };
function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } }; }
const request = (body, method = 'POST') => ({ method, headers: { 'content-type': 'application/json' }, body });
test('contact input rejects absent consent, malformed fields and honeypot', () => {
  for (const data of [{...contact, consent: false}, {...contact, email: 'invalid'}, {...contact, name: {$gt:''}}, {...contact, service: 'bogus'}, {...contact, website: 'spam'}, {...contact, message: 'a'.repeat(5001)}]) assert.throws(() => validateContact(data));
  assert.equal(validateContact({...contact, email: ' TEST@EXAMPLE.COM '}).email, 'test@example.com');
});
test('cart computes prices from the catalog and rejects duplicate or invalid quantities', () => {
  const result = validateItems([{ id: 'hand-soap', qty: 2, price: 1 }]);
  assert.equal(result[0].illustrativeLineTotalCents, 2580);
  for (const items of [[], [{id:'fake',qty:1}], [{id:'hand-soap',qty:-1}], [{id:'hand-soap',qty:1.2}], [{id:'hand-soap',qty:100}], [{id:'hand-soap',qty:1},{id:'hand-soap',qty:1}]]) assert.throws(() => validateItems(items));
});
test('successful inquiry persists before returning a reference', async () => {
  let record;
  const handler = makeHandler('inquiries', async () => ({ collection: name => { assert.equal(name, 'inquiries'); return { insertOne: async data => { record = data; } }; } }));
  const res = response(); await handler(request(contact), res);
  assert.equal(res.code, 201); assert.match(res.body.reference, /^WFS-/); assert.equal(record.reference, res.body.reference); assert.equal(record.email, contact.email);
});
test('storage failure never returns a false success', async () => {
  const handler = makeHandler('inquiries', async () => { throw new Error('secret database URI'); });
  const res = response(); await handler(request(contact), res);
  assert.equal(res.code, 503); assert.equal(res.body.reference, undefined); assert.equal(JSON.stringify(res.body).includes('secret'), false);
});
test('product enquiries save trusted totals and do not create purchase orders', async () => {
  let record; const handler = makeHandler('orders', async () => ({ collection: () => ({ insertOne: async data => { record = data; } }) }));
  const res = response(); await handler(request({...contact, items:[{id:'hand-soap',qty:3}], total:1}),res);
  assert.equal(res.code, 201); assert.equal(record.illustrativeTotalCents,3870); assert.equal(record.type,'non_binding_product_enquiry');
});
test('method, JSON and validation failures are rejected before storage', async () => {
  let calls = 0; const handler = makeHandler('inquiries', async () => { calls++; });
  const get = response(); await handler(request({},'GET'),get); assert.equal(get.code,405);
  const invalid = response(); await handler(request({...contact,consent:false}),invalid); assert.equal(invalid.code,400);
  const nonJson = response(); await handler({...request(contact),headers:{}},nonJson); assert.equal(nonJson.code,415);
  const oversized = response(); await handler(request({...contact, extra:'x'.repeat(21000)}),oversized); assert.equal(oversized.code,413);
  assert.equal(calls,0);
});
