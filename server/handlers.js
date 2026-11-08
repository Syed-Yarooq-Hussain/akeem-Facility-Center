import { randomUUID } from 'node:crypto';
import { getDatabase } from './db.js';
import { validateContact, validateItems } from './validation.js';
import { loadCatalog } from './catalog.js';

export function makeHandler(kind, database = getDatabase, catalogLoader = loadCatalog) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    if (!String(req.headers['content-type'] || '').includes('application/json')) return res.status(415).json({ error: 'JSON required' });
    try {
      // Vercel parses JSON automatically. Express enforces the same payload limit locally.
      if (Buffer.byteLength(JSON.stringify(req.body || {})) > 20000) return res.status(413).json({ error: 'Payload too large' });
      const data = validateContact(req.body, kind === 'orders');
      const db = await database();
      if (kind === 'orders') {
        const catalog = await catalogLoader(db);
        data.items = validateItems(req.body.items, catalog.products);
        data.illustrativeTotalCents = data.items.reduce((sum, item) => sum + item.illustrativeLineTotalCents, 0);
        data.currency = 'EUR'; data.type = 'non_binding_product_enquiry';
      }
      const reference = `WFS-${randomUUID().slice(0, 8).toUpperCase()}`;
      await db.collection(kind).insertOne({ ...data, reference, status: 'new', createdAt: new Date() });
      return res.status(201).json({ reference });
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message });
      // Never log submitted personal data or expose database credentials/errors.
      console.error(`[${kind}] Storage unavailable`);
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
  };
}
