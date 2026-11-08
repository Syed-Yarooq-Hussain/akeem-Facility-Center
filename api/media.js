import { getDatabase } from '../server/db.js';
export function makeMediaHandler(database = getDatabase) { return async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = String(req.query?.id || '');
  if (!/^[a-f0-9-]{36}$/.test(id)) return res.status(404).end();
  try {
    const db = await database();
    const image = await db.collection('product_images').findOne({ _id: id });
    if (!image) return res.status(404).end();
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(Buffer.from(image.data.buffer));
  } catch { return res.status(503).end(); }
}; }
export default makeMediaHandler();
