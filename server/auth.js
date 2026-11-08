import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'wfs_admin';
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 256 || typeof stored !== 'string') return false;
  const [format, salt, hash] = stored.split(':');
  if (format !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
export function authConfigured() {
  return /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.ADMIN_PASSWORD_HASH || '') && (process.env.ADMIN_SESSION_SECRET || '').length >= 32;
}
function sign(data) { return createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(data).digest('base64url'); }
export function createSession(now = Date.now()) {
  if (!authConfigured()) throw new Error('Admin not configured');
  const payload = Buffer.from(JSON.stringify({ exp: now + 8 * 3600000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
export function authenticated(req, now = Date.now()) {
  if (!authConfigured()) return false;
  try {
    const token = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(SESSION_COOKIE + '='))?.slice(SESSION_COOKIE.length + 1);
    if (!token || token.length > 1024) return false;
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !signature) return false;
    const expected = Buffer.from(sign(payload)); const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isFinite(data.exp) && data.exp > now && data.exp <= now + 8 * 3600000;
  } catch { return false; }
}
export function sessionCookie(value, clear = false) {
  return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 28800}${process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function sameOrigin(req) {
  try {
    const origin = new URL(req.headers.origin);
    return ['http:', 'https:'].includes(origin.protocol) && origin.host === req.headers.host;
  } catch { return false; }
}
