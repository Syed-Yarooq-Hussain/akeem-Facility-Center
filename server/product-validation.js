import { languages } from '../shared/languages.js';
import { ValidationError } from './validation.js';

const field = (value, max, required = false) => {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new ValidationError('Please complete the required product fields.');
  return value.trim();
};
export function validateProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Invalid product');
  if (!Number.isSafeInteger(body.price) || body.price < 1 || body.price > 10000000) throw new ValidationError('Price must be between €0.01 and €100,000.');
  if (![1, 2, 3].includes(body.category)) throw new ValidationError('Invalid category');
  if (typeof body.active !== 'boolean') throw new ValidationError('Invalid publication status');
  const name = { de: field(body.name?.de, 160, true) };
  const unit = { de: field(body.unit?.de, 160, true) };
  const description = { de: field(body.description?.de, 2000) };
  for (const l of languages.filter(l=>l!=='de')) {
    name[l] = field(body.name?.[l], 160) || name.de;
    unit[l] = field(body.unit?.[l], 160) || unit.de;
    description[l] = field(body.description?.[l], 2000) || description.de;
  }
  const imageUrl = field(body.imageUrl, 2048);
  if (imageUrl) {
    const media = /^\/api\/media\?id=[a-f0-9-]{36}$/.test(imageUrl);
    let remote = false;
    try { const u = new URL(imageUrl); remote = u.protocol === 'https:' && !u.username && !u.password; } catch {}
    if (!media && !remote) throw new ValidationError('Use an uploaded photo or a valid HTTPS image URL.');
  }
  return { name, unit, description, imageUrl, price: body.price, category: body.category, active: body.active, sample: body.sample === true, type: ['paper', 'rolls', 'bottle', 'spray', 'cloth', 'bags', 'dispenser'].includes(body.type) ? body.type : 'bottle', color: /^#[a-f0-9]{6}$/i.test(body.color || '') ? body.color : '#b9d2c4' };
}
export function decodeImage(value) {
  if (typeof value !== 'string') throw new ValidationError('Please choose a photo.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new ValidationError('Only JPEG, PNG and WebP photos are supported.');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length < 16 || buffer.length > 2 * 1024 * 1024) throw new ValidationError('Photo must be smaller than 2 MB.');
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!({ jpeg, png, webp })[match[1]]) throw new ValidationError('The photo file does not match its image format.');
  return { buffer, contentType: `image/${match[1]}` };
}
