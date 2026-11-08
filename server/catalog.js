import { products as samples } from '../shared/catalog.js';
import { getDatabase } from './db.js';

export function publicProduct(p) {
  return Object.fromEntries(['id', 'category', 'price', 'type', 'color', 'name', 'unit', 'description', 'imageUrl', 'active', 'sample'].filter(key => p[key] !== undefined).map(key => [key, p[key]]));
}
export async function loadCatalog(db) {
  if (!db) {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('USERNAME:PASSWORD')) return { source: 'demo', products: samples.map(p => ({ ...p, sample: true })) };
    db = await getDatabase();
  }
  const settings = await db.collection('catalog_settings').findOne({ _id: 'catalog' });
  if (!settings?.live) return { source: 'demo', products: samples.map(p => ({ ...p, sample: true })) };
  const products = await db.collection('products').find({ active: true, deleted: { $ne: true } }).sort({ createdAt: -1 }).limit(500).toArray();
  return { source: 'live', products: products.map(publicProduct) };
}
export function makeCatalogHandler(database) { return async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try { return res.status(200).json(await loadCatalog(database ? await database() : undefined)); }
  catch { return res.status(503).json({ error: 'Catalog temporarily unavailable' }); }
}; }
export default makeCatalogHandler();
