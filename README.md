# Williams Facility Services GmbH

A photographic, multilingual React website with a MongoDB-backed hygiene catalog, quotation cart and secure product manager. Prepared for Vercel, including Node serverless APIs.

## Start locally

```powershell
npm install
# Only if .env does not already exist:
Copy-Item .env.example .env
npm run dev
```

Website: http://localhost:5173 · Admin: http://localhost:5173/admin · Local API: http://127.0.0.1:3001

The site and admin support German, English and French. Node 22 is recommended. If Windows blocks writes inside Documents, use the working Git copy at `C:\Users\HP\AppData\Local\WilliamsFacility`. Preserve your existing `.env` when updating.

## Enable MongoDB and administration

1. Create a MongoDB Atlas database and database user, with network access appropriate to the deployment.
2. Add these server-only variables to `.env` locally and Vercel **Settings → Environment Variables**:

```dotenv
MONGODB_URI=your_actual_atlas_connection_string
MONGODB_DB=williams_facility
```

3. Run:

```powershell
npm run admin:setup
```

Choose a private password of at least 12 characters. The command prints a salted password hash and random session secret. Save your password privately and add the printed values to your server environment:

```dotenv
ADMIN_PASSWORD_HASH=the_generated_scrypt_hash
ADMIN_SESSION_SECRET=the_generated_session_secret
```

4. Restart locally, or redeploy Vercel after setting the variables. Open `/admin`, `/en/admin`, `/de/admin` or `/fr/admin`.

There is no default admin password or public registration. Admin features fail closed until credentials and MongoDB are configured. Never prefix secrets with `VITE_`, commit `.env`, or put passwords in repository files.

## Product manager

- Add/edit names, pack sizes, descriptions, categories and euro prices.
- German text is required; empty English/French translations fall back to German.
- Upload JPEG, PNG or WebP photos up to 2 MB. Photos are stored in MongoDB and served by `/api/media`; no extra storage account is required. HTTPS image URLs are also supported.
- Publish/unpublish products; drafts are hidden from the public shop.
- Archive products while preserving historical data.
- Optionally import sample products. Re-importing never overwrites edits.
- View the latest 100 service enquiries and 100 product enquiries in the protected inbox.

Changes are read from MongoDB without rebuilding or redeploying. Open storefront tabs can refresh to see changes. Before a live catalog is created, the original eight sample products remain labeled examples. Adding the first product (including a draft) or importing samples activates the database catalog. An empty live catalog stays empty; it does not silently restore samples. Catalog limit: 500 non-archived products.

Collections: `products`, `product_images`, `catalog_settings`, `inquiries`, `orders`, `admin_login_attempts`. Sessions use expiring HMAC-signed HTTP-only cookies, Secure in production and SameSite=Strict. Admin mutations require the same origin. Login attempts are throttled using MongoDB. Uploads are checked for type, magic bytes and size. Rotating `ADMIN_SESSION_SECRET` invalidates existing sessions.

## Shop and enquiries

Search, categories, previews, persistent cart and quantity controls are included. Product enquiries use current server-side prices; client-submitted prices are ignored. Hidden/archived products cannot be quoted. Success is returned only after the database write completes.

The shop collects **non-binding quotation requests**. It does not accept payment or create binding purchases. Product availability, delivery and final terms need client confirmation before direct paid checkout is enabled. Email notifications are not included; use the admin inbox to view enquiries.

## Public configuration

```dotenv
VITE_WHATSAPP_NUMBER=491234567890
VITE_SITE_URL=https://your-actual-domain.example
```

The WhatsApp number above is a demo. Replace it with the real country-code-prefixed number, digits only. Leave `VITE_SITE_URL` unset for the first Vercel preview so canonical links use the actual deployment origin. Public `VITE_` values are embedded during builds; redeploy after changing them.

## Deployment

Repository: https://github.com/Md220693/Williams-Facility-Services, branch `main`. Import into Vercel as Vite; build `npm run build`, output `dist`, root `./`. The tracked `vercel.json` handles page/API routes. Backend endpoints deploy with the same project; no separate Express host is needed.

Configure private environment variables, redeploy, then verify `/admin`, create a real product and submit an enquiry. A paid custom domain is optional; the generated `.vercel.app` URL works for preview. Legal documents remain drafts until completed and reviewed.

## Verification

```powershell
npm test
npm run build
```

Tests cover password verification, session tampering/expiry, authentication, origin checks, throttling, product/photo validation, publication state, CRUD, server pricing and enquiry persistence/failure responses. `tests/memory-db.js` is test-only; production uses MongoDB.

Optional browser checks with Chrome installed:

```powershell
npm install --no-save --package-lock=false playwright
node tests/serve-test.mjs
# Second terminal:
node scripts/admin-browser-check.mjs
```

The explicit test server uses port 5180 and an isolated in-memory adapter. Normal dev/build/deployment commands never start it. Its password is only for that test process. Browser checks cover multilingual desktop/mobile pages, uploads, product create/edit/draft/publish/archive, store prices, saved quotation requests, inbox and logout. Screenshots go to ignored `test-results/`.

No real Atlas connection was available during implementation. The client's production connection still needs verification; test-adapter checks do not prove a working Atlas connection.

## Client content

Supply the actual address, directors, company registration, VAT ID, business email, phone and WhatsApp. Complete legal notice, privacy, terms and applicable delivery/withdrawal documents for actual business processes. Legal pages are drafts. No testimonials, customer logos, certifications or company statistics were invented or copied from the reference.

The redesign follows the reference's editorial scale, open spacing and teal direction while preserving the cleaning/laundry/hygiene scope. Locally bundled stock photos illustrate services and do not claim to depict Williams staff or premises. See `public/images/CREDITS.md`. Locally bundled DM Sans and Manrope licenses are in `licenses/`.
