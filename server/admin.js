import { createHmac, randomUUID } from 'node:crypto';
import { Binary } from 'mongodb';
import { getDatabase } from './db.js';
import { authenticated, authConfigured, createSession, sessionCookie, sameOrigin, verifyPassword } from './auth.js';
import { validateProduct, decodeImage } from './product-validation.js';
import { publicProduct } from './catalog.js';
import { products as samples } from '../shared/catalog.js';

export function makeAdminHandler(database = getDatabase) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const action = req.query?.action || 'session';
    const mutation = req.method !== 'GET';
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    if (mutation && !sameOrigin(req)) return res.status(403).json({ error: 'Please use the admin panel on this website.' });
    if (mutation && !String(req.headers['content-type'] || '').includes('application/json')) return res.status(415).json({ error: 'JSON required' });
    if (mutation && Buffer.byteLength(JSON.stringify(req.body || {})) > 2900000) return res.status(413).json({ error: 'Upload is too large.' });
    if (!authConfigured()) return res.status(503).json({ error: 'Admin setup required: configure ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET on the server.' });
    try {
      if (action === 'login' && req.method === 'POST') {
        const db = await database();
        await db.collection('admin_login_attempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
        const bucket = Math.floor(Date.now() / 900000);
        const key = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(`${ip}:${bucket}`).digest('hex');
        // A shared MongoDB counter also works across Vercel function instances.
        const counter = await db.collection('admin_login_attempts').findOneAndUpdate({ _id: key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 900000) } }, { upsert: true, returnDocument: 'after' });
        if (counter.count > 10) return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
        if (!verifyPassword(req.body?.password, process.env.ADMIN_PASSWORD_HASH)) return res.status(401).json({ error: 'Incorrect password.' });
        // No raw IP address is stored in the login counter.
        res.setHeader('Set-Cookie', sessionCookie(createSession()));
        return res.status(200).json({ authenticated: true });
      }
      if (action === 'logout' && req.method === 'POST') {
        res.setHeader('Set-Cookie', sessionCookie('', true));
        return res.status(200).json({ authenticated: false });
      }
      if (!authenticated(req)) return res.status(401).json({ error: 'Please sign in.' });
      if (action === 'session' && req.method === 'GET') return res.status(200).json({ authenticated: true });
      const db = await database();
      if (action === 'products') {
        if (req.method === 'GET') {
          const list = await db.collection('products').find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).limit(500).toArray();
          const settings = await db.collection('catalog_settings').findOne({ _id: 'catalog' });
          return res.status(200).json({ products: list.map(publicProduct), source: settings?.live ? 'live' : 'demo' });
        }
        if (req.method === 'POST') {
          const count = await db.collection('products').countDocuments({ deleted: { $ne: true } });
          if (count >= 500) return res.status(400).json({ error: 'The catalog supports up to 500 products.' });
          const product = { ...validateProduct(req.body), id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), deleted: false };
          await db.collection('products').insertOne(product);
          await db.collection('catalog_settings').updateOne({ _id: 'catalog' }, { $set: { live: true } }, { upsert: true });
          return res.status(201).json({ product: publicProduct(product) });
        }
        const id = String(req.query?.id || '');
        if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return res.status(400).json({ error: 'Invalid product ID.' });
        if (req.method === 'PATCH') {
          const product = validateProduct(req.body);
          const result = await db.collection('products').updateOne({ id, deleted: { $ne: true } }, { $set: { ...product, updatedAt: new Date() } });
          return result.matchedCount ? res.status(200).json({ product: { ...product, id } }) : res.status(404).json({ error: 'Product not found.' });
        }
        if (req.method === 'DELETE') {
          const result = await db.collection('products').updateOne({ id, deleted: { $ne: true } }, { $set: { active: false, deleted: true, updatedAt: new Date() } });
          return result.matchedCount ? res.status(200).json({ archived: true }) : res.status(404).json({ error: 'Product not found.' });
        }
      }
      if (action === 'seed' && req.method === 'POST') {
        await db.collection('products').bulkWrite(samples.map(product => ({ updateOne: { filter: { id: product.id }, update: { $setOnInsert: { ...product, description: { de: '', en: '', fr: '' }, sample: true, active: true, deleted: false, createdAt: new Date(), updatedAt: new Date() } }, upsert: true } })));
        await db.collection('catalog_settings').updateOne({ _id: 'catalog' }, { $set: { live: true } }, { upsert: true });
        return res.status(200).json({ imported: true });
      }
      if (action === 'upload' && req.method === 'POST') {
        const { buffer, contentType } = decodeImage(req.body?.image);
        const id = randomUUID();
        await db.collection('product_images').insertOne({ _id: id, data: new Binary(buffer), contentType, createdAt: new Date() });
        return res.status(201).json({ imageUrl: `/api/media?id=${id}` });
      }
      if (action === 'requests' && req.method === 'GET') {
        const inquiries = await db.collection('inquiries').find({}, { projection: { _id: 0, consent: 0, consentVersion: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
        const orders = await db.collection('orders').find({}, { projection: { _id: 0, consent: 0, consentVersion: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
        return res.status(200).json({ inquiries, orders });
      }
      return res.status(405).json({ error: 'Action or method not supported.' });
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message });
      return res.status(503).json({ error: 'Database unavailable. Check the MongoDB connection and try again.' });
    }
  };
}
export default makeAdminHandler();
