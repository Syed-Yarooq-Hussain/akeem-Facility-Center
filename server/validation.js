import { products } from '../shared/catalog.js';

export class ValidationError extends Error { constructor(message) { super(message); this.status = 400; } }
function text(value, max, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new ValidationError('Invalid text field');
  const trimmed = value.trim();
  if (trimmed.length > max || (required && !trimmed)) throw new ValidationError('Invalid field length');
  return trimmed;
}
export function validateContact(body, order = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Invalid request');
  if (body.website) throw new ValidationError('Invalid request');
  if (body.consent !== true) throw new ValidationError('Consent required');
  const name = text(body.name, 120, true);
  const email = text(body.email, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Invalid email');
  const language = ['de', 'en', 'fr'].includes(body.language) ? body.language : 'de';
  const data = { name, email, company: text(body.company, 160), phone: text(body.phone, 40), message: text(body.message, 5000, !order), language, consent: true, consentVersion: '2026-11-05-draft' };
  if (!order) {
    if (!['0', '1', '2', '3', '4', 'shop', 'careers'].includes(body.service)) throw new ValidationError('Invalid service');
    data.service = body.service; data.location = text(body.location, 160);
  }
  return data;
}
export function validateItems(items, catalog = products) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new ValidationError('Invalid cart');
  const seen = new Set();
  return items.map(item => {
    if (!item || typeof item !== 'object') throw new ValidationError('Invalid item');
    const product = catalog.find(p => p.id === item.id && p.active !== false);
    if (!product || seen.has(item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) throw new ValidationError('Invalid cart item');
    seen.add(item.id);
    return { productId: product.id, name: product.name, quantity: item.qty, illustrativeUnitPriceCents: product.price, illustrativeLineTotalCents: product.price * item.qty };
  });
}
