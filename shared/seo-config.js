export const productionOrigin = 'https://www.williamsfacility.com';
export const indexablePages = ['', 'about', 'cleaning', 'laundry', 'facility', 'shop', 'careers', 'contact'];
export const privatePages = ['admin', 'checkout'];
// Legal documents are explicitly marked as drafts until the remaining company details are supplied.
export const draftPages = ['impressum', 'privacy', 'terms', 'withdrawal'];
export const allPages = [...indexablePages, ...privatePages, ...draftPages];
export function siteOrigin(value) {
  if (!value) return productionOrigin;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hostname.endsWith('.example')) {
    throw new Error('VITE_SITE_URL must be the real public HTTPS domain.');
  }
  return url.origin;
}
